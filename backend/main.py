from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional
from contextlib import asynccontextmanager
import uvicorn
import os
from pathlib import Path

from app.routes import inference, training, models as model_routes, annotations, auth
from database import initialize_database


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan event handler for startup and shutdown"""
    # Startup
    print("\n🚀 Starting YOLO Generator API...")
    initialize_database()
    yield
    # Shutdown (if needed, add cleanup code here)
    print("\n👋 Shutting down YOLO Generator API...")


app = FastAPI(
    title="YOLO Generator API",
    description="ML Model Training and Inference Platform",
    version="1.0.0",
    lifespan=lifespan
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
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
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

