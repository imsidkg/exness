"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.insertTicker = insertTicker;
exports.insertTickerBatch = insertTickerBatch;
exports.getAggregatedData = getAggregatedData;
const db_1 = require("../config/db");
async function insertTicker(ticker) {
    const query = `
    INSERT INTO tickers (time, symbol, ask_price, bid_price, volume)
    VALUES ($1, $2, $3, $4, $5)
  `;
    await db_1.pool.query(query, [
        ticker.time,
        ticker.symbol,
        ticker.askPrice, // updated
        ticker.bidPrice, // updated
        ticker.volume,
    ]);
}
async function insertTickerBatch(batch) {
    const query = `
    INSERT INTO tickers (time, symbol, ask_price, bid_price, volume)
    SELECT * FROM unnest(
      $1::timestamptz[],
      $2::text[],
      $3::float8[],  -- ask_price
      $4::float8[],  -- bid_price
      $5::float8[]   -- volume
    )
  `;
    const values = batch.reduce((acc, ticker) => {
        acc[0].push(ticker.time);
        acc[1].push(ticker.symbol);
        acc[2].push(ticker.askPrice);
        acc[3].push(ticker.bidPrice);
        acc[4].push(ticker.volume);
        return acc;
    }, [[], [], [], [], []]);
    await db_1.pool.query(query, values);
    console.log(`Successfully inserted batch of ${batch.length} tickers`);
}
async function getAggregatedData(symbol, bucket) {
    let query;
    let params;
    if (bucket === "1 hour" || bucket === "1 day") {
        query = `
      SELECT bucket,
             symbol,
             avg_bid_price,
             avg_ask_price,
             total_volume
      FROM tickers_hourly
      WHERE symbol = $1
      ORDER BY bucket DESC
      LIMIT 100;
    `;
        params = [symbol];
    }
    else {
        query = `
      SELECT time_bucket($1, time) AS bucket,
             AVG(bid_price) AS avg_bid_price,
             AVG(ask_price) AS avg_ask_price,
             SUM(volume) AS total_volume
      FROM tickers
      WHERE symbol = $2
      GROUP BY bucket
      ORDER BY bucket DESC
      LIMIT 100;
    `;
        params = [bucket, symbol];
    }
    const res = await db_1.pool.query(query, params);
    return res.rows;
}
//# sourceMappingURL=timescaleService.js.map