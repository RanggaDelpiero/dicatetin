// ============================================
// Pundi — AI Advisor API Proxy Route
// ============================================
// Server-side proxy to openagentic.id
// Client NEVER calls the AI API directly.

import { NextRequest } from 'next/server';
import { ADVISOR_SYSTEM_PROMPT, ANALYSIS_SYSTEM_PROMPT } from '@/lib/ai/context';
import { callAIChatCompletion, AIMessage } from '@/lib/ai/client';

export async function POST(request: NextRequest) {
  try {
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
    const chatMessages: AIMessage[] = [
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

    // Call openagentic.id API via shared client
    const aiResult = await callAIChatCompletion({
      messages: chatMessages,
    });

    if (!aiResult.ok) {
      return Response.json(
        { error: aiResult.message },
        { status: aiResult.status === 0 ? 500 : aiResult.status }
      );
    }

    return Response.json({ reply: aiResult.content });
  } catch (error) {
    console.error('[AI Advisor] Unexpected error:', error);
    return Response.json(
      { error: 'Terjadi kesalahan. Coba lagi nanti ya.' },
      { status: 500 }
    );
  }
}

