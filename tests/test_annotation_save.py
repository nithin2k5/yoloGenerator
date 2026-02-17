import sys
import asyncio
from pathlib import Path

# Add server directory to path
server_path = Path(__file__).parent.parent / "server"
sys.path.insert(0, str(server_path))

# Mock services to avoid DB dependency for this quick test
from unittest.mock import MagicMock
import sys

# Mock modules before importing routes
sys.modules['database_service'] = MagicMock()
sys.modules['database_service'].DatasetService = MagicMock()
sys.modules['database_service'].AnnotationService = MagicMock()

# Mock return values
sys.modules['database_service'].DatasetService.get_dataset.return_value = {"id": "test_ds", "name": "Test", "classes": ["A"]}
sys.modules['database_service'].AnnotationService.save_annotation.return_value = True

# Import router
try:
    from app.routes.annotations import save_annotation, datasets_db
    # Populate mock DB
    datasets_db["test_ds"] = {"id": "test_ds", "name": "Test", "classes": ["A"], "images": [{"id": "img1", "annotated": False}]}
except ImportError as e:
    print(f"ImportError: {e}")
    sys.exit(1)

async def test_save():
    request = {
        "dataset_id": "test_ds",
        "image_id": "img1",
        "image_name": "test.jpg",
        "width": 100,
        "height": 100,
        "boxes": [{"x": 10, "y": 10, "width": 20, "height": 20, "class_id": 0, "class_name": "A"}],
        "split": "train"
    }
    
    try:
        response = await save_annotation(request)
        print("Success:", response.body)
    except Exception as e:
        print(f"Failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_save())
