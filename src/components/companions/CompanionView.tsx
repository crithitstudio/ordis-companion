/**
 * Companion Manager
 * Track companions, pets, and sentinels
 */
import { useState, useMemo, useCallback } from "react";
import {
    Heart,
    Plus,
    Trash2,
    Star,
    Shield,
    Zap,
    Eye
} from "lucide-react";
import { useToast, EmptyState } from "../ui";

interface Companion {
    id: string;
    name: string;
    type: "sentinel" | "kubrow" | "kavat" | "moa" | "hound" | "vulpaphyla" | "predasite";
    species: string;
    forma: number;
    favorite: boolean;
    active: boolean;
    notes?: string;
}

const STORAGE_KEY = "ordis-companions";

const COMPANION_TYPES = [
    { id: "sentinel", label: "Sentinel", species: ["Carrier", "Helios", "Shade", "Dethcube", "Wyrm", "Djinn", "Taxon", "Nautilus", "Verglas"] },
    { id: "kubrow", label: "Kubrow", species: ["Huras", "Raksa", "Sahasa", "Sunika", "Chesa", "Helminth Charger"] },
    { id: "kavat", label: "Kavat", species: ["Adarza", "Smeeta", "Vasca"] },
    { id: "moa", label: "MOA", species: ["Lambeo", "Oloro", "Para"] },
    { id: "hound", label: "Hound", species: ["Bonewidow Hound", "Voidrig Hound", "Custom Hound"] },
    { id: "vulpaphyla", label: "Vulpaphyla", species: ["Crescent", "Panzer", "Sly"] },
    { id: "predasite", label: "Predasite", species: ["Pharaoh", "Vizier", "Medjay"] },
] as const;

function loadCompanions(): Companion[] {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved) : [];
    } catch {
        return [];
    }
}

function saveCompanions(companions: Companion[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(companions));
}

export function CompanionView() {
    const [companions, setCompanions] = useState<Companion[]>(loadCompanions);
    const [showAdd, setShowAdd] = useState(false);
    const [newName, setNewName] = useState("");
    const [newType, setNewType] = useState<Companion["type"]>("sentinel");
    const [newSpecies, setNewSpecies] = useState("");
    const [filterType, setFilterType] = useState<string>("all");

    const { addToast } = useToast();

    const updateCompanions = useCallback((newCompanions: Companion[]) => {
        setCompanions(newCompanions);
        saveCompanions(newCompanions);
    }, []);

    // Add companion
    const addCompanion = useCallback(() => {
        if (!newName.trim()) {
            addToast("Please enter a name", "error");
            return;
        }

        const companion: Companion = {
            id: Date.now().toString(),
            name: newName.trim(),
            type: newType,
            species: newSpecies || "Unknown",
            forma: 0,
            favorite: false,
            active: false,
        };

        updateCompanions([companion, ...companions]);
        setNewName("");
        setNewSpecies("");
        setShowAdd(false);
        addToast("Companion added!", "success");
    }, [newName, newType, newSpecies, companions, updateCompanions, addToast]);

    // Delete companion
    const deleteCompanion = useCallback((id: string) => {
        updateCompanions(companions.filter(c => c.id !== id));
        addToast("Companion removed", "info");
    }, [companions, updateCompanions, addToast]);

    // Toggle favorite
    const toggleFavorite = useCallback((id: string) => {
        updateCompanions(companions.map(c =>
            c.id === id ? { ...c, favorite: !c.favorite } : c
        ));
    }, [companions, updateCompanions]);

    // Set active
    const setActive = useCallback((id: string) => {
        updateCompanions(companions.map(c => ({
            ...c,
            active: c.id === id,
        })));
        addToast("Active companion updated", "success");
    }, [companions, updateCompanions, addToast]);

    // Update forma
    const updateForma = useCallback((id: string, forma: number) => {
        updateCompanions(companions.map(c =>
            c.id === id ? { ...c, forma: Math.max(0, Math.min(8, forma)) } : c
        ));
    }, [companions, updateCompanions]);

    // Get species list for current type
    const speciesList = useMemo(() => {
        return COMPANION_TYPES.find(t => t.id === newType)?.species || [];
    }, [newType]);

    // Filtered companions
    const filteredCompanions = useMemo(() => {
        let result = companions;
        if (filterType !== "all") {
            result = result.filter(c => c.type === filterType);
        }
        // Sort: active first, then favorites, then alphabetically
        return result.sort((a, b) => {
            if (a.active && !b.active) return -1;
            if (!a.active && b.active) return 1;
            if (a.favorite && !b.favorite) return -1;
            if (!a.favorite && b.favorite) return 1;
            return a.name.localeCompare(b.name);
        });
    }, [companions, filterType]);

    // Stats
    const stats = useMemo(() => ({
        total: companions.length,
        sentinels: companions.filter(c => c.type === "sentinel").length,
        pets: companions.filter(c => ["kubrow", "kavat", "vulpaphyla", "predasite"].includes(c.type)).length,
        robotic: companions.filter(c => ["moa", "hound"].includes(c.type)).length,
        favorites: companions.filter(c => c.favorite).length,
    }), [companions]);

    const activeCompanion = companions.find(c => c.active);

    return (
        <div className="space-y-6">
            {/* Header */}
            <section className="bg-gradient-to-r from-pink-900/30 to-slate-900/50 rounded-xl border border-pink-700/30 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-pink-400 flex items-center gap-3">
                        <Heart size={28} /> Companion Manager
                    </h2>
                    <div className="text-right">
                        <div className="text-3xl font-bold text-pink-300">{stats.total}</div>
                        <div className="text-slate-400 text-sm">Companions</div>
                    </div>
                </div>

                {/* Active Companion */}
                {activeCompanion && (
                    <div className="bg-pink-900/20 border border-pink-700/30 rounded-lg p-3 flex items-center gap-3">
                        <Eye size={20} className="text-pink-400" />
                        <div>
                            <div className="text-sm text-slate-400">Active Companion</div>
                            <div className="font-bold text-pink-300">{activeCompanion.name} ({activeCompanion.species})</div>
                        </div>
                    </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-4 gap-3 mt-4">
                    <div className="bg-slate-800/50 rounded-lg p-2 text-center">
                        <div className="text-xs text-slate-500">Sentinels</div>
                        <div className="text-lg font-bold text-slate-200">{stats.sentinels}</div>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-2 text-center">
                        <div className="text-xs text-slate-500">Pets</div>
                        <div className="text-lg font-bold text-slate-200">{stats.pets}</div>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-2 text-center">
                        <div className="text-xs text-slate-500">Robotic</div>
                        <div className="text-lg font-bold text-slate-200">{stats.robotic}</div>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-2 text-center">
                        <div className="text-xs text-slate-500">Favorites</div>
                        <div className="text-lg font-bold text-yellow-300">{stats.favorites}</div>
                    </div>
                </div>
            </section>

            {/* Filter and Add */}
            <div className="flex gap-3">
                <select
                    value={filterType}
                    onChange={e => setFilterType(e.target.value)}
                    className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm"
                >
                    <option value="all">All Types</option>
                    {COMPANION_TYPES.map(t => (
                        <option key={t.id} value={t.id}>{t.label}</option>
                    ))}
                </select>
                <button
                    onClick={() => setShowAdd(!showAdd)}
                    className="flex-1 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-500 transition-colors flex items-center justify-center gap-2 font-medium"
                >
                    <Plus size={18} /> Add Companion
                </button>
            </div>

            {/* Add Form */}
            {showAdd && (
                <div className="bg-slate-900/50 rounded-xl border border-pink-700/30 p-4 space-y-3">
                    <input
                        type="text"
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                        placeholder="Companion name (e.g. 'Fluffy')"
                        className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2"
                    />
                    <div className="flex gap-3">
                        <select
                            value={newType}
                            onChange={e => { setNewType(e.target.value as Companion["type"]); setNewSpecies(""); }}
                            className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2"
                        >
                            {COMPANION_TYPES.map(t => (
                                <option key={t.id} value={t.id}>{t.label}</option>
                            ))}
                        </select>
                        <select
                            value={newSpecies}
                            onChange={e => setNewSpecies(e.target.value)}
                            className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2"
                        >
                            <option value="">Select species...</option>
                            {speciesList.map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={addCompanion}
                            className="flex-1 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-500 transition-colors"
                        >
                            Add Companion
                        </button>
                        <button
                            onClick={() => setShowAdd(false)}
                            className="px-4 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Companion List */}
            <div className="space-y-2">
                {filteredCompanions.length === 0 ? (
                    <div className="bg-slate-900/50 rounded-xl border border-slate-700/30">
                        <EmptyState
                            icon={Heart}
                            title="No companions yet"
                            description="Track your Sentinels, Kubrows, Kavats, and other companions. Add forma counts and set your active companion."
                            action={{
                                label: "Add First Companion",
                                onClick: () => setShowAdd(true),
                            }}
                        />
                    </div>
                ) : (
                    filteredCompanions.map(companion => (
                        <div
                            key={companion.id}
                            className={`flex items-center gap-3 p-3 rounded-lg border ${companion.active
                                ? "bg-pink-900/20 border-pink-600/50"
                                : companion.favorite
                                    ? "bg-yellow-900/10 border-yellow-700/30"
                                    : "bg-slate-900/50 border-slate-700/30"
                                }`}
                        >
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="font-medium text-slate-200">{companion.name}</span>
                                    {companion.active && <Eye size={14} className="text-pink-400" />}
                                    {companion.favorite && <Star size={14} className="text-yellow-400 fill-yellow-400" />}
                                </div>
                                <div className="text-sm text-slate-500">
                                    {companion.species} • {COMPANION_TYPES.find(t => t.id === companion.type)?.label}
                                </div>
                            </div>

                            {/* Forma counter */}
                            <div className="flex items-center gap-1">
                                <Shield size={14} className="text-yellow-400" />
                                <input
                                    type="number"
                                    value={companion.forma}
                                    onChange={e => updateForma(companion.id, parseInt(e.target.value) || 0)}
                                    className="w-12 bg-slate-800 border border-slate-600 rounded px-1 py-0.5 text-xs text-center"
                                    min={0}
                                    max={8}
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex gap-1">
                                <button
                                    onClick={() => setActive(companion.id)}
                                    className={`p-1.5 rounded transition-colors ${companion.active ? "bg-pink-600 text-white" : "bg-slate-700 text-slate-400 hover:bg-slate-600"
                                        }`}
                                    title="Set as active"
                                >
                                    <Zap size={14} />
                                </button>
                                <button
                                    onClick={() => toggleFavorite(companion.id)}
                                    className={`p-1.5 rounded transition-colors ${companion.favorite ? "bg-yellow-600/20 text-yellow-400" : "bg-slate-700 text-slate-400 hover:bg-slate-600"
                                        }`}
                                    title="Toggle favorite"
                                >
                                    <Star size={14} className={companion.favorite ? "fill-current" : ""} />
                                </button>
                                <button
                                    onClick={() => deleteCompanion(companion.id)}
                                    className="p-1.5 bg-red-900/30 text-red-400 rounded hover:bg-red-900/50 transition-colors"
                                    title="Delete"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Tips */}
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-4">
                <h3 className="font-bold text-slate-300 mb-2">💡 Companion Tips</h3>
                <ul className="text-sm text-slate-400 space-y-1">
                    <li>• Smeeta Kavat provides the best loot buffs</li>
                    <li>• Carrier has vacuum for pickup range</li>
                    <li>• Panzer Vulpaphyla is immortal (revives itself)</li>
                    <li>• Link mods share your Warframe's stats with companions</li>
                </ul>
            </div>
        </div>
    );
}
