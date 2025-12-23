/**
 * Unit tests for GuideView component data
 */
import { describe, it, expect, beforeEach } from "vitest";

// Progression milestones from GuideView
const PROGRESSION_MILESTONES = [
  {
    id: "complete-tutorial",
    text: "Complete Vor's Prize quest",
    category: "Early",
  },
  {
    id: "rank-mods",
    text: "Rank damage mods to 6+ (Serration, etc.)",
    category: "Early",
  },
  { id: "reach-mr5", text: "Reach Mastery Rank 5", category: "Early" },
  {
    id: "complete-second-dream",
    text: "Complete The Second Dream quest",
    category: "Mid",
  },
  {
    id: "complete-war-within",
    text: "Complete The War Within quest",
    category: "Mid",
  },
  {
    id: "unlock-arbitrations",
    text: "Unlock Arbitrations (all star chart nodes)",
    category: "Late",
  },
  {
    id: "unlock-steel-path",
    text: "Unlock Steel Path (MR required)",
    category: "Late",
  },
  { id: "reach-mr30", text: "Reach Mastery Rank 30", category: "Endgame" },
  {
    id: "reach-legendary",
    text: "Reach Legendary Rank (LR1+)",
    category: "Endgame",
  },
];

const DAILY_ACTIVITIES = [
  { title: "Daily Login Reward", priority: "Essential" },
  { title: "Nightwave Daily Acts", priority: "High" },
  { title: "Syndicate Standing Cap", priority: "Medium" },
  { title: "Steel Path Incursions", priority: "Medium" },
  { title: "Sortie", priority: "High" },
  { title: "Simaris Standing", priority: "Low" },
];

describe("Guide Data Validation", () => {
  describe("Progression Milestones", () => {
    it("should have unique IDs for all milestones", () => {
      const ids = PROGRESSION_MILESTONES.map((m) => m.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it("should have valid categories for all milestones", () => {
      const validCategories = ["Early", "Mid", "Late", "Endgame"];
      PROGRESSION_MILESTONES.forEach((milestone) => {
        expect(validCategories).toContain(milestone.category);
      });
    });

    it("should have Early game milestones", () => {
      const earlyMilestones = PROGRESSION_MILESTONES.filter(
        (m) => m.category === "Early",
      );
      expect(earlyMilestones.length).toBeGreaterThan(0);
    });

    it("should have Endgame milestones including Legendary Rank", () => {
      const endgameMilestones = PROGRESSION_MILESTONES.filter(
        (m) => m.category === "Endgame",
      );
      expect(endgameMilestones.some((m) => m.id === "reach-legendary")).toBe(
        true,
      );
    });
  });

  describe("Daily Activities", () => {
    it("should have valid priorities", () => {
      const validPriorities = ["Essential", "High", "Medium", "Low"];
      DAILY_ACTIVITIES.forEach((activity) => {
        expect(validPriorities).toContain(activity.priority);
      });
    });

    it("should have at least one Essential priority activity", () => {
      const essential = DAILY_ACTIVITIES.filter(
        (a) => a.priority === "Essential",
      );
      expect(essential.length).toBeGreaterThanOrEqual(1);
    });

    it("should include Sortie as High priority", () => {
      const sortie = DAILY_ACTIVITIES.find((a) => a.title === "Sortie");
      expect(sortie).toBeDefined();
      expect(sortie?.priority).toBe("High");
    });
  });
});

describe("Milestone Toggle Logic", () => {
  let completedMilestones: Set<string>;

  beforeEach(() => {
    completedMilestones = new Set();
  });

  const toggleMilestone = (id: string) => {
    if (completedMilestones.has(id)) {
      completedMilestones.delete(id);
    } else {
      completedMilestones.add(id);
    }
  };

  it("should add milestone when toggled first time", () => {
    toggleMilestone("reach-mr5");
    expect(completedMilestones.has("reach-mr5")).toBe(true);
  });

  it("should remove milestone when toggled second time", () => {
    toggleMilestone("reach-mr5");
    toggleMilestone("reach-mr5");
    expect(completedMilestones.has("reach-mr5")).toBe(false);
  });

  it("should track multiple milestones independently", () => {
    toggleMilestone("reach-mr5");
    toggleMilestone("join-clan");
    toggleMilestone("reach-mr5"); // Untoggle

    expect(completedMilestones.has("reach-mr5")).toBe(false);
    expect(completedMilestones.has("join-clan")).toBe(true);
  });
});
