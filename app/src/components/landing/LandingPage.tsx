import { Link } from "react-router";

interface Entry {
  id: string;
  label: string;
  description: string;
  active: boolean;
  to?: string;
}

const ENTRIES: Entry[] = [
  {
    id: "spells",
    label: "spells",
    description: "reference",
    active: true,
    to: "/spells",
  },
  {
    id: "bestiary",
    label: "bestiary",
    description: "coming soon",
    active: false,
  },
  {
    id: "items",
    label: "items",
    description: "coming soon",
    active: false,
  },
];

export function LandingPage() {
  return (
    <div
      className="relative flex flex-col items-center justify-center min-h-screen w-full"
      style={{ background: "var(--bg-desktop)" }}
    >
      {/* Centered content */}
      <div className="flex flex-col items-center w-full max-w-sm px-6">
        {/* Site name */}
        <h1
          className="text-center"
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 700,
            fontSize: "36px",
            color: "var(--text-primary)",
            margin: 0,
          }}
        >
          5e Grimoire
        </h1>

        {/* Tagline */}
        <p
          className="mt-2 text-center"
          style={{
            fontSize: "13px",
            color: "var(--text-muted)",
            margin: "8px 0 0 0",
          }}
        >
          spell reference for 5th edition
        </p>

        {/* Horizontal rule */}
        <hr
          className="w-full my-6"
          style={{ borderColor: "var(--border-subtle)", borderTopWidth: "1px", borderStyle: "solid" }}
        />

        {/* Entry list */}
        <div className="flex flex-col w-full gap-1">
          {ENTRIES.map((entry) => {
            if (entry.active && entry.to) {
              return (
                <Link
                  key={entry.id}
                  to={entry.to}
                  className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-[var(--bg-panel)] transition-colors duration-[120ms]"
                  style={{ textDecoration: "none" }}
                >
                  <span className="flex items-center gap-2">
                    <span style={{ color: "var(--accent-primary)", fontFamily: "monospace", fontSize: "13px" }}>
                      &gt;
                    </span>
                    <span style={{ color: "var(--text-primary)", fontSize: "14px" }}>
                      {entry.label}
                    </span>
                  </span>
                  <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>
                    {entry.description}
                  </span>
                </Link>
              );
            }

            return (
              <div
                key={entry.id}
                className="flex items-center justify-between px-2 py-1.5 rounded"
              >
                <span className="flex items-center gap-2">
                  <span style={{ color: "var(--text-disabled)", fontFamily: "monospace", fontSize: "13px" }}>
                    &nbsp;&nbsp;
                  </span>
                  <span style={{ color: "var(--text-disabled)", fontSize: "14px" }}>
                    {entry.label}
                  </span>
                </span>
                <span style={{ color: "var(--text-disabled)", fontSize: "12px" }}>
                  {entry.description}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer pinned to bottom */}
      <p
        className="absolute bottom-4 text-center w-full"
        style={{
          fontSize: "11px",
          color: "var(--text-disabled)",
        }}
      >
        5e Grimoire — digital reference for products you already own
      </p>
    </div>
  );
}
