"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Star } from "@phosphor-icons/react";
import { useWallet, WalletId } from "@/lib/useWallet";
import DashboardSidebar from "@/components/DashboardSidebar";
import AskHodegosButton from "@/components/AskHodegosButton";
import { FEATURED_MARKET_IDS, SpotMarket, formatVolume, fetchSpotMarkets, fetchMarketSummary, fetchCandles, fetchOrderbook, Orderbook } from "@/lib/injective";
import { createChart, ColorType, CandlestickSeries, LineSeries, HistogramSeries, IChartApi } from "lightweight-charts";

const WALLET_LABELS: Partial<Record<WalletId, string>> = {
  keplr: "Keplr", leap: "Leap", ninji: "Ninji", metamask: "MetaMask",
};

const RESOLUTIONS = [
  { label: "1m", value: 60 },
  { label: "5m", value: 300 },
  { label: "15m", value: 900 },
  { label: "1H", value: 3600 },
  { label: "4H", value: 14400 },
  { label: "1D", value: 86400 },
];

const FEATURED = [
  { ticker: "INJ/USDT", marketId: FEATURED_MARKET_IDS["INJ/USDT"] },
  { ticker: "ATOM/USDT", marketId: FEATURED_MARKET_IDS["ATOM/USDT"] },
  { ticker: "WETH/USDT", marketId: FEATURED_MARKET_IDS["WETH/USDT"] },
  { ticker: "SOL/USDT", marketId: FEATURED_MARKET_IDS["SOL/USDT"] },
  { ticker: "TIA/USDT", marketId: FEATURED_MARKET_IDS["TIA/USDT"] },
];

interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface MarketRow {
  ticker: string;
  marketId: string;
  price: number;
  change24h: number;
  volume24h: number;
  high24h: number;
  low24h: number;
  status: "live" | "loading";
}

function useWindowSize() {
  const [size, setSize] = useState({ width: 1200, height: 700 });
  useEffect(() => {
    const update = () => setSize({ width: window.innerWidth, height: window.innerHeight });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return size;
}

export default function MarketsPage() {
  const { address, wallet, isConnected, disconnect, truncateAddress, isInitialized } = useWallet();
  const router = useRouter();
  const { width } = useWindowSize();

  const [selectedMarket, setSelectedMarket] = useState(FEATURED[0]);
  const [resolution, setResolution] = useState(3600);
  const [candles, setCandles] = useState<CandleData[]>([]);
  const [allMarkets, setAllMarkets] = useState<SpotMarket[]>([]);
  const [marketRows, setMarketRows] = useState<MarketRow[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"ALL" | "USDT" | "INJ" | "USDC">("ALL");
  const [candleLoading, setCandleLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"chart" | "depth">("chart");
  const [orderbook, setOrderbook] = useState<Orderbook | null>(null);
  const [orderbookLoading, setOrderbookLoading] = useState(false);

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  const handleDisconnect = () => { disconnect(); router.replace("/"); };

  // Fetch candle data
  const loadCandles = useCallback(async (marketId: string, res: number) => {
    setCandleLoading(true);
    try {
      const data = await fetchCandles(marketId, res);
      if (data.length > 0) {
        setCandles(data);
      }
    } catch { /* ignore */ }
    setCandleLoading(false);
  }, []);

  // Fetch orderbook data
  const loadOrderbook = useCallback(async (marketId: string, currentPrice: number) => {
    if (activeTab !== "depth") return;
    setOrderbookLoading(true);
    try {
      const data = await fetchOrderbook(marketId, currentPrice > 0 ? currentPrice : 100);
      setOrderbook(data);
    } catch { /* ignore */ }
    setOrderbookLoading(false);
  }, [activeTab]);

  useEffect(() => {
    loadCandles(selectedMarket.marketId, resolution);
    const interval = setInterval(() => loadCandles(selectedMarket.marketId, resolution), 30000);
    return () => clearInterval(interval);
  }, [selectedMarket, resolution, loadCandles]);


  // Build chart
  useEffect(() => {
    if (!chartContainerRef.current || candles.length === 0) return;
    const el = chartContainerRef.current;

    if (chartRef.current) { chartRef.current.remove(); chartRef.current = null; }

    const chart = createChart(el, {
      width: el.clientWidth,
      height: el.clientHeight,
      layout: {
        background: { type: ColorType.Solid, color: "#FEFDF9" },
        textColor: "#1a1a1a",
        fontSize: 11,
        fontFamily: "'Inter', sans-serif",
      },
      grid: {
        vertLines: { color: "#e5e5e0", style: 2 },
        horzLines: { color: "#e5e5e0", style: 2 },
      },
      crosshair: { mode: 1 },
      rightPriceScale: {
        borderColor: "#000",
        borderVisible: true,
      },
      timeScale: {
        borderColor: "#000",
        borderVisible: true,
        timeVisible: true,
        secondsVisible: resolution < 300,
      },
    });
    chartRef.current = chart;

    // Candlestick series
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#9FEF6A",
      downColor: "#FF4444",
      borderUpColor: "#000",
      borderDownColor: "#000",
      wickUpColor: "#000",
      wickDownColor: "#000",
    });
    candleSeries.setData(candles.map(c => ({ time: c.time as unknown as import('lightweight-charts').Time, open: c.open, high: c.high, low: c.low, close: c.close })));

    // Volume histogram
    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: "#D0EE51",
      priceFormat: { type: "volume" },
      priceScaleId: "volume",
    });
    chart.priceScale("volume").applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });
    volumeSeries.setData(candles.map(c => ({
      time: c.time as unknown as import('lightweight-charts').Time,
      value: c.volume,
      color: c.close >= c.open ? "#9FEF6A88" : "#FF444488",
    })));

    if (candles.length > 0) {
      const visibleCount = Math.min(60, candles.length);
      chart.timeScale().setVisibleRange({
        from: candles[candles.length - visibleCount].time as any,
        to: candles[candles.length - 1].time as any,
      });
    } else {
      chart.timeScale().fitContent();
    }

    const ro = new ResizeObserver(() => {
      if (chartRef.current && el) {
        chartRef.current.applyOptions({ width: el.clientWidth, height: el.clientHeight });
      }
    });
    ro.observe(el);
    return () => { ro.disconnect(); if (chartRef.current) { chartRef.current.remove(); chartRef.current = null; } };
  }, [candles, resolution]);

  // Fetch all spot markets for the table
  useEffect(() => {
    fetchSpotMarkets()
      .then(active => {
        setAllMarkets(active);
        // Build rows for featured markets first
        const rows: MarketRow[] = FEATURED.map(f => ({
          ticker: f.ticker,
          marketId: f.marketId,
          price: 0,
          change24h: 0,
          volume24h: 0,
          high24h: 0,
          low24h: 0,
          status: "loading",
        }));
        setMarketRows(rows);
      })
      .catch(() => {});
  }, []);

  // Fetch live summaries for featured markets
  useEffect(() => {
    const fetchSummaries = async () => {
      const updated = await Promise.all(
        FEATURED.map(async (f) => {
          try {
            const s = await fetchMarketSummary(f.marketId);
            if (!s) throw new Error("no data");
            const price = parseFloat(s?.price || "0");
            const price24ago = parseFloat(s?.price_24h_ago || "0");
            const change = price24ago > 0 ? ((price - price24ago) / price24ago) * 100 : 0;
            return {
              ticker: f.ticker,
              marketId: f.marketId,
              price,
              change24h: change,
              volume24h: parseFloat(s?.volume || "0"),
              high24h: parseFloat(s?.high || "0"),
              low24h: parseFloat(s?.low || "0"),
              status: "live" as const,
            };
          } catch {
            return {
              ticker: f.ticker,
              marketId: f.marketId,
              price: 0,
              change24h: 0,
              volume24h: 0,
              high24h: 0,
              low24h: 0,
              status: "live" as const,
            };
          }
        })
      );
      setMarketRows(updated);
    };
    fetchSummaries();
    const interval = setInterval(fetchSummaries, 15000);
    return () => clearInterval(interval);
  }, []);

  // Current selected market row
  const currentRow = marketRows.find(r => r.marketId === selectedMarket.marketId);
  const currentPrice = currentRow?.price ?? 0;
  const currentChange = currentRow?.change24h ?? 0;
  const isPositive = currentChange >= 0;

  useEffect(() => {
    if (activeTab === "depth") {
      loadOrderbook(selectedMarket.marketId, currentPrice > 0 ? currentPrice : 100);
      const interval = setInterval(() => loadOrderbook(selectedMarket.marketId, currentPrice > 0 ? currentPrice : 100), 5000);
      return () => clearInterval(interval);
    }
  }, [selectedMarket, activeTab, currentPrice, loadOrderbook]);

  // Filtered all-market list
  const filteredMarkets = allMarkets.filter(m => {
    const matchSearch = m.ticker.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "ALL" || m.ticker.includes(`/${filter}`);
    return matchSearch && matchFilter;
  });

  useEffect(() => {
    if (isInitialized && !isConnected) router.replace("/");
  }, [isInitialized, isConnected, router]);

  if (!isInitialized || !isConnected || !address) return null;

  const displayAddress = truncateAddress(address);
  const walletLabel = WALLET_LABELS[wallet!] ?? wallet;

  return (
    <div className="h-screen w-screen bg-[#FEFDF9] font-sans flex overflow-hidden">
      <DashboardSidebar onDisconnect={handleDisconnect} />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top navbar */}
        <header className="h-[76px] bg-[#EAE8E0] border-b-4 border-black flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="flex items-center gap-2">
              <Image src="/main.png" alt="Hodegos" width={120} height={24} className="object-contain" style={{ height: "auto" }} />
            </Link>
            <div className="h-6 w-[2px] bg-black/20" />
            <span className="font-black text-xs uppercase tracking-widest bg-neo-lime px-2 py-0.5 border-2 border-black">
              Markets
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white border-2 border-black px-3 py-1.5 font-bold text-[10px]">
              <span className="font-black uppercase">{walletLabel}</span>
              <span className="text-black/60">{displayAddress}</span>
            </div>
            <span className="font-black text-[9px] uppercase tracking-widest text-green-600">Live</span>
          </div>
        </header>

        {/* Main layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Market list */}
          <div className="w-72 border-r-4 border-black flex flex-col bg-white shrink-0 overflow-hidden">
            <div className="border-b-4 border-black p-3">
              <input
                type="text"
                placeholder="Search markets..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-[#EAE8E0] border-[3px] border-black px-3 py-2 font-bold text-xs outline-none focus:bg-white transition-colors"
              />
              <div className="flex gap-1 mt-2">
                {(["ALL", "USDT", "INJ", "USDC"] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`flex-1 px-1 py-1 font-black text-[8px] uppercase border-2 border-black transition-all ${filter === f ? "bg-black text-white" : "bg-white hover:bg-neo-yellow"}`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Featured markets pinned at top */}
            <div className="border-b-2 border-black/20 p-2">
              <div className="font-black text-[8px] uppercase tracking-widest text-black/40 px-2 mb-1 flex items-center gap-1">
                <Star size={10} weight="fill" className="text-neo-yellow" /> Featured
              </div>
              {marketRows.map(row => (
                <button
                  key={row.ticker}
                  onClick={() => setSelectedMarket({ ticker: row.ticker, marketId: row.marketId })}
                  className={`w-full flex items-center justify-between px-2 py-2 border-2 transition-all text-left ${
                    selectedMarket.marketId === row.marketId
                      ? "bg-black text-white border-black"
                      : "border-transparent hover:border-black hover:bg-[#EAE8E0]"
                  }`}
                >
                  <div>
                    <div className="font-black text-xs">{row.ticker}</div>
                    <div className={`font-bold text-[9px] ${selectedMarket.marketId === row.marketId ? "text-white/60" : "text-black/40"}`}>
                      {row.status === "loading" ? "—" : row.price > 0 ? `$${row.price.toFixed(row.price < 0.01 ? 6 : 2)}` : "—"}
                    </div>
                  </div>
                  <div className={`font-black text-[10px] ${row.change24h >= 0 ? "text-green-600" : "text-red-500"} ${selectedMarket.marketId === row.marketId ? "text-neo-lime!" : ""}`}>
                    {row.status === "loading" ? "..." : row.price > 0 ? `${row.change24h >= 0 ? "+" : ""}${row.change24h.toFixed(2)}%` : "—"}
                  </div>
                </button>
              ))}
            </div>

            {/* All markets scrollable */}
            <div className="flex-1 overflow-y-auto">
              <div className="font-black text-[8px] uppercase tracking-widest text-black/40 px-4 py-2">All Markets ({filteredMarkets.length})</div>
              {filteredMarkets.slice(0, 80).map(m => (
                <button
                  key={m.market_id}
                  onClick={() => setSelectedMarket({ ticker: m.ticker, marketId: m.market_id })}
                  className={`w-full flex items-center justify-between px-4 py-2 border-b border-black/5 transition-all text-left hover:bg-[#EAE8E0] ${
                    selectedMarket.marketId === m.market_id ? "bg-neo-lime/30 font-black" : ""
                  }`}
                >
                  <span className="font-bold text-xs">{m.ticker}</span>
                  <span className="font-black text-[8px] uppercase text-black/30">{m.status}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Center: Chart */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Market header */}
            <div className="border-b-4 border-black bg-[#FEFDF9] px-5 py-3 flex items-center gap-6 shrink-0">
              <div>
                <h1 className="font-black text-xl uppercase tracking-widest">{selectedMarket.ticker}</h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`font-black text-2xl ${isPositive ? "text-green-600" : "text-red-500"}`}>
                    {currentPrice > 0 ? `$${currentPrice.toFixed(currentPrice < 0.01 ? 6 : 2)}` : "—"}
                  </span>
                  {currentPrice > 0 && (
                    <span className={`font-black text-sm px-2 py-0.5 border-2 border-black ${isPositive ? "bg-neo-lime" : "bg-red-100 text-red-700"}`}>
                      {isPositive ? "+" : ""}{currentChange.toFixed(2)}%
                    </span>
                  )}
                </div>
              </div>
              {currentRow && currentPrice > 0 && (
                <div className="flex gap-6 ml-4">
                  <div>
                    <div className="font-black text-[9px] uppercase tracking-widest text-black/40">24H High</div>
                    <div className="font-black text-xs">{currentRow.high24h > 0 ? `$${currentRow.high24h.toFixed(currentRow.high24h < 0.01 ? 6 : 2)}` : "—"}</div>
                  </div>
                  <div>
                    <div className="font-black text-[9px] uppercase tracking-widest text-black/40">24H Low</div>
                    <div className="font-black text-xs">{currentRow.low24h > 0 ? `$${currentRow.low24h.toFixed(currentRow.low24h < 0.01 ? 6 : 2)}` : "—"}</div>
                  </div>
                  <div>
                    <div className="font-black text-[9px] uppercase tracking-widest text-black/40">Volume</div>
                    <div className="font-black text-xs">{formatVolume(currentRow.volume24h)}</div>
                  </div>
                </div>
              )}
              <div className="ml-auto flex items-center gap-3">
                <AskHodegosButton
                  query={`Explain the market stats, chart trends, and order book depth for ${selectedMarket.ticker}. What does the buy/sell pressure look like?`}
                  label="Explain Market"
                />
                <div className="flex gap-1">
                  {RESOLUTIONS.map(r => (
                    <button
                      key={r.value}
                      onClick={() => setResolution(r.value)}
                      className={`px-3 py-1.5 font-black text-[10px] uppercase border-2 border-black transition-all ${
                        resolution === r.value ? "bg-black text-white" : "bg-white hover:bg-neo-yellow"
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Tab switcher */}
            <div className="border-b-2 border-black/10 flex shrink-0">
              <button
                onClick={() => setActiveTab("chart")}
                className={`px-5 py-2 font-black text-[10px] uppercase tracking-widest border-b-[3px] transition-all ${activeTab === "chart" ? "border-black" : "border-transparent hover:border-black/30"}`}
              >
                Candlestick Chart
              </button>
              <button
                onClick={() => setActiveTab("depth")}
                className={`px-5 py-2 font-black text-[10px] uppercase tracking-widest border-b-[3px] transition-all ${activeTab === "depth" ? "border-black" : "border-transparent hover:border-black/30"}`}
              >
                Market Depth
              </button>
            </div>

            {/* Chart area */}
            <div className="flex-1 relative overflow-hidden">
              {activeTab === "chart" && (
                <>
                  {candleLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-[#FEFDF9]/80 z-10">
                      <div className="flex flex-col items-center gap-3">
                        <div className="flex gap-1.5">
                          {[0, 1, 2].map(i => (
                            <div key={i} className="w-3 h-3 bg-black rounded-full animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
                          ))}
                        </div>
                        <div className="font-black text-xs uppercase tracking-widest">Loading chart data...</div>
                      </div>
                    </div>
                  )}
                  <div ref={chartContainerRef} className="w-full h-full" />
                </>
              )}
              {activeTab === "depth" && (
                <div className="flex-1 flex flex-col p-6 bg-[#EAE8E0]/30 h-full overflow-hidden">
                  <div className="font-black text-sm uppercase tracking-widest mb-4">Order Book</div>
                  {orderbookLoading && !orderbook ? (
                    <div className="flex-1 flex items-center justify-center">
                      <div className="font-black text-xs uppercase animate-pulse text-black/50">Loading depth data...</div>
                    </div>
                  ) : orderbook ? (
                    <div className="flex-1 grid grid-cols-2 gap-8 overflow-hidden">
                      {/* Bids */}
                      <div className="flex flex-col h-full overflow-hidden">
                        <div className="grid grid-cols-3 font-black text-[9px] uppercase tracking-widest text-black/40 border-b-2 border-black/20 pb-2 mb-2 px-2">
                          <div className="text-left">Total</div>
                          <div className="text-right">Size</div>
                          <div className="text-right">Price</div>
                        </div>
                        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar flex flex-col gap-0.5">
                          {orderbook.bids.map((b, i) => (
                            <div
                              key={i}
                              onClick={() => {
                                const query = `Explain what an order book bid is. The user clicked on a bid price of $${b.price.toFixed(4)} with size ${b.quantity.toFixed(2)} on the ${selectedMarket.ticker} order book. What does this represent in terms of buy wall or support?`;
                                window.dispatchEvent(new CustomEvent("open-hodegos-chat", { detail: { query } }));
                              }}
                              className="relative grid grid-cols-3 font-bold text-xs py-1.5 px-2 hover:bg-black/5 transition-colors cursor-pointer"
                            >
                              <div className="absolute top-0 right-0 bottom-0 bg-green-500/20 z-0" style={{ width: `${Math.min(100, (b.total / (orderbook.bids[orderbook.bids.length - 1]?.total || 1)) * 100)}%` }} />
                              <div className="relative z-10 text-left text-black/60">{b.total.toFixed(2)}</div>
                              <div className="relative z-10 text-right">{b.quantity.toFixed(2)}</div>
                              <div className="relative z-10 text-right text-green-600">{b.price.toFixed(4)}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Asks */}
                      <div className="flex flex-col h-full overflow-hidden">
                        <div className="grid grid-cols-3 font-black text-[9px] uppercase tracking-widest text-black/40 border-b-2 border-black/20 pb-2 mb-2 px-2">
                          <div className="text-left">Price</div>
                          <div className="text-right">Size</div>
                          <div className="text-right">Total</div>
                        </div>
                        <div className="flex-1 overflow-y-auto pl-2 custom-scrollbar flex flex-col gap-0.5">
                          {orderbook.asks.map((a, i) => (
                            <div
                              key={i}
                              onClick={() => {
                                const query = `Explain what an order book ask is. The user clicked on an ask price of $${a.price.toFixed(4)} with size ${a.quantity.toFixed(2)} on the ${selectedMarket.ticker} order book. What does this represent in terms of sell wall or resistance?`;
                                window.dispatchEvent(new CustomEvent("open-hodegos-chat", { detail: { query } }));
                              }}
                              className="relative grid grid-cols-3 font-bold text-xs py-1.5 px-2 hover:bg-black/5 transition-colors cursor-pointer"
                            >
                              <div className="absolute top-0 left-0 bottom-0 bg-red-500/20 z-0" style={{ width: `${Math.min(100, (a.total / (orderbook.asks[orderbook.asks.length - 1]?.total || 1)) * 100)}%` }} />
                              <div className="relative z-10 text-left text-red-500">{a.price.toFixed(4)}</div>
                              <div className="relative z-10 text-right">{a.quantity.toFixed(2)}</div>
                              <div className="relative z-10 text-right text-black/60">{a.total.toFixed(2)}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center font-bold text-sm text-black/40">Failed to load orderbook.</div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right: Stats panel */}
          <div className="w-64 border-l-4 border-black flex flex-col bg-white shrink-0 overflow-y-auto">
            <div className="border-b-4 border-black p-4">
              <div className="font-black text-[10px] uppercase tracking-widest text-black/40 mb-3">Market Stats</div>
              <div className="flex flex-col gap-3">
                <div className="bg-neo-lime border-[3px] border-black p-3">
                  <div className="font-black text-[9px] uppercase tracking-widest text-black/60">Last Price</div>
                  <div className="font-black text-xl mt-0.5">
                    {currentPrice > 0 ? `$${currentPrice.toFixed(currentPrice < 0.01 ? 6 : 2)}` : "—"}
                  </div>
                </div>
                <div className={`border-[3px] border-black p-3 ${isPositive ? "bg-green-50" : "bg-red-50"}`}>
                  <div className="font-black text-[9px] uppercase tracking-widest text-black/60">24H Change</div>
                  <div className={`font-black text-lg mt-0.5 ${isPositive ? "text-green-700" : "text-red-600"}`}>
                    {currentPrice > 0 ? `${isPositive ? "+" : ""}${currentChange.toFixed(2)}%` : "—"}
                  </div>
                </div>
                {currentRow && (
                  <>
                    <div className="bg-[#EAE8E0] border-[3px] border-black p-3">
                      <div className="font-black text-[9px] uppercase tracking-widest text-black/60">24H Volume</div>
                      <div className="font-black text-sm mt-0.5">{formatVolume(currentRow.volume24h)}</div>
                    </div>
                    <div className="bg-white border-[3px] border-black p-3">
                      <div className="font-black text-[9px] uppercase tracking-widest text-black/60">24H Range</div>
                      <div className="font-black text-xs mt-1">
                        {currentRow.low24h > 0 ? `$${currentRow.low24h.toFixed(2)}` : "—"}
                        <span className="text-black/30 mx-1">—</span>
                        {currentRow.high24h > 0 ? `$${currentRow.high24h.toFixed(2)}` : "—"}
                      </div>
                      {currentRow.high24h > 0 && currentRow.low24h > 0 && (
                        <div className="mt-2 h-1.5 bg-black/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-neo-orange"
                            style={{
                              width: `${Math.max(5, Math.min(95, ((currentPrice - currentRow.low24h) / (currentRow.high24h - currentRow.low24h)) * 100))}%`
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Quick trade buttons */}
            <div className="p-4 border-b-2 border-black/10">
              <div className="font-black text-[10px] uppercase tracking-widest text-black/40 mb-3">Quick Actions</div>
              <div className="flex flex-col gap-2">
                <Link
                  href={`/dashboard/trade?market=${selectedMarket.marketId}&ticker=${selectedMarket.ticker}`}
                  className="w-full bg-neo-lime border-[3px] border-black p-3 font-black text-xs uppercase tracking-widest text-center shadow-[3px_3px_0px_0px_#000] hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-all"
                >
                  Buy {selectedMarket.ticker.split("/")[0]}
                </Link>
                <Link
                  href={`/dashboard/trade?market=${selectedMarket.marketId}&ticker=${selectedMarket.ticker}&side=sell`}
                  className="w-full bg-neo-orange border-[3px] border-black p-3 font-black text-xs uppercase tracking-widest text-center shadow-[3px_3px_0px_0px_#000] hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-all"
                >
                  Sell {selectedMarket.ticker.split("/")[0]}
                </Link>
              </div>
            </div>

            {/* Injective info */}
            <div className="p-4">
              <div className="font-black text-[10px] uppercase tracking-widest text-black/40 mb-3">Network</div>
              <div className="bg-black text-white p-3 border-[3px] border-black">
                <div className="font-black text-[9px] uppercase tracking-widest text-neo-lime mb-1">Injective Testnet</div>
                <div className="font-bold text-[9px] text-white/60">Real-time DEX data</div>
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="font-black text-[8px] uppercase text-neo-lime">Connected</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
