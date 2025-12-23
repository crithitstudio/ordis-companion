/**
 * Shared utility for relic drop data lookups
 */
import { itemsData } from './translations';

// Relic era pattern
const RELIC_PATTERN = /^(Lith|Meso|Neo|Axi|Requiem)\s+([A-Z]\d+)\s+Relic/i;

export interface RelicReward {
    item: string;
    rarity: string;
    chance: number;
}

export interface RelicInfo {
    name: string;
    era: string;
    rewards: RelicReward[];
}

// Cache for relic contents
let relicContentsCache: Map<string, RelicInfo> | null = null;

/**
 * Build mapping: relic name -> items it contains
 * Cached for performance
 */
export function getRelicContentsMap(): Map<string, RelicInfo> {
    if (relicContentsCache) return relicContentsCache;

    const relicMap = new Map<string, RelicInfo>();

    Object.entries(itemsData).forEach(([, item]) => {
        if (!item.drops) return;

        item.drops.forEach((drop) => {
            const loc = drop.location || '';
            if (!loc.includes('Relic')) return;

            // Parse relic name without refinement
            const relicMatch = loc.match(/^(.+?\s+Relic)/);
            if (!relicMatch) return;

            const relicName = relicMatch[1];
            const eraMatch = relicName.match(RELIC_PATTERN);
            const era = eraMatch ? eraMatch[1] : 'Unknown';

            // Use drop.type for the actual Prime part name
            const itemName = drop.type || item.name;

            const existing = relicMap.get(relicName);
            if (existing) {
                // Only add if not already in rewards
                if (!existing.rewards.some((r) => r.item === itemName)) {
                    existing.rewards.push({
                        item: itemName,
                        rarity: drop.rarity || 'Common',
                        chance: drop.chance || 0,
                    });
                }
            } else {
                relicMap.set(relicName, {
                    name: relicName,
                    era,
                    rewards: [
                        {
                            item: itemName,
                            rarity: drop.rarity || 'Common',
                            chance: drop.chance || 0,
                        },
                    ],
                });
            }
        });
    });

    // Sort rewards by rarity
    relicMap.forEach((relic) => {
        relic.rewards.sort((a, b) => {
            const rarityOrder: Record<string, number> = { Rare: 0, Uncommon: 1, Common: 2 };
            return (rarityOrder[a.rarity] ?? 3) - (rarityOrder[b.rarity] ?? 3);
        });
    });

    relicContentsCache = relicMap;
    return relicMap;
}

/**
 * Get drops for a specific relic by name
 * Searches for partial matches (e.g., "Axi A1" matches "Axi A1 Relic")
 */
export function getRelicDrops(relicName: string): RelicReward[] {
    const map = getRelicContentsMap();

    // Try exact match first
    const exact = map.get(relicName);
    if (exact) return exact.rewards;

    // Try with " Relic" suffix
    const withSuffix = map.get(`${relicName} Relic`);
    if (withSuffix) return withSuffix.rewards;

    // Try partial match (search for relics containing the name)
    for (const [key, value] of map) {
        if (key.toLowerCase().includes(relicName.toLowerCase())) {
            return value.rewards;
        }
    }

    return [];
}
