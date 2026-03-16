import React from "react";
import type {
  SpellEntry,
  SpellEntryEntries,
  SpellEntryList,
  SpellEntryTable,
  SpellEntryItem,
} from "../../data/spellTypes";
import { renderTaggedText } from "../../data/tagRenderer";

interface SpellDescriptionProps {
  entries: SpellEntry[];
  schoolColor?: string;
}

// ── Sub-renderers ─────────────────────────────────────────────────────────────

function renderEntriesBlock(
  entry: SpellEntryEntries,
  schoolColor: string | undefined,
  key: React.Key
) {
  return (
    <div key={key} className="flex flex-col gap-2">
      <p
        style={{
          fontSize: "13px",
          fontWeight: 600,
          color: schoolColor ?? "var(--text-primary)",
          margin: 0,
        }}
      >
        {entry.name}
      </p>
      <SpellDescription entries={entry.entries} schoolColor={schoolColor} />
    </div>
  );
}

function renderListItem(
  item: string | SpellEntryItem,
  idx: number,
  schoolColor: string | undefined
) {
  if (typeof item === "string") {
    return (
      <li key={idx} style={{ fontSize: "15px", color: "var(--text-primary)", lineHeight: 1.6 }}>
        {renderTaggedText(item)}
      </li>
    );
  }

  // Named item: type === "item"
  return (
    <li key={idx} style={{ fontSize: "15px", color: "var(--text-primary)", lineHeight: 1.6 }}>
      <span style={{ fontWeight: 600, color: schoolColor ?? "var(--text-primary)" }}>
        {item.name}
      </span>{" "}
      {item.entries.map((e) =>
        typeof e === "string" ? renderTaggedText(e) : null
      )}
    </li>
  );
}

function renderList(
  entry: SpellEntryList,
  schoolColor: string | undefined,
  key: React.Key
) {
  return (
    <ul key={key} className="flex flex-col gap-1 pl-5 list-disc">
      {entry.items.map((item, idx) => renderListItem(item, idx, schoolColor))}
    </ul>
  );
}

function renderTable(entry: SpellEntryTable, key: React.Key) {
  return (
    <table key={key} style={{ width: "100%", borderCollapse: "collapse" }}>
      {entry.caption && (
        <caption
          style={{
            fontSize: "13px",
            fontWeight: 600,
            color: "var(--text-secondary)",
            textAlign: "left",
            paddingBottom: "4px",
          }}
        >
          {entry.caption}
        </caption>
      )}
      <thead>
        <tr>
          {entry.colLabels.map((label, i) => (
            <th
              key={i}
              style={{
                fontSize: "13px",
                fontWeight: 600,
                color: "var(--text-secondary)",
                borderBottom: "1px solid var(--border-subtle)",
                textAlign: "left",
                padding: "4px 8px 4px 0",
              }}
            >
              {label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {entry.rows.map((row, ri) => (
          <tr key={ri}>
            {row.map((cell, ci) => (
              <td
                key={ci}
                style={{
                  fontSize: "13px",
                  color: "var(--text-primary)",
                  borderBottom: "1px solid var(--border-subtle)",
                  padding: "4px 8px 4px 0",
                }}
              >
                {renderTaggedText(cell)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function SpellDescription({ entries, schoolColor }: SpellDescriptionProps) {
  return (
    <div className="flex flex-col gap-3">
      {entries.map((entry, idx) => {
        if (typeof entry === "string") {
          return (
            <p
              key={idx}
              style={{
                fontSize: "15px",
                color: "var(--text-primary)",
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              {renderTaggedText(entry)}
            </p>
          );
        }

        switch (entry.type) {
          case "entries":
            return renderEntriesBlock(entry, schoolColor, idx);
          case "list":
            return renderList(entry, schoolColor, idx);
          case "table":
            return renderTable(entry, idx);
          default:
            return null;
        }
      })}
    </div>
  );
}
