# CLAUDE.md — project orientation for AI sessions

This repository is a **fork of 5etools-src**. Its distinguishing customization
is a **Character Sheet builder** (a full, data-driven D&D character
builder/sheet) that upstream 5etools does **not** have.

When helping with this repo, prioritize keeping that builder working and keeping
the fork easy to update from upstream.

## Character Sheet: file map

The feature is **three pages** that share one character store: a play-focused
**sheet** (`charactersheet.html`), a build-focused **builder**
(`charbuilder.html`), and a DM-focused **sidekick builder** (`sidekick.html`).
All three subclass `CharacterPageBase`
(`charactersheet-pagebase.js`), which owns the model, the multi-character
store/switcher, autosave, file save/load, the null-safe input binding, the
print/PDF preparation, and the shared build helpers (data pickers, wizard).
Each page's controller keeps only its own DOM assembly + rendering.

**Fork-owned (upstream has no version → these never conflict on an upstream merge):**
- `charactersheet.html`, `charbuilder.html`, `sidekick.html` — **generated**, do not hand-edit (see below)
- `js/charactersheet.js`, `js/charbuilder.js`, `js/sidekick.js` — the three page entry points
- `js/charactersheet/*.js` — the shared modules: pure rules (`derive`,
  `levelengine`, `choices`, `abilityscores`, `equipment`, `actions`, `charstore`,
  `defenses`, `sidekick`, `citations`, `journal`, `portrait`, `sync`, `buildsteps`,
  `levelpreview`, `consts`),
  data access (`classdata`), the model (`model`), the page
  base (`pagebase`), the shared panel re-render (`panelrender`), and the panel renderers (`classpanel`, `originpanel`, `inventorypanel`,
  `spellspanel`, `actionspanel`, `auditpanel`, `wizard`, `buildwalk`)
- `css/charactersheet.css`, `scss/charactersheet.scss` (shared by all three pages)
- `node/generate-pages/template/page/template-page-charactersheet.hbs`,
  `.../template-page-charbuilder.hbs`, `.../template-page-sidekick.hbs`
- `test/jest/CharacterSheet*.test.js` — unit tests for the pure modules
- `test/e2e/` — browser tests driving the real pages (see `test/e2e/README.md`)
- `.github/workflows/` — `charactersheet-ci.yml`, `sync-upstream.yml`, and
  `docker-image.yml` (the `:latest` / `:beta` image build). Upstream ships only
  `main.yml` and `pages.yml`; leave those alone.
- `js/deploy-defaults.js`, `docker/inject-defaults.sh`, `docker/entrypoint.sh`,
  `docker/compose.example.yml` — the deploy-time default book selection
  (`docs/DEFAULT_BOOKS.md`). Split across build and start-up on purpose: the **build**
  injects the two script tags into every page and leaves a world-writable
  `js/deploy-defaults-config.js`; **start-up** only overwrites that one file from
  `DEFAULT_LOAD` / `DEFAULT_DENY` / `DEFAULT_BREW`. That is what lets the container run as a
  non-root user — creating a file in the web root needs permission on the directory, which
  `user: 1000:1000` lacks. Start-up never fails the container: if the write is refused it
  says why and serves the site unconfigured.
- `scripts/` — upstream has no such directory. `update-from-upstream.sh` (the
  preferred way to take an upstream update) and `rehearse-upstream-sync.sh`
  (replays the sync workflow's steps over a synthetic upstream, so the merge and
  conflict paths can be tested without waiting for upstream to move).
- `test/e2e/eslint.config.mjs`, `scripts/eslint.config.mjs` — lint config for the
  two fork-owned directories. **ESLint 10 resolves the *nearest* `eslint.config.*`
  to each file it lints**, which is what makes these possible and what made them
  necessary: upstream's `test/eslint.config.mjs` declares Node and Jest and no
  browser, right for its own tests and wrong for the fork's, which are Node
  scripts *containing browser code* — everything handed to `page.evaluate` runs in
  the page. When ESLint 10 arrived with upstream v2.35, 172 `no-undef` errors did
  too. A nested config in a directory upstream has no version of fixes it with no
  shared-file edit at all; putting a block in the root `eslint.config.mjs` would
  have been a sixth merge point.

**Shared upstream files the fork edits (the ONLY upstream-merge conflict points):**
1. `js/navigation.js` — three `_addElement_li({... page: "….html" ...})` lines
   (`charbuilder.html`, `sidekick.html`, `charactersheet.html`)
2. `index.html` — two `<a href="charactersheet.html">` home-page buttons
   (the sidekick builder is navbar-only, deliberately: it is a DM tool, and
   fewer home-page edits means fewer conflicts)
3. `node/generate-pages/generate-pages-page-generator-config.js` — the
   `_PageGeneratorCharactersheet` / `_PageGeneratorCharbuilder` /
   `_PageGeneratorSidekick` classes + their three
   `new _PageGenerator...(),` registration lines
4. `package.json` — a `test:e2e` script and the `playwright-core` dev dependency (two lines)
5. `Dockerfile` — an `ENTRYPOINT` (plus the `CMD` that setting one discards, and the `RUN` that
   installs it) for the deploy-time default books. Upstream's is two lines.

### Species

A species' `additionalSpells` is the **same shape a subclass uses** but keyed by *character* level,
and it is granted whether or not the character has a spellcasting class — so the spells panel reads
it beside the classes (`_pGetSpecies`), and `hasSpellcasting` takes an `isOriginCaster` so a Tiefling
Fighter's Thaumaturgy has somewhere to live. `speed` is a number or an object, and a kind given as
`true` means "equal to your walking speed" (`getSpeeds` / `formatSpeeds` in `appearance`) — reading
only `walk` cost thirty-two species the movement that defines them. A creature type has two halves:
`creatureTypes` plus `creatureTypeTags`, "Humanoid (Goblinoid)" (`getCreatureTypeDisplay`). `age` is
`{mature, max}`. `_copy`, `overwrite` and `_versions` never reach us — the race loader runs
`mergeSubraces`, so subspecies arrive pre-merged.

**Reprints, and the 2024 default.** The data says which entries a later printing supersedes, in
`reprintedAs` — 361 PHB spells, 695 items, 65 subclasses, 13 classes, 50 feats, 97 species and
subspecies, and more. `filterReprinted` (in `sources`) drops an entry when its reprint is *also on
offer*, and `_filterBySource` applies it to every picker unless the character opts out
(`isPreferReprints`, default on, in the source filter).

Two properties make this safe. It runs **after** the source filter, so a 2014-only character never
loses anything: the 2024 reprint is not in the list to supersede it. And it only ever drops an entry
whose replacement is present, so everything the 2024 books never reprinted — Artificer, most
subclasses, whole books — stays. That is what makes it different from `SOURCE_MODE_MODERN`, which
drops the 2014 books outright.

A reprint uid is `name|source` except for a **subclass**, which carries its parent class in the
middle (`"Berserker|Barbarian|XPHB|XPHB"`); the name is always first and the source always last, and
a subclass answers to both its `name` and its `shortName`. A `{uid, tag}` reprint into a different
kind of thing never matches, which keeps a dragonmark subrace pickable. Search-driven pickers
(species, background, item) get `getSupersededKeys` instead, because a search document carries no
`reprintedAs`.

### Backgrounds

Two things a background says that nothing was reading. **`additionalSpells`** — the ten Ravnica
guild and five Strixhaven college backgrounds widen the *learnable* list (`expanded`, keyed `s0`–`s5`
by the slot that unlocks it, `s0` being cantrips), and the background pick path resolved abilities,
proficiencies and feats but never spells. **`fromFeature`** marks a grant as coming from the
background's feature, and a feature naming more than one feat is offering a **menu**: "the Lucky,
Magic Initiate, or Skilled feat (your choice)" was read as three grants, so Rewarded and Ruined
handed over three feats each. `getGrantedFeats(feats, {fromFeature})` returns nothing in that case
and `getGrantedFeatChoice` returns the menu; a background with no `fromFeature` that names two
things (Haunted One: Survivor **and** a Dark Gift) is correctly left granting both.
`_copy` (26 backgrounds) is resolved at load time and never reaches us.

### Feats

`checkFeatPrerequisites` reads eleven of the fourteen prerequisite keys; the three
it cannot are `campaign`, `other` and `otherSummary`, which are prose or a setting,
and report `unknown` rather than blocking. Four are worth knowing about:
**`proficiency`** (`{armor: "medium"}`, `{weapon: "martial"}`, `{weaponGroup: …}`) —
both sides use the same small vocabulary, normalised rather than curated;
**`feature`** — a class feature by name ("Fighting Style", "Pact Magic");
**`featCategory`** / **`exclusiveFeatCategory`** — the dragonmark rules, one
requiring a feat of that category and the other forbidding a second.
A feat can land in four places (an ASI slot, a feature grant, a background, a DM's
gift), and `getTakenFeats` collects all of them — reading only the ASI slots meant a
background's feat satisfied nothing. **`weaponProficiencies`** may be a
`{choose: {fromFilter}}` (Weapon Master, alone): the filter names weapon
*categories*, which `getWeaponChoices` reads and `pGetBaseWeapons` offers.
`repeatableHidden` is a display flag on `repeatable`; `_versions` (Magic Initiate's
per-class forms) are expanded into separate entities by `DataLoader`, so pickers get
them for free.

### Homebrew authoring lives in the account system

`makebrew.html` and `js/makebrew.js` are **upstream's, untouched**, and nothing outside upstream uses
them any more. Homebrew is written in **`PrinzWalium/5etools-online`**'s own forms, on its Homebrew
page (`src/web/brewbuilder.js`, with the kinds and their form ⇄ entity rules in `brewkinds.js`) — feat,
species, background, item, spell, creature, subclass, class, language — saved to the account, and
installed into this repository's `BrewUtil2` on the sheet, builder and sidekick pages by that
repository's `brewsync.js` (`BrewUtil2.pGetBrew` / `_getBrewDoc` / `pSetBrew`, documents named
`online-brew-<id>-v<n>-f<format>.json`; a 2014 subclass goes in with its 2024 copy beside it, because
this repository's brew content migrator otherwise makes that copy itself and reads inline features as
string refs). The fork carries no homebrew builder code and no merge point for it;
what that repository reads from here is the renderer (to draw a preview), the data loader (to copy an
entry from the books) and `BrewUtil2`.

Two things about the shape of the data are worth knowing here, because they are about *this*
repository's loader rather than about the builders. **A brew class or subclass carries its features
inline**, not as the string refs the books use: a brew document holds one entity in one property, so
there is nowhere for the `classFeature[]` array to live. The loader's "gracefully handle legacy class
data" short-circuit (`utils-dataloader-dataloader.js`) is what makes that work — and the two shapes
differ, because a subclass's features are read with `.flat().filter(level)` while a class's are read
as `classFeatures[level - 1]`. `test/e2e/brewroot.e2e.mjs` proves the other half: the five index
files plus documents that `BrewUtil2` needs in order to load homebrew from a URL, which is how the
account system serves what its users publish.

Exact snippets and resolution steps: `docs/CHARACTER_SHEET_MAINTENANCE.md`.
The account-system contract (a *separate* repo): `docs/ACCOUNT_SYSTEM.md`.
That system, and its feature plan: <https://github.com/PrinzWalium/5etools-online>.
The sidekick builder's own user-facing guide: `docs/SIDEKICK_BUILDER.md`.

## Critical gotcha: the page HTML is generated

`charactersheet.html`, `charbuilder.html` and `sidekick.html` are built from their
`node/generate-pages/template/page/template-page-*.hbs` templates by
`node node/generate-pages.js` (run in the Docker/Pages builds). **Editing the
generated `.html` directly is silently overwritten by the build.** To change
the page markup, edit the **template** and regenerate. After editing a
template, run `node node/generate-pages.js` and commit both.

## Architecture notes

- The builder is model-driven: `CharacterModel` (a 5etools `BaseComponent`
  subclass in `charactersheet-model.js`) is the single source of truth. UI
  mutates the model; the model's hooks re-render. Rendering is one-directional.
- Game rules are read from the real data (classes, races, feats, spells, items),
  not hardcoded — except the PHB multiclass spell-slot table, which is a fixed
  core rule in `charactersheet-levelengine.js`.
- The pure rules modules (`derive`, `levelengine`, `choices`, `abilityscores`,
  `equipment`, `actions`, `charstore`, `defenses`, `sidekick`) are unit-tested;
  keep them DOM-free and tested.
- A sidekick is just a character with `isSidekick: true` and a `refCreature`, so
  derivation, the feature timeline, spell slots, the store, autosave and
  save/load all work unchanged. The store is shared but each page lists only its
  own kind (`_isCharacterListed` / `_getNewCharacterState` in the page base).
- The export is **print-to-PDF**, not a generated PDF. Browsers cannot print a
  `textarea`'s overflow or a closed `<details>`, so `_bindPrintPrep` (page base)
  mirrors textarea text into `.cs__print-text`, opens collapsed sections, and
  flags empty panels for hiding before `window.print()`.

## What the feature covers (so you don't rebuild it)

- **Guided Setup** (`charactersheet-wizard.js`): eight steps. The first seven build a *draft* —
  species, class and level, background, ability scores, the choices those ask for, equipment, and a
  review; **Apply** writes it to the sheet. The eighth is different: it runs against the applied
  character and walks everything that could not be decided before it existed — subclass, ability
  score improvements, Expertise, weapon masteries, optional features (Fighting Style, Invocations,
  …), origin feats, spells, hit points. That list is computed by `charactersheet-buildsteps.js`
  (pure, tested) and answered by `charactersheet-buildwalk.js`, which calls the *panels' own*
  pickers rather than growing a second set. The Build Check lists the same things, because both read
  the same rules.
- **What a choice answered is written down.** `choiceLog` (in the model) records which choice, from
  which source, was answered with what, keyed by `getChoiceSignature`. Every path writes it — the
  guide, the species picker, the background picker — and every path reads it. Without it a skill
  carries no provenance, so nothing could tell an answered choice from an unasked one, and the guide
  and the panels each guessed differently.
- **An answer can be taken back exactly.** A record also says what each pick applied (`applied`:
  skill, Expertise, tool or language, and where) and, for an ability choice, its own `logId` in
  `abilityBonusLog`. `getChoiceReversal` (pure, in `choices`) turns a record into the undo, reading
  older records by their type; `revertChoice` / `revertChoicesFrom` in the model apply it. A skill
  something else still grants stays ticked. Removing a class, or replacing a species or background
  (pass `prevEnt`), goes through these. Before this, a Ranger removed and added back kept its first
  answer's skills, was offered the rest of its list, and ended up with five.
- **Answered decisions are listed too.** `getAnsweredDecisions` (in `buildsteps`) is the other half of
  `getOutstandingDecisions`: each answer with its `kind`/`ctx` (so it can be asked again), how many
  are `allowed`, and `isOver` when there are more. `getAskedChoiceSigs` + `getOrphanChoiceRecords` find
  answers for something the character no longer has; `getUnexplainedSkills` finds skills nothing
  grants. The account system's builder shows all of it, with a Change button on every answer.
- **The same proficiency is never granted twice.** A skill records a state, not a count, so a second
  grant lands on a ticked box and the pick is simply lost — a Human Fighter offered Acrobatics by
  both its species and its class could spend two of its three skills on one. `getHeldProficiencyNames`
  (what the character has) and `getFixedProficiencyNames` (what a *picked but unapplied* entity is
  about to hand it, which is the guide's whole draft) subtract from every chooser, and a choice with
  nothing left to offer is spent rather than owed.
- **A feature that offers features is asked.** Divine Order (Protector or Thaumaturge), Primal Order,
  Elemental Fury and some 2014 subclass features hold an `options` block of feature references, which
  the loader resolves into named features (`__prop: "classFeature"`). `getFeatureOptionGroups`
  (`features`) finds them, buildsteps owes them (`STEP_FEATURE_OPTION`), the answer is stored on the
  class entry (`featureOptions`, `setFeatureOptionForClass`), and the few effects that are numbers or
  proficiencies — Thaumaturge's extra cantrip, Protector's heavy armor — are curated in
  `FEATURE_EFFECTS`. An `options` block of *optional features* (Eldritch Invocation Options) is not one.
- **Proficiencies are stored as `{kind, name}`**, one per row. `getHeldProficiencyNames` once read
  only a merged view's `entries`, so no tool or language ever counted as held and every one was
  offered again; a test fixture that carries both shapes hides that.
- **Languages a class feature grants are curated** (`_CLASS_FEATURE_LANGUAGES` in `choices`): Thieves'
  Cant (and, in 2024, one more), Druidic, the 2024 Ranger's Deft Explorer — all prose in the data.
  Answering the 2024 language choice writes down Common with the two picks.
- **A species' trait names are kept** (`speciesTraitNames`), because Dwarven Toughness is a trait,
  not a choice, and `getHpBonusPerLevel` never saw it.
- **A granted feat asks its own questions.** Taking Skilled must offer its three skills-or-tools,
  Crafter its three artisan's tools, Musician its three instruments. Tools and languages are
  resolved by `pResolveFeatSkillChoices`, never written into a notes box — a proficiency as prose is
  invisible to everything, exactly as an origin feat as prose was.
- **"Any combination of three skills or tools" is a field, not prose.** It lives in
  `skillToolLanguageProficiencies` (Skilled, a Half-Elf's Skill Versatility, the Custom Background),
  whose `anySkill` / `anyTool` / `anyLanguage` tokens name a *pool* rather than a list. Reading only
  `skillProficiencies` finds nothing there and makes the feat look like prose worth curating — it is
  not. `getSkillToolLanguageChoices` parses it into one mixed pool, and a pick is applied by which
  pool it came from.
- **The tool list comes from the item data, by type code.** `AT`/`INS`/`GS`/`T`
  (`pGetToolProficiencyNames`), never by matching `" Tools"` in the name — that finds Smith's Tools
  and misses every *Supplies*, *Utensils*, instrument and gaming set, 28 of 40 in the base file.
  Item *groups* ("Artisan's Tools" as a category) and magic variants (a *+1 Rhythm-Maker's Drum*)
  are excluded; the static list in `choices.js` is only the fallback.
- **A species' size can be a question.** Thirty offer "Small or Medium" (`size: ["S","M"]`), which
  decides carrying capacity, grappling and squeezing — so it is asked, stored in `size`, and shown
  as the character's size rather than as the species' menu. `creatureTypes` is recorded beside it: a
  Plasmoid is an Ooze, and that decides what can target it.
- **Two feat fields beyond the obvious ones.** `savingThrowProficiencies` is Resilient, and nothing
  else in the books; `bonusSenses` is how a feat *raises* a sense it does not grant. Both were
  unread, so both feats did nothing at all.
- **"A feat of your choice" is `feats: [{any: 1}]`** — the Variant Human's and the Custom Lineage's.
  `getGrantedFeatCategories` reports it as `FEAT_CATEGORY_ANY`, and `isFeatInGrantCategory` is how every
  picker matches a category: any feat but a Fighting Style or an Epic Boon, which a class gives.
- **A `repeatable` feat may be taken twice.** Skilled and Magic Initiate both are. The pickers used
  to filter out anything already held, and `addOriginFeat` deduplicated by name, so a legal second
  take was offered and then dropped.
- **The small panels watch the whole character, not a list of props.** A hook list that misses one
  shows yesterday's answer until a reload, and that caught this feature four separate times (a
  lineage, a class-granted feat, a size, an origin feat), so species, background and the Build Check
  now re-render on any state change via `bindPanelRender` (`charactersheet-panelrender.js`),
  debounced a frame. The big panels — class, inventory, spells — keep explicit lists, because their
  renders load entity data.
- **A level says what it brings before you take it.** `charactersheet-levelpreview.js` is pure —
  derive at N, derive at N+1, subtract — and lists hit points, proficiency bonus, features, slots and
  resources, then what the level will *ask* (ASI, subclass, masteries, cantrips). It reports and
  never writes, which is what lets **Cancel** put the level back and change nothing else. It reads
  both shapes class data takes: the loader's dereferenced features and the files' raw string refs.
- **A feat uid may narrow the feat as well as name it.** `"magic initiate; wizard|xphb"` is Magic
  Initiate taken with the Wizard list; only the part before the semicolon is the name a taken feat is
  stored under. `getGrantedFeats` splits the two (`name`, `subChoice`, `displayName`), which is what
  lets a background's granted feat ever register as taken.
- **Species / Background panels** (`charactersheet-originpanel.js`, on the sheet and the builder):
  what the entity grants — proficiencies, ability increases, senses and resistances, origin feats —
  each **ticked against what the character actually has**, what is still to choose with the button
  that chooses it, and its traits as cards. A **"choose one of the following" trait** (Elven Lineage,
  Draconic Ancestry, Giant Ancestry, Fiendish Legacy) is one of those questions, not a trait card:
  the guide asks it, the panel asks it, and the Build Check reports it. Origin feats are *applied*,
  never written into a notes box: a feat as prose is invisible to everything that counts.
- **Builder** (`charbuilder.html`): a **Build Check** panel (`charactersheet-audit.js`)
  reporting what breaks a rule and what is unclaimed; guided wizard; species/background/class pickers;
  ability scores; the class/leveling panel (subclass, ASI/feat with prerequisite
  warnings, optional features, **Expertise** chooser, features timeline); the
  class-filtered **spell manager** (learnable-only, known vs prepared counts,
  ritual flags); real inventory with equip/attune; HP-on-level-up policy.
  Feat skill/Expertise **choices are resolved interactively**.
- **Sheet** (`charactersheet.html`): the play view — abilities/saves/skills,
  **computed Armor Class** (armor/shield/unarmored modes + magic bonuses),
  attacks with a **Wield** button and an automatic **Unarmed Strike**, an
  **Actions** panel (action/bonus/reaction economy), spell slots, death saves,
  **rests** (short/long), and a **conditions & concentration** tracker.
  **Exhaustion** applies the 2024 −2/level to every d20 test (checks, saves,
  skills, initiative, passive Perception, weapon and spell attacks — never a
  save DC or damage); ability boxes therefore expose both `mod` and `checkMod`.
  Losing hit points while concentrating raises a **concentration-save prompt**
  (DC 10 or half the damage) from a `hpCur` hook in the page base.
  Inventory rows track **charges** (spent per click; a rest restores what the
  item's `recharge`/`rechargeAmount` say, rolled) and **ammunition** (*Fire*,
  plus the recover-half-after-a-battle rule).
  The **Actions panel is a turn helper**: `charactersheet-availability.js` grades
  each entry against live state (slots, charges, ammo, concentration,
  conditions) and the panel greys the blocked ones with their reason.
- An ability increase that was **skipped** becomes a `pendingAbilityOffers`
  entry rendered beside the scores, not a note in a box — *Assign now* re-walks
  the original packages. Old characters' notes migrate into offers on load
  (`getStateWithMigratedAbilityNotes`, in `charstore`).
- **Sidekick builder** (`sidekick.html`, navbar → Dungeon Master): a DM tool
  covering **both** sidekick rulesets, read from data in each case.
  - *Essentials Kit*: pick a **type** (Expert/Spellcaster/Warrior) and it seeds
    the sheet from that ESK stat block; pick the **role** the block asks for
    (healer/mage, attacker/defender) and it filters which of the block's entries
    apply and sets the spellcasting ability. The `Sidekicks|ESK` variantrule's
    three tables drive a **level-up box**: exact HP maximum + the level's
    features, applied on a click, plus a "catch up to level N" for a sidekick
    that started high.
  - *Tasha's*: pick any bestiary creature + one of the three TCE sidekick
    classes, and the ordinary class panel drives the 1–20 feature timeline and
    spell slots. This is also the path past ESK's 6th-level ceiling.
  - **Traits & Actions** is a list of editable rows (kind, name, text) with an
    Add button — seeded per stat-block entry, tagged when a level granted it.
  - Every seeded value stays hand-editable; nothing is locked.
- **Every number cites its rule**: a breakdown popover lists one contribution per
  line, and beside each is the rule that lets it count — clicking shows the book's
  own text with its source and page. `charactersheet-citations.js` holds the
  catalogue (the 2024 glossary states Proficiency, Armor Class, Passive Perception
  etc. as addressable `variantrule` entries, so almost nothing is curated); a part
  names its own rule in `derive.js` rather than anything guessing from the label.
  A bonus with two possible causes stays unlinked instead of picking one.
- **Accounts are a seam, not a feature here.** `charactersheet-sync.js` holds the
  adapter contract and the mount path (configurable; default `/online`); the page
  base loads `<base>/client.js` in `pInit` and keeps `window.CharacterSyncAdapter`
  only if it implements the whole contract. The account system itself — OIDC
  against Authentik, sessions, storage — is a **separate repository** behind a
  reverse proxy on the same subdomain. Nothing deployed is a supported state, so
  never make sync a precondition for anything. See `docs/ACCOUNT_SYSTEM.md`.
- **Homebrew** works on all three pages, but only because `pInit` (page base) runs
  `PrereleaseUtil.pInit()` / `BrewUtil2.pInit()` / `ExcludeUtil.pInitialise()` before
  `init()`. `classdata` and `SearchWidget` were always brew-aware; without that
  setup every brew call returns nothing. The *Homebrew* toolbar button opens
  5etools' own `ManageBrewUi`.
- **Appearance** (sheet + builder): age/height/weight/eyes/skin/hair and a
  portrait, built once in the page base so the two cannot drift. A portrait is
  downscaled to 400px and re-encoded before storing (`charactersheet-portrait.js`
  decides the size and is tested); the whole store shares one quota.
- **Session journal** (`charactersheet.html`): the sheet records play as it
  happens — hit points lost and regained, going down, death saves, rests, spent
  slots and class resources, conditions, charges, ammunition, levels — and writes
  each session up as a sentence. `charactersheet-journal.js` is pure: it groups
  events into sessions (a six-hour silence, or an explicit *New session*), infers
  fights from bursts of damage, and summarises. Recording is paused while loading
  (`_setLoading` → `setJournalPaused`), or re-opening the sheet would log the
  restored hit-point total as a fight. Capped at 1000 events, oldest dropped.
- **Reference cards** (`charactersheet.html`, the *Cards* button): the character's
  known spells and attacks printed as index cards, built on demand
  (`charactersheet-cards.js` + `-cardspanel.js`) and visible only on paper. The
  card carries the character's own DC/attack bonus, not a formula.
- **Print / PDF** (all pages, the *Print* button): the browser's print-to-PDF.
  The character pages print as a plain sheet; the sidekick prints as a
  **stat-block card** (small-caps name, red rules, abilities six across,
  full trait/action text, reference tables and controls suppressed).
- **Defenses & senses** (all three pages): resistances, immunities, vulnerabilities,
  condition immunities and senses, read structurally from species/feat/item
  (`charactersheet-defenses.js`) and grouped with their source. Gear's are
  *derived from what is equipped*, never stored; a "choose one" trait's
  resistance is derived from the pick. `getAllDefenses(state)` is the one
  view-level entry point.
- **Speed a class adds is derived, not stored** (`getSpeedBonusParts` / `getDerivedSpeed` in `derive`):
  the stored speed is the species' text, so a Monk's Unarmored Movement (a table column, counted
  without armor or a shield) and a Barbarian's Fast Movement (prose, not in heavy armor) are added to
  the walking speed at display time.
- **The Build Check reports an ability past its cap** (`getAbilityCapFindings` in `audit`): 20, raised
  only by an Epic Boon's own increase (`max: 30` on the feat, per ability), and a background whose
  +2/+1 landed on one ability. The online builder allows both and warns; this is where it stays said.
- **A species' natural armor is read off its trait** (`getNaturalArmor` in `appearance`, stored as
  `naturalArmor` when the species is applied): a Tortle's fixed 17, a Lizardfolk's or Autognome's
  13 + Dex, a Loxodon's 12 + Con. `deriveArmorClass` takes it when it beats the rest — over worn armor
  only where the trait says so (a Tortle wears none; a Lizardfolk may use it "if the armor you wear
  would leave you with a lower AC").
- **Unarmored Defense and Martial Arts are derived** (`getUnarmoredDefenseMode`,
  `getMartialArtsDie`, `isMonkWeapon` in `derive`): a Barbarian or Monk with no armor gets its own
  AC formula without picking a mode, and a Monk's weapons and Unarmed Strike use the better of
  Str/Dex and the Martial Arts die.
- Equipped magic items feed derivations globally: AC, saving throws, spell save
  DC and spell attack, weapon attack/damage, and the defenses above (`derive.js`).
- All three pages share one character store, so a character built in the builder
  is immediately playable on the sheet.

## 5etools class data structure (read this before adding class mechanics)

Almost every class/subclass mechanic the builder needs is **structured data**,
not prose — mining it is how you integrate features correctly. Files:

- `data/class/class-<name>.json` — arrays `class[]`, `subclass[]`,
  `classFeature[]`, `subclassFeature[]`. The `DataLoader` class loader
  **dereferences** the feature refs, so a loaded `cls.classFeatures` is a
  **by-level array of resolved feature objects** (index 0 = level 1). Read via
  `CharacterSheetClassData`, never re-parse refs yourself.
- `data/class/fluff-class-<name>.json` — prose only (`classFluff`, `subclassFluff`).

Key fields (all read by `charactersheet-levelengine.js` unless noted):

- **`classFeatures` refs** are strings `"Name|Class|ClassSource|Level"` (source
  blank ⇒ PHB). A feature that unlocks the subclass is `{classFeature, gainSubclassFeature: true}`.
  2014 subclasses bundle their level features as **nested `refSubclassFeature`
  entries inside one level feature** (e.g. Rakish Audacity lives *inside* the
  level‑3 "Swashbuckler" feature) — collect names recursively
  (`CharacterSheetClassData.pGetCharacterFeatureNames`).
- **`classTableGroups`** = the class table. `colLabels` + `rows` hold per-level
  resource values — **Rages, Rage Damage, Weapon Mastery (count), Sneak Attack,
  Martial Arts die, Ki/Focus/Sorcery Points, Channel Divinity, Wild Shape,
  Bardic Die, Invocations, Favored Enemy**. Cells are strings, numbers, or
  `{type:"dice"|"bonus"|"bonusSpeed"}` (`getClassResources`/`getWeaponMasteryCount`).
  A group with `rowsSpellProgression` is the spell-slot table instead.
- **Spellcasting**: `casterProgression` (`full`/`1/2`/`1/3`/`artificer`/`pact`),
  `cantripProgression`, `spellsKnownProgression`, `preparedSpells` (formula),
  `spellcastingAbility`.
- **`additionalSpells`** — auto-granted domain/patron/circle spells. Array of
  groups with buckets `prepared`/`known`/`expanded`/`innate`, each keyed by
  **class level** → list of uids (`"cure wounds|phb"`) or dynamic
  `{choose}`/`{all}` filters. `getGrantedSpellUids` reads the plain-uid ones.
  The **`innate` bucket wraps its lists in a frequency** — `ritual`, `daily`,
  `rest`, `resource` — which a plain-uid read cannot see into, so it has its own
  reader (`getInnateSpellGrants` + `getInnateSpellCastingNote`). `resource` is
  keyed by **cost** and the group's `resourceName` says what is spent: a Way of
  Shadow monk casts Darkness for 2 Ki Points, never out of a slot.
  The **`expanded` bucket is not a grant** — it is what the character may now
  *learn* — so it is reported as `type: "expanded"` by `getDynamicSpellGrants`
  and merged into the spell browser, never into the always-prepared list.
  Its keys are often **`s1`–`s9`: a spell *slot* level, not a class level** (all
  twelve Warlock patrons, the 2024 Bard's Magical Secrets), resolved against the
  parent class's slot table by `getSlotLevelUnlockLevel` — a subclass has none of
  its own, hence `getDynamicSpellGrants(sc, level, {slotSource: cls})`.
  **More than one group is a choice of one** — a Circle of the Land's terrain, a Genie's kind, an
  Arcane Archer's Prestidigitation *or* Druidcraft, an Elf's lineage. Reading every group granted all
  eight terrains. The pick is stored in `spellGroups` (`getSpellGroupKey`), every reader goes through
  `getWithChosenSpellGroup`, buildsteps owes it (`STEP_SPELL_GROUP`), and a species' lineage trait
  pick of the same name answers it, so an Elf is not asked twice.
- **`spellsKnownProgressionFixed`** — the Wizard's **spellbook**, `[6, 2, 2, …]`
  being what each level *adds*, so the book is the running total
  (`getSpellbookSize`). Not the prepared count: a Wizard prepares *from* the
  book, and the two are different numbers.
- **`consumes`** — what using a feature spends, on 137 features:
  `{name}` / `{name, amount}` / `{name, amountMin, amountMax}` (Bastion of Law,
  1–5 Sorcery Points). Read by `getFeatureCost`; the name is the book's shorthand
  ("Ki") and the class table's column is the full one ("Ki Points"), so
  `matchResourceLabel` normalises both sides rather than either being curated.
  This is what grades a feature in the turn helper — the old curated
  feature→resource map knew nine names and no subclass at all. The 2024 Psi
  Warrior/Soulknife table heads its columns "Die Size"/"Number" and never names
  the pool, so `getClassResources` names it from the `consumes` of the features
  that spend it.
- **When a feature is taken** is prose, but formulaic: "As a Bonus Action, you
  can spend 1 Focus Point…". `getFeatureActionBucket` reads it for the 56
  features that say so and returns null for the rest rather than guessing a
  rider (Psionic Strike happens on a hit) into the Action column.
- **`spellsKnownProgressionFixedByLevel`** — the Warlock's **Mystic Arcanum**,
  and only that: one 6th-level spell at 11, a 7th at 13, an 8th at 15, a 9th at
  17, each cast at its own level once per long rest. Outside `spellsKnownProgression`
  because a pact caster has no slot that could pay for one.
  `getFixedSpellsKnownGrants` returns them in `getDynamicSpellGrants`' shape, so
  the panel's existing chooser resolves them (`STEP_FIXED_SPELL` in buildsteps).
- **`isClassFeatureVariant`** — Tasha's **optional class features**, referenced
  from `classFeatures` *beside* the features they replace, so reading the list
  naively grants both halves of an either/or (Favored Enemy **and** Favored Foe).
  They are a permission the table gives: opted into per class entry
  (`featureVariants`, `setFeatureVariantForClass`), and what one replaces is read
  from its own italic header rather than curated
  (`annotateVariantFeatures` / `filterActiveFeatures` / `getVariantReplacedNames`
  in `charactersheet-features.js`). `getActiveFeatureTimeline` is the filtered view;
  `getFeatureTimeline` keeps the untaken ones so the builder can offer them.
- **`optionalfeatureProgression`** — counts of Invocations / Maneuvers etc. by
  level (`getOptionalFeatureCounts`). A **feat** writes its progression `{"*": n}`
  — "n of them, whatever your level" — and `Number("*")` is NaN, so a level-indexed
  read returned nothing for all four feats built this way (Martial Adept, Metamagic
  Adept, Eldritch Adept, Fighting Initiate). They hang off a class entry, because
  that is where the model keeps optional features (`pResolveFeatOptionalFeatures`).
- **`featProgression`** — feats the class table grants *by category*: the 2024
  **Fighting Style** (Fighter 1, Paladin 2, Ranger 2, Champion 7) is a feat of
  category `FS` now, not an optional feature, and every class gains an **Epic
  Boon** at 19 (`getFeatProgressionCounts`). The class panel also offers these
  from the feature card that names them, so the guide and the Build Check count
  what was taken **by category**, not by which chooser recorded it.
- **`preparedSpells`** is a formula, and two of them halve the level: `<$level$> / 2 + <$int_mod$>`
  (Artificer) and the 2014 Paladin's. `getPreparedSpellCount` rounds the half down; reading the term as a
  plain number left both classes with no limit at all.
- **`preparedSpellsProgression`** — the 2024 prepared casters replaced the
  `preparedSpells` formula with an exact by-level table that no longer uses the
  ability modifier. `getPreparedSpellCount` reads whichever the class has;
  reading only the formula left every XPHB prepared caster with no limit at all.
- **`startingProficiencies`** (skills/tools/languages, some as `{choose}`),
  **`startingEquipment`** (`defaultData` A/B groups), **`multiclassing`**.
- Feature *effects* that are only prose (a subclass adding an ability mod to
  Initiative, etc.) can't be read structurally — those use a **small curated map**
  (`charactersheet-features.js`, `charactersheet-actions.js`). Prefer structured
  reads; fall back to curated only for unambiguous prose cases.

Some counts are inconsistent between books (e.g. Weapon Mastery is a table
column for Fighter/Barbarian but prose "two kinds" for Rogue/Ranger/Paladin) —
read the column when present, curated fallback otherwise.

## Updating from upstream

Preferred: `bash scripts/update-from-upstream.sh` (fetches, merges, regenerates
pages, runs Character Sheet lint + tests, makes a safety backup branch). If a
conflict occurs it will be in one of the 5 shared files above — resolve by
keeping BOTH the fork's registration line(s) and upstream's changes, per
`docs/CHARACTER_SHEET_MAINTENANCE.md`.

It also happens nightly, unattended, via `.github/workflows/sync-upstream.yml`.
Read its green tick carefully: on a night when upstream has not moved it skips
everything after its second step, so success means only "nothing to do". To
exercise it for real, dispatch it with `force` (and `dry_run` to keep the result
off `main`), or run `bash scripts/rehearse-upstream-sync.sh clean|conflict`,
which replays its steps over a synthetic upstream in a throwaway clone — the
only way to reach the conflict path deliberately.

## Verifying Character Sheet changes

All three run in CI on every push (`.github/workflows/charactersheet-ci.yml`).

- Lint: `npx eslint js/charactersheet.js js/charbuilder.js js/sidekick.js js/charactersheet/`
- Unit tests (pure modules, ~2s): `npm run test:unit -- test/jest/CharacterSheet`
- Browser tests (the real pages, ~3min): `npm run test:e2e` — starts its own dev server.
  Add one for any behaviour that only exists in the running page; see `test/e2e/README.md`.
- Manual: `npm run serve:dev` then open `http://localhost:5050/charactersheet.html`
  (or `/charbuilder.html`, `/sidekick.html`; regenerate first if you changed a template).
- `npm install` may need `--engine-strict=false` if the local Node is older than
  the repo's `engines` requirement.
