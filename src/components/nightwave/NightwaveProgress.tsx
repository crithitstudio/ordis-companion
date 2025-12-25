/**
 * Nightwave Season Progress Tracker
 * Enhanced tracking for cumulative standing and rewards
 */
import { useMemo } from "react";
import { Radio, Star, Check, Gift, Trophy } from "lucide-react";
import { useLocalStorageSet } from "../../hooks/useLocalStorage";
import type { NightwaveChallenge } from "../../types";

// Nightwave rewards per rank
const NIGHTWAVE_REWARDS = [
    { rank: 1, reward: "1000 Credits Cache", type: "credits" },
    { rank: 2, reward: "Nora's Choice", type: "cosmetic" },
    { rank: 3, reward: "50 Cred Offering", type: "cred" },
    { rank: 4, reward: "Wolf Howl Emote", type: "cosmetic" },
    { rank: 5, reward: "Nightwave Sigil", type: "cosmetic" },
    { rank: 6, reward: "Nora's Choice", type: "cosmetic" },
    { rank: 7, reward: "50 Cred Offering", type: "cred" },
    { rank: 8, reward: "Orokin Catalyst Blueprint", type: "item" },
    { rank: 9, reward: "Saturn Six Emblem", type: "cosmetic" },
    { rank: 10, reward: "Nora's Choice", type: "cosmetic" },
    { rank: 11, reward: "50 Cred Offering", type: "cred" },
    { rank: 12, reward: "3x Forma Bundle", type: "item" },
    { rank: 13, reward: "Nightwave Scene", type: "cosmetic" },
    { rank: 14, reward: "Nora's Choice", type: "cosmetic" },
    { rank: 15, reward: "50 Cred Offering", type: "cred" },
    { rank: 16, reward: "Orokin Reactor Blueprint", type: "item" },
    { rank: 17, reward: "Wolf K-Drive Scrawl", type: "cosmetic" },
    { rank: 18, reward: "Nora's Choice", type: "cosmetic" },
    { rank: 19, reward: "50 Cred Offering", type: "cred" },
    { rank: 20, reward: "Arcane Energize", type: "arcane" },
    { rank: 21, reward: "50 Cred Offering", type: "cred" },
    { rank: 22, reward: "Nora's Choice", type: "cosmetic" },
    { rank: 23, reward: "50 Cred Offering", type: "cred" },
    { rank: 24, reward: "Nora's Choice", type: "cosmetic" },
    { rank: 25, reward: "50 Cred Offering", type: "cred" },
    { rank: 26, reward: "Nora's Choice", type: "cosmetic" },
    { rank: 27, reward: "50 Cred Offering", type: "cred" },
    { rank: 28, reward: "Nora's Choice", type: "cosmetic" },
    { rank: 29, reward: "50 Cred Offering", type: "cred" },
    { rank: 30, reward: "Umbra Forma Blueprint", type: "item" },
] as const;

const STANDING_PER_RANK = 10000;
const MAX_VISIBLE_RANKS = 30;

interface NightwaveProgressProps {
    challenges: NightwaveChallenge[];
    currentStanding?: number;
}

export function NightwaveProgress({ challenges, currentStanding = 0 }: NightwaveProgressProps) {
    const [completedIds, setCompletedIds] = useLocalStorageSet<string>("completedNightwaveChallenges");

    // Calculate total standing earned from challenges
    const standingStats = useMemo(() => {
        let earned = currentStanding;
        let potential = currentStanding;

        challenges.forEach(ch => {
            if (completedIds.has(ch.id)) {
                earned += ch.standing;
            }
            potential += ch.standing;
        });

        const currentRank = Math.floor(earned / STANDING_PER_RANK);
        const progressToNextRank = earned % STANDING_PER_RANK;
        const progressPercent = (progressToNextRank / STANDING_PER_RANK) * 100;
        const potentialRank = Math.floor(potential / STANDING_PER_RANK);

        return {
            earned,
            potential,
            currentRank: Math.min(currentRank, MAX_VISIBLE_RANKS),
            progressToNextRank,
            progressPercent,
            potentialRank: Math.min(potentialRank, MAX_VISIBLE_RANKS),
            totalCreds: NIGHTWAVE_REWARDS
                .filter(r => r.rank <= currentRank && r.type === "cred")
                .length * 50,
        };
    }, [challenges, completedIds, currentStanding]);

    // Toggle challenge completion
    const toggleChallenge = (id: string) => {
        setCompletedIds(prev => {
            const updated = new Set(prev);
            if (updated.has(id)) {
                updated.delete(id);
            } else {
                updated.add(id);
            }
            return updated;
        });
    };

    // Group challenges
    const groupedChallenges = useMemo(() => {
        const daily = challenges.filter(c => c.isDaily);
        const weekly = challenges.filter(c => !c.isDaily && !c.isElite);
        const elite = challenges.filter(c => c.isElite);
        return { daily, weekly, elite };
    }, [challenges]);

    return (
        <div className="space-y-6">
            {/* Progress Header */}
            <div className="bg-gradient-to-r from-purple-900/30 to-slate-900/50 rounded-xl border border-purple-700/30 p-4">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold text-purple-400 flex items-center gap-2">
                        <Radio size={20} /> Nightwave Progress
                    </h3>
                    <div className="text-right">
                        <div className="text-2xl font-bold text-purple-300">
                            Rank {standingStats.currentRank}
                        </div>
                        <div className="text-sm text-slate-400">
                            {standingStats.earned.toLocaleString()} standing
                        </div>
                    </div>
                </div>

                {/* Progress bar to next rank */}
                <div className="relative mb-2">
                    <div className="h-4 bg-slate-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-purple-600 to-pink-500 transition-all duration-500"
                            style={{ width: `${standingStats.progressPercent}%` }}
                        />
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
                        {standingStats.progressToNextRank.toLocaleString()} / {STANDING_PER_RANK.toLocaleString()}
                    </div>
                </div>

                {/* Stats row */}
                <div className="flex gap-4 text-sm">
                    <div className="flex items-center gap-1 text-slate-400">
                        <Gift size={14} />
                        <span>{standingStats.totalCreds} Creds earned</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-400">
                        <Trophy size={14} />
                        <span>Potential: Rank {standingStats.potentialRank}</span>
                    </div>
                </div>
            </div>

            {/* Active Challenges */}
            <div className="space-y-4">
                {/* Daily challenges */}
                {groupedChallenges.daily.length > 0 && (
                    <div>
                        <h4 className="text-sm font-medium text-slate-400 uppercase mb-2">
                            Daily ({groupedChallenges.daily.length})
                        </h4>
                        <div className="space-y-2">
                            {groupedChallenges.daily.map(challenge => (
                                <ChallengeCard
                                    key={challenge.id}
                                    challenge={challenge}
                                    completed={completedIds.has(challenge.id)}
                                    onToggle={() => toggleChallenge(challenge.id)}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Weekly challenges */}
                {groupedChallenges.weekly.length > 0 && (
                    <div>
                        <h4 className="text-sm font-medium text-slate-400 uppercase mb-2">
                            Weekly ({groupedChallenges.weekly.length})
                        </h4>
                        <div className="space-y-2">
                            {groupedChallenges.weekly.map(challenge => (
                                <ChallengeCard
                                    key={challenge.id}
                                    challenge={challenge}
                                    completed={completedIds.has(challenge.id)}
                                    onToggle={() => toggleChallenge(challenge.id)}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Elite Weekly */}
                {groupedChallenges.elite.length > 0 && (
                    <div>
                        <h4 className="text-sm font-medium text-yellow-400 uppercase mb-2 flex items-center gap-1">
                            <Star size={14} /> Elite Weekly ({groupedChallenges.elite.length})
                        </h4>
                        <div className="space-y-2">
                            {groupedChallenges.elite.map(challenge => (
                                <ChallengeCard
                                    key={challenge.id}
                                    challenge={challenge}
                                    completed={completedIds.has(challenge.id)}
                                    onToggle={() => toggleChallenge(challenge.id)}
                                    isElite
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Upcoming Rewards */}
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-4">
                <h4 className="font-bold text-slate-300 mb-3 flex items-center gap-2">
                    <Gift size={16} /> Upcoming Rewards
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    {NIGHTWAVE_REWARDS.slice(standingStats.currentRank, standingStats.currentRank + 5).map(reward => (
                        <div
                            key={reward.rank}
                            className={`text-center p-2 rounded-lg border ${reward.type === "item"
                                    ? "bg-yellow-900/20 border-yellow-700/30"
                                    : reward.type === "cred"
                                        ? "bg-purple-900/20 border-purple-700/30"
                                        : "bg-slate-800/50 border-slate-700/30"
                                }`}
                        >
                            <div className="text-xs text-slate-500">Rank {reward.rank}</div>
                            <div className="text-sm text-slate-200 truncate" title={reward.reward}>
                                {reward.reward}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function ChallengeCard({
    challenge,
    completed,
    onToggle,
    isElite = false,
}: {
    challenge: NightwaveChallenge;
    completed: boolean;
    onToggle: () => void;
    isElite?: boolean;
}) {
    return (
        <button
            onClick={onToggle}
            className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${completed
                    ? "bg-green-900/20 border-green-600/50"
                    : isElite
                        ? "bg-yellow-900/10 border-yellow-700/30 hover:border-yellow-600/50"
                        : "bg-slate-800/30 border-slate-700/50 hover:border-slate-600"
                }`}
        >
            <div
                className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${completed
                        ? "bg-green-600 border-green-600"
                        : "border-slate-500"
                    }`}
            >
                {completed && <Check size={14} className="text-white" />}
            </div>
            <div className="flex-1 min-w-0">
                <div className={`font-medium text-sm ${completed ? "text-slate-400 line-through" : "text-slate-200"}`}>
                    {challenge.title}
                </div>
                <div className="text-xs text-slate-500">{challenge.description}</div>
            </div>
            <div className={`text-sm font-bold ${isElite ? "text-yellow-400" : "text-purple-400"}`}>
                +{challenge.standing.toLocaleString()}
            </div>
        </button>
    );
}
