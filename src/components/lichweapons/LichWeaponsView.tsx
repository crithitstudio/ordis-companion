/**
 * Kuva/Tenet/Coda Weapon Tracker
 * Track Lich, Sister, and Technocyte Coda weapons
 */
import { useState, useMemo, useCallback } from "react";
import { Sword, Crosshair, Check, Target, Flame, Droplets, Zap, Wind, Skull, Sparkles, Bug, Calculator } from "lucide-react";

// Element types for Kuva/Tenet weapons
const ELEMENTS = [
    { name: "Impact", icon: Target, color: "text-slate-300" },
    { name: "Heat", icon: Flame, color: "text-orange-400" },
    { name: "Cold", icon: Droplets, color: "text-cyan-400" },
    { name: "Electricity", icon: Zap, color: "text-yellow-400" },
    { name: "Toxin", icon: Skull, color: "text-green-400" },
    { name: "Magnetic", icon: Sparkles, color: "text-purple-400" },
    { name: "Radiation", icon: Wind, color: "text-amber-300" },
] as const;

// Kuva weapons (from Kuva Liches)
const KUVA_WEAPONS = [
    "Kuva Brakk", "Kuva Chakkhurr", "Kuva Drakgoon", "Kuva Dubba Stubba",
    "Kuva Grattler", "Kuva Hek", "Kuva Hind", "Kuva Karak", "Kuva Kohm",
    "Kuva Kraken", "Kuva Nukor", "Kuva Ogris", "Kuva Quartakk", "Kuva Seer",
    "Kuva Shildeg", "Kuva Sobek", "Kuva Tonkor", "Kuva Twin Stubbas", "Kuva Zarr",
] as const;

// Tenet weapons (from Sisters of Parvos)
const TENET_WEAPONS = [
    "Tenet Arca Plasmor", "Tenet Cycron", "Tenet Detron", "Tenet Diplos",
    "Tenet Envoy", "Tenet Exec", "Tenet Ferrox", "Tenet Flux Rifle",
    "Tenet Grigori", "Tenet Livia", "Tenet Plinx", "Tenet Spirex", "Tenet Tetra",
] as const;

// Coda weapons (from Technocyte Codas - purchased with Live Heartcells)
// These use Forma-based progression (5 Forma = 80 capacity) instead of valence fusion
const CODA_WEAPONS = [
    "Coda Hema", "Coda Sporothrix", "Coda Synapse", "Coda Bassocyst",
    "Coda Catabolyst", "Coda Pox", "Coda Tysis", "Dual Coda Torxica",
    "Coda Caustacyst", "Coda Hirudo", "Coda Mire", "Coda Motovore", "Coda Pathocyst",
] as const;

interface OwnedWeapon {
    name: string;
    element: string;
    bonus: number;
    valenceCount: number;
    maxBonus: boolean;
}

interface OwnedCodaWeapon {
    name: string;
    formaCount: number; // 0-5
    maxForma: boolean;
}

interface WeaponsState {
    kuva: OwnedWeapon[];
    tenet: OwnedWeapon[];
    coda: OwnedCodaWeapon[];
}

const STORAGE_KEY = "ordis-lich-weapons";

function loadState(): WeaponsState {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        const parsed = saved ? JSON.parse(saved) : {};
        return {
            kuva: parsed.kuva || [],
            tenet: parsed.tenet || [],
            coda: parsed.coda || [],
        };
    } catch {
        return { kuva: [], tenet: [], coda: [] };
    }
}

function saveState(state: WeaponsState) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

type TabType = "kuva" | "tenet" | "coda";

export function LichWeaponsView() {
    const [state, setState] = useState<WeaponsState>(loadState);
    const [activeTab, setActiveTab] = useState<TabType>("kuva");
    const [addingWeapon, setAddingWeapon] = useState<string | null>(null);
    const [newElement, setNewElement] = useState("Heat");
    const [newBonus, setNewBonus] = useState(25);
    // Valence fusion calculator
    const [fusionHigh, setFusionHigh] = useState(40);
    const [fusionLow, setFusionLow] = useState(30);

    const updateState = useCallback((newState: WeaponsState) => {
        setState(newState);
        saveState(newState);
    }, []);

    // Add Kuva/Tenet weapon
    const addWeapon = useCallback((weaponName: string, type: "kuva" | "tenet") => {
        const weapon: OwnedWeapon = {
            name: weaponName,
            element: newElement,
            bonus: newBonus,
            valenceCount: 0,
            maxBonus: newBonus >= 60,
        };
        const newState = { ...state, [type]: [...state[type], weapon] };
        updateState(newState);
        setAddingWeapon(null);
        setNewBonus(25);
    }, [state, newElement, newBonus, updateState]);

    // Add Coda weapon
    const addCodaWeapon = useCallback((weaponName: string) => {
        const weapon: OwnedCodaWeapon = {
            name: weaponName,
            formaCount: 0,
            maxForma: false,
        };
        const newState = { ...state, coda: [...state.coda, weapon] };
        updateState(newState);
        setAddingWeapon(null);
    }, [state, updateState]);

    // Remove weapon
    const removeWeapon = useCallback((weaponName: string, type: TabType) => {
        const newState = { ...state };
        if (type === "coda") {
            newState.coda = newState.coda.filter(w => w.name !== weaponName);
        } else {
            newState[type] = newState[type].filter(w => w.name !== weaponName);
        }
        updateState(newState);
    }, [state, updateState]);

    // Update Kuva/Tenet bonus
    const updateBonus = useCallback((weaponName: string, type: "kuva" | "tenet", newBonusValue: number) => {
        const newState = { ...state };
        newState[type] = newState[type].map(w =>
            w.name === weaponName
                ? { ...w, bonus: newBonusValue, valenceCount: w.valenceCount + 1, maxBonus: newBonusValue >= 60 }
                : w
        );
        updateState(newState);
    }, [state, updateState]);

    // Update Coda forma count
    const updateForma = useCallback((weaponName: string, delta: number) => {
        const newState = { ...state };
        newState.coda = newState.coda.map(w =>
            w.name === weaponName
                ? { ...w, formaCount: Math.max(0, Math.min(5, w.formaCount + delta)), maxForma: w.formaCount + delta >= 5 }
                : w
        );
        updateState(newState);
    }, [state, updateState]);

    // Stats
    const stats = useMemo(() => {
        const kuvaOwned = state.kuva.length;
        const tenetOwned = state.tenet.length;
        const codaOwned = state.coda.length;
        const kuvaMaxed = state.kuva.filter(w => w.maxBonus).length;
        const tenetMaxed = state.tenet.filter(w => w.maxBonus).length;
        const codaMaxed = state.coda.filter(w => w.maxForma).length;
        return {
            kuvaOwned, kuvaTotal: KUVA_WEAPONS.length,
            tenetOwned, tenetTotal: TENET_WEAPONS.length,
            codaOwned, codaTotal: CODA_WEAPONS.length,
            kuvaMaxed, tenetMaxed, codaMaxed,
            totalOwned: kuvaOwned + tenetOwned + codaOwned,
            totalWeapons: KUVA_WEAPONS.length + TENET_WEAPONS.length + CODA_WEAPONS.length,
        };
    }, [state]);

    // Get weapons list based on active tab
    const weapons = activeTab === "kuva" ? KUVA_WEAPONS : activeTab === "tenet" ? TENET_WEAPONS : CODA_WEAPONS;
    const isCoda = activeTab === "coda";

    // Calculate valence fusion result
    const fusionResult = useMemo(() => {
        const high = Math.max(fusionHigh, fusionLow);
        const low = Math.min(fusionHigh, fusionLow);
        const result = Math.min(60, Math.round(high + (low * 0.1)));
        return result;
    }, [fusionHigh, fusionLow]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <section className="bg-gradient-to-r from-red-900/30 to-slate-900/50 rounded-xl border border-red-700/30 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-red-400 flex items-center gap-3">
                        <Sword size={28} /> Adversary Weapons
                    </h2>
                    <div className="text-right">
                        <div className="text-3xl font-bold text-red-300">
                            {stats.totalOwned}/{stats.totalWeapons}
                        </div>
                        <div className="text-slate-400 text-sm">Total Collected</div>
                    </div>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2 text-center text-sm">
                    <div className="bg-slate-800/50 rounded-lg p-2">
                        <div className="text-xs text-slate-500">Kuva</div>
                        <div className="font-bold text-red-300">{stats.kuvaOwned}/{stats.kuvaTotal}</div>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-2">
                        <div className="text-xs text-slate-500">Tenet</div>
                        <div className="font-bold text-blue-300">{stats.tenetOwned}/{stats.tenetTotal}</div>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-2">
                        <div className="text-xs text-slate-500">Coda</div>
                        <div className="font-bold text-green-300">{stats.codaOwned}/{stats.codaTotal}</div>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-2">
                        <div className="text-xs text-slate-500">Kuva 60%</div>
                        <div className="font-bold text-yellow-300">{stats.kuvaMaxed}</div>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-2">
                        <div className="text-xs text-slate-500">Tenet 60%</div>
                        <div className="font-bold text-yellow-300">{stats.tenetMaxed}</div>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-2">
                        <div className="text-xs text-slate-500">Coda 5F</div>
                        <div className="font-bold text-yellow-300">{stats.codaMaxed}</div>
                    </div>
                </div>
            </section>

            {/* Tab Navigation */}
            <div className="flex gap-2">
                <button
                    onClick={() => setActiveTab("kuva")}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-medium transition-colors text-sm ${activeTab === "kuva" ? "bg-red-600 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                        }`}
                >
                    <Skull size={16} /> Kuva ({stats.kuvaOwned})
                </button>
                <button
                    onClick={() => setActiveTab("tenet")}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-medium transition-colors text-sm ${activeTab === "tenet" ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                        }`}
                >
                    <Crosshair size={16} /> Tenet ({stats.tenetOwned})
                </button>
                <button
                    onClick={() => setActiveTab("coda")}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-medium transition-colors text-sm ${activeTab === "coda" ? "bg-green-600 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                        }`}
                >
                    <Bug size={16} /> Coda ({stats.codaOwned})
                </button>
            </div>

            {/* Weapon List */}
            <div className="bg-slate-900/50 rounded-xl border border-slate-700/30 p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {weapons.map(weapon => {
                        const ownedKT = !isCoda ? (state[activeTab as "kuva" | "tenet"]).find(w => w.name === weapon) : null;
                        const ownedCoda = isCoda ? state.coda.find(w => w.name === weapon) : null;
                        const owned = ownedKT || ownedCoda;
                        const isAdding = addingWeapon === weapon;
                        const prefix = activeTab === "kuva" ? "Kuva " : activeTab === "tenet" ? "Tenet " : "Coda ";
                        const displayName = weapon.replace(prefix, "").replace("Dual Coda ", "").replace("Dual ", "");

                        const tabColor = activeTab === "kuva" ? "red" : activeTab === "tenet" ? "blue" : "green";

                        return (
                            <div
                                key={weapon}
                                className={`rounded-lg border p-3 transition-all ${owned
                                    ? `bg-${tabColor}-900/20 border-${tabColor}-600/50`
                                    : "bg-slate-800/30 border-slate-700/50"
                                    }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        {owned ? (
                                            <Check size={16} className={`text-${tabColor}-400`} />
                                        ) : (
                                            <div className="w-4 h-4 rounded border border-slate-600" />
                                        )}
                                        <span className={`font-medium ${owned ? "text-slate-200" : "text-slate-400"}`}>
                                            {displayName}
                                        </span>
                                    </div>

                                    {ownedKT && (
                                        <div className="flex items-center gap-2">
                                            <span className={`text-xs px-2 py-0.5 rounded ${ownedKT.maxBonus ? "bg-yellow-600/30 text-yellow-300" : "bg-slate-700 text-slate-300"}`}>
                                                {ownedKT.bonus}%
                                            </span>
                                            <span className="text-xs text-slate-500">{ownedKT.element}</span>
                                        </div>
                                    )}

                                    {ownedCoda && (
                                        <div className="flex items-center gap-1">
                                            {[1, 2, 3, 4, 5].map(i => (
                                                <div key={i} className={`w-2 h-4 rounded-sm ${i <= ownedCoda.formaCount ? "bg-yellow-400" : "bg-slate-700"}`} />
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Add/Edit controls */}
                                {isAdding ? (
                                    isCoda ? (
                                        <div className="mt-3 flex gap-2">
                                            <button onClick={() => addCodaWeapon(weapon)} className="flex-1 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-500">Add</button>
                                            <button onClick={() => setAddingWeapon(null)} className="px-3 py-1 bg-slate-700 text-slate-300 text-sm rounded hover:bg-slate-600">Cancel</button>
                                        </div>
                                    ) : (
                                        <div className="mt-3 space-y-2">
                                            <div className="flex gap-2">
                                                <select value={newElement} onChange={e => setNewElement(e.target.value)} className="flex-1 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm">
                                                    {ELEMENTS.map(el => <option key={el.name} value={el.name}>{el.name}</option>)}
                                                </select>
                                                <input type="number" value={newBonus} onChange={e => setNewBonus(Math.min(60, Math.max(25, parseInt(e.target.value) || 25)))} min={25} max={60} className="w-16 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm text-center" />
                                                <span className="text-slate-400 self-center">%</span>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => addWeapon(weapon, activeTab as "kuva" | "tenet")} className="flex-1 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-500">Add</button>
                                                <button onClick={() => setAddingWeapon(null)} className="px-3 py-1 bg-slate-700 text-slate-300 text-sm rounded hover:bg-slate-600">Cancel</button>
                                            </div>
                                        </div>
                                    )
                                ) : owned ? (
                                    <div className="mt-2 flex gap-2">
                                        {ownedKT && !ownedKT.maxBonus && (
                                            <button onClick={() => updateBonus(weapon, activeTab as "kuva" | "tenet", Math.min(60, ownedKT.bonus + 5))} className="flex-1 py-1 bg-slate-700 text-slate-300 text-xs rounded hover:bg-slate-600">Valence +5%</button>
                                        )}
                                        {ownedCoda && !ownedCoda.maxForma && (
                                            <button onClick={() => updateForma(weapon, 1)} className="flex-1 py-1 bg-slate-700 text-slate-300 text-xs rounded hover:bg-slate-600">+1 Forma</button>
                                        )}
                                        <button onClick={() => removeWeapon(weapon, activeTab)} className="px-2 py-1 bg-red-900/50 text-red-300 text-xs rounded hover:bg-red-900">Remove</button>
                                    </div>
                                ) : (
                                    <button onClick={() => setAddingWeapon(weapon)} className="mt-2 w-full py-1 bg-slate-700 text-slate-300 text-sm rounded hover:bg-slate-600">+ Add</button>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Valence Fusion Calculator - Only for Kuva/Tenet */}
            {!isCoda && (
                <div className="bg-slate-900/50 rounded-xl border border-yellow-700/30 p-4">
                    <h3 className="font-bold text-yellow-400 mb-3 flex items-center gap-2">
                        <Calculator size={18} /> Valence Fusion Calculator
                    </h3>
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2">
                            <label className="text-sm text-slate-400">Higher:</label>
                            <input
                                type="number"
                                value={fusionHigh}
                                onChange={e => setFusionHigh(Math.min(60, Math.max(25, parseInt(e.target.value) || 25)))}
                                min={25}
                                max={60}
                                className="w-16 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm text-center"
                            />
                            <span className="text-slate-400">%</span>
                        </div>
                        <span className="text-slate-500">+</span>
                        <div className="flex items-center gap-2">
                            <label className="text-sm text-slate-400">Lower:</label>
                            <input
                                type="number"
                                value={fusionLow}
                                onChange={e => setFusionLow(Math.min(60, Math.max(25, parseInt(e.target.value) || 25)))}
                                min={25}
                                max={60}
                                className="w-16 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm text-center"
                            />
                            <span className="text-slate-400">%</span>
                        </div>
                        <span className="text-slate-500">=</span>
                        <div className={`text-2xl font-bold px-4 py-1 rounded ${fusionResult >= 60 ? "text-yellow-300 bg-yellow-900/30" : "text-cyan-400 bg-slate-700"}`}>
                            {fusionResult}%
                        </div>
                        {fusionResult >= 60 && <span className="text-green-400 text-sm">✓ MAX</span>}
                    </div>
                    <p className="text-xs text-slate-500 mt-2">Formula: Higher + (Lower × 10%), capped at 60%</p>
                </div>
            )}

            {/* Tips */}
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-4">
                <h3 className="font-bold text-slate-300 mb-2">💡 Tips</h3>
                <ul className="text-sm text-slate-400 space-y-1">
                    {activeTab === "coda" ? (
                        <>
                            <li>• Coda weapons are purchased from Eleanor using <strong>Live Heartcells</strong></li>
                            <li>• Use 5 Forma to reach 80 mod capacity (like Prime weapons)</li>
                            <li>• <strong>Elemental Vice</strong> lets you change element at max level</li>
                            <li>• Farm Heartcells by defeating Technocyte Codas in Hollvania</li>
                        </>
                    ) : (
                        <>
                            <li>• Base bonus ranges from 25-60%, higher is rarer</li>
                            <li>• <strong>Heat</strong> and <strong>Toxin</strong> are generally best</li>
                            <li>• Farm Requiem mods from Kuva Siphon/Flood missions</li>
                        </>
                    )}
                </ul>
            </div>
        </div>
    );
}
