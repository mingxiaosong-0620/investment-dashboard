import { Router } from 'express';
import pool from '../db/client.js';

const router = Router();

function requireAdmin(req: any, res: any, next: any) {
  if (req.headers['x-admin-key'] !== process.env.ADMIN_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// ─── Holdings ────────────────────────────────────────────────────────────────

router.get('/holdings', async (_req, res) => {
  try {
    const result = await pool.query(
      'SELECT symbol, name, asset_type as "assetType", allocation FROM portfolio_holdings ORDER BY allocation DESC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('[portfolio/holdings GET]', err);
    res.status(500).json({ error: 'Failed to fetch holdings' });
  }
});

// Replace entire portfolio (upsert all, delete removed)
router.post('/holdings', requireAdmin, async (req, res) => {
  const holdings: { symbol: string; name: string; assetType: string; allocation: number }[] = req.body;
  if (!Array.isArray(holdings)) return res.status(400).json({ error: 'Expected array' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM portfolio_holdings');
    for (const h of holdings) {
      await client.query(
        `INSERT INTO portfolio_holdings (symbol, name, asset_type, allocation, updated_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [h.symbol.toUpperCase(), h.name, h.assetType || 'stock', h.allocation]
      );
    }
    await client.query('COMMIT');
    res.json({ ok: true, count: holdings.length });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[portfolio/holdings POST]', err);
    res.status(500).json({ error: 'Failed to save holdings' });
  } finally {
    client.release();
  }
});

// ─── Prices ──────────────────────────────────────────────────────────────────

async function fetchYahooHistory(symbol: string, days = 180): Promise<{ date: string; close: number; open: number; high: number; low: number }[]> {
  const range = days <= 30 ? '1mo' : days <= 90 ? '3mo' : days <= 180 ? '6mo' : '1y';
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=${range}`;
  const resp = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  if (!resp.ok) throw new Error(`Yahoo Finance error ${resp.status} for ${symbol}`);
  const json: any = await resp.json();
  const result = json?.chart?.result?.[0];
  if (!result) throw new Error(`No data for ${symbol}`);
  const timestamps: number[] = result.timestamp || [];
  const closes: number[] = result.indicators?.quote?.[0]?.close || [];
  const opens: number[] = result.indicators?.quote?.[0]?.open || [];
  const highs: number[] = result.indicators?.quote?.[0]?.high || [];
  const lows: number[] = result.indicators?.quote?.[0]?.low || [];
  return timestamps.map((ts, i) => ({
    date: new Date(ts * 1000).toISOString().slice(0, 10),
    close: closes[i] ?? 0,
    open: opens[i] ?? 0,
    high: highs[i] ?? 0,
    low: lows[i] ?? 0,
  })).filter(r => r.close > 0);
}

async function upsertPrices(symbol: string, rows: { date: string; close: number; open: number; high: number; low: number }[]) {
  for (const r of rows) {
    await pool.query(
      `INSERT INTO portfolio_prices (symbol, date, close, open, high, low, fetched_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       ON CONFLICT (symbol, date) DO UPDATE SET close=$3, open=$4, high=$5, low=$6, fetched_at=NOW()`,
      [symbol, r.date, r.close, r.open, r.high, r.low]
    );
  }
}

router.get('/prices', async (_req, res) => {
  try {
    const holdingsResult = await pool.query('SELECT symbol FROM portfolio_holdings');
    const symbols: string[] = holdingsResult.rows.map((r: any) => r.symbol);
    if (symbols.length === 0) return res.json([]);

    // Refresh prices for each symbol (fetch from Yahoo, upsert to DB)
    const refreshErrors: string[] = [];
    await Promise.all(symbols.map(async (sym) => {
      try {
        const history = await fetchYahooHistory(sym, 180);
        await upsertPrices(sym, history);
      } catch (err: any) {
        refreshErrors.push(`${sym}: ${err.message}`);
      }
    }));

    // Return stored price history for all symbols
    const result = await pool.query(
      `SELECT symbol, date::text, close, open, high, low
       FROM portfolio_prices
       WHERE symbol = ANY($1) AND date >= NOW() - INTERVAL '180 days'
       ORDER BY symbol, date ASC`,
      [symbols]
    );

    // Group by symbol
    const bySymbol: Record<string, any> = {};
    for (const row of result.rows) {
      if (!bySymbol[row.symbol]) bySymbol[row.symbol] = [];
      bySymbol[row.symbol].push({ date: row.date, close: parseFloat(row.close), open: parseFloat(row.open), high: parseFloat(row.high), low: parseFloat(row.low) });
    }

    const prices = symbols.map(sym => {
      const history = bySymbol[sym] || [];
      const latest = history[history.length - 1] ?? null;
      const prev = history[history.length - 2] ?? null;
      const monthAgo = history[Math.max(0, history.length - 21)] ?? null;
      return {
        symbol: sym,
        latestClose: latest?.close ?? null,
        latestDate: latest?.date ?? null,
        change1d: latest && prev ? ((latest.close - prev.close) / prev.close) * 100 : null,
        change1m: latest && monthAgo ? ((latest.close - monthAgo.close) / monthAgo.close) * 100 : null,
        history: history.slice(-60),
      };
    });

    res.json({ prices, errors: refreshErrors.length ? refreshErrors : undefined });
  } catch (err) {
    console.error('[portfolio/prices GET]', err);
    res.status(500).json({ error: 'Failed to fetch prices' });
  }
});

// ─── Portfolio Insights ───────────────────────────────────────────────────────

router.get('/insights', async (_req, res) => {
  try {
    const overallResult = await pool.query(
      `SELECT content, generated_at FROM portfolio_insights
       WHERE type = 'overall' ORDER BY generated_at DESC LIMIT 1`
    );
    const assetResults = await pool.query(
      `SELECT DISTINCT ON (symbol) symbol, content, generated_at
       FROM portfolio_insights WHERE type = 'asset'
       ORDER BY symbol, generated_at DESC`
    );
    const assets: Record<string, { content: string; generatedAt: string }> = {};
    for (const row of assetResults.rows) {
      assets[row.symbol] = { content: row.content, generatedAt: row.generated_at };
    }
    res.json({
      overall: overallResult.rows[0] ? { content: overallResult.rows[0].content, generatedAt: overallResult.rows[0].generated_at } : null,
      assets,
    });
  } catch (err) {
    console.error('[portfolio/insights GET]', err);
    res.status(500).json({ error: 'Failed to fetch portfolio insights' });
  }
});

router.post('/insights', requireAdmin, async (req, res) => {
  const { overall, assets } = req.body as { overall?: string; assets?: Record<string, string> };
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    if (overall) {
      await client.query(
        `INSERT INTO portfolio_insights (type, symbol, content) VALUES ('overall', NULL, $1)`,
        [overall]
      );
    }
    if (assets) {
      for (const [symbol, content] of Object.entries(assets)) {
        await client.query(
          `INSERT INTO portfolio_insights (type, symbol, content) VALUES ('asset', $1, $2)`,
          [symbol, content]
        );
      }
    }
    await client.query('COMMIT');
    res.json({ ok: true, savedAt: new Date().toISOString() });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[portfolio/insights POST]', err);
    res.status(500).json({ error: 'Failed to save portfolio insights' });
  } finally {
    client.release();
  }
});

export default router;
