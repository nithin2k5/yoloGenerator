"""
Database service for dataset and annotation operations
"""

import json
from typing import Dict, List, Optional, Any
from datetime import datetime
from database import get_db_connection
from mysql.connector import Error


class DatasetService:
    """Service for dataset database operations"""
    
    @staticmethod
    def create_dataset(dataset_id: str, name: str, classes: List[str], 
                      description: str = "", user_id: Optional[int] = None) -> bool:
        """Create a new dataset in database"""
        connection = get_db_connection()
        if not connection:
            return False
        
        try:
            cursor = connection.cursor()
            cursor.execute("""
                INSERT INTO datasets (id, user_id, name, description, classes, total_images, annotated_images)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (dataset_id, user_id, name, description, json.dumps(classes), 0, 0))
            connection.commit()
            cursor.close()
            connection.close()
            return True
        except Error as e:
            print(f"Error creating dataset: {e}")
            if connection:
                connection.close()
            return False
    
    @staticmethod
    def get_dataset(dataset_id: str) -> Optional[Dict]:
        """Get dataset by ID"""
        connection = get_db_connection()
        if not connection:
            return None
        
        try:
            cursor = connection.cursor(dictionary=True)
            cursor.execute("""
                SELECT id, user_id, name, description, classes, total_images, annotated_images,
                       created_at, updated_at
                FROM datasets WHERE id = %s
            """, (dataset_id,))
            dataset = cursor.fetchone()
            cursor.close()
            connection.close()
            
            if dataset:
                dataset['classes'] = json.loads(dataset['classes'])
                dataset['images'] = DatasetService.get_dataset_images(dataset_id)
            return dataset
        except Error as e:
            print(f"Error getting dataset: {e}")
            if connection:
                connection.close()
            return None
    
    @staticmethod
    def list_datasets(user_id: Optional[int] = None) -> List[Dict]:
        """List all datasets, optionally filtered by user_id"""
        connection = get_db_connection()
        if not connection:
            return []
        
        try:
            cursor = connection.cursor(dictionary=True)
            if user_id:
                cursor.execute("""
                    SELECT id, user_id, name, description, classes, total_images, annotated_images,
                           created_at, updated_at
                    FROM datasets WHERE user_id = %s
                    ORDER BY created_at DESC
                """, (user_id,))
            else:
                cursor.execute("""
                    SELECT id, user_id, name, description, classes, total_images, annotated_images,
                           created_at, updated_at
                    FROM datasets
                    ORDER BY created_at DESC
                """)
            
            datasets = cursor.fetchall()
            cursor.close()
            connection.close()
            
            for dataset in datasets:
                dataset['classes'] = json.loads(dataset['classes'])
                dataset['images'] = DatasetService.get_dataset_images(dataset['id'])
            
            return datasets
        except Error as e:
            print(f"Error listing datasets: {e}")
            if connection:
                connection.close()
            return []
    
    @staticmethod
    def update_dataset(dataset_id: str, **kwargs) -> bool:
        """Update dataset fields"""
        connection = get_db_connection()
        if not connection:
            return False
        
        try:
            cursor = connection.cursor()
            updates = []
            values = []
            
            if 'name' in kwargs:
                updates.append("name = %s")
                values.append(kwargs['name'])
            if 'description' in kwargs:
                updates.append("description = %s")
                values.append(kwargs['description'])
            if 'classes' in kwargs:
                updates.append("classes = %s")
                values.append(json.dumps(kwargs['classes']))
            
            if updates:
                updates.append("updated_at = CURRENT_TIMESTAMP")
                values.append(dataset_id)
                query = f"UPDATE datasets SET {', '.join(updates)} WHERE id = %s"
                cursor.execute(query, values)
                connection.commit()
            
            cursor.close()
            connection.close()
            return True
        except Error as e:
            print(f"Error updating dataset: {e}")
            if connection:
                connection.close()
            return False
    
    @staticmethod
    def delete_dataset(dataset_id: str) -> bool:
        """Delete dataset and all related data"""
        connection = get_db_connection()
        if not connection:
            return False
        
        try:
            cursor = connection.cursor()
            cursor.execute("DELETE FROM datasets WHERE id = %s", (dataset_id,))
            connection.commit()
            cursor.close()
            connection.close()
            return True
        except Error as e:
            print(f"Error deleting dataset: {e}")
            if connection:
                connection.close()
            return False
    
    @staticmethod
    def add_image(dataset_id: str, image_id: str, filename: str, 
                  original_name: str, path: str) -> bool:
        """Add image to dataset"""
        connection = get_db_connection()
        if not connection:
            return False
        
        try:
            cursor = connection.cursor()
            cursor.execute("""
                INSERT INTO dataset_images (id, dataset_id, filename, original_name, path, annotated, split)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (image_id, dataset_id, filename, original_name, path, False, None))
            connection.commit()
            
            # Update total_images count
            cursor.execute("""
                UPDATE datasets 
                SET total_images = (SELECT COUNT(*) FROM dataset_images WHERE dataset_id = %s),
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = %s
            """, (dataset_id, dataset_id))
            connection.commit()
            
            cursor.close()
            connection.close()
            return True
        except Error as e:
            print(f"Error adding image: {e}")
            if connection:
                connection.close()
            return False
    
    @staticmethod
    def get_dataset_images(dataset_id: str) -> List[Dict]:
        """Get all images for a dataset"""
        connection = get_db_connection()
        if not connection:
            return []
        
        try:
            cursor = connection.cursor(dictionary=True)
            cursor.execute("""
                SELECT id, filename, original_name, path, annotated, split, uploaded_at
                FROM dataset_images
                WHERE dataset_id = %s
                ORDER BY uploaded_at ASC
            """, (dataset_id,))
            images = cursor.fetchall()
            cursor.close()
            connection.close()
            return images
        except Error as e:
            print(f"Error getting images: {e}")
            if connection:
                connection.close()
            return []
    
    @staticmethod
    def update_image_split(dataset_id: str, image_id: str, split: Optional[str]) -> bool:
        """Update image split assignment"""
        connection = get_db_connection()
        if not connection:
            return False
        
        try:
            cursor = connection.cursor()
            cursor.execute("""
                UPDATE dataset_images
                SET split = %s
                WHERE id = %s AND dataset_id = %s
            """, (split, image_id, dataset_id))
            connection.commit()
            
            cursor.execute("""
                UPDATE datasets SET updated_at = CURRENT_TIMESTAMP WHERE id = %s
            """, (dataset_id,))
            connection.commit()
            
            cursor.close()
            connection.close()
            return True
        except Error as e:
            print(f"Error updating image split: {e}")
            if connection:
                connection.close()
            return False
    
    @staticmethod
    def mark_image_annotated(dataset_id: str, image_id: str, annotated: bool = True) -> bool:
        """Mark image as annotated"""
        connection = get_db_connection()
        if not connection:
            return False
        
        try:
            cursor = connection.cursor()
            cursor.execute("""
                UPDATE dataset_images
                SET annotated = %s
                WHERE id = %s AND dataset_id = %s
            """, (annotated, image_id, dataset_id))
            connection.commit()
            
            # Update annotated_images count
            cursor.execute("""
                UPDATE datasets 
                SET annotated_images = (SELECT COUNT(*) FROM dataset_images WHERE dataset_id = %s AND annotated = TRUE),
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = %s
            """, (dataset_id, dataset_id))
            connection.commit()
            
            cursor.close()
            connection.close()
            return True
        except Error as e:
            print(f"Error marking image annotated: {e}")
            if connection:
                connection.close()
            return False


class AnnotationService:
    """Service for annotation database operations"""
    
    @staticmethod
    def save_annotation(annotation_id: str, dataset_id: str, image_id: str,
                       image_name: str, width: int, height: int, boxes: List[Dict],
                       split: Optional[str] = None, status: str = "annotated") -> bool:
        """Save annotation to database"""
        connection = get_db_connection()
        if not connection:
            return False
        
        try:
            cursor = connection.cursor()
            # Check if annotation exists
            cursor.execute("SELECT id FROM annotations WHERE id = %s", (annotation_id,))
            exists = cursor.fetchone()
            
            if exists:
                # Update existing
                cursor.execute("""
                    UPDATE annotations
                    SET boxes = %s, width = %s, height = %s, split = %s, status = %s, updated_at = CURRENT_TIMESTAMP
                    WHERE id = %s
                """, (json.dumps(boxes), width, height, split, status, annotation_id))
            else:
                # Insert new
                cursor.execute("""
                    INSERT INTO annotations (id, dataset_id, image_id, image_name, width, height, boxes, split, status)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (annotation_id, dataset_id, image_id, image_name, width, height, json.dumps(boxes), split, status))
            
            connection.commit()
            
            # Mark image as annotated
            DatasetService.mark_image_annotated(dataset_id, image_id, True)
            
            # Update image split if provided
            if split:
                DatasetService.update_image_split(dataset_id, image_id, split)
            
            cursor.close()
            connection.close()
            return True
        except Error as e:
            print(f"Error saving annotation: {e}")
            if connection:
                connection.close()
            return False
    
    @staticmethod
    def get_annotation(dataset_id: str, image_id: str) -> Optional[Dict]:
        """Get annotation for an image"""
        connection = get_db_connection()
        if not connection:
            return None
        
        try:
            cursor = connection.cursor(dictionary=True)
            annotation_id = f"{dataset_id}_{image_id}"
            cursor.execute("""
                SELECT id, dataset_id, image_id, image_name, width, height, boxes, split, status, created_at, updated_at
                FROM annotations
                WHERE id = %s
            """, (annotation_id,))
            annotation = cursor.fetchone()
            cursor.close()
            connection.close()
            
            if annotation:
                annotation['boxes'] = json.loads(annotation['boxes'])
            return annotation
        except Error as e:
            print(f"Error getting annotation: {e}")
            if connection:
                connection.close()
            return None
    
    @staticmethod
    def get_dataset_stats(dataset_id: str) -> Dict:
        """Get dataset statistics"""
        connection = get_db_connection()
        if not connection:
            return {}
        
        try:
            cursor = connection.cursor(dictionary=True)
            
            # Get dataset info
            cursor.execute("""
                SELECT name, classes FROM datasets WHERE id = %s
            """, (dataset_id,))
            dataset = cursor.fetchone()
            
            if not dataset:
                return {}
            
            classes = json.loads(dataset['classes'])
            
            # Get image counts
            cursor.execute("""
                SELECT 
                    COUNT(*) as total_images,
                    SUM(CASE WHEN annotated = TRUE THEN 1 ELSE 0 END) as annotated_images
                FROM dataset_images
                WHERE dataset_id = %s
            """, (dataset_id,))
            counts = cursor.fetchone()
            
            # Get split counts
            cursor.execute("""
                SELECT split, COUNT(*) as count
                FROM dataset_images
                WHERE dataset_id = %s AND split IS NOT NULL
                GROUP BY split
            """, (dataset_id,))
            split_counts = {row['split']: row['count'] for row in cursor.fetchall()}
            
            # Get class counts from annotations
            cursor.execute("""
                SELECT boxes FROM annotations WHERE dataset_id = %s
            """, (dataset_id,))
            all_boxes = []
            for row in cursor.fetchall():
                boxes = json.loads(row['boxes'])
                all_boxes.extend(boxes)
            
            class_counts = {cls: 0 for cls in classes}
            for box in all_boxes:
                class_name = box.get('class_name', '')
                if class_name in class_counts:
                    class_counts[class_name] += 1
            
            cursor.close()
            connection.close()
            
            return {
                "dataset_id": dataset_id,
                "name": dataset['name'],
                "total_images": counts['total_images'] or 0,
                "annotated_images": counts['annotated_images'] or 0,
                "unannotated_images": (counts['total_images'] or 0) - (counts['annotated_images'] or 0),
                "total_classes": len(classes),
                "class_counts": class_counts,
                "split_counts": split_counts,
                "completion_percentage": (
                    (counts['annotated_images'] or 0) / (counts['total_images'] or 1) * 100
                    if counts['total_images'] else 0
                )
            }
        except Error as e:
            print(f"Error getting dataset stats: {e}")
            if connection:
                connection.close()
            return {}
