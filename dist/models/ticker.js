"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTicker = createTicker;
function createTicker(symbol, bidPrice, askPrice, volume, time = new Date()) {
    return { time, symbol, bidPrice, askPrice, volume };
}
//# sourceMappingURL=ticker.js.map