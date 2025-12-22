import { useState } from "react";
import { Gem, Plus, Trash2, Star } from "lucide-react";
import type { SavedRelic } from "../../types";

const ERAS = ["Lith", "Meso", "Neo", "Axi", "Requiem"];

export function RelicsView() {
  const [relics, setRelics] = useState<SavedRelic[]>(() => {
    const saved = localStorage.getItem("ordis-relics");
    return saved ? JSON.parse(saved) : [];
  });
  const [filterEra, setFilterEra] = useState<string>("all");
  const [showWanted, setShowWanted] = useState(false);

  const saveRelics = (newRelics: SavedRelic[]) => {
    setRelics(newRelics);
    localStorage.setItem("ordis-relics", JSON.stringify(newRelics));
  };

  const addRelic = (era: string) => {
    const relicName = prompt(`Enter relic name (e.g., ${era} A1):`);
    if (!relicName) return;

    const newRelic: SavedRelic = {
      // eslint-disable-next-line react-hooks/purity
      id: Date.now().toString(),
      name: relicName.trim(),
      era,
      refinement: "Intact",
      quantity: 1,
      wanted: false,
    };
    saveRelics([...relics, newRelic]);
  };

  const updateRelic = (id: string, updates: Partial<SavedRelic>) => {
    saveRelics(relics.map((r) => (r.id === id ? { ...r, ...updates } : r)));
  };

  const removeRelic = (id: string) => {
    saveRelics(relics.filter((r) => r.id !== id));
  };

  const filteredRelics = relics.filter((r) => {
    if (filterEra !== "all" && r.era !== filterEra) return false;
    if (showWanted && !r.wanted) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="bg-slate-900/50 rounded-xl border border-amber-900/30 p-6">
        <h2 className="text-2xl font-bold text-amber-400 mb-4 flex items-center gap-3">
          <Gem size={28} /> Relic Manager
        </h2>
        <p className="text-slate-400 mb-6">
          Track your void relic inventory and wishlist.
        </p>

        {/* Add Relic Buttons */}
        <div className="flex flex-wrap gap-2 mb-6">
          {ERAS.map((era) => (
            <button
              key={era}
              onClick={() => addRelic(era)}
              className="px-4 py-2 bg-slate-800/50 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <Plus size={16} /> {era}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <select
            value={filterEra}
            onChange={(e) => setFilterEra(e.target.value)}
            className="px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-200"
            aria-label="Filter by era"
          >
            <option value="all">All Eras</option>
            {ERAS.map((era) => (
              <option key={era} value={era}>
                {era}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={showWanted}
              onChange={(e) => setShowWanted(e.target.checked)}
              className="rounded bg-slate-800 border-slate-600"
            />
            Show only wanted
          </label>
        </div>

        {/* Relic List */}
        {filteredRelics.length === 0 ? (
          <div className="text-center text-slate-500 py-8">
            <Gem size={48} className="mx-auto mb-4 opacity-50" />
            <p>No relics tracked yet. Click an era button above to add one!</p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {filteredRelics.map((relic) => (
              <div
                key={relic.id}
                className={`bg-slate-800/30 rounded-lg p-4 border ${relic.wanted ? "border-amber-500/50" : "border-slate-700/50"}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="text-slate-200 font-medium flex items-center gap-2">
                      {relic.name}
                      {relic.wanted && (
                        <Star
                          size={14}
                          className="text-amber-400 fill-amber-400"
                        />
                      )}
                    </h4>
                    <p className="text-xs text-slate-500">{relic.era} Era</p>
                  </div>
                  <button
                    onClick={() => removeRelic(relic.id)}
                    className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                    aria-label="Remove relic"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <select
                    value={relic.refinement}
                    onChange={(e) =>
                      updateRelic(relic.id, {
                        refinement: e.target.value as SavedRelic["refinement"],
                      })
                    }
                    className="flex-1 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-sm text-slate-200"
                    aria-label="Refinement level"
                  >
                    <option>Intact</option>
                    <option>Exceptional</option>
                    <option>Flawless</option>
                    <option>Radiant</option>
                  </select>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() =>
                        updateRelic(relic.id, {
                          quantity: Math.max(0, relic.quantity - 1),
                        })
                      }
                      className="px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-slate-300"
                      aria-label="Decrease quantity"
                    >
                      -
                    </button>
                    <span className="w-8 text-center text-slate-200">
                      {relic.quantity}
                    </span>
                    <button
                      onClick={() =>
                        updateRelic(relic.id, { quantity: relic.quantity + 1 })
                      }
                      className="px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-slate-300"
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                </div>
                <button
                  onClick={() =>
                    updateRelic(relic.id, { wanted: !relic.wanted })
                  }
                  className={`w-full py-1 rounded text-sm transition-colors ${
                    relic.wanted
                      ? "bg-amber-600/20 text-amber-400"
                      : "bg-slate-700/50 text-slate-400 hover:bg-slate-700"
                  }`}
                >
                  {relic.wanted ? "★ Wanted" : "☆ Mark as Wanted"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
