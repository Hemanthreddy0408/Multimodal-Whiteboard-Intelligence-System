"""
WebSocket Manager and Route

Real-time bidirectional communication between frontend and backend.

WHY WEBSOCKETS?
HTTP is request-response: client asks → server responds → connection closes.
WebSocket is persistent: connection stays open → server can PUSH data anytime.

For our AI pipeline, this means:
- Client uploads image → gets job_id
- Client opens WebSocket: ws://backend/ws/{job_id}
- Backend pushes progress events as pipeline stages complete:
  → {"event": "progress", "progress": 25, "stage": "segmentation", "message": "Found 8 elements"}
  → {"event": "progress", "progress": 60, "stage": "ocr", "message": "Text extracted"}
  → {"event": "result", "data": {...full analysis result...}}
- Client updates UI in real-time

WebSocket Protocol (our custom format):
{
    "event": "progress" | "result" | "error" | "ping",
    "job_id": "uuid",
    "stage": "preprocessing" | "segmentation" | "ocr" | "embedding" | "llm_analysis",
    "progress": 0-100,
    "message": "Human readable status",
    "data": {...} // for "result" events
}

CONNECTION MANAGEMENT:
We maintain a dict: {job_id → list of WebSocket connections}
Multiple clients can listen to the same job (useful for collaborative features).
"""
import asyncio
import json
import uuid
from typing import Dict, List, Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import logging

log = logging.getLogger(__name__)
router = APIRouter()


class ConnectionManager:
    """
    Manages all active WebSocket connections.
    
    Maps job_id → list of WebSocket connections.
    One job can have multiple watchers (collaborative feature).
    
    Thread-safety note: FastAPI uses async event loop, so dict operations
    are effectively single-threaded and don't need locks.
    """
    
    def __init__(self):
        # {job_id: [WebSocket, WebSocket, ...]}
        self.active_connections: Dict[str, List[WebSocket]] = {}
        # Simple in-memory cache for results and errors to prevent race conditions
        # if a job completes before the websocket has finished connecting.
        self.job_results: Dict[str, dict] = {}
        self.job_errors: Dict[str, str] = {}
        self.job_progress: Dict[str, dict] = {}

    async def connect(self, websocket: WebSocket, job_id: str):
        """Accept a new WebSocket connection and register it."""
        await websocket.accept()
        
        if job_id not in self.active_connections:
            self.active_connections[job_id] = []
        
        self.active_connections[job_id].append(websocket)
        log.info(f"🔌 WebSocket connected: job={job_id[:8]}... | "
                 f"total_for_job={len(self.active_connections[job_id])}")
        
        # Send welcome message
        await websocket.send_json({
            "event": "connected",
            "job_id": job_id,
            "message": "Connected! Listening for analysis updates...",
            "progress": 0,
        })

        # Immediately reply with the cached result if the job is already complete
        if job_id in self.job_results:
            log.info(f"⚡ Job {job_id[:8]}... already finished. Sending cached result.")
            await websocket.send_json({
                "event": "result",
                "job_id": job_id,
                "progress": 100,
                "data": self.job_results[job_id],
                "message": "Analysis complete!",
            })
        elif job_id in self.job_errors:
            log.info(f"⚡ Job {job_id[:8]}... already failed. Sending cached error.")
            await websocket.send_json({
                "event": "error",
                "job_id": job_id,
                "progress": -1,
                "message": f"Analysis failed: {self.job_errors[job_id]}",
            })
        elif job_id in self.job_progress:
            # Send latest progress
            prog = self.job_progress[job_id]
            await websocket.send_json({
                "event": "progress",
                "job_id": job_id,
                "stage": prog["stage"],
                "progress": prog["progress"],
                "message": prog["message"],
            })

    def disconnect(self, websocket: WebSocket, job_id: str):
        """Remove a WebSocket connection."""
        if job_id in self.active_connections:
            try:
                self.active_connections[job_id].remove(websocket)
                if not self.active_connections[job_id]:
                    del self.active_connections[job_id]
            except ValueError:
                pass  # Already removed
        log.info(f"🔌 WebSocket disconnected: job={job_id[:8]}...")

    async def send_to_job(self, job_id: str, message: dict):
        """
        Send a JSON message to ALL clients watching a job.
        
        If a client disconnected mid-stream, we skip it gracefully.
        """
        if job_id not in self.active_connections:
            return  # No one watching, that's fine
        
        disconnected = []
        for websocket in self.active_connections[job_id]:
            try:
                await websocket.send_json(message)
            except Exception as e:
                log.warning(f"Failed to send to WebSocket: {e}")
                disconnected.append(websocket)
        
        # Clean up dead connections
        for ws in disconnected:
            self.disconnect(ws, job_id)

    async def send_progress(self, job_id: str, stage: str, progress: int, message: str):
        """Send a progress update event."""
        self.job_progress[job_id] = {
            "stage": stage,
            "progress": progress,
            "message": message,
        }
        await self.send_to_job(job_id, {
            "event": "progress",
            "job_id": job_id,
            "stage": stage,
            "progress": progress,
            "message": message,
        })

    async def send_result(self, job_id: str, result: dict):
        """Send the final analysis result."""
        self.job_results[job_id] = result
        self.job_progress.pop(job_id, None)
        await self.send_to_job(job_id, {
            "event": "result",
            "job_id": job_id,
            "progress": 100,
            "data": result,
            "message": "Analysis complete!",
        })

    async def send_error(self, job_id: str, error: str):
        """Send an error event."""
        self.job_errors[job_id] = error
        self.job_progress.pop(job_id, None)
        await self.send_to_job(job_id, {
            "event": "error",
            "job_id": job_id,
            "progress": -1,
            "message": f"Analysis failed: {error}",
        })

    def get_active_job_count(self) -> int:
        return len(self.active_connections)


# Global singleton — shared across all routes
manager = ConnectionManager()


@router.websocket("/ws/{job_id}")
async def websocket_endpoint(websocket: WebSocket, job_id: str):
    """
    WebSocket endpoint for receiving real-time analysis updates.
    
    URL format: ws://localhost:8000/ws/{job_id}
    
    Message types from server:
    - "connected": Handshake confirmation
    - "progress": Pipeline stage progress (0-100%)
    - "result": Final analysis result (complete data)
    - "error": Something went wrong
    - "pong": Response to client ping (keep-alive)
    
    Messages from client:
    - {"type": "ping"}: Keep-alive heartbeat
    - {"type": "cancel"}: Cancel the analysis job
    """
    await manager.connect(websocket, job_id)
    
    try:
        # Keep connection open — listen for client messages
        while True:
            try:
                # Wait for client messages (with timeout for keep-alive)
                data = await asyncio.wait_for(
                    websocket.receive_json(),
                    timeout=60.0  # 60s timeout — client should ping periodically
                )
                
                msg_type = data.get("type", "")
                
                if msg_type == "ping":
                    # Respond to keep-alive
                    await websocket.send_json({
                        "event": "pong",
                        "job_id": job_id,
                        "timestamp": str(asyncio.get_event_loop().time()),
                    })
                
                elif msg_type == "cancel":
                    # Client wants to cancel the job
                    log.info(f"⚠️  Job cancellation requested: {job_id}")
                    await websocket.send_json({
                        "event": "cancelled",
                        "job_id": job_id,
                        "message": "Job cancellation requested"
                    })
                    break
                    
            except asyncio.TimeoutError:
                # No message for 60s — send server-side ping to check if client is alive
                try:
                    await websocket.send_json({"event": "ping", "job_id": job_id})
                except Exception:
                    break  # Client disconnected
                    
    except WebSocketDisconnect:
        log.info(f"🔌 Client disconnected: {job_id[:8]}...")
    except Exception as e:
        log.error(f"WebSocket error: {e}")
    finally:
        manager.disconnect(websocket, job_id)


@router.get("/ws/status")
async def websocket_status():
    """Health check for WebSocket system."""
    return {
        "active_jobs": manager.get_active_job_count(),
        "status": "operational"
    }
