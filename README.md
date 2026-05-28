# Hodegos

**Deployed URL:** [https://hodegos.vercel.app](https://hodegos.vercel.app)

## Overview

**Hodegos** (Greek for "Guide") is an AI-driven trading companion built specifically for the **Injective Solo AI Builder Sprint**. 

The cryptocurrency trading environment is notoriously hostile to newcomers, plagued by intimidating jargon, complex charts, and high-risk interfaces. Hodegos solves this by bridging the gap between absolute beginners and the Injective blockchain. It serves as a Consumer AI App that provides a frictionless, guided, and educational environment for users to learn the fundamentals, practice via simulation, and seamlessly transition to real on-chain execution.

## Hackathon Track: Consumer AI App
Hodegos perfectly aligns with the Consumer AI App track by abstracting the complexities of trading and Injective's infrastructure behind an intuitive, AI-powered conversational interface. It demonstrates how AI can be utilized to make Web3 accessible to the masses.

---

## 🤖 How AI is Utilized

Hodegos leverages the **Groq API** (specifically Llama 3 models) to power two primary AI integrations:

### 1. Interactive AI Copilot (The "Hodegos" Agent)
At the core of the platform is an embedded conversational AI that acts as a personalized mentor:
- **Context-Aware Guidance:** The AI knows what page the user is on and what their current portfolio balance is, offering tailored advice rather than generic responses.
- **Educational Quizzes:** The AI conducts dynamic quizzes, automatically parsing answers and awarding XP to gamify the learning process.
- **Intent Parsing & Transaction Drafting:** Through natural language processing, the AI understands when a user wants to execute a trade. It parses this intent into structured data and automatically drafts the transaction parameters for the user to confirm.

### 2. AI-Narrated Market Briefing (News)
- **Live Aggregation:** Hodegos automatically polls the CryptoPanic API for the latest breaking crypto news across major assets.
- **Smart Summarization:** Instead of dumping raw articles, the Groq AI reads the headlines and dynamically rewrites them into 2-sentence, jargon-free summaries explicitly tailored for a beginner trader learning the ropes.
- **Auto-Refresh Loop:** The system maintains a synchronized 30-minute cache and polling loop to ensure news is always fresh without overwhelming the AI limits.

### 3. Market Sentiment Analysis
- The AI ingests real-time price data for major crypto assets (INJ, ATOM, SOL, WETH, TIA).
- It generates structured sentiment scores (Bullish, Bearish, Neutral) and provides concise, human-readable market summaries, translating raw data into digestible market intelligence.

---

## ⛓️ Injective Integration

Hodegos is deeply integrated with the Injective ecosystem using the `@injectivelabs/sdk-ts` and `@injectivelabs/networks` packages.

- **Real-Time Market Data:** The application fetches active spot and perpetual markets directly from Injective's decentralized orderbooks.
- **Advanced Demo Synchronization:** To provide a flawless educational experience, Hodegos bridges the gap between testnet and mainnet. It pulls real-world Mainnet prices from CoinGecko, dynamically generates realistic candlestick charts anchored to those live prices, and routes real `MsgCreateSpotMarketOrder` transactions to the Injective Testnet—ensuring users experience true market conditions without risking real capital.
- **Zero-Intimidation Environment:** By leveraging Injective's lightning-fast execution and near-zero gas fees, Hodegos removes the traditional friction associated with on-chain trading.
- **On-Chain Execution:** After graduating from the simulation phase, users can connect their Web3 wallets (via integrated wallet providers like Keplr, Leap, and Ninji) to execute real spot trades directly on the Injective network.

---

## 👤 User Journey & Interaction Flow

1. **Onboarding & Assessment:** New users are greeted by the AI, which assesses their current knowledge level (Beginner, Intermediate, Master) and tailors the experience accordingly.
2. **Learn (Education Phase):** Users receive bite-sized, jargon-free lessons on trading fundamentals (e.g., spot vs. perps, limit vs. market orders) directly through conversational dialogue.
3. **Simulate (Paper Trading):** Users are given a simulated portfolio. They can execute mock trades in a risk-free environment. The AI copilot analyzes their simulated portfolio and provides actionable feedback on risk management and asset allocation.
4. **Execute (On-Chain Trading):** Once comfortable, users connect their wallet. The same interface they used to learn and simulate is now connected to the Injective mainnet/testnet, allowing them to trade live with confidence.

---

## 🛠️ Tech Stack

- **Frontend:** Next.js (App Router), React, Tailwind CSS
- **AI / LLM:** Groq API (Llama-3.3-70b-versatile, Llama-3.1-8b-instant)
- **Blockchain / Web3:** `@injectivelabs/sdk-ts` (Injective SDK)
- **Backend / Database:** Supabase (PostgreSQL) for user profiles, XP tracking, and simulated portfolio states
- **Charts:** Lightweight Charts, Recharts

---

## 💻 Local Development Setup

To run Hodegos locally, follow these steps:

### 1. Clone & Install
```bash
git clone <your-repo-url>
cd hodegos
npm install
# or
pnpm install
```

### 2. Environment Variables
Create a `.env.local` file in the root directory and add the following required keys:
```env
# AI Integration
GROQ_API_KEY=your_groq_api_key_here

# Database Integration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### 3. Run the Development Server
```bash
npm run dev
# or
pnpm dev
```

### 4. View the App
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🚀 Future Roadmap
- **Portfolio-Aware Risk Alerts:** Proactive AI notifications when a user's simulated or live portfolio becomes overexposed to a single asset.
- **Injective Orderbook Data:** Pulling live bid/ask spread data from Injective DEXs directly into the AI prompt for more granular, real-time trading advice.
- **Automated Rebalancing:** Allowing the AI agent to autonomously execute portfolio rebalancing trades based on user-defined parameters.
