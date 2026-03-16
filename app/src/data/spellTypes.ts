export interface SpellData {
  id: string;
  name: string;
  source: string;
  level: number;
  school: string;
  schoolIndex: string;
  castingTime: string;
  castingTimeCategory: CastingTimeCategory;
  range: string;
  components: string[];
  material?: string;
  duration: string;
  concentration: boolean;
  ritual: boolean;
  description: SpellEntry[];
  higherLevel?: SpellEntry[];
  classes: string[];
  damageTypes: string[];
  page?: number;
}

export type CastingTimeCategory = "action" | "bonus" | "reaction" | "minute+";

export type SpellEntry = string | SpellEntryObject;
export type SpellEntryObject =
  | SpellEntryEntries
  | SpellEntryList
  | SpellEntryTable;

export interface SpellEntryEntries {
  type: "entries";
  name: string;
  entries: SpellEntry[];
}

export interface SpellEntryList {
  type: "list";
  style?: string;
  items: (string | SpellEntryItem)[];
}

export interface SpellEntryItem {
  type: "item";
  name: string;
  entries: SpellEntry[];
}

export interface SpellEntryTable {
  type: "table";
  caption?: string;
  colLabels: string[];
  colStyles?: string[];
  rows: string[][];
}

export interface RawSpell {
  name: string;
  source: string;
  level: number;
  school: string;
  time: { number: number; unit: string }[];
  range: RawSpellRange;
  components: { v?: boolean; s?: boolean; m?: string | boolean | { text: string } };
  duration: RawSpellDuration[];
  entries: SpellEntry[];
  entriesHigherLevel?: { type: string; name: string; entries: SpellEntry[] }[];
  damageInflict?: string[];
  savingThrow?: string[];
  page?: number;
  meta?: { ritual?: boolean };
}

export interface RawSpellRange {
  type: string;
  distance?: { type: string; amount?: number };
}

export interface RawSpellDuration {
  type: string;
  duration?: { type: string; amount?: number };
  concentration?: boolean;
}

export interface RawSourcesData {
  [sourceAbbr: string]: {
    [spellName: string]: {
      class?: { name: string; source: string }[];
    };
  };
}

export interface RawSpellIndex {
  [sourceAbbr: string]: string;
}
