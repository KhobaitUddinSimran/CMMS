#!/bin/bash

# CMMS Project Startup Script
# Runs both Backend API and Frontend simultaneously
# Usage: ./run-project.sh

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$PROJECT_ROOT/apps/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

echo "================================"
echo "  CMMS Project Startup Script"
echo "================================"
echo ""

# Create logs directory
mkdir -p "$PROJECT_ROOT/logs"

# Function to handle cleanup on exit
cleanup() {
    echo ""
    echo "================================"
    echo "  Shutting down services..."
    echo "================================"
    
    # Kill backend
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
        echo "✓ Backend stopped (PID: $BACKEND_PID)"
    fi
    
    # Kill frontend
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
        echo "✓ Frontend stopped (PID: $FRONTEND_PID)"
    fi
    
    exit 0
}

# Set trap to catch Ctrl+C
trap cleanup SIGINT SIGTERM

echo "Starting Backend..."
cd "$BACKEND_DIR"

# Check if requirements are installed
if ! python3 -c "import fastapi" 2>/dev/null; then
    echo "Installing Python dependencies..."
    python3 -m pip install -q fastapi uvicorn pydantic python-jose email-validator python-multipart python-dotenv 2>/dev/null || true
fi

# Start backend in background
python3 -m uvicorn main:app --reload --host 0.0.0.0 --port 8000 > "$PROJECT_ROOT/logs/backend.log" 2>&1 &
BACKEND_PID=$!
echo "✓ Backend started (PID: $BACKEND_PID)"
echo "  → http://localhost:8000"
echo "  → Docs: http://localhost:8000/docs"
echo ""

# Give backend time to start
sleep 2

echo "Starting Frontend..."
cd "$FRONTEND_DIR"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing npm dependencies..."
    npm install --silent 2>/dev/null || true
fi

# Start frontend in background
npm run dev > "$PROJECT_ROOT/logs/frontend.log" 2>&1 &
FRONTEND_PID=$!
echo "✓ Frontend started (PID: $FRONTEND_PID)"
echo "  → http://localhost:3001"
echo ""

echo "================================"
echo "  Services Running"
echo "================================"
echo ""
echo "  Backend API:  http://localhost:8000"
echo "  Frontend:     http://localhost:3001"
echo "  API Docs:     http://localhost:8000/docs"
echo ""
echo "  Login Credentials:"
echo "    Email: student@graduate.utm.my"
echo "    Password: password@cmsss"
echo ""
echo "  Logs:"
echo "    Backend:  $PROJECT_ROOT/logs/backend.log"
echo "    Frontend: $PROJECT_ROOT/logs/frontend.log"
echo ""
echo "  Press Ctrl+C to stop all services"
echo "================================"
echo ""

# Wait for both processes
wait
