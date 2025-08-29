import React, { useEffect, useRef } from "react";
import { createChart, CandlestickSeries, ColorType } from "lightweight-charts";

interface CandleData {
  time: number; // UNIX timestamp in seconds
  open: number;
  high: number;
  low: number;
  close: number;
}

interface ChartProps {
  data: CandleData[];
  colors?: {
    backgroundColor?: string;
    textColor?: string;
    upColor?: string;
    downColor?: string;
    borderUpColor?: string;
    borderDownColor?: string;
    wickUpColor?: string;
    wickDownColor?: string;
  };
}

export const ChartComponent: React.FC<ChartProps> = ({ data, colors = {} }) => {
  const {
    backgroundColor = "white",
    textColor = "black",
    upColor = "#26a69a",
    downColor = "#ef5350",
    borderUpColor = "#26a69a",
    borderDownColor = "#ef5350",
    wickUpColor = "#26a69a",
    wickDownColor = "#ef5350",
  } = colors;

  const chartContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: backgroundColor },
        textColor,
      },
      width: chartContainerRef.current.clientWidth,
      height: 300,
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor,
      downColor,
      borderUpColor,
      borderDownColor,
      wickUpColor,
      wickDownColor,
    });
    //@ts-ignore
    candleSeries.setData(data);

    chart.timeScale().fitContent();

    const handleResize = () => {
      chart.applyOptions({
        width: chartContainerRef.current?.clientWidth ?? 0,
      });
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, [
    data,
    backgroundColor,
    textColor,
    upColor,
    downColor,
    borderUpColor,
    borderDownColor,
    wickUpColor,
    wickDownColor,
  ]);

  return (
    <div ref={chartContainerRef} style={{ width: "100%", height: "300px" }} />
  );
};
