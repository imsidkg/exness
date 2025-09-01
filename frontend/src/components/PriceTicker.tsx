import { motion, AnimatePresence } from "motion/react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useEffect, useState } from "react";

interface PriceTickerProps {
  symbol: string;
  price: number | null;
  previousPrice: number | null;
}

const PriceTicker = ({ symbol, price, previousPrice }: PriceTickerProps) => {
  const [direction, setDirection] = useState<'up' | 'down' | 'same'>('same');
  const [changePercent, setChangePercent] = useState(0);

  useEffect(() => {
    if (price && previousPrice) {
      const change = price - previousPrice;
      const percentChange = (change / previousPrice) * 100;
      
      setChangePercent(percentChange);
      setDirection(change > 0 ? 'up' : change < 0 ? 'down' : 'same');
    }
  }, [price, previousPrice]);

  if (!price) return null;

  return (
    <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="text-sm font-semibold text-slate-300">{symbol}</div>
          
          <AnimatePresence mode="wait">
            <motion.div
              key={price}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className={`text-xl font-bold ${
                direction === 'up' 
                  ? 'text-green-400' 
                  : direction === 'down' 
                  ? 'text-red-400' 
                  : 'text-slate-300'
              }`}
            >
              ${price.toFixed(2)}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className={`flex items-center space-x-1 ${
          direction === 'up' 
            ? 'text-green-400' 
            : direction === 'down' 
            ? 'text-red-400' 
            : 'text-slate-400'
        }`}>
          <AnimatePresence mode="wait">
            {direction !== 'same' && (
              <motion.div
                key={direction}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
              >
                {direction === 'up' ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
              </motion.div>
            )}
          </AnimatePresence>
          
          <span className="text-sm font-medium">
            {changePercent !== 0 && `${Math.abs(changePercent).toFixed(2)}%`}
          </span>
        </div>
      </div>

      {/* Price movement indicator bar */}
      <div className="mt-2 h-1 bg-slate-700 rounded-full overflow-hidden">
        <motion.div
          className={`h-full ${
            direction === 'up' 
              ? 'bg-green-500' 
              : direction === 'down' 
              ? 'bg-red-500' 
              : 'bg-slate-500'
          }`}
          initial={{ width: '0%' }}
          animate={{ 
            width: direction === 'same' 
              ? '50%' 
              : `${Math.min(Math.abs(changePercent) * 2, 100)}%` 
          }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>

      {/* Volume indicator (simulated) */}
      <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
        <span>Volume: {(Math.random() * 1000).toFixed(0)}K</span>
        <span>24h Change</span>
      </div>
    </div>
  );
};

export default PriceTicker;
