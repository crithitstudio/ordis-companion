/**
 * User data export/import utilities
 */

interface UserData {
    version: number;
    exportedAt: string;
    tracker: unknown[];
    relics: unknown[];
    mastery: string[];
    completed: string[];
}

const CURRENT_VERSION = 1;

/**
 * Export all user data from localStorage
 */
export function exportUserData(): string {
    const data: UserData = {
        version: CURRENT_VERSION,
        exportedAt: new Date().toISOString(),
        tracker: JSON.parse(localStorage.getItem('ordis-tracker') || '[]'),
        relics: JSON.parse(localStorage.getItem('ordis-relics') || '[]'),
        mastery: JSON.parse(localStorage.getItem('ordis-mastery') || '[]'),
        completed: JSON.parse(localStorage.getItem('ordis-completed') || '[]'),
    };
    return JSON.stringify(data, null, 2);
}

/**
 * Import user data from JSON string
 */
export function importUserData(jsonString: string): { success: boolean; message: string } {
    try {
        const data = JSON.parse(jsonString) as Partial<UserData>;

        // Basic validation
        if (typeof data !== 'object' || data === null) {
            return { success: false, message: 'Invalid data format' };
        }

        if (!data.version || data.version > CURRENT_VERSION) {
            return { success: false, message: 'Unsupported data version' };
        }

        // Import each data type if present
        if (Array.isArray(data.tracker)) {
            localStorage.setItem('ordis-tracker', JSON.stringify(data.tracker));
        }
        if (Array.isArray(data.relics)) {
            localStorage.setItem('ordis-relics', JSON.stringify(data.relics));
        }
        if (Array.isArray(data.mastery)) {
            localStorage.setItem('ordis-mastery', JSON.stringify(data.mastery));
        }
        if (Array.isArray(data.completed)) {
            localStorage.setItem('ordis-completed', JSON.stringify(data.completed));
        }

        return {
            success: true,
            message: `Imported data from ${data.exportedAt || 'unknown date'}`
        };
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Failed to parse data'
        };
    }
}

/**
 * Download user data as a JSON file
 */
export function downloadUserData() {
    const data = exportUserData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ordis-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Trigger file picker for import
 */
export function triggerImportDialog(onImport: (result: { success: boolean; message: string }) => void) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;

        try {
            const text = await file.text();
            const result = importUserData(text);
            onImport(result);
        } catch (error) {
            onImport({ success: false, message: 'Failed to read file' });
        }
    };
    input.click();
}

/**
 * Clear all user data
 */
export function clearAllUserData() {
    localStorage.removeItem('ordis-tracker');
    localStorage.removeItem('ordis-relics');
    localStorage.removeItem('ordis-mastery');
    localStorage.removeItem('ordis-completed');
}
