import { describe, it, expect, beforeEach } from "vitest";
import { useSpellStore } from "./useSpellStore";
import type { SpellData } from "../data/spellTypes";

// Helper to make minimal SpellData objects
const makeSpell = (overrides: Partial<SpellData>): SpellData => ({
  id: "test-spell_phb",
  name: "Test Spell",
  source: "PHB",
  level: 1,
  school: "Evocation",
  schoolIndex: "evocation",
  castingTime: "1 Action",
  castingTimeCategory: "action",
  range: "60 feet",
  components: ["V", "S"],
  duration: "Instantaneous",
  concentration: false,
  ritual: false,
  description: ["A test spell."],
  classes: ["Wizard"],
  damageTypes: [],
  ...overrides,
});

// Reset store state before each test
beforeEach(() => {
  useSpellStore.setState({
    spells: [],
    loading: false,
    error: null,
    warnings: [],
  });
});

// ── Initial state ─────────────────────────────────────────────────────────────

describe("initial state", () => {
  it("spells is empty array", () => {
    expect(useSpellStore.getState().spells).toEqual([]);
  });

  it("loading is false", () => {
    expect(useSpellStore.getState().loading).toBe(false);
  });

  it("error is null", () => {
    expect(useSpellStore.getState().error).toBeNull();
  });

  it("warnings is empty array", () => {
    expect(useSpellStore.getState().warnings).toEqual([]);
  });
});

// ── Setters ───────────────────────────────────────────────────────────────────

describe("setSpells", () => {
  it("updates spells array", () => {
    const spell = makeSpell({});
    useSpellStore.getState().setSpells([spell]);
    expect(useSpellStore.getState().spells).toHaveLength(1);
    expect(useSpellStore.getState().spells[0].name).toBe("Test Spell");
  });

  it("replaces existing spells", () => {
    const s1 = makeSpell({ name: "Spell 1" });
    const s2 = makeSpell({ name: "Spell 2" });
    useSpellStore.getState().setSpells([s1]);
    useSpellStore.getState().setSpells([s2]);
    expect(useSpellStore.getState().spells).toHaveLength(1);
    expect(useSpellStore.getState().spells[0].name).toBe("Spell 2");
  });

  it("can set empty array", () => {
    useSpellStore.getState().setSpells([makeSpell({})]);
    useSpellStore.getState().setSpells([]);
    expect(useSpellStore.getState().spells).toHaveLength(0);
  });
});

describe("setLoading", () => {
  it("sets loading to true", () => {
    useSpellStore.getState().setLoading(true);
    expect(useSpellStore.getState().loading).toBe(true);
  });

  it("sets loading to false", () => {
    useSpellStore.getState().setLoading(true);
    useSpellStore.getState().setLoading(false);
    expect(useSpellStore.getState().loading).toBe(false);
  });
});

describe("setError", () => {
  it("sets an error message", () => {
    useSpellStore.getState().setError("Something went wrong");
    expect(useSpellStore.getState().error).toBe("Something went wrong");
  });

  it("clears error with null", () => {
    useSpellStore.getState().setError("An error");
    useSpellStore.getState().setError(null);
    expect(useSpellStore.getState().error).toBeNull();
  });
});

describe("setWarnings", () => {
  it("sets warnings array", () => {
    useSpellStore.getState().setWarnings(["warn1", "warn2"]);
    expect(useSpellStore.getState().warnings).toEqual(["warn1", "warn2"]);
  });

  it("replaces existing warnings", () => {
    useSpellStore.getState().setWarnings(["old"]);
    useSpellStore.getState().setWarnings(["new"]);
    expect(useSpellStore.getState().warnings).toEqual(["new"]);
  });

  it("can clear warnings with empty array", () => {
    useSpellStore.getState().setWarnings(["warn"]);
    useSpellStore.getState().setWarnings([]);
    expect(useSpellStore.getState().warnings).toHaveLength(0);
  });
});

// ── allClasses ────────────────────────────────────────────────────────────────

describe("allClasses", () => {
  it("returns empty array when no spells", () => {
    expect(useSpellStore.getState().allClasses()).toEqual([]);
  });

  it("returns unique sorted class names", () => {
    useSpellStore.getState().setSpells([
      makeSpell({ classes: ["Wizard", "Sorcerer"] }),
      makeSpell({ classes: ["Wizard", "Cleric"] }),
    ]);
    expect(useSpellStore.getState().allClasses()).toEqual([
      "Cleric",
      "Sorcerer",
      "Wizard",
    ]);
  });

  it("deduplicates classes across spells", () => {
    useSpellStore.getState().setSpells([
      makeSpell({ classes: ["Wizard"] }),
      makeSpell({ classes: ["Wizard"] }),
      makeSpell({ classes: ["Wizard"] }),
    ]);
    expect(useSpellStore.getState().allClasses()).toEqual(["Wizard"]);
  });

  it("handles spells with no classes", () => {
    useSpellStore.getState().setSpells([
      makeSpell({ classes: [] }),
      makeSpell({ classes: ["Druid"] }),
    ]);
    expect(useSpellStore.getState().allClasses()).toEqual(["Druid"]);
  });

  it("sorts alphabetically", () => {
    useSpellStore.getState().setSpells([
      makeSpell({ classes: ["Warlock", "Artificer", "Bard"] }),
    ]);
    expect(useSpellStore.getState().allClasses()).toEqual([
      "Artificer",
      "Bard",
      "Warlock",
    ]);
  });
});

// ── allSources ────────────────────────────────────────────────────────────────

describe("allSources", () => {
  it("returns empty array when no spells", () => {
    expect(useSpellStore.getState().allSources()).toEqual([]);
  });

  it("returns unique sorted source abbreviations", () => {
    useSpellStore.getState().setSpells([
      makeSpell({ source: "XPHB" }),
      makeSpell({ source: "PHB" }),
      makeSpell({ source: "TCE" }),
    ]);
    expect(useSpellStore.getState().allSources()).toEqual([
      "PHB",
      "TCE",
      "XPHB",
    ]);
  });

  it("deduplicates sources", () => {
    useSpellStore.getState().setSpells([
      makeSpell({ source: "PHB" }),
      makeSpell({ source: "PHB" }),
      makeSpell({ source: "XGE" }),
    ]);
    expect(useSpellStore.getState().allSources()).toEqual(["PHB", "XGE"]);
  });

  it("sorts alphabetically", () => {
    useSpellStore.getState().setSpells([
      makeSpell({ source: "XGE" }),
      makeSpell({ source: "AAG" }),
      makeSpell({ source: "TCE" }),
    ]);
    expect(useSpellStore.getState().allSources()).toEqual(["AAG", "TCE", "XGE"]);
  });

  it("handles single source", () => {
    useSpellStore.getState().setSpells([makeSpell({ source: "PHB" })]);
    expect(useSpellStore.getState().allSources()).toEqual(["PHB"]);
  });
});
