import "./server";
import { fetchBinanceData } from "./websockets/binanceSocket";
import { initDB } from "./db/init";
import { processQueue } from "./workers/queryWorker";
import { startWebSocketServer } from "./websockets/websocketServer";
import { startTradeWorker } from "./workers/tradeWorker"; // Import the new worker

export const symbols = ["btcusdt", "ethusdt", "solusdt"];


   initDB();
  fetchBinanceData(symbols);
  startWebSocketServer();

  // Start background workers
  processQueue().catch(err => console.error("Query Worker error:", err));
  startTradeWorker().catch(err => console.error("Trade Worker error:", err)); // Start the new trade worker

