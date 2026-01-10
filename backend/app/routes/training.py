from fastapi import APIRouter, File, UploadFile, HTTPException, BackgroundTasks, Form
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional, Dict, Any
import os
import yaml
from pathlib import Path
import tempfile
import uuid

router = APIRouter()

# Store training jobs
training_jobs: Dict[str, Dict[str, Any]] = {}

class TrainingConfig(BaseModel):
    epochs: int = 100
    batch_size: int = 16
    img_size: int = 640
    model_name: str = "yolov8n.pt"
    learning_rate: Optional[float] = None
    patience: Optional[int] = 50

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
    Background task to run training
    """
    try:
        training_jobs[job_id]["status"] = "running"
        
        trainer = YOLOTrainer(config.model_name)
        
        # Training parameters
        train_params = {
            "data_yaml": data_yaml,
            "epochs": config.epochs,
            "imgsz": config.img_size,
            "batch": config.batch_size,
            "name": job_id,
        }
        
        if config.learning_rate:
            train_params["lr0"] = config.learning_rate
        if config.patience:
            train_params["patience"] = config.patience
        
        # Run training
        results = trainer.train(**train_params)
        
        training_jobs[job_id].update({
            "status": "completed",
            "progress": 100,
            "results": results
        })
        
    except Exception as e:
        training_jobs[job_id].update({
            "status": "failed",
            "error": str(e)
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

