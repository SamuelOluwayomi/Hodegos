"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useWallet, WalletId } from "@/lib/useWallet";
import DashboardSidebar from "@/components/DashboardSidebar";
import AskHodegosButton from "@/components/AskHodegosButton";
import { useChat } from "@/hooks/useChat";
import { getTierByXP } from "@/lib/tiers";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  AreaChart, Area,
} from "recharts";
import { Warning, ArrowClockwise, ChartBar, ChartPie, ChartLine, Robot, TrendUp, TrendDown } from "@phosphor-icons/react";

const WALLET_LABELS: Partial<Record<WalletId, string>> = {
  keplr: "Keplr", leap: "Leap", ninji: "Ninji", metamask: "MetaMask",
};

const TOKEN_COLORS: Record<string, string> = {
  INJ: "#D0EE51",   // neo-lime
  USDT: "#FFD700",   // neo-yellow
  ATOM: "#FF6B35",   // neo-orange
  WETH: "#7C3AED",   // purple
  SOL: "#06B6D4",    // cyan
  TIA: "#F472B6",    // pink
};

const TOKEN_CSS_CLASSES: Record<string, string> = {
  INJ: "bg-neo-lime",
  USDT: "bg-neo-yellow",
  ATOM: "bg-neo-orange",
  WETH: "bg-[#7C3AED]",
  SOL: "bg-[#06B6D4]",
  TIA: "bg-[#F472B6]",
};

interface TokenBalance {
  amount: number;
  price: number;
  value: number;
  name: string;
}

// Custom tooltip for charts
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-black text-white border-[3px] border-black p-3 neo-shadow-sm">
      <div className="font-black text-xs uppercase tracking-widest mb-1">{label || payload[0]?.name}</div>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="font-bold text-[10px]" style={{ color: entry.color || '#D0EE51' }}>
          {entry.name}: ${typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value}
        </div>
      ))}
    </div>
  );
}

// Custom Pie label
function renderPieLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: any) {
  if (percent < 0.03) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="#000" textAnchor="middle" dominantBaseline="central"
      style={{ fontWeight: 900, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
      {name}
    </text>
  );
}

export default function PortfolioPage() {
  const { address, wallet, isConnected, disconnect, truncateAddress, isInitialized } = useWallet();
  const router = useRouter();
  const { profile } = useChat(address || undefined);
  const currentTier = getTierByXP(profile.xp);
  const [activeTab, setActiveTab] = useState<"overview" | "analytics" | "history">("overview");
  const [chartType, setChartType] = useState<"pie" | "bar" | "area">("pie");
  const [tokenBalances, setTokenBalances] = useState<Record<string, TokenBalance>>({});
  const [loading, setLoading] = useState(true);
  const [hasFetched, setHasFetched] = useState(false);
  const [isNodeOffline, setIsNodeOffline] = useState(false);

  const [trades, setTrades] = useState<any[]>([]);
  const [tradesLoading, setTradesLoading] = useState(true);

  useEffect(() => {
    if (!address) return;

    const fetchPortfolioData = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/portfolio?address=${address}`);
        if (res.ok) {
          const data = await res.json();
          setIsNodeOffline(!!data.nodeError);

          if (!data.nodeError && data.tokenBalances) {
            setTokenBalances(data.tokenBalances);
          } else if (data.tokenBalances) {
            setTokenBalances(data.tokenBalances);
          }

          setHasFetched(true);
        }
      } catch (err) {
        console.error("Error fetching portfolio data:", err);
      } finally {
        setLoading(false);
      }
    };

    const fetchTrades = async () => {
      try {
        setTradesLoading(true);
        const res = await fetch(`/api/trades?address=${address}`);
        if (res.ok) {
          const data = await res.json();
          setTrades(data.trades || []);
        }
      } catch (err) {
        console.error("Error fetching trades:", err);
      } finally {
        setTradesLoading(false);
      }
    };

    const handleRefresh = () => {
      fetchPortfolioData();
      fetchTrades();
    };

    fetchPortfolioData();
    fetchTrades();

    const interval = setInterval(handleRefresh, 15000);
    window.addEventListener("refresh-balances", handleRefresh);

    return () => {
      clearInterval(interval);
      window.removeEventListener("refresh-balances", handleRefresh);
    };
  }, [address]);

  // Build asset list from tokenBalances
  const assets = useMemo(() => {
    const order = ["INJ", "USDT", "ATOM", "WETH", "SOL", "TIA"];
    return order
      .filter(sym => tokenBalances[sym])
      .map(sym => {
        const tb = tokenBalances[sym];
        return {
          symbol: sym,
          name: tb.name,
          price: tb.price,
          amount: sym === "USDT" ? tb.amount.toFixed(2) : tb.amount.toFixed(4),
          rawAmount: tb.amount,
          value: tb.value,
          color: TOKEN_CSS_CLASSES[sym] || "bg-black",
          hexColor: TOKEN_COLORS[sym] || "#000000",
        };
      });
  }, [tokenBalances]);
  const totalValue = useMemo(() => assets.reduce((sum, a) => sum + a.value, 0), [assets]);

  // Compute realized & unrealized P&L and trading stats dynamically
  const tradeStats = useMemo(() => {
    const sortedTrades = [...trades].sort(
      (a, b) => new Date(a.executed_at).getTime() - new Date(b.executed_at).getTime()
    );

    const assetState: Record<string, { holdings: number; avgPrice: number; realizedPnL: number }> = {};

    sortedTrades.forEach(trade => {
      const asset = trade.pair.split('/')[0];
      if (!assetState[asset]) {
        assetState[asset] = { holdings: 0, avgPrice: 0, realizedPnL: 0 };
      }

      const state = assetState[asset];
      const amount = parseFloat(trade.amount);
      const price = parseFloat(trade.price);

      if (trade.side === 'buy') {
        const newHoldings = state.holdings + amount;
        const newCost = (state.holdings * state.avgPrice) + (amount * price);
        state.avgPrice = newHoldings > 0 ? newCost / newHoldings : 0;
        state.holdings = newHoldings;
      } else if (trade.side === 'sell') {
        const profit = amount * (price - state.avgPrice);
        state.realizedPnL += profit;
        state.holdings = Math.max(0, state.holdings - amount);
        if (state.holdings === 0) {
          state.avgPrice = 0;
        }
      }
    });

    let totalRealizedPnL = 0;
    let totalCostBasis = 0;
    let totalUnrealizedPnL = 0;

    Object.entries(assetState).forEach(([asset, state]) => {
      totalRealizedPnL += state.realizedPnL;
      
      const tb = tokenBalances[asset];
      if (tb && tb.amount > 0) {
        const currentPrice = tb.price;
        const currentCost = tb.amount * state.avgPrice;
        totalCostBasis += currentCost;
        
        const unrealized = tb.amount * (currentPrice - state.avgPrice);
        totalUnrealizedPnL += unrealized;
      }
    });

    let wins = 0;
    let totalSells = 0;
    
    const tempAssetState: Record<string, { holdings: number; avgPrice: number }> = {};
    sortedTrades.forEach(trade => {
      const asset = trade.pair.split('/')[0];
      if (!tempAssetState[asset]) {
        tempAssetState[asset] = { holdings: 0, avgPrice: 0 };
      }
      const state = tempAssetState[asset];
      const amount = parseFloat(trade.amount);
      const price = parseFloat(trade.price);
      if (trade.side === 'buy') {
        const newHoldings = state.holdings + amount;
        const newCost = (state.holdings * state.avgPrice) + (amount * price);
        state.avgPrice = newHoldings > 0 ? newCost / newHoldings : 0;
        state.holdings = newHoldings;
      } else if (trade.side === 'sell') {
        totalSells++;
        if (price > state.avgPrice) {
          wins++;
        }
        state.holdings = Math.max(0, state.holdings - amount);
        if (state.holdings === 0) {
          state.avgPrice = 0;
        }
      }
    });

    const winRate = totalSells > 0 ? (wins / totalSells) * 100 : 0;

    return {
      realizedPnL: totalRealizedPnL,
      unrealizedPnL: totalUnrealizedPnL,
      totalPnL: totalRealizedPnL + totalUnrealizedPnL,
      winRate,
      totalTradesCount: sortedTrades.length,
      assetState,
    };
  }, [trades, tokenBalances]);

  // Chart data for analytics
  const pieData = useMemo(() =>
    assets.filter(a => a.value > 0).map(a => ({
      name: a.symbol,
      value: parseFloat(a.value.toFixed(2)),
      fill: a.hexColor,
    }))
  , [assets]);

  const barData = useMemo(() =>
    assets.map(a => ({
      name: a.symbol,
      value: parseFloat(a.value.toFixed(2)),
      fill: a.hexColor,
    }))
  , [assets]);

  const areaData = useMemo(() => {
    // Create a stacked view showing the composition
    const entry: Record<string, any> = { name: "Portfolio" };
    assets.forEach(a => { entry[a.symbol] = parseFloat(a.value.toFixed(2)); });
    return [entry];
  }, [assets]);

  const handleDisconnect = () => { disconnect(); router.replace("/"); };

  const handleAISummary = () => {
    const assetSummary = assets
      .filter(a => a.value > 0)
      .map(a => `${a.symbol}: ${a.amount} ($${a.value.toFixed(2)}, ${totalValue > 0 ? ((a.value / totalValue) * 100).toFixed(1) : 0}%)`)
      .join(", ");

    const query = `Analyze my portfolio in detail. Here is my current on-chain holdings on Injective Testnet:\n\nTotal Value: $${totalValue.toFixed(2)}\nAssets: ${assetSummary}\nXP: ${profile.xp}, Badges: ${profile.badges.length}, Tier: ${currentTier.level}\n\nGive me a comprehensive breakdown of:\n1. Portfolio diversification assessment\n2. Risk analysis\n3. Strengths and weaknesses\n4. Actionable recommendations for improvement\n5. Market outlook for my held assets`;

    window.dispatchEvent(new CustomEvent("open-hodegos-chat", { detail: { query } }));
  };

  if (!isInitialized || !isConnected || !address) return null;

  const displayAddress = truncateAddress(address);
  const walletLabel = WALLET_LABELS[wallet!] ?? wallet;

  // Helper for the allocation bar
  const assetsWithValue = assets.filter(a => a.value > 0);

  return (
    <div className="h-screen w-screen bg-[#FEFDF9] font-sans flex overflow-hidden">
      <DashboardSidebar onDisconnect={handleDisconnect} />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-[76px] bg-[#EAE8E0] border-b-4 border-black flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="flex items-center gap-2">
              <Image src="/main.png" alt="Hodegos" width={120} height={24} className="object-contain" style={{ height: "auto" }} />
            </Link>
            <div className="h-6 w-[2px] bg-black/20" />
            <span className="font-black text-xs uppercase tracking-widest bg-neo-lime px-2 py-0.5 border-2 border-black">
              Portfolio
            </span>
          </div>
          <div className="flex items-center gap-3">
            <AskHodegosButton
              query="Give me a comprehensive analysis of my portfolio value, assets, badges, XP, and trading tier. How can I level up?"
              label="Analyze my portfolio"
            />
            <div className="flex items-center gap-2 bg-white border-2 border-black px-3 py-1.5 font-bold text-[10px]">
              <span className="font-black uppercase">{walletLabel}</span>
              <span className="text-black/60">{displayAddress}</span>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6">
          {isNodeOffline && (
            <div className="bg-neo-orange text-white border-4 border-black p-3.5 mb-6 font-bold text-xs uppercase tracking-widest flex items-center justify-between shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <span className="flex items-center gap-2">
                <Warning size={16} weight="bold" />
                Injective Testnet RPC node is temporarily offline. Showing cached/fallback balance details.
              </span>
              <span className="bg-black text-white px-2.5 py-0.5 text-[9px] border-2 border-white uppercase font-black tracking-widest shrink-0">Offline Mode</span>
            </div>
          )}

          {/* Portfolio hero */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2 bg-black text-white border-4 border-black p-8 relative overflow-hidden neo-shadow">
              <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-neo-lime/10" />
              <div className="absolute -right-4 -bottom-8 w-32 h-32 rounded-full bg-neo-orange/20" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-black text-[10px] uppercase tracking-widest text-white/40">Total Portfolio Value</span>
                  {loading && (
                    <ArrowClockwise size={12} weight="bold" className="animate-spin text-neo-lime" />
                  )}
                </div>
                <div className="font-black text-5xl mb-1">${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="bg-neo-lime text-black border-2 border-neo-lime px-2 py-0.5 font-black text-xs">
                    {assetsWithValue.length} Assets
                  </span>
                  <span className="font-bold text-xs text-white/40">Connected: {displayAddress}</span>
                </div>
                <div className="mt-6 grid grid-cols-3 gap-4">
                  <div>
                    <div className="font-black text-[9px] uppercase tracking-widest text-white/40">XP Points</div>
                    <div className="font-black text-xl text-neo-lime">{profile.xp}</div>
                  </div>
                  <div>
                    <div className="font-black text-[9px] uppercase tracking-widest text-white/40">Badges</div>
                    <div className="font-black text-xl text-neo-yellow">{profile.badges.length}</div>
                  </div>
                  <div>
                    <div className="font-black text-[9px] uppercase tracking-widest text-white/40">Tier</div>
                    <div className="font-black text-lg text-neo-orange capitalize">{currentTier.level}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className={`border-4 border-black p-5 neo-shadow transition-colors ${
                tradeStats.totalPnL > 0 
                  ? "bg-neo-lime text-black" 
                  : tradeStats.totalPnL < 0 
                    ? "bg-neo-orange text-black" 
                    : "bg-[#EAE8E0] text-black"
              }`}>
                <div className="flex items-center justify-between">
                  <div className="font-black text-[9px] uppercase tracking-widest opacity-60">Net Profit & Loss</div>
                  {tradeStats.totalPnL > 0 && <TrendUp size={16} weight="bold" />}
                  {tradeStats.totalPnL < 0 && <TrendDown size={16} weight="bold" />}
                </div>
                <div className="font-black text-3xl mt-1">
                  {tradeStats.totalPnL >= 0 ? "+" : ""}${tradeStats.totalPnL.toFixed(2)}
                </div>
                <div className="mt-3 flex flex-col gap-0.5 font-black text-[10px] uppercase tracking-wider opacity-85">
                  <div className="flex justify-between">
                    <span>Realized P&L:</span>
                    <span>{tradeStats.realizedPnL >= 0 ? "+" : ""}${tradeStats.realizedPnL.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Unrealized P&L:</span>
                    <span>{tradeStats.unrealizedPnL >= 0 ? "+" : ""}${tradeStats.unrealizedPnL.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              <div className="bg-neo-yellow border-4 border-black p-5 neo-shadow text-black">
                <div className="font-black text-[9px] uppercase tracking-widest opacity-60">Total Trades</div>
                <div className="font-black text-3xl mt-1">{tradeStats.totalTradesCount}</div>
                <div className="mt-3 flex justify-between font-black text-[10px] uppercase tracking-wider opacity-85">
                  <span>Win Rate:</span>
                  <span>{trades.filter(t => t.side === 'sell').length > 0 ? `${tradeStats.winRate.toFixed(1)}%` : "—"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b-4 border-black flex mb-6">
            {(["overview", "analytics", "history"] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 font-black text-xs uppercase tracking-widest border-b-4 transition-all ${activeTab === tab ? "border-black bg-white" : "border-transparent hover:border-black/30"}`}
              >
                {tab === "overview" ? (
                  "Holdings"
                ) : tab === "analytics" ? (
                  <span className="flex items-center gap-1.5">
                    <ChartBar size={14} weight="bold" /> Analytics
                  </span>
                ) : (
                  "Trade History"
                )}
              </button>
            ))}
          </div>

          {/* ── HOLDINGS TAB ─────────────────────────────────────────────────── */}
          {activeTab === "overview" && (
            <div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <div className="lg:col-span-2">
                  <h2 className="font-black text-sm uppercase tracking-widest mb-4">Asset Holdings</h2>
                  <div className="border-4 border-black overflow-hidden neo-shadow">
                    <table className="w-full">
                       <thead>
                        <tr className="bg-[#EAE8E0] border-b-4 border-black font-black text-[10px] uppercase tracking-widest">
                          <th className="p-4 text-left border-r-2 border-black">Asset</th>
                          <th className="p-4 text-right border-r-2 border-black">Price</th>
                          <th className="p-4 text-right border-r-2 border-black">Balance</th>
                          <th className="p-4 text-right border-r-2 border-black">Value</th>
                          <th className="p-4 text-right">Share</th>
                        </tr>
                      </thead>
                      <tbody>
                        {!hasFetched && loading ? (
                          <tr>
                            <td colSpan={5} className="p-8 text-center font-bold text-xs uppercase tracking-widest text-black/40">
                              <ArrowClockwise size={14} weight="bold" className="inline-block animate-spin mr-2" /> Fetching live balances...
                            </td>
                          </tr>
                        ) : (
                          assets.map((asset) => (
                            <tr key={asset.symbol} className="border-b-2 border-black last:border-b-0 hover:bg-[#EAE8E0]/50 transition-colors">
                              <td className="p-4 border-r-2 border-black">
                                <div className="flex items-center gap-3">
                                  <div className={`w-8 h-8 ${asset.color} border-2 border-black flex items-center justify-center font-black text-[10px]`}>
                                    {asset.symbol.slice(0, 2)}
                                  </div>
                                  <div>
                                    <div className="font-black text-sm">{asset.symbol}</div>
                                    <div className="font-bold text-[9px] uppercase text-black/40">{asset.name}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="p-4 border-r-2 border-black text-right font-black text-sm">
                                ${asset.price < 0.01 ? asset.price.toFixed(4) : asset.price.toFixed(2)}
                              </td>
                              <td className="p-4 border-r-2 border-black text-right font-black text-sm">{asset.amount}</td>
                              <td className="p-4 border-r-2 border-black text-right font-black text-sm">${asset.value.toFixed(2)}</td>
                              <td className="p-4 text-right font-black text-sm">
                                {totalValue > 0 ? `${((asset.value / totalValue) * 100).toFixed(1)}%` : "—"}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Allocation chart (visual bar) */}
                <div>
                  <h2 className="font-black text-sm uppercase tracking-widest mb-4">Allocation</h2>
                  <div className="border-4 border-black p-5 bg-white neo-shadow min-h-[160px] flex flex-col justify-center">
                    {totalValue > 0 ? (
                      <div className="flex flex-col gap-4 w-full">
                        <div className="h-6 w-full border-[3px] border-black overflow-hidden flex bg-[#EAE8E0]">
                          {assetsWithValue.map((asset, i) => (
                            <div
                              key={asset.symbol}
                              className={`h-full ${asset.color} ${i < assetsWithValue.length - 1 ? 'border-r-2 border-black' : ''}`}
                              style={{ width: `${(asset.value / totalValue) * 100}%` }}
                              title={`${asset.symbol}: ${((asset.value / totalValue) * 100).toFixed(1)}%`}
                            />
                          ))}
                        </div>
                        <div className="flex flex-col gap-2 font-black text-[10px] uppercase tracking-widest">
                          {assetsWithValue.map(asset => (
                            <div key={asset.symbol} className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <div className={`w-2.5 h-2.5 ${asset.color} border border-black`} />
                                <span>{asset.symbol} ({asset.name})</span>
                              </div>
                              <span className="font-black">{((asset.value / totalValue) * 100).toFixed(1)}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3 items-center justify-center py-4">
                        <div className="w-16 h-16 rounded-full border-4 border-black bg-[#EAE8E0] flex items-center justify-center">
                          <span className="font-black text-[9px] uppercase tracking-widest text-black/40">Empty</span>
                        </div>
                        <div className="font-bold text-[10px] text-black/40 text-center">Fund your wallet to see allocation</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* CTA */}
              <div className="bg-neo-orange border-4 border-black p-6 neo-shadow flex items-center justify-between">
                <div>
                  <h3 className="font-black text-lg uppercase tracking-widest">Ready to Trade?</h3>
                  <p className="font-bold text-sm text-black/70 mt-1">Fund your wallet and start trading on Injective DEX</p>
                </div>
                <Link
                  href="/dashboard/trade"
                  className="bg-black text-white border-[3px] border-black px-8 py-3 font-black uppercase tracking-widest text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all shrink-0"
                >
                  Start Trading →
                </Link>
              </div>
            </div>
          )}

          {/* ── ANALYTICS TAB ────────────────────────────────────────────────── */}
          {activeTab === "analytics" && (
            <div>
              {/* Chart type toggle */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-black text-sm uppercase tracking-widest">Portfolio Analytics</h2>
                <div className="flex gap-1">
                  {([
                    { key: "pie" as const, label: "Donut", icon: <ChartPie size={12} weight="fill" /> },
                    { key: "bar" as const, label: "Bar", icon: <ChartBar size={12} weight="fill" /> },
                    { key: "area" as const, label: "Area", icon: <ChartLine size={12} weight="fill" /> },
                  ]).map(ct => (
                    <button
                      key={ct.key}
                      onClick={() => setChartType(ct.key)}
                      className={`px-3 py-1.5 font-black text-[9px] uppercase tracking-widest border-[3px] border-black transition-all flex items-center gap-1 ${
                        chartType === ct.key
                          ? "bg-black text-white shadow-none"
                          : "bg-white hover:bg-[#EAE8E0] shadow-[2px_2px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
                      }`}
                    >
                      {ct.icon}
                      {ct.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                {/* Main chart area */}
                <div className="lg:col-span-2 border-4 border-black bg-white neo-shadow p-6">
                  <div className="font-black text-[10px] uppercase tracking-widest text-black/40 mb-4">
                    {chartType === "pie" && "Asset Allocation Breakdown"}
                    {chartType === "bar" && "Asset Value Comparison"}
                    {chartType === "area" && "Portfolio Composition"}
                  </div>

                  {pieData.length === 0 ? (
                    <div className="h-[300px] flex items-center justify-center">
                      <div className="text-center">
                        <div className="font-black text-xl uppercase tracking-widest mb-2">No Data</div>
                        <div className="font-bold text-sm text-black/50">Fund your wallet to see analytics</div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-[340px]">
                      {/* Donut / Pie chart */}
                      {chartType === "pie" && (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={pieData}
                              cx="50%"
                              cy="50%"
                              innerRadius={70}
                              outerRadius={130}
                              paddingAngle={3}
                              dataKey="value"
                              stroke="#000"
                              strokeWidth={3}
                              label={renderPieLabel}
                              labelLine={false}
                            >
                              {pieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                              ))}
                            </Pie>
                            <Tooltip content={<ChartTooltip />} />
                          </PieChart>
                        </ResponsiveContainer>
                      )}

                      {/* Bar chart */}
                      {chartType === "bar" && (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={barData} barCategoryGap="20%">
                            <CartesianGrid strokeDasharray="3 3" stroke="#00000015" />
                            <XAxis
                              dataKey="name"
                              tick={{ fontWeight: 900, fontSize: 10, textTransform: 'uppercase' } as any}
                              axisLine={{ stroke: '#000', strokeWidth: 3 }}
                              tickLine={{ stroke: '#000', strokeWidth: 2 }}
                            />
                            <YAxis
                              tick={{ fontWeight: 700, fontSize: 10 }}
                              axisLine={{ stroke: '#000', strokeWidth: 3 }}
                              tickLine={{ stroke: '#000', strokeWidth: 2 }}
                              tickFormatter={(v) => `$${v}`}
                            />
                            <Tooltip content={<ChartTooltip />} />
                            <Bar dataKey="value" radius={[4, 4, 0, 0]} stroke="#000" strokeWidth={2}>
                              {barData.map((entry, index) => (
                                <Cell key={`bar-${index}`} fill={entry.fill} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      )}

                      {/* Area chart */}
                      {chartType === "area" && (
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={areaData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#00000015" />
                            <XAxis
                              dataKey="name"
                              tick={{ fontWeight: 900, fontSize: 10 } as any}
                              axisLine={{ stroke: '#000', strokeWidth: 3 }}
                            />
                            <YAxis
                              tick={{ fontWeight: 700, fontSize: 10 }}
                              axisLine={{ stroke: '#000', strokeWidth: 3 }}
                              tickFormatter={(v) => `$${v}`}
                            />
                            <Tooltip content={<ChartTooltip />} />
                            {assets.filter(a => a.value > 0).map((asset) => (
                              <Area
                                key={asset.symbol}
                                type="monotone"
                                dataKey={asset.symbol}
                                stackId="1"
                                stroke="#000"
                                strokeWidth={2}
                                fill={asset.hexColor}
                              />
                            ))}
                          </AreaChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  )}
                </div>

                {/* Stats panel */}
                <div className="flex flex-col gap-4">
                  {/* Token breakdown list */}
                  <div className="border-4 border-black bg-white neo-shadow p-5">
                    <div className="font-black text-[10px] uppercase tracking-widest text-black/40 mb-4">Breakdown</div>
                    <div className="flex flex-col gap-3">
                      {assetsWithValue.map(asset => (
                        <div key={asset.symbol} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`w-4 h-4 ${asset.color} border-2 border-black`} />
                            <span className="font-black text-xs uppercase">{asset.symbol}</span>
                          </div>
                          <div className="text-right">
                            <div className="font-black text-xs">${asset.value.toFixed(2)}</div>
                            <div className="font-bold text-[9px] text-black/40">
                              {totalValue > 0 ? `${((asset.value / totalValue) * 100).toFixed(1)}%` : "—"}
                            </div>
                          </div>
                        </div>
                      ))}
                      {assetsWithValue.length === 0 && (
                        <div className="font-bold text-[10px] text-black/40 text-center py-4">No assets held</div>
                      )}
                    </div>
                  </div>

                  {/* Portfolio Rebalance Advisor */}
                  <div className="border-4 border-black bg-white neo-shadow p-5 flex flex-col gap-4">
                    <div className="flex justify-between items-center border-b-2 border-black/10 pb-3">
                      <div>
                        <h3 className="font-black text-xs uppercase tracking-widest flex items-center gap-1.5">
                          <Robot size={16} weight="fill" className="text-neo-orange animate-pulse" /> Rebalance Advisor
                        </h3>
                        <p className="text-[8px] font-bold text-black/40 uppercase mt-0.5">Optimize asset weights</p>
                      </div>
                      <span className="bg-neo-orange text-black border border-black font-black text-[8px] px-1.5 py-0.5 uppercase tracking-widest">
                        AI Model
                      </span>
                    </div>

                    <div className="flex flex-col gap-3">
                      {(() => {
                        const targets: Record<string, number> = { INJ: 30, USDT: 20, SOL: 20, WETH: 15, ATOM: 10, TIA: 5 };
                        const order = ["INJ", "USDT", "ATOM", "WETH", "SOL", "TIA"];
                        return order.map(sym => {
                          const tb = tokenBalances[sym];
                          const currentVal = tb ? tb.value : 0;
                          const currentPct = totalValue > 0 ? (currentVal / totalValue) * 100 : 0;
                          const targetPct = targets[sym] || 0;
                          const diff = currentPct - targetPct;
                          const color = TOKEN_CSS_CLASSES[sym] || "bg-black";
                          
                          return (
                            <div key={sym} className="flex flex-col gap-1.5 border-b border-black/5 pb-1.5 last:border-b-0 last:pb-0">
                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                  <div className={`w-3 h-3 ${color} border border-black`} />
                                  <span className="font-black text-[10px]">{sym}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-right">
                                  <span className="font-bold text-[8px] text-black/40 uppercase">Cur: {currentPct.toFixed(0)}%</span>
                                  <span className="font-bold text-[8px] text-black/40 uppercase">Tgt: {targetPct}%</span>
                                  <span className={`font-black text-[8px] px-1 border border-black ${
                                    Math.abs(diff) < 3 ? "bg-neo-lime text-black" : diff > 0 ? "bg-neo-orange text-black" : "bg-neo-yellow text-black"
                                  }`}>
                                    {diff === 0 ? "Perfect" : diff > 0 ? `+${diff.toFixed(0)}%` : `${diff.toFixed(0)}%`}
                                  </span>
                                </div>
                              </div>
                              <div className="h-1.5 w-full border border-black rounded-full overflow-hidden bg-[#EAE8E0] relative">
                                <div className={`h-full ${color}`} style={{ width: `${currentPct}%` }} />
                                <div className="absolute top-0 bottom-0 w-0.5 bg-black" style={{ left: `${targetPct}%` }} />
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>

                    <button
                      onClick={() => {
                        const targets: Record<string, number> = { INJ: 30, USDT: 20, SOL: 20, WETH: 15, ATOM: 10, TIA: 5 };
                        const breakDown = assets.map(a => {
                          const currentPct = totalValue > 0 ? (a.value / totalValue) * 100 : 0;
                          const targetPct = targets[a.symbol] || 0;
                          return `${a.symbol}: Current ${currentPct.toFixed(1)}% vs Target ${targetPct}% (diff ${((currentPct - targetPct)).toFixed(1)}%)`;
                        }).join("\n");
                        const query = `Create an actionable rebalancing recipe for my portfolio. Here is my current asset allocation compared to my target weights:\n\n${breakDown}\n\nWhat exact trades should I make (e.g. Sell X SOL for USDT, Buy Y INJ) to restore balance? Please calculate the approximate USD amounts to trade based on my total portfolio value of $${totalValue.toFixed(2)}.`;
                        window.dispatchEvent(new CustomEvent("open-hodegos-chat", { detail: { query } }));
                      }}
                      className="w-full text-center font-black text-[10px] uppercase bg-neo-yellow border-2 border-black py-2.5 hover:bg-white shadow-[2px_2px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
                    >
                      Ask AI for Rebalance Plan
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── HISTORY TAB ──────────────────────────────────────────────────── */}
          {activeTab === "history" && (
            <div>
              {tradesLoading ? (
                <div className="border-4 border-black bg-white neo-shadow p-8 text-center">
                  <ArrowClockwise size={24} weight="bold" className="inline-block animate-spin mr-2" />
                  <span className="font-black text-xs uppercase tracking-widest">Loading trade history...</span>
                </div>
              ) : trades.length === 0 ? (
                <div className="border-4 border-black bg-white neo-shadow">
                  <div className="p-8 text-center">
                    <div className="font-black text-xl uppercase tracking-widest mb-2">No Trades Yet</div>
                    <div className="font-bold text-sm text-black/50 mb-6">Your transaction history will appear here after your first trade</div>
                    <Link
                      href="/dashboard/trade"
                      className="inline-block bg-black text-white border-[3px] border-black px-8 py-3 font-black uppercase tracking-widest text-sm shadow-[4px_4px_0px_0px_#D0EE51] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all"
                    >
                      Make Your First Trade →
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="border-4 border-black overflow-x-auto bg-white neo-shadow">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#EAE8E0] border-b-4 border-black font-black text-[10px] uppercase tracking-widest">
                        <th className="p-4 border-r-2 border-black">Time</th>
                        <th className="p-4 border-r-2 border-black">Pair</th>
                        <th className="p-4 border-r-2 border-black text-center">Side</th>
                        <th className="p-4 border-r-2 border-black text-center">Type</th>
                        <th className="p-4 border-r-2 border-black text-right">Price</th>
                        <th className="p-4 border-r-2 border-black text-right">Amount</th>
                        <th className="p-4 border-r-2 border-black text-right">Total</th>
                        <th className="p-4 border-r-2 border-black text-center">Transaction</th>
                        <th className="p-4 text-center">AI Journal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trades.map((trade) => {
                        const dateStr = new Date(trade.executed_at).toLocaleString();
                        const isBuy = trade.side === "buy";
                        const baseAsset = trade.pair.split('/')[0];
                        const priceVal = parseFloat(trade.price);
                        const amountVal = parseFloat(trade.amount);
                        const totalVal = parseFloat(trade.total_value);

                        return (
                          <tr key={trade.id} className="border-b-2 border-black last:border-b-0 hover:bg-[#EAE8E0]/50 transition-colors">
                            <td className="p-4 border-r-2 border-black font-bold text-xs whitespace-nowrap">
                              {dateStr}
                            </td>
                            <td className="p-4 border-r-2 border-black font-black text-xs">
                              {trade.pair}
                            </td>
                            <td className="p-4 border-r-2 border-black text-center">
                              <span className={`inline-block px-2.5 py-0.5 border-2 border-black font-black text-[9px] uppercase tracking-wider ${
                                isBuy ? "bg-neo-lime text-black" : "bg-neo-orange text-black"
                              }`}>
                                {trade.side}
                              </span>
                            </td>
                            <td className="p-4 border-r-2 border-black text-center font-bold text-xs uppercase tracking-wider">
                              {trade.order_type}
                            </td>
                            <td className="p-4 border-r-2 border-black text-right font-black text-xs">
                              ${priceVal < 0.01 ? priceVal.toFixed(4) : priceVal.toFixed(2)}
                            </td>
                            <td className="p-4 border-r-2 border-black text-right font-black text-xs">
                              {amountVal.toFixed(4)} {baseAsset}
                            </td>
                            <td className="p-4 border-r-2 border-black text-right font-black text-xs">
                              ${totalVal.toFixed(2)}
                            </td>
                            <td className="p-4 border-r-2 border-black text-center whitespace-nowrap">
                              {trade.tx_hash ? (
                                <a
                                  href={`https://testnet.explorer.injective.network/transaction/${trade.tx_hash}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="underline font-black text-[10px] uppercase hover:text-black/60 tracking-wider"
                                >
                                  View Tx ↗
                                </a>
                              ) : (
                                <span className="text-black/40 font-bold text-[10px] uppercase">Manual/Offchain</span>
                              )}
                            </td>
                            <td className="p-4 text-center whitespace-nowrap">
                              <button
                                onClick={() => {
                                  const query = `Analyze this specific simulated trade from my journal:\nPair: ${trade.pair}\nSide: ${trade.side.toUpperCase()}\nOrder Type: ${trade.order_type.toUpperCase()}\nPrice: $${priceVal.toFixed(4)}\nAmount: ${amountVal.toFixed(4)} ${baseAsset}\nTotal Cost: $${totalVal.toFixed(2)}\nExecuted on: ${dateStr}\n\nGiven the asset and execution price, let me know if this was a smart entry/exit point, what risks I should keep in mind, and what lessons I can learn from this trade to improve my strategy.`;
                                  window.dispatchEvent(new CustomEvent("open-hodegos-chat", { detail: { query } }));
                                }}
                                className="bg-neo-yellow border-2 border-black px-2 py-1 font-black text-[9px] uppercase hover:bg-white transition-colors"
                              >
                                Analyze
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
