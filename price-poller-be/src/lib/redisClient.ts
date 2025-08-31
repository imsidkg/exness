import Redis from "ioredis";

export const redis = new Redis() ;

export const BID_ASK_CHANNEL = "bid_ask_updates"; // Redis channel for bid/ask updates
export const UNREALIZED_PNL_CHANNEL = "unrealized_pnl_updates"; // Redis channel for unrealized PnL updates

