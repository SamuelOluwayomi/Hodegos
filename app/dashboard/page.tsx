"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useWallet } from "@/lib/walletContext";
import { Wallet } from "@injectivelabs/wallet-ts";

// Truncate a long address for display
function truncateAddress(addr: string): string {
  if (!addr) return "";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

// Wallet label map
const WALLET_LABELS: Partial<Record<Wallet, string>> = {
  [Wallet.Keplr]: "Keplr",
  [Wallet.Leap]: "Leap",
  [Wallet.Metamask]: "MetaMask",
  [Wallet.OkxWallet]: "OKX Wallet",
};

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("ALL");
  const { session, disconnect } = useWallet();
  const router = useRouter();

  // Guard: redirect to landing page if not connected
  useEffect(() => {
    if (!session) {
      router.replace("/");
    }
  }, [session, router]);

  // While redirecting, show nothing (avoids flash of dashboard)
  if (!session) return null;

  const displayAddress = truncateAddress(session.address);
  const walletLabel = WALLET_LABELS[session.wallet] ?? session.wallet;

  const handleDisconnect = async () => {
    await disconnect();
    router.replace("/");
  };

  return (
    <div className="h-screen w-screen bg-[#FEFDF9] font-sans selection:bg-neo-lime selection:text-black flex overflow-hidden">
      <div className="w-full h-full flex overflow-hidden">

        {/* ── LEFT SIDEBAR ── */}
        <aside className="w-20 md:w-24 border-r-4 border-black bg-neo-yellow flex flex-col items-center py-6 shrink-0 z-20 relative">
          <div className="font-black text-xs uppercase tracking-widest border-b-2 border-black pb-2 mb-6 w-full text-center">
            Menu
          </div>

          <nav className="flex flex-col gap-6 w-full px-4">
            {/* Home / Dashboard — active */}
            <Link
              href="/dashboard"
              title="Dashboard"
              className="w-full aspect-square bg-white border-[3px] border-black neo-shadow-sm flex items-center justify-center hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all group"
            >
              <svg className="w-6 h-6 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
              </svg>
            </Link>

            {/* Learn */}
            <Link href="#" title="Learn" className="w-full aspect-square border-[3px] border-transparent hover:border-black hover:bg-white flex items-center justify-center transition-all group rounded-xl">
              <svg className="w-6 h-6 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
              </svg>
            </Link>

            {/* Simulate */}
            <Link href="#" title="Simulate" className="w-full aspect-square border-[3px] border-transparent hover:border-black hover:bg-white flex items-center justify-center transition-all group rounded-xl">
              <svg className="w-6 h-6 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path>
                <path d="M22 12A10 10 0 0 0 12 2v10z"></path>
              </svg>
            </Link>

            {/* Trade */}
            <Link href="#" title="Trade" className="w-full aspect-square border-[3px] border-transparent hover:border-black hover:bg-white flex items-center justify-center transition-all group rounded-xl">
              <svg className="w-6 h-6 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
              </svg>
            </Link>

            {/* Profile */}
            <Link href="#" title="Profile" className="w-full aspect-square border-[3px] border-transparent hover:border-black hover:bg-white flex items-center justify-center transition-all group rounded-xl">
              <svg className="w-6 h-6 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </Link>
          </nav>

          {/* Disconnect button at bottom */}
          <div className="mt-auto px-4 w-full">
            <button
              onClick={handleDisconnect}
              title="Disconnect wallet"
              className="w-full aspect-square border-[3px] border-transparent hover:border-black hover:bg-neo-orange flex items-center justify-center transition-all group rounded-xl"
            >
              <svg className="w-6 h-6 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
            </button>
          </div>
        </aside>

        {/* ── RIGHT MAIN AREA ── */}
        <div className="flex-1 flex flex-col overflow-hidden relative">

          {/* Top Navbar */}
          <header className="h-[76px] bg-[#EAE8E0] border-b-4 border-black flex items-center justify-between px-6 shrink-0">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <Image src="/main.png" alt="Hodegos" width={120} height={24} className="object-contain" />
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
                  <h1 className="font-black text-2xl uppercase tracking-widest mb-2">
                    Let&apos;s trade on-chain
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
                    <span>Apprentice Tier</span>
                    <span>180 / 300 XP</span>
                  </div>
                  <div className="h-4 w-full bg-white border-[3px] border-black rounded-full overflow-hidden flex">
                    <div className="h-full bg-neo-lime border-r-[3px] border-black" style={{ width: "60%" }}></div>
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
                  <p className="font-black text-3xl leading-none relative z-10">180</p>
                  <div className="mt-3 font-bold text-[9px] uppercase tracking-widest">
                    <span className="bg-neo-lime border border-black px-1.5 rounded">Keep building!</span>
                  </div>
                </div>

                <div className="bg-neo-lime border-[3px] border-black neo-shadow p-5 flex flex-col relative overflow-hidden group hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all cursor-default">
                  <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/30 rounded-full group-hover:scale-110 transition-transform"></div>
                  <p className="font-black text-[10px] uppercase tracking-widest mb-1 opacity-70">Current Tier</p>
                  <p className="font-black text-2xl leading-tight relative z-10">Apprentice</p>
                  <div className="mt-3 font-bold text-[9px] uppercase tracking-widest">
                    <span className="bg-white border border-black px-1.5 rounded">Level 1</span>
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
                      {[
                        { ticker: "INJ/USDT", type: "Spot", price: "$24.82", change: "+3.45%", volume: "2.1M", positive: true, logo: true },
                        { ticker: "ETH/USDT", type: "Perp", price: "$3,241.50", change: "-1.20%", volume: "18.4M", positive: false, logo: false, abbr: "ETH" },
                        { ticker: "BTC/USDT", type: "Spot", price: "$67,420.00", change: "+0.82%", volume: "42.1M", positive: true, logo: false, abbr: "BTC" },
                      ].map((row) => (
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
                              <button className="bg-white border-2 border-black px-3 py-1 font-black text-[9px] uppercase hover:bg-neo-lime transition-colors shadow-[1px_1px_0px_0px_#000] hover:shadow-none hover:translate-x-px hover:translate-y-px">Ask AI</button>
                              <button className="bg-black text-white border-2 border-black px-3 py-1 font-black text-[9px] uppercase hover:bg-neo-orange hover:text-black transition-colors shadow-[1px_1px_0px_0px_#000] hover:shadow-none hover:translate-x-px hover:translate-y-px">Trade</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            {/* Right Column — AI Assistant */}
            <div className="w-full xl:w-[320px] shrink-0 flex flex-col border-4 border-black bg-white neo-shadow h-[600px] xl:h-auto">
              {/* Header */}
              <div className="border-b-4 border-black bg-white p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full border-[3px] border-black bg-neo-lime flex items-center justify-center text-base">
                    🤖
                  </div>
                  <div>
                    <h2 className="font-black text-sm uppercase tracking-widest leading-none">Hodegos AI</h2>
                    <p className="font-bold text-[9px] uppercase text-black/60 mt-0.5">● Online</p>
                  </div>
                </div>
              </div>

              {/* Chat Area */}
              <div className="flex-1 bg-[#EAE8E0] p-4 flex flex-col gap-4 overflow-auto">
                <div className="flex flex-col gap-1 items-start">
                  <span className="font-black text-[9px] uppercase tracking-widest text-black/40 ml-1">Hodegos AI</span>
                  <div className="bg-white border-2 border-black p-3 text-xs font-bold rounded-xl rounded-tl-none neo-shadow-sm max-w-[90%]">
                    Welcome! 👋<br /><br />
                    Wallet connected: <span className="font-black text-neo-orange">{displayAddress}</span><br /><br />
                    I can analyze markets, explain trading concepts, or help you execute trades on Injective. What would you like to do?
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-1">
                  <button className="bg-neo-lime border-2 border-black px-2 py-1 font-black text-[9px] uppercase tracking-widest hover:translate-x-0.5 hover:translate-y-0.5 transition-transform shadow-[2px_2px_0px_0px_#000] hover:shadow-none">
                    Buy INJ
                  </button>
                  <button className="bg-neo-orange border-2 border-black px-2 py-1 font-black text-[9px] uppercase tracking-widest hover:translate-x-0.5 hover:translate-y-0.5 transition-transform shadow-[2px_2px_0px_0px_#000] hover:shadow-none">
                    Explain Spot
                  </button>
                  <button className="bg-neo-yellow border-2 border-black px-2 py-1 font-black text-[9px] uppercase tracking-widest hover:translate-x-0.5 hover:translate-y-0.5 transition-transform shadow-[2px_2px_0px_0px_#000] hover:shadow-none">
                    My Portfolio
                  </button>
                </div>
              </div>

              {/* Input */}
              <div className="border-t-4 border-black bg-white p-3">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Ask Hodegos AI..."
                    className="w-full bg-[#EAE8E0] border-[3px] border-black p-3 pr-12 font-bold text-xs outline-none focus:bg-white transition-colors"
                  />
                  <button className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black text-white flex items-center justify-center hover:bg-neo-lime hover:text-black border-2 border-transparent hover:border-black transition-colors">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="22" y1="2" x2="11" y2="13"></line>
                      <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                    </svg>
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
