$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "[VoltIQ] Starting backend..."
$backend = Start-Process -FilePath "$ScriptDir\.venv\Scripts\uvicorn.exe" `
    -ArgumentList "main:app --port 8000 --reload" `
    -WorkingDirectory "$ScriptDir\backend" `
    -PassThru

Start-Sleep -Seconds 2

Write-Host "[VoltIQ] Starting frontend..."
$frontend = Start-Process -FilePath "pnpm" `
    -ArgumentList "dev" `
    -WorkingDirectory "$ScriptDir\frontend" `
    -PassThru

Write-Host "[VoltIQ] Backend PID: $($backend.Id) | Frontend PID: $($frontend.Id)"
Write-Host "[VoltIQ] Backend: http://localhost:8000 | Frontend: http://localhost:3000"
Write-Host "[VoltIQ] Press Ctrl+C to stop both."

try {
    Wait-Process -Id $backend.Id, $frontend.Id
} finally {
    Stop-Process -Id $backend.Id, $frontend.Id -Force -ErrorAction SilentlyContinue
    Write-Host "[VoltIQ] Stopped."
}
