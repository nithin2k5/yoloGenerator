from fastapi import APIRouter, File, UploadFile, HTTPException, Form
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel
from typing import List, Dict, Optional
import os
import json
import shutil
from pathlib import Path
import tempfile
import uuid
from datetime import datetime
import aiofiles
import zipfile

router = APIRouter()

# Store annotations in memory (in production, use a database)
annotations_db: Dict[str, Dict] = {}
datasets_db: Dict[str, Dict] = {}

class BoundingBox(BaseModel):
    x: float
    y: float
    width: float
    height: float
    class_id: int
    class_name: str

class ImageAnnotation(BaseModel):
    image_id: str
    image_name: str
    width: int
    height: int
    boxes: List[BoundingBox]

class Dataset(BaseModel):
    name: str
    description: Optional[str] = ""
    classes: List[str]

@router.post("/datasets/create")
async def create_dataset(dataset: Dataset):
    """
    Create a new dataset
    """
    dataset_id = str(uuid.uuid4())
    datasets_db[dataset_id] = {
        "id": dataset_id,
        "name": dataset.name,
        "description": dataset.description,
        "classes": dataset.classes,
        "images": [],
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    }
    
    # Create dataset directory
    dataset_dir = Path(f"datasets/{dataset_id}")
    dataset_dir.mkdir(parents=True, exist_ok=True)
    (dataset_dir / "images").mkdir(exist_ok=True)
    (dataset_dir / "labels").mkdir(exist_ok=True)
    
    return JSONResponse(content={
        "success": True,
        "dataset_id": dataset_id,
        "dataset": datasets_db[dataset_id]
    })

@router.get("/datasets/list")
async def list_datasets():
    """
    List all datasets
    """
    return {
        "datasets": list(datasets_db.values())
    }

@router.get("/datasets/{dataset_id}")
async def get_dataset(dataset_id: str):
    """
    Get dataset details
    """
    if dataset_id not in datasets_db:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    return datasets_db[dataset_id]

@router.post("/datasets/{dataset_id}/upload")
async def upload_images_to_dataset(
    dataset_id: str,
    files: List[UploadFile] = File(...)
):
    """
    Upload images to a dataset
    """
    if dataset_id not in datasets_db:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    # Validate files list
    if not files or len(files) == 0:
        raise HTTPException(status_code=400, detail="No files provided")
    
    # Create dataset directory if it doesn't exist
    dataset_dir = Path(f"datasets/{dataset_id}/images")
    dataset_dir.mkdir(parents=True, exist_ok=True)
    
    uploaded_files = []
    errors = []
    
    # Validate and process each file
    for file in files:
        try:
            # Check if file has a filename
            if not file.filename:
                errors.append("Unknown file: Missing filename")
                continue
            
            # Validate file type
            if not file.content_type or not file.content_type.startswith('image/'):
                errors.append(f"{file.filename}: Not a valid image file (content-type: {file.content_type})")
                continue
            
            image_id = str(uuid.uuid4())
            file_ext = Path(file.filename).suffix.lower()
            
            # If no extension, try to infer from content type
            if not file_ext:
                content_type_map = {
                    'image/jpeg': '.jpg',
                    'image/jpg': '.jpg',
                    'image/png': '.png',
                    'image/gif': '.gif',
                    'image/bmp': '.bmp',
                    'image/webp': '.webp'
                }
                file_ext = content_type_map.get(file.content_type, '.jpg')
            
            # Ensure valid extension
            if file_ext not in ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp']:
                errors.append(f"{file.filename}: Unsupported image format ({file_ext})")
                continue
            
            new_filename = f"{image_id}{file_ext}"
            file_path = dataset_dir / new_filename
            
            # Read and write file (with size check)
            file_content = await file.read()
            
            # Validate file size (max 50MB per file)
            if len(file_content) > 50 * 1024 * 1024:  # 50MB
                errors.append(f"{file.filename}: File too large (max 50MB, got {len(file_content) / 1024 / 1024:.2f}MB)")
                continue
            
            # Validate minimum file size (at least 100 bytes)
            if len(file_content) < 100:
                errors.append(f"{file.filename}: File too small or corrupted")
                continue
            
            # Write file
            async with aiofiles.open(file_path, 'wb') as out_file:
                await out_file.write(file_content)
            
            # Verify file was written
            if not file_path.exists() or file_path.stat().st_size == 0:
                errors.append(f"{file.filename}: Failed to write file")
                continue
            
            # Add to dataset
            image_info = {
                "id": image_id,
                "filename": new_filename,
                "original_name": file.filename,
                "path": str(file_path),
                "annotated": False,
                "uploaded_at": datetime.now().isoformat()
            }
            
            datasets_db[dataset_id]["images"].append(image_info)
            uploaded_files.append(image_info)
            
        except Exception as e:
            import traceback
            error_msg = f"{file.filename if file.filename else 'Unknown file'}: {str(e)}"
            errors.append(error_msg)
            print(f"Error uploading file: {error_msg}")
            print(traceback.format_exc())
            continue
    
    datasets_db[dataset_id]["updated_at"] = datetime.now().isoformat()
    
    # Return response
    response_data = {
        "success": len(uploaded_files) > 0,
        "uploaded": len(uploaded_files),
        "files": uploaded_files
    }
    
    if errors:
        response_data["errors"] = errors
        response_data["error_count"] = len(errors)
    
    return JSONResponse(content=response_data)

@router.post("/annotations/save")
async def save_annotation(request: dict):
    """
    Save image annotations
    """
    dataset_id = request.get("dataset_id")
    if not dataset_id or dataset_id not in datasets_db:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    image_id = request.get("image_id")
    image_name = request.get("image_name")
    width = request.get("width")
    height = request.get("height")
    boxes = request.get("boxes", [])
    
    # Store annotation
    annotation_id = f"{dataset_id}_{image_id}"
    annotations_db[annotation_id] = {
        "dataset_id": dataset_id,
        "image_id": image_id,
        "image_name": image_name,
        "width": width,
        "height": height,
        "boxes": boxes,
        "updated_at": datetime.now().isoformat()
    }
    
    # Convert to YOLO format and save
    labels_dir = Path(f"datasets/{dataset_id}/labels")
    labels_dir.mkdir(exist_ok=True, parents=True)
    label_file = labels_dir / f"{Path(image_name).stem}.txt"
    
    with open(label_file, 'w') as f:
        for box in boxes:
            # Convert to YOLO format (class_id center_x center_y width height)
            # Normalize coordinates to 0-1
            center_x = (box["x"] + box["width"] / 2) / width
            center_y = (box["y"] + box["height"] / 2) / height
            norm_width = box["width"] / width
            norm_height = box["height"] / height
            
            f.write(f"{box['class_id']} {center_x} {center_y} {norm_width} {norm_height}\n")
    
    # Mark image as annotated
    for img in datasets_db[dataset_id]["images"]:
        if img["id"] == image_id:
            img["annotated"] = True
            break
    
    return JSONResponse(content={
        "success": True,
        "annotation_id": annotation_id,
        "label_file": str(label_file)
    })

@router.get("/annotations/{dataset_id}/{image_id}")
async def get_annotation(dataset_id: str, image_id: str):
    """
    Get annotations for an image
    """
    annotation_id = f"{dataset_id}_{image_id}"
    
    if annotation_id not in annotations_db:
        return {"boxes": []}
    
    return annotations_db[annotation_id]

@router.post("/datasets/{dataset_id}/export")
async def export_dataset(dataset_id: str, split_ratio: float = 0.8):
    """
    Export dataset in YOLO format with train/val split
    """
    if dataset_id not in datasets_db:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    dataset = datasets_db[dataset_id]
    dataset_dir = Path(f"datasets/{dataset_id}")
    
    # Get all annotated images
    annotated_images = [img for img in dataset["images"] if img["annotated"]]
    
    if not annotated_images:
        raise HTTPException(status_code=400, detail="No annotated images in dataset")
    
    # Split into train/val
    import random
    random.shuffle(annotated_images)
    split_idx = int(len(annotated_images) * split_ratio)
    train_images = annotated_images[:split_idx]
    val_images = annotated_images[split_idx:]
    
    # Create train/val directories
    train_dir = dataset_dir / "split" / "train"
    val_dir = dataset_dir / "split" / "val"
    
    for split_dir, images in [(train_dir, train_images), (val_dir, val_images)]:
        (split_dir / "images").mkdir(parents=True, exist_ok=True)
        (split_dir / "labels").mkdir(parents=True, exist_ok=True)
        
        for img in images:
            # Copy image
            src_img = dataset_dir / "images" / img["filename"]
            dst_img = split_dir / "images" / img["filename"]
            shutil.copy2(src_img, dst_img)
            
            # Copy label
            label_name = f"{Path(img['filename']).stem}.txt"
            src_label = dataset_dir / "labels" / label_name
            dst_label = split_dir / "labels" / label_name
            if src_label.exists():
                shutil.copy2(src_label, dst_label)
    
    # Create data.yaml
    yaml_content = f"""# YOLO Dataset Configuration
# Generated from dataset: {dataset['name']}

path: {dataset_dir / 'split'}
train: train/images
val: val/images

# Classes
names:
"""
    for idx, class_name in enumerate(dataset["classes"]):
        yaml_content += f"  {idx}: {class_name}\n"
    
    yaml_content += f"\nnc: {len(dataset['classes'])}\n"
    
    yaml_path = dataset_dir / "data.yaml"
    with open(yaml_path, 'w') as f:
        f.write(yaml_content)
    
    # Create zip file
    zip_path = dataset_dir / f"{dataset['name']}_export.zip"
    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        # Add data.yaml
        zipf.write(yaml_path, "data.yaml")
        
        # Add all files
        for split in ["train", "val"]:
            split_path = dataset_dir / "split" / split
            for folder in ["images", "labels"]:
                folder_path = split_path / folder
                if folder_path.exists():
                    for file in folder_path.iterdir():
                        if file.is_file():
                            arcname = f"{split}/{folder}/{file.name}"
                            zipf.write(file, arcname)
    
    return {
        "success": True,
        "yaml_path": str(yaml_path),
        "train_images": len(train_images),
        "val_images": len(val_images),
        "total_classes": len(dataset["classes"]),
        "zip_path": str(zip_path)
    }

@router.get("/datasets/{dataset_id}/download")
async def download_dataset(dataset_id: str):
    """
    Download exported dataset
    """
    if dataset_id not in datasets_db:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    dataset = datasets_db[dataset_id]
    zip_path = Path(f"datasets/{dataset_id}/{dataset['name']}_export.zip")
    
    if not zip_path.exists():
        raise HTTPException(status_code=404, detail="Dataset not exported yet. Export first.")
    
    return FileResponse(
        path=str(zip_path),
        filename=f"{dataset['name']}_dataset.zip",
        media_type="application/zip"
    )

@router.delete("/datasets/{dataset_id}")
async def delete_dataset(dataset_id: str):
    """
    Delete a dataset
    """
    if dataset_id not in datasets_db:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    # Delete directory
    dataset_dir = Path(f"datasets/{dataset_id}")
    if dataset_dir.exists():
        shutil.rmtree(dataset_dir)
    
    # Remove from database
    del datasets_db[dataset_id]
    
    # Remove annotations
    keys_to_delete = [k for k in annotations_db.keys() if k.startswith(f"{dataset_id}_")]
    for key in keys_to_delete:
        del annotations_db[key]
    
    return {"success": True, "message": "Dataset deleted"}

@router.get("/datasets/{dataset_id}/stats")
async def get_dataset_stats(dataset_id: str):
    """
    Get dataset statistics
    """
    if dataset_id not in datasets_db:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    dataset = datasets_db[dataset_id]
    total_images = len(dataset["images"])
    annotated_images = len([img for img in dataset["images"] if img["annotated"]])
    
    # Count annotations per class
    class_counts = {cls: 0 for cls in dataset["classes"]}
    for key, annotation in annotations_db.items():
        if key.startswith(f"{dataset_id}_"):
            for box in annotation["boxes"]:
                class_name = box["class_name"]
                if class_name in class_counts:
                    class_counts[class_name] += 1
    
    return {
        "dataset_id": dataset_id,
        "name": dataset["name"],
        "total_images": total_images,
        "annotated_images": annotated_images,
        "unannotated_images": total_images - annotated_images,
        "total_classes": len(dataset["classes"]),
        "class_counts": class_counts,
        "completion_percentage": (annotated_images / total_images * 100) if total_images > 0 else 0
    }

@router.get("/image/{dataset_id}/{image_filename}")
async def serve_image(dataset_id: str, image_filename: str):
    """
    Serve an image file directly
    """
    # Construct the file path
    image_path = Path(f"datasets/{dataset_id}/images/{image_filename}")
    
    if not image_path.exists():
        raise HTTPException(status_code=404, detail=f"Image not found: {image_filename}")
    
    # Determine media type based on extension
    ext = image_filename.lower().split('.')[-1]
    media_types = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp'
    }
    media_type = media_types.get(ext, 'image/jpeg')
    
    return FileResponse(
        path=str(image_path),
        media_type=media_type,
        headers={
            "Access-Control-Allow-Origin": "*",
            "Cache-Control": "public, max-age=3600"
        }
    )

