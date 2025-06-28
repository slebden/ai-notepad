# Transcription Service

A microservice for converting audio to text using OpenAI Whisper.

## Features

- Audio file transcription using OpenAI Whisper
- Offline processing (no internet required after model download)
- Support for multiple audio formats
- RESTful API with FastAPI
- CORS support for frontend integration
- Health check endpoint
- Automatic temporary file cleanup

## Whisper Model

This service uses OpenAI's Whisper model for speech recognition:
- **Offline processing** - No internet connection required for transcription
- **High accuracy** - Excellent performance across multiple languages
- **Multiple formats** - Supports various audio file formats
- **Model size** - Uses "base" model for faster processing (can be changed to "small", "medium", "large")

## Setup

1. **Install Poetry** (if not already installed):
   ```bash
   curl -sSL https://install.python-poetry.org | python3 -
   ```

2. **Install dependencies**:
   ```bash
   cd transcription-service
   poetry install
   ```

3. **Run the service**:
   ```bash
   poetry run python main.py
   ```

The service will start on `http://localhost:8001`

**Note**: On first run, Whisper will download the model files (~74MB for base model). This may take a few minutes depending on your internet connection.

## API Endpoints

### Health Check
- **GET** `/` - Check if the service is running

### Transcription
- **POST** `/transcribe/` - Transcribe an audio file to text
  - **Body**: Form data with `audio_file` field
  - **Returns**: `{"transcription": "transcribed text"}`

## Usage

The service accepts various audio file formats and returns the transcribed text. It's designed to work with the Notepad application's voice recording feature.

## Model Configuration

You can change the Whisper model size by modifying the `get_whisper_model()` function in `main.py`:

- **"tiny"** - Fastest, lowest accuracy (~39MB)
- **"base"** - Good balance of speed and accuracy (~74MB) - **Default**
- **"small"** - Better accuracy, slower (~244MB)
- **"medium"** - High accuracy, slower (~769MB)
- **"large"** - Best accuracy, slowest (~1550MB)

## API Documentation

Once the service is running, you can view the interactive API documentation at:
- Swagger UI: `http://localhost:8001/docs`
- ReDoc: `http://localhost:8001/redoc` 