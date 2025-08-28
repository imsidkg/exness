"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.symbols = void 0;
const binanceSocket_1 = require("./binanceSocket");
const init_1 = require("./db/init");
const queryWorker_1 = require("./workers/queryWorker");
exports.symbols = ["btcusdt", "ethusdt", "solusdt"];
(0, init_1.initDB)();
(0, binanceSocket_1.fetchBinanceData)(exports.symbols);
(0, queryWorker_1.processQueue)().catch((err) => {
    console.error(" Worker error:", err);
    process.exit(1);
});
//# sourceMappingURL=index.js.map