"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processQueue = void 0;
const redisClient_1 = require("../lib/redisClient");
const timescaleService_1 = require("../services/timescaleService");
const processQueue = async () => {
    while (true) {
        let items = [];
        for (let i = 0; i < 50; i++) {
            const item = await redisClient_1.redis.rpop("binance:queue");
            if (!item)
                break;
            items.push(item);
        }
        if (items.length > 0) {
            const tickers = items.map((msg) => {
                const binanceTicker = JSON.parse(msg);
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
                await (0, timescaleService_1.insertTickerBatch)(tickers);
            }
        }
        else {
            await new Promise((res) => setTimeout(res, 100));
        }
    }
};
exports.processQueue = processQueue;
//# sourceMappingURL=queryWorker.js.map