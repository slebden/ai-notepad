Write-Host "Starting Notepad Services with HTTPS..." -ForegroundColor Green
Write-Host ""

# Check if SSL certificates exist
$frontendCert = Test-Path "frontend/localhost.pem"
$backendCert = Test-Path "backend/localhost.pem"
$transcriptionCert = Test-Path "transcription-service/localhost.pem"

if (-not $frontendCert -or -not $backendCert -or -not $transcriptionCert) {
    Write-Host "SSL certificates not found!" -ForegroundColor Red
    Write-Host "Please run generate-ssl-certs.ps1 first to create SSL certificates." -ForegroundColor Red
    Write-Host ""
    Write-Host "Press any key to exit..." -ForegroundColor Gray
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}

Write-Host "SSL certificates found. Starting services..." -ForegroundColor Green
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

# Get local IP address
$localIP = (Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias Ethernet* | Where-Object {$_.IPAddress -notlike "169.254.*"} | Select-Object -First 1).IPAddress
if (-not $localIP) {
    $localIP = (Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias Wi-Fi* | Where-Object {$_.IPAddress -notlike "169.254.*"} | Select-Object -First 1).IPAddress
}
if (-not $localIP) {
    $localIP = "localhost"
}

# Check if ports are available
if (Test-Port 8001) {
    Write-Host "Warning: Port 8001 is already in use. Transcription service may not start properly." -ForegroundColor Yellow
}

if (Test-Port 8000) {
    Write-Host "Warning: Port 8000 is already in use. Main backend may not start properly." -ForegroundColor Yellow
}

Write-Host "Starting Transcription Service on port 8001 (HTTPS)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd transcription-service; poetry run python main.py" -WindowStyle Normal

Write-Host "Waiting 3 seconds for transcription service to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

Write-Host "Starting Main Backend on port 8000 (HTTPS)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; poetry run python main.py" -WindowStyle Normal

Write-Host ""
Write-Host "Services are starting..." -ForegroundColor Green
Write-Host "- Main Backend: https://localhost:8000 or https://$localIP:8000" -ForegroundColor White
Write-Host "- Transcription Service: https://localhost:8001 or https://$localIP:8001" -ForegroundColor White
Write-Host "- Frontend: https://localhost:3000 or https://$localIP:3000" -ForegroundColor White
Write-Host ""
Write-Host "Local Network Access:" -ForegroundColor Cyan
Write-Host "- Frontend: https://$localIP:3000" -ForegroundColor White
Write-Host ""
Write-Host "Note: You may see security warnings for self-signed certificates." -ForegroundColor Yellow
Write-Host "Click 'Advanced' and 'Proceed to localhost' to continue." -ForegroundColor Yellow
Write-Host ""
Write-Host "Press any key to close this window..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") 