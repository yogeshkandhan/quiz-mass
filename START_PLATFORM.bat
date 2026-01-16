@echo off
REM Start QuizMaster - Both Frontend and Backend
REM This batch file starts both servers in separate windows

echo =====================================================
echo Starting QuizMaster Platform
echo =====================================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    pause
    exit /b 1
)

REM Start Backend Server (Port 5000)
echo [1/2] Starting Backend Server on port 5000...
start "QuizMaster Backend" cmd /k "cd /d %~dp0backend && python app.py"

REM Wait a moment for backend to start
timeout /t 2 /nobreak

REM Start Frontend Server (Port 8000)
echo [2/2] Starting Frontend Server on port 8000...
start "QuizMaster Frontend" cmd /k "cd /d %~dp0 && python -m http.server 8000 --bind 127.0.0.1"

REM Wait a moment for frontend to start
timeout /t 2 /nobreak

REM Open website in browser
echo.
echo =====================================================
echo QuizMaster Platform is Starting
echo =====================================================
echo.
echo Website: http://127.0.0.1:8000
echo Backend: http://127.0.0.1:5000
echo.
echo Demo Login:
echo Email: demo@example.com
echo Password: demo123
echo.
echo Keep both windows open to use the platform
echo =====================================================
echo.

start http://127.0.0.1:8000

pause
