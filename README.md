# Notepad Application

A full-stack notepad application with a FastAPI backend, React frontend, and voice transcription microservice.

## Project Structure

- `backend/` - FastAPI backend service (notes management)
- `transcription-service/` - FastAPI microservice for voice transcription
- `frontend/` - React frontend application

## Architecture

The application consists of three main components:

1. **Main Backend** (`backend/`) - Handles note CRUD operations and AI-powered features
2. **Transcription Service** (`transcription-service/`) - Converts audio to text using OpenAI Whisper
3. **Frontend** (`frontend/`) - React application with voice recording capabilities

## Quick Start

### Option 1: Use the startup script (Windows)
```bash
# Run the PowerShell script to start all services
.\start-services.ps1
```

### Option 2: Manual startup

#### 1. Transcription Service Setup
```bash
cd transcription-service
poetry install
poetry run python main.py
```
The transcription service will be available at `http://localhost:8001`

#### 2. Main Backend Setup
```bash
cd backend
poetry install
poetry run python main.py
```
The backend service will be available at `http://localhost:8000`

#### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
The frontend application will be available at `http://localhost:3000`

## Features

- Create, read, update, and delete notes
- Notes include timestamp, title, summary, and contents
- YAML-based storage with abstraction layer for future storage implementations
- Modern React frontend with Material-UI
- Real-time updates using React Query
- **Voice recording and transcription** - Record audio and convert to text using OpenAI Whisper
- AI-powered title and summary generation
- Microservice architecture for scalability

## Voice Transcription

The application includes a voice recording feature that allows users to:
- Record audio directly in the browser
- Convert speech to text using OpenAI Whisper (offline processing)
- Insert transcribed text at the cursor position in the note editor

**Note**: The transcription service uses OpenAI Whisper for offline speech recognition, providing high accuracy without requiring an internet connection after the initial model download.

## API Documentation

### Main Backend
Once the backend service is running, you can access the interactive API documentation at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

### Transcription Service
The transcription service documentation is available at:
- Swagger UI: `http://localhost:8001/docs`
- ReDoc: `http://localhost:8001/redoc` 