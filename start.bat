@echo off
setlocal

set SCRIPT_DIR=%~dp0

echo [VoltIQ] Starting backend...
start "VoltIQ Backend" cmd /k "cd /d "%SCRIPT_DIR%backend" && "%SCRIPT_DIR%.venv\Scripts\uvicorn.exe" main:app --port 8000 --reload"

timeout /t 2 /nobreak >nul

echo [VoltIQ] Starting frontend...
start "VoltIQ Frontend" cmd /k "cd /d "%SCRIPT_DIR%frontend" && pnpm dev"

echo [VoltIQ] Backend: http://localhost:8000
echo [VoltIQ] Frontend: http://localhost:3000
echo [VoltIQ] Close the opened windows to stop.
