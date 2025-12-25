/**
 * AlecaFrame Stats API Service
 * Fetches player data from AlecaFrame using public sharing tokens
 * 
 * API Documentation: https://stats.alecaframe.com/api/swagger/index.html
 */

// Relic types mapping
const RELIC_TYPES = ['Lith', 'Meso', 'Neo', 'Axi', 'Requiem'] as const;
const RELIC_REFINEMENTS = ['Intact', 'Exceptional', 'Flawless', 'Radiant'] as const;

export interface AlecaRelic {
    type: typeof RELIC_TYPES[number];
    refinement: typeof RELIC_REFINEMENTS[number];
    name: string; // e.g. "L1", "B21"
    count: number;
    fullName: string; // e.g. "Lith L1"
}

export interface AlecaFrameData {
    relics: AlecaRelic[];
    totalRelics: number;
    fetchedAt: number;
}

const ALECA_API_BASE = '/api/alecaframe';
const STORAGE_KEY = 'ordis-alecaframe-token';

// Save token to localStorage
export function saveToken(token: string): void {
    localStorage.setItem(STORAGE_KEY, token);
}

// Get saved token
export function getToken(): string | null {
    return localStorage.getItem(STORAGE_KEY);
}

// Clear saved token
export function clearToken(): void {
    localStorage.removeItem(STORAGE_KEY);
}

// Parse binary relic data
// Format: Uint8 (type) + Uint8 (refinement) + char[3] (name) + Uint32 (count) = 9 bytes per relic
function parseRelicData(buffer: ArrayBuffer): AlecaRelic[] {
    const relics: AlecaRelic[] = [];
    const view = new DataView(buffer);
    const RELIC_SIZE = 9;

    for (let offset = 0; offset < buffer.byteLength; offset += RELIC_SIZE) {
        if (offset + RELIC_SIZE > buffer.byteLength) break;

        const typeIndex = view.getUint8(offset);
        const refinementIndex = view.getUint8(offset + 1);

        // Read 3-char name (ASCII)
        const nameBytes = new Uint8Array(buffer, offset + 2, 3);
        const name = String.fromCharCode(...nameBytes).replace(/\0/g, '').trim();

        const count = view.getUint32(offset + 5, true); // Little-endian

        const type = RELIC_TYPES[typeIndex] || 'Lith';
        const refinement = RELIC_REFINEMENTS[refinementIndex] || 'Intact';

        relics.push({
            type,
            refinement,
            name,
            count,
            fullName: `${type} ${name}`,
        });
    }

    return relics;
}

// Fetch relics using public token
export async function fetchRelics(publicToken: string): Promise<AlecaFrameData> {
    try {
        const response = await fetch(`${ALECA_API_BASE}/relics?token=${encodeURIComponent(publicToken)}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/octet-stream',
            },
        });

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                throw new Error('Invalid or expired token');
            }
            if (response.status === 404) {
                throw new Error('Relic data not found - ensure "relics" access is enabled for this token');
            }
            throw new Error(`API error: ${response.status}`);
        }

        const buffer = await response.arrayBuffer();
        const relics = parseRelicData(buffer);
        const totalRelics = relics.reduce((sum, r) => sum + r.count, 0);

        return {
            relics,
            totalRelics,
            fetchedAt: Date.now(),
        };
    } catch (error) {
        console.error('AlecaFrame API error:', error);
        throw error;
    }
}

// Get cached relic data from localStorage
export function getCachedRelics(): AlecaFrameData | null {
    try {
        const cached = localStorage.getItem('ordis-alecaframe-relics');
        return cached ? JSON.parse(cached) : null;
    } catch {
        return null;
    }
}

// Save relic data to localStorage
export function cacheRelics(data: AlecaFrameData): void {
    localStorage.setItem('ordis-alecaframe-relics', JSON.stringify(data));
}
