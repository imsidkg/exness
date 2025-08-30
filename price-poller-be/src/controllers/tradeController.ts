import { Request, Response } from "express";
import { closeTrade as closeTradeService } from "../services/tradeService";
import { AuthenticatedRequest } from "../middleware/auth";
import { redis } from '../lib/redisClient';

const TRADE_QUEUE_NAME = 'trade:order:queue';

interface TradeRequest {
  type: 'buy' | 'sell';
  leverage: number;
  symbol: string;
  quantity: number;
  margin?: number; // Optional margin field
}

function isTradeRequest(body: any): body is TradeRequest {
  return (
    body &&
    (body.type === "buy" || body.type === "sell") &&
    typeof body.leverage === "number" &&
    [5, 10, 20, 100].includes(body.leverage) &&
    typeof body.symbol === "string" &&
    body.symbol.length > 0 &&
    typeof body.quantity === "number" &&
    body.quantity > 0 &&
    (typeof body.margin === "undefined" || (typeof body.margin === "number" && body.margin > 0))
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
  } catch (error) {
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
