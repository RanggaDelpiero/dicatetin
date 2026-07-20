// ============================================
// Pundi — AI Autopilot API Route
// ============================================
// POST /api/ai/autopilot

import { NextRequest } from 'next/server';
import { AUTOPILOT_PROMPT } from '@/lib/ai/prompts';
import { callAIChatCompletion, parseAIJSON } from '@/lib/ai/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sanitizedPayload, localCandidates } = body;

    if (!sanitizedPayload) {
      return Response.json({ error: 'Payload tidak valid.' }, { status: 400 });
    }

    // Build the instruction
    const userInstruction = `
Ini adalah data keuangan user:
${JSON.stringify(sanitizedPayload)}

Ini adalah kandidat insight lokal yang sudah dideteksi sistem (utamakan ini jika relevan):
${JSON.stringify(localCandidates || [])}

Tolong hasilkan 3-5 insight keuangan yang proaktif, singkat, dan actionable untuk user.
Gunakan format JSON yang sudah ditentukan.
    `.trim();

    const aiResult = await callAIChatCompletion({
      messages: [
        { role: 'system', content: AUTOPILOT_PROMPT },
        { role: 'user', content: userInstruction }
      ],
      maxTokens: 1500,
    });

    if (!aiResult.ok) {
      return Response.json(
        { error: aiResult.message },
        { status: aiResult.status === 0 ? 500 : aiResult.status }
      );
    }

    // Parse the JSON response
    let parsed: { insights?: unknown[] } | unknown[] | null = parseAIJSON(aiResult.content);

    // If AI returned an array directly instead of { insights: [...] }
    if (Array.isArray(parsed)) {
      parsed = { insights: parsed };
    }

    if (!parsed || !parsed.insights || !Array.isArray(parsed.insights)) {
      console.warn('[AI Autopilot] Invalid JSON schema returned, falling back to local candidates. AI Output:', aiResult.content);
      // Fallback gracefully instead of throwing 500
      return Response.json({ insights: localCandidates || [] });
    }

    return Response.json({ insights: parsed.insights });

  } catch (error) {
    console.error('[AI Autopilot] Unexpected error:', error);
    return Response.json(
      { error: 'Terjadi kesalahan internal. Coba lagi nanti.' },
      { status: 500 }
    );
  }
}
