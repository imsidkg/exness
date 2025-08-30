import { BID_ASK_CHANNEL, redis } from "../lib/redisClient";
import { pool } from "../config/db";
import { PoolClient } from "pg";
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
  { type, leverage, symbol, quantity }: Omit<TradeRequest, "margin">
): Promise<string> => {
  const entryPrice = currentPrices.get(symbol);
  if (!entryPrice) {
    throw new Error("Entry price is not set for this symbol");
  }

  const margin = (quantity * entryPrice) / leverage;
  const client: PoolClient = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Lock the user's balance row and check for sufficient funds
    const balanceRes = await client.query(
      "SELECT balance FROM balances WHERE user_id = $1 FOR UPDATE",
      [userId]
    );
    if (balanceRes.rows.length === 0) {
      throw new Error("User balance record not found.");
    }
    const balance = balanceRes.rows[0].balance;
    if (balance < margin) {
      throw new Error("Insufficient funds to cover margin.");
    }

    // 2. Deduct the margin from the user's balance
    await client.query(
      "UPDATE balances SET balance = balance - $1 WHERE user_id = $2",
      [margin, userId]
    );

    // 3. Insert the new trade record
    const tradeQuery = `
      INSERT INTO trades (user_id, type, margin, leverage, symbol, quantity, entry_price, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'open')
      RETURNING order_id;
    `;
    const tradeRes = await client.query(tradeQuery, [
      userId,
      type,
      margin,
      leverage,
      symbol,
      quantity,
      entryPrice,
    ]);

    await client.query("COMMIT");
    return tradeRes.rows[0].order_id;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
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
  const client: PoolClient = await pool.connect();

  try {
    await client.query("BEGIN");

    const tradeResult = await client.query(
      "SELECT * FROM trades WHERE order_id = $1 FOR UPDATE",
      [orderId]
    );
    const trade = tradeResult.rows[0];

    if (!trade) throw new Error("Trade not found");
    if (trade.status !== "open") throw new Error("Trade is not open");

    const exitPrice = await getLatestTradePrice(trade.symbol);
    if (!exitPrice)
      throw new Error(`Could not get current price for ${trade.symbol}`);

    const realizedPnl = calculatePnL(
      {
        type: trade.type,
        entry_price: trade.entry_price,
        quantity: trade.quantity,
      },
      exitPrice
    );

    const updateQuery = `
      UPDATE trades
      SET status = 'closed', exit_price = $1, closed_at = NOW(), realized_pnl = $2
      WHERE order_id = $3
      RETURNING *;
    `;
    const res = await client.query(updateQuery, [
      exitPrice,
      realizedPnl,
      orderId,
    ]);
    const closedTrade = res.rows[0] as Trade;

    const balanceQuery = `UPDATE balances SET balance = balance + $1 WHERE user_id = $2`;
    await client.query(balanceQuery, [realizedPnl, closedTrade.user_id]);

    await client.query("COMMIT");
    return closedTrade;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
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
