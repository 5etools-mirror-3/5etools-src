# Guide: translating 5etools content to French

This document describes the method used to translate **Baldur's Gate: Descent into Avernus (BGDIA)** — adventure, bestiary, items, etc. — so the process can be reproduced for any other source. It also covers the traps we hit (links, `_copy`, fluff, sidebar index).

---

## 1. Inventorying a source's content

First, list everything belonging to the source (here `BGDIA`) under `data/`:

```js
// Lists all data files containing entries of the source
const fs = require("fs");
for (const f of fs.readdirSync("data").filter(f => f.endsWith(".json"))) {
  const s = fs.readFileSync("data/" + f, "utf8");
  if (s.includes('"source": "BGDIA"')) console.log(f);
}
```

A source typically touches: `adventure/adventure-*.json`, `bestiary/bestiary-*.json`,
`bestiary/fluff-bestiary-*.json`, `items.json`, `magicvariants.json`, `rewards.json`,
`vehicles.json`, `trapshazards.json`, `backgrounds.json`, `fluff-items.json`,
`fluff-vehicles.json`, `fluff-backgrounds.json`, `adventures.json` (sidebar),
sometimes `spells/`, `tables.json`, `objects.json`, `deities.json`,
`bestiary/legendarygroups.json`.

---

## 2. Translation rules (strict)

The 5etools renderer **parses** the JSON files. Only translate **display strings**.

### Translate
- `name` of entries (monsters, items, chapters, sections…)
- `entries` (prose), read-aloud text, table captions and cells
- Statblock trait/action/reaction/legendary names
- `_mod` replacement text (`replaceTxt`, `replaceArr`, `appendArr`)
- `reqAttune` when it is a sentence, free-form `note`/`header` fields
- Units in prose: `feet` → `pieds`/`mètres`, `miles` → `kilomètres` (numbers kept, or converted consistently)

### NEVER touch
- JSON **keys** and structure (identical array lengths)
- **Dice formulas**, numbers, `ac`, `hp`, `cr`, `page`, `source`
- Parsed strings: `speed` (`"fly 40 ft."`), `senses` (`"darkvision 60 ft."`),
  `save`/`skill` keys (`"DEX"`), `type`, `size`, `alignment`, `rarity`,
  `skillProficiencies` (`"arcana"`), language identifiers
- `_copy.name`/`_copy.source` (references to the English base creature)
- `mapRegions` arrays, image paths, `token`, metadata

### Inline tags `{@tag identifier|source|display text}`
- The **first segment** after the tag name is a **machine identifier**: it stays in ENGLISH
- Only the **display text** (last segment after `|`) may be translated
  - ✅ `{@item sword of zariel|BGDIA|épée de Zariel}`
  - ❌ `{@item épée de Zariel|BGDIA|épée de Zariel}` (broken link)
- Never alter the inside of `{@dice}`, `{@hit}`, `{@dc}`, `{@atk}`, `{@h}`, `{@recharge}`
- `{@book Text|SOURCE|chapter|page}`: the first segment IS the display text (translatable)

> ⚠️ Exception: if the **target entity itself** was renamed to French, the identifier
> MUST point to the new French name (see §4).

---

## 3. The `_copy` trap: copied monsters stay English

Many monsters are `_copy` references to a creature from another book (MM, MTF…).
Even when translated (name + `_mod`), their body renders in English because it comes
from the base creature.

**Solution**: resolve and expand each copy into a full inline statblock:

1. Load the base creature from `data/bestiary/bestiary-*.json`
2. Apply the `_mod` operations: `replaceTxt` (case-insensitive global text replace),
   `replaceArr`/`appendArr` (replace/append a trait or action matched by `name`),
   `addSkills` (merge into `skill`), `replaceSpells` (replace `{@spell ...}`)
3. Merge the copy's own fields (`name`, `size`, `languages`…) on top
4. Remove `_copy`, translate the result, re-insert

This is what was done for BGDIA's 22 `_copy` monsters (Traxigor ← MM Archmage,
Zariel ← MTF Zariel, Lulu ← Hollyphant, Raggadragga ← Wereboar…).

Same problem for backgrounds copied from the PHB and for item variants
(`magicvariants.json`: translate only `inherits.entries`, **not** `namePrefix`,
which is concatenated onto English base-weapon names).

---

## 4. Renaming = repoint every reference

When an entity is renamed (e.g. `Abyssal Chicken` → `Poulet des Abysses`), **all**
links targeting it by name break, because the renderer resolves tags by looking up
the `name` field.

After translating, repoint tags across **all** of `data/`:

```js
// {@creature/item/reward/vehicle/hazard/background <EnglishName>|BGDIA → French name
const re = new RegExp(`\\{@creature ${englishName}\\|BGDIA`, "gi");
s = s.replace(re, `{@creature ${frenchName}|BGDIA`);
```

Watch out for:
- Tag identifiers are often **lowercase** → match case-insensitively
- **Other books** reference the source (e.g. `book-hf.json` → `{@creature abyssal chicken|BGDIA}`,
  `adventure-coa.json` → soul coins): scan all of `data/`, not just the translated files
- Align names across parallel files: `fluff-bestiary` ↔ `bestiary`,
  `fluff-items` ↔ `items`, `fluff-vehicles` ↔ `vehicles`, `fluff-backgrounds` ↔ `backgrounds`
  (fluff is resolved **by name**: a case mismatch breaks the link)

Final check — no tag may point to a non-existent name:

```js
const names = new Set(bestiary.monster.map(m => m.name.toLowerCase()));
// for every {@creature X|BGDIA encountered: names.has(X.toLowerCase()) must be true
```

---

## 5. The sidebar (table of contents)

An adventure's left menu comes from the `contents` field in **`data/adventures.json`**
— not from the adventure file. It must be updated separately:

- `contents[i].name`: chapter name **without** the prefix ("Chapitre 4 :" is rendered
  separately from `ordinal`)
- `contents[i].headers`: section titles, including
  `{"depth":1,"header":"E1. Taproom"}` objects

**Navigation uses text matching** (`bookutils.js`, `_scrollClick`): every
`header` must match the translated `name` of the corresponding entry in the chapter
EXACTLY. The reliable method: structurally align the English original and the
translation (same keys/ids in the same order) and generate `contents` from the
actually-translated names.

---

## 6. Recommended workflow (BGDIA retrospective)

1. Extract the content to translate (adventure chapters into separate files,
   source entries out of shared files) so work can be parallelized
2. Translate using the §2 protocol; official French names when they exist,
   otherwise keep the English name (proper nouns: Lulu, Bel, Traxigor…)
3. Expand `_copy` entries (§3) before translating
4. Re-insert, then repoint every reference (§4)
5. Regenerate `contents` in `adventures.json` (§5)
6. Verify: `JSON.parse` on every file, structure identical to the original
   (ordered `id` lists), zero translated tag identifiers, zero dead references,
   fluff names aligned
7. `docker compose up -d --build` to see the result (the image copies files at
   build time) + hard-refresh (the service worker caches aggressively)

## 7. Known limitations

- The **UI** (labels like "Armor Class", "Saving Throws", filters, menus) is
  hard-coded English in `js/render.js`: translating it is a separate i18n project
- Content copied from untranslated books (PHB, MM) renders in English until those
  books are translated (e.g. ideals/bonds/flaws tables of PHB backgrounds)
- `spellcheck` and some `npm test` suites expect English
