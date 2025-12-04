import { RefinedContent } from '../types';

// Configuration - set to false to use real backend
const USE_MOCK_BACKEND = false;
const BACKEND_URL = 'http://localhost:3001/api';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export type ProgressCallback = (progress: number) => void;

export const transcribeAudio = async (
  file: File,
  onProgress?: ProgressCallback
): Promise<string> => {
  if (USE_MOCK_BACKEND) {
    console.log(`[Mock Backend] Uploading ${file.name} to Aliyun ASR wrapper...`);
    // Simulate upload progress
    for (let i = 0; i <= 100; i += 10) {
      await delay(200);
      onProgress?.(i);
    }
    await delay(1000);

    return `这是文件 "${file.name}" 的模拟转写结果。

在这个 MVP 架构中，音频流被发送到了您的 Node.js 后端，并转发给了阿里云 Paraformer 语音识别服务。
阿里云的中文识别准确率通常高于 Whisper，特别是在处理中文长语音和方言方面。
这行文字代表了原始的、未经润色的语音识别输出，可能包含一些语气词，比如那个，呃，然后之类的。`;
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append('file', file);

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        const progress = Math.round((event.loaded / event.total) * 100);
        onProgress?.(progress);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          resolve(data.transcript);
        } catch {
          reject(new Error('Failed to parse response'));
        }
      } else {
        reject(new Error(`ASR Service Error: ${xhr.statusText}`));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Network error during upload'));
    });

    xhr.addEventListener('timeout', () => {
      reject(new Error('Upload timed out'));
    });

    xhr.open('POST', `${BACKEND_URL}/transcribe`);
    xhr.timeout = 300000; // 5 minutes
    xhr.send(formData);
  });
};

export const polishAndSummarize = async (transcript: string): Promise<RefinedContent> => {
  if (USE_MOCK_BACKEND) {
    console.log(`[Mock Backend] Sending text to Qwen/DeepSeek wrapper...`);
    await delay(1500 + Math.random() * 1000);

    return {
      polishedText: `这是文件经过 Qwen-Max (通义千问) 模型润色后的结果。

在 MVP 架构中，原始转写文本被发送到您的后端，然后调用通义千问或 DeepSeek 的 API 进行处理。这种方式不仅成本低廉，而且由于数据中心位于国内，响应速度极快。

模型已删除了原始文本中的语气词（如"那个"、"呃"），并优化了句子结构，使其更符合书面语规范。`,
      summary: "本音频主要演示了 Sonote 的 MVP 架构流程：前端上传音频至自建后端，后端集成阿里云 ASR 进行转写，随后使用 Qwen-Max 模型进行文本润色。该方案在成本控制和国内访问速度上具有显著优势。",
      keywords: ["MVP架构", "阿里云ASR", "通义千问", "后端集成", "成本优化"]
    };
  }

  try {
    const response = await fetch(`${BACKEND_URL}/polish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: transcript }),
    });

    if (!response.ok) {
      throw new Error(`LLM Service Error: ${response.statusText}`);
    }

    const data = await response.json();
    return data as RefinedContent;
  } catch (error) {
    console.error("Polishing API error:", error);
    throw error;
  }
};
