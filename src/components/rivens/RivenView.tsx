/**
 * Riven Calculator
 * Calculate stat ranges based on weapon disposition
 */
import { useState, useMemo, useCallback } from "react";
import {
    Crosshair,
    Search,
    Info,
    ArrowUp,
    ArrowDown,
    Minus,
    Sparkles,
    Target,
    Plus,
    Trash2,
    RotateCcw,
    Package,
    ArrowUpDown,
    Download,
    Upload
} from "lucide-react";
import { useToast } from "../ui";

// Disposition affects stat ranges - 1 is weakest, 5 is strongest
const DISPOSITION_MULTIPLIERS = {
    1: { min: 0.5, max: 0.8 },   // ●○○○○
    2: { min: 0.65, max: 0.95 }, // ●●○○○
    3: { min: 0.8, max: 1.1 },   // ●●●○○
    4: { min: 0.95, max: 1.25 }, // ●●●●○
    5: { min: 1.1, max: 1.4 },   // ●●●●●
} as const;

// Common riven stats with base values
const RIVEN_STATS = [
    { name: "Critical Chance", base: 150, suffix: "%" },
    { name: "Critical Damage", base: 120, suffix: "%" },
    { name: "Damage", base: 165, suffix: "%" },
    { name: "Multishot", base: 90, suffix: "%" },
    { name: "Status Chance", base: 90, suffix: "%" },
    { name: "Status Duration", base: 100, suffix: "%" },
    { name: "Fire Rate", base: 60, suffix: "%" },
    { name: "Magazine Capacity", base: 50, suffix: "%" },
    { name: "Reload Speed", base: 50, suffix: "%" },
    { name: "Attack Speed", base: 55, suffix: "%" }, // Melee
    { name: "Range", base: 50, suffix: "%" }, // Melee
    { name: "Combo Duration", base: 7, suffix: "s" }, // Melee
    { name: "Initial Combo", base: 30, suffix: "" }, // Melee
    { name: "Punch Through", base: 2.7, suffix: "m" },
    { name: "Projectile Speed", base: 90, suffix: "%" },
    { name: "Zoom", base: 60, suffix: "%" },
    { name: "Heat", base: 90, suffix: "%" },
    { name: "Cold", base: 90, suffix: "%" },
    { name: "Electricity", base: 90, suffix: "%" },
    { name: "Toxin", base: 90, suffix: "%" },
    { name: "Impact", base: 120, suffix: "%" },
    { name: "Puncture", base: 120, suffix: "%" },
    { name: "Slash", base: 120, suffix: "%" },
] as const;

// Sample weapon dispositions (would be fetched from data in real app)
const SAMPLE_WEAPONS: Record<string, { disposition: number; type: "primary" | "secondary" | "melee" }> = {
    "Soma Prime": { disposition: 1, type: "primary" },
    "Braton Prime": { disposition: 3, type: "primary" },
    "Kohm": { disposition: 3, type: "primary" },
    "Kuva Nukor": { disposition: 1, type: "secondary" },
    "Atomos": { disposition: 2, type: "secondary" },
    "Lex Prime": { disposition: 3, type: "secondary" },
    "Orthos Prime": { disposition: 2, type: "melee" },
    "Nikana Prime": { disposition: 1, type: "melee" },
    "Gram Prime": { disposition: 1, type: "melee" },
    "Broken War": { disposition: 3, type: "melee" },
    "Galatine Prime": { disposition: 2, type: "melee" },
    "Tiberon Prime": { disposition: 2, type: "primary" },
    "Rubico Prime": { disposition: 1, type: "primary" },
    "Lanka": { disposition: 2, type: "primary" },
    "Catchmoon": { disposition: 1, type: "secondary" },
};

interface RivenConfig {
    positiveStats: number; // 2 or 3
    hasNegative: boolean;
}

// Stat modifiers based on number of positives and negative
function getStatModifier(config: RivenConfig): number {
    if (config.positiveStats === 2) {
        return config.hasNegative ? 1.25 : 1.0;
    } else { // 3 positives
        return config.hasNegative ? 1.5 : 0.75;
    }
}

// Owned riven interface
interface OwnedRiven {
    id: string;
    weapon: string;
    name: string; // Custom name like "Braton Critatis"
    positives: string[];
    negative?: string;
    rollCount: number;
    addedAt: number;
    notes?: string;
}

const RIVEN_STORAGE_KEY = "ordis-rivens";

function loadRivens(): OwnedRiven[] {
    try {
        const saved = localStorage.getItem(RIVEN_STORAGE_KEY);
        return saved ? JSON.parse(saved) : [];
    } catch {
        return [];
    }
}

function saveRivens(rivens: OwnedRiven[]) {
    localStorage.setItem(RIVEN_STORAGE_KEY, JSON.stringify(rivens));
}

export function RivenView() {
    const { addToast } = useToast();
    const [weaponSearch, setWeaponSearch] = useState("");
    const [selectedWeapon, setSelectedWeapon] = useState<string | null>(null);
    const [selectedDisposition, setSelectedDisposition] = useState(3);
    const [config, setConfig] = useState<RivenConfig>({ positiveStats: 2, hasNegative: false });
    const [selectedStat, setSelectedStat] = useState<string | null>(null);

    // Inventory state
    const [ownedRivens, setOwnedRivens] = useState<OwnedRiven[]>(loadRivens);
    const [activeTab, setActiveTab] = useState<"calculator" | "inventory">("calculator");
    const [showAddRiven, setShowAddRiven] = useState(false);
    const [newRiven, setNewRiven] = useState<Partial<OwnedRiven>>({
        weapon: "",
        name: "",
        positives: [],
        negative: "",
        rollCount: 0,
        notes: ""
    });
    const [sortBy, setSortBy] = useState<"weapon" | "rolls" | "date">("date");

    // Save rivens to localStorage
    const updateRivens = useCallback((rivens: OwnedRiven[]) => {
        setOwnedRivens(rivens);
        saveRivens(rivens);
    }, []);

    // Add new riven
    const addRiven = useCallback(() => {
        if (!newRiven.weapon || !newRiven.name) {
            addToast("Please enter weapon and riven name", "error");
            return;
        }
        const riven: OwnedRiven = {
            id: Date.now().toString(),
            weapon: newRiven.weapon,
            name: newRiven.name,
            positives: newRiven.positives || [],
            negative: newRiven.negative,
            rollCount: newRiven.rollCount || 0,
            addedAt: Date.now(),
            notes: newRiven.notes
        };
        updateRivens([...ownedRivens, riven]);
        setNewRiven({ weapon: "", name: "", positives: [], negative: "", rollCount: 0, notes: "" });
        setShowAddRiven(false);
        addToast(`Added ${riven.name}`, "success");
    }, [newRiven, ownedRivens, updateRivens, addToast]);

    // Remove riven
    const removeRiven = useCallback((id: string) => {
        const riven = ownedRivens.find(r => r.id === id);
        updateRivens(ownedRivens.filter(r => r.id !== id));
        if (riven) addToast(`Removed ${riven.name}`, "info");
    }, [ownedRivens, updateRivens, addToast]);

    // Increment roll count
    const incrementRoll = useCallback((id: string) => {
        updateRivens(ownedRivens.map(r =>
            r.id === id ? { ...r, rollCount: r.rollCount + 1 } : r
        ));
    }, [ownedRivens, updateRivens]);

    // Filter weapons
    const filteredWeapons = useMemo(() => {
        if (!weaponSearch.trim()) return [];
        const search = weaponSearch.toLowerCase();
        return Object.entries(SAMPLE_WEAPONS)
            .filter(([name]) => name.toLowerCase().includes(search))
            .slice(0, 5);
    }, [weaponSearch]);

    // Select weapon
    const selectWeapon = useCallback((name: string) => {
        setSelectedWeapon(name);
        setSelectedDisposition(SAMPLE_WEAPONS[name]?.disposition || 3);
        setWeaponSearch("");
    }, []);

    // Calculate stat range
    const calculateRange = useCallback((baseStat: number) => {
        const dispMult = DISPOSITION_MULTIPLIERS[selectedDisposition as keyof typeof DISPOSITION_MULTIPLIERS];
        const configMult = getStatModifier(config);

        return {
            min: Math.round(baseStat * dispMult.min * configMult * 10) / 10,
            max: Math.round(baseStat * dispMult.max * configMult * 10) / 10,
        };
    }, [selectedDisposition, config]);

    // Get disposition display
    const dispositionDisplay = useMemo(() => {
        const filled = selectedDisposition;
        return "●".repeat(filled) + "○".repeat(5 - filled);
    }, [selectedDisposition]);

    // Export rivens
    const exportRivens = useCallback(() => {
        const data = {
            rivens: ownedRivens,
            exportedAt: new Date().toISOString(),
            version: 1,
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `ordis-rivens-${new Date().toISOString().split("T")[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        addToast("Rivens exported!", "success");
    }, [ownedRivens, addToast]);

    // Import rivens
    const importRivens = useCallback(() => {
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
                    if (data.rivens && Array.isArray(data.rivens)) {
                        updateRivens(data.rivens);
                        addToast(`Imported ${data.rivens.length} rivens!`, "success");
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
    }, [updateRivens, addToast]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <section className="bg-gradient-to-r from-purple-900/30 to-slate-900/50 rounded-xl border border-purple-700/30 p-6">
                <h2 className="text-2xl font-bold text-purple-400 flex items-center gap-3 mb-4">
                    <Sparkles size={28} /> Riven Calculator
                </h2>
                <p className="text-slate-400 text-sm">
                    Calculate stat ranges based on weapon disposition and riven configuration.
                </p>
            </section>

            {/* Tab Navigation - moved up */}
            <div className="flex gap-2">
                <button
                    onClick={() => setActiveTab("calculator")}
                    className={`flex-1 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${activeTab === "calculator" ? "bg-purple-600 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700"}`}
                >
                    <Sparkles size={16} /> Stat Calculator
                </button>
                <button
                    onClick={() => setActiveTab("inventory")}
                    className={`flex-1 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${activeTab === "inventory" ? "bg-purple-600 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700"}`}
                >
                    <Package size={16} /> My Rivens ({ownedRivens.length})
                </button>
            </div>

            {/* Calculator Tab Content */}
            {activeTab === "calculator" && (
                <>
                    {/* Weapon Search */}
                    <div className="bg-slate-900/50 rounded-xl border border-slate-700/30 p-4">
                        <h3 className="font-bold text-slate-300 mb-3 flex items-center gap-2">
                            <Crosshair size={16} /> Select Weapon
                        </h3>

                        <div className="relative">
                            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                            <input
                                type="text"
                                value={weaponSearch}
                                onChange={e => setWeaponSearch(e.target.value)}
                                placeholder="Search weapon..."
                                className="w-full bg-slate-800 border border-slate-600 rounded-lg pl-10 pr-4 py-2"
                            />

                            {filteredWeapons.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-600 rounded-lg overflow-hidden z-10">
                                    {filteredWeapons.map(([name, data]) => (
                                        <button
                                            key={name}
                                            onClick={() => selectWeapon(name)}
                                            className="w-full px-4 py-2 text-left hover:bg-slate-700 transition-colors flex items-center justify-between"
                                        >
                                            <span className="text-slate-200">{name}</span>
                                            <span className="text-xs text-slate-500">
                                                {"●".repeat(data.disposition)}{"○".repeat(5 - data.disposition)} • {data.type}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {selectedWeapon && (
                            <div className="mt-3 p-3 bg-purple-900/20 border border-purple-700/30 rounded-lg flex items-center justify-between">
                                <div>
                                    <div className="font-bold text-purple-300">{selectedWeapon}</div>
                                    <div className="text-xs text-slate-400">{SAMPLE_WEAPONS[selectedWeapon]?.type}</div>
                                </div>
                                <div className="text-right">
                                    <div className="font-mono text-lg text-yellow-400">{dispositionDisplay}</div>
                                    <div className="text-xs text-slate-500">Disposition {selectedDisposition}/5</div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Manual Disposition Selector */}
                    <div className="bg-slate-900/50 rounded-xl border border-slate-700/30 p-4">
                        <h3 className="font-bold text-slate-300 mb-3 flex items-center gap-2">
                            <Target size={16} /> Disposition
                        </h3>
                        <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map(d => (
                                <button
                                    key={d}
                                    onClick={() => setSelectedDisposition(d)}
                                    className={`flex-1 py-3 rounded-lg font-medium transition-colors ${selectedDisposition === d
                                        ? "bg-purple-600 text-white"
                                        : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                                        }`}
                                >
                                    {"●".repeat(d)}{"○".repeat(5 - d)}
                                </button>
                            ))}
                        </div>
                        <p className="text-xs text-slate-500 mt-2 text-center">
                            Higher disposition = stronger stats, but often means weaker weapon
                        </p>
                    </div>

                    {/* Riven Configuration */}
                    <div className="bg-slate-900/50 rounded-xl border border-slate-700/30 p-4">
                        <h3 className="font-bold text-slate-300 mb-3 flex items-center gap-2">
                            <Info size={16} /> Riven Configuration
                        </h3>

                        <div className="grid grid-cols-2 gap-3 mb-3">
                            <div>
                                <label className="text-xs text-slate-500 mb-1 block">Positive Stats</label>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setConfig({ ...config, positiveStats: 2 })}
                                        className={`flex-1 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-1 ${config.positiveStats === 2 ? "bg-green-600 text-white" : "bg-slate-800 text-slate-400"
                                            }`}
                                    >
                                        <ArrowUp size={14} /> 2
                                    </button>
                                    <button
                                        onClick={() => setConfig({ ...config, positiveStats: 3 })}
                                        className={`flex-1 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-1 ${config.positiveStats === 3 ? "bg-green-600 text-white" : "bg-slate-800 text-slate-400"
                                            }`}
                                    >
                                        <ArrowUp size={14} /> 3
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 mb-1 block">Negative (Curse)</label>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setConfig({ ...config, hasNegative: false })}
                                        className={`flex-1 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-1 ${!config.hasNegative ? "bg-slate-600 text-white" : "bg-slate-800 text-slate-400"
                                            }`}
                                    >
                                        <Minus size={14} /> None
                                    </button>
                                    <button
                                        onClick={() => setConfig({ ...config, hasNegative: true })}
                                        className={`flex-1 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-1 ${config.hasNegative ? "bg-red-600 text-white" : "bg-slate-800 text-slate-400"
                                            }`}
                                    >
                                        <ArrowDown size={14} /> Has
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="text-center p-2 bg-slate-800/50 rounded-lg">
                            <span className="text-xs text-slate-500">Stat Modifier: </span>
                            <span className={`font-bold ${getStatModifier(config) > 1 ? "text-green-400" : "text-yellow-400"}`}>
                                ×{getStatModifier(config)}
                            </span>
                        </div>
                    </div>

                    {/* Stat Ranges */}
                    <div className="bg-slate-900/50 rounded-xl border border-slate-700/30 p-4">
                        <h3 className="font-bold text-slate-300 mb-3">Stat Ranges</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-80 overflow-y-auto">
                            {RIVEN_STATS.map(stat => {
                                const range = calculateRange(stat.base);
                                const isSelected = selectedStat === stat.name;

                                return (
                                    <button
                                        key={stat.name}
                                        onClick={() => setSelectedStat(isSelected ? null : stat.name)}
                                        className={`flex items-center justify-between p-2 rounded-lg border transition-all text-left ${isSelected
                                            ? "bg-purple-900/30 border-purple-600/50"
                                            : "bg-slate-800/50 border-slate-700/50 hover:border-slate-600"
                                            }`}
                                    >
                                        <span className="text-sm text-slate-300">{stat.name}</span>
                                        <span className="text-sm font-mono text-green-400">
                                            {range.min}{stat.suffix} - {range.max}{stat.suffix}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </>
            )}

            {/* My Rivens - Inventory Tab */}
            {activeTab === "inventory" && (
                <div className="bg-slate-900/50 rounded-xl border border-purple-700/30 p-4">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-purple-400 flex items-center gap-2">
                            <Package size={18} /> My Riven Collection
                        </h3>
                        <div className="flex items-center gap-2">
                            <button onClick={exportRivens} className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded text-slate-300" title="Export Rivens">
                                <Download size={14} />
                            </button>
                            <button onClick={importRivens} className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded text-slate-300" title="Import Rivens">
                                <Upload size={14} />
                            </button>
                            <div className="flex items-center gap-1 text-xs text-slate-400">
                                <ArrowUpDown size={14} />
                                <select
                                    value={sortBy}
                                    onChange={e => setSortBy(e.target.value as "weapon" | "rolls" | "date")}
                                    className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm"
                                >
                                    <option value="date">Date Added</option>
                                    <option value="weapon">Weapon Name</option>
                                    <option value="rolls">Roll Count</option>
                                </select>
                            </div>
                            <button
                                onClick={() => setShowAddRiven(!showAddRiven)}
                                className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-colors text-sm"
                            >
                                <Plus size={16} /> Add Riven
                            </button>
                        </div>
                    </div>

                    {/* Add Riven Form */}
                    {showAddRiven && (
                        <div className="bg-slate-800/50 rounded-lg p-4 mb-4 space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <input
                                    type="text"
                                    placeholder="Weapon name (e.g. Braton)"
                                    value={newRiven.weapon || ""}
                                    onChange={e => setNewRiven({ ...newRiven, weapon: e.target.value })}
                                    className="bg-slate-700 border border-slate-600 rounded px-3 py-2 text-sm"
                                />
                                <input
                                    type="text"
                                    placeholder="Riven name (e.g. Critatis)"
                                    value={newRiven.name || ""}
                                    onChange={e => setNewRiven({ ...newRiven, name: e.target.value })}
                                    className="bg-slate-700 border border-slate-600 rounded px-3 py-2 text-sm"
                                />
                            </div>
                            <input
                                type="text"
                                placeholder="Notes (stats, etc.)"
                                value={newRiven.notes || ""}
                                onChange={e => setNewRiven({ ...newRiven, notes: e.target.value })}
                                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-sm"
                            />
                            <div className="flex gap-2">
                                <button onClick={addRiven} className="flex-1 py-2 bg-purple-600 text-white rounded hover:bg-purple-500 text-sm">Save Riven</button>
                                <button onClick={() => setShowAddRiven(false)} className="px-4 py-2 bg-slate-700 text-slate-300 rounded hover:bg-slate-600 text-sm">Cancel</button>
                            </div>
                        </div>
                    )}

                    {/* Riven List */}
                    {ownedRivens.length === 0 ? (
                        <p className="text-center text-slate-500 py-8">No rivens tracked yet. Add your first riven above!</p>
                    ) : (
                        <div className="space-y-2">
                            {[...ownedRivens].sort((a, b) => {
                                if (sortBy === "weapon") return a.weapon.localeCompare(b.weapon);
                                if (sortBy === "rolls") return b.rollCount - a.rollCount;
                                return b.addedAt - a.addedAt;
                            }).map(riven => (
                                <div key={riven.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                                    <div className="flex-1">
                                        <div className="font-medium text-slate-200">{riven.weapon} {riven.name}</div>
                                        <div className="text-xs text-slate-500">{riven.notes || "No notes"}</div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="text-center">
                                            <div className="text-sm font-bold text-yellow-400">{riven.rollCount}</div>
                                            <div className="text-xs text-slate-500">rolls</div>
                                        </div>
                                        <button
                                            onClick={() => incrementRoll(riven.id)}
                                            className="p-2 bg-slate-700 text-slate-300 rounded hover:bg-slate-600 transition-colors"
                                            title="Log a reroll"
                                            aria-label="Log a reroll"
                                        >
                                            <RotateCcw size={16} />
                                        </button>
                                        <button
                                            onClick={() => removeRiven(riven.id)}
                                            className="p-2 bg-red-900/30 text-red-400 rounded hover:bg-red-900/50 transition-colors"
                                            title="Remove riven"
                                            aria-label="Remove riven"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Tips */}
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-4">
                <h3 className="font-bold text-slate-300 mb-2">💡 Riven Tips</h3>
                <ul className="text-sm text-slate-400 space-y-1">
                    <li>• 3 positives + 1 negative gives the highest stat values</li>
                    <li>• "Harmless" negatives: Zoom, Damage to faction, Recoil</li>
                    <li>• Kuva rerolls cost increases: 900 → 1400 → 1900... (caps at 3500)</li>
                    <li>• Use <strong>Semlar</strong> or <strong>riven.market</strong> for pricing</li>
                </ul>
            </div>
        </div>
    );
}
