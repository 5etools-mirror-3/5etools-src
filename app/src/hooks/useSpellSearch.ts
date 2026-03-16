import { useState, useMemo } from "react";
import type { SpellData } from "../data/spellTypes";

export function filterBySearch(spells: SpellData[], query: string): SpellData[] {
  if (!query.trim()) return spells;
  const q = query.toLowerCase();
  return spells.filter((s) => s.name.toLowerCase().includes(q));
}

export function useSpellSearch(spells: SpellData[]) {
  const [query, setQuery] = useState("");
  const results = useMemo(() => filterBySearch(spells, query), [spells, query]);
  return { query, setQuery, results };
}
