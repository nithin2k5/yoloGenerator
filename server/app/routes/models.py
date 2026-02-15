from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pathlib import Path
from typing import List, Dict

router = APIRouter()

@router.get("/list")
async def list_models():
    """
    List all available trained models
    """
    models_dir = Path("runs/detect")
    
    if not models_dir.exists():
        return {"models": []}
    
    models = []
    for run_dir in models_dir.iterdir():
        if run_dir.is_dir():
            weights_dir = run_dir / "weights"
            if weights_dir.exists():
                best_model = weights_dir / "best.pt"
                if best_model.exists():
                    models.append({
                        "name": run_dir.name,
                        "path": str(best_model),
                        "size": best_model.stat().st_size,
                        "created": best_model.stat().st_mtime
                    })
    
    return {"models": models}

@router.get("/download/{model_name}")
async def download_model(model_name: str):
    """
    Download a trained model
    """
    model_path = Path(f"runs/detect/{model_name}/weights/best.pt")
    
    if not model_path.exists():
        raise HTTPException(status_code=404, detail="Model not found")
    
    return FileResponse(
        path=str(model_path),
        filename=f"{model_name}_best.pt",
        media_type="application/octet-stream"
    )

@router.delete("/delete/{model_name}")
async def delete_model(model_name: str):
    """
    Delete a trained model
    """
    model_dir = Path(f"runs/detect/{model_name}")
    
    if not model_dir.exists():
        raise HTTPException(status_code=404, detail="Model not found")
    
    import shutil
    shutil.rmtree(model_dir)
    
    return {"success": True, "message": f"Model {model_name} deleted"}

@router.get("/info/{model_name}")
async def get_model_info(model_name: str):
    """
    Get detailed information about a model
    """
    model_dir = Path(f"runs/detect/{model_name}")
    
    if not model_dir.exists():
        raise HTTPException(status_code=404, detail="Model not found")
    
    weights_dir = model_dir / "weights"
    best_model = weights_dir / "best.pt"
    
    # Check for results
    results_file = model_dir / "results.csv"
    
    info = {
        "name": model_name,
        "model_path": str(best_model) if best_model.exists() else None,
        "has_results": results_file.exists(),
        "created": best_model.stat().st_mtime if best_model.exists() else None,
        "size_mb": round(best_model.stat().st_size / (1024 * 1024), 2) if best_model.exists() else None
    }
    
    return info

