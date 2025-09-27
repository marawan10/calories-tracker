@echo off
REM Start backend
start cmd /k "cd /d C:\Users\Marwan Mokhtar\Desktop\calories-tracker-main\backend && npm run dev"

REM Wait 2 seconds
timeout /t 2 /nobreak >nul

REM Start frontend
start cmd /k "cd /d C:\Users\Marwan Mokhtar\Desktop\calories-tracker-main\frontend && npm run dev"
