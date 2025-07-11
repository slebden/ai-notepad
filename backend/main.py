from datetime import datetime
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from models import Note, NoteIn
from storage import YAMLNoteStorage
from transformers import AutoTokenizer, AutoModelForCausalLM
import torch
import os
from dotenv import load_dotenv
import time
from contextlib import asynccontextmanager

# Load environment variables from .env file
load_dotenv()

# Initialize model and tokenizer as None. They will be loaded on startup.
model = None
tokenizer = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan event handler for loading the AI model on startup.
    """
    global model, tokenizer
    
    hf_token = os.getenv("HUGGING_FACE_HUB_TOKEN")
    if not hf_token:
        print("\nWARNING: HUGGING_FACE_HUB_TOKEN environment variable not set.")
        print("AI features will be disabled. Notes will use simple fallback titles and summaries.")
        print("To enable AI features, create a .env file in the 'backend' directory with your token.\n")
        yield
        return

    # Check GPU availability
    print("Checking GPU availability...")
    if torch.cuda.is_available():
        gpu_count = torch.cuda.device_count()
        gpu_name = torch.cuda.get_device_name(0)
        gpu_memory = torch.cuda.get_device_properties(0).total_memory / 1024**3
        print(f"GPU detected: {gpu_name} ({gpu_count} device(s), {gpu_memory:.1f}GB VRAM)")
        
        if gpu_memory < 8:
            print(f"WARNING: GPU has only {gpu_memory:.1f}GB VRAM. Mistral-7B requires at least 8GB.")
            print("Model may not fit in GPU memory and will fall back to CPU (very slow).")
            print("Consider using a smaller model or disabling AI features.")
    else:
        print("WARNING: No GPU detected. Model will run on CPU (very slow).")
        print("Consider disabling AI features for better performance.")

    # Choose model based on GPU memory
    if torch.cuda.is_available() and torch.cuda.get_device_properties(0).total_memory / 1024**3 >= 8:
        model_name = "mistralai/Mistral-7B-Instruct-v0.2"
        print(f"Using large model: {model_name}")
    else:
        # Use a smaller model for limited resources
        model_name = "microsoft/DialoGPT-medium"  # Much smaller model
        print(f"Using smaller model for limited resources: {model_name}")
        print("Note: Smaller model may provide lower quality results.")

    print("This may take several minutes and requires significant RAM/GPU resources.")
    print("If the app freezes, restart without the HUGGING_FACE_HUB_TOKEN environment variable.")
    
    try:
        # Set a timeout for model loading
        import signal
        import threading
        
        def load_model_with_timeout():
            global model, tokenizer
            try:
                tokenizer = AutoTokenizer.from_pretrained(model_name, token=hf_token)
                
                # Configure device mapping based on GPU availability
                if torch.cuda.is_available():
                    gpu_memory = torch.cuda.get_device_properties(0).total_memory / 1024**3
                    if gpu_memory >= 8:
                        # Use GPU with automatic device mapping
                        model = AutoModelForCausalLM.from_pretrained(
                            model_name, 
                            device_map="auto", 
                            torch_dtype=torch.float16, 
                            token=hf_token
                        )
                        print(f"Model loaded on GPU: {model.device}")
                    else:
                        # Use CPU offloading for low VRAM
                        model = AutoModelForCausalLM.from_pretrained(
                            model_name, 
                            device_map="auto",
                            torch_dtype=torch.float16,
                            token=hf_token,
                            low_cpu_mem_usage=True
                        )
                        print("Model loaded with CPU offloading due to low VRAM")
                else:
                    # Force CPU usage
                    model = AutoModelForCausalLM.from_pretrained(
                        model_name, 
                        device_map="cpu",
                        torch_dtype=torch.float32,
                        token=hf_token,
                        low_cpu_mem_usage=True
                    )
                    print("Model loaded on CPU")
                
                print("Model loaded successfully.")
            except Exception as e:
                print(f"Failed to load model: {e}")
                model = None
                tokenizer = None
        
        # Load model in a separate thread with timeout
        model_thread = threading.Thread(target=load_model_with_timeout)
        model_thread.daemon = True
        model_thread.start()
        
        # Wait for model to load with timeout (5 minutes)
        model_thread.join(timeout=300)
        
        if model_thread.is_alive():
            print("Model loading timed out after 5 minutes. AI features will be disabled.")
            model = None
            tokenizer = None
            
    except Exception as e:
        print(f"\nERROR: Failed to load model. {e}")
        print("AI features will be disabled. Notes will use simple fallback titles and summaries.\n")
        model = None
        tokenizer = None
    
    yield
    
    # Cleanup on shutdown
    if model is not None:
        print("Cleaning up AI model...")
        del model
        del tokenizer

app = FastAPI(
    title="Notepad API",
    description="A RESTful API for managing notes with timestamps, with AI-powered summaries.",
    version="1.2.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

storage = YAMLNoteStorage()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for local network access
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def generate_summary(content: str) -> str:
    """
    Generates a summary for the given content using the local model.
    """
    if not model or not tokenizer:
        # Fallback: create a simple summary from the first few words
        words = content.split()
        if len(words) <= 10:
            return content
        else:
            return " ".join(words[:10]) + "..."
    
    try:
        # Check if we're using Mistral or a different model
        if "mistral" in model.config._name_or_path.lower():
            # Mistral instruct models follow a specific prompt format.
            messages = [
                {"role": "user", "content": f"Please provide a concise, one-sentence summary for the following note:\n\n{content}"}
            ]
            prompt = tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
        else:
            # For other models, use a simple prompt
            prompt = f"Summarize this note in one sentence: {content}\nSummary:"
        
        inputs = tokenizer(prompt, return_tensors="pt").to(model.device)

        # Generate the output
        outputs = model.generate(
            **inputs,
            max_new_tokens=50,
            pad_token_id=tokenizer.eos_token_id,
            do_sample=True,
            temperature=0.2,
            top_p=0.95,
        )
        
        # Decode the generated tokens to a string
        generated_text = tokenizer.decode(outputs[0], skip_special_tokens=True)
        
        # Extract the response based on model type
        if "mistral" in model.config._name_or_path.lower():
            summary = generated_text.split("[/INST]")[-1].strip()
        else:
            summary = generated_text.split("Summary:")[-1].strip()
        
        return summary
    except Exception as e:
        print(f"Error generating summary: {e}")
        # Fallback: create a simple summary from the first few words
        words = content.split()
        if len(words) <= 10:
            return content
        else:
            return " ".join(words[:10]) + "..."

def generate_title(content: str) -> str:
    """
    Generates a title for the given content using the local model.
    """
    if not model or not tokenizer:
        # Fallback: create a simple title from the first few words
        words = content.split()
        if len(words) <= 5:
            return content
        else:
            return " ".join(words[:5])
    
    try:
        # Check if we're using Mistral or a different model
        if "mistral" in model.config._name_or_path.lower():
            # Mistral instruct models follow a specific prompt format.
            messages = [
                {"role": "user", "content": f"Please generate a concise title (maximum 10 words) for the following note:\n\n{content}"}
            ]
            prompt = tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
        else:
            # For other models, use a simple prompt
            prompt = f"Generate a short title for this note: {content}\nTitle:"
        
        inputs = tokenizer(prompt, return_tensors="pt").to(model.device)

        # Generate the output
        outputs = model.generate(
            **inputs,
            max_new_tokens=30,
            pad_token_id=tokenizer.eos_token_id,
            do_sample=True,
            temperature=0.3,
            top_p=0.95,
        )
        
        # Decode the generated tokens to a string
        generated_text = tokenizer.decode(outputs[0], skip_special_tokens=True)
        
        # Extract the response based on model type
        if "mistral" in model.config._name_or_path.lower():
            title = generated_text.split("[/INST]")[-1].strip()
        else:
            title = generated_text.split("Title:")[-1].strip()
        
        # Clean up the title - remove quotes and ensure it's not too long
        title = title.strip('"').strip("'")
        words = title.split()
        if len(words) > 10:
            title = " ".join(words[:10])
        
        return title
    except Exception as e:
        print(f"Error generating title: {e}")
        # Fallback: create a simple title from the first few words
        words = content.split()
        if len(words) <= 5:
            return content
        else:
            return " ".join(words[:5])

def generate_tags(content: str) -> list[str]:
    """
    Generates tags for the given content using the local model.
    """
    if not model or not tokenizer:
        # Fallback: return empty list
        return []
    
    try:
        # Check if we're using Mistral or a different model
        if "mistral" in model.config._name_or_path.lower():
            # Mistral instruct models follow a specific prompt format.
            messages = [
                {"role": "user", "content": f"Please generate up to 3 relevant tags for the following note. Return only the tags separated by commas, no explanations:\n\n{content}"}
            ]
            prompt = tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
        else:
            # For other models, use a simple prompt
            prompt = f"Generate up to 3 relevant tags for this note, separated by commas: {content}\nTags:"
        
        inputs = tokenizer(prompt, return_tensors="pt").to(model.device)

        # Generate the output
        outputs = model.generate(
            **inputs,
            max_new_tokens=30,
            pad_token_id=tokenizer.eos_token_id,
            do_sample=True,
            temperature=0.3,
            top_p=0.95,
        )
        
        # Decode the generated tokens to a string
        generated_text = tokenizer.decode(outputs[0], skip_special_tokens=True)
        
        # Extract the response based on model type
        if "mistral" in model.config._name_or_path.lower():
            tags_text = generated_text.split("[/INST]")[-1].strip()
        else:
            tags_text = generated_text.split("Tags:")[-1].strip()
        
        # Parse tags
        tags = [tag.strip().lower() for tag in tags_text.split(",") if tag.strip()]
        # Limit to 3 tags and remove duplicates
        tags = list(dict.fromkeys(tags))[:3]
        
        return tags
    except Exception as e:
        print(f"Error generating tags: {e}")
        # Fallback: return empty list
        return []

def parse_user_tags(tags_input: str) -> list[str]:
    """
    Parses user-provided tags from various formats.
    Supports: "tag1, tag2", "category: something", "tags: tag1, tag2"
    """
    if not tags_input or not tags_input.strip():
        return []
    
    tags_input = tags_input.strip().lower()
    
    # Handle different input formats
    if "category:" in tags_input or "tag:" in tags_input or "tags:" in tags_input:
        # Extract tags after colons
        parts = tags_input.split(",")
        tags = []
        for part in parts:
            part = part.strip()
            if ":" in part:
                # Extract the value after the colon
                value = part.split(":", 1)[1].strip()
                if value:
                    tags.append(value)
            else:
                # Direct tag
                if part:
                    tags.append(part)
        return tags
    else:
        # Simple comma-separated tags
        tags = [tag.strip() for tag in tags_input.split(",") if tag.strip()]
        return tags

def extract_tags_from_content(content: str) -> tuple[list[str], str]:
    """
    Extracts tags from the beginning of the content and returns cleaned content.
    Handles patterns like:
    - "tag: journal. this was a hard day"
    - "category: work, tag: important. meeting notes..."
    - "tags: personal, diary. today I..."
    """
    lines = content.split('\n')
    if not lines:
        return [], content
    
    first_line = lines[0].strip()
    tags = []
    cleaned_content = content
    
    # Check if first line contains tag patterns
    tag_patterns = ['tag:', 'tags:', 'category:', 'categories:']
    has_tag_pattern = any(pattern in first_line.lower() for pattern in tag_patterns)
    
    if has_tag_pattern:
        # Extract tags from first line
        parts = first_line.split('.', 1)  # Split on first period
        if len(parts) > 1:
            tag_part = parts[0].strip()
            content_part = parts[1].strip()
            
            # Parse tags from the tag part
            tags = parse_user_tags(tag_part)
            
            # Reconstruct content without the tag part
            if content_part:
                cleaned_content = content_part + '\n' + '\n'.join(lines[1:])
            else:
                cleaned_content = '\n'.join(lines[1:])
        else:
            # No period found, try to extract tags anyway
            tags = parse_user_tags(first_line)
            cleaned_content = '\n'.join(lines[1:])
    
    return tags, cleaned_content.strip()

@app.post("/notes/", response_model=Note, tags=["Notes"], summary="Create a new note with AI-generated title, summary, and tags")
async def create_note(note_in: NoteIn):
    """
    Create a new note. The title, summary, and tags will be generated automatically if not provided.
    
    - **title**: The title of the note (optional - will be auto-generated if not provided)
    - **contents**: The full content of the note
    - **tags**: Tags/categories separated by commas (optional - will be auto-generated if not provided)
    """
    start_time = time.time()
    
    print(f"Received note creation request: title='{note_in.title}', contents_length={len(note_in.contents)}, tags='{note_in.tags}'")
    
    # Extract tags from content first
    content_tags, cleaned_content = extract_tags_from_content(note_in.contents)
    print(f"Extracted tags from content: {content_tags}")
    print(f"Cleaned content length: {len(cleaned_content)}")
    
    # Process tags (user input takes precedence over content tags)
    tags_start = time.time()
    if note_in.tags and note_in.tags.strip():
        # User provided tags in the tags field
        tags = parse_user_tags(note_in.tags)
        print(f"User provided tags: {tags}")
    elif content_tags:
        # Tags found in content
        tags = content_tags
        print(f"Tags extracted from content: {tags}")
    else:
        # Generate tags using AI
        tags = generate_tags(cleaned_content)
        print(f"AI generated tags: {tags}")
    print(f"Tags processing took {time.time() - tags_start:.2f} seconds")
    
    # Generate title if not provided or empty
    title_start = time.time()
    title = note_in.title if note_in.title and note_in.title.strip() else generate_title(cleaned_content)
    print(f"Title generation took {time.time() - title_start:.2f} seconds")
    
    # Generate summary
    summary_start = time.time()
    summary = generate_summary(cleaned_content)
    print(f"Summary generation took {time.time() - summary_start:.2f} seconds")
    
    note = Note(
        title=title,
        contents=cleaned_content,
        summary=summary,
        tags=tags
    )
    
    storage.save_note(note)
    print(f"Note created successfully: {note.title} with tags {tags} (total time: {time.time() - start_time:.2f}s)")
    return note

@app.put("/notes/{timestamp}", response_model=Note, tags=["Notes"], summary="Update an existing note")
async def update_note(timestamp: datetime, note_in: NoteIn):
    """
    Update an existing note. The title, summary, and tags will be regenerated if not provided.
    
    - **timestamp**: The exact timestamp when the note was created
    - **title**: The title of the note (optional - will be regenerated if not provided)
    - **contents**: The full content of the note
    - **tags**: Tags/categories separated by commas (optional - will be regenerated if not provided)
    """
    start_time = time.time()
    
    print(f"Received note update request for timestamp {timestamp}: title='{note_in.title}', contents_length={len(note_in.contents)}, tags='{note_in.tags}'")
    
    # Check if note exists
    existing_note = storage.get_note(timestamp)
    if existing_note is None:
        raise HTTPException(status_code=404, detail="Note not found")
    
    # Extract tags from content first
    content_tags, cleaned_content = extract_tags_from_content(note_in.contents)
    print(f"Extracted tags from content: {content_tags}")
    print(f"Cleaned content length: {len(cleaned_content)}")
    
    # Process tags (user input takes precedence over content tags)
    tags_start = time.time()
    if note_in.tags and note_in.tags.strip():
        # User provided tags in the tags field
        tags = parse_user_tags(note_in.tags)
        print(f"User provided tags: {tags}")
    elif content_tags:
        # Tags found in content
        tags = content_tags
        print(f"Tags extracted from content: {tags}")
    else:
        # Generate tags using AI
        tags = generate_tags(cleaned_content)
        print(f"AI generated tags: {tags}")
    print(f"Tags processing took {time.time() - tags_start:.2f} seconds")
    
    # Generate title if not provided or empty
    title_start = time.time()
    title = note_in.title if note_in.title and note_in.title.strip() else generate_title(cleaned_content)
    print(f"Title generation took {time.time() - title_start:.2f} seconds")
    
    # Generate summary
    summary_start = time.time()
    summary = generate_summary(cleaned_content)
    print(f"Summary generation took {time.time() - summary_start:.2f} seconds")
    
    # Create updated note with same timestamp
    updated_note = Note(
        timestamp=timestamp,  # Keep the original timestamp
        title=title,
        contents=cleaned_content,
        summary=summary,
        tags=tags
    )
    
    storage.save_note(updated_note)
    print(f"Note updated successfully: {updated_note.title} with tags {tags} (total time: {time.time() - start_time:.2f}s)")
    return updated_note

@app.get("/notes/", response_model=List[Note], tags=["Notes"], summary="Get notes in a date range")
async def get_notes_in_range(start: datetime, end: datetime):
    """
    Retrieve all notes within a specified date range.
    
    - **start**: Start date/time for the range
    - **end**: End date/time for the range
    """
    return storage.get_notes_in_range(start, end)

@app.get("/notes/all", response_model=List[Note], tags=["Notes"], summary="Get all notes")
async def get_all_notes():
    """
    Retrieve all notes without date filtering.
    """
    print("GET /notes/all endpoint called")
    notes = storage.get_all_notes()
    print(f"Returning {len(notes)} notes from get_all_notes")
    return notes

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
    return {
        "status": "healthy", 
        "message": "Notepad API is running",
        "ai_model_loaded": model is not None and tokenizer is not None
    }

@app.get("/tags/", response_model=list[str], tags=["Tags"], summary="Get all unique tags")
async def get_all_tags():
    """
    Retrieve all unique tags used across all notes.
    Returns a list of tag strings.
    """
    notes = storage.get_all_notes()
    all_tags = set()
    
    for note in notes:
        if note.tags:
            all_tags.update(note.tags)
    
    return sorted(list(all_tags))

@app.get("/notes/filter/", response_model=list[Note], tags=["Notes"], summary="Get notes filtered by tags")
async def get_notes_by_tags(tags: str = ""):
    """
    Retrieve notes that have any of the specified tags.
    
    - **tags**: Comma-separated list of tags to filter by (e.g., "work,important")
    """
    if not tags.strip():
        # If no tags specified, return all notes
        return storage.get_all_notes()
    
    # Parse the tags parameter
    filter_tags = [tag.strip().lower() for tag in tags.split(",") if tag.strip()]
    
    notes = storage.get_all_notes()
    filtered_notes = []
    
    for note in notes:
        if note.tags:
            note_tags_lower = [tag.lower() for tag in note.tags]
            # Check if any of the filter tags match any of the note's tags
            if any(filter_tag in note_tags_lower for filter_tag in filter_tags):
                filtered_notes.append(note)
    
    return filtered_notes

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, ssl_keyfile="localhost-key.pem", ssl_certfile="localhost.pem") 