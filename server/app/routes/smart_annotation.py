from fastapi import APIRouter, HTTPException, Form
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import cv2
import numpy as np
import base64
import requests
from pathlib import Path
import logging
import sys
import os

# Add parent directory to path to find services
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from database_service import DatasetService

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/segment")
async def segment_point(
    dataset_id: str = Form(...),
    image_id: str = Form(...),
    x: float = Form(...), 
    y: float = Form(...)
):
    try:
        # Get image path from DB
        # DatasetService.get_dataset_image returns the image dict {id, filename, path, ...}
        # We need to find the image in the list since there's no direct get_image(id) in the service
        # (Based on previous file reads, get_dataset_images returns a list)
        
        images = DatasetService.get_dataset_images(dataset_id)
        img_data = next((img for img in images if str(img["id"]) == str(image_id)), None)
        
        if not img_data:
            raise HTTPException(status_code=404, detail="Image not found")
            
        img_path = Path(img_data["path"])
        if not img_path.exists():
            raise HTTPException(status_code=404, detail="Image file missing")
            
        # Read image
        img = cv2.imread(str(img_path))
        if img is None:
            raise HTTPException(status_code=500, detail="Failed to load image")
            
        h, w = img.shape[:2]
        
        # Convert normalized coordinates to pixel
        px = int(x * w)
        py = int(y * h)
        
        # Safety bounds
        px = max(0, min(px, w - 1))
        py = max(0, min(py, h - 1))
        
        # Algorithm: Flood Fill for "Smart Click"
        tolerance = 30
        seed_point = (px, py)
        
        mask = np.zeros((h+2, w+2), np.uint8)
        flags = 4 | (255 << 8) | cv2.FLOODFILL_FIXED_RANGE | cv2.FLOODFILL_MASK_ONLY
        
        cv2.floodFill(img, mask, seed_point, (255, 255, 255), (tolerance,)*3, (tolerance,)*3, flags)
        
        # Crop mask to image size
        mask = mask[1:-1, 1:-1]
        
        # Find contours
        contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        if not contours:
            # Fallback box
            min_dim = min(w, h)
            box_size = max(20, int(min_dim * 0.05)) # 5% of image size
            box = {
                "x": max(0, px - box_size//2),
                "y": max(0, py - box_size//2),
                "width": box_size,
                "height": box_size
            }
        else:
            # Get bounding box of largest contour
            c = max(contours, key=cv2.contourArea)
            bx, by, bw, bh = cv2.boundingRect(c)
            
            # Filter tiny noise
            if bw < 5 or bh < 5:
                box_size = 20
                bx, by, bw, bh = max(0, px - box_size//2), max(0, py - box_size//2), box_size, box_size
                
            box = {
                "x": int(bx),
                "y": int(by),
                "width": int(bw),
                "height": int(bh)
            }

        return {
            "success": True,
            "box": box,
            "image_width": w,
            "image_height": h
        }

    except Exception as e:
        logger.error(f"Segmentation failed: {e}")
        # Return fallback on error to not break UI
        return {
            "success": False, 
            "detail": str(e),
            "box": {
                "x": max(0, int(x*100) - 25), 
                "y": max(0, int(y*100) - 25), 
                "width": 50, 
                "height": 50
            }
        }
