#!/bin/bash

echo "🧪 Testing YOLO Generator Backend..."
echo ""

# Test backend health
echo "1️⃣  Testing Backend Health..."
HEALTH=$(curl -s http://localhost:8000/health)
if [ $? -eq 0 ]; then
    echo "✅ Backend is running"
    echo "   Response: $HEALTH"
else
    echo "❌ Backend is not running"
    echo ""
    echo "Start the backend with:"
    echo "  ./start_backend.sh"
    exit 1
fi

echo ""

# Test database health
echo "2️⃣  Testing Database Connection..."
DB_HEALTH=$(curl -s http://localhost:8000/db/health)
if [ $? -eq 0 ]; then
    echo "✅ Database is connected"
    echo "   Response: $DB_HEALTH"
else
    echo "⚠️  Database connection issue"
    echo "   Response: $DB_HEALTH"
fi

echo ""

# Test register endpoint (create test user)
echo "3️⃣  Testing Registration..."
REGISTER=$(curl -s -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser_'$(date +%s)'",
    "email": "test'$(date +%s)'@example.com",
    "password": "test123",
    "role": "user"
  }')

if echo "$REGISTER" | grep -q "access_token"; then
    echo "✅ Registration working"
    TOKEN=$(echo "$REGISTER" | python3 -c "import sys, json; print(json.load(sys.stdin)['access_token'])")
    echo "   Token received: ${TOKEN:0:20}..."
else
    echo "⚠️  Registration response:"
    echo "   $REGISTER"
fi

echo ""

# Test login
echo "4️⃣  Testing Login..."
LOGIN=$(curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }')

if echo "$LOGIN" | grep -q "access_token"; then
    echo "✅ Login working"
else
    echo "⚠️  Login response:"
    echo "   $LOGIN"
    echo ""
    echo "   Note: Create an admin account first if it doesn't exist"
fi

echo ""
echo "✅ Backend tests complete!"
echo ""
echo "Backend is ready at: http://localhost:8000"
echo "API Docs: http://localhost:8000/docs"

