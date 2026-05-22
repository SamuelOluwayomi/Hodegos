export interface Tier {
  level: string;
  min: number;
  max: number;
  color: string;
}

export const TIER_THRESHOLDS: Tier[] = [
  { level: "Apprentice", min: 0, max: 100, color: "bg-neo-yellow" },
  { level: "Beginner", min: 100, max: 300, color: "bg-neo-lime" },
  { level: "Intermediate", min: 300, max: 700, color: "bg-neo-orange" },
  { level: "Advanced", min: 700, max: 1500, color: "bg-black text-white" },
  { level: "Expert", min: 1500, max: 3000, color: "bg-black text-neo-lime" },
  { level: "Master", min: 3000, max: Infinity, color: "bg-black text-neo-orange" },
];

export function getTierByXP(xp: number): Tier {
  return TIER_THRESHOLDS.find(t => xp >= t.min && xp < t.max) || TIER_THRESHOLDS[0];
}

export function getNextTierByXP(xp: number): Tier | null {
  return TIER_THRESHOLDS.find(t => t.min > xp) || null;
}

export function getTierProgress(xp: number) {
  const currentTier = getTierByXP(xp);
  const nextTier = getNextTierByXP(xp);
  const xpToNext = nextTier ? nextTier.min - xp : 0;
  const progress = nextTier
    ? Math.min(100, ((xp - currentTier.min) / (nextTier.min - currentTier.min)) * 100)
    : 100;
  
  return {
    currentTier,
    nextTier,
    xpToNext,
    progress,
  };
}
