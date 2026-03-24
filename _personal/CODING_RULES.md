# AI-Assisted Coding Rules — 5etools Personal Dev

> Prepend this file as standing context at the start of every Claude Code session.
> Source: PERSONAL_DEV_GUIDE.md Section 6

---

## Before You Edit Any File

1. **Check LARGE_FILES.md first** — is this file on the danger list?
2. **If yes**, grep for the specific method/class/entry you need. Do not read the whole file.
3. **Leave a `// [PERSONAL] DH <date> — description` comment** on any line you change in a core file.
4. **Never do a full rewrite of any file over 1000 lines.**

---

## Conventions an AI Agent Must Follow

1. **ES module syntax** — Use `import`/`export`. The project uses `"type": "module"` in package.json.

2. **Class-based patterns** — New page features must extend existing base classes (e.g., `extends SublistManager`, `extends ListPage`).

3. **Static utility classes** — Utility code uses static methods on classes (e.g., `class FilterCommon { static getDamageVulnerableFilter() {...} }`).

4. **Source abbreviations** — Every entity needs a `"source"` field with a known abbreviation. New sources must be registered in `parser.js`.

5. **Naming conventions:**
   - Page JS files match HTML filenames: `spells.html` → `js/spells.js`
   - Render files: `render-{entity}.js`
   - Filter files: `filter-{entity}.js`
   - Data files: `data/{entity}.json` or `data/{entity}/{entity}-{source}.json`

6. **No semicolons after class declarations.** The codebase uses semicolons for statements but not after class/function declarations.

7. **Tab indentation** in JS and HTML (per `.editorconfig`).

8. **Filter factory pattern** — Page-specific filters create `Filter` objects with `header`, `items`, `displayFn`, `displayFnMini`, `displayFnTitle`.

9. **Hash-based routing** — Entity selection uses URL hashes (e.g., `#fireball_phb`). The `VeCt.HASH_*` constants define separators.

10. **`Renderer` is the single rendering pipeline.** All entity display goes through `Renderer` methods. Never create parallel rendering paths.

---

## Search-and-Patch vs. Full Rewrite

| Approach | When to Use | Examples |
|----------|-------------|---------|
| **Search-and-patch** | Core files, large files, files with high upstream churn | `js/utils.js`, `js/render.js`, `js/parser.js`, large JSON data files |
| **Full rewrite** | Small page-specific files, new files, personal override files | `render-spells.js` (354 lines), personal SCSS files, homebrew JSON |
| **Additive only** | Data files where you're adding content | `homebrew/*.json`, personal content JSON files |

---

## Chunking Strategy for Large Files

| File | Size | Strategy |
|------|------|----------|
| `js/render.js` | ~17,153 lines | Search for specific method/class names. Never read the whole file. Target specific rendering methods (e.g., `_renderEntries`, `_renderTable`). Each method is self-contained. |
| `js/utils.js` | ~9,551 lines | Grep for specific function names. `VeCt` constants block is near the top. String prototype extensions are near the top. Page-specific utilities are further down. |
| `js/parser.js` | ~4,508 lines | Purely static methods on the `Parser` class. Each `Parser.X_TO_Y` mapping or `Parser.parseX()` method is independent. Safe to read/edit one method at a time. |
| `js/listpage.js` | ~2,708 lines | Search for class names like `SublistManager`, `ListPage`. |
| `data/items.json` | 2,706 KB | Never load entirely. Search for specific item names or properties with `jq` or grep. |
| `data/deities.json` | 768 KB | Search by name. |
| `data/recipes.json` | 731 KB | Search by name. |

For all large data JSON files: use targeted grep or `jq` queries. Never attempt full-file reads or rewrites. Add entries to arrays with targeted edits only.

---

## Personal Mod Comment Convention

When editing core files directly:

```javascript
// [PERSONAL] DH 2026-03-24 — brief description
// Original: original code here (or "none" if adding new)
yourModifiedCode();
// [/PERSONAL]
```

Find all personal edits at any time:
```bash
grep -r "\[PERSONAL\]" js/ scss/ data/
```

---

## Grep Cheat Sheet

Quick-reference commands for navigating the codebase without loading large files.

### Core file navigation

```bash
# Find a specific Parser method
grep -n "Parser\.sp" js/parser.js | head -40

# Find a Renderer method by name
grep -n "static _render\|Renderer\.prototype" js/render.js | head -60

# Find where a global is first defined
grep -n "globalThis\." js/utils.js | head -30

# Find all personal modifications
grep -rn "\[PERSONAL\]" js/ scss/ data/
```

### Filters and page infrastructure

```bash
# Find filter definitions (PageFilter subclasses and their filter fields)
grep -rn "class PageFilter\|new Filter(" js/filter-*.js

# Find SublistManager subclasses
grep -rn "extends SublistManager" js/

# Find DataUtil entity loaders (each entity's loadJSON / pLoadAll)
grep -n "loadJSON\|pLoadAll\|static async" js/utils.js | grep -i "DataUtil\|load"

# Find all homebrew merge points in BrewUtil2
grep -rn "addToBrew\|_pRender\|manageBrew\|pLoadSources\|getMergedData" js/utils-brew*.js js/utils-brew/

# Find URL hash constants (VeCt.HASH_*)
grep -n "HASH_" js/utils.js | head -30
```
