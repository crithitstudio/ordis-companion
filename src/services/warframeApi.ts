/* eslint-disable @typescript-eslint/no-explicit-any */
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
  Sortie,
  Arbitration,
  PrimeResurgence,
  VarziaItem,
} from "../types";

// Use the community API which supports CORS
const BASE_URL = "https://api.warframestat.us/pc";

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
        node: f.node || "Unknown",
        missionType: f.missionType || "Unknown",
        enemy: f.enemy || "Unknown",
        tier: f.tier || "Unknown",
        tierNum: f.tierNum || 0,
        expiry: f.expiry,
        eta: f.eta || "",
      }));

    // 2. Sortie
    const sortieData = data.sortie;
    let sortie: Sortie | null = null;
    if (sortieData && !sortieData.expired) {
      sortie = {
        boss: sortieData.boss,
        faction: sortieData.faction,
        eta: sortieData.eta || "",
        variants: (sortieData.variants || []).map((v: any) => ({
          missionType: v.missionType,
          modifier: v.modifier,
          node: v.node,
        })),
      };
    }

    // 3. Invasions
    const invasions: Invasion[] = (data.invasions || [])
      .filter((inv: any) => !inv.completed)
      .map((inv: any) => {
        const getRewardString = (reward: any) => {
          if (!reward) return "None";
          // The API returns 'itemString' usually, also check countedItems
          if (reward.itemString) return reward.itemString;
          if (reward.asString) return reward.asString;
          if (reward.countedItems && reward.countedItems.length > 0) {
            return reward.countedItems
              .map((item: any) => `${item.count}x ${item.type}`)
              .join(", ");
          }
          if (typeof reward === "string") return reward;
          return "Credits";
        };

        // Handle different API response structures
        const attackingFaction =
          inv.attackingFaction ||
          inv.attacker?.faction ||
          inv.attackerMissionInfo?.faction ||
          "Unknown";
        const defendingFaction =
          inv.defendingFaction ||
          inv.defender?.faction ||
          inv.defenderMissionInfo?.faction ||
          "Unknown";
        const attackerReward = getRewardString(
          inv.attackerReward || inv.attacker?.reward,
        );
        const defenderReward = getRewardString(
          inv.defenderReward || inv.defender?.reward,
        );

        return {
          id: inv.id,
          node: inv.node || "Unknown Node",
          attackingFaction,
          defendingFaction,
          attackerReward,
          defenderReward,
          progress: Math.round(inv.completion ?? 0),
          eta: inv.eta || "Active",
          completed: inv.completed,
        };
      });

    // 4. Void Trader (Baro)
    const voidTraderData = data.voidTrader;
    let voidTrader: VoidTrader | null = null;
    if (voidTraderData) {
      voidTrader = {
        active: voidTraderData.active,
        location: voidTraderData.location,
        activation: voidTraderData.activation,
        expiry: voidTraderData.expiry,
        startString: voidTraderData.startString,
        endString: voidTraderData.endString,
      };
    }

    // 5. Nightwave
    const nightwaveData = data.nightwave;
    let nightwave: NightwaveChallenge[] = [];
    if (nightwaveData && nightwaveData.activeChallenges) {
      nightwave = nightwaveData.activeChallenges.map((ch: any) => ({
        id: ch.id,
        title: ch.title,
        description: ch.isElite
          ? "Elite Weekly"
          : ch.isDaily
            ? "Daily"
            : "Weekly",
        standing: ch.reputation,
        isDaily: ch.isDaily,
        isElite: ch.isElite,
      }));
    }

    // 6. Archon Hunt
    const archonData = data.archonHunt;
    let archonHunt: ArchonHunt | null = null;
    if (archonData && !archonData.expired) {
      archonHunt = {
        boss: archonData.boss,
        eta: archonData.eta || "",
        missions: (archonData.missions || []).map((m: any) => ({
          missionType: m.type,
          node: m.node,
        })),
      };
    }

    // 7. Alerts
    const alerts: Alert[] = (data.alerts || [])
      .filter((a: any) => !a.expired)
      .map((a: any) => {
        const reward =
          a.mission?.reward?.asString ||
          a.mission?.reward?.itemString ||
          "Credits";
        return {
          id: a.id,
          mission: a.mission?.type || "Mission",
          node: a.mission?.node || "Unknown",
          faction: a.mission?.faction || "Unknown",
          reward: reward,
          eta: a.eta || "",
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
          tier: s.tier || "Unknown", // The API usually provides named tiers
          eta: s.eta || "",
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
        eta: dealData.eta || "",
      };
    }

    // 10. Arbitration
    const arbData = data.arbitration;
    let arbitration: Arbitration | null = null;
    if (arbData && !arbData.expired) {
      // Handle different API response formats (some use solnode/typeKey)
      arbitration = {
        node: arbData.node || arbData.solnode || "Unknown",
        type:
          arbData.type || arbData.typeKey || arbData.missionType || "Unknown",
        enemy: arbData.enemy || arbData.faction || "Unknown",
        eta: arbData.eta || arbData.expiry || "",
      };
    }

    // 11. Prime Resurgence (Varzia's offerings)
    // API uses 'vaultTrader' field (singular) for Varzia's data
    const varziaData = data.vaultTrader;
    let primeResurgence: PrimeResurgence | null = null;
    if (varziaData && varziaData.inventory && varziaData.inventory.length > 0) {
      // Clean up item names - remove internal prefixes and fix spacing
      const cleanItemName = (name: string, uniqueName?: string): string => {
        if (!name) return "Unknown";

        // Handle Vanguard vault items - preserve the vault letter
        const vanguardMatch =
          name.match(/Vanguard Vault ([A-D])/i) ||
          uniqueName?.match(/T\d+VanguardVault([A-D])/i);
        if (vanguardMatch) {
          const vaultLetter = vanguardMatch[1].toUpperCase();
          return `Vanguard Vault ${vaultLetter}`;
        }
        return name
          .replace(/^M P V /, "") // Remove "M P V " prefix
          .replace(/^T\d+ /, "") // Remove T1/T2/T3/T4 prefixes
          .replace(/Void Projection /, "") // Remove "Void Projection"
          .replace(/ Prime Single Pack$/, " Prime") // Clean pack names
          .replace(/ Prime Dual Pack$/, " Prime") // Clean pack names
          .replace(/ Single Pack$/, "") // Remove "Single Pack"
          .replace(/ Dual Pack$/, "") // Remove "Dual Pack"
          .replace(/ Wep$/, "") // Remove " Wep" suffix
          .replace(/ Bronze$/, "") // Remove " Bronze" suffix
          .replace(/ Vault [A-Z]$/, "") // Remove "Vault A/B/C/D"
          .replace(/Vault [A-Z] /, "") // Remove "Vault A " prefix
          .replace(/ Melee Dangle$/, " Sugatra") // Fix sugatra names
          .replace(/^Prime /, "") // Remove leading "Prime "
          .replace(/^Ak /, "Ak") // Fix "Ak " to "Ak"
          .trim();
      };

      const parseItems = (items: any[]): VarziaItem[] => {
        return (items || []).map((item: any) => ({
          name: cleanItemName(
            item.item || item.name || "Unknown",
            item.uniqueName,
          ),
          uniqueName: item.uniqueName || "",
          cost: item.ducats || item.credits || 0,
          currency: item.credits
            ? "Aya"
            : item.ducats
              ? "Regal Aya"
              : "Credits",
        }));
      };
      primeResurgence = {
        active: varziaData.active ?? true,
        activation: varziaData.activation,
        expiry: varziaData.expiry,
        startString: varziaData.startString,
        endString: varziaData.endString,
        vaultedItems: parseItems(varziaData.inventory || []),
        accessoryItems: [], // Accessories usually in separate array if available
      };
    }

    return {
      rawSyndicateMissions: [],
      fissures,
      sortie,
      invasions,
      voidTrader,
      nightwave,
      archonHunt,
      alerts,
      voidStorms,
      darvoDeal,
      arbitration,
      primeResurgence,
    };
  } catch (error) {
    console.error("Failed to fetch world state:", error);
    return null;
  }
}
