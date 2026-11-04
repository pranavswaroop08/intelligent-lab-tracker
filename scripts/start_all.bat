@echo off
title Intelligent Lab Tracker Launcher
echo Starting Intelligent Laboratory Asset & Chemical Tracking Platform...
start "Flask Backend" cmd /k "%~dp0start_backend.bat"
timeout /t 3 /nobreak >nul
start "React Frontend" cmd /k "%~dp0start_frontend.bat"
echo Both servers started!
echo Frontend: http://localhost:3000
echo Backend API: http://127.0.0.1:5000
