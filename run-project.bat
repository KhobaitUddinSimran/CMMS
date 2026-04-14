@echo off
REM CMMS Project Startup Script (Windows)
REM Runs both Backend API and Frontend simultaneously

setlocal enabledelayedexpansion

set PROJECT_ROOT=%~dp0
set BACKEND_DIR=%PROJECT_ROOT%apps\backend
set FRONTEND_DIR=%PROJECT_ROOT%frontend

echo.
echo ================================
echo   CMMS Project Startup
echo ================================
echo.

REM Create logs directory
if not exist "%PROJECT_ROOT%logs" mkdir "%PROJECT_ROOT%logs"

echo Starting Backend...
cd /d "%BACKEND_DIR%"

REM Start backend in new window
start "CMMS Backend" cmd /k "python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000"

timeout /t 3 /nobreak

echo Starting Frontend...
cd /d "%FRONTEND_DIR%"

REM Start frontend in new window
start "CMMS Frontend" cmd /k "npm run dev"

timeout /t 3 /nobreak

echo.
echo ================================
echo   Services Running
echo ================================
echo.
echo   Backend API:  http://localhost:8000
echo   Frontend:     http://localhost:3001
echo   API Docs:     http://localhost:8000/docs
echo.
echo   Login Credentials:
echo     Email: student@graduate.utm.my
echo     Password: password@cmsss
echo.
echo   Close windows to stop services
echo ================================
echo.

timeout /t 999999
