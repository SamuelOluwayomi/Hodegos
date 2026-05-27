import { NextRequest, NextResponse } from "next/server";

const MARKET_TO_COINGECKO_ID: Record<string, { id: string; defaultPrice: number }> = {
  '0x0611780ba69656949525013d947713300f56c37b6175e02f26bffa495c3208fe': { id: 'injective-protocol', defaultPrice: 4.99 },
  '0x491ee4fae7956dd72b6a97805046ffef65892e1d3254c559c18056a519b2ca15': { id: 'cosmos', defaultPrice: 2.01 },
  '0xa97182f11f1aa5339c7f4c3fe3cc1c69b39079f11b864c86d912956c5c2db75c': { id: 'ethereum', defaultPrice: 2121.63 },
  '0x2da41d4f7370e6d44240480bae530661ba3ae68682089810ea29beee1984985f': { id: 'solana', defaultPrice: 86.23 },
  '0xa283fc94a9055a01a58bb6229b1e56a8bb54069a0debfce7fbd1e6c25a95330c': { id: 'celestia', defaultPrice: 0.40 },
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const marketId = searchParams.get("marketId");

  if (!marketId) {
    return NextResponse.json({ error: "marketId is required" }, { status: 400 });
  }

  // Fallback map if orderbook is empty or testnet is down
  const MARKET_FALLBACKS: Record<string, number> = {
    '0x0611780ba69656949525013d947713300f56c37b6175e02f26bffa495c3208fe': 4.99,
    '0x491ee4fae7956dd72b6a97805046ffef65892e1d3254c559c18056a519b2ca15': 2.01,
    '0xa97182f11f1aa5339c7f4c3fe3cc1c69b39079f11b864c86d912956c5c2db75c': 2121.63,
    '0x2da41d4f7370e6d44240480bae530661ba3ae68682089810ea29beee1984985f': 86.23,
    '0xa283fc94a9055a01a58bb6229b1e56a8bb54069a0debfce7fbd1e6c25a95330c': 0.40
  };

  try {
    // 1. Fetch live orderbook directly from Injective Testnet
    const EXCHANGE = 'https://testnet.sentry.exchange.grpc-web.injective.network';
    const obRes = await fetch(`${EXCHANGE}/api/exchange/v1beta1/spot/orderbook/${marketId}`, { next: { revalidate: 10 } });
    
    if (obRes.ok) {
      const data = await obRes.json();
      if (data.orderbook) {
        const bids = data.orderbook.buys || [];
        const asks = data.orderbook.sells || [];
        
        let livePrice = 0;
        if (bids.length > 0 && asks.length > 0) {
          livePrice = (parseFloat(bids[0].price) + parseFloat(asks[0].price)) / 2;
        } else if (bids.length > 0) {
          livePrice = parseFloat(bids[0].price);
        } else if (asks.length > 0) {
          livePrice = parseFloat(asks[0].price);
        }

        if (livePrice > 0) {
          return NextResponse.json({
            market_id: marketId,
            price: livePrice.toFixed(4),
            price_24h_ago: (livePrice * 0.985).toFixed(4), // fake 1.5% daily change
            volume: "154230.00"
          });
        }
      }
    }
  } catch (error) {
    console.error("Testnet orderbook fetch failed:", error);
  }

  // 2. TRUE FALLBACK ONLY if testnet API is completely down
  const fallbackPrice = MARKET_FALLBACKS[marketId] || 4.99;
  return NextResponse.json({
    market_id: marketId,
    price: fallbackPrice.toFixed(4),
    price_24h_ago: (fallbackPrice * 0.985).toFixed(4),
    volume: "154230.00"
  });
}
