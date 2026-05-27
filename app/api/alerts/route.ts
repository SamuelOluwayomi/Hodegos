import Groq from 'groq-sdk'
import { NextRequest, NextResponse } from 'next/server'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY?.trim(),
})

export async function POST(req: NextRequest) {
  try {
    const { portfolioContext } = await req.json()

    if (!portfolioContext?.holdings?.length) {
      return NextResponse.json({ alerts: [] })
    }

    const { holdings, totalValueUsd } = portfolioContext

    // Fetch live prices and 24h change data
    const heldAssets = holdings.map((h: any) => h.symbol).filter((s: string) => s !== 'USDT')
    if (!heldAssets.length) {
      return NextResponse.json({ alerts: [] })
    }

    const COINGECKO_IDS: Record<string, string> = {
      INJ: 'injective-protocol',
      ATOM: 'cosmos',
      WETH: 'ethereum',
      SOL: 'solana',
      TIA: 'celestia',
    }

    const cgIds = heldAssets.map((s: string) => COINGECKO_IDS[s]).filter(Boolean).join(',')
    let priceChanges: Record<string, { usd: number; usd_24h_change: number }> = {}

    try {
      const res = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${cgIds}&vs_currencies=usd&include_24hr_change=true`,
        { next: { revalidate: 300 } }
      )
      if (res.ok) {
        priceChanges = await res.json()
      }
    } catch (err) {
      console.warn('Alerts: CoinGecko fetch failed, skipping:', err)
      return NextResponse.json({ alerts: [] })
    }

    // Build a compact snapshot for the AI
    const assetLines = heldAssets.map((symbol: string) => {
      const cgId = COINGECKO_IDS[symbol]
      const data = priceChanges[cgId]
      if (!data) return null
      const holding = holdings.find((h: any) => h.symbol === symbol)
      const change = data.usd_24h_change?.toFixed(2) ?? '0'
      const direction = data.usd_24h_change >= 0 ? 'up' : 'down'
      return `${symbol}: ${direction} ${Math.abs(data.usd_24h_change).toFixed(2)}% in 24h (now $${data.usd.toFixed(2)}), you hold ${holding?.amount?.toFixed(4)} tokens worth $${holding?.valueUsd?.toFixed(2)}`
    }).filter(Boolean).join('\n')

    if (!assetLines) {
      return NextResponse.json({ alerts: [] })
    }

    const prompt = `You are Hodegos AI monitoring a user's crypto portfolio on Injective.

Portfolio total value: $${totalValueUsd}
24-hour price movements for held assets:
${assetLines}

Your job: Generate 0 to 2 short, actionable, beginner-friendly alert messages based on notable price movements or concentration risk.

Rules:
- NEVER produce more than one alert per asset. If both a price move and concentration risk apply to the same asset, combine them into a single alert message.
- Only generate an alert if there is something genuinely notable (a price move of >4% in 24h, or a token making up >65% of the portfolio).
- If nothing notable has happened, return an empty alerts array.
- Keep each alert under 25 words.
- Do NOT use emojis or markdown.
- Be direct, not alarmist.

Respond with ONLY a JSON object in this exact format, no extra text:
{
  "alerts": [
    { "asset": "INJ", "severity": "warning", "message": "INJ dropped 8% today. Your position is now worth $41.20." }
  ]
}

severity must be either "info" (positive/neutral) or "warning" (negative/risk).
If no alerts, return: { "alerts": [] }`

    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: 300,
    })

    const content = completion.choices[0]?.message?.content
    if (content) {
      const parsed = JSON.parse(content)
      return NextResponse.json({ alerts: parsed.alerts || [] })
    }

    return NextResponse.json({ alerts: [] })
  } catch (error) {
    console.error('Alerts API error:', error)
    return NextResponse.json({ alerts: [] })
  }
}
