import { getSchoolColor } from "../../data/schoolColors";

interface SpellHeaderProps {
  name: string;
  level: number;
  schoolIndex: string;
  schoolName: string;
}

function levelOrdinal(level: number): string {
  if (level === 0) return "Cantrip";
  if (level === 1) return "1st-level";
  if (level === 2) return "2nd-level";
  if (level === 3) return "3rd-level";
  return `${level}th-level`;
}

export function SpellHeader({ name, level, schoolIndex, schoolName }: SpellHeaderProps) {
  const schoolColor = getSchoolColor(schoolIndex);
  const levelCircle = level === 0 ? "C" : String(level);
  const levelLabel = levelOrdinal(level);

  return (
    <div style={{ background: schoolColor, width: "100%" }}>
      {/* Top row: name + level circle */}
      <div className="flex items-start justify-between px-4 pt-4 pb-2">
        <h2
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 700,
            fontSize: "22px",
            color: "#FAF8F4",
            textTransform: "uppercase",
            margin: 0,
            flex: 1,
            paddingRight: "12px",
          }}
        >
          {name}
        </h2>

        {/* Level circle */}
        <div
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            background: "#FFFFFF",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 700,
              fontSize: "18px",
              color: "#1A1A1A",
            }}
          >
            {levelCircle}
          </span>
        </div>
      </div>

      {/* Subtitle: level label + school name */}
      <div className="px-4 pb-3 flex items-center gap-1.5">
        <span style={{ color: schoolColor, fontSize: "10px" }}>●</span>
        <span
          style={{
            fontSize: "11px",
            color: "#FAF8F4",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            opacity: 0.85,
          }}
        >
          {levelLabel} · {schoolName}
        </span>
      </div>
    </div>
  );
}
