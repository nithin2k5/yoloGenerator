"""
Real-time Training Progress Tracker using WebSockets

This module provides:
- Reading Ultralytics log files
- Streaming progress percentage
- Streaming loss and mAP metrics
- Multiple client support
- Safe disconnect handling
"""

import json
import logging
import re
import time
from pathlib import Path
from typing import Dict, List, Optional, Set, Callable, Union
from threading import Lock, Thread
import asyncio
from collections import deque


class ProgressTracker:
    """Tracks training progress by reading Ultralytics log files."""
    
    def __init__(self, log_dir: Union[str, Path] = "training/logs"):
        """
        Initialize progress tracker.
        
        Args:
            log_dir: Directory containing training log files
        """
        self.log_dir = Path(log_dir)
        self.log_dir.mkdir(parents=True, exist_ok=True)
        
        self.tracked_jobs: Dict[str, Dict] = {}
        self.file_handles: Dict[str, any] = {}
        self.file_positions: Dict[str, int] = {}
        self.lock = Lock()
        
        self.logger = logging.getLogger(__name__)
        
        # Pattern to match Ultralytics training log lines
        # Example: "      Epoch    GPU_mem   box_loss   obj_loss   cls_loss  Instances       Size"
        # Example: "        1/100      2.1G     0.12345     0.23456     0.34567        123        640"
        self.epoch_pattern = re.compile(
            r'^\s+(\d+)/(\d+)\s+'  # epoch/total_epochs
            r'([\d.]+[GMK]?)\s+'   # GPU_mem
            r'([\d.]+)\s+'         # box_loss
            r'([\d.]+)\s+'         # obj_loss
            r'([\d.]+)\s+'         # cls_loss
            r'(\d+)\s+'            # instances
            r'(\d+)'               # size
        )
        
        # Pattern for validation metrics
        # Example: "                 all        123       0.456       0.789       0.123       0.234"
        self.val_pattern = re.compile(
            r'^\s+all\s+'
            r'(\d+)\s+'            # instances
            r'([\d.]+)\s+'         # precision
            r'([\d.]+)\s+'         # recall
            r'([\d.]+)\s+'         # mAP50
            r'([\d.]+)'            # mAP50-95
        )
        
        # Pattern for final results
        # Example: "Results saved to runs/detect/train"
        self.results_pattern = re.compile(r'Results saved to (.+)')
    
    def start_tracking(self, job_id: str, log_file: Union[str, Path]) -> bool:
        """
        Start tracking a training job.
        
        Args:
            job_id: Unique job identifier
            log_file: Path to log file
        
        Returns:
            True if tracking started successfully
        """
        log_path = Path(log_file)
        if not log_path.exists():
            self.logger.warning(f"Log file not found: {log_path}")
            return False
        
        with self.lock:
            if job_id in self.tracked_jobs:
                self.logger.warning(f"Job {job_id} is already being tracked")
                return False
            
            self.tracked_jobs[job_id] = {
                "log_file": str(log_path),
                "last_update": time.time(),
                "epoch": 0,
                "total_epochs": 0,
                "metrics": {
                    "train_loss": 0.0,
                    "val_loss": 0.0,
                    "box_loss": 0.0,
                    "obj_loss": 0.0,
                    "cls_loss": 0.0,
                    "precision": 0.0,
                    "recall": 0.0,
                    "mAP50": 0.0,
                    "mAP50_95": 0.0,
                    "gpu_mem": "0G"
                },
                "progress_percent": 0.0,
                "status": "running"
            }
            
            self.file_positions[job_id] = 0
        
        self.logger.info(f"Started tracking job {job_id}")
        return True
    
    def stop_tracking(self, job_id: str):
        """Stop tracking a training job."""
        with self.lock:
            if job_id in self.tracked_jobs:
                del self.tracked_jobs[job_id]
            if job_id in self.file_positions:
                del self.file_positions[job_id]
            if job_id in self.file_handles:
                f = self.file_handles.pop(job_id)
                try:
                    f.close()
                except:
                    pass
        
        self.logger.info(f"Stopped tracking job {job_id}")
    
    def update_progress(self, job_id: str) -> Optional[Dict]:
        """
        Read new log entries and update progress.
        
        Args:
            job_id: Job identifier
        
        Returns:
            Updated progress dictionary or None if no updates
        """
        if job_id not in self.tracked_jobs:
            return None
        
        job_info = self.tracked_jobs[job_id]
        log_path = Path(job_info["log_file"])
        
        if not log_path.exists():
            return None
        
        try:
            with open(log_path, 'r', encoding='utf-8', errors='ignore') as f:
                # Seek to last known position
                f.seek(self.file_positions.get(job_id, 0))
                
                updated = False
                lines = f.readlines()
                
                for line in lines:
                    line = line.strip()
                    if not line:
                        continue
                    
                    # Check for epoch line
                    epoch_match = self.epoch_pattern.match(line)
                    if epoch_match:
                        epoch = int(epoch_match.group(1))
                        total_epochs = int(epoch_match.group(2))
                        gpu_mem = epoch_match.group(3)
                        box_loss = float(epoch_match.group(4))
                        obj_loss = float(epoch_match.group(5))
                        cls_loss = float(epoch_match.group(6))
                        
                        job_info["epoch"] = epoch
                        job_info["total_epochs"] = total_epochs
                        job_info["metrics"]["box_loss"] = box_loss
                        job_info["metrics"]["obj_loss"] = obj_loss
                        job_info["metrics"]["cls_loss"] = cls_loss
                        job_info["metrics"]["gpu_mem"] = gpu_mem
                        job_info["metrics"]["train_loss"] = box_loss + obj_loss + cls_loss
                        
                        if total_epochs > 0:
                            job_info["progress_percent"] = (epoch / total_epochs) * 100.0
                        
                        updated = True
                        continue
                    
                    # Check for validation metrics
                    val_match = self.val_pattern.match(line)
                    if val_match:
                        precision = float(val_match.group(2))
                        recall = float(val_match.group(3))
                        map50 = float(val_match.group(4))
                        map50_95 = float(val_match.group(5))
                        
                        job_info["metrics"]["precision"] = precision
                        job_info["metrics"]["recall"] = recall
                        job_info["metrics"]["mAP50"] = map50
                        job_info["metrics"]["mAP50_95"] = map50_95
                        job_info["metrics"]["val_loss"] = 1.0 - map50  # Approximate
                        
                        updated = True
                        continue
                    
                    # Check for completion
                    if "Results saved to" in line or "Training completed" in line.lower():
                        job_info["status"] = "completed"
                        job_info["progress_percent"] = 100.0
                        updated = True
                    
                    # Check for errors
                    if "error" in line.lower() or "failed" in line.lower():
                        job_info["status"] = "failed"
                        updated = True
                
                # Update file position
                self.file_positions[job_id] = f.tell()
                
                if updated:
                    job_info["last_update"] = time.time()
                    return self._get_progress_dict(job_id)
        
        except Exception as e:
            self.logger.error(f"Error reading log for job {job_id}: {e}")
            return None
        
        return None
    
    def get_progress(self, job_id: str) -> Optional[Dict]:
        """
        Get current progress for a job.
        
        Args:
            job_id: Job identifier
        
        Returns:
            Progress dictionary or None
        """
        if job_id not in self.tracked_jobs:
            return None
        
        # Try to update from log file
        self.update_progress(job_id)
        
        return self._get_progress_dict(job_id)
    
    def _get_progress_dict(self, job_id: str) -> Dict:
        """Get progress dictionary for a job."""
        job_info = self.tracked_jobs[job_id]
        
        return {
            "job_id": job_id,
            "status": job_info["status"],
            "epoch": job_info["epoch"],
            "total_epochs": job_info["total_epochs"],
            "progress_percent": round(job_info["progress_percent"], 2),
            "metrics": job_info["metrics"].copy(),
            "last_update": job_info["last_update"]
        }
    
    def list_tracked_jobs(self) -> List[str]:
        """List all tracked job IDs."""
        with self.lock:
            return list(self.tracked_jobs.keys())


class WebSocketProgressBroadcaster:
    """Broadcasts training progress to WebSocket clients."""
    
    def __init__(self, tracker: ProgressTracker, update_interval: float = 1.0):
        """
        Initialize WebSocket broadcaster.
        
        Args:
            tracker: ProgressTracker instance
            update_interval: Update interval in seconds
        """
        self.tracker = tracker
        self.update_interval = update_interval
        self.connected_clients: Dict[str, Set] = {}  # job_id -> set of websocket connections
        self.client_lock = Lock()
        self.running = False
        self.update_thread: Optional[Thread] = None
        
        self.logger = logging.getLogger(__name__)
    
    def add_client(self, job_id: str, websocket):
        """Add a WebSocket client for a job."""
        with self.client_lock:
            if job_id not in self.connected_clients:
                self.connected_clients[job_id] = set()
            self.connected_clients[job_id].add(websocket)
            
            # Start tracking if not already
            if job_id not in self.tracker.tracked_jobs:
                # Try to find log file
                log_file = self.tracker.log_dir / f"{job_id}.log"
                if log_file.exists():
                    self.tracker.start_tracking(job_id, log_file)
        
        self.logger.info(f"Client connected for job {job_id}")
        
        # Start update loop if not running
        if not self.running:
            self.start()
    
    def remove_client(self, job_id: str, websocket):
        """Remove a WebSocket client."""
        with self.client_lock:
            if job_id in self.connected_clients:
                self.connected_clients[job_id].discard(websocket)
                if len(self.connected_clients[job_id]) == 0:
                    del self.connected_clients[job_id]
        
        self.logger.info(f"Client disconnected for job {job_id}")
    
    def start(self):
        """Start the update loop."""
        if self.running:
            return
        
        self.running = True
        self.update_thread = Thread(target=self._update_loop, daemon=True)
        self.update_thread.start()
        self.logger.info("Progress broadcaster started")
    
    def stop(self):
        """Stop the update loop."""
        self.running = False
        if self.update_thread:
            self.update_thread.join(timeout=2.0)
        self.logger.info("Progress broadcaster stopped")
    
    def _update_loop(self):
        """Main update loop that broadcasts progress to clients."""
        while self.running:
            try:
                with self.client_lock:
                    jobs_to_update = list(self.connected_clients.keys())
                
                for job_id in jobs_to_update:
                    # Update progress
                    progress = self.tracker.update_progress(job_id)
                    
                    if progress:
                        # Broadcast to all clients for this job
                        with self.client_lock:
                            clients = self.connected_clients.get(job_id, set()).copy()
                        
                        # Send to each client (async, handled by FastAPI)
                        # This will be called from the WebSocket handler
                        for client in clients:
                            try:
                                # Queue message for async sending
                                if hasattr(client, '_send_queue'):
                                    client._send_queue.put_nowait(progress)
                            except Exception as e:
                                self.logger.error(f"Error sending to client: {e}")
                                self.remove_client(job_id, client)
                
                time.sleep(self.update_interval)
            
            except Exception as e:
                self.logger.error(f"Error in update loop: {e}")
                time.sleep(self.update_interval)
    
    async def send_to_client(self, websocket, message: Dict):
        """Send message to a WebSocket client (async)."""
        try:
            await websocket.send_json(message)
        except Exception as e:
            self.logger.error(f"Error sending WebSocket message: {e}")
            raise
