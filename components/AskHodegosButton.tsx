"use client";

import React from "react";

interface AskHodegosButtonProps {
  query: string;
  label?: string;
  className?: string;
}

export default function AskHodegosButton({
  query,
  label = "Ask Hodegos AI",
  className = "",
}: AskHodegosButtonProps) {
  const handleClick = () => {
    window.dispatchEvent(
      new CustomEvent("open-hodegos-chat", {
        detail: { query },
      })
    );
  };

  return (
    <button
      onClick={handleClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 bg-neo-lime border-2 border-black font-black text-[10px] uppercase tracking-widest hover:translate-x-0.5 hover:translate-y-0.5 transition-transform shadow-[2px_2px_0px_0px_#000] hover:shadow-none shrink-0 ${className}`}
    >
      <div className="w-4 h-4 rounded-full overflow-hidden border border-black bg-black flex items-center justify-center shrink-0">
        <img src="/hero-guide.png" alt="Hodegos" className="w-full h-full object-cover" />
      </div>
      <span>{label}</span>
    </button>
  );
}
