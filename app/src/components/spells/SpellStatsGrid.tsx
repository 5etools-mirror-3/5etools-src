interface SpellStatsGridProps {
  castingTime: string;
  range: string;
  duration: string;
  components: string;
  material?: string;
}

interface StatCellProps {
  label: string;
  value: string;
  borderRight?: boolean;
  borderBottom?: boolean;
}

function StatCell({ label, value, borderRight, borderBottom }: StatCellProps) {
  return (
    <div
      className="px-3 py-2"
      style={{
        borderRight: borderRight ? "1px solid var(--border-subtle)" : undefined,
        borderBottom: borderBottom ? "1px solid var(--border-subtle)" : undefined,
      }}
    >
      <div
        style={{
          fontSize: "11px",
          color: "var(--text-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          marginBottom: "2px",
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: "15px", color: "var(--text-primary)" }}>{value}</div>
    </div>
  );
}

export function SpellStatsGrid({
  castingTime,
  range,
  duration,
  components,
  material,
}: SpellStatsGridProps) {
  const componentDisplay = material ? `${components} (${material})` : components;

  return (
    <div
      className="mx-4 grid grid-cols-2 rounded-[2px]"
      style={{ border: "1px solid var(--border-subtle)" }}
    >
      <StatCell label="Casting Time" value={castingTime} borderRight borderBottom />
      <StatCell label="Range" value={range} borderBottom />
      <StatCell label="Duration" value={duration} borderRight />
      <StatCell label="Components" value={componentDisplay} />
    </div>
  );
}
