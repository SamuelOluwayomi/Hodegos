import { NextResponse } from "next/server";

// Exact on-chain denoms for Injective Testnet spot markets
const TOKEN_CONFIG: Record<string, { denom: string; decimals: number; coingeckoId: string; defaultPrice: number; name: string }> = {
  INJ: {
    denom: "inj",
    decimals: 18,
    coingeckoId: "injective-protocol",
    defaultPrice: 4.99,
    name: "Injective",
  },
  USDT: {
    denom: "peggy0x87aB3B4C8661e07D6372361211B96ed4Dc36B1B5",
    decimals: 6,
    coingeckoId: "tether",
    defaultPrice: 1.0,
    name: "Tether",
  },
  ATOM: {
    denom: "factory/inj17vytdwqczqz72j65saukplrktd4gyfme5agf6c/atom",
    decimals: 6,
    coingeckoId: "cosmos",
    defaultPrice: 2.01,
    name: "Cosmos",
  },
  WETH: {
    denom: "factory/inj17vytdwqczqz72j65saukplrktd4gyfme5agf6c/weth",
    decimals: 8,
    coingeckoId: "ethereum",
    defaultPrice: 2121.63,
    name: "Wrapped Ethereum",
  },
  SOL: {
    denom: "factory/inj1hdvy6tl89llqy3ze8lv6mz5qh66sx9enn0jxg6/inj12ngevx045zpvacus9s6anr258gkwpmthnz80e9",
    decimals: 8,
    coingeckoId: "solana",
    defaultPrice: 86.23,
    name: "Solana",
  },
  TIA: {
    denom: "factory/inj17vytdwqczqz72j65saukplrktd4gyfme5agf6c/tia",
    decimals: 6,
    coingeckoId: "celestia",
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
    // 2. Fetch live prices from CoinGecko (multi-coin in a single request)
    const coingeckoIds = [...new Set(Object.values(TOKEN_CONFIG).map(t => t.coingeckoId))].join(",");
    const prices: Record<string, number> = {};

    try {
      const priceRes = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${coingeckoIds}&vs_currencies=usd`,
        { next: { revalidate: 60 } }
      );
      if (priceRes.ok) {
        const priceData = await priceRes.json();
        for (const [symbol, config] of Object.entries(TOKEN_CONFIG)) {
          prices[symbol] = priceData[config.coingeckoId]?.usd ?? config.defaultPrice;
        }
      }
    } catch (err) {
      console.error("CoinGecko price fetch error, using fallbacks:", err);
    }

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
