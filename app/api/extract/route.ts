// ============================================
// Pundi — AI Photo & Voice Extraction API
// ============================================

import { NextRequest } from 'next/server';

const BASE_URL = process.env.AI_ADVISOR_BASE_URL || 'https://openagentic.id/api/v1';
const API_KEY = process.env.AI_ADVISOR_API_KEY || '';
const MODEL = process.env.AI_ADVISOR_MODEL || 'claude-sonnet-4.5';

const EXPENSE_CATEGORIES = [
  "Makan & Minum", "Transport", "Belanja", "Hiburan", "Tagihan", 
  "Kesehatan", "Pendidikan", "Kopi", "Groceries", "Langganan", "Donasi", "Lainnya"
];
const INCOME_CATEGORIES = ["Gaji", "Freelance", "Investasi", "Hadiah", "Lainnya"];

export async function POST(request: NextRequest) {
  try {
    if (!API_KEY) {
      return Response.json(
        { error: 'AI extractor belum dikonfigurasi. Hubungi admin.' },
        { status: 503 }
      );
    }

    const { type, image, text, mode } = await request.json() as {
      type: 'photo' | 'voice';
      image?: string; // base64 string
      text?: string;  // voice transcript
      mode: 'transaction' | 'split';
    };

    if (type === 'photo' && !image) {
      return Response.json({ error: 'Gambar tidak ditemukan.' }, { status: 400 });
    }

    if (type === 'voice' && !text) {
      return Response.json({ error: 'Teks transkripsi suara tidak ditemukan.' }, { status: 400 });
    }

    // System prompt directing JSON parsing
    const systemPrompt = `Kamu adalah Pundi AI OCR/Voice extractor. Tugasmu adalah mengekstrak data dari input (bisa berupa foto struk belanja atau transkripsi suara) menjadi format JSON terstruktur yang valid.

Kategori pengeluaran yang diperbolehkan: ${JSON.stringify(EXPENSE_CATEGORIES)}
Kategori pemasukan yang diperbolehkan: ${JSON.stringify(INCOME_CATEGORIES)}

Aturan output:
- Harus mengembalikan JSON SAJA, tanpa penjelasan markdown, tanpa tag kode \`\`\`json.
- Angka uang/amount harus bertipe integer (bulat).

Jika mode adalah "transaction":
Kembalikan format JSON berikut:
{
  "type": "expense" | "income",
  "amount": number,
  "category": string (pilih salah satu dari kategori di atas yang paling cocok),
  "note": string (catatan singkat nama barang/toko)
}

Jika mode adalah "split":
Kembalikan format JSON berikut:
{
  "title": string (judul acara split bill, misal: Makan Bakso, Kopi Sore),
  "total_amount": number (total tagihan),
  "participants": string[] (daftar nama orang yang berhutang, ekstrak nama-nama jika ada. Jika tidak terdeteksi nama, buat list kosong [])
}

PENTING: Jangan tambahkan kata pengantar, hanya output-kan JSON mentah yang valid.`;

    let messages: any[] = [];

    if (type === 'photo') {
      // Clean base64 header if present
      const base64Data = image!.replace(/^data:image\/\w+;base64,/, '');

      messages = [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Ekstrak data dari foto struk ini untuk mode: ${mode}. Kembalikan format JSON saja.`,
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${base64Data}`,
              },
            },
          ],
        },
      ];
    } else {
      messages = [
        {
          role: 'user',
          content: `Ekstrak data dari ucapan suara berikut untuk mode: ${mode}.
Teks suara: "${text}"

Kembalikan format JSON saja.`,
        },
      ];
    }

    // Call openagentic.id
    const response = await fetch(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        temperature: 0.1, // low temp for accurate parsing
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('[AI Extract] API Error:', response.status, err);
      return Response.json({ error: 'Gagal mengekstrak data via AI.' }, { status: 500 });
    }

    const resData = await response.json();
    let reply = resData.choices?.[0]?.message?.content || '';

    // Robust extraction helper to extract the first JSON object block
    let cleanReply = reply.trim();
    const firstBrace = cleanReply.indexOf('{');
    const lastBrace = cleanReply.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleanReply = cleanReply.substring(firstBrace, lastBrace + 1);
    }

    try {
      const parsed = JSON.parse(cleanReply);
      return Response.json(parsed);
    } catch (parseErr) {
      console.error('[AI Extract] Failed to parse AI output as JSON. Original:', reply, 'Cleaned:', cleanReply);
      return Response.json({ error: 'AI mengembalikan format yang tidak valid.' }, { status: 500 });
    }
  } catch (error) {
    console.error('[AI Extract] Unexpected error:', error);
    return Response.json({ error: 'Terjadi kesalahan sistem.' }, { status: 500 });
  }
}
