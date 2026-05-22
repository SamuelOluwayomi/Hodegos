async function main() {
  const LCD = 'https://testnet.sentry.lcd.injective.network';
  const FEATURED_MARKET_IDS = {
    'INJ/USDT': '0x0611780ba69656949525013d947713300f56c37b6175e02f26bffa495c3208fe',
    'ATOM/USDT': '0x491ee4fae7956dd72b6a97805046ffef65892e1d3254c559c18056a519b2ca15',
    'WETH/USDT': '0xa97182f11f1aa5339c7f4c3fe3cc1c69b39079f11b864c86d912956c5c2db75c',
    'SOL/USDT': '0x2da41d4f7370e6d44240480bae530661ba3ae68682089810ea29beee1984985f',
    'TIA/USDT': '0xa283fc94a9055a01a58bb6229b1e56a8bb54069a0debfce7fbd1e6c25a95330c',
  };

  try {
    const res = await fetch(`${LCD}/injective/exchange/v1beta1/spot/markets`);
    const data = await res.json();
    const markets = data.markets || [];
    
    console.log("Total Markets found:", markets.length);
    if (markets.length > 0) {
      console.log("First market keys:", Object.keys(markets[0]));
    }
    
    console.log("Matching Markets:");
    for (const [ticker, id] of Object.entries(FEATURED_MARKET_IDS)) {
      const match = markets.find(m => (m.market_id || m.marketId) === id);
      if (match) {
        console.log(`${ticker}:`);
        console.log(`  Market ID: ${match.market_id || match.marketId}`);
        console.log(`  Base Denom: ${match.base_denom || match.baseDenom}`);
        console.log(`  Quote Denom: ${match.quote_denom || match.quoteDenom}`);
      } else {
        console.log(`${ticker}: NOT FOUND`);
      }
    }
  } catch (err) {
    console.error("Error:", err);
  }
}

main();
