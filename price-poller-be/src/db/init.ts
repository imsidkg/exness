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
      balance BIGINT NOT NULL, -- This will be altered to DOUBLE PRECISION
      FOREIGN KEY (user_id) REFERENCES users (id)
    );
  `);

  // Check if 'balance' column in 'balances' table is BIGINT and alter to DOUBLE PRECISION if needed
  const balanceColumnType = await pool.query(`
    SELECT data_type
    FROM information_schema.columns
    WHERE table_name = 'balances' AND column_name = 'balance';
  `);

  if (balanceColumnType.rows.length > 0 && balanceColumnType.rows[0].data_type === 'bigint') {
    console.log("Altering 'balance' column to DOUBLE PRECISION...");
    await pool.query(`
      ALTER TABLE balances ALTER COLUMN balance TYPE DOUBLE PRECISION;
    `);
    console.log("'balance' column altered to DOUBLE PRECISION.");
  }


  await pool.query(`
    CREATE TABLE IF NOT EXISTS trades (
      order_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL,
      type TEXT NOT NULL, -- 'buy' or 'sell'
      margin DOUBLE PRECISION NOT NULL,
      leverage DOUBLE PRECISION NOT NULL,
      symbol TEXT NOT NULL,
      entry_price DOUBLE PRECISION NOT NULL,
      status TEXT NOT NULL DEFAULT 'open', -- 'open', 'closed', 'liquidated'
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      exit_price DOUBLE PRECISION,
      closed_at TIMESTAMPTZ,
      realized_pnl DOUBLE PRECISION,
      stop_loss DOUBLE PRECISION,
      take_profit DOUBLE PRECISION,
      FOREIGN KEY (user_id) REFERENCES users (id)
    );
  `);

  // Check if 'quantity' column exists in 'trades' table, and add if not
  const quantityColumnExists = await pool.query(`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_name = 'trades' AND column_name = 'quantity'
    );
  `);

  if (!quantityColumnExists.rows[0].exists) {
    await pool.query(`
      ALTER TABLE trades ADD COLUMN quantity DOUBLE PRECISION NOT NULL DEFAULT 0;
    `);
  }

  // Check if 'stop_loss' column exists in 'trades' table, and add if not
  const stopLossColumnExists = await pool.query(`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_name = 'trades' AND column_name = 'stop_loss'
    );
  `);

  if (!stopLossColumnExists.rows[0].exists) {
    await pool.query(`
      ALTER TABLE trades ADD COLUMN stop_loss DOUBLE PRECISION;
    `);
  }

  // Check if 'take_profit' column exists in 'trades' table, and add if not
  const takeProfitColumnExists = await pool.query(`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_name = 'trades' AND column_name = 'take_profit'
    );
  `);

  if (!takeProfitColumnExists.rows[0].exists) {
    await pool.query(`
      ALTER TABLE trades ADD COLUMN take_profit DOUBLE PRECISION;
    `);
  }

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