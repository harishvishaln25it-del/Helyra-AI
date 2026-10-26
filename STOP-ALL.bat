@echo off
title Stop Helyra Fullstack
cd /d "%~dp0"
echo Stopping Helyra servers on ports 3000 and 5000...

for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do (
    taskkill /F /PID %%a >nul 2>&1
)

for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5000 ^| findstr LISTENING') do (
    taskkill /F /PID %%a >nul 2>&1
)

echo Both Frontend and Backend servers have been stopped.
timeout /t 2 >nul
exit /b 0
