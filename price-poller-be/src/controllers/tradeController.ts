import { Request, Response } from "express";
import { closeTrade as closeTradeService, getClosedTrades, getUnrealizedPnLForUser } from "../services/tradeService";
import { AuthenticatedRequest } from "../middleware/auth";
import { redis } from '../lib/redisClient';

const TRADE_QUEUE_NAME = 'trade:order:queue';

function isTradeRequest(body: any): body is TradeRequest {
  return (
    body &&
    (body.type === "buy" || body.type === "sell") &&
    (typeof body.leverage === "undefined" || typeof body.leverage === "number") &&
    typeof body.symbol === "string" &&
    body.symbol.length > 0 &&
    typeof body.quantity === "number" &&
    body.quantity > 0 &&
    (typeof body.margin === "undefined" || (typeof body.margin === "number" && body.margin > 0)) &&
    (typeof body.stopLoss === "undefined" || typeof body.stopLoss === "number") &&
    (typeof body.takeProfit === "undefined" || typeof body.takeProfit === "number")
  );
}

export const tradeProcessor = async (req: AuthenticatedRequest, res: Response) => {
  if (!isTradeRequest(req.body)) {
    return res.status(400).json({ message: "Invalid trade request format" });
  }

  const userId = req.userId;
  if (!userId) {
    return res.status(401).json({ message: "User not authenticated" });
  }

  const job = {
    userId: userId,
    tradeDetails: req.body as TradeRequest
  };

  try {
    await redis.lpush(TRADE_QUEUE_NAME, JSON.stringify(job));
    res.status(202).json({ message: "Trade request received and is being processed." });
  }  catch (error) {
    console.error("Error pushing trade to queue:", error);
    res.status(500).json({ message: "Failed to queue trade request." });
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

export const getClosedTradesForUser = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId;
  if (!userId) {
    return res.status(401).json({ message: "User not authenticated" });
  }

  try {
    const trades = await getClosedTrades(userId);
    res.status(200).json(trades);
  } catch (error: any) {
    console.error("Error fetching closed trades:", error);
    res.status(500).json({ message: error.message || "Internal server error" });
  }
};

export const getUnrealizedPnL = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId;
  if (!userId) {
    return res.status(401).json({ message: "User not authenticated" });
  }

  try {
    const tradesWithUnrealizedPnL = await getUnrealizedPnLForUser(userId);
    res.status(200).json(tradesWithUnrealizedPnL);
  } catch (error: any) {
    console.error("Error fetching unrealized PnL:", error);
    res.status(500).json({ message: error.message || "Internal server error" });
  }
};
