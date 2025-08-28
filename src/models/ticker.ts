export interface Ticker {
  time: Date;
  symbol: string;
  bidPrice: number; 
  askPrice: number; 
  volume: number;
}

export interface NewTicker {
  symbol: string;
  bidPrice: number;
  askPrice: number;
  volume: number;
  time?: Date;
}

export function createTicker(
  symbol: string,
  bidPrice: number,
  askPrice: number,
  volume: number,
  time: Date = new Date()
): Ticker {
  return { time, symbol, bidPrice, askPrice, volume };
}
