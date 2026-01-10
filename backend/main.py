from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional
import uvicorn
import os
from pathlib import Path

from app.routes import inference, training, models as model_routes, annotations

app = FastAPI(
    title="YOLO Generator API",
    description="ML Model Training and Inference Platform",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://localhost:3002"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create datasets directory if it doesn't exist
datasets_dir = Path("datasets")
datasets_dir.mkdir(exist_ok=True)

# Include routers
app.include_router(inference.router, prefix="/api/inference", tags=["inference"])
app.include_router(training.router, prefix="/api/training", tags=["training"])
app.include_router(model_routes.router, prefix="/api/models", tags=["models"])
app.include_router(annotations.router, prefix="/api/annotations", tags=["annotations"])

@app.get("/")
async def root():
    return {
        "message": "YOLO Generator API",
        "status": "running",
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

