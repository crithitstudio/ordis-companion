/**
 * User data export/import utilities
 */

// All localStorage keys used by the app
const USER_DATA_KEYS = [
  "ordis-tracker",
  "ordis-mastery",
  "ordis-mastery-nodes",
  "ordis-mastery-junctions",
  "ordis-mastery-intrinsics",
  "savedRelics",
  "completedNightwaveChallenges",
  "completedSorties",
  "completedArchonHunts",
  "wantedFarmingItems",
  "steelPathWeeklyRewards",
  "steelPathIncarnons",
  "ordis-theme",
  "ordis-collapsed-sections",
] as const;

interface UserData {
  version: number;
  exportedAt: string;
  appName: string;
  data: Record<string, unknown>;
}

const CURRENT_VERSION = 2; // Bumped version for new format

/**
 * Export all user data from localStorage
 */
export function exportUserData(): string {
  const data: Record<string, unknown> = {};

  USER_DATA_KEYS.forEach((key) => {
    const value = localStorage.getItem(key);
    if (value) {
      try {
        data[key] = JSON.parse(value);
      } catch {
        data[key] = value;
      }
    }
  });

  const exportData: UserData = {
    version: CURRENT_VERSION,
    exportedAt: new Date().toISOString(),
    appName: "Ordis Companion",
    data,
  };

  return JSON.stringify(exportData, null, 2);
}

/**
 * Import user data from JSON string
 * Supports both v1 (legacy) and v2 (new) formats
 */
export function importUserData(jsonString: string): {
  success: boolean;
  message: string;
} {
  try {
    const parsed = JSON.parse(jsonString);

    // Basic validation
    if (typeof parsed !== "object" || parsed === null) {
      return { success: false, message: "Invalid data format" };
    }

    // Check for v2 format (new format with data object)
    if (parsed.appName === "Ordis Companion" && parsed.data) {
      const data = parsed.data as Record<string, unknown>;

      Object.entries(data).forEach(([key, value]) => {
        if (USER_DATA_KEYS.includes(key as typeof USER_DATA_KEYS[number])) {
          localStorage.setItem(key, JSON.stringify(value));
        }
      });

      return {
        success: true,
        message: `Imported data from ${parsed.exportedAt || "unknown date"}`,
      };
    }

    // Legacy v1 format support
    if (parsed.version === 1) {
      if (Array.isArray(parsed.tracker)) {
        localStorage.setItem("ordis-tracker", JSON.stringify(parsed.tracker));
      }
      if (Array.isArray(parsed.relics)) {
        localStorage.setItem("savedRelics", JSON.stringify(parsed.relics));
      }
      if (Array.isArray(parsed.mastery)) {
        localStorage.setItem("ordis-mastery", JSON.stringify(parsed.mastery));
      }

      return {
        success: true,
        message: `Imported legacy data from ${parsed.exportedAt || "unknown date"}`,
      };
    }

    return { success: false, message: "Unrecognized data format" };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to parse data",
    };
  }
}

/**
 * Download user data as a JSON file
 */
export function downloadUserData() {
  const data = exportUserData();
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `ordis-backup-${new Date().toISOString().split("T")[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Trigger file picker for import
 */
export function triggerImportDialog(
  onImport: (result: { success: boolean; message: string }) => void,
) {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json";
  input.onchange = async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const result = importUserData(text);
      onImport(result);
    } catch {
      onImport({ success: false, message: "Failed to read file" });
    }
  };
  input.click();
}

/**
 * Clear all user data
 */
export function clearAllUserData() {
  localStorage.removeItem("ordis-tracker");
  localStorage.removeItem("ordis-relics");
  localStorage.removeItem("ordis-mastery");
  localStorage.removeItem("ordis-completed");
}
