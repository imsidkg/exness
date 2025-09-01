import { motion } from "motion/react";
import { useState, useEffect } from "react";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Wallet, 
  BarChart3,
  Clock,
  Activity,
  ChevronUp,
  ChevronDown,
  Bitcoin,
  Coins
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { ChartComponent } from "./CandleSticks";
import UserProfile from "./UserProfile";
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from "./ui/table";

interface TradingDashboardProps {
  symbol: string;
  prices: { [symbol: string]: { bid: string; ask: string } };
  currentPrice: number | null;
  accountSummary: any;
  candleData: any[];
  onTrade: (type: "buy" | "sell", data: any) => void;
  tradeError: string | null;
  onSymbolChange: (symbol: string) => void;
  onLogout: () => void;
  userEmail?: string;
}

const TradingDashboard = ({
  symbol,
  prices,
  currentPrice,
  accountSummary,
  candleData,
  onTrade,
  tradeError,
  onSymbolChange,
  onLogout,
  userEmail
}: TradingDashboardProps) => {
  const [quantity, setQuantity] = useState(0.001);
  const [leverage, setLeverage] = useState(1);
  const [stopLoss, setStopLoss] = useState<number | undefined>(undefined);
  const [takeProfit, setTakeProfit] = useState<number | undefined>(undefined);
  const [priceChange, setPriceChange] = useState<number>(0);
  const [isPriceUp, setIsPriceUp] = useState<boolean>(true);

  const symbolOptions = [
    { value: "BTCUSDT", label: "BTC/USDT", icon: Bitcoin },
    { value: "ETHUSDT", label: "ETH/USDT", icon: Coins },
    { value: "SOLUSDT", label: "SOL/USDT", icon: Coins },
  ];

  useEffect(() => {
    if (currentPrice) {
      const change = Math.random() * 2 - 1; // Simulated price change
      setPriceChange(change);
      setIsPriceUp(change >= 0);
    }
  }, [currentPrice]);

  const handleTrade = (type: "buy" | "sell") => {
    onTrade(type, {
      symbol,
      quantity,
      leverage,
      stopLoss,
      takeProfit,
    });
  };

  const getSymbolIcon = (symbolValue: string) => {
    const symbolData = symbolOptions.find(s => s.value === symbolValue);
    return symbolData ? symbolData.icon : Coins;
  };

  const SymbolIcon = getSymbolIcon(symbol);

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-slate-100 text-slate-900 p-6 w-full">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8"
      >
        <div className="flex items-center space-x-3">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          >
            <Activity className="h-8 w-8 text-purple-400" />
          </motion.div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            CryptoTrader Pro
          </h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <Select value={symbol} onValueChange={onSymbolChange}>
            <SelectTrigger className="w-[180px] bg-slate-800 border-slate-700">
              <SelectValue placeholder="Select symbol" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              {symbolOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center space-x-2">
                      <Icon className="h-4 w-4" />
                      <span>{option.label}</span>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          
          <UserProfile onLogout={onLogout} userEmail={userEmail} />
        </div>
      </motion.div>

      {/* Main content area: Chart + Market Data + Current Price */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 my-6">
        {/* Left Column for Market Data and Current Price (takes 1/3 width on large screens) */}
        <div className="lg:col-span-1 space-y-6">
          {/* Price Card */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-white/80 backdrop-blur-md border-slate-200 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Current Price</CardTitle>
                <SymbolIcon className="h-4 w-4 text-purple-400" />
              </CardHeader>
              <CardContent>
                <motion.div
                  key={currentPrice}
                  initial={{ scale: 1.1, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-3xl font-bold"
                >
                  ${currentPrice?.toFixed(2) || "0.00"}
                </motion.div>
                <div className={`flex items-center text-xs ${isPriceUp ? 'text-green-400' : 'text-red-400'}`}>
                  {isPriceUp ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                  {priceChange.toFixed(2)}%
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Market Data */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="bg-white/80 backdrop-blur-md border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm font-medium">Market Data</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Symbol</TableHead>
                      <TableHead>Bid</TableHead>
                      <TableHead>Ask</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(prices).map(([symbol, price]) => (
                      <TableRow key={symbol}>
                        <TableCell className="font-medium text-slate-900">{symbol.toUpperCase()}</TableCell>
                        <TableCell className="text-green-400 font-mono">${price.bid}</TableCell>
                        <TableCell className="text-red-400 font-mono">${price.ask}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Chart Component (takes 2/3 width on large screens) */}
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-white/80 backdrop-blur-md border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle>Price Chart</CardTitle>
                <CardDescription>Real-time candlestick chart for {symbol}</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartComponent 
                  data={candleData} 
                  colors={{
                    backgroundColor: "#ffffff",
                    textColor: "#000000",
                    upColor: "#22c55e",
                    downColor: "#ef4444",
                    borderUpColor: "#16a34a",
                    borderDownColor: "#dc2626",
                    wickUpColor: "#22c55e",
                    wickDownColor: "#ef4444"
                  }}
                />
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Remaining content area: Trade Execution + Quick Actions + Account Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Left Column - Account Summary (moved here) */}
        <div className="lg:col-span-1 space-y-6">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="bg-white/80 backdrop-blur-md border-slate-200 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Account</CardTitle>
                <Wallet className="h-4 w-4 text-blue-400" />
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-400">Balance</span>
                  <span className="text-slate-100 font-mono">
                    ${accountSummary?.freeMargin?.toFixed(2) || '0.00'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-400">Equity</span>
                  <span className="text-slate-100 font-mono">
                    ${accountSummary?.equity?.toFixed(2) || '0.00'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-400">Margin Used</span>
                  <span className="text-slate-100 font-mono">
                    ${accountSummary?.totalMarginUsed?.toFixed(2) || '0.00'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Middle Column - Trading Interface (now takes 2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="bg-white/80 backdrop-blur-md border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle>Trade Execution</CardTitle>
                <CardDescription>Place your buy or sell orders</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {tradeError && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm"
                  >
                    {tradeError}
                  </motion.div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(parseFloat(e.target.value))}
                      className="bg-white border-slate-300"
                      step="0.001"
                      min="0.001"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="leverage">Leverage</Label>
                    <Input
                      id="leverage"
                      type="number"
                      value={leverage}
                      onChange={(e) => setLeverage(parseFloat(e.target.value))}
                      className="bg-white border-slate-300"
                      min="1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="stopLoss">Stop Loss (Optional)</Label>
                    <Input
                      id="stopLoss"
                      type="number"
                      value={stopLoss || ''}
                      onChange={(e) => setStopLoss(e.target.value ? parseFloat(e.target.value) : undefined)}
                      className="bg-white border-slate-300"
                      step="0.01"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="takeProfit">Take Profit (Optional)</Label>
                    <Input
                      id="takeProfit"
                      type="number"
                      value={takeProfit || ''}
                      onChange={(e) => setTakeProfit(e.target.value ? parseFloat(e.target.value) : undefined)}
                      className="bg-white border-slate-300"
                      step="0.01"
                    />
                  </div>
                </div>

                <div className="flex space-x-4 pt-4">
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      onClick={() => handleTrade("buy")}
                      className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-3"
                    >
                      <TrendingUp className="h-5 w-5 mr-2" />
                      BUY
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      onClick={() => handleTrade("sell")}
                      className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold py-3"
                    >
                      <TrendingDown className="h-5 w-5 mr-2" />
                      SELL
                    </Button>
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="grid grid-cols-3 gap-4"
          >
            <Card className="bg-white/80 backdrop-blur-md border-slate-200 shadow-sm hover:border-purple-400 transition-colors cursor-pointer">
              <CardContent className="p-4 flex items-center justify-center">
                <BarChart3 className="h-8 w-8 text-blue-400" />
              </CardContent>
            </Card>
            <Card className="bg-white/80 backdrop-blur-md border-slate-200 shadow-sm hover:border-green-400 transition-colors cursor-pointer">
              <CardContent className="p-4 flex items-center justify-center">
                <Clock className="h-8 w-8 text-green-400" />
              </CardContent>
            </Card>
            <Card className="bg-white/80 backdrop-blur-md border-slate-200 shadow-sm hover:border-orange-400 transition-colors cursor-pointer">
              <CardContent className="p-4 flex items-center justify-center">
                <DollarSign className="h-8 w-8 text-orange-400" />
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Floating Price Indicator */}
      {currentPrice && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-4 right-4 bg-white/90 backdrop-blur-md rounded-lg p-3 border border-slate-200 shadow-lg"
        >
          <div className="flex items-center space-x-2">
            <SymbolIcon className="h-5 w-5 text-purple-400" />
            <span className="font-mono text-sm">{symbol}</span>
            <span className={`font-bold ${isPriceUp ? 'text-green-400' : 'text-red-400'}`}>
              ${currentPrice.toFixed(2)}
            </span>
            {isPriceUp ? (
              <ChevronUp className="h-4 w-4 text-green-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-red-400" />
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default TradingDashboard;