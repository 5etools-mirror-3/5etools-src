export const SCHOOL_ABBR_TO_FULL: Record<string, string> = {
  A: "Abjuration", C: "Conjuration", D: "Divination", E: "Enchantment",
  V: "Evocation", I: "Illusion", N: "Necromancy", T: "Transmutation",
};

export const SCHOOL_ABBR_TO_INDEX: Record<string, string> = {
  A: "abjuration", C: "conjuration", D: "divination", E: "enchantment",
  V: "evocation", I: "illusion", N: "necromancy", T: "transmutation",
};

export const SCHOOL_DISPLAY_ABBR: Record<string, string> = {
  abjuration: "Abj", conjuration: "Con", divination: "Div", enchantment: "Enc",
  evocation: "Evo", illusion: "Ill", necromancy: "Nec", transmutation: "Tra",
};

export function getSchoolFull(abbr: string): string {
  return SCHOOL_ABBR_TO_FULL[abbr] ?? abbr;
}

export function getSchoolIndex(abbr: string): string {
  return SCHOOL_ABBR_TO_INDEX[abbr] ?? abbr.toLowerCase();
}

export function getSchoolDisplayAbbr(schoolIndex: string): string {
  return SCHOOL_DISPLAY_ABBR[schoolIndex] ?? schoolIndex.slice(0, 3);
}
