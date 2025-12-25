/**
 * Data Management Component
 * Export and import user data (localStorage) as JSON
 */
import { useState } from "react";
import { Download, Upload, AlertTriangle, Check, X } from "lucide-react";
import { useToast } from "../ui";
import { AlecaFrameImport } from "./AlecaFrameImport";
import { EELogParser } from "./EELogParser";

// All localStorage keys used by the app
const STORAGE_KEYS = [
    "ordis-mastery",
    "ordis-mastery-nodes",
    "ordis-mastery-junctions",
    "ordis-mastery-intrinsics",
    "ordis-tracker",
    "savedRelics",
    "completedNightwaveChallenges",
    "completedSorties",
    "completedArchonHunts",
    "wantedFarmingItems",
    "steelPathWeeklyRewards",
    "steelPathIncarnons",
    "ordis-theme",
    "ordis-collapsed-sections",
] as const;

interface ExportData {
    version: number;
    exportedAt: string;
    appName: string;
    data: Record<string, unknown>;
}

interface DataManagementProps {
    onClose?: () => void;
}

export function DataManagement({ onClose }: DataManagementProps) {
    const [importing, setImporting] = useState(false);
    const [importPreview, setImportPreview] = useState<ExportData | null>(null);
    const [importError, setImportError] = useState<string | null>(null);
    const { addToast } = useToast();

    // Export all data as JSON file
    const handleExport = () => {
        const data: Record<string, unknown> = {};

        STORAGE_KEYS.forEach((key) => {
            const value = localStorage.getItem(key);
            if (value) {
                try {
                    data[key] = JSON.parse(value);
                } catch {
                    data[key] = value; // Store as string if not valid JSON
                }
            }
        });

        const exportData: ExportData = {
            version: 1,
            exportedAt: new Date().toISOString(),
            appName: "Ordis Companion",
            data,
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
            type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `ordis-companion-backup-${new Date().toISOString().split("T")[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        addToast("Data exported successfully!", "success");
    };

    // Handle file selection for import
    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setImportError(null);
        setImportPreview(null);

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                const parsed = JSON.parse(content) as ExportData;

                // Validate structure
                if (!parsed.version || !parsed.data || parsed.appName !== "Ordis Companion") {
                    setImportError("Invalid backup file format. Please select a valid Ordis Companion backup.");
                    return;
                }

                setImportPreview(parsed);
                setImporting(true);
            } catch {
                setImportError("Failed to parse the backup file. Make sure it's a valid JSON file.");
            }
        };
        reader.readAsText(file);

        // Reset file input
        event.target.value = "";
    };

    // Confirm import and apply data
    const confirmImport = () => {
        if (!importPreview) return;

        try {
            Object.entries(importPreview.data).forEach(([key, value]) => {
                if (STORAGE_KEYS.includes(key as typeof STORAGE_KEYS[number])) {
                    localStorage.setItem(key, JSON.stringify(value));
                }
            });

            addToast("Data imported! Refresh the page to see changes.", "success");

            setImporting(false);
            setImportPreview(null);

            // Suggest page refresh
            setTimeout(() => {
                if (confirm("Data imported successfully! Refresh the page now to apply changes?")) {
                    window.location.reload();
                }
            }, 500);
        } catch {
            addToast("Import failed. Please try again.", "error");
        }
    };

    const cancelImport = () => {
        setImporting(false);
        setImportPreview(null);
        setImportError(null);
    };

    // Count items in preview
    const getPreviewStats = () => {
        if (!importPreview) return null;

        const stats: Record<string, number> = {};
        Object.entries(importPreview.data).forEach(([key, value]) => {
            if (Array.isArray(value)) {
                stats[key] = value.length;
            } else if (value instanceof Set || (typeof value === "object" && value !== null)) {
                const arr = Array.isArray(value) ? value : Object.keys(value);
                stats[key] = arr.length;
            }
        });
        return stats;
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-bold text-slate-200 mb-2">Data Management</h3>
                <p className="text-sm text-slate-400">
                    Export your progress and settings to a backup file, or import from a previous backup.
                </p>
            </div>

            {/* Export Section */}
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                <div className="flex items-center justify-between">
                    <div>
                        <h4 className="font-medium text-slate-200 flex items-center gap-2">
                            <Download size={18} className="text-cyan-400" />
                            Export Data
                        </h4>
                        <p className="text-sm text-slate-400 mt-1">
                            Download all your tracked items, mastery progress, and settings.
                        </p>
                    </div>
                    <button
                        onClick={handleExport}
                        className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-500 transition-colors flex items-center gap-2"
                    >
                        <Download size={16} />
                        Export
                    </button>
                </div>
            </div>

            {/* Import Section */}
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                <div className="flex items-center justify-between">
                    <div>
                        <h4 className="font-medium text-slate-200 flex items-center gap-2">
                            <Upload size={18} className="text-green-400" />
                            Import Data
                        </h4>
                        <p className="text-sm text-slate-400 mt-1">
                            Restore from a previously exported backup file.
                        </p>
                    </div>
                    <label className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors flex items-center gap-2 cursor-pointer">
                        <Upload size={16} />
                        Select File
                        <input
                            type="file"
                            accept=".json"
                            onChange={handleFileSelect}
                            className="hidden"
                        />
                    </label>
                </div>

                {/* Import Error */}
                {importError && (
                    <div className="mt-4 p-3 bg-red-900/30 border border-red-700/50 rounded-lg flex items-start gap-2">
                        <AlertTriangle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-red-300">{importError}</p>
                    </div>
                )}

                {/* Import Preview */}
                {importing && importPreview && (
                    <div className="mt-4 p-4 bg-slate-900/50 border border-yellow-700/50 rounded-lg">
                        <h5 className="font-medium text-yellow-400 mb-2 flex items-center gap-2">
                            <AlertTriangle size={16} />
                            Confirm Import
                        </h5>
                        <p className="text-sm text-slate-300 mb-3">
                            This will <strong>replace</strong> your current data with the backup from{" "}
                            <span className="text-cyan-400">
                                {new Date(importPreview.exportedAt).toLocaleDateString()}
                            </span>
                            .
                        </p>

                        {/* Preview stats */}
                        <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
                            {Object.entries(getPreviewStats() || {}).slice(0, 6).map(([key, count]) => (
                                <div key={key} className="bg-slate-800 rounded px-2 py-1">
                                    <span className="text-slate-400">{key.replace("ordis-", "")}: </span>
                                    <span className="text-slate-200">{count} items</span>
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={confirmImport}
                                className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors flex items-center justify-center gap-2"
                            >
                                <Check size={16} />
                                Confirm Import
                            </button>
                            <button
                                onClick={cancelImport}
                                className="px-3 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors flex items-center justify-center gap-2"
                            >
                                <X size={16} />
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* AlecaFrame Integration */}
            <AlecaFrameImport />

            {/* EE.log Parser */}
            <EELogParser />

            {/* Warning */}
            <div className="p-3 bg-yellow-900/20 border border-yellow-700/30 rounded-lg">
                <p className="text-xs text-yellow-300/80">
                    <strong>Note:</strong> Importing will overwrite your current data. Consider exporting a backup first.
                </p>
            </div>

            {onClose && (
                <button
                    onClick={onClose}
                    className="w-full py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors"
                >
                    Close
                </button>
            )}
        </div>
    );
}
