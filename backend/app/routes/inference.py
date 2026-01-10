from fastapi import APIRouter, File, UploadFile, HTTPException, Form
from fastapi.responses import JSONResponse
from typing import List, Optional
import os
import shutil
from pathlib import Path
import tempfile
import aiofiles

from models.inference import YOLOInference

router = APIRouter()

# Initialize inference model
inference_model = None

@router.post("/predict")
async def predict_image(
    file: UploadFile = File(...),
    confidence: Optional[float] = Form(0.25),
    model_name: Optional[str] = Form("yolov8n.pt")
):
    """
    Run inference on uploaded image
    """
    global inference_model
    
    try:
        # Initialize model if not already done
        if inference_model is None:
            inference_model = YOLOInference(model_name)
        
        # Save uploaded file temporarily
        temp_dir = Path(tempfile.gettempdir()) / "yolo_uploads"
        temp_dir.mkdir(exist_ok=True)
        
        temp_file = temp_dir / file.filename
        async with aiofiles.open(temp_file, 'wb') as out_file:
            content = await file.read()
            await out_file.write(content)
        
        # Run inference
        detections = inference_model.predict(str(temp_file), conf_threshold=confidence)
        
        # Clean up
        os.remove(temp_file)
        
        return JSONResponse(content={
            "success": True,
            "detections": detections,
            "image_name": file.filename,
            "num_detections": len(detections)
        })
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/predict-batch")
async def predict_batch(
    files: List[UploadFile] = File(...),
    confidence: Optional[float] = Form(0.25)
):
    """
    Run inference on multiple images
    """
    global inference_model
    
    try:
        if inference_model is None:
            inference_model = YOLOInference()
        
        temp_dir = Path(tempfile.gettempdir()) / "yolo_uploads"
        temp_dir.mkdir(exist_ok=True)
        
        all_results = []
        temp_files = []
        
        # Save all files
        for file in files:
            temp_file = temp_dir / file.filename
            async with aiofiles.open(temp_file, 'wb') as out_file:
                content = await file.read()
                await out_file.write(content)
            temp_files.append(temp_file)
        
        # Run batch inference
        all_detections = inference_model.predict_batch(
            [str(f) for f in temp_files],
            conf_threshold=confidence
        )
        
        # Format results
        for file, detections in zip(files, all_detections):
            all_results.append({
                "image_name": file.filename,
                "detections": detections,
                "num_detections": len(detections)
            })
        
        # Clean up
        for temp_file in temp_files:
            os.remove(temp_file)
        
        return JSONResponse(content={
            "success": True,
            "results": all_results,
            "total_images": len(files)
        })
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/models")
async def list_available_models():
    """
    List available YOLO models
    """
    return {
        "models": [
            {"name": "yolov8n.pt", "size": "Nano", "description": "Fastest, lowest accuracy"},
            {"name": "yolov8s.pt", "size": "Small", "description": "Balanced speed and accuracy"},
            {"name": "yolov8m.pt", "size": "Medium", "description": "Good accuracy"},
            {"name": "yolov8l.pt", "size": "Large", "description": "High accuracy"},
            {"name": "yolov8x.pt", "size": "Extra Large", "description": "Highest accuracy, slowest"},
        ]
    }

