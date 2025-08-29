import React, { useEffect, useReducer, useState } from "react"; // Added useState
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
      const data = JSON.parse(event.data as string);
      if (data.symbol === state.symbol) {
        dispatch({
          type: "SET_BID_ASK",
          payload: {
            bid: parseFloat(data.bid).toFixed(2),
            ask: parseFloat(data.ask).toFixed(2),
          },
        });
        if (data.tradePrice && data.tradeTime) {
          dispatch({
            type: "UPDATE_LAST_CANDLE",
            payload: {
              tradePrice: data.tradePrice,
              tradeTime: data.tradeTime,
            },
          });
        }
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
