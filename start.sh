#!/bin/bash
# TravelGPT Startup Script - Chạy cả BE và FE

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
FRONTEND_DIR="$SCRIPT_DIR/frontend"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}  TravelGPT Startup${NC}"
echo -e "${YELLOW}========================================${NC}"

# Kill existing processes
echo -e "${YELLOW}Stopping existing servers...${NC}"
pkill -f "uvicorn.*3008" 2>/dev/null || true
pkill -f "next.*dev" 2>/dev/null || true
sleep 2

# Activate conda and start backend
echo -e "${GREEN}Starting Backend (port 3008)...${NC}"
cd "$BACKEND_DIR"
source /opt/anaconda/etc/profile.d/conda.sh 2>/dev/null || source ~/anaconda3/etc/profile.d/conda.sh 2>/dev/null
conda activate travelgpt

python -m uvicorn app.main:app --host 0.0.0.0 --port 3008 > /tmp/travelgpt_backend.log 2>&1 &
BACKEND_PID=$!

echo "Backend PID: $BACKEND_PID"

# Wait for backend
echo -e "${YELLOW}Waiting for backend to be ready...${NC}"
for i in {1..30}; do
    if curl -s http://localhost:3008/api/v1/tours > /dev/null 2>&1; then
        echo -e "${GREEN}Backend is ready!${NC}"
        break
    fi
    sleep 1
done

# Start frontend
echo -e "${GREEN}Starting Frontend (port 3002)...${NC}"
cd "$FRONTEND_DIR"
PORT=3002 npm run dev > /tmp/travelgpt_frontend.log 2>&1 &
FRONTEND_PID=$!

echo "Frontend PID: $FRONTEND_PID"

# Wait for frontend
echo -e "${YELLOW}Waiting for frontend to be ready...${NC}"
for i in {1..30}; do
    if curl -s http://localhost:3002 > /dev/null 2>&1; then
        echo -e "${GREEN}Frontend is ready!${NC}"
        break
    fi
    sleep 1
done

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  TravelGPT is running!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "Frontend: ${YELLOW}http://localhost:3002${NC}"
echo -e "Backend:  ${YELLOW}http://localhost:3008${NC}"
echo ""
echo -e "Logs:"
echo -e "  Backend:  tail -f /tmp/travelgpt_backend.log"
echo -e "  Frontend: tail -f /tmp/travelgpt_frontend.log"
echo ""
echo -e "Press Ctrl+C to stop all servers"
echo -e "${GREEN}========================================${NC}"

# Wait for interrupt
wait
