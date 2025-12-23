import { useState } from "react";
import {
  Users,
  Star,
  Plus,
  Minus,
  RefreshCw,
  ExternalLink,
} from "lucide-react";

// Warframe Syndicates
const SYNDICATES = [
  {
    id: "steel-meridian",
    name: "Steel Meridian",
    description:
      "The Steel Meridian are made up of Grineer defectors and soldiers who have turned their back on the empire.",
    color: "text-red-400",
    bgColor: "bg-red-900/20",
    borderColor: "border-red-700/50",
    maxStanding: 132000, // Legendary rank
    wikiUrl: "https://wiki.warframe.com/w/Steel_Meridian",
  },
  {
    id: "arbiters-of-hexis",
    name: "Arbiters of Hexis",
    description:
      "The Arbiters of Hexis seek to uncover the truth behind Warframe and their Tenno operators.",
    color: "text-blue-400",
    bgColor: "bg-blue-900/20",
    borderColor: "border-blue-700/50",
    maxStanding: 132000,
    wikiUrl: "https://wiki.warframe.com/w/Arbiters_of_Hexis",
  },
  {
    id: "cephalon-suda",
    name: "Cephalon Suda",
    description:
      "Cephalon Suda has devoted herself to the pursuit of knowledge and cataloging the origin system.",
    color: "text-cyan-400",
    bgColor: "bg-cyan-900/20",
    borderColor: "border-cyan-700/50",
    maxStanding: 132000,
    wikiUrl: "https://wiki.warframe.com/w/Cephalon_Suda",
  },
  {
    id: "perrin-sequence",
    name: "The Perrin Sequence",
    description:
      "The Perrin Sequence reject the Corpus ideology of profit through conflict.",
    color: "text-emerald-400",
    bgColor: "bg-emerald-900/20",
    borderColor: "border-emerald-700/50",
    maxStanding: 132000,
    wikiUrl: "https://wiki.warframe.com/w/The_Perrin_Sequence",
  },
  {
    id: "red-veil",
    name: "Red Veil",
    description:
      "Red Veil sees corruption all around them. They are honor-bound to root it out.",
    color: "text-rose-400",
    bgColor: "bg-rose-900/20",
    borderColor: "border-rose-700/50",
    maxStanding: 132000,
    wikiUrl: "https://wiki.warframe.com/w/Red_Veil",
  },
  {
    id: "new-loka",
    name: "New Loka",
    description:
      "New Loka believes in humanity's purity, and seeks to restore Earth to its former glory.",
    color: "text-lime-400",
    bgColor: "bg-lime-900/20",
    borderColor: "border-lime-700/50",
    maxStanding: 132000,
    wikiUrl: "https://wiki.warframe.com/w/New_Loka",
  },
];

// Open World / Neutral Syndicates (no daily cap, different systems)
const OPEN_WORLD_SYNDICATES = [
  {
    id: "ostron",
    name: "Ostrons",
    location: "Cetus, Earth",
    description:
      "The Ostrons of Cetus, dwellers of the ancient Orokin Tower Unum.",
    color: "text-orange-400",
    borderColor: "border-orange-700/50",
    wikiUrl: "https://wiki.warframe.com/w/Ostron",
  },
  {
    id: "solaris-united",
    name: "Solaris United",
    location: "Fortuna, Venus",
    description:
      "Workers of Fortuna who resist the Corpus rule over Orb Vallis.",
    color: "text-blue-400",
    borderColor: "border-blue-700/50",
    wikiUrl: "https://wiki.warframe.com/w/Solaris_United",
  },
  {
    id: "entrati",
    name: "Entrati",
    location: "Necralisk, Deimos",
    description:
      "The ancient Orokin family who studies the Infestation on Deimos.",
    color: "text-violet-400",
    borderColor: "border-violet-700/50",
    wikiUrl: "https://wiki.warframe.com/w/Entrati",
  },
  {
    id: "the-holdfasts",
    name: "The Holdfasts",
    location: "Zariman Ten Zero",
    description:
      "Survivors of the Zariman colony ship who watch over the Angels.",
    color: "text-yellow-400",
    borderColor: "border-yellow-700/50",
    wikiUrl: "https://wiki.warframe.com/w/The_Holdfasts",
  },
  {
    id: "conclave",
    name: "Conclave",
    location: "Relays",
    description: "Teshin's PvP organization for Tenno combat training.",
    color: "text-slate-400",
    borderColor: "border-slate-700/50",
    wikiUrl: "https://wiki.warframe.com/w/Conclave",
  },
  {
    id: "simaris",
    name: "Cephalon Simaris",
    location: "Relays",
    description:
      "The Sanctuary's keeper who catalogs all life in the Origin System.",
    color: "text-amber-400",
    borderColor: "border-amber-700/50",
    wikiUrl: "https://wiki.warframe.com/w/Cephalon_Simaris",
  },
];

// Syndicate relationships
const SYNDICATE_RELATIONSHIPS: Record<
  string,
  { allied: string; opposed: string[] }
> = {
  "steel-meridian": {
    allied: "red-veil",
    opposed: ["arbiters-of-hexis", "perrin-sequence"],
  },
  "arbiters-of-hexis": {
    allied: "cephalon-suda",
    opposed: ["steel-meridian", "red-veil"],
  },
  "cephalon-suda": {
    allied: "arbiters-of-hexis",
    opposed: ["perrin-sequence", "new-loka"],
  },
  "perrin-sequence": {
    allied: "new-loka",
    opposed: ["steel-meridian", "cephalon-suda"],
  },
  "red-veil": {
    allied: "steel-meridian",
    opposed: ["arbiters-of-hexis", "new-loka"],
  },
  "new-loka": {
    allied: "perrin-sequence",
    opposed: ["cephalon-suda", "red-veil"],
  },
};

// Standing ranks and their caps
const STANDING_RANKS = [
  { name: "Initiate", cap: 5000 },
  { name: "Associate", cap: 22000 },
  { name: "Agent", cap: 44000 },
  { name: "Operative", cap: 70000 },
  { name: "General", cap: 99000 },
  { name: "Legendary", cap: 132000 },
];

// Notable syndicate offerings
const SYNDICATE_OFFERINGS: Record<
  string,
  { weapons: string[]; mods: string[] }
> = {
  "steel-meridian": {
    weapons: ["Vaykor Hek", "Vaykor Marelok", "Vaykor Sydon"],
    mods: ["Scattered Justice", "Steel Charge"],
  },
  "arbiters-of-hexis": {
    weapons: ["Telos Akbolto", "Telos Boltace", "Telos Boltor"],
    mods: ["Gilded Truth", "Energy Transfer"],
  },
  "cephalon-suda": {
    weapons: ["Synoid Gammacor", "Synoid Heliocor", "Synoid Simulor"],
    mods: ["Entropy Burst", "Entropy Flight"],
  },
  "perrin-sequence": {
    weapons: ["Spectra Vandal", "Secura Dual Cestra", "Secura Penta"],
    mods: ["Sequence", "Toxic Sequence"],
  },
  "red-veil": {
    weapons: ["Rakta Dark Dagger", "Rakta Cernos", "Rakta Ballistica"],
    mods: ["Gleaming Blight", "Eroding Blight"],
  },
  "new-loka": {
    weapons: ["Sancti Tigris", "Sancti Castanas", "Sancti Magistar"],
    mods: ["Bright Purity", "New Loka Specters"],
  },
};

// Calculate daily standing cap based on MR
// Correct formula: 16000 + (MR × 500)
function calculateDailyCap(masteryRank: number): number {
  return 16000 + masteryRank * 500;
}

interface SyndicateProgress {
  id: string;
  currentStanding: number;
  targetRank: number; // index into STANDING_RANKS
  earnedToday: number;
}

export function SyndicateView() {
  const [masteryRank, setMasteryRank] = useState<number>(() => {
    const saved = localStorage.getItem("ordis-mastery-rank");
    return saved ? parseInt(saved, 10) : 10;
  });

  const [syndicateProgress, setSyndicateProgress] = useState<
    SyndicateProgress[]
  >(() => {
    const saved = localStorage.getItem("ordis-syndicate-progress");
    if (saved) {
      return JSON.parse(saved);
    }
    // Default: track first 3 syndicates
    return SYNDICATES.slice(0, 3).map((s) => ({
      id: s.id,
      currentStanding: 0,
      targetRank: 5, // Legendary
      earnedToday: 0,
    }));
  });

  const saveProgress = (progress: SyndicateProgress[]) => {
    setSyndicateProgress(progress);
    localStorage.setItem("ordis-syndicate-progress", JSON.stringify(progress));
  };

  const updateMasteryRank = (newRank: number) => {
    const clamped = Math.max(0, Math.min(30, newRank));
    setMasteryRank(clamped);
    localStorage.setItem("ordis-mastery-rank", clamped.toString());
  };

  const addSyndicate = (syndicateId: string) => {
    if (syndicateProgress.find((s) => s.id === syndicateId)) return;
    saveProgress([
      ...syndicateProgress,
      { id: syndicateId, currentStanding: 0, targetRank: 5, earnedToday: 0 },
    ]);
  };

  const removeSyndicate = (syndicateId: string) => {
    saveProgress(syndicateProgress.filter((s) => s.id !== syndicateId));
  };

  const updateSyndicateStanding = (syndicateId: string, standing: number) => {
    saveProgress(
      syndicateProgress.map((s) =>
        s.id === syndicateId
          ? { ...s, currentStanding: Math.max(0, standing) }
          : s,
      ),
    );
  };

  const addEarnedToday = (syndicateId: string, amount: number) => {
    saveProgress(
      syndicateProgress.map((s) =>
        s.id === syndicateId
          ? {
              ...s,
              earnedToday: Math.min(dailyCap, s.earnedToday + amount),
              currentStanding: s.currentStanding + amount,
            }
          : s,
      ),
    );
  };

  const resetDailyStanding = () => {
    saveProgress(syndicateProgress.map((s) => ({ ...s, earnedToday: 0 })));
  };

  const dailyCap = calculateDailyCap(masteryRank);

  const trackedSyndicates = syndicateProgress
    .map((prog) => {
      const syndicate = SYNDICATES.find((s) => s.id === prog.id);
      if (!syndicate) return null;
      return { ...syndicate, progress: prog };
    })
    .filter(Boolean);

  const untrackedSyndicates = SYNDICATES.filter(
    (s) => !syndicateProgress.find((p) => p.id === s.id),
  );

  return (
    <div className="space-y-6">
      {/* Daily Cap Info */}
      <div className="bg-slate-900/50 rounded-xl border border-purple-900/30 p-6">
        <h2 className="text-2xl font-bold text-purple-400 mb-4 flex items-center gap-3">
          <Users size={28} /> Syndicate Tracker
        </h2>

        {/* Mastery Rank Setting */}
        <div className="flex items-center gap-4 mb-6 p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
          <div className="flex items-center gap-2">
            <Star size={20} className="text-yellow-400" />
            <span className="text-slate-300">Mastery Rank:</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => updateMasteryRank(masteryRank - 1)}
              className="p-1 bg-slate-700 hover:bg-slate-600 rounded transition-colors"
              aria-label="Decrease mastery rank"
            >
              <Minus size={16} />
            </button>
            <span className="w-8 text-center text-xl font-bold text-yellow-400">
              {masteryRank}
            </span>
            <button
              onClick={() => updateMasteryRank(masteryRank + 1)}
              className="p-1 bg-slate-700 hover:bg-slate-600 rounded transition-colors"
              aria-label="Increase mastery rank"
            >
              <Plus size={16} />
            </button>
          </div>
          <div className="ml-auto text-slate-400">
            Daily Cap:{" "}
            <span className="text-cyan-400 font-bold">
              {dailyCap.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Reset Daily Button */}
        <button
          onClick={resetDailyStanding}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors mb-6"
        >
          <RefreshCw size={16} /> Reset Daily Progress
        </button>

        {/* Tracked Syndicates */}
        <div className="space-y-4">
          {trackedSyndicates.length === 0 ? (
            <div className="text-center text-slate-500 py-8">
              <Users size={48} className="mx-auto mb-4 opacity-50" />
              <p>No syndicates being tracked.</p>
              <p className="text-sm">Add syndicates below to start tracking!</p>
            </div>
          ) : (
            trackedSyndicates.map((item) => {
              if (!item) return null;
              const syndicate = item;
              const prog = item.progress;
              const targetCap = STANDING_RANKS[prog.targetRank]?.cap || 132000;
              const progressPercent = Math.min(
                100,
                (prog.currentStanding / targetCap) * 100,
              );
              const dailyProgressPercent = Math.min(
                100,
                (prog.earnedToday / dailyCap) * 100,
              );

              return (
                <div
                  key={syndicate.id}
                  className={`${syndicate.bgColor} rounded-lg border ${syndicate.borderColor} p-4`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <h3 className={`font-bold ${syndicate.color}`}>
                        {syndicate.name}
                      </h3>
                      <a
                        href={syndicate.wikiUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-500 hover:text-slate-300"
                      >
                        <ExternalLink size={14} />
                      </a>
                    </div>
                    <button
                      onClick={() => removeSyndicate(syndicate.id)}
                      className="text-slate-500 hover:text-red-400 transition-colors"
                      title="Stop tracking"
                    >
                      ×
                    </button>
                  </div>

                  <p className="text-sm text-slate-400 mb-4">
                    {syndicate.description}
                  </p>

                  {/* Total Standing Progress */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-slate-400">Total Standing</span>
                      <span className={syndicate.color}>
                        {prog.currentStanding.toLocaleString()} /{" "}
                        {targetCap.toLocaleString()}
                      </span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${syndicate.color.replace("text-", "bg-")} transition-all`}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-slate-500 mt-1">
                      {STANDING_RANKS.map((rank, i) => (
                        <span
                          key={rank.name}
                          className={
                            i <= prog.targetRank ? syndicate.color : ""
                          }
                        >
                          {rank.name.slice(0, 3)}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Daily Progress */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-slate-400">Today's Progress</span>
                      <span className="text-cyan-400">
                        {prog.earnedToday.toLocaleString()} /{" "}
                        {dailyCap.toLocaleString()}
                      </span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-cyan-500 transition-all"
                        style={{ width: `${dailyProgressPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Quick Add Buttons */}
                  <div className="flex flex-wrap gap-2">
                    <span className="text-sm text-slate-500">
                      Add standing:
                    </span>
                    {[1000, 2500, 5000, 10000].map((amount) => (
                      <button
                        key={amount}
                        onClick={() => addEarnedToday(syndicate.id, amount)}
                        disabled={prog.earnedToday >= dailyCap}
                        className="px-3 py-1 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm rounded transition-colors"
                      >
                        +{(amount / 1000).toFixed(amount >= 1000 ? 0 : 1)}k
                      </button>
                    ))}
                  </div>

                  {/* Allied/Opposed Indicator */}
                  {SYNDICATE_RELATIONSHIPS[syndicate.id] && (
                    <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-700/50">
                      <span className="text-xs text-green-400">
                        Allied:{" "}
                        {
                          SYNDICATES.find(
                            (s) =>
                              s.id ===
                              SYNDICATE_RELATIONSHIPS[syndicate.id].allied,
                          )?.name
                        }
                      </span>
                      <span className="text-xs text-red-400">
                        Opposed:{" "}
                        {SYNDICATE_RELATIONSHIPS[syndicate.id].opposed
                          .map(
                            (id) => SYNDICATES.find((s) => s.id === id)?.name,
                          )
                          .join(", ")}
                      </span>
                    </div>
                  )}

                  {/* Manual Standing Input */}
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-700/50">
                    <span className="text-sm text-slate-500">Set total:</span>
                    <input
                      type="number"
                      value={prog.currentStanding}
                      onChange={(e) =>
                        updateSyndicateStanding(
                          syndicate.id,
                          parseInt(e.target.value, 10) || 0,
                        )
                      }
                      className="w-28 px-2 py-1 bg-slate-800 border border-slate-600 rounded text-sm"
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Add Syndicate */}
      {untrackedSyndicates.length > 0 && (
        <div className="bg-slate-900/50 rounded-xl border border-slate-700/30 p-6">
          <h3 className="text-lg font-bold text-slate-300 mb-4">
            Add Syndicate to Track
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {untrackedSyndicates.map((syndicate) => (
              <button
                key={syndicate.id}
                onClick={() => addSyndicate(syndicate.id)}
                className={`${syndicate.bgColor} border ${syndicate.borderColor} rounded-lg p-4 text-left hover:opacity-80 transition-opacity`}
              >
                <h4 className={`font-medium ${syndicate.color} mb-1`}>
                  {syndicate.name}
                </h4>
                <p className="text-xs text-slate-500 line-clamp-2">
                  {syndicate.description}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Syndicate Offerings Browser */}
      <div className="bg-slate-900/50 rounded-xl border border-amber-900/30 p-6">
        <h3 className="text-lg font-bold text-amber-400 mb-4">
          Notable Syndicate Offerings
        </h3>
        <p className="text-sm text-slate-400 mb-4">
          Each syndicate sells exclusive weapons and augment mods at max rank.
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SYNDICATES.map((syndicate) => {
            const offerings = SYNDICATE_OFFERINGS[syndicate.id];
            if (!offerings) return null;
            return (
              <div
                key={syndicate.id}
                className={`${syndicate.bgColor} rounded-lg border ${syndicate.borderColor} p-4`}
              >
                <h4 className={`font-medium ${syndicate.color} mb-3`}>
                  {syndicate.name}
                </h4>
                <div className="space-y-2">
                  <div>
                    <span className="text-xs text-slate-500 uppercase">
                      Weapons
                    </span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {offerings.weapons.map((weapon) => (
                        <span
                          key={weapon}
                          className="px-2 py-0.5 bg-slate-800/50 text-slate-300 rounded text-xs"
                        >
                          {weapon}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 uppercase">
                      Key Mods
                    </span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {offerings.mods.map((mod) => (
                        <span
                          key={mod}
                          className="px-2 py-0.5 bg-amber-900/30 text-amber-300 rounded text-xs"
                        >
                          {mod}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Syndicate Tips */}
      <div className="bg-slate-900/50 rounded-xl border border-slate-700/30 p-6">
        <h3 className="text-lg font-bold text-slate-300 mb-4">
          Syndicate Tips
        </h3>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="bg-slate-800/30 rounded-lg p-3">
            <h4 className="text-cyan-400 font-medium mb-1">📊 Daily Cap</h4>
            <p className="text-sm text-slate-400">
              Your daily standing cap is 16,000 + (500 × MR). Complete syndicate
              missions and wear sigils to earn standing.
            </p>
          </div>
          <div className="bg-slate-800/30 rounded-lg p-3">
            <h4 className="text-cyan-400 font-medium mb-1">
              ⚔️ Allied Syndicates
            </h4>
            <p className="text-sm text-slate-400">
              Steel Meridian ↔ Red Veil. Hexis ↔ Suda. Perrin ↔ New Loka.
              Earning for one ally earns 50% for the other.
            </p>
          </div>
          <div className="bg-slate-800/30 rounded-lg p-3">
            <h4 className="text-cyan-400 font-medium mb-1">🎯 Medallions</h4>
            <p className="text-sm text-slate-400">
              Find medallions in syndicate missions. They give standing that
              doesn't count toward your daily cap!
            </p>
          </div>
          <div className="bg-slate-800/30 rounded-lg p-3">
            <h4 className="text-cyan-400 font-medium mb-1">🎖️ Pledging</h4>
            <p className="text-sm text-slate-400">
              Pledge allegiance at the Syndicate console to earn 15% of mission
              affinity as standing. Sigils are now cosmetic only.
            </p>
          </div>
        </div>
      </div>

      {/* Open World Syndicates Reference */}
      <div className="bg-slate-900/50 rounded-xl border border-slate-700/30 p-6">
        <h3 className="text-lg font-bold text-slate-300 mb-4">
          Open World & Other Syndicates
        </h3>
        <p className="text-sm text-slate-400 mb-4">
          These syndicates have their own standing systems unrelated to the main
          6.
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {OPEN_WORLD_SYNDICATES.map((syndicate) => (
            <a
              key={syndicate.id}
              href={syndicate.wikiUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`bg-slate-800/30 border ${syndicate.borderColor} rounded-lg p-4 hover:opacity-80 transition-opacity`}
            >
              <h4 className={`font-medium ${syndicate.color} mb-1`}>
                {syndicate.name}
              </h4>
              <p className="text-xs text-slate-500">{syndicate.location}</p>
              <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                {syndicate.description}
              </p>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
