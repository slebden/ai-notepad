from datetime import datetime
from pydantic import BaseModel, Field

class Note(BaseModel):
    timestamp: datetime = Field(
        default_factory=datetime.now,
        description="Timestamp when the note was created",
        example="2024-01-15T10:30:00"
    )
    title: str = Field(
        description="The title of the note",
        example="Meeting Notes",
        min_length=1,
        max_length=200
    )
    summary: str = Field(
        description="A brief summary of the note content",
        example="Discussed project timeline and next steps",
        min_length=1,
        max_length=500
    )
    contents: str = Field(
        description="The full content of the note",
        example="Today we discussed the project timeline. Key points:\n- Phase 1: Complete by end of month\n- Phase 2: Start next week\n- Budget approved for additional resources",
        min_length=1
    )

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
        schema_extra = {
            "example": {
                "timestamp": "2024-01-15T10:30:00",
                "title": "Project Meeting Notes",
                "summary": "Discussed project timeline and resource allocation",
                "contents": "Meeting with the development team to discuss project timeline and resource allocation. Key decisions made:\n\n1. Phase 1 completion target: End of January\n2. Additional developers to be hired\n3. Budget approved for new tools\n\nNext meeting scheduled for next week."
            }
        } 