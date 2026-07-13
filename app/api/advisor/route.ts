// ============================================
// Pundi — AI Advisor API Proxy Route
// ============================================
// Server-side proxy to openagentic.id
// Client NEVER calls the AI API directly.
// API key is only accessible server-side.

import { NextRequest } from 'next/server';
import { ADVISOR_SYSTEM_PROMPT, ANALYSIS_SYSTEM_PROMPT } from '@/lib/ai/context';
// No auth check for local-first mode

const BASE_URL = process.env.AI_ADVISOR_BASE_URL || 'https://aimurah.my.id/api/v1';
const API_KEY = process.env.AI_ADVISOR_API_KEY || '';
const MODEL = process.env.AI_ADVISOR_MODEL || 'claude-sonnet-4.5';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function POST(request: NextRequest) {
  try {
    // Auth check removed for local-first mode

    // Validate API key is configured
    if (!API_KEY) {
      return Response.json(
        { error: 'AI advisor belum dikonfigurasi. Hubungi admin.' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { messages, financialContext, mode } = body as {
      messages: { role: 'user' | 'assistant'; content: string }[];
      financialContext: string;
      mode?: 'chat' | 'analysis';
    };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return Response.json(
        { error: 'Pesan tidak boleh kosong.' },
        { status: 400 }
      );
    }

    // Determine which system prompt to use
    const systemPrompt = mode === 'analysis' ? ANALYSIS_SYSTEM_PROMPT : ADVISOR_SYSTEM_PROMPT;

    // Build message history with system prompt + financial context
    const chatMessages: ChatMessage[] = [
      {
        role: 'system',
        content: systemPrompt,
      },
      {
        role: 'user',
        content: `Berikut konteks keuangan saya saat ini:\n\n${financialContext}\n\nGunakan data di atas untuk menjawab pertanyaan saya berikutnya secara relevan.`,
      },
    ];
    
    if (mode !== 'analysis') {
      chatMessages.push({
        role: 'assistant',
        content: 'Oke, aku sudah lihat data keuanganmu. Silakan tanya apa saja, aku siap bantu! 😊',
      });
    }

    // Append actual conversation history
    chatMessages.push(...messages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })));

    // Call openagentic.id API (OpenAI-compatible chat completion format)
    const apiResponse = await fetch(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: chatMessages,
        max_tokens: 1024,
        temperature: 0.7,
      }),
    });

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error('[AI Advisor] API error:', apiResponse.status, errorText);

      // Rate limit
      if (apiResponse.status === 429) {
        return Response.json(
          { error: 'Lagi rame nih, coba beberapa saat lagi ya 🙏' },
          { status: 429 }
        );
      }

      return Response.json(
        { error: 'Waduh, ada masalah sama AI-nya. Coba lagi nanti ya.' },
        { status: apiResponse.status }
      );
    }

    const rawText = await apiResponse.text();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let data: any = null;
    try {
      const cleanedText = rawText.replace(/data:\s*\[DONE\]\s*$/, '').trim();
      data = JSON.parse(cleanedText);
    } catch {
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
              if (chunk.choices && chunk.choices[0]?.delta?.content) {
                contentAccumulator += chunk.choices[0].delta.content;
              } else if (chunk.choices && chunk.choices[0]?.message?.content) {
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
            message: {
              content: contentAccumulator,
              role: 'assistant'
            }
          }];
        }
      }
    }

    if (!data) {
      console.error('[AI Advisor] Failed to parse response. Raw response:', rawText.slice(0, 1000));
      return Response.json(
        { error: 'Gagal menguraikan respon dari server AI.' },
        { status: 500 }
      );
    }

    // Extract assistant reply — handle both OpenAI and Anthropic response formats
    let reply = '';

    // OpenAI-compatible format
    if (data.choices && data.choices[0]?.message?.content) {
      reply = data.choices[0].message.content;
    }
    // Anthropic /v1/messages format
    else if (data.content && Array.isArray(data.content)) {
      reply = data.content
        .filter((block: { type: string }) => block.type === 'text')
        .map((block: { text: string }) => block.text)
        .join('');
    }
    // Fallback
    else {
      console.error('[AI Advisor] Unexpected response format:', JSON.stringify(data).substring(0, 500));
      reply = 'Maaf, aku lagi nggak bisa jawab. Coba lagi nanti ya.';
    }

    // Strip markdown code blocks if present
    reply = reply.replace(/```json\n?/g, '').replace(/```\n?/g, '');

    return Response.json({ reply });
  } catch (error) {
    console.error('[AI Advisor] Unexpected error:', error);
    return Response.json(
      { error: 'Terjadi kesalahan. Coba lagi nanti ya.' },
      { status: 500 }
    );
  }
}
