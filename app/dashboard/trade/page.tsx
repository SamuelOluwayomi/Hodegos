"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useWallet, WalletId } from "@/lib/useWallet";
import DashboardSidebar from "@/components/DashboardSidebar";
import AskHodegosButton from "@/components/AskHodegosButton";
import { FEATURED_MARKET_IDS, fetchMarketSummary } from "@/lib/injective";
import { MsgCreateSpotLimitOrder, getDefaultSubaccountId, createTransaction, TxGrpcApi, BaseAccount, createTxRawFromSigResponse } from '@injectivelabs/sdk-ts';
import { Network, getNetworkEndpoints } from '@injectivelabs/networks';
import { Lightning, X, ArrowClockwise, CheckCircle, Robot } from "@phosphor-icons/react";

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

const DECIMALS_MAP: Record<string, number> = {
  INJ: 18, ATOM: 6, WETH: 8, SOL: 8, TIA: 6, USDT: 6,
};

const ASSET_PRICE_DEFAULTS: Record<string, number> = {
  INJ: 4.99, USDT: 1.00, ATOM: 2.01, SOL: 86.23, TIA: 0.40, WETH: 2121.63,
};

// ── INLINE DIRECT EXECUTION COMPONENT ─────────────────────────────────────────

function DirectExecutionPanel({
  side, amount, baseAsset, price, orderType, address, wallet, onClose
}: {
  side: "buy" | "sell";
  amount: string;
  baseAsset: string;
  price: string;
  orderType: "market" | "limit";
  address: string;
  wallet: string | null;
  onClose: () => void;
}) {
  const [status, setStatus] = useState<'idle' | 'signing' | 'broadcasting' | 'success' | 'failed'>('idle');
  const [txHash, setTxHash] = useState('');
  const [error, setError] = useState('');

  const parsedAmount = parseFloat(amount) || 0;
  const parsedPrice = price.toLowerCase() === 'market'
    ? (ASSET_PRICE_DEFAULTS[baseAsset] || 4.99)
    : (parseFloat(price) || ASSET_PRICE_DEFAULTS[baseAsset] || 4.99);
  const totalCost = parsedAmount * parsedPrice;

  const handleExecute = async () => {
    setStatus('signing');
    setError('');

    try {
      if (typeof window === "undefined") throw new Error("Window object is not available.");
      const anyWindow = window as any;

      if (wallet === "metamask") {
        throw new Error("MetaMask requires EIP712 strategy. Please use Keplr, Leap, or Ninji.");
      }

      const endpoints = getNetworkEndpoints(Network.Testnet);
      const accountRes = await fetch(`/api/account?address=${address}`);
      if (!accountRes.ok) throw new Error("Failed to fetch account details from testnet");
      const accountDetailsResponse = await accountRes.json();
      const baseAccount = BaseAccount.fromRestApi(accountDetailsResponse);

      const ticker = `${baseAsset}/USDT`;
      const marketId = FEATURED_MARKET_IDS[ticker];
      if (!marketId) throw new Error(`Market for ${ticker} is not supported.`);

      const baseDecimals = DECIMALS_MAP[baseAsset] || 18;
      const quoteDecimals = 6;

      let currentPrice = parsedPrice;
      try {
        const priceRes = await fetch(`/api/markets/summary?marketId=${marketId}`);
        if (priceRes.ok) {
          const priceData = await priceRes.json();
          currentPrice = parseFloat(priceData.price) || currentPrice;
        }
      } catch (e) {
        console.warn("Could not fetch live price, using fallback:", e);
      }

      const isMarket = price.toLowerCase() === 'market';
      const orderTypeNum = side === 'buy' ? 1 : 2;

      const quantity = (BigInt(Math.floor(parsedAmount * 1000000)) * BigInt(10 ** baseDecimals) / BigInt(1000000)).toString();

      let priceVal = currentPrice;
      if (!isMarket) {
        priceVal = parseFloat(price) || currentPrice;
      }
      const scaledPrice = (priceVal * Math.pow(10, quoteDecimals - baseDecimals)).toFixed(18);
      const subaccountId = getDefaultSubaccountId(address);

      const msg = MsgCreateSpotLimitOrder.fromJSON({
        subaccountId,
        injectiveAddress: address,
        orderType: orderTypeNum,
        price: scaledPrice,
        quantity,
        marketId,
        feeRecipient: address,
      });

      let pubKey = "";
      if (baseAccount.pubKey && baseAccount.pubKey.key) {
        pubKey = baseAccount.pubKey.key;
      } else {
        let keyInfo;
        if (wallet === "keplr" && anyWindow.keplr) {
          keyInfo = await anyWindow.keplr.getKey('injective-888');
        } else if (wallet === "leap" && anyWindow.leap) {
          keyInfo = await anyWindow.leap.getKey('injective-888');
        } else if (wallet === "ninji" && anyWindow.ninji) {
          keyInfo = await anyWindow.ninji.getKey('injective-888');
        }
        if (keyInfo && keyInfo.pubKey) {
          const binary = Array.from(keyInfo.pubKey).map((b: any) => String.fromCharCode(b)).join('');
          pubKey = window.btoa(binary);
        }
      }

      const { txRaw } = createTransaction({
        message: msg,
        memo: `Hodegos Direct: ${side.toUpperCase()} ${parsedAmount} ${baseAsset} @ ${isMarket ? 'Market' : price}`,
        fee: {
          amount: [{ amount: '2000000000000000', denom: 'inj' }],
          gas: '200000',
        },
        pubKey,
        sequence: baseAccount.sequence,
        accountNumber: baseAccount.accountNumber,
        chainId: 'injective-888',
      });

      let signatureResponse;
      const accNum = Number(baseAccount.accountNumber);
      const accNumObj = {
        low: accNum, high: 0, unsigned: true,
        toNumber: () => accNum, toString: () => accNum.toString()
      };

      const signDoc = {
        bodyBytes: txRaw.bodyBytes,
        authInfoBytes: txRaw.authInfoBytes,
        chainId: 'injective-888',
        accountNumber: accNumObj
      };

      if (wallet === "keplr") {
        if (!anyWindow.keplr) throw new Error("Keplr extension not found.");
        signatureResponse = await anyWindow.keplr.signDirect('injective-888', address, signDoc);
      } else if (wallet === "leap") {
        if (!anyWindow.leap) throw new Error("Leap extension not found.");
        signatureResponse = await anyWindow.leap.signDirect('injective-888', address, signDoc);
      } else if (wallet === "ninji") {
        if (!anyWindow.ninji) throw new Error("Ninji extension not found.");
        signatureResponse = await anyWindow.ninji.signDirect('injective-888', address, signDoc);
      }

      setStatus('broadcasting');

      const broadcastTxRaw = createTxRawFromSigResponse(signatureResponse);
      const txService = new TxGrpcApi(endpoints.grpc);
      const txResponse = await txService.broadcast(broadcastTxRaw);

      if (txResponse.code !== 0) {
        throw new Error(txResponse.rawLog || "Transaction failed to broadcast");
      }

      setTxHash(txResponse.txHash);
      setStatus('success');
      window.dispatchEvent(new CustomEvent("refresh-balances"));
    } catch (err: any) {
      console.error("Direct execution error:", err);
      setError(err.message || 'Transaction failed.');
      setStatus('failed');
    }
  };

  return (
    <div className="border-4 border-black bg-[#FEFDF9] p-5 neo-shadow animate-fadeIn">
      <div className="flex items-center justify-between mb-4">
        <span className={`border-2 border-black font-black uppercase text-[10px] px-2.5 py-1 flex items-center gap-1 ${side === 'buy' ? 'bg-neo-lime' : 'bg-neo-orange'}`}>
          <Lightning size={12} weight="fill" /> Direct {side === 'buy' ? 'Buy' : 'Sell'} Order
        </span>
        <button onClick={onClose} className="w-7 h-7 border-2 border-black bg-[#EAE8E0] flex items-center justify-center hover:bg-neo-orange transition-colors">
          <X size={10} weight="bold" />
        </button>
      </div>

      <div className="flex flex-col gap-2 text-xs border-y-[3px] border-black/10 py-3 mb-4">
        <div className="flex justify-between">
          <span className="font-bold text-black/50">Asset:</span>
          <span className="font-black">{parsedAmount} {baseAsset}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-bold text-black/50">Execution Price:</span>
          <span className="font-black capitalize">{price.toLowerCase() === 'market' ? 'Market price' : `$${parsedPrice.toFixed(2)}`}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-bold text-black/50">Estimated Total:</span>
          <span className="font-black text-neo-lime bg-black px-1.5 py-0.5 border border-black">${totalCost.toFixed(2)} USDT</span>
        </div>
      </div>

      {status === 'idle' && (
        <button
          onClick={handleExecute}
          className={`w-full py-3 border-[3px] border-black font-black text-xs uppercase tracking-widest shadow-[3px_3px_0px_0px_#000] hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-all ${side === 'buy' ? 'bg-neo-lime' : 'bg-neo-orange'}`}
        >
          Sign & Execute with Wallet
        </button>
      )}

      {status === 'signing' && (
        <div className="w-full py-3 bg-[#EAE8E0] border-[3px] border-black text-center font-black text-xs uppercase tracking-widest animate-pulse flex items-center justify-center gap-2">
          <ArrowClockwise size={14} weight="bold" className="animate-spin" /> Requesting wallet signature...
        </div>
      )}

      {status === 'broadcasting' && (
        <div className="w-full py-3 bg-[#EAE8E0] border-[3px] border-black text-center font-black text-xs uppercase tracking-widest animate-pulse flex items-center justify-center gap-2">
          <ArrowClockwise size={14} weight="bold" className="animate-spin" /> Broadcasting to Injective...
        </div>
      )}

      {status === 'success' && (
        <div className="flex flex-col gap-2">
          <div className="bg-neo-lime border-[3px] border-black p-3 text-center font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2">
            <CheckCircle size={16} weight="fill" /> Trade Executed Successfully!
          </div>
          <a
            href={`https://testnet.explorer.injective.network/transaction/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[9px] font-black uppercase text-black/40 hover:text-black hover:underline tracking-widest break-all text-center"
          >
            Tx: {txHash.slice(0, 12)}...{txHash.slice(-12)}
          </a>
          <button onClick={onClose} className="w-full py-2 bg-black text-white border-[3px] border-black font-black text-[10px] uppercase tracking-widest hover:bg-neo-lime hover:text-black transition-colors">
            Done
          </button>
        </div>
      )}

      {status === 'failed' && (
        <div className="flex flex-col gap-2">
          <div className="bg-neo-orange text-white border-[3px] border-black p-3 text-center font-black text-[10px] uppercase tracking-widest">
            Failed: {error}
          </div>
          <div className="flex gap-2">
            <button onClick={handleExecute} className="flex-1 py-2 bg-neo-yellow border-[3px] border-black font-black text-[10px] uppercase tracking-widest">
              Retry
            </button>
            <button onClick={onClose} className="flex-1 py-2 bg-[#EAE8E0] border-[3px] border-black font-black text-[10px] uppercase tracking-widest">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── EXECUTION CHOICE MODAL ─────────────────────────────────────────────────────

function ExecutionChoiceModal({
  side, amount, baseAsset, price, orderType, address, wallet, onClose
}: {
  side: "buy" | "sell";
  amount: string;
  baseAsset: string;
  price: string;
  orderType: "market" | "limit";
  address: string;
  wallet: string | null;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<"choose" | "direct">("choose");

  const handleAIAdvice = () => {
    const query = `Provide real-time advice for a ${side.toUpperCase()} order of ${amount} ${baseAsset} on Injective. Type: ${orderType}. ${orderType === 'limit' ? `Price: $${price}` : `Price: Market price`}. What are the risks, technical details, or tips I should keep in mind?`;
    window.dispatchEvent(new CustomEvent("open-hodegos-chat", { detail: { query } }));
    onClose();
  };

  if (mode === "direct") {
    return (
      <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="w-full max-w-md mx-4 animate-slideUp">
          <DirectExecutionPanel
            side={side}
            amount={amount}
            baseAsset={baseAsset}
            price={orderType === "limit" ? price : "market"}
            orderType={orderType}
            address={address}
            wallet={wallet}
            onClose={onClose}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-md mx-4 animate-slideUp">
        <div className="border-4 border-black bg-[#FEFDF9] neo-shadow overflow-hidden">
          {/* Modal header */}
          <div className="bg-black text-white p-4 flex items-center justify-between">
            <div>
              <div className="font-black text-xs uppercase tracking-widest">Execute Trade</div>
              <div className="font-bold text-[9px] text-white/50 uppercase tracking-wider mt-0.5">
                {side.toUpperCase()} {amount} {baseAsset}
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 border-2 border-white/30 flex items-center justify-center text-white hover:bg-white/20 transition-colors">
              <X size={14} weight="bold" />
            </button>
          </div>

          {/* Order summary */}
          <div className="border-b-4 border-black bg-[#EAE8E0] p-4">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 border-2 border-black ${side === 'buy' ? 'bg-neo-lime' : 'bg-neo-orange'}`} />
                <span className="font-black uppercase">{side} {amount} {baseAsset}</span>
              </div>
              <span className="font-bold text-black/50">
                {orderType === 'limit' ? `@ $${price}` : '@ Market'}
              </span>
            </div>
          </div>

          {/* Choice buttons */}
          <div className="p-5 flex flex-col gap-3">
            <div className="font-black text-[9px] uppercase tracking-widest text-black/40 mb-1">How would you like to proceed?</div>

            {/* AI Advice option */}
            <button
              onClick={handleAIAdvice}
              className="group w-full p-4 border-[3px] border-black bg-white hover:bg-neo-yellow transition-all shadow-[3px_3px_0px_0px_#000] hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none text-left"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-neo-yellow border-2 border-black flex items-center justify-center shrink-0 group-hover:bg-white transition-colors">
                  <Robot size={20} weight="fill" />
                </div>
                <div>
                  <div className="font-black text-sm uppercase tracking-wider">Ask AI for Smart Advice</div>
                  <div className="font-bold text-[10px] text-black/50 mt-1 leading-relaxed">
                    Get Hodegos AI analysis on risks, timing, and optimal strategy before executing
                  </div>
                </div>
              </div>
            </button>

            {/* Direct execution option */}
            <button
              onClick={() => setMode("direct")}
              className="group w-full p-4 border-[3px] border-black bg-white hover:bg-neo-lime transition-all shadow-[3px_3px_0px_0px_#000] hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none text-left"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-neo-lime border-2 border-black flex items-center justify-center shrink-0 group-hover:bg-white transition-colors">
                  <Lightning size={20} weight="fill" />
                </div>
                <div>
                  <div className="font-black text-sm uppercase tracking-wider">Execute Trade Directly</div>
                  <div className="font-bold text-[10px] text-black/50 mt-1 leading-relaxed">
                    Sign and broadcast immediately via your wallet — skip the AI
                  </div>
                </div>
              </div>
            </button>

            <div className="text-center font-bold text-[8px] text-black/30 uppercase tracking-widest mt-1">
              Powered by Injective Protocol DEX • On-Chain Execution
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── MAIN TRADE CONTENT ────────────────────────────────────────────────────────

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
  const [showModal, setShowModal] = useState(false);

  // Multi-coin balances
  const [tokenBalances, setTokenBalances] = useState<Record<string, { amount: number; price: number; value: number; name: string }>>({
    INJ: { amount: 0, price: 4.99, value: 0, name: "Injective" },
    USDT: { amount: 0, price: 1.0, value: 0, name: "Tether" },
    ATOM: { amount: 0, price: 2.01, value: 0, name: "Cosmos" },
    WETH: { amount: 0, price: 2121.63, value: 0, name: "Wrapped Ethereum" },
    SOL: { amount: 0, price: 86.23, value: 0, name: "Solana" },
    TIA: { amount: 0, price: 0.40, value: 0, name: "Celestia" },
  });

  useEffect(() => {
    if (!address) return;
    const fetchBalances = async () => {
      try {
        const res = await fetch(`/api/portfolio?address=${address}`);
        if (res.ok) {
          const data = await res.json();
          if (!data.nodeError && data.tokenBalances) {
            setTokenBalances(data.tokenBalances);
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

  // Use real fetched balances for all coins
  const baseBalance = tokenBalances[baseAsset]?.amount ?? 0;
  const usdtBalance = tokenBalances.USDT?.amount ?? 0;

  const handlePercentClick = (percent: number) => {
    if (side === "buy") {
      if (effectivePrice <= 0) return;
      const maxBuy = usdtBalance / effectivePrice;
      setAmount((maxBuy * percent).toFixed(4));
    } else {
      setAmount((baseBalance * percent).toFixed(4));
    }
  };

  const currentBalance = side === "buy"
    ? `${usdtBalance.toFixed(2)} USDT`
    : `${baseBalance.toFixed(4)} ${baseAsset}`;

  const handleTradeClick = () => {
    if (!amount || Number(amount) <= 0) {
      alert("Please enter a valid amount to trade.");
      return;
    }
    setShowModal(true);
  };

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

                  {/* Submit — opens choice modal */}
                  <button
                    className={`w-full py-4 font-black text-sm uppercase tracking-widest border-[3px] border-black shadow-[4px_4px_0px_0px_#000] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all ${
                      side === "buy" ? "bg-neo-lime" : "bg-neo-orange"
                    }`}
                    onClick={handleTradeClick}
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

      {/* Execution Choice Modal */}
      {showModal && (
        <ExecutionChoiceModal
          side={side}
          amount={amount}
          baseAsset={baseAsset}
          price={orderType === "limit" ? limitPrice : livePrice.toString()}
          orderType={orderType}
          address={address}
          wallet={wallet}
          onClose={() => setShowModal(false)}
        />
      )}

      {/* Animations */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(24px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
        .animate-slideUp { animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
      `}</style>
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
