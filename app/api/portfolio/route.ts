import { NextResponse } from "next/server";

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
    // 2. Fetch live INJ price from CoinGecko
    let injPrice = 4.98; // Fallback to current real-world price
    try {
      const priceRes = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=injective-protocol&vs_currencies=usd", {
        next: { revalidate: 60 } // Cache for 60 seconds
      });
      if (priceRes.ok) {
        const priceData = await priceRes.json();
        if (priceData["injective-protocol"]?.usd) {
          injPrice = priceData["injective-protocol"].usd;
        }
      }
    } catch (err) {
      console.error("CoinGecko price fetch error, using fallback:", err);
    }

    // 3. Process balances
    const injBal = balances.find((b: any) => b.denom === "inj");
    const injAmount = injBal ? parseFloat(injBal.amount) / 1e18 : 0;

    // Support both standard testnet USDT and possible user holdings denoms
    const usdtBal = balances.find((b: any) => b.denom === "peggy0x87aB3B4C8661e07D6372361211B96ed4Dc36B1B5");
    const usdtAmount = usdtBal ? parseFloat(usdtBal.amount) / 1e6 : 0;

    return NextResponse.json({
      injBalance: injAmount,
      usdtBalance: usdtAmount,
      injPrice,
      totalValue: injAmount * injPrice + usdtAmount,
      nodeError
    });
  } catch (error: any) {
    console.error("Error processing portfolio backend data:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
