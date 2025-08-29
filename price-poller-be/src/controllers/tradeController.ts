import { Request, Response } from "express";
import { createTrade } from "../services/tradeService";

function isTradeRequest(body: any): body is TradeRequest {
  return (
    body &&
    (body.type === "buy" || body.type === "sell") &&
    typeof body.margin === "number" &&
    body.margin > 0 &&
    [5, 10, 20, 100].includes(body.leverage)
  );
}

export const tradeProcessor = async (req: Request, res: Response) => {
  if (!isTradeRequest(req.body)) {
    return res.status(411).json({ message: "Incorrect inputs" });
  }

  const { type, margin, leverage, symbol } = req.body;

  try {
    const orderId = await createTrade({ type, margin, leverage, symbol });
    res.status(200).json({ orderId });
  } catch (error) {
    console.error("Error creating trade:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
