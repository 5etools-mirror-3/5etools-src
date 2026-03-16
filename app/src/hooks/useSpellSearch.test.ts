import { describe, it, expect } from "vitest";
import { filterBySearch } from "./useSpellSearch";
import type { SpellData } from "../data/spellTypes";

function makeSpell(name: string): SpellData {
  return {
    id: name.toLowerCase().replace(/\s+/g, "-"),
    name,
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
    classes: [],
    damageTypes: [],
  };
}

const SPELLS = [
  makeSpell("Fireball"),
  makeSpell("Fire Bolt"),
  makeSpell("Magic Missile"),
  makeSpell("Cure Wounds"),
];

describe("filterBySearch", () => {
  it("returns all spells when query is empty", () => {
    expect(filterBySearch(SPELLS, "")).toHaveLength(SPELLS.length);
  });

  it("returns all spells when query is only whitespace", () => {
    expect(filterBySearch(SPELLS, "   ")).toHaveLength(SPELLS.length);
  });

  it("filters by case-insensitive substring match", () => {
    const result = filterBySearch(SPELLS, "fire");
    expect(result).toHaveLength(2);
    expect(result.map((s) => s.name)).toContain("Fireball");
    expect(result.map((s) => s.name)).toContain("Fire Bolt");
  });

  it("is case-insensitive (uppercase query)", () => {
    const result = filterBySearch(SPELLS, "MISSILE");
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Magic Missile");
  });

  it("returns empty array when no spells match", () => {
    expect(filterBySearch(SPELLS, "xyzzy")).toHaveLength(0);
  });

  it("returns exact match", () => {
    const result = filterBySearch(SPELLS, "Cure Wounds");
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Cure Wounds");
  });
});
