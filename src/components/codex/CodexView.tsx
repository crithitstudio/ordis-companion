import { useState, useMemo, useRef, useCallback } from "react";
import {
  Book,
  Search,
  X,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Info,
  Plus,
  Check,
  Filter,
  ArrowUpDown,
  ShieldCheck,
  Coins,
} from "lucide-react";
import {
  itemNames,
  itemsData,
  getItemImageUrl,
  getItemCategory,
} from "../../utils/translations";
import { VirtualizedList, useContainerHeight } from "../ui";
import { ItemDetailModal } from "./ItemDetailModal";
import type { SavedItem } from "../../types";

const CATEGORIES = [
  "all",
  "Warframe",
  "Primary",
  "Secondary",
  "Melee",
  "Arch-Gun",
  "Archwing",
  "Sentinel",
  "Pet",
  "Mod",
  "Resource",
  "Other",
];

type SortOption = "name" | "mastery" | "type";
type SortDirection = "asc" | "desc";

interface CodexItem {
  path: string;
  name: string;
  category: string;
  masteryReq: number;
  tradable: boolean;
}

export function CodexView() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [selectedItemPath, setSelectedItemPath] = useState<string | null>(null);

  // Advanced filters
  const [showFilters, setShowFilters] = useState(false);
  const [maxMastery, setMaxMastery] = useState<number>(30);
  const [showTradableOnly, setShowTradableOnly] = useState(false);

  // Sorting
  const [sortBy, setSortBy] = useState<SortOption>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  // Container ref for virtualized list height
  const containerRef = useRef<HTMLDivElement>(null);
  const containerHeight = useContainerHeight(containerRef, 500);

  // Get all items for search with metadata
  const allItems = useMemo((): CodexItem[] => {
    return Object.entries(itemNames).map(([path, name]) => {
      const data = itemsData[path];
      return {
        path,
        name,
        category: getItemCategory(path),
        masteryReq: data?.masteryReq || 0,
        tradable: data?.tradable || false,
      };
    });
  }, []);

  // Filter and sort items
  const filteredItems = useMemo(() => {
    let items = allItems;

    // Category filter
    if (selectedCategory !== "all") {
      items = items.filter((item) => item.category === selectedCategory);
    }

    // Search filter
    if (searchQuery.length >= 2) {
      const query = searchQuery.toLowerCase();
      items = items.filter((item) => item.name.toLowerCase().includes(query));
    }

    // Mastery filter
    items = items.filter((item) => item.masteryReq <= maxMastery);

    // Tradable filter
    if (showTradableOnly) {
      items = items.filter((item) => item.tradable);
    }

    // Sorting
    items = [...items].sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "mastery":
          comparison = a.masteryReq - b.masteryReq;
          break;
        case "type":
          comparison = a.category.localeCompare(b.category);
          break;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });

    return items;
  }, [allItems, searchQuery, selectedCategory, maxMastery, showTradableOnly, sortBy, sortDirection]);

  const toggleSort = useCallback((option: SortOption) => {
    if (sortBy === option) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(option);
      setSortDirection("asc");
    }
  }, [sortBy]);

  // Render a single item row
  const renderItem = useCallback((item: CodexItem) => {
    const itemInfo = itemsData[item.path];
    const imageUrl = itemInfo ? getItemImageUrl(itemInfo) : null;
    const isExpanded = expandedItem === item.path;

    return (
      <div className="bg-slate-800/30 rounded-lg border border-slate-700/50 hover:border-cyan-700/50 transition-colors mb-2">
        <button
          onClick={() => setExpandedItem(isExpanded ? null : item.path)}
          className="w-full p-3 flex items-center justify-between text-left"
        >
          <div className="flex items-center gap-3">
            {imageUrl && (
              <img
                src={imageUrl}
                alt={item.name}
                className="w-10 h-10 object-contain rounded bg-slate-900"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            )}
            <div>
              <h3 className="text-slate-200 font-medium">{item.name}</h3>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>{item.category}</span>
                {item.masteryReq > 0 && (
                  <span className="text-yellow-500">MR{item.masteryReq}</span>
                )}
                {item.tradable && (
                  <span className="text-green-400">Tradable</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={`https://wiki.warframe.com/${encodeURIComponent(item.name.replace(/ /g, "_"))}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="p-2 text-slate-400 hover:text-cyan-400 transition-colors"
              title="View on Wiki"
            >
              <ExternalLink size={16} />
            </a>
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
        </button>
        {isExpanded && (
          <div className="px-4 pb-4 border-t border-slate-700/50 pt-3">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedItemPath(item.path);
                }}
                className="flex items-center gap-2 px-3 py-2 bg-cyan-600/20 text-cyan-400 rounded-lg text-sm hover:bg-cyan-600/30 transition-colors"
              >
                <Info size={14} /> View Details
              </button>
              <a
                href={`https://wiki.warframe.com/${encodeURIComponent(item.name.replace(/ /g, "_"))}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 bg-orange-600/20 text-orange-400 rounded-lg text-sm hover:bg-orange-600/30 transition-colors"
              >
                <ExternalLink size={14} /> Wiki
              </a>
              <AddToTrackerButton itemName={item.name} />
            </div>
          </div>
        )}
      </div>
    );
  }, [expandedItem]);

  return (
    <div className="space-y-6">
      <div className="bg-slate-900/50 rounded-xl border border-cyan-900/30 p-6">
        <h2 className="text-2xl font-bold text-cyan-400 mb-4 flex items-center gap-3">
          <Book size={28} /> Item Codex
          <span className="text-sm font-normal text-slate-500 ml-auto">
            {filteredItems.length} items
          </span>
        </h2>

        {/* Search Bar */}
        <div className="relative mb-4">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
            size={20}
          />
          <input
            type="text"
            placeholder="Search items... (min 2 characters)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-20 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:outline-none transition-colors"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="text-slate-500 hover:text-slate-300"
                aria-label="Clear search"
              >
                <X size={18} />
              </button>
            )}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-1.5 rounded transition-colors ${showFilters ? "text-cyan-400 bg-cyan-900/30" : "text-slate-500 hover:text-slate-300"}`}
              aria-label="Toggle filters"
            >
              <Filter size={18} />
            </button>
          </div>
        </div>

        {/* Advanced Filters Panel */}
        {showFilters && (
          <div className="bg-slate-800/30 rounded-lg border border-slate-700/50 p-4 mb-4 space-y-4 animate-slide-up">
            <div className="flex flex-wrap gap-4">
              {/* Mastery Filter */}
              <div className="flex items-center gap-3">
                <ShieldCheck size={18} className="text-yellow-500" />
                <label className="text-sm text-slate-400">Max Mastery:</label>
                <select
                  value={maxMastery}
                  onChange={(e) => setMaxMastery(parseInt(e.target.value))}
                  className="px-3 py-1 bg-slate-800 border border-slate-700 rounded text-slate-200 text-sm"
                >
                  {[0, 5, 8, 10, 12, 14, 16, 20, 25, 30].map((mr) => (
                    <option key={mr} value={mr}>
                      MR {mr}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tradable Filter */}
              <label className="flex items-center gap-2 cursor-pointer">
                <Coins size={18} className="text-green-400" />
                <input
                  type="checkbox"
                  checked={showTradableOnly}
                  onChange={(e) => setShowTradableOnly(e.target.checked)}
                  className="w-4 h-4 accent-cyan-500"
                />
                <span className="text-sm text-slate-400">Tradable only</span>
              </label>
            </div>

            {/* Sort Options */}
            <div className="flex items-center gap-3">
              <ArrowUpDown size={18} className="text-slate-400" />
              <span className="text-sm text-slate-400">Sort by:</span>
              <div className="flex gap-2">
                {(["name", "mastery", "type"] as SortOption[]).map((option) => (
                  <button
                    key={option}
                    onClick={() => toggleSort(option)}
                    className={`px-3 py-1 rounded text-sm transition-colors ${sortBy === option
                        ? "bg-cyan-600 text-white"
                        : "bg-slate-800/50 text-slate-400 hover:bg-slate-700"
                      }`}
                  >
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                    {sortBy === option && (
                      <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-4">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${selectedCategory === cat
                  ? "bg-cyan-600 text-white"
                  : "bg-slate-800/50 text-slate-400 hover:bg-slate-700 hover:text-slate-300"
                }`}
            >
              {cat === "all" ? "All" : cat}
            </button>
          ))}
        </div>

        {/* Results */}
        <div ref={containerRef} className="min-h-[400px]">
          {searchQuery.length < 2 && selectedCategory === "all" ? (
            <div className="text-center text-slate-500 py-8">
              <Search size={48} className="mx-auto mb-4 opacity-50" />
              <p>Type at least 2 characters to search, or select a category</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center text-slate-500 py-8">
              <p>No items found matching your filters</p>
            </div>
          ) : (
            <VirtualizedList
              items={filteredItems}
              itemHeight={expandedItem ? 140 : 70}
              containerHeight={containerHeight}
              renderItem={renderItem}
              overscan={3}
              className="custom-scrollbar"
            />
          )}
        </div>
      </div>

      {/* Item Detail Modal */}
      <ItemDetailModal
        itemKey={selectedItemPath}
        onClose={() => setSelectedItemPath(null)}
      />
    </div>
  );
}

// Add to tracker button component
function AddToTrackerButton({ itemName }: { itemName: string }) {
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    const saved = JSON.parse(
      localStorage.getItem("ordis-tracker") || "[]",
    ) as SavedItem[];
    if (!saved.find((s) => s.name === itemName)) {
      saved.push({
        id: Date.now().toString(),
        name: itemName,
        category: "Item",
        notes: "",
        completed: false,
        addedAt: Date.now(),
      });
      localStorage.setItem("ordis-tracker", JSON.stringify(saved));
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    }
  };

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        handleAdd();
      }}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${added
          ? "bg-green-600/20 text-green-400"
          : "bg-cyan-600/20 text-cyan-400 hover:bg-cyan-600/30"
        }`}
    >
      {added ? <Check size={14} /> : <Plus size={14} />}
      {added ? "Added!" : "Track"}
    </button>
  );
}
