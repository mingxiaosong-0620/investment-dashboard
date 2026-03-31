import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { runMigrations } from './db/migrate.js';
import { backfillMissing, fetchAllIndicators, startDailyFetchJob } from './jobs/dailyFetch.js';
import { computeRegime } from './services/regimeAnalysis.js';
import indicatorRoutes from './routes/indicators.js';
import insightRoutes from './routes/insights.js';
import portfolioRoutes from './routes/portfolio.js';
import pool from './db/client.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = parseInt(process.env.PORT || '3001');

app.use(cors());
app.use(express.json());

app.use('/api/insights', insightRoutes);
app.use('/api/portfolio', portfolioRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// /api/regime MUST be registered BEFORE /api/indicators router
app.get('/api/regime', async (_req, res) => {
  const result = await computeRegime(pool);
  res.json(result);
});

app.use('/api/indicators', indicatorRoutes);

const clientDist = path.join(__dirname, '..', '..', 'client', 'dist');
app.use(express.static(clientDist));
app.get('/{*splat}', (_req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

// Export app BEFORE calling listen — allows tests to import without port binding
export default app;

// Only bind port outside test environment
if (process.env.NODE_ENV !== 'test') {
  async function main() {
    await runMigrations();

    app.listen(PORT, () => {
      console.log(`Investment Dashboard API running on http://localhost:${PORT}`);
    });

    startDailyFetchJob();

    // Always fetch latest values on startup to ensure fresh data
    console.log('[startup] Fetching latest indicator values...');
    fetchAllIndicators().catch(err => console.error('[startup] fetch error:', err));

    // Backfill any indicators with sparse history (handles first deploy + new indicators)
    backfillMissing().catch(console.error);
  }
  main().catch(console.error);
}
