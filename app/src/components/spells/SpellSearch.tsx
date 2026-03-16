import { useState } from "react";

interface SpellSearchProps {
  query: string;
  onQueryChange: (q: string) => void;
}

export function SpellSearch({ query, onQueryChange }: SpellSearchProps) {
  const [focused, setFocused] = useState(false);

  return (
    <div className="px-4 py-2 bg-[var(--bg-base)]">
      <div
        className="flex items-center gap-2 px-2 rounded-[2px] border"
        style={{
          background: "var(--bg-panel)",
          borderColor: focused ? "var(--accent-primary)" : "var(--border-subtle)",
          transition: "border-color 120ms",
        }}
      >
        <span style={{ color: "var(--text-muted)", fontSize: "16px", lineHeight: 1 }}>
          ⌕
        </span>
        <input
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Search spells..."
          className="w-full bg-transparent outline-none py-1.5"
          style={{
            fontSize: "15px",
            color: "var(--text-primary)",
          }}
        />
      </div>
    </div>
  );
}
