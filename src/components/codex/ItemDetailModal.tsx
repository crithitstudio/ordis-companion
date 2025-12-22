import { useState } from "react";
import { X, ExternalLink, Clock, Coins } from "lucide-react";
import { itemsData, getItemImageUrl } from "../../utils/translations";
import type { SavedItem } from "../../types";

interface ItemDetailModalProps {
  itemKey: string | null;
  onClose: () => void;
}

export function ItemDetailModal({ itemKey, onClose }: ItemDetailModalProps) {
  if (!itemKey) return null;

  let itemData = itemsData[itemKey];
  if (!itemData) {
    // Try to find by name match
    const byName = Object.values(itemsData).find((i) => i.name === itemKey);
    if (!byName) return null;
    itemData = byName;
  }

  const wikiUrl = `https://wiki.warframe.com/${encodeURIComponent(itemData.name.replace(/ /g, "_"))}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-cyan-700/50 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-slate-900 border-b border-slate-700 p-4 flex items-start justify-between">
          <div className="flex items-center gap-4">
            {getItemImageUrl(itemData) && (
              <img
                src={getItemImageUrl(itemData) || ""}
                alt={itemData.name}
                className="w-16 h-16 object-contain rounded-lg bg-slate-800"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            )}
            <div>
              <h2 className="text-xl font-bold text-cyan-400">
                {itemData.name}
              </h2>
              <p className="text-sm text-slate-500">
                {itemData.type} • {itemData.category}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Description */}
          {itemData.description && (
            <div>
              <h3 className="text-sm font-bold text-slate-400 uppercase mb-2">
                Description
              </h3>
              <p className="text-slate-300 text-sm">{itemData.description}</p>
            </div>
          )}

          {/* Basic Info */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {itemData.masteryReq > 0 && (
              <div className="bg-slate-800/50 rounded-lg p-3">
                <p className="text-xs text-slate-500">Mastery</p>
                <p className="text-lg font-bold text-yellow-400">
                  {itemData.masteryReq}
                </p>
              </div>
            )}
            {itemData.tradable && (
              <div className="bg-slate-800/50 rounded-lg p-3">
                <p className="text-xs text-slate-500">Tradable</p>
                <p className="text-lg font-bold text-green-400">Yes</p>
              </div>
            )}
            {itemData.buildPrice && (
              <div className="bg-slate-800/50 rounded-lg p-3">
                <p className="text-xs text-slate-500">Build Cost</p>
                <p className="text-lg font-bold text-cyan-400">
                  {itemData.buildPrice.toLocaleString()} cr
                </p>
              </div>
            )}
            {itemData.buildTime && (
              <div className="bg-slate-800/50 rounded-lg p-3">
                <p className="text-xs text-slate-500">Build Time</p>
                <p className="text-lg font-bold text-purple-400">
                  {Math.floor(itemData.buildTime / 3600)}h
                </p>
              </div>
            )}
          </div>

          {/* Components/Crafting Requirements */}
          {itemData.components && itemData.components.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-slate-400 uppercase mb-2">
                Crafting Requirements & Costs
              </h3>
              <div className="bg-slate-800/30 rounded-lg border border-slate-700/50 p-4">
                {/* Build Price and Time Header */}
                <div className="flex gap-4 mb-4 pb-4 border-b border-slate-700/50">
                  {itemData.buildPrice && (
                    <div className="flex items-center gap-2">
                      <Coins className="w-5 h-5 text-yellow-500" />
                      <span className="text-slate-200 font-bold">
                        {itemData.buildPrice.toLocaleString()}
                      </span>
                    </div>
                  )}
                  {itemData.buildTime && (
                    <div className="flex items-center gap-2 text-slate-400">
                      <Clock size={16} />
                      <span>{Math.floor(itemData.buildTime / 3600)}h</span>
                    </div>
                  )}
                </div>

                {/* Components Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {itemData.components.map((comp, i) => {
                    let compImage = getItemImageUrl(comp);
                    if (!compImage) {
                      const matchedItem = Object.values(itemsData).find(
                        (item) => item.name === comp.name,
                      );
                      if (matchedItem) {
                        compImage = getItemImageUrl(matchedItem);
                      }
                    }

                    return (
                      <div
                        key={i}
                        className="flex items-center gap-3 p-2 bg-slate-900/40 rounded border border-slate-700/30"
                      >
                        {compImage ? (
                          <img
                            src={compImage}
                            alt={comp.name}
                            className="w-8 h-8 object-contain"
                          />
                        ) : (
                          <div className="w-8 h-8 bg-slate-800 rounded flex items-center justify-center text-xs text-slate-500">
                            ?
                          </div>
                        )}
                        <div className="flex flex-col">
                          <span className="text-slate-200 text-sm font-medium">
                            {comp.name}
                          </span>
                          <span className="text-cyan-400 text-xs font-mono">
                            x{comp.count}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Drop Locations */}
          {itemData.drops && itemData.drops.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-slate-400 uppercase mb-2">
                Drop Locations
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {itemData.drops.map((drop, i) => (
                  <div
                    key={i}
                    className="bg-slate-800/30 rounded-lg p-3 border border-slate-700/50"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300 text-sm">
                        {drop.location}
                      </span>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          drop.rarity === "Common"
                            ? "bg-slate-600 text-slate-200"
                            : drop.rarity === "Uncommon"
                              ? "bg-green-700 text-green-100"
                              : drop.rarity === "Rare"
                                ? "bg-blue-700 text-blue-100"
                                : "bg-yellow-700 text-yellow-100"
                        }`}
                      >
                        {drop.rarity || "Unknown"}
                      </span>
                    </div>
                    {drop.chance > 0 && (
                      <p className="text-xs text-slate-500 mt-1">
                        {(drop.chance * 100).toFixed(2)}% chance
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <a
              href={wikiUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-orange-600/20 text-orange-400 rounded-lg hover:bg-orange-600/30 transition-colors"
            >
              <ExternalLink size={16} /> View on Wiki
            </a>
            <AddToTrackerButton itemName={itemData.name} />
          </div>
        </div>
      </div>
    </div>
  );
}

// Add to tracker button component
function AddToTrackerButton({ itemName }: { itemName: string }) {
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    const saved = JSON.parse(
      localStorage.getItem("ordis-tracker") || "[]",
    ) as SavedItem[];
    if (!saved.find((s) => s.name === itemName)) {
      saved.push({
        id: Date.now().toString(),
        name: itemName,
        category: "Item",
        notes: "",
        completed: false,
        addedAt: Date.now(),
      });
      localStorage.setItem("ordis-tracker", JSON.stringify(saved));
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    }
  };

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        handleAdd();
      }}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
        added
          ? "bg-green-600/20 text-green-400"
          : "bg-cyan-600/20 text-cyan-400 hover:bg-cyan-600/30"
      }`}
    >
      {added ? "✓" : "+"} {added ? "Added!" : "Track"}
    </button>
  );
}
