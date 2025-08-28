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
export declare function createTicker(symbol: string, price: number, volume: number, time?: Date): Ticker;
//# sourceMappingURL=ticker.d.ts.map