"""
Example Usage of Training Modules

This file demonstrates how to use the dataset builder, trainer, and progress tracker.
"""

from pathlib import Path
from training.dataset_builder import DatasetBuilder, ImageAnnotation, BoundingBox
from training.yolo_trainer import YOLOTrainer, TrainingConfig
from training.progress_tracker import ProgressTracker


# Example 1: Build dataset from annotations
def example_build_dataset():
    """Example of building a YOLO dataset."""
    # Define class names
    class_names = ["person", "car", "bike", "truck"]
    
    # Initialize builder
    builder = DatasetBuilder(
        output_dir="datasets/my_dataset",
        class_names=class_names,
        train_ratio=0.8,
        random_seed=42
    )
    
    # Create sample annotations
    annotations = [
        ImageAnnotation(
            image_path="path/to/image1.jpg",
            image_id="img1",
            bounding_boxes=[
                BoundingBox.from_normalized(0, 0.5, 0.5, 0.2, 0.3),  # person
                BoundingBox.from_normalized(1, 0.3, 0.3, 0.1, 0.15)   # car
            ]
        ),
        ImageAnnotation(
            image_path="path/to/image2.jpg",
            image_id="img2",
            bounding_boxes=[
                BoundingBox.from_normalized(2, 0.7, 0.7, 0.15, 0.2)   # bike
            ]
        )
    ]
    
    # Build dataset
    stats = builder.build_from_annotations(annotations, copy_images=True)
    print(f"Dataset built: {stats}")
    
    # Validate dataset
    validation = builder.validate_dataset()
    print(f"Validation: {validation}")


# Example 2: Start training
def example_start_training():
    """Example of starting a training job."""
    # Initialize trainer
    trainer = YOLOTrainer(
        jobs_dir="training/jobs",
        logs_dir="training/logs"
    )
    
    # Create training config
    config = TrainingConfig(
        epochs=100,
        batch_size=16,
        img_size=640,
        model_name="yolov8n.pt",
        dataset_yaml="datasets/my_dataset/data.yaml",
        device=None  # Auto-detect
    )
    
    # Start training
    job_id = "train_001"
    job = trainer.start_training(job_id, config)
    print(f"Training started: {job.job_id}, Status: {job.status}")
    
    # Get job info
    job_info = trainer.get_job(job_id)
    print(f"Job info: {job_info}")
    
    # Stop training (if needed)
    # trainer.stop_training(job_id)
    
    # Export model (after training completes)
    # export_path = trainer.export_model(job_id, format="onnx")
    # print(f"Model exported to: {export_path}")


# Example 3: Track progress
def example_track_progress():
    """Example of tracking training progress."""
    # Initialize tracker
    tracker = ProgressTracker(log_dir="training/logs")
    
    # Start tracking a job
    job_id = "train_001"
    log_file = f"training/logs/{job_id}.log"
    tracker.start_tracking(job_id, log_file)
    
    # Get progress
    progress = tracker.get_progress(job_id)
    print(f"Progress: {progress}")
    
    # Update and get latest
    updated = tracker.update_progress(job_id)
    if updated:
        print(f"Updated progress: {updated}")


# Example 4: FastAPI integration
def example_fastapi_integration():
    """Example of integrating with FastAPI."""
    from fastapi import FastAPI
    from training.websocket_routes import initialize_progress_tracking, get_router
    
    # Create FastAPI app
    app = FastAPI()
    
    # Initialize progress tracking
    initialize_progress_tracking(log_dir="training/logs")
    
    # Add WebSocket routes
    router = get_router()
    app.include_router(router)
    
    # Example REST endpoint to start training
    @app.post("/api/training/start")
    async def start_training(config: dict):
        from training.yolo_trainer import YOLOTrainer, TrainingConfig
        import uuid
        
        trainer = YOLOTrainer()
        job_id = str(uuid.uuid4())
        
        training_config = TrainingConfig(**config)
        job = trainer.start_training(job_id, training_config)
        
        # Start tracking progress
        from training.progress_tracker import ProgressTracker
        tracker = ProgressTracker()
        log_file = f"training/logs/{job_id}.log"
        tracker.start_tracking(job_id, log_file)
        
        return {"success": True, "job_id": job_id}
    
    return app


if __name__ == "__main__":
    print("Training module examples")
    print("Run individual examples as needed")
