"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.get1mCandles = get1mCandles;
exports.get5mCandles = get5mCandles;
exports.get10mCandles = get10mCandles;
const timescaleService_1 = require("./timescaleService");
async function get1mCandles(symbol) {
    return await (0, timescaleService_1.getAggregatedData)(symbol, "1 minute");
}
async function get5mCandles(symbol) {
    return await (0, timescaleService_1.getAggregatedData)(symbol, "5 minutes");
}
async function get10mCandles(symbol) {
    return await (0, timescaleService_1.getAggregatedData)(symbol, "10 minutes");
}
//# sourceMappingURL=aggregrator.js.map