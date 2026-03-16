import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { SpellDescription } from "./SpellDescription";
import type { SpellEntry } from "../../data/spellTypes";

function renderDesc(entries: SpellEntry[], schoolColor?: string) {
  return render(
    <MemoryRouter>
      <SpellDescription entries={entries} schoolColor={schoolColor} />
    </MemoryRouter>
  );
}

describe("SpellDescription", () => {
  it("renders plain string entries as paragraphs", () => {
    renderDesc(["You conjure a flame in your hand.", "The flame sheds bright light."]);
    expect(screen.getByText("You conjure a flame in your hand.")).toBeInTheDocument();
    expect(screen.getByText("The flame sheds bright light.")).toBeInTheDocument();
  });

  it("renders entries-type with a name header", () => {
    const entries: SpellEntry[] = [
      {
        type: "entries",
        name: "Special Effect",
        entries: ["This is the special effect description."],
      },
    ];
    renderDesc(entries, "#ff0000");
    expect(screen.getByText("Special Effect")).toBeInTheDocument();
    expect(screen.getByText("This is the special effect description.")).toBeInTheDocument();
  });

  it("renders list-type with string items", () => {
    const entries: SpellEntry[] = [
      {
        type: "list",
        items: ["First item", "Second item", "Third item"],
      },
    ];
    renderDesc(entries);
    expect(screen.getByText("First item")).toBeInTheDocument();
    expect(screen.getByText("Second item")).toBeInTheDocument();
    expect(screen.getByText("Third item")).toBeInTheDocument();
  });

  it("renders list with named items (type: item)", () => {
    const entries: SpellEntry[] = [
      {
        type: "list",
        items: [
          {
            type: "item",
            name: "Advantage",
            entries: ["You gain advantage on attack rolls."],
          },
          {
            type: "item",
            name: "Disadvantage",
            entries: ["You suffer disadvantage on attack rolls."],
          },
        ],
      },
    ];
    renderDesc(entries);
    expect(screen.getByText("Advantage")).toBeInTheDocument();
    expect(screen.getByText("Disadvantage")).toBeInTheDocument();
    expect(screen.getByText(/You gain advantage on attack rolls/)).toBeInTheDocument();
  });

  it("renders table with caption, headers, and rows", () => {
    const entries: SpellEntry[] = [
      {
        type: "table",
        caption: "Spell Effects",
        colLabels: ["Level", "Damage", "Area"],
        rows: [
          ["1st", "2d6", "10 ft"],
          ["2nd", "4d6", "20 ft"],
        ],
      },
    ];
    renderDesc(entries);
    expect(screen.getByText("Spell Effects")).toBeInTheDocument();
    expect(screen.getByText("Level")).toBeInTheDocument();
    expect(screen.getByText("Damage")).toBeInTheDocument();
    expect(screen.getByText("Area")).toBeInTheDocument();
    expect(screen.getByText("1st")).toBeInTheDocument();
    expect(screen.getByText("4d6")).toBeInTheDocument();
    expect(screen.getByText("20 ft")).toBeInTheDocument();
  });

  it("applies schoolColor to entries-type header", () => {
    const entries: SpellEntry[] = [
      {
        type: "entries",
        name: "Evocation Burst",
        entries: ["A burst of energy."],
      },
    ];
    renderDesc(entries, "#aa2200");
    const header = screen.getByText("Evocation Burst");
    expect(header).toHaveStyle({ color: "#aa2200" });
  });
});
