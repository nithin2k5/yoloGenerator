#!/bin/bash

cd "$(dirname "$0")"

# Activate virtual environment
if [ ! -d "venv" ]; then
    echo "❌ Virtual environment not found. Run ./setup.sh first"
    exit 1
fi

source venv/bin/activate

# Start the backend
echo "🚀 Starting FastAPI backend on http://localhost:8000"
echo "📚 API Documentation: http://localhost:8000/docs"
echo ""

uvicorn main:app --host 0.0.0.0 --port 8000 --reload

