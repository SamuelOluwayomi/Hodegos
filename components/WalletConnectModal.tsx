"use client";

import { useEffect } from "react";
import { useWallet, WalletId } from "@/lib/useWallet";
import { useRouter } from "next/navigation";

// ── Wallet options shown in the modal ────────────────────────────────────────

const WALLETS: {
  id: WalletId;
  label: string;
  description: string;
  recommended?: boolean;
  icon: React.ReactNode;
}[] = [
  {
    id: "keplr",
    label: "Keplr",
    description: "Cosmos native · Browser extension",
    recommended: true,
    icon: (
      <svg viewBox="0 0 40 40" className="w-8 h-8" fill="none">
        <rect width="40" height="40" rx="8" fill="#2B2B2B" />
        <path d="M10 10h8v8l6-8h8L22 22l10 10h-8L14 22v10h-8V10z" fill="#7B5AF7" />
        <path d="M22 20l10 10h-8L14 22" fill="#9F7AFF" opacity="0.6" />
      </svg>
    ),
  },
  {
    id: "leap",
    label: "Leap",
    description: "Cosmos native · Browser extension",
    icon: (
      <svg viewBox="0 0 40 40" className="w-8 h-8" fill="none">
        <rect width="40" height="40" rx="8" fill="#1A1A1A" />
        <circle cx="20" cy="20" r="10" fill="#29CC6A" />
        <path d="M15 20l4 4 7-8" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: "ninji",
    label: "Ninji",
    description: "Injective native · Browser extension",
    icon: (
      <svg viewBox="0 0 40 40" className="w-8 h-8" fill="none">
        <rect width="40" height="40" rx="8" fill="#0A0A2E" />
        <circle cx="20" cy="20" r="10" fill="#6366F1" />
        <path d="M15 18l5 6 5-6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: "metamask",
    label: "MetaMask",
    description: "EVM compatible · Browser extension",
    icon: (
      <svg viewBox="0 0 40 40" className="w-8 h-8" fill="none">
        <rect width="40" height="40" rx="8" fill="#1A1A1A" />
        <path d="M32 8L22 16l2-5z" fill="#E17726" />
        <path d="M8 8l10 8-2-5z" fill="#E27625" />
        <path d="M28 27l-3 5 7 2-1-7z" fill="#E27625" />
        <path d="M9 27l-1 7 7-2-3-5z" fill="#E27625" />
        <path d="M15 19l-2 4 8 1-1-6z" fill="#F5841F" />
        <path d="M25 19l-5-1-1 6 8-1z" fill="#F5841F" />
        <path d="M15 32l5-2-4-4z" fill="#C0AC9D" />
        <path d="M20 30l5 2-4-4z" fill="#C0AC9D" />
      </svg>
    ),
  },
];

// ── Props ─────────────────────────────────────────────────────────────────────

interface WalletConnectModalProps {
  open: boolean;
  onClose: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function WalletConnectModal({ open, onClose }: WalletConnectModalProps) {
  const { connect, isConnecting, error, isConnected } = useWallet();
  const router = useRouter();

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // Redirect to dashboard once connected
  useEffect(() => {
    if (isConnected && open) {
      onClose();
      router.push("/dashboard");
    }
  }, [isConnected, open, onClose, router]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-100 bg-black/60 backdrop-blur-[2px]"
        onClick={isConnecting ? undefined : onClose}
      />

      {/* Modal */}
      <div
        className="fixed z-101 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md"
        role="dialog"
        aria-modal="true"
        aria-label="Connect Wallet"
      >
        {/* Offset shadow block */}
        <div className="absolute inset-0 translate-x-[8px] translate-y-[8px] bg-neo-orange border-4 border-black" />

        {/* Main modal */}
        <div className="relative bg-[#EAE8E0] border-4 border-black">

          {/* Header */}
          <div className="flex items-center justify-between border-b-4 border-black px-6 py-4 bg-neo-yellow">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-neo-yellow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4" />
                  <path d="M4 6v12c0 1.1.9 2 2 2h14v-4" />
                  <path d="M18 12a2 2 0 0 0-2 2c0 1.1.9 2 2 2h4v-4h-4z" />
                </svg>
              </div>
              <div>
                <h2 className="font-black uppercase tracking-widest text-base leading-none">
                  Connect Wallet
                </h2>
                <p className="font-bold text-[10px] uppercase tracking-widest text-black/60 mt-0.5">
                  Choose your Injective wallet
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={!!isConnecting}
              className="w-8 h-8 border-[3px] border-black bg-white flex items-center justify-center font-black hover:bg-neo-orange transition-colors disabled:opacity-40"
            >
              ✕
            </button>
          </div>

          {/* Wallet List */}
          <div className="p-5 flex flex-col gap-3">
            {WALLETS.map((w) => {
              const isThisConnecting = isConnecting === w.id;
              return (
                <button
                  key={w.id}
                  onClick={() => connect(w.id)}
                  disabled={!!isConnecting}
                  className="flex items-center gap-4 w-full border-[3px] border-black bg-white px-4 py-3 shadow-[4px_4px_0px_0px_#000] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed text-left group"
                >
                  {/* Icon */}
                  <div className="shrink-0 border-2 border-black rounded overflow-hidden">
                    {w.icon}
                  </div>

                  {/* Label */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-black uppercase tracking-wider text-sm leading-none mb-0.5">
                        {w.label}
                      </p>
                      {w.recommended && (
                        <span className="bg-neo-lime border border-black px-1.5 py-0.5 font-black text-[7px] uppercase tracking-widest">
                          Recommended
                        </span>
                      )}
                    </div>
                    <p className="font-bold text-[10px] uppercase tracking-widest text-black/50 truncate">
                      {w.description}
                    </p>
                  </div>

                  {/* Status / Arrow */}
                  <div className="shrink-0">
                    {isThisConnecting ? (
                      <svg
                        className="w-5 h-5 animate-spin"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                      >
                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                      </svg>
                    ) : (
                      <svg
                        className="w-5 h-5 opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
                      </svg>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mx-5 mb-4 border-[3px] border-black bg-[#FF2A00] px-4 py-3 flex items-start gap-3">
              <svg className="w-4 h-4 mt-0.5 text-white shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              <p className="font-bold text-white text-xs uppercase tracking-wide leading-relaxed">
                {error}
              </p>
            </div>
          )}

          {/* Footer note */}
          <div className="border-t-4 border-black px-6 py-3 bg-white">
            <p className="font-bold text-[10px] uppercase tracking-widest text-black/50 text-center">
              Make sure your wallet extension is installed &amp; unlocked
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
