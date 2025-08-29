import { pool } from "../config/db";

export async function initDB() {
  // Create table if it doesn't exist
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tickers (
      time TIMESTAMPTZ NOT NULL,
      symbol TEXT NOT NULL,
      trade_price DOUBLE PRECISION,
      bid_price DOUBLE PRECISION,
      ask_price DOUBLE PRECISION,
      volume DOUBLE PRECISION
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS balances (
      user_id UUID PRIMARY KEY,
      balance BIGINT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users (id)
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
    AVG(trade_price) AS avg_trade_price,
    AVG(bid_price) AS avg_bid_price,
    AVG(ask_price) AS avg_ask_price,
    SUM(volume) AS total_volume
  FROM tickers
  GROUP BY bucket, symbol;
`);
  console.log("Database initialized");
}
