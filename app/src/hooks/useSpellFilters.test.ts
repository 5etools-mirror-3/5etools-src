import { describe, it, expect } from "vitest";
import { applyFilters } from "./useSpellFilters";
import type { SpellData } from "../data/spellTypes";

function makeSpell(overrides: Partial<SpellData> & { name: string }): SpellData {
  return {
    id: overrides.name.toLowerCase().replace(/\s+/g, "-"),
    source: "PHB",
    level: 1,
    school: "Evocation",
    schoolIndex: "V",
    castingTime: "1 action",
    castingTimeCategory: "action",
    range: "60 feet",
    components: ["V", "S"],
    duration: "Instantaneous",
    concentration: false,
    ritual: false,
    description: [],
    classes: ["Wizard"],
    damageTypes: [],
    ...overrides,
  };
}

const SPELLS: SpellData[] = [
  makeSpell({ name: "Fireball", level: 3, school: "Evocation", classes: ["Wizard", "Sorcerer"], damageTypes: ["fire"], castingTimeCategory: "action" }),
  makeSpell({ name: "Healing Word", level: 1, school: "Evocation", classes: ["Cleric", "Druid"], castingTimeCategory: "bonus", concentration: false, ritual: false }),
  makeSpell({ name: "Detect Magic", level: 1, school: "Divination", classes: ["Wizard", "Cleric"], castingTimeCategory: "action", ritual: true }),
  makeSpell({ name: "Bless", level: 1, school: "Enchantment", classes: ["Cleric"], castingTimeCategory: "action", concentration: true }),
  makeSpell({ name: "Counterspell", level: 3, school: "Abjuration", classes: ["Wizard", "Sorcerer"], castingTimeCategory: "reaction" }),
  makeSpell({ name: "Haste", level: 3, school: "Transmutation", classes: ["Wizard"], castingTimeCategory: "action", concentration: true, source: "XGE" }),
];

describe("applyFilters", () => {
  it("returns all spells when no filters are set", () => {
    expect(applyFilters(SPELLS, {})).toHaveLength(SPELLS.length);
  });

  it("filters by level (single)", () => {
    const result = applyFilters(SPELLS, { levels: new Set([3]) });
    expect(result.map((s) => s.name)).toEqual(
      expect.arrayContaining(["Fireball", "Counterspell", "Haste"])
    );
    expect(result).toHaveLength(3);
  });

  it("filters by level (OR — multiple levels)", () => {
    const result = applyFilters(SPELLS, { levels: new Set([1, 3]) });
    expect(result).toHaveLength(SPELLS.length); // all are level 1 or 3
  });

  it("returns empty when level set has no matches", () => {
    expect(applyFilters(SPELLS, { levels: new Set([9]) })).toHaveLength(0);
  });

  it("filters by school", () => {
    const result = applyFilters(SPELLS, { schools: new Set(["Evocation"]) });
    expect(result.map((s) => s.name)).toEqual(
      expect.arrayContaining(["Fireball", "Healing Word"])
    );
    expect(result).toHaveLength(2);
  });

  it("filters by school (OR — multiple schools)", () => {
    const result = applyFilters(SPELLS, { schools: new Set(["Evocation", "Divination"]) });
    expect(result).toHaveLength(3);
  });

  it("filters by class (OR within spells that have any of the classes)", () => {
    const result = applyFilters(SPELLS, { classes: new Set(["Cleric"]) });
    expect(result.map((s) => s.name)).toEqual(
      expect.arrayContaining(["Healing Word", "Detect Magic", "Bless"])
    );
    expect(result).toHaveLength(3);
  });

  it("filters by class OR (multiple classes)", () => {
    const result = applyFilters(SPELLS, { classes: new Set(["Druid", "Sorcerer"]) });
    // Healing Word (Druid), Fireball (Sorcerer), Counterspell (Sorcerer)
    expect(result).toHaveLength(3);
  });

  it("filters by casting time", () => {
    const result = applyFilters(SPELLS, { castingTimes: new Set(["bonus"]) });
    expect(result.map((s) => s.name)).toEqual(["Healing Word"]);
  });

  it("filters by casting time (OR — multiple)", () => {
    const result = applyFilters(SPELLS, { castingTimes: new Set(["bonus", "reaction"]) });
    expect(result.map((s) => s.name)).toEqual(
      expect.arrayContaining(["Healing Word", "Counterspell"])
    );
    expect(result).toHaveLength(2);
  });

  it("filters by concentration = true", () => {
    const result = applyFilters(SPELLS, { concentration: true });
    expect(result.map((s) => s.name)).toEqual(
      expect.arrayContaining(["Bless", "Haste"])
    );
    expect(result).toHaveLength(2);
  });

  it("does not filter concentration when undefined", () => {
    const result = applyFilters(SPELLS, { concentration: undefined });
    expect(result).toHaveLength(SPELLS.length);
  });

  it("filters by ritual = true", () => {
    const result = applyFilters(SPELLS, { ritual: true });
    expect(result.map((s) => s.name)).toEqual(["Detect Magic"]);
  });

  it("does not filter ritual when undefined", () => {
    const result = applyFilters(SPELLS, { ritual: undefined });
    expect(result).toHaveLength(SPELLS.length);
  });

  it("filters by source", () => {
    const result = applyFilters(SPELLS, { sources: new Set(["XGE"]) });
    expect(result.map((s) => s.name)).toEqual(["Haste"]);
  });

  it("AND logic: level AND school both required", () => {
    // Level 3 Evocation = only Fireball
    const result = applyFilters(SPELLS, {
      levels: new Set([3]),
      schools: new Set(["Evocation"]),
    });
    expect(result.map((s) => s.name)).toEqual(["Fireball"]);
  });

  it("AND logic: concentration AND school", () => {
    const result = applyFilters(SPELLS, {
      concentration: true,
      schools: new Set(["Transmutation"]),
    });
    expect(result.map((s) => s.name)).toEqual(["Haste"]);
  });

  it("AND logic: multiple combined filters", () => {
    const result = applyFilters(SPELLS, {
      levels: new Set([3]),
      classes: new Set(["Wizard"]),
      castingTimes: new Set(["action"]),
    });
    // Level 3 + Wizard + action: Fireball, Haste
    expect(result.map((s) => s.name)).toEqual(
      expect.arrayContaining(["Fireball", "Haste"])
    );
    expect(result).toHaveLength(2);
  });
});
