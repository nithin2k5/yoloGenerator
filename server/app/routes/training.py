from fastapi import APIRouter, File, UploadFile, HTTPException, BackgroundTasks, Form
from typing import Optional
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, validator
from typing import Optional, Dict, Any
import os
import yaml
from pathlib import Path
import tempfile
import uuid
import logging
import sys

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
    model_name: str = Field(default="yolov8n.pt", description="Base model name (yolov8, yolov9, yolov10, yolo11)")
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
    classes: Optional[List[str]] = None  # Optional list of class names to filter

@router.post("/start")
async def start_training(
    background_tasks: BackgroundTasks,
    dataset_yaml: UploadFile = File(...),
    epochs: int = Form(100),
    batch_size: int = Form(16),
    img_size: int = Form(640),
    model_name: str = Form("yolov8n.pt"),
    learning_rate: Optional[float] = Form(None),
    patience: Optional[int] = Form(50),
    device: Optional[str] = Form(None),
    strict_epochs: bool = Form(False)
):
    """
    Start model training job
    """
    try:
        # Create TrainingConfig from form data
        config = TrainingConfig(
            epochs=epochs,
            batch_size=batch_size,
            img_size=img_size,
            model_name=model_name,
            learning_rate=learning_rate,
            patience=patience,
            device=device,
            strict_epochs=strict_epochs
        )
        
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
            "data_yaml": data_yaml,
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
            # In strict mode, disable early stopping - ensure all epochs run
            train_params["patience"] = config.epochs + 1
            train_params["save_period"] = 10  # Save checkpoints every 10 epochs
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
    Start training from an exported dataset. Auto-exports if not already exported.
    """
    try:
        # Check if dataset exists
        dataset_path = Path(f"datasets/{request.dataset_id}")
        yaml_path = dataset_path / "data.yaml"
        
        # If dataset not exported, export it first
        if not yaml_path.exists():
            logger.info(f"Dataset {request.dataset_id} not exported. Auto-exporting...")
            
            # Import export logic
            import sys
            from pathlib import Path as PathLib
            backend_path = PathLib(__file__).parent.parent.parent
            if str(backend_path) not in sys.path:
                sys.path.insert(0, str(backend_path))

            from database_service import DatasetService
            import shutil
            import random
            
            # Get dataset
            dataset = DatasetService.get_dataset(request.dataset_id)
            if not dataset:
                raise HTTPException(status_code=404, detail="Dataset not found")
            
            # Get annotated images
            all_images = DatasetService.get_dataset_images(request.dataset_id)
            annotated_images = [img for img in all_images if img.get("annotated", False)]
            
            if not annotated_images:
                raise HTTPException(status_code=400, detail="No annotated images in dataset")
            
            # Check for manual splits
            images_with_split = [img for img in annotated_images if img.get("split")]
            
            if images_with_split:
                train_images = [img for img in annotated_images if img.get("split") == "train"]
                val_images = [img for img in annotated_images if img.get("split") == "val"]
                test_images = [img for img in annotated_images if img.get("split") == "test"]
                train_images.extend([img for img in annotated_images if not img.get("split")])
            else:
                random.shuffle(annotated_images)
                split_idx = int(len(annotated_images) * 0.8)
                train_images = annotated_images[:split_idx]
                val_images = annotated_images[split_idx:]
                test_images = []
            
            # Create split directories
            train_dir = dataset_path / "split" / "train"
            val_dir = dataset_path / "split" / "val"
            test_dir = dataset_path / "split" / "test"
            
            for split_dir, images, _ in [(train_dir, train_images, "train"), (val_dir, val_images, "val"), (test_dir, test_images, "test")]:
                if images:
                    (split_dir / "images").mkdir(parents=True, exist_ok=True)
                    (split_dir / "labels").mkdir(parents=True, exist_ok=True)
                    
                    for img in images:
                        src_img = dataset_path / "images" / img["filename"]
                        dst_img = split_dir / "images" / img["filename"]
                        if src_img.exists():
                            shutil.copy2(src_img, dst_img)
                        
                        label_name = f"{Path(img['filename']).stem}.txt"
                        src_label = dataset_path / "labels" / label_name
                        dst_label = split_dir / "labels" / label_name
                        if src_label.exists():
                            shutil.copy2(src_label, dst_label)
            
            # Create data.yaml
            split_path = (dataset_path / 'split').resolve()
            yaml_content = f"""# YOLO Dataset Configuration
# Generated from dataset: {dataset['name']}

path: {split_path}
train: train/images
val: val/images
"""
            if test_images:
                yaml_content += "test: test/images\n"
            
            yaml_content += "\n# Classes\nnames:\n"
            for idx, class_name in enumerate(dataset["classes"]):
                yaml_content += f"  {idx}: {class_name}\n"
            yaml_content += f"\nnc: {len(dataset['classes'])}\n"
            
            with open(yaml_path, 'w') as f:
                f.write(yaml_content)
            
            logger.info(f"Dataset {request.dataset_id} exported successfully")
        
        # Verify yaml exists now
        if not yaml_path.exists():
            raise HTTPException(
                status_code=500,
                detail="Failed to export dataset. YAML file not found."
            )
        
        # Generate job ID
        job_id = str(uuid.uuid4())
        
        # Default config in job init
        training_jobs[job_id] = {
            "status": "pending",
            "config": request.config.dict(),
            "progress": 0,
            "dataset_id": request.dataset_id
        }
        
        # Handle Class Filtering
        final_yaml_path = str(yaml_path)
        
        if request.classes:
            # Get original dataset to check all classes
            import sys
            from pathlib import Path as PathLib
            # Ensure backend path is in sys.path
            backend_path = PathLib(__file__).parent.parent.parent
            if str(backend_path) not in sys.path:
                sys.path.insert(0, str(backend_path))
            
            from database_service import DatasetService
            from utils.dataset_utils import create_filtered_dataset
            
            dataset_info = DatasetService.get_dataset(request.dataset_id)
            if dataset_info:
                all_classes = dataset_info.get("classes", [])
                
                # Check if we actually need to filter (unordered set comparison)
                if set(request.classes) != set(all_classes):
                    logger.info(f"Filtering dataset for classes: {request.classes}")
                    
                    # Create temporary directory for filtered dataset
                    temp_dir = Path(tempfile.gettempdir()) / "yolo_training" / job_id / "filtered"
                    
                    try:
                        filtered_yaml = create_filtered_dataset(
                            original_yaml_path=str(yaml_path),
                            target_dir=str(temp_dir),
                            selected_classes=request.classes
                        )
                        final_yaml_path = filtered_yaml
                        logger.info(f"Created filtered dataset at: {final_yaml_path}")
                        
                        # Update job info to reflect filtering
                        training_jobs[job_id]["filtered_classes"] = request.classes
                        
                    except Exception as e:
                        logger.error(f"Failed to create filtered dataset: {e}")
                        # If filtering fails, we might want to abort or fall back. 
                        # Aborting is safer to avoid training on wrong data.
                        raise HTTPException(status_code=500, detail=f"Failed to prepare filtered dataset: {str(e)}")

        
        # Add training to background tasks
        background_tasks.add_task(
            run_training,
            job_id,
            final_yaml_path,
            request.config
        )
        
        return JSONResponse(content={
            "success": True,
            "job_id": job_id,
            "message": "Training job started from dataset"
        })
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error starting training from dataset: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/export-and-train")
async def export_and_train(
    background_tasks: BackgroundTasks,
    request: DatasetTrainingRequest
):
    """
    Export dataset and start training in one operation (strict training mode)
    """
    try:
        # First, export the dataset
        dataset_path = Path(f"datasets/{request.dataset_id}")
        yaml_path = dataset_path / "data.yaml"
        
        # Check if already exported, if not export it
        if not yaml_path.exists():
            # Import database service for export logic
            import sys
            from pathlib import Path as PathLib
            backend_path = PathLib(__file__).parent.parent.parent
            if str(backend_path) not in sys.path:
                sys.path.insert(0, str(backend_path))
            
            from database_service import DatasetService
            import shutil
            import random
            
            # Get dataset
            dataset = DatasetService.get_dataset(request.dataset_id)
            if not dataset:
                raise HTTPException(status_code=404, detail="Dataset not found")
            
            # Get annotated images
            all_images = DatasetService.get_dataset_images(request.dataset_id)
            annotated_images = [img for img in all_images if img.get("annotated", False)]
            
            if not annotated_images:
                raise HTTPException(status_code=400, detail="No annotated images in dataset")
            
            # Check for manual splits
            images_with_split = [img for img in annotated_images if img.get("split")]
            
            if images_with_split:
                train_images = [img for img in annotated_images if img.get("split") == "train"]
                val_images = [img for img in annotated_images if img.get("split") == "val"]
                test_images = [img for img in annotated_images if img.get("split") == "test"]
                train_images.extend([img for img in annotated_images if not img.get("split")])
            else:
                random.shuffle(annotated_images)
                split_idx = int(len(annotated_images) * 0.8)
                train_images = annotated_images[:split_idx]
                val_images = annotated_images[split_idx:]
                test_images = []
            
            # Create split directories
            train_dir = dataset_path / "split" / "train"
            val_dir = dataset_path / "split" / "val"
            test_dir = dataset_path / "split" / "test"
            
            for split_dir, images, _ in [(train_dir, train_images, "train"), (val_dir, val_images, "val"), (test_dir, test_images, "test")]:
                if images:
                    (split_dir / "images").mkdir(parents=True, exist_ok=True)
                    (split_dir / "labels").mkdir(parents=True, exist_ok=True)
                    
                    for img in images:
                        src_img = dataset_path / "images" / img["filename"]
                        dst_img = split_dir / "images" / img["filename"]
                        if src_img.exists():
                            shutil.copy2(src_img, dst_img)
                        
                        label_name = f"{Path(img['filename']).stem}.txt"
                        src_label = dataset_path / "labels" / label_name
                        dst_label = split_dir / "labels" / label_name
                        if src_label.exists():
                            shutil.copy2(src_label, dst_label)
            
            # Create data.yaml
            split_path = (dataset_path / 'split').resolve()
            yaml_content = f"""# YOLO Dataset Configuration
# Generated from dataset: {dataset['name']}

path: {split_path}
train: train/images
val: val/images
"""
            if test_images:
                yaml_content += "test: test/images\n"
            
            yaml_content += "\n# Classes\nnames:\n"
            for idx, class_name in enumerate(dataset["classes"]):
                yaml_content += f"  {idx}: {class_name}\n"
            yaml_content += f"\nnc: {len(dataset['classes'])}\n"
            
            with open(yaml_path, 'w') as f:
                f.write(yaml_content)
            
            logger.info(f"Dataset {request.dataset_id} exported successfully for training")
        
        # Verify yaml exists now
        if not yaml_path.exists():
            raise HTTPException(
                status_code=404,
                detail="Dataset export failed. YAML file not found."
            )
        
        # Force strict training mode
        request.config.strict_epochs = True
        
        # Generate job ID
        job_id = str(uuid.uuid4())
        
        # Initialize training job
        training_jobs[job_id] = {
            "status": "pending",
            "config": request.config.dict(),
            "progress": 0,
            "dataset_id": request.dataset_id,
            "strict_mode": True
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
            "message": "Dataset exported and strict training started",
            "strict_epochs": True,
            "epochs": request.config.epochs
        })
        
    except Exception as e:
        logger.error(f"Export and train error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

