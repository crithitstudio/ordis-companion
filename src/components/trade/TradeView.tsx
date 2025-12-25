/**
 * Trade Assistant
 * Track platinum balance, trades, and generate WTB/WTS posts
 */
import { useState, useMemo, useCallback } from "react";
import {
    TrendingUp,
    Plus,
    Trash2,
    Copy,
    Check,
    ArrowUpRight,
    ArrowDownLeft,
    History,
    Wallet
} from "lucide-react";
import { PlatinumIcon } from "../ui";
import { useToast } from "../ui";

interface Trade {
    id: string;
    type: "buy" | "sell";
    item: string;
    platinum: number;
    quantity: number;
    date: string;
    notes?: string;
}

interface TradeState {
    platinumBalance: number;
    trades: Trade[];
    dailyTradeCount: number;
    lastTradeDate: string;
}

const STORAGE_KEY = "ordis-trades";
const DAILY_TRADE_LIMIT = 6; // Free-to-play limit, increases with MR

function loadState(): TradeState {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved) : {
            platinumBalance: 0,
            trades: [],
            dailyTradeCount: 0,
            lastTradeDate: new Date().toDateString(),
        };
    } catch {
        return { platinumBalance: 0, trades: [], dailyTradeCount: 0, lastTradeDate: new Date().toDateString() };
    }
}

function saveState(state: TradeState) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function TradeView() {
    const [state, setState] = useState<TradeState>(() => {
        const loaded = loadState();
        // Reset daily count if it's a new day
        if (loaded.lastTradeDate !== new Date().toDateString()) {
            return { ...loaded, dailyTradeCount: 0, lastTradeDate: new Date().toDateString() };
        }
        return loaded;
    });

    const [showAddTrade, setShowAddTrade] = useState(false);
    const [newTrade, setNewTrade] = useState<Partial<Trade>>({ type: "sell", quantity: 1, platinum: 0 });
    const [editingBalance, setEditingBalance] = useState(false);
    const [tempBalance, setTempBalance] = useState(state.platinumBalance);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [wtbItem, setWtbItem] = useState("");
    const [wtsItem, setWtsItem] = useState("");

    const { addToast } = useToast();

    const updateState = useCallback((newState: TradeState) => {
        setState(newState);
        saveState(newState);
    }, []);

    // Add a trade
    const addTrade = useCallback(() => {
        if (!newTrade.item || !newTrade.platinum) {
            addToast("Please fill in item name and platinum amount", "error");
            return;
        }

        const trade: Trade = {
            id: Date.now().toString(),
            type: newTrade.type || "sell",
            item: newTrade.item,
            platinum: newTrade.platinum,
            quantity: newTrade.quantity || 1,
            date: new Date().toISOString(),
            notes: newTrade.notes,
        };

        const platChange = trade.type === "sell" ? trade.platinum : -trade.platinum;

        updateState({
            ...state,
            platinumBalance: state.platinumBalance + platChange,
            trades: [trade, ...state.trades],
            dailyTradeCount: state.dailyTradeCount + 1,
        });

        setNewTrade({ type: "sell", quantity: 1, platinum: 0 });
        setShowAddTrade(false);
        addToast(`Trade recorded: ${trade.type === "sell" ? "+" : "-"}${trade.platinum}p`, "success");
    }, [newTrade, state, updateState, addToast]);

    // Delete a trade
    const deleteTrade = useCallback((id: string) => {
        const trade = state.trades.find(t => t.id === id);
        if (!trade) return;

        const platChange = trade.type === "sell" ? -trade.platinum : trade.platinum;

        updateState({
            ...state,
            platinumBalance: state.platinumBalance + platChange,
            trades: state.trades.filter(t => t.id !== id),
        });
        addToast("Trade deleted", "info");
    }, [state, updateState, addToast]);

    // Update balance manually
    const saveBalance = useCallback(() => {
        updateState({ ...state, platinumBalance: tempBalance });
        setEditingBalance(false);
        addToast("Balance updated", "success");
    }, [state, tempBalance, updateState, addToast]);

    // Copy WTB/WTS message
    const copyMessage = useCallback((type: "wtb" | "wts", item: string) => {
        if (!item.trim()) return;
        const prefix = type === "wtb" ? "WTB" : "WTS";
        const message = `${prefix} [${item.trim()}] PMO`;
        navigator.clipboard.writeText(message);
        setCopiedId(type);
        setTimeout(() => setCopiedId(null), 2000);
        addToast("Copied to clipboard!", "success");
    }, [addToast]);

    // Stats
    const stats = useMemo(() => {
        const today = new Date().toDateString();
        const todayTrades = state.trades.filter(t => new Date(t.date).toDateString() === today);
        const totalSold = state.trades.filter(t => t.type === "sell").reduce((sum, t) => sum + t.platinum, 0);
        const totalBought = state.trades.filter(t => t.type === "buy").reduce((sum, t) => sum + t.platinum, 0);
        const profit = totalSold - totalBought;

        return {
            todayCount: todayTrades.length,
            tradesRemaining: Math.max(0, DAILY_TRADE_LIMIT - state.dailyTradeCount),
            totalSold,
            totalBought,
            profit,
        };
    }, [state]);

    return (
        <div className="space-y-6">
            {/* Header with Balance */}
            <section className="bg-gradient-to-r from-cyan-900/30 to-slate-900/50 rounded-xl border border-cyan-700/30 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-cyan-400 flex items-center gap-3">
                        <Wallet size={28} /> Trade Assistant
                    </h2>
                    <div className="text-right">
                        {editingBalance ? (
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    value={tempBalance}
                                    onChange={e => setTempBalance(parseInt(e.target.value) || 0)}
                                    className="w-24 bg-slate-800 border border-slate-600 rounded px-2 py-1 text-right text-xl font-bold"
                                />
                                <button onClick={saveBalance} className="p-1 text-green-400 hover:text-green-300">
                                    <Check size={20} />
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => { setTempBalance(state.platinumBalance); setEditingBalance(true); }}
                                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                            >
                                <PlatinumIcon size={28} />
                                <span className="text-3xl font-bold text-cyan-300">{state.platinumBalance.toLocaleString()}</span>
                            </button>
                        )}
                        <div className="text-slate-400 text-sm">Current Balance</div>
                    </div>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                        <div className="text-xs text-slate-500 uppercase">Today's Trades</div>
                        <div className="text-lg font-bold text-slate-200">{stats.todayCount}</div>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                        <div className="text-xs text-slate-500 uppercase">Trades Left</div>
                        <div className={`text-lg font-bold ${stats.tradesRemaining > 2 ? "text-green-400" : stats.tradesRemaining > 0 ? "text-yellow-400" : "text-red-400"}`}>
                            {stats.tradesRemaining}
                        </div>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                        <div className="text-xs text-slate-500 uppercase">Total Sold</div>
                        <div className="text-lg font-bold text-green-400 flex items-center justify-center gap-1">
                            <TrendingUp size={16} /> {stats.totalSold.toLocaleString()}
                        </div>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                        <div className="text-xs text-slate-500 uppercase">All-Time Profit</div>
                        <div className={`text-lg font-bold ${stats.profit >= 0 ? "text-green-400" : "text-red-400"}`}>
                            {stats.profit >= 0 ? "+" : ""}{stats.profit.toLocaleString()}
                        </div>
                    </div>
                </div>
            </section>

            {/* Quick WTB/WTS Generator */}
            <div className="bg-slate-900/50 rounded-xl border border-slate-700/30 p-4">
                <h3 className="font-bold text-slate-300 mb-3 flex items-center gap-2">
                    <Copy size={16} /> Quick Trade Message
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={wtbItem}
                            onChange={e => setWtbItem(e.target.value)}
                            placeholder="Item to buy..."
                            className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm"
                        />
                        <button
                            onClick={() => copyMessage("wtb", wtbItem)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors flex items-center gap-2"
                        >
                            {copiedId === "wtb" ? <Check size={16} /> : <Copy size={16} />}
                            WTB
                        </button>
                    </div>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={wtsItem}
                            onChange={e => setWtsItem(e.target.value)}
                            placeholder="Item to sell..."
                            className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm"
                        />
                        <button
                            onClick={() => copyMessage("wts", wtsItem)}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors flex items-center gap-2"
                        >
                            {copiedId === "wts" ? <Check size={16} /> : <Copy size={16} />}
                            WTS
                        </button>
                    </div>
                </div>
            </div>

            {/* Add Trade Button */}
            <button
                onClick={() => setShowAddTrade(!showAddTrade)}
                className="w-full py-3 bg-cyan-600 text-white rounded-lg hover:bg-cyan-500 transition-colors flex items-center justify-center gap-2 font-medium"
            >
                <Plus size={20} /> Record Trade
            </button>

            {/* Add Trade Form */}
            {showAddTrade && (
                <div className="bg-slate-900/50 rounded-xl border border-cyan-700/30 p-4 space-y-3">
                    <div className="flex gap-2">
                        <button
                            onClick={() => setNewTrade({ ...newTrade, type: "sell" })}
                            className={`flex-1 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${newTrade.type === "sell" ? "bg-green-600 text-white" : "bg-slate-700 text-slate-300"
                                }`}
                        >
                            <ArrowUpRight size={18} /> Sell
                        </button>
                        <button
                            onClick={() => setNewTrade({ ...newTrade, type: "buy" })}
                            className={`flex-1 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${newTrade.type === "buy" ? "bg-blue-600 text-white" : "bg-slate-700 text-slate-300"
                                }`}
                        >
                            <ArrowDownLeft size={18} /> Buy
                        </button>
                    </div>

                    <input
                        type="text"
                        value={newTrade.item || ""}
                        onChange={e => setNewTrade({ ...newTrade, item: e.target.value })}
                        placeholder="Item name (e.g. Mesa Prime Set)"
                        className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2"
                    />

                    <div className="flex gap-3">
                        <div className="flex-1">
                            <label className="text-xs text-slate-500 mb-1 block">Platinum</label>
                            <div className="flex items-center gap-2">
                                <PlatinumIcon size={16} />
                                <input
                                    type="number"
                                    value={newTrade.platinum || ""}
                                    onChange={e => setNewTrade({ ...newTrade, platinum: parseInt(e.target.value) || 0 })}
                                    placeholder="0"
                                    className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2"
                                />
                            </div>
                        </div>
                        <div className="w-24">
                            <label className="text-xs text-slate-500 mb-1 block">Qty</label>
                            <input
                                type="number"
                                value={newTrade.quantity || 1}
                                onChange={e => setNewTrade({ ...newTrade, quantity: parseInt(e.target.value) || 1 })}
                                min={1}
                                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2"
                            />
                        </div>
                    </div>

                    <input
                        type="text"
                        value={newTrade.notes || ""}
                        onChange={e => setNewTrade({ ...newTrade, notes: e.target.value })}
                        placeholder="Notes (optional)"
                        className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2"
                    />

                    <div className="flex gap-2">
                        <button
                            onClick={addTrade}
                            className="flex-1 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-500 transition-colors"
                        >
                            Save Trade
                        </button>
                        <button
                            onClick={() => setShowAddTrade(false)}
                            className="px-4 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Trade History */}
            <div className="bg-slate-900/50 rounded-xl border border-slate-700/30 p-4">
                <h3 className="font-bold text-slate-300 mb-3 flex items-center gap-2">
                    <History size={16} /> Trade History
                </h3>

                {state.trades.length === 0 ? (
                    <p className="text-slate-500 text-center py-8">No trades recorded yet</p>
                ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                        {state.trades.slice(0, 20).map(trade => (
                            <div
                                key={trade.id}
                                className={`flex items-center justify-between p-3 rounded-lg border ${trade.type === "sell"
                                    ? "bg-green-900/10 border-green-700/30"
                                    : "bg-blue-900/10 border-blue-700/30"
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    {trade.type === "sell" ? (
                                        <ArrowUpRight size={18} className="text-green-400" />
                                    ) : (
                                        <ArrowDownLeft size={18} className="text-blue-400" />
                                    )}
                                    <div>
                                        <div className="font-medium text-slate-200">
                                            {trade.item} {trade.quantity > 1 && `×${trade.quantity}`}
                                        </div>
                                        <div className="text-xs text-slate-500">
                                            {new Date(trade.date).toLocaleDateString()}
                                            {trade.notes && ` • ${trade.notes}`}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`font-bold ${trade.type === "sell" ? "text-green-400" : "text-blue-400"}`}>
                                        {trade.type === "sell" ? "+" : "-"}{trade.platinum}p
                                    </span>
                                    <button
                                        onClick={() => deleteTrade(trade.id)}
                                        className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Tips */}
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-4">
                <h3 className="font-bold text-slate-300 mb-2">💡 Trading Tips</h3>
                <ul className="text-sm text-slate-400 space-y-1">
                    <li>• Daily trade limit starts at 6, increases with Mastery Rank</li>
                    <li>• Use <strong>warframe.market</strong> to check fair prices</li>
                    <li>• Prime sets sell for more than individual parts</li>
                    <li>• Baro Ki'Teer items spike when he leaves</li>
                </ul>
            </div>
        </div>
    );
}
