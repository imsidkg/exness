import React, { useEffect, useState } from "react";
import { ChartComponent } from "./components/CandleSticks";

function App() {
  const [candleData, setCandleData] = useState([]);
  const [symbol, setSymbol] = useState("BTCUSDT");
  const [interval, setInterval] = useState("1m");
  const [bidPrice, setBidPrice] = useState<string | null>(null);
  const [askPrice, setAskPrice] = useState<string | null>(null);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);

  useEffect(() => {
    // Fetch historical candle data
    fetch(`http://localhost:3001/candles/${symbol}?interval=${interval}`)
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
          setCandleData(transformedData);
        }
      });

    // WebSocket for real-time bid/ask updates
    const ws = new WebSocket("ws://localhost:3002"); // Connect to the new WebSocket server

    ws.onopen = () => {
      console.log("Connected to WebSocket server for bid/ask updates");
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data as string);
      if (data.symbol === symbol) {
        // Only update for the currently selected symbol
        setBidPrice(parseFloat(data.bid).toFixed(2));
        setAskPrice(parseFloat(data.ask).toFixed(2));
        setCurrentPrice(data.tradePrice)
      }
    };

    ws.onclose = () => {
      console.log("Disconnected from WebSocket server for bid/ask updates");
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    // Clean up WebSocket connection on component unmount
    return () => {
      ws.close();
    };
  }, [symbol, interval]); // Re-run effect if symbol or interval changes

  return (
    <div style={{ width: "800px", margin: "20px auto" }}>
      <div>
        <h2>Real-time Prices:</h2>
        <p>Bid: {bidPrice}</p>
        <p>Ask: {askPrice}</p>
      </div>
      <div>
        <h2>Current price</h2>
        <h2>{currentPrice}</h2>
      </div>
      <input
        type="text"
        value={symbol}
        onChange={(e) => setSymbol(e.target.value)}
        placeholder="Symbol"
      />
      <input
        type="text"
        value={interval}
        onChange={(e) => setInterval(e.target.value)}
        placeholder="Interval"
      />
      <ChartComponent data={candleData} />
    </div>
  );
}

export default App;
