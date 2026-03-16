import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  buildSpellId,
  normalizeCastingTime,
  normalizeRange,
  normalizeDuration,
  normalizeComponents,
  buildClassMap,
  normalizeSpell,
  loadAllSpells,
} from "./spellLoader";
import type { RawSpell, RawSourcesData } from "./spellTypes";

// ── buildSpellId ──────────────────────────────────────────────────────────────

describe("buildSpellId", () => {
  it("lowercases name and source", () => {
    expect(buildSpellId("Fireball", "PHB")).toBe("fireball_phb");
  });

  it("encodes special characters in name", () => {
    expect(buildSpellId("Drawmij's Instant Summons", "PHB")).toBe(
      "drawmij's%20instant%20summons_phb"
    );
  });

  it("encodes spaces in name", () => {
    expect(buildSpellId("Magic Missile", "PHB")).toBe("magic%20missile_phb");
  });

  it("handles source with mixed case", () => {
    expect(buildSpellId("Aid", "XPHB")).toBe("aid_xphb");
  });

  it("encodes special chars in source", () => {
    expect(buildSpellId("Spell", "AitFR-AVT")).toBe("spell_aitfr-avt");
  });
});

// ── normalizeCastingTime ──────────────────────────────────────────────────────

describe("normalizeCastingTime", () => {
  it("1 action", () => {
    expect(normalizeCastingTime([{ number: 1, unit: "action" }])).toEqual({
      display: "1 Action",
      category: "action",
    });
  });

  it("multiple actions", () => {
    expect(normalizeCastingTime([{ number: 2, unit: "action" }])).toEqual({
      display: "2 Actions",
      category: "action",
    });
  });

  it("bonus action", () => {
    expect(normalizeCastingTime([{ number: 1, unit: "bonus" }])).toEqual({
      display: "Bonus Action",
      category: "bonus",
    });
  });

  it("reaction", () => {
    expect(normalizeCastingTime([{ number: 1, unit: "reaction" }])).toEqual({
      display: "Reaction",
      category: "reaction",
    });
  });

  it("1 minute → minute+ category", () => {
    expect(normalizeCastingTime([{ number: 1, unit: "minute" }])).toEqual({
      display: "1 Minute",
      category: "minute+",
    });
  });

  it("10 minutes", () => {
    expect(normalizeCastingTime([{ number: 10, unit: "minute" }])).toEqual({
      display: "10 Minutes",
      category: "minute+",
    });
  });

  it("1 hour → minute+ category", () => {
    expect(normalizeCastingTime([{ number: 1, unit: "hour" }])).toEqual({
      display: "1 Hour",
      category: "minute+",
    });
  });

  it("8 hours", () => {
    expect(normalizeCastingTime([{ number: 8, unit: "hour" }])).toEqual({
      display: "8 Hours",
      category: "minute+",
    });
  });

  it("empty array → default action", () => {
    expect(normalizeCastingTime([])).toEqual({
      display: "1 Action",
      category: "action",
    });
  });

  it("uses first entry only", () => {
    expect(
      normalizeCastingTime([
        { number: 1, unit: "action" },
        { number: 1, unit: "minute" },
      ])
    ).toEqual({ display: "1 Action", category: "action" });
  });
});

// ── normalizeRange ────────────────────────────────────────────────────────────

describe("normalizeRange", () => {
  it("point with feet", () => {
    expect(
      normalizeRange({ type: "point", distance: { type: "feet", amount: 60 } })
    ).toBe("60 feet");
  });

  it("point with 0 feet", () => {
    expect(
      normalizeRange({ type: "point", distance: { type: "feet", amount: 0 } })
    ).toBe("0 feet");
  });

  it("self distance", () => {
    expect(
      normalizeRange({ type: "point", distance: { type: "self" } })
    ).toBe("Self");
  });

  it("touch distance", () => {
    expect(
      normalizeRange({ type: "point", distance: { type: "touch" } })
    ).toBe("Touch");
  });

  it("sight distance", () => {
    expect(
      normalizeRange({ type: "point", distance: { type: "sight" } })
    ).toBe("Sight");
  });

  it("unlimited distance", () => {
    expect(
      normalizeRange({ type: "point", distance: { type: "unlimited" } })
    ).toBe("Unlimited");
  });

  it("1 mile", () => {
    expect(
      normalizeRange({ type: "point", distance: { type: "miles", amount: 1 } })
    ).toBe("1 mile");
  });

  it("multiple miles", () => {
    expect(
      normalizeRange({ type: "point", distance: { type: "miles", amount: 5 } })
    ).toBe("5 miles");
  });

  it("special range type", () => {
    expect(normalizeRange({ type: "special" })).toBe("Special");
  });

  it("no distance → Self", () => {
    expect(normalizeRange({ type: "point" })).toBe("Self");
  });

  it("sphere with feet → Self (N-foot Sphere)", () => {
    expect(
      normalizeRange({
        type: "sphere",
        distance: { type: "feet", amount: 10 },
      })
    ).toBe("Self (10-foot Sphere)");
  });

  it("cone with feet → Self (N-foot Cone)", () => {
    expect(
      normalizeRange({
        type: "cone",
        distance: { type: "feet", amount: 15 },
      })
    ).toBe("Self (15-foot Cone)");
  });

  it("radius with feet → Self (N-foot Radius)", () => {
    expect(
      normalizeRange({
        type: "radius",
        distance: { type: "feet", amount: 30 },
      })
    ).toBe("Self (30-foot Radius)");
  });
});

// ── normalizeDuration ─────────────────────────────────────────────────────────

describe("normalizeDuration", () => {
  it("instant", () => {
    expect(normalizeDuration([{ type: "instant" }])).toEqual({
      display: "Instantaneous",
      concentration: false,
    });
  });

  it("permanent", () => {
    expect(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      normalizeDuration([{ type: "permanent", ends: ["dispel"] } as any])
    ).toEqual({ display: "Permanent", concentration: false });
  });

  it("special", () => {
    expect(normalizeDuration([{ type: "special" }])).toEqual({
      display: "Special",
      concentration: false,
    });
  });

  it("timed minutes", () => {
    expect(
      normalizeDuration([
        { type: "timed", duration: { type: "minute", amount: 1 } },
      ])
    ).toEqual({ display: "1 Minute", concentration: false });
  });

  it("timed multiple minutes", () => {
    expect(
      normalizeDuration([
        { type: "timed", duration: { type: "minute", amount: 10 } },
      ])
    ).toEqual({ display: "10 Minutes", concentration: false });
  });

  it("timed 1 hour", () => {
    expect(
      normalizeDuration([
        { type: "timed", duration: { type: "hour", amount: 1 } },
      ])
    ).toEqual({ display: "1 Hour", concentration: false });
  });

  it("timed 8 hours", () => {
    expect(
      normalizeDuration([
        { type: "timed", duration: { type: "hour", amount: 8 } },
      ])
    ).toEqual({ display: "8 Hours", concentration: false });
  });

  it("timed rounds", () => {
    expect(
      normalizeDuration([
        { type: "timed", duration: { type: "round", amount: 1 } },
      ])
    ).toEqual({ display: "1 Round", concentration: false });
  });

  it("concentration flag", () => {
    expect(
      normalizeDuration([
        {
          type: "timed",
          duration: { type: "minute", amount: 1 },
          concentration: true,
        },
      ])
    ).toEqual({ display: "1 Minute", concentration: true });
  });

  it("timed with days", () => {
    expect(
      normalizeDuration([
        { type: "timed", duration: { type: "day", amount: 7 } },
      ])
    ).toEqual({ display: "7 Days", concentration: false });
  });

  it("empty array → Instantaneous", () => {
    expect(normalizeDuration([])).toEqual({
      display: "Instantaneous",
      concentration: false,
    });
  });

  it("uses first entry only", () => {
    expect(
      normalizeDuration([
        { type: "instant" },
        { type: "permanent" },
      ])
    ).toEqual({ display: "Instantaneous", concentration: false });
  });
});

// ── normalizeComponents ───────────────────────────────────────────────────────

describe("normalizeComponents", () => {
  it("V and S only", () => {
    expect(normalizeComponents({ v: true, s: true })).toEqual({
      components: ["V", "S"],
    });
  });

  it("V only", () => {
    expect(normalizeComponents({ v: true })).toEqual({ components: ["V"] });
  });

  it("S only", () => {
    expect(normalizeComponents({ s: true })).toEqual({ components: ["S"] });
  });

  it("M as string", () => {
    expect(normalizeComponents({ m: "a tiny bell" })).toEqual({
      components: ["M"],
      material: "a tiny bell",
    });
  });

  it("M as object with text", () => {
    expect(
      normalizeComponents({ m: { text: "gold dust worth at least 25 gp" } })
    ).toEqual({
      components: ["M"],
      material: "gold dust worth at least 25 gp",
    });
  });

  it("M as boolean true — no material text", () => {
    expect(normalizeComponents({ m: true })).toEqual({ components: ["M"] });
  });

  it("VSM with string material", () => {
    expect(
      normalizeComponents({ v: true, s: true, m: "a piece of silver wire" })
    ).toEqual({
      components: ["V", "S", "M"],
      material: "a piece of silver wire",
    });
  });

  it("empty components", () => {
    expect(normalizeComponents({})).toEqual({ components: [] });
  });
});

// ── buildClassMap ─────────────────────────────────────────────────────────────

describe("buildClassMap", () => {
  const sourcesData: RawSourcesData = {
    PHB: {
      Fireball: {
        class: [
          { name: "Wizard", source: "PHB" },
          { name: "Sorcerer", source: "PHB" },
          { name: "Wizard", source: "XPHB" }, // duplicate name
        ],
      },
      "Magic Missile": {
        class: [
          { name: "Wizard", source: "PHB" },
        ],
      },
    },
    XPHB: {
      Fireball: {
        class: [
          { name: "Sorcerer", source: "XPHB" },
          { name: "Wizard", source: "XPHB" },
        ],
      },
    },
  };

  it("deduplicates class names", () => {
    const map = buildClassMap(sourcesData);
    expect(map["PHB"]["Fireball"]).toEqual(["Sorcerer", "Wizard"]);
  });

  it("sorts class names", () => {
    const map = buildClassMap(sourcesData);
    expect(map["PHB"]["Fireball"]).toEqual(["Sorcerer", "Wizard"]);
  });

  it("handles single class", () => {
    const map = buildClassMap(sourcesData);
    expect(map["PHB"]["Magic Missile"]).toEqual(["Wizard"]);
  });

  it("handles multiple sources", () => {
    const map = buildClassMap(sourcesData);
    expect(map["XPHB"]["Fireball"]).toEqual(["Sorcerer", "Wizard"]);
  });

  it("handles spells with no class data", () => {
    const data: RawSourcesData = {
      PHB: { NoClass: {} },
    };
    const map = buildClassMap(data);
    expect(map["PHB"]["NoClass"]).toEqual([]);
  });
});

// ── normalizeSpell ────────────────────────────────────────────────────────────

const makeRawSpell = (overrides: Partial<RawSpell> = {}): RawSpell => ({
  name: "Fireball",
  source: "PHB",
  level: 3,
  school: "V",
  time: [{ number: 1, unit: "action" }],
  range: { type: "point", distance: { type: "feet", amount: 150 } },
  components: { v: true, s: true, m: "a tiny ball of bat guano and sulfur" },
  duration: [{ type: "instant" }],
  entries: ["A bright streak flashes from your pointing finger."],
  damageInflict: ["fire"],
  page: 241,
  ...overrides,
});

const emptyClassMap: Record<string, Record<string, string[]>> = {};

describe("normalizeSpell", () => {
  it("builds correct id", () => {
    const spell = normalizeSpell(makeRawSpell(), emptyClassMap);
    expect(spell.id).toBe("fireball_phb");
  });

  it("maps school abbreviation to full name", () => {
    const spell = normalizeSpell(makeRawSpell(), emptyClassMap);
    expect(spell.school).toBe("Evocation");
  });

  it("maps school abbreviation to index", () => {
    const spell = normalizeSpell(makeRawSpell(), emptyClassMap);
    expect(spell.schoolIndex).toBe("evocation");
  });

  it("normalizes casting time", () => {
    const spell = normalizeSpell(makeRawSpell(), emptyClassMap);
    expect(spell.castingTime).toBe("1 Action");
    expect(spell.castingTimeCategory).toBe("action");
  });

  it("normalizes range", () => {
    const spell = normalizeSpell(makeRawSpell(), emptyClassMap);
    expect(spell.range).toBe("150 feet");
  });

  it("normalizes components with material string", () => {
    const spell = normalizeSpell(makeRawSpell(), emptyClassMap);
    expect(spell.components).toEqual(["V", "S", "M"]);
    expect(spell.material).toBe("a tiny ball of bat guano and sulfur");
  });

  it("normalizes duration", () => {
    const spell = normalizeSpell(makeRawSpell(), emptyClassMap);
    expect(spell.duration).toBe("Instantaneous");
    expect(spell.concentration).toBe(false);
  });

  it("detects ritual from meta", () => {
    const spell = normalizeSpell(
      makeRawSpell({ meta: { ritual: true } }),
      emptyClassMap
    );
    expect(spell.ritual).toBe(true);
  });

  it("ritual false when no meta", () => {
    const spell = normalizeSpell(makeRawSpell(), emptyClassMap);
    expect(spell.ritual).toBe(false);
  });

  it("includes damage types", () => {
    const spell = normalizeSpell(makeRawSpell(), emptyClassMap);
    expect(spell.damageTypes).toEqual(["fire"]);
  });

  it("includes page", () => {
    const spell = normalizeSpell(makeRawSpell(), emptyClassMap);
    expect(spell.page).toBe(241);
  });

  it("no page when not in raw", () => {
    const raw = makeRawSpell();
    delete raw.page;
    const spell = normalizeSpell(raw, emptyClassMap);
    expect(spell.page).toBeUndefined();
  });

  it("includes classes from classMap", () => {
    const classMap = {
      PHB: { Fireball: ["Sorcerer", "Wizard"] },
    };
    const spell = normalizeSpell(makeRawSpell(), classMap);
    expect(spell.classes).toEqual(["Sorcerer", "Wizard"]);
  });

  it("empty classes when not in classMap", () => {
    const spell = normalizeSpell(makeRawSpell(), emptyClassMap);
    expect(spell.classes).toEqual([]);
  });

  it("includes higherLevel entries", () => {
    const raw = makeRawSpell({
      entriesHigherLevel: [
        {
          type: "entries",
          name: "At Higher Levels",
          entries: ["More damage per slot."],
        },
      ],
    });
    const spell = normalizeSpell(raw, emptyClassMap);
    expect(spell.higherLevel).toHaveLength(1);
    expect((spell.higherLevel![0] as { name: string }).name).toBe("At Higher Levels");
  });

  it("no higherLevel when not present", () => {
    const spell = normalizeSpell(makeRawSpell(), emptyClassMap);
    expect(spell.higherLevel).toBeUndefined();
  });

  it("concentration spell", () => {
    const raw = makeRawSpell({
      duration: [
        {
          type: "timed",
          duration: { type: "minute", amount: 1 },
          concentration: true,
        },
      ],
    });
    const spell = normalizeSpell(raw, emptyClassMap);
    expect(spell.concentration).toBe(true);
    expect(spell.duration).toBe("1 Minute");
  });

  it("handles M component as object", () => {
    const raw = makeRawSpell({
      components: { v: true, s: true, m: { text: "gold dust worth 25 gp" } },
    });
    const spell = normalizeSpell(raw, emptyClassMap);
    expect(spell.components).toContain("M");
    expect(spell.material).toBe("gold dust worth 25 gp");
  });

  it("handles all schools", () => {
    const schools: [string, string, string][] = [
      ["A", "Abjuration", "abjuration"],
      ["C", "Conjuration", "conjuration"],
      ["D", "Divination", "divination"],
      ["E", "Enchantment", "enchantment"],
      ["V", "Evocation", "evocation"],
      ["I", "Illusion", "illusion"],
      ["N", "Necromancy", "necromancy"],
      ["T", "Transmutation", "transmutation"],
    ];
    for (const [abbr, full, index] of schools) {
      const spell = normalizeSpell(makeRawSpell({ school: abbr }), emptyClassMap);
      expect(spell.school).toBe(full);
      expect(spell.schoolIndex).toBe(index);
    }
  });
});

// ── loadAllSpells ─────────────────────────────────────────────────────────────

describe("loadAllSpells", () => {
  const mockIndex = { PHB: "spells-phb.json" };
  const mockSources: RawSourcesData = {
    PHB: {
      Fireball: {
        class: [
          { name: "Sorcerer", source: "PHB" },
          { name: "Wizard", source: "PHB" },
        ],
      },
    },
  };
  const mockSpellFile = {
    spell: [
      {
        name: "Fireball",
        source: "PHB",
        level: 3,
        school: "V",
        time: [{ number: 1, unit: "action" }],
        range: { type: "point", distance: { type: "feet", amount: 150 } },
        components: { v: true, s: true, m: "bat guano" },
        duration: [{ type: "instant" }],
        entries: ["A bright streak."],
        damageInflict: ["fire"],
        page: 241,
      } as RawSpell,
      {
        name: "Aid",
        source: "PHB",
        level: 2,
        school: "A",
        time: [{ number: 1, unit: "action" }],
        range: { type: "point", distance: { type: "feet", amount: 30 } },
        components: { v: true, s: true, m: "a strip of white cloth" },
        duration: [{ type: "timed", duration: { type: "hour", amount: 8 } }],
        entries: ["You bolster allies."],
        page: 211,
      } as RawSpell,
    ],
  };

  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (url.includes("index.json")) {
          return { ok: true, json: async () => mockIndex };
        }
        if (url.includes("sources.json")) {
          return { ok: true, json: async () => mockSources };
        }
        if (url.includes("spells-phb.json")) {
          return { ok: true, json: async () => mockSpellFile };
        }
        return { ok: false, status: 404 };
      })
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("loads and normalizes spells", async () => {
    const { spells } = await loadAllSpells("/data/spells");
    expect(spells).toHaveLength(2);
  });

  it("sorts spells by name", async () => {
    const { spells } = await loadAllSpells("/data/spells");
    expect(spells[0].name).toBe("Aid");
    expect(spells[1].name).toBe("Fireball");
  });

  it("applies class map to spells", async () => {
    const { spells } = await loadAllSpells("/data/spells");
    const fireball = spells.find((s) => s.name === "Fireball")!;
    expect(fireball.classes).toEqual(["Sorcerer", "Wizard"]);
  });

  it("returns no warnings on success", async () => {
    const { warnings } = await loadAllSpells("/data/spells");
    expect(warnings).toHaveLength(0);
  });

  it("returns warning on partial failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (url.includes("index.json")) {
          return { ok: true, json: async () => ({ PHB: "spells-phb.json", XGE: "spells-xge.json" }) };
        }
        if (url.includes("sources.json")) {
          return { ok: true, json: async () => mockSources };
        }
        if (url.includes("spells-phb.json")) {
          return { ok: true, json: async () => mockSpellFile };
        }
        // XGE fails
        return { ok: false, status: 404 };
      })
    );

    const { spells, warnings } = await loadAllSpells("/data/spells");
    expect(spells).toHaveLength(2); // PHB spells still loaded
    expect(warnings.length).toBeGreaterThan(0);
  });

  it("deduplicates spells preferring XPHB over PHB", async () => {
    const xphbSpell = {
      name: "Fireball",
      source: "XPHB",
      level: 3,
      school: "V",
      time: [{ number: 1, unit: "action" }],
      range: { type: "point", distance: { type: "feet", amount: 120 } },
      components: { v: true, s: true, m: "bat guano" },
      duration: [{ type: "instant" }],
      entries: ["Updated 2024 version."],
      page: 262,
    } as RawSpell;

    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (url.includes("index.json")) {
          return { ok: true, json: async () => ({ PHB: "spells-phb.json", XPHB: "spells-xphb.json" }) };
        }
        if (url.includes("sources.json")) {
          return { ok: true, json: async () => mockSources };
        }
        if (url.includes("spells-phb.json")) {
          return { ok: true, json: async () => mockSpellFile };
        }
        if (url.includes("spells-xphb.json")) {
          return { ok: true, json: async () => ({ spell: [xphbSpell] }) };
        }
        return { ok: false, status: 404 };
      })
    );

    const { spells } = await loadAllSpells("/data/spells");
    const fireballs = spells.filter((s) => s.name === "Fireball");
    expect(fireballs).toHaveLength(1);
    expect(fireballs[0].source).toBe("XPHB");
    expect(fireballs[0].description).toEqual(["Updated 2024 version."]);
  });

  it("throws if index.json fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: false, status: 500 }))
    );
    await expect(loadAllSpells("/data/spells")).rejects.toThrow();
  });
});
