"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.symbols = void 0;
const binanceSocket_1 = require("./binanceSocket");
exports.symbols = ["btcusdt", "ethusdt", "solusdt"];
(0, binanceSocket_1.fetchBinanceData)(exports.symbols);
//# sourceMappingURL=index.js.map