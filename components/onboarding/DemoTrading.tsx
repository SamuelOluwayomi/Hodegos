"use client";

import React, { useState } from "react";
import { ChartBar, ArrowCircleDown, ArrowCircleUp, Confetti, Check, ArrowLeft, ChartLineUp } from "@phosphor-icons/react";

interface DemoTradingProps {
  onComplete: () => void;
  onSkip?: () => void;
  canSkip?: boolean;
}

// Simulated fake trading demo (not on-chain)
export default function DemoTrading({ onComplete, onSkip, canSkip }: DemoTradingProps) {
  const [step, setStep] = useState(0);
  const [selectedSide, setSelectedSide] = useState<"buy" | "sell" | null>(null);
  const [orderType, setOrderType] = useState<"market" | "limit" | null>(null);
  const [amount, setAmount] = useState("");
  const [limitPrice, setLimitPrice] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const currentPrice = 24.82;
  const pair = "INJ/USDT";

  const handleSubmitOrder = () => {
    setSubmitted(true);
    setTimeout(() => setStep(3), 1500);
    
    // Trigger AI Advisor
    const query = `Provide real-time advice for a simulated ${selectedSide?.toUpperCase()} order of ${amount} INJ on Injective. Type: ${orderType}. ${orderType === 'limit' ? `Price: $${limitPrice}` : `Price: $${currentPrice}`}. What are the risks, technical details, or tips I should keep in mind?`;
    window.dispatchEvent(new CustomEvent("open-hodegos-chat", { detail: { query } }));
  };

  return (
    <div className="p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-black text-sm uppercase tracking-widest">Demo Trade</h3>
          <p className="font-bold text-[10px] text-black/60 uppercase tracking-widest">Paper trading — no real funds</p>
        </div>
        <div className="bg-neo-yellow border-[3px] border-black px-3 py-1 font-black text-[9px] uppercase tracking-widest">
          Simulated
        </div>
      </div>

      {/* Fake chart placeholder */}
      <div className="border-[3px] border-black bg-[#EAE8E0] p-4 relative overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-neo-orange border-2 border-black rounded-full flex items-center justify-center font-black text-[10px]">INJ</div>
            <div>
              <p className="font-black text-sm uppercase">{pair}</p>
              <p className="font-bold text-[10px] text-black/60">Spot Trading</p>
            </div>
          </div>
          <div>
            <p className="font-black text-lg text-right">${currentPrice}</p>
            <p className="font-bold text-[10px] text-green-700 text-right">+3.45%</p>
          </div>
        </div>
        {/* Placeholder chart area */}
        <div className="h-32 border-2 border-dashed border-black/30 rounded flex items-center justify-center bg-white/50 overflow-hidden relative">
          <img src="/main.png" alt="Demo Chart" className="w-full h-full object-cover opacity-80" />
        </div>
      </div>

      {/* Step 0: Choose Buy or Sell */}
      {step === 0 && (
        <div>
          <p className="font-black text-[11px] uppercase tracking-widest mb-3">Step 1: Choose Side</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => { setSelectedSide("buy"); setStep(1); }}
              className="bg-neo-lime border-[3px] border-black p-4 flex items-center justify-center gap-2 font-black text-lg uppercase shadow-[4px_4px_0px_0px_#000] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all"
            >
              <ArrowCircleDown size={24} weight="fill" className="text-green-800" /> Buy
            </button>
            <button
              onClick={() => { setSelectedSide("sell"); setStep(1); }}
              className="bg-neo-orange border-[3px] border-black p-4 flex items-center justify-center gap-2 font-black text-lg uppercase shadow-[4px_4px_0px_0px_#000] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all"
            >
              <ArrowCircleUp size={24} weight="fill" className="text-red-800" /> Sell
            </button>
          </div>
        </div>
      )}

      {/* Step 1: Order type + amount */}
      {step === 1 && (
        <div>
          <p className="font-black text-[11px] uppercase tracking-widest mb-3">
            Step 2: {selectedSide === "buy" ? "Buying" : "Selling"} INJ — Choose Order Type
          </p>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <button
              onClick={() => setOrderType("market")}
              className={`border-[3px] border-black p-3 font-black text-[11px] uppercase tracking-widest transition-all ${
                orderType === "market" ? "bg-neo-lime shadow-[3px_3px_0px_0px_#000]" : "bg-white shadow-[2px_2px_0px_0px_#000] hover:bg-[#EAE8E0]"
              }`}
            >
              Market Order
              <p className="font-bold text-[9px] text-black/60 mt-1 normal-case tracking-normal">Execute instantly at current price</p>
            </button>
            <button
              onClick={() => setOrderType("limit")}
              className={`border-[3px] border-black p-3 font-black text-[11px] uppercase tracking-widest transition-all ${
                orderType === "limit" ? "bg-neo-lime shadow-[3px_3px_0px_0px_#000]" : "bg-white shadow-[2px_2px_0px_0px_#000] hover:bg-[#EAE8E0]"
              }`}
            >
              Limit Order
              <p className="font-bold text-[9px] text-black/60 mt-1 normal-case tracking-normal">Set your own price</p>
            </button>
          </div>

          {orderType && (
            <div className="flex flex-col gap-3">
              <div>
                <label className="font-black text-[10px] uppercase tracking-widest block mb-1">Amount (INJ)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 10"
                  className="w-full bg-white border-[3px] border-black p-3 font-bold text-sm outline-none focus:bg-neo-lime/20 transition-colors"
                />
              </div>
              {orderType === "limit" && (
                <div>
                  <label className="font-black text-[10px] uppercase tracking-widest block mb-1">Limit Price (USDT)</label>
                  <input
                    type="number"
                    value={limitPrice}
                    onChange={(e) => setLimitPrice(e.target.value)}
                    placeholder={`e.g. ${currentPrice}`}
                    className="w-full bg-white border-[3px] border-black p-3 font-bold text-sm outline-none focus:bg-neo-lime/20 transition-colors"
                  />
                </div>
              )}
              {/* Order summary */}
              {amount && (
                <div className="bg-neo-yellow border-[3px] border-black p-3">
                  <p className="font-black text-[10px] uppercase tracking-widest mb-2">Order Summary</p>
                  <div className="font-bold text-[11px] space-y-1">
                    <p>Side: <span className="font-black uppercase">{selectedSide}</span></p>
                    <p>Type: <span className="font-black uppercase">{orderType}</span></p>
                    <p>Amount: <span className="font-black">{amount} INJ</span></p>
                    <p>Price: <span className="font-black">${orderType === "limit" && limitPrice ? limitPrice : currentPrice}</span></p>
                    <p>Total: <span className="font-black">${(parseFloat(amount || "0") * (orderType === "limit" && limitPrice ? parseFloat(limitPrice) : currentPrice)).toFixed(2)} USDT</span></p>
                  </div>
                </div>
              )}
              <button
                onClick={() => { setStep(2); }}
                disabled={!amount || (orderType === "limit" && !limitPrice)}
                className="bg-black text-white border-[3px] border-black p-3 font-black uppercase tracking-widest text-sm shadow-[4px_4px_0px_0px_#FF9B3F] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all disabled:opacity-30"
              >
                Review Order →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Confirm */}
      {step === 2 && !submitted && (
        <div className="bg-white border-[3px] border-black p-5">
          <p className="font-black text-sm uppercase tracking-widest mb-3">Step 3: Confirm Your Trade</p>
          <div className="bg-[#EAE8E0] border-2 border-black p-4 mb-4 font-bold text-[12px] space-y-1">
            <p className="flex items-center gap-1">
              {selectedSide === "buy" ? <ArrowCircleDown size={16} weight="fill" className="text-green-800" /> : <ArrowCircleUp size={16} weight="fill" className="text-red-800" />}
              <span className="uppercase">{selectedSide === "buy" ? "BUYING" : "SELLING"}</span> <span className="font-black">{amount} INJ</span>
            </p>
            <p>at <span className="font-black">${orderType === "limit" && limitPrice ? limitPrice : currentPrice}/INJ</span></p>
            <p>Total: <span className="font-black">${(parseFloat(amount || "0") * (orderType === "limit" && limitPrice ? parseFloat(limitPrice) : currentPrice)).toFixed(2)} USDT</span></p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleSubmitOrder}
              className="flex-1 bg-neo-lime border-[3px] border-black p-3 flex items-center justify-center gap-2 font-black uppercase tracking-widest text-sm shadow-[4px_4px_0px_0px_#000] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all"
            >
              <Check size={18} weight="bold" /> Confirm Trade
            </button>
            <button
              onClick={() => setStep(1)}
              className="bg-white border-[3px] border-black p-3 flex items-center justify-center gap-2 font-black uppercase tracking-widest text-[10px] shadow-[2px_2px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
            >
              <ArrowLeft size={14} weight="bold" /> Back
            </button>
          </div>
        </div>
      )}

      {/* Submitting animation */}
      {step === 2 && submitted && (
        <div className="bg-neo-yellow border-[3px] border-black p-8 flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-black border-t-neo-orange rounded-full animate-spin" />
          <p className="font-black text-sm uppercase tracking-widest">Executing Trade...</p>
          <p className="font-bold text-[10px] text-black/60">(Simulated — no real funds)</p>
        </div>
      )}

      {/* Step 3: Success */}
      {step === 3 && (
        <div className="bg-neo-lime border-[3px] border-black p-6 flex flex-col items-center text-center">
          <div className="text-black mb-3">
            <Confetti size={48} weight="fill" />
          </div>
          <h4 className="font-black text-lg uppercase tracking-widest mb-2">Trade Executed!</h4>
          <p className="font-bold text-[11px] text-black/70 mb-1">
            You {selectedSide === "buy" ? "bought" : "sold"} {amount} INJ at ${orderType === "limit" && limitPrice ? limitPrice : currentPrice}
          </p>
          <p className="font-black text-[12px] text-black mb-4">This was a simulated trade — no real funds were used.</p>
          <div className="bg-black text-neo-lime px-4 py-2 flex items-center justify-center gap-2 font-black text-sm uppercase tracking-widest mb-4">
            +50 XP • Paper Trader <ChartLineUp size={16} weight="fill" />
          </div>
          <br />
          <button
            onClick={onComplete}
            className="mt-2 bg-neo-orange border-[3px] border-black px-8 py-3 font-black uppercase tracking-widest text-sm shadow-[4px_4px_0px_0px_#000] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all"
          >
            Continue →
          </button>
        </div>
      )}

      {/* Skip option */}
      {canSkip && step < 3 && onSkip && (
        <button
          onClick={onSkip}
          className="self-center font-bold text-[10px] uppercase tracking-widest text-black/40 hover:text-black transition-colors underline underline-offset-4"
        >
          Skip demo → go to on-chain trading
        </button>
      )}
    </div>
  );
}
