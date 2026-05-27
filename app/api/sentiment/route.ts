import Groq from 'groq-sdk'
import { NextResponse } from 'next/server'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY?.trim(),
})

export async function GET() {
  if (!process.env.GROQ_API_KEY) {
    // Fallback if no key is provided
    return NextResponse.json({
      "INJ": { sentiment: "Bullish", score: 85, reason: "Strong on-chain activity and staking growth." },
      "ATOM": { sentiment: "Neutral", score: 50, reason: "Consolidation within the Cosmos ecosystem." },
      "WETH": { sentiment: "Bullish", score: 72, reason: "Increasing ETH ETF inflows and stable gas fees." },
      "SOL": { sentiment: "Bullish", score: 90, reason: "High DEX volume and meme-coin speculation driving transactions." },
      "TIA": { sentiment: "Bearish", score: 35, reason: "Recent token unlocks creating short-term sell pressure." }
    });
  }

  try {
    let prices = { INJ: 4.99, ATOM: 2.01, WETH: 2121.63, SOL: 86.23, TIA: 0.40 };
    try {
      const EXCHANGE = 'https://testnet.sentry.exchange.grpc-web.injective.network';
      const markets = [
        { id: '0x0611780ba69656949525013d947713300f56c37b6175e02f26bffa495c3208fe', setter: (p: number) => prices.INJ = p },
        { id: '0x491ee4fae7956dd72b6a97805046ffef65892e1d3254c559c18056a519b2ca15', setter: (p: number) => prices.ATOM = p },
        { id: '0xa97182f11f1aa5339c7f4c3fe3cc1c69b39079f11b864c86d912956c5c2db75c', setter: (p: number) => prices.WETH = p },
        { id: '0x2da41d4f7370e6d44240480bae530661ba3ae68682089810ea29beee1984985f', setter: (p: number) => prices.SOL = p },
        { id: '0xa283fc94a9055a01a58bb6229b1e56a8bb54069a0debfce7fbd1e6c25a95330c', setter: (p: number) => prices.TIA = p }
      ];

      await Promise.all(markets.map(async (m) => {
        try {
          const res = await fetch(`${EXCHANGE}/api/exchange/v1beta1/spot/orderbook/${m.id}`, { next: { revalidate: 10 } });
          if (res.ok) {
            const data = await res.json();
            if (data.orderbook) {
              const bids = data.orderbook.buys || [];
              const asks = data.orderbook.sells || [];
              let p = 0;
              if (bids.length > 0 && asks.length > 0) p = (parseFloat(bids[0].price) + parseFloat(asks[0].price)) / 2;
              else if (bids.length > 0) p = parseFloat(bids[0].price);
              else if (asks.length > 0) p = parseFloat(asks[0].price);
              if (p > 0) m.setter(p);
            }
          }
        } catch (e) { /* ignore individual failures */ }
      }));
    } catch (e) {
      console.warn("Sentiment fetch price warning:", e);
    }

    const prompt = `Analyze the current AI market sentiment for the following crypto assets on Injective Testnet:
- INJ ($${prices.INJ})
- ATOM ($${prices.ATOM})
- WETH ($${prices.WETH})
- SOL ($${prices.SOL})
- TIA ($${prices.TIA})

Provide a structured JSON output with the exact keys "INJ", "ATOM", "WETH", "SOL", "TIA". 
Each asset should have:
1. "sentiment": either "Bullish", "Bearish", or "Neutral"
2. "score": a number from 0 (extremely bearish) to 100 (extremely bullish)
3. "reason": a one-sentence, concise explanation of the sentiment based on price/market behavior. Keep it within 15 words.

Example response:
{
  "INJ": {
    "sentiment": "Bullish",
    "score": 82,
    "reason": "Strong network metrics and high developer utility support price expansion."
  }
}
Do not output any introductory or concluding text, only the JSON block.`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" }
    });

    const content = chatCompletion.choices[0]?.message?.content;
    if (content) {
      const parsed = JSON.parse(content);
      return NextResponse.json(parsed);
    }
  } catch (error) {
    console.error("Error generating AI sentiment:", error);
  }

  // Final fallback
  return NextResponse.json({
    "INJ": { sentiment: "Bullish", score: 85, reason: "Strong on-chain activity and staking growth." },
    "ATOM": { sentiment: "Neutral", score: 50, reason: "Consolidation within the Cosmos ecosystem." },
    "WETH": { sentiment: "Bullish", score: 72, reason: "Increasing ETH ETF inflows and stable gas fees." },
    "SOL": { sentiment: "Bullish", score: 90, reason: "High DEX volume and meme-coin speculation driving transactions." },
    "TIA": { sentiment: "Bearish", score: 35, reason: "Recent token unlocks creating short-term sell pressure." }
  });
}
