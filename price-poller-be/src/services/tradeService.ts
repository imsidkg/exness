import { BID_ASK_CHANNEL, redis } from "../lib/redisClient";
import { pool } from "../config/db";
import { Trade } from "../models/trade";
import { getLatestTradePrice } from "./timescaleService";

const currentPrices: Map<string, number> = new Map();

export const startPriceListener = () => {
  const subscriber = redis.duplicate();
  subscriber.subscribe(BID_ASK_CHANNEL, (error) => {
    if (error) {
      console.error(
        "Failed to subscribe to Redis channel for trading service",
        error
      );
    }
  });

  subscriber.on("message", (channel, message) => {
    if (channel === BID_ASK_CHANNEL) {
      try {
        const parsedMessage = JSON.parse(message);
        const symbol = parsedMessage.symbol;
        const askPrice = parsedMessage.ask;
        if (symbol && askPrice !== undefined) {
          currentPrices.set(symbol, askPrice);
        }
      } catch (error) {
        console.error("Error parsing Redis message:", error);
      }
    }
  });
};

export const createTrade = async (
  userId: number,
  { type, leverage, symbol, quantity }: Omit<TradeRequest, 'margin'>
): Promise<string> => {
  const entryPrice = currentPrices.get(symbol);
  if (!entryPrice) {
    throw new Error("Entry price is not set for this symbol");
  }

  // Calculate margin based on quantity, entry_price, and leverage
  // Assuming margin is the value of the position divided by leverage
  const margin = (quantity * entryPrice) / leverage;

  const query = `
    INSERT INTO trades (user_id, type, margin, leverage, symbol, quantity, entry_price, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7, 'open')
    RETURNING order_id;
  `;
  const res = await pool.query(query, [
    userId,
    type,
    margin,
    leverage,
    symbol,
    quantity,
    entryPrice,
  ]);

  return res.rows[0].order_id;
};

export const getTradeById = async (orderId: string): Promise<Trade | null> => {
  const query = `
    SELECT * FROM trades WHERE order_id = $1;
  `;
  const res = await pool.query(query, [orderId]);
  if (res.rows.length > 0) {
    return res.rows[0] as Trade;
  }
  return null;
};

export const calculatePnL = (
  trade: { type: "buy" | "sell"; entry_price: number; quantity: number },
  currentPrice: number
): number => {
  let pnl = 0;
  if (trade.type === "buy") {
    pnl = (currentPrice - trade.entry_price) * trade.quantity;
  } else if (trade.type === "sell") {
    pnl = (trade.entry_price - currentPrice) * trade.quantity;
  }
  return pnl;
};

export const closeTrade = async (orderId: string): Promise<Trade> => {
  const trade = await getTradeById(orderId);

  if (!trade) {
    throw new Error("Trade not found");
  }
  if (trade.status !== "open") {
    throw new Error("Trade is not open");
  }

  const exitPrice = await getLatestTradePrice(trade.symbol);
  if (!exitPrice) {
    throw new Error(`Could not get current price for ${trade.symbol}`);
  }

  const realizedPnl = calculatePnL(
    {
      type: trade.type,
      entry_price: trade.entry_price,
      quantity: trade.quantity,
    },
    exitPrice
  );

  const query = `
    UPDATE trades
    SET status = 'closed', exit_price = $1, closed_at = NOW(), realized_pnl = $2
    WHERE order_id = $3
    RETURNING *;
  `;
  const res = await pool.query(query, [exitPrice, realizedPnl, orderId]);

  const closedTrade = res.rows[0] as Trade;

  // Update user balance
  const userBalanceQuery = `
    UPDATE balances
    SET balance = balance + $1
    WHERE user_id = $2
    RETURNING balance;
  `;
  const balanceRes = await pool.query(userBalanceQuery, [realizedPnl, closedTrade.user_id]);

  if (balanceRes.rows.length === 0) {
    console.warn(`Could not update balance for user ${closedTrade.user_id}. Balance record not found.`);
  }

  return closedTrade;
};

export const getClosedTrades = async (userId: string): Promise<Trade[]> => {
  const query = `
    SELECT * FROM trades WHERE user_id = $1 AND status = 'closed' ORDER BY closed_at DESC;
  `;
  const res = await pool.query(query, [userId]);
  return res.rows as Trade[];
};

// TODO: Update monitorTradesForLiquidation to fetch open trades from DB
export const monitorTradesForLiquidation = () => {
  // const openTrades = getActiveTrades(); // This will need to be updated to fetch from DB

  // openTrades.forEach((trade) => {
  //   const currentPrice = currentPrices.get(trade.symbol);

  //   if (currentPrice === undefined) {
  //     console.warn(
  //       `Price not available for symbol ${trade.symbol}. Skipping P&L calculation for trade ${trade.orderId}.`
  //     );
  //     return; // Skip this trade if price is not available
  //   }

  //   const pnl = calculatePnL(trade, currentPrice);

  //   // Liquidation condition: loss reaches 100% of margin
  //   if (pnl <= -trade.margin) {
  //     liquidateTrade(trade.orderId);
  //     console.log(
  //       `Trade ${trade.orderId} liquidated due to margin exhaustion. PnL: ${pnl}, Margin: ${trade.margin}`
  //     );
  //   }
  // });
};
