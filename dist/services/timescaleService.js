"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.insertTicker = insertTicker;
exports.insertTickerBatch = insertTickerBatch;
exports.getAggregatedData = getAggregatedData;
const db_1 = require("../config/db");
async function insertTicker(ticker) {
    const query = `
    INSERT INTO tickers (time, symbol, price, volume)
    VALUES ($1, $2, $3, $4)
  `;
    await db_1.pool.query(query, [
        ticker.time,
        ticker.symbol,
        ticker.price,
        ticker.volume,
    ]);
}
async function insertTickerBatch(batch) {
    const query = `
    INSERT INTO tickers (time, symbol, price, volume)
    SELECT * FROM unnest($1::timestamptz[], $2::text[], $3::float8[], $4::float8[])
  `;
    const values = batch.reduce((acc, ticker) => {
        acc[0].push(ticker.time);
        acc[1].push(ticker.symbol);
        acc[2].push(ticker.price);
        acc[3].push(ticker.volume);
        return acc;
    }, [[], [], [], []]);
    await db_1.pool.query(query, values);
    console.log(`Successfully inserted batch of ${batch.length} tickers`);
}
// export async function insertTickerBatch(batch: Ticker[]) {
//   if (batch.length === 0) return;
//   const times: Date[] = [];
//   const symbols: string[] = [];
//   const prices: number[] = [];
//   const volumes: number[] = [];
//   for (const ticker of batch) {
//     // ensure time is a valid Date
//     if (!ticker.time) {
//       throw new Error(`Ticker missing time: ${JSON.stringify(ticker)}`);
//     }
//     times.push(ticker.time);
//     symbols.push(ticker.symbol);
//     prices.push(ticker.price);
//     volumes.push(ticker.volume);
//   }
//   const query = `
//     INSERT INTO tickers (time, symbol, price, volume)
//     SELECT *
//     FROM unnest($1::timestamptz[], $2::text[], $3::float8[], $4::float8[])
//          AS t(time, symbol, price, volume)
//   `;
//   await pool.query(query, [times, symbols, prices, volumes]);
//   console.log(`Successfully inserted batch of ${batch.length} tickers`);
// }
async function getAggregatedData(symbol, bucket // '1 minute' | '5 minutes' | '10 minutes'
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
    const res = await db_1.pool.query(query, [bucket, symbol]);
    return res.rows;
}
//# sourceMappingURL=timescaleService.js.map