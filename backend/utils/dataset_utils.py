import yaml
import shutil
from pathlib import Path
from typing import List, Dict, Optional
import os

def create_filtered_dataset(
    original_yaml_path: str, 
    target_dir: str, 
    selected_classes: List[str]
) -> str:
    """
    Create a filtered version of a dataset containing only selected classes.
    
    Args:
        original_yaml_path: Path to the original data.yaml
        target_dir: Directory where the filtered dataset should be created
        selected_classes: List of class names to keep
        
    Returns:
        Path to the new data.yaml file
    """
    original_yaml_path = Path(original_yaml_path)
    target_dir = Path(target_dir)
    target_dir.mkdir(parents=True, exist_ok=True)
    
    # 1. Read original YAML
    with open(original_yaml_path, 'r') as f:
        data_config = yaml.safe_load(f)
        
    original_classes = data_config.get('names', {})
    # Handle if names is a list instead of dict (YOLO supports both)
    if isinstance(original_classes, list):
        original_classes = {i: name for i, name in enumerate(original_classes)}
        
    # 2. Map selected classes to new indices
    # We need to know:
    # - Which original indices to keep
    # - What their new index will be (0..N-1)
    
    keep_indices = []
    new_class_mapping = {} # old_idx -> new_idx
    new_class_names = {} # new_idx -> name
    
    for new_idx, class_name in enumerate(selected_classes):
        # Find original index
        found = False
        for old_idx, old_name in original_classes.items():
            if old_name == class_name:
                keep_indices.append(old_idx)
                new_class_mapping[old_idx] = new_idx
                new_class_names[new_idx] = class_name
                found = True
                break
        
        if not found:
            print(f"Warning: Selected class '{class_name}' not found in original dataset")

    # 3. Setup new directories
    splits = ['train', 'val', 'test']
    
    for split in splits:
        if split not in data_config:
            continue
            
        # Original paths (relative to yaml or absolute)
        # Note: data_config paths might be relative to the yaml file location
        # We assume standard structure: split/images and split/labels
        
        # We'll rely on the standard folder structure relative to the yaml file's parent
        dataset_root = original_yaml_path.parent
        
        src_images_dir = dataset_root / split / "images"
        src_labels_dir = dataset_root / split / "labels"
        
        if not src_images_dir.exists():
            continue
            
        dst_images_dir = target_dir / split / "images"
        dst_labels_dir = target_dir / split / "labels"
        
        dst_images_dir.mkdir(parents=True, exist_ok=True)
        dst_labels_dir.mkdir(parents=True, exist_ok=True)
        
        # 4. Process files
        for label_file in src_labels_dir.glob("*.txt"):
            # Read label to see if it contains any of the selected classes
            with open(label_file, 'r') as f:
                lines = f.readlines()
                
            new_lines = []
            has_selected_class = False
            
            for line in lines:
                parts = line.strip().split()
                if not parts:
                    continue
                    
                class_id = int(parts[0])
                
                if class_id in new_class_mapping:
                    has_selected_class = True
                    new_class_id = new_class_mapping[class_id]
                    # Reconstruct line with new class ID
                    new_line = f"{new_class_id} {' '.join(parts[1:])}\n"
                    new_lines.append(new_line)
            
            # If image has relevant objects, copy image and write new label
            # Option: strict (only images with objects) or loose (keep empty images?)
            # Usually for training we want background images too, but if we are filtering 
            # for specific objects, maybe we only want those?
            # Let's keep images that had annotations. If an image had annotations but none 
            # of the selected ones, it becomes a background image (empty label file).
            # If it was already a background image, we keep it.
            
            # Logic: Always copy image. Write filtered label file.
            
            # Copy Image
            image_name = label_file.stem
            # Try to find extension
            # This is tricky because we don't know the extension from the label file
            # We'll search for the file in images dir
            found_image = False
            for ext in ['.jpg', '.jpeg', '.png', '.bmp', '.webp']:
                src_img = src_images_dir / f"{image_name}{ext}"
                if src_img.exists():
                    shutil.copy2(src_img, dst_images_dir / f"{image_name}{ext}")
                    found_image = True
                    break
            
            if found_image:
                # Write new label file
                with open(dst_labels_dir / label_file.name, 'w') as f:
                    f.writelines(new_lines)
                    
        # Also copy background images (no label file)?
        # For now we iterate based on labels. If there are images without labels (background), 
        # they are skipped in this loop.
        # To better support background images, we should iterate images instead.
        
        # IMPROVED LOOP: Iterate images
        for image_file in src_images_dir.iterdir():
            if image_file.suffix.lower() not in ['.jpg', '.jpeg', '.png', '.bmp', '.webp']:
                continue
                
            label_file = src_labels_dir / f"{image_file.stem}.txt"
            
            new_lines = []
            
            if label_file.exists():
                with open(label_file, 'r') as f:
                    lines = f.readlines()
                
                for line in lines:
                    parts = line.strip().split()
                    if not parts:
                        continue
                    try:
                        class_id = int(float(parts[0])) # float just in case
                        if class_id in new_class_mapping:
                            new_class_id = new_class_mapping[class_id]
                            new_lines.append(f"{new_class_id} {' '.join(parts[1:])}\n")
                    except ValueError:
                        continue
            
            # Copy image
            shutil.copy2(image_file, dst_images_dir / image_file.name)
            
            # Write label file (even if empty - it's a background image for the selected classes)
            with open(dst_labels_dir / f"{image_file.stem}.txt", 'w') as f:
                f.writelines(new_lines)

    # 5. Create new data.yaml
    new_yaml_content = {
        'path': str(target_dir.resolve()),
        'train': 'train/images',
        'val': 'val/images',
        'names': new_class_names,
        'nc': len(new_class_names)
    }
    
    if 'test' in data_config:
        new_yaml_content['test'] = 'test/images'
        
    new_yaml_path = target_dir / 'data.yaml'
    with open(new_yaml_path, 'w') as f:
        yaml.dump(new_yaml_content, f, sort_keys=False)
        
    return str(new_yaml_path)
