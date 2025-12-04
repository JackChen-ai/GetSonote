"""
LLM Service - Support for Qwen (DashScope) and DeepSeek
Uses OpenAI-compatible API format
"""
import json
from typing import Tuple, Optional
from openai import AsyncOpenAI
from app.core.config import get_settings

settings = get_settings()

# Prompt template for polishing and summarizing
POLISH_PROMPT = """你是一位专业的文字编辑和内容整理专家。请对以下语音转录文本进行处理：

【原始转录文本】
{text}

请完成以下任务：
1. **润色文本**：删除语气词（如"那个"、"呃"、"嗯"等），修正语法错误，优化句子结构，使其符合书面语规范，但保留原意。
2. **生成摘要**：用3-5句话概括文本的核心内容。
3. **提取关键词**：提取5-8个最相关的关键词或短语。

请严格按照以下JSON格式返回结果（不要添加任何其他内容）：
{{
  "polishedText": "润色后的完整文本",
  "summary": "内容摘要",
  "keywords": ["关键词1", "关键词2", "关键词3"]
}}
"""


def _get_llm_client() -> Tuple[Optional[AsyncOpenAI], str]:
    """Get LLM client based on provider configuration."""
    provider = settings.llm_provider.lower()

    if provider == "dashscope" and settings.dashscope_api_key:
        # DashScope (Qwen) - OpenAI compatible endpoint
        client = AsyncOpenAI(
            api_key=settings.dashscope_api_key,
            base_url="https://dashscope.aliyuncs.com/compatible-mode/v1"
        )
        return client, "qwen-max"

    elif provider == "deepseek" and settings.deepseek_api_key:
        # DeepSeek - OpenAI compatible endpoint
        client = AsyncOpenAI(
            api_key=settings.deepseek_api_key,
            base_url=settings.deepseek_base_url
        )
        return client, "deepseek-chat"

    return None, ""


async def polish_with_llm(text: str) -> Tuple[bool, dict]:
    """
    Polish text using LLM (Qwen or DeepSeek).
    Returns (success, result_dict)
    """
    client, model = _get_llm_client()

    if not client:
        return False, {"error": f"LLM not configured. Provider: {settings.llm_provider}"}

    try:
        response = await client.chat.completions.create(
            model=model,
            messages=[
                {
                    "role": "system",
                    "content": "你是一位专业的文字编辑，擅长整理和润色文本。请始终以JSON格式返回结果。"
                },
                {
                    "role": "user",
                    "content": POLISH_PROMPT.format(text=text[:10000])  # Limit text length
                }
            ],
            temperature=0.3,
            max_tokens=4096,
        )

        content = response.choices[0].message.content

        # Parse JSON response
        try:
            # Try to extract JSON from response
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0]
            elif "```" in content:
                content = content.split("```")[1].split("```")[0]

            result = json.loads(content.strip())

            # Validate required fields
            if not all(k in result for k in ["polishedText", "summary", "keywords"]):
                raise ValueError("Missing required fields in response")

            return True, result

        except (json.JSONDecodeError, ValueError) as e:
            # If JSON parsing fails, return raw content as polished text
            return True, {
                "polishedText": content,
                "summary": "无法自动生成摘要",
                "keywords": []
            }

    except Exception as e:
        return False, {"error": str(e)}


async def test_llm_connection() -> Tuple[bool, str]:
    """Test LLM API connection."""
    client, model = _get_llm_client()

    if not client:
        return False, f"LLM not configured. Set {settings.llm_provider.upper()}_API_KEY in .env"

    try:
        response = await client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": "Hello"}],
            max_tokens=10
        )
        return True, f"Connected to {settings.llm_provider} ({model})"
    except Exception as e:
        return False, str(e)
