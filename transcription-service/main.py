from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import whisper
import tempfile
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI(
    title="Transcription Service",
    description="A microservice for converting audio to text using OpenAI Whisper",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for local network access
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Whisper model (will be loaded on first use)
whisper_model = None

def get_whisper_model():
    """Get or initialize the Whisper model."""
    global whisper_model
    if whisper_model is None:
        print("Loading Whisper model...")
        # Use 'base' model for faster processing, can be changed to 'small', 'medium', 'large'
        whisper_model = whisper.load_model("base")
        print("Whisper model loaded successfully!")
    return whisper_model

@app.get("/", tags=["Health"], summary="Health check")
async def health_check():
    """
    Simple health check endpoint to verify the service is running.
    """
    return {
        "status": "healthy",
        "message": "Transcription Service is running",
        "service": "transcription",
        "model": "whisper"
    }

@app.post("/transcribe/", tags=["Transcription"], summary="Transcribe audio to text")
async def transcribe_audio(audio_file: UploadFile = File(...)):
    """
    Transcribe an uploaded audio file to text using OpenAI Whisper.
    
    - **audio_file**: The audio file to transcribe (supports multiple formats)
    
    Returns:
    - **transcription**: The transcribed text
    """
    try:
        print(f"Received audio file: {audio_file.filename}, content_type: {audio_file.content_type}, size: {audio_file.size}")
        
        # Check if the file is an audio file
        if not audio_file.content_type or not audio_file.content_type.startswith('audio/'):
            print(f"Invalid content type: {audio_file.content_type}")
            raise HTTPException(status_code=400, detail="File must be an audio file")
        
        # Read the audio file
        audio_data = await audio_file.read()
        print(f"Read {len(audio_data)} bytes of audio data")
        
        # Create a temporary file to store the audio
        with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as temp_file:
            temp_file.write(audio_data)
            temp_file_path = temp_file.name
            print(f"Saved audio to temporary file: {temp_file_path}")
        
        try:
            # Get the Whisper model
            model = get_whisper_model()
            print("Starting transcription...")
            
            # Transcribe the audio
            result = model.transcribe(temp_file_path)
            print(f"Transcription completed: {len(result['text'])} characters")
            
            return {"transcription": result["text"].strip()}
                
        finally:
            # Clean up the temporary file
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)
                print(f"Cleaned up temporary file: {temp_file_path}")
                
    except Exception as e:
        print(f"Error during transcription: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error processing audio: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001, ssl_keyfile="localhost-key.pem", ssl_certfile="localhost.pem") 