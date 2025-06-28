Write-Host "Installing FFmpeg for audio processing..." -ForegroundColor Green
Write-Host ""

try {
    # Check if winget is available
    $wingetPath = Get-Command winget -ErrorAction SilentlyContinue
    if ($wingetPath) {
        Write-Host "Using winget to install FFmpeg..." -ForegroundColor Cyan
        winget install Gyan.FFmpeg
        Write-Host "FFmpeg installation complete via winget" -ForegroundColor Green
    }
    else {
        # Check if chocolatey is available
        $chocoPath = Get-Command choco -ErrorAction SilentlyContinue
        if ($chocoPath) {
            Write-Host "Using chocolatey to install FFmpeg..." -ForegroundColor Cyan
            choco install ffmpeg
            Write-Host "FFmpeg installation complete via chocolatey" -ForegroundColor Green
        }
        else {
            Write-Host "Neither winget nor chocolatey found." -ForegroundColor Yellow
            Write-Host "Please install FFmpeg manually:" -ForegroundColor White
            Write-Host "1. Download from: https://ffmpeg.org/download.html" -ForegroundColor White
            Write-Host "2. Extract and add to PATH" -ForegroundColor White
            Write-Host "3. Restart your terminal" -ForegroundColor White
        }
    }
}
catch {
    Write-Host "Error during FFmpeg installation: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Please install FFmpeg manually from: https://ffmpeg.org/download.html" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "After FFmpeg installation, restart your terminal and try the transcription again." -ForegroundColor Cyan
Write-Host ""
Write-Host "Press any key to continue..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") 