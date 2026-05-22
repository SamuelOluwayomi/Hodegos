import { NextRequest, NextResponse } from 'next/server';

// ── Build TX Route ─────────────────────────────────────────────────────────────
// Runs on the server (Node.js). The SDK is safe here. The browser never touches
// this code, so the problematic SDK constants.js is not bundled client-side.

export async function POST(req: NextRequest) {
  try {
    const { address, side, amount, asset, price, memo } = await req.json();

    const { MsgSend, createTransaction, ChainRestAuthApi, BaseAccount } =
      await import('@injectivelabs/sdk-ts');
    const { Network, getNetworkEndpoints } = await import('@injectivelabs/networks');

    const endpoints = getNetworkEndpoints(Network.Testnet);
    const chainRestAuthApi = new ChainRestAuthApi(endpoints.rest);
    const accountDetailsResponse = await chainRestAuthApi.fetchAccount(address);
    const baseAccount = BaseAccount.fromRestApi(accountDetailsResponse);

    const msg = MsgSend.fromJSON({
      amount: { denom: 'inj', amount: '1000000000000000' }, // 0.001 INJ proof-of-execution
      srcInjectiveAddress: address,
      dstInjectiveAddress: address,
    });

    const txMemo = memo || `Hodegos AI: ${side?.toUpperCase()} ${amount} ${asset} @ ${price === 'market' ? 'Market' : price}`;

    const { txRaw } = createTransaction({
      message: msg,
      memo: txMemo,
      fee: {
        amount: [{ amount: '2000000000000000', denom: 'inj' }],
        gas: '200000',
      },
      pubKey: baseAccount.pubKey.key || '',
      sequence: baseAccount.sequence,
      accountNumber: baseAccount.accountNumber,
      chainId: 'injective-888',
    });

    return NextResponse.json({
      bodyBytes: Array.from(txRaw.bodyBytes),
      authInfoBytes: Array.from(txRaw.authInfoBytes),
      accountNumber: baseAccount.accountNumber,
      sequence: baseAccount.sequence,
      pubKey: baseAccount.pubKey.key || '',
      memo: txMemo,
    });
  } catch (err: any) {
    console.error('[build-tx] Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to build transaction.' }, { status: 500 });
  }
}
