#!/bin/bash

echo "🚀 Starting YOLO Generator Platform..."

# Check if Python backend is running
if ! lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null ; then
    echo "📦 Starting Python Backend on port 8000..."
    cd backend
    
    # Check if virtual environment exists
    if [ ! -d "venv" ]; then
        echo "Creating virtual environment..."
        python3 -m venv venv
    fi
    
    # Activate virtual environment
    source venv/bin/activate
    
    # Install requirements
    echo "Installing Python dependencies..."
    pip install -r requirements.txt
    
    # Start FastAPI backend
    echo "Starting FastAPI server..."
    python main.py &
    BACKEND_PID=$!
    echo "✅ Backend started with PID: $BACKEND_PID"
    
    cd ..
else
    echo "✅ Backend already running on port 8000"
fi

# Check if Next.js frontend is running
if ! lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    echo "🎨 Starting Next.js Frontend on port 3000..."
    cd yologen
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        echo "Installing npm dependencies..."
        npm install
    fi
    
    # Start Next.js dev server
    npm run dev &
    FRONTEND_PID=$!
    echo "✅ Frontend started with PID: $FRONTEND_PID"
    
    cd ..
else
    echo "✅ Frontend already running on port 3000"
fi

echo ""
echo "🎉 YOLO Generator is ready!"
echo "📱 Frontend: http://localhost:3000"
echo "🔧 Backend API: http://localhost:8000"
echo "📚 API Docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for user interrupt
wait

