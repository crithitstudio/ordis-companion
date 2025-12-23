import { useState } from "react";
import {
  Home,
  Book,
  Info,
  Diamond,
  Radio,
  Target,
  Bookmark,
  ExternalLink,
  CheckCircle2,
  Circle,
  Sword,
  Shield,
  Clock,
  Coins,
  Users,
  Zap,
  TrendingUp,
} from "lucide-react";

const RESOURCES = [
  {
    name: "Official Warframe Wiki",
    url: "https://wiki.warframe.com",
    icon: Book,
    color: "orange",
    desc: "Comprehensive wiki with all game information",
  },
  {
    name: "Warframe Market",
    url: "https://warframe.market",
    icon: Coins,
    color: "green",
    desc: "Trade platform for Prime parts, mods, and more",
  },
  {
    name: "Overframe (Builds)",
    url: "https://overframe.gg",
    icon: Target,
    color: "cyan",
    desc: "Community weapon and Warframe builds",
  },
  {
    name: "Official Drop Tables",
    url: "https://www.warframe.com/droptables",
    icon: Diamond,
    color: "purple",
    desc: "Official source for all drop rates",
  },
  {
    name: "AlecaFrame",
    url: "https://alecaframe.com",
    icon: TrendingUp,
    color: "blue",
    desc: "Trading analytics and inventory management",
  },
  {
    name: "Reddit r/Warframe",
    url: "https://www.reddit.com/r/Warframe",
    icon: Radio,
    color: "orange",
    desc: "Community discussions, guides, and news",
  },
  {
    name: "Tenno Zone",
    url: "https://tenno.zone",
    icon: Target,
    color: "green",
    desc: "Relic farming planner and tools",
  },
  {
    name: "Official Website",
    url: "https://www.warframe.com",
    icon: Home,
    color: "cyan",
    desc: "News, updates, and account management",
  },
];

const BEGINNER_TIPS = [
  {
    title: "Complete the Star Chart",
    desc: "Unlocking all nodes gives you access to more missions, resources, and eventually Arbitrations. Focus on clearing junctions to progress.",
  },
  {
    title: "Join a Clan",
    desc: "Clans provide access to exclusive frame blueprints (Wukong, Nezha, Banshee), weapons, and trading. Many clan weapons are top-tier!",
  },
  {
    title: "Upgrade Your Mods First",
    desc: "Mods are MORE important than your weapons or frames. A rank 10 Serration adds +165% damage. Prioritize ranking damage mods with Endo.",
  },
  {
    title: "Save Your Starting Platinum",
    desc: "Your initial 50 Platinum should be spent ONLY on Warframe slots (20p) and weapon slots (12p for 2). Never buy weapons or frames for plat.",
  },
  {
    title: "Do Nightwave Weekly",
    desc: "Nightwave is a free battle pass with amazing rewards: slots, potatoes (Catalysts/Reactors), Nitain Extract, Forma, and cosmetics. Do daily/weekly acts!",
  },
  {
    title: "Activate Syndicates Early",
    desc: "Equip a Syndicate sigil as soon as possible. You'll passively earn Standing just by playing, which unlocks augment mods and weapons later.",
  },
  {
    title: "Farm Prime Parts",
    desc: "Open Void Relics to get Prime parts. Sell duplicates on warframe.market for Platinum. This is the primary free-to-play income method.",
  },
  {
    title: "Always Be Crafting",
    desc: "Keep your Foundry busy! Warframes take 3.5 days to build (12h per part + 72h assembly). Start crafting early so frames are ready when you need them.",
  },
  {
    title: "Don't Sell Quest Items",
    desc: "Weapons and frames from quests are difficult or impossible to re-obtain. Always keep at least one copy, and only sell after mastering.",
  },
  {
    title: "Check Baro Ki'Teer",
    desc: "The Void Trader appears every 2 weeks at a relay with exclusive primed mods and cosmetics. Save Ducats (from selling Prime parts at kiosks)!",
  },
];

const ADVANCED_TIPS = [
  {
    category: "Modding Priorities",
    icon: Zap,
    tips: [
      "Base damage mods first (Serration, Hornet Strike, Pressure Point)",
      "Multishot mods second (Split Chamber, Barrel Diffusion)",
      "Elemental combo for enemy type: Corrosive (Grineer), Magnetic/Toxin (Corpus), Heat/Viral (Infested)",
      "Critical mods if weapon has high base crit (>20%)",
      "Status mods if weapon has high status (>25%)",
      "90% elemental mods are cheap and effective for new players",
    ],
  },
  {
    category: "Economy & Trading",
    icon: Coins,
    tips: [
      "Always check warframe.market before trading - avoid getting scammed",
      "Newly unvaulted Prime sets drop in value quickly - sell within first week",
      "Corrupted mods from Deimos vaults sell well (Blind Rage, Fleeting Expertise)",
      "Nightwave credits can buy Nitain (sells for 5-10p each)",
      "Rivens for popular weapons (Kuva, Tenet, meta) hold value better",
      "Wait for 50-75% login discounts before buying Platinum",
    ],
  },
  {
    category: "Efficiency Tips",
    icon: Clock,
    tips: [
      "Capture/Exterminate for fastest Void Fissure runs",
      "Hydron (Sedna) or Sanctuary Onslaught for fastest weapon leveling",
      "Steel Path Incursions give bonus Steel Essence daily (5 min each)",
      "Profit-Taker for fastest credit farming (requires Solaris max rank)",
      "Index for credits before unlocking Profit-Taker",
      "Arbitrations for Endo farming (need all star chart nodes)",
    ],
  },
  {
    category: "Farming Locations",
    icon: Target,
    tips: [
      "Plastids: Ophelia (Uranus) or Zabala (Eris)",
      "Polymer Bundle: Ophelia (Uranus)",
      "Orokin Cells: Sargus Ruk assassination (Saturn)",
      "Neural Sensors: Alad V assassination (Jupiter)",
      "Argon Crystals: Any Void mission (decay in 24h!)",
      "Tellurium: Archwing missions or Ophelia (Uranus)",
    ],
  },
  {
    category: "Companion Tips",
    icon: Users,
    tips: [
      "Smeeta Kavat for resource farming (Charm buff doubles drops)",
      "Carrier sentinel for ammo-hungry weapons (Ammo Case)",
      "Panzer Vulpaphyla can't die permanently (respawns)",
      "Helios sentinel scans enemies automatically (Codex completion)",
      "All companions give you Vacuum/Fetch with the right mod",
      "Link mods share your survivability with companions",
    ],
  },
];

const DAILY_ACTIVITIES = [
  {
    title: "Daily Login Reward",
    desc: "Log in daily for milestone rewards. Day 50/100/150+ give free weapons and primed mods!",
    priority: "Essential",
  },
  {
    title: "Nightwave Daily Acts",
    desc: "Complete 3 daily Nightwave challenges for Standing. Takes ~10 minutes.",
    priority: "High",
  },
  {
    title: "Syndicate Standing Cap",
    desc: "Earn your daily Standing cap through missions. Formula: MR × 1,000 + 1,000.",
    priority: "Medium",
  },
  {
    title: "Steel Path Incursions",
    desc: "Five quick SP missions per day award bonus Steel Essence (5-10 min total).",
    priority: "Medium",
  },
  {
    title: "Sortie",
    desc: "Three-mission series with bonus rewards: rivens, forma, exilus adapters, boosters.",
    priority: "High",
  },
  {
    title: "Simaris Standing",
    desc: "Scan targets for Simaris Standing. Buy Exilus Adapter BPs, widgets, and mods.",
    priority: "Low",
  },
];

const PROGRESSION_MILESTONES = [
  // Early Game
  { id: "complete-tutorial", text: "Complete Vor's Prize quest", category: "Early" },
  { id: "rank-mods", text: "Rank damage mods to 6+ (Serration, etc.)", category: "Early" },
  { id: "reach-mr5", text: "Reach Mastery Rank 5", category: "Early" },
  { id: "unlock-mars", text: "Unlock Mars Junction", category: "Early" },
  { id: "first-reactor", text: "Install Orokin Reactor on your main frame", category: "Early" },
  { id: "join-clan", text: "Join or create a Clan", category: "Early" },
  { id: "activate-syndicate", text: "Activate your first Syndicate", category: "Early" },
  { id: "first-forma", text: "Apply first Forma to a weapon", category: "Early" },
  // Mid Game
  { id: "complete-natah", text: "Complete Natah quest (unlocks Second Dream)", category: "Mid" },
  { id: "complete-second-dream", text: "Complete The Second Dream quest", category: "Mid" },
  { id: "complete-war-within", text: "Complete The War Within quest", category: "Mid" },
  { id: "reach-mr10", text: "Reach Mastery Rank 10", category: "Mid" },
  { id: "get-prime-frame", text: "Build your first Prime Warframe", category: "Mid" },
  { id: "max-syndicate", text: "Max rank a Syndicate (buy augments)", category: "Mid" },
  { id: "unlock-helminth", text: "Unlock Helminth subsume ability transfer", category: "Mid" },
  { id: "complete-chains", text: "Complete Chains of Harrow quest", category: "Mid" },
  // Late Game
  { id: "complete-sacrifice", text: "Complete The Sacrifice quest", category: "Late" },
  { id: "complete-new-war", text: "Complete The New War quest", category: "Late" },
  { id: "unlock-arbitrations", text: "Unlock Arbitrations (all star chart nodes)", category: "Late" },
  { id: "unlock-steel-path", text: "Unlock Steel Path (MR required)", category: "Late" },
  { id: "reach-mr20", text: "Reach Mastery Rank 20", category: "Late" },
  { id: "get-kuva-tenet", text: "Acquire first Kuva/Tenet weapon", category: "Late" },
  { id: "max-focus", text: "Max a Focus school (Zenurik recommended first)", category: "Late" },
  // Endgame
  { id: "complete-zariman", text: "Complete Angels of the Zariman content", category: "Endgame" },
  { id: "reach-mr30", text: "Reach Mastery Rank 30", category: "Endgame" },
  { id: "complete-duviri", text: "Complete Duviri Paradox content", category: "Endgame" },
  { id: "farm-arcanes", text: "Farm and max Arcane sets", category: "Endgame" },
  { id: "reach-legendary", text: "Reach Legendary Rank (LR1+)", category: "Endgame" },
];

export function GuideView() {
  const [completedMilestones, setCompletedMilestones] = useState<Set<string>>(() => {
    const saved = localStorage.getItem("ordis-progression-milestones");
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  const toggleMilestone = (id: string) => {
    setCompletedMilestones((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      localStorage.setItem("ordis-progression-milestones", JSON.stringify([...newSet]));
      return newSet;
    });
  };

  const milestonesByCategory = {
    Early: PROGRESSION_MILESTONES.filter((m) => m.category === "Early"),
    Mid: PROGRESSION_MILESTONES.filter((m) => m.category === "Mid"),
    Late: PROGRESSION_MILESTONES.filter((m) => m.category === "Late"),
    Endgame: PROGRESSION_MILESTONES.filter((m) => m.category === "Endgame"),
  };
  return (
    <div className="space-y-6">
      {/* Quick Links */}
      <section className="bg-slate-900/50 rounded-xl border border-green-900/30 p-6">
        <h2 className="text-2xl font-bold text-green-400 mb-4 flex items-center gap-3">
          <Bookmark size={28} /> Quick Links & Resources
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {RESOURCES.map((res) => (
            <a
              key={res.name}
              href={res.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-4 bg-slate-800/30 rounded-lg border border-slate-700/50 hover:border-cyan-500/50 transition-all hover:bg-slate-800/50 group"
            >
              <div className="p-3 rounded-lg bg-slate-700/50 text-cyan-400 group-hover:scale-110 transition-transform">
                <res.icon size={24} />
              </div>
              <div>
                <h3 className="text-slate-200 font-medium group-hover:text-white transition-colors">
                  {res.name}
                </h3>
                <p className="text-xs text-slate-500">
                  {new URL(res.url).hostname}
                </p>
              </div>
              <ExternalLink
                size={16}
                className="ml-auto text-slate-600 group-hover:text-slate-400 transition-colors"
              />
            </a>
          ))}
        </div>
      </section>

      {/* Beginner Tips */}
      <section className="bg-slate-900/50 rounded-xl border border-blue-900/30 p-6">
        <h2 className="text-2xl font-bold text-blue-400 mb-4 flex items-center gap-3">
          <Info size={28} /> Beginner's Guide
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {BEGINNER_TIPS.map((tip, i) => (
            <div
              key={i}
              className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/50"
            >
              <h3 className="text-slate-200 font-medium flex items-center gap-2 mb-2">
                <span className="w-6 h-6 rounded-full bg-blue-600/30 text-blue-400 text-sm flex items-center justify-center font-bold">
                  {i + 1}
                </span>
                {tip.title}
              </h3>
              <p className="text-slate-400 text-sm">{tip.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Advanced Tips */}
      <section className="bg-slate-900/50 rounded-xl border border-amber-900/30 p-6">
        <h2 className="text-xl font-bold text-amber-400 mb-4 flex items-center gap-3">
          <Target size={24} /> Advanced Tips
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {ADVANCED_TIPS.map((section) => (
            <div
              key={section.category}
              className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/50"
            >
              <h3 className="text-slate-200 font-medium mb-3">{section.category}</h3>
              <ul className="space-y-2">
                {section.tips.map((tip, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-slate-400">
                    <span className="text-amber-400 mt-1">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Daily Activities */}
      <section className="bg-slate-900/50 rounded-xl border border-green-900/30 p-6">
        <h2 className="text-xl font-bold text-green-400 mb-4 flex items-center gap-3">
          <Clock size={24} /> Daily Activities
        </h2>
        <p className="text-slate-400 text-sm mb-4">
          Things to do each day to maximize your progress.
        </p>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {DAILY_ACTIVITIES.map((activity, idx) => {
            const priorityColors = {
              Essential: "bg-red-600/20 text-red-300 border-red-600/40",
              High: "bg-amber-600/20 text-amber-300 border-amber-600/40",
              Medium: "bg-cyan-600/20 text-cyan-300 border-cyan-600/40",
              Low: "bg-slate-600/20 text-slate-300 border-slate-600/40",
            };
            return (
              <div
                key={idx}
                className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/50"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-slate-200 font-medium">{activity.title}</h3>
                  <span
                    className={`text-xs px-2 py-0.5 rounded border ${priorityColors[activity.priority as keyof typeof priorityColors]}`}
                  >
                    {activity.priority}
                  </span>
                </div>
                <p className="text-slate-400 text-sm">{activity.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Useful Info */}
      <section className="bg-slate-900/50 rounded-xl border border-slate-700/30 p-6">
        <h2 className="text-lg font-bold text-slate-300 mb-4">
          Useful Information
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="bg-slate-800/30 rounded-lg p-4">
            <h3 className="text-cyan-400 font-medium mb-2">⏱️ Cetus Cycle</h3>
            <p className="text-slate-400 text-sm">
              150 minutes total: 100m Day, 50m Night. Eidolons spawn at night.
            </p>
          </div>
          <div className="bg-slate-800/30 rounded-lg p-4">
            <h3 className="text-cyan-400 font-medium mb-2">🌡️ Orb Vallis</h3>
            <p className="text-slate-400 text-sm">
              26m 40s total: 6m 40s Warm, 20m Cold. Some fish are
              weather-specific.
            </p>
          </div>
          <div className="bg-slate-800/30 rounded-lg p-4">
            <h3 className="text-cyan-400 font-medium mb-2">🔮 Cambion Drift</h3>
            <p className="text-slate-400 text-sm">
              150 minutes total: 100m Fass, 50m Vome. Affects Necramech spawns.
            </p>
          </div>
        </div>
      </section>

      {/* Progression Checklist */}
      <section className="bg-slate-900/50 rounded-xl border border-purple-900/30 p-6">
        <h2 className="text-2xl font-bold text-purple-400 mb-4 flex items-center gap-3">
          <Sword size={28} /> Progression Checklist
        </h2>
        <p className="text-slate-400 text-sm mb-4">
          Track your journey through Warframe's content. Click to mark as complete.
        </p>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Object.entries(milestonesByCategory).map(([category, milestones]) => (
            <div key={category} className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/50">
              <h3 className="text-slate-200 font-medium mb-3 flex items-center gap-2">
                <Shield size={16} className="text-purple-400" />
                {category} Game
              </h3>
              <div className="space-y-2">
                {milestones.map((milestone) => {
                  const isComplete = completedMilestones.has(milestone.id);
                  return (
                    <button
                      key={milestone.id}
                      onClick={() => toggleMilestone(milestone.id)}
                      className={`w-full flex items-center gap-2 p-2 rounded transition-all text-left text-sm ${isComplete
                        ? "bg-purple-900/20 text-purple-300"
                        : "hover:bg-slate-700/50 text-slate-400"
                        }`}
                    >
                      {isComplete ? (
                        <CheckCircle2 size={16} className="text-green-400 flex-shrink-0" />
                      ) : (
                        <Circle size={16} className="text-slate-500 flex-shrink-0" />
                      )}
                      <span className={isComplete ? "line-through opacity-70" : ""}>
                        {milestone.text}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <p className="text-center text-slate-500 text-sm mt-4">
          {completedMilestones.size} / {PROGRESSION_MILESTONES.length} milestones completed
        </p>
      </section>
    </div>
  );
}
