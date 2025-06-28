@echo off
echo Installing FFmpeg for audio processing...
echo.

echo Checking if winget is available...
where winget >nul 2>&1
if %errorlevel% equ 0 (
    echo Using winget to install FFmpeg...
    winget install Gyan.FFmpeg
    echo FFmpeg installation complete via winget
) else (
    echo winget not found, checking for chocolatey...
    where choco >nul 2>&1
    if %errorlevel% equ 0 (
        echo Using chocolatey to install FFmpeg...
        choco install ffmpeg
        echo FFmpeg installation complete via chocolatey
    ) else (
        echo Neither winget nor chocolatey found.
        echo Please install FFmpeg manually:
        echo 1. Download from: https://ffmpeg.org/download.html
        echo 2. Extract and add to PATH
        echo 3. Restart your terminal
    )
)

echo.
echo After FFmpeg installation, restart your terminal and try the transcription again.
pause 