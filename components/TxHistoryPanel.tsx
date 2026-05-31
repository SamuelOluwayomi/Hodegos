"use client";

import React, { useState, useEffect, useCallback } from "react";
import AskHodegosButton from "@/components/AskHodegosButton";

type TxCategory = "all" | "trade" | "transfer" | "staking" | "governance" | "contract" | "other";

interface Transaction {
  txHash: string;
  timestamp: string;
  timeAgo: string;
  category: "trade" | "transfer" | "staking" | "governance" | "contract" | "other";
  label: string;
  success: boolean;
  gasUsed: string;
  msgCount: number;
  explorerUrl: string;
}

const CATEGORY_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  trade:      { bg: "bg-neo-lime",   text: "text-black",       label: "TRADE" },
  transfer:   { bg: "bg-neo-orange", text: "text-black",       label: "TRANSFER" },
  staking:    { bg: "bg-[#7C3AED]",  text: "text-white",       label: "STAKING" },
  governance: { bg: "bg-[#06B6D4]",  text: "text-black",       label: "GOV" },
  contract:   { bg: "bg-[#F472B6]",  text: "text-black",       label: "CONTRACT" },
  other:      { bg: "bg-black",      text: "text-white",       label: "TX" },
};

const TABS: { key: TxCategory; label: string }[] = [
  { key: "all",        label: "All" },
  { key: "trade",      label: "Trades" },
  { key: "transfer",   label: "Transfers" },
  { key: "staking",    label: "Staking" },
  { key: "governance", label: "Governance" },
];

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 p-4 border-b-2 border-black animate-pulse">
      <div className="w-16 h-5 bg-black/10 rounded" />
      <div className="flex-1 h-4 bg-black/10 rounded" />
      <div className="w-20 h-4 bg-black/10 rounded" />
      <div className="w-12 h-4 bg-black/10 rounded" />
    </div>
  );
}

function timeAgo(isoTimestamp: string): string {
  const seconds = Math.floor((Date.now() - new Date(isoTimestamp).getTime()) / 1000);
  if (seconds < 0) return "Just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function TxHistoryPanel({ address }: { address: string }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TxCategory>("all");
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchTxHistory = useCallback(async () => {
    if (!address) return;
    setLoading(true);
    try {
      // 1. Fetch from on-chain and Supabase API
      const res = await fetch(`/api/txhistory?address=${address}`);
      let apiTxs: Transaction[] = [];
      if (res.ok) {
        const data = await res.json();
        apiTxs = data.transactions ?? [];
      }

      // 2. Fetch from client-side local cache for instant updates
      let localTxs: Transaction[] = [];
      if (typeof window !== "undefined") {
        try {
          const cached = localStorage.getItem(`hodegos_trades_${address}`);
          if (cached) {
            localTxs = JSON.parse(cached);
          }
        } catch (e) {
          console.warn("Error reading local trades in panel:", e);
        }
      }

      // 3. Merge, deduplicate, and sort newest first
      const merged = [...localTxs, ...apiTxs];
      const seen = new Set<string>();
      const unique = merged.filter((tx) => {
        if (!tx.txHash) return false;
        if (seen.has(tx.txHash)) return false;
        seen.add(tx.txHash);
        return true;
      });

      unique.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      // 4. Update relative times and store state
      const processed = unique.map(tx => ({
        ...tx,
        timeAgo: timeAgo(tx.timestamp),
      }));

      setTransactions(processed);
      setLastRefresh(new Date());
    } catch (err) {
      console.warn("TxHistoryPanel fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    fetchTxHistory();

    // Listen for custom events to perform instant real-time updates
    window.addEventListener("refresh-txhistory", fetchTxHistory);
    window.addEventListener("refresh-balances", fetchTxHistory);

    return () => {
      window.removeEventListener("refresh-txhistory", fetchTxHistory);
      window.removeEventListener("refresh-balances", fetchTxHistory);
    };
  }, [fetchTxHistory]);

  const filtered = activeTab === "all"
    ? transactions
    : transactions.filter((tx) => tx.category === activeTab);


  const truncateHash = (hash: string) =>
    hash ? `${hash.slice(0, 8)}...${hash.slice(-6)}` : "—";

  return (
    <div className="bg-white border-4 border-black neo-shadow mt-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b-4 border-black bg-[#EAE8E0] px-4 py-3 gap-3">
        <div className="flex items-center gap-3">
          <h2 className="font-black text-xs uppercase tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 inline-block animate-pulse" />
            On-Chain Activity
          </h2>
          {lastRefresh && (
            <span className="text-[9px] font-bold uppercase tracking-widest text-black/40">
              Updated {lastRefresh.toLocaleTimeString()}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <AskHodegosButton
            query="Explain my recent on-chain transaction history on Injective. What do the different transaction types mean?"
            label="Explain Txs"
          />
          <button
            onClick={fetchTxHistory}
            disabled={loading}
            className="flex items-center gap-1.5 bg-black text-white border-2 border-black px-3 py-1.5 font-black text-[9px] uppercase tracking-widest hover:bg-neo-lime hover:text-black transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)] hover:shadow-none hover:translate-x-px hover:translate-y-px disabled:opacity-50"
          >
            <svg className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
              <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-1 px-4 pt-3 border-b-2 border-black pb-3 overflow-x-auto">
        {TABS.map((tab) => {
          const count = tab.key === "all"
            ? transactions.length
            : transactions.filter((tx) => tx.category === tab.key).length;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-1.5 border-2 border-black font-black text-[9px] uppercase tracking-widest whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeTab === tab.key
                  ? "bg-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)]"
                  : "bg-white hover:bg-[#EAE8E0]"
              }`}
            >
              {tab.label}
              {count > 0 && (
                <span className={`text-[8px] px-1 rounded font-black ${activeTab === tab.key ? "bg-neo-lime text-black" : "bg-black/10"}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Transaction List */}
      <div className="divide-y-2 divide-black/20">
        {loading ? (
          <>
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center">
            <p className="font-black text-[10px] uppercase tracking-widest text-black/30 mb-1">
              No {activeTab === "all" ? "" : activeTab} transactions found
            </p>
            <p className="font-bold text-[10px] text-black/40">
              {activeTab === "all"
                ? "Your on-chain activity on Injective Testnet will appear here"
                : `No ${activeTab} transactions in your history`}
            </p>
          </div>
        ) : (
          filtered.map((tx) => {
            const style = CATEGORY_STYLES[tx.category];
            return (
              <div
                key={tx.txHash}
                className="flex items-center gap-3 px-4 py-3 hover:bg-[#FAFAF5] transition-colors group"
              >
                {/* Category badge */}
                <div className={`shrink-0 px-2 py-1 border-2 border-black font-black text-[8px] uppercase tracking-widest ${style.bg} ${style.text}`}>
                  {style.label}
                </div>

                {/* Label & hash */}
                <div className="flex-1 min-w-0">
                  <p className="font-black text-xs uppercase tracking-wide truncate">{tx.label}</p>
                  <a
                    href={tx.explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-[10px] text-black/50 hover:text-black transition-colors hover:underline"
                    title={tx.txHash}
                  >
                    {truncateHash(tx.txHash)}
                    <span className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity">↗</span>
                  </a>
                </div>

                {/* Status */}
                <div className={`shrink-0 flex items-center gap-1 px-2 py-0.5 border-2 border-black font-black text-[8px] uppercase ${tx.success ? "bg-neo-lime" : "bg-red-400 text-white"}`}>
                  {tx.success ? (
                    <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><polyline points="20 6 9 17 4 12" /></svg>
                  ) : (
                    <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  )}
                  {tx.success ? "OK" : "FAIL"}
                </div>

                {/* Time */}
                <div className="shrink-0 font-bold text-[10px] text-black/50 whitespace-nowrap">
                  {tx.timeAgo}
                </div>

                {/* Gas */}
                <div className="shrink-0 font-mono text-[9px] text-black/30 hidden sm:block">
                  {typeof tx.gasUsed === "number" ? tx.gasUsed.toLocaleString() : tx.gasUsed} gas
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      {!loading && transactions.length > 0 && (
        <div className="border-t-2 border-black px-4 py-2 flex justify-between items-center bg-[#EAE8E0]">
          <span className="font-bold text-[9px] uppercase tracking-widest text-black/50">
            {filtered.length} of {transactions.length} transactions — Injective Testnet
          </span>
          <a
            href={`https://testnet.explorer.injective.network/account/${address}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-black text-[9px] uppercase tracking-widest text-black hover:text-neo-orange transition-colors flex items-center gap-1"
          >
            View All on Explorer ↗
          </a>
        </div>
      )}
    </div>
  );
}
