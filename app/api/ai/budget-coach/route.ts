// ============================================
// Pundi — AI Budget Coach API Route
// ============================================
// POST /api/ai/budget-coach

import { NextRequest } from 'next/server';
import { BUDGET_COACH_PROMPT } from '@/lib/ai/prompts';
import { callAIChatCompletion, parseAIJSON } from '@/lib/ai/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { income, expense, categoryBreakdown, strictnessMode } = body;

    if (!income || income <= 0) {
      return Response.json(
        { error: 'Pendapatan harus lebih dari 0 untuk menggunakan AI Budget Coach.' },
        { status: 400 }
      );
    }

    const userInstruction = `
Buatkan budget dengan mode: ${strictnessMode || 'normal'}

Data:
Total Pemasukan: ${income}
Total Pengeluaran Bulan Lalu: ${expense}
Pengeluaran per kategori:
${JSON.stringify(categoryBreakdown)}

Bantu aku menentukan batas budget per kategori untuk bulan ini.
    `.trim();

    const aiResult = await callAIChatCompletion({
      messages: [
        { role: 'system', content: BUDGET_COACH_PROMPT },
        { role: 'user', content: userInstruction }
      ],
      maxTokens: 1000,
    });

    if (!aiResult.ok) {
      return Response.json(
        { error: aiResult.message },
        { status: aiResult.status === 0 ? 500 : aiResult.status }
      );
    }

    const parsed = parseAIJSON(aiResult.content);

    if (!parsed) {
      console.error('[AI Budget Coach] Invalid JSON schema returned:', aiResult.content);
      return Response.json(
        { error: 'Gagal membaca format rekomendasi dari AI.' },
        { status: 500 }
      );
    }

    return Response.json(parsed);

  } catch (error) {
    console.error('[AI Budget Coach] Unexpected error:', error);
    return Response.json(
      { error: 'Terjadi kesalahan internal. Coba lagi nanti.' },
      { status: 500 }
    );
  }
}
