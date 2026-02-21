"""
Database configuration and initialization for YOLO Generator
Creates MySQL database and tables if they don't exist
"""

import mysql.connector
from mysql.connector import Error
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Database configuration
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = int(os.getenv("DB_PORT", 3306))
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")  # No password by default
DB_NAME = os.getenv("DB_NAME", "yolo_generator")


def create_database():
    """Create database if it doesn't exist"""
    try:
        # Connect without database
        connection = mysql.connector.connect(
            host=DB_HOST,
            port=DB_PORT,
            user=DB_USER,
            password=DB_PASSWORD
        )
        
        cursor = connection.cursor()
        
        # Create database
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS {DB_NAME}")
        print(f"✓ Database '{DB_NAME}' ready")
        
        cursor.close()
        connection.close()
        return True
        
    except Error as e:
        print(f"✗ Error creating database: {e}")
        return False


def get_db_connection():
    """Get database connection"""
    try:
        connection = mysql.connector.connect(
            host=DB_HOST,
            port=DB_PORT,
            user=DB_USER,
            password=DB_PASSWORD,
            database=DB_NAME
        )
        return connection
    except Error as e:
        print(f"✗ Error connecting to database: {e}")
        return None


def create_tables():
    """Create all required tables"""
    connection = get_db_connection()
    if not connection:
        return False
    
    try:
        cursor = connection.cursor()
        
        # Users table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(255) UNIQUE NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                role ENUM('admin', 'user', 'viewer') DEFAULT 'user',
                is_verified BOOLEAN DEFAULT FALSE,
                verification_code VARCHAR(6),
                verification_code_expires TIMESTAMP NULL,
                reset_token VARCHAR(255),
                reset_token_expires TIMESTAMP NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_username (username),
                INDEX idx_email (email),
                INDEX idx_role (role)
            )
        """)
        print("✓ Table 'users' ready")
        
        # Datasets table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS datasets (
                id VARCHAR(255) PRIMARY KEY,
                user_id INT,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                classes JSON NOT NULL,
                total_images INT DEFAULT 0,
                annotated_images INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_user_id (user_id),
                INDEX idx_created_at (created_at)
            )
        """)
        print("✓ Table 'datasets' ready")
        
        # Dataset images table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS dataset_images (
                id VARCHAR(255) PRIMARY KEY,
                dataset_id VARCHAR(255) NOT NULL,
                filename VARCHAR(255) NOT NULL,
                original_name VARCHAR(255),
                path VARCHAR(500) NOT NULL,
                annotated BOOLEAN DEFAULT FALSE,
                split ENUM('train', 'val', 'test') NULL,
                uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (dataset_id) REFERENCES datasets(id) ON DELETE CASCADE,
                INDEX idx_dataset_id (dataset_id),
                INDEX idx_annotated (annotated),
                INDEX idx_split (split)
            )
        """)
        print("✓ Table 'dataset_images' ready")
        
        # Annotations table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS annotations (
                id VARCHAR(255) PRIMARY KEY,
                dataset_id VARCHAR(255) NOT NULL,
                image_id VARCHAR(255) NOT NULL,
                image_name VARCHAR(255) NOT NULL,
                width INT NOT NULL,
                height INT NOT NULL,
                boxes JSON NOT NULL,
                split ENUM('train', 'val', 'test') NULL,
                status ENUM('unlabeled', 'predicted', 'annotated', 'reviewed') DEFAULT 'annotated',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (dataset_id) REFERENCES datasets(id) ON DELETE CASCADE,
                FOREIGN KEY (image_id) REFERENCES dataset_images(id) ON DELETE CASCADE,
                INDEX idx_dataset_id (dataset_id),
                INDEX idx_image_id (image_id),
                INDEX idx_status (status)
            )
        """)
        print("✓ Table 'annotations' ready")

        # Dataset Versions table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS dataset_versions (
                id VARCHAR(255) PRIMARY KEY,
                dataset_id VARCHAR(255) NOT NULL,
                version_number INT NOT NULL,
                name VARCHAR(255),
                preprocessing JSON,
                augmentations JSON,
                total_images INT DEFAULT 0,
                yaml_path VARCHAR(500),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (dataset_id) REFERENCES datasets(id) ON DELETE CASCADE,
                INDEX idx_dataset_id (dataset_id)
            )
        """)
        print("✓ Table 'dataset_versions' ready")

        # Dataset Version Images table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS dataset_version_images (
                id VARCHAR(255) PRIMARY KEY,
                version_id VARCHAR(255) NOT NULL,
                original_image_id VARCHAR(255),
                filename VARCHAR(255) NOT NULL,
                path VARCHAR(500) NOT NULL,
                split ENUM('train', 'val', 'test') DEFAULT 'train',
                width INT NOT NULL,
                height INT NOT NULL,
                boxes JSON,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (version_id) REFERENCES dataset_versions(id) ON DELETE CASCADE,
                FOREIGN KEY (original_image_id) REFERENCES dataset_images(id) ON DELETE SET NULL,
                INDEX idx_version_id (version_id),
                INDEX idx_split (split)
            )
        """)
        print("✓ Table 'dataset_version_images' ready")
        
        # Training jobs table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS training_jobs (
                id VARCHAR(255) PRIMARY KEY,
                user_id INT,
                dataset_id VARCHAR(255),
                model_name VARCHAR(255) NOT NULL,
                status ENUM('pending', 'running', 'completed', 'failed') DEFAULT 'pending',
                progress INT DEFAULT 0,
                epochs INT NOT NULL,
                batch_size INT NOT NULL,
                config JSON,
                results JSON,
                error_message TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (dataset_id) REFERENCES datasets(id) ON DELETE SET NULL,
                INDEX idx_user_id (user_id),
                INDEX idx_status (status),
                INDEX idx_created_at (created_at)
            )
        """)
        print("✓ Table 'training_jobs' ready")
        
        # Inference history table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS inference_history (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT,
                model_name VARCHAR(255) NOT NULL,
                image_name VARCHAR(255),
                num_detections INT DEFAULT 0,
                confidence_threshold FLOAT,
                results JSON,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_user_id (user_id),
                INDEX idx_created_at (created_at)
            )
        """)
        print("✓ Table 'inference_history' ready")
        
        # Models table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS models (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT,
                name VARCHAR(255) NOT NULL,
                path VARCHAR(500) NOT NULL,
                type ENUM('pretrained', 'custom') DEFAULT 'custom',
                dataset_id VARCHAR(255),
                training_job_id VARCHAR(255),
                metrics JSON,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_user_id (user_id),
                INDEX idx_type (type)
            )
        """)
        print("✓ Table 'models' ready")
        
        # System logs table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS system_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                level ENUM('INFO', 'WARNING', 'ERROR', 'CRITICAL') DEFAULT 'INFO',
                message TEXT NOT NULL,
                details JSON,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_level (level),
                INDEX idx_created_at (created_at)
            )
        """)
        print("✓ Table 'system_logs' ready")
        
        connection.commit()
        cursor.close()
        connection.close()
        
        print("\n✅ All tables created successfully!")
        return True
        
    except Error as e:
        print(f"\n✗ Error creating tables: {e}")
        return False


def initialize_database():
    """Initialize database and tables"""
    print("🔧 Initializing MySQL database...")
    print(f"📍 Host: {DB_HOST}:{DB_PORT}")
    print(f"📊 Database: {DB_NAME}\n")
    
    if create_database():
        if create_tables():
            print("\n🎉 Database initialization complete!")
            return True
    
    print("\n❌ Database initialization failed!")
    return False


def check_db_connection():
    """Check if database connection is working"""
    connection = get_db_connection()
    if connection:
        connection.close()
        return True
    return False


if __name__ == "__main__":
    initialize_database()

