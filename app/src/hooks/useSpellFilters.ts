import { useState, useMemo } from "react";
import type { SpellData, CastingTimeCategory } from "../data/spellTypes";

export interface FilterState {
  levels?: Set<number>;
  schools?: Set<string>;
  classes?: Set<string>;
  castingTimes?: Set<CastingTimeCategory>;
  concentration?: boolean;
  ritual?: boolean;
  components?: Set<string>;
  damageTypes?: Set<string>;
  sources?: Set<string>;
}

export function applyFilters(spells: SpellData[], filters: FilterState): SpellData[] {
  return spells.filter((spell) => {
    // Level: OR within set
    if (filters.levels && filters.levels.size > 0) {
      if (!filters.levels.has(spell.level)) return false;
    }

    // School: OR within set
    if (filters.schools && filters.schools.size > 0) {
      if (!filters.schools.has(spell.school)) return false;
    }

    // Classes: spell must belong to at least one of the selected classes
    if (filters.classes && filters.classes.size > 0) {
      if (!spell.classes.some((c) => filters.classes!.has(c))) return false;
    }

    // Casting time category: OR within set
    if (filters.castingTimes && filters.castingTimes.size > 0) {
      if (!filters.castingTimes.has(spell.castingTimeCategory)) return false;
    }

    // Concentration: when true, only show concentration spells
    if (filters.concentration === true) {
      if (!spell.concentration) return false;
    }

    // Ritual: when true, only show ritual spells
    if (filters.ritual === true) {
      if (!spell.ritual) return false;
    }

    // Components: spell must have at least one of the selected components
    if (filters.components && filters.components.size > 0) {
      if (!spell.components.some((c) => filters.components!.has(c))) return false;
    }

    // Damage types: spell must have at least one of the selected damage types
    if (filters.damageTypes && filters.damageTypes.size > 0) {
      if (!spell.damageTypes.some((d) => filters.damageTypes!.has(d))) return false;
    }

    // Sources: OR within set
    if (filters.sources && filters.sources.size > 0) {
      if (!filters.sources.has(spell.source)) return false;
    }

    return true;
  });
}

function toggleInSet<T>(set: Set<T> | undefined, value: T): Set<T> {
  const next = new Set(set ?? []);
  if (next.has(value)) {
    next.delete(value);
  } else {
    next.add(value);
  }
  return next;
}

function hasActiveFilters(filters: FilterState): boolean {
  return (
    (filters.levels?.size ?? 0) > 0 ||
    (filters.schools?.size ?? 0) > 0 ||
    (filters.classes?.size ?? 0) > 0 ||
    (filters.castingTimes?.size ?? 0) > 0 ||
    filters.concentration === true ||
    filters.ritual === true ||
    (filters.components?.size ?? 0) > 0 ||
    (filters.damageTypes?.size ?? 0) > 0 ||
    (filters.sources?.size ?? 0) > 0
  );
}

export function useSpellFilters(spells: SpellData[]) {
  const [filters, setFilters] = useState<FilterState>({});

  const filtered = useMemo(() => applyFilters(spells, filters), [spells, filters]);
  const active = useMemo(() => hasActiveFilters(filters), [filters]);

  function toggleLevel(level: number) {
    setFilters((f) => ({ ...f, levels: toggleInSet(f.levels, level) }));
  }

  function toggleSchool(school: string) {
    setFilters((f) => ({ ...f, schools: toggleInSet(f.schools, school) }));
  }

  function toggleCastingTime(ct: CastingTimeCategory) {
    setFilters((f) => ({ ...f, castingTimes: toggleInSet(f.castingTimes, ct) }));
  }

  function toggleConcentration() {
    setFilters((f) => ({ ...f, concentration: f.concentration ? undefined : true }));
  }

  function toggleRitual() {
    setFilters((f) => ({ ...f, ritual: f.ritual ? undefined : true }));
  }

  function setClasses(classes: string[]) {
    setFilters((f) => ({ ...f, classes: new Set(classes) }));
  }

  function setComponents(components: string[]) {
    setFilters((f) => ({ ...f, components: new Set(components) }));
  }

  function setDamageTypes(damageTypes: string[]) {
    setFilters((f) => ({ ...f, damageTypes: new Set(damageTypes) }));
  }

  function setSources(sources: string[]) {
    setFilters((f) => ({ ...f, sources: new Set(sources) }));
  }

  function clearAll() {
    setFilters({});
  }

  return {
    filters,
    filtered,
    hasActiveFilters: active,
    toggleLevel,
    toggleSchool,
    toggleCastingTime,
    toggleConcentration,
    toggleRitual,
    setClasses,
    setComponents,
    setDamageTypes,
    setSources,
    clearAll,
  };
}
