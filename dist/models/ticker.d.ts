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
export declare function createTicker(symbol: string, bidPrice: number, askPrice: number, volume: number, time?: Date): Ticker;
//# sourceMappingURL=ticker.d.ts.map