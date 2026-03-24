import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock global fetch BEFORE importing the module under test
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

process.env.FRED_API_KEY = 'test_key';

const { fetchSeries, fetchLatest } = await import('../services/fred.js');

describe('fetchSeries', () => {
  beforeEach(() => mockFetch.mockReset());

  it('returns parsed observations excluding missing values', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        observations: [
          { date: '2024-01-01', value: '5.33' },
          { date: '2024-02-01', value: '.' },  // missing — should be excluded
          { date: '2024-03-01', value: '5.25' },
        ],
      }),
    });
    const result = await fetchSeries('FEDFUNDS', '2024-01-01');
    expect(result).toEqual([
      { date: '2024-01-01', value: 5.33 },
      { date: '2024-03-01', value: 5.25 },
    ]);
  });

  it('throws on HTTP error', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 400, statusText: 'Bad Request' });
    await expect(fetchSeries('INVALID')).rejects.toThrow('FRED API error');
  });
});

describe('fetchLatest', () => {
  beforeEach(() => mockFetch.mockReset());

  it('returns the most recent non-missing observation', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        observations: [
          { date: '2024-03-01', value: '5.33' },
        ],
      }),
    });
    const result = await fetchLatest('FEDFUNDS');
    expect(result).toEqual({ date: '2024-03-01', value: 5.33 });
  });

  it('returns null when FRED returns no valid observations', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ observations: [{ date: '2024-03-01', value: '.' }] }),
    });
    const result = await fetchLatest('FEDFUNDS');
    expect(result).toBeNull();
  });

  it('returns null on HTTP error', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 500, statusText: 'Server Error' });
    const result = await fetchLatest('FEDFUNDS');
    expect(result).toBeNull();
  });
});
