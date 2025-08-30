import { Request, Response } from "express";
import { createTrade, closeTrade as closeTradeService } from "../services/tradeService";
import { AuthenticatedRequest } from "../middleware/auth";

function isTradeRequest(body: any): body is Omit<TradeRequest, 'margin'> {
  return (
    body &&
    (body.type === "buy" || body.type === "sell") &&
    typeof body.leverage === "number" &&
    [5, 10, 20, 100].includes(body.leverage) &&
    typeof body.symbol === "string" &&
    body.symbol.length > 0 &&
    typeof body.quantity === "number" &&
    body.quantity > 0
  );
}

export const tradeProcessor = async (req: AuthenticatedRequest, res: Response) => {
  if (!isTradeRequest(req.body)) {
    return res.status(411).json({ message: "Incorrect inputs" });
  }

  const { type, leverage, symbol, quantity } = req.body;
  const userId = req.userId;

  if (!userId) {
    return res.status(401).json({ message: "User not authenticated" });
  }

  try {
    const orderId = await createTrade(userId, { type, leverage, symbol, quantity });
    res.status(200).json({ orderId });
  } catch (error) {
    console.error("Error creating trade:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const closeTrade = async (req: Request, res: Response) => {
  const { orderId } = req.body;
  if (!orderId) {
    return res.status(400).json({ message: "Order ID is required" });
  }

  try {
    const closedTrade = await closeTradeService(orderId);
    res.status(200).json({ message: "Trade closed successfully", trade: closedTrade });
  } catch (error: any) {
    console.error("Error closing trade:", error);
    res.status(500).json({ message: error.message || "Internal server error" });
  }
};
