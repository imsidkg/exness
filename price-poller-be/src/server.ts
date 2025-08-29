import express, { Request, Response } from "express";
import cors from "cors";
import { getCandles } from "./controllers/candleController";
import authRoutes from "./routes/authRoutes";
import tradeRoutes from "./routes/tradeRoutes"; // Import tradeRoutes
import { startPriceListener, monitorTradesForLiquidation } from "./services/tradeService"; // Import price listener and monitor

const app = express();

const port = 3001;

app.use(cors());
app.use(express.json());
// app.use(bodyParser.json()); // Removed as express.json() is used and bodyParser is not imported
app.get("/", (req: Request, res: Response) => {
  res.send("Hello from the price poller BE!");
});

app.get("/candles/:symbol", getCandles);

app.use("/api/v1/user", authRoutes); // Use authRoutes
app.use("/api/v1/trade", tradeRoutes); // Use tradeRoutes

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
  startPriceListener(); // Start the price listener
  setInterval(monitorTradesForLiquidation, 5000); // Monitor trades every 5 seconds
});
