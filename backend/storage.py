from abc import ABC, abstractmethod
from datetime import datetime
from typing import List, Optional
import yaml
import os
import re
from models import Note

class NoteStorage(ABC):
    @abstractmethod
    def save_note(self, note: Note) -> None:
        pass

    @abstractmethod
    def get_note(self, timestamp: datetime) -> Optional[Note]:
        pass

    @abstractmethod
    def get_notes_in_range(self, start: datetime, end: datetime) -> List[Note]:
        pass

    @abstractmethod
    def delete_note(self, timestamp: datetime) -> bool:
        pass

    @abstractmethod
    def get_all_notes(self) -> List[Note]:
        pass

class YAMLNoteStorage(NoteStorage):
    def __init__(self, storage_dir: str = "notes"):
        self.storage_dir = storage_dir
        os.makedirs(storage_dir, exist_ok=True)

    def _safe_filename(self, timestamp: datetime) -> str:
        """Convert timestamp to a safe filename by replacing invalid characters."""
        # Replace colons with hyphens and remove microseconds for cleaner filenames
        safe_timestamp = timestamp.strftime("%Y-%m-%dT%H-%M-%S")
        return safe_timestamp

    def _get_note_path(self, timestamp: datetime) -> str:
        safe_name = self._safe_filename(timestamp)
        return os.path.join(self.storage_dir, f"{safe_name}.yaml")

    def _parse_filename_to_timestamp(self, filename: str) -> Optional[datetime]:
        """Parse a filename back to a datetime object."""
        if not filename.endswith('.yaml'):
            return None
        try:
            # Remove .yaml extension
            timestamp_str = filename[:-5]
            # Replace hyphens back to colons for the time part only
            # Format: 2025-06-24T21-07-05 -> 2025-06-24T21:07:05
            parts = timestamp_str.split('T')
            if len(parts) != 2:
                return None
            date_part = parts[0]
            time_part = parts[1].replace('-', ':')
            timestamp_str = f"{date_part}T{time_part}"
            return datetime.fromisoformat(timestamp_str)
        except ValueError:
            return None

    def save_note(self, note: Note) -> None:
        note_path = self._get_note_path(note.timestamp)
        with open(note_path, 'w') as f:
            yaml.dump(note.model_dump(), f)

    def get_note(self, timestamp: datetime) -> Optional[Note]:
        note_path = self._get_note_path(timestamp)
        if not os.path.exists(note_path):
            return None
        with open(note_path, 'r') as f:
            data = yaml.safe_load(f)
            return Note(**data)

    def get_notes_in_range(self, start: datetime, end: datetime) -> List[Note]:
        notes = []
        for filename in os.listdir(self.storage_dir):
            timestamp = self._parse_filename_to_timestamp(filename)
            if timestamp is None:
                continue
            if start <= timestamp <= end:
                note_path = os.path.join(self.storage_dir, filename)
                with open(note_path, 'r') as f:
                    data = yaml.safe_load(f)
                    notes.append(Note(**data))
        return sorted(notes, key=lambda x: x.timestamp)

    def get_all_notes(self) -> List[Note]:
        """Get all notes without date filtering."""
        notes = []
        print(f"Storage directory: {self.storage_dir}")
        print(f"Directory exists: {os.path.exists(self.storage_dir)}")
        
        if not os.path.exists(self.storage_dir):
            print(f"Storage directory does not exist, creating it...")
            os.makedirs(self.storage_dir, exist_ok=True)
            return notes
        
        files = os.listdir(self.storage_dir)
        print(f"Files in directory: {files}")
        
        for filename in files:
            print(f"Processing file: {filename}")
            timestamp = self._parse_filename_to_timestamp(filename)
            if timestamp is None:
                print(f"Could not parse timestamp from filename: {filename}")
                continue
            print(f"Parsed timestamp: {timestamp}")
            note_path = os.path.join(self.storage_dir, filename)
            try:
                with open(note_path, 'r') as f:
                    data = yaml.safe_load(f)
                    notes.append(Note(**data))
                    print(f"Successfully loaded note: {data.get('title', 'No title')}")
            except Exception as e:
                print(f"Error loading note from {filename}: {e}")
        
        print(f"Total notes loaded: {len(notes)}")
        return sorted(notes, key=lambda x: x.timestamp, reverse=True)  # Most recent first

    def delete_note(self, timestamp: datetime) -> bool:
        note_path = self._get_note_path(timestamp)
        if os.path.exists(note_path):
            os.remove(note_path)
            return True
        return False 