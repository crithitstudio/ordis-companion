import { useState, useMemo } from "react";
import {
  Search,
  Gem,
  Target,
  ChevronDown,
  ChevronUp,
  Zap,
  Clock,
  ExternalLink,
  Plus,
  Check,
  MapPin,
} from "lucide-react";
import { itemsData } from "../../utils/translations";
import { ItemImage } from "../ui";
import { useDebounce } from "../../hooks/useDebounce";
import type { Fissure, SavedItem } from "../../types";

// Common resource farming locations
const RESOURCE_FARMING_LOCATIONS: {
  resource: string;
  missions: { name: string; planet: string; type: string; notes: string }[];
}[] = [
  {
    resource: "Orokin Cell",
    missions: [
      {
        name: "Helene",
        planet: "Saturn",
        type: "Defense",
        notes: "20 waves, General Sargas Ruk drops",
      },
      {
        name: "Gabii",
        planet: "Ceres",
        type: "Dark Sector Survival",
        notes: "Stay 20+ minutes",
      },
    ],
  },
  {
    resource: "Neurodes",
    missions: [
      {
        name: "Tycho",
        planet: "Lua",
        type: "Survival",
        notes: "Sentients drop guaranteed",
      },
      {
        name: "Mariana",
        planet: "Earth",
        type: "Exterminate",
        notes: "Low level, fast runs",
      },
    ],
  },
  {
    resource: "Argon Crystal",
    missions: [
      {
        name: "Void Capture",
        planet: "Void",
        type: "Capture",
        notes: "Quick runs, check containers",
      },
      {
        name: "Mot",
        planet: "Void",
        type: "Survival",
        notes: "High level, good drops",
      },
    ],
  },
  {
    resource: "Polymer Bundle",
    missions: [
      {
        name: "Ophelia",
        planet: "Uranus",
        type: "Survival",
        notes: "Also drops Plastids and Tellurium",
      },
      {
        name: "Assur",
        planet: "Uranus",
        type: "Dark Sector Survival",
        notes: "35% bonus resources",
      },
    ],
  },
  {
    resource: "Plastids",
    missions: [
      {
        name: "Ophelia",
        planet: "Uranus",
        type: "Survival",
        notes: "Multi-resource farm",
      },
      {
        name: "Piscinas",
        planet: "Saturn",
        type: "Dark Sector Survival",
        notes: "20% bonus resources",
      },
    ],
  },
  {
    resource: "Cryotic",
    missions: [
      {
        name: "Hieracon",
        planet: "Pluto",
        type: "Excavation",
        notes: "100 per excavator",
      },
    ],
  },
  {
    resource: "Oxium",
    missions: [
      {
        name: "Io",
        planet: "Jupiter",
        type: "Defense",
        notes: "Oxium Ospreys spawn often",
      },
      {
        name: "Outer Terminus",
        planet: "Pluto",
        type: "Defense",
        notes: "Higher enemy levels",
      },
    ],
  },
  {
    resource: "Tellurium",
    missions: [
      {
        name: "Ophelia",
        planet: "Uranus",
        type: "Survival",
        notes: "Best farm location",
      },
      {
        name: "Archwing",
        planet: "Any",
        type: "Archwing Mission",
        notes: "Any Archwing mission",
      },
    ],
  },
];

// Relic era pattern
const RELIC_PATTERN = /^(Lith|Meso|Neo|Axi|Requiem)\s+([A-Z]\d+)\s+Relic/i;

interface PrimeDrop {
  item: string;
  imageName?: string;
  uniqueName?: string;
  sources: {
    relic: string;
    era: string;
    refinement: string;
    rarity: string;
    chance: number;
  }[];
}

interface FarmingRoute {
  item: string;
  relics: string[];
  activeFissures: Fissure[];
  bestFissure?: Fissure;
}

/**
 * Extract Prime drops that come FROM relics
 * Uses drop.type for the actual Prime part name
 */
function getPrimeDrops(): PrimeDrop[] {
  const dropMap = new Map<string, PrimeDrop>();

  Object.entries(itemsData).forEach(([, item]) => {
    if (!item.drops) return;

    item.drops.forEach((drop) => {
      const loc = drop.location || "";
      if (!loc.includes("Relic")) return;

      const relicMatch = loc.match(/^(.+?\s+Relic)(?:\s+\((.+?)\))?$/);
      if (!relicMatch) return;

      const relicName = relicMatch[1];
      const refinement = relicMatch[2] || "Intact";

      // Get era from relic name
      const eraMatch = relicName.match(RELIC_PATTERN);
      const era = eraMatch ? eraMatch[1] : "Unknown";

      // Use drop.type for the actual Prime part name (e.g. "Kogake Prime Boot")
      const itemName = drop.type || item.name;

      const existing = dropMap.get(itemName);
      if (existing) {
        existing.sources.push({
          relic: relicName,
          era,
          refinement,
          rarity: drop.rarity || "Common",
          chance: drop.chance || 0,
        });
      } else {
        dropMap.set(itemName, {
          item: itemName,
          imageName: item.imageName || undefined,
          uniqueName: undefined, // drop.type items may not have uniqueName
          sources: [
            {
              relic: relicName,
              era,
              refinement,
              rarity: drop.rarity || "Common",
              chance: drop.chance || 0,
            },
          ],
        });
      }
    });
  });

  return Array.from(dropMap.values())
    .map((p) => ({
      ...p,
      sources: p.sources.sort((a, b) => b.chance - a.chance),
    }))
    .sort((a, b) => a.item.localeCompare(b.item));
}

/**
 * Find matching fissures for a given set of relic eras
 */
function findMatchingFissures(
  eras: Set<string>,
  fissures: Fissure[],
): Fissure[] {
  return fissures.filter((f) => {
    const fissureEra = f.tier; // Fissure tier is "Lith", "Meso", etc.
    return eras.has(fissureEra);
  });
}

/**
 * Score a fissure for farming efficiency
 * Lower time = better, Capture/Exterminate are fastest
 */
function scoreFissure(fissure: Fissure): number {
  let score = 100;

  // Fast mission types are preferred
  const fastMissions = ["Capture", "Exterminate", "Rescue", "Sabotage"];
  const mediumMissions = ["Spy", "Mobile Defense", "Excavation"];

  if (fastMissions.includes(fissure.missionType)) {
    score += 50;
  } else if (mediumMissions.includes(fissure.missionType)) {
    score += 25;
  }

  // Corpus/Grineer preference (avoid Infested for some players)
  if (fissure.enemy === "Corpus" || fissure.enemy === "Grineer") {
    score += 10;
  }

  return score;
}

interface FarmingViewProps {
  fissures: Fissure[];
}

export function FarmingView({ fissures }: FarmingViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [wantedItems, setWantedItems] = useState<Set<string>>(() => {
    const saved = localStorage.getItem("ordis-wanted-items");
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  const primeDrops = useMemo(() => getPrimeDrops(), []);

  // Filter items based on search (uses debounced value for performance)
  const filteredItems = useMemo(() => {
    if (debouncedSearchQuery.length < 2) return [];
    const q = debouncedSearchQuery.toLowerCase();
    return primeDrops
      .filter((p) => p.item.toLowerCase().includes(q))
      .slice(0, 50);
  }, [primeDrops, debouncedSearchQuery]);

  // Calculate farming routes for wanted items
  const farmingRoutes = useMemo((): FarmingRoute[] => {
    if (wantedItems.size === 0) return [];

    return Array.from(wantedItems)
      .map((itemName) => {
        const drop = primeDrops.find((p) => p.item === itemName);
        if (!drop)
          return {
            item: itemName,
            relics: [],
            activeFissures: [],
            bestFissure: undefined,
          };

        const relics = [...new Set(drop.sources.map((s) => s.relic))];
        const eras = new Set(drop.sources.map((s) => s.era));
        const matchingFissures = findMatchingFissures(eras, fissures);

        // Find best fissure
        const scoredFissures = matchingFissures
          .map((f) => ({ fissure: f, score: scoreFissure(f) }))
          .sort((a, b) => b.score - a.score);

        return {
          item: itemName,
          relics,
          activeFissures: matchingFissures,
          bestFissure: scoredFissures[0]?.fissure,
        };
      })
      .filter((r) => r.relics.length > 0);
  }, [wantedItems, primeDrops, fissures]);

  const toggleWanted = (itemName: string) => {
    setWantedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemName)) {
        newSet.delete(itemName);
      } else {
        newSet.add(itemName);
      }
      localStorage.setItem("ordis-wanted-items", JSON.stringify([...newSet]));
      return newSet;
    });
  };

  const addToTracker = (itemName: string) => {
    const saved = JSON.parse(
      localStorage.getItem("ordis-tracker") || "[]",
    ) as SavedItem[];
    if (!saved.find((s) => s.name === itemName)) {
      saved.push({
        id: Date.now().toString(),
        name: itemName,
        category: "Prime",
        notes: "Added from Farming Route",
        completed: false,
        addedAt: Date.now(),
      });
      localStorage.setItem("ordis-tracker", JSON.stringify(saved));
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case "common":
        return "text-amber-200 bg-amber-900/30";
      case "uncommon":
        return "text-slate-200 bg-slate-600/50";
      case "rare":
        return "text-yellow-300 bg-yellow-900/50";
      default:
        return "text-slate-400 bg-slate-800";
    }
  };

  const getEraColor = (era: string) => {
    switch (era?.toLowerCase()) {
      case "lith":
        return "text-amber-300 border-amber-500/50";
      case "meso":
        return "text-slate-300 border-slate-500/50";
      case "neo":
        return "text-blue-300 border-blue-500/50";
      case "axi":
        return "text-yellow-400 border-yellow-500/50";
      case "requiem":
        return "text-purple-400 border-purple-500/50";
      default:
        return "text-slate-400 border-slate-500/50";
    }
  };

  return (
    <div className="space-y-6">
      {/* Active Farming Routes */}
      {farmingRoutes.length > 0 && (
        <div className="bg-slate-900/50 rounded-xl border border-green-900/30 p-6">
          <h2 className="text-2xl font-bold text-green-400 mb-4 flex items-center gap-3">
            <Target size={28} /> Active Farming Routes
          </h2>
          <p className="text-slate-400 mb-4">
            Based on your wanted items and current fissures
          </p>

          <div className="grid gap-4">
            {farmingRoutes.map((route) => (
              <div
                key={route.item}
                className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Gem size={20} className="text-amber-400" />
                    <h3 className="text-slate-200 font-medium">{route.item}</h3>
                  </div>
                  <button
                    onClick={() => toggleWanted(route.item)}
                    className="p-2 text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Remove from wanted"
                    aria-label={`Remove ${route.item} from wanted list`}
                  >
                    ×
                  </button>
                </div>

                {/* Best fissure recommendation */}
                {route.bestFissure ? (
                  <div className="bg-green-900/20 border border-green-700/30 rounded-lg p-3 mb-3">
                    <div className="flex items-center gap-2 text-green-400 text-sm font-medium mb-2">
                      <Zap size={16} /> Recommended Fissure
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-slate-200">
                          {route.bestFissure.node}
                        </p>
                        <p className="text-sm text-slate-400">
                          {route.bestFissure.tier} •{" "}
                          {route.bestFissure.missionType} •{" "}
                          {route.bestFissure.enemy}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-slate-400 text-sm">
                        <Clock size={14} />
                        {route.bestFissure.eta}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-800/50 border border-slate-700/30 rounded-lg p-3 mb-3">
                    <p className="text-slate-500 text-sm">
                      No active fissures for this item's relics. Check back
                      later!
                    </p>
                  </div>
                )}

                {/* All matching fissures */}
                {route.activeFissures.length > 1 && (
                  <details className="text-sm">
                    <summary className="text-slate-400 cursor-pointer hover:text-slate-300">
                      {route.activeFissures.length} matching fissures available
                    </summary>
                    <div className="mt-2 space-y-1">
                      {route.activeFissures.slice(1).map((f) => (
                        <div
                          key={f.id}
                          className="flex items-center justify-between py-1 px-2 bg-slate-900/50 rounded"
                        >
                          <span className="text-slate-300">{f.node}</span>
                          <span className="text-slate-500">
                            {f.missionType}
                          </span>
                        </div>
                      ))}
                    </div>
                  </details>
                )}

                {/* Relics for this item */}
                <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-700/50">
                  {route.relics.slice(0, 5).map((relic) => {
                    const era = relic.match(RELIC_PATTERN)?.[1] || "";
                    return (
                      <span
                        key={relic}
                        className={`px-2 py-1 rounded text-xs border ${getEraColor(era)}`}
                      >
                        {relic}
                      </span>
                    );
                  })}
                  {route.relics.length > 5 && (
                    <span className="px-2 py-1 text-slate-500 text-xs">
                      +{route.relics.length - 5} more
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search for items to farm */}
      <div className="bg-slate-900/50 rounded-xl border border-amber-900/30 p-6">
        <h2 className="text-2xl font-bold text-amber-400 mb-4 flex items-center gap-3">
          <Search size={28} /> Find Prime Parts
        </h2>
        <p className="text-slate-400 mb-4">
          Search for Prime parts to find which relics contain them and plan your
          farming.
        </p>

        {/* Search Box */}
        <div className="relative mb-4">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
            size={20}
          />
          <input
            type="text"
            placeholder="Search Prime parts (e.g. Rhino, Neuroptics, Barrel)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:border-amber-500 focus:outline-none"
          />
        </div>

        {/* Results */}
        <div className="space-y-2 max-h-[50vh] overflow-y-auto">
          {searchQuery.length < 2 ? (
            <div className="text-center text-slate-500 py-8">
              <Gem size={48} className="mx-auto mb-4 opacity-50" />
              <p>Type at least 2 characters to search</p>
              <p className="text-xs mt-2">
                Find relics containing specific Prime parts
              </p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center text-slate-500 py-8">
              <p>No results found for "{searchQuery}"</p>
            </div>
          ) : (
            filteredItems.map((item) => {
              const isWanted = wantedItems.has(item.item);
              const eras = new Set(item.sources.map((s) => s.era));
              const matchingFissures = findMatchingFissures(eras, fissures);

              return (
                <div
                  key={item.item}
                  className="bg-slate-800/50 rounded-lg border border-slate-700/50"
                >
                  <button
                    onClick={() =>
                      setExpandedItem(
                        expandedItem === item.item ? null : item.item,
                      )
                    }
                    className="w-full p-3 flex items-center justify-between text-left"
                  >
                    <div className="flex items-center gap-3">
                      <ItemImage
                        itemPath={item.uniqueName}
                        name={item.item}
                        category="Prime"
                        size={32}
                      />
                      <div>
                        <span className="text-slate-200 font-medium">
                          {item.item}
                        </span>
                        {matchingFissures.length > 0 && (
                          <span className="ml-2 text-xs text-green-400">
                            {matchingFissures.length} active fissures
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleWanted(item.item);
                        }}
                        className={`p-2 rounded-lg transition-colors ${
                          isWanted
                            ? "bg-green-600/20 text-green-400"
                            : "bg-slate-700 text-slate-400 hover:bg-slate-600"
                        }`}
                        title={
                          isWanted
                            ? "Remove from farming list"
                            : "Add to farming list"
                        }
                      >
                        {isWanted ? <Check size={16} /> : <Plus size={16} />}
                      </button>
                      {expandedItem === item.item ? (
                        <ChevronUp size={18} className="text-slate-500" />
                      ) : (
                        <ChevronDown size={18} className="text-slate-500" />
                      )}
                    </div>
                  </button>
                  {expandedItem === item.item && (
                    <div className="px-3 pb-3 space-y-3">
                      {/* Matching fissures */}
                      {matchingFissures.length > 0 && (
                        <div className="bg-green-900/10 border border-green-700/30 rounded-lg p-3">
                          <h4 className="text-sm font-medium text-green-400 mb-2 flex items-center gap-2">
                            <Zap size={14} /> Active Fissures for this Item
                          </h4>
                          <div className="space-y-1">
                            {matchingFissures.slice(0, 3).map((f) => (
                              <div
                                key={f.id}
                                className="flex items-center justify-between text-sm"
                              >
                                <span className="text-slate-300">
                                  <span
                                    className={
                                      getEraColor(f.tier).split(" ")[0]
                                    }
                                  >
                                    {f.tier}
                                  </span>{" "}
                                  • {f.node}
                                </span>
                                <span className="text-slate-500">
                                  {f.missionType} • {f.eta}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Relic sources with drop chance bars */}
                      <div>
                        <h4 className="text-sm font-medium text-slate-400 mb-2">
                          Drop Sources ({item.sources.length} relics)
                        </h4>
                        {item.sources.slice(0, 10).map((src, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-2 py-1.5 px-2 bg-slate-900/50 rounded text-sm mb-1"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={
                                      getEraColor(src.era).split(" ")[0]
                                    }
                                  >
                                    {src.relic}
                                  </span>
                                  <span className="text-xs text-slate-500">
                                    ({src.refinement})
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`px-2 py-0.5 rounded text-xs ${getRarityColor(src.rarity)}`}
                                  >
                                    {src.rarity}
                                  </span>
                                  <span className="text-xs text-slate-400 font-mono w-12 text-right">
                                    {src.chance > 0
                                      ? `${src.chance.toFixed(1)}%`
                                      : "?%"}
                                  </span>
                                </div>
                              </div>
                              {/* Visual drop chance bar */}
                              {src.chance > 0 && (
                                <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full transition-all ${
                                      src.rarity.toLowerCase() === "rare"
                                        ? "bg-yellow-500"
                                        : src.rarity.toLowerCase() ===
                                            "uncommon"
                                          ? "bg-blue-500"
                                          : "bg-amber-600"
                                    }`}
                                    style={{
                                      width: `${Math.min(100, src.chance * 3)}%`,
                                    }}
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                        {item.sources.length > 10 && (
                          <p className="text-xs text-slate-500 text-center py-1">
                            +{item.sources.length - 10} more sources
                          </p>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-2 pt-2 border-t border-slate-700/50">
                        <button
                          onClick={() => addToTracker(item.item)}
                          className="flex items-center gap-2 px-3 py-2 bg-cyan-600/20 text-cyan-400 rounded-lg text-sm hover:bg-cyan-600/30 transition-colors"
                        >
                          <Plus size={14} /> Add to Tracker
                        </button>
                        <a
                          href={`https://wiki.warframe.com/w/${encodeURIComponent(item.item.replace(/ /g, "_"))}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-3 py-2 bg-orange-600/20 text-orange-400 rounded-lg text-sm hover:bg-orange-600/30 transition-colors"
                        >
                          <ExternalLink size={14} /> Wiki
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Current Active Fissures Summary */}
      <div className="bg-slate-900/50 rounded-xl border border-cyan-900/30 p-6">
        <h2 className="text-xl font-bold text-cyan-400 mb-4 flex items-center gap-3">
          <MapPin size={24} /> Current Fissures
        </h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {fissures.slice(0, 9).map((f) => (
            <div
              key={f.id}
              className={`p-3 rounded-lg border ${getEraColor(f.tier)} bg-slate-800/30`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{f.tier}</span>
                <span className="text-xs text-slate-400">{f.eta}</span>
              </div>
              <p className="text-sm text-slate-300 mt-1">{f.node}</p>
              <p className="text-xs text-slate-500">
                {f.missionType} • {f.enemy}
              </p>
            </div>
          ))}
        </div>
        {fissures.length > 9 && (
          <p className="text-sm text-slate-500 text-center mt-3">
            +{fissures.length - 9} more fissures available
          </p>
        )}
      </div>

      {/* Resource Farming Locations */}
      <div className="bg-slate-900/50 rounded-xl border border-emerald-900/30 p-6">
        <h2 className="text-xl font-bold text-emerald-400 mb-4 flex items-center gap-3">
          <MapPin size={24} /> Resource Farming Locations
        </h2>
        <p className="text-slate-400 mb-4 text-sm">
          Common farming spots for important crafting resources.
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {RESOURCE_FARMING_LOCATIONS.map((resource) => (
            <div
              key={resource.resource}
              className="bg-slate-800/30 rounded-lg border border-emerald-700/30 p-4"
            >
              <h3 className="text-emerald-300 font-medium mb-2">
                {resource.resource}
              </h3>
              <div className="space-y-2">
                {resource.missions.map((mission, idx) => (
                  <div key={idx} className="text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-200">{mission.name}</span>
                      <span className="text-xs text-slate-500">
                        {mission.planet}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400">{mission.type}</div>
                    <div className="text-xs text-emerald-500/70 italic">
                      {mission.notes}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
