from datetime import datetime
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from models import Note
from storage import YAMLNoteStorage

app = FastAPI(
    title="Notepad API",
    description="A RESTful API for managing notes with timestamps",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

storage = YAMLNoteStorage()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React app will run on port 3000
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/notes/", response_model=Note, tags=["Notes"], summary="Create a new note")
async def create_note(note: Note):
    """
    Create a new note with the following information:
    
    - **timestamp**: When the note was created (auto-generated if not provided)
    - **title**: The title of the note
    - **summary**: A brief summary of the note
    - **contents**: The full content of the note
    """
    storage.save_note(note)
    return note

@app.get("/notes/{timestamp}", response_model=Note, tags=["Notes"], summary="Get a specific note")
async def get_note(timestamp: datetime):
    """
    Retrieve a specific note by its timestamp.
    
    - **timestamp**: The exact timestamp when the note was created
    """
    note = storage.get_note(timestamp)
    if note is None:
        raise HTTPException(status_code=404, detail="Note not found")
    return note

@app.get("/notes/", response_model=List[Note], tags=["Notes"], summary="Get notes in a date range")
async def get_notes_in_range(start: datetime, end: datetime):
    """
    Retrieve all notes within a specified date range.
    
    - **start**: Start date/time for the range
    - **end**: End date/time for the range
    """
    return storage.get_notes_in_range(start, end)

@app.delete("/notes/{timestamp}", tags=["Notes"], summary="Delete a specific note")
async def delete_note(timestamp: datetime):
    """
    Delete a specific note by its timestamp.
    
    - **timestamp**: The exact timestamp when the note was created
    """
    if not storage.delete_note(timestamp):
        raise HTTPException(status_code=404, detail="Note not found")
    return {"message": "Note deleted successfully"}

@app.get("/", tags=["Health"], summary="Health check")
async def health_check():
    """
    Simple health check endpoint to verify the API is running.
    """
    return {"status": "healthy", "message": "Notepad API is running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 