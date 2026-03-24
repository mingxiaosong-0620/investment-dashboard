const FRED_BASE = 'https://api.stlouisfed.org/fred/series/observations';

export interface FredObservation {
  date: string;   // 'YYYY-MM-DD'
  value: number;
}

/**
 * Fetch observations for a FRED series.
 * @param seriesId  FRED series ID (e.g. 'FEDFUNDS')
 * @param startDate ISO date string — omit to get all history
 * @param units     'lin' = levels (default), 'pc1' = percent change from year ago
 */
export async function fetchSeries(
  seriesId: string,
  startDate?: string,
  units: 'lin' | 'pc1' = 'lin'
): Promise<FredObservation[]> {
  const apiKey = process.env.FRED_API_KEY;
  if (!apiKey) throw new Error('FRED_API_KEY not set');

  const params = new URLSearchParams({
    series_id: seriesId,
    api_key: apiKey,
    file_type: 'json',
    sort_order: 'asc',
    units,
    ...(startDate && { observation_start: startDate }),
  });

  const res = await fetch(`${FRED_BASE}?${params}`);
  if (!res.ok) {
    throw new Error(`FRED API error for ${seriesId}: ${res.status} ${res.statusText}`);
  }

  const data = await res.json() as { observations: { date: string; value: string }[] };

  return data.observations
    .filter(o => o.value !== '.')  // '.' = missing value in FRED
    .map(o => ({ date: o.date, value: parseFloat(o.value) }));
}

/**
 * Fetch only the latest observation for a series.
 * Returns null if no valid data or on HTTP error.
 */
export async function fetchLatest(
  seriesId: string,
  units: 'lin' | 'pc1' = 'lin'
): Promise<FredObservation | null> {
  const apiKey = process.env.FRED_API_KEY;
  if (!apiKey) return null;

  const params = new URLSearchParams({
    series_id: seriesId,
    api_key: apiKey,
    file_type: 'json',
    sort_order: 'desc',
    limit: '1',
    units,
  });

  const res = await fetch(`${FRED_BASE}?${params}`);
  if (!res.ok) return null;

  const data = await res.json() as { observations: { date: string; value: string }[] };
  const obs = data.observations.find(o => o.value !== '.');
  if (!obs) return null;
  return { date: obs.date, value: parseFloat(obs.value) };
}
