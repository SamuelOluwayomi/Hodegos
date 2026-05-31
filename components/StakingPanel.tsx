"use client";

import React, { useState, useEffect, useCallback } from "react";
import AskHodegosButton from "@/components/AskHodegosButton";

interface Delegation {
  validatorAddress: string;
  validatorName: string;
  delegatedAmount: number;
  pendingRewardINJ: number;
  estimatedApy: number;
}

interface StakingData {
  delegations: Delegation[];
  totalDelegated: number;
  totalPendingReward: number;
  estimatedApy: number;
  hasDelegations: boolean;
}

export default function StakingPanel({ address, injPrice }: { address: string; injPrice: number }) {
  const [data, setData] = useState<StakingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  const fetchStaking = useCallback(async () => {
    if (!address) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/staking?address=${address}`);
      if (res.ok) {
        const d = await res.json();
        setData(d);
        if (d.hasDelegations) setExpanded(true);
      }
    } catch (err) {
      console.warn("StakingPanel fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    fetchStaking();
  }, [fetchStaking]);

  const totalValueUSD = data ? data.totalDelegated * injPrice : 0;
  const rewardValueUSD = data ? data.totalPendingReward * injPrice : 0;

  return (
    <div className="border-4 border-black bg-white neo-shadow transition-all">
      {/* Header — always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 bg-[#EAE8E0] text-black border-b-4 border-black hover:bg-neo-lime hover:text-black transition-all"
      >
        <div className="flex items-center gap-3">
          <svg className="w-4 h-4 shrink-0 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
          <span className="font-black text-xs uppercase tracking-widest text-black">INJ Staking</span>
          {loading && <span className="w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin" />}
        </div>
        <div className="flex items-center gap-4">
          {!loading && data && (
            <div className="flex items-center gap-4 text-right">
              <div>
                <div className="font-black text-sm text-black">{data.totalDelegated.toFixed(3)} INJ</div>
                <div className="text-[9px] uppercase tracking-widest text-black/50">Delegated</div>
              </div>
              {data.hasDelegations && (
                <div className="bg-white text-black border-2 border-black px-2 py-0.5 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                  <div className="font-black text-xs">~{data.estimatedApy.toFixed(1)}% APY</div>
                </div>
              )}
            </div>
          )}
          <svg
            className={`w-4 h-4 text-black transition-transform ${expanded ? "rotate-180" : ""}`}
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </button>

      {/* Expanded Body */}
      {expanded && (
        <div className="p-4">
          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-14 bg-black/5 animate-pulse border-2 border-black/10" />
              ))}
            </div>
          ) : !data?.hasDelegations ? (
            <div className="py-6 text-center">
              <p className="font-black text-[10px] uppercase tracking-widest text-black/40 mb-2">No Active Delegations</p>
              <p className="font-bold text-xs text-black/50 mb-4 max-w-xs mx-auto">
                Stake your INJ to earn ~14% APY and help secure the Injective network.
              </p>
              <AskHodegosButton
                query="How do I stake INJ on Injective? What validators should I choose and what are the risks?"
                label="Learn About Staking"
              />
            </div>
          ) : (
            <>
              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-[#EAE8E0]/40 border-2 border-black p-3">
                  <div className="font-black text-[9px] uppercase tracking-widest text-black/60 mb-1">Total Staked</div>
                  <div className="font-black text-lg">{data.totalDelegated.toFixed(3)}</div>
                  <div className="font-bold text-[10px] text-black/50">INJ ≈ ${totalValueUSD.toFixed(2)}</div>
                </div>
                <div className="bg-neo-lime border-2 border-black p-3">
                  <div className="font-black text-[9px] uppercase tracking-widest text-black/60 mb-1">Pending Rewards</div>
                  <div className="font-black text-lg text-green-700">{data.totalPendingReward.toFixed(4)}</div>
                  <div className="font-bold text-[10px] text-black/50">INJ ≈ ${rewardValueUSD.toFixed(4)}</div>
                </div>
                <div className="bg-neo-orange border-2 border-black p-3">
                  <div className="font-black text-[9px] uppercase tracking-widest text-black/60 mb-1">Est. APY</div>
                  <div className="font-black text-lg">{data.estimatedApy.toFixed(1)}%</div>
                  <div className="font-bold text-[10px] text-black/50">Network Avg.</div>
                </div>
              </div>

              {/* Individual Delegations */}
              <div className="space-y-2">
                {data.delegations.map((d) => (
                  <div key={d.validatorAddress} className="flex items-center justify-between border-2 border-black p-3 bg-white">
                    <div>
                      <div className="font-black text-xs uppercase">{d.validatorName}</div>
                      <div className="font-mono text-[9px] text-black/40">{d.validatorAddress.slice(0, 20)}...</div>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-sm">{d.delegatedAmount.toFixed(3)} INJ</div>
                      <div className="font-bold text-[10px] text-green-700">
                        +{d.pendingRewardINJ.toFixed(4)} INJ rewards
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex items-center gap-2">
                <AskHodegosButton
                  query={`I have ${data.totalDelegated.toFixed(3)} INJ staked across ${data.delegations.length} validator(s) with ${data.totalPendingReward.toFixed(4)} INJ in pending rewards. Should I claim my rewards or restake them?`}
                  label="Ask Hodegos About Staking"
                />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

