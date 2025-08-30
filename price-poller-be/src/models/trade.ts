export interface Trade {
  order_id: string;
  user_id: string;
  type: 'buy' | 'sell';
  margin: number;
  leverage: number;
  symbol: string;
  quantity: number;
  entry_price: number;
  status: 'open' | 'closed' | 'liquidated';
  created_at: Date;
  exit_price?: number; // Optional, as it's only set when closed
  closed_at?: Date; // Optional, as it's only set when closed
  realized_pnl?: number; // Optional, as it's only set when closed
  stop_loss?: number; // Optional stop loss price
  take_profit?: number; // Optional take profit price
}

export interface NewTrade {
  user_id: string;
  type: 'buy' | 'sell';
  margin: number;
  leverage: number;
  symbol: string;
  quantity: number;
  entry_price: number;
  stop_loss?: number; // Optional stop loss price
  take_profit?: number; // Optional take profit price
}
