import { getAggregatedData } from "./timescaleService";

export async function get1mCandles(symbol: string) {
  return await getAggregatedData(symbol, "1 minute");
}

export async function get5mCandles(symbol: string) {
  return await getAggregatedData(symbol, "5 minutes");
}

export async function get10mCandles(symbol: string) {
  return await getAggregatedData(symbol, "10 minutes");
}
