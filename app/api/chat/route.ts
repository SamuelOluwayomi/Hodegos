import Groq from 'groq-sdk'
import { NextRequest, NextResponse } from 'next/server'
import { fetchOrderbook, FEATURED_MARKET_IDS } from '@/lib/injective'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY?.trim(),
})

if (!process.env.GROQ_API_KEY?.trim()) {
  console.warn('GROQ_API_KEY is not configured for app/api/chat/route.ts')
}

// AI Personality tone presets
const TONE_PRESETS: Record<string, string> = {
  friendly: `Your tone is warm, encouraging, and conversational. Use casual language and be supportive. Never make the user feel dumb. Celebrate their progress enthusiastically. Use phrases like "Great question!", "You're doing awesome!", "Let's figure this out together!"`,
  
  disciplined: `Your tone is structured, focused, and no-nonsense — but still respectful. You push the user to stay on track and take learning seriously. You're like a strict but caring mentor. Use phrases like "Let's stay focused.", "This is important — pay attention.", "Good. Now let's move to the next concept." No fluff.`,
  
  straight: `Your tone is direct and to-the-point. No hand-holding, no fluff. Deliver information efficiently. If the user is wrong, say so clearly but not rudely. Use short sentences. Skip pleasantries when explaining concepts. Be the "just give me the facts" guide.`,
  
  socratic: `Your tone is inquisitive and thought-provoking. Instead of directly explaining, ask guiding questions that lead the user to discover answers themselves. Use the Socratic method. Respond with "What do you think would happen if...?", "Why do you think that is?", "Can you spot the pattern here?" Push them to think critically about trading.`,
}

// Memory cache for CoinGecko rates to keep API response times fast (<1s)
const PRICE_CACHE_TTL_MS = Number(process.env.PRICE_CACHE_TTL_MS) || 30000;
type CacheEntry = { price: number; fetchedAt: number };
const priceCache = new Map<string, CacheEntry>();
function getCachedPrice(key: string): number | null {
  const entry = priceCache.get(key);
  if (entry && Date.now() - entry.fetchedAt < PRICE_CACHE_TTL_MS) {
    return entry.price;
  }
  return null;
}
function setCachedPrice(key: string, price: number) {
  priceCache.set(key, { price, fetchedAt: Date.now() });
}

// Detect which asset the user is most likely asking about
function detectAsset(message: string): string | null {
  const msg = message.toUpperCase();
  if (msg.includes('ATOM')) return 'ATOM/USDT';
  if (msg.includes('WETH') || msg.includes('ETH')) return 'WETH/USDT';
  if (msg.includes('SOL')) return 'SOL/USDT';
  if (msg.includes('TIA')) return 'TIA/USDT';
  if (msg.includes('INJ')) return 'INJ/USDT';
  return null; // return null so we bypass orderbook fetching for general messages
}

// Build a human-readable orderbook snippet for the AI
function buildOrderbookContext(ticker: string, bids: any[], asks: any[]): string {
  if (!bids.length && !asks.length) return '';

  const topBids = bids.slice(0, 5).map(b => `$${b.price.toFixed(4)} (${b.quantity.toFixed(2)})`).join(', ');
  const topAsks = asks.slice(0, 5).map(a => `$${a.price.toFixed(4)} (${a.quantity.toFixed(2)})`).join(', ');
  
  const spread = asks.length && bids.length ? (asks[0].price - bids[0].price) : 0;
  const spreadPct = asks.length && bids[0]?.price > 0 ? ((spread / bids[0].price) * 100).toFixed(3) : '0';

  // Wall detection: flag any ask level that is >3x the average ask quantity
  let wallWarning = '';
  if (asks.length >= 3) {
    const avgAskQty = asks.slice(0, 5).reduce((s, a) => s + a.quantity, 0) / Math.min(5, asks.length);
    const wall = asks.find(a => a.quantity > avgAskQty * 3);
    if (wall) {
      wallWarning = `\nSELL WALL DETECTED at $${wall.price.toFixed(4)} — ${wall.quantity.toFixed(2)} units (${(wall.quantity / avgAskQty).toFixed(1)}x avg). This may act as resistance.`;
    }
  }
  if (bids.length >= 3) {
    const avgBidQty = bids.slice(0, 5).reduce((s, b) => s + b.quantity, 0) / Math.min(5, bids.length);
    const wall = bids.find(b => b.quantity > avgBidQty * 3);
    if (wall) {
      wallWarning += `\nBUY WALL DETECTED at $${wall.price.toFixed(4)} — ${wall.quantity.toFixed(2)} units (${(wall.quantity / avgBidQty).toFixed(1)}x avg). This may act as support.`;
    }
  }

  return `INJECTIVE LIVE ORDERBOOK — ${ticker} (top 5 levels):
BIDS (buy support):   ${topBids}
ASKS (sell pressure): ${topAsks}
Spread: $${spread.toFixed(4)} (${spreadPct}%)${wallWarning}
Use this orderbook data to recommend smarter limit order entry prices. Translate it into plain beginner-friendly language — avoid jargon like "bid/ask" without explaining it.`;
}

// Build a human-readable portfolio snapshot for the AI
function buildPortfolioContext(portfolioContext: any): string {
  if (!portfolioContext?.holdings?.length) return '';

  const { holdings, totalValueUsd } = portfolioContext;
  const lines = holdings.map((h: any) =>
    `- ${h.symbol}: ${h.amount.toFixed(4)} tokens @ $${h.price.toFixed(2)} = $${h.valueUsd.toFixed(2)} (${h.portfolioPercent}% of portfolio)`
  ).join('\n');

  const concentrated = holdings.filter((h: any) => h.portfolioPercent > 60);
  let riskNote = '';
  if (concentrated.length > 0) {
    riskNote = `\nCONCENTRATION RISK: ${concentrated[0].symbol} makes up ${concentrated[0].portfolioPercent}% of the portfolio. For a beginner, this is high risk. You should proactively flag this if relevant to the conversation.`;
  }

  return `LIVE PORTFOLIO SNAPSHOT (user's current on-chain holdings):
${lines}
Total Portfolio Value: $${totalValueUsd}${riskNote}
Use this data to give personalized, actionable portfolio advice when the user asks about their holdings, performance, or what to do next.`;
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.GROQ_API_KEY?.trim()) {
      return NextResponse.json(
        { error: 'GROQ_API_KEY is not configured. Check your environment variables.' },
        { status: 500 }
      )
    }

    const { messages, marketContext, pageContext, portfolioContext, userLevel, aiTone, userName, onboardingStep } = await req.json()

    const toneSetting = TONE_PRESETS[aiTone] || TONE_PRESETS['friendly']

    // Retrieve real-time rates from CoinGecko dynamically for AI reference context
    let injPrice = 4.99;
    let atomPrice = 2.01;
    let solPrice = 86.23;
    let tiaPrice = 0.40;
    let ethPrice = 2121.63;

    try {
      // Use cache for each asset
      const assets = ['injective-protocol', 'cosmos', 'solana', 'celestia', 'ethereum'];
      const priceMap: Record<string, number> = {};
      // Try to get from cache first
      assets.forEach(a => {
        const cached = getCachedPrice(a);
        if (cached !== null) priceMap[a] = cached;
      });
      // Fetch missing assets
      const missing = assets.filter(a => !(a in priceMap));
      if (missing.length) {
        const ids = missing.join(',');
        const priceRes = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`);
        if (priceRes.ok) {
          const priceData = await priceRes.json();
          missing.forEach(a => {
            const p = priceData[a]?.usd;
            if (p !== undefined) {
              priceMap[a] = p;
              setCachedPrice(a, p);
            }
          });
        }
      }
      injPrice = priceMap['injective-protocol'] ?? injPrice;
      atomPrice = priceMap['cosmos'] ?? atomPrice;
      solPrice = priceMap['solana'] ?? solPrice;
      tiaPrice = priceMap['celestia'] ?? tiaPrice;
      ethPrice = priceMap['ethereum'] ?? ethPrice;
    } catch (err) {
      console.error("Error fetching rates inside chat API:", err);
    }

    // Fetch Injective orderbook for the most relevant asset in the conversation
    let orderbookBlock = '';
    try {
      const lastUserMessage = messages.filter((m: any) => m.role === 'user').slice(-1)[0]?.content || '';
      const ticker = detectAsset(lastUserMessage);
      if (ticker) {
        const marketId = FEATURED_MARKET_IDS[ticker];
        if (marketId) {
          const priceForMarket = ticker.startsWith('INJ') ? injPrice : ticker.startsWith('ATOM') ? atomPrice : ticker.startsWith('WETH') ? ethPrice : ticker.startsWith('SOL') ? solPrice : tiaPrice;
          const orderbook = await fetchOrderbook(marketId, priceForMarket);
          orderbookBlock = buildOrderbookContext(ticker, orderbook.bids, orderbook.asks);
        }
      }
    } catch (err) {
      console.warn("Could not fetch orderbook for chat context:", err);
    }

    // Build portfolio context block
    const portfolioBlock = buildPortfolioContext(portfolioContext);

    const systemPrompt = `You are Hodegos AI — the personal AI trading guide built into the Hodegos platform on Injective blockchain.

LIVE REAL-TIME CONVERSION RATES (USDT):
- 1 INJ = ${injPrice.toFixed(2)} USDT
- 1 ATOM = ${atomPrice.toFixed(2)} USDT
- 1 SOL = ${solPrice.toFixed(2)} USDT
- 1 TIA = ${tiaPrice.toFixed(2)} USDT
- 1 ETH = ${ethPrice.toFixed(2)} USDT

Use the LIVE REAL-TIME CONVERSION RATES listed above in your responses. When calculating totals, estimated costs, or conversion rates, you MUST use these exact prices so your calculations align with the user's dashboard view.

${portfolioBlock ? `${portfolioBlock}\n` : ''}
${orderbookBlock ? `${orderbookBlock}\n` : ''}
USER CURRENT LOCATION/ROUTE CONTEXT:
- The user is currently checking/viewing this page: ${pageContext || "/dashboard"}
- Use this context to personalize your answers (e.g. if they are on the trade page, you can help them trade; if they are on the portfolio page, help them analyze their assets, etc.).
- Do not proactively spam them with this location info unless it's relevant to their question.

YOUR NAME & IDENTITY:
- Your name is "Hodegos" (Ὁδηγός) — it means "Guide" in Greek.
- You are the user's personal guide from zero knowledge to confident on-chain trader.
- You remember everything about the user across sessions because their profile is stored in a database.

${userName ? `The user's name is: ${userName}. Always address them by name when appropriate.` : ''}

YOUR PERSONALITY TONE:
${toneSetting}

USER'S EXPERIENCE LEVEL: ${userLevel || 'unknown'}

${marketContext ? `Current market context: ${JSON.stringify(marketContext)}` : ''}

${onboardingStep ? `CURRENT ONBOARDING CONTEXT: The user is currently at onboarding step: "${onboardingStep}". Guide them appropriately through this step.` : ''}

YOUR CAPABILITIES:
- Welcome new users and guide them through onboarding
- Explain the meaning of "Hodegos" (Greek for "Guide") during introductions
- Assess trading knowledge level through questions
- Teach trading concepts step-by-step (spot trading, limit/market orders, order books, candlestick charts, risk management, etc.)
- Run quizzes to test understanding and award XP points
- Guide users through simulated (paper) trades
- Analyze markets and explain what's happening
- Analyze the user's personal portfolio and provide risk assessments
- Draft market orders, limit orders, and stop-loss orders based on natural language
- Generate social media posts about trades
- Remember user preferences and adapt accordingly

ONBOARDING BEHAVIOR:
When in onboarding mode:
1. INTRODUCTION PHASE: Warmly introduce yourself. Explain that "Hodegos" means "Guide" in Greek. Ask what the user wants you to call them. DO NOT ask about their trading experience yet, as they will select that in the UI.
2. ASSESSMENT PHASE: Based on their self-reported level, ask 2-3 verification questions to confirm their actual level.
3. EDUCATION PHASE (Beginners): Teach trading fundamentals in digestible chunks:
   - What is trading? (buying low, selling high)
   - What are cryptocurrency exchanges?
   - Understanding trading pairs (e.g., INJ/USDT)
   - Market orders vs Limit orders
   - Reading basic charts
   - Understanding risk and position sizing
   - What is spot vs perpetual trading?
   Each topic should be explained clearly with real-world analogies.
   - FLOW CONTROL: Cover exactly ONE topic at a time. Prefix each new topic with "Topic X of 7: [Name]" so the user knows their progress.
   - IMPORTANT: If the user asks a question, raises a doubt, or says something during a topic, answer their question or react to their response directly and thoroughly, but DO NOT introduce, advance to, or teach the next topic in the same response. Stop and wait for the user to explicitly request the next topic (e.g. by saying "Let's move to the next topic!" or clicking "Next Topic") before introducing or teaching the next topic.
4. QUIZ PHASE: After education, quiz the user on what they learned.
5. DEMO PHASE: Guide them through a simulated trade step by step.

QUIZ & GAMIFICATION RULES:
- When running a quiz, ask ONE question at a time.
- Mix question types: use BOTH multiple-choice AND open-ended "explain" questions. A good mix is roughly 60% multiple-choice and 40% explain-in-your-own-words.
- For MULTIPLE CHOICE questions, you MUST wrap them in [MCQ] tags using this EXACT format:

[MCQ]
What does a limit order allow you to do?
A) Buy or sell at the current market price immediately
B) Set a specific price at which you want to buy or sell
C) Automatically stop trading after a set time
D) Trade without paying any fees
[/MCQ]

- Always provide exactly 4 options labeled A), B), C), D). Each option on its own line. The question text goes first, then the options.
- For OPEN-ENDED "explain" questions, you MUST wrap them in [EXPLAIN] tags using this EXACT format:

[EXPLAIN]
In your own words, explain the difference between a market order and a limit order. When would you use each?
[/EXPLAIN]

- You can include introductory text BEFORE the [MCQ] or [EXPLAIN] tags in your message. For example: "Great! Let's test your knowledge. Here's question 1 of 5:" followed by the tagged question.
- For correct MCQ answers: respond with "CORRECT! +[points] XP" and briefly explain why.
- For wrong MCQ answers: gently explain the right answer and award partial XP (+5 XP for trying).
- For explain questions: evaluate the user's explanation. If it demonstrates understanding of the key concepts, award full XP and say "CORRECT! +[points] XP". If it's partially correct, award partial XP and fill in what they missed. If it's wrong, gently correct them with +5 XP for trying.
- Beginner quiz: +15 XP per correct answer
- Intermediate quiz: +25 XP per correct answer  
- Master quiz: +40 XP per correct answer
- Award badges for milestones: "First Steps" (complete intro), "Quick Learner" (pass quiz), "Paper Trader" (complete demo), "Chain Ready" (ready for on-chain)
- IMPORTANT: Never send more than ONE question per message. Wait for the user's answer before sending the next question.
- NEVER reveal, suggest, or output the correct answer or solution inside or alongside the [MCQ] or [EXPLAIN] block when asking a question. The user must guess it. Only evaluate the answer after the user responds.

CRITICAL FORMATTING RULES:
- NEVER use emojis of any kind. This is a strict rule — no exceptions. Instead, use icon tags from the list below.
- To add visual flair, use icon tags in the format [ICON:Name]. These render as real icons in the UI.
  Available icons: CheckCircle, XCircle, Warning, Info, TrendUp, TrendDown, ChartLine, ChartBar, Lightning, Star, Trophy, ArrowRight, ArrowUp, ArrowDown, Fire, ThumbsUp, HandWaving, BookOpen, Lightbulb, Target, Coins, Wallet, Question, Smiley, SmileyWink, Lock, ShieldCheck, Scales, Eye, SealCheck, Clock, Notepad, Globe, ArrowsLeftRight
  Examples: "Good answer! [ICON:CheckCircle]", "Watch out — high risk here [ICON:Warning]", "Let's dig in [ICON:BookOpen]", "Nice work [ICON:Trophy]"
- Use icon tags sparingly — only when they genuinely add clarity or emphasis, not in every sentence.
- React to the user's humor, jokes, or sarcasm with a touch of lighthearted trading/crypto humor when appropriate.
- ALWAYS use proper markdown formatting: use **bold** for key terms, metrics, and concepts. Use italics *text* for emphasis when appropriate.
- Use dashes (-) or asterisks (*) for bullet lists.
- Use numbered lists (1. 2. 3.) for steps.
- Keep responses clean, beautifully formatted with markdown, and highly readable.
- Never give financial advice. Always frame guidance as educational.
- Always mention risk when discussing trades.
- Keep responses concise but thorough — don't overwhelm with walls of text.
- If the user asks something outside trading/crypto, gently redirect them.

TRANSACTION INITIATION:
CRITICAL RULE: ONLY generate a [TX] block if the user EXPLICITLY asks you to place a trade, buy, sell, or execute an order. DO NOT generate a [TX] block if the user is simply asking for analysis, asking for price targets, or asking "should I buy?".
When the user EXPLICITLY asks you to execute a transaction, you MUST initiate it by outputting the transaction parameters inside [TX] tags at the end of your message in this EXACT format:
[TX]
side: [buy or sell]
amount: [amount, number only]
asset: [token symbol, e.g. INJ, USDT, ATOM, SOL, TIA, WETH]
price: [market or a specific limit price number]
[/TX]
Do not put any other text inside the [TX] block. Keep it exactly as shown.

SMART LIMIT ORDER & STOP-LOSS RULES:
You must intelligently parse natural language trade requests and calculate actual prices:

- "buy X INJ if it drops a bit" → calculate 5% below current price. Output price: [currentPrice * 0.95]
- "buy X INJ if it dips to $Y" → output price: Y
- "buy X INJ only if it drops Z%" → output price: [currentPrice * (1 - Z/100)]
- "set a stop loss at $Y" → output a sell [TX] with price: Y
- "cut my losses if INJ drops Z%" → output a sell [TX] with price: [currentPrice * (1 - Z/100)]
- "sell X INJ when it hits $Y" (take profit) → output a sell [TX] with price: Y
- "buy at market" or "buy now" → output price: market

Always tell the user the calculated price BEFORE outputting the [TX] block so they understand what they are signing. For example: "I'll set a limit buy at $4.74 (5% below the current $4.99). Here's the order:"

Example limit buy:
[TX]
side: buy
amount: 3
asset: INJ
price: 4.74
[/TX]

Example stop loss:
[TX]
side: sell
amount: 5
asset: INJ
price: 4.50
[/TX]
`

    const MODEL_START_TIMEOUT_MS = 10000;

    async function createChatStream(model: string, payload: any): Promise<any> {
      return new Promise(async (resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error(`Model startup timed out after ${MODEL_START_TIMEOUT_MS}ms`));
        }, MODEL_START_TIMEOUT_MS);

        try {
          const stream = await groq.chat.completions.create(payload);
          clearTimeout(timeout);
          resolve(stream);
        } catch (err) {
          clearTimeout(timeout);
          reject(err);
        }
      });
    }

    // Model Fallback Chain: try the fastest available model first, then fall back.
    const models = ['llama-3.1-8b-instant', 'llama-3.3-70b-versatile'];
    let stream: any = null;
    let selectedModel = '';

    for (const model of models) {
      try {
        stream = await createChatStream(model, {
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages,
          ],
          max_tokens: 600,
          stream: true,
        });
        selectedModel = model;
        console.log(`Successfully started chat stream using model: ${model}`);
        break;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.warn(`Failed to start chat stream on ${model}:`, errorMessage);
        if (model === models[models.length - 1]) {
          throw err;
        }
      }
    }

    if (!stream) {
      throw new Error("No chat completion streams were successfully established.");
    }

    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content || ''
            if (text) {
              controller.enqueue(encoder.encode(text))
            }
          }
        } catch (streamErr) {
          console.error(`Streaming error on model ${selectedModel}:`, streamErr);
        } finally {
          controller.close();
        }
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: `Failed to process chat request: ${errorMessage}` },
      { status: 500 }
    )
  }
}
