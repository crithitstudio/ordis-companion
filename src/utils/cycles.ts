/**
 * Time formatting and cycle calculation utilities
 */

/**
 * Format seconds into human-readable duration string
 */
export const formatTime = (seconds: number): string => {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  return `${m}m ${s}s`;
};

// Cycle calculation constants
const CETUS_EPOCH = 1766346175; // Calibrated epoch when Day started
const CYCLE_LENGTH = 9000; // 150 minutes in seconds
const DAY_LENGTH = 6000; // 100 minutes in seconds
const FASS_LENGTH = 6000;

// Orb Vallis constants
const VALLIS_EPOCH = 1544129200; // Dec 6 2018 20:46:40 UTC
const VALLIS_CYCLE = 1600; // 26m 40s
const VALLIS_WARM = 400; // 6m 40s

export interface CycleInfo {
  state: string;
  isDay?: boolean;
  isWarm?: boolean;
  active?: "fass" | "vome";
  timeLeft: string;
}

/**
 * Calculate Cetus/Plains of Eidolon cycle
 * 150m total (100m Day, 50m Night)
 */
export const getCetusCycle = (): CycleInfo => {
  const nowSec = Math.floor(Date.now() / 1000);
  const cyclePosition = (nowSec - CETUS_EPOCH) % CYCLE_LENGTH;

  const isDay = cyclePosition < DAY_LENGTH;
  const timeLeftSec = isDay
    ? DAY_LENGTH - cyclePosition
    : CYCLE_LENGTH - cyclePosition;

  return {
    state: isDay ? "Day" : "Night",
    isDay,
    timeLeft: formatTime(timeLeftSec),
  };
};

/**
 * Earth Cycle - now synced with Cetus
 */
export const getEarthCycle = (): CycleInfo => {
  return getCetusCycle();
};

/**
 * Calculate Cambion Drift cycle
 * 150m total (100m Fass, 50m Vome)
 */
export const getCambionCycle = (): CycleInfo => {
  const nowSec = Math.floor(Date.now() / 1000);
  const cyclePosition = (nowSec - CETUS_EPOCH) % CYCLE_LENGTH;

  const isFass = cyclePosition < FASS_LENGTH;
  const timeLeftSec = isFass
    ? FASS_LENGTH - cyclePosition
    : CYCLE_LENGTH - cyclePosition;

  return {
    state: isFass ? "Fass" : "Vome",
    active: isFass ? "fass" : "vome",
    timeLeft: formatTime(timeLeftSec),
  };
};

/**
 * Calculate Orb Vallis weather cycle
 * 26m 40s total (6m 40s Warm, 20m Cold)
 */
export const getVallisCycle = (): CycleInfo => {
  const nowSec = Math.floor(Date.now() / 1000);
  const time = (nowSec - VALLIS_EPOCH) % VALLIS_CYCLE;

  const isWarm = time < VALLIS_WARM;
  const timeLeftSec = isWarm ? VALLIS_WARM - time : VALLIS_CYCLE - time;

  return {
    state: isWarm ? "Warm" : "Cold",
    isWarm,
    timeLeft: formatTime(timeLeftSec),
  };
};
