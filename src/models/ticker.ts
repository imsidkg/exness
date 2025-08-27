export interface Ticker {
  time: Date;
  symbol: string;
  price: number;
  volume: number;
}

export interface NewTicker {
  symbol: string;
  price: number;
  volume: number;
  time?: Date;
}
    
export function createTicker(
  symbol: string,
  price: number,
  volume: number,
  time: Date = new Date()
): Ticker {
  return { time, symbol, price, volume };
}
