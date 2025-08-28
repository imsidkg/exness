"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const redisClient_1 = require("../lib/redisClient");
const timescaleService_1 = require("../services/timescaleService");
const processQueue = async () => {
    while (true) {
        let items = [];
        for (let i = 0; i < 50; i++) {
            const item = await redisClient_1.redis.rpop("binance:queue");
            if (!item) {
                break;
            }
            items.push(item);
        }
        if (items.length > 0) {
            const tickers = items.map((msg) => {
                const binanceTicker = JSON.parse(msg);
                return {
                    time: new Date(binanceTicker.E),
                    symbol: binanceTicker.s,
                    price: parseFloat(binanceTicker.c),
                    volume: parseFloat(binanceTicker.v),
                };
            });
            console.log(`Processing batch of ${tickers.length} tickers`);
            await (0, timescaleService_1.insertTickerBatch)(tickers);
        }
        else {
            await new Promise((res) => setTimeout(res, 100));
        }
    }
};
processQueue().catch((err) => {
    console.error(" Worker error:", err);
    process.exit(1);
});
//# sourceMappingURL=queryWorker.js.map