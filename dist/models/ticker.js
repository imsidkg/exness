"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTicker = createTicker;
function createTicker(symbol, price, volume, time = new Date()) {
    return { time, symbol, price, volume };
}
//# sourceMappingURL=ticker.js.map