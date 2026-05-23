import { NextResponse } from "next/server";

const MARKET_TO_COINGECKO_ID: Record<string, { id: string, defaultPrice: number }> = {
  // INJ/USDT
  '0x0611780ba69656949525013d947713300f56c37b6175e02f26bffa495c3208fe': { id: 'injective-protocol', defaultPrice: 4.99 },
  // ATOM/USDT
  '0x491ee4fae7956dd72b6a97805046ffef65892e1d3254c559c18056a519b2ca15': { id: 'cosmos', defaultPrice: 2.01 },
  // WETH/USDT
  '0xa97182f11f1aa5339c7f4c3fe3cc1c69b39079f11b864c86d912956c5c2db75c': { id: 'ethereum', defaultPrice: 2121.63 },
  // SOL/USDT
  '0x2da41d4f7370e6d44240480bae530661ba3ae68682089810ea29beee1984985f': { id: 'solana', defaultPrice: 86.23 },
  // TIA/USDT
  '0xa283fc94a9055a01a58bb6229b1e56a8bb54069a0debfce7fbd1e6c25a95330c': { id: 'celestia', defaultPrice: 0.40 }
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const marketId = searchParams.get("marketId");

  if (!marketId) {
    return NextResponse.json({ error: "Missing marketId" }, { status: 400 });
  }

  const coin = MARKET_TO_COINGECKO_ID[marketId];
  if (!coin) {
    // If it's a custom market ID, return a default mock summary
    return NextResponse.json({
      market_id: marketId,
      price: "4.9900",
      price_24h_ago: "4.8500",
      volume: "154230.00"
    });
  }

  // Always return the static testnet seed price to prevent "price is not valid" deviation failures!
  const price = coin.defaultPrice;
  const change24h = 3.45;
  const price24hAgo = price / (1 + change24h / 100);

  return NextResponse.json({
    market_id: marketId,
    price: price.toFixed(4),
    price_24h_ago: price24hAgo.toFixed(4),
    volume: "154230.00"
  });
}
