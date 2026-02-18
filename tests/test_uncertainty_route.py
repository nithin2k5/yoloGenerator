from fastapi.testclient import TestClient
import sys
import os
from pathlib import Path

# Add server to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../server")))

from app.main import app

client = TestClient(app)

def test_uncertainty_endpoint_exists():
    # Attempt to access with a likely non-existent ID
    # We expect 404 Not Found (Dataset not found) or 200 (if we mock it), 
    # but NOT 404 Not Found (Endpoint not found)
    # Since we are not mocking the DB here, 404 Dataset Not Found verifies the route works.
    
    response = client.get("/api/annotations/datasets/fake-id/uncertainty")
    
    # If the endpoint exists but dataset doesn't, we expect 404 detail="Dataset not found"
    # If the endpoint didn't exist, we'd get 404 "Not Found" (standard FastAPI)
    
    # Actually, let's just check status code. 
    # If endpoint exists, it will execute logic.
    assert response.status_code in [404, 200, 500]
    
    if response.status_code == 404:
        assert response.json()["detail"] == "Dataset not found"
