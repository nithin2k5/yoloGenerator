"""
Training Module for YOLO Dataset Building and Model Training

This module provides:
- Dataset building and YOLO format conversion
- YOLOv8 training service
- Real-time progress tracking via WebSockets
"""

from .dataset_builder import (
    DatasetBuilder,
    BoundingBox,
    ImageAnnotation
)

from .yolo_trainer import (
    YOLOTrainer,
    TrainingConfig,
    TrainingMetrics,
    TrainingJob
)

from .progress_tracker import (
    ProgressTracker,
    WebSocketProgressBroadcaster
)

from .websocket_routes import (
    initialize_progress_tracking,
    get_router
)

__all__ = [
    "DatasetBuilder",
    "BoundingBox",
    "ImageAnnotation",
    "YOLOTrainer",
    "TrainingConfig",
    "TrainingMetrics",
    "TrainingJob",
    "ProgressTracker",
    "WebSocketProgressBroadcaster",
    "initialize_progress_tracking",
    "get_router"
]
