# Guide : traduire du contenu 5etools en français

Ce document décrit la méthode utilisée pour traduire **Baldur's Gate : Descent into Avernus (BGDIA)** — aventure, bestiaire, objets, etc. — afin de reproduire le processus pour n'importe quelle autre source. Il couvre aussi les pièges rencontrés (liens, `_copy`, fluff, index de la barre latérale).

---

## 1. Inventaire du contenu d'une source

Avant toute chose, lister tout ce qui appartient à la source (ici `BGDIA`) dans `data/` :

```js
// Liste tous les fichiers data/ contenant des entrées de la source
const fs = require("fs");
for (const f of fs.readdirSync("data").filter(f => f.endsWith(".json"))) {
  const s = fs.readFileSync("data/" + f, "utf8");
  if (s.includes('"source": "BGDIA"')) console.log(f);
}
```

Typiquement une source touche : `adventure/adventure-*.json`, `bestiary/bestiary-*.json`,
`bestiary/fluff-bestiary-*.json`, `items.json`, `magicvariants.json`, `rewards.json`,
`vehicles.json`, `trapshazards.json`, `backgrounds.json`, `fluff-items.json`,
`fluff-vehicles.json`, `fluff-backgrounds.json`, `adventures.json` (barre latérale),
parfois `spells/`, `tables.json`, `objects.json`, `deities.json`,
`bestiary/legendarygroups.json`.

---

## 2. Règles de traduction (strictes)

Le rendu 5etools **parse** les fichiers JSON. Ne traduire **que les chaînes affichées**.

### À traduire
- `name` des entrées (monstres, objets, chapitres, sections…)
- `entries` (prose), texte à lire à voix haute, légendes et cellules de tableaux
- Noms des traits/actions/réactions/légendaires des statblocks
- Texte de remplacement des `_mod` (`replaceTxt`, `replaceArr`, `appendArr`)
- Champs `reqAttune` quand c'est une phrase, `note`/`header` libres
- Unités en prose : `feet` → `pieds`/`mètres`, `miles` → `kilomètres` (nombres conservés ou convertis avec cohérence)

### À NE JAMAIS toucher
- Les **clés JSON** et la structure (longueurs de tableaux identiques)
- Les **formules de dés**, nombres, `ac`, `hp`, `cr`, `page`, `source`
- Les chaînes parsées : `speed` (`"fly 40 ft."`), `senses` (`"darkvision 60 ft."`),
  clés de `save`/`skill` (`"DEX"`), `type`, `size`, `alignment`, `rarity`,
  `skillProficiencies` (`"arcana"`), identifiants de langues
- Les `_copy.name`/`_copy.source` (références vers la créature de base anglaise)
- Les tableaux `mapRegions`, chemins d'images, `token`, métadonnées

### Balises inline `{@tag identifiant|source|texte affiché}`
- Le **premier segment** après le nom de balise est un **identifiant machine** : il reste en ANGLAIS
- Seul le **texte affiché** (dernier segment après `|`) peut être traduit
  - ✅ `{@item sword of zariel|BGDIA|épée de Zariel}`
  - ❌ `{@item épée de Zariel|BGDIA|épée de Zariel}` (lien cassé)
- Ne jamais altérer l'intérieur de `{@dice}`, `{@hit}`, `{@dc}`, `{@atk}`, `{@h}`, `{@recharge}`
- `{@book Texte|SOURCE|chapitre|page}` : le premier segment EST le texte affiché (traduisible)

> ⚠️ Exception : si l'**entité cible elle-même** a été renommée en français, l'identifiant
> DOIT pointer vers le nouveau nom français (voir §4).

---

## 3. L'astuce `_copy` : les monstres copiés restent anglais

Beaucoup de monstres sont des `_copy` d'une créature d'un autre livre (MM, MTF…).
Même traduits (nom + `_mod`), leur corps s'affiche en anglais car il vient de la base.

**Solution** : résoudre et déployer chaque copie en statblock complet inline :

1. Charger la créature de base depuis `data/bestiary/bestiary-*.json`
2. Appliquer les `_mod` : `replaceTxt` (remplacement global de texte, insensible à la casse),
   `replaceArr`/`appendArr` (remplacer/ajouter un trait ou une action par `name`),
   `addSkills` (fusion dans `skill`), `replaceSpells` (remplacement de `{@spell ...}`)
3. Fusionner les champs propres de la copie (`name`, `size`, `languages`…) par-dessus
4. Supprimer `_copy`, traduire le résultat, réinsérer

C'est ce qui a été fait pour les 22 monstres `_copy` de BGDIA (Traxigor ← Archmage MM,
Zariel ← Zariel MTF, Lulu ← Hollyphant, Raggadragga ← Wereboar…).

Même problème pour les `backgrounds` copiés du PHB et les variantes d'objets
(`magicvariants.json` : ne traduire que `inherits.entries`, **pas** `namePrefix`
qui est concaténé aux noms anglais des armes de base).

---

## 4. Renommage = reparcourir toutes les références

Quand on renomme une entité (ex. `Abyssal Chicken` → `Poulet des Abysses`), **tous**
les liens qui la ciblent par nom cassent, car le renderer résout les balises par
recherche sur le champ `name`.

Après traduction, repointer les balises dans **tous** `data/` :

```js
// {@creature/item/reward/vehicle/hazard/background <NomAnglais>|BGDIA → nom français
const re = new RegExp(`\\{@creature ${nomAnglais}\\|BGDIA`, "gi");
s = s.replace(re, `{@creature ${nomFrancais}|BGDIA`);
```

Points d'attention :
- Les identifiants dans les balises sont souvent en **minuscules** → matcher sans casse
- D'**autres livres** référencent la source (ex. `book-hf.json` → `{@creature abyssal chicken|BGDIA}`,
  `adventure-coa.json` → pièces d'âme) : scanner tout `data/`, pas seulement les fichiers traduits
- Aligner les noms entre fichiers parallèles : `fluff-bestiary` ↔ `bestiary`,
  `fluff-items` ↔ `items`, `fluff-vehicles` ↔ `vehicles`, `fluff-backgrounds` ↔ `backgrounds`
  (le fluff se résout **par nom** : une casse différente casse la liaison)

Vérification finale — aucune balise ne doit pointer vers un nom inexistant :

```js
const names = new Set(bestiaire.monster.map(m => m.name.toLowerCase()));
// pour chaque {@creature X|BGDIA rencontré : names.has(X.toLowerCase()) doit être vrai
```

---

## 5. La barre latérale (table des matières)

Le menu de gauche d'une aventure vient du champ `contents` dans **`data/adventures.json`**
— pas du fichier d'aventure. Il faut le mettre à jour séparément :

- `contents[i].name` : nom du chapitre **sans** le préfixe (« Chapitre 4 : » est rendu
  séparément depuis `ordinal`)
- `contents[i].headers` : les titres de sections, y compris les objets
  `{"depth":1,"header":"E1. Salle commune"}`

**La navigation fait du text-matching** (`bookutils.js`, `_scrollClick`) : chaque
`header` doit correspondre EXACTEMENT au `name` traduit de l'entrée correspondante
dans le chapitre. La méthode fiable : aligner structurellement l'original anglais
et la traduction (mêmes clés/ids dans le même ordre) et générer `contents` depuis
les noms réellement traduits.

---

## 6. Processus recommandé (rétrospective BGDIA)

1. Extraire le contenu à traduire (chapitres d'aventure en fichiers séparés,
   entrées BGDIA des fichiers partagés) pour pouvoir paralléliser
2. Traduire avec le protocole du §2 ; noms français officiels si disponibles,
   sinon garder le nom anglais (noms propres : Lulu, Bel, Traxigor…)
3. Déployer les `_copy` (§3) avant traduction
4. Réinsérer, puis repointer toutes les références (§4)
5. Régénérer `contents` dans `adventures.json` (§5)
6. Vérifications : `JSON.parse` sur chaque fichier, structures identiques à
   l'original (listes ordonnées des `id`), zéro identifiant de balise traduit,
   zéro référence morte, noms fluff alignés
7. `docker compose up -d --build` pour voir le résultat (l'image copie les fichiers
   au build) + hard-refresh (le service worker met en cache)

## 7. Limites connues

- **L'interface** (libellés « Armor Class », « Saving Throws », filtres, menus) est
  codée en anglais dans `js/render.js` : la traduire est un projet d'i18n à part
- Les contenus copiés depuis des livres non traduits (PHB, MM) s'affichent en
  anglais tant que ces livres ne sont pas traduits (ex. tables idéaux/liens/défauts
  des backgrounds PHB)
- `spellcheck` et certains tests `npm test` s'attendent à de l'anglais
