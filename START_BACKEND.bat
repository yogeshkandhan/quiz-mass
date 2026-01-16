@echo off
REM QuizMaster Backend Startup Script
REM This script checks for Python and Flask, then starts the backend

echo ========================================
echo   QuizMaster Backend Launcher
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed or not in PATH
    echo.
    echo Please install Python from: https://www.python.org/downloads/
    echo Make sure to check "Add Python to PATH" during installation
    pause
    exit /b 1
)

echo [OK] Python found:
python --version
echo.

REM Check if Flask is installed
python -c "import flask" >nul 2>&1
if errorlevel 1 (
    echo [WARNING] Flask not installed. Installing now...
    pip install flask flask-cors flask-sqlalchemy
    if errorlevel 1 (
        echo [ERROR] Failed to install Flask
        pause
        exit /b 1
    )
    echo [OK] Flask installed successfully
) else (
    echo [OK] Flask is already installed
)

echo.
echo ========================================
echo   Starting Backend Server...
echo ========================================
echo.
echo API URL: http://127.0.0.1:5000/api
echo.
echo Keep this window open while using the app!
echo Press CTRL+C to stop the server
echo.

cd /d "%~dp0backend"
python app.py

pause
