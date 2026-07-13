// ============================================
// Pundi — AI Monthly Review API Route
// ============================================
// POST /api/ai/monthly-review

import { NextRequest } from 'next/server';
import { callAIChatCompletion, parseAIJSON } from '@/lib/ai/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { month, year, income, expense, savings, topCategories, topMerchants, previousMonthExpense } = body;

    const userInstruction = `
Buatkan review bulanan untuk bulan ${month} ${year}.
Data Keuangan:
- Total Pemasukan: ${income}
- Total Pengeluaran: ${expense}
- Total Ditabung: ${savings}
- Pengeluaran bulan sebelumnya: ${previousMonthExpense || 'Tidak ada data'}
- Kategori terbesar: ${JSON.stringify(topCategories)}
- Merchant/Tujuan pengeluaran terbesar: ${JSON.stringify(topMerchants)}

Berikan analisis performa bulan ini (apakah lebih boros atau hemat), highlight pengeluaran terbesar yang bisa ditekan, dan berikan skor 1-100 atas kebiasaan keuangannya bulan ini beserta 3 rekomendasi actionable.
    `.trim();

    const systemPrompt = `
Kamu adalah "Pundi AI", asisten keuangan pribadi yang bijak, suportif, dan analitis.
Berikan review bulanan keuangan dalam format JSON dengan struktur:
{
  "score": number (1-100),
  "title": string (Judul singkat menarik, misal "Bulan Ini Sedikit Boros di Kopi!"),
  "summary": string (Paragraf singkat evaluasi umum),
  "highlights": [
    { "type": "positive" | "negative" | "neutral", "message": string }
  ],
  "recommendations": [ string, string, string ]
}
Pastikan respons menggunakan bahasa Indonesia kasual namun sopan.
    `.trim();

    const aiResult = await callAIChatCompletion({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userInstruction }
      ],
      maxTokens: 1000,
      temperature: 0.6,
    });

    if (!aiResult.ok) {
      return Response.json(
        { error: aiResult.message },
        { status: aiResult.status === 0 ? 500 : aiResult.status }
      );
    }

    const parsed = parseAIJSON(aiResult.content);

    if (!parsed) {
      console.error('[AI Monthly Review] Invalid JSON schema returned:', aiResult.content);
      return Response.json(
        { error: 'Gagal menguraikan hasil dari AI.' },
        { status: 500 }
      );
    }

    return Response.json(parsed);

  } catch (error) {
    console.error('[AI Monthly Review] Unexpected error:', error);
    return Response.json(
      { error: 'Terjadi kesalahan internal. Coba lagi nanti.' },
      { status: 500 }
    );
  }
}
