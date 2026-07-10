// ============================================
// Pundi — AI Photo & Voice Extraction API
// ============================================

import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const BASE_URL = process.env.AI_ADVISOR_BASE_URL || 'https://aimurah.my.id/api/v1';
const API_KEY = process.env.AI_ADVISOR_API_KEY || '';
const MODEL = process.env.AI_ADVISOR_MODEL || 'claude-sonnet-4.5';

const EXPENSE_CATEGORIES = [
  "Makan & Minum", "Transport", "Belanja", "Hiburan", "Tagihan", 
  "Kesehatan", "Pendidikan", "Kopi", "Groceries", "Langganan", "Donasi", "Lainnya"
];
const INCOME_CATEGORIES = ["Gaji", "Freelance", "Investasi", "Hadiah", "Lainnya"];

/**
 * Robust JSON extraction from AI response string.
 * Tries multiple strategies to extract valid JSON.
 */
function extractJSON(raw: string): Record<string, unknown> | null {
  let text = raw.trim();

  // Strategy 1: Strip markdown code fences (```json ... ``` or ``` ... ```)
  const fenceRegex = /```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/;
  const fenceMatch = text.match(fenceRegex);
  if (fenceMatch) {
    text = fenceMatch[1].trim();
  }

  // Strategy 2: Try direct parse
  try {
    return JSON.parse(text);
  } catch {
    // continue to next strategy
  }

  // Strategy 2.5: Aggressive regex extraction
  const jsonRegex = /(\{[\s\S]*\}|\[[\s\S]*\])/;
  const jsonMatch = text.match(jsonRegex);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[1]);
    } catch {
      // continue
    }
  }

  // Strategy 3: Extract first JSON object using brace matching
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    const candidate = text.substring(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(candidate);
    } catch {
      // Strategy 4: Fix trailing commas (common AI mistake)
      const fixed = candidate
        .replace(/,\s*}/g, '}')
        .replace(/,\s*]/g, ']');
      try {
        return JSON.parse(fixed);
      } catch {
        // continue
      }
    }
  }

  // Strategy 5: Try to find JSON array
  const firstBracket = text.indexOf('[');
  const lastBracket = text.lastIndexOf(']');
  if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
    const candidate = text.substring(firstBracket, lastBracket + 1);
    try {
      const arr = JSON.parse(candidate);
      // Wrap array in object
      return { items: arr };
    } catch {
      // all strategies failed
    }
  }

  return null;
}

/**
 * Call the AI model and return the raw content string.
 */
async function callAI(
  systemPrompt: string,
  messages: Record<string, unknown>[]
): Promise<{ content: string | null; error: string | null; status: number }> {
  try {
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
          ...messages,
        ],
        temperature: 0.1,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('[AI Extract] API Error:', response.status, err);
      return { content: null, error: 'Gagal mengekstrak data via AI.', status: response.status };
    }

    const resData = await response.json();

    // Check for API errors in the payload (some proxies return errors on 200)
    if (resData.error) {
      console.error('[AI Extract] Proxy error payload:', resData.error);
      const msg = typeof resData.error === 'string'
        ? resData.error
        : (resData.error.message || 'Error dari provider AI.');
      return { content: null, error: msg, status: 500 };
    }

    let reply = '';
    // OpenAI-compatible format
    if (resData.choices && resData.choices[0]?.message?.content) {
      reply = resData.choices[0].message.content;
    }
    // Anthropic /v1/messages format
    else if (resData.content && Array.isArray(resData.content)) {
      reply = resData.content
        .filter((block: Record<string, unknown>) => block.type === 'text')
        .map((block: Record<string, unknown>) => block.text)
        .join('');
    }

    if (!reply) {
      console.error('[AI Extract] Empty content. Full response:', JSON.stringify(resData).slice(0, 500));
      return { content: null, error: 'AI tidak mengembalikan respon. Silakan periksa limit/saldo API Anda.', status: 500 };
    }

    return { content: reply, error: null, status: 200 };
  } catch (err) {
    console.error('[AI Extract] Network error:', err);
    return { content: null, error: 'Gagal terhubung ke server AI.', status: 500 };
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!API_KEY) {
      return Response.json(
        { error: 'AI extractor belum dikonfigurasi. Hubungi admin.' },
        { status: 503 }
      );
    }

    const { type, image, text, mode } = await request.json() as {
      type: 'photo' | 'voice';
      image?: string;
      text?: string;
      mode: 'transaction' | 'split';
    };

    if (type === 'photo' && !image) {
      return Response.json({ error: 'Gambar tidak ditemukan.' }, { status: 400 });
    }

    if (type === 'voice' && !text) {
      return Response.json({ error: 'Teks transkripsi suara tidak ditemukan.' }, { status: 400 });
    }

    // System prompt
    const systemPrompt = `Kamu adalah Pundi AI, asisten yang mengekstrak data keuangan dari foto struk atau ucapan suara. Kamu HANYA mengembalikan JSON mentah yang valid, TANPA penjelasan, TANPA markdown, TANPA kode blok. HANYA BERIKAN RAW JSON OBJECT.

Kategori pengeluaran: ${JSON.stringify(EXPENSE_CATEGORIES)}
Kategori pemasukan: ${JSON.stringify(INCOME_CATEGORIES)}

ATURAN PENTING:
1. Output HARUS berupa JSON valid saja, langsung dimulai dengan karakter { 
2. JANGAN bungkus dalam \`\`\`json atau \`\`\` atau tanda apapun
3. JANGAN tambahkan teks penjelasan sebelum atau sesudah JSON
4. Semua nilai uang/harga harus integer (bulat, tanpa desimal)
5. JANGAN gunakan trailing comma

${mode === 'transaction' ? `Format output untuk transaksi:
{
  "type": "expense",
  "amount": 25000,
  "category": "Makan & Minum",
  "note": "Nasi goreng di warung"
}

Field type bisa "expense" atau "income". Pilih category dari daftar yang tersedia.` : `Format output untuk split bill:
{
  "title": "Makan Siang Bareng",
  "total_amount": 150000,
  "items": [
    {"name": "Nasi Goreng", "price": 25000, "qty": 1},
    {"name": "Es Teh Manis", "price": 5000, "qty": 3},
    {"name": "Ayam Bakar", "price": 35000, "qty": 1}
  ]
}

PENTING untuk split bill:
- Selalu sertakan field "items" berisi daftar item/menu yang terdeteksi
- Setiap item harus punya: name (string), price (integer), qty (integer, default 1)
- "total_amount" adalah total keseluruhan tagihan
- Jika ada nama orang yang terdeteksi, tambahkan field "participants": ["nama1", "nama2"]
- Jika tidak ada nama orang, JANGAN sertakan field "participants"`}`;

    // Build messages
    let messages: Record<string, unknown>[] = [];

    if (type === 'photo') {
      messages = [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Ekstrak data dari foto struk ini untuk mode: ${mode}. Kembalikan JSON saja tanpa penjelasan.`,
            },
            {
              type: 'image_url',
              image_url: {
                url: image,
              },
            },
          ],
        },
      ];
    } else {
      messages = [
        {
          role: 'user',
          content: `Ekstrak data dari ucapan berikut untuk mode: ${mode}. Kembalikan JSON saja tanpa penjelasan.\n\nUcapan: "${text}"`,
        },
      ];
    }

    // First attempt
    const firstAttempt = await callAI(systemPrompt, messages);
    if (firstAttempt.error) {
      return Response.json({ error: firstAttempt.error }, { status: firstAttempt.status });
    }

    const parsed = extractJSON(firstAttempt.content!);
    if (parsed) {
      return Response.json(parsed);
    }

    // Retry: ask AI to fix its own output
    console.warn('[AI Extract] First parse failed, retrying with fix prompt. Original:', firstAttempt.content);

    const retryMessages: Record<string, unknown>[] = [
      {
        role: 'user',
        content: `Output sebelumnya tidak valid JSON. Ini output aslinya:\n\n${firstAttempt.content}\n\nTolong perbaiki menjadi JSON valid saja (langsung dimulai dengan {, tanpa markdown, tanpa penjelasan). Pertahankan semua data yang ada.`,
      },
    ];

    const retryAttempt = await callAI(systemPrompt, retryMessages);
    if (retryAttempt.error) {
      return Response.json({ error: retryAttempt.error }, { status: retryAttempt.status });
    }

    const retryParsed = extractJSON(retryAttempt.content!);
    if (retryParsed) {
      return Response.json(retryParsed);
    }

    console.error('[AI Extract] Both attempts failed. First:', firstAttempt.content, 'Retry:', retryAttempt.content);
    return Response.json(
      { error: 'AI gagal mengembalikan data terstruktur. Coba foto ulang dengan pencahayaan lebih baik, atau input manual.' },
      { status: 422 }
    );
  } catch (error) {
    console.error('[AI Extract] Unexpected error:', error);
    return Response.json({ error: 'Terjadi kesalahan sistem.' }, { status: 500 });
  }
}
