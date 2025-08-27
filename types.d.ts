type BinanceTicker = {
  e: string;   // Event type
  E: number;   // Event time
  s: string;   // Symbol (e.g., BTCUSDT)
  p: string;   // Price change
  P: string;   // Price change percent
  c: string;   // Last price
  h: string;   // High price
  l: string;   // Low price
  v: string;   // Total traded base asset volume
  q: string;   // Total traded quote asset volume
};