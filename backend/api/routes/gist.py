"""GitHub Gist Export Router"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import httpx
import os
import logging

log = logging.getLogger(__name__)
router = APIRouter()

class GistExportRequest(BaseModel):
    code: str
    filename: str = "generated_code.py"
    description: str = "Generated code from Multimodal Whiteboard Intelligence System"
    token: Optional[str] = None

@router.post("/export")
async def export_to_gist(req: GistExportRequest):
    """
    Export the generated code to GitHub Gist.
    Uses either the user-provided Personal Access Token (PAT) or the system environment GITHUB_TOKEN/GITHUB_PAT.
    Falls back to a mock/dummy path if no token is configured.
    """
    # Try user token, then env token
    token = req.token or os.environ.get("GITHUB_TOKEN") or os.environ.get("GITHUB_PAT")
    
    if not token:
        # Fallback dummy gist path if no token is configured
        log.warning("No GitHub token configured. Returning mock/dummy gist path.")
        # Return a mock Gist URL
        mock_id = "mock_gist_" + os.urandom(8).hex()
        return {
            "success": True,
            "gist_id": mock_id,
            "gist_url": f"https://gist.github.com/anonymous/{mock_id}",
            "is_mock": True,
            "message": "Mock Gist created (configure GITHUB_TOKEN in backend .env to enable real exports)"
        }
        
    try:
        # call github API to create gist
        headers = {
            "Authorization": f"token {token}",
            "Accept": "application/vnd.github.v3+json",
        }
        payload = {
            "description": req.description,
            "public": True,
            "files": {
                req.filename: {
                    "content": req.code
                }
            }
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.github.com/gists",
                headers=headers,
                json=payload
            )
            
            if response.status_code == 201:
                data = response.json()
                return {
                    "success": True,
                    "gist_id": data.get("id"),
                    "gist_url": data.get("html_url"),
                    "is_mock": False,
                    "message": "Gist successfully exported to GitHub!"
                }
            else:
                log.error(f"GitHub Gist API error: {response.status_code} - {response.text}")
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"GitHub API returned error: {response.text}"
                )
                
    except Exception as e:
        log.error(f"Error exporting Gist: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Gist export failed: {str(e)}"
        )
