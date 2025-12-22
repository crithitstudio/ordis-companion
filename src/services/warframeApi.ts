/**
 * Warframe API Service
 * Handles all communication with the Warframe world state API
 * Uses api.warframestat.us/pc for more reliable access
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

// Use the community API which supports CORS
const BASE_URL = 'https://api.warframestat.us/pc';

/**
 * Fetch and parse Warframe world state from the API
 */
export async function fetchWorldState(): Promise<WorldState | null> {
    try {
        const response = await fetch(BASE_URL);
        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
        const data = await response.json();

        // 1. Fissures
        const fissures: Fissure[] = (data.fissures || [])
            .filter((f: any) => !f.expired)
            .map((f: any) => ({
                id: f.id,
                node: f.node || 'Unknown',
                missionType: f.missionType || 'Unknown',
                enemy: f.enemy || 'Unknown',
                tier: f.tier || 'Unknown',
                tierNum: f.tierNum || 0,
                expiry: f.expiry,
                eta: f.eta || ''
            }));

        // 2. Sortie
        const sortieData = data.sortie;
        let sortie: Sortie | null = null;
        if (sortieData && !sortieData.expired) {
            sortie = {
                boss: sortieData.boss,
                faction: sortieData.faction,
                eta: sortieData.eta || '',
                variants: (sortieData.variants || []).map((v: any) => ({
                    missionType: v.missionType,
                    modifier: v.modifier,
                    node: v.node
                }))
            };
        }

        // 3. Invasions
        const invasions: Invasion[] = (data.invasions || [])
            .filter((inv: any) => !inv.completed)
            .map((inv: any) => {
                const getRewardString = (reward: any) => {
                    if (!reward) return 'None';
                    // The API returns 'itemString' usually
                    return reward.itemString || reward.asString || 'Credits';
                };

                return {
                    id: inv.id,
                    node: inv.node,
                    attackingFaction: inv.attackingFaction,
                    defendingFaction: inv.defendingFaction,
                    attackerReward: getRewardString(inv.attackerReward),
                    defenderReward: getRewardString(inv.defenderReward),
                    progress: Math.round(inv.completion),
                    eta: inv.eta || 'Active',
                    completed: inv.completed
                };
            });

        // 4. Void Trader (Baro)
        const voidTraderData = data.voidTrader;
        let voidTrader: VoidTrader | null = null;
        if (voidTraderData) {
            voidTrader = {
                active: voidTraderData.active,
                location: voidTraderData.location,
                startString: voidTraderData.startString,
                endString: voidTraderData.endString
            };
        }

        // 5. Nightwave
        const nightwaveData = data.nightwave;
        let nightwave: NightwaveChallenge[] = [];
        if (nightwaveData && nightwaveData.activeChallenges) {
            nightwave = nightwaveData.activeChallenges.map((ch: any) => ({
                id: ch.id,
                title: ch.title,
                description: ch.isElite ? 'Elite Weekly' : ch.isDaily ? 'Daily' : 'Weekly',
                standing: ch.reputation,
                isDaily: ch.isDaily,
                isElite: ch.isElite
            }));
        }

        // 6. Archon Hunt
        const archonData = data.archonHunt;
        let archonHunt: ArchonHunt | null = null;
        if (archonData && !archonData.expired) {
            archonHunt = {
                boss: archonData.boss,
                eta: archonData.eta || '',
                missions: (archonData.missions || []).map((m: any) => ({
                    missionType: m.type,
                    node: m.node
                }))
            };
        }

        // 7. Alerts
        const alerts: Alert[] = (data.alerts || [])
            .filter((a: any) => !a.expired)
            .map((a: any) => {
                const reward = a.mission?.reward?.asString || a.mission?.reward?.itemString || 'Credits';
                return {
                    id: a.id,
                    mission: a.mission?.type || 'Mission',
                    node: a.mission?.node || 'Unknown',
                    faction: a.mission?.faction || 'Unknown',
                    reward: reward,
                    eta: a.eta || ''
                };
            });

        // 8. Void Storms
        const voidStorms: VoidStorm[] = (data.voidStorms || [])
            .filter((s: any) => !s.expired)
            .map((s: any) => {
                // Determine tier format if possible, or just use what api gives
                // The api gives "Lith" etc directly usually
                return {
                    id: s.id,
                    node: s.node,
                    tier: s.tier || 'Unknown', // The API usually provides named tiers
                    eta: s.eta || ''
                };
            });

        // 9. Daily Deal (Darvo)
        const dailyDeals = data.dailyDeals || [];
        // Just take the first one or logic to find best? usually just one
        const dealData = dailyDeals[0];
        let darvoDeal: DarvoDeal | null = null;
        if (dealData) {
            darvoDeal = {
                item: dealData.item,
                discount: dealData.discount,
                originalPrice: dealData.originalPrice,
                salePrice: dealData.salePrice,
                stock: dealData.total,
                sold: dealData.sold,
                eta: dealData.eta || ''
            };
        }


        return {
            rawSyndicateMissions: [], // Not yet mapped or needed for major views?
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
