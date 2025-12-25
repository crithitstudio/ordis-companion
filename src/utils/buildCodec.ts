/**
 * Build Encoding/Decoding Utilities
 * Shared functions for encoding/decoding builds for sharing
 */

interface ModSlot {
  name: string;
  rank: number;
  drain: number;
  polarity?: string;
}

interface Build {
  id: string;
  name: string;
  type:
    | "warframe"
    | "primary"
    | "secondary"
    | "melee"
    | "companion"
    | "archwing";
  itemName: string;
  mods: ModSlot[];
  capacity: number;
  maxCapacity: number;
  forma: number;
  notes: string;
  createdAt: string;
  favorite: boolean;
}

// Encode build to URL-safe string
export function encodeBuild(build: Build): string {
  const buildData = {
    n: build.name,
    t: build.type,
    i: build.itemName,
    m: build.mods
      .filter((m) => m.name)
      .map((m) => ({ n: m.name, r: m.rank, d: m.drain })),
    f: build.forma,
    c: build.maxCapacity,
    o: build.notes,
  };

  try {
    const json = JSON.stringify(buildData);
    // Base64 encode and make URL-safe
    const encoded = btoa(json)
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");
    return encoded;
  } catch {
    return "";
  }
}

// Decode build from URL string
export function decodeBuild(encoded: string): Partial<Build> | null {
  try {
    // Restore Base64 padding and characters
    let base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) {
      base64 += "=";
    }

    const json = atob(base64);
    const data = JSON.parse(json);

    return {
      name: data.n || "Imported Build",
      type: data.t || "warframe",
      itemName: data.i || "Unknown",
      mods: (data.m || []).map((m: { n: string; r: number; d: number }) => ({
        name: m.n || "",
        rank: m.r || 0,
        drain: m.d || 0,
      })),
      forma: data.f || 0,
      maxCapacity: data.c || 60,
      notes: data.o || "",
    };
  } catch {
    return null;
  }
}
