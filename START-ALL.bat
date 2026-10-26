@echo off
title Helyra Fullstack Launcher
cd /d "%~dp0"

echo ===================================================
echo         HELYRA AI - FRONTEND + BACKEND
echo ===================================================
echo.

:: 1. Start Backend on port 5000
echo [1/3] Starting Backend Server (Port 5000)...
start "Helyra Backend (Port 5000)" /min cmd /c "cd /d ""%~dp0backend"" && npm run dev"

:: 2. Start Frontend on port 3000
echo [2/3] Starting Frontend Vite App (Port 3000)...
start "Helyra Frontend (Port 3000)" /min cmd /c "cd /d ""%~dp0frontend"" && npm run dev"

echo Waiting for servers to initialize...
timeout /t 5 /nobreak >nul

:: 3. Open App
echo [3/3] Opening App...

where msedge >nul 2>&1
if %errorlevel% equ 0 (
    start msedge --app=http://localhost:3000
    goto done
)

where chrome >nul 2>&1
if %errorlevel% equ 0 (
    start chrome --app=http://localhost:3000
    goto done
)

start http://localhost:3000

:done
echo.
echo ===================================================
echo  Frontend: http://localhost:3000
echo  Backend:  http://localhost:5000
echo.
echo  Both servers are running in the background!
echo  To stop them, double-click STOP-ALL.bat
echo ===================================================
echo.
timeout /t 3 >nul
exit /b 0
