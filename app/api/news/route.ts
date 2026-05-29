import Groq from 'groq-sdk'
import { NextResponse } from 'next/server'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY?.trim(),
})

interface NewsItem {
  id: number
  title: string
  summary: string
  url: string
  source: string
  publishedAt: string
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const force = searchParams.get('force') === 'true';

    // Fetch from Cointelegraph RSS (No API Key Required)
    const fetchOptions = force 
      ? { cache: 'no-store' as RequestCache } 
      : { next: { revalidate: 1800 } }; // cache for 30 minutes

    const newsRes = await fetch('https://cointelegraph.com/rss', fetchOptions)

    let rawArticles: any[] = []

    if (newsRes.ok) {
      const xmlText = await newsRes.text()
      const items = xmlText.match(/<item>[\s\S]*?<\/item>/gi) || []
      
      rawArticles = items.slice(0, 10).map((item, index) => {
        let title = item.match(/<title>(.*?)<\/title>/i)?.[1] || 'No title'
        title = title.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/, '$1')
        let link = item.match(/<link>(.*?)<\/link>/i)?.[1] || ''
        link = link.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/, '$1')
        const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/i)?.[1] || new Date().toISOString()
        
        return {
          id: index,
          title,
          url: link,
          source: { title: 'Cointelegraph' },
          published_at: pubDate
        }
      })
    }

    // Fallback: use curated static headlines if API is unavailable
    if (!rawArticles.length) {
      return NextResponse.json({
        articles: getFallbackNews(),
        source: 'fallback',
      })
    }

    // Prepare headlines for AI summarization
    const headlines = rawArticles.map((a: any, i: number) =>
      `${i + 1}. "${a.title}" (${a.source?.title || 'Unknown'})`
    ).join('\n')

    const prompt = `You are Hodegos AI, a beginner-friendly crypto trading guide.

Below are ${rawArticles.length} recent crypto news headlines. For each one, write a summary in exactly 2 plain sentences from the perspective of a beginner trader. Explain why this news matters for someone learning to trade. Use simple language. No markdown, no emojis, no financial advice.

Headlines:
${headlines}

Respond ONLY with a valid JSON array of ${rawArticles.length} objects in this EXACT format, with no extra text before or after:
[
  { "index": 1, "summary": "Two sentence beginner-friendly summary here." },
  { "index": 2, "summary": "Two sentence beginner-friendly summary here." }
]`

    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 800,
    })

    const content = completion.choices[0]?.message?.content?.trim() || '[]'

    // Extract JSON array from the response (handle potential preamble text)
    const jsonMatch = content.match(/\[[\s\S]*\]/)
    const summaries: { index: number; summary: string }[] = jsonMatch
      ? JSON.parse(jsonMatch[0])
      : []

    const articles: NewsItem[] = rawArticles.map((a: any, i: number) => {
      const summaryObj = summaries.find(s => s.index === i + 1)
      return {
        id: a.id || i,
        title: a.title,
        summary: summaryObj?.summary || 'Summary not available.',
        url: a.url || a.source?.url || '#',
        source: a.source?.title || 'Unknown',
        publishedAt: a.published_at || new Date().toISOString(),
      }
    })

    return NextResponse.json({ articles, source: 'live' })
  } catch (error) {
    console.error('News API error:', error)
    return NextResponse.json({
      articles: getFallbackNews(),
      source: 'fallback',
    })
  }
}

function getFallbackNews(): NewsItem[] {
  return [
    {
      id: 1,
      title: 'Injective Protocol Surges as On-Chain Activity Hits New Highs',
      summary: 'Injective has seen a significant spike in trading volume this week, driven by new DeFi protocols launching on the network. For a beginner, this means more people are actively using the blockchain, which can signal growing confidence in the project.',
      url: 'https://injective.com',
      source: 'Injective Blog',
      publishedAt: new Date().toISOString(),
    },
    {
      id: 2,
      title: 'Bitcoin Holds Key Support Level Amid Market Uncertainty',
      summary: 'Bitcoin has maintained a critical price level despite broader market selling pressure, which analysts say is a bullish sign. As a beginner, think of support levels as floors — if price stays above them, it suggests buyers are still in control.',
      url: 'https://cointelegraph.com',
      source: 'CoinTelegraph',
      publishedAt: new Date().toISOString(),
    },
    {
      id: 3,
      title: 'Ethereum Gas Fees Drop to Yearly Lows Following Upgrade',
      summary: 'A recent Ethereum network upgrade has dramatically reduced transaction fees, making it cheaper for users to interact with DeFi apps. Lower fees are generally good news for traders as it costs less to move funds around the network.',
      url: 'https://decrypt.co',
      source: 'Decrypt',
      publishedAt: new Date().toISOString(),
    },
    {
      id: 4,
      title: 'DeFi Total Value Locked Climbs Back Above $100 Billion',
      summary: 'The total amount of money locked in decentralized finance protocols has reached $100 billion again, signaling renewed investor confidence. This metric is like a health indicator for the DeFi space — a higher number means more people are participating.',
      url: 'https://defipulse.com',
      source: 'DeFi Pulse',
      publishedAt: new Date().toISOString(),
    },
    {
      id: 5,
      title: 'Solana Ecosystem Sees Record Developer Activity in Q2',
      summary: 'Solana saw its highest number of active developers this quarter, suggesting strong long-term project growth. For a beginner, developer activity is a useful signal — teams building on a blockchain often believe in its future.',
      url: 'https://solana.com',
      source: 'Solana Foundation',
      publishedAt: new Date().toISOString(),
    },
  ]
}
