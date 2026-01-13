from fastapi import APIRouter, File, UploadFile, HTTPException, BackgroundTasks, Form
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, validator
from typing import Optional, Dict, Any
import os
import yaml
from pathlib import Path
import tempfile
import uuid
import logging

# Import trainer
from models.trainer import YOLOTrainer

router = APIRouter()
logger = logging.getLogger(__name__)

# Store training jobs
training_jobs: Dict[str, Dict[str, Any]] = {}

class TrainingConfig(BaseModel):
    epochs: int = Field(default=100, ge=1, le=1000, description="Number of training epochs (1-1000)")
    batch_size: int = Field(default=16, ge=1, le=128, description="Batch size (1-128)")
    img_size: int = Field(default=640, ge=320, le=1280, description="Image size (320-1280)")
    model_name: str = Field(default="yolov8n.pt", description="Base model name")
    learning_rate: Optional[float] = Field(default=None, ge=0.0001, le=1.0, description="Learning rate")
    patience: Optional[int] = Field(default=50, ge=1, le=200, description="Early stopping patience")
    device: Optional[str] = Field(default=None, description="Device (cpu, cuda, mps, or None for auto)")
    strict_epochs: bool = Field(default=False, description="If True, enforce exact epoch count (disable early stopping)")
    
    @validator('epochs')
    def validate_epochs(cls, v):
        if v < 1:
            raise ValueError("Epochs must be at least 1")
        if v > 1000:
            raise ValueError("Epochs cannot exceed 1000")
        return v
    
    @validator('batch_size')
    def validate_batch_size(cls, v):
        if v < 1:
            raise ValueError("Batch size must be at least 1")
        if v > 128:
            raise ValueError("Batch size cannot exceed 128")
        return v

class DatasetTrainingRequest(BaseModel):
    dataset_id: str
    config: TrainingConfig

@router.post("/start")
async def start_training(
    background_tasks: BackgroundTasks,
    config: TrainingConfig,
    dataset_yaml: UploadFile = File(...)
):
    """
    Start model training job
    """
    try:
        # Generate job ID
        job_id = str(uuid.uuid4())
        
        # Save dataset config
        temp_dir = Path(tempfile.gettempdir()) / "yolo_training" / job_id
        temp_dir.mkdir(parents=True, exist_ok=True)
        
        yaml_path = temp_dir / "data.yaml"
        with open(yaml_path, 'wb') as f:
            content = await dataset_yaml.read()
            f.write(content)
        
        # Initialize training job
        training_jobs[job_id] = {
            "status": "pending",
            "config": config.dict(),
            "progress": 0
        }
        
        # Add training to background tasks
        background_tasks.add_task(
            run_training,
            job_id,
            str(yaml_path),
            config
        )
        
        return JSONResponse(content={
            "success": True,
            "job_id": job_id,
            "message": "Training job started"
        })
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

async def run_training(job_id: str, data_yaml: str, config: TrainingConfig):
    """
    Background task to run training with strict validation
    """
    try:
        training_jobs[job_id]["status"] = "running"
        training_jobs[job_id]["progress"] = 0
        training_jobs[job_id]["current_epoch"] = 0
        
        logger.info(f"Starting training job {job_id} with {config.epochs} epochs")
        
        # Validate dataset YAML exists
        if not Path(data_yaml).exists():
            raise FileNotFoundError(f"Dataset YAML not found: {data_yaml}")
        
        # Initialize trainer
        trainer = YOLOTrainer(config.model_name)
        
        # Training parameters with strict configuration
        train_params = {
            "data": data_yaml,
            "epochs": config.epochs,
            "imgsz": config.img_size,
            "batch": config.batch_size,
            "name": f"job_{job_id}",
            "project": "runs/detect",
            "exist_ok": True,
            "strict_epochs": config.strict_epochs,  # Pass strict mode to trainer
        }
        
        # Add optional parameters
        if config.learning_rate:
            train_params["lr0"] = config.learning_rate
        if config.patience and not config.strict_epochs:
            # Only use patience if not in strict mode
            train_params["patience"] = config.patience
        elif config.strict_epochs:
            # In strict mode, disable early stopping
            train_params["patience"] = config.epochs + 1
        if config.device:
            train_params["device"] = config.device
        
        # Run training
        logger.info(f"Training parameters: {train_params}")
        results = trainer.train(**train_params)
        
        # Update job status
        training_jobs[job_id].update({
            "status": "completed",
            "progress": 100,
            "current_epoch": config.epochs,
            "results": results,
            "model_path": results.get("model_path", ""),
            "metrics": results.get("metrics", {})
        })
        
        logger.info(f"Training job {job_id} completed successfully")
        
    except Exception as e:
        logger.error(f"Training job {job_id} failed: {str(e)}", exc_info=True)
        training_jobs[job_id].update({
            "status": "failed",
            "error": str(e),
            "progress": training_jobs[job_id].get("progress", 0)
        })

@router.get("/status/{job_id}")
async def get_training_status(job_id: str):
    """
    Get training job status
    """
    if job_id not in training_jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    
    return training_jobs[job_id]

@router.get("/jobs")
async def list_training_jobs():
    """
    List all training jobs
    """
    return {
        "jobs": [
            {"job_id": job_id, **job_data}
            for job_id, job_data in training_jobs.items()
        ]
    }

@router.delete("/job/{job_id}")
async def delete_training_job(job_id: str):
    """
    Delete a training job
    """
    if job_id in training_jobs:
        del training_jobs[job_id]
        return {"success": True, "message": "Job deleted"}
    
    raise HTTPException(status_code=404, detail="Job not found")

@router.post("/start-from-dataset")
async def start_training_from_dataset(
    background_tasks: BackgroundTasks,
    request: DatasetTrainingRequest
):
    """
    Start training from an exported dataset
    """
    try:
        # Check if dataset exists
        dataset_path = Path(f"datasets/{request.dataset_id}")
        yaml_path = dataset_path / "data.yaml"
        
        if not yaml_path.exists():
            raise HTTPException(
                status_code=404, 
                detail="Dataset not found or not exported. Export dataset first."
            )
        
        # Generate job ID
        job_id = str(uuid.uuid4())
        
        # Initialize training job
        training_jobs[job_id] = {
            "status": "pending",
            "config": request.config.dict(),
            "progress": 0,
            "dataset_id": request.dataset_id
        }
        
        # Add training to background tasks
        background_tasks.add_task(
            run_training,
            job_id,
            str(yaml_path),
            request.config
        )
        
        return JSONResponse(content={
            "success": True,
            "job_id": job_id,
            "message": "Training job started from dataset"
        })
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

