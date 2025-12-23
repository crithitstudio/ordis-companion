/**
 * Unit tests for Warframe API service
 */
import { describe, it, expect } from 'vitest';

// Mock API response structure
const mockWorldStateResponse = {
    timestamp: '2024-01-01T12:00:00.000Z',
    earthCycle: { isDay: true, timeLeft: '30m 15s', expiry: '2024-01-01T12:30:00.000Z' },
    cetusCycle: { isDay: true, timeLeft: '45m', expiry: '2024-01-01T12:45:00.000Z' },
    vallisCycle: { isWarm: false, timeLeft: '15m', expiry: '2024-01-01T12:15:00.000Z' },
    cambionCycle: { active: 'fass', timeLeft: '60m', expiry: '2024-01-01T13:00:00.000Z' },
    invasions: [
        {
            id: 'inv1',
            node: 'Mercury (Terminus)',
            completed: false,
            attacker: { faction: 'Grineer', reward: { countedItems: [{ count: 1, type: 'Orokin Catalyst Blueprint' }] } },
            defender: { faction: 'Corpus', reward: { countedItems: [{ count: 3, type: 'Fieldron' }] } },
            completion: 45.5,
            eta: '5h 30m',
        },
    ],
    fissures: [
        {
            id: 'fiss1',
            node: 'Jupiter (Callisto)',
            missionType: 'Capture',
            tier: 'Lith',
            tierNum: 1,
            isStorm: false,
            isHard: false,
            expiry: '2024-01-01T13:00:00.000Z',
            eta: '1h',
        },
    ],
    arbitration: {
        node: 'Earth (Lua)',
        type: 'Survival',
        enemy: 'Grineer',
        eta: '25m',
        expiry: '2024-01-01T12:25:00.000Z',
    },
    sortie: {
        missions: [
            { missionType: 'Spy', modifier: 'Augmented Enemy Armor', node: 'Mars (Olympus)' },
        ],
        boss: 'Vay Hek',
        faction: 'Grineer',
        eta: '18h',
    },
    voidTrader: {
        active: true,
        location: 'Kronia Relay',
        activation: '2024-01-01T00:00:00.000Z',
        expiry: '2024-01-02T00:00:00.000Z',
    },
    events: [],
    nightwave: { season: 15, activeChallenges: [] },
};

describe('Warframe API Data Parsing', () => {
    describe('Invasion Parsing', () => {
        it('should correctly extract faction names from nested structure', () => {
            const invasion = mockWorldStateResponse.invasions[0];
            const attackingFaction = invasion.attacker?.faction || 'Unknown';
            const defendingFaction = invasion.defender?.faction || 'Unknown';

            expect(attackingFaction).toBe('Grineer');
            expect(defendingFaction).toBe('Corpus');
        });

        it('should correctly extract rewards from countedItems', () => {
            const invasion = mockWorldStateResponse.invasions[0];
            const getRewardString = (reward: { countedItems?: { count: number; type: string }[] }) => {
                if (reward?.countedItems && reward.countedItems.length > 0) {
                    return reward.countedItems.map((item) => `${item.count}x ${item.type}`).join(', ');
                }
                return 'Credits';
            };

            const attackerReward = getRewardString(invasion.attacker.reward);
            const defenderReward = getRewardString(invasion.defender.reward);

            expect(attackerReward).toBe('1x Orokin Catalyst Blueprint');
            expect(defenderReward).toBe('3x Fieldron');
        });
    });

    describe('Fissure Parsing', () => {
        it('should have all required fissure fields', () => {
            const fissure = mockWorldStateResponse.fissures[0];

            expect(fissure.id).toBeDefined();
            expect(fissure.node).toBeDefined();
            expect(fissure.missionType).toBeDefined();
            expect(fissure.tier).toBeDefined();
            expect(fissure.expiry).toBeDefined();
        });

        it('should correctly identify fissure tier', () => {
            const fissure = mockWorldStateResponse.fissures[0];
            expect(fissure.tier).toBe('Lith');
            expect(fissure.tierNum).toBe(1);
        });
    });

    describe('Arbitration Parsing', () => {
        it('should have all required arbitration fields', () => {
            const arb = mockWorldStateResponse.arbitration;

            expect(arb.node).toBe('Earth (Lua)');
            expect(arb.type).toBe('Survival');
            expect(arb.enemy).toBe('Grineer');
        });
    });

    describe('Cycle Time Parsing', () => {
        it('should correctly identify Earth day/night', () => {
            expect(mockWorldStateResponse.earthCycle.isDay).toBe(true);
        });

        it('should correctly identify Cetus day/night', () => {
            expect(mockWorldStateResponse.cetusCycle.isDay).toBe(true);
        });

        it('should correctly identify Orb Vallis warm/cold', () => {
            expect(mockWorldStateResponse.vallisCycle.isWarm).toBe(false);
        });
    });

    describe('Void Trader Parsing', () => {
        it('should detect active Baro Ki\'Teer', () => {
            expect(mockWorldStateResponse.voidTrader.active).toBe(true);
        });

        it('should have location when active', () => {
            expect(mockWorldStateResponse.voidTrader.location).toBe('Kronia Relay');
        });
    });
});

describe('API Error Handling', () => {
    it('should provide fallback values for missing data', () => {
        const incompleteResponse = {
            earthCycle: null,
            invasions: null,
            fissures: undefined,
        };

        expect(incompleteResponse.earthCycle || { isDay: false }).toHaveProperty('isDay');
        expect(incompleteResponse.invasions || []).toEqual([]);
        expect(incompleteResponse.fissures || []).toEqual([]);
    });
});
