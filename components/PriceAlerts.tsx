"use client";

import React, { useState, useEffect } from "react";
import { Bell, Trash, X, Play } from "@phosphor-icons/react";

interface PriceAlert {
  id: string;
  ticker: string;
  targetPrice: number;
  condition: "above" | "below";
  createdAt: number;
  isTriggered: boolean;
}

export default function PriceAlerts({
  ticker,
  livePrice,
  onClose,
}: {
  ticker: string;
  livePrice: number;
  onClose: () => void;
}) {
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [targetPrice, setTargetPrice] = useState("");
  const [condition, setCondition] = useState<"above" | "below">("above");
  const [activeToast, setActiveToast] = useState<PriceAlert | null>(null);

  // Load alerts from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("hodegos-price-alerts");
      if (stored) {
        setAlerts(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load price alerts:", e);
    }
  }, []);

  // Save alerts to localStorage
  const saveAlerts = (newAlerts: PriceAlert[]) => {
    setAlerts(newAlerts);
    try {
      localStorage.setItem("hodegos-price-alerts", JSON.stringify(newAlerts));
    } catch (e) {
      console.error("Failed to save price alerts:", e);
    }
  };

  const handleCreateAlert = () => {
    const parsedPrice = parseFloat(targetPrice);
    if (!parsedPrice || parsedPrice <= 0) {
      alert("Please enter a valid target price");
      return;
    }

    const newAlert: PriceAlert = {
      id: Math.random().toString(36).substring(2, 9),
      ticker,
      targetPrice: parsedPrice,
      condition,
      createdAt: Date.now(),
      isTriggered: false,
    };

    saveAlerts([newAlert, ...alerts]);
    setTargetPrice("");
  };

  const handleDeleteAlert = (id: string) => {
    saveAlerts(alerts.filter((a) => a.id !== id));
  };

  // Check alerts every 5 seconds against livePrice
  useEffect(() => {
    if (!livePrice || alerts.length === 0) return;

    let triggeredAlert: PriceAlert | null = null;
    const updatedAlerts = alerts.map((alert) => {
      if (alert.ticker === ticker && !alert.isTriggered) {
        const isHit =
          alert.condition === "above"
            ? livePrice >= alert.targetPrice
            : livePrice <= alert.targetPrice;

        if (isHit) {
          triggeredAlert = { ...alert, isTriggered: true };
          return triggeredAlert;
        }
      }
      return alert;
    });

    if (triggeredAlert) {
      saveAlerts(updatedAlerts);
      setActiveToast(triggeredAlert);
    }
  }, [livePrice, alerts, ticker]);

  const activeTickerAlerts = alerts.filter((a) => a.ticker === ticker);

  return (
    <>
      <div className="border-4 border-black bg-[#FEFDF9] p-5 neo-shadow w-full max-w-sm relative animate-slideUp">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 bg-neo-yellow border-2 border-black flex items-center justify-center shrink-0">
              <Bell size={18} weight="fill" />
            </span>
            <div>
              <h3 className="font-black text-xs uppercase tracking-widest">Price Alerts</h3>
              <p className="text-[8px] font-bold text-black/40 uppercase mt-0.5">{ticker} alerts</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 border-2 border-black bg-[#EAE8E0] flex items-center justify-center hover:bg-neo-orange transition-colors"
          >
            <X size={10} weight="bold" />
          </button>
        </div>

        {/* Current price banner */}
        <div className="bg-[#EAE8E0] border-[3px] border-black p-3 mb-4 flex justify-between items-center">
          <span className="font-black text-[9px] uppercase tracking-widest text-black/50">Current Price</span>
          <span className="font-black text-sm text-neo-orange">
            ${livePrice > 0 ? livePrice.toFixed(livePrice < 0.01 ? 6 : 2) : "—"}
          </span>
        </div>

        {/* Form */}
        <div className="flex flex-col gap-3 mb-4">
          <div>
            <label className="font-black text-[9px] uppercase tracking-widest text-black/50 block mb-1">
              Trigger Condition
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setCondition("above")}
                className={`flex-1 py-1.5 font-black text-[10px] uppercase border-2 border-black transition-all ${
                  condition === "above" ? "bg-black text-white" : "bg-white hover:bg-[#EAE8E0]"
                }`}
              >
                Goes Above
              </button>
              <button
                type="button"
                onClick={() => setCondition("below")}
                className={`flex-1 py-1.5 font-black text-[10px] uppercase border-2 border-black transition-all ${
                  condition === "below" ? "bg-black text-white" : "bg-white hover:bg-[#EAE8E0]"
                }`}
              >
                Drops Below
              </button>
            </div>
          </div>

          <div>
            <label className="font-black text-[9px] uppercase tracking-widest text-black/50 block mb-1">
              Target Price ($)
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                placeholder={livePrice > 0 ? livePrice.toFixed(2) : "0.00"}
                className="flex-1 bg-[#EAE8E0] border-2 border-black px-3 py-1.5 font-black text-xs outline-none focus:bg-white transition-colors"
              />
              <button
                type="button"
                onClick={handleCreateAlert}
                className="bg-neo-lime border-2 border-black px-4 py-1.5 font-black text-[10px] uppercase tracking-wider shadow-[2px_2px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
              >
                Set
              </button>
            </div>
          </div>
        </div>

        {/* Active Alerts List */}
        <div>
          <div className="font-black text-[9px] uppercase tracking-widest text-black/40 mb-2">
            Active Alerts ({activeTickerAlerts.filter((a) => !a.isTriggered).length})
          </div>
          <div className="flex flex-col gap-2 max-h-[140px] overflow-y-auto pr-1">
            {activeTickerAlerts.filter((a) => !a.isTriggered).length === 0 ? (
              <div className="border-2 border-dashed border-black/20 p-4 text-center">
                <span className="font-bold text-[9px] text-black/30 uppercase tracking-widest">
                  No active alerts
                </span>
              </div>
            ) : (
              activeTickerAlerts
                .filter((a) => !a.isTriggered)
                .map((alert) => (
                  <div
                    key={alert.id}
                    className="flex justify-between items-center border-2 border-black bg-white p-2 text-xs"
                  >
                    <div className="flex items-center gap-1.5 font-black">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          alert.condition === "above" ? "bg-neo-lime" : "bg-neo-orange"
                        }`}
                      />
                      <span className="uppercase text-[9px]">
                        {alert.condition === "above" ? "≥" : "≤"} ${alert.targetPrice.toFixed(2)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteAlert(alert.id)}
                      className="w-5 h-5 border border-black bg-[#EAE8E0] hover:bg-neo-orange flex items-center justify-center transition-colors"
                    >
                      <Trash size={10} weight="bold" />
                    </button>
                  </div>
                ))
            )}
          </div>
        </div>
      </div>

      {/* Floating Neo-Brutalist Trigger Toast */}
      {activeToast && (
        <div className="fixed top-24 right-6 z-100 w-full max-w-sm border-4 border-black bg-neo-yellow p-4 neo-shadow animate-slideUp">
          <div className="flex items-start gap-3">
            <span className="w-10 h-10 bg-black border-2 border-black text-neo-yellow flex items-center justify-center shrink-0">
              <Bell size={20} weight="fill" className="animate-bounce" />
            </span>
            <div className="flex-1">
              <h4 className="font-black text-xs uppercase tracking-widest">Price Alert Hit!</h4>
              <p className="font-bold text-[10px] text-black/70 mt-1 leading-relaxed">
                {activeToast.ticker} has gone {activeToast.condition === "above" ? "above" : "below"}{" "}
                ${activeToast.targetPrice.toFixed(2)}! Current: ${livePrice.toFixed(2)}
              </p>
              <div className="flex gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => {
                    setActiveToast(null);
                  }}
                  className="flex-1 py-1 bg-black text-white border-2 border-black font-black text-[9px] uppercase tracking-wider hover:bg-white hover:text-black transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
