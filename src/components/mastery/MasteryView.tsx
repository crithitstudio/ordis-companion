import { useState, useMemo, useCallback } from "react";
import {
  Star,
  Search,
  Check,
  Map as MapIcon,
  Waypoints,
  ChevronDown,
  ChevronUp,
  Anchor,
  Lightbulb,
  TrendingUp,
} from "lucide-react";
import { useLocalStorageSet } from "../../hooks/useLocalStorage";
import { itemsData, getItemImageUrl, solNodes } from "../../utils/translations";

// Mastery XP values per category
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
  "Sentinel Weapons": 3000,
};

// XP per star chart node - NOTE: varies by node, this is an average estimate
const NODE_XP = 63;

// XP per junction (official wiki: 1000 XP)
const JUNCTION_XP = 1000;

// XP per intrinsic rank (official wiki: 1500 XP per rank)
const INTRINSIC_XP = 1500;
const MAX_INTRINSIC_RANK = 10;

// Railjack Intrinsics (5 categories, max rank 10 each)
const RAILJACK_INTRINSICS = [
  "Tactical",
  "Piloting",
  "Gunnery",
  "Engineering",
  "Command",
];

// Drifter Intrinsics (4 categories, max rank 10 each)
const DRIFTER_INTRINSICS = ["Opportunity", "Endurance", "Combat", "Riding"];

// All junctions in Warframe
const JUNCTIONS = [
  { name: "Venus Junction", planet: "Earth" },
  { name: "Mercury Junction", planet: "Venus" },
  { name: "Mars Junction", planet: "Earth" },
  { name: "Phobos Junction", planet: "Mars" },
  { name: "Ceres Junction", planet: "Mars" },
  { name: "Jupiter Junction", planet: "Ceres" },
  { name: "Europa Junction", planet: "Jupiter" },
  { name: "Saturn Junction", planet: "Jupiter" },
  { name: "Uranus Junction", planet: "Saturn" },
  { name: "Neptune Junction", planet: "Uranus" },
  { name: "Pluto Junction", planet: "Neptune" },
  { name: "Sedna Junction", planet: "Pluto" },
  { name: "Eris Junction", planet: "Sedna" },
  { name: "The Void Junction", planet: "Phobos" },
  { name: "Lua Junction", planet: "Uranus" },
  { name: "Kuva Fortress Junction", planet: "Sedna" },
  { name: "Deimos Junction", planet: "Mars" },
];

// MR thresholds (cumulative XP needed) - Official Wiki formula: 2,500 × Rank²
// For Legendary ranks (after MR 30): 2,250,000 + (147,500 × Legendary Rank)
const MR_THRESHOLDS = [
  0, // MR 0
  2500, // MR 1:  2,500 × 1²
  10000, // MR 2:  2,500 × 2²
  22500, // MR 3:  2,500 × 3²
  40000, // MR 4:  2,500 × 4²
  62500, // MR 5:  2,500 × 5²
  90000, // MR 6:  2,500 × 6²
  122500, // MR 7:  2,500 × 7²
  160000, // MR 8:  2,500 × 8²
  202500, // MR 9:  2,500 × 9²
  250000, // MR 10: 2,500 × 10²
  302500, // MR 11: 2,500 × 11²
  360000, // MR 12: 2,500 × 12²
  422500, // MR 13: 2,500 × 13²
  490000, // MR 14: 2,500 × 14²
  562500, // MR 15: 2,500 × 15²
  640000, // MR 16: 2,500 × 16²
  722500, // MR 17: 2,500 × 17²
  810000, // MR 18: 2,500 × 18²
  902500, // MR 19: 2,500 × 19²
  1000000, // MR 20: 2,500 × 20²
  1102500, // MR 21: 2,500 × 21²
  1210000, // MR 22: 2,500 × 22²
  1322500, // MR 23: 2,500 × 23²
  1440000, // MR 24: 2,500 × 24²
  1562500, // MR 25: 2,500 × 25²
  1690000, // MR 26: 2,500 × 26²
  1822500, // MR 27: 2,500 × 27²
  1960000, // MR 28: 2,500 × 28²
  2102500, // MR 29: 2,500 × 29²
  2250000, // MR 30: 2,500 × 30²
  // Legendary Ranks (LR): 2,250,000 + (147,500 × LR#)
  2397500, // LR 1 (MR 31)
  2545000, // LR 2 (MR 32)
  2692500, // LR 3 (MR 33)
  2840000, // LR 4 (MR 34)
  2987500, // LR 5 (MR 35)
];

// Tab options
type MasteryTab =
  | "equipment"
  | "starchart"
  | "junctions"
  | "intrinsics"
  | "recommendations";

// Calculate MR from total XP
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
  // For next threshold, use 147,500 increment for Legendary ranks beyond array
  const nextThreshold = MR_THRESHOLDS[rank + 1] || currentThreshold + 147500;
  const xpInRank = totalXP - currentThreshold;
  const xpNeeded = nextThreshold - currentThreshold;
  const progress = Math.min(100, Math.round((xpInRank / xpNeeded) * 100));

  // Determine display string (LR for Legendary ranks, MR for regular)
  const isLegendary = rank > 30;
  const displayRank = isLegendary ? `LR ${rank - 30}` : `MR ${rank}`;

  return { rank, progress, nextThreshold, displayRank, isLegendary };
}

// All masterable categories
const MASTERABLE_CATEGORIES = [
  "Warframes",
  "Primary",
  "Secondary",
  "Melee",
  "Sentinel",
  "Companions",
  "Robotic",
  "Archwing",
  "Arch-Gun",
  "Arch-Melee",
  "Amp",
  "K-Drive",
  "Necramech",
  "Sentinel Weapons",
];

export function MasteryView() {
  const [masteredItems, updateMasteredItems] =
    useLocalStorageSet<string>("ordis-mastery");
  const [completedNodes, setCompletedNodes] = useLocalStorageSet<string>(
    "ordis-mastery-nodes",
  );
  const [completedJunctions, setCompletedJunctions] =
    useLocalStorageSet<string>("ordis-mastery-junctions");
  const [intrinsicRanks, setIntrinsicRanks] = useState<Record<string, number>>(
    () => {
      const saved = localStorage.getItem("ordis-mastery-intrinsics");
      return saved ? JSON.parse(saved) : {};
    },
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<MasteryTab>("equipment");
  const [expandedPlanet, setExpandedPlanet] = useState<string | null>(null);

  // Update intrinsic rank
  const updateIntrinsicRank = useCallback((name: string, rank: number) => {
    setIntrinsicRanks((prev) => {
      const updated = {
        ...prev,
        [name]: Math.max(0, Math.min(MAX_INTRINSIC_RANK, rank)),
      };
      localStorage.setItem("ordis-mastery-intrinsics", JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Get all masterable items from itemsData
  const masterableItems = useMemo(() => {
    const items: {
      path: string;
      name: string;
      category: string;
      imageName?: string;
      xp: number;
    }[] = [];

    Object.entries(itemsData).forEach(([path, data]) => {
      let cat = data.category || data.type || "";
      const uniqueName = data.uniqueName || "";

      // Exclude non-masterable items
      const type = data.type || "";

      if (
        type === "Skin" ||
        type === "Skins" ||
        type === "Resource" ||
        type === "Sigil" ||
        type === "Emote" ||
        type === "Glyph" ||
        type === "Mod" ||
        type === "Sentinel Precept" ||
        type === "Companion Mod" ||
        type === "Archwing Mod" || // New Exclusion
        type === "Warframe Mod" || // New Exclusion
        type === "Helminth Ability" ||
        data.category === "Skins" ||
        uniqueName.includes("/Color/") ||
        (uniqueName.includes("/KitGun") &&
          !uniqueName.includes("Barrel") &&
          !uniqueName.includes("Chamber")) || // Allow Barrels and Chambers (Kitguns)
        (uniqueName.includes("/ModularMelee") && !uniqueName.includes("Tip")) ||
        (data.category === "Misc" &&
          type !== "Amp" &&
          type !== "K-Drive Component" &&
          !uniqueName.includes("Hoverboard") &&
          !uniqueName.includes("MoaPet") &&
          !uniqueName.includes("HoundPet")) ||
        // Exclude Amp Parts (Brace/Scaffold) - Keep Prisms
        (data.category === "Amp" &&
          (data.name.includes("Brace") || data.name.includes("Scaffold"))) ||
        (type === "Amp" &&
          (data.name.includes("Brace") || data.name.includes("Scaffold"))) ||
        // Exclude Dev/Test Items
        ["Uriel", "Nokko", "Oraxia", "Tink", "Zodian"].some((bad) =>
          data.name.includes(bad),
        ) ||
        // Exclude Modular Pet Parts (Mutagens, Antigens, Gyros, Brackets, Cores)
        data.name.includes("Mutagen") ||
        data.name.includes("Antigen") ||
        (uniqueName.includes("/MoaPetParts/") &&
          !uniqueName.includes("MoaPetHead")) || // Only Head is masterable for MOAs
        (uniqueName.includes("/ZanukaPetParts/") &&
          !uniqueName.includes("ZanukaPetPartHead")) // Only Head is masterable for Hounds
      ) {
        return; // Skip
      }

      // CAT REASSIGNMENT LOGIC
      if (uniqueName.includes("/EntratiMech/")) {
        cat = "Necramech";
      } else if (uniqueName.includes("/Lotus/Types/Sentinels/Sentinel")) {
        if (uniqueName.includes("/SentinelWeapons/")) {
          cat = "Sentinel Weapons";
        } else {
          cat = "Sentinel";
        }
      } else if (uniqueName.includes("/SentinelWeapons/")) {
        cat = "Sentinel Weapons";
      } else if (
        uniqueName.includes("/KubrowPet/") ||
        uniqueName.includes("/CatbrowPet/") ||
        uniqueName.includes("/PredasitePet/") ||
        uniqueName.includes("/VulpaphylaPet/")
      ) {
        cat = "Companions";
      } else if (
        uniqueName.includes("MoaPet") ||
        uniqueName.includes("/ZanukaPet/") ||
        uniqueName.includes("/Robot/") ||
        data.type === "Hound" ||
        uniqueName.includes("HoundPet") ||
        uniqueName.includes("/Hounds/")
      ) {
        cat = "Robotic";
      } else if (data.category === "Pets") {
        cat = "Companions";
      } else if (
        uniqueName.includes("/KDrive/Parts/Board") ||
        (uniqueName.includes("Hoverboard") && uniqueName.includes("Deck"))
      ) {
        cat = "K-Drive";
      } else if (
        (uniqueName.includes("/Operator/Amp/") ||
          uniqueName.includes("OperatorAmp")) &&
        (data.name.includes("Prism") ||
          uniqueName.includes("Prism") ||
          data.type === "Amp" ||
          data.name === "Mote Amp")
      ) {
        cat = "Amp";
      } else if (uniqueName.includes("/Powersuits/Archwing/")) {
        // Default cat is usually "Archwing"
        if (cat !== "Archwing") cat = "Archwing";
      } else if (uniqueName.includes("/Archwing/Weapons/")) {
        if (uniqueName.includes("Melee")) cat = "Arch-Melee";
        else cat = "Arch-Gun";
      }

      if (MASTERABLE_CATEGORIES.includes(cat)) {
        // Calculate dynamic XP (e.g. Rank 40 items)
        let xp = MASTERY_XP[cat] || 0;

        // FIX: Companions/Pets often have null/0 XP in data - Force 6000
        if (
          cat === "Companions" ||
          cat === "Robotic" ||
          data.category === "Pets" ||
          uniqueName.includes("/MoaPet/") ||
          uniqueName.includes("/HoundPet/")
        ) {
          // Ensure visual category aligns with user expectations
          // (User has "Companions", "MOAs", "Hounds" separate in table, but app likely maps to "Companions" or "Robotic")
          // For now, ensure XP is correct.
          // Exclude "Sentinel Weapons" from this check via cat check above (it's distinct from Robotic usually)
          if (cat !== "Sentinel Weapons" && !type.includes("Weapon")) {
            xp = 6000;
          }
        }

        // FIX: Robotic Weapons validation
        if (
          cat === "Sentinel Weapons" ||
          (data.category === "Robotic" && type.includes("Weapon"))
        ) {
          xp = 3000;
        }

        // Base fallback if still 0 (e.g. standard items)
        if (xp === 0) xp = MASTERY_XP[cat] || 3000;

        if (
          data.name === "Paracesis" ||
          data.name.startsWith("Kuva ") ||
          data.name.startsWith("Tenet ") ||
          uniqueName.includes("/Necramech/")
        ) {
          xp = 4000;
          if (uniqueName.includes("/Necramech/")) xp = 8000;
        }

        items.push({
          path,
          name: data.name,
          category: cat,
          imageName: data.imageName || undefined,
          xp: xp,
        });
      }
    });

    // MANUALLY INJECT PLEXUS
    items.push({
      path: "Manual_Plexus",
      name: "Plexus",
      category: "Companions", // Or create "Vehicles" / "Plexus" if preferred, but Companions 6000 XP fits
      xp: 6000,
      imageName: "Plexus.png", // Placeholder
    });

    return items.sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  // Get star chart nodes grouped by planet
  const starChartNodes = useMemo(() => {
    const planetMap = new Map<string, { name: string; key: string }[]>();

    Object.entries(solNodes).forEach(([key, node]) => {
      if (typeof node === "object" && node !== null && "value" in node) {
        const nodeValue = node as { value: string };
        const match = nodeValue.value.match(/^(.+?)\s*\((.+?)\)$/);
        if (match) {
          const nodeName = match[1];
          const planet = match[2];
          if (!planetMap.has(planet)) {
            planetMap.set(planet, []);
          }
          planetMap.get(planet)!.push({ name: nodeName, key });
        }
      }
    });

    return planetMap;
  }, []);

  // Filter items
  const filteredItems = useMemo(() => {
    let items = masterableItems;
    if (selectedCategory !== "all") {
      items = items.filter((i) => i.category === selectedCategory);
    }
    if (searchQuery.length >= 2) {
      const q = searchQuery.toLowerCase();
      items = items.filter((i) => i.name.toLowerCase().includes(q));
    }
    return items;
  }, [masterableItems, selectedCategory, searchQuery]);

  const toggleMastered = (path: string) => {
    updateMasteredItems((prev) => {
      const updated = new Set(prev);
      if (updated.has(path)) {
        updated.delete(path);
      } else {
        updated.add(path);
      }
      return updated;
    });
  };

  const toggleNode = (key: string) => {
    setCompletedNodes((prev) => {
      const updated = new Set(prev);
      if (updated.has(key)) {
        updated.delete(key);
      } else {
        updated.add(key);
      }
      return updated;
    });
  };

  const toggleJunction = (name: string) => {
    setCompletedJunctions((prev) => {
      const updated = new Set(prev);
      if (updated.has(name)) {
        updated.delete(name);
      } else {
        updated.add(name);
      }
      return updated;
    });
  };

  // Calculate XP statistics
  const xpStats = useMemo(() => {
    const categoryXP: Record<
      string,
      { total: number; mastered: number; count: number; masteredCount: number }
    > = {};

    masterableItems.forEach((item) => {
      if (!categoryXP[item.category]) {
        categoryXP[item.category] = {
          total: 0,
          mastered: 0,
          count: 0,
          masteredCount: 0,
        };
      }
      categoryXP[item.category].total += item.xp;
      categoryXP[item.category].count++;
      if (masteredItems.has(item.path)) {
        categoryXP[item.category].mastered += item.xp;
        categoryXP[item.category].masteredCount++;
      }
    });

    const totalEquipmentXP = Object.values(categoryXP).reduce(
      (sum, c) => sum + c.total,
      0,
    );
    const masteredEquipmentXP = Object.values(categoryXP).reduce(
      (sum, c) => sum + c.mastered,
      0,
    );

    // Star chart XP
    let totalNodeCount = 0;
    starChartNodes.forEach((nodes: { name: string; key: string }[]) => {
      totalNodeCount += nodes.length;
    });
    const nodesXP = completedNodes.size * NODE_XP;
    const totalNodesXP = totalNodeCount * NODE_XP;

    // Junction XP
    const junctionsXP = completedJunctions.size * JUNCTION_XP;
    const totalJunctionsXP = JUNCTIONS.length * JUNCTION_XP;

    // Intrinsics XP (1500 XP per rank)
    const allIntrinsics = [...RAILJACK_INTRINSICS, ...DRIFTER_INTRINSICS];
    const totalIntrinsicsRanks = allIntrinsics.reduce(
      (sum, name) => sum + (intrinsicRanks[name] || 0),
      0,
    );
    const intrinsicsXP = totalIntrinsicsRanks * INTRINSIC_XP;
    const maxIntrinsicsXP =
      allIntrinsics.length * MAX_INTRINSIC_RANK * INTRINSIC_XP;

    const totalXP = masteredEquipmentXP + nodesXP + junctionsXP + intrinsicsXP;
    const maxXP =
      totalEquipmentXP + totalNodesXP + totalJunctionsXP + maxIntrinsicsXP;

    return {
      categoryXP,
      totalEquipmentXP,
      masteredEquipmentXP,
      totalNodeCount,
      nodesXP,
      totalNodesXP,
      junctionsXP,
      totalJunctionsXP,
      intrinsicsXP,
      maxIntrinsicsXP,
      totalIntrinsicsRanks,
      totalXP,
      maxXP,
    };
  }, [
    masterableItems,
    masteredItems,
    completedNodes,
    completedJunctions,
    starChartNodes,
    intrinsicRanks,
  ]);

  const mrInfo = calculateMR(xpStats.totalXP);

  // Categories for filter
  const categories = ["all", ...MASTERABLE_CATEGORIES];

  return (
    <div className="space-y-6">
      {/* MR Overview */}
      <section className="bg-gradient-to-r from-cyan-900/30 to-slate-900/50 rounded-xl border border-cyan-700/30 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-cyan-400 flex items-center gap-3">
            <Star size={28} /> Mastery Rank Estimator
          </h2>
          <div className="text-right">
            <div
              className={`text-4xl font-bold ${mrInfo.isLegendary ? "text-yellow-400" : "text-cyan-300"}`}
            >
              {mrInfo.displayRank}
            </div>
            <div className="text-slate-400 text-sm">
              {xpStats.totalXP.toLocaleString()} /{" "}
              {xpStats.maxXP.toLocaleString()} XP
            </div>
          </div>
        </div>

        {/* MR Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-slate-500 mb-1">
            <span>
              Progress to{" "}
              {mrInfo.rank >= 30
                ? `LR ${mrInfo.rank - 30 + 1}`
                : `MR ${mrInfo.rank + 1}`}
            </span>
            <span>{mrInfo.progress}%</span>
          </div>
          <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 transition-all duration-500"
              style={{ width: `${mrInfo.progress}%` }}
            />
          </div>
        </div>

        {/* XP Summary Grid */}
        <div className="grid grid-cols-4 gap-4 text-center">
          <div className="bg-slate-800/50 rounded-lg p-3">
            <div className="text-xs text-slate-500 uppercase mb-1">
              Equipment
            </div>
            <div className="text-lg font-bold text-cyan-300">
              {xpStats.masteredEquipmentXP.toLocaleString()}
            </div>
            <div className="text-xs text-slate-500">
              / {xpStats.totalEquipmentXP.toLocaleString()} XP
            </div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-3">
            <div className="text-xs text-slate-500 uppercase mb-1">
              Star Chart
            </div>
            <div className="text-lg font-bold text-cyan-300">
              {xpStats.nodesXP.toLocaleString()}
            </div>
            <div className="text-xs text-slate-500">
              / {xpStats.totalNodesXP.toLocaleString()} XP
            </div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-3">
            <div className="text-xs text-slate-500 uppercase mb-1">
              Junctions
            </div>
            <div className="text-lg font-bold text-cyan-300">
              {xpStats.junctionsXP.toLocaleString()}
            </div>
            <div className="text-xs text-slate-500">
              / {xpStats.totalJunctionsXP.toLocaleString()} XP
            </div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-3">
            <div className="text-xs text-slate-500 uppercase mb-1">
              Intrinsics
            </div>
            <div className="text-lg font-bold text-cyan-300">
              {xpStats.intrinsicsXP.toLocaleString()}
            </div>
            <div className="text-xs text-slate-500">
              / {xpStats.maxIntrinsicsXP.toLocaleString()} XP
            </div>
          </div>
        </div>
      </section>

      {/* Tab Navigation */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab("equipment")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === "equipment"
              ? "bg-cyan-600 text-white"
              : "bg-slate-800 text-slate-400 hover:bg-slate-700"
          }`}
        >
          <Star size={18} /> Equipment
        </button>
        <button
          onClick={() => setActiveTab("starchart")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === "starchart"
              ? "bg-cyan-600 text-white"
              : "bg-slate-800 text-slate-400 hover:bg-slate-700"
          }`}
        >
          <MapIcon size={18} /> Star Chart
        </button>
        <button
          onClick={() => setActiveTab("junctions")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === "junctions"
              ? "bg-cyan-600 text-white"
              : "bg-slate-800 text-slate-400 hover:bg-slate-700"
          }`}
        >
          <Waypoints size={18} /> Junctions
        </button>
        <button
          onClick={() => setActiveTab("intrinsics")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === "intrinsics"
              ? "bg-cyan-600 text-white"
              : "bg-slate-800 text-slate-400 hover:bg-slate-700"
          }`}
        >
          <Anchor size={18} /> Intrinsics
        </button>
        <button
          onClick={() => setActiveTab("recommendations")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === "recommendations"
              ? "bg-yellow-600 text-white"
              : "bg-slate-800 text-slate-400 hover:bg-slate-700"
          }`}
        >
          <Lightbulb size={18} /> What to Level
        </button>
      </div>

      {/* Equipment Tab */}
      {activeTab === "equipment" && (
        <section className="bg-slate-900/50 rounded-xl border border-slate-700/30 p-6">
          {/* Category XP Breakdown */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 mb-6">
            {Object.entries(xpStats.categoryXP).map(([cat, stats]) => (
              <div
                key={cat}
                className="bg-slate-800/50 rounded-lg p-2 text-center cursor-pointer hover:bg-slate-800 transition-colors"
                onClick={() => setSelectedCategory(cat)}
              >
                <div className="text-xs text-slate-500 truncate">{cat}</div>
                <div className="text-sm font-bold text-slate-200">
                  {stats.masteredCount}/{stats.count}
                </div>
                <div className="text-xs text-cyan-400">
                  {stats.mastered.toLocaleString()} XP
                </div>
              </div>
            ))}
          </div>

          {/* Search and Filter */}
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                size={20}
              />
              <input
                type="text"
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-12 pr-4 py-3 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-600"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-slate-200"
              aria-label="Category filter"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === "all" ? "All Categories" : cat}
                </option>
              ))}
            </select>
          </div>

          {/* Items List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[50vh] overflow-y-auto">
            {filteredItems.slice(0, 150).map((item) => {
              const mastered = masteredItems.has(item.path);
              const imageUrl = getItemImageUrl({ uniqueName: item.path });
              return (
                <button
                  key={item.path}
                  onClick={() => toggleMastered(item.path)}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-colors text-left ${
                    mastered
                      ? "bg-green-900/20 border-green-600/50 hover:bg-green-900/30"
                      : "bg-slate-800/30 border-slate-700/50 hover:border-cyan-600/50"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                      mastered
                        ? "bg-green-600 border-green-600"
                        : "border-slate-500"
                    }`}
                  >
                    {mastered && <Check size={14} className="text-white" />}
                  </div>
                  {imageUrl && (
                    <img
                      src={imageUrl}
                      alt=""
                      className="w-8 h-8 object-contain rounded"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div
                      className={`font-medium truncate text-sm ${
                        mastered
                          ? "text-slate-400 line-through"
                          : "text-slate-200"
                      }`}
                    >
                      {item.name}
                    </div>
                    <div className="text-xs text-slate-500 flex justify-between">
                      <span>{item.category}</span>
                      <span className="text-cyan-400">
                        {item.xp.toLocaleString()} XP
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          {filteredItems.length > 150 && (
            <p className="text-center text-slate-500 text-sm mt-4">
              Showing first 150 items. Use search to find more.
            </p>
          )}
        </section>
      )}

      {/* Star Chart Tab */}
      {activeTab === "starchart" && (
        <section className="bg-slate-900/50 rounded-xl border border-slate-700/30 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2">
              <MapIcon size={20} /> Star Chart Nodes
            </h3>
            <div className="text-sm text-slate-400">
              {completedNodes.size} / {xpStats.totalNodeCount} nodes ({NODE_XP}{" "}
              XP each)
            </div>
          </div>
          <p className="text-xs text-slate-500 mb-4 italic">
            Note: Some newer regions (1999 Höllvania, etc.) may not be included
            in the data.
          </p>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {Array.from(starChartNodes.entries())
              .sort(([a], [b]) => a.localeCompare(b))
              .map(
                ([planet, nodes]: [
                  string,
                  { name: string; key: string }[],
                ]) => {
                  const completedCount = nodes.filter((n) =>
                    completedNodes.has(n.key),
                  ).length;
                  const isExpanded = expandedPlanet === planet;
                  return (
                    <div
                      key={planet}
                      className="bg-slate-800/50 rounded-lg overflow-hidden"
                    >
                      <button
                        onClick={() =>
                          setExpandedPlanet(isExpanded ? null : planet)
                        }
                        className="w-full p-3 flex items-center justify-between hover:bg-slate-800/80 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-slate-200">
                            {planet}
                          </span>
                          <span className="text-sm text-slate-500">
                            {completedCount}/{nodes.length}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-cyan-400">
                            {(completedCount * NODE_XP).toLocaleString()} XP
                          </span>
                          {isExpanded ? (
                            <ChevronUp size={18} />
                          ) : (
                            <ChevronDown size={18} />
                          )}
                        </div>
                      </button>
                      {isExpanded && (
                        <div className="px-3 pb-3 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1">
                          {nodes.map((node: { name: string; key: string }) => {
                            const completed = completedNodes.has(node.key);
                            return (
                              <button
                                key={node.key}
                                onClick={() => toggleNode(node.key)}
                                className={`flex items-center gap-2 p-2 rounded text-sm transition-colors ${
                                  completed
                                    ? "bg-green-900/30 text-green-400"
                                    : "bg-slate-900/50 text-slate-400 hover:bg-slate-900"
                                }`}
                              >
                                <div
                                  className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                                    completed
                                      ? "bg-green-600 border-green-600"
                                      : "border-slate-600"
                                  }`}
                                >
                                  {completed && (
                                    <Check size={10} className="text-white" />
                                  )}
                                </div>
                                <span className="truncate">{node.name}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                },
              )}
          </div>
        </section>
      )}

      {/* Junctions Tab */}
      {activeTab === "junctions" && (
        <section className="bg-slate-900/50 rounded-xl border border-slate-700/30 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2">
              <Waypoints size={20} /> Junctions
            </h3>
            <div className="text-sm text-slate-400">
              {completedJunctions.size} / {JUNCTIONS.length} (
              {JUNCTION_XP.toLocaleString()} XP each)
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {JUNCTIONS.map((junction) => {
              const completed = completedJunctions.has(junction.name);
              return (
                <button
                  key={junction.name}
                  onClick={() => toggleJunction(junction.name)}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-colors text-left ${
                    completed
                      ? "bg-green-900/20 border-green-600/50 hover:bg-green-900/30"
                      : "bg-slate-800/30 border-slate-700/50 hover:border-cyan-600/50"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                      completed
                        ? "bg-green-600 border-green-600"
                        : "border-slate-500"
                    }`}
                  >
                    {completed && <Check size={14} className="text-white" />}
                  </div>
                  <div className="flex-1">
                    <div
                      className={`font-medium ${completed ? "text-green-400" : "text-slate-200"}`}
                    >
                      {junction.name}
                    </div>
                    <div className="text-xs text-slate-500">
                      Located at {junction.planet}
                    </div>
                  </div>
                  <div className="text-xs text-cyan-400">
                    {JUNCTION_XP.toLocaleString()} XP
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Intrinsics Tab */}
      {activeTab === "intrinsics" && (
        <section className="bg-slate-900/50 rounded-xl border border-slate-700/30 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2">
              <Anchor size={20} /> Intrinsics
            </h3>
            <div className="text-sm text-slate-400">
              {xpStats.totalIntrinsicsRanks} ranks (
              {INTRINSIC_XP.toLocaleString()} XP each)
            </div>
          </div>

          {/* Railjack Intrinsics */}
          <div className="mb-6">
            <h4 className="text-md font-semibold text-cyan-400 mb-3">
              Railjack Intrinsics
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {RAILJACK_INTRINSICS.map((name) => {
                const rank = intrinsicRanks[name] || 0;
                return (
                  <div key={name} className="bg-slate-800/50 rounded-lg p-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-slate-200 font-medium">{name}</span>
                      <span className="text-cyan-400 text-sm">
                        {(rank * INTRINSIC_XP).toLocaleString()} XP
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateIntrinsicRank(name, rank - 1)}
                        className="w-8 h-8 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 font-bold"
                        disabled={rank <= 0}
                      >
                        −
                      </button>
                      <div className="flex-1 bg-slate-900 rounded-full h-3 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 transition-all"
                          style={{
                            width: `${(rank / MAX_INTRINSIC_RANK) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="w-12 text-center text-slate-300 font-medium">
                        {rank}/{MAX_INTRINSIC_RANK}
                      </span>
                      <button
                        onClick={() => updateIntrinsicRank(name, rank + 1)}
                        className="w-8 h-8 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 font-bold"
                        disabled={rank >= MAX_INTRINSIC_RANK}
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Drifter Intrinsics */}
          <div>
            <h4 className="text-md font-semibold text-purple-400 mb-3">
              Drifter Intrinsics
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {DRIFTER_INTRINSICS.map((name) => {
                const rank = intrinsicRanks[name] || 0;
                return (
                  <div key={name} className="bg-slate-800/50 rounded-lg p-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-slate-200 font-medium">{name}</span>
                      <span className="text-purple-400 text-sm">
                        {(rank * INTRINSIC_XP).toLocaleString()} XP
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateIntrinsicRank(name, rank - 1)}
                        className="w-8 h-8 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 font-bold"
                        disabled={rank <= 0}
                      >
                        −
                      </button>
                      <div className="flex-1 bg-slate-900 rounded-full h-3 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-600 to-purple-400 transition-all"
                          style={{
                            width: `${(rank / MAX_INTRINSIC_RANK) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="w-12 text-center text-slate-300 font-medium">
                        {rank}/{MAX_INTRINSIC_RANK}
                      </span>
                      <button
                        onClick={() => updateIntrinsicRank(name, rank + 1)}
                        className="w-8 h-8 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 font-bold"
                        disabled={rank >= MAX_INTRINSIC_RANK}
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Recommendations Tab */}
      {activeTab === "recommendations" && (
        <section className="bg-slate-900/50 rounded-xl border border-yellow-700/30 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-yellow-400 flex items-center gap-2">
              <TrendingUp size={20} /> What to Level Next
            </h3>
            <div className="text-sm text-slate-400">
              Highest XP unmastered items
            </div>
          </div>

          {/* High XP Items (Warframes, etc.) */}
          <div className="mb-6">
            <h4 className="text-md font-semibold text-cyan-400 mb-3 flex items-center gap-2">
              <Star size={16} /> High XP Items (6000+ XP)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {masterableItems
                .filter(
                  (item) => !masteredItems.has(item.path) && item.xp >= 6000,
                )
                .slice(0, 12)
                .map((item) => {
                  const imageUrl = getItemImageUrl({ uniqueName: item.path });
                  return (
                    <button
                      key={item.path}
                      onClick={() => toggleMastered(item.path)}
                      className="flex items-center gap-3 p-3 rounded-lg border border-yellow-700/30 bg-yellow-900/10 hover:bg-yellow-900/20 transition-colors text-left"
                    >
                      {imageUrl && (
                        <img
                          src={imageUrl}
                          alt=""
                          className="w-8 h-8 object-contain rounded"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display =
                              "none";
                          }}
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-slate-200 truncate">
                          {item.name}
                        </div>
                        <div className="text-xs text-slate-500">
                          {item.category}
                        </div>
                      </div>
                      <div className="text-sm font-bold text-yellow-400">
                        {item.xp.toLocaleString()} XP
                      </div>
                    </button>
                  );
                })}
            </div>
            {masterableItems.filter(
              (item) => !masteredItems.has(item.path) && item.xp >= 6000,
            ).length === 0 && (
              <p className="text-center text-green-400 py-4">
                All high XP items mastered! 🎉
              </p>
            )}
          </div>

          {/* Standard XP Items */}
          <div>
            <h4 className="text-md font-semibold text-slate-400 mb-3 flex items-center gap-2">
              <Star size={16} /> Standard Items (3000 XP)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
              {masterableItems
                .filter(
                  (item) => !masteredItems.has(item.path) && item.xp === 3000,
                )
                .slice(0, 20)
                .map((item) => (
                  <button
                    key={item.path}
                    onClick={() => toggleMastered(item.path)}
                    className="flex items-center gap-2 p-2 rounded-lg border border-slate-700/50 bg-slate-800/30 hover:bg-slate-800/50 transition-colors text-left"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-xs text-slate-200 truncate">
                        {item.name}
                      </div>
                      <div className="text-xs text-slate-500">
                        {item.category}
                      </div>
                    </div>
                  </button>
                ))}
            </div>
            <p className="text-center text-slate-500 text-sm mt-4">
              {
                masterableItems.filter((item) => !masteredItems.has(item.path))
                  .length
              }{" "}
              items remaining to master
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
