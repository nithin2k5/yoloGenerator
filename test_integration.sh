#!/bin/bash

echo "🔍 Testing YOLO Generator Integration..."
echo ""

# Test Frontend
echo "1️⃣ Testing Frontend..."
if curl -s http://localhost:3001 > /dev/null; then
    echo "   ✅ Frontend is running on http://localhost:3001"
else
    echo "   ❌ Frontend is not running"
fi

echo ""

# Test Backend
echo "2️⃣ Testing Backend..."
if curl -s http://localhost:8000/health > /dev/null; then
    echo "   ✅ Backend is running on http://localhost:8000"
    echo "   📊 Backend response:"
    curl -s http://localhost:8000/health | python3 -m json.tool
else
    echo "   ❌ Backend is not running"
    echo "   💡 Start backend with: cd backend && source venv/bin/activate && python main.py"
fi

echo ""

# Test API Endpoints
echo "3️⃣ Testing API Endpoints..."
BACKEND_URL="http://localhost:8000"

endpoints=(
    "/api/inference/models"
    "/api/training/jobs"
    "/api/models/list"
    "/api/annotations/datasets/list"
)

for endpoint in "${endpoints[@]}"; do
    if curl -s "${BACKEND_URL}${endpoint}" > /dev/null 2>&1; then
        echo "   ✅ ${endpoint}"
    else
        echo "   ❌ ${endpoint} (backend not running)"
    fi
done

echo ""
echo "🎯 Integration test complete!"
echo ""
echo "📚 Quick Links:"
echo "   Frontend:  http://localhost:3001"
echo "   Backend:   http://localhost:8000"
echo "   API Docs:  http://localhost:8000/docs"

