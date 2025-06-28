Write-Host "Starting Notepad Services..." -ForegroundColor Green
Write-Host ""

# Function to check if a port is in use
function Test-Port {
    param($Port)
    try {
        $connection = New-Object System.Net.Sockets.TcpClient
        $connection.Connect("localhost", $Port)
        $connection.Close()
        return $true
    }
    catch {
        return $false
    }
}

# Check if ports are available
if (Test-Port 8001) {
    Write-Host "Warning: Port 8001 is already in use. Transcription service may not start properly." -ForegroundColor Yellow
}

if (Test-Port 8000) {
    Write-Host "Warning: Port 8000 is already in use. Main backend may not start properly." -ForegroundColor Yellow
}

Write-Host "Starting Transcription Service on port 8001..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd transcription-service; poetry run python main.py" -WindowStyle Normal

Write-Host "Waiting 3 seconds for transcription service to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

Write-Host "Starting Main Backend on port 8000..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; poetry run python main.py" -WindowStyle Normal

Write-Host ""
Write-Host "Services are starting..." -ForegroundColor Green
Write-Host "- Main Backend: http://localhost:8000" -ForegroundColor White
Write-Host "- Transcription Service: http://localhost:8001" -ForegroundColor White
Write-Host "- Frontend: http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to close this window..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") 