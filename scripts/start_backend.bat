@echo off
title Intelligent Lab Tracker - Flask Backend (Port 5000)
cd /d "%~dp0\..\backend"
echo =====================================================================
echo  Starting Flask REST API Server on http://127.0.0.1:5000
echo  PES University - Intelligent Laboratory Asset & Chemical Tracker
echo =====================================================================
python run.py
pause
