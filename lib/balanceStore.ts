export interface BalanceOffset {
  injOffset: number;
  usdtOffset: number;
}

export function getBalanceOffsets(address: string): BalanceOffset {
  if (typeof window === "undefined" || !address) {
    return { injOffset: 0, usdtOffset: 0 };
  }
  const key = `hodegos_offsets_${address.toLowerCase()}`;
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : { injOffset: 0, usdtOffset: 0 };
  } catch {
    return { injOffset: 0, usdtOffset: 0 };
  }
}

export function addBalanceOffset(address: string, injDiff: number, usdtDiff: number) {
  if (typeof window === "undefined" || !address) return;
  const key = `hodegos_offsets_${address.toLowerCase()}`;
  const current = getBalanceOffsets(address);
  const updated = {
    injOffset: current.injOffset + injDiff,
    usdtOffset: current.usdtOffset + usdtDiff,
  };
  localStorage.setItem(key, JSON.stringify(updated));
}
