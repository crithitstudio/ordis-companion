import { useState, useMemo } from "react";
import {
  Search,
  Gem,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  X,
} from "lucide-react";
import { itemsData, getItemImageUrl } from "../../utils/translations";

// Relic era pattern
const RELIC_PATTERN = /^(Lith|Meso|Neo|Axi|Requiem)\s+([A-Z]\d+)\s+Relic/i;

interface PrimeDrop {
  item: string;
  imageName?: string;
  uniqueName?: string;
  sources: {
    relic: string;
    refinement: string;
    rarity: string;
    chance: number;
  }[];
}

interface RelicInfo {
  name: string;
  era: string;
  rewards: { item: string; rarity: string; chance: number }[];
}

/**
 * Extract Prime drops that come FROM relics
 * Searches items for drops where location contains "Relic"
 * Uses drop.type for the actual Prime part name
 */
function getPrimeDrops(): PrimeDrop[] {
  const dropMap = new Map<string, PrimeDrop>();

  Object.entries(itemsData).forEach(([, item]) => {
    if (!item.drops) return;

    item.drops.forEach((drop) => {
      const loc = drop.location || "";
      // Check if this drop is from a relic
      if (!loc.includes("Relic")) return;

      // Parse the relic name and refinement level
      // Examples: "Axi A12 Relic (Radiant)", "Lith M7 Relic (Flawless)", "Requiem III Relic"
      const relicMatch = loc.match(/^(.+?\s+Relic)(?:\s+\((.+?)\))?$/);
      if (!relicMatch) return;

      const relicName = relicMatch[1];
      const refinement = relicMatch[2] || "Intact";

      // Use drop.type for the actual Prime part name (e.g. "Kogake Prime Boot")
      const itemName = drop.type || item.name;

      const existing = dropMap.get(itemName);
      if (existing) {
        existing.sources.push({
          relic: relicName,
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
              refinement,
              rarity: drop.rarity || "Common",
              chance: drop.chance || 0,
            },
          ],
        });
      }
    });
  });

  // Convert to array and sort
  return Array.from(dropMap.values())
    .map((p) => ({
      ...p,
      sources: p.sources.sort((a, b) => b.chance - a.chance),
    }))
    .sort((a, b) => a.item.localeCompare(b.item));
}

/**
 * Build reverse mapping: relic -> items it contains
 * Uses drop.type for the actual Prime part name
 */
function getRelicContents(): RelicInfo[] {
  const relicMap = new Map<string, RelicInfo>();

  Object.entries(itemsData).forEach(([, item]) => {
    if (!item.drops) return;

    item.drops.forEach((drop) => {
      const loc = drop.location || "";
      if (!loc.includes("Relic")) return;

      // Parse relic name without refinement
      const relicMatch = loc.match(/^(.+?\s+Relic)/);
      if (!relicMatch) return;

      const relicName = relicMatch[1];
      const eraMatch = relicName.match(RELIC_PATTERN);
      const era = eraMatch ? eraMatch[1] : "Unknown";

      // Use drop.type for the actual Prime part name
      const itemName = drop.type || item.name;

      const existing = relicMap.get(relicName);
      if (existing) {
        // Only add if not already in rewards
        if (!existing.rewards.some((r) => r.item === itemName)) {
          existing.rewards.push({
            item: itemName,
            rarity: drop.rarity || "Common",
            chance: drop.chance || 0,
          });
        }
      } else {
        relicMap.set(relicName, {
          name: relicName,
          era,
          rewards: [
            {
              item: itemName,
              rarity: drop.rarity || "Common",
              chance: drop.chance || 0,
            },
          ],
        });
      }
    });
  });

  return Array.from(relicMap.values())
    .map((r) => ({
      ...r,
      rewards: r.rewards.sort((a, b) => {
        // Sort by rarity: Rare > Uncommon > Common
        const rarityOrder: Record<string, number> = {
          Rare: 0,
          Uncommon: 1,
          Common: 2,
        };
        return (rarityOrder[a.rarity] ?? 3) - (rarityOrder[b.rarity] ?? 3);
      }),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

interface RelicDropTableModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RelicDropTableModal({
  isOpen,
  onClose,
}: RelicDropTableModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [searchMode, setSearchMode] = useState<"item" | "relic">("item");

  const primeDrops = useMemo(() => getPrimeDrops(), []);
  const relicContents = useMemo(() => getRelicContents(), []);

  const filteredItems = useMemo(() => {
    if (searchQuery.length < 2) return [];
    const q = searchQuery.toLowerCase();

    if (searchMode === "item") {
      return primeDrops
        .filter((p) => p.item.toLowerCase().includes(q))
        .slice(0, 50);
    } else {
      return relicContents
        .filter((r) => r.name.toLowerCase().includes(q))
        .slice(0, 50);
    }
  }, [primeDrops, relicContents, searchQuery, searchMode]);

  if (!isOpen) return null;

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
    switch (era.toLowerCase()) {
      case "lith":
        return "text-amber-300";
      case "meso":
        return "text-slate-300";
      case "neo":
        return "text-blue-300";
      case "axi":
        return "text-yellow-400";
      case "requiem":
        return "text-purple-400";
      default:
        return "text-slate-400";
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-amber-700/50 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-900/50 to-slate-900 p-4 border-b border-slate-700 flex items-center justify-between">
          <h2 className="text-xl font-bold text-amber-400 flex items-center gap-2">
            <Gem size={24} /> Relic Drop Tables
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col gap-4 overflow-hidden">
          {/* Stats */}
          <div className="text-xs text-slate-500 text-center">
            {primeDrops.length} items tracked from {relicContents.length} relics
          </div>

          {/* Search Mode Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => {
                setSearchMode("item");
                setExpandedItem(null);
                setSearchQuery("");
              }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${searchMode === "item"
                ? "bg-amber-600 text-white"
                : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                }`}
            >
              Search by Item
            </button>
            <button
              onClick={() => {
                setSearchMode("relic");
                setExpandedItem(null);
                setSearchQuery("");
              }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${searchMode === "relic"
                ? "bg-amber-600 text-white"
                : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                }`}
            >
              Search by Relic
            </button>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
              size={20}
            />
            <input
              type="text"
              placeholder={
                searchMode === "item"
                  ? "Search Prime parts (e.g. Rhino, Neuroptics)..."
                  : "Search relics (e.g. Lith A1, Axi)..."
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:border-amber-500 focus:outline-none"
              autoFocus
            />
          </div>

          {/* Results */}
          <div className="flex-1 overflow-y-auto space-y-2 max-h-[50vh]">
            {searchQuery.length < 2 ? (
              <div className="text-center text-slate-500 py-8">
                <Gem size={48} className="mx-auto mb-4 opacity-50" />
                <p>Type at least 2 characters to search</p>
                <p className="text-xs mt-2">
                  {searchMode === "item"
                    ? "Find which relics contain a specific Prime part"
                    : "See what drops from a specific relic"}
                </p>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center text-slate-500 py-8">
                <p>No results found for "{searchQuery}"</p>
                <p className="text-xs mt-2">
                  Try searching for Prime parts like "Rhino", "Neuroptics", or
                  "Barrel"
                </p>
              </div>
            ) : searchMode === "item" ? (
              // Item search results
              (filteredItems as PrimeDrop[]).map((item) => (
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
                      {item.uniqueName &&
                        getItemImageUrl({ uniqueName: item.uniqueName }) && (
                          <img
                            src={
                              getItemImageUrl({
                                uniqueName: item.uniqueName,
                              }) || ""
                            }
                            alt=""
                            className="w-8 h-8 object-contain rounded"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display =
                                "none";
                            }}
                          />
                        )}
                      <span className="text-slate-200 font-medium">
                        {item.item}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">
                        {item.sources.length} sources
                      </span>
                      {expandedItem === item.item ? (
                        <ChevronUp size={18} />
                      ) : (
                        <ChevronDown size={18} />
                      )}
                    </div>
                  </button>
                  {expandedItem === item.item && (
                    <div className="px-3 pb-3 space-y-1">
                      {item.sources.slice(0, 20).map((src, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between py-1 px-2 bg-slate-900/50 rounded text-sm"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-slate-300">{src.relic}</span>
                            <span className="text-xs text-slate-500">
                              ({src.refinement})
                            </span>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded text-xs ${getRarityColor(src.rarity)}`}
                          >
                            {src.rarity}
                          </span>
                        </div>
                      ))}
                      {item.sources.length > 20 && (
                        <p className="text-xs text-slate-500 text-center py-1">
                          +{item.sources.length - 20} more sources
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))
            ) : (
              // Relic search results
              (filteredItems as RelicInfo[]).map((relic) => (
                <div
                  key={relic.name}
                  className="bg-slate-800/50 rounded-lg border border-slate-700/50"
                >
                  <button
                    onClick={() =>
                      setExpandedItem(
                        expandedItem === relic.name ? null : relic.name,
                      )
                    }
                    className="w-full p-3 flex items-center justify-between text-left"
                  >
                    <div className="flex items-center gap-3">
                      <Gem size={20} className={getEraColor(relic.era)} />
                      <span className="text-slate-200 font-medium">
                        {relic.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">
                        {relic.rewards.length} rewards
                      </span>
                      {expandedItem === relic.name ? (
                        <ChevronUp size={18} />
                      ) : (
                        <ChevronDown size={18} />
                      )}
                    </div>
                  </button>
                  {expandedItem === relic.name && (
                    <div className="px-3 pb-3 space-y-1">
                      {relic.rewards.map((reward, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between py-1 px-2 bg-slate-900/50 rounded text-sm"
                        >
                          <span className="text-slate-300">{reward.item}</span>
                          <span
                            className={`px-2 py-0.5 rounded text-xs ${getRarityColor(reward.rarity)}`}
                          >
                            {reward.rarity}
                          </span>
                        </div>
                      ))}
                      <a
                        href={`https://wiki.warframe.com/w/${encodeURIComponent(relic.name.replace(/ /g, "_"))}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 mt-2 py-2 text-orange-400 hover:text-orange-300 text-sm"
                      >
                        <ExternalLink size={14} /> View on Wiki
                      </a>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
