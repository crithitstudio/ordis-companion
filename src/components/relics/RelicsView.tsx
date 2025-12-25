import { useState, useMemo, useRef, useEffect } from "react";
import {
  Gem,
  Plus,
  Trash2,
  Star,
  Search,
  X,
  ChevronDown,
  Eye,
  TrendingUp,
  Zap,
} from "lucide-react";
import { itemsData } from "../../utils/translations";
import { useToast, DucatIcon } from "../ui";
import { RelicPlannerTab } from "./RelicPlannerTab";
import { FissureOptimizerTab } from "./FissureOptimizerTab";
import type { SavedRelic, Fissure } from "../../types";

interface RelicsViewProps {
  fissures?: Fissure[];
}

// Ducat values based on rarity
// Common: 15, Uncommon: 45, Rare: 100
const DUCAT_VALUES: Record<string, number> = {
  common: 15,
  uncommon: 45,
  rare: 100,
};

// Rarity based on drop position (1-3 common, 4-5 uncommon, 6 rare)
function getDucatValue(dropIndex: number): number {
  if (dropIndex < 3) return DUCAT_VALUES.common;
  if (dropIndex < 5) return DUCAT_VALUES.uncommon;
  return DUCAT_VALUES.rare;
}

function getRarityLabel(dropIndex: number): string {
  if (dropIndex < 3) return "Common";
  if (dropIndex < 5) return "Uncommon";
  return "Rare";
}

const ERAS = ["Lith", "Meso", "Neo", "Axi", "Requiem"];

// Normalize relic name for matching (handles "Lith A1" vs "Lith A1 Relic")
const normalizeRelicName = (name: string): string => {
  return name.toLowerCase().replace(/ relic$/i, "").trim();
};

// Extract all relics from itemsData
function getRelicsFromData(): { name: string; era: string; drops: string[] }[] {
  const relics: { name: string; era: string; drops: string[] }[] = [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Object.values(itemsData).forEach((item: any) => {
    if (item.type === "Relic" || item.category === "Relics") {
      const era = ERAS.find((e) => item.name?.startsWith(e)) || "Other";
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const drops = item.rewards?.map((r: any) => r.item || r.itemName) || [];
      relics.push({
        name: item.name,
        era,
        drops: drops.filter(Boolean),
      });
    }
  });

  return relics.sort((a, b) => a.name.localeCompare(b.name));
}

export function RelicsView({ fissures = [] }: RelicsViewProps) {
  const { addToast } = useToast();

  const [relics, setRelics] = useState<SavedRelic[]>(() => {
    const saved = localStorage.getItem("ordis-relics");
    return saved ? JSON.parse(saved) : [];
  });
  const [filterEra, setFilterEra] = useState<string>("all");
  const [showWanted, setShowWanted] = useState(false);

  // Autocomplete state
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [expandedRelic, setExpandedRelic] = useState<string | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<"manager" | "planner" | "fissures">("manager");

  // Get all relics from item data
  const allRelics = useMemo(() => getRelicsFromData(), []);

  // Calculate total potential ducats from inventory
  const ducatStats = useMemo(() => {
    let totalMin = 0;
    let totalMax = 0;
    let totalAvg = 0;


    relics.forEach((relic) => {
      const normalizedName = normalizeRelicName(relic.name);
      const relicData = allRelics.find(
        (r) => normalizeRelicName(r.name) === normalizedName
      );
      if (relicData && relicData.drops.length > 0) {
        // Min = all commons, Max = all rares, Avg = weighted average
        const minValue = DUCAT_VALUES.common * relic.quantity;
        const maxValue = DUCAT_VALUES.rare * relic.quantity;
        const avgValue =
          ((DUCAT_VALUES.common * 3 +
            DUCAT_VALUES.uncommon * 2 +
            DUCAT_VALUES.rare) /
            6) *
          relic.quantity;
        totalMin += minValue;
        totalMax += maxValue;
        totalAvg += avgValue;
      }
    });

    return { min: totalMin, max: totalMax, avg: Math.round(totalAvg) };
  }, [relics, allRelics]);

  // Filter suggestions based on search
  const suggestions = useMemo(() => {
    if (searchQuery.length < 2) return [];
    const query = searchQuery.toLowerCase();
    return allRelics
      .filter((r) => r.name.toLowerCase().includes(query))
      .slice(0, 10);
  }, [allRelics, searchQuery]);

  // Close suggestions on click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Get drops for a relic
  const getRelicDrops = (relicName: string): string[] => {
    const normalizedName = normalizeRelicName(relicName);
    const relic = allRelics.find(
      (r) => normalizeRelicName(r.name) === normalizedName
    );
    return relic?.drops || [];
  };

  const saveRelics = (newRelics: SavedRelic[]) => {
    setRelics(newRelics);
    localStorage.setItem("ordis-relics", JSON.stringify(newRelics));
  };

  const addRelicFromSearch = (relicInfo: { name: string; era: string }) => {
    const newRelic: SavedRelic = {
      // eslint-disable-next-line react-hooks/purity
      id: Date.now().toString(),
      name: relicInfo.name,
      era: relicInfo.era,
      refinement: "Intact",
      quantity: 1,
      wanted: false,
    };
    saveRelics([...relics, newRelic]);
    setSearchQuery("");
    setShowSuggestions(false);
    setShowAddForm(false);
    addToast(`Added ${relicInfo.name}`, "success");
  };

  const addCustomRelic = (era: string) => {
    const relicName = prompt(`Enter relic name (e.g., ${era} A1):`);
    if (!relicName) return;

    const newRelic: SavedRelic = {
      // eslint-disable-next-line react-hooks/purity
      id: Date.now().toString(),
      name: relicName.trim(),
      era,
      refinement: "Intact",
      quantity: 1,
      wanted: false,
    };
    saveRelics([...relics, newRelic]);
    addToast(`Added ${relicName}`, "success");
  };

  const updateRelic = (id: string, updates: Partial<SavedRelic>) => {
    saveRelics(relics.map((r) => (r.id === id ? { ...r, ...updates } : r)));
  };

  const removeRelic = (id: string) => {
    const relic = relics.find((r) => r.id === id);
    saveRelics(relics.filter((r) => r.id !== id));
    if (relic) addToast(`Removed ${relic.name}`, "info");
  };

  const filteredRelics = relics.filter((r) => {
    if (filterEra !== "all" && r.era !== filterEra) return false;
    if (showWanted && !r.wanted) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab("manager")}
          className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${activeTab === "manager"
            ? "bg-amber-600 text-white"
            : "bg-slate-800 text-slate-400 hover:bg-slate-700"
            }`}
        >
          <Gem size={18} /> My Relics
        </button>
        <button
          onClick={() => setActiveTab("planner")}
          className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${activeTab === "planner"
            ? "bg-purple-600 text-white"
            : "bg-slate-800 text-slate-400 hover:bg-slate-700"
            }`}
        >
          <TrendingUp size={18} /> Relic Planner
        </button>
        <button
          onClick={() => setActiveTab("fissures")}
          className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${activeTab === "fissures"
            ? "bg-cyan-600 text-white"
            : "bg-slate-800 text-slate-400 hover:bg-slate-700"
            }`}
        >
          <Zap size={18} /> Fissure Optimizer
        </button>
      </div>

      {/* Fissure Optimizer Tab */}
      {activeTab === "fissures" && <FissureOptimizerTab fissures={fissures} />}

      {/* Relic Planner Tab */}
      {activeTab === "planner" && <RelicPlannerTab />}

      {/* Relic Manager Tab */}
      {activeTab === "manager" && (
        <div className="bg-slate-900/50 rounded-xl border border-amber-900/30 p-6">
          <h2 className="text-2xl font-bold text-amber-400 mb-4 flex items-center gap-3">
            <Gem size={28} /> Relic Manager
            <span className="text-sm font-normal text-slate-500 ml-auto">
              {relics.length} relics tracked
            </span>
          </h2>
          <p className="text-slate-400 mb-6">
            Track your void relic inventory and wishlist. Search for relics to see
            their drops.
          </p>

          {/* Ducat Value Summary */}
          {relics.length > 0 && (
            <div className="bg-gradient-to-r from-amber-900/30 to-slate-900/50 rounded-lg p-4 mb-6 border border-amber-700/30">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <DucatIcon size={20} />
                  <span className="text-amber-400 font-medium">
                    Potential Ducats
                  </span>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div className="text-center">
                    <div className="text-slate-500">Minimum</div>
                    <div className="text-slate-300 font-bold">
                      {ducatStats.min.toLocaleString()}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-amber-400">Average</div>
                    <div className="text-amber-300 font-bold text-lg">
                      {ducatStats.avg.toLocaleString()}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-slate-500">Maximum</div>
                    <div className="text-slate-300 font-bold">
                      {ducatStats.max.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Add Relic Section */}
          <div className="bg-slate-800/30 rounded-lg p-4 mb-6 border border-slate-700/50">
            {!showAddForm ? (
              <button
                onClick={() => setShowAddForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-medium transition-colors"
              >
                <Plus size={18} /> Add Relic
              </button>
            ) : (
              <div className="space-y-4">
                {/* Autocomplete Search */}
                <div ref={searchRef} className="relative">
                  <Search
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                    size={20}
                  />
                  <input
                    type="text"
                    placeholder="Search relics (e.g., Lith A1, Axi L5)..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    className="w-full pl-12 pr-10 py-3 bg-slate-800 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    >
                      <X size={18} />
                    </button>
                  )}

                  {/* Suggestions Dropdown */}
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-10 max-h-60 overflow-y-auto">
                      {suggestions.map((relic) => (
                        <button
                          key={relic.name}
                          onClick={() => addRelicFromSearch(relic)}
                          className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-700 transition-colors text-left border-b border-slate-700/50 last:border-0"
                        >
                          <div>
                            <span className="text-slate-200 font-medium">
                              {relic.name}
                            </span>
                            <span className="text-xs text-slate-500 ml-2">
                              {relic.era} Era
                            </span>
                          </div>
                          {relic.drops.length > 0 && (
                            <span className="text-xs text-amber-400">
                              {relic.drops.length} drops
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quick Add Buttons */}
                <div className="flex flex-wrap gap-2">
                  <span className="text-slate-400 text-sm">Or add manually:</span>
                  {ERAS.map((era) => (
                    <button
                      key={era}
                      onClick={() => addCustomRelic(era)}
                      className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded text-sm transition-colors"
                    >
                      {era}
                    </button>
                  ))}
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded text-sm ml-auto"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-6">
            <select
              value={filterEra}
              onChange={(e) => setFilterEra(e.target.value)}
              className="px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-200"
              aria-label="Filter by era"
            >
              <option value="all">All Eras</option>
              {ERAS.map((era) => (
                <option key={era} value={era}>
                  {era}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={showWanted}
                onChange={(e) => setShowWanted(e.target.checked)}
                className="rounded bg-slate-800 border-slate-600 accent-amber-500"
              />
              Show only wanted
            </label>
          </div>

          {/* Relic List */}
          {filteredRelics.length === 0 ? (
            <div className="text-center text-slate-500 py-8">
              <Gem size={48} className="mx-auto mb-4 opacity-50" />
              <p>No relics tracked yet. Click "Add Relic" above to start!</p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {filteredRelics.map((relic) => {
                const drops = getRelicDrops(relic.name);
                const isExpanded = expandedRelic === relic.id;

                return (
                  <div
                    key={relic.id}
                    className={`bg-slate-800/30 rounded-lg border transition-all hover-lift ${relic.wanted ? "border-amber-500/50" : "border-slate-700/50"
                      }`}
                  >
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="text-slate-200 font-medium flex items-center gap-2">
                            {relic.name}
                            {relic.wanted && (
                              <Star
                                size={14}
                                className="text-amber-400 fill-amber-400"
                              />
                            )}
                          </h4>
                          <p className="text-xs text-slate-500">
                            {relic.era} Era
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          {drops.length > 0 && (
                            <button
                              onClick={() =>
                                setExpandedRelic(isExpanded ? null : relic.id)
                              }
                              className="p-1 text-slate-500 hover:text-amber-400 transition-colors"
                              title="View drops"
                              aria-label={`View drops for ${relic.name}`}
                            >
                              <Eye size={16} />
                            </button>
                          )}
                          <button
                            onClick={() => removeRelic(relic.id)}
                            className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                            aria-label="Remove relic"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mb-2">
                        <select
                          value={relic.refinement}
                          onChange={(e) =>
                            updateRelic(relic.id, {
                              refinement: e.target
                                .value as SavedRelic["refinement"],
                            })
                          }
                          className="flex-1 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-sm text-slate-200"
                          aria-label="Refinement level"
                        >
                          <option>Intact</option>
                          <option>Exceptional</option>
                          <option>Flawless</option>
                          <option>Radiant</option>
                        </select>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() =>
                              updateRelic(relic.id, {
                                quantity: Math.max(0, relic.quantity - 1),
                              })
                            }
                            className="px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-slate-300"
                            aria-label="Decrease quantity"
                          >
                            -
                          </button>
                          <span className="w-8 text-center text-slate-200">
                            {relic.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateRelic(relic.id, {
                                quantity: relic.quantity + 1,
                              })
                            }
                            className="px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-slate-300"
                            aria-label="Increase quantity"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <button
                        onClick={() =>
                          updateRelic(relic.id, { wanted: !relic.wanted })
                        }
                        className={`w-full py-1 rounded text-sm transition-colors ${relic.wanted
                          ? "bg-amber-600/20 text-amber-400"
                          : "bg-slate-700/50 text-slate-400 hover:bg-slate-700"
                          }`}
                      >
                        {relic.wanted ? "★ Wanted" : "☆ Mark as Wanted"}
                      </button>
                    </div>

                    {/* Expanded Drops View */}
                    {isExpanded && drops.length > 0 && (
                      <div className="px-4 pb-4 border-t border-slate-700/50 pt-3">
                        <div className="text-xs text-slate-500 mb-2 flex items-center gap-1">
                          <ChevronDown size={14} /> Possible Drops ({drops.length}
                          )
                        </div>
                        <div className="space-y-1">
                          {drops.map((drop, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between px-2 py-1 bg-slate-700/50 rounded text-xs"
                            >
                              <span className="text-slate-300">{drop}</span>
                              <span
                                className={`font-medium ${idx < 3
                                  ? "text-slate-400"
                                  : idx < 5
                                    ? "text-blue-400"
                                    : "text-amber-400"
                                  }`}
                              >
                                {getDucatValue(idx)}{" "}
                                <DucatIcon size={10} className="inline" />
                                <span className="text-slate-500 ml-1">
                                  ({getRarityLabel(idx)})
                                </span>
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
