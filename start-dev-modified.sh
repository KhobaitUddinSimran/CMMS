#!/bin/bash

# Frontend and Docker Integration Quick Start
# This script helps test the complete frontend-backend integration

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PROJECT_ROOT="/Users/khobaituddinsimran/Desktop/ACTIVE WORK/CMMS"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Frontend & Docker Integration Quick Start${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check prerequisites
echo -e "${YELLOW}1. Checking prerequisites...${NC}"

check_command() {
  if ! command -v $1 &> /dev/null; then
    echo -e "${RED}❌ $1 is not installed${NC}"
    return 1
  else
    echo -e "${GREEN}✅ $1 is installed${NC}"
    return 0
  fi
}

check_command "python3" || exit 1
check_command "node" || exit 1
check_command "npm" || exit 1

echo ""
echo -e "${YELLOW}2. Select testing mode:${NC}"
echo "1. Development Mode (Local)"
echo "2. Docker Mode (Containerized)"
echo -n "Enter choice (1 or 2): "
read -r MODE

if [ "$MODE" = "1" ]; then
  echo ""
  echo -e "${YELLOW}3. Starting in Development Mode...${NC}"
  echo ""
  
  # Kill any existing processes on ports 8000 and 3000
  echo -e "${YELLOW}Cleaning up ports 8000 and 3000...${NC}"
  lsof -ti :8000 | xargs kill -9 2>/dev/null || true
  lsof -ti :3000 | xargs kill -9 2>/dev/null || true
  sleep 2
  
  # Start backend
  echo -e "${YELLOW}Starting FastAPI backend...${NC}"
  cd "$PROJECT_ROOT/backend"
  python3 -m pip install -q -r requirements.txt 2>/dev/null || true
  python3 -m uvicorn main:app --reload --host 0.0.0.0 --port 8000 > /tmp/api.log 2>&1 &
  API_PID=$!
  echo -e "${GREEN}Backend PID: $API_PID${NC}"
  
  sleep 3
  
  # Test backend health
  echo -e "${YELLOW}Testing API health...${NC}"
  if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ API is healthy${NC}"
  else
    echo -e "${RED}❌ API is not responding${NC}"
    kill $API_PID 2>/dev/null || true
    exit 1
  fi
  
  # Start frontend
  echo -e "${YELLOW}Starting Next.js frontend...${NC}"
  cd "$PROJECT_ROOT/frontend"
  npm ci --silent 2>/dev/null || npm install --silent
  npm run dev > /tmp/frontend.log 2>&1 &
  FRONTEND_PID=$!
  echo -e "${GREEN}Frontend PID: $FRONTEND_PID${NC}"
  
  sleep 5
  
  # Test frontend
  echo -e "${YELLOW}Testing frontend...${NC}"
  if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend is running${NC}"
  else
    echo -e "${RED}⚠️  Frontend is starting (check http://localhost:3000)${NC}"
  fi
  
  echo ""
  echo -e "${GREEN}========================================${NC}"
  echo -e "${GREEN}✅ Development environment is running!${NC}"
  echo -e "${GREEN}========================================${NC}"
  echo ""
  echo -e "Frontend: ${BLUE}http://localhost:3000${NC}"
  echo -e "API: ${BLUE}http://localhost:8000${NC}"
  echo -e "API Docs: ${BLUE}http://localhost:8000/docs${NC}"
  echo ""
  echo -e "${YELLOW}Test Credentials:${NC}"
  echo "  Email: student@graduate.utm.my"
  echo "  Password: password123"
  echo ""
  echo -e "${YELLOW}To stop services:${NC}"
  echo "  kill $API_PID      # Stop backend"
  echo "  kill $FRONTEND_PID # Stop frontend"
  echo ""
  echo -e "${YELLOW}Logs:${NC}"
  echo "  tail -f /tmp/api.log"
  echo "  tail -f /tmp/frontend.log"
  echo ""
  
  # Keep script running
  wait $API_PID 2>/dev/null || true

elif [ "$MODE" = "2" ]; then
  echo ""
  echo -e "${YELLOW}3. Starting in Docker Mode...${NC}"
  echo ""
  
  cd "$PROJECT_ROOT"
  
  # Check Docker
  echo -e "${YELLOW}Checking Docker...${NC}"
  if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed${NC}"
    exit 1
  fi
  echo -e "${GREEN}✅ Docker is installed${NC}"
  
  if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed${NC}"
    exit 1
  fi
  echo -e "${GREEN}✅ Docker Compose is installed${NC}"
  
  echo ""
  echo -e "${YELLOW}Building Docker images...${NC}"
  docker-compose build 2>&1 | tail -10
  
  echo ""
  echo -e "${YELLOW}Starting services...${NC}"
  docker-compose up -d
  
  echo ""
  echo -e "${YELLOW}Waiting for services to be ready...${NC}"
  sleep 10
  
  # Check services
  echo -e "${YELLOW}Checking service health...${NC}"
  
  if docker-compose ps | grep "Up" > /dev/null; then
    echo -e "${GREEN}✅ Services are running${NC}"
  else
    echo -e "${RED}❌ Some services failed to start${NC}"
    docker-compose logs
    exit 1
  fi
  
  echo ""
  echo -e "${GREEN}========================================${NC}"
  echo -e "${GREEN}✅ Docker services are running!${NC}"
  echo -e "${GREEN}========================================${NC}"
  echo ""
  echo -e "Frontend: ${BLUE}http://localhost:3000${NC}"
  echo -e "API: ${BLUE}http://localhost:8000${NC}"
  echo -e "API Docs: ${BLUE}http://localhost:8000/docs${NC}"
  echo -e "Nginx: ${BLUE}http://localhost${NC}"
  echo ""
  echo -e "${YELLOW}Test Credentials:${NC}"
  echo "  Email: student@graduate.utm.my"
  echo "  Password: password123"
  echo ""
  echo -e "${YELLOW}Useful Commands:${NC}"
  echo "  docker-compose logs -f              # View logs"
  echo "  docker-compose ps                   # View services"
  echo "  docker-compose down                 # Stop services"
  echo "  docker-compose down -v              # Stop and remove volumes"
  echo ""
else
  echo -e "${RED}Invalid choice${NC}"
  exit 1
fi
