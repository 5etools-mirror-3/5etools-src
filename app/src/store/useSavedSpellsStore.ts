import { create } from "zustand";

interface SavedSpellsStore {
  savedIds: string[];
  add: (id: string) => void;
  remove: (id: string) => void;
  clear: () => void;
  isSaved: (id: string) => boolean;
}

function loadFromStorage(): string[] {
  try {
    const raw = localStorage.getItem("saved-spells");
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveToStorage(ids: string[]): void {
  localStorage.setItem("saved-spells", JSON.stringify(ids));
}

export const useSavedSpellsStore = create<SavedSpellsStore>((set, get) => ({
  savedIds: loadFromStorage(),

  add: (id) => {
    const { savedIds } = get();
    if (savedIds.includes(id)) return;
    const next = [...savedIds, id];
    saveToStorage(next);
    set({ savedIds: next });
  },

  remove: (id) => {
    const next = get().savedIds.filter((s) => s !== id);
    saveToStorage(next);
    set({ savedIds: next });
  },

  clear: () => {
    saveToStorage([]);
    set({ savedIds: [] });
  },

  isSaved: (id) => get().savedIds.includes(id),
}));
