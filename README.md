# Hodegos

**Deployed URL:** [https://hodegos.vercel.app](https://hodegos.vercel.app)

## Overview

Hodegos is an AI-guided trading companion built for the Injective Solo AI Builder Sprint. The platform is designed to onboard new users into the cryptocurrency trading ecosystem by providing a frictionless, beginner-friendly environment. It allows users to learn the basics, simulate risk-free trades, and eventually execute on-chain transactions, all while being assisted by an AI copilot that translates complex market data into accessible insights.

## How AI is Used

Hodegos utilizes the Groq API to power two core features:
1. **Market Sentiment Analysis:** The AI ingests real-time price data and market context for various crypto assets to generate structured sentiment scores and concise, human-readable market summaries.
2. **Interactive AI Copilot:** An embedded AI assistant acts as a guide for users, helping them understand trading concepts, evaluating their simulated portfolio, and walking them through their first spot or perpetual trades without relying on intimidating financial jargon.

## Injective Integration

Hodegos is integrated with the Injective ecosystem using the `@injectivelabs/sdk-ts` and `@injectivelabs/networks` packages. 
- **Market Data:** The application fetches active spot and perpetual markets directly from Injective.
- **On-Chain Execution:** After completing simulations, users can connect their wallets to execute real spot and perpetual trades directly on the Injective network.
- **Environment:** By leveraging Injective's fast execution and low fees, Hodegos provides a seamless transition from simulated practice to actual on-chain trading.

## How Users Interact with the Project

1. **Learn:** Users start with straightforward, AI-guided lessons that explain market fundamentals without complex charts.
2. **Simulate:** Users can execute mock spot and perpetual trades in a risk-free environment. The AI copilot analyzes their simulated portfolio and provides actionable feedback.
3. **Execute:** Once comfortable, users connect their wallet and transition to live trading on the Injective network, continuing to use the AI copilot for guidance.

## Local Development

To run the project locally:

1. Clone the repository and install dependencies:
```bash
npm install
# or
pnpm install
```

2. Set up your environment variables by creating a `.env.local` file with the required keys (e.g., Groq API key).

3. Run the development server:
```bash
npm run dev
# or
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.
