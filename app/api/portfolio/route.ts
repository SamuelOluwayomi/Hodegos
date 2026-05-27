import { NextResponse } from "next/server";

// Exact on-chain denoms for Injective Testnet spot markets
const TOKEN_CONFIG: Record<string, { denom: string; decimals: number; marketId: string; defaultPrice: number; name: string }> = {
  INJ: {
    denom: "inj",
    decimals: 18,
    marketId: "0x0611780ba69656949525013d947713300f56c37b6175e02f26bffa495c3208fe",
    defaultPrice: 4.99,
    name: "Injective",
  },
  USDT: {
    denom: "peggy0x87aB3B4C8661e07D6372361211B96ed4Dc36B1B5",
    decimals: 6,
    marketId: "",
    defaultPrice: 1.0,
    name: "Tether",
  },
  ATOM: {
    denom: "factory/inj17vytdwqczqz72j65saukplrktd4gyfme5agf6c/atom",
    decimals: 6,
    marketId: "0x491ee4fae7956dd72b6a97805046ffef65892e1d3254c559c18056a519b2ca15",
    defaultPrice: 2.01,
    name: "Cosmos",
  },
  WETH: {
    denom: "factory/inj17vytdwqczqz72j65saukplrktd4gyfme5agf6c/weth",
    decimals: 18,
    marketId: "0xa97182f11f1aa5339c7f4c3fe3cc1c69b39079f11b864c86d912956c5c2db75c",
    defaultPrice: 2121.63,
    name: "Wrapped Ethereum",
  },
  SOL: {
    denom: "factory/inj1hdvy6tl89llqy3ze8lv6mz5qh66sx9enn0jxg6/inj12ngevx045zpvacus9s6anr258gkwpmthnz80e9",
    decimals: 8,
    marketId: "0x2da41d4f7370e6d44240480bae530661ba3ae68682089810ea29beee1984985f",
    defaultPrice: 86.23,
    name: "Solana",
  },
  TIA: {
    denom: "factory/inj17vytdwqczqz72j65saukplrktd4gyfme5agf6c/tia",
    decimals: 6,
    marketId: "0xa283fc94a9055a01a58bb6229b1e56a8bb54069a0debfce7fbd1e6c25a95330c",
    defaultPrice: 0.40,
    name: "Celestia",
  },
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address");

  if (!address) {
    return NextResponse.json({ error: "Missing address" }, { status: 400 });
  }

  let balances: any[] = [];
  let nodeError = false;

  try {
    // 1. Fetch bank balances with a 5-second timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    let balancesRes;
    try {
      balancesRes = await fetch(
        `https://testnet.sentry.lcd.injective.network/cosmos/bank/v1beta1/balances/${address}`,
        { signal: controller.signal }
      );
    } finally {
      clearTimeout(timeoutId);
    }

    if (balancesRes && balancesRes.ok) {
      const data = await balancesRes.json();
      balances = data.balances || [];
    } else {
      console.warn(`Injective LCD node returned status ${balancesRes?.status || "unknown"}. Using fallback.`);
      nodeError = true;
    }
  } catch (err) {
    console.warn("Injective LCD node fetch error, continuing with fallback:", err);
    nodeError = true;
  }

  try {
    // 2. Fetch live prices from Injective Testnet Orderbooks
    const prices: Record<string, number> = {};
    const EXCHANGE = 'https://testnet.sentry.exchange.grpc-web.injective.network';

    await Promise.all(Object.entries(TOKEN_CONFIG).map(async ([symbol, config]) => {
      if (symbol === "USDT" || !config.marketId) {
        prices[symbol] = 1.0;
        return;
      }
      try {
        const obRes = await fetch(`${EXCHANGE}/api/exchange/v1beta1/spot/orderbook/${config.marketId}`, { next: { revalidate: 10 } });
        if (obRes.ok) {
          const data = await obRes.json();
          if (data.orderbook) {
            const bids = data.orderbook.buys || [];
            const asks = data.orderbook.sells || [];
            
            let price = 0;
            if (bids.length > 0 && asks.length > 0) {
              price = (parseFloat(bids[0].price) + parseFloat(asks[0].price)) / 2;
            } else if (bids.length > 0) {
              price = parseFloat(bids[0].price);
            } else if (asks.length > 0) {
              price = parseFloat(asks[0].price);
            }
            if (price > 0) prices[symbol] = price;
          }
        }
      } catch (err) {
        console.error(`Testnet price fetch error for ${symbol}:`, err);
      }
    }));

    // Fill any missing prices with defaults
    for (const [symbol, config] of Object.entries(TOKEN_CONFIG)) {
      if (!prices[symbol]) {
        prices[symbol] = config.defaultPrice;
      }
    }

    // 3. Process balances for all tokens
    const tokenBalances: Record<string, { amount: number; price: number; value: number; name: string }> = {};
    let totalValue = 0;

    for (const [symbol, config] of Object.entries(TOKEN_CONFIG)) {
      const bal = balances.find((b: any) => b.denom === config.denom);
      const amount = bal ? parseFloat(bal.amount) / Math.pow(10, config.decimals) : 0;
      const price = prices[symbol];
      const value = symbol === "USDT" ? amount : amount * price;

      tokenBalances[symbol] = {
        amount,
        price,
        value,
        name: config.name,
      };
      totalValue += value;
    }

    // 4. Return expanded response (backward compatible)
    return NextResponse.json({
      // Legacy fields for backward compatibility
      injBalance: tokenBalances.INJ.amount,
      usdtBalance: tokenBalances.USDT.amount,
      injPrice: prices.INJ,
      totalValue,
      nodeError,
      // New expanded balances object
      tokenBalances,
      prices,
    });
  } catch (error: any) {
    console.error("Error processing portfolio backend data:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
