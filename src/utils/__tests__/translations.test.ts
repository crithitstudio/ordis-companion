/**
 * Unit tests for translation utilities
 */
import { describe, it, expect } from "vitest";
import {
  translate,
  translateModifier,
  getItemImageUrl,
  getItemCategory,
} from "../translations";

describe("translate function", () => {
  it('should return "Unknown" for empty input', () => {
    expect(translate("")).toBe("Unknown");
  });

  it("should humanize unrecognized keys", () => {
    const result = translate("SomeUnknownKey");
    expect(result).toBe("Some Unknown Key");
  });

  it("should remove MT_ prefix from mission types", () => {
    const result = translate("MT_UNKNOWN_TYPE");
    // Verifies MT_ prefix is stripped even if humanization adds spaces
    expect(result).not.toContain("MT_");
    expect(result.length).toBeGreaterThan(0);
  });

  it("should handle path-based keys", () => {
    const result = translate("/Lotus/SomeCategory/SomeName");
    expect(result).toBe("Some Name");
  });
});

describe("translateModifier function", () => {
  it('should return "None" for empty input', () => {
    expect(translateModifier("")).toBe("None");
  });

  it("should clean up modifier key format", () => {
    const result = translateModifier("SORTIE_MODIFIER_EXIMUS_STRONGHOLD");
    expect(result).toBe("EXIMUS STRONGHOLD");
  });
});

describe("getItemImageUrl function", () => {
  it("should return null for null input", () => {
    expect(getItemImageUrl(null)).toBeNull();
  });

  it("should return null for undefined input", () => {
    expect(getItemImageUrl(undefined)).toBeNull();
  });

  it("should return WFCD URL for item with imageName", () => {
    const item = { imageName: "excalibur.png" };
    const result = getItemImageUrl(item);
    expect(result).toBe(
      "https://raw.githubusercontent.com/WFCD/warframe-items/master/data/img/excalibur.png",
    );
  });

  it("should return null for item without imageName or uniqueName", () => {
    const item = {};
    expect(getItemImageUrl(item)).toBeNull();
  });
});

describe("getItemCategory function", () => {
  describe("path-based categorization", () => {
    it("should categorize Warframe paths correctly", () => {
      expect(getItemCategory("/Lotus/Powersuits/Excalibur")).toBe("Warframe");
      expect(getItemCategory("/Lotus/Types/Warframes/Excalibur")).toBe(
        "Warframe",
      );
    });

    it("should categorize weapon paths correctly", () => {
      expect(getItemCategory("/Lotus/Weapons/LongGuns/Braton")).toBe("Primary");
      expect(getItemCategory("/Lotus/Weapons/Pistols/Lato")).toBe("Secondary");
      expect(getItemCategory("/Lotus/Weapons/Melee/Skana")).toBe("Melee");
    });

    it("should categorize mod paths correctly", () => {
      expect(getItemCategory("/Lotus/Upgrades/Mods/Serration")).toBe("Mod");
    });

    it("should categorize resource paths correctly", () => {
      expect(getItemCategory("/Lotus/Types/Resources/Plastids")).toBe(
        "Resource",
      );
    });

    it('should return "Other" for unknown paths', () => {
      expect(getItemCategory("/Unknown/Path/Here")).toBe("Other");
    });
  });
});
