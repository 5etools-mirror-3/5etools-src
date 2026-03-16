import { SpellRow } from "./SpellRow";
import type { SpellData } from "../../data/spellTypes";

interface SpellListProps {
  spells: SpellData[];
  selectedId: string | null;
  onSelect: (spell: SpellData) => void;
}

export function SpellList({ spells, selectedId, onSelect }: SpellListProps) {
  if (spells.length === 0) {
    return (
      <div
        className="flex-1 flex items-center justify-center overflow-y-auto"
        style={{ color: "var(--text-muted)", fontSize: "14px" }}
      >
        No spells match your filters
      </div>
    );
  }

  return (
    <div className="overflow-y-auto flex-1">
      {spells.map((spell, index) => (
        <SpellRow
          key={spell.id}
          spell={spell}
          selected={spell.id === selectedId}
          onClick={() => onSelect(spell)}
          even={index % 2 === 1}
        />
      ))}
    </div>
  );
}
