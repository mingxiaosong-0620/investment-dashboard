import cron from 'node-cron';
import { INDICATORS } from '../config/indicators.js';
import { fetchSeries, fetchLatest } from '../services/fred.js';
import { upsertSnapshot } from '../db/queries.js';

/** Fetch the latest value for every FRED indicator and upsert to DB. */
export async function fetchAllIndicators(): Promise<void> {
  console.log('[dailyFetch] Starting fetch for', INDICATORS.length, 'indicators...');
  let success = 0, failed = 0;

  for (const indicator of INDICATORS) {
    try {
      const obs = await fetchLatest(indicator.seriesId, indicator.fredUnits);
      if (!obs) {
        console.warn(`[dailyFetch] No data for ${indicator.seriesId}`);
        failed++;
        continue;
      }
      await upsertSnapshot(indicator.seriesId, obs.date, obs.value);
      success++;
    } catch (err) {
      console.error(`[dailyFetch] Failed ${indicator.seriesId}:`, err);
      failed++;
    }
  }

  console.log(`[dailyFetch] Done: ${success} ok, ${failed} failed`);
}

/**
 * Backfill 5 years of history for all indicators.
 * Run once on first deploy when DB is empty.
 */
export async function backfillAll(): Promise<void> {
  const startDate = new Date();
  startDate.setFullYear(startDate.getFullYear() - 5);
  const startStr = startDate.toISOString().slice(0, 10);

  console.log('[backfill] Fetching 5-year history from', startStr);

  for (const indicator of INDICATORS) {
    try {
      const obs = await fetchSeries(indicator.seriesId, startStr, indicator.fredUnits);
      for (const o of obs) {
        await upsertSnapshot(indicator.seriesId, o.date, o.value);
      }
      console.log(`[backfill] ${indicator.seriesId}: ${obs.length} observations`);
    } catch (err) {
      console.error(`[backfill] Failed ${indicator.seriesId}:`, err);
    }
  }
  console.log('[backfill] Complete');
}

/** Register the daily cron job at 06:00 UTC. Call once at startup. */
export function startDailyFetchJob(): void {
  cron.schedule('0 6 * * *', async () => {
    console.log('[cron] Daily fetch triggered at', new Date().toISOString());
    await fetchAllIndicators();
  }, { timezone: 'UTC' });

  console.log('[cron] Daily fetch job scheduled for 06:00 UTC');
}
