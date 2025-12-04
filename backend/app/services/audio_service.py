"""
Audio Processing Service - Main orchestration
Handles transcription and polishing with fallback to mock mode
"""
import asyncio
from typing import Tuple
from app.core.config import get_settings
from app.services.asr_service import transcribe_with_paraformer
from app.services.llm_service import polish_with_llm

settings = get_settings()


async def transcribe_audio(file_content: bytes, filename: str) -> Tuple[bool, str]:
    """
    Transcribe audio using ASR service.
    Falls back to mock mode if API not configured or fails.
    Returns (success, transcript_or_error)
    """
    # Check if we should use mock mode
    if settings.use_mock:
        return await _mock_transcribe(filename)

    # Try real ASR service
    if settings.dashscope_api_key:
        success, result = await transcribe_with_paraformer(file_content, filename)
        if success:
            return True, result
        else:
            # Log error and fall back to mock
            print(f"[ASR] Real API failed: {result}, falling back to mock")

    # Fallback to mock
    return await _mock_transcribe(filename)


async def polish_and_summarize(text: str) -> Tuple[bool, dict]:
    """
    Polish text and generate summary using LLM.
    Falls back to mock mode if API not configured or fails.
    Returns (success, result_dict_or_error)
    """
    # Check if we should use mock mode
    if settings.use_mock:
        return await _mock_polish(text)

    # Try real LLM service
    if settings.dashscope_api_key or settings.deepseek_api_key:
        success, result = await polish_with_llm(text)
        if success:
            return True, result
        else:
            # Log error and fall back to mock
            error_msg = result.get("error", "Unknown error") if isinstance(result, dict) else str(result)
            print(f"[LLM] Real API failed: {error_msg}, falling back to mock")

    # Fallback to mock
    return await _mock_polish(text)


async def _mock_transcribe(filename: str) -> Tuple[bool, str]:
    """Mock transcription for demo/testing."""
    await asyncio.sleep(2)  # Simulate processing time

    mock_transcript = f"""这是文件 "{filename}" 的转写结果。

在这个架构中，音频流被发送到了后端服务，并转发给了阿里云 Paraformer 语音识别服务。
阿里云的中文识别准确率非常高，特别是在处理中文长语音和方言方面。
这段文字代表了原始的、未经润色的语音识别输出，可能包含一些语气词，比如那个，呃，然后之类的。
后端服务目前运行在 Mock 模式，请配置 DASHSCOPE_API_KEY 以启用真实的语音识别功能。"""

    return True, mock_transcript


async def _mock_polish(text: str) -> Tuple[bool, dict]:
    """Mock polishing for demo/testing."""
    await asyncio.sleep(1.5)  # Simulate processing time

    # Extract a preview from input text
    preview = text[:100] + "..." if len(text) > 100 else text

    mock_result = {
        "polishedText": f"""这是经过 AI 模型润色后的结果。

原始转写文本已被发送到后端，然后调用通义千问或 DeepSeek 的 API 进行处理。
这种方式不仅成本低廉，而且由于数据中心位于国内，响应速度极快。

模型已删除了原始文本中的语气词（如"那个"、"呃"），并优化了句子结构，使其更符合书面语规范。

[Mock 模式] 原文预览: {preview}""",
        "summary": "本音频主要演示了 Sonote 的后端架构流程：前端上传音频至后端服务，后端集成阿里云 ASR 进行转写，随后使用 LLM 模型进行文本润色。该方案在成本控制和访问速度上具有显著优势。[Mock 模式]",
        "keywords": ["音频转录", "语音识别", "文本润色", "AI处理", "Mock模式"]
    }

    return True, mock_result
