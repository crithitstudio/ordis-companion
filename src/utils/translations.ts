/**
 * Translation utilities for Warframe data
 * Uses WFCD data files with fallback to humanization
 */

import solNodesData from "../data/solNodes.json";
import sortieDataRaw from "../data/sortieData.json";
import languagesData from "../data/languages.json";
import missionTypesData from "../data/missionTypes.json";
import itemNamesData from "../data/itemNames.json";
import itemsDataRaw from "../data/itemsData.json";

import type {
  SolNode,
  SortieData,
  LanguageEntry,
  MissionTypeEntry,
  ItemData,
} from "../types";

// Type-safe data exports
export const solNodes = solNodesData as Record<string, SolNode>;
export const sortieData = sortieDataRaw as SortieData;
export const languages = languagesData as Record<string, LanguageEntry>;
export const missionTypes = missionTypesData as Record<
  string,
  MissionTypeEntry
>;
export const itemNames = itemNamesData as Record<string, string>;
export const itemsData = itemsDataRaw as Record<string, ItemData>;

/**
 * Unified translation function - checks WFCD data with fallback to humanization
 */
export const translate = (key: string): string => {
  if (!key) return "Unknown";

  // Check mission types first (for MT_* keys)
  if (missionTypes[key]) return missionTypes[key].value;

  // Check itemNames (WFCD warframe-items data)
  if (itemNames[key]) return itemNames[key];

  // Check languages.json (for items/paths)
  if (languages[key]) return languages[key].value;

  // StoreItems paths - remove /StoreItems/ prefix and try again
  const storeItemMatch = key.match(/\/Lotus\/StoreItems\/(.+)/);
  if (storeItemMatch) {
    const basePath = "/Lotus/" + storeItemMatch[1];
    if (itemNames[basePath]) return itemNames[basePath];
  }

  // Fallback: humanize the key
  const lastSegment = key.split("/").pop() || key;
  return lastSegment
    .replace(/^MT_/, "")
    .replace(/^SORTIE_BOSS_/, "")
    .replace(/^SORTIE_MODIFIER_/, "")
    .replace(/_/g, " ")
    .replace(/([A-Z])/g, " $1")
    .replace(/\s+/g, " ")
    .trim();
};

/**
 * Translate sortie modifier types
 */
export const translateModifier = (key: string): string => {
  if (!key) return "None";
  if (sortieData.modifierTypes[key]) return sortieData.modifierTypes[key];
  return key.replace("SORTIE_MODIFIER_", "").replace(/_/g, " ");
};

/**
 * Get item image URL from WFCD GitHub Raw
 */
export const getItemImageUrl = (
  item: { imageName?: string | null; uniqueName?: string } | null | undefined,
): string | null => {
  if (!item) return null;

  // Use guaranteed imageName if available
  if (item.imageName) {
    return `https://raw.githubusercontent.com/WFCD/warframe-items/master/data/img/${item.imageName}`;
  }

  // Fallback: Look up in itemsData by uniqueName
  if (item.uniqueName && itemsData[item.uniqueName]?.imageName) {
    return `https://raw.githubusercontent.com/WFCD/warframe-items/master/data/img/${itemsData[item.uniqueName].imageName}`;
  }

  return null;
};

/**
 * Get boss/faction sigil images from WFCD CDN
 * Currently returns null - placeholder for future implementation
 */
export const getBossImageUrl = (): string | null => {
  return null;
};

/**
 * Helper to categorize items using itemsData
 */
export const getItemCategory = (path: string): string => {
  const item = itemsData[path];
  if (item) {
    const cat = item.category || item.type || "Unknown";
    if (cat === "Warframes" || cat === "Warframe") return "Warframe";
    if (
      cat === "Primary" ||
      cat === "LongGun" ||
      cat === "Rifle" ||
      cat === "Shotgun"
    )
      return "Primary";
    if (cat === "Secondary" || cat === "Pistol") return "Secondary";
    if (cat === "Melee") return "Melee";
    if (cat === "Mods" || cat === "Mod") return "Mod";
    if (
      cat === "Resources" ||
      cat === "Resource" ||
      cat === "Fish" ||
      cat === "Gem"
    )
      return "Resource";
    return "Other";
  }
  // Fallback to path-based if item not in itemsData
  if (
    path.includes("/Warframes/") ||
    path.includes("/Suits/") ||
    path.includes("/Powersuits/")
  )
    return "Warframe";
  if (path.includes("/LongGuns/")) return "Primary";
  if (path.includes("/Pistols/")) return "Secondary";
  if (path.includes("/Melee/")) return "Melee";
  if (path.includes("/Mods/") || path.includes("/Upgrades/")) return "Mod";
  if (path.includes("/Resources/") || path.includes("/Materials/"))
    return "Resource";
  return "Other";
};
