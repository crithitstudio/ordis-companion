/**
 * Dojo Research Tracker
 * Track clan research progress
 */
import { useState, useMemo, useCallback } from "react";
import {
  Building2,
  FlaskConical,
  Check,
  Clock,
  Filter,
  DoorOpen,
} from "lucide-react";
import { useLocalStorageSet } from "../../hooks/useLocalStorage";

interface ResearchLab {
  id: string;
  name: string;
  color: string;
  items: ResearchItem[];
}

interface ResearchItem {
  id: string;
  name: string;
  type: "warframe" | "weapon" | "archwing" | "cosmetic" | "resource";
}

const RESEARCH_LABS: ResearchLab[] = [
  {
    id: "tenno",
    name: "Tenno Lab",
    color: "text-cyan-400 border-cyan-700/30 bg-cyan-900/20",
    items: [
      { id: "banshee", name: "Banshee", type: "warframe" },
      { id: "nezha", name: "Nezha", type: "warframe" },
      { id: "volt", name: "Volt", type: "warframe" },
      { id: "wukong", name: "Wukong", type: "warframe" },
      { id: "zephyr", name: "Zephyr", type: "warframe" },
      { id: "dark-split-sword", name: "Dark Split-Sword", type: "weapon" },
      { id: "tipedo", name: "Tipedo", type: "weapon" },
      { id: "nikana", name: "Nikana", type: "weapon" },
      { id: "okina", name: "Okina", type: "weapon" },
      { id: "shaku", name: "Shaku", type: "weapon" },
    ],
  },
  {
    id: "energy",
    name: "Energy Lab",
    color: "text-yellow-400 border-yellow-700/30 bg-yellow-900/20",
    items: [
      { id: "amprex", name: "Amprex", type: "weapon" },
      { id: "arca-plasmor", name: "Arca Plasmor", type: "weapon" },
      { id: "cycron", name: "Cycron", type: "weapon" },
      { id: "ferrox", name: "Ferrox", type: "weapon" },
      { id: "lanka", name: "Lanka", type: "weapon" },
      { id: "opticor", name: "Opticor", type: "weapon" },
      { id: "staticor", name: "Staticor", type: "weapon" },
      { id: "synapse", name: "Synapse", type: "weapon" },
    ],
  },
  {
    id: "chem",
    name: "Chem Lab",
    color: "text-green-400 border-green-700/30 bg-green-900/20",
    items: [
      { id: "acrid", name: "Acrid", type: "weapon" },
      { id: "dual-ichor", name: "Dual Ichor", type: "weapon" },
      { id: "embolist", name: "Embolist", type: "weapon" },
      { id: "ignis", name: "Ignis", type: "weapon" },
      { id: "mire", name: "Mire", type: "weapon" },
      { id: "mutalist-cernos", name: "Mutalist Cernos", type: "weapon" },
      { id: "mutalist-quanta", name: "Mutalist Quanta", type: "weapon" },
      { id: "phage", name: "Phage", type: "weapon" },
      { id: "torid", name: "Torid", type: "weapon" },
    ],
  },
  {
    id: "bio",
    name: "Bio Lab",
    color: "text-purple-400 border-purple-700/30 bg-purple-900/20",
    items: [
      { id: "djinn", name: "Djinn", type: "weapon" },
      { id: "helminth-charger", name: "Helminth Charger", type: "warframe" },
      { id: "pox", name: "Pox", type: "weapon" },
      { id: "scoliac", name: "Scoliac", type: "weapon" },
    ],
  },
  {
    id: "orokin",
    name: "Orokin Lab",
    color: "text-amber-400 border-amber-700/30 bg-amber-900/20",
    items: [
      { id: "itzal", name: "Itzal", type: "archwing" },
      { id: "elytron", name: "Elytron", type: "archwing" },
      { id: "fluctus", name: "Fluctus", type: "weapon" },
      { id: "grattler", name: "Grattler", type: "weapon" },
      { id: "knux", name: "Knux", type: "weapon" },
      { id: "phaedra", name: "Phaedra", type: "weapon" },
      { id: "centaur", name: "Centaur", type: "weapon" },
      { id: "agkuza", name: "Agkuza", type: "weapon" },
    ],
  },
];

// Room costs data (Ghost Clan)
interface RoomCost {
  id: string;
  name: string;
  category: "connector" | "lab" | "hall" | "garden" | "obstacle" | "utility";
  credits: number;
  forma: number;
  resources: { name: string; amount: number }[];
}

const ROOM_COSTS: RoomCost[] = [
  {
    id: "cross-connector",
    name: "Cross Connector",
    category: "connector",
    credits: 500,
    forma: 0,
    resources: [{ name: "Ferrite", amount: 560 }],
  },
  {
    id: "t-connector",
    name: "T-Connector",
    category: "connector",
    credits: 500,
    forma: 0,
    resources: [{ name: "Ferrite", amount: 450 }],
  },
  {
    id: "straight-hallway",
    name: "Straight Hallway",
    category: "connector",
    credits: 500,
    forma: 0,
    resources: [{ name: "Ferrite", amount: 450 }],
  },
  {
    id: "elbow-connector",
    name: "Elbow Connector",
    category: "connector",
    credits: 500,
    forma: 0,
    resources: [{ name: "Ferrite", amount: 350 }],
  },
  {
    id: "tenno-lab",
    name: "Tenno Lab",
    category: "lab",
    credits: 50000,
    forma: 1,
    resources: [
      { name: "Alloy Plate", amount: 2500 },
      { name: "Rubedo", amount: 350 },
    ],
  },
  {
    id: "energy-lab",
    name: "Energy Lab",
    category: "lab",
    credits: 50000,
    forma: 1,
    resources: [
      { name: "Alloy Plate", amount: 2500 },
      { name: "Circuits", amount: 350 },
    ],
  },
  {
    id: "chem-lab",
    name: "Chem Lab",
    category: "lab",
    credits: 50000,
    forma: 1,
    resources: [
      { name: "Alloy Plate", amount: 2500 },
      { name: "Salvage", amount: 500 },
    ],
  },
  {
    id: "bio-lab",
    name: "Bio Lab",
    category: "lab",
    credits: 50000,
    forma: 1,
    resources: [
      { name: "Alloy Plate", amount: 2500 },
      { name: "Nano Spores", amount: 1000 },
    ],
  },
  {
    id: "orokin-lab",
    name: "Orokin Lab",
    category: "lab",
    credits: 100000,
    forma: 1,
    resources: [
      { name: "Alloy Plate", amount: 5000 },
      { name: "Control Module", amount: 4 },
    ],
  },
  {
    id: "clan-great-hall",
    name: "Clan Great Hall",
    category: "hall",
    credits: 100000,
    forma: 1,
    resources: [
      { name: "Ferrite", amount: 10000 },
      { name: "Polymer Bundle", amount: 1000 },
    ],
  },
  {
    id: "grandest-hall",
    name: "Grandest Hall",
    category: "hall",
    credits: 150000,
    forma: 1,
    resources: [
      { name: "Ferrite", amount: 25000 },
      { name: "Polymer Bundle", amount: 2500 },
    ],
  },
  {
    id: "barracks",
    name: "Barracks",
    category: "utility",
    credits: 25000,
    forma: 1,
    resources: [
      { name: "Ferrite", amount: 5000 },
      { name: "Rubedo", amount: 250 },
    ],
  },
  {
    id: "oracle",
    name: "Oracle",
    category: "utility",
    credits: 25000,
    forma: 1,
    resources: [
      { name: "Ferrite", amount: 3500 },
      { name: "Circuits", amount: 200 },
    ],
  },
  {
    id: "dry-dock",
    name: "Dry Dock",
    category: "utility",
    credits: 100000,
    forma: 1,
    resources: [
      { name: "Salvage", amount: 25000 },
      { name: "Plastids", amount: 1500 },
    ],
  },
  {
    id: "crimson-branch",
    name: "Crimson Branch",
    category: "utility",
    credits: 100000,
    forma: 1,
    resources: [
      { name: "Alloy Plate", amount: 10000 },
      { name: "Plastids", amount: 850 },
    ],
  },
];

// Clan tier multipliers
const CLAN_TIERS = [
  { id: "ghost", name: "Ghost (1-10)", multiplier: 1 },
  { id: "shadow", name: "Shadow (11-30)", multiplier: 3 },
  { id: "storm", name: "Storm (31-100)", multiplier: 10 },
  { id: "mountain", name: "Mountain (101-300)", multiplier: 30 },
  { id: "moon", name: "Moon (301-1000)", multiplier: 100 },
] as const;

export function DojoView() {
  const [completedResearch, updateResearch] = useLocalStorageSet<string>(
    "ordis-dojo-research",
  );

  const toggleResearch = useCallback(
    (itemId: string) => {
      updateResearch((prev) => {
        const next = new Set(prev);
        if (next.has(itemId)) next.delete(itemId);
        else next.add(itemId);
        return next;
      });
    },
    [updateResearch],
  );
  const [expandedLabs, setExpandedLabs] = useState<Set<string>>(
    new Set(["tenno"]),
  );
  const [filterType, setFilterType] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"research" | "rooms">("research");
  const [clanTier, setClanTier] = useState<string>("ghost");

  const tierMultiplier =
    CLAN_TIERS.find((t) => t.id === clanTier)?.multiplier || 1;

  const toggleLab = useCallback((labId: string) => {
    setExpandedLabs((prev) => {
      const next = new Set(prev);
      if (next.has(labId)) next.delete(labId);
      else next.add(labId);
      return next;
    });
  }, []);

  // Stats
  const stats = useMemo(() => {
    const totalItems = RESEARCH_LABS.flatMap((l) => l.items).length;
    const completedCount = completedResearch.size;
    const percentage =
      totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0;

    const byLab = RESEARCH_LABS.map((lab) => ({
      id: lab.id,
      name: lab.name,
      total: lab.items.length,
      completed: lab.items.filter((i) => completedResearch.has(i.id)).length,
    }));

    return { totalItems, completedCount, percentage, byLab };
  }, [completedResearch]);

  // Filtered items per lab
  const getFilteredItems = useCallback(
    (items: ResearchItem[]) => {
      if (filterType === "all") return items;
      return items.filter((i) => i.type === filterType);
    },
    [filterType],
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="bg-gradient-to-r from-orange-900/30 to-slate-900/50 rounded-xl border border-orange-700/30 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-orange-400 flex items-center gap-3">
            <Building2 size={28} /> Dojo Research
          </h2>
          <div className="text-right">
            <div className="text-3xl font-bold text-orange-300">
              {stats.percentage}%
            </div>
            <div className="text-slate-400 text-sm">
              {stats.completedCount}/{stats.totalItems} Complete
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-orange-600 to-amber-500 transition-all duration-500"
            style={{ width: `${stats.percentage}%` }}
          />
        </div>

        {/* Lab Progress */}
        <div className="grid grid-cols-5 gap-2 mt-4">
          {stats.byLab.map((lab) => {
            const pct =
              lab.total > 0 ? Math.round((lab.completed / lab.total) * 100) : 0;
            return (
              <div
                key={lab.id}
                className="bg-slate-800/50 rounded-lg p-2 text-center"
              >
                <div className="text-xs text-slate-500 truncate">
                  {lab.name.replace(" Lab", "")}
                </div>
                <div
                  className={`text-sm font-bold ${pct === 100 ? "text-green-400" : "text-slate-200"}`}
                >
                  {pct}%
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Tab Navigation */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab("research")}
          className={`flex-1 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${activeTab === "research" ? "bg-orange-600 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700"}`}
        >
          <FlaskConical size={16} /> Research
        </button>
        <button
          onClick={() => setActiveTab("rooms")}
          className={`flex-1 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${activeTab === "rooms" ? "bg-orange-600 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700"}`}
        >
          <DoorOpen size={16} /> Room Costs
        </button>
      </div>

      {/* Research Tab */}
      {activeTab === "research" && (
        <>
          {/* Filter */}
          <div className="flex gap-3 items-center">
            <Filter size={16} className="text-slate-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm"
            >
              <option value="all">All Types</option>
              <option value="warframe">Warframes</option>
              <option value="weapon">Weapons</option>
              <option value="archwing">Archwing</option>
            </select>
          </div>

          {/* Labs */}
          <div className="space-y-3">
            {RESEARCH_LABS.map((lab) => {
              const isExpanded = expandedLabs.has(lab.id);
              const labItems = getFilteredItems(lab.items);
              const labCompleted = labItems.filter((i) =>
                completedResearch.has(i.id),
              ).length;

              if (labItems.length === 0) return null;

              return (
                <div
                  key={lab.id}
                  className={`rounded-xl border overflow-hidden ${lab.color}`}
                >
                  {/* Lab Header */}
                  <button
                    onClick={() => toggleLab(lab.id)}
                    className="w-full p-4 flex items-center justify-between hover:bg-slate-800/20 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <FlaskConical size={20} />
                      <span className="font-bold">{lab.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm">
                        {labCompleted}/{labItems.length}
                      </span>
                      {labCompleted === labItems.length &&
                        labItems.length > 0 && (
                          <Check size={18} className="text-green-400" />
                        )}
                    </div>
                  </button>

                  {/* Items */}
                  {isExpanded && (
                    <div className="p-3 border-t border-slate-700/50 grid grid-cols-2 md:grid-cols-3 gap-2">
                      {labItems.map((item) => {
                        const isComplete = completedResearch.has(item.id);
                        return (
                          <button
                            key={item.id}
                            onClick={() => toggleResearch(item.id)}
                            className={`flex items-center gap-2 p-2 rounded-lg border transition-colors ${
                              isComplete
                                ? "bg-green-900/20 border-green-700/30 text-green-300"
                                : "bg-slate-800/30 border-slate-700/50 text-slate-300 hover:border-slate-600"
                            }`}
                          >
                            {isComplete ? (
                              <Check size={14} className="text-green-400" />
                            ) : (
                              <Clock size={14} className="text-slate-500" />
                            )}
                            <span
                              className={`text-sm truncate ${isComplete ? "line-through opacity-60" : ""}`}
                            >
                              {item.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Room Costs Tab */}
      {activeTab === "rooms" && (
        <div className="space-y-4">
          {/* Clan Tier Selector */}
          <div className="flex items-center justify-between gap-3">
            <p className="text-slate-400 text-sm">
              Select your clan tier to see accurate costs
            </p>
            <select
              value={clanTier}
              onChange={(e) => setClanTier(e.target.value)}
              className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm"
            >
              {CLAN_TIERS.map((tier) => (
                <option key={tier.id} value={tier.id}>
                  {tier.name}
                </option>
              ))}
            </select>
          </div>

          {tierMultiplier > 1 && (
            <div className="bg-orange-900/20 border border-orange-700/30 rounded-lg px-3 py-2 text-sm text-orange-300">
              ⚡ Costs multiplied by {tierMultiplier}x for{" "}
              {CLAN_TIERS.find((t) => t.id === clanTier)?.name} clan
            </div>
          )}

          {/* Room Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {ROOM_COSTS.map((room) => (
              <div
                key={room.id}
                className="bg-slate-900/50 rounded-xl border border-slate-700/30 p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="font-bold text-slate-200">{room.name}</div>
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-400">
                    {room.category}
                  </span>
                </div>
                <div className="flex flex-wrap gap-3 text-sm">
                  <div className="flex items-center gap-1">
                    <span className="text-yellow-400">
                      {(room.credits * tierMultiplier).toLocaleString()}
                    </span>
                    <span className="text-slate-500">Credits</span>
                  </div>
                  {room.forma > 0 && (
                    <div className="flex items-center gap-1">
                      <span className="text-cyan-400">
                        {room.forma * tierMultiplier}
                      </span>
                      <span className="text-slate-500">Forma</span>
                    </div>
                  )}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {room.resources.map((r) => (
                    <span
                      key={r.name}
                      className="text-xs px-2 py-1 bg-slate-800 rounded text-slate-300"
                    >
                      {(r.amount * tierMultiplier).toLocaleString()} {r.name}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-4">
        <h3 className="font-bold text-slate-300 mb-2">💡 Dojo Tips</h3>
        <ul className="text-sm text-slate-400 space-y-1">
          <li>• Research takes time - start Clan BPs early</li>
          <li>• Ghost Clan is cheaper but slower for solo players</li>
          <li>• Ignis Wraith is tradeable - check trading chat</li>
          <li>• Some research (like Hema) requires rare resources</li>
        </ul>
      </div>
    </div>
  );
}
