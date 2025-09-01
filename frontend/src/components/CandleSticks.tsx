import React, { useEffect, useRef } from "react";
import {
  createChart,
  ColorType,
  CandlestickSeries,
} from "lightweight-charts";
import type {
  IChartApi,
  ISeriesApi,
  CandlestickData,
} from "lightweight-charts";

interface ChartProps {
  data: CandlestickData[];
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
  const chartRef = useRef<{ chart: IChartApi; series: ISeriesApi<"Candlestick"> } | null>(
    null
  );

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: backgroundColor },
        textColor,
      },
      width: chartContainerRef.current.clientWidth,
      height: 500,
    });

        const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor,
      downColor,
      borderUpColor,
      borderDownColor,
      wickUpColor,
      wickDownColor,
    });

    chart.timeScale().fitContent();

    chartRef.current = { chart, series: candleSeries };

    const handleResize = () => {
      chart.applyOptions({
        width: chartContainerRef.current?.clientWidth ?? 0,
      });
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
      chartRef.current = null;
    };
  }, [
    backgroundColor,
    textColor,
    upColor,
    downColor,
    borderUpColor,
    borderDownColor,
    wickUpColor,
    wickDownColor,
  ]);

  useEffect(() => {
    if (chartRef.current && data) {
      chartRef.current.series.setData(data);
    }
  }, [data]);

  return (
    <div ref={chartContainerRef} style={{ width: "100%", height: "500px" }} />
  );
};
