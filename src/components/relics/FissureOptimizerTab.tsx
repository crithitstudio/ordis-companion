/**
 * Fissure Optimizer Tab
 * Shows owned AlecaFrame relics matched with currently active fissures
 */
import { useState, useMemo } from "react";
import { Zap, Clock, Package, RefreshCw, AlertCircle } from "lucide-react";
import { getCachedRelics, type AlecaRelic } from "../../services/alecaframeApi";
import { getCachedPrices, type PriceData } from "../../services/priceService";
import { itemsData } from "../../utils/translations";
import type { Fissure } from "../../types";

interface FissureOptimizerProps {
  fissures: Fissure[];
}

interface OptimalRun {
  fissure: Fissure;
  relics: {
    name: string;
    era: string;
    refinement: string;
    count: number;
    value: number;
  }[];
  totalRelics: number;
  avgValue: number;
  score: number;
}

const MISSION_SPEED: Record<string, number> = {
  Capture: 100,
  Exterminate: 90,
  Rescue: 80,
  Sabotage: 75,
  Spy: 60,
  "Mobile Defense": 50,
  Excavation: 50,
  Defense: 40,
  Survival: 30,
  Interception: 20,
  Defection: 10,
};

// Get relic contents from itemsData
function getRelicDrops(): Map<
  string,
  { item: string; rarity: string; chance: number }[]
> {
  const relicDrops = new Map<
    string,
    { item: string; rarity: string; chance: number }[]
  >();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Object.values(itemsData).forEach((item: any) => {
    if (item.type === "Relic" || item.category === "Relics") {
      const drops: { item: string; rarity: string; chance: number }[] = [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      item.rewards?.forEach((r: any, i: number) => {
        const itemName = r.item || r.itemName;
        if (itemName) {
          const rarity = i < 3 ? "Common" : i < 5 ? "Uncommon" : "Rare";
          const chance =
            rarity === "Rare" ? 2 : rarity === "Uncommon" ? 11 : 25.33;
          drops.push({ item: itemName, rarity, chance });
        }
      });

      if (drops.length > 0) {
        const name = item.name.replace(/ Relic$/i, "").trim();
        relicDrops.set(name, drops);
      }
    }
  });

  return relicDrops;
}

// Calculate relic value based on drops
function calcRelicValue(
  relicName: string,
  relicDrops: Map<string, { item: string; rarity: string; chance: number }[]>,
  prices: Map<string, PriceData>,
): number {
  const drops = relicDrops.get(relicName);
  if (!drops) return 0;

  let value = 0;
  drops.forEach((drop) => {
    const price = prices.get(drop.item)?.platinum || 0;
    value += price * (drop.chance / 100);
  });

  return Math.round(value * 10) / 10;
}

export function FissureOptimizerTab({ fissures }: FissureOptimizerProps) {
  const [sortBy, setSortBy] = useState<"score" | "value" | "count">("score");

  // Get AlecaFrame relics
  const alecaRelics = getCachedRelics();
  const prices = getCachedPrices();
  const relicDrops = useMemo(() => getRelicDrops(), []);

  // Group relics by era
  const relicsByEra = useMemo(() => {
    if (!alecaRelics) return new Map<string, AlecaRelic[]>();

    const grouped = new Map<string, AlecaRelic[]>();
    alecaRelics.relics.forEach((relic) => {
      const existing = grouped.get(relic.type) || [];
      existing.push(relic);
      grouped.set(relic.type, existing);
    });
    return grouped;
  }, [alecaRelics]);

  // Build optimal runs for each active fissure
  const optimalRuns = useMemo<OptimalRun[]>(() => {
    if (!alecaRelics || fissures.length === 0) return [];

    return fissures
      .map((fissure) => {
        const era = fissure.tier; // "Lith", "Meso", etc.
        const matchingRelics = relicsByEra.get(era) || [];

        const relicsWithValue = matchingRelics
          .map((relic: AlecaRelic) => {
            const fullName = `${relic.type} ${relic.name}`;
            const value = calcRelicValue(fullName, relicDrops, prices);
            return {
              name: relic.name,
              era: relic.type,
              refinement: relic.refinement,
              count: relic.count,
              value,
            };
          })
          .sort(
            (a: { value: number }, b: { value: number }) => b.value - a.value,
          );

        const totalRelics = relicsWithValue.reduce(
          (sum: number, r: { count: number }) => sum + r.count,
          0,
        );
        const avgValue =
          totalRelics > 0
            ? relicsWithValue.reduce(
                (sum: number, r: { value: number; count: number }) =>
                  sum + r.value * r.count,
                0,
              ) / totalRelics
            : 0;

        // Score based on: mission speed + relic count + value
        const speedScore = MISSION_SPEED[fissure.missionType] || 50;
        const countScore = Math.min(50, totalRelics * 5);
        const valueScore = Math.min(50, avgValue * 5);
        const score = speedScore + countScore + valueScore;

        return {
          fissure,
          relics: relicsWithValue.slice(0, 5),
          totalRelics,
          avgValue: Math.round(avgValue * 10) / 10,
          score: Math.round(score),
        };
      })
      .filter((run) => run.totalRelics > 0)
      .sort((a, b) => {
        switch (sortBy) {
          case "value":
            return b.avgValue - a.avgValue;
          case "count":
            return b.totalRelics - a.totalRelics;
          default:
            return b.score - a.score;
        }
      });
  }, [fissures, alecaRelics, relicsByEra, relicDrops, prices, sortBy]);

  // Best fissure to run
  const bestRun = optimalRuns[0];

  // No AlecaFrame data
  if (!alecaRelics || alecaRelics.relics.length === 0) {
    return (
      <div className="bg-slate-900/50 rounded-xl border border-slate-700/30 p-8 text-center">
        <Package size={48} className="mx-auto mb-4 text-slate-500" />
        <h3 className="text-lg font-bold text-slate-300 mb-2">No Relic Data</h3>
        <p className="text-slate-400 mb-4">
          Import your relics from AlecaFrame to see fissure recommendations.
        </p>
        <p className="text-sm text-slate-500">
          Go to Settings → AlecaFrame Integration to connect your account.
        </p>
      </div>
    );
  }

  // No active fissures
  if (fissures.length === 0) {
    return (
      <div className="bg-slate-900/50 rounded-xl border border-slate-700/30 p-8 text-center">
        <RefreshCw size={48} className="mx-auto mb-4 text-slate-500" />
        <h3 className="text-lg font-bold text-slate-300 mb-2">
          No Active Fissures
        </h3>
        <p className="text-slate-400">Waiting for world state data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Best Recommendation */}
      {bestRun && (
        <div className="bg-gradient-to-r from-cyan-900/40 to-slate-900/50 rounded-xl border border-cyan-700/40 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Zap size={28} className="text-cyan-400" />
            <div>
              <h2 className="text-xl font-bold text-cyan-400">
                Best Fissure to Run
              </h2>
              <p className="text-sm text-slate-400">
                Based on your relics, mission speed, and market value
              </p>
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-lg font-bold text-slate-200">
                  {bestRun.fissure.node}
                </div>
                <div className="text-sm text-slate-400">
                  {bestRun.fissure.tier} • {bestRun.fissure.missionType} •{" "}
                  {bestRun.fissure.enemy}
                </div>
              </div>
              <div className="text-right">
                <div className="text-cyan-400 font-bold text-lg">
                  Score: {bestRun.score}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Clock size={12} />
                  {bestRun.fissure.eta}
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="text-center bg-slate-900/50 rounded-lg p-2">
                <div className="text-xl font-bold text-slate-200">
                  {bestRun.totalRelics}
                </div>
                <div className="text-xs text-slate-500">Owned Relics</div>
              </div>
              <div className="text-center bg-slate-900/50 rounded-lg p-2">
                <div className="text-xl font-bold text-purple-400">
                  {bestRun.avgValue}p
                </div>
                <div className="text-xs text-slate-500">Avg Value</div>
              </div>
              <div className="text-center bg-slate-900/50 rounded-lg p-2">
                <div className="text-xl font-bold text-green-400">
                  {MISSION_SPEED[bestRun.fissure.missionType] || 50}
                </div>
                <div className="text-xs text-slate-500">Speed Rating</div>
              </div>
            </div>

            {/* Top relics to bring */}
            <div className="text-sm text-slate-400 mb-2">
              Best relics to bring:
            </div>
            <div className="flex flex-wrap gap-2">
              {bestRun.relics.map((relic, i) => (
                <span
                  key={i}
                  className="px-2 py-1 bg-cyan-900/30 text-cyan-300 rounded text-xs"
                >
                  {relic.era} {relic.name}
                  <span className="text-purple-400 ml-1">~{relic.value}p</span>
                  <span className="text-slate-500 ml-1">x{relic.count}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Sort Options */}
      <div className="flex gap-3">
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-200"
        >
          <option value="score">Sort by Score</option>
          <option value="value">Sort by Value</option>
          <option value="count">Sort by Relic Count</option>
        </select>
      </div>

      {/* All Matching Fissures */}
      <div className="space-y-3">
        <h3 className="text-lg font-bold text-slate-300">
          All Matching Fissures
        </h3>

        {optimalRuns.length === 0 ? (
          <div className="text-center text-slate-500 py-8">
            <AlertCircle size={32} className="mx-auto mb-2" />
            <p>No fissures match your owned relics.</p>
          </div>
        ) : (
          optimalRuns.map((run, i) => (
            <div
              key={run.fissure.id}
              className={`bg-slate-900/50 rounded-lg border p-4 transition-colors ${
                i === 0
                  ? "border-cyan-700/50"
                  : "border-slate-700/30 hover:border-slate-600/50"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className={`text-center min-w-[50px] ${i === 0 ? "text-cyan-400" : "text-slate-400"}`}
                  >
                    <div className="text-lg font-bold">{run.score}</div>
                    <div className="text-[10px] uppercase">Score</div>
                  </div>
                  <div>
                    <div className="font-bold text-slate-200">
                      {run.fissure.tier} - {run.fissure.node}
                    </div>
                    <div className="text-sm text-slate-400">
                      {run.fissure.missionType} • {run.fissure.enemy} •{" "}
                      {run.fissure.eta}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-slate-300 font-medium">
                    {run.totalRelics} relics
                  </div>
                  <div className="text-sm text-purple-400">
                    {run.avgValue}p avg
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Tips */}
      <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-4">
        <h3 className="font-bold text-slate-300 mb-2">💡 Scoring Explained</h3>
        <ul className="text-sm text-slate-400 space-y-1">
          <li>
            • <strong>Mission Speed</strong>: Capture/Exterminate are fastest
          </li>
          <li>
            • <strong>Relic Count</strong>: More relics = more runs before
            needing to refarm
          </li>
          <li>
            • <strong>Avg Value</strong>: Expected platinum return per relic
          </li>
          <li>• Import prices via Relic Planner → Update Prices</li>
        </ul>
      </div>
    </div>
  );
}
