type BinanceTicker = {
  u: number; // Order book update id
  s: string; // Symbol
  b: string; // Best bid price
  B: string; // Best bid quantity
  a: string; // Best ask price
  A: string; // Best ask quantity
};

type BinanceTrade = {
  e: string; // Event type
  E: number; // Event time
  s: string; // Symbol
  t: number; // Trade ID
  p: string; // Price
  q: string; // Quantity
  b: number; // Buyer order ID
  a: number; // Seller order ID
  T: number; // Trade time
  m: boolean; // Is the buyer the market maker?
  M: boolean; // Ignore
};

interface Candle {
  symbol: string;
  interval: string; // e.g., "1m", "5m"
  openTime: number; // Unix timestamp in milliseconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface TradeRequest {
  type: "buy" | "sell";
  margin: number;
  leverage: 5 | 10 | 20 | 100;
  symbol: string;
}

interface ActiveTrade {
  orderId: string;
  type: "buy" | "sell";
  margin: number;
  leverage: 5 | 10 | 20 | 100;
  exposure: number;
  symbol: string;
  entryPrice: number; // Price at which the trade was opened
  status: "open" | "liquidated" | "closed"; // To track trade status
}
