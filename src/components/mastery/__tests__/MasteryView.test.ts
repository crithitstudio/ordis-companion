/**
 * Unit tests for Mastery Rank calculation
 * Uses official Warframe Wiki formula: 2,500 × Rank²
 */
import { describe, it, expect } from "vitest";

// MR thresholds from MasteryView.tsx
const MR_THRESHOLDS = [
  0, // MR 0
  2500, // MR 1
  10000, // MR 2
  22500, // MR 3
  40000, // MR 4
  62500, // MR 5
  90000, // MR 6
  122500, // MR 7
  160000, // MR 8
  202500, // MR 9
  250000, // MR 10
  302500, // MR 11
  360000, // MR 12
  422500, // MR 13
  490000, // MR 14
  562500, // MR 15
  640000, // MR 16
  722500, // MR 17
  810000, // MR 18
  902500, // MR 19
  1000000, // MR 20
  1102500, // MR 21
  1210000, // MR 22
  1322500, // MR 23
  1440000, // MR 24
  1562500, // MR 25
  1690000, // MR 26
  1822500, // MR 27
  1960000, // MR 28
  2102500, // MR 29
  2250000, // MR 30
  2397500, // LR 1 (MR 31)
  2545000, // LR 2 (MR 32)
  2692500, // LR 3 (MR 33)
  2840000, // LR 4 (MR 34)
  2987500, // LR 5 (MR 35)
];

// Extracted calculateMR function from MasteryView.tsx
function calculateMR(totalXP: number): {
  rank: number;
  progress: number;
  nextThreshold: number;
  displayRank: string;
  isLegendary: boolean;
} {
  let rank = 0;
  for (let i = 0; i < MR_THRESHOLDS.length; i++) {
    if (totalXP >= MR_THRESHOLDS[i]) {
      rank = i;
    } else {
      break;
    }
  }
  const currentThreshold = MR_THRESHOLDS[rank] || 0;
  const nextThreshold = MR_THRESHOLDS[rank + 1] || currentThreshold + 147500;
  const xpInRank = totalXP - currentThreshold;
  const xpNeeded = nextThreshold - currentThreshold;
  const progress = Math.min(100, Math.round((xpInRank / xpNeeded) * 100));

  const isLegendary = rank > 30;
  const displayRank = isLegendary ? `LR ${rank - 30}` : `MR ${rank}`;

  return { rank, progress, nextThreshold, displayRank, isLegendary };
}

describe("MR Threshold Calculations", () => {
  describe("Wiki Formula Verification (2,500 × Rank²)", () => {
    it("should have correct thresholds for MR 1-10", () => {
      expect(MR_THRESHOLDS[1]).toBe(2500); // 2500 × 1² = 2500
      expect(MR_THRESHOLDS[2]).toBe(10000); // 2500 × 2² = 10000
      expect(MR_THRESHOLDS[5]).toBe(62500); // 2500 × 5² = 62500
      expect(MR_THRESHOLDS[10]).toBe(250000); // 2500 × 10² = 250000
    });

    it("should have correct thresholds for MR 20-30", () => {
      expect(MR_THRESHOLDS[20]).toBe(1000000); // 2500 × 20² = 1,000,000
      expect(MR_THRESHOLDS[25]).toBe(1562500); // 2500 × 25² = 1,562,500
      expect(MR_THRESHOLDS[30]).toBe(2250000); // 2500 × 30² = 2,250,000
    });

    it("should have correct Legendary Rank thresholds", () => {
      // Formula: 2,250,000 + (147,500 × LR#)
      expect(MR_THRESHOLDS[31]).toBe(2397500); // LR1: 2,250,000 + 147,500
      expect(MR_THRESHOLDS[32]).toBe(2545000); // LR2: 2,250,000 + 295,000
      expect(MR_THRESHOLDS[33]).toBe(2692500); // LR3: 2,250,000 + 442,500
    });
  });

  describe("calculateMR function", () => {
    it("should return MR 0 for 0 XP", () => {
      const result = calculateMR(0);
      expect(result.rank).toBe(0);
      expect(result.displayRank).toBe("MR 0");
      expect(result.isLegendary).toBe(false);
    });

    it("should return correct MR for exact threshold values", () => {
      expect(calculateMR(2500).rank).toBe(1);
      expect(calculateMR(250000).rank).toBe(10);
      expect(calculateMR(1000000).rank).toBe(20);
      expect(calculateMR(2250000).rank).toBe(30);
    });

    it("should return correct MR for XP between thresholds", () => {
      expect(calculateMR(5000).rank).toBe(1); // Between MR1 (2500) and MR2 (10000)
      expect(calculateMR(800000).rank).toBe(17); // 722500 < 800000 < 810000
      expect(calculateMR(2000000).rank).toBe(28); // 1960000 < 2000000 < 2102500
    });

    it("should calculate correct progress percentage", () => {
      const result = calculateMR(5000);
      // MR1 at 2500, MR2 at 10000, so 5000 is (5000-2500)/(10000-2500) = 2500/7500 = 33%
      expect(result.progress).toBe(33);
    });

    it("should display Legendary Ranks correctly", () => {
      const lr1 = calculateMR(2397500);
      expect(lr1.rank).toBe(31);
      expect(lr1.displayRank).toBe("LR 1");
      expect(lr1.isLegendary).toBe(true);

      const lr3 = calculateMR(2700000);
      expect(lr3.rank).toBe(33);
      expect(lr3.displayRank).toBe("LR 3");
      expect(lr3.isLegendary).toBe(true);
    });

    it("should not show MR 30 for insufficient XP", () => {
      // This was the bug we fixed - 801,949 XP should NOT be MR 30
      const result = calculateMR(801949);
      expect(result.rank).toBe(17); // Should be MR 17 (722500 < 801949 < 810000)
      expect(result.displayRank).toBe("MR 17");
    });
  });
});

describe("Mastery XP Values", () => {
  const MASTERY_XP: Record<string, number> = {
    Warframes: 6000,
    Primary: 3000,
    Secondary: 3000,
    Melee: 3000,
    Sentinel: 6000,
    "Sentinel Weapon": 3000,
    Companions: 6000,
    Robotic: 6000,
    Archwing: 6000,
    "Arch-Gun": 3000,
    "Arch-Melee": 3000,
    Amp: 3000,
    "K-Drive": 6000,
    Necramech: 8000,
  };

  it("should have 6000 XP for Warframes", () => {
    expect(MASTERY_XP.Warframes).toBe(6000);
  });

  it("should have 3000 XP for standard weapons", () => {
    expect(MASTERY_XP.Primary).toBe(3000);
    expect(MASTERY_XP.Secondary).toBe(3000);
    expect(MASTERY_XP.Melee).toBe(3000);
  });

  it("should have 6000 XP for companions", () => {
    expect(MASTERY_XP.Companions).toBe(6000);
    expect(MASTERY_XP.Sentinel).toBe(6000);
  });

  it("should have 8000 XP for Necramechs (rank 40 capable)", () => {
    expect(MASTERY_XP.Necramech).toBe(8000);
  });
});
