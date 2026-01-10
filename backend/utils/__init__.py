"""
Utility functions for the YOLO Generator platform
"""

import os
from pathlib import Path
from typing import List, Optional
import yaml


def create_directory(path: str) -> Path:
    """
    Create directory if it doesn't exist
    
    Args:
        path: Directory path
        
    Returns:
        Path object
    """
    dir_path = Path(path)
    dir_path.mkdir(parents=True, exist_ok=True)
    return dir_path


def load_yaml(file_path: str) -> dict:
    """
    Load YAML configuration file
    
    Args:
        file_path: Path to YAML file
        
    Returns:
        Dictionary with configuration
    """
    with open(file_path, 'r') as f:
        config = yaml.safe_load(f)
    return config


def validate_dataset_yaml(yaml_path: str) -> bool:
    """
    Validate dataset YAML configuration
    
    Args:
        yaml_path: Path to dataset YAML
        
    Returns:
        True if valid, False otherwise
    """
    try:
        config = load_yaml(yaml_path)
        
        required_keys = ['path', 'train', 'val', 'names', 'nc']
        for key in required_keys:
            if key not in config:
                return False
        
        return True
    except Exception:
        return False


def get_model_size(model_path: str) -> int:
    """
    Get model file size in bytes
    
    Args:
        model_path: Path to model file
        
    Returns:
        File size in bytes
    """
    return os.path.getsize(model_path)

