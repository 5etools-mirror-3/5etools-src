import { useCallback, useEffect, useRef } from "react";
import { SpellRow } from "./SpellRow";
import type { SpellData } from "../../data/spellTypes";

interface SpellListProps {
  spells: SpellData[];
  selectedId: string | null;
  onSelect: (spell: SpellData) => void;
}

export function SpellList({ spells, selectedId, onSelect }: SpellListProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const focusedIndex = useRef<number>(-1);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Guard: if detail is open, let SpellDetail handle arrow keys
      if (selectedId) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        const next = Math.min(focusedIndex.current + 1, spells.length - 1);
        focusedIndex.current = next;
        const container = listRef.current;
        if (container) {
          (container.children[next] as HTMLElement | undefined)?.scrollIntoView({
            block: "nearest",
          });
        }
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const prev = Math.max(focusedIndex.current - 1, 0);
        focusedIndex.current = prev;
        const container = listRef.current;
        if (container) {
          (container.children[prev] as HTMLElement | undefined)?.scrollIntoView({
            block: "nearest",
          });
        }
      } else if (e.key === "Enter") {
        const idx = focusedIndex.current;
        if (idx >= 0 && idx < spells.length) {
          onSelect(spells[idx]);
        }
      }
    },
    [selectedId, spells, onSelect],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Reset focused index when spells list changes (search/filter)
  useEffect(() => {
    focusedIndex.current = -1;
  }, [spells]);

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
    <div ref={listRef} className="overflow-y-auto flex-1">
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
