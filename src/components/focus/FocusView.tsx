/**
 * Focus School Tracker
 * Track Focus school abilities and pool capacity
 */
import { useState, useMemo, useCallback } from "react";
import {
  Eye,
  Check,
  ChevronDown,
  ChevronUp,
  Zap,
  Target,
  Shield,
  Flame,
  Sparkles,
} from "lucide-react";
import { useLocalStorageSet } from "../../hooks/useLocalStorage";

// Focus schools data
const FOCUS_SCHOOLS = [
  {
    name: "Madurai",
    icon: Flame,
    color: "text-orange-400",
    bgColor: "bg-orange-900/30",
    borderColor: "border-orange-600/50",
    description: "Offense-focused. Increases damage output.",
    abilities: [
      {
        name: "Phoenix Talons",
        description: "+25% Physical Damage",
        poolCost: 0,
      },
      {
        name: "Phoenix Spirit",
        description: "+25% Elemental Damage",
        poolCost: 0,
      },
      { name: "Inner Gaze", description: "+25% Energy Max", poolCost: 0 },
      { name: "Eternal Gaze", description: "+25% Energy Regen", poolCost: 0 },
      {
        name: "Void Strike",
        description: "Charged void damage buff",
        poolCost: 40,
      },
      {
        name: "Searing Blast",
        description: "Void Blast damage increase",
        poolCost: 0,
      },
      { name: "Meteoric Dash", description: "Void Dash damage", poolCost: 25 },
      {
        name: "Blazing Dash",
        description: "Fire trail from Void Dash",
        poolCost: 25,
      },
      {
        name: "Rising Blast",
        description: "Void Blast lifts enemies",
        poolCost: 0,
      },
      {
        name: "Flame Blast",
        description: "Void Blast burns enemies",
        poolCost: 0,
      },
    ],
  },
  {
    name: "Vazarin",
    icon: Shield,
    color: "text-cyan-400",
    bgColor: "bg-cyan-900/30",
    borderColor: "border-cyan-600/50",
    description: "Defense-focused. Healing and protection.",
    abilities: [
      {
        name: "Mending Unity",
        description: "+25% Affinity Range",
        poolCost: 0,
      },
      {
        name: "Enduring Tides",
        description: "+150% Operator Health",
        poolCost: 0,
      },
      {
        name: "Rejuvenating Tides",
        description: "Operator Health Regen",
        poolCost: 0,
      },
      {
        name: "Guardian Shell",
        description: "Shield grants to allies",
        poolCost: 0,
      },
      {
        name: "Protective Dash",
        description: "Void Dash heals allies",
        poolCost: 25,
      },
      {
        name: "Guardian Blast",
        description: "Void Blast grants invulnerability",
        poolCost: 25,
      },
      {
        name: "Void Aegis",
        description: "Shield bubble while in Void Mode",
        poolCost: 50,
      },
      {
        name: "Void Regen",
        description: "Health regen in Void Mode",
        poolCost: 0,
      },
      { name: "Sonic Dash", description: "Dash stuns enemies", poolCost: 0 },
      { name: "Mending Soul", description: "Instant revives", poolCost: 0 },
    ],
  },
  {
    name: "Naramon",
    icon: Target,
    color: "text-purple-400",
    bgColor: "bg-purple-900/30",
    borderColor: "border-purple-600/50",
    description: "Melee-focused. Enhances melee combat.",
    abilities: [
      {
        name: "Affinity Spike",
        description: "+45% Melee Affinity",
        poolCost: 0,
      },
      { name: "Power Spike", description: "Melee combo duration", poolCost: 0 },
      { name: "Mind Sprint", description: "+45% Void Dash speed", poolCost: 0 },
      {
        name: "Mind Step",
        description: "Movement speed after Dash",
        poolCost: 0,
      },
      {
        name: "Executing Dash",
        description: "Open enemies to finishers",
        poolCost: 25,
      },
      {
        name: "Void Stalker",
        description: "Crit chance on melee",
        poolCost: 50,
      },
      {
        name: "Surging Dash",
        description: "Dash grants combo counter",
        poolCost: 25,
      },
      {
        name: "Disorienting Blast",
        description: "Confuse enemies",
        poolCost: 0,
      },
      {
        name: "Disarming Blast",
        description: "Enemies drop weapons",
        poolCost: 0,
      },
      {
        name: "Lethal Levitation",
        description: "Lifted enemies take more damage",
        poolCost: 0,
      },
    ],
  },
  {
    name: "Unairu",
    icon: Eye,
    color: "text-yellow-400",
    bgColor: "bg-yellow-900/30",
    borderColor: "border-yellow-600/50",
    description: "Armor-focused. Tank and armor stripping.",
    abilities: [
      {
        name: "Unairu Wisp",
        description: "Spawn wisps for Operator damage",
        poolCost: 0,
      },
      { name: "Stone Skin", description: "+60 Operator Armor", poolCost: 0 },
      {
        name: "Basilisk Scales",
        description: "+100% Operator Armor",
        poolCost: 0,
      },
      {
        name: "Basilisk Gaze",
        description: "Enemy armor reduction",
        poolCost: 0,
      },
      { name: "Void Spines", description: "Damage reflection", poolCost: 25 },
      {
        name: "Magnetic Blast",
        description: "Void Blast armor strip",
        poolCost: 25,
      },
      {
        name: "Sundering Dash",
        description: "Void Dash armor strip",
        poolCost: 25,
      },
      {
        name: "Crippling Dash",
        description: "Slow enemies on Dash",
        poolCost: 0,
      },
      {
        name: "Void Shadow",
        description: "Enemy acc reduction in Void",
        poolCost: 50,
      },
      { name: "Poise", description: "Knockdown resistance", poolCost: 0 },
    ],
  },
  {
    name: "Zenurik",
    icon: Zap,
    color: "text-blue-400",
    bgColor: "bg-blue-900/30",
    borderColor: "border-blue-600/50",
    description: "Energy-focused. Energy regeneration.",
    abilities: [
      {
        name: "Energy Pulse",
        description: "+50% Energy pickup range",
        poolCost: 0,
      },
      {
        name: "Inner Might",
        description: "Efficiency for channeled abilities",
        poolCost: 0,
      },
      {
        name: "Void Siphon",
        description: "Energy regen in Void Mode",
        poolCost: 0,
      },
      { name: "Void Flow", description: "+90% Void Energy", poolCost: 0 },
      {
        name: "Wellspring",
        description: "Void Dash creates energy zone",
        poolCost: 25,
      },
      {
        name: "Energizing Dash",
        description: "Energy regen for Warframe",
        poolCost: 25,
      },
      {
        name: "Void Singularity",
        description: "Pull enemies in Void Mode",
        poolCost: 25,
      },
      {
        name: "Temporal Blast",
        description: "Slow enemies with Blast",
        poolCost: 25,
      },
      {
        name: "Lightning Dash",
        description: "Electric damage on Dash",
        poolCost: 0,
      },
      {
        name: "Voltaic Blast",
        description: "Chain lightning on Blast",
        poolCost: 0,
      },
    ],
  },
] as const;

export function FocusView() {
  const [unlockedAbilities, setUnlockedAbilities] = useLocalStorageSet<string>(
    "ordis-focus-abilities",
  );
  const [expandedSchool, setExpandedSchool] = useState<string | null>(
    "Zenurik",
  );
  const [primarySchool, setPrimarySchool] = useState<string>(() => {
    return localStorage.getItem("ordis-focus-primary") || "Zenurik";
  });

  // Save primary school
  const handleSetPrimary = useCallback((school: string) => {
    setPrimarySchool(school);
    localStorage.setItem("ordis-focus-primary", school);
  }, []);

  // Toggle ability unlock
  const toggleAbility = useCallback(
    (schoolName: string, abilityName: string) => {
      const key = `${schoolName}:${abilityName}`;
      setUnlockedAbilities((prev) => {
        const updated = new Set(prev);
        if (updated.has(key)) {
          updated.delete(key);
        } else {
          updated.add(key);
        }
        return updated;
      });
    },
    [setUnlockedAbilities],
  );

  // Calculate stats per school
  const schoolStats = useMemo(() => {
    const stats: Record<
      string,
      { unlocked: number; total: number; poolUsed: number }
    > = {};

    FOCUS_SCHOOLS.forEach((school) => {
      let unlocked = 0;
      let poolUsed = 0;

      school.abilities.forEach((ability) => {
        const key = `${school.name}:${ability.name}`;
        if (unlockedAbilities.has(key)) {
          unlocked++;
          poolUsed += ability.poolCost;
        }
      });

      stats[school.name] = {
        unlocked,
        total: school.abilities.length,
        poolUsed,
      };
    });

    return stats;
  }, [unlockedAbilities]);

  // Total progress
  const totalProgress = useMemo(() => {
    let unlocked = 0;
    let total = 0;
    let poolUsed = 0;

    Object.values(schoolStats).forEach((stat) => {
      unlocked += stat.unlocked;
      total += stat.total;
      poolUsed += stat.poolUsed;
    });

    return {
      unlocked,
      total,
      poolUsed,
      percent: Math.round((unlocked / total) * 100),
    };
  }, [schoolStats]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="bg-gradient-to-r from-indigo-900/30 to-slate-900/50 rounded-xl border border-indigo-700/30 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-indigo-400 flex items-center gap-3">
            <Sparkles size={28} /> Focus School Tracker
          </h2>
          <div className="text-right">
            <div className="text-3xl font-bold text-indigo-300">
              {totalProgress.unlocked}/{totalProgress.total}
            </div>
            <div className="text-slate-400 text-sm">
              Abilities Unlocked ({totalProgress.percent}%)
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-600 to-purple-500 transition-all duration-500"
            style={{ width: `${totalProgress.percent}%` }}
          />
        </div>

        {/* Primary school selector */}
        <div className="mt-4 flex items-center gap-3">
          <span className="text-sm text-slate-400">Primary School:</span>
          <div className="flex gap-2">
            {FOCUS_SCHOOLS.map((school) => {
              const Icon = school.icon;
              return (
                <button
                  key={school.name}
                  onClick={() => handleSetPrimary(school.name)}
                  className={`p-2 rounded-lg transition-all ${
                    primarySchool === school.name
                      ? `${school.bgColor} ${school.borderColor} border-2 ring-2 ring-white/20`
                      : "bg-slate-800 border border-slate-700 hover:border-slate-600"
                  }`}
                  title={`Set ${school.name} as primary`}
                >
                  <Icon size={20} className={school.color} />
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* School Cards */}
      <div className="space-y-4">
        {FOCUS_SCHOOLS.map((school) => {
          const Icon = school.icon;
          const stats = schoolStats[school.name];
          const isExpanded = expandedSchool === school.name;
          const isPrimary = primarySchool === school.name;

          return (
            <div
              key={school.name}
              className={`rounded-xl border overflow-hidden transition-all ${
                isPrimary ? school.borderColor : "border-slate-700"
              } ${school.bgColor}`}
            >
              {/* School Header */}
              <button
                onClick={() =>
                  setExpandedSchool(isExpanded ? null : school.name)
                }
                className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${school.bgColor}`}>
                    <Icon size={24} className={school.color} />
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <h3 className={`font-bold ${school.color}`}>
                        {school.name}
                      </h3>
                      {isPrimary && (
                        <span className="text-xs bg-white/10 px-2 py-0.5 rounded text-slate-300">
                          Primary
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-400">
                      {school.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className={`font-bold ${school.color}`}>
                      {stats.unlocked}/{stats.total}
                    </div>
                    <div className="text-xs text-slate-500">
                      {stats.poolUsed > 0 && `${stats.poolUsed} pool used`}
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp size={20} />
                  ) : (
                    <ChevronDown size={20} />
                  )}
                </div>
              </button>

              {/* Abilities List */}
              {isExpanded && (
                <div className="p-4 border-t border-slate-700/50 grid grid-cols-1 md:grid-cols-2 gap-2">
                  {school.abilities.map((ability) => {
                    const key = `${school.name}:${ability.name}`;
                    const isUnlocked = unlockedAbilities.has(key);

                    return (
                      <button
                        key={ability.name}
                        onClick={() => toggleAbility(school.name, ability.name)}
                        className={`flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${
                          isUnlocked
                            ? `${school.bgColor} ${school.borderColor} border`
                            : "bg-slate-800/50 border-slate-700/50 hover:border-slate-600"
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                            isUnlocked
                              ? `${school.bgColor} ${school.borderColor.replace("border-", "bg-").replace("/50", "")}`
                              : "border-slate-500"
                          }`}
                        >
                          {isUnlocked && (
                            <Check size={14} className="text-white" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div
                            className={`font-medium text-sm ${isUnlocked ? school.color : "text-slate-300"}`}
                          >
                            {ability.name}
                          </div>
                          <div className="text-xs text-slate-500 truncate">
                            {ability.description}
                          </div>
                        </div>
                        {ability.poolCost > 0 && (
                          <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded">
                            {ability.poolCost}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Tips */}
      <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-4">
        <h3 className="font-bold text-slate-300 mb-2">💡 Focus Tips</h3>
        <ul className="text-sm text-slate-400 space-y-1">
          <li>
            • <strong>Zenurik - Wellspring</strong> is the most popular for
            energy regeneration
          </li>
          <li>
            • <strong>Naramon - Affinity Spike</strong> helps level melee
            weapons faster
          </li>
          <li>
            • <strong>Madurai - Void Strike</strong> is essential for Eidolon
            hunting
          </li>
          <li>• Farm Focus at Sanctuary Onslaught or Eidolon hunts</li>
        </ul>
      </div>
    </div>
  );
}
