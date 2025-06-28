@echo off
echo Starting Notepad Services...
echo.

echo Starting Transcription Service on port 8001...
start "Transcription Service" cmd /k "cd transcription-service && poetry run python main.py"

echo Waiting 3 seconds for transcription service to start...
timeout /t 3 /nobreak > nul

echo Starting Main Backend on port 8000...
start "Main Backend" cmd /k "cd backend && poetry run python main.py"

echo.
echo Services are starting...
echo - Main Backend: http://localhost:8000
echo - Transcription Service: http://localhost:8001
echo - Frontend: http://localhost:3000
echo.
echo Press any key to close this window...
pause > nul 