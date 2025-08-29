import Redis from "ioredis";

export const redis = new Redis() ;

export const BID_ASK_CHANNEL = "bid_ask_updates"; // Redis channel for bid/ask updates

