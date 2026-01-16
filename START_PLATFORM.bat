@echo off
REM Start QuizMaster - Both Frontend and Backend
REM This batch file starts both servers in separate windows

setlocal enabledelayedexpansion

echo =====================================================
echo Starting QuizMaster Platform
echo =====================================================
echo.

REM Detect Python (try python, then py)
set "PYTHON_CMD="
python --version >nul 2>&1
if %errorlevel%==0 (
    set "PYTHON_CMD=python"
) else (
    py --version >nul 2>&1
    if %errorlevel%==0 (
        set "PYTHON_CMD=py"
    )
)

if "%PYTHON_CMD%"=="" (
    echo ERROR: Python is not installed or not in PATH (tried "python" and "py").
    pause
    exit /b 1
)

REM Determine backend location: prefer backend\app.py, fallback to root app.py
set "REPO_DIR=%~dp0"
set "BACKEND_DIR="
if exist "%REPO_DIR%backend\app.py" (
    set "BACKEND_DIR=%REPO_DIR%backend"
) else if exist "%REPO_DIR%app.py" (
    set "BACKEND_DIR=%REPO_DIR%"
) else (
    echo ERROR: Could not find backend app.py in "%REPO_DIR%backend" or "%REPO_DIR%".
    pause
    exit /b 1
)

REM Start Backend Server (Port 5000)
echo [1/2] Starting Backend Server on port 5000...
start "QuizMaster Backend" cmd /k "cd /d !BACKEND_DIR! && !PYTHON_CMD! app.py"

REM Wait a moment for backend to start
timeout /t 2 /nobreak >nul

REM Start Frontend Server (Port 8000)
echo [2/2] Starting Frontend Server on port 8000...
start "QuizMaster Frontend" cmd /k "cd /d !REPO_DIR! && !PYTHON_CMD! -m http.server 8000 --bind 127.0.0.1"

REM Wait a moment for frontend to start
timeout /t 2 /nobreak >nul

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
endlocal
