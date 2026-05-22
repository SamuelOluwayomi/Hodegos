import { NextRequest, NextResponse } from 'next/server';

// ── Broadcast TX Route ─────────────────────────────────────────────────────────
// Runs on the server (Node.js). Accepts a signed TxRaw (as byte arrays) and
// broadcasts it to the Injective Testnet gRPC endpoint.

export async function POST(req: NextRequest) {
  try {
    const { bodyBytes, authInfoBytes, signatures, isEip712, ethereumChainId } = await req.json();

    const { TxGrpcApi, CosmosTxV1Beta1Tx } = await import('@injectivelabs/sdk-ts');
    const { Network, getNetworkEndpoints } = await import('@injectivelabs/networks');

    const endpoints = getNetworkEndpoints(Network.Testnet);

    const txRaw = CosmosTxV1Beta1Tx.TxRaw.create({
      bodyBytes: new Uint8Array(bodyBytes),
      authInfoBytes: new Uint8Array(authInfoBytes),
      signatures: signatures.map((s: number[]) => new Uint8Array(s)),
    });

    let txTobroadcast = txRaw;

    if (isEip712 && ethereumChainId) {
      const { createTxRawEIP712, createWeb3Extension } = await import('@injectivelabs/sdk-ts');
      const web3Extension = createWeb3Extension({ ethereumChainId });
      txTobroadcast = createTxRawEIP712(txRaw, web3Extension);
      txTobroadcast.signatures = txRaw.signatures;
    }

    const txService = new TxGrpcApi(endpoints.grpc);
    const txResponse = await txService.broadcast(txTobroadcast);

    if (txResponse.code !== 0) {
      return NextResponse.json(
        { error: txResponse.rawLog || 'Transaction failed to broadcast' },
        { status: 400 }
      );
    }

    return NextResponse.json({ txHash: txResponse.txHash });
  } catch (err: any) {
    console.error('[broadcast-tx] Error:', err);
    return NextResponse.json({ error: err.message || 'Broadcast failed.' }, { status: 500 });
  }
}
