import {
  Home,
  Book,
  Info,
  Diamond,
  Radio,
  Target,
  Bookmark,
  ExternalLink,
} from "lucide-react";

const RESOURCES = [
  {
    name: "Official Warframe Website",
    url: "https://www.warframe.com",
    icon: Home,
    color: "cyan",
  },
  {
    name: "Official Warframe Wiki",
    url: "https://wiki.warframe.com",
    icon: Book,
    color: "orange",
  },
  {
    name: "Official Forums",
    url: "https://forums.warframe.com",
    icon: Info,
    color: "blue",
  },
  {
    name: "Warframe Drops",
    url: "https://www.warframe.com/droptables",
    icon: Diamond,
    color: "purple",
  },
  {
    name: "Reddit r/Warframe",
    url: "https://www.reddit.com/r/Warframe",
    icon: Radio,
    color: "orange",
  },
  {
    name: "Overframe (Builds)",
    url: "https://overframe.gg",
    icon: Target,
    color: "green",
  },
];

const BEGINNER_TIPS = [
  {
    title: "Complete the Star Chart",
    desc: "Unlocking all nodes gives you access to more missions and resources.",
  },
  {
    title: "Join a Clan",
    desc: "Clans provide access to exclusive weapons, Warframes, and helpful players.",
  },
  {
    title: "Upgrade Your Mods",
    desc: "Mods are more important than weapons or Warframes. Prioritize ranking up essential mods.",
  },
  {
    title: "Farm Prime Parts",
    desc: "Open Void Relics to get Prime parts. Sell duplicates for Platinum in trade chat.",
  },
  {
    title: "Do Nightwave",
    desc: "Complete Nightwave challenges for free rewards including slots, forma, and cosmetics.",
  },
  {
    title: "Check Baro Ki'Teer",
    desc: "The Void Trader appears every 2 weeks with exclusive items. Save your Ducats!",
  },
];

export function GuideView() {
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
    </div>
  );
}
