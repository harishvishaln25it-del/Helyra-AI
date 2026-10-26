@echo off
title Helyra Backend
cd /d "%~dp0backend"
echo Starting Backend API on http://localhost:5000...
npm run dev
pause
