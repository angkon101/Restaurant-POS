@echo off
title Mini Restaurant POS Launcher
echo ===================================================
echo     Launching Mini Restaurant POS System
echo ===================================================
echo.

:: Check Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not in PATH.
    pause
    exit /b
)

:: Check Node
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH.
    pause
    exit /b
)

:: Seed database if not existing
if not exist "backend\restaurant_pos.db" (
    echo [INFO] First time setup: Initializing and seeding database...
    cd backend
    python seed.py
    cd ..
)

echo [INFO] Starting FastAPI Backend on port 8000...
start "POS Backend (FastAPI)" cmd /k "cd /d %~dp0backend && python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload"

echo [INFO] Starting React Frontend on port 5173...
start "POS Frontend (React)" cmd /k "cd /d %~dp0frontend && npm run dev -- --host"

echo.
echo ===================================================
echo POS is starting up!
echo Counter / Terminal: http://localhost:5173
echo Kitchen Display:    http://localhost:5173 (Click Kitchen tab)
echo Backend API Docs:   http://localhost:8000/docs
echo ===================================================
echo.

