import "./server";
import { fetchBinanceData } from "./websockets/binanceSocket";
import { initDB } from "./db/init";
import { processQueue } from "./workers/queryWorker";
import { startWebSocketServer } from "./websockets/websocketServer";
export const symbols = ["btcusdt", "ethusdt", "solusdt"];
initDB();
fetchBinanceData(symbols);
startWebSocketServer();
processQueue().catch((err) => {
  console.error(" Worker error:", err);
  process.exit(1);
});
