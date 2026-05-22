"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useWallet, WalletId } from "@/lib/useWallet";
import DashboardSidebar from "@/components/DashboardSidebar";
import AskHodegosButton from "@/components/AskHodegosButton";
import { FEATURED_MARKET_IDS, fetchMarketSummary } from "@/lib/injective";

const WALLET_LABELS: Partial<Record<WalletId, string>> = {
  keplr: "Keplr", leap: "Leap", ninji: "Ninji", metamask: "MetaMask",
};

const MARKETS = [
  { ticker: "INJ/USDT", marketId: FEATURED_MARKET_IDS["INJ/USDT"], price: 0 },
  { ticker: "ATOM/USDT", marketId: FEATURED_MARKET_IDS["ATOM/USDT"], price: 0 },
  { ticker: "WETH/USDT", marketId: FEATURED_MARKET_IDS["WETH/USDT"], price: 0 },
  { ticker: "SOL/USDT", marketId: FEATURED_MARKET_IDS["SOL/USDT"], price: 0 },
  { ticker: "TIA/USDT", marketId: FEATURED_MARKET_IDS["TIA/USDT"], price: 0 },
];

function TradeContent() {
  const searchParams = useSearchParams();
  const { address, wallet, isConnected, disconnect, truncateAddress, isInitialized } = useWallet();
  const router = useRouter();

  const initMarketId = searchParams.get("market") || FEATURED_MARKET_IDS["INJ/USDT"];
  const initTicker = searchParams.get("ticker") || "INJ/USDT";
  const initSide = (searchParams.get("side") as "buy" | "sell") || "buy";

  const [selectedMarket, setSelectedMarket] = useState({ ticker: initTicker, marketId: initMarketId });
  const [side, setSide] = useState<"buy" | "sell">(initSide);
  const [orderType, setOrderType] = useState<"market" | "limit">("market");
  const [amount, setAmount] = useState("");
  const [limitPrice, setLimitPrice] = useState("");
  const [livePrice, setLivePrice] = useState(0);
  const [priceLoading, setPriceLoading] = useState(true);

  // Fetch balances for trading limits and display
  const [injBalance, setInjBalance] = useState(17.1981);
  const [usdtBalance, setUsdtBalance] = useState(10.00);

  useEffect(() => {
    if (!address) return;
    const fetchBalances = async () => {
      try {
        const res = await fetch(`/api/portfolio?address=${address}`);
        if (res.ok) {
          const data = await res.json();
          if (!data.nodeError) {
            setInjBalance(data.injBalance ?? 0);
            setUsdtBalance(data.usdtBalance ?? 0);
          } else {
            setInjBalance((prev) => prev || 17.1981);
            setUsdtBalance((prev) => prev || 10.00);
          }
        }
      } catch (err) {
        console.error("Error fetching balances on trade page:", err);
      }
    };
    fetchBalances();
    const interval = setInterval(fetchBalances, 15000);
    window.addEventListener("refresh-balances", fetchBalances);

    return () => {
      clearInterval(interval);
      window.removeEventListener("refresh-balances", fetchBalances);
    };
  }, [address]);

  const handleDisconnect = () => { disconnect(); router.replace("/"); };

  // Fetch live price for selected market
  useEffect(() => {
    const fetchPrice = async () => {
      setPriceLoading(true);
      try {
        const s = await fetchMarketSummary(selectedMarket.marketId);
        if (s) {
          const p = parseFloat(s.price || "0");
          setLivePrice(p);
          if (orderType === "limit" && limitPrice === "") setLimitPrice(p.toFixed(p < 0.01 ? 6 : 2));
        }
      } catch { /* ignore */ }
      setPriceLoading(false);
    };
    fetchPrice();
    const interval = setInterval(fetchPrice, 10000);
    return () => clearInterval(interval);
  }, [selectedMarket, orderType]);

  const effectivePrice = orderType === "limit" ? parseFloat(limitPrice) || 0 : livePrice;
  const total = (parseFloat(amount) || 0) * effectivePrice;
  const baseAsset = selectedMarket.ticker.split("/")[0];
  const quoteAsset = selectedMarket.ticker.split("/")[1];

  const handlePercentClick = (percent: number) => {
    if (side === "buy") {
      if (effectivePrice <= 0) return;
      const maxBuy = usdtBalance / effectivePrice;
      setAmount((maxBuy * percent).toFixed(4));
    } else {
      const maxSell = baseAsset === "INJ" ? injBalance : 0;
      setAmount((maxSell * percent).toFixed(4));
    }
  };

  const currentBalance = side === "buy"
    ? `${usdtBalance.toFixed(2)} USDT`
    : (baseAsset === "INJ" ? `${injBalance.toFixed(4)} INJ` : `0.0000 ${baseAsset}`);

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
              Trade
            </span>
          </div>
          <div className="flex items-center gap-3">
            <AskHodegosButton
              query={`Explain how trading works for ${selectedMarket.ticker} on Injective. What is the difference between a market order and a limit order, and how does slippage or fees work?`}
              label="Explain Trading"
            />
            <div className="flex items-center gap-2 bg-white border-2 border-black px-3 py-1.5 font-bold text-[10px]">
              <span className="font-black uppercase">{walletLabel}</span>
              <span className="text-black/60">{displayAddress}</span>
            </div>
            <span className="font-black text-[9px] uppercase text-green-600">Live</span>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          {/* Market selector */}
          <div className="w-56 border-r-4 border-black bg-white flex flex-col shrink-0 overflow-y-auto">
            <div className="border-b-4 border-black p-3 font-black text-[10px] uppercase tracking-widest text-black/40">Select Pair</div>
            {MARKETS.map(m => (
              <button
                key={m.marketId}
                onClick={() => setSelectedMarket(m)}
                className={`w-full px-4 py-3 text-left border-b-2 border-black/10 font-black text-sm transition-all hover:bg-[#EAE8E0] ${
                  selectedMarket.marketId === m.marketId ? "bg-black text-white" : ""
                }`}
              >
                {m.ticker}
              </button>
            ))}
            <div className="p-3 mt-auto">
              <Link
                href="/dashboard/markets"
                className="block text-center font-black text-[9px] uppercase tracking-widest text-black/40 hover:text-black transition-colors"
              >
                View all markets →
              </Link>
            </div>
          </div>

          {/* Trade form */}
          <div className="flex-1 flex items-start justify-center p-8 overflow-y-auto">
            <div className="w-full max-w-md">
              {/* Price banner */}
              <div className="bg-black text-white border-4 border-black p-5 mb-6 neo-shadow relative overflow-hidden">
                <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-neo-lime/10" />
                <div className="relative z-10">
                  <div className="font-black text-[9px] uppercase tracking-widest text-white/40 mb-1">{selectedMarket.ticker} • Live Price</div>
                  {priceLoading ? (
                    <div className="flex gap-1.5">
                      {[0, 1, 2].map(i => <div key={i} className="w-2 h-2 bg-neo-lime rounded-full animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />)}
                    </div>
                  ) : (
                    <div className="font-black text-3xl text-neo-lime">
                      {livePrice > 0 ? `$${livePrice.toFixed(livePrice < 0.01 ? 6 : 2)}` : "—"}
                    </div>
                  )}
                  <div className="flex items-center gap-1 mt-1">
                    <span className="font-black text-[8px] uppercase text-neo-lime/70">Injective Testnet</span>
                  </div>
                </div>
              </div>

              {/* Order form */}
              <div className="border-4 border-black bg-white neo-shadow">
                {/* Side toggle */}
                <div className="grid grid-cols-2 border-b-4 border-black">
                  <button
                    onClick={() => setSide("buy")}
                    className={`py-4 font-black text-sm uppercase tracking-widest transition-all ${
                      side === "buy" ? "bg-neo-lime border-r-4 border-black" : "bg-white hover:bg-[#EAE8E0] border-r-2 border-black"
                    }`}
                  >
                    Buy {baseAsset}
                  </button>
                  <button
                    onClick={() => setSide("sell")}
                    className={`py-4 font-black text-sm uppercase tracking-widest transition-all ${
                      side === "sell" ? "bg-neo-orange" : "bg-white hover:bg-[#EAE8E0]"
                    }`}
                  >
                    Sell {baseAsset}
                  </button>
                </div>

                <div className="p-5 flex flex-col gap-4">
                  {/* Order type */}
                  <div>
                    <label className="font-black text-[9px] uppercase tracking-widest text-black/50 block mb-2">Order Type</label>
                    <div className="flex gap-2">
                      {(["market", "limit"] as const).map(t => (
                        <button
                          key={t}
                          onClick={() => setOrderType(t)}
                          className={`flex-1 py-2 font-black text-xs uppercase border-[3px] border-black transition-all ${
                            orderType === t ? "bg-black text-white" : "bg-white hover:bg-[#EAE8E0]"
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Limit price */}
                  {orderType === "limit" && (
                    <div>
                      <label className="font-black text-[9px] uppercase tracking-widest text-black/50 block mb-2">
                        Limit Price ({quoteAsset})
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-black text-black/40">$</span>
                        <input
                          type="number"
                          value={limitPrice}
                          onChange={e => setLimitPrice(e.target.value)}
                          placeholder={livePrice > 0 ? livePrice.toFixed(2) : "0.00"}
                          className="w-full border-[3px] border-black bg-[#EAE8E0] pl-7 pr-4 py-3 font-black text-sm outline-none focus:bg-white transition-colors"
                        />
                      </div>
                    </div>
                  )}

                  {/* Amount */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="font-black text-[9px] uppercase tracking-widest text-black/50">
                        Amount ({baseAsset})
                      </label>
                      <span className="font-black text-[9px] uppercase tracking-widest text-black/60 bg-[#EAE8E0] px-2 py-0.5 border border-black/20">
                        Balance: {currentBalance}
                      </span>
                    </div>
                    <input
                      type="number"
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full border-[3px] border-black bg-[#EAE8E0] px-4 py-3 font-black text-sm outline-none focus:bg-white transition-colors"
                    />
                    <div className="flex gap-1 mt-2">
                      {[
                        { label: "25%", val: 0.25 },
                        { label: "50%", val: 0.50 },
                        { label: "75%", val: 0.75 },
                        { label: "MAX", val: 1.00 }
                      ].map(pct => (
                        <button
                          key={pct.label}
                          type="button"
                          onClick={() => handlePercentClick(pct.val)}
                          className="flex-1 bg-[#EAE8E0] border-2 border-black py-1 font-black text-[8px] uppercase hover:bg-neo-yellow transition-colors"
                        >
                          {pct.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Total */}
                  <div className="border-[3px] border-black bg-[#EAE8E0] p-3">
                    <div className="font-black text-[9px] uppercase tracking-widest text-black/50 mb-1">Estimated Total</div>
                    <div className="font-black text-xl">
                      ${total > 0 ? total.toFixed(2) : "0.00"} <span className="text-sm text-black/40">{quoteAsset}</span>
                    </div>
                    {effectivePrice > 0 && (
                      <div className="font-bold text-[9px] text-black/40 mt-1">
                        @ ${effectivePrice.toFixed(effectivePrice < 0.01 ? 6 : 2)} per {baseAsset}
                        {orderType === "market" && " (market price)"}
                      </div>
                    )}
                  </div>

                  {/* Fees */}
                  <div className="flex justify-between font-bold text-[10px] text-black/40">
                    <span>Taker fee (0.05%)</span>
                    <span>{total > 0 ? `~$${(total * 0.0005).toFixed(4)}` : "$0.00"}</span>
                  </div>

                  {/* Submit */}
                  <button
                    className={`w-full py-4 font-black text-sm uppercase tracking-widest border-[3px] border-black shadow-[4px_4px_0px_0px_#000] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all ${
                      side === "buy" ? "bg-neo-lime" : "bg-neo-orange"
                    }`}
                    onClick={() => {
                      if (!amount || Number(amount) <= 0) {
                        alert("Please enter a valid amount to trade.");
                        return;
                      }
                      const query = `Provide real-time advice for a ${side.toUpperCase()} order of ${amount} ${baseAsset} on Injective. Type: ${orderType}. ${orderType === 'limit' ? `Price: $${limitPrice}` : `Price: Market price`}. What are the risks, technical details, or tips I should keep in mind?`;
                      window.dispatchEvent(new CustomEvent("open-hodegos-chat", { detail: { query } }));
                    }}
                  >
                    {side === "buy" ? `Buy ${baseAsset}` : `Sell ${baseAsset}`}
                  </button>

                  <div className="text-center font-bold text-[9px] text-black/30 uppercase tracking-widest">
                    Powered by Injective Protocol DEX
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right info panel */}
          <div className="w-64 border-l-4 border-black bg-white flex flex-col shrink-0 overflow-y-auto">
            <div className="border-b-4 border-black p-4">
              <div className="font-black text-[10px] uppercase tracking-widest text-black/40 mb-3">Order Info</div>
              <div className="flex flex-col gap-3 text-xs">
                {[
                  ["Type", orderType === "market" ? "Market Order" : "Limit Order"],
                  ["Side", side.toUpperCase()],
                  ["Pair", selectedMarket.ticker],
                  ["Network", "Injective Testnet"],
                  ["Protocol", "Injective DEX"],
                ].map(([key, val]) => (
                  <div key={key} className="flex justify-between border-b border-black/10 pb-2">
                    <span className="font-bold text-black/40 uppercase">{key}</span>
                    <span className="font-black">{val}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4">
              <div className="font-black text-[10px] uppercase tracking-widest text-black/40 mb-3">Tips</div>
              <div className="flex flex-col gap-2 text-xs font-bold text-black/60">
                <div className="flex gap-2 items-start">
                  <span className="text-neo-orange font-black">→</span>
                  <span>Market orders execute immediately at the best available price</span>
                </div>
                <div className="flex gap-2 items-start">
                  <span className="text-neo-lime font-black">→</span>
                  <span>Limit orders let you set your exact target price</span>
                </div>
                <div className="flex gap-2 items-start">
                  <span className="text-black font-black">→</span>
                  <span>Injective charges 0% maker fees on most markets</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TradePage() {
  return (
    <Suspense fallback={<div className="h-screen w-screen flex items-center justify-center font-black">Loading...</div>}>
      <TradeContent />
    </Suspense>
  );
}
