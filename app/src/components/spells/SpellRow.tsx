import { getSchoolColor } from "../../data/schoolColors";
import { getSchoolDisplayAbbr } from "../../data/schools";
import type { SpellData } from "../../data/spellTypes";

interface SpellRowProps {
  spell: SpellData;
  selected: boolean;
  onClick: () => void;
  even: boolean;
}

function levelLabel(level: number): string {
  return level === 0 ? "C" : String(level);
}

export function SpellRow({ spell, selected, onClick, even }: SpellRowProps) {
  const schoolColor = getSchoolColor(spell.schoolIndex);
  const schoolAbbr = getSchoolDisplayAbbr(spell.schoolIndex);
  const lvl = levelLabel(spell.level);

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 text-left"
      style={{
        height: "36px",
        background: selected
          ? "var(--bg-panel)"
          : even
          ? "rgba(136,136,136,0.094)"
          : "transparent",
        borderLeft: selected ? `2px solid var(--accent-primary)` : "2px solid transparent",
        paddingLeft: selected ? "14px" : "14px",
        flexShrink: 0,
        cursor: "pointer",
      }}
    >
      {/* School color dot */}
      <span
        style={{
          width: "6px",
          height: "6px",
          borderRadius: "50%",
          background: schoolColor,
          flexShrink: 0,
        }}
      />

      {/* Name */}
      <span
        className="flex-1 truncate"
        style={{
          fontSize: "13px",
          fontWeight: 500,
          color: "var(--text-primary)",
        }}
      >
        {spell.name}
      </span>

      {/* Desktop metadata */}
      <span
        className="hidden sm:flex items-center gap-2"
        style={{ fontSize: "11px", color: "var(--text-secondary)", flexShrink: 0 }}
      >
        <span>{lvl}</span>
        <span>{schoolAbbr}</span>
        <span>{spell.castingTime}</span>
        <span>{spell.range}</span>
      </span>

      {/* Mobile metadata */}
      <span
        className="sm:hidden"
        style={{ fontSize: "11px", color: "var(--text-muted)", flexShrink: 0 }}
      >
        {lvl} · {schoolAbbr}
      </span>
    </button>
  );
}
