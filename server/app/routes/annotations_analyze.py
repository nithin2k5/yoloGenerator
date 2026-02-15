from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from pathlib import Path
import sys
import logging
from dataclasses import asdict

# Add parent directory to path for imports
sys.path.append(str(Path(__file__).parent.parent.parent))
from dataset_analyzer import DatasetAnalyzer

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/datasets/{dataset_id}/analyze")
async def analyze_dataset(dataset_id: str):
    """
    Perform comprehensive dataset analysis for training readiness
    Returns analysis including:
    - Class distribution
    - Object size/aspect ratio analysis
    - Quality metrics
    - Training recommendations
    - Warnings and issues
    """
    try:
        analysis = DatasetAnalyzer.analyze_dataset(dataset_id)
        
        # Convert dataclass to dict for JSON serialization
        result = asdict(analysis)
        
        return JSONResponse(content={
            "success": True,
            "analysis": result
        })
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        import traceback
        logger.error(f"Error analyzing dataset: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
