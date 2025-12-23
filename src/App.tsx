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
} from "lucide-react";

import { useWorldState, useTickTimer } from "./hooks/useWorldState";
import {
  useKeyboardShortcuts,
  getShortcutsList,
} from "./hooks/useKeyboardShortcuts";
import { useTheme } from "./contexts/ThemeContext";
import { downloadUserData, triggerImportDialog } from "./utils/userData";
import { LoadingSpinner } from "./components/ui";
import { RelicDropTableModal } from "./components/relics/RelicDropTableModal";
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

const TABS: { id: TabName; label: string; icon: typeof Home }[] = [
  { id: "dashboard", label: "Dashboard", icon: Home },
  { id: "codex", label: "Codex", icon: Book },
  { id: "tracker", label: "Tracker", icon: Package },
  { id: "mastery", label: "Mastery", icon: Star },
  { id: "relics", label: "Relics", icon: Gem },
  { id: "farming", label: "Farming", icon: Target },
  { id: "syndicates", label: "Syndicates", icon: Users },
  { id: "steelpath", label: "Steel Path", icon: Sword },
  { id: "guide", label: "Guide", icon: Bookmark },
];

// Mobile bottom nav shows first 4 tabs + More
const MOBILE_TABS = TABS.slice(0, 4);
const MORE_TABS = TABS.slice(4);

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
        return <RelicsView />;
      case "farming":
        return <FarmingView fissures={worldState?.fissures || []} />;
      case "syndicates":
        return <SyndicateView />;
      case "steelpath":
        return <SteelPathView />;
      case "guide":
        return <GuideView />;
      default:
        return null;
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
            className="flex overflow-x-auto scrollbar-hide -mb-px"
            role="tablist"
          >
            {TABS.map((tab, idx) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-controls={`${tab.id}-panel`}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-cyan-500 text-cyan-400"
                    : "border-transparent text-slate-500 hover:text-slate-300 hover:border-slate-700"
                }`}
              >
                <tab.icon size={18} />
                <span>{tab.label}</span>
                <span className="text-[10px] text-slate-600">({idx + 1})</span>
              </button>
            ))}
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

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-24 md:pb-8">
        <Suspense fallback={<LoadingSpinner message="Loading view..." />}>
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
                  className={`flex items-center gap-3 w-full p-3 rounded-lg transition-colors ${
                    activeTab === tab.id
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
