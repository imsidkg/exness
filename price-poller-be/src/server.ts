import express, { Request, Response } from "express";
import cors from "cors";
import { getCandles } from "./controllers/candleController";
import router from "./routes/authRoutes";
const app = express();

const port = 3001;

app.use(cors());
app.use(express.json());
app.get("/", (req: Request, res: Response) => {
  res.send("Hello from the price poller BE!");
});

app.get("/candles/:symbol", getCandles);

app.use("/api/v1/user", router);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
