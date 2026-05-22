import { NextRequest, NextResponse } from 'next/server';

// ── EIP712 Typed Data Builder ──────────────────────────────────────────────────
// Generates the EIP712 typed data structure for MetaMask signing.
// Runs server-side only so the SDK never reaches the browser bundle.

export async function POST(req: NextRequest) {
  try {
    const { address, memo, accountNumber, sequence } = await req.json();

    const { MsgSend, getEip712TypedData } = await import('@injectivelabs/sdk-ts');

    const msg = MsgSend.fromJSON({
      amount: { denom: 'inj', amount: '1000000000000000' },
      srcInjectiveAddress: address,
      dstInjectiveAddress: address,
    });

    const typedData = getEip712TypedData({
      msgs: msg,
      tx: {
        accountNumber: accountNumber.toString(),
        sequence: sequence.toString(),
        chainId: 'injective-888',
        timeoutHeight: '',
        memo: memo || '',
      },
      fee: {
        amount: [{ amount: '2000000000000000', denom: 'inj' }],
        gas: '200000',
      },
      ethereumChainId: 888, // EthereumChainId.Injective
    });

    return NextResponse.json({ typedData });
  } catch (err: any) {
    console.error('[build-tx/eip712] Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to build EIP712 data.' }, { status: 500 });
  }
}
