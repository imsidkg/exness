"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchBinanceData = void 0;
const ws_1 = __importDefault(require("ws"));
const redisClient_1 = require("./lib/redisClient");
const fetchBinanceData = async (symbols) => {
    const streams = symbols
        .map((symbol) => `${symbol.toLowerCase()}@bookTicker`)
        .join("/");
    const url = `wss://stream.binance.com:9443/stream?streams=${streams}`;
    const ws = new ws_1.default(url);
    ws.on("open", () => {
        console.log("Websocket initialized");
    });
    ws.on("message", async (data) => {
        const parsedData = JSON.parse(data);
        const ticker = parsedData.data;
        await redisClient_1.redis.lpush("binance:queue", JSON.stringify(ticker));
        console.log(`${ticker.s} | Bid: ${ticker.b} | Ask: ${ticker.a} `);
    });
    ws.on("error", () => {
        console.log("Error connecting to websocket");
    });
    ws.on("close", () => {
        console.log("Server is abruptly closed - may be from Binance");
    });
};
exports.fetchBinanceData = fetchBinanceData;
//# sourceMappingURL=binanceSocket.js.map