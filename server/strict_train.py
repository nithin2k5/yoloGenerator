#!/usr/bin/env python3
"""
Strict Training Script for YOLO Models

This script provides strict training configuration with mandatory epochs.
Run from command line:
    python strict_train.py --data path/to/data.yaml --epochs 100
"""

import argparse
import sys
from pathlib import Path
import torch
from ultralytics import YOLO
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class StrictTrainer:
    """Strict YOLO Trainer with mandatory epochs configuration."""
    
    def __init__(self, model_name: str = "yolov8n.pt"):
        """
        Initialize strict trainer.
        
        Args:
            model_name: Base model name (yolov8n.pt, yolov8s.pt, yolov8m.pt, yolov8l.pt, yolov8x.pt)
        """
        self.model_name = model_name
        self.device = self._detect_device()
        logger.info(f"Initializing trainer with model: {model_name}")
        logger.info(f"Device: {self.device}")
        
        try:
            self.model = YOLO(model_name)
            logger.info(f"Model loaded successfully: {model_name}")
        except Exception as e:
            logger.error(f"Failed to load model {model_name}: {e}")
            raise
    
    def _detect_device(self) -> str:
        """Auto-detect best available device."""
        if torch.cuda.is_available():
            device = f"cuda:{torch.cuda.current_device()}"
            logger.info(f"CUDA available: {torch.cuda.get_device_name(0)}")
            return device
        elif hasattr(torch.backends, 'mps') and torch.backends.mps.is_available():
            logger.info("MPS (Apple Silicon) available")
            return "mps"
        else:
            logger.info("Using CPU")
            return "cpu"
    
    def train(
        self,
        data_yaml: str,
        epochs: int,
        batch_size: int = 16,
        img_size: int = 640,
        learning_rate: float = 0.01,
        patience: int = 50,
        project: str = "runs/detect",
        name: str = "strict_train",
        **kwargs
    ) -> dict:
        """
        Run strict training with mandatory epochs.
        
        Args:
            data_yaml: Path to dataset YAML file (MANDATORY)
            epochs: Number of training epochs (MANDATORY)
            batch_size: Batch size (default: 16)
            img_size: Image size (default: 640)
            learning_rate: Initial learning rate (default: 0.01)
            patience: Early stopping patience (default: 50)
            project: Project directory (default: runs/detect)
            name: Training run name (default: strict_train)
            **kwargs: Additional training parameters
            
        Returns:
            Dictionary with training results
        """
        # Validate inputs
        if not Path(data_yaml).exists():
            raise FileNotFoundError(f"Dataset YAML not found: {data_yaml}")
        
        if epochs < 1:
            raise ValueError(f"Epochs must be at least 1, got {epochs}")
        
        if epochs > 1000:
            raise ValueError(f"Epochs cannot exceed 1000, got {epochs}")
        
        logger.info("=" * 60)
        logger.info("STRICT TRAINING CONFIGURATION")
        logger.info("=" * 60)
        logger.info(f"Dataset YAML: {data_yaml}")
        logger.info(f"Epochs: {epochs} (MANDATORY)")
        logger.info(f"Batch Size: {batch_size}")
        logger.info(f"Image Size: {img_size}")
        logger.info(f"Learning Rate: {learning_rate}")
        logger.info(f"Patience: {patience}")
        logger.info(f"Device: {self.device}")
        logger.info(f"Model: {self.model_name}")
        logger.info(f"Project: {project}")
        logger.info(f"Name: {name}")
        logger.info("=" * 60)
        
        # Strict training parameters
        train_params = {
            "data": data_yaml,
            "epochs": epochs,  # MANDATORY - no early stopping unless patience is reached
            "imgsz": img_size,
            "batch": batch_size,
            "device": self.device,
            "lr0": learning_rate,
            "patience": patience,
            "project": project,
            "name": name,
            "exist_ok": True,
            "save": True,
            "save_period": 10,  # Save checkpoint every 10 epochs
            "val": True,  # Always validate
            "plots": True,  # Generate training plots
            "verbose": True,  # Verbose output
        }
        
        # Add any additional parameters
        train_params.update(kwargs)
        
        logger.info("Starting training...")
        logger.info(f"Training parameters: {train_params}")
        
        try:
            # Run training
            results = self.model.train(**train_params)
            
            # Extract results
            metrics = {
                "map50": float(results.results_dict.get("metrics/mAP50(B)", 0)),
                "map50-95": float(results.results_dict.get("metrics/mAP50-95(B)", 0)),
                "precision": float(results.results_dict.get("metrics/precision(B)", 0)),
                "recall": float(results.results_dict.get("metrics/recall(B)", 0)),
            }
            
            model_path = str(results.save_dir / "weights" / "best.pt")
            
            logger.info("=" * 60)
            logger.info("TRAINING COMPLETED SUCCESSFULLY")
            logger.info("=" * 60)
            logger.info(f"Model saved to: {model_path}")
            logger.info(f"Results directory: {results.save_dir}")
            logger.info("Final Metrics:")
            for key, value in metrics.items():
                logger.info(f"  {key}: {value:.4f}")
            logger.info("=" * 60)
            
            return {
                "success": True,
                "epochs_completed": epochs,
                "model_path": model_path,
                "results_dir": str(results.save_dir),
                "metrics": metrics
            }
            
        except Exception as e:
            logger.error(f"Training failed: {e}", exc_info=True)
            raise


def main():
    """Main entry point for strict training script."""
    parser = argparse.ArgumentParser(
        description="Strict YOLO Training Script with Mandatory Epochs",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Basic training with 100 epochs
  python strict_train.py --data datasets/my_dataset/data.yaml --epochs 100
  
  # Training with custom parameters
  python strict_train.py --data datasets/my_dataset/data.yaml --epochs 200 \\
    --batch-size 32 --img-size 640 --learning-rate 0.001
  
  # Training with YOLOv8s model
  python strict_train.py --data datasets/my_dataset/data.yaml --epochs 150 \\
    --model yolov8s.pt --batch-size 16
        """
    )
    
    # Mandatory arguments
    parser.add_argument(
        "--data",
        type=str,
        required=True,
        help="Path to dataset YAML file (MANDATORY)"
    )
    parser.add_argument(
        "--epochs",
        type=int,
        required=True,
        help="Number of training epochs (MANDATORY, 1-1000)"
    )
    
    # Optional arguments
    parser.add_argument(
        "--model",
        type=str,
        default="yolov8n.pt",
        choices=["yolov8n.pt", "yolov8s.pt", "yolov8m.pt", "yolov8l.pt", "yolov8x.pt"],
        help="Base model name (default: yolov8n.pt)"
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=16,
        help="Batch size (default: 16)"
    )
    parser.add_argument(
        "--img-size",
        type=int,
        default=640,
        choices=[320, 416, 512, 640, 768, 896, 1024, 1280],
        help="Image size (default: 640)"
    )
    parser.add_argument(
        "--learning-rate",
        type=float,
        default=0.01,
        help="Initial learning rate (default: 0.01)"
    )
    parser.add_argument(
        "--patience",
        type=int,
        default=50,
        help="Early stopping patience (default: 50)"
    )
    parser.add_argument(
        "--project",
        type=str,
        default="runs/detect",
        help="Project directory (default: runs/detect)"
    )
    parser.add_argument(
        "--name",
        type=str,
        default="strict_train",
        help="Training run name (default: strict_train)"
    )
    parser.add_argument(
        "--device",
        type=str,
        default=None,
        choices=["cpu", "cuda", "mps"],
        help="Device to use (default: auto-detect)"
    )
    
    args = parser.parse_args()
    
    # Validate epochs
    if args.epochs < 1 or args.epochs > 1000:
        logger.error(f"Epochs must be between 1 and 1000, got {args.epochs}")
        sys.exit(1)
    
    # Validate data file
    if not Path(args.data).exists():
        logger.error(f"Dataset YAML file not found: {args.data}")
        sys.exit(1)
    
    try:
        # Initialize trainer
        trainer = StrictTrainer(model_name=args.model)
        
        # Override device if specified
        if args.device:
            trainer.device = args.device
        
        # Run training
        results = trainer.train(
            data_yaml=args.data,
            epochs=args.epochs,
            batch_size=args.batch_size,
            img_size=args.img_size,
            learning_rate=args.learning_rate,
            patience=args.patience,
            project=args.project,
            name=args.name
        )
        
        # Print summary
        print("\n" + "=" * 60)
        print("TRAINING SUMMARY")
        print("=" * 60)
        print(f"Status: {'SUCCESS' if results['success'] else 'FAILED'}")
        print(f"Epochs Completed: {results['epochs_completed']}")
        print(f"Model Path: {results['model_path']}")
        print(f"Results Directory: {results['results_dir']}")
        print("\nFinal Metrics:")
        for key, value in results['metrics'].items():
            print(f"  {key}: {value:.4f}")
        print("=" * 60)
        
        sys.exit(0)
        
    except KeyboardInterrupt:
        logger.warning("Training interrupted by user")
        sys.exit(130)
    except Exception as e:
        logger.error(f"Training failed: {e}", exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    main()
