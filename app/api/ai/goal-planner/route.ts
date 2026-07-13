// ============================================
// Pundi — AI Goal Planner API Route
// ============================================
// POST /api/ai/goal-planner

import { NextRequest } from 'next/server';
import { GOAL_PLAN_PROMPT } from '@/lib/ai/prompts';
import { callAIChatCompletion, parseAIJSON } from '@/lib/ai/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { goalName, targetAmount, currentSaved, income, expense, categoryBreakdown } = body;

    if (!goalName || !targetAmount) {
      return Response.json(
        { error: 'Nama tujuan dan target nominal harus diisi.' },
        { status: 400 }
      );
    }

    const userInstruction = `
User ingin membuat rencana untuk mencapai target:
- Nama Target: ${goalName}
- Nominal Target: ${targetAmount}
- Sudah Terkumpul: ${currentSaved || 0}

Kondisi keuangan saat ini:
- Pemasukan bulanan: ${income || 0}
- Pengeluaran bulanan rata-rata: ${expense || 0}
- Breakdown pengeluaran: ${JSON.stringify(categoryBreakdown || [])}

Tolong hasilkan 3 rencana (relaxed, balanced, aggressive) untuk mencapai target ini, beserta rekomendasi penghematan dari breakdown pengeluaran.
    `.trim();

    const aiResult = await callAIChatCompletion({
      messages: [
        { role: 'system', content: GOAL_PLAN_PROMPT },
        { role: 'user', content: userInstruction }
      ],
      maxTokens: 1500,
      temperature: 0.7,
    });

    if (!aiResult.ok) {
      return Response.json(
        { error: aiResult.message },
        { status: aiResult.status === 0 ? 500 : aiResult.status }
      );
    }

    const parsed = parseAIJSON(aiResult.content);

    if (!parsed) {
      console.error('[AI Goal Planner] Invalid JSON schema returned:', aiResult.content);
      return Response.json(
        { error: 'Gagal menguraikan hasil dari AI Planner.' },
        { status: 500 }
      );
    }

    return Response.json(parsed);

  } catch (error) {
    console.error('[AI Goal Planner] Unexpected error:', error);
    return Response.json(
      { error: 'Terjadi kesalahan internal. Coba lagi nanti.' },
      { status: 500 }
    );
  }
}
