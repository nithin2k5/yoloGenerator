"""
FastAPI WebSocket Routes for Training Progress Tracking

This module provides WebSocket endpoints for real-time training progress updates.
"""

import asyncio
import json
import logging
from typing import Dict, Optional
from fastapi import WebSocket, WebSocketDisconnect, HTTPException
from fastapi.routing import APIRouter

from .progress_tracker import ProgressTracker, WebSocketProgressBroadcaster


logger = logging.getLogger(__name__)

# Global instances (should be initialized in main app)
tracker: Optional[ProgressTracker] = None
broadcaster: Optional[WebSocketProgressBroadcaster] = None


def initialize_progress_tracking(log_dir: str = "training/logs"):
    """Initialize progress tracking components."""
    global tracker, broadcaster
    
    tracker = ProgressTracker(log_dir=log_dir)
    broadcaster = WebSocketProgressBroadcaster(tracker, update_interval=1.0)
    broadcaster.start()
    
    logger.info("Progress tracking initialized")


def get_router() -> APIRouter:
    """Get FastAPI router with WebSocket routes."""
    router = APIRouter(prefix="/api/training", tags=["training"])
    
    @router.websocket("/progress/{job_id}")
    async def training_progress_websocket(websocket: WebSocket, job_id: str):
        """
        WebSocket endpoint for real-time training progress updates.
        
        Args:
            websocket: WebSocket connection
            job_id: Training job identifier
        """
        if not tracker or not broadcaster:
            await websocket.close(code=1011, reason="Progress tracking not initialized")
            return
        
        await websocket.accept()
        logger.info(f"WebSocket connection established for job {job_id}")
        
        # Add client to broadcaster
        broadcaster.add_client(job_id, websocket)
        
        # Start tracking if not already
        if job_id not in tracker.tracked_jobs:
            # Try to find log file
            from pathlib import Path
            log_file = Path(tracker.log_dir) / f"{job_id}.log"
            if log_file.exists():
                tracker.start_tracking(job_id, log_file)
            else:
                # Send initial message indicating log file not found
                await websocket.send_json({
                    "job_id": job_id,
                    "status": "pending",
                    "message": "Log file not found, waiting for training to start..."
                })
        
        try:
            # Send initial progress
            progress = tracker.get_progress(job_id)
            if progress:
                await broadcaster.send_to_client(websocket, progress)
            
            # Keep connection alive and send updates
            last_sent_time = 0
            update_interval = 1.0  # Send updates every second
            
            while True:
                current_time = asyncio.get_event_loop().time()
                
                # Check for updates periodically
                if current_time - last_sent_time >= update_interval:
                    progress = tracker.update_progress(job_id)
                    if progress:
                        await broadcaster.send_to_client(websocket, progress)
                        last_sent_time = current_time
                
                # Check for client messages (non-blocking)
                try:
                    # Set short timeout to allow periodic updates
                    data = await asyncio.wait_for(websocket.receive_text(), timeout=0.5)
                    
                    # Handle client messages
                    try:
                        message = json.loads(data)
                        if message.get("type") == "ping":
                            await websocket.send_json({"type": "pong"})
                    except json.JSONDecodeError:
                        pass
                
                except asyncio.TimeoutError:
                    # Timeout is expected, continue to send updates
                    continue
        
        except WebSocketDisconnect:
            logger.info(f"WebSocket disconnected for job {job_id}")
        except Exception as e:
            logger.error(f"Error in WebSocket handler for job {job_id}: {e}", exc_info=True)
        finally:
            # Remove client
            broadcaster.remove_client(job_id, websocket)
            logger.info(f"WebSocket connection closed for job {job_id}")
    
    @router.get("/progress/{job_id}")
    async def get_training_progress(job_id: str):
        """
        REST endpoint to get current training progress (for polling fallback).
        
        Args:
            job_id: Training job identifier
        
        Returns:
            Current progress dictionary
        """
        if not tracker:
            raise HTTPException(status_code=503, detail="Progress tracking not initialized")
        
        progress = tracker.get_progress(job_id)
        if not progress:
            raise HTTPException(status_code=404, detail=f"Job {job_id} not found")
        
        return progress
    
    @router.post("/progress/{job_id}/start-tracking")
    async def start_tracking_job(job_id: str, log_file: Optional[str] = None):
        """
        Start tracking a training job.
        
        Args:
            job_id: Training job identifier
            log_file: Optional path to log file (defaults to logs/{job_id}.log)
        
        Returns:
            Success status
        """
        if not tracker:
            raise HTTPException(status_code=503, detail="Progress tracking not initialized")
        
        if not log_file:
            from pathlib import Path
            log_file = str(Path(tracker.log_dir) / f"{job_id}.log")
        
        success = tracker.start_tracking(job_id, log_file)
        if not success:
            raise HTTPException(status_code=400, detail=f"Failed to start tracking job {job_id}")
        
        return {"success": True, "job_id": job_id, "log_file": log_file}
    
    @router.delete("/progress/{job_id}/stop-tracking")
    async def stop_tracking_job(job_id: str):
        """
        Stop tracking a training job.
        
        Args:
            job_id: Training job identifier
        
        Returns:
            Success status
        """
        if not tracker:
            raise HTTPException(status_code=503, detail="Progress tracking not initialized")
        
        tracker.stop_tracking(job_id)
        return {"success": True, "job_id": job_id}
    
    @router.get("/progress")
    async def list_tracked_jobs():
        """
        List all currently tracked jobs.
        
        Returns:
            List of job IDs
        """
        if not tracker:
            raise HTTPException(status_code=503, detail="Progress tracking not initialized")
        
        jobs = tracker.list_tracked_jobs()
        return {"jobs": jobs, "count": len(jobs)}
    
    return router
