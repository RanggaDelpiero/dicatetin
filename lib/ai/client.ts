// ============================================
// Pundi — Shared AI Client
// ============================================
// Server-only helper for calling the existing AI provider.
// Centralizes API key handling, response parsing, error mapping.
// Must only be imported in server-side code (route handlers).

const BASE_URL = process.env.AI_ADVISOR_BASE_URL || 'https://aimurah.my.id/api/v1';
const API_KEY = process.env.AI_ADVISOR_API_KEY || '';
const MODEL = process.env.AI_ADVISOR_MODEL || 'claude-sonnet-4.5';

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AISuccessResult {
  ok: true;
  content: string;
}

export interface AIErrorResult {
  ok: false;
  status: number;
  message: string;
}

export type AIResult = AISuccessResult | AIErrorResult;

export interface CallAIOptions {
  messages: AIMessage[];
  maxTokens?: number;
  temperature?: number;
}

/**
 * Call the AI chat completion endpoint.
 * Returns a typed result — never throws for expected API errors.
 */
export async function callAIChatCompletion(options: CallAIOptions): Promise<AIResult> {
  if (!API_KEY) {
    return { ok: false, status: 503, message: 'AI advisor belum dikonfigurasi. Hubungi admin.' };
  }

  const { messages, maxTokens = 1024, temperature = 0.7 } = options;

  let apiResponse: Response;
  try {
    apiResponse = await fetch(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        max_tokens: maxTokens,
        temperature,
      }),
    });
  } catch (err) {
    return { ok: false, status: 0, message: `Network error: ${(err as Error).message}` };
  }

  if (!apiResponse.ok) {
    if (apiResponse.status === 429) {
      return { ok: false, status: 429, message: 'Lagi rame nih, coba beberapa saat lagi ya 🙏' };
    }
    const errorText = await apiResponse.text().catch(() => 'Unknown error');
    if (errorText.trim().startsWith('<!')) {
      return { ok: false, status: apiResponse.status, message: `Akses ditolak oleh gateway AI (Terblokir Firewall/Cloudflare). Status: ${apiResponse.status}` };
    }
    return { ok: false, status: apiResponse.status, message: `AI error: ${errorText.slice(0, 200)}` };
  }

  const rawText = await apiResponse.text();
  const content = parseAIResponse(rawText);

  if (content === null) {
    return { ok: false, status: 500, message: 'Gagal menguraikan respon dari server AI.' };
  }

  return { ok: true, content };
}

/**
 * Parse AI response text, handling both standard JSON and streaming `data:` formats.
 * Strips markdown code fences before JSON parsing.
 */
export function parseAIResponse(rawText: string): string | null {
  // Try standard JSON first
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let data: any = null;
  try {
    const cleanedText = rawText.replace(/data:\s*\[DONE\]\s*$/, '').trim();
    data = JSON.parse(cleanedText);
  } catch {
    // Try streaming format
    if (rawText.includes('data: ')) {
      let contentAccumulator = '';
      const lines = rawText.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('data: ')) {
          const dataStr = trimmed.slice(6).trim();
          if (dataStr === '[DONE]') continue;
          try {
            const chunk = JSON.parse(dataStr);
            if (chunk.choices?.[0]?.delta?.content) {
              contentAccumulator += chunk.choices[0].delta.content;
            } else if (chunk.choices?.[0]?.message?.content) {
              contentAccumulator += chunk.choices[0].message.content;
            }
            if (!data && chunk.id) {
              data = { ...chunk };
            }
          } catch {
            // ignore malformed lines
          }
        }
      }
      if (contentAccumulator && data) {
        data.choices = [{
          message: { content: contentAccumulator, role: 'assistant' },
        }];
      }
    }
  }

  if (!data) return null;

  // Extract content from various response formats
  let reply = '';
  if (data.choices?.[0]?.message?.content) {
    reply = data.choices[0].message.content;
  } else if (data.content && Array.isArray(data.content)) {
    reply = data.content
      .filter((block: { type: string }) => block.type === 'text')
      .map((block: { text: string }) => block.text)
      .join('');
  } else if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
    // Gemini format
    reply = data.candidates[0].content.parts[0].text;
  } else if (typeof data.response === 'string') {
    // Ollama / Generic format
    reply = data.response;
  } else if (typeof data === 'string') {
    reply = data;
  } else {
    // Fallback to stringified data or raw text
    console.warn('[AI Client] Unrecognized response format, returning raw text:', rawText.slice(0, 200));
    reply = rawText;
  }

  // Strip markdown code fences
  reply = reply.replace(/```json\n?/gi, '').replace(/```\n?/g, '').trim();

  return reply;
}

/**
 * Parse a JSON response from AI, with graceful fallback.
 */
export function parseAIJSON<T>(content: string): T | null {
  try {
    return JSON.parse(content) as T;
  } catch {
    try {
      // Try to extract JSON object or array
      const jsonMatch = content.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
      if (!jsonMatch) return null;
      return JSON.parse(jsonMatch[0]) as T;
    } catch {
      return null;
    }
  }
}
