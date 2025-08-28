import { redis } from "../lib/redisClient";
import { Ticker } from "../models/ticker";
import { insertTickerBatch } from "../services/timescaleService";

const processQueue = async () => {
  while (true) {
    let items: string[] = [];
    for (let i = 0; i < 50; i++) {
      const item = await redis.rpop("binance:queue");
      if (!item) {
        break;
      }

      items.push(item);
    }
    if (items.length > 0) {
      const tickers: Ticker[] = items.map((msg) => {
        const binanceTicker = JSON.parse(msg) as BinanceTicker;

        return {
          time: new Date(binanceTicker.E),
          symbol: binanceTicker.s,
          price: parseFloat(binanceTicker.c),
          volume: parseFloat(binanceTicker.v),
        };
      });

      console.log(`Processing batch of ${tickers.length} tickers`);
      await insertTickerBatch(tickers);
    } else {
      await new Promise((res) => setTimeout(res, 100));
    }
  }
};

processQueue().catch((err) => {
  console.error(" Worker error:", err);
  process.exit(1);
});
