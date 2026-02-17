import sys
import unittest
from pathlib import Path

# Add server directory to path
server_path = Path(__file__).parent.parent / "server"
sys.path.insert(0, str(server_path))

try:
    from utils.dataset_utils import split_dataset_stratified
    from models.trainer import YOLOTrainer
    from models.inference import YOLOInference
except ImportError as e:
    print(f"ImportError: {e}")
    sys.exit(1)

class TestMLImprovements(unittest.TestCase):
    
    def test_stratified_split(self):
        """Test that split_dataset_stratified works and maintains distribution"""
        # Create dummy data
        images = []
        # Class A: 100 images
        for i in range(100):
            images.append({"id": f"A_{i}", "annotations": [{"class_name": "A"}]})
        # Class B: 20 images
        for i in range(20):
            images.append({"id": f"B_{i}", "annotations": [{"class_name": "B"}]})
            
        splits = split_dataset_stratified(images, train_ratio=0.8, val_ratio=0.2, test_ratio=0.0)
        
        train_A = sum(1 for img in splits['train'] if img['annotations'][0]['class_name'] == 'A')
        train_B = sum(1 for img in splits['train'] if img['annotations'][0]['class_name'] == 'B')
        val_A = sum(1 for img in splits['val'] if img['annotations'][0]['class_name'] == 'A')
        val_B = sum(1 for img in splits['val'] if img['annotations'][0]['class_name'] == 'B')
        
        print(f"Train: A={train_A}, B={train_B}")
        print(f"Val: A={val_A}, B={val_B}")
        
        # Check ratios roughly
        self.assertTrue(75 <= train_A <= 85, f"Expected ~80 class A in train, got {train_A}")
        self.assertTrue(15 <= train_B <= 18, f"Expected ~16 class B in train, got {train_B}")
        
    def test_trainer_signature(self):
        """Check if YOLOTrainer.train accepts augmentations"""
        import inspect
        sig = inspect.signature(YOLOTrainer.train)
        self.assertIn("augmentations", sig.parameters)
        
    def test_inference_signature(self):
        """Check if YOLOInference.predict accepts agnostic_nms and augment"""
        import inspect
        sig = inspect.signature(YOLOInference.predict)
        self.assertIn("agnostic_nms", sig.parameters)
        self.assertIn("augment", sig.parameters)

if __name__ == '__main__':
    unittest.main()
