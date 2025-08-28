import { redis } from "../lib/redisClient";
import { Ticker } from "../models/ticker";
import { insertTickerBatch } from "../services/timescaleService";

export const processQueue = async () => {
  while (true) {
    let items: string[] = [];

    for (let i = 0; i < 50; i++) {
      const item = await redis.rpop("binance:queue");
      if (!item) break;
      items.push(item);
    }

    if (items.length > 0) {
      const tickers: Ticker[] = items.map((msg) => {
        const binanceTicker = JSON.parse(msg) as BinanceTicker;

        const bidPrice = parseFloat(binanceTicker.b);
        const askPrice = parseFloat(binanceTicker.a);

        return {
          time: new Date(),
          symbol: binanceTicker.s,
          bidPrice,
          askPrice,
          volume: 0,
        };
      });

      if (tickers.length > 0) {
        console.log(`Processing batch of ${tickers.length} tickers`);
        await insertTickerBatch(tickers);
      }
    } else {
      await new Promise((res) => setTimeout(res, 100));
    }
  }
};
