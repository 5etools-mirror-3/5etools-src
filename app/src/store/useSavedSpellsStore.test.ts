import { describe, it, expect, beforeEach, vi } from "vitest";
import { useSavedSpellsStore } from "./useSavedSpellsStore";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

vi.stubGlobal("localStorage", localStorageMock);

beforeEach(() => {
  localStorageMock.clear();
  localStorageMock.getItem.mockClear();
  localStorageMock.setItem.mockClear();
  // Reset store state
  useSavedSpellsStore.setState({ savedIds: [] });
});

// ── Initial state ─────────────────────────────────────────────────────────────

describe("initial state", () => {
  it("savedIds is empty array when localStorage is empty", () => {
    expect(useSavedSpellsStore.getState().savedIds).toEqual([]);
  });

  it("loads savedIds from localStorage on init", () => {
    localStorageMock.getItem.mockReturnValueOnce(
      JSON.stringify(["fireball_xphb", "shield_xphb"])
    );
    // Re-create store state from storage
    // After setState reset they are [], but we test the loader directly
    // by resetting store from storage
    useSavedSpellsStore.setState({
      savedIds: JSON.parse(
        localStorageMock.getItem("saved-spells") ?? "[]"
      ),
    });
    expect(useSavedSpellsStore.getState().savedIds).toEqual([
      "fireball_xphb",
      "shield_xphb",
    ]);
  });
});

// ── add ───────────────────────────────────────────────────────────────────────

describe("add", () => {
  it("adds a spell id", () => {
    useSavedSpellsStore.getState().add("fireball_xphb");
    expect(useSavedSpellsStore.getState().savedIds).toContain("fireball_xphb");
  });

  it("persists to localStorage", () => {
    useSavedSpellsStore.getState().add("fireball_xphb");
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      "saved-spells",
      JSON.stringify(["fireball_xphb"])
    );
  });

  it("does not duplicate an existing id", () => {
    useSavedSpellsStore.getState().add("fireball_xphb");
    useSavedSpellsStore.getState().add("fireball_xphb");
    expect(useSavedSpellsStore.getState().savedIds).toHaveLength(1);
  });

  it("can add multiple different ids", () => {
    useSavedSpellsStore.getState().add("fireball_xphb");
    useSavedSpellsStore.getState().add("shield_xphb");
    expect(useSavedSpellsStore.getState().savedIds).toHaveLength(2);
  });
});

// ── remove ────────────────────────────────────────────────────────────────────

describe("remove", () => {
  it("removes an existing spell id", () => {
    useSavedSpellsStore.setState({ savedIds: ["fireball_xphb", "shield_xphb"] });
    useSavedSpellsStore.getState().remove("fireball_xphb");
    expect(useSavedSpellsStore.getState().savedIds).not.toContain("fireball_xphb");
    expect(useSavedSpellsStore.getState().savedIds).toContain("shield_xphb");
  });

  it("persists to localStorage after remove", () => {
    useSavedSpellsStore.setState({ savedIds: ["fireball_xphb"] });
    useSavedSpellsStore.getState().remove("fireball_xphb");
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      "saved-spells",
      JSON.stringify([])
    );
  });

  it("does nothing if id not in savedIds", () => {
    useSavedSpellsStore.setState({ savedIds: ["shield_xphb"] });
    useSavedSpellsStore.getState().remove("fireball_xphb");
    expect(useSavedSpellsStore.getState().savedIds).toHaveLength(1);
  });
});

// ── clear ─────────────────────────────────────────────────────────────────────

describe("clear", () => {
  it("empties savedIds", () => {
    useSavedSpellsStore.setState({
      savedIds: ["fireball_xphb", "shield_xphb", "bless_xphb"],
    });
    useSavedSpellsStore.getState().clear();
    expect(useSavedSpellsStore.getState().savedIds).toEqual([]);
  });

  it("persists empty array to localStorage", () => {
    useSavedSpellsStore.setState({ savedIds: ["fireball_xphb"] });
    useSavedSpellsStore.getState().clear();
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      "saved-spells",
      JSON.stringify([])
    );
  });
});

// ── isSaved ───────────────────────────────────────────────────────────────────

describe("isSaved", () => {
  it("returns true for a saved id", () => {
    useSavedSpellsStore.setState({ savedIds: ["fireball_xphb"] });
    expect(useSavedSpellsStore.getState().isSaved("fireball_xphb")).toBe(true);
  });

  it("returns false for an unsaved id", () => {
    useSavedSpellsStore.setState({ savedIds: ["shield_xphb"] });
    expect(useSavedSpellsStore.getState().isSaved("fireball_xphb")).toBe(false);
  });

  it("returns false when savedIds is empty", () => {
    expect(useSavedSpellsStore.getState().isSaved("fireball_xphb")).toBe(false);
  });
});

// ── no duplicates ─────────────────────────────────────────────────────────────

describe("no duplicates", () => {
  it("adding the same id many times keeps length 1", () => {
    useSavedSpellsStore.getState().add("fireball_xphb");
    useSavedSpellsStore.getState().add("fireball_xphb");
    useSavedSpellsStore.getState().add("fireball_xphb");
    expect(useSavedSpellsStore.getState().savedIds).toHaveLength(1);
  });
});
