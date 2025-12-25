/**
 * Build Planner
 * Create and save Warframe loadout builds
 */
import { useState, useMemo, useCallback } from "react";
import {
  Layers,
  Plus,
  Trash2,
  Copy,
  Save,
  ChevronDown,
  ChevronUp,
  Star,
  Shield,
  Search,
  Download,
  Upload,
  Share2,
} from "lucide-react";
import { useToast, EmptyState } from "../ui";
import { itemsData } from "../../utils/translations";
import { BuildShareModal } from "./BuildShareModal";

interface ModSlot {
  name: string;
  rank: number;
  drain: number;
  polarity?:
    | "madurai"
    | "vazarin"
    | "naramon"
    | "zenurik"
    | "unairu"
    | "penjaga"
    | "umbra";
}

interface Build {
  id: string;
  name: string;
  type:
    | "warframe"
    | "primary"
    | "secondary"
    | "melee"
    | "companion"
    | "archwing";
  itemName: string;
  mods: ModSlot[];
  capacity: number;
  maxCapacity: number;
  forma: number;
  notes: string;
  createdAt: string;
  favorite: boolean;
}

const STORAGE_KEY = "ordis-builds";

function loadBuilds(): Build[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function saveBuilds(builds: Build[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(builds));
}

const BUILD_TYPES = [
  { id: "warframe", label: "Warframe", icon: Shield },
  { id: "primary", label: "Primary", icon: Layers },
  { id: "secondary", label: "Secondary", icon: Layers },
  { id: "melee", label: "Melee", icon: Layers },
] as const;

// Get mods from itemsData
const getAllMods = () => {
  const mods: { name: string; drain: number; polarity?: string }[] = [];
  Object.values(itemsData).forEach((item) => {
    // Cast to any to access mod-specific properties not in base type
    const modItem = item as {
      name?: string;
      type?: string;
      category?: string;
      baseDrain?: number;
      polarity?: string;
    };
    if (
      (modItem.type && modItem.type.includes("Mod")) ||
      modItem.category === "Mods"
    ) {
      if (modItem.name) {
        mods.push({
          name: modItem.name,
          drain: modItem.baseDrain || 0,
          polarity: modItem.polarity,
        });
      }
    }
  });
  return mods.sort((a, b) => a.name.localeCompare(b.name));
};

const ALL_MODS = getAllMods();

export function BuildView() {
  const [builds, setBuilds] = useState<Build[]>(loadBuilds);
  const [selectedBuild, setSelectedBuild] = useState<Build | null>(null);
  const [showNewBuild, setShowNewBuild] = useState(false);
  const [filterType, setFilterType] = useState<string>("all");
  const [expandedBuilds, setExpandedBuilds] = useState<Set<string>>(new Set());
  const [shareBuild, setShareBuild] = useState<Build | null>(null);

  // New build form
  const [newBuildName, setNewBuildName] = useState("");
  const [newBuildType, setNewBuildType] = useState<Build["type"]>("warframe");
  const [newItemName, setNewItemName] = useState("");

  // Mod search state
  const [activeModSearch, setActiveModSearch] = useState<{
    buildId: string;
    slotIndex: number;
    query: string;
  } | null>(null);

  const { addToast } = useToast();

  const updateBuilds = useCallback((newBuilds: Build[]) => {
    setBuilds(newBuilds);
    saveBuilds(newBuilds);
  }, []);

  // Create new build
  const createBuild = useCallback(() => {
    if (!newBuildName.trim() || !newItemName.trim()) {
      addToast("Please enter build name and item name", "error");
      return;
    }

    const build: Build = {
      id: Date.now().toString(),
      name: newBuildName.trim(),
      type: newBuildType,
      itemName: newItemName.trim(),
      mods: Array(8)
        .fill(null)
        .map(() => ({ name: "", rank: 0, drain: 0 })),
      capacity: 0,
      maxCapacity: 60,
      forma: 0,
      notes: "",
      createdAt: new Date().toISOString(),
      favorite: false,
    };

    updateBuilds([build, ...builds]);
    setNewBuildName("");
    setNewItemName("");
    setShowNewBuild(false);
    addToast("Build created!", "success");
  }, [newBuildName, newBuildType, newItemName, builds, updateBuilds, addToast]);

  // Delete build
  const deleteBuild = useCallback(
    (id: string) => {
      updateBuilds(builds.filter((b) => b.id !== id));
      if (selectedBuild?.id === id) setSelectedBuild(null);
      addToast("Build deleted", "info");
    },
    [builds, selectedBuild, updateBuilds, addToast],
  );

  // Toggle favorite
  const toggleFavorite = useCallback(
    (id: string) => {
      updateBuilds(
        builds.map((b) => (b.id === id ? { ...b, favorite: !b.favorite } : b)),
      );
    },
    [builds, updateBuilds],
  );

  // Duplicate build
  const duplicateBuild = useCallback(
    (build: Build) => {
      const newBuild: Build = {
        ...build,
        id: Date.now().toString(),
        name: `${build.name} (Copy)`,
        createdAt: new Date().toISOString(),
        favorite: false,
      };
      updateBuilds([newBuild, ...builds]);
      addToast("Build duplicated!", "success");
    },
    [builds, updateBuilds, addToast],
  );

  // Update mod slot
  const updateModSlot = useCallback(
    (buildId: string, slotIndex: number, mod: Partial<ModSlot>) => {
      updateBuilds(
        builds.map((b) => {
          if (b.id !== buildId) return b;
          const newMods = [...b.mods];
          newMods[slotIndex] = { ...newMods[slotIndex], ...mod };
          const capacity = newMods.reduce((sum, m) => sum + (m.drain || 0), 0);
          return { ...b, mods: newMods, capacity };
        }),
      );
    },
    [builds, updateBuilds],
  );

  // Toggle expand
  const toggleExpand = useCallback((id: string) => {
    setExpandedBuilds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // Filtered builds
  const filteredBuilds = useMemo(() => {
    let result = builds;
    if (filterType !== "all") {
      result = result.filter((b) => b.type === filterType);
    }
    // Sort: favorites first, then by date
    return result.sort((a, b) => {
      if (a.favorite && !b.favorite) return -1;
      if (!a.favorite && b.favorite) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [builds, filterType]);

  // Stats
  const stats = useMemo(
    () => ({
      total: builds.length,
      warframes: builds.filter((b) => b.type === "warframe").length,
      weapons: builds.filter((b) =>
        ["primary", "secondary", "melee"].includes(b.type),
      ).length,
      favorites: builds.filter((b) => b.favorite).length,
    }),
    [builds],
  );

  // Export builds
  const exportBuilds = useCallback(() => {
    const data = {
      builds,
      exportedAt: new Date().toISOString(),
      version: 1,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ordis-builds-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addToast("Builds exported!", "success");
  }, [builds, addToast]);

  // Import builds
  const importBuilds = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string);
          if (data.builds && Array.isArray(data.builds)) {
            updateBuilds(data.builds);
            addToast(`Imported ${data.builds.length} builds!`, "success");
          } else {
            addToast("Invalid file format", "error");
          }
        } catch {
          addToast("Failed to parse file", "error");
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }, [updateBuilds, addToast]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="bg-gradient-to-r from-emerald-900/30 to-slate-900/50 rounded-xl border border-emerald-700/30 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-emerald-400 flex items-center gap-3">
            <Layers size={28} /> Build Planner
          </h2>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-3xl font-bold text-emerald-300">
                {stats.total}
              </div>
              <div className="text-slate-400 text-sm">Saved Builds</div>
            </div>
            <button
              onClick={exportBuilds}
              className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-300"
              title="Export Builds"
            >
              <Download size={18} />
            </button>
            <button
              onClick={importBuilds}
              className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-300"
              title="Import Builds"
            >
              <Upload size={18} />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-slate-800/50 rounded-lg p-2 text-center">
            <div className="text-xs text-slate-500">Warframes</div>
            <div className="text-lg font-bold text-slate-200">
              {stats.warframes}
            </div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-2 text-center">
            <div className="text-xs text-slate-500">Weapons</div>
            <div className="text-lg font-bold text-slate-200">
              {stats.weapons}
            </div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-2 text-center">
            <div className="text-xs text-slate-500">Favorites</div>
            <div className="text-lg font-bold text-yellow-300">
              {stats.favorites}
            </div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-2 text-center">
            <div className="text-xs text-slate-500">Total</div>
            <div className="text-lg font-bold text-emerald-300">
              {stats.total}
            </div>
          </div>
        </div>
      </section>

      {/* Filter and New Build */}
      <div className="flex gap-3">
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm"
        >
          <option value="all">All Types</option>
          <option value="warframe">Warframes</option>
          <option value="primary">Primary</option>
          <option value="secondary">Secondary</option>
          <option value="melee">Melee</option>
        </select>
        <button
          onClick={() => setShowNewBuild(!showNewBuild)}
          className="flex-1 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors flex items-center justify-center gap-2 font-medium"
        >
          <Plus size={18} /> New Build
        </button>
      </div>

      {/* New Build Form */}
      {showNewBuild && (
        <div className="bg-slate-900/50 rounded-xl border border-emerald-700/30 p-4 space-y-3">
          <input
            type="text"
            value={newBuildName}
            onChange={(e) => setNewBuildName(e.target.value)}
            placeholder="Build name (e.g. 'Eidolon Hunter')"
            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2"
          />
          <div className="flex gap-3">
            <select
              value={newBuildType}
              onChange={(e) => setNewBuildType(e.target.value as Build["type"])}
              className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2"
            >
              {BUILD_TYPES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              placeholder="Item (e.g. 'Volt Prime')"
              className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={createBuild}
              className="flex-1 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors flex items-center justify-center gap-2"
            >
              <Save size={16} /> Create Build
            </button>
            <button
              onClick={() => setShowNewBuild(false)}
              className="px-4 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Build List */}
      <div className="space-y-3">
        {filteredBuilds.length === 0 ? (
          <div className="bg-slate-900/50 rounded-xl border border-slate-700/30">
            <EmptyState
              icon={Layers}
              title="No builds yet"
              description="Create loadout builds to save your favorite mod configurations. Track capacity, forma, and easily duplicate builds."
              action={{
                label: "Create First Build",
                onClick: () => setShowNewBuild(true),
              }}
            />
          </div>
        ) : (
          filteredBuilds.map((build) => {
            const isExpanded = expandedBuilds.has(build.id);
            const TypeIcon =
              BUILD_TYPES.find((t) => t.id === build.type)?.icon || Layers;

            return (
              <div
                key={build.id}
                className={`bg-slate-900/50 rounded-xl border overflow-hidden transition-all ${
                  build.favorite
                    ? "border-yellow-600/50"
                    : "border-slate-700/30"
                }`}
              >
                {/* Build Header */}
                <button
                  onClick={() => toggleExpand(build.id)}
                  className="w-full p-4 flex items-center justify-between hover:bg-slate-800/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <TypeIcon size={20} className="text-emerald-400" />
                    <div className="text-left">
                      <div className="font-bold text-slate-200 flex items-center gap-2">
                        {build.name}
                        {build.favorite && (
                          <Star
                            size={14}
                            className="text-yellow-400 fill-yellow-400"
                          />
                        )}
                      </div>
                      <div className="text-sm text-slate-400">
                        {build.itemName}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-sm font-medium ${
                        build.capacity > build.maxCapacity
                          ? "text-red-400"
                          : build.capacity > build.maxCapacity * 0.9
                            ? "text-yellow-400"
                            : "text-slate-500"
                      }`}
                    >
                      {build.capacity}/{build.maxCapacity}
                      {build.capacity > build.maxCapacity && " ⚠"}
                    </span>
                    {isExpanded ? (
                      <ChevronUp size={18} />
                    ) : (
                      <ChevronDown size={18} />
                    )}
                  </div>
                </button>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="p-4 border-t border-slate-700/50">
                    {/* Capacity Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-400">Capacity</span>
                        <span
                          className={
                            build.capacity > build.maxCapacity
                              ? "text-red-400"
                              : "text-slate-400"
                          }
                        >
                          {build.capacity}/{build.maxCapacity}
                        </span>
                      </div>
                      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            build.capacity > build.maxCapacity
                              ? "bg-red-500"
                              : build.capacity > build.maxCapacity * 0.9
                                ? "bg-yellow-500"
                                : "bg-emerald-500"
                          }`}
                          style={{
                            width: `${Math.min((build.capacity / build.maxCapacity) * 100, 100)}%`,
                          }}
                        />
                      </div>
                      {build.capacity > build.maxCapacity && (
                        <p className="text-xs text-red-400 mt-1">
                          ⚠ Over capacity by{" "}
                          {build.capacity - build.maxCapacity} - add Forma or
                          remove mods
                        </p>
                      )}
                    </div>

                    {/* Mod Slots */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                      {build.mods.map((mod, i) => {
                        const isSearching =
                          activeModSearch?.buildId === build.id &&
                          activeModSearch?.slotIndex === i;
                        const filteredMods =
                          isSearching && activeModSearch.query.length >= 2
                            ? ALL_MODS.filter((m) =>
                                m.name
                                  .toLowerCase()
                                  .includes(
                                    activeModSearch.query.toLowerCase(),
                                  ),
                              ).slice(0, 8)
                            : [];

                        return (
                          <div
                            key={i}
                            className={`relative p-2 rounded-lg border ${
                              mod.name
                                ? "bg-slate-800/50 border-emerald-700/30"
                                : "bg-slate-800/30 border-slate-700/50 border-dashed"
                            }`}
                          >
                            <div className="relative">
                              <Search
                                size={12}
                                className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-500"
                              />
                              <input
                                type="text"
                                value={
                                  isSearching ? activeModSearch.query : mod.name
                                }
                                onChange={(e) => {
                                  if (!isSearching) {
                                    setActiveModSearch({
                                      buildId: build.id,
                                      slotIndex: i,
                                      query: e.target.value,
                                    });
                                  } else {
                                    setActiveModSearch({
                                      ...activeModSearch,
                                      query: e.target.value,
                                    });
                                  }
                                }}
                                onFocus={() =>
                                  setActiveModSearch({
                                    buildId: build.id,
                                    slotIndex: i,
                                    query: mod.name,
                                  })
                                }
                                onBlur={() =>
                                  setTimeout(
                                    () => setActiveModSearch(null),
                                    200,
                                  )
                                }
                                placeholder={`Slot ${i + 1}`}
                                className="w-full bg-transparent text-sm text-slate-200 placeholder-slate-500 outline-none pl-4"
                              />
                            </div>

                            {/* Autocomplete dropdown */}
                            {isSearching && filteredMods.length > 0 && (
                              <div className="absolute left-0 right-0 top-full mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-20 max-h-40 overflow-y-auto">
                                {filteredMods.map((m) => (
                                  <button
                                    key={m.name}
                                    onMouseDown={() => {
                                      updateModSlot(build.id, i, {
                                        name: m.name,
                                        drain: m.drain,
                                      });
                                      setActiveModSearch(null);
                                    }}
                                    className="w-full px-2 py-1.5 text-left hover:bg-slate-700 transition-colors flex items-center justify-between text-xs"
                                  >
                                    <span className="text-slate-200 truncate">
                                      {m.name}
                                    </span>
                                    <span className="text-slate-500 ml-1">
                                      {m.drain}
                                    </span>
                                  </button>
                                ))}
                              </div>
                            )}

                            <div className="flex gap-2 mt-1">
                              <input
                                type="number"
                                value={mod.drain || ""}
                                onChange={(e) =>
                                  updateModSlot(build.id, i, {
                                    drain: parseInt(e.target.value) || 0,
                                  })
                                }
                                placeholder="Drain"
                                className="w-16 bg-slate-700 border border-slate-600 rounded px-1 py-0.5 text-xs text-center"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleFavorite(build.id)}
                        className={`p-2 rounded-lg transition-colors ${
                          build.favorite
                            ? "bg-yellow-600/20 text-yellow-400"
                            : "bg-slate-700 text-slate-400"
                        }`}
                        title="Toggle favorite"
                      >
                        <Star
                          size={16}
                          className={build.favorite ? "fill-current" : ""}
                        />
                      </button>
                      <button
                        onClick={() => duplicateBuild(build)}
                        className="p-2 bg-slate-700 text-slate-400 rounded-lg hover:bg-slate-600 transition-colors"
                        title="Duplicate"
                      >
                        <Copy size={16} />
                      </button>
                      <button
                        onClick={() => setShareBuild(build)}
                        className="p-2 bg-cyan-900/30 text-cyan-400 rounded-lg hover:bg-cyan-900/50 transition-colors"
                        title="Share"
                      >
                        <Share2 size={16} />
                      </button>
                      <button
                        onClick={() => deleteBuild(build.id)}
                        className="p-2 bg-red-900/30 text-red-400 rounded-lg hover:bg-red-900/50 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Tips */}
      <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-4">
        <h3 className="font-bold text-slate-300 mb-2">💡 Build Tips</h3>
        <ul className="text-sm text-slate-400 space-y-1">
          <li>
            • Use <strong>Overframe</strong> or <strong>Overframe.gg</strong>{" "}
            for detailed build optimization
          </li>
          <li>• Forma increases capacity by matching polarities</li>
          <li>• Auras add capacity instead of draining it</li>
          <li>• Exilus adapter unlocks the utility slot</li>
        </ul>
      </div>

      {/* Share Modal */}
      {shareBuild && (
        <BuildShareModal
          build={shareBuild}
          onClose={() => setShareBuild(null)}
        />
      )}
    </div>
  );
}
