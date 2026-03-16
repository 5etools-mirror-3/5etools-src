export const SCHOOL_COLORS: Record<string, { primary: string; secondary: string }> = {
  evocation: { primary: "#D94032", secondary: "#C7A834" },
  abjuration: { primary: "#1A3E78", secondary: "#CC6B2C" },
  necromancy: { primary: "#1A1A1A", secondary: "#7B2D5F" },
  divination: { primary: "#E8A820", secondary: "#6B3FA0" },
  illusion: { primary: "#6B3FA0", secondary: "#D4960B" },
  conjuration: { primary: "#1A7A6D", secondary: "#A63428" },
  transmutation: { primary: "#CC6B2C", secondary: "#2E8B6E" },
  enchantment: { primary: "#B8336A", secondary: "#2B5CA6" },
};

export function getSchoolColor(schoolIndex: string): string {
  return SCHOOL_COLORS[schoolIndex]?.primary ?? "#5C5C5C";
}

export function getSchoolSecondary(schoolIndex: string): string {
  return SCHOOL_COLORS[schoolIndex]?.secondary ?? "#3A3A3A";
}
