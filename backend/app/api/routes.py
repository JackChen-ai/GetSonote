from fastapi import APIRouter, UploadFile, File, HTTPException
from app.api.schemas import (
    TranscribeResponse,
    PolishRequest,
    PolishResponse,
    HealthResponse
)
from app.services.audio_service import transcribe_audio, polish_and_summarize
from app.services.llm_service import test_llm_connection
from app.services.asr_service import test_asr_connection
from app.core.config import get_settings

router = APIRouter(prefix="/api", tags=["audio"])
settings = get_settings()


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint."""
    return HealthResponse(
        status="healthy",
        version="0.1.0",
        mock_mode=settings.use_mock
    )


@router.get("/config")
async def check_config():
    """Check API configuration status."""
    llm_ok, llm_msg = await test_llm_connection()
    asr_ok, asr_msg = await test_asr_connection()

    return {
        "mock_mode": settings.use_mock,
        "llm_provider": settings.llm_provider,
        "llm_status": "connected" if llm_ok else "not configured",
        "llm_message": llm_msg,
        "asr_status": "connected" if asr_ok else "not configured",
        "asr_message": asr_msg,
        "tip": "Set USE_MOCK=false and configure API keys in .env to enable real transcription"
    }


@router.post("/transcribe", response_model=TranscribeResponse)
async def transcribe(file: UploadFile = File(...)):
    """
    Upload an audio file and get transcription.
    Supports: MP3, WAV, M4A, MP4
    """
    # Validate file type
    allowed_types = ["audio/mpeg", "audio/wav", "audio/x-m4a", "audio/mp4", "video/mp4"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {file.content_type}. Allowed: {allowed_types}"
        )

    # Read file content
    content = await file.read()

    # Transcribe
    success, result = await transcribe_audio(content, file.filename or "audio")

    if success:
        return TranscribeResponse(success=True, transcript=result)
    else:
        return TranscribeResponse(success=False, transcript="", error=result)


@router.post("/polish", response_model=PolishResponse)
async def polish(request: PolishRequest):
    """
    Polish transcribed text and generate summary.
    """
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    success, result = await polish_and_summarize(request.text)

    if success:
        return PolishResponse(
            success=True,
            polishedText=result["polishedText"],
            summary=result["summary"],
            keywords=result["keywords"]
        )
    else:
        error_msg = result.get("error", "Unknown error") if isinstance(result, dict) else str(result)
        return PolishResponse(
            success=False,
            polishedText="",
            summary="",
            keywords=[],
            error=error_msg
        )
