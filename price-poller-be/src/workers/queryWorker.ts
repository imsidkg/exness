import { BID_ASK_CHANNEL, redis } from "../lib/redisClient";
import { insertTickerBatch } from "../services/timescaleService";
import { Ticker } from "../models/ticker";

const SPREAD_PERCENTAGE = 0.01; // 1% spread

export const processQueue = async () => {
  // Removed broadcastMessage parameter
  while (true) {
    let items: string[] = [];

    for (let i = 0; i < 50; i++) {
      const item = await redis.rpop("binance:trade:queue");
      if (!item) break;
      items.push(item);
    }

    if (items.length > 0) {
      const tickers: Ticker[] = items.map((msg) => {
        const trade: BinanceTrade = JSON.parse(msg);
        const tradePrice = parseFloat(trade.p);
        const tradeQuantity = parseFloat(trade.q);

        const bidPrice = tradePrice * (1 - SPREAD_PERCENTAGE); // Bid is 1% less than current price
        const askPrice = tradePrice * (1 + SPREAD_PERCENTAGE); // Ask is 1% more than current price

        // Publish the latest bid/ask prices to Redis
        redis.publish(
          BID_ASK_CHANNEL,
          JSON.stringify({
            symbol: trade.s,
            bid: bidPrice,
            ask: askPrice,
            tradePrice: tradePrice,
            tradeTime: trade.T,
          })
        );

        return {
          time: new Date(trade.T), // Use trade time
          symbol: trade.s.toLowerCase(),
          tradePrice: tradePrice,
          bidPrice: bidPrice,
          askPrice: askPrice,
          volume: tradeQuantity,
        };
      });

      if (tickers.length > 0) {
        console.log(
          `Inserting batch of ${tickers.length} trades into tickers table.`
        );
        await insertTickerBatch(tickers);
      }
    } else {
      // console.log("Binance trade queue is empty, waiting..."); // Too verbose, remove for now
      await new Promise((res) => setTimeout(res, 100));
    }
  }
};
