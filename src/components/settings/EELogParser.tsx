/**
 * EE.log Parser Component
 * Upload and parse Warframe game log for trades and rewards
 */
import { useState, useCallback } from "react";
import {
    FileText,
    Upload,
    RefreshCw,
    AlertCircle,
    Check,
    ArrowUpDown,
    Gem,
    Coins,
    Trash2,
} from "lucide-react";
import { useToast } from "../ui";
import { parseEELog, type EELogParseResult } from "../../utils/eelogParser";

export function EELogParser() {
    const { addToast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [results, setResults] = useState<EELogParseResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsLoading(true);
        setError(null);
        setResults(null);

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                const parsed = parseEELog(content);
                setResults(parsed);
                addToast(`Parsed ${parsed.linesProcessed.toLocaleString()} lines`, "success");
            } catch (err) {
                const message = err instanceof Error ? err.message : "Failed to parse file";
                setError(message);
                addToast(message, "error");
            } finally {
                setIsLoading(false);
            }
        };
        reader.onerror = () => {
            setError("Failed to read file");
            setIsLoading(false);
        };
        reader.readAsText(file);

        // Reset file input
        event.target.value = "";
    }, [addToast]);

    const clearResults = useCallback(() => {
        setResults(null);
        setError(null);
    }, []);

    return (
        <div className="bg-slate-900/50 rounded-xl border border-blue-900/30 p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-blue-400 flex items-center gap-2">
                    <FileText size={20} /> EE.log Parser
                </h3>
                {results && (
                    <button
                        onClick={clearResults}
                        className="text-slate-400 hover:text-slate-200 p-1"
                        title="Clear results"
                    >
                        <Trash2 size={18} />
                    </button>
                )}
            </div>

            <p className="text-sm text-slate-400 mb-4">
                Upload your Warframe EE.log file to extract trade history, mission rewards, and relic results.
            </p>

            {/* File Location Info */}
            <div className="bg-slate-800/50 rounded-lg p-3 mb-4 text-sm">
                <p className="text-slate-300 font-medium mb-1">File Location:</p>
                <code className="text-cyan-400 text-xs block bg-slate-900 rounded px-2 py-1">
                    %localappdata%\Warframe\EE.log
                </code>
                <p className="text-xs text-slate-500 mt-2">
                    Note: The log is overwritten each game session. Copy it before restarting the game.
                </p>
            </div>

            {!results ? (
                /* Upload Section */
                <div className="space-y-3">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-600 rounded-lg cursor-pointer hover:border-blue-500 transition-colors bg-slate-800/30">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            {isLoading ? (
                                <RefreshCw size={32} className="text-blue-400 animate-spin mb-2" />
                            ) : (
                                <Upload size={32} className="text-slate-500 mb-2" />
                            )}
                            <p className="text-sm text-slate-400">
                                {isLoading ? "Parsing..." : "Click to upload EE.log"}
                            </p>
                        </div>
                        <input
                            type="file"
                            accept=".log,.txt"
                            onChange={handleFileUpload}
                            disabled={isLoading}
                            className="hidden"
                        />
                    </label>

                    {error && (
                        <p className="text-red-400 text-sm flex items-center gap-1">
                            <AlertCircle size={14} /> {error}
                        </p>
                    )}
                </div>
            ) : (
                /* Results Section */
                <div className="space-y-4">
                    {/* Summary */}
                    <div className="bg-slate-800/50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <Check size={18} className="text-green-400" />
                            <span className="text-slate-200 font-medium">
                                Processed {results.linesProcessed.toLocaleString()} lines
                            </span>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            <div className="text-center bg-slate-700/50 rounded-lg p-2">
                                <ArrowUpDown size={18} className="mx-auto text-blue-400 mb-1" />
                                <div className="text-xl font-bold text-slate-200">{results.trades.length}</div>
                                <div className="text-xs text-slate-400">Trades</div>
                            </div>
                            <div className="text-center bg-slate-700/50 rounded-lg p-2">
                                <Gem size={18} className="mx-auto text-purple-400 mb-1" />
                                <div className="text-xl font-bold text-slate-200">{results.relicResults.length}</div>
                                <div className="text-xs text-slate-400">Relics</div>
                            </div>
                            <div className="text-center bg-slate-700/50 rounded-lg p-2">
                                <Coins size={18} className="mx-auto text-amber-400 mb-1" />
                                <div className="text-xl font-bold text-slate-200">{results.missionRewards.length}</div>
                                <div className="text-xs text-slate-400">Missions</div>
                            </div>
                        </div>
                    </div>

                    {/* Trades */}
                    {results.trades.length > 0 && (
                        <div className="space-y-2">
                            <h4 className="text-sm font-medium text-blue-400 flex items-center gap-2">
                                <ArrowUpDown size={14} /> Trades ({results.trades.length})
                            </h4>
                            <div className="max-h-48 overflow-y-auto space-y-2">
                                {results.trades.map((trade, i) => (
                                    <div key={i} className="bg-slate-800/50 rounded-lg p-3 text-sm">
                                        {trade.received.length > 0 && (
                                            <div className="flex items-center gap-2 text-green-400">
                                                <span className="text-slate-400">Received:</span>
                                                {trade.received.map((r, j) => (
                                                    <span key={j} className="bg-green-900/30 px-2 py-0.5 rounded text-xs">
                                                        {r.item}{r.quantity > 1 && ` x${r.quantity}`}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                        {trade.given.length > 0 && (
                                            <div className="flex items-center gap-2 text-red-400 mt-1">
                                                <span className="text-slate-400">Given:</span>
                                                {trade.given.map((g, j) => (
                                                    <span key={j} className="bg-red-900/30 px-2 py-0.5 rounded text-xs">
                                                        {g.item}{g.quantity > 1 && ` x${g.quantity}`}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                        {trade.platinum !== undefined && trade.platinum !== 0 && (
                                            <div className={`mt-1 text-xs ${trade.platinum > 0 ? "text-cyan-400" : "text-orange-400"}`}>
                                                Platinum: {trade.platinum > 0 ? "+" : ""}{trade.platinum}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Relic Results */}
                    {results.relicResults.length > 0 && (
                        <div className="space-y-2">
                            <h4 className="text-sm font-medium text-purple-400 flex items-center gap-2">
                                <Gem size={14} /> Relic Results ({results.relicResults.length})
                            </h4>
                            <div className="max-h-32 overflow-y-auto space-y-1">
                                {results.relicResults.map((relic, i) => (
                                    <div key={i} className="flex items-center justify-between bg-slate-800/50 rounded px-3 py-2 text-sm">
                                        <span className="text-slate-300">{relic.relic}</span>
                                        <span className="text-purple-400">{relic.reward}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Warnings */}
                    {results.warnings.length > 0 && (
                        <div className="text-xs text-yellow-400/70">
                            <AlertCircle size={12} className="inline mr-1" />
                            {results.warnings.length} parsing warnings
                        </div>
                    )}

                    {/* Empty State */}
                    {results.trades.length === 0 && results.relicResults.length === 0 && results.missionRewards.length === 0 && (
                        <div className="text-center py-4 text-slate-500">
                            <AlertCircle size={24} className="mx-auto mb-2" />
                            <p>No trades, relics, or mission data found in this log.</p>
                            <p className="text-xs mt-1">Try a different log file or play some missions first.</p>
                        </div>
                    )}

                    {/* Upload Another */}
                    <label className="flex items-center justify-center gap-2 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg cursor-pointer transition-colors">
                        <Upload size={16} />
                        <span>Upload Another</span>
                        <input
                            type="file"
                            accept=".log,.txt"
                            onChange={handleFileUpload}
                            className="hidden"
                        />
                    </label>
                </div>
            )}
        </div>
    );
}
