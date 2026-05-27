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
      const priceRes = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=injective-protocol,cosmos,solana,celestia,ethereum&vs_currencies=usd");
      if (priceRes.ok) {
        const priceData = await priceRes.json();
        prices.INJ = priceData["injective-protocol"]?.usd || prices.INJ;
        prices.ATOM = priceData["cosmos"]?.usd || prices.ATOM;
        prices.SOL = priceData["solana"]?.usd || prices.SOL;
        prices.TIA = priceData["celestia"]?.usd || prices.TIA;
        prices.WETH = priceData["ethereum"]?.usd || prices.WETH;
      }
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
