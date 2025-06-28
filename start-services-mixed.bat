@echo off
setlocal enabledelayedexpansion

echo Starting Notepad Services with Mixed HTTP/HTTPS...
echo Frontend: HTTPS (for microphone access)
echo Backend Services: HTTP (simpler setup)
echo.

REM Check if mkcert certificates exist for frontend
if not exist "localhost+2.pem" (
    echo mkcert certificates not found for frontend!
    echo Please run: mkcert localhost 127.0.0.1 ::1
    echo.
    pause
    exit /b 1
)

echo mkcert certificates found for frontend. Starting services...
echo.

REM Get local IP address (simplified)
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4"') do (
    set "localIP=%%a"
    set "localIP=!localIP: =!"
    if not "!localIP:~0,7!"=="169.254" (
        goto :found_ip
    )
)
set "localIP=localhost"

:found_ip

echo Starting Transcription Service on port 8001 (HTTP)...
start "Transcription Service" cmd /k "cd transcription-service && poetry run python main.py"

echo Waiting 3 seconds for transcription service to start...
timeout /t 3 /nobreak >nul

echo Starting Main Backend on port 8000 (HTTP)...
start "Main Backend" cmd /k "cd backend && poetry run python main.py"

echo Waiting 3 seconds for backend to start...
timeout /t 3 /nobreak >nul

echo Starting Frontend on port 3000 (HTTPS)...
start "Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo Services are starting...
echo - Main Backend: http://localhost:8000 or http://%localIP%:8000
echo - Transcription Service: http://localhost:8001 or http://%localIP%:8001
echo - Frontend: https://localhost:3000 or https://%localIP%:3000
echo.
echo Local Network Access:
echo - Frontend: https://%localIP%:3000
echo.
echo Note: Frontend uses HTTPS for microphone access, backends use HTTP.
echo.
echo Press any key to close this window...
pause >nul 