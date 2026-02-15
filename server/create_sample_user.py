"""
Script to create a sample user in the database
Run this to create a test user for login
"""

from database import get_db_connection, initialize_database
from rbac import hash_password, Role
import sys

def create_sample_user():
    """Create a sample user in the database"""
    
    # Initialize database first
    print("🔧 Initializing database...")
    initialize_database()
    
    # Get database connection
    connection = get_db_connection()
    if not connection:
        print("❌ Failed to connect to database")
        return False
    
    try:
        cursor = connection.cursor(dictionary=True)
        
        # Check if user already exists
        cursor.execute("SELECT id FROM users WHERE username = %s", ("admin",))
        existing_user = cursor.fetchone()
        
        if existing_user:
            print("⚠️  User 'admin' already exists. Updating password...")
            # Update password
            hashed_password = hash_password("admin123")
            cursor.execute(
                "UPDATE users SET password_hash = %s, role = %s WHERE username = %s",
                (hashed_password, Role.ADMIN, "admin")
            )
            connection.commit()
            print("✅ Password updated for user 'admin'")
        else:
            # Create new user
            hashed_password = hash_password("admin123")
            cursor.execute(
                """
                INSERT INTO users (username, email, password_hash, role)
                VALUES (%s, %s, %s, %s)
                """,
                ("admin", "admin@nebulaml.com", hashed_password, Role.ADMIN)
            )
            connection.commit()
            print("✅ Created user 'admin'")
        
        # Also create a regular user
        cursor.execute("SELECT id FROM users WHERE username = %s", ("user",))
        existing_user = cursor.fetchone()
        
        if existing_user:
            print("⚠️  User 'user' already exists. Updating password...")
            hashed_password = hash_password("user123")
            cursor.execute(
                "UPDATE users SET password_hash = %s WHERE username = %s",
                (hashed_password, "user")
            )
            connection.commit()
            print("✅ Password updated for user 'user'")
        else:
            hashed_password = hash_password("user123")
            cursor.execute(
                """
                INSERT INTO users (username, email, password_hash, role)
                VALUES (%s, %s, %s, %s)
                """,
                ("user", "user@nebulaml.com", hashed_password, Role.USER)
            )
            connection.commit()
            print("✅ Created user 'user'")
        
        # Display all users
        cursor.execute("SELECT id, username, email, role FROM users")
        users = cursor.fetchall()
        
        print("\n📋 Current users in database:")
        print("-" * 60)
        for user in users:
            print(f"  ID: {user['id']}")
            print(f"  Username: {user['username']}")
            print(f"  Email: {user['email']}")
            print(f"  Role: {user['role']}")
            print("-" * 60)
        
        cursor.close()
        connection.close()
        
        print("\n🎉 Sample users created successfully!")
        print("\n📝 Login Credentials:")
        print("=" * 60)
        print("Admin User:")
        print("  Username: admin")
        print("  Password: admin123")
        print("  Role: admin")
        print("=" * 60)
        print("Regular User:")
        print("  Username: user")
        print("  Password: user123")
        print("  Role: user")
        print("=" * 60)
        
        return True
        
    except Exception as e:
        print(f"❌ Error creating user: {e}")
        connection.rollback()
        return False
    finally:
        if connection:
            connection.close()

if __name__ == "__main__":
    success = create_sample_user()
    sys.exit(0 if success else 1)
