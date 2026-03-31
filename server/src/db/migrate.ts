import pool from './client.js';

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS indicator_snapshots (
  id         SERIAL PRIMARY KEY,
  series_id  VARCHAR(50)    NOT NULL,
  value      DECIMAL(14,6),
  date       DATE           NOT NULL,
  fetched_at TIMESTAMPTZ    DEFAULT NOW(),
  UNIQUE (series_id, date)
);

CREATE INDEX IF NOT EXISTS idx_snapshots_series_date
  ON indicator_snapshots(series_id, date DESC);

CREATE TABLE IF NOT EXISTS analysis_insights (
  id           SERIAL PRIMARY KEY,
  type         VARCHAR(20)   NOT NULL CHECK (type IN ('overall', 'indicator')),
  series_id    VARCHAR(50),
  content      TEXT          NOT NULL,
  generated_at TIMESTAMPTZ   DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_insights_type_series
  ON analysis_insights(type, series_id, generated_at DESC);

CREATE TABLE IF NOT EXISTS portfolio_holdings (
  id          SERIAL PRIMARY KEY,
  symbol      VARCHAR(20)   NOT NULL UNIQUE,
  name        VARCHAR(100)  NOT NULL,
  asset_type  VARCHAR(20)   NOT NULL DEFAULT 'stock',
  allocation  DECIMAL(5,2)  NOT NULL,
  created_at  TIMESTAMPTZ   DEFAULT NOW(),
  updated_at  TIMESTAMPTZ   DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS portfolio_prices (
  id         SERIAL PRIMARY KEY,
  symbol     VARCHAR(20)   NOT NULL,
  date       DATE          NOT NULL,
  close      DECIMAL(14,4),
  open       DECIMAL(14,4),
  high       DECIMAL(14,4),
  low        DECIMAL(14,4),
  volume     BIGINT,
  fetched_at TIMESTAMPTZ   DEFAULT NOW(),
  UNIQUE (symbol, date)
);

CREATE INDEX IF NOT EXISTS idx_portfolio_prices_symbol_date
  ON portfolio_prices(symbol, date DESC);

CREATE TABLE IF NOT EXISTS portfolio_insights (
  id           SERIAL PRIMARY KEY,
  type         VARCHAR(20)   NOT NULL CHECK (type IN ('overall', 'asset')),
  symbol       VARCHAR(20),
  content      TEXT          NOT NULL,
  generated_at TIMESTAMPTZ   DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_portfolio_insights_type_symbol
  ON portfolio_insights(type, symbol, generated_at DESC);
`;

export async function runMigrations(): Promise<void> {
  await pool.query(SCHEMA_SQL);
  console.log('Migrations complete');
}
