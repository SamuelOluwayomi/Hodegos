import Groq from 'groq-sdk'
import { NextRequest, NextResponse } from 'next/server'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

// Fast model for lightweight tasks: XP messages, badge awards, social posts
export async function POST(req: NextRequest) {
  try {
    const { prompt, type } = await req.json()

    const systemPrompts: Record<string, string> = {
      xp_award: `You generate short, exciting XP award messages for a trading learning platform called Hodegos. Keep it to 1-2 sentences. Be energetic and use emojis. Example: "🔥 +25 XP! You're on fire! Keep this momentum going!"`,
      social_post: `You generate social media posts about trading achievements on the Hodegos platform (built on Injective blockchain). Keep posts under 280 characters. Include relevant hashtags like #Hodegos #Injective #DeFi. Make them sound authentic and exciting.`,
      badge_description: `You generate short badge descriptions for trading achievements. Keep them to 1 sentence. Be creative and motivating.`,
    }

    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: systemPrompts[type] || systemPrompts['xp_award'] },
        { role: 'user', content: prompt },
      ],
      max_tokens: 256,
    })

    return NextResponse.json({
      content: completion.choices[0]?.message?.content || '',
    })
  } catch (error) {
    console.error('Quick API error:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}
