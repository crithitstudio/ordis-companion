/**
 * Build Share Modal
 * Generate shareable URLs and export builds as images
 */
import { useState, useCallback, useRef } from "react";
import {
  X,
  Link,
  Copy,
  Check,
  Image,
  FileText,
  ExternalLink,
} from "lucide-react";
import { useToast } from "../ui";
import { encodeBuild } from "../../utils/buildCodec";

interface ModSlot {
  name: string;
  rank: number;
  drain: number;
  polarity?: string;
}

interface Build {
  id: string;
  name: string;
  type:
    | "warframe"
    | "primary"
    | "secondary"
    | "melee"
    | "companion"
    | "archwing";
  itemName: string;
  mods: ModSlot[];
  capacity: number;
  maxCapacity: number;
  forma: number;
  notes: string;
  createdAt: string;
  favorite: boolean;
}

interface BuildShareModalProps {
  build: Build;
  onClose: () => void;
}

// Generate text format of build
function buildToText(build: Build): string {
  const lines: string[] = [];
  lines.push(`${build.name}`);
  lines.push(`${build.type.toUpperCase()}: ${build.itemName}`);
  lines.push("");
  lines.push("Mods:");

  build.mods.forEach((mod, i) => {
    if (mod.name) {
      lines.push(`  ${i + 1}. ${mod.name} (${mod.drain} drain)`);
    }
  });

  lines.push("");
  lines.push(`Capacity: ${build.capacity}/${build.maxCapacity}`);
  if (build.forma > 0) {
    lines.push(`Forma: ${build.forma}`);
  }
  if (build.notes) {
    lines.push("");
    lines.push(`Notes: ${build.notes}`);
  }

  lines.push("");
  lines.push("Created with ORDIS Companion");

  return lines.join("\n");
}

export function BuildShareModal({ build, onClose }: BuildShareModalProps) {
  const { addToast } = useToast();
  const buildCardRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState<"url" | "text" | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Generate shareable URL
  const shareUrl = `${window.location.origin}${window.location.pathname}?build=${encodeBuild(build)}`;

  // Copy URL to clipboard
  const copyUrl = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied("url");
      addToast("Link copied to clipboard!", "success");
      setTimeout(() => setCopied(null), 2000);
    } catch {
      addToast("Failed to copy", "error");
    }
  }, [shareUrl, addToast]);

  // Copy text format
  const copyText = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(buildToText(build));
      setCopied("text");
      addToast("Build copied as text!", "success");
      setTimeout(() => setCopied(null), 2000);
    } catch {
      addToast("Failed to copy", "error");
    }
  }, [build, addToast]);

  // Export as image using canvas
  const exportImage = useCallback(async () => {
    if (!buildCardRef.current) return;

    setIsExporting(true);
    try {
      // Dynamic import html2canvas for code splitting
      const html2canvas = (await import("html2canvas")).default;

      const canvas = await html2canvas(buildCardRef.current, {
        backgroundColor: "#0f172a", // slate-900
        scale: 2,
      });

      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `${build.name.replace(/[^a-z0-9]/gi, "_")}_build.png`;
      link.href = dataUrl;
      link.click();

      addToast("Image exported!", "success");
    } catch (error) {
      console.error("Export failed:", error);
      addToast("Failed to export image. Try installing html2canvas.", "error");
    } finally {
      setIsExporting(false);
    }
  }, [build, addToast]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700 rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-slate-900 border-b border-slate-700 p-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-emerald-400">Share Build</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Build Preview Card */}
          <div
            ref={buildCardRef}
            className="bg-slate-800 rounded-lg p-4 border border-slate-700"
          >
            <div className="text-center mb-3">
              <h3 className="text-lg font-bold text-emerald-400">
                {build.name}
              </h3>
              <p className="text-sm text-slate-400">{build.itemName}</p>
            </div>

            <div className="grid grid-cols-4 gap-2 mb-3">
              {build.mods.slice(0, 8).map((mod, i) => (
                <div
                  key={i}
                  className={`text-center p-2 rounded ${mod.name ? "bg-emerald-900/30 border border-emerald-700/30" : "bg-slate-700/30 border border-slate-600/30"}`}
                >
                  <div className="text-xs text-slate-300 truncate">
                    {mod.name || "-"}
                  </div>
                  {mod.name && (
                    <div className="text-[10px] text-slate-500">
                      {mod.drain}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-center gap-4 text-xs">
              <span
                className={
                  build.capacity > build.maxCapacity
                    ? "text-red-400"
                    : "text-slate-400"
                }
              >
                {build.capacity}/{build.maxCapacity} capacity
              </span>
              {build.forma > 0 && (
                <span className="text-amber-400">{build.forma} Forma</span>
              )}
            </div>

            <div className="text-[10px] text-slate-600 text-center mt-3">
              ORDIS Companion
            </div>
          </div>

          {/* Share Options */}
          <div className="space-y-2">
            {/* Copy Link */}
            <button
              onClick={copyUrl}
              className="w-full flex items-center justify-between gap-3 p-3 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <Link size={18} className="text-cyan-400" />
                <div>
                  <div className="text-slate-200 font-medium">Copy Link</div>
                  <div className="text-xs text-slate-500">Share via URL</div>
                </div>
              </div>
              {copied === "url" ? (
                <Check size={18} className="text-green-400" />
              ) : (
                <Copy size={18} className="text-slate-400" />
              )}
            </button>

            {/* Copy Text */}
            <button
              onClick={copyText}
              className="w-full flex items-center justify-between gap-3 p-3 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <FileText size={18} className="text-blue-400" />
                <div>
                  <div className="text-slate-200 font-medium">Copy as Text</div>
                  <div className="text-xs text-slate-500">
                    Plain text format
                  </div>
                </div>
              </div>
              {copied === "text" ? (
                <Check size={18} className="text-green-400" />
              ) : (
                <Copy size={18} className="text-slate-400" />
              )}
            </button>

            {/* Export Image */}
            <button
              onClick={exportImage}
              disabled={isExporting}
              className="w-full flex items-center justify-between gap-3 p-3 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors text-left disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                <Image size={18} className="text-purple-400" />
                <div>
                  <div className="text-slate-200 font-medium">
                    {isExporting ? "Exporting..." : "Export as Image"}
                  </div>
                  <div className="text-xs text-slate-500">Download PNG</div>
                </div>
              </div>
              <ExternalLink size={18} className="text-slate-400" />
            </button>
          </div>

          {/* URL Preview */}
          <div className="bg-slate-800/50 rounded-lg p-3">
            <p className="text-xs text-slate-500 mb-1">Share URL:</p>
            <p className="text-xs text-cyan-400 break-all font-mono">
              {shareUrl.length > 100
                ? shareUrl.substring(0, 100) + "..."
                : shareUrl}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
