/**
 * Statistics Dashboard
 * Aggregate user progress stats across all trackers
 */
import { useState, useMemo } from "react";
import {
    BarChart3,
    TrendingUp,
    Award,
    Clock,
    Target,
    Zap,
    RefreshCw
} from "lucide-react";

interface StatCategory {
    name: string;
    items: number;
    completed: number;
    icon: typeof BarChart3;
    color: string;
}

// Load data from various localStorage keys
function loadStats(): StatCategory[] {
    const stats: StatCategory[] = [];

    // Mastery Progress
    try {
        const mastered = localStorage.getItem("ordis-mastered-items");
        const masteredSet = mastered ? JSON.parse(mastered) : [];
        stats.push({
            name: "Mastery Items",
            items: 600, // Approximate total
            completed: Array.isArray(masteredSet) ? masteredSet.length : 0,
            icon: Award,
            color: "text-yellow-400",
        });
    } catch {
        stats.push({ name: "Mastery Items", items: 600, completed: 0, icon: Award, color: "text-yellow-400" });
    }

    // Focus Schools
    try {
        const focus = localStorage.getItem("ordis-focus-unlocked");
        const focusSet = focus ? JSON.parse(focus) : [];
        stats.push({
            name: "Focus Abilities",
            items: 50,
            completed: Array.isArray(focusSet) ? focusSet.length : 0,
            icon: Zap,
            color: "text-cyan-400",
        });
    } catch {
        stats.push({ name: "Focus Abilities", items: 50, completed: 0, icon: Zap, color: "text-cyan-400" });
    }

    // Weapons (Lich)
    try {
        const weapons = localStorage.getItem("ordis-lich-weapons");
        const weaponData = weapons ? JSON.parse(weapons) : {};
        const owned = Object.values(weaponData).filter((w: unknown) => {
            const weapon = w as { owned?: boolean };
            return weapon && weapon.owned;
        }).length;
        stats.push({
            name: "Adversary Weapons",
            items: 45,
            completed: owned,
            icon: Target,
            color: "text-red-400",
        });
    } catch {
        stats.push({ name: "Adversary Weapons", items: 45, completed: 0, icon: Target, color: "text-red-400" });
    }

    // Builds
    try {
        const builds = localStorage.getItem("ordis-builds");
        const buildList = builds ? JSON.parse(builds) : [];
        stats.push({
            name: "Saved Builds",
            items: 20, // Target
            completed: Array.isArray(buildList) ? buildList.length : 0,
            icon: BarChart3,
            color: "text-emerald-400",
        });
    } catch {
        stats.push({ name: "Saved Builds", items: 20, completed: 0, icon: BarChart3, color: "text-emerald-400" });
    }

    // Trades
    try {
        const trades = localStorage.getItem("ordis-trades");
        const tradeData = trades ? JSON.parse(trades) : { trades: [] };
        stats.push({
            name: "Trades Logged",
            items: 100, // Target
            completed: Array.isArray(tradeData.trades) ? tradeData.trades.length : 0,
            icon: TrendingUp,
            color: "text-blue-400",
        });
    } catch {
        stats.push({ name: "Trades Logged", items: 100, completed: 0, icon: TrendingUp, color: "text-blue-400" });
    }

    return stats;
}

export function StatsView() {
    const [stats, setStats] = useState<StatCategory[]>(loadStats);
    const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

    const refresh = () => {
        setStats(loadStats());
        setLastRefresh(new Date());
    };

    // Overall progress
    const overall = useMemo(() => {
        const totalItems = stats.reduce((sum, s) => sum + s.items, 0);
        const totalCompleted = stats.reduce((sum, s) => sum + s.completed, 0);
        const percentage = totalItems > 0 ? Math.round((totalCompleted / totalItems) * 100) : 0;
        return { totalItems, totalCompleted, percentage };
    }, [stats]);

    // Recent activity (mock - would need timestamp tracking)
    const recentActivity = useMemo(() => [
        { action: "App loaded", time: "Just now" },
        { action: "Stats refreshed", time: lastRefresh.toLocaleTimeString() },
    ], [lastRefresh]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <section className="bg-gradient-to-r from-indigo-900/30 to-slate-900/50 rounded-xl border border-indigo-700/30 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-indigo-400 flex items-center gap-3">
                        <BarChart3 size={28} /> Statistics Dashboard
                    </h2>
                    <button
                        onClick={refresh}
                        className="p-2 bg-slate-800/50 rounded-lg hover:bg-slate-700/50 transition-colors"
                        title="Refresh stats"
                    >
                        <RefreshCw size={18} className="text-slate-400" />
                    </button>
                </div>

                {/* Overall Progress */}
                <div className="bg-slate-800/50 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-slate-400">Overall Progress</span>
                        <span className="text-2xl font-bold text-indigo-300">{overall.percentage}%</span>
                    </div>
                    <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-indigo-600 to-purple-500 transition-all duration-500"
                            style={{ width: `${overall.percentage}%` }}
                        />
                    </div>
                    <div className="mt-2 text-sm text-slate-500 text-center">
                        {overall.totalCompleted.toLocaleString()} / {overall.totalItems.toLocaleString()} items tracked
                    </div>
                </div>
            </section>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {stats.map(stat => {
                    const Icon = stat.icon;
                    const percentage = stat.items > 0 ? Math.round((stat.completed / stat.items) * 100) : 0;

                    return (
                        <div
                            key={stat.name}
                            className="bg-slate-900/50 rounded-xl border border-slate-700/30 p-4"
                        >
                            <div className="flex items-center gap-3 mb-3">
                                <div className={`p-2 rounded-lg bg-slate-800 ${stat.color}`}>
                                    <Icon size={20} />
                                </div>
                                <div className="flex-1">
                                    <div className="font-medium text-slate-200">{stat.name}</div>
                                    <div className="text-sm text-slate-500">
                                        {stat.completed} / {stat.items}
                                    </div>
                                </div>
                                <div className={`text-xl font-bold ${stat.color}`}>
                                    {percentage}%
                                </div>
                            </div>
                            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                                <div
                                    className={`h-full transition-all duration-500 ${percentage >= 75 ? "bg-green-500" :
                                            percentage >= 50 ? "bg-yellow-500" :
                                                percentage >= 25 ? "bg-orange-500" : "bg-red-500"
                                        }`}
                                    style={{ width: `${percentage}%` }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Recent Activity */}
            <div className="bg-slate-900/50 rounded-xl border border-slate-700/30 p-4">
                <h3 className="font-bold text-slate-300 mb-3 flex items-center gap-2">
                    <Clock size={16} /> Recent Activity
                </h3>
                <div className="space-y-2">
                    {recentActivity.map((activity, i) => (
                        <div key={i} className="flex items-center justify-between text-sm py-2 border-b border-slate-700/50 last:border-0">
                            <span className="text-slate-300">{activity.action}</span>
                            <span className="text-slate-500">{activity.time}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Tips */}
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-4">
                <h3 className="font-bold text-slate-300 mb-2">💡 Tips</h3>
                <ul className="text-sm text-slate-400 space-y-1">
                    <li>• Stats are calculated from your saved data in the app</li>
                    <li>• Click refresh to update stats after making changes</li>
                    <li>• Use the various trackers to increase your completion percentage</li>
                </ul>
            </div>
        </div>
    );
}
