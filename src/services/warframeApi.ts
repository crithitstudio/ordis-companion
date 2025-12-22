/**
 * Warframe API Service
 * Handles all communication with the Warframe world state API
 */

import type {
    WorldState,
    Fissure,
    Invasion,
    VoidTrader,
    NightwaveChallenge,
    ArchonHunt,
    Alert,
    VoidStorm,
    DarvoDeal,
    Sortie
} from '../types';

import {
    solNodes,
    sortieData,
    translate,
    translateModifier
} from '../utils/translations';

import { formatTime } from '../utils/cycles';

const BASE_URL = '/api/warframe/dynamic/worldState.php';

/**
 * Fetch and parse Warframe world state from the API
 */
export async function fetchWorldState(): Promise<WorldState | null> {
    try {
        const response = await fetch(BASE_URL);
        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
        const rawData = await response.json();

        // Parse Fissures
        const fissures: Fissure[] = (rawData.ActiveMissions || [])
            .filter((m: any) => m.Modifier && m.Modifier.startsWith('VoidT'))
            .map((m: any) => {
                const nodeStr = m.Node;
                const mappedNode = solNodes[nodeStr] || { value: nodeStr, enemy: 'Unknown', type: 'Unknown' };

                const tierMap: Record<string, string> = {
                    'VoidT1': 'Lith', 'VoidT2': 'Meso', 'VoidT3': 'Neo',
                    'VoidT4': 'Axi', 'VoidT5': 'Requiem', 'VoidT6': 'Omnia'
                };
                const tier = tierMap[m.Modifier] || m.Modifier;
                const tierNum = parseInt(m.Modifier.replace('VoidT', '')) || 0;

                const expiry = m.Expiry?.$date?.$numberLong ? Number(m.Expiry.$date.$numberLong) : 0;
                const etaSec = Math.max(0, Math.floor((expiry - Date.now()) / 1000));

                return {
                    id: m._id?.$oid || Math.random().toString(),
                    node: mappedNode.value,
                    missionType: mappedNode.type || 'Unknown',
                    enemy: mappedNode.enemy || 'Unknown',
                    tier,
                    tierNum,
                    expiry: new Date(expiry).toISOString(),
                    eta: formatTime(etaSec)
                };
            });

        // Parse Sortie
        const rawSortie = rawData.Sorties?.[0];
        let sortie: Sortie | null = null;

        if (rawSortie) {
            const expiry = rawSortie.Expiry?.$date?.$numberLong ? Number(rawSortie.Expiry.$date.$numberLong) : 0;
            const etaSec = Math.max(0, Math.floor((expiry - Date.now()) / 1000));

            const bossKey = rawSortie.Boss || 'UNKNOWN';
            const bossInfo = sortieData.bosses[bossKey];
            const bossName = bossInfo?.name || bossKey.replace('SORTIE_BOSS_', '').replace(/_/g, ' ');
            const faction = bossInfo?.faction || 'Unknown';

            sortie = {
                boss: bossName,
                faction,
                eta: formatTime(etaSec),
                variants: (rawSortie.Variants || []).map((v: any) => ({
                    missionType: translate(v.missionType),
                    modifier: translateModifier(v.modifierType),
                    node: solNodes[v.node]?.value || v.node
                }))
            };
        }

        // Parse Invasions
        const invasions: Invasion[] = (rawData.Invasions || [])
            .filter((inv: any) => !inv.Completed)
            .map((inv: any) => {
                const factionMap: Record<string, string> = {
                    'FC_GRINEER': 'Grineer',
                    'FC_CORPUS': 'Corpus',
                    'FC_INFESTATION': 'Infested'
                };
                const goal = inv.Goal || 1;
                const count = inv.Count || 0;
                const progress = Math.round((count / goal) * 100);

                const getRewardString = (reward: any) => {
                    if (!reward) return 'None';
                    if (reward.countedItems?.[0]) {
                        const item = reward.countedItems[0];
                        const name = translate(item.ItemType || '');
                        return `${item.ItemCount || 1}x ${name}`;
                    }
                    return 'Credits';
                };

                return {
                    id: inv._id?.$oid || Math.random().toString(),
                    node: solNodes[inv.Node]?.value || inv.Node,
                    attackingFaction: factionMap[inv.Faction] || inv.Faction,
                    defendingFaction: factionMap[inv.DefenderFaction] || inv.DefenderFaction,
                    attackerReward: getRewardString(inv.AttackerReward),
                    defenderReward: getRewardString(inv.DefenderReward),
                    progress,
                    eta: 'Active',
                    completed: inv.Completed || false
                };
            });

        // Parse Baro Ki'Teer
        const rawBaro = rawData.VoidTraders?.[0];
        let voidTrader: VoidTrader | null = null;
        if (rawBaro) {
            const activation = rawBaro.Activation?.$date?.$numberLong ? Number(rawBaro.Activation.$date.$numberLong) : 0;
            const expiry = rawBaro.Expiry?.$date?.$numberLong ? Number(rawBaro.Expiry.$date.$numberLong) : 0;
            const now = Date.now();
            const isActive = now >= activation && now < expiry;

            voidTrader = {
                active: isActive,
                location: solNodes[rawBaro.Node]?.value || rawBaro.Node || 'Unknown Relay',
                startString: isActive ? 'Now' : formatTime(Math.max(0, (activation - now) / 1000)),
                endString: isActive ? formatTime(Math.max(0, (expiry - now) / 1000)) : ''
            };
        }

        // Parse Nightwave
        let nightwave: NightwaveChallenge[] = [];
        if (rawData.SeasonInfo?.ActiveChallenges) {
            nightwave = rawData.SeasonInfo.ActiveChallenges.map((ch: any) => {
                const challengePath = ch.Challenge || '';
                const isDaily = ch.Daily || false;
                const isElite = challengePath.includes('WeeklyHard');

                const name = challengePath.split('/').pop()
                    ?.replace('SeasonDaily', '')
                    .replace('SeasonWeekly', '')
                    .replace('SeasonWeeklyHard', '')
                    .replace(/([A-Z])/g, ' $1')
                    .trim() || 'Challenge';

                return {
                    id: ch._id?.$oid || Math.random().toString(),
                    title: name,
                    description: isElite ? 'Elite Weekly' : isDaily ? 'Daily' : 'Weekly',
                    standing: isElite ? 7000 : isDaily ? 1000 : 4500,
                    isDaily,
                    isElite
                };
            });
        }

        // Parse Archon Hunt
        const rawArchon = rawData.LiteSorties?.[0];
        let archonHunt: ArchonHunt | null = null;
        if (rawArchon) {
            const expiry = rawArchon.Expiry?.$date?.$numberLong ? Number(rawArchon.Expiry.$date.$numberLong) : 0;
            const etaSec = Math.max(0, Math.floor((expiry - Date.now()) / 1000));

            archonHunt = {
                boss: sortieData.bosses[rawArchon.Boss]?.name ||
                    rawArchon.Boss?.replace('SORTIE_BOSS_', '').replace(/_/g, ' ') || 'Unknown',
                eta: formatTime(etaSec),
                missions: (rawArchon.Missions || []).map((m: any) => ({
                    missionType: translate(m.missionType),
                    node: solNodes[m.node]?.value || m.node
                }))
            };
        }

        // Parse Alerts
        const alerts: Alert[] = (rawData.Alerts || []).map((a: any) => {
            const expiry = a.Expiry?.$date?.$numberLong ? Number(a.Expiry.$date.$numberLong) : 0;
            const etaSec = Math.max(0, Math.floor((expiry - Date.now()) / 1000));
            const mission = a.MissionInfo || {};

            const getRewardString = (reward: any) => {
                if (!reward) return 'Credits';
                if (reward.countedItems?.[0]) {
                    const item = reward.countedItems[0];
                    const name = translate(item.ItemType || '');
                    return `${item.ItemCount || 1}x ${name}`;
                }
                return `${reward.credits || 0} Credits`;
            };

            return {
                id: a._id?.$oid || Math.random().toString(),
                mission: translate(mission.missionType) || 'Mission',
                node: solNodes[mission.location]?.value || mission.location || 'Unknown',
                faction: mission.faction?.replace('FC_', '') || 'Unknown',
                reward: getRewardString(mission.missionReward),
                eta: formatTime(etaSec)
            };
        });

        // Parse Void Storms
        const voidStorms: VoidStorm[] = (rawData.VoidStorms || []).map((storm: any) => {
            const expiry = storm.Expiry?.$date?.$numberLong ? Number(storm.Expiry.$date.$numberLong) : 0;
            const etaSec = Math.max(0, Math.floor((expiry - Date.now()) / 1000));
            const tierMap: Record<string, string> = {
                'VoidT1': 'Lith', 'VoidT2': 'Meso', 'VoidT3': 'Neo', 'VoidT4': 'Axi'
            };

            return {
                id: storm._id?.$oid || Math.random().toString(),
                node: solNodes[storm.Node]?.value || storm.Node,
                tier: tierMap[storm.ActiveMissionTier] || storm.ActiveMissionTier,
                eta: formatTime(etaSec)
            };
        });

        // Parse Darvo Deal
        const rawDeal = rawData.DailyDeals?.[0];
        let darvoDeal: DarvoDeal | null = null;
        if (rawDeal) {
            const expiry = rawDeal.Expiry?.$date?.$numberLong ? Number(rawDeal.Expiry.$date.$numberLong) : 0;
            const etaSec = Math.max(0, Math.floor((expiry - Date.now()) / 1000));

            darvoDeal = {
                item: translate(rawDeal.StoreItem || ''),
                discount: rawDeal.Discount || 0,
                originalPrice: rawDeal.OriginalPrice || 0,
                salePrice: rawDeal.SalePrice || 0,
                stock: rawDeal.AmountTotal || 0,
                sold: rawDeal.AmountSold || 0,
                eta: formatTime(etaSec)
            };
        }

        return {
            rawSyndicateMissions: rawData.SyndicateMissions || [],
            fissures,
            sortie,
            invasions,
            voidTrader,
            nightwave,
            archonHunt,
            alerts,
            voidStorms,
            darvoDeal
        };

    } catch (error) {
        console.error("Failed to fetch world state:", error);
        return null;
    }
}
