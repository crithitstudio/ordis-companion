// Ordis Companion - Shared Types

// --- World State Types ---

export interface Fissure {
  id: string;
  node: string;
  missionType: string;
  enemy: string;
  tier: string;
  tierNum: number;
  expiry: string;
  eta: string;
}

export interface Invasion {
  id: string;
  node: string;
  attackingFaction: string;
  defendingFaction: string;
  attackerReward: string;
  defenderReward: string;
  progress: number; // -100 to 100, negative = attacker winning
  eta: string;
  completed: boolean;
}

export interface VoidTrader {
  active: boolean;
  location: string;
  startString: string;
  endString: string;
}

export interface NightwaveChallenge {
  id: string;
  title: string;
  description: string;
  standing: number;
  isDaily: boolean;
  isElite: boolean;
}

export interface ArchonHunt {
  boss: string;
  eta: string;
  missions: {
    missionType: string;
    node: string;
  }[];
}

export interface Alert {
  id: string;
  mission: string;
  node: string;
  faction: string;
  reward: string;
  eta: string;
}

export interface VoidStorm {
  id: string;
  node: string;
  tier: string;
  eta: string;
}

export interface DarvoDeal {
  item: string;
  discount: number;
  originalPrice: number;
  salePrice: number;
  stock: number;
  sold: number;
  eta: string;
}

export interface Sortie {
  boss: string;
  faction: string;
  eta: string;
  variants: {
    missionType: string;
    modifier: string;
    node: string;
  }[];
}

export interface CycleState {
  state: string;
  isDay?: boolean;
  isWarm?: boolean;
  active?: string;
  timeLeft: string;
}

export interface WorldState {
  fissures: Fissure[];
  sortie: Sortie | null;
  invasions: Invasion[];
  voidTrader: VoidTrader | null;
  nightwave: NightwaveChallenge[];
  archonHunt: ArchonHunt | null;
  alerts: Alert[];
  voidStorms: VoidStorm[];
  darvoDeal: DarvoDeal | null;
  rawSyndicateMissions: unknown[];
}

// --- Item Data Types ---

export interface ItemComponent {
  name: string;
  count: number;
  uniqueName: string;
  imageName?: string | null;
}

export interface ItemDrop {
  location: string;
  type: string;
  chance: number;
  rarity: string;
}

export interface ItemData {
  name: string;
  type: string;
  category: string;
  description: string;
  wikiaUrl: string | null;
  imageName: string | null;
  tradable: boolean;
  masteryReq: number;
  buildPrice: number | null;
  buildTime: number | null;
  skipBuildTimePrice: number | null;
  uniqueName?: string;
  components?: ItemComponent[];
  drops?: ItemDrop[];
}

// --- User Data Types ---

export interface SavedItem {
  id: string;
  name: string;
  category: string;
  notes: string;
  completed: boolean;
  addedAt: number;
}

export interface SavedRelic {
  id: string;
  name: string;
  era: string;
  refinement: "Intact" | "Exceptional" | "Flawless" | "Radiant";
  quantity: number;
  wanted: boolean;
}

// --- Tab Navigation ---

export type TabName =
  | "dashboard"
  | "codex"
  | "tracker"
  | "relics"
  | "guide"
  | "mastery";

// --- Static Data Types ---

export interface SolNode {
  value: string;
  type?: string;
  enemy?: string;
}

export interface SortieData {
  modifierTypes: Record<string, string>;
  bosses: Record<string, { name: string; faction: string }>;
}

export interface LanguageEntry {
  value: string;
}

export interface MissionTypeEntry {
  value: string;
}
