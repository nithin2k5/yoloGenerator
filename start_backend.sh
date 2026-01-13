#!/bin/bash

echo "🚀 Starting YOLO Generator Backend..."
echo ""

cd /Users/nithinkumark/Developer/next/yoloGenerator/backend

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "❌ Virtual environment not found!"
    echo "Creating virtual environment..."
    python3 -m venv venv
    source venv/bin/activate
    echo "Installing dependencies..."
    pip install -q -r requirements.txt
    echo "✅ Setup complete!"
else
    echo "✅ Virtual environment found"
fi

# Activate virtual environment
source venv/bin/activate

# Check if dependencies are installed
if ! python -c "import fastapi" 2>/dev/null; then
    echo "📦 Installing dependencies..."
    pip install -q -r requirements.txt
fi

# Check if database is initialized
if ! python -c "from database import check_db_connection; exit(0 if check_db_connection() else 1)" 2>/dev/null; then
    echo "⚠️  Database not initialized or not connected"
    echo "Initializing database..."
    python3 database.py
fi

echo ""
echo "✅ Starting FastAPI server..."
echo "📍 Backend: http://localhost:8000"
echo "📚 API Docs: http://localhost:8000/docs"
echo ""

# Start the server
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

