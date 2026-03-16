import { getSchoolFull, getSchoolIndex } from "./schools";
import type {
  SpellData,
  CastingTimeCategory,
  RawSpell,
  RawSpellRange,
  RawSpellDuration,
  RawSourcesData,
  RawSpellIndex,
} from "./spellTypes";

// ── ID ────────────────────────────────────────────────────────────────────────

export function buildSpellId(name: string, source: string): string {
  // Use a URL-safe slug: lowercase, replace spaces with hyphens,
  // strip non-alphanumeric chars (except hyphens), collapse multiple hyphens
  const slug = (s: string) =>
    s
      .toLowerCase()
      .replace(/['']/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  return `${slug(name)}_${slug(source)}`;
}

// ── Casting time ──────────────────────────────────────────────────────────────

export function normalizeCastingTime(
  time: { number: number; unit: string }[]
): { display: string; category: CastingTimeCategory } {
  const first = time[0];
  if (!first) return { display: "1 Action", category: "action" };

  const { number, unit } = first;

  switch (unit) {
    case "action":
      return {
        display: number === 1 ? "1 Action" : `${number} Actions`,
        category: "action",
      };
    case "bonus":
      return { display: "Bonus Action", category: "bonus" };
    case "reaction":
      return { display: "Reaction", category: "reaction" };
    case "minute":
      return {
        display: number === 1 ? "1 Minute" : `${number} Minutes`,
        category: "minute+",
      };
    case "hour":
      return {
        display: number === 1 ? "1 Hour" : `${number} Hours`,
        category: "minute+",
      };
    default:
      return {
        display: `${number} ${unit.charAt(0).toUpperCase() + unit.slice(1)}`,
        category: "action",
      };
  }
}

// ── Range ─────────────────────────────────────────────────────────────────────

export function normalizeRange(range: RawSpellRange): string {
  const { type, distance } = range;

  if (type === "special") return "Special";
  if (!distance) return "Self";

  const { type: distType, amount } = distance;

  // Non-point types with feet distance → Self (N-foot Shape)
  if (type !== "point") {
    if (distType === "self" && amount != null) {
      const shape = type.charAt(0).toUpperCase() + type.slice(1);
      return `Self (${amount}-foot ${shape})`;
    }
    // Non-point with feet distance
    if (amount != null) {
      const shape = type.charAt(0).toUpperCase() + type.slice(1);
      return `Self (${amount}-foot ${shape})`;
    }
    return "Self";
  }

  // Point distances
  switch (distType) {
    case "self":
      return "Self";
    case "touch":
      return "Touch";
    case "sight":
      return "Sight";
    case "unlimited":
      return "Unlimited";
    case "feet":
      return amount != null ? `${amount} feet` : "Special";
    case "miles":
      return amount != null
        ? amount === 1
          ? "1 mile"
          : `${amount} miles`
        : "Special";
    default:
      return distType
        ? distType.charAt(0).toUpperCase() + distType.slice(1)
        : "Special";
  }
}

// ── Duration ──────────────────────────────────────────────────────────────────

export function normalizeDuration(
  durations: RawSpellDuration[]
): { display: string; concentration: boolean } {
  const first = durations[0];
  if (!first) return { display: "Instantaneous", concentration: false };

  const concentration = first.concentration ?? false;

  switch (first.type) {
    case "instant":
      return { display: "Instantaneous", concentration: false };
    case "permanent":
      return { display: "Permanent", concentration: false };
    case "special":
      return { display: "Special", concentration: false };
    case "timed": {
      const dur = first.duration;
      if (!dur) return { display: "Timed", concentration };
      const { type: unit, amount } = dur;
      let display: string;
      switch (unit) {
        case "round":
          display = amount === 1 ? "1 Round" : `${amount} Rounds`;
          break;
        case "minute":
          display = amount === 1 ? "1 Minute" : `${amount} Minutes`;
          break;
        case "hour":
          display = amount === 1 ? "1 Hour" : `${amount} Hours`;
          break;
        case "day":
          display = amount === 1 ? "1 Day" : `${amount} Days`;
          break;
        default:
          display =
            amount != null
              ? `${amount} ${unit.charAt(0).toUpperCase() + unit.slice(1)}`
              : unit;
      }
      return { display, concentration };
    }
    default:
      return { display: "Special", concentration };
  }
}

// ── Components ────────────────────────────────────────────────────────────────

export function normalizeComponents(comp: {
  v?: boolean;
  s?: boolean;
  m?: string | boolean | { text: string };
}): { components: string[]; material?: string } {
  const components: string[] = [];
  let material: string | undefined;

  if (comp.v) components.push("V");
  if (comp.s) components.push("S");

  if (comp.m) {
    components.push("M");
    if (typeof comp.m === "string") {
      material = comp.m;
    } else if (typeof comp.m === "object" && comp.m !== null) {
      material = (comp.m as { text: string }).text;
    }
    // boolean true → just push "M", no material text
  }

  return material !== undefined ? { components, material } : { components };
}

// ── Class map ─────────────────────────────────────────────────────────────────

export function buildClassMap(
  sourcesData: RawSourcesData
): Record<string, Record<string, string[]>> {
  // Returns: sourceAbbr → spellName → sorted unique class names
  const result: Record<string, Record<string, string[]>> = {};

  for (const [source, spells] of Object.entries(sourcesData)) {
    result[source] = {};
    for (const [spellName, spellInfo] of Object.entries(spells)) {
      const classes = spellInfo.class ?? [];
      const names = Array.from(new Set(classes.map((c) => c.name))).sort();
      result[source][spellName] = names;
    }
  }

  return result;
}

// ── Full spell normalizer ─────────────────────────────────────────────────────

export function normalizeSpell(
  raw: RawSpell,
  classMap: Record<string, Record<string, string[]>>
): SpellData {
  const id = buildSpellId(raw.name, raw.source);
  const schoolFull = getSchoolFull(raw.school);
  const schoolIndex = getSchoolIndex(raw.school);

  const castingTimeResult = normalizeCastingTime(raw.time ?? []);
  const rangeStr = normalizeRange(raw.range);
  const durResult = normalizeDuration(raw.duration ?? []);
  const compResult = normalizeComponents(raw.components ?? {});

  const ritual = raw.meta?.ritual ?? false;

  // Build classes from classMap
  const sourceClasses = classMap[raw.source] ?? {};
  const classes = sourceClasses[raw.name] ?? [];

  // Higher level entries
  const higherLevel = raw.entriesHigherLevel?.map((e) => ({
    type: "entries" as const,
    name: e.name,
    entries: e.entries,
  }));

  return {
    id,
    name: raw.name,
    source: raw.source,
    level: raw.level,
    school: schoolFull,
    schoolIndex,
    castingTime: castingTimeResult.display,
    castingTimeCategory: castingTimeResult.category,
    range: rangeStr,
    components: compResult.components,
    ...(compResult.material !== undefined
      ? { material: compResult.material }
      : {}),
    duration: durResult.display,
    concentration: durResult.concentration,
    ritual,
    description: raw.entries ?? [],
    ...(higherLevel && higherLevel.length > 0 ? { higherLevel } : {}),
    classes,
    damageTypes: raw.damageInflict ?? [],
    ...(raw.page !== undefined ? { page: raw.page } : {}),
  };
}

// ── Loader ────────────────────────────────────────────────────────────────────

export async function loadAllSpells(basePath: string = "/data/spells"): Promise<{
  spells: SpellData[];
  warnings: string[];
}> {
  // Fetch index and sources in parallel
  const [indexRes, sourcesRes] = await Promise.all([
    fetch(`${basePath}/index.json`),
    fetch(`${basePath}/sources.json`),
  ]);

  if (!indexRes.ok) throw new Error(`Failed to fetch spell index: ${indexRes.status}`);
  if (!sourcesRes.ok)
    throw new Error(`Failed to fetch spell sources: ${sourcesRes.status}`);

  const index: RawSpellIndex = await indexRes.json();
  const sourcesData: RawSourcesData = await sourcesRes.json();

  const classMap = buildClassMap(sourcesData);

  // Fetch all spell files in parallel with partial failure tolerance
  const entries = Object.entries(index);
  const results = await Promise.allSettled(
    entries.map(async ([_source, filename]) => {
      const res = await fetch(`${basePath}/${filename}`);
      if (!res.ok) throw new Error(`Failed to fetch ${filename}: ${res.status}`);
      const data = await res.json();
      return data.spell as RawSpell[];
    })
  );

  const allSpells: SpellData[] = [];
  const warnings: string[] = [];

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    if (result.status === "fulfilled") {
      for (const raw of result.value) {
        try {
          allSpells.push(normalizeSpell(raw, classMap));
        } catch (e) {
          warnings.push(
            `Failed to normalize spell "${raw?.name}" from ${entries[i][0]}: ${e}`
          );
        }
      }
    } else {
      warnings.push(`Failed to load spell file for ${entries[i][0]}: ${result.reason}`);
    }
  }

  // Deduplicate: when the same spell name appears in multiple sources,
  // keep the newest version. XPHB (2024) > PHB/XGE/TCE (2014-era).
  const SOURCE_PRIORITY: Record<string, number> = {
    XPHB: 100,  // 2024 Player's Handbook — highest priority
    EFA: 90,    // 2024 era supplements
    FRHoF: 85,
    TCE: 50,    // Tasha's Cauldron
    XGE: 40,    // Xanathar's Guide
    PHB: 10,    // 2014 Player's Handbook — lowest priority for reprints
  };

  const deduped = new Map<string, SpellData>();
  for (const spell of allSpells) {
    const key = spell.name.toLowerCase();
    const existing = deduped.get(key);
    if (!existing) {
      deduped.set(key, spell);
    } else {
      // Keep the one with higher source priority
      const existingPriority = SOURCE_PRIORITY[existing.source] ?? 30;
      const newPriority = SOURCE_PRIORITY[spell.source] ?? 30;
      if (newPriority > existingPriority) {
        deduped.set(key, spell);
      }
    }
  }

  const dedupedSpells = Array.from(deduped.values());

  // Sort by name
  dedupedSpells.sort((a, b) => a.name.localeCompare(b.name));

  return { spells: dedupedSpells, warnings };
}
