"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useWallet, WalletId } from "@/lib/useWallet";
import OnboardingModal from "@/components/onboarding/OnboardingModal";
import DashboardSidebar from "@/components/DashboardSidebar";
import AskHodegosButton from "@/components/AskHodegosButton";
import { useChat } from "@/hooks/useChat";
import { FEATURED_MARKET_IDS, fetchMarketSummary, formatVolume } from "@/lib/injective";
import { getTierProgress } from "@/lib/tiers";

// Wallet label map
const WALLET_LABELS: Partial<Record<WalletId, string>> = {
  keplr: "Keplr",
  leap: "Leap",
  ninji: "Ninji",
  metamask: "MetaMask",
};

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("ALL");
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const { address, wallet, isConnected, disconnect, truncateAddress, isInitialized } = useWallet();
  const router = useRouter();

  // Fetch profile for onboarding guard
  const { profile, isProfileLoading } = useChat(address || undefined);
  const { currentTier, nextTier, progress: tierProgress } = getTierProgress(profile.xp);

  // Market rows state
  const [marketRows, setMarketRows] = useState<any[]>([]);

  // Fetch featured market summaries
  useEffect(() => {
    const fetchSummaries = async () => {
      const rows = [];
      for (const [ticker, marketId] of Object.entries(FEATURED_MARKET_IDS)) {
        try {
          const s = await fetchMarketSummary(marketId);
          const price = parseFloat(s?.price || "0");
          const price24ago = parseFloat(s?.price_24h_ago || "0");
          const change = price24ago > 0 ? ((price - price24ago) / price24ago) * 100 : 0;
          rows.push({
            ticker: ticker,
            marketId: marketId,
            type: "Spot",
            price: price > 0 ? `$${price.toFixed(price < 0.01 ? 6 : 2)}` : "—",
            change: price > 0 ? `${change >= 0 ? "+" : ""}${change.toFixed(2)}%` : "—",
            positive: change >= 0,
            volume: s?.volume ? formatVolume(s.volume) : "—",
            logo: ticker.includes("INJ"),
            abbr: ticker.split("/")[0],
          });
        } catch {
          // fallback ignore
        }
      }
      setMarketRows(rows);
    };
    fetchSummaries();
    const interval = setInterval(fetchSummaries, 15000);
    return () => clearInterval(interval);
  }, []);

  // Guard: redirect to landing page if not connected
  useEffect(() => {
    if (isInitialized && !isConnected) {
      router.replace("/");
    }
  }, [isInitialized, isConnected, router]);

  // Auto-launch onboarding for first-time users
  useEffect(() => {
    if (isInitialized && isConnected && address && !isProfileLoading && profile.walletAddress === address) {
      if (profile.onboardingComplete) {
        setOnboardingOpen(false);
      } else {
        setOnboardingOpen(true);
      }
    }
  }, [isInitialized, isConnected, address, profile.onboardingComplete, profile.walletAddress, isProfileLoading]);

  // While redirecting or initializing, show nothing (avoids flash of dashboard)
  if (!isInitialized || !isConnected || !address || !wallet) return null;

  const displayAddress = truncateAddress(address);
  const walletLabel = WALLET_LABELS[wallet] ?? wallet;

  const handleDisconnect = () => {
    disconnect();
    router.replace("/");
  };



  return (
    <div className="h-screen w-screen bg-[#FEFDF9] font-sans selection:bg-neo-lime selection:text-black flex overflow-hidden">
      {/* Onboarding Modal */}
      <OnboardingModal
        open={onboardingOpen}
        onClose={() => setOnboardingOpen(false)}
        walletAddress={address}
      />

      <div className="w-full h-full flex overflow-hidden">

        {/* ── LEFT SIDEBAR ── */}
        <DashboardSidebar onDisconnect={handleDisconnect} />

        {/* ── RIGHT MAIN AREA ── */}
        <div className="flex-1 flex flex-col overflow-hidden relative">

          {/* Top Navbar */}
          <header className="h-[76px] bg-[#EAE8E0] border-b-4 border-black flex items-center justify-between px-6 shrink-0">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <Image src="/main.png" alt="Hodegos" width={120} height={24} className="object-contain" style={{ height: "auto" }} />
              <div className="h-6 w-[2px] bg-black" />
              <div className="font-black text-sm uppercase tracking-widest bg-neo-lime px-2 py-0.5 border-2 border-black">
                Terminal
              </div>
            </div>

            {/* Search Bar */}
            <div className="hidden md:flex items-center bg-white border-[3px] border-black px-4 py-2 w-80 shadow-[2px_2px_0px_0px_#000]">
              <svg className="w-4 h-4 mr-2 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input
                type="text"
                placeholder="Search markets..."
                className="bg-transparent outline-none font-bold text-xs uppercase tracking-wider w-full placeholder:text-black/40"
              />
            </div>

            {/* Wallet info + Disconnect */}
            <div className="flex items-center gap-3">
              {/* Wallet badge */}
              <div className="flex items-center gap-2 bg-white border-[3px] border-black rounded-full pl-2 pr-4 py-1.5 shadow-[2px_2px_0px_0px_#000]">
                <div className="w-7 h-7 rounded-full bg-neo-lime border-2 border-black flex items-center justify-center font-black text-[9px] uppercase tracking-widest shrink-0">
                  {walletLabel.slice(0, 2)}
                </div>
                <div className="flex flex-col leading-none">
                  <span className="font-black text-[9px] uppercase tracking-widest text-black/50">{walletLabel}</span>
                  <span className="font-bold text-[11px] uppercase tracking-wider">{displayAddress}</span>
                </div>
              </div>

              {/* Disconnect button */}
              <button
                onClick={handleDisconnect}
                title="Disconnect"
                className="hidden sm:flex items-center gap-2 bg-white border-[3px] border-black rounded-full px-4 py-2 shadow-[2px_2px_0px_0px_#000] font-black uppercase tracking-widest text-[10px] hover:bg-[#FF2A00] hover:text-white hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
              >
                <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
                Disconnect
              </button>
            </div>
          </header>

          {/* Main Dashboard Content */}
          <div className="flex-1 overflow-auto p-6 md:p-8 flex flex-col xl:flex-row gap-8">

            {/* Left Content Column */}
            <div className="flex-1 flex flex-col gap-8">

              {/* Header row */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b-4 border-black pb-4">
                <div>
                  <h1 className="font-black text-2xl uppercase tracking-widest mb-2 flex items-center gap-3 flex-wrap">
                    <span>Let&apos;s trade on-chain</span>
                    <AskHodegosButton 
                      query="Explain how the terminal works and what features are available on the dashboard. What should I do first?" 
                      label="Ask Hodegos"
                    />
                  </h1>
                  <div className="flex items-center gap-2 flex-wrap font-bold text-xs text-black/60 uppercase tracking-widest">
                    <span className="bg-neo-lime border-2 border-black px-2 py-0.5 font-black text-[9px]">
                      {walletLabel}
                    </span>
                    <span className="font-mono">{displayAddress}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block"></span>
                    <span>Connected</span>
                  </div>
                </div>

                {/* XP Progress */}
                <div className="w-full sm:w-64">
                  <div className="flex justify-between items-end mb-2 font-black text-[10px] uppercase tracking-widest">
                    <span>{currentTier.level} Tier</span>
                    <span>{profile.xp} / {nextTier ? nextTier.min : currentTier.min} XP</span>
                  </div>
                  <div className="h-4 w-full bg-white border-[3px] border-black rounded-full overflow-hidden flex">
                    <div className="h-full bg-neo-lime border-r-[3px] border-black" style={{ width: `${tierProgress}%` }}></div>
                  </div>
                </div>
              </div>

              {/* 3 Stat Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-neo-orange border-[3px] border-black neo-shadow p-5 flex flex-col relative overflow-hidden group hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all cursor-default">
                  <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/30 rounded-full group-hover:scale-110 transition-transform"></div>
                  <p className="font-black text-[10px] uppercase tracking-widest mb-1 opacity-70">Portfolio Value</p>
                  <p className="font-black text-3xl leading-none relative z-10">$0.00</p>
                  <div className="mt-3 font-bold text-[9px] uppercase tracking-widest">
                    <span className="bg-white border border-black px-1.5 rounded">+0% this week</span>
                  </div>
                </div>

                <div className="bg-white border-[3px] border-black neo-shadow p-5 flex flex-col relative overflow-hidden group hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all cursor-default">
                  <div className="absolute -right-6 -top-6 w-24 h-24 bg-neo-orange/20 rounded-full group-hover:scale-110 transition-transform"></div>
                  <p className="font-black text-[10px] uppercase tracking-widest mb-1 opacity-70">XP Points</p>
                  <p className="font-black text-3xl leading-none relative z-10">{profile.xp}</p>
                  <div className="mt-3 font-bold text-[9px] uppercase tracking-widest">
                    <span className="bg-neo-lime border border-black px-1.5 rounded">
                      {profile.badges.length > 0 ? `${profile.badges.length} badges earned` : 'Keep building!'}
                    </span>
                  </div>
                </div>

                <div className="bg-neo-lime border-[3px] border-black neo-shadow p-5 flex flex-col relative overflow-hidden group hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all cursor-default">
                  <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/30 rounded-full group-hover:scale-110 transition-transform"></div>
                  <p className="font-black text-[10px] uppercase tracking-widest mb-1 opacity-70">Current Tier</p>
                  <p className="font-black text-2xl leading-tight relative z-10 capitalize">{currentTier.level}</p>
                  <div className="mt-3 font-bold text-[9px] uppercase tracking-widest">
                    <span className="bg-white border border-black px-1.5 rounded">
                      {profile.onboardingComplete ? 'Onboarded ✓' : 'Level 1'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Markets Table */}
              <div className="bg-neo-yellow border-4 border-black flex flex-col mt-2 neo-shadow overflow-hidden">
                {/* Table header / filters */}
                <div className="flex flex-col sm:flex-row items-center justify-between border-b-4 border-black bg-white px-4 py-3 gap-4">
                  <div className="flex gap-2 font-black text-[10px] uppercase tracking-widest">
                    {["ALL", "SPOT", "PERP"].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 border-2 border-black transition-all ${
                          activeTab === tab
                            ? "bg-neo-orange shadow-[2px_2px_0px_0px_#000]"
                            : "bg-white hover:bg-[#EAE8E0]"
                        }`}
                      >
                        {tab === "ALL" ? "All" : tab === "SPOT" ? "Spot" : "Perp"}
                      </button>
                    ))}
                  </div>
                  <div className="font-black text-[11px] uppercase tracking-widest bg-white border-2 border-black px-3 py-1.5 flex items-center gap-2">
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8"></circle>
                      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                    Search Markets
                  </div>
                </div>

                <div className="w-full overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[600px]">
                    <thead>
                      <tr className="bg-[#EAE8E0] border-b-4 border-black font-black text-[10px] uppercase tracking-widest">
                        <th className="p-4 border-r-2 border-black">Asset</th>
                        <th className="p-4 border-r-2 border-black">Price</th>
                        <th className="p-4 border-r-2 border-black">24h Change</th>
                        <th className="p-4 border-r-2 border-black">24h Volume</th>
                        <th className="p-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="font-bold text-xs">
                      {marketRows.map((row) => (
                        <tr key={row.ticker} className="border-b-2 border-black last:border-b-0 hover:bg-white/60 transition-colors">
                          <td className="p-4 border-r-2 border-black">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-white border-2 border-black flex items-center justify-center shrink-0">
                                {row.logo
                                  ? <Image src="/injective-logo.svg" alt="INJ" width={16} height={16} />
                                  : <span className="font-black text-[9px]">{row.abbr}</span>
                                }
                              </div>
                              <div>
                                <p className="font-black text-sm uppercase">{row.ticker}</p>
                                <p className="text-[10px] uppercase tracking-widest opacity-60">{row.type}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 border-r-2 border-black font-black">{row.price}</td>
                          <td className={`p-4 border-r-2 border-black font-black ${row.positive ? "text-green-700" : "text-red-600"}`}>{row.change}</td>
                          <td className="p-4 border-r-2 border-black">{row.volume}</td>
                          <td className="p-4">
                            <div className="flex gap-2 justify-center">
                              <Link href={`/dashboard/trade?marketId=${row.marketId}`} className="bg-black text-white border-2 border-black px-3 py-1 font-black text-[9px] uppercase hover:bg-neo-orange hover:text-black transition-colors shadow-[1px_1px_0px_0px_#000] hover:shadow-none hover:translate-x-px hover:translate-y-px">
                                Trade
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {marketRows.length === 0 && (
                        <tr>
                          <td colSpan={5} className="p-8 text-center font-bold text-black/50 text-xs">
                            Loading markets...
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            {/* Floating AI Assistant removed - now handled globally by AIChatBot in dashboard layout */}
          </div>
        </div>
      </div>
    </div>
  );
}
