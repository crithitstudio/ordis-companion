/**
 * Forma Planner
 * Track forma requirements and plan forma usage
 */
import { useState, useMemo, useCallback } from "react";
import {
    Hexagon,
    Plus,
    Trash2,
    Check,
    Package,
    Clock,
    Target
} from "lucide-react";
import { useToast } from "../ui";

interface FormaItem {
    id: string;
    name: string;
    type: "warframe" | "primary" | "secondary" | "melee" | "companion" | "archwing";
    required: number;
    applied: number;
    priority: "high" | "medium" | "low";
    notes?: string;
}

const STORAGE_KEY = "ordis-forma";

function loadItems(): FormaItem[] {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved) : [];
    } catch {
        return [];
    }
}

function saveItems(items: FormaItem[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

const ITEM_TYPES = [
    { id: "warframe", label: "Warframe" },
    { id: "primary", label: "Primary" },
    { id: "secondary", label: "Secondary" },
    { id: "melee", label: "Melee" },
    { id: "companion", label: "Companion" },
    { id: "archwing", label: "Archwing" },
] as const;

const PRIORITIES = [
    { id: "high", label: "High", color: "text-red-400 bg-red-900/30" },
    { id: "medium", label: "Medium", color: "text-yellow-400 bg-yellow-900/30" },
    { id: "low", label: "Low", color: "text-green-400 bg-green-900/30" },
] as const;

export function FormaView() {
    const [items, setItems] = useState<FormaItem[]>(loadItems);
    const [showAddItem, setShowAddItem] = useState(false);
    const [newName, setNewName] = useState("");
    const [newType, setNewType] = useState<FormaItem["type"]>("warframe");
    const [newRequired, setNewRequired] = useState(1);
    const [newPriority, setNewPriority] = useState<FormaItem["priority"]>("medium");
    const [formaStock, setFormaStock] = useState(() => {
        return parseInt(localStorage.getItem("ordis-forma-stock") || "0");
    });
    const [editingStock, setEditingStock] = useState(false);

    const { addToast } = useToast();

    const updateItems = useCallback((newItems: FormaItem[]) => {
        setItems(newItems);
        saveItems(newItems);
    }, []);

    const updateStock = useCallback((value: number) => {
        setFormaStock(value);
        localStorage.setItem("ordis-forma-stock", value.toString());
        setEditingStock(false);
    }, []);

    // Add item
    const addItem = useCallback(() => {
        if (!newName.trim()) {
            addToast("Please enter an item name", "error");
            return;
        }

        const item: FormaItem = {
            id: Date.now().toString(),
            name: newName.trim(),
            type: newType,
            required: newRequired,
            applied: 0,
            priority: newPriority,
        };

        updateItems([item, ...items]);
        setNewName("");
        setNewRequired(1);
        setShowAddItem(false);
        addToast("Item added!", "success");
    }, [newName, newType, newRequired, newPriority, items, updateItems, addToast]);

    // Remove item
    const removeItem = useCallback((id: string) => {
        updateItems(items.filter(i => i.id !== id));
        addToast("Item removed", "info");
    }, [items, updateItems, addToast]);

    // Apply forma
    const applyForma = useCallback((id: string) => {
        if (formaStock <= 0) {
            addToast("No forma in stock!", "error");
            return;
        }

        updateItems(items.map(i =>
            i.id === id ? { ...i, applied: Math.min(i.applied + 1, i.required) } : i
        ));
        updateStock(formaStock - 1);
        addToast("Forma applied!", "success");
    }, [items, formaStock, updateItems, updateStock, addToast]);

    // Stats
    const stats = useMemo(() => {
        const totalRequired = items.reduce((sum, i) => sum + i.required, 0);
        const totalApplied = items.reduce((sum, i) => sum + i.applied, 0);
        const remaining = totalRequired - totalApplied;
        const highPriority = items.filter(i => i.priority === "high" && i.applied < i.required).length;
        const complete = items.filter(i => i.applied >= i.required).length;
        const daysNeeded = Math.ceil(Math.max(0, remaining - formaStock) / 1); // 1 forma per day

        return { totalRequired, totalApplied, remaining, highPriority, complete, daysNeeded };
    }, [items, formaStock]);

    // Group by priority
    const groupedItems = useMemo(() => {
        const high = items.filter(i => i.priority === "high");
        const medium = items.filter(i => i.priority === "medium");
        const low = items.filter(i => i.priority === "low");
        return { high, medium, low };
    }, [items]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <section className="bg-gradient-to-r from-amber-900/30 to-slate-900/50 rounded-xl border border-amber-700/30 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-amber-400 flex items-center gap-3">
                        <Hexagon size={28} /> Forma Planner
                    </h2>
                    <div className="text-right">
                        {editingStock ? (
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    value={formaStock}
                                    onChange={e => setFormaStock(parseInt(e.target.value) || 0)}
                                    className="w-16 bg-slate-800 border border-slate-600 rounded px-2 py-1 text-right text-xl font-bold"
                                    min={0}
                                />
                                <button
                                    onClick={() => updateStock(formaStock)}
                                    className="p-1 text-green-400 hover:text-green-300"
                                >
                                    <Check size={20} />
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setEditingStock(true)}
                                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                            >
                                <Hexagon size={24} className="text-yellow-400" />
                                <span className="text-3xl font-bold text-amber-300">{formaStock}</span>
                            </button>
                        )}
                        <div className="text-slate-400 text-sm">In Stock</div>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                        <div className="text-xs text-slate-500 uppercase">Needed</div>
                        <div className="text-lg font-bold text-red-300">{stats.remaining}</div>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                        <div className="text-xs text-slate-500 uppercase">Applied</div>
                        <div className="text-lg font-bold text-green-300">{stats.totalApplied}</div>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                        <div className="text-xs text-slate-500 uppercase">High Priority</div>
                        <div className="text-lg font-bold text-red-400">{stats.highPriority}</div>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                        <div className="text-xs text-slate-500 uppercase flex items-center justify-center gap-1">
                            <Clock size={12} /> Days to Complete
                        </div>
                        <div className="text-lg font-bold text-amber-300">{stats.daysNeeded}</div>
                    </div>
                </div>
            </section>

            {/* Add Item */}
            <button
                onClick={() => setShowAddItem(!showAddItem)}
                className="w-full py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-500 transition-colors flex items-center justify-center gap-2 font-medium"
            >
                <Plus size={18} /> Add Item
            </button>

            {showAddItem && (
                <div className="bg-slate-900/50 rounded-xl border border-amber-700/30 p-4 space-y-3">
                    <input
                        type="text"
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                        placeholder="Item name (e.g. 'Volt Prime')"
                        className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2"
                    />
                    <div className="grid grid-cols-3 gap-3">
                        <select
                            value={newType}
                            onChange={e => setNewType(e.target.value as FormaItem["type"])}
                            className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2"
                        >
                            {ITEM_TYPES.map(t => (
                                <option key={t.id} value={t.id}>{t.label}</option>
                            ))}
                        </select>
                        <div className="flex items-center gap-2">
                            <Hexagon size={16} className="text-yellow-400" />
                            <input
                                type="number"
                                value={newRequired}
                                onChange={e => setNewRequired(parseInt(e.target.value) || 1)}
                                min={1}
                                max={10}
                                className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2"
                            />
                        </div>
                        <select
                            value={newPriority}
                            onChange={e => setNewPriority(e.target.value as FormaItem["priority"])}
                            className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2"
                        >
                            {PRIORITIES.map(p => (
                                <option key={p.id} value={p.id}>{p.label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={addItem}
                            className="flex-1 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-500 transition-colors"
                        >
                            Add Item
                        </button>
                        <button
                            onClick={() => setShowAddItem(false)}
                            className="px-4 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Item Lists by Priority */}
            {["high", "medium", "low"].map(priority => {
                const priorityItems = groupedItems[priority as keyof typeof groupedItems];
                if (priorityItems.length === 0) return null;
                const priorityInfo = PRIORITIES.find(p => p.id === priority)!;

                return (
                    <div key={priority}>
                        <h3 className={`text-sm font-medium uppercase mb-2 flex items-center gap-2 ${priorityInfo.color.split(" ")[0]}`}>
                            <Target size={14} /> {priorityInfo.label} Priority
                        </h3>
                        <div className="space-y-2">
                            {priorityItems.map(item => {
                                const isComplete = item.applied >= item.required;
                                const progress = (item.applied / item.required) * 100;

                                return (
                                    <div
                                        key={item.id}
                                        className={`flex items-center gap-3 p-3 rounded-lg border ${isComplete
                                            ? "bg-green-900/20 border-green-700/30"
                                            : "bg-slate-900/50 border-slate-700/30"
                                            }`}
                                    >
                                        <Package size={18} className="text-slate-400" />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className={`font-medium ${isComplete ? "text-slate-400 line-through" : "text-slate-200"}`}>
                                                    {item.name}
                                                </span>
                                                <span className="text-xs text-slate-500">{item.type}</span>
                                            </div>
                                            <div className="h-1.5 bg-slate-700 rounded-full mt-1 overflow-hidden">
                                                <div
                                                    className={`h-full transition-all ${isComplete ? "bg-green-500" : "bg-amber-500"}`}
                                                    style={{ width: `${progress}%` }}
                                                />
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-mono text-amber-300">
                                                {item.applied}/{item.required}
                                            </span>
                                            {!isComplete && formaStock > 0 && (
                                                <button
                                                    onClick={() => applyForma(item.id)}
                                                    className="p-1.5 bg-amber-600 text-white rounded hover:bg-amber-500 transition-colors"
                                                    title="Apply Forma"
                                                    aria-label={`Apply forma to ${item.name}`}
                                                >
                                                    <Hexagon size={14} />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => removeItem(item.id)}
                                                className="p-1.5 bg-red-900/30 text-red-400 rounded hover:bg-red-900/50 transition-colors"
                                                title="Remove"
                                                aria-label={`Remove ${item.name}`}
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })}

            {items.length === 0 && (
                <div className="bg-slate-900/50 rounded-xl border border-slate-700/30 p-8 text-center text-slate-500">
                    No items added yet. Add items to track your forma requirements!
                </div>
            )}

            {/* Tips */}
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-4">
                <h3 className="font-bold text-slate-300 mb-2">💡 Forma Tips</h3>
                <ul className="text-sm text-slate-400 space-y-1">
                    <li>• Forma blueprints drop from Void relics and take 24h to build</li>
                    <li>• Each forma requires re-leveling from rank 0 to 30</li>
                    <li>• Plan ahead - some builds need 5+ forma</li>
                    <li>• Double Affinity weekends are ideal for forma-ing</li>
                </ul>
            </div>
        </div>
    );
}
