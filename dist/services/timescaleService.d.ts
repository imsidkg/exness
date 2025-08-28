import { Ticker } from "../models/ticker";
export declare function insertTicker(ticker: Ticker): Promise<void>;
export declare function insertTickerBatch(batch: Ticker[]): Promise<void>;
export declare function getAggregatedData(symbol: string, bucket: string): Promise<any[]>;
//# sourceMappingURL=timescaleService.d.ts.map