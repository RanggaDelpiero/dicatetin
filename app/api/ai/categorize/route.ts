// ============================================
// Pundi — AI Categorization API Route
// ============================================
// POST /api/ai/categorize

import { NextRequest } from 'next/server';
import { CATEGORIZATION_PROMPT } from '@/lib/ai/prompts';
import { callAIChatCompletion, parseAIJSON } from '@/lib/ai/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { note, categories, type } = body;

    if (!note || !categories || categories.length === 0) {
      return Response.json(
        { error: 'Catatan dan daftar kategori harus disertakan.' },
        { status: 400 }
      );
    }

    const availableCategories = categories.map((c: any) => ({
      id: c.id,
      name: c.name
    }));

    const userInstruction = `
Catatan Transaksi: "${note}"
Tipe Transaksi: ${type || 'expense'}

Kategori yang tersedia:
${JSON.stringify(availableCategories)}

Pilih kategori yang paling cocok untuk catatan transaksi di atas.
    `.trim();

    const aiResult = await callAIChatCompletion({
      messages: [
        { role: 'system', content: CATEGORIZATION_PROMPT },
        { role: 'user', content: userInstruction }
      ],
      maxTokens: 500,
      temperature: 0.3, // Lower temperature for more deterministic categorization
    });

    if (!aiResult.ok) {
      return Response.json(
        { error: aiResult.message },
        { status: aiResult.status === 0 ? 500 : aiResult.status }
      );
    }

    const parsed = parseAIJSON(aiResult.content);

    if (!parsed) {
      console.error('[AI Categorize] Invalid JSON schema returned:', aiResult.content);
      return Response.json(
        { error: 'Gagal menguraikan hasil kategorisasi AI.' },
        { status: 500 }
      );
    }

    return Response.json(parsed);

  } catch (error) {
    console.error('[AI Categorize] Unexpected error:', error);
    return Response.json(
      { error: 'Terjadi kesalahan internal. Coba lagi nanti.' },
      { status: 500 }
    );
  }
}
