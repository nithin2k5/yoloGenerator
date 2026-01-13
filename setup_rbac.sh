#!/bin/bash

echo "🔐 Setting up RBAC for YOLO Generator..."
echo ""

cd /Users/nithinkumark/Developer/next/yoloGenerator/backend

# Activate virtual environment
echo "📦 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📥 Installing RBAC dependencies..."
pip install -q PyJWT bcrypt python-jose[cryptography]

echo "✅ Dependencies installed!"
echo ""

# Update database
echo "🗄️ Updating database schema..."
python3 << EOF
from database import get_db_connection

connection = get_db_connection()
if connection:
    try:
        cursor = connection.cursor()
        
        # Check if role column exists
        cursor.execute("SHOW COLUMNS FROM users LIKE 'role'")
        result = cursor.fetchone()
        
        if not result:
            print("Adding 'role' column to users table...")
            cursor.execute("""
                ALTER TABLE users 
                ADD COLUMN role ENUM('admin', 'user', 'viewer') DEFAULT 'user' AFTER password_hash,
                ADD INDEX idx_role (role)
            """)
            connection.commit()
            print("✓ Role column added successfully!")
        else:
            print("✓ Role column already exists")
        
        cursor.close()
        connection.close()
        
        print("\n✅ Database updated successfully!")
    except Exception as e:
        print(f"❌ Error: {e}")
else:
    print("❌ Database connection failed")
EOF

echo ""
echo "🎉 RBAC setup complete!"
echo ""
echo "Next steps:"
echo "  1. Restart backend: ./run_backend.sh"
echo "  2. Go to http://localhost:3000"
echo "  3. Click 'Sign Up' to create your first account"
echo ""
echo "Test accounts you can create:"
echo "  Admin:  username=admin, password=admin123, role=admin"
echo "  User:   username=user, password=user123, role=user"
echo "  Viewer: username=viewer, password=viewer123, role=viewer"
echo ""

