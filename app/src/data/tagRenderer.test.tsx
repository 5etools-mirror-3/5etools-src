import { describe, it, expect } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import { extractTagDisplay, renderTaggedText } from "./tagRenderer";

// ── extractTagDisplay ─────────────────────────────────────────────────────────

describe("extractTagDisplay", () => {
  it("{@b ...} returns full content", () => {
    expect(extractTagDisplay("b", "bold text")).toBe("bold text");
  });

  it("{@i ...} returns full content", () => {
    expect(extractTagDisplay("i", "italic text")).toBe("italic text");
  });

  it("{@variantrule} returns last pipe segment", () => {
    expect(extractTagDisplay("variantrule", "Resting|PHB|Short Rest")).toBe(
      "Short Rest"
    );
  });

  it("{@variantrule} with only name|src returns src", () => {
    expect(extractTagDisplay("variantrule", "Flanking|PHB")).toBe("PHB");
  });

  it("generic tag with pipe → text before first pipe", () => {
    expect(extractTagDisplay("damage", "2d6|fire")).toBe("2d6");
  });

  it("generic tag without pipe → full content", () => {
    expect(extractTagDisplay("condition", "frightened")).toBe("frightened");
  });

  it("spell tag returns name before pipe", () => {
    expect(extractTagDisplay("spell", "Fireball|PHB")).toBe("Fireball");
  });

  it("creature tag with no pipe returns full text", () => {
    expect(extractTagDisplay("creature", "goblin")).toBe("goblin");
  });

  it("action tag with no pipe returns full text", () => {
    expect(extractTagDisplay("action", "Attack")).toBe("Attack");
  });

  it("skill tag returns text before pipe", () => {
    expect(extractTagDisplay("skill", "Perception|WIS")).toBe("Perception");
  });
});

// ── renderTaggedText ──────────────────────────────────────────────────────────

function renderNodes(nodes: React.ReactNode[]) {
  return render(<div data-testid="root">{nodes}</div>);
}

describe("renderTaggedText", () => {
  it("plain text with no tags returns single string node", () => {
    const nodes = renderTaggedText("Hello world");
    expect(nodes).toHaveLength(1);
    expect(nodes[0]).toBe("Hello world");
  });

  it("empty string returns empty array", () => {
    const nodes = renderTaggedText("");
    expect(nodes).toHaveLength(0);
  });

  it("{@b ...} renders <strong>", () => {
    const nodes = renderTaggedText("{@b bold text}");
    renderNodes(nodes);
    const el = screen.getByText("bold text");
    expect(el.tagName).toBe("STRONG");
  });

  it("{@i ...} renders <em>", () => {
    const nodes = renderTaggedText("{@i italic text}");
    renderNodes(nodes);
    const el = screen.getByText("italic text");
    expect(el.tagName).toBe("EM");
  });

  it("{@spell name|source} renders anchor with correct href", () => {
    const nodes = renderTaggedText("{@spell Fireball|PHB}");
    renderNodes(nodes);
    const link = screen.getByRole("link", { name: "Fireball" });
    expect(link).toBeDefined();
    expect(link.getAttribute("href")).toBe("#/spells/fireball_phb");
  });

  it("{@spell name} with no source uses empty source in id", () => {
    const nodes = renderTaggedText("{@spell Fireball}");
    renderNodes(nodes);
    const link = screen.getByRole("link", { name: "Fireball" });
    expect(link.getAttribute("href")).toContain("fireball");
  });

  it("{@damage ...} renders plain text", () => {
    const nodes = renderTaggedText("{@damage 2d6}");
    expect(nodes).toHaveLength(1);
    expect(nodes[0]).toBe("2d6");
  });

  it("{@dice ...} renders plain text", () => {
    const nodes = renderTaggedText("{@dice 1d20}");
    expect(nodes).toHaveLength(1);
    expect(nodes[0]).toBe("1d20");
  });

  it("{@condition ...} renders plain text", () => {
    const nodes = renderTaggedText("{@condition frightened}");
    expect(nodes).toHaveLength(1);
    expect(nodes[0]).toBe("frightened");
  });

  it("{@creature ...} renders plain text", () => {
    const nodes = renderTaggedText("{@creature goblin}");
    expect(nodes).toHaveLength(1);
    expect(nodes[0]).toBe("goblin");
  });

  it("{@item ...} renders text before pipe", () => {
    const nodes = renderTaggedText("{@item longsword|PHB}");
    expect(nodes).toHaveLength(1);
    expect(nodes[0]).toBe("longsword");
  });

  it("{@action ...} renders plain text", () => {
    const nodes = renderTaggedText("{@action Attack}");
    expect(nodes).toHaveLength(1);
    expect(nodes[0]).toBe("Attack");
  });

  it("{@skill ...} renders text before pipe", () => {
    const nodes = renderTaggedText("{@skill Perception|WIS}");
    expect(nodes).toHaveLength(1);
    expect(nodes[0]).toBe("Perception");
  });

  it("unknown tag renders plain display text", () => {
    const nodes = renderTaggedText("{@unknowntag some|content}");
    expect(nodes).toHaveLength(1);
    expect(nodes[0]).toBe("some");
  });

  it("unknown tag with no pipe renders full content", () => {
    const nodes = renderTaggedText("{@unknowntag fullcontent}");
    expect(nodes).toHaveLength(1);
    expect(nodes[0]).toBe("fullcontent");
  });

  it("mixed: text before and after tag", () => {
    const nodes = renderTaggedText("Deal {@damage 3d6} fire damage.");
    expect(nodes).toHaveLength(3);
    expect(nodes[0]).toBe("Deal ");
    expect(nodes[1]).toBe("3d6");
    expect(nodes[2]).toBe(" fire damage.");
  });

  it("multiple tags in one string", () => {
    const nodes = renderTaggedText(
      "{@b Important}: {@spell Fireball|PHB} deals {@damage 8d6} damage."
    );
    // Nodes: <strong>, ": ", <a>, " deals ", "8d6", " damage."
    expect(nodes).toHaveLength(6);
    renderNodes(nodes);
    expect(screen.getByText("Important").tagName).toBe("STRONG");
    expect(screen.getByRole("link", { name: "Fireball" })).toBeDefined();
  });

  it("consecutive tags with no text between", () => {
    const nodes = renderTaggedText("{@b Bold}{@i Italic}");
    expect(nodes).toHaveLength(2);
    renderNodes(nodes);
    expect(screen.getByText("Bold").tagName).toBe("STRONG");
    expect(screen.getByText("Italic").tagName).toBe("EM");
  });

  it("tag at start and text at end", () => {
    const nodes = renderTaggedText("{@b Hello} world");
    expect(nodes).toHaveLength(2);
    expect(nodes[1]).toBe(" world");
  });

  it("text at start and tag at end", () => {
    const nodes = renderTaggedText("Hello {@b world}");
    expect(nodes).toHaveLength(2);
    expect(nodes[0]).toBe("Hello ");
  });

  it("real-world spell entry with damage tag", () => {
    const nodes = renderTaggedText(
      "A target must succeed on a Dexterity saving throw or take {@damage 1d6} acid damage."
    );
    // Three nodes: prefix text, "1d6" plain string, suffix text
    expect(nodes).toHaveLength(3);
    expect(nodes[1]).toBe("1d6");
  });

  it("does not share regex state between calls (avoids stateful regex bug)", () => {
    // Call renderTaggedText twice in a row with the same pattern
    const first = renderTaggedText("{@b hello}");
    const second = renderTaggedText("{@b hello}");
    expect(first).toHaveLength(1);
    expect(second).toHaveLength(1);
  });
});
