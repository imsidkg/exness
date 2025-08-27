"use strict";
// queueWorker.ts
Object.defineProperty(exports, "__esModule", { value: true });
const redisClient_1 = require("./lib/redisClient");
async function processQueue() {
    while (true) {
        const items = await redisClient_1.redisConsumer.rpop("binance:queue", 50);
        if (items && items.length > 0) {
            console.log(`📤 Pulled batch of ${items.length} items`);
            const parsed = items.map((msg) => JSON.parse(msg));
            console.log(parsed.map((p) => p.id)); // show IDs to confirm batching
        }
        else {
            await new Promise((res) => setTimeout(res, 100));
        }
    }
}
processQueue();
//# sourceMappingURL=queueWorker.ts.js.map