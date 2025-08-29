export interface Ticker {
  time: Date;
  symbol: string;
  tradePrice: number;
  bidPrice: number;
  askPrice: number;
  volume: number;
}

export interface NewTicker {
  symbol: string;
  tradePrice: number;
  bidPrice: number;
  askPrice: number;
  volume: number;
  time?: Date;
}

export function createTicker(
  symbol: string,
  tradePrice: number,
  bidPrice: number,
  askPrice: number,
  volume: number,
  time: Date = new Date()
): Ticker {
  return { time, symbol, tradePrice, bidPrice, askPrice, volume };
}
