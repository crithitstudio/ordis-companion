/**
 * Warframe.market API Service
 * Fetches market prices for tradable items
 */

const WFM_API_BASE = "https://api.warframe.market/v1";

export interface MarketPrice {
    itemName: string;
    itemUrl: string;
    avgPrice: number;
    minPrice: number;
    maxPrice: number;
    volume: number;
    lastUpdated: Date;
}

interface WFMOrdersResponse {
    payload: {
        orders: {
            user: {
                status: string;
            };
            order_type: string;
            platinum: number;
            quantity: number;
        }[];
    };
}

// Cache for market prices (avoid hitting API too often)
const priceCache = new Map<string, { data: MarketPrice; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Convert item name to warframe.market URL slug
 * e.g., "Rhino Prime Neuroptics" -> "rhino_prime_neuroptics"
 */
function toMarketSlug(itemName: string): string {
    return itemName
        .toLowerCase()
        .replace(/'/g, "")
        .replace(/&/g, "and")
        .replace(/\s+/g, "_")
        .replace(/[^a-z0-9_]/g, "");
}

/**
 * Fetch current market prices for an item
 */
export async function fetchMarketPrice(itemName: string): Promise<MarketPrice | null> {
    const cacheKey = itemName.toLowerCase();
    const cached = priceCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data;
    }

    const itemUrl = toMarketSlug(itemName);

    try {
        const response = await fetch(`${WFM_API_BASE}/items/${itemUrl}/orders`, {
            headers: {
                "Accept": "application/json",
                "Platform": "pc",
            },
        });

        if (!response.ok) {
            if (response.status === 404) {
                // Item not found on market - not tradable or different name
                return null;
            }
            throw new Error(`HTTP ${response.status}`);
        }

        const data: WFMOrdersResponse = await response.json();

        // Filter to only online sellers with sell orders
        const sellOrders = data.payload.orders
            .filter((o) => o.order_type === "sell" && o.user.status === "ingame")
            .map((o) => o.platinum)
            .sort((a, b) => a - b);

        if (sellOrders.length === 0) {
            // Try offline sellers if no online sellers
            const offlineSellOrders = data.payload.orders
                .filter((o) => o.order_type === "sell")
                .map((o) => o.platinum)
                .sort((a, b) => a - b);

            if (offlineSellOrders.length === 0) {
                return null;
            }

            const result: MarketPrice = {
                itemName,
                itemUrl,
                minPrice: offlineSellOrders[0],
                maxPrice: offlineSellOrders[offlineSellOrders.length - 1],
                avgPrice: Math.round(offlineSellOrders.reduce((a, b) => a + b, 0) / offlineSellOrders.length),
                volume: offlineSellOrders.length,
                lastUpdated: new Date(),
            };

            priceCache.set(cacheKey, { data: result, timestamp: Date.now() });
            return result;
        }

        const result: MarketPrice = {
            itemName,
            itemUrl,
            minPrice: sellOrders[0],
            maxPrice: sellOrders[sellOrders.length - 1],
            avgPrice: Math.round(sellOrders.reduce((a, b) => a + b, 0) / sellOrders.length),
            volume: sellOrders.length,
            lastUpdated: new Date(),
        };

        priceCache.set(cacheKey, { data: result, timestamp: Date.now() });
        return result;
    } catch (error) {
        console.error(`Failed to fetch market price for ${itemName}:`, error);
        return null;
    }
}

/**
 * Get warframe.market URL for an item
 */
export function getMarketUrl(itemName: string): string {
    const slug = toMarketSlug(itemName);
    return `https://warframe.market/items/${slug}`;
}

/**
 * Batch fetch prices for multiple items
 * Includes rate limiting to avoid overwhelming the API
 */
export async function fetchMarketPrices(itemNames: string[]): Promise<Map<string, MarketPrice | null>> {
    const results = new Map<string, MarketPrice | null>();

    for (const itemName of itemNames) {
        results.set(itemName, await fetchMarketPrice(itemName));
        // Small delay between requests to be nice to the API
        await new Promise((resolve) => setTimeout(resolve, 100));
    }

    return results;
}
