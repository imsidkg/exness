import { pool } from "../config/db";

export async function initDB() {
  // Create table if it doesn't exist
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tickers (
      time TIMESTAMPTZ NOT NULL,
      symbol TEXT NOT NULL,
      ask_price NUMERIC,
      bid_price NUMERIC,
      volume NUMERIC
    );
  `);

  // Create hypertable (TimescaleDB)
  await pool.query(`
    SELECT create_hypertable('tickers', 'time', if_not_exists => TRUE);
  `);

  // Example: create materialized view (continuous aggregate)
  await pool.query(`
  CREATE MATERIALIZED VIEW IF NOT EXISTS tickers_hourly
  WITH (timescaledb.continuous) AS
  SELECT 
    time_bucket('1 hour', time) AS bucket,
    symbol,
    AVG(ask_price) AS avg_ask_price,
    AVG(bid_price) AS avg_bid_price,
    SUM(volume) AS total_volume
  FROM tickers
  GROUP BY bucket, symbol;
`);
  console.log("Database initialized");
}
