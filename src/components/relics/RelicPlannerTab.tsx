/**
 * Relic Planner Tab
 * Shows AlecaFrame imported relics with value recommendations
 */
import { useState, useMemo, useCallback } from "react";
import { RefreshCw, TrendingUp, Package, AlertCircle } from "lucide-react";
import { useToast } from "../ui";
import { getCachedRelics } from "../../services/alecaframeApi";
import {
  fetchItemPrices,
  getCachedPrices,
  type PriceData,
} from "../../services/priceService";
import { itemsData } from "../../utils/translations";

interface RelicWithValue {
  name: string;
  era: string;
  refinement: string;
  count: number;
  expectedValue: number;
  maxValue: number;
  drops: { item: string; rarity: string; price: number }[];
}

const ERAS = ["Lith", "Meso", "Neo", "Axi", "Requiem"];

// Get relic data from itemsData
function getRelicData(): Map<
  string,
  { drops: string[]; dropRarities: string[] }
> {
  const relics = new Map<string, { drops: string[]; dropRarities: string[] }>();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Object.values(itemsData).forEach((item: any) => {
    if (item.type === "Relic" || item.category === "Relics") {
      const drops: string[] = [];
      const rarities: string[] = [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      item.rewards?.forEach((r: any, i: number) => {
        const itemName = r.item || r.itemName;
        if (itemName) {
          drops.push(itemName);
          // Rarity based on position: 0-2 common, 3-4 uncommon, 5 rare
          const rarity = i < 3 ? "Common" : i < 5 ? "Uncommon" : "Rare";
          rarities.push(rarity);
        }
      });

      if (drops.length > 0) {
        // Normalize name
        const name = item.name.replace(/ Relic$/i, "").trim();
        relics.set(name, { drops, dropRarities: rarities });
      }
    }
  });

  return relics;
}

export function RelicPlannerTab() {
  const { addToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [sortBy, setSortBy] = useState<"value" | "count" | "era">("value");
  const [filterEra, setFilterEra] = useState<string>("all");
  const [prices, setPrices] =
    useState<Map<string, PriceData>>(getCachedPrices());

  // Get AlecaFrame relics
  const alecaRelics = getCachedRelics();

  // Get relic drop data
  const relicData = useMemo(() => getRelicData(), []);

  // Build relics with value calculations
  const relicsWithValue = useMemo<RelicWithValue[]>(() => {
    if (!alecaRelics) return [];

    return alecaRelics.relics.map((relic) => {
      const fullName = `${relic.type} ${relic.name}`;
      const data = relicData.get(fullName);

      const drops: { item: string; rarity: string; price: number }[] = [];
      let expectedValue = 0;
      let maxValue = 0;

      if (data) {
        data.drops.forEach((item, i) => {
          const price = prices.get(item)?.platinum || 0;
          const rarity = data.dropRarities[i] || "Common";

          // Weight by rarity (common: 25.33%, uncommon: 11%, rare: 2%)
          const chance =
            rarity === "Rare" ? 0.02 : rarity === "Uncommon" ? 0.11 : 0.2533;
          expectedValue += price * chance;
          if (price > maxValue) maxValue = price;

          drops.push({ item, rarity, price });
        });
      }

      return {
        name: relic.name,
        era: relic.type,
        refinement: relic.refinement || "Intact",
        count: relic.count,
        expectedValue: Math.round(expectedValue * 100) / 100,
        maxValue,
        drops,
      };
    });
  }, [alecaRelics, relicData, prices]);

  // Fetch prices for all drop items
  const fetchPrices = useCallback(async () => {
    if (!alecaRelics || relicsWithValue.length === 0) return;

    setIsLoading(true);
    try {
      // Collect all unique drop items
      const allItems = new Set<string>();
      relicsWithValue.forEach((relic) => {
        relic.drops.forEach((drop) => allItems.add(drop.item));
      });

      // Fetch prices (limited to first 50 to avoid rate limits)
      const itemsToFetch = Array.from(allItems).slice(0, 50);
      const newPrices = await fetchItemPrices(itemsToFetch);

      setPrices(new Map([...prices, ...newPrices]));
      addToast(`Fetched prices for ${newPrices.size} items`, "success");
    } catch {
      addToast("Failed to fetch prices", "error");
    } finally {
      setIsLoading(false);
    }
  }, [alecaRelics, relicsWithValue, prices, addToast]);

  // Sorted and filtered relics
  const displayRelics = useMemo(() => {
    let filtered = relicsWithValue;

    if (filterEra !== "all") {
      filtered = filtered.filter((r) => r.era === filterEra);
    }

    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "value":
          return b.expectedValue - a.expectedValue;
        case "count":
          return b.count - a.count;
        case "era":
          return ERAS.indexOf(a.era) - ERAS.indexOf(b.era);
        default:
          return 0;
      }
    });
  }, [relicsWithValue, filterEra, sortBy]);

  // Top recommendations (highest value relics)
  const topRelics = useMemo(() => {
    return [...relicsWithValue]
      .filter((r) => r.expectedValue > 0)
      .sort((a, b) => b.expectedValue - a.expectedValue)
      .slice(0, 5);
  }, [relicsWithValue]);

  // No AlecaFrame data
  if (!alecaRelics || alecaRelics.relics.length === 0) {
    return (
      <div className="bg-slate-900/50 rounded-xl border border-slate-700/30 p-8 text-center">
        <Package size={48} className="mx-auto mb-4 text-slate-500" />
        <h3 className="text-lg font-bold text-slate-300 mb-2">No Relic Data</h3>
        <p className="text-slate-400 mb-4">
          Import your relics from AlecaFrame to see recommendations.
        </p>
        <p className="text-sm text-slate-500">
          Go to Settings → AlecaFrame Integration to connect your account.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900/30 to-slate-900/50 rounded-xl border border-purple-700/30 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <TrendingUp size={28} className="text-purple-400" />
            <div>
              <h2 className="text-xl font-bold text-purple-400">
                Relic Planner
              </h2>
              <p className="text-sm text-slate-400">
                {alecaRelics.totalRelics.toLocaleString()} relics • Last updated{" "}
                {new Date(alecaRelics.fetchedAt).toLocaleString()}
              </p>
            </div>
          </div>
          <button
            onClick={fetchPrices}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
            {isLoading ? "Fetching..." : "Update Prices"}
          </button>
        </div>

        {/* Top Recommendations */}
        {topRelics.length > 0 && (
          <div className="bg-slate-800/50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-purple-400 mb-3 flex items-center gap-2">
              <TrendingUp size={14} /> Best Relics to Open
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {topRelics.map((relic, i) => (
                <div
                  key={`${relic.era}-${relic.name}-${i}`}
                  className="bg-slate-700/50 rounded-lg p-3 text-center"
                >
                  <div className="text-xs text-slate-400">{relic.era}</div>
                  <div className="font-bold text-slate-200">{relic.name}</div>
                  <div className="text-purple-400 font-medium">
                    ~{relic.expectedValue.toFixed(1)}{" "}
                    <span className="text-xs">p</span>
                  </div>
                  <div className="text-xs text-slate-500">x{relic.count}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={filterEra}
          onChange={(e) => setFilterEra(e.target.value)}
          className="px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-200"
        >
          <option value="all">All Eras</option>
          {ERAS.map((era) => (
            <option key={era} value={era}>
              {era}
            </option>
          ))}
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-200"
        >
          <option value="value">Sort by Value</option>
          <option value="count">Sort by Count</option>
          <option value="era">Sort by Era</option>
        </select>
      </div>

      {/* Relic List */}
      <div className="space-y-2">
        {displayRelics.length === 0 ? (
          <div className="text-center text-slate-500 py-8">
            <AlertCircle size={32} className="mx-auto mb-2" />
            <p>No relics match the current filter.</p>
          </div>
        ) : (
          displayRelics.map((relic, i) => (
            <div
              key={`${relic.era}-${relic.name}-${i}`}
              className="bg-slate-900/50 rounded-lg border border-slate-700/30 p-4 hover:border-purple-700/30 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-center min-w-[60px]">
                    <div className="text-2xl font-bold text-slate-200">
                      {relic.count}
                    </div>
                    <div className="text-xs text-slate-500">owned</div>
                  </div>
                  <div>
                    <div className="font-bold text-slate-200">
                      {relic.era} {relic.name}
                    </div>
                    <div className="text-sm text-slate-400">
                      {relic.refinement}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-purple-400 font-bold">
                    ~{relic.expectedValue.toFixed(1)}{" "}
                    <span className="text-xs">p</span>
                  </div>
                  {relic.maxValue > 0 && (
                    <div className="text-xs text-slate-500">
                      Max: {relic.maxValue}p
                    </div>
                  )}
                </div>
              </div>

              {/* Drops Preview */}
              {relic.drops.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-700/50 flex flex-wrap gap-2">
                  {relic.drops.slice(0, 6).map((drop, j) => (
                    <div
                      key={j}
                      className={`px-2 py-1 rounded text-xs ${
                        drop.rarity === "Rare"
                          ? "bg-amber-900/30 text-amber-300"
                          : drop.rarity === "Uncommon"
                            ? "bg-blue-900/30 text-blue-300"
                            : "bg-slate-700/50 text-slate-400"
                      }`}
                    >
                      {drop.item
                        .replace(" Prime", "")
                        .replace(" Blueprint", " BP")}
                      {drop.price > 0 && (
                        <span className="ml-1 text-purple-400">
                          {drop.price}p
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Tip */}
      <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-4">
        <h3 className="font-bold text-slate-300 mb-2">💡 Tips</h3>
        <ul className="text-sm text-slate-400 space-y-1">
          <li>
            • Expected value is calculated using drop chances and current market
            prices
          </li>
          <li>
            • Prices are fetched from{" "}
            <a
              href="https://warframe.market"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-400 hover:text-purple-300"
            >
              warframe.market
            </a>
          </li>
          <li>• Update prices regularly for accurate recommendations</li>
          <li>
            • Radiant refinement increases rare drop chance from 2% to 10%
          </li>
        </ul>
      </div>
    </div>
  );
}
