import { v4 as uuidv4 } from "uuid";
import { BID_ASK_CHANNEL, redis } from "../lib/redisClient";

const activeTrades: ActiveTrade[] = [];
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

export const createTrade = async ({
  type,
  margin,
  leverage,
  symbol,
}: TradeRequest): Promise<string> => {
  const exposure = margin * leverage;
  const entryPrice = currentPrices.get(symbol);
  if (!entryPrice) {
    throw new Error("Entry price is not set for this symbol");
  }
  const orderId = uuidv4();
  const newTrade: ActiveTrade = {
    orderId,
    type,
    margin,
    leverage,
    exposure,
    symbol,
    entryPrice, 
    status: "open",
  };

  activeTrades.push(newTrade);
  return orderId;
};

export const calculatePnL = (
  trade: ActiveTrade,
  currentPrice: number
): number => {
  let pnl = 0;
  if (trade.type === "buy") {
    pnl = (currentPrice - trade.entryPrice) * trade.exposure;
  } else if (trade.type === "sell") {
    pnl = (trade.entryPrice - currentPrice) * trade.exposure;
  }
  return pnl;
};

export const getActiveTrades = (): ActiveTrade[] => {
  return activeTrades.filter((trade) => trade.status === "open");
};

export const liquidateTrade = (orderId: string): boolean => {
  const tradeIndex = activeTrades.findIndex(
    (trade) => trade.orderId === orderId
  );
  if (tradeIndex !== -1) {
    activeTrades[tradeIndex]!.status = "liquidated";
    console.log(`Trade ${orderId} liquidated.`);
    return true;
  }
  return false;
};

export const monitorTradesForLiquidation = () => {
  const openTrades = getActiveTrades();

  openTrades.forEach((trade) => {
    const currentPrice = currentPrices.get(trade.symbol);

    if (currentPrice === undefined) {
      console.warn(
        `Price not available for symbol ${trade.symbol}. Skipping P&L calculation for trade ${trade.orderId}.`
      );
      return; // Skip this trade if price is not available
    }

    const pnl = calculatePnL(trade, currentPrice);

    // Liquidation condition: loss reaches 100% of margin
    if (pnl <= -trade.margin) {
      liquidateTrade(trade.orderId);
      console.log(
        `Trade ${trade.orderId} liquidated due to margin exhaustion. PnL: ${pnl}, Margin: ${trade.margin}`
      );
    }
  });
};
