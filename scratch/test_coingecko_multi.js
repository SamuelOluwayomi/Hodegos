async function main() {
  try {
    const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=injective-protocol,cosmos,ethereum,solana,celestia&vs_currencies=usd');
    const data = await res.json();
    console.log("CoinGecko Multi Prices:", data);
  } catch (err) {
    console.error("Error:", err);
  }
}

main();
