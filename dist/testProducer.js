"use strict";
// testProducer.ts
Object.defineProperty(exports, "__esModule", { value: true });
const redisClient_1 = require("./lib/redisClient");
async function pushTestData() {
    for (let i = 1; i <= 120; i++) {
        await redisClient_1.redis.lpush("binance:queue", JSON.stringify({ id: i }));
        console.log(`📥 Pushed item ${i}`);
    }
    console.log("✅ Done pushing test data");
}
pushTestData();
//# sourceMappingURL=testProducer.js.map