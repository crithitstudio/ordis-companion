/**
 * Price Service
 * Fetch and cache item prices from warframe.market API
 */

const WFM_API_BASE = "https://api.warframe.market/v1";
const CACHE_KEY = "ordis-price-cache";
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

export interface PriceData {
    itemName: string;
    platinum: number;
    volume: number;
    updatedAt: number;
}

interface PriceCache {
    prices: Record<string, PriceData>;
    lastUpdated: number;
}

// Normalize item name for warframe.market URL
function normalizeItemName(name: string): string {
    return name
        .toLowerCase()
        .replace(/ /g, "_")
        .replace(/'/g, "")
        .replace(/&/g, "and")
        .replace(/-/g, "_");
}

// Get cached prices
function getCache(): PriceCache {
    try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
            return JSON.parse(cached);
        }
    } catch {
        // Ignore parse errors
    }
    return { prices: {}, lastUpdated: 0 };
}

// Save cache
function setCache(cache: PriceCache): void {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
}

// Fetch single item price from warframe.market
export async function fetchItemPrice(itemName: string): Promise<PriceData | null> {
    const cache = getCache();
    const normalizedName = normalizeItemName(itemName);

    // Check cache first
    const cached = cache.prices[normalizedName];
    if (cached && Date.now() - cached.updatedAt < CACHE_DURATION) {
        return cached;
    }

    try {
        const response = await fetch(
            `${WFM_API_BASE}/items/${normalizedName}/statistics`,
            {
                headers: {
                    "Accept": "application/json",
                    "Platform": "pc",
                },
            }
        );

        if (!response.ok) {
            return null;
        }

        const data = await response.json();
        const stats = data.payload?.statistics_closed?.["48hours"];

        if (!stats || stats.length === 0) {
            return null;
        }

        // Get most recent stat
        const latest = stats[stats.length - 1];
        const priceData: PriceData = {
            itemName,
            platinum: Math.round(latest.median || latest.avg_price || 0),
            volume: latest.volume || 0,
            updatedAt: Date.now(),
        };

        // Update cache
        cache.prices[normalizedName] = priceData;
        cache.lastUpdated = Date.now();
        setCache(cache);

        return priceData;
    } catch (error) {
        console.error(`Failed to fetch price for ${itemName}:`, error);
        return null;
    }
}

// Fetch prices for multiple items (with rate limiting)
export async function fetchItemPrices(itemNames: string[]): Promise<Map<string, PriceData>> {
    const results = new Map<string, PriceData>();
    const cache = getCache();

    // Check cache first
    const uncached: string[] = [];
    for (const name of itemNames) {
        const normalizedName = normalizeItemName(name);
        const cached = cache.prices[normalizedName];
        if (cached && Date.now() - cached.updatedAt < CACHE_DURATION) {
            results.set(name, cached);
        } else {
            uncached.push(name);
        }
    }

    // Fetch uncached items with rate limiting (3 per second)
    for (let i = 0; i < uncached.length; i++) {
        const name = uncached[i];
        const price = await fetchItemPrice(name);
        if (price) {
            results.set(name, price);
        }
        // Rate limit: wait 350ms between requests
        if (i < uncached.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 350));
        }
    }

    return results;
}

// Calculate relic value based on drops and their prices
export function calculateRelicValue(
    drops: { item: string; chance: number }[],
    prices: Map<string, PriceData>
): { expected: number; max: number; ducats: number } {
    let expected = 0;
    let max = 0;

    // Ducat values by drop position (0-2: common 15, 3-4: uncommon 45, 5: rare 100)
    const ducats = drops.reduce((sum, _, idx) => {
        if (idx < 3) return sum + 15;
        if (idx < 5) return sum + 45;
        return sum + 100;
    }, 0) / drops.length; // Average ducat value

    for (const drop of drops) {
        const price = prices.get(drop.item)?.platinum || 0;
        expected += price * drop.chance;
        if (price > max) max = price;
    }

    return { expected: Math.round(expected), max, ducats: Math.round(ducats) };
}

// Get all cached prices
export function getCachedPrices(): Map<string, PriceData> {
    const cache = getCache();
    return new Map(Object.entries(cache.prices));
}

// Clear price cache
export function clearPriceCache(): void {
    localStorage.removeItem(CACHE_KEY);
}
