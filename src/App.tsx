import { useState, Suspense, lazy, useMemo } from "react";
import {
  Database,
  RefreshCw,
  Home,
  Book,
  Package,
  Star,
  Gem,
  Bookmark,
  Sun,
  Moon,
  Download,
  Upload,
  Keyboard,
  X,
  Search,
  Target,
  Users,
  Sword,
  Menu,
  MoreHorizontal,
  Sparkles,
  Bug,
  Wallet,
  Crosshair,
  Layers,
  Hexagon,
  BarChart3,
  Heart,
  Building2,
  ChevronDown,
  Settings,
} from "lucide-react";

import { useWorldState, useTickTimer } from "./hooks/useWorldState";
import {
  useKeyboardShortcuts,
  getShortcutsList,
} from "./hooks/useKeyboardShortcuts";
import { useTheme } from "./contexts/ThemeContext";
import { downloadUserData, triggerImportDialog } from "./utils/userData";
import {
  DashboardSkeleton,
  CodexSkeleton,
  MasterySkeleton,
  SectionSkeleton,
} from "./components/ui";
import { RelicDropTableModal } from "./components/relics/RelicDropTableModal";
import { DataManagement } from "./components/settings/DataManagement";
import type { TabName } from "./types";

// Lazy load view components for code-splitting
const DashboardView = lazy(() =>
  import("./components/dashboard/DashboardView").then((m) => ({
    default: m.DashboardView,
  })),
);
const CodexView = lazy(() =>
  import("./components/codex/CodexView").then((m) => ({
    default: m.CodexView,
  })),
);
const TrackerView = lazy(() =>
  import("./components/tracker/TrackerView").then((m) => ({
    default: m.TrackerView,
  })),
);
const MasteryView = lazy(() =>
  import("./components/mastery/MasteryView").then((m) => ({
    default: m.MasteryView,
  })),
);
const RelicsView = lazy(() =>
  import("./components/relics/RelicsView").then((m) => ({
    default: m.RelicsView,
  })),
);
const GuideView = lazy(() =>
  import("./components/guide/GuideView").then((m) => ({
    default: m.GuideView,
  })),
);
const FarmingView = lazy(() =>
  import("./components/farming/FarmingView").then((m) => ({
    default: m.FarmingView,
  })),
);
const SyndicateView = lazy(() =>
  import("./components/syndicate/SyndicateView").then((m) => ({
    default: m.SyndicateView,
  })),
);
const SteelPathView = lazy(() =>
  import("./components/steelpath/SteelPathView").then((m) => ({
    default: m.SteelPathView,
  })),
);
const FocusView = lazy(() =>
  import("./components/focus/FocusView").then((m) => ({
    default: m.FocusView,
  })),
);
const LichWeaponsView = lazy(() =>
  import("./components/lichweapons/LichWeaponsView").then((m) => ({
    default: m.LichWeaponsView,
  })),
);
const TradeView = lazy(() =>
  import("./components/trade/TradeView").then((m) => ({
    default: m.TradeView,
  })),
);
const RivenView = lazy(() =>
  import("./components/rivens/RivenView").then((m) => ({
    default: m.RivenView,
  })),
);
const BuildView = lazy(() =>
  import("./components/builds/BuildView").then((m) => ({
    default: m.BuildView,
  })),
);
const FormaView = lazy(() =>
  import("./components/forma/FormaView").then((m) => ({
    default: m.FormaView,
  })),
);
const StatsView = lazy(() =>
  import("./components/stats/StatsView").then((m) => ({
    default: m.StatsView,
  })),
);
const CompanionView = lazy(() =>
  import("./components/companions/CompanionView").then((m) => ({
    default: m.CompanionView,
  })),
);
const DojoView = lazy(() =>
  import("./components/dojo/DojoView").then((m) => ({
    default: m.DojoView,
  })),
);

// Primary tabs shown directly in navigation
const PRIMARY_TABS: { id: TabName; label: string; icon: typeof Home }[] = [
  { id: "dashboard", label: "Dashboard", icon: Home },
  { id: "codex", label: "Codex", icon: Book },
  { id: "tracker", label: "Tracker", icon: Package },
  { id: "mastery", label: "Mastery", icon: Star },
  { id: "relics", label: "Relics", icon: Gem },
  { id: "farming", label: "Farming", icon: Target },
  { id: "syndicates", label: "Syndicates", icon: Users },
  { id: "steelpath", label: "Steel Path", icon: Sword },
];

// Secondary tabs shown in "More" dropdown, grouped by category
const SECONDARY_TABS: { group: string; tabs: { id: TabName; label: string; icon: typeof Home }[] }[] = [
  {
    group: "Progress",
    tabs: [
      { id: "focus", label: "Focus Schools", icon: Sparkles },
      { id: "weapons", label: "Adversary Weapons", icon: Bug },
      { id: "companions", label: "Companions", icon: Heart },
      { id: "dojo", label: "Dojo Research", icon: Building2 },
    ],
  },
  {
    group: "Tools",
    tabs: [
      { id: "trade", label: "Trade Assistant", icon: Wallet },
      { id: "rivens", label: "Riven Calculator", icon: Crosshair },
      { id: "builds", label: "Build Planner", icon: Layers },
      { id: "forma", label: "Forma Planner", icon: Hexagon },
    ],
  },
  {
    group: "Info",
    tabs: [
      { id: "stats", label: "Statistics", icon: BarChart3 },
      { id: "guide", label: "New Player Guide", icon: Bookmark },
    ],
  },
];

// All tabs for reference
const ALL_TABS = [
  ...PRIMARY_TABS,
  ...SECONDARY_TABS.flatMap(g => g.tabs),
];

// Mobile bottom nav shows first 4 tabs + More
const MOBILE_TABS = PRIMARY_TABS.slice(0, 4);
const MORE_TABS = ALL_TABS.slice(4);

export default function OrdisApp() {
  const { worldState, error, refresh } = useWorldState();
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<TabName>("dashboard");
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showRelicDrops, setShowRelicDrops] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showMoreTabs, setShowMoreTabs] = useState(false);
  const [importMessage, setImportMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [showDataManagement, setShowDataManagement] = useState(false);

  // Trigger re-render every second for countdown timers
  useTickTimer(1000);

  // Define keyboard shortcuts
  const shortcuts = useMemo(
    () => [
      {
        key: "1",
        handler: () => setActiveTab("dashboard"),
        description: "Go to Dashboard",
      },
      {
        key: "2",
        handler: () => setActiveTab("codex"),
        description: "Go to Codex",
      },
      {
        key: "3",
        handler: () => setActiveTab("tracker"),
        description: "Go to Tracker",
      },
      {
        key: "4",
        handler: () => setActiveTab("mastery"),
        description: "Go to Mastery",
      },
      {
        key: "5",
        handler: () => setActiveTab("relics"),
        description: "Go to Relics",
      },
      {
        key: "6",
        handler: () => setActiveTab("farming"),
        description: "Go to Farming",
      },
      {
        key: "7",
        handler: () => setActiveTab("syndicates"),
        description: "Go to Syndicates",
      },
      {
        key: "8",
        handler: () => setActiveTab("steelpath"),
        description: "Go to Steel Path",
      },
      {
        key: "9",
        handler: () => setActiveTab("guide"),
        description: "Go to Guide",
      },
      { key: "r", handler: refresh, description: "Refresh data" },
    ],
    [refresh],
  );

  useKeyboardShortcuts(shortcuts);

  const handleImport = (result: { success: boolean; message: string }) => {
    setImportMessage({
      type: result.success ? "success" : "error",
      text: result.message,
    });
    if (result.success) {
      // Reload to apply imported data
      setTimeout(() => window.location.reload(), 1500);
    } else {
      setTimeout(() => setImportMessage(null), 3000);
    }
  };

  const renderActiveView = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <DashboardView
            worldState={worldState}
            error={error}
            onRetry={refresh}
          />
        );
      case "codex":
        return <CodexView />;
      case "tracker":
        return <TrackerView />;
      case "mastery":
        return <MasteryView />;
      case "relics":
        return <RelicsView fissures={worldState?.fissures || []} />;
      case "farming":
        return <FarmingView fissures={worldState?.fissures || []} />;
      case "syndicates":
        return <SyndicateView />;
      case "steelpath":
        return <SteelPathView />;
      case "focus":
        return <FocusView />;
      case "weapons":
        return <LichWeaponsView />;
      case "trade":
        return <TradeView />;
      case "rivens":
        return <RivenView />;
      case "builds":
        return <BuildView />;
      case "forma":
        return <FormaView />;
      case "stats":
        return <StatsView />;
      case "companions":
        return <CompanionView />;
      case "dojo":
        return <DojoView />;
      case "guide":
        return <GuideView />;
      default:
        return null;
    }
  };

  // Get view-specific skeleton based on active tab
  const getLoadingSkeleton = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardSkeleton />;
      case "codex":
      case "tracker":
      case "farming":
        return <CodexSkeleton />;
      case "mastery":
        return <MasterySkeleton />;
      default:
        return <SectionSkeleton />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="bg-cyan-500/10 p-1.5 sm:p-2 rounded-lg border border-cyan-500/20">
                <Database className="text-cyan-400" size={20} />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                  ORDIS
                </h1>
                <span className="text-[10px] text-slate-500 uppercase tracking-widest hidden sm:block">
                  Tactical Companion
                </span>
              </div>
            </div>

            {/* Desktop Header Actions */}
            <div className="hidden md:flex items-center gap-2">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
                title="Toggle theme (T)"
              >
                {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
              </button>

              {/* Relic Drop Table */}
              <button
                onClick={() => setShowRelicDrops(true)}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                aria-label="Relic drop tables"
                title="Relic drop tables"
              >
                <Search size={20} />
              </button>

              {/* Export Button */}
              <button
                onClick={downloadUserData}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                aria-label="Export user data"
                title="Export data"
              >
                <Download size={20} />
              </button>

              {/* Import Button */}
              <button
                onClick={() => triggerImportDialog(handleImport)}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                aria-label="Import user data"
                title="Import data"
              >
                <Upload size={20} />
              </button>

              {/* Keyboard Shortcuts */}
              <button
                onClick={() => setShowShortcuts((s) => !s)}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                aria-label="Show keyboard shortcuts"
                title="Keyboard shortcuts (?)"
              >
                <Keyboard size={20} />
              </button>

              {/* Settings/Data Management */}
              <button
                onClick={() => setShowDataManagement(true)}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                aria-label="Settings and Data Management"
                title="Settings & Data"
              >
                <Settings size={20} />
              </button>

              {/* Auto-updating indicator */}
              <div className="flex items-center gap-2 text-slate-400 text-sm ml-2">
                <RefreshCw
                  size={14}
                  className="animate-spin"
                  style={{ animationDuration: "15s" }}
                />
                <span>Auto-updating</span>
              </div>
            </div>

            {/* Mobile Header Actions */}
            <div className="flex md:hidden items-center gap-1">
              {/* Theme Toggle - always visible */}
              <button
                onClick={toggleTheme}
                className="btn-icon-mobile text-slate-400 hover:text-slate-200"
                aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
              >
                {theme === "dark" ? <Sun size={22} /> : <Moon size={22} />}
              </button>

              {/* Relic Search - always visible */}
              <button
                onClick={() => setShowRelicDrops(true)}
                className="btn-icon-mobile text-slate-400 hover:text-slate-200"
                aria-label="Relic drop tables"
              >
                <Search size={22} />
              </button>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setShowMobileMenu(true)}
                className="btn-icon-mobile text-slate-400 hover:text-slate-200"
                aria-label="Open menu"
              >
                <Menu size={22} />
              </button>
            </div>
          </div>
        </div>

        {/* Desktop Tab Navigation */}
        <div className="hidden md:block max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-800/50">
          <nav
            className="flex items-center -mb-px"
            role="tablist"
          >
            {PRIMARY_TABS.map((tab, idx) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-controls={`${tab.id}-panel`}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id
                  ? "border-cyan-500 text-cyan-400"
                  : "border-transparent text-slate-500 hover:text-slate-300 hover:border-slate-700"
                  }`}
              >
                <tab.icon size={18} />
                <span>{tab.label}</span>
                <span className="text-[10px] text-slate-600">({idx + 1})</span>
              </button>
            ))}

            {/* More Dropdown */}
            <div className="relative ml-auto">
              <button
                onClick={() => setShowMoreTabs(!showMoreTabs)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${SECONDARY_TABS.flatMap(g => g.tabs).some(t => t.id === activeTab)
                  ? "border-cyan-500 text-cyan-400"
                  : "border-transparent text-slate-500 hover:text-slate-300 hover:border-slate-700"
                  }`}
              >
                <ChevronDown size={18} className={`transition-transform ${showMoreTabs ? "rotate-180" : ""}`} />
                <span>More</span>
              </button>

              {/* Dropdown Menu */}
              {showMoreTabs && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowMoreTabs(false)}
                  />
                  <div className="absolute right-0 top-full mt-1 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden">
                    {SECONDARY_TABS.map((group, gIdx) => (
                      <div key={group.group}>
                        {gIdx > 0 && <div className="border-t border-slate-700" />}
                        <div className="px-3 py-1.5 text-xs text-slate-500 uppercase tracking-wider bg-slate-800/50">
                          {group.group}
                        </div>
                        {group.tabs.map(tab => (
                          <button
                            key={tab.id}
                            onClick={() => {
                              setActiveTab(tab.id);
                              setShowMoreTabs(false);
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors ${activeTab === tab.id
                              ? "bg-cyan-900/30 text-cyan-400"
                              : "text-slate-300 hover:bg-slate-800"
                              }`}
                          >
                            <tab.icon size={16} />
                            <span>{tab.label}</span>
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </nav>
        </div>
      </header>

      {/* Import Message Toast */}
      {importMessage && (
        <div
          className={`fixed top-20 right-4 z-50 px-4 py-3 rounded-lg shadow-lg ${importMessage.type === "success" ? "bg-green-900 text-green-200" : "bg-red-900 text-red-200"}`}
        >
          {importMessage.text}
        </div>
      )}

      {/* Keyboard Shortcuts Modal */}
      {showShortcuts && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => setShowShortcuts(false)}
        >
          <div
            className="bg-slate-900 border border-slate-700 rounded-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-cyan-400">
                Keyboard Shortcuts
              </h2>
              <button
                onClick={() => setShowShortcuts(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-2">
              {getShortcutsList(shortcuts).map((s, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-2 border-b border-slate-800 last:border-0"
                >
                  <span className="text-slate-300">{s.description}</span>
                  <kbd className="px-2 py-1 bg-slate-800 text-slate-400 rounded text-sm font-mono">
                    {s.keys}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Data Management Modal */}
      {showDataManagement && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => setShowDataManagement(false)}
        >
          <div
            className="bg-slate-900 border border-slate-700 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-slate-900 border-b border-slate-700 p-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-cyan-400 flex items-center gap-2">
                <Settings size={20} /> Settings & Data
              </h2>
              <button
                onClick={() => setShowDataManagement(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4">
              <DataManagement onClose={() => setShowDataManagement(false)} />
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-24 md:pb-8">
        <Suspense fallback={getLoadingSkeleton()}>
          {renderActiveView()}
        </Suspense>
      </main>

      {/* Footer - hidden on mobile due to bottom nav */}
      <footer className="hidden md:block border-t border-slate-900 bg-slate-950 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 md:gap-4 text-sm text-slate-600">
            {/* Left: Copyright */}
            <div className="order-3 md:order-1 whitespace-nowrap">
              &copy; {new Date().getFullYear()}{" "}
              <a
                href="https://crithitstudio.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-cyan-400 transition-colors"
              >
                CritHit Studio
              </a>
              <span className="mx-2">•</span>
              <a
                href="https://github.com/Crithit-Studio/ordis-companion/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-500 hover:text-red-400 transition-colors"
                title="Report a bug"
              >
                Report Bug
              </a>
            </div>

            {/* Center: Credits */}
            <div className="order-1 md:order-2 text-center flex-1 mx-4">
              <p>
                Data from the{" "}
                <a
                  href="https://www.warframe.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-500 hover:text-cyan-400 underline"
                >
                  Official Warframe API
                </a>
                . Item data from{" "}
                <a
                  href="https://github.com/WFCD/warframe-items"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-500 hover:text-cyan-400 underline"
                >
                  WFCD warframe-items
                </a>
                .
              </p>
              <p className="text-slate-700 text-xs mt-1">
                Fan-made tool. Warframe is a registered trademark of{" "}
                <a
                  href="https://www.digitalextremes.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-500 hover:text-slate-400 underline"
                >
                  Digital Extremes Ltd
                </a>
              </p>
            </div>

            {/* Right: Attribution */}
            <div className="order-2 md:order-3 whitespace-nowrap">
              Made with ❤️ by Joé from{" "}
              <a
                href="https://github.com/crithitstudio"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-500 hover:text-cyan-400 transition-colors"
              >
                CritHit Studio
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bottom-nav border-t border-slate-800">
        <div className="flex items-center justify-around h-16">
          {MOBILE_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`bottom-nav-item flex-1 ${activeTab === tab.id ? "active text-cyan-400" : "text-slate-500"}`}
              aria-label={tab.label}
            >
              <tab.icon size={22} />
              <span>{tab.label}</span>
            </button>
          ))}
          {/* More Button */}
          <button
            onClick={() => setShowMoreTabs(true)}
            className={`bottom-nav-item flex-1 ${MORE_TABS.some((t) => t.id === activeTab) ? "active text-cyan-400" : "text-slate-500"}`}
            aria-label="More tabs"
          >
            <MoreHorizontal size={22} />
            <span>More</span>
          </button>
        </div>
      </nav>

      {/* Mobile Menu Drawer */}
      {showMobileMenu && (
        <div
          className="fixed inset-0 z-50 mobile-menu-overlay"
          onClick={() => setShowMobileMenu(false)}
        >
          <div
            className="absolute bottom-0 left-0 right-0 bg-slate-900 mobile-drawer"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1 bg-slate-700 rounded-full" />
            </div>

            <div className="p-4 space-y-2">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Settings & Tools
              </h3>

              {/* Export */}
              <button
                onClick={() => {
                  downloadUserData();
                  setShowMobileMenu(false);
                }}
                className="flex items-center gap-3 w-full p-3 rounded-lg text-slate-200 hover:bg-slate-800 transition-colors"
              >
                <Download size={20} className="text-slate-400" />
                <span>Export Data</span>
              </button>

              {/* Import */}
              <button
                onClick={() => {
                  triggerImportDialog(handleImport);
                  setShowMobileMenu(false);
                }}
                className="flex items-center gap-3 w-full p-3 rounded-lg text-slate-200 hover:bg-slate-800 transition-colors"
              >
                <Upload size={20} className="text-slate-400" />
                <span>Import Data</span>
              </button>

              {/* Keyboard Shortcuts - desktop only info */}
              <button
                onClick={() => {
                  setShowShortcuts(true);
                  setShowMobileMenu(false);
                }}
                className="flex items-center gap-3 w-full p-3 rounded-lg text-slate-200 hover:bg-slate-800 transition-colors"
              >
                <Keyboard size={20} className="text-slate-400" />
                <span>Keyboard Shortcuts</span>
              </button>

              {/* Data Management / AlecaFrame */}
              <button
                onClick={() => {
                  setShowDataManagement(true);
                  setShowMobileMenu(false);
                }}
                className="flex items-center gap-3 w-full p-3 rounded-lg text-slate-200 hover:bg-slate-800 transition-colors"
              >
                <Settings size={20} className="text-slate-400" />
                <span>Data Management</span>
              </button>

              {/* Auto-updating indicator */}
              <div className="flex items-center gap-3 p-3 text-slate-400">
                <RefreshCw
                  size={20}
                  className="animate-spin"
                  style={{ animationDuration: "15s" }}
                />
                <span>Auto-updating enabled</span>
              </div>
            </div>

            {/* Attribution for mobile */}
            <div className="p-4 pt-2 border-t border-slate-800 text-center text-xs text-slate-600">
              Made with ❤️ by{" "}
              <a
                href="https://crithitstudio.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-500"
              >
                CritHit Studio
              </a>
            </div>
          </div>
        </div>
      )}

      {/* More Tabs Drawer */}
      {showMoreTabs && (
        <div
          className="fixed inset-0 z-50 mobile-menu-overlay"
          onClick={() => setShowMoreTabs(false)}
        >
          <div
            className="absolute bottom-0 left-0 right-0 bg-slate-900 mobile-drawer"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1 bg-slate-700 rounded-full" />
            </div>

            <div className="p-4 space-y-1">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
                More Views
              </h3>

              {MORE_TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setShowMoreTabs(false);
                  }}
                  className={`flex items-center gap-3 w-full p-3 rounded-lg transition-colors ${activeTab === tab.id
                    ? "bg-cyan-900/30 text-cyan-400"
                    : "text-slate-200 hover:bg-slate-800"
                    }`}
                >
                  <tab.icon
                    size={20}
                    className={
                      activeTab === tab.id ? "text-cyan-400" : "text-slate-400"
                    }
                  />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Relic Drop Table Modal */}
      <RelicDropTableModal
        isOpen={showRelicDrops}
        onClose={() => setShowRelicDrops(false)}
      />
    </div>
  );
}
