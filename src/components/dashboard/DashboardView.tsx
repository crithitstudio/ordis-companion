import { useState } from 'react';
import {
    Clock,
    Sun,
    Moon,
    Flame,
    Skull,
    Crosshair,
    Droplets,
    Swords,
    Diamond,
    Radio,
    Target,
    Bell,
    ShoppingCart,
    Gem,
    Check,
    AlertTriangle,
    RefreshCw
} from 'lucide-react';

import { CycleCard, ErrorDisplay, LoadingSpinner } from '../ui';
import { ItemDetailModal } from '../codex/ItemDetailModal';
import { useLocalStorageSet } from '../../hooks/useLocalStorage';
import { getCetusCycle, getVallisCycle, getCambionCycle, getEarthCycle } from '../../utils/cycles';
import type { WorldState, Fissure, Invasion, NightwaveChallenge, Alert } from '../../types';

interface DashboardViewProps {
    worldState: WorldState | null;
    error: string | null;
    onRetry: () => void;
}

export function DashboardView({ worldState, error, onRetry }: DashboardViewProps) {
    const [completedIds, updateCompletedIds] = useLocalStorageSet<string>('ordis-completed');
    const [selectedItemForDetails, setSelectedItemForDetails] = useState<string | null>(null);

    const toggleCompleted = (id: string) => {
        updateCompletedIds((prev) => {
            const updated = new Set(prev);
            const match = id.match(/^(archon|sortie)-(.+)-(\d+)$/);

            if (updated.has(id)) {
                // Unchecking - also uncheck all LATER stages
                updated.delete(id);
                if (match) {
                    const [, type, boss, stageStr] = match;
                    const stage = parseInt(stageStr);
                    for (let i = stage + 1; i <= 3; i++) {
                        updated.delete(`${type}-${boss}-${i}`);
                    }
                }
            } else {
                // Checking - also check all PREVIOUS stages
                updated.add(id);
                if (match) {
                    const [, type, boss, stageStr] = match;
                    const stage = parseInt(stageStr);
                    for (let i = 0; i < stage; i++) {
                        updated.add(`${type}-${boss}-${i}`);
                    }
                }
            }
            return updated;
        });
    };

    const isCompleted = (id: string) => completedIds.has(id);

    if (error) {
        return <ErrorDisplay title="Connection Disrupted" message={error} onRetry={onRetry} retryLabel="Retry Connection" />;
    }

    if (!worldState) {
        return <LoadingSpinner message="ESTABLISHING LINK..." />;
    }

    const fissures = worldState.fissures || [];
    const sortie = worldState.sortie;
    const invasions = worldState.invasions || [];
    const voidTrader = worldState.voidTrader;
    const nightwave = worldState.nightwave || [];
    const archonHunt = worldState.archonHunt;
    const alerts = worldState.alerts || [];
    const darvoDeal = worldState.darvoDeal;

    // Recalculate cycles on each render for live countdown
    const earth = getEarthCycle();
    const vallis = getVallisCycle();
    const cetus = getCetusCycle();
    const cambion = getCambionCycle();

    // Defensive checks
    if (!cetus || !vallis || !cambion || !earth) {
        return (
            <div className="p-8 flex flex-col items-center justify-center text-center space-y-4 bg-slate-900/50 rounded-xl border border-yellow-900/30">
                <div className="text-yellow-500 font-bold text-lg flex items-center gap-2">
                    <AlertTriangle size={24} /> Partial Data Received
                </div>
                <p className="text-slate-400 max-w-md">
                    The Cephalon uplink returned incomplete cycle data. The API may be updating.
                </p>
                <button
                    onClick={onRetry}
                    className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm mt-2 transition-colors"
                >
                    <RefreshCw size={16} /> Force Refresh
                </button>
            </div>
        );
    }

    const sortedFissures = [...fissures].sort((a, b) => b.tierNum - a.tierNum);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Cycles Grid */}
            <section>
                <h2 className="text-xl font-bold text-slate-200 mb-4 flex items-center gap-2">
                    <Clock className="text-cyan-400" /> Planetary Cycles
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <CycleCard
                        title="Cetus / Plains"
                        state={cetus.state?.toUpperCase() || 'UNKNOWN'}
                        subState={cetus.isDay ? 'Day' : 'Night'}
                        timeLeft={cetus.timeLeft}
                        icon={cetus.isDay ? Sun : Moon}
                        colorClass={cetus.isDay ? 'text-yellow-500' : 'text-indigo-400'}
                    />
                    <CycleCard
                        title="Orb Vallis"
                        state={vallis.state?.toUpperCase() || 'UNKNOWN'}
                        subState={vallis.isWarm ? 'Warm' : 'Cold'}
                        timeLeft={vallis.timeLeft}
                        icon={Flame}
                        colorClass={vallis.isWarm ? 'text-orange-500' : 'text-blue-400'}
                    />
                    <CycleCard
                        title="Cambion Drift"
                        state={cambion.active?.toUpperCase() || 'UNKNOWN'}
                        timeLeft={cambion.timeLeft}
                        icon={Skull}
                        colorClass={cambion.active === 'fass' ? 'text-orange-600' : 'text-cyan-600'}
                    />
                    <CycleCard
                        title="Earth"
                        state={earth.state?.toUpperCase() || 'UNKNOWN'}
                        subState={earth.isDay ? 'Day' : 'Night'}
                        timeLeft={earth.timeLeft}
                        icon={earth.isDay ? Sun : Moon}
                        colorClass={earth.isDay ? 'text-green-500' : 'text-emerald-800'}
                    />
                </div>
            </section>

            {/* Baro Ki'Teer & Darvo Deals Row */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {voidTrader && (
                    <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 shadow-lg">
                        <h2 className="text-lg font-bold text-amber-400 mb-3 flex items-center gap-2">
                            <Diamond size={20} /> Baro Ki'Teer
                        </h2>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400">Location:</span>
                                <span className="text-slate-200 font-medium">{voidTrader.location}</span>
                            </div>
                            {voidTrader.active ? (
                                <div className="bg-green-900/30 border border-green-700/50 rounded p-3 text-center">
                                    <span className="text-green-400 font-bold">ACTIVE NOW</span>
                                    <div className="text-slate-400 text-sm mt-1">Leaves in: {voidTrader.endString}</div>
                                </div>
                            ) : (
                                <div className="bg-slate-900/50 border border-slate-700/50 rounded p-3 text-center">
                                    <span className="text-slate-300">Arrives in:</span>
                                    <div className="text-amber-400 font-bold text-lg">{voidTrader.startString}</div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {darvoDeal && (
                    <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 shadow-lg">
                        <h2 className="text-lg font-bold text-green-400 mb-3 flex items-center gap-2">
                            <ShoppingCart size={20} /> Darvo's Deal
                        </h2>
                        <div className="space-y-2">
                            <button
                                onClick={() => setSelectedItemForDetails(darvoDeal.item)}
                                className="text-slate-200 font-medium text-lg hover:text-cyan-400 transition-colors cursor-pointer underline decoration-dotted underline-offset-4"
                            >
                                {darvoDeal.item}
                            </button>
                            <div className="flex items-center gap-2">
                                <span className="line-through text-slate-500 flex items-center">{darvoDeal.originalPrice}<Gem className="w-3 h-3 ml-0.5 inline opacity-60 text-cyan-500" /></span>
                                <span className="text-green-400 font-bold text-xl flex items-center gap-1">
                                    {darvoDeal.salePrice}
                                    <Gem className="w-5 h-5 text-cyan-400" />
                                </span>
                                <span className="bg-green-900/50 text-green-300 px-2 py-0.5 rounded text-sm font-bold">
                                    -{darvoDeal.discount}%
                                </span>
                            </div>
                            <div className="flex justify-between text-sm text-slate-400">
                                <span>Stock: {darvoDeal.stock - darvoDeal.sold} / {darvoDeal.stock}</span>
                                <span>{darvoDeal.eta}</span>
                            </div>
                        </div>
                    </div>
                )}
            </section>

            {/* Archon Hunt */}
            {archonHunt && (
                <section className="bg-slate-800/60 border border-slate-700 rounded-xl overflow-hidden shadow-lg relative">
                    <div className="bg-gradient-to-r from-red-900/50 to-slate-800/80 p-4 border-b border-red-700/30 flex justify-between items-center relative z-10">
                        <h2 className="text-lg font-bold text-red-400 flex items-center gap-2">
                            <Target size={20} /> Archon Hunt: {archonHunt.boss}
                        </h2>
                        <span className="text-slate-400 text-sm font-mono">{archonHunt.eta} remaining</span>
                    </div>
                    <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                        {archonHunt.missions.map((mission, idx) => {
                            const missionId = `archon-${archonHunt.boss}-${idx}`;
                            const completed = isCompleted(missionId);
                            return (
                                <div
                                    key={idx}
                                    className={`bg-slate-900/50 p-3 rounded border transition-colors cursor-pointer ${completed ? 'border-green-600/50 bg-green-900/10' : 'border-slate-700/50 hover:border-red-500/50'}`}
                                    onClick={() => toggleCompleted(missionId)}
                                >
                                    <div className="flex items-center gap-2">
                                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${completed ? 'bg-green-600 border-green-600' : 'border-slate-500'}`}>
                                            {completed && <Check size={14} className="text-white" />}
                                        </div>
                                        <div className="flex-1">
                                            <span className="text-red-500/80 font-bold text-xs uppercase">Stage {idx + 1}</span>
                                            <div className={`font-medium ${completed ? 'text-slate-400 line-through' : 'text-slate-200'}`}>{mission.missionType}</div>
                                            <div className={`text-sm ${completed ? 'text-slate-500' : 'text-slate-400'}`}>{mission.node}</div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}

            {/* Sortie Section */}
            {sortie && (
                <section className="bg-slate-800/60 border border-slate-700 rounded-xl overflow-hidden shadow-lg relative">
                    <div className="bg-gradient-to-r from-yellow-900/50 to-slate-800/80 p-4 border-b border-yellow-700/30 flex justify-between items-center relative z-10">
                        <h2 className="text-lg font-bold text-yellow-500 flex items-center gap-2">
                            <Crosshair size={20} /> Sortie: {sortie.faction}
                        </h2>
                        <span className="text-slate-400 text-sm font-mono">{sortie.eta} remaining</span>
                    </div>
                    <div className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="col-span-1 md:col-span-3 text-center mb-2">
                                <span className="text-slate-400 text-sm">Boss:</span>
                                <span className="text-slate-200 font-bold ml-2 text-lg">{sortie.boss}</span>
                            </div>
                            {sortie.variants.map((mission, idx) => {
                                const missionId = `sortie-${sortie.boss}-${idx}`;
                                const completed = isCompleted(missionId);
                                return (
                                    <div
                                        key={idx}
                                        className={`bg-slate-900/50 p-3 rounded border flex flex-col gap-1 relative overflow-hidden cursor-pointer transition-colors ${completed ? 'border-green-600/50 bg-green-900/10' : 'border-slate-700/50 hover:border-yellow-500/50'}`}
                                        onClick={() => toggleCompleted(missionId)}
                                    >
                                        <div className="absolute top-0 right-0 p-1">
                                            <span className="text-[10px] text-slate-600 font-mono">0{idx + 1}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${completed ? 'bg-green-600 border-green-600' : 'border-slate-500'}`}>
                                                {completed && <Check size={14} className="text-white" />}
                                            </div>
                                            <div className="flex-1">
                                                <span className="text-yellow-500/80 font-bold text-xs uppercase">Mission {idx + 1}</span>
                                                <div className={`font-medium ${completed ? 'text-slate-400 line-through' : 'text-slate-200'}`}>{mission.missionType} - {mission.node}</div>
                                                <div className={`text-xs italic ${completed ? 'text-slate-500' : 'text-slate-400'}`}>{mission.modifier}</div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>
            )}

            {/* Nightwave Challenges */}
            {nightwave.length > 0 && (
                <section>
                    <h2 className="text-xl font-bold text-slate-200 mb-4 flex items-center gap-2">
                        <Radio className="text-purple-400" /> Nightwave Challenges
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {nightwave.slice(0, 9).map((challenge: NightwaveChallenge) => {
                            const completed = isCompleted(`nightwave-${challenge.id}`);
                            return (
                                <div
                                    key={challenge.id}
                                    className={`bg-slate-800 p-3 rounded border cursor-pointer transition-colors ${completed
                                        ? 'border-green-600/50 bg-green-900/10'
                                        : challenge.isElite ? 'border-purple-600 hover:border-purple-400'
                                            : challenge.isDaily ? 'border-blue-700 hover:border-blue-500'
                                                : 'border-slate-700 hover:border-slate-500'
                                        }`}
                                    onClick={() => toggleCompleted(`nightwave-${challenge.id}`)}
                                >
                                    <div className="flex items-start gap-2">
                                        <div className={`w-5 h-5 mt-0.5 rounded border-2 flex items-center justify-center flex-shrink-0 ${completed ? 'bg-green-600 border-green-600' : 'border-slate-500'}`}>
                                            {completed && <Check size={14} className="text-white" />}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <span className={`font-medium ${completed ? 'text-slate-400 line-through' : 'text-slate-200'}`}>{challenge.title}</span>
                                                <span className={`text-xs px-2 py-0.5 rounded font-bold ${challenge.isElite ? 'bg-purple-900/50 text-purple-300' : challenge.isDaily ? 'bg-blue-900/50 text-blue-300' : 'bg-slate-700 text-slate-300'}`}>
                                                    {challenge.isElite ? 'Elite' : challenge.isDaily ? 'Daily' : 'Weekly'}
                                                </span>
                                            </div>
                                            <div className={`text-sm ${completed ? 'text-slate-500' : 'text-slate-400'}`}>{challenge.description}</div>
                                            <div className={`text-sm mt-1 ${completed ? 'text-slate-500' : 'text-slate-400'}`}>
                                                +{challenge.standing.toLocaleString()} Standing
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}

            {/* Invasions */}
            {invasions.length > 0 && (
                <section>
                    <h2 className="text-xl font-bold text-slate-200 mb-4 flex items-center gap-2">
                        <Swords className="text-red-400" /> Active Invasions
                    </h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                        {invasions.slice(0, 8).map((invasion: Invasion) => (
                            <div key={invasion.id} className="bg-slate-800 p-3 rounded border border-slate-700 hover:border-slate-600 transition-colors">
                                <div className="text-slate-200 font-medium mb-2">{invasion.node}</div>
                                <div className="flex items-center gap-2 text-sm mb-2">
                                    <span className={`font-bold ${invasion.attackingFaction === 'Grineer' ? 'text-red-400' : invasion.attackingFaction === 'Corpus' ? 'text-blue-400' : 'text-green-400'}`}>
                                        {invasion.attackingFaction}
                                    </span>
                                    <span className="text-slate-500">vs</span>
                                    <span className={`font-bold ${invasion.defendingFaction === 'Grineer' ? 'text-red-400' : invasion.defendingFaction === 'Corpus' ? 'text-blue-400' : 'text-green-400'}`}>
                                        {invasion.defendingFaction}
                                    </span>
                                </div>
                                <div className="flex justify-between text-xs text-slate-400">
                                    <span>{invasion.attackerReward}</span>
                                    <span>{invasion.defenderReward}</span>
                                </div>
                                <div className="mt-2 h-2 bg-slate-700 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full transition-all ${invasion.progress > 0 ? 'bg-red-500' : 'bg-blue-500'}`}
                                        style={{ width: `${Math.abs(invasion.progress)}%`, marginLeft: invasion.progress < 0 ? '0%' : `${100 - invasion.progress}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Alerts */}
            {alerts.length > 0 && (
                <section>
                    <h2 className="text-xl font-bold text-slate-200 mb-4 flex items-center gap-2">
                        <Bell className="text-yellow-400" /> Active Alerts
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {alerts.map((alert: Alert) => (
                            <div key={alert.id} className="bg-slate-800 p-3 rounded border border-yellow-700/30 hover:border-yellow-600/50 transition-colors">
                                <div className="flex justify-between">
                                    <span className="text-slate-200 font-medium">{alert.mission}</span>
                                    <span className="text-xs text-slate-500 font-mono">{alert.eta}</span>
                                </div>
                                <div className="text-slate-400 text-sm">{alert.node}</div>
                                <div className="text-yellow-400 text-sm mt-1 font-medium">{alert.reward}</div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Fissures List */}
            <section>
                <h2 className="text-xl font-bold text-slate-200 mb-4 flex items-center gap-2">
                    <Droplets className="text-cyan-400" /> Active Void Fissures
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {sortedFissures.slice(0, 12).map((fissure: Fissure) => (
                        <div key={fissure.id} className="bg-slate-800 p-3 rounded border border-slate-700 flex items-center justify-between hover:border-slate-600 transition-colors">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-slate-200">{fissure.tier}</span>
                                    <span className="text-xs text-slate-500">{fissure.missionType}</span>
                                </div>
                                <div className="text-slate-400 text-sm">{fissure.node}</div>
                            </div>
                            <div className="text-right">
                                <span className="text-xs text-slate-500 font-mono block">{fissure.eta}</span>
                                <span className={`text-xs font-bold px-1.5 rounded ${fissure.enemy === 'Corrupted' ? 'bg-yellow-900/30 text-yellow-200' : 'bg-slate-700 text-slate-300'}`}>
                                    {fissure.enemy}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Item Detail Modal */}
            <ItemDetailModal itemKey={selectedItemForDetails} onClose={() => setSelectedItemForDetails(null)} />
        </div>
    );
}
