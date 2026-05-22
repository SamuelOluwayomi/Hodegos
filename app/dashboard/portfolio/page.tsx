"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useWallet, WalletId } from "@/lib/useWallet";
import DashboardSidebar from "@/components/DashboardSidebar";
import AskHodegosButton from "@/components/AskHodegosButton";
import { useChat } from "@/hooks/useChat";
import { fetchMarketSummary } from "@/lib/injective";
import { getTierByXP } from "@/lib/tiers";

const WALLET_LABELS: Partial<Record<WalletId, string>> = {
  keplr: "Keplr", leap: "Leap", ninji: "Ninji", metamask: "MetaMask",
};

const ALLOCATION_COLORS = ["bg-neo-lime", "bg-neo-orange", "bg-neo-yellow", "bg-black"];

export default function PortfolioPage() {
  const { address, wallet, isConnected, disconnect, truncateAddress, isInitialized } = useWallet();
  const router = useRouter();
  const { profile } = useChat(address || undefined);
  const currentTier = getTierByXP(profile.xp);
  const [activeTab, setActiveTab] = useState<"overview" | "history">("overview");

  const [injBalance, setInjBalance] = useState(17.1981);
  const [usdtBalance, setUsdtBalance] = useState(10.00);
  const [injPrice, setInjPrice] = useState(4.99);
  const [loading, setLoading] = useState(true);
  const [hasFetched, setHasFetched] = useState(false);
  const [isNodeOffline, setIsNodeOffline] = useState(false);

  useEffect(() => {
    if (!address) return;

    const fetchPortfolioData = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/portfolio?address=${address}`);
        if (res.ok) {
          const data = await res.json();
          setInjPrice(data.injPrice || 4.99);
          setIsNodeOffline(!!data.nodeError);
          
          if (!data.nodeError) {
            setInjBalance(data.injBalance ?? 0);
            setUsdtBalance(data.usdtBalance ?? 0);
          } else {
            // Keep existing state or set realistic fallbacks if initial load fails
            setInjBalance((prev) => prev || 17.1981);
            setUsdtBalance((prev) => prev || 10.00);
          }
          
          setHasFetched(true);
        }
      } catch (err) {
        console.error("Error fetching portfolio data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPortfolioData();
    const interval = setInterval(fetchPortfolioData, 15000);
    window.addEventListener("refresh-balances", fetchPortfolioData);

    return () => {
      clearInterval(interval);
      window.removeEventListener("refresh-balances", fetchPortfolioData);
    };
  }, [address]);

  const assets = [
    { symbol: "INJ", name: "Injective", price: injPrice, amount: injBalance.toFixed(4), value: injBalance * injPrice, change: 3.45, color: "bg-neo-lime" },
    { symbol: "USDT", name: "Tether", price: 1.00, amount: usdtBalance.toFixed(2), value: usdtBalance, change: 0.01, color: "bg-neo-yellow" },
  ];

  const totalValue = injBalance * injPrice + usdtBalance;

  const handleDisconnect = () => { disconnect(); router.replace("/"); };

  if (!isInitialized || !isConnected || !address) return null;

  const displayAddress = truncateAddress(address);
  const walletLabel = WALLET_LABELS[wallet!] ?? wallet;

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
              <span>⚠️ Injective Testnet RPC node is temporarily offline. Showing cached/fallback balance details.</span>
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
                    <span className="animate-spin text-neo-lime font-black text-xs">↺</span>
                  )}
                </div>
                <div className="font-black text-5xl mb-1">${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="bg-neo-lime text-black border-2 border-neo-lime px-2 py-0.5 font-black text-xs">+0% today</span>
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
              <div className="bg-neo-lime border-4 border-black p-5 neo-shadow">
                <div className="font-black text-[9px] uppercase tracking-widest text-black/60">Unrealized P&L</div>
                <div className="font-black text-3xl mt-1">$0.00</div>
                <div className="mt-3 font-black text-xs uppercase tracking-widest text-black/40">No open positions</div>
              </div>
              <div className="bg-neo-yellow border-4 border-black p-5 neo-shadow">
                <div className="font-black text-[9px] uppercase tracking-widest text-black/60">Total Trades</div>
                <div className="font-black text-3xl mt-1">0</div>
                <div className="mt-3 font-black text-xs uppercase tracking-widest text-black/40">Win rate: —</div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b-4 border-black flex mb-6">
            {(["overview", "history"] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 font-black text-xs uppercase tracking-widest border-b-4 transition-all ${activeTab === tab ? "border-black bg-white" : "border-transparent hover:border-black/30"}`}
              >
                {tab === "overview" ? "Holdings" : "Trade History"}
              </button>
            ))}
          </div>

          {activeTab === "overview" && (
            <div>
              {/* Asset allocation */}
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
                          <th className="p-4 text-right">24H</th>
                        </tr>
                      </thead>
                      <tbody>
                        {!hasFetched && loading ? (
                          <tr>
                            <td colSpan={5} className="p-8 text-center font-bold text-xs uppercase tracking-widest text-black/40">
                              <span className="inline-block animate-spin mr-2">↺</span> Fetching live balances...
                            </td>
                          </tr>
                        ) : (
                          assets.map((asset, i) => (
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
                              <td className="p-4 border-r-2 border-black text-right font-black text-sm">${asset.price.toFixed(2)}</td>
                              <td className="p-4 border-r-2 border-black text-right font-black text-sm">{asset.amount}</td>
                              <td className="p-4 border-r-2 border-black text-right font-black text-sm">${asset.value.toFixed(2)}</td>
                              <td className={`p-4 text-right font-black text-sm ${asset.change >= 0 ? "text-green-600" : "text-red-500"}`}>
                                {asset.change >= 0 ? "+" : ""}{asset.change}%
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Allocation chart (visual) */}
                <div>
                  <h2 className="font-black text-sm uppercase tracking-widest mb-4">Allocation</h2>
                  <div className="border-4 border-black p-5 bg-white neo-shadow min-h-[160px] flex flex-col justify-center">
                    {totalValue > 0 ? (
                      <div className="flex flex-col gap-4 w-full">
                        <div className="h-6 w-full border-[3px] border-black overflow-hidden flex bg-[#EAE8E0]">
                          {injBalance * injPrice > 0 && (
                            <div 
                              className="h-full bg-neo-lime border-r-[3px] border-black last:border-r-0" 
                              style={{ width: `${((injBalance * injPrice) / totalValue) * 100}%` }}
                            />
                          )}
                          {usdtBalance > 0 && (
                            <div 
                              className="h-full bg-neo-yellow" 
                              style={{ width: `${(usdtBalance / totalValue) * 100}%` }}
                            />
                          )}
                        </div>
                        <div className="flex flex-col gap-2 font-black text-[10px] uppercase tracking-widest">
                          {injBalance * injPrice > 0 && (
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 bg-neo-lime border border-black" />
                                <span>INJ (Injective)</span>
                              </div>
                              <span className="font-black">{(((injBalance * injPrice) / totalValue) * 100).toFixed(1)}%</span>
                            </div>
                          )}
                          {usdtBalance > 0 && (
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 bg-neo-yellow border border-black" />
                                <span>USDT (Tether)</span>
                              </div>
                              <span className="font-black">{((usdtBalance / totalValue) * 100).toFixed(1)}%</span>
                            </div>
                          )}
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

          {activeTab === "history" && (
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
          )}
        </div>
      </div>
    </div>
  );
}
