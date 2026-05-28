"use client";

import { useState, useCallback, useEffect } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

export type WalletId = "keplr" | "leap" | "ninji" | "metamask";

export interface WalletState {
  address: string | null;
  wallet: WalletId | null;
  isConnected: boolean;
  isConnecting: WalletId | null;
  error: string | null;
  isInitialized: boolean;
}

const STORAGE_KEY = "hodegos_wallet";
const STORAGE_TYPE_KEY = "hodegos_wallet_type";
const CHAIN_ID = "injective-888"; // Injective testnet/devnet

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useWallet() {
  const [state, setState] = useState<WalletState>({
    address: null,
    wallet: null,
    isConnected: false,
    isConnecting: null,
    error: null,
    isInitialized: false,
  });

  // Restore persisted session on mount
  useEffect(() => {
    try {
      const addr = localStorage.getItem(STORAGE_KEY);
      const type = localStorage.getItem(STORAGE_TYPE_KEY) as WalletId | null;
      if (addr && type) {
        setState({
          address: addr,
          wallet: type,
          isConnected: true,
          isConnecting: null,
          error: null,
          isInitialized: true,
        });
      } else {
        setState((s) => ({ ...s, isInitialized: true }));
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STORAGE_TYPE_KEY);
      setState((s) => ({ ...s, isInitialized: true }));
    }
  }, []);

  // ── Cosmos-standard connect (Keplr, Leap, Ninji) ─────────────────────────

  const connectCosmos = useCallback(
    async (walletId: "keplr" | "leap" | "ninji") => {
      const providerMap: Record<string, unknown> = {
        keplr: typeof window !== "undefined" ? window.keplr : undefined,
        leap: typeof window !== "undefined" ? window.leap : undefined,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ninji: typeof window !== "undefined" ? (window as any).ninji : undefined,
      };

      const provider = providerMap[walletId] as
        | {
            enable: (chainId: string) => Promise<void>;
            getOfflineSigner: (
              chainId: string
            ) => { getAccounts: () => Promise<{ address: string }[]> };
          }
        | undefined;

      const downloadLinks: Record<string, string> = {
        keplr: "keplr.app",
        leap: "leapwallet.io",
        ninji: "ninji.xyz",
      };

      if (!provider) {
        let errorMsg = `${walletId.charAt(0).toUpperCase() + walletId.slice(1)} not detected.`;
        if (walletId === "ninji") {
          errorMsg = "Ninji not detected. If installed, please refresh the page, ensure it is unlocked, or check for browser conflicts (like Brave Shields or other active wallet extensions).";
        } else {
          errorMsg = `${walletId.charAt(0).toUpperCase() + walletId.slice(1)} not installed. Download at ${downloadLinks[walletId]}`;
        }
        setState((s) => ({
          ...s,
          error: errorMsg,
        }));
        return;
      }

      try {
        setState((s) => ({ ...s, isConnecting: walletId, error: null }));
        await provider.enable(CHAIN_ID);
        const offlineSigner = provider.getOfflineSigner(CHAIN_ID);
        const accounts = await offlineSigner.getAccounts();

        if (!accounts || accounts.length === 0) {
          throw new Error("No accounts found. Unlock your wallet and retry.");
        }

        localStorage.setItem(STORAGE_KEY, accounts[0].address);
        localStorage.setItem(STORAGE_TYPE_KEY, walletId);

        setState({
          address: accounts[0].address,
          wallet: walletId,
          isConnected: true,
          isConnecting: null,
          error: null,
          isInitialized: true,
        });
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Connection failed.";
        setState((s) => ({ ...s, isConnecting: null, error: message }));
      }
    },
    []
  );

  // ── MetaMask (EVM) ────────────────────────────────────────────────────────

  const connectMetamask = useCallback(async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      setState((s) => ({
        ...s,
        error: "MetaMask not installed. Download at metamask.io",
      }));
      return;
    }

    try {
      setState((s) => ({ ...s, isConnecting: "metamask", error: null }));
      const accounts = (await window.ethereum.request({
        method: "eth_requestAccounts",
      })) as string[];

      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts returned.");
      }

      localStorage.setItem(STORAGE_KEY, accounts[0]);
      localStorage.setItem(STORAGE_TYPE_KEY, "metamask");

      setState({
        address: accounts[0],
        wallet: "metamask",
        isConnected: true,
        isConnecting: null,
        error: null,
        isInitialized: true,
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Connection failed.";
      setState((s) => ({ ...s, isConnecting: null, error: message }));
    }
  }, []);

  // ── Unified connect dispatcher ────────────────────────────────────────────

  const connect = useCallback(
    async (walletId: WalletId) => {
      if (walletId === "metamask") {
        await connectMetamask();
      } else {
        await connectCosmos(walletId);
      }
    },
    [connectCosmos, connectMetamask]
  );

  // ── Disconnect ────────────────────────────────────────────────────────────

  const disconnect = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_TYPE_KEY);
    setState({
      address: null,
      wallet: null,
      isConnected: false,
      isConnecting: null,
      error: null,
      isInitialized: true,
    });
  }, []);

  // ── Utilities ─────────────────────────────────────────────────────────────

  const truncateAddress = (addr: string) =>
    `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  return {
    ...state,
    connect,
    disconnect,
    truncateAddress,
  };
}
