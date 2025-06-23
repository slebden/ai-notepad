from abc import ABC, abstractmethod
from datetime import datetime
from typing import List, Optional
import yaml
import os
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

class YAMLNoteStorage(NoteStorage):
    def __init__(self, storage_dir: str = "notes"):
        self.storage_dir = storage_dir
        os.makedirs(storage_dir, exist_ok=True)

    def _get_note_path(self, timestamp: datetime) -> str:
        return os.path.join(self.storage_dir, f"{timestamp.isoformat()}.yaml")

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
            if not filename.endswith('.yaml'):
                continue
            try:
                timestamp = datetime.fromisoformat(filename[:-5])
                if start <= timestamp <= end:
                    note_path = os.path.join(self.storage_dir, filename)
                    with open(note_path, 'r') as f:
                        data = yaml.safe_load(f)
                        notes.append(Note(**data))
            except ValueError:
                continue
        return sorted(notes, key=lambda x: x.timestamp)

    def delete_note(self, timestamp: datetime) -> bool:
        note_path = self._get_note_path(timestamp)
        if os.path.exists(note_path):
            os.remove(note_path)
            return True
        return False 