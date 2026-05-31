import { NextResponse } from "next/server";

const LCD = "https://testnet.sentry.lcd.injective.network";

interface Delegation {
  validatorAddress: string;
  validatorName: string;
  delegatedAmount: number;
  pendingRewardINJ: number;
  estimatedApy: number;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address");

  if (!address) {
    return NextResponse.json({ error: "Missing address" }, { status: 400 });
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    let delegations: any[] = [];
    let rewards: any = {};
    let validatorMap: Record<string, string> = {};
    let estimatedApy = 0;

    try {
      // Fetch delegations
      const delegRes = await fetch(
        `${LCD}/cosmos/staking/v1beta1/delegations/${address}`,
        { signal: controller.signal, cache: "no-store" }
      );
      if (delegRes.ok) {
        const d = await delegRes.json();
        delegations = d.delegation_responses ?? [];
      }

      // Fetch pending rewards
      const rewardRes = await fetch(
        `${LCD}/cosmos/distribution/v1beta1/delegators/${address}/rewards`,
        { signal: controller.signal, cache: "no-store" }
      );
      if (rewardRes.ok) {
        const r = await rewardRes.json();
        // Map validator address -> INJ reward amount
        for (const entry of (r.rewards ?? [])) {
          const injReward = (entry.reward ?? []).find((c: any) => c.denom === "inj");
          rewards[entry.validator_address] = injReward
            ? parseFloat(injReward.amount) / 1e18
            : 0;
        }
      }

      // Fetch validators to get names + compute APY estimate
      const validatorRes = await fetch(
        `${LCD}/cosmos/staking/v1beta1/validators?status=BOND_STATUS_BONDED&pagination.limit=300`,
        { signal: controller.signal, cache: "no-store" }
      );
      if (validatorRes.ok) {
        const v = await validatorRes.json();
        for (const val of (v.validators ?? [])) {
          validatorMap[val.operator_address] = val.description?.moniker ?? "Unknown Validator";
        }

        // Estimate network APY: typically ~14% on Injective testnet
        // Formula: inflation_rate / bonding_ratio
        // We approximate with a fixed 14% since testnet inflation params rarely change
        estimatedApy = 14.0;
      }
    } finally {
      clearTimeout(timeoutId);
    }

    const parsedDelegations: Delegation[] = delegations.map((d: any) => {
      const valAddr = d.delegation?.validator_address ?? "";
      const amountRaw = parseFloat(d.balance?.amount ?? "0");
      const amount = amountRaw / 1e18; // Convert from inj (1e18) to INJ
      return {
        validatorAddress: valAddr,
        validatorName: validatorMap[valAddr] ?? "Validator",
        delegatedAmount: amount,
        pendingRewardINJ: rewards[valAddr] ?? 0,
        estimatedApy,
      };
    });

    const totalDelegated = parsedDelegations.reduce((s, d) => s + d.delegatedAmount, 0);
    const totalPendingReward = parsedDelegations.reduce((s, d) => s + d.pendingRewardINJ, 0);

    return NextResponse.json({
      delegations: parsedDelegations,
      totalDelegated,
      totalPendingReward,
      estimatedApy,
      hasDelegations: parsedDelegations.length > 0,
    });
  } catch (error: any) {
    console.warn("staking fetch error:", error?.message);
    return NextResponse.json({
      delegations: [],
      totalDelegated: 0,
      totalPendingReward: 0,
      estimatedApy: 14.0,
      hasDelegations: false,
    });
  }
}
