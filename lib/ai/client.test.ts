// ============================================
// Pundi — AI Client Tests
// ============================================

import { describe, expect, it } from 'vitest';
import { parseAIResponse, parseAIJSON } from './client';

describe('parseAIResponse', () => {
  it('parses standard OpenAI-compatible JSON response', () => {
    const raw = JSON.stringify({
      id: 'chatcmpl-123',
      choices: [{ message: { content: 'Halo! Ini jawaban AI.', role: 'assistant' } }],
    });
    expect(parseAIResponse(raw)).toBe('Halo! Ini jawaban AI.');
  });

  it('handles trailing data: [DONE] marker', () => {
    const raw = JSON.stringify({
      id: 'chatcmpl-123',
      choices: [{ message: { content: 'Test reply', role: 'assistant' } }],
    }) + '\ndata: [DONE]\n';
    expect(parseAIResponse(raw)).toBe('Test reply');
  });

  it('strips markdown code fences from response', () => {
    const raw = JSON.stringify({
      id: 'chatcmpl-123',
      choices: [{ message: { content: '```json\n{"key": "value"}\n```', role: 'assistant' } }],
    });
    expect(parseAIResponse(raw)).toBe('{"key": "value"}\n');
  });

  it('accumulates streaming data: lines', () => {
    const raw = [
      'data: {"id":"chatcmpl-123","choices":[{"delta":{"content":"Hello"},"index":0}]}',
      'data: {"id":"chatcmpl-123","choices":[{"delta":{"content":" world"},"index":0}]}',
      'data: [DONE]',
    ].join('\n');
    expect(parseAIResponse(raw)).toBe('Hello world');
  });

  it('handles Anthropic v1/messages format', () => {
    const raw = JSON.stringify({
      content: [
        { type: 'text', text: 'Ini jawaban ' },
        { type: 'text', text: 'dari Anthropic.' },
      ],
    });
    expect(parseAIResponse(raw)).toBe('Ini jawaban dari Anthropic.');
  });

  it('returns null for completely invalid response', () => {
    expect(parseAIResponse('not json at all')).toBeNull();
  });

  it('returns null for empty response', () => {
    expect(parseAIResponse('')).toBeNull();
  });
});

describe('parseAIJSON', () => {
  it('parses clean JSON from AI content', () => {
    const result = parseAIJSON<{ key: string }>('{"key": "value"}');
    expect(result).toEqual({ key: 'value' });
  });

  it('extracts JSON from text with surrounding content', () => {
    const result = parseAIJSON<{ score: number }>('Here is the result: {"score": 85} Hope this helps!');
    expect(result).toEqual({ score: 85 });
  });

  it('returns null for non-JSON content', () => {
    expect(parseAIJSON('just plain text')).toBeNull();
  });

  it('returns null for malformed JSON', () => {
    expect(parseAIJSON('{broken: json}')).toBeNull();
  });
});
