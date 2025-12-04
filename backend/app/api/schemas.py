from pydantic import BaseModel
from typing import List, Optional


class TranscribeResponse(BaseModel):
    success: bool
    transcript: str
    error: Optional[str] = None


class PolishRequest(BaseModel):
    text: str


class PolishResponse(BaseModel):
    success: bool
    polishedText: str
    summary: str
    keywords: List[str]
    error: Optional[str] = None


class HealthResponse(BaseModel):
    status: str
    version: str
    mock_mode: bool
