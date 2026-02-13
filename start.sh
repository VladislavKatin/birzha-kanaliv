#!/bin/bash

echo "========================================"
echo "  ViewExchange/Youtoobe Startup Script"
echo "========================================"
echo ""

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# Check if PostgreSQL is running
echo "[1/4] Checking PostgreSQL connection..."
cd server
npx sequelize-cli db:migrate:status > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "ERROR: Cannot connect to PostgreSQL. Make sure:"
    echo "  1. PostgreSQL is running"
    echo "  2. Database 'youtoobe' exists"
    echo "  3. server/.env is configured correctly"
    echo ""
    echo "Create database with: CREATE DATABASE youtoobe;"
    exit 1
fi
echo "   OK - Database connected"

# Run migrations
echo ""
echo "[2/4] Running migrations..."
npx sequelize-cli db:migrate
if [ $? -ne 0 ]; then
    echo "ERROR: Migration failed"
    exit 1
fi
echo "   OK - Migrations complete"

# Run seeds
echo ""
echo "[3/4] Running seeds..."
npx sequelize-cli db:seed:all
echo "   OK - Seeds complete"

# Start servers
echo ""
echo "[4/4] Starting servers..."
echo ""
echo "========================================"
echo "  Backend:  http://localhost:3001"
echo "  Frontend: http://localhost:5173"
echo "========================================"
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""

cd ..

# Start backend in background
cd server && npm run dev &
BACKEND_PID=$!

# Wait a bit for backend to start
sleep 3

# Start frontend
cd ../client && npm run dev

# Cleanup on exit
trap "kill $BACKEND_PID 2>/dev/null" EXIT
