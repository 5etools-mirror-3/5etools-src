# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Serve locally (port 5050, CORS-enabled, no caching)
npm run serve:dev

# Build CSS from SCSS
npm run build:css

# Run all generators (search index, pages, data)
npm run gen

# Lint JS (with autofix)
npm run lint:js

# Lint only changed JS files (faster)
npm run lint:js:fast

# Validate data JSON files
npm run test:data

# Run Jest unit tests
npm run test:unit

# Full test suite
npm run test

# Prettify JSON files
npm run clean-jsons
```

## Architecture

This is a **multi-page vanilla JavaScript application** — no framework (React/Vue/Angular), no client-side bundler. Each HTML page is a standalone SPA loading scripts directly via `<script>` tags.

### Script loading order (per page)

Each HTML page loads scripts in this order:

1. `styleswitch.js`, `navigation.js` — bootstrap UI
2. `parser.js`, `utils.js`, `utils-ui.js` — core globals
3. `localforage.js` — IndexedDB storage
4. `filter.js`, `omnisearch.js` — search/filter (ES modules)
5. `utils-dataloader.js`, `utils-brew.js` — data pipeline
6. `render.js` — rendering engine
7. `listpage.js` — page framework
8. `filter-{entity}.js`, `render-{entity}.js`, `{entity}.js` — page-specific logic

### Data flow

```
data/*.json + homebrew/*.json
    → DataLoader (fetch, cache, merge, dereference)
    → Parser (normalize: levels, CR, source lookups)
    → PageFilterX (build filter UI from entity properties)
    → List (left panel: searchable name list)
    → RenderX.getCompactRenderedString() (right panel: detail view)
```

### Page pattern

Every list page follows this structure:

```javascript
class SpellsSublistManager extends SublistManager { ... }

class SpellsPage extends ListPage {
    constructor() {
        super({
            dataSource: DataUtil.spell.loadJSON,
            pageFilter: new PageFilterSpells(),
            dataProps: ["spell"],
        });
    }
}
new SpellsPage();
```

Corresponding files: `spells.html`, `js/spells.js`, `js/filter-spells.js`, `js/render-spells.js`.

### Module system

**Hybrid:** Most files are traditional scripts establishing globals (`Parser`, `Renderer`, `DataUtil`). A few key files are ES modules with `import`/`export`: `filter.js`, `utils-brew.js`, `utils-config.js`, `omnisearch.js`.

Build scripts (`node/*.js`, `node/*.mjs`) are pure ESM.

### Key classes

| Class | File | Role |
|-------|------|------|
| `Parser` | `js/parser.js` | Static methods for normalizing all game entities |
| `Renderer` | `js/render.js` | Recursive HTML renderer for D&D markdown syntax |
| `DataLoader` | `js/utils-dataloader.js` | Loads, caches, merges JSON + homebrew + prerelease |
| `ListPage` | `js/listpage.js` | Base class for all entity list pages |
| `SublistManager` | `js/listpage.js` | Manages the pinned/favorites sublist |
| `Filter` | `js/filter.js` | Generic filter widget (checkboxes, dropdowns) |
| `PageFilterX` | `js/filter-{entity}.js` | Page-specific filter config |
| `Hist` | `js/hist.js` | URL hash parsing and history management |
| `BrewUtil2` | `js/utils-brew/` | Homebrew loading, storage (IndexedDB), UI |

### Homebrew

`homebrew/index.json` controls what local homebrew loads:

```json
{ "toImport": ["my-spells.json"] }
```

Files in `homebrew/` are merged into official data at load time by `BrewUtil2`. Homebrew is disabled in production (`IS_DEPLOYED` is set in `js/utils.js`) — set it to `undefined` to enable locally.

### Filters and URL hashes

Filters sync with URL hashes (e.g., `#spells,level=3,source=phb`). `Hist.hashChange()` parses the hash and calls the page's `_pLoadSubHash()`. Entity selection uses hashes like `#fireball_phb` — built with `VeCt.HASH_*` constants.

## Large Files — Never Load in Full

These files are too large to read entirely. Use `grep` or targeted reads:

- `js/render.js` (~17,000 lines) — grep for specific method names
- `js/utils.js` (~9,500 lines) — grep for specific function names
- `js/parser.js` (~4,500 lines) — all static methods, safe to read one at a time
- `js/listpage.js` (~2,700 lines) — grep for class names

Data JSON files over 500KB (see `_personal/LARGE_FILES.md` for full inventory) should never be read in full — use `jq` or grep to find specific entries.

## Personal Modifications

This repo is a personal fork. See `_personal/CODING_RULES.md` for conventions on modifying core files. The `_personal/` directory is gitignored and contains personal notes, homebrew, and dev rules.

Mark any edits to core files with:
```javascript
// [PERSONAL] DH <date> — description
```

## Protected Files — Do Not Edit Directly

Treat these as read-only on a personal fork. The risk/reward of editing them is unfavorable.

| File / Pattern | Why |
|----------------|-----|
| `js/render.js` | 17,153 lines; any edit has extreme conflict probability on every upstream sync. Use homebrew rendering hooks or subclass render-{entity}.js instead. |
| `js/utils.js` (core sections) | The global utilities contract that every file depends on. Methods renamed or moved here break all pages silently at runtime. |
| `data/generated/*` | Rebuilt and completely overwritten each release. Edits are destroyed on every `npm run gen`. |
| `data/changelog.json` | Edited in every release; merge conflicts guaranteed. No personal value in modifying it. |
| `data/items.json` | 2,706 KB; 51+ upstream changes in recent history. Use homebrew for personal items. |
| `data/spells/spells-xphb.json` | Active upstream errata stream. 41+ changes. Use homebrew for personal spells. |
| `js/filter.js` | Core filter framework; changes here break every page's filter UI simultaneously. |
| `js/listpage.js` (base classes) | `ListPage` and `SublistManager` are the framework layer. Edits here affect every entity page. Subclass instead. |
| `sw.js` / `sw-injector.js` | Generated by `npm run build:sw`; manually edited code is overwritten each build. |
| `.github/workflows/*` | CI/CD configuration; irrelevant for local personal use but dangerous to modify. |
| Any file in `node/` | Build/generator scripts; not loaded in the browser, but a broken generator silently produces corrupt data. |

## Safe Extension Patterns

These are the seams where personal additions can be made without touching core files:

1. **New pages** — Create `{entity}.html`, `js/{entity}.js`, `js/filter-{entity}.js`, `js/render-{entity}.js`, and `data/{entity}.json`. Zero core file changes required. The page pattern is well-tested across the codebase.

2. **Homebrew content** — Add entries to `homebrew/` directory + `homebrew/index.json`. Merged at runtime by `BrewUtil2`. Works for spells, monsters, items, races, backgrounds, classes, feats, and more. Fully isolated from upstream.

3. **SCSS additions** — Add personal styles to `scss/includes/_personal.scss`. It's imported at the bottom of `scss/main.scss`. Night mode overrides go in a parallel `scss/includes/_personal-night.scss`.

4. **New utility namespaces** — Create `js/utils-personal.js` with your own utility class (`globalThis.PersonalUtil = { ... }`). Load it via `<script>` after `utils.js` in any HTML page you modify. Never add methods to `utils.js` itself.

5. **Page-level behavior overrides** — Subclass existing page classes (`class MySpellsPage extends SpellsPage`) to override specific methods. Append after or replace the original `new SpellsPage()` call.

## Git Rules
- Never run `git push` — developer pushes manually
- Always work on the `personal` branch
- Commit message prefix for personal changes: `personal:`