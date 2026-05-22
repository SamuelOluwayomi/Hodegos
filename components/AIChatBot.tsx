"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import { useWallet } from "@/lib/useWallet";
import { useChat } from "@/hooks/useChat";
import { MsgCreateSpotMarketOrder, MsgCreateSpotLimitOrder, getDefaultSubaccountId, createTransaction, TxGrpcApi, BaseAccount, createTxRawFromSigResponse } from '@injectivelabs/sdk-ts';
import { Network, getNetworkEndpoints } from '@injectivelabs/networks';
import { ArrowClockwise, CheckCircle, HandWaving, X } from "@phosphor-icons/react";

// ── TYPES AND INTERFACES ──────────────────────────────────────────────────────

interface TxData {
  raw: string;
  side: 'buy' | 'sell' | null;
  amount: number;
  asset: string;
  price: string;
}

// Helper to parse transaction info from raw AI assistant text response
function parseTxBlock(content: string): TxData | null {
  const match = content.match(/\[TX\]([\s\S]*?)\[\/TX\]/);
  if (!match) return null;
  const rawTx = match[1];
  const sideMatch = rawTx.match(/side:\s*(buy|sell)/i);
  const amountMatch = rawTx.match(/amount:\s*([\d.]+)/i);
  const assetMatch = rawTx.match(/asset:\s*([a-zA-Z0-9]+)/i);
  const priceMatch = rawTx.match(/price:\s*(market|[\d.]+)/i);

  return {
    raw: match[0],
    side: sideMatch ? (sideMatch[1].toLowerCase() as 'buy' | 'sell') : null,
    amount: amountMatch ? parseFloat(amountMatch[1]) : 0,
    asset: assetMatch ? assetMatch[1].toUpperCase() : 'INJ',
    price: priceMatch ? priceMatch[1].trim() : 'market'
  };
}

// ── TRANSACTION COMPONENT ─────────────────────────────────────────────────────

function TransactionCard({ tx, address, wallet, msgTimestamp }: { tx: TxData; address: string; wallet: string | null; msgTimestamp?: number }) {
  // Load initial status from localStorage
  const getCachedData = () => {
    if (typeof window === "undefined" || !address) return null;
    const cacheKey = `hodegos_tx_status_${address}_${msgTimestamp || tx.raw.replace(/\s+/g, '')}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        // Only keep terminal states or failed states, reset in-progress to 'idle'
        if (parsed.status === 'success' || parsed.status === 'failed') {
          return parsed;
        }
      } catch (e) {
        console.error("Failed to parse cached transaction status:", e);
      }
    }

    // Fuzzy fallback: check for close timestamps (within 60 seconds)
    if (msgTimestamp) {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(`hodegos_tx_status_${address}_`)) {
          const suffix = key.replace(`hodegos_tx_status_${address}_`, '');
          const keyTime = parseInt(suffix, 10);
          if (!isNaN(keyTime) && Math.abs(keyTime - msgTimestamp) < 60000) {
            const val = localStorage.getItem(key);
            if (val) {
              try {
                const parsed = JSON.parse(val);
                if (parsed.status === 'success' || parsed.status === 'failed') {
                  // Migrate/duplicate to the current exact key
                  localStorage.setItem(cacheKey, val);
                  return parsed;
                }
              } catch (e) {}
            }
          }
        }
      }
    }
    return null;
  };

  const cachedData = getCachedData();
  const [status, setStatus] = useState<'idle' | 'signing' | 'broadcasting' | 'success' | 'failed'>(cachedData?.status || 'idle');
  const [txHash, setTxHash] = useState(cachedData?.txHash || '');
  const [error, setError] = useState(cachedData?.error || '');

  // Update localStorage when status changes
  useEffect(() => {
    if (typeof window === "undefined" || !address) return;
    const cacheKey = `hodegos_tx_status_${address}_${msgTimestamp || tx.raw.replace(/\s+/g, '')}`;
    if (status === 'success' || status === 'failed') {
      localStorage.setItem(cacheKey, JSON.stringify({ status, txHash, error }));
    } else {
      // For non-terminal states, remove cache so it defaults to idle on refresh if interrupted
      localStorage.removeItem(cacheKey);
    }
  }, [status, txHash, error, address, msgTimestamp, tx.raw]);


  const handleExecute = async () => {
    setStatus('signing');
    setError('');

    const totalCost = tx.amount * (tx.price.toLowerCase() === 'market' ? 4.99 : parseFloat(tx.price) || 4.99);
    const messageText = `HODEGOS AI TRANSACTION APPROVAL
---------------------------------
Action: ${tx.side?.toUpperCase()}
Amount: ${tx.amount} ${tx.asset}
Price: ${tx.price.toLowerCase() === 'market' ? 'Market Price' : `$${tx.price}`}
Estimated Total: $${totalCost.toFixed(2)} USDT

Wallet: ${address}
Timestamp: ${new Date().toISOString()}

Sign this message to authorize and execute this order on Hodegos Injective DEX.`;

    try {
      if (typeof window === "undefined") {
        throw new Error("Window object is not available.");
      }

      const anyWindow = window as any;

      if (wallet === "metamask") {
        throw new Error("MetaMask requires EIP712 strategy. Please use Keplr, Leap, or Ninji to execute on-chain testnet trades.");
      }

      const endpoints = getNetworkEndpoints(Network.Testnet);
      const accountRes = await fetch(`/api/account?address=${address}`);
      if (!accountRes.ok) throw new Error("Failed to fetch account details from testnet");
      const accountDetailsResponse = await accountRes.json();
      
      const baseAccount = BaseAccount.fromRestApi(accountDetailsResponse);

      // Map asset to market details
      const FEATURED_MARKET_IDS: Record<string, string> = {
        'INJ/USDT': '0x0611780ba69656949525013d947713300f56c37b6175e02f26bffa495c3208fe',
        'ATOM/USDT': '0x491ee4fae7956dd72b6a97805046ffef65892e1d3254c559c18056a519b2ca15',
        'WETH/USDT': '0xa97182f11f1aa5339c7f4c3fe3cc1c69b39079f11b864c86d912956c5c2db75c',
        'SOL/USDT': '0x2da41d4f7370e6d44240480bae530661ba3ae68682089810ea29beee1984985f',
        'TIA/USDT': '0xa283fc94a9055a01a58bb6229b1e56a8bb54069a0debfce7fbd1e6c25a95330c',
      };

      const DECIMALS_MAP: Record<string, number> = {
        INJ: 18,
        ATOM: 6,
        WETH: 18,
        SOL: 8,
        TIA: 6,
        USDT: 6,
      };

      const ticker = `${tx.asset}/USDT`;
      const marketId = FEATURED_MARKET_IDS[ticker];
      if (!marketId) throw new Error(`Market for ${ticker} is not supported on Hodegos.`);

      const baseDecimals = DECIMALS_MAP[tx.asset] || 18;
      const quoteDecimals = 6; // USDT

      // Fetch live price for slippage calculations
      let currentPrice = assetPriceMap[tx.asset] || 4.99;
      try {
        const priceRes = await fetch(`/api/markets/summary?marketId=${marketId}`);
        if (priceRes.ok) {
          const priceData = await priceRes.json();
          currentPrice = parseFloat(priceData.price) || currentPrice;
        }
      } catch (e) {
        console.warn("Could not fetch live price, using fallback:", e);
      }

      const isMarket = tx.price.toLowerCase() === 'market';
      const orderType = tx.side === 'buy' ? 1 : 2;

      // Quantity scaling (base decimals)
      const quantity = (BigInt(Math.floor(tx.amount * 1000000)) * BigInt(10 ** baseDecimals) / BigInt(1000000)).toString();

      // Price scaling
      let priceVal = currentPrice;
      if (!isMarket) {
        priceVal = parseFloat(tx.price) || currentPrice;
      }
      const scaledPrice = (priceVal * Math.pow(10, quoteDecimals - baseDecimals)).toFixed(18);
      const subaccountId = getDefaultSubaccountId(address);

      // We use MsgCreateSpotLimitOrder for all trades on testnet.
      // Since public testnet order books are empty (0 liquidity), standard Market Orders (MsgCreateSpotMarketOrder)
      // will fail. Placing a Limit Order acts as a maker order and successfully registers on-chain.
      const msg = MsgCreateSpotLimitOrder.fromJSON({
        subaccountId,
        injectiveAddress: address,
        orderType,
        price: scaledPrice,
        quantity,
        marketId,
        feeRecipient: address,
      });

      // 1. Resolve Public Key (Critical for new testnet accounts)
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

      const { signBytes, txRaw } = createTransaction({
        message: msg,
        memo: `Hodegos AI Execution: ${tx.side?.toUpperCase()} ${tx.amount} ${tx.asset} @ ${tx.price.toLowerCase() === 'market' ? 'Market' : tx.price}`,
        fee: {
          amount: [{ amount: '2000000000000000', denom: 'inj' }],
          gas: '200000',
        },
        pubKey: pubKey,
        sequence: baseAccount.sequence,
        accountNumber: baseAccount.accountNumber,
        chainId: 'injective-888',
      });

      let signatureResponse;
      const accNum = Number(baseAccount.accountNumber);
      const accNumObj = {
        low: accNum,
        high: 0,
        unsigned: true,
        toNumber: () => accNum,
        toString: () => accNum.toString()
      };

      if (wallet === "keplr") {
        if (!anyWindow.keplr) throw new Error("Keplr extension not found in browser.");
        signatureResponse = await anyWindow.keplr.signDirect('injective-888', address, {
          bodyBytes: txRaw.bodyBytes,
          authInfoBytes: txRaw.authInfoBytes,
          chainId: 'injective-888',
          accountNumber: accNumObj
        });
      } else if (wallet === "leap") {
        if (!anyWindow.leap) throw new Error("Leap extension not found in browser.");
        signatureResponse = await anyWindow.leap.signDirect('injective-888', address, {
          bodyBytes: txRaw.bodyBytes,
          authInfoBytes: txRaw.authInfoBytes,
          chainId: 'injective-888',
          accountNumber: accNumObj
        });
      } else if (wallet === "ninji") {
        if (!anyWindow.ninji) throw new Error("Ninji extension not found in browser.");
        signatureResponse = await anyWindow.ninji.signDirect('injective-888', address, {
          bodyBytes: txRaw.bodyBytes,
          authInfoBytes: txRaw.authInfoBytes,
          chainId: 'injective-888',
          accountNumber: accNumObj
        });
      }

      setStatus('broadcasting');
      
      // Use SDK helper to construct standard Cosmos TxRaw from DirectSignResponse
      const broadcastTxRaw = createTxRawFromSigResponse(signatureResponse);
      const txService = new TxGrpcApi(endpoints.grpc);
      const txResponse = await txService.broadcast(broadcastTxRaw);

      if (txResponse.code !== 0) {
        throw new Error(txResponse.rawLog || "Transaction failed to broadcast");
      }
      
      setTxHash(txResponse.txHash);
      setStatus('success');
      
      // Dispatch balance refresh
      window.dispatchEvent(new CustomEvent("refresh-balances"));
    } catch (err: any) {
      console.error("Wallet signing error:", err);
      setError(err.message || 'Signature rejected by user.');
      setStatus('failed');
    }
  };

  const assetPriceMap: Record<string, number> = {
    INJ: 4.99,
    USDT: 1.00,
    ATOM: 8.12,
    SOL: 143.50,
    TIA: 5.25,
    ETH: 3120.00,
  };

  const tokenPrice = assetPriceMap[tx.asset] || 4.99;
  const limitVal = tx.price.toLowerCase() === 'market' ? tokenPrice : parseFloat(tx.price) || tokenPrice;
  const totalCost = tx.amount * limitVal;

  return (
    <div className="border-[3px] border-black bg-[#FEFDF9] p-3.5 my-2.5 neo-shadow-sm flex flex-col gap-2.5 text-black">
      <div className="flex items-center justify-between">
        <span className={`border-2 border-black font-black uppercase text-[9px] px-2 py-0.5 ${
          tx.side === 'buy' ? 'bg-neo-lime' : 'bg-neo-orange'
        }`}>
          {tx.side === 'buy' ? 'Buy Order' : 'Sell Order'}
        </span>
        <span className="font-bold text-[9px] text-black/40 uppercase tracking-widest">
          Injective DEX
        </span>
      </div>

      <div className="flex flex-col gap-1 text-[11px] border-y-2 border-black/10 py-2">
        <div className="flex justify-between">
          <span className="font-bold text-black/50">Asset:</span>
          <span className="font-black">{tx.amount} {tx.asset}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-bold text-black/50">Execution Price:</span>
          <span className="font-black capitalize">{tx.price.toLowerCase() === 'market' ? 'Market price' : `$${parseFloat(tx.price).toFixed(2)}`}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-bold text-black/50">Estimated Cost:</span>
          <span className="font-black text-neo-lime bg-black px-1.5 py-0.5 border border-black">${totalCost.toFixed(2)} USDT</span>
        </div>
      </div>

      {status === 'idle' && (
        <button
          onClick={handleExecute}
          className="w-full py-2 bg-neo-yellow border-2 border-black font-black text-xs uppercase tracking-widest hover:bg-neo-lime active:translate-x-0.5 active:translate-y-0.5 transition-transform"
        >
          Sign & Execute Trade
        </button>
      )}

      {status === 'signing' && (
        <div className="w-full py-2 bg-[#EAE8E0] border-2 border-black text-center font-black text-xs uppercase tracking-widest animate-pulse flex items-center justify-center gap-2">
          <ArrowClockwise className="animate-spin animate-spin-slow" size={14} weight="bold" /> Requesting signature from wallet...
        </div>
      )}

      {status === 'broadcasting' && (
        <div className="w-full py-2 bg-[#EAE8E0] border-2 border-black text-center font-black text-xs uppercase tracking-widest animate-pulse flex items-center justify-center gap-2">
          <ArrowClockwise className="animate-spin" size={14} weight="bold" /> Broadcasting to Injective Ledger...
        </div>
      )}

      {status === 'success' && (
        <div className="flex flex-col gap-1.5">
          <div className="bg-neo-lime border-2 border-black p-2 text-center font-black text-xs uppercase tracking-widest flex items-center justify-center gap-1.5">
            Success! Trade Executed <CheckCircle size={14} weight="fill" />
          </div>
          <div className="text-[9px] text-black/40 font-bold uppercase tracking-wider text-center mt-0.5">
            Wallet signed & broadcasted successfully on Injective Testnet!
          </div>
          <a
            href={`https://testnet.explorer.injective.network/transaction/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[9px] font-black uppercase text-black/40 hover:text-black hover:underline tracking-widest break-all text-center"
          >
            Tx Hash: {txHash.slice(0, 10)}...{txHash.slice(-10)}
          </a>
        </div>
      )}

      {status === 'failed' && (
        <div className="flex flex-col gap-1.5">
          <div className="bg-neo-orange text-white border-2 border-black p-2 text-center font-black text-xs uppercase tracking-widest">
            Failed: {error}
          </div>
          <button
            onClick={handleExecute}
            className="w-full py-1.5 bg-neo-yellow border-2 border-black font-black text-[10px] uppercase tracking-widest"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}

// ── MAIN AIChatBot COMPONENT ──────────────────────────────────────────────────

const renderMarkdown = (text: string) => {
  if (!text) return null;
  const lines = text.split('\n');
  return lines.map((line, i) => {
    let isBullet = false;
    let cleanLine = line.trim();
    if (cleanLine.startsWith('***')) {
      isBullet = true;
      cleanLine = cleanLine.substring(1);
    } else if (cleanLine.startsWith('* ')) {
      isBullet = true;
      cleanLine = cleanLine.substring(2);
    } else if (cleanLine.startsWith('- ')) {
      isBullet = true;
      cleanLine = cleanLine.substring(2);
    }

    const parts = cleanLine.split(/(\*\*.*?\*\*)/g);
    const renderedParts = parts.map((part, j) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={j} className="font-black text-black">{part.slice(2, -2)}</strong>;
      }
      return <span key={j}>{part}</span>;
    });

    if (isBullet) {
      return (
        <div key={i} className="flex gap-2 mb-1.5 items-start">
          <span className="text-[12px] leading-none mt-1 font-black text-neo-lime drop-shadow-[1px_1px_0_rgba(0,0,0,1)]">•</span>
          <div className="flex-1 leading-relaxed">{renderedParts}</div>
        </div>
      );
    }
    if (cleanLine === '') {
      return <div key={i} className="h-2"></div>;
    }
    return <div key={i} className="mb-2 leading-relaxed last:mb-0">{renderedParts}</div>;
  });
};

export default function AIChatBot() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<"all" | "lessons" | "trades" | "advisor">("all");
  const { address, wallet, isInitialized, isConnected } = useWallet();
  
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const chatScrollRef = useRef<HTMLDivElement>(null);

  const {
    messages: chatMessages,
    isLoading: chatLoading,
    sendMessage: chatSend,
    profile,
    clearMessages,
  } = useChat(address || undefined);

  const currentUrl = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;

  // Automatically scroll chat container to latest message
  const scrollToBottom = () => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, isChatOpen, selectedCategory]);

  useEffect(() => {
    const handleOpenChat = (e: Event) => {
      const customEvent = e as CustomEvent<{ query: string }>;
      const query = customEvent.detail?.query;
      setIsChatOpen(true);
      if (query) {
        clearMessages();
        setTimeout(() => {
          chatSend(query, undefined, currentUrl);
        }, 50);
      }
    };
    window.addEventListener("open-hodegos-chat", handleOpenChat);
    return () => window.removeEventListener("open-hodegos-chat", handleOpenChat);
  }, [chatSend, clearMessages, currentUrl]);

  const handleChatSend = () => {
    const sanitized = chatInput.replace(/<[^>]*>?/gm, "").trim();
    if (!sanitized || chatLoading) return;
    chatSend(sanitized, undefined, currentUrl);
    setChatInput("");
  };

  const handleQuickAction = (actionText: string) => {
    if (chatLoading) return;
    chatSend(actionText, undefined, currentUrl);
  };

  // Helper to categorize messages dynamically
  const getMessageCategory = (msg: { content: string }): "lessons" | "trades" | "advisor" => {
    const text = msg.content.toLowerCase();
    if (text.includes("[mcq]") || text.includes("[explain]") || text.includes("quiz") || text.includes("lesson")) {
      return "lessons";
    }
    if (text.includes("[tx]") || text.includes("order") || text.includes("trade") || text.includes("usdt")) {
      return "trades";
    }
    return "advisor";
  };

  // Filter messages for display based on active tab
  const filteredMessages = chatMessages.filter((m) => {
    if (m.content.startsWith('[SYSTEM]')) return false;
    if (selectedCategory === "all") return true;
    return getMessageCategory(m) === selectedCategory;
  });

  if (!isInitialized || !isConnected || !address) return null;

  return (
    <>
      {isChatOpen ? (
        <div className="fixed bottom-6 right-6 z-50 w-80 sm:w-96 h-[520px] max-h-[85vh] flex flex-col bg-white border-4 border-black neo-shadow overflow-hidden">
          {/* Chat Header */}
          <div className="border-b-4 border-black bg-black text-white p-3 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2">
              <span className="font-black text-xs uppercase tracking-widest">Hodegos AI</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={clearMessages}
                title="New conversation"
                className="w-7 h-7 border-2 border-black bg-neo-yellow text-black flex items-center justify-center font-black text-xs hover:bg-neo-lime transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
              </button>
              <button
                onClick={() => setIsChatOpen(false)}
                title="Close chat"
                className="w-7 h-7 border-2 border-black bg-[#EAE8E0] text-black flex items-center justify-center hover:bg-neo-orange transition-colors"
              >
                <X size={12} weight="bold" />
              </button>
            </div>
          </div>

          {/* Categorized Filter Tabs */}
          <div className="grid grid-cols-4 border-b-4 border-black text-[8px] font-black uppercase text-center bg-[#EAE8E0] shrink-0">
            {(["all", "lessons", "trades", "advisor"] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`py-2 border-r-2 border-black last:border-r-0 transition-colors ${
                  selectedCategory === cat ? "bg-neo-yellow text-black" : "bg-white text-black/50 hover:bg-[#EAE8E0]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Chat Area */}
          <div 
            ref={chatScrollRef}
            className="flex-1 bg-[#EAE8E0] p-4 flex flex-col gap-4 overflow-auto custom-scrollbar" 
            id="dashboard-chat-scroll"
          >
            {filteredMessages.length === 0 && (
              <div className="flex flex-col gap-1 items-start">
                <span className="font-black text-[9px] uppercase tracking-widest text-black/40 ml-1">Hodegos AI</span>
                <div className="bg-white border-2 border-black p-3 text-xs font-bold rounded-xl rounded-tl-none neo-shadow-sm max-w-[90%]">
                  {selectedCategory === "all" && (
                    <>
                      <span className="flex items-center gap-1.5">Welcome{profile?.userName ? `, ${profile.userName}` : ''}! <HandWaving size={16} weight="fill" className="text-neo-yellow" /></span><br />
                      I can analyze markets, explain trading concepts, or help you execute trades on Injective. I also know what page you are currently viewing! What would you like to do?
                    </>
                  )}
                  {selectedCategory === "lessons" && "No quiz or lesson history found in this conversation yet. Ask me to teach you a trading topic to start!"}
                  {selectedCategory === "trades" && "No transaction details found in this session. Ask me to make a trade (e.g. 'buy 3 INJ') to see transaction controls here!"}
                  {selectedCategory === "advisor" && "General advisor history is empty. Ask me any question about trading pairs, orderbooks, or general crypto rules!"}
                </div>
              </div>
            )}

            {filteredMessages.map((msg, i) => {
              const tx = msg.role === 'assistant' ? parseTxBlock(msg.content) : null;
              const cleanText = tx ? msg.content.replace(tx.raw, '').trim() : msg.content;

              return (
                <div key={i} className={`flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <span className="font-black text-[9px] uppercase tracking-widest text-black/40 ml-1">
                    {msg.role === 'user' ? 'You' : 'Hodegos AI'}
                  </span>
                  <div
                    className={`p-3 text-xs font-bold max-w-[90%] border-2 border-black ${
                      msg.role === 'user'
                        ? 'bg-neo-lime rounded-xl rounded-tr-none neo-shadow-sm'
                        : 'bg-white rounded-xl rounded-tl-none neo-shadow-sm'
                    }`}
                  >
                    {msg.role === 'assistant' ? renderMarkdown(cleanText) : <span style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{cleanText}</span>}
                    {tx && <TransactionCard tx={tx} address={address} wallet={wallet} msgTimestamp={msg.timestamp} />}
                  </div>
                </div>
              );
            })}

            {chatLoading && (!filteredMessages.length || filteredMessages[filteredMessages.length - 1].role === 'user') && (
              <div className="flex flex-col gap-1 items-start animate-pulse">
                <span className="font-black text-[9px] uppercase tracking-widest text-black/40 ml-1">
                  Hodegos AI is thinking...
                </span>
                <div className="p-3 py-4 bg-white border-2 border-black rounded-xl rounded-tl-none neo-shadow-sm max-w-[90%] flex items-center justify-center gap-1.5 w-16">
                  <span className="w-2 h-2 bg-neo-lime border-[1.5px] border-black rounded-full animate-bounce drop-shadow-[1px_1px_0_rgba(0,0,0,1)]" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-neo-yellow border-[1.5px] border-black rounded-full animate-bounce drop-shadow-[1px_1px_0_rgba(0,0,0,1)]" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-neo-orange border-[1.5px] border-black rounded-full animate-bounce drop-shadow-[1px_1px_0_rgba(0,0,0,1)]" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}

            {chatMessages.filter(m => !m.content.startsWith('[SYSTEM]')).length === 0 && selectedCategory === "all" && (
              <div className="flex flex-wrap gap-2 mt-1">
                <button onClick={() => handleQuickAction("Tell me about buying INJ")} className="bg-neo-lime border-2 border-black px-2 py-1 font-black text-[9px] uppercase tracking-widest hover:translate-x-0.5 hover:translate-y-0.5 transition-transform shadow-[2px_2px_0px_0px_#000] hover:shadow-none">
                  Buy INJ
                </button>
                <button onClick={() => handleQuickAction("Explain what spot trading is")} className="bg-neo-orange border-2 border-black px-2 py-1 font-black text-[9px] uppercase tracking-widest hover:translate-x-0.5 hover:translate-y-0.5 transition-transform shadow-[2px_2px_0px_0px_#000] hover:shadow-none">
                  Explain Spot
                </button>
                <button onClick={() => handleQuickAction("Show me my portfolio summary")} className="bg-neo-yellow border-2 border-black px-2 py-1 font-black text-[9px] uppercase tracking-widest hover:translate-x-0.5 hover:translate-y-0.5 transition-transform shadow-[2px_2px_0px_0px_#000] hover:shadow-none">
                  My Portfolio
                </button>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t-4 border-black bg-white p-3 shrink-0">
            <div className="relative">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleChatSend()}
                placeholder="Ask Hodegos AI..."
                disabled={chatLoading}
                className="w-full bg-[#EAE8E0] border-[3px] border-black p-3 pr-12 font-bold text-xs outline-none focus:bg-white transition-colors disabled:opacity-50"
              />
              <button
                onClick={handleChatSend}
                disabled={chatLoading || !chatInput.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black text-white flex items-center justify-center hover:bg-neo-lime hover:text-black border-2 border-transparent hover:border-black transition-colors disabled:opacity-30"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsChatOpen(true)}
          title="Open Hodegos AI"
          className="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full border-4 border-black bg-neo-lime flex items-center justify-center neo-shadow hover:scale-105 transition-transform overflow-hidden"
        >
          <Image src="/hero-guide.png" alt="Bot" width={64} height={64} className="object-cover w-full h-full" />
        </button>
      )}
    </>
  );
}
