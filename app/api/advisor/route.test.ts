import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

describe('AI Advisor API', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('should return 503 if API_KEY is not configured', async () => {
    vi.stubEnv('AI_ADVISOR_API_KEY', '');
    const { POST } = await import('./route');

    const req = new NextRequest('http://localhost/api/advisor', {
      method: 'POST',
      body: JSON.stringify({ messages: [], financialContext: '' })
    });

    const response = await POST(req);
    expect(response.status).toBe(503);

    const data = await response.json();
    expect(data.error).toBe('AI advisor belum dikonfigurasi. Hubungi admin.');
  });

  it('should return 400 if messages is empty', async () => {
    vi.stubEnv('AI_ADVISOR_API_KEY', 'test-key');
    const { POST } = await import('./route');

    const req = new NextRequest('http://localhost/api/advisor', {
      method: 'POST',
      body: JSON.stringify({ messages: [], financialContext: 'test' })
    });

    const response = await POST(req);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Pesan tidak boleh kosong.');
  });

  it('should return 400 if messages is undefined', async () => {
    vi.stubEnv('AI_ADVISOR_API_KEY', 'test-key');
    const { POST } = await import('./route');

    const req = new NextRequest('http://localhost/api/advisor', {
      method: 'POST',
      body: JSON.stringify({ financialContext: 'test' })
    });

    const response = await POST(req);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Pesan tidak boleh kosong.');
  });

  it('should return 500 on unexpected error (e.g. invalid json body)', async () => {
    vi.stubEnv('AI_ADVISOR_API_KEY', 'test-key');
    const { POST } = await import('./route');

    const req = new NextRequest('http://localhost/api/advisor', {
      method: 'POST',
      // passing non-json content should throw and be caught
      body: 'invalid-json'
    });

    const response = await POST(req);
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe('Terjadi kesalahan. Coba lagi nanti ya.');
  });
});
