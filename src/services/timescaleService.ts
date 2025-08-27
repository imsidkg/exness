import { pool } from "../config/db";
import { Ticker } from "../models/ticker";

export async function insertTicker(ticker: Ticker) {
  const query = `
    INSERT INTO tickers (time, symbol, price, volume)
    VALUES ($1, $2, $3, $4)
  `;
  await pool.query(query, [
    ticker.time,
    ticker.symbol,
    ticker.price,
    ticker.volume,
  ]);
}

export async function insertTickerBatch(batch: Ticker[]) {
  const query = `
    INSERT INTO tickers (time, symbol, price, volume)
    SELECT * FROM unnest($1::timestamptz[], $2::text[], $3::float8[], $4::float8[])
  `;

  const values = batch.reduce(
    (acc, ticker) => {
      acc[0].push(ticker.time);
      acc[1].push(ticker.symbol);
      acc[2].push(ticker.price);
      acc[3].push(ticker.volume);
      return acc;
    },
    [[], [], [], []] as [Date[], string[], number[], number[]]
  );

  await pool.query(query, values);
}

export async function getAggregatedData(
  symbol: string,
  bucket: string // '1 minute' | '5 minutes' | '10 minutes'
) {
  const query = `
    SELECT time_bucket($1, time) as bucket,
           AVG(price) as avg_price,
           SUM(volume) as total_volume
    FROM tickers
    WHERE symbol = $2
    GROUP BY bucket
    ORDER BY bucket DESC
    LIMIT 100;
  `;

  const res = await pool.query(query, [bucket, symbol]);
  return res.rows;
}
