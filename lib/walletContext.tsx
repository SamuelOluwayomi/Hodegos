"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import { WalletStrategy } from "@injectivelabs/wallet-ts";
import { Wallet } from "@injectivelabs/wallet-ts";
import { ChainId } from "@injectivelabs/ts-types";

// ── Types ────────────────────────────────────────────────────────────────────

export interface WalletSession {
  wallet: Wallet;
  address: string;
}

interface WalletContextValue {
  session: WalletSession | null;
  connecting: Wallet | null;
  error: string | null;
  connect: (wallet: Wallet) => Promise<void>;
  disconnect: () => Promise<void>;
}

// ── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY = "hodegos_wallet_session";
const CHAIN_ID = ChainId.Mainnet; // "injective-1"

// ── Context ──────────────────────────────────────────────────────────────────

const WalletContext = createContext<WalletContextValue | null>(null);

// ── Provider ─────────────────────────────────────────────────────────────────

export function WalletProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<WalletSession | null>(null);
  const [connecting, setConnecting] = useState<Wallet | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Stable singleton — recreated only when wallet type changes
  const strategyRef = useRef<WalletStrategy | null>(null);

  const getStrategy = useCallback((wallet: Wallet): WalletStrategy => {
    if (!strategyRef.current) {
      strategyRef.current = new WalletStrategy({ chainId: CHAIN_ID });
    }
    strategyRef.current.setWallet(wallet);
    return strategyRef.current;
  }, []);

  // ── Restore session from localStorage on mount ──────────────────────────
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved: WalletSession = JSON.parse(raw);
        setSession(saved);
      }
    } catch {
      // Corrupted storage — ignore
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  // ── Connect ──────────────────────────────────────────────────────────────
  const connect = useCallback(
    async (wallet: Wallet) => {
      setError(null);
      setConnecting(wallet);
      try {
        const strategy = getStrategy(wallet);
        // enable() triggers the extension popup / QR code
        await strategy.enable();
        const addresses = await strategy.getAddresses();
        if (!addresses || addresses.length === 0) {
          throw new Error("No accounts found. Please unlock your wallet.");
        }
        const newSession: WalletSession = { wallet, address: addresses[0] };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newSession));
        setSession(newSession);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Connection failed.";
        setError(message);
      } finally {
        setConnecting(null);
      }
    },
    [getStrategy]
  );

  // ── Disconnect ───────────────────────────────────────────────────────────
  const disconnect = useCallback(async () => {
    try {
      if (strategyRef.current && session) {
        await strategyRef.current.disconnect();
      }
    } catch {
      // Best-effort — always clear local state
    } finally {
      localStorage.removeItem(STORAGE_KEY);
      strategyRef.current = null;
      setSession(null);
      setError(null);
    }
  }, [session]);

  return (
    <WalletContext.Provider value={{ session, connecting, error, connect, disconnect }}>
      {children}
    </WalletContext.Provider>
  );
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useWallet(): WalletContextValue {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used inside <WalletProvider>");
  return ctx;
}
