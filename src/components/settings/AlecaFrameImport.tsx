/**
 * AlecaFrame Import Component
 * Import relic inventory from AlecaFrame using public sharing tokens
 */
import { useState, useCallback } from "react";
import {
    Link2,
    RefreshCw,
    Check,
    AlertCircle,
    Trash2,
    ExternalLink,
    Package,
} from "lucide-react";
import { useToast } from "../ui";
import {
    fetchRelics,
    getToken,
    saveToken,
    clearToken,
    getCachedRelics,
    cacheRelics,
} from "../../services/alecaframeApi";
import type { AlecaFrameData } from "../../services/alecaframeApi";

export function AlecaFrameImport() {
    const { addToast } = useToast();
    const [token, setToken] = useState(getToken() || "");
    const [isLoading, setIsLoading] = useState(false);
    const [relicData, setRelicData] = useState<AlecaFrameData | null>(getCachedRelics());
    const [error, setError] = useState<string | null>(null);

    const isConnected = !!relicData;

    // Fetch relics from AlecaFrame
    const handleFetch = useCallback(async () => {
        if (!token.trim()) {
            setError("Please enter a public token");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const data = await fetchRelics(token.trim());
            setRelicData(data);
            cacheRelics(data);
            saveToken(token.trim());
            addToast(`Imported ${data.totalRelics} relics!`, "success");
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to fetch data";
            setError(message);
            addToast(message, "error");
        } finally {
            setIsLoading(false);
        }
    }, [token, addToast]);

    // Disconnect and clear data
    const handleDisconnect = useCallback(() => {
        clearToken();
        setRelicData(null);
        setToken("");
        localStorage.removeItem("ordis-alecaframe-relics");
        addToast("Disconnected from AlecaFrame", "info");
    }, [addToast]);

    // Group relics by type
    const relicsByType = relicData?.relics.reduce((acc, relic) => {
        acc[relic.type] = (acc[relic.type] || 0) + relic.count;
        return acc;
    }, {} as Record<string, number>) || {};

    return (
        <div className="bg-slate-900/50 rounded-xl border border-cyan-900/30 p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-cyan-400 flex items-center gap-2">
                    <Link2 size={20} /> AlecaFrame Integration
                </h3>
                {isConnected && (
                    <span className="flex items-center gap-1 text-sm text-green-400">
                        <Check size={14} /> Connected
                    </span>
                )}
            </div>

            <p className="text-sm text-slate-400 mb-4">
                Import your relic inventory from AlecaFrame using a public sharing token.
            </p>

            {/* Instructions */}
            <div className="bg-slate-800/50 rounded-lg p-3 mb-4 text-sm">
                <p className="text-slate-300 font-medium mb-2">How to get your token:</p>
                <ol className="text-slate-400 space-y-1 list-decimal list-inside">
                    <li>Open AlecaFrame → Stats tab</li>
                    <li>Click "Create Public Link"</li>
                    <li>Enable "relics" access</li>
                    <li>Click "Generate token"</li>
                    <li>Copy and paste the token below</li>
                </ol>
                <a
                    href="https://docs.alecaframe.com/features/stats.html"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400 hover:text-cyan-300 mt-2 inline-flex items-center gap-1"
                >
                    <ExternalLink size={12} /> AlecaFrame Docs
                </a>
            </div>

            {/* Token Input */}
            {!isConnected ? (
                <div className="space-y-3">
                    <div>
                        <input
                            type="text"
                            value={token}
                            onChange={(e) => setToken(e.target.value)}
                            placeholder="Paste your public token here..."
                            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-sm focus:border-cyan-500 focus:outline-none"
                        />
                    </div>
                    {error && (
                        <p className="text-red-400 text-sm flex items-center gap-1">
                            <AlertCircle size={14} /> {error}
                        </p>
                    )}
                    <button
                        onClick={handleFetch}
                        disabled={isLoading || !token.trim()}
                        className="w-full py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <RefreshCw size={16} className="animate-spin" /> Importing...
                            </>
                        ) : (
                            <>
                                <Package size={16} /> Import Relics
                            </>
                        )}
                    </button>
                </div>
            ) : (
                /* Connected State - Show Data */
                <div className="space-y-4">
                    {/* Relic Summary */}
                    <div className="bg-slate-800/50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-slate-300 font-medium">Relic Inventory</span>
                            <span className="text-2xl font-bold text-cyan-400">
                                {relicData.totalRelics.toLocaleString()}
                            </span>
                        </div>
                        <div className="grid grid-cols-5 gap-2 text-center">
                            {["Lith", "Meso", "Neo", "Axi", "Requiem"].map((type) => (
                                <div key={type} className="bg-slate-700/50 rounded p-2">
                                    <div className="text-xs text-slate-400">{type}</div>
                                    <div className="font-bold text-slate-200">
                                        {(relicsByType[type] || 0).toLocaleString()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Last Updated */}
                    <p className="text-xs text-slate-500 text-center">
                        Last updated: {new Date(relicData.fetchedAt).toLocaleString()}
                    </p>

                    {/* Actions */}
                    <div className="flex gap-2">
                        <button
                            onClick={handleFetch}
                            disabled={isLoading}
                            className="flex-1 py-2 bg-slate-700 text-slate-200 rounded-lg hover:bg-slate-600 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
                            Refresh
                        </button>
                        <button
                            onClick={handleDisconnect}
                            className="px-4 py-2 bg-red-900/30 text-red-400 rounded-lg hover:bg-red-900/50 flex items-center gap-2"
                        >
                            <Trash2 size={16} /> Disconnect
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
