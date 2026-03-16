import { create } from "zustand";
import type { SpellData } from "../data/spellTypes";
import { loadAllSpells } from "../data/spellLoader";

interface SpellStore {
  spells: SpellData[];
  loading: boolean;
  error: string | null;
  warnings: string[];

  // Setters
  setSpells: (spells: SpellData[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setWarnings: (warnings: string[]) => void;

  // Actions
  loadSpells: () => Promise<void>;

  // Derived
  allClasses: () => string[];
  allSources: () => string[];
}

export const useSpellStore = create<SpellStore>((set, get) => ({
  spells: [],
  loading: false,
  error: null,
  warnings: [],

  setSpells: (spells) => set({ spells }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setWarnings: (warnings) => set({ warnings }),

  loadSpells: async () => {
    set({ loading: true, error: null });
    try {
      const { spells, warnings } = await loadAllSpells();
      set({ spells, warnings, loading: false });
    } catch (e) {
      set({
        loading: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  },

  allClasses: () => {
    const { spells } = get();
    const classSet = new Set<string>();
    for (const spell of spells) {
      for (const cls of spell.classes) {
        classSet.add(cls);
      }
    }
    return Array.from(classSet).sort();
  },

  allSources: () => {
    const { spells } = get();
    const sourceSet = new Set<string>();
    for (const spell of spells) {
      sourceSet.add(spell.source);
    }
    return Array.from(sourceSet).sort();
  },
}));
