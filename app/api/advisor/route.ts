// ============================================
// Pundi — AI Advisor API Proxy Route
// ============================================
// Server-side proxy to openagentic.id
// Client NEVER calls the AI API directly.
// API key is only accessible server-side.

import { NextRequest } from 'next/server';
import { ADVISOR_SYSTEM_PROMPT } from '@/lib/ai/context';

const BASE_URL = process.env.AI_ADVISOR_BASE_URL || 'https://openagentic.id/api/v1';
const API_KEY = process.env.AI_ADVISOR_API_KEY || '';
const MODEL = process.env.AI_ADVISOR_MODEL || 'claude-sonnet-4.5';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function POST(request: NextRequest) {
  try {
    // Validate API key is configured
    if (!API_KEY) {
      return Response.json(
        { error: 'AI advisor belum dikonfigurasi. Hubungi admin.' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { messages, financialContext } = body as {
      messages: { role: 'user' | 'assistant'; content: string }[];
      financialContext: string;
    };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return Response.json(
        { error: 'Pesan tidak boleh kosong.' },
        { status: 400 }
      );
    }

    // Build message history with system prompt + financial context
    const chatMessages: ChatMessage[] = [
      {
        role: 'system',
        content: ADVISOR_SYSTEM_PROMPT,
      },
      {
        role: 'user',
        content: `Berikut konteks keuangan saya saat ini:\n\n${financialContext}\n\nGunakan data di atas untuk menjawab pertanyaan saya berikutnya secara relevan.`,
      },
      {
        role: 'assistant',
        content: 'Oke, aku sudah lihat data keuanganmu. Silakan tanya apa saja, aku siap bantu! 😊',
      },
      // Append actual conversation history
      ...messages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    ];

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

    const data = await apiResponse.json();

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

    return Response.json({ reply });
  } catch (error) {
    console.error('[AI Advisor] Unexpected error:', error);
    return Response.json(
      { error: 'Terjadi kesalahan. Coba lagi nanti ya.' },
      { status: 500 }
    );
  }
}
