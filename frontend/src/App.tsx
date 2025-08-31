import  { useEffect, useReducer, useState } from "react"; // Added useState
import { ChartComponent } from "./components/CandleSticks";
import Auth from "./components/Auth";

type State = {
  candleData: any[];
  symbol: string;
  interval: string;
  bidPrice: string | null;
  askPrice: string | null;
  currentPrice: number | null;
};

type Action =
  | { type: "SET_CANDLES"; payload: any[] }
  | { type: "SET_SYMBOL"; payload: string }
  | { type: "SET_INTERVAL"; payload: string }
  | {
      type: "UPDATE_LAST_CANDLE";
      payload: { tradePrice: number; tradeTime: number };
    }
  | { type: "SET_BID_ASK"; payload: { bid: string; ask: string } };

const initialState: State = {
  candleData: [],
  symbol: "BTCUSDT",
  interval: "1m",
  bidPrice: null,
  askPrice: null,
  currentPrice: null,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_CANDLES":
      return { ...state, candleData: action.payload };
    case "SET_SYMBOL":
      return { ...state, symbol: action.payload };
    case "SET_INTERVAL":
      return { ...state, interval: action.payload };
    case "SET_BID_ASK":
      return {
        ...state,
        bidPrice: action.payload.bid,
        askPrice: action.payload.ask,
      };
    case "UPDATE_LAST_CANDLE":
      const { tradePrice, tradeTime } = action.payload;

      const intervalString = state.interval;
      let intervalSeconds = 60; // default to 1m
      if (intervalString.endsWith("m")) {
        intervalSeconds = parseInt(intervalString.slice(0, -1)) * 60;
      } else if (intervalString.endsWith("h")) {
        intervalSeconds = parseInt(intervalString.slice(0, -1)) * 3600;
      }

      const tradeTimeSeconds = tradeTime / 1000;
      const candleTime =
        Math.floor(tradeTimeSeconds / intervalSeconds) * intervalSeconds;

      const lastCandle =
        state.candleData.length > 0
          ? state.candleData[state.candleData.length - 1]
          : null;

      if (lastCandle && candleTime === lastCandle.time) {
        // Trade belongs to the last candle in the state -> UPDATE
        const updatedCandle = {
          ...lastCandle,
          high: Math.max(lastCandle.high, tradePrice),
          low: Math.min(lastCandle.low, tradePrice),
          close: tradePrice,
        };
        return {
          ...state,
          currentPrice: tradePrice,
          candleData: [...state.candleData.slice(0, -1), updatedCandle],
        };
      } else {
        const newCandle = {
          time: candleTime,
          open: tradePrice,
          high: tradePrice,
          low: tradePrice,
          close: tradePrice,
        };
        return {
          ...state,
          currentPrice: tradePrice,
          candleData: [...state.candleData, newCandle],
        };
      }
    default:
      return state;
  }
}
function App() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(
    !!localStorage.getItem("token")
  ); // Added isLoggedIn state
  const [userBalance, setUserBalance] = useState<number | null>(null);
  const [quantity, setQuantity] = useState<number>(0.001);
  const [leverage, setLeverage] = useState<number>(1);
  const [stopLoss, setStopLoss] = useState<number | undefined>(undefined);
  const [takeProfit, setTakeProfit] = useState<number | undefined>(undefined);

  const handleAuthSuccess = (balance: number) => {
    setIsLoggedIn(true);
    setUserBalance(balance);
  };

  const handleLogout = () => {
    // Simple frontend-only logout - just clear localStorage and reset state
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    setUserBalance(null);
  };

  const fetchUserBalance = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const response = await fetch("http://localhost:3001/api/v1/user/balance", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUserBalance(data.balance);
      }
    } catch (error) {
      console.error("Error fetching balance:", error);
    }
  };

  const handleTrade = async (type: "buy" | "sell") => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please log in to place a trade.");
      return;
    }

    try {
      const response = await fetch("http://localhost:3001/api/v1/trade", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          type,
          symbol: state.symbol,
          quantity,
          leverage,
          stopLoss,
          takeProfit,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        alert(data.message);
        fetchUserBalance(); // Refresh balance after trade
      } else {
        alert(`Trade failed: ${data.message}`);
      }
    } catch (error) {
      console.error("Error placing trade:", error);
      alert("Network error or server is unreachable.");
    }
  };

  useEffect(() => {
    // Check for token on initial load
    if (localStorage.getItem("token")) {
      setIsLoggedIn(true);
      fetchUserBalance();
    }

    fetch(
      `http://localhost:3001/candles/${state.symbol}?interval=${state.interval}`
    )
      .then((response) => response.json())
      .then((data) => {
        if (data.data) {
          const transformedData = data.data
            .map((item: any) => ({
              time: new Date(item.bucket).getTime() / 1000,
              open: parseFloat(item.open),
              high: parseFloat(item.high),
              low: parseFloat(item.low),
              close: parseFloat(item.close),
            }))
            //@ts-ignore
            .sort((a, b) => a.time - b.time);

          dispatch({ type: "SET_CANDLES", payload: transformedData });
        }
      });

    // WebSocket for real-time bid/ask updates
    const ws = new WebSocket("ws://localhost:3002");

    ws.onopen = () =>
      console.log("Connected to WebSocket server for bid/ask updates");

    ws.onmessage = (event) => {
      try {
        console.log("WebSocket message received:", event.data);
        const data = JSON.parse(event.data as string);
        console.log("Parsed WebSocket data:", data);
        
        if (data.symbol === state.symbol) {
          console.log("Matching symbol, updating bid/ask:", data.symbol);
          dispatch({
            type: "SET_BID_ASK",
            payload: {
              bid: parseFloat(data.bid).toFixed(2),
              ask: parseFloat(data.ask).toFixed(2),
            },
          });
          if (data.tradePrice && data.tradeTime) {
            console.log("Updating candle with trade data");
            dispatch({
              type: "UPDATE_LAST_CANDLE",
              payload: {
                tradePrice: data.tradePrice,
                tradeTime: data.tradeTime,
              },
            });
          }
        } else {
          console.log("Symbol mismatch:", data.symbol, "!=", state.symbol);
        }
      } catch (error) {
        console.error("Error processing WebSocket message:", error, event.data);
      }
    };

    ws.onclose = () => console.log("Disconnected from WebSocket server");
    ws.onerror = (error) => console.error("WebSocket error:", error);

    // Set up interval to fetch balance every 5 seconds
    const balanceInterval = setInterval(fetchUserBalance, 5000);

    return () => {
      ws.close();
      clearInterval(balanceInterval);
    };
  }, [state.symbol, state.interval]);

  return (
    <div style={{ width: "800px", margin: "20px auto" }}>
      {!isLoggedIn ? (
        <Auth onAuthSuccess={handleAuthSuccess} />
      ) : (
        <>
          <div>
            <h2>Real-time Prices:</h2>
            <p>Bid: {state.bidPrice}</p>
            <p>Ask: {state.askPrice}</p>
          </div>
          {userBalance !== null && (
            <p style={{ marginTop: "5px", color: "green" }}>
              Your Balance: ${userBalance.toFixed(2)}
            </p>
          )}
          <div>
            <h2>Current price</h2>
            <h2>{state.currentPrice}</h2>
          </div>
          <input
            type="text"
            value={state.symbol}
            onChange={(e) =>
              dispatch({ type: "SET_SYMBOL", payload: e.target.value })
            }
            placeholder="Symbol"
          />
          <input
            type="text"
            value={state.interval}
            onChange={(e) =>
              dispatch({ type: "SET_INTERVAL", payload: e.target.value })
            }
            placeholder="Interval"
          />

          <div style={{ marginTop: "20px", borderTop: "1px solid #ccc", paddingTop: "20px" }}>
            <h3>Place Trade</h3>
            <div style={{ marginBottom: "10px" }}>
              <label htmlFor="quantity">Quantity:</label>
              <input
                type="number"
                id="quantity"
                value={quantity}
                onChange={(e) => setQuantity(parseFloat(e.target.value))}
                placeholder="Quantity"
                step="0.001"
                min="0.001"
              />
            </div>
            <div style={{ marginBottom: "10px" }}>
              <label htmlFor="leverage">Leverage:</label>
              <input
                type="number"
                id="leverage"
                value={leverage}
                onChange={(e) => setLeverage(parseFloat(e.target.value))}
                placeholder="Leverage"
                min="1"
              />
            </div>
            <div style={{ marginBottom: "10px" }}>
              <label htmlFor="stopLoss">Stop Loss:</label>
              <input
                type="number"
                id="stopLoss"
                value={stopLoss !== undefined ? stopLoss : ''}
                onChange={(e) => setStopLoss(e.target.value === '' ? undefined : parseFloat(e.target.value))}
                placeholder="Stop Loss (Optional)"
                step="0.01"
              />
            </div>
            <div style={{ marginBottom: "20px" }}>
              <label htmlFor="takeProfit">Take Profit:</label>
              <input
                type="number"
                id="takeProfit"
                value={takeProfit !== undefined ? takeProfit : ''}
                onChange={(e) => setTakeProfit(e.target.value === '' ? undefined : parseFloat(e.target.value))}
                placeholder="Take Profit (Optional)"
                step="0.01"
              />
            </div>
            <button
              onClick={() => handleTrade("buy")}
              style={{ backgroundColor: "#4CAF50", color: "white", marginRight: "10px" }}
            >
              Buy
            </button>
            <button
              onClick={() => handleTrade("sell")}
              style={{ backgroundColor: "#f44336", color: "white" }}
            >
              Sell
            </button>
          </div>

          <ChartComponent data={state.candleData} />
          <button
            onClick={handleLogout}
            style={{
              marginTop: "20px",
              padding: "10px 20px",
              backgroundColor: "#ff4444",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            Logout
          </button>
        </>
      )}
    </div>
  );
}

export default App;
