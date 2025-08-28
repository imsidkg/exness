import "./server";
import { fetchBinanceData } from "./binanceSocket";
import { initDB } from "./db/init";
import { processQueue } from "./workers/queryWorker";
export const symbols = ["btcusdt", "ethusdt", "solusdt"];
initDB();
fetchBinanceData(symbols);
processQueue().catch((err) => {
  console.error(" Worker error:", err);
  process.exit(1);
});
