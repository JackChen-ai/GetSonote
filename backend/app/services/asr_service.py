"""
ASR Service - Aliyun Paraformer Speech Recognition
Uses DashScope Audio API for simplicity
"""
import base64
import httpx
from typing import Tuple, Optional
from app.core.config import get_settings

settings = get_settings()


async def transcribe_with_paraformer(audio_content: bytes, filename: str) -> Tuple[bool, str]:
    """
    Transcribe audio using Aliyun Paraformer via DashScope.
    Returns (success, transcript_or_error)
    """
    if not settings.dashscope_api_key:
        return False, "DashScope API key not configured"

    # Determine audio format from filename
    file_ext = filename.lower().split('.')[-1] if '.' in filename else 'mp3'
    format_map = {
        'mp3': 'mp3',
        'wav': 'wav',
        'm4a': 'mp4',
        'mp4': 'mp4',
        'flac': 'flac',
        'ogg': 'ogg',
    }
    audio_format = format_map.get(file_ext, 'mp3')

    # Encode audio to base64
    audio_base64 = base64.b64encode(audio_content).decode('utf-8')

    # DashScope Audio API endpoint
    url = "https://dashscope.aliyuncs.com/api/v1/services/audio/asr/transcription"

    headers = {
        "Authorization": f"Bearer {settings.dashscope_api_key}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": "paraformer-v2",
        "input": {
            "file_urls": None,  # We use audio content instead
        },
        "parameters": {
            "language_hints": ["zh", "en"],  # Support Chinese and English
        }
    }

    # For short audio, use synchronous recognition
    # DashScope supports direct audio content via multipart/form-data
    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            # Use the file transcription API
            response = await client.post(
                "https://dashscope.aliyuncs.com/compatible-mode/v1/audio/transcriptions",
                headers={
                    "Authorization": f"Bearer {settings.dashscope_api_key}",
                },
                files={
                    "file": (filename, audio_content, f"audio/{audio_format}")
                },
                data={
                    "model": "paraformer-v2",
                    "language": "zh",
                }
            )

            if response.status_code == 200:
                result = response.json()
                transcript = result.get("text", "")
                if transcript:
                    return True, transcript
                else:
                    return False, "Empty transcription result"
            else:
                error_msg = response.text
                return False, f"ASR API error ({response.status_code}): {error_msg}"

    except httpx.TimeoutException:
        return False, "ASR request timeout"
    except Exception as e:
        return False, f"ASR error: {str(e)}"


async def transcribe_with_whisper_api(audio_content: bytes, filename: str) -> Tuple[bool, str]:
    """
    Fallback: Transcribe using OpenAI Whisper API (if configured).
    """
    # This can be used as a fallback if Aliyun is not available
    # Requires OpenAI API key
    return False, "Whisper API not implemented"


async def test_asr_connection() -> Tuple[bool, str]:
    """Test ASR API connection."""
    if not settings.dashscope_api_key:
        return False, "DashScope API key not configured. Set DASHSCOPE_API_KEY in .env"

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                "https://dashscope.aliyuncs.com/api/v1/services/audio/asr/transcription",
                headers={
                    "Authorization": f"Bearer {settings.dashscope_api_key}",
                }
            )
            # Even a 405 (method not allowed) means the API is reachable
            if response.status_code in [200, 405, 400]:
                return True, "DashScope ASR API reachable"
            else:
                return False, f"API returned status {response.status_code}"
    except Exception as e:
        return False, str(e)
