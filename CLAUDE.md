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

## Git Rules
- Never run `git push` — developer pushes manually
- Always work on the `personal` branch
- Commit message prefix for personal changes: `personal:`