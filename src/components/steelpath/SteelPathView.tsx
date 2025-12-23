import { useState, useMemo } from "react";
import { Sword, Check, MapPin, Search, Trophy, Zap, Star, ShoppingBag } from "lucide-react";
import { useLocalStorageSet } from "../../hooks/useLocalStorage";
import solNodes from "../../data/solNodes.json";

// Calculate current Incarnon week (8-week rotation, starting from a known date)
// Week 1 started around 2023-02-15
function getCurrentIncarnWeek(): number {
    const startDate = new Date("2023-02-15T00:00:00Z");
    const now = new Date();
    const diffMs = now.getTime() - startDate.getTime();
    const diffWeeks = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));
    return (diffWeeks % 8) + 1;
}

// Steel Path rewards structure
const STEEL_ESSENCE_REWARDS = [
    { cost: 15, item: "Umbra Forma Blueprint", description: "Adds Umbra polarity" },
    { cost: 25, item: "Kuva (10,000)", description: "For Riven rerolls" },
    { cost: 15, item: "Primary Arcane Adapter", description: "Add arcane slot to primary" },
    { cost: 15, item: "Secondary Arcane Adapter", description: "Add arcane slot to secondary" },
    { cost: 3, item: "Relic Pack", description: "Random void relics" },
];

// Incarnon Genesis weapons (weekly rotation from Cavalero)
const INCARNON_WEAPONS = [
    { week: 1, weapons: ["Braton", "Lato", "Skana", "Paris", "Kunai"] },
    { week: 2, weapons: ["Bo", "Latron", "Furis", "Furax", "Strun"] },
    { week: 3, weapons: ["Lex", "Magistar", "Boltor", "Bronco", "Ceramic Dagger"] },
    { week: 4, weapons: ["Torid", "Dual Toxocyst", "Dual Ichor", "Miter", "Atomos"] },
    { week: 5, weapons: ["Ack & Brunt", "Soma", "Vasto", "Nami Solo", "Burston"] },
    { week: 6, weapons: ["Zylok", "Sibear", "Dread", "Despair", "Hate"] },
    { week: 7, weapons: ["Angstrum", "Gorgon", "Anku", "Gammacor", "Afuris"] },
    { week: 8, weapons: ["Boar", "Okina", "Praedos", "Drakgoon", "Mandonel"] },
];

// Common mission types for filtering
const MISSION_TYPES = ["Exterminate", "Capture", "Survival", "Defense", "Sabotage", "Rescue", "Spy", "Interception", "Excavation", "Mobile Defense"];

// Planet order for Steel Path
const PLANETS = [
    "Earth",
    "Venus",
    "Mercury",
    "Mars",
    "Phobos",
    "Ceres",
    "Jupiter",
    "Europa",
    "Saturn",
    "Uranus",
    "Neptune",
    "Pluto",
    "Sedna",
    "Eris",
    "Void",
    "Kuva Fortress",
    "Lua",
    "Deimos",
    "Zariman",
];

interface SteelPathNode {
    name: string;
    planet: string;
    type: string;
}

// Parse sol nodes into Steel Path format
function getSteelPathNodes(): SteelPathNode[] {
    const nodes: SteelPathNode[] = [];

    Object.values(solNodes).forEach((value) => {
        if (typeof value === "object" && value !== null && "value" in value) {
            const nodeValue = value as { value: string; enemy?: string; type?: string };
            // Parse node name from value (format: "Node Name (Planet)")
            const match = nodeValue.value.match(/^(.+?)\s*\((.+?)\)$/);
            if (match) {
                nodes.push({
                    name: match[1],
                    planet: match[2],
                    type: nodeValue.type || "Unknown",
                });
            }
        }
    });

    return nodes;
}

export function SteelPathView() {
    const [completedNodes, setCompletedNodes] = useLocalStorageSet<string>("ordis-steel-path-completed");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedPlanet, setSelectedPlanet] = useState<string>("all");
    const [missionTypeFilter, setMissionTypeFilter] = useState<string>("all");
    const [steelEssence, setSteelEssence] = useState<number>(() => {
        const saved = localStorage.getItem("ordis-steel-essence");
        return saved ? parseInt(saved, 10) : 0;
    });
    const [wantedRewards, setWantedRewards] = useLocalStorageSet<string>("ordis-steel-wanted");

    const allNodes = useMemo(() => getSteelPathNodes(), []);

    // Group nodes by planet
    const nodesByPlanet = useMemo(() => {
        const grouped = new Map<string, SteelPathNode[]>();
        allNodes.forEach((node) => {
            const existing = grouped.get(node.planet) || [];
            existing.push(node);
            grouped.set(node.planet, existing);
        });
        return grouped;
    }, [allNodes]);

    // Filter nodes
    const filteredNodes = useMemo(() => {
        let nodes = allNodes;

        if (selectedPlanet !== "all") {
            nodes = nodes.filter((n) => n.planet === selectedPlanet);
        }

        if (searchQuery.length >= 2) {
            const q = searchQuery.toLowerCase();
            nodes = nodes.filter(
                (n) => n.name.toLowerCase().includes(q) || n.planet.toLowerCase().includes(q)
            );
        }

        if (missionTypeFilter !== "all") {
            nodes = nodes.filter((n) => n.type.toLowerCase().includes(missionTypeFilter.toLowerCase()));
        }

        return nodes;
    }, [allNodes, selectedPlanet, searchQuery, missionTypeFilter]);

    const toggleNode = (nodeName: string) => {
        setCompletedNodes((prev) => {
            const newSet = new Set(prev);
            const key = nodeName;
            if (newSet.has(key)) {
                newSet.delete(key);
            } else {
                newSet.add(key);
            }
            return newSet;
        });
    };

    const updateEssence = (value: number) => {
        const clamped = Math.max(0, value);
        setSteelEssence(clamped);
        localStorage.setItem("ordis-steel-essence", clamped.toString());
    };

    // Calculate stats
    const totalNodes = allNodes.length;
    const completedCount = completedNodes.size;
    const progressPercent = totalNodes > 0 ? (completedCount / totalNodes) * 100 : 0;

    // Planet progress
    const planetProgress = useMemo(() => {
        const progress: { planet: string; completed: number; total: number }[] = [];
        PLANETS.forEach((planet) => {
            const planetNodes = nodesByPlanet.get(planet) || [];
            const completed = planetNodes.filter((n) => completedNodes.has(n.name)).length;
            if (planetNodes.length > 0) {
                progress.push({ planet, completed, total: planetNodes.length });
            }
        });
        return progress;
    }, [nodesByPlanet, completedNodes]);

    return (
        <div className="space-y-6">
            {/* Header Stats */}
            <div className="bg-slate-900/50 rounded-xl border border-orange-900/30 p-6">
                <h2 className="text-2xl font-bold text-orange-400 mb-4 flex items-center gap-3">
                    <Sword size={28} /> Steel Path Tracker
                </h2>

                {/* Overall Progress */}
                <div className="grid gap-4 sm:grid-cols-3 mb-6">
                    <div className="bg-slate-800/50 rounded-lg p-4">
                        <p className="text-xs text-slate-500 uppercase">Nodes Completed</p>
                        <p className="text-2xl font-bold text-orange-400">
                            {completedCount} / {totalNodes}
                        </p>
                        <div className="h-2 bg-slate-700 rounded-full mt-2 overflow-hidden">
                            <div
                                className="h-full bg-orange-500 transition-all"
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-4">
                        <p className="text-xs text-slate-500 uppercase">Progress</p>
                        <p className="text-2xl font-bold text-cyan-400">
                            {progressPercent.toFixed(1)}%
                        </p>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-4">
                        <p className="text-xs text-slate-500 uppercase">Steel Essence</p>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                value={steelEssence}
                                onChange={(e) => updateEssence(parseInt(e.target.value, 10) || 0)}
                                className="w-20 text-2xl font-bold text-purple-400 bg-transparent border-none p-0"
                            />
                            <Zap size={20} className="text-purple-400" />
                        </div>
                    </div>
                </div>

                {/* Planet Progress Grid */}
                <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                    {planetProgress.map(({ planet, completed, total }) => {
                        const percent = (completed / total) * 100;
                        const isComplete = completed === total;
                        return (
                            <button
                                key={planet}
                                onClick={() => setSelectedPlanet(planet === selectedPlanet ? "all" : planet)}
                                className={`p-3 rounded-lg border transition-all text-left ${selectedPlanet === planet
                                    ? "border-orange-500 bg-orange-900/20"
                                    : isComplete
                                        ? "border-green-700/50 bg-green-900/10"
                                        : "border-slate-700/50 bg-slate-800/30 hover:bg-slate-800/50"
                                    }`}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <span className={`text-sm font-medium ${isComplete ? "text-green-400" : "text-slate-300"}`}>
                                        {planet}
                                    </span>
                                    {isComplete && <Check size={14} className="text-green-400" />}
                                </div>
                                <p className="text-xs text-slate-500">
                                    {completed}/{total}
                                </p>
                                <div className="h-1 bg-slate-700 rounded-full mt-1 overflow-hidden">
                                    <div
                                        className={`h-full ${isComplete ? "bg-green-500" : "bg-orange-500"} transition-all`}
                                        style={{ width: `${percent}%` }}
                                    />
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                    <input
                        type="text"
                        placeholder="Search nodes..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:border-orange-500 focus:outline-none"
                    />
                </div>
                <select
                    value={selectedPlanet}
                    onChange={(e) => setSelectedPlanet(e.target.value)}
                    className="px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-200"
                >
                    <option value="all">All Planets</option>
                    {PLANETS.map((planet) => (
                        <option key={planet} value={planet}>
                            {planet}
                        </option>
                    ))}
                </select>
                <select
                    value={missionTypeFilter}
                    onChange={(e) => setMissionTypeFilter(e.target.value)}
                    className="px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-200"
                >
                    <option value="all">All Mission Types</option>
                    {MISSION_TYPES.map((type) => (
                        <option key={type} value={type}>
                            {type}
                        </option>
                    ))}
                </select>
            </div>

            {/* Node List */}
            <div className="bg-slate-900/50 rounded-xl border border-slate-700/30 p-6">
                <h3 className="text-lg font-bold text-slate-300 mb-4 flex items-center gap-2">
                    <MapPin size={20} />
                    {selectedPlanet === "all" ? "All Nodes" : selectedPlanet}
                    <span className="text-sm font-normal text-slate-500">
                        ({filteredNodes.filter((n) => completedNodes.has(n.name)).length}/{filteredNodes.length} completed)
                    </span>
                </h3>

                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 max-h-[50vh] overflow-y-auto">
                    {filteredNodes.map((node, idx) => {
                        const isCompleted = completedNodes.has(node.name);
                        return (
                            <button
                                key={`${node.planet}-${node.name}-${node.type}-${idx}`}
                                onClick={() => toggleNode(node.name)}
                                className={`p-3 rounded-lg border text-left transition-all ${isCompleted
                                    ? "border-green-700/50 bg-green-900/20"
                                    : "border-slate-700/50 bg-slate-800/30 hover:bg-slate-800/50"
                                    }`}
                            >
                                <div className="flex items-center justify-between">
                                    <span className={`font-medium ${isCompleted ? "text-green-400" : "text-slate-300"}`}>
                                        {node.name}
                                    </span>
                                    {isCompleted && <Check size={16} className="text-green-400" />}
                                </div>
                                <p className="text-xs text-slate-500 mt-1">
                                    {node.planet} • {node.type}
                                </p>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Steel Essence Rewards with Wishlist */}
            <div className="bg-slate-900/50 rounded-xl border border-purple-900/30 p-6">
                <h3 className="text-lg font-bold text-purple-400 mb-4 flex items-center gap-2">
                    <Trophy size={20} /> Steel Essence Rewards
                    <span className="text-sm font-normal text-slate-500 ml-auto">
                        <ShoppingBag size={14} className="inline mr-1" />
                        {Array.from(wantedRewards).length} wanted
                    </span>
                </h3>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {STEEL_ESSENCE_REWARDS.map((reward) => {
                        const canAfford = steelEssence >= reward.cost;
                        const isWanted = wantedRewards.has(reward.item);
                        return (
                            <div
                                key={reward.item}
                                className={`p-4 rounded-lg border transition-all ${isWanted
                                        ? "border-yellow-500/50 bg-yellow-900/10"
                                        : canAfford
                                            ? "border-purple-700/50 bg-purple-900/10"
                                            : "border-slate-700/50 bg-slate-800/30"
                                    }`}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <span className={`font-medium ${isWanted ? "text-yellow-400" : canAfford ? "text-purple-400" : "text-slate-400"}`}>
                                        {reward.item}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setWantedRewards(prev => {
                                                const newSet = new Set(prev);
                                                if (newSet.has(reward.item)) {
                                                    newSet.delete(reward.item);
                                                } else {
                                                    newSet.add(reward.item);
                                                }
                                                return newSet;
                                            })}
                                            className={`p-1 rounded transition-colors ${isWanted ? "text-yellow-400" : "text-slate-500 hover:text-yellow-400"}`}
                                            title={isWanted ? "Remove from wishlist" : "Add to wishlist"}
                                        >
                                            <Star size={14} className={isWanted ? "fill-yellow-400" : ""} />
                                        </button>
                                        <span className={`text-sm ${canAfford ? "text-purple-300" : "text-slate-500"}`}>
                                            {reward.cost} <Zap size={12} className="inline" />
                                        </span>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-500">{reward.description}</p>
                                {isWanted && !canAfford && (
                                    <p className="text-xs text-yellow-500/70 mt-1">
                                        Need {reward.cost - steelEssence} more essence
                                    </p>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Tips */}
            <div className="bg-slate-900/50 rounded-xl border border-slate-700/30 p-6">
                <h3 className="text-lg font-bold text-slate-300 mb-4">Steel Path Tips</h3>
                <div className="grid gap-3 md:grid-cols-2">
                    <div className="bg-slate-800/30 rounded-lg p-3">
                        <h4 className="text-cyan-400 font-medium mb-1">⚔️ Enemy Level</h4>
                        <p className="text-sm text-slate-400">
                            Steel Path enemies start at +100 levels with 2.5x health and shields. Bring your best builds!
                        </p>
                    </div>
                    <div className="bg-slate-800/30 rounded-lg p-3">
                        <h4 className="text-cyan-400 font-medium mb-1">💎 Steel Essence</h4>
                        <p className="text-sm text-slate-400">
                            Drops from Acolytes (5-7 each) and Steel Path Incursions. Farm during Acolyte spawns.
                        </p>
                    </div>
                    <div className="bg-slate-800/30 rounded-lg p-3">
                        <h4 className="text-cyan-400 font-medium mb-1">🎯 Incursions</h4>
                        <p className="text-sm text-slate-400">
                            Daily rotating missions with bonus Steel Essence rewards. Check the Teshin shop.
                        </p>
                    </div>
                    <div className="bg-slate-800/30 rounded-lg p-3">
                        <h4 className="text-cyan-400 font-medium mb-1">🏆 Completion Reward</h4>
                        <p className="text-sm text-slate-400">
                            Completing all nodes unlocks the Steel Path Emote and permanent access to honors.
                        </p>
                    </div>
                </div>
            </div>

            {/* Incarnon Genesis Weapons */}
            <div className="bg-slate-900/50 rounded-xl border border-cyan-900/30 p-6">
                <h3 className="text-lg font-bold text-cyan-400 mb-4 flex items-center gap-2">
                    <Zap size={20} /> Incarnon Genesis Weapons
                    <span className="text-xs font-normal bg-cyan-600/20 text-cyan-400 px-2 py-1 rounded ml-auto">
                        Current: Week {getCurrentIncarnWeek()}
                    </span>
                </h3>
                <p className="text-sm text-slate-400 mb-4">
                    Sold by Cavalero on weekly rotation in the Chrysalith. Buy adapters with Steel Essence.
                </p>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    {INCARNON_WEAPONS.map((week) => {
                        const isCurrent = week.week === getCurrentIncarnWeek();
                        return (
                            <div
                                key={week.week}
                                className={`rounded-lg p-3 border transition-all ${isCurrent
                                        ? "border-cyan-500 bg-cyan-900/20 ring-1 ring-cyan-500/30"
                                        : "border-slate-700/50 bg-slate-800/30"
                                    }`}
                            >
                                <h4 className={`text-xs uppercase mb-2 flex items-center gap-2 ${isCurrent ? "text-cyan-400 font-bold" : "text-slate-500"
                                    }`}>
                                    Week {week.week}
                                    {isCurrent && <span className="text-[10px] bg-cyan-600 text-white px-1.5 py-0.5 rounded">NOW</span>}
                                </h4>
                                <div className="space-y-1">
                                    {week.weapons.map((weapon) => (
                                        <div key={weapon} className={`text-sm ${isCurrent ? "text-cyan-300" : "text-slate-300"}`}>
                                            {weapon}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    );
}
