@echo off
echo ========================================
echo   Birzha Kanaliv Startup Script
echo ========================================
echo.

cd /d %~dp0

REM Check if PostgreSQL is running
echo [1/4] Checking PostgreSQL connection...
cd server
call npx sequelize-cli db:migrate:status >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Cannot connect to PostgreSQL. Make sure:
    echo   1. PostgreSQL is running
    echo   2. Database 'youtoobe' exists
    echo   3. server/.env is configured correctly
    echo.
    echo Create database with: CREATE DATABASE youtoobe;
    pause
    exit /b 1
)
echo    OK - Database connected

REM Run migrations
echo.
echo [2/4] Running migrations...
call npx sequelize-cli db:migrate
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Migration failed
    pause
    exit /b 1
)
echo    OK - Migrations complete

REM Run seeds
echo.
echo [3/4] Running seeds...
call npx sequelize-cli db:seed:all
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Seed failed
    pause
    exit /b 1
)
echo    OK - Seeds complete

REM Start apps
echo.
echo [4/4] Starting apps...
echo.
echo ========================================
echo   Backend:        http://localhost:3001
echo   User Frontend:  http://localhost:5173
echo   Admin Frontend: http://localhost:5174
echo ========================================
echo.
echo Press Ctrl+C to stop current app window
echo.

cd ..

REM Start backend in new window
start "Youtoobe Backend" cmd /c "cd server && npm run dev"

REM Wait a bit for backend to start
timeout /t 3 /nobreak >nul

REM Start admin frontend in new window
start "Youtoobe Admin Frontend" cmd /c "cd admin-frontend && npm run dev"

REM Start user frontend in current window
cd client
call npm run dev
