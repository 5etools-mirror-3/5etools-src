import {CHAR_SHEET_ABILITIES, CHAR_SHEET_SKILLS, PROF_STATE_EXPERTISE, PROF_STATE_NONE, PROF_STATE_PROFICIENT, getSkillKeyByName, getSkillNameByKey} from "./charactersheet-consts.js";
import {getEntityProficiencies, PROF_KIND_LANGUAGE, PROF_KIND_TOOL} from "./charactersheet-proficiencies.js";

/**
 * The "choice queue": pure extraction of unresolved choices (skill/language/tool picks) from
 * race/background/class data, as generic descriptors a UI can walk the user through.
 * Fixed (non-choice) proficiencies are not part of the queue; they are applied directly.
 */

// Fixed core lists (PHB); referenced by the `anyGamingSet`/`anyMusicalInstrument`/`anyArtisansTool` choice keys
export const GAMING_SETS = ["Dice set", "Dragonchess set", "Playing card set", "Three-Dragon Ante set"];
export const MUSICAL_INSTRUMENTS = ["Bagpipes", "Drum", "Dulcimer", "Flute", "Horn", "Lute", "Lyre", "Pan flute", "Shawm", "Viol"];
export const ARTISANS_TOOLS = [
	"Alchemist's supplies", "Brewer's supplies", "Calligrapher's supplies", "Carpenter's tools", "Cartographer's tools",
	"Cobbler's tools", "Cook's utensils", "Glassblower's tools", "Jeweler's tools", "Leatherworker's tools",
	"Mason's tools", "Painter's supplies", "Potter's tools", "Smith's tools", "Tinker's tools",
	"Weaver's tools", "Woodcarver's tools",
];
/** Everything `{any: n}` may draw from — the artisan's tools plus the other tool groups and the loose tools. */
export const OTHER_TOOLS = ["Disguise kit", "Forgery kit", "Herbalism kit", "Navigator's tools", "Poisoner's kit", "Thieves' tools", "Vehicles (land)", "Vehicles (water)"];

export const CHOICE_TYPE_SKILL = "skill";
export const CHOICE_TYPE_WEAPON = "weapon";
export const CHOICE_TYPE_LANGUAGE = "language";
export const CHOICE_TYPE_TOOL = "tool";
/** One pick that may be spent on a skill, a tool *or* a language — see `getSkillToolLanguageChoices`. */
export const CHOICE_TYPE_SKILL_TOOL_LANGUAGE = "skillToolLanguage";
export const CHOICE_TYPE_ABILITY = "ability";
export const CHOICE_TYPE_EXPERTISE = "expertise";

let _ID = 0;
const _nextId = () => `csc-${_ID++}`;

const _titleCase = str => String(str).replace(/\w\S*/g, txt => txt[0].toUpperCase() + txt.slice(1));

/**
 * Human-readable summary of a proficiency group array
 * (used for the "apply the structured fields, render the rest as text" path).
 * @param [opts.isFixedOnly] Drop the "N of your choice" entries, keeping only outright grants.
 * @param [opts.isChoiceOnly] The inverse: keep only the choices, for when the grants are stored structurally.
 */
export function getProfListDisplay (arr, {isFixedOnly = false, isChoiceOnly = false} = {}) {
	if (!arr || !arr.length) return "";
	const out = [];
	arr.forEach(grp => {
		Object.entries(grp).forEach(([k, v]) => {
			if (v === true) return isChoiceOnly ? undefined : out.push(_titleCase(k));
			if (isFixedOnly) return;
			if (k === "choose" && v && v.from) out.push(`${v.count || 1} of your choice`);
			else if (typeof v === "number") out.push(/^any/i.test(k) ? `${v} of your choice` : `${v}× ${_titleCase(k)}`);
			else if (/^any/i.test(k)) out.push("one of your choice");
		});
	});
	return out.join(", ");
}

/**
 * A stable name for one choice, so that "has this been answered?" has an answer.
 *
 * The `id`s handed out above are per-render and cannot be stored; what identifies a choice across
 * sessions is where it came from and what it asks. Everything that resolves a choice — the guided
 * setup, the species and background pickers — records it under this key, and everything that asks
 * what is left reads the same one. Without it the guide and the panels each kept their own idea of
 * what had been done, and disagreed.
 */
export function getChoiceSignature (choice) {
	return `${choice?.sourceName || ""}|${choice?.type || ""}|${choice?.label || ""}`;
}

const _ALL_SKILL_NAMES = () => CHAR_SHEET_SKILLS.map(({name}) => name);

/**
 * What the character already holds, keyed by the choice type that could offer it again.
 *
 * Nothing is gained by taking the same proficiency twice, and the sheet cannot say so afterwards: a
 * skill records a state, not a count, so a second grant lands on a box that is already ticked and
 * the pick is simply lost. A Human Fighter offered Acrobatics by both its species and its class can
 * spend two of its three skills on one. So every chooser subtracts this set first.
 */
export function getHeldProficiencyNames (state) {
	const out = {
		[CHOICE_TYPE_SKILL]: new Set(),
		[CHOICE_TYPE_TOOL]: new Set(),
		[CHOICE_TYPE_LANGUAGE]: new Set(),
	};

	CHAR_SHEET_SKILLS.forEach(({key, name}) => {
		if (Number(state?.[`skill_${key}`]) > 0) out[CHOICE_TYPE_SKILL].add(name);
	});

	(state?.proficiencies || []).forEach(prof => {
		const bucket = prof?.kind === PROF_KIND_TOOL
			? out[CHOICE_TYPE_TOOL]
			: prof?.kind === PROF_KIND_LANGUAGE ? out[CHOICE_TYPE_LANGUAGE] : null;
		if (!bucket) return;
		// Stored as `{kind, name}` (the model's shape); `entries` is the merged view's, accepted as well.
		// Reading only `entries` saw no tool and no language at all, so every one was offered again
		[prof.name, ...(Array.isArray(prof.entries) ? prof.entries : [])].filter(Boolean).forEach(name => bucket.add(name));
	});

	return out;
}

/**
 * The same, for entities that are *picked but not yet applied* — the guided setup's draft. Its
 * choices are all answered before anything reaches the sheet, so the character cannot yet tell the
 * class chooser that the background hands it Stealth outright.
 */
export function getFixedProficiencyNames ({race = null, background = null, cls = null} = {}) {
	const out = {
		[CHOICE_TYPE_SKILL]: new Set(),
		[CHOICE_TYPE_TOOL]: new Set(),
		[CHOICE_TYPE_LANGUAGE]: new Set(),
	};

	[race, background, cls].filter(Boolean).forEach(ent => {
		(ent.skillProficiencies || []).forEach(grp => {
			Object.entries(grp).forEach(([k, v]) => {
				if (v !== true) return;
				const name = getSkillNameByKey(getSkillKeyByName(k));
				if (name) out[CHOICE_TYPE_SKILL].add(name);
			});
		});

		getEntityProficiencies(ent).forEach(prof => {
			if (prof.kind === PROF_KIND_TOOL) out[CHOICE_TYPE_TOOL].add(prof.name);
			else if (prof.kind === PROF_KIND_LANGUAGE) out[CHOICE_TYPE_LANGUAGE].add(prof.name);
		});
	});

	return out;
}

/** The union of two such maps. */
export function mergeHeldProficiencyNames (...maps) {
	const out = {
		[CHOICE_TYPE_SKILL]: new Set(),
		[CHOICE_TYPE_TOOL]: new Set(),
		[CHOICE_TYPE_LANGUAGE]: new Set(),
	};
	maps.filter(Boolean).forEach(map => {
		Object.entries(out).forEach(([type, set]) => (map[type] || []).forEach(name => set.add(name)));
	});
	return out;
}

/**
 * A choice with everything the character already has taken out of it, and its count clipped to what
 * is left. Returns `null` when nothing remains to offer — the grant is spent, not owed.
 */
export function getChoiceWithoutHeld (choice, held) {
	const taken = held?.[choice?.type];
	if (!taken?.size || !Array.isArray(choice?.from)) return choice;
	const from = choice.from.filter(name => !taken.has(name));
	if (!from.length) return null;
	return {...choice, from, count: Math.min(choice.count || 1, from.length)};
}

/** Skill choices from a `skillProficiencies`-style group array. Option values are display names. */
export function getSkillChoices ({groups, sourceName}) {
	const out = [];
	(groups || []).forEach(grp => {
		Object.entries(grp).forEach(([k, v]) => {
			if (k === "choose" && v?.from) {
				out.push({
					id: _nextId(),
					type: CHOICE_TYPE_SKILL,
					sourceName,
					count: v.count || 1,
					from: v.from.map(name => getSkillNameByKey(getSkillKeyByName(name)) || _titleCase(name)),
					label: `Choose ${v.count || 1} skill${(v.count || 1) > 1 ? "s" : ""}`,
				});
			} else if (k === "any" && typeof v === "number") {
				out.push({
					id: _nextId(),
					type: CHOICE_TYPE_SKILL,
					sourceName,
					count: v,
					from: _ALL_SKILL_NAMES(),
					label: `Choose ${v} skill${v > 1 ? "s" : ""} (any)`,
				});
			}
		});
	});
	return out;
}

/**
 * Expertise choices from an `expertise`-style group array (feats such as Prodigy / Skill Expert).
 * `{choose: {from, count}}` and `{any: n}` list skills directly; `{anyProficientSkill: n}` draws
 * from the character's currently-proficient skills, passed in as `proficientSkillNames`.
 * Fixed `{"skill": true}` grants are applied elsewhere and are not queued here.
 */
export function getExpertiseChoices ({groups, sourceName, proficientSkillNames = []}) {
	const out = [];
	(groups || []).forEach(grp => {
		Object.entries(grp).forEach(([k, v]) => {
			if (k === "choose" && v?.from) {
				out.push({
					id: _nextId(),
					type: CHOICE_TYPE_EXPERTISE,
					sourceName,
					count: v.count || 1,
					from: v.from.map(name => getSkillNameByKey(getSkillKeyByName(name)) || _titleCase(name)),
					label: `Expertise: choose ${v.count || 1} skill${(v.count || 1) > 1 ? "s" : ""}`,
				});
			} else if ((k === "any" || k === "anyProficientSkill") && typeof v === "number") {
				out.push({
					id: _nextId(),
					type: CHOICE_TYPE_EXPERTISE,
					sourceName,
					count: v,
					from: k === "anyProficientSkill" ? [...proficientSkillNames] : _ALL_SKILL_NAMES(),
					label: `Expertise: choose ${v}${k === "anyProficientSkill" ? " proficient" : ""} skill${v > 1 ? "s" : ""}`,
				});
			}
		});
	});
	return out;
}

/** Language choices from a `languageProficiencies`-style group array. */
export function getLanguageChoices ({groups, sourceName}) {
	const out = [];
	(groups || []).forEach(grp => {
		Object.entries(grp).forEach(([k, v]) => {
			if (k === "choose" && v?.from) {
				out.push({
					id: _nextId(),
					type: CHOICE_TYPE_LANGUAGE,
					sourceName,
					count: v.count || 1,
					from: v.from.map(_titleCase),
					label: `Choose ${v.count || 1} language${(v.count || 1) > 1 ? "s" : ""}`,
				});
			} else if ((k === "anyStandard" || k === "any") && typeof v === "number") {
				out.push({
					id: _nextId(),
					type: CHOICE_TYPE_LANGUAGE,
					sourceName,
					count: v,
					from: (k === "anyStandard" ? Parser.LANGUAGES_STANDARD : Parser.LANGUAGES_ALL).map(_titleCase),
					label: `Choose ${v}${k === "anyStandard" ? " standard" : ""} language${v > 1 ? "s" : ""}`,
				});
			}
		});
	});
	return out;
}

/**
 * Every tool a "choose any tool" may draw from.
 *
 * A static fallback, not the truth: the real list is the item data, read by
 * `CharacterSheetClassData.pGetToolProficiencyNames`. This is what callers that cannot await get,
 * and what applies when the item data will not load.
 */
export const ALL_TOOL_NAMES = [...ARTISANS_TOOLS, ...GAMING_SETS, ...MUSICAL_INSTRUMENTS, ...OTHER_TOOLS].sort();
const _ALL_TOOLS = ALL_TOOL_NAMES;

/**
 * `skillToolLanguageProficiencies` — one pick spendable across the three kinds.
 *
 * The books' "any combination of three skills or tools of your choice" (Skilled, a Half-Elf's Skill
 * Versatility) is not three skill picks *and* three tool picks; it is three picks from one pool. The
 * data says exactly that, in its own field, with `anySkill` / `anyTool` / `anyLanguage` as the pool
 * tokens — which is why nothing was found by reading `skillProficiencies` alone.
 *
 * Two shapes appear:
 *  - `{choose: [{from: ["anySkill", "anyTool"], count: 3}]}` — the mixed pool;
 *  - a bare `{anyTool: 1}` or `{anyLanguage: 1, anyTool: 1}` group, which is the same thing with one
 *    token per key.
 *
 * `toolNames` is injected rather than read here, so this stays pure and testable: callers that can
 * await pass the real item-data list, and the rest get the static fallback.
 *
 * @return {Array} choices whose `pools` say which kind each option in `from` belongs to.
 */
export function getSkillToolLanguageChoices ({groups, sourceName, toolNames = ALL_TOOL_NAMES} = {}) {
	const out = [];
	const _WHAT = {[CHOICE_TYPE_SKILL]: "skill", [CHOICE_TYPE_TOOL]: "tool", [CHOICE_TYPE_LANGUAGE]: "language"};

	const mkPools = tokens => {
		const pools = {[CHOICE_TYPE_SKILL]: [], [CHOICE_TYPE_TOOL]: [], [CHOICE_TYPE_LANGUAGE]: []};
		tokens.forEach(token => {
			switch (token) {
				case "anySkill": pools[CHOICE_TYPE_SKILL] = _ALL_SKILL_NAMES(); break;
				case "anyTool": pools[CHOICE_TYPE_TOOL] = [...toolNames]; break;
				case "anyLanguage": pools[CHOICE_TYPE_LANGUAGE] = (Parser.LANGUAGES_ALL || []).map(_titleCase); break;
				case "anyStandardLanguage": pools[CHOICE_TYPE_LANGUAGE] = (Parser.LANGUAGES_STANDARD || []).map(_titleCase); break;
				// An unknown token would silently shrink the pool, so it is skipped rather than guessed at
			}
		});
		return pools;
	};

	const push = ({tokens, count}) => {
		const pools = mkPools(tokens);
		const from = [...pools[CHOICE_TYPE_SKILL], ...pools[CHOICE_TYPE_TOOL], ...pools[CHOICE_TYPE_LANGUAGE]];
		if (!from.length) return;
		const n = count || 1;
		// "3 skills or tools", not "3 skill or tools" — each kind carries the plural
		const kinds = Object.entries(pools)
			.filter(([, list]) => list.length)
			.map(([type]) => `${_WHAT[type]}${n > 1 ? "s" : ""}`);
		out.push({
			id: _nextId(),
			type: CHOICE_TYPE_SKILL_TOOL_LANGUAGE,
			sourceName,
			count: n,
			from,
			pools,
			label: `Choose ${n} ${kinds.join(" or ")}`,
		});
	};

	(groups || []).forEach(grp => {
		Object.entries(grp || {}).forEach(([k, v]) => {
			if (k === "choose") {
				[v].flat().filter(Boolean).forEach(c => push({tokens: [c.from].flat().filter(Boolean), count: c.count}));
				return;
			}
			if (typeof v === "number") push({tokens: [k], count: v});
		});
	});

	return out;
}

const _TOOL_ANY_KEYS = {
	anyGamingSet: {from: GAMING_SETS, what: "gaming set"},
	anyMusicalInstrument: {from: MUSICAL_INSTRUMENTS, what: "musical instrument"},
	anyArtisansTool: {from: ARTISANS_TOOLS, what: "artisan's tool"},
	any: {from: _ALL_TOOLS, what: "tool"},
	anyTool: {from: _ALL_TOOLS, what: "tool"},
};

/** Tool choices from a `toolProficiencies`-style group array; unrecognised keys are skipped (rendered as text elsewhere). */
export function getToolChoices ({groups, sourceName}) {
	const out = [];
	(groups || []).forEach(grp => {
		Object.entries(grp).forEach(([k, v]) => {
			let from = null;
			if (k === "choose" && v?.from) {
				out.push({
					id: _nextId(),
					type: CHOICE_TYPE_TOOL,
					sourceName,
					count: v.count || 1,
					from: v.from.map(_titleCase),
					label: `Choose ${v.count || 1} tool${(v.count || 1) > 1 ? "s" : ""}`,
				});
				return;
			}
			if (typeof v !== "number") return;
			const spec = _TOOL_ANY_KEYS[k];
			if (!spec) return;
			out.push({
				id: _nextId(),
				type: CHOICE_TYPE_TOOL,
				sourceName,
				count: v,
				from: spec.from,
				label: `Choose ${v} ${spec.what}${v > 1 ? "s" : ""}`,
			});
		});
	});
	return out;
}

const _ABILITY_NAMES = {str: "Strength", dex: "Dexterity", con: "Constitution", int: "Intelligence", wis: "Wisdom", cha: "Charisma"};

/**
 * Normalise an `ability` array (race/background/feat) into packages of
 * `{fixed: {abv: n}, choose: {from, count, amount} | null, weighted: {from, weights} | null}`.
 * Multiple array entries are alternative packages ("choose one of these").
 */
export function getAbilityPackages (ability) {
	return (ability || []).map(pkg => {
		const fixed = {};
		Object.entries(pkg).forEach(([k, v]) => {
			if (k !== "choose" && typeof v === "number") fixed[k] = v;
		});
		const choose = pkg.choose && !pkg.choose.weighted
			? {from: pkg.choose.from || [], count: pkg.choose.count || 1, amount: pkg.choose.amount || 1}
			: null;
		const weighted = pkg.choose?.weighted
			? {from: pkg.choose.weighted.from || [], weights: pkg.choose.weighted.weights || []}
			: null;
		return {fixed, choose, weighted};
	});
}

/**
 * The fixed ability bonuses of an `ability` array, when unambiguous (exactly one package).
 * Alternative packages route through the choice queue instead.
 */
export function getFixedAbilityBonuses (ability) {
	const packages = getAbilityPackages(ability);
	if (packages.length !== 1) return {};
	return packages[0].fixed;
}

/** Short display for one ability package, e.g. "+2 Cha; +1 to 2 of Str, Dex" or "+2/+1 among Con, Int, Wis". */
export function getAbilityPackageDisplay (pkg) {
	const pts = [];
	Object.entries(pkg.fixed).forEach(([abv, n]) => pts.push(`${n >= 0 ? "+" : ""}${n} ${_ABILITY_NAMES[abv] || abv}`));
	if (pkg.choose) {
		const ptFrom = pkg.choose.from.length === 6 ? "any" : pkg.choose.from.map(abv => _ABILITY_NAMES[abv] || abv).join(", ");
		pts.push(`+${pkg.choose.amount} to ${pkg.choose.count} of ${ptFrom}`);
	}
	if (pkg.weighted) {
		const ptWeights = pkg.weighted.weights.map(w => `+${w}`).join("/");
		pts.push(`${ptWeights} among ${pkg.weighted.from.map(abv => _ABILITY_NAMES[abv] || abv).join(", ")}`);
	}
	return pts.join("; ");
}

/**
 * Ability score increase choices from an `ability` array. Fixed single-package bonuses are not
 * queued (apply them via `getFixedAbilityBonuses`); anything with alternatives or picks is.
 */
export function getAbilityChoices ({ability, sourceName}) {
	const packages = getAbilityPackages(ability);
	if (!packages.length) return [];
	const isChoice = packages.length > 1 || packages.some(pkg => pkg.choose || pkg.weighted);
	if (!isChoice) return [];

	return [{
		id: _nextId(),
		type: CHOICE_TYPE_ABILITY,
		sourceName,
		label: packages.length > 1
			? `Ability scores: choose ${packages.map(pkg => getAbilityPackageDisplay(pkg)).join(" — or — ")}`
			: `Ability scores: ${getAbilityPackageDisplay(packages[0])}`,
		packages,
	}];
}

export const CHOICE_TYPE_RESIST = "resist";

/**
 * Damage-resistance choices from a `resist`-style group array — a Dragonborn's draconic ancestry
 * ("choose acid, cold, fire, lightning or poison") and the handful of species built the same way.
 * Fixed resistances are applied directly elsewhere; only the picks are queued.
 */
export function getResistChoices ({groups, sourceName}) {
	const out = [];
	(groups || []).forEach(grp => {
		if (typeof grp !== "object" || !grp.choose?.from) return;
		const count = grp.choose.count || 1;
		out.push({
			id: _nextId(),
			type: CHOICE_TYPE_RESIST,
			sourceName,
			count,
			from: grp.choose.from.map(it => _titleCase(String(it))),
			label: `Choose ${count} damage resistance${count > 1 ? "s" : ""}`,
		});
	});
	return out;
}

/** Granted-feat entries (`feats` on 2024-style backgrounds/races) are `{"name|source": true}` maps. */
/**
 * Whether a background's feature offers a *choice* of feats rather than granting them all.
 *
 * "You gain the Lucky, Magic Initiate, or Skilled feat (your choice)" is written as three entries
 * in `feats`, which read naively grants all three — the Rewarded and Ruined backgrounds handed over
 * three feats each where the book gives one.
 *
 * What separates them from a background that genuinely grants two things is `fromFeature`: it marks
 * a grant as coming from the background's *feature*, and a feature naming more than one feat is
 * offering a menu. Haunted One grants Survivor **and** a Dark Gift, has no `fromFeature`, and is
 * correctly left alone.
 */
function _isFeatChoice (feats, fromFeature) {
	if (!fromFeature?.feats) return false;
	return _getNamedFeats(feats).length > 1;
}

/** The named feats in a `feats` array, before deciding whether they are grants or a menu. */
function _getNamedFeats (feats) {
	const out = [];
	(feats || []).forEach(grp => {
		Object.entries(grp).forEach(([uid, v]) => {
			if (v !== true) return;
			const [uidName, source] = uid.split("|");
			if (!uidName) return;
			// A uid may narrow the feat as well as name it — `"magic initiate; cleric|xphb"` is the
			// Magic Initiate feat, taken with the Cleric list. Only the part before the semicolon is
			// the feat's real name, and that is what a taken feat is stored under; keeping the whole
			// string here is what left an Acolyte's granted feat looking untaken forever.
			const [name, ...subs] = uidName.split(";").map(pt => pt.trim()).filter(Boolean);
			if (!name) return;
			out.push({
				name,
				source: source || "PHB",
				subChoice: subs.join(", ") || null,
				displayName: [name, ...subs].map(pt => _titleCase(pt)).join(" — "),
			});
		});
	});
	return out;
}

/**
 * The feats an entity grants outright.
 *
 * @param [opts.fromFeature] the entity's `fromFeature`; without it a feature's *menu* of feats reads
 *   as three separate grants.
 */
export function getGrantedFeats (feats, {fromFeature = null} = {}) {
	if (_isFeatChoice(feats, fromFeature)) return [];
	return _getNamedFeats(feats);
}

/**
 * The one feat an entity's feature lets the player pick from a named few, or null.
 * @return {?{count: number, from: Array<{name, source, subChoice, displayName}>}}
 */
export function getGrantedFeatChoice (feats, {fromFeature = null} = {}) {
	if (!_isFeatChoice(feats, fromFeature)) return null;
	return {count: 1, from: _getNamedFeats(feats)};
}

/** A grant of "any feat", in {@link getGrantedFeatCategories}' `category`. */
export const FEAT_CATEGORY_ANY = "*";

/** Feats only a class hands out, at its own levels: a Fighting Style, an Epic Boon. */
const _CLASS_ONLY_FEAT_CATEGORIES = new Set(["FS", "EB"]);

/**
 * Whether a feat may answer a category grant. "Any feat" means any a character could simply take —
 * not a Fighting Style or an Epic Boon, which a class gives at its own levels.
 */
export function isFeatInGrantCategory (feat, category) {
	const own = String(feat?.category || "").toUpperCase().split(":")[0];
	if (category === FEAT_CATEGORY_ANY) return !_CLASS_ONLY_FEAT_CATEGORIES.has(own);
	return own === category;
}

/**
 * Feats an entity grants as a *category* rather than by name — "you gain an Origin feat of your
 * choice", which is how the 2024 Human's Versatile is written and how several backgrounds work.
 *
 * Separate from `getGrantedFeats` because the two need different treatment: one is a feat to take,
 * the other is a choice to make. Missing this shape entirely is why a Human's Versatile granted
 * nothing at all.
 *
 * @return {Array<{category: string, count: number}>}
 */
export function getGrantedFeatCategories (feats) {
	const out = [];
	(feats || []).forEach(grp => {
		// `{any: 1}`: one feat of any kind — the Variant Human's and the Custom Lineage's, which read
		// as nothing at all while only `anyFromCategory` was understood
		if (Number(grp?.any) > 0) return out.push({category: FEAT_CATEGORY_ANY, count: Number(grp.any)});
		const any = grp?.anyFromCategory;
		if (!any) return;
		const categories = [any.category].flat().filter(Boolean);
		categories.forEach(category => out.push({category: String(category).toUpperCase(), count: any.count || 1}));
	});
	return out;
}

/**
 * Every character's languages, which no entity grants.
 *
 * The 2024 rules put them in character creation rather than on a species or a background: you know
 * Common and two more of your choice. Nothing in the data carries that, so nothing asked — a
 * Human Sailor was offered no language at all, because neither the species nor the background has a
 * `languageProficiencies` field to read. Curated, and the only rule here that is.
 *
 * The 2014 rules do put them on the species, where `getPendingChoices` already finds them.
 *
 * @return {?object} the choice, or `null` under the 2014 rules where the species answers it.
 */
export function getRulesLanguageChoice ({isClassic = false, count = 2} = {}) {
	if (isClassic) return null;
	return {
		id: _nextId(),
		type: CHOICE_TYPE_LANGUAGE,
		sourceName: "Languages",
		count,
		from: Parser.LANGUAGES_STANDARD.filter(it => it !== "Common").map(_titleCase),
		label: `Choose ${count} language${count > 1 ? "s" : ""} besides Common`,
	};
}

/**
 * Languages a class *feature* grants, which only its prose says: a Rogue knows Thieves' Cant (and, in
 * 2024, one more language), a Druid knows Druidic, a 2024 Ranger learns two at 2nd level. Curated, by
 * feature name and source, because the books print the same feature name with different grants.
 */
const _CLASS_FEATURE_LANGUAGES = {
	"thieves' cant|phb": {fixed: ["Thieves' Cant"], count: 0},
	"thieves' cant|xphb": {fixed: ["Thieves' Cant"], count: 1},
	"druidic|phb": {fixed: ["Druidic"], count: 0},
	"druidic|xphb": {fixed: ["Druidic"], count: 0},
	"deft explorer|xphb": {fixed: [], count: 2},
};

/**
 * The language choices a class's features make, up to its level.
 *
 * @param features the class's features, by level (`classFeatures` as the loader gives them) or flat.
 * @return {Array} choices of `CHOICE_TYPE_LANGUAGE`, each with the `fixed` languages it simply grants.
 */
export function getClassFeatureLanguageChoices ({features = [], level = 20} = {}) {
	const flat = (features || []).slice(0, level).flat().filter(Boolean);
	const out = [];
	const seen = new Set();
	flat.forEach(f => {
		const key = `${String(f.name || "").toLowerCase()}|${String(f.source || "").toLowerCase()}`;
		const grant = _CLASS_FEATURE_LANGUAGES[key];
		if (!grant || seen.has(key)) return;
		seen.add(key);
		out.push({
			id: _nextId(),
			type: CHOICE_TYPE_LANGUAGE,
			sourceName: f.name,
			count: grant.count,
			fixed: grant.fixed,
			from: [...Parser.LANGUAGES_STANDARD, ...Parser.LANGUAGES_EXOTIC].filter(it => it !== "Common").map(_titleCase),
			label: grant.count
				? `${f.name}: ${[...grant.fixed, `${grant.count} language${grant.count > 1 ? "s" : ""} of your choice`].join(", and ")}`
				: `${f.name}: ${grant.fixed.join(", ")}`,
		});
	});
	return out;
}

/**
 * All pending choices for a set of picked entities, in creation-flow order.
 *
 * A class's are its starting proficiencies: the skills it offers, and the tools and languages it
 * offers *structurally* — `toolProficiencies` beside the prose `tools`, which is the pair the data
 * keeps. Reading only the prose is why a Rogue was never asked for its four skills and a Bard was
 * never asked which three instruments.
 */
export function getPendingChoices ({race = null, background = null, cls = null, toolNames = ALL_TOOL_NAMES} = {}) {
	const out = [];

	if (race) {
		const sourceName = `Species: ${race.name}`;
		out.push(...getAbilityChoices({ability: race.ability, sourceName}));
		out.push(...getSkillChoices({groups: race.skillProficiencies, sourceName}));
		out.push(...getLanguageChoices({groups: race.languageProficiencies, sourceName}));
		out.push(...getToolChoices({groups: race.toolProficiencies, sourceName}));
		out.push(...getSkillToolLanguageChoices({groups: race.skillToolLanguageProficiencies, sourceName, toolNames}));
	}

	if (cls) {
		const sourceName = `Class: ${cls.name}`;
		const sp = cls.startingProficiencies || {};
		out.push(...getSkillChoices({groups: sp.skills, sourceName}));
		out.push(...getToolChoices({groups: sp.toolProficiencies, sourceName}));
		out.push(...getLanguageChoices({groups: sp.languageProficiencies, sourceName}));
		out.push(...getSkillToolLanguageChoices({groups: sp.skillToolLanguageProficiencies, sourceName, toolNames}));
	}

	if (background) {
		const sourceName = `Background: ${background.name}`;
		out.push(...getAbilityChoices({ability: background.ability, sourceName}));
		out.push(...getSkillChoices({groups: background.skillProficiencies, sourceName}));
		out.push(...getLanguageChoices({groups: background.languageProficiencies, sourceName}));
		out.push(...getToolChoices({groups: background.toolProficiencies, sourceName}));
		out.push(...getSkillToolLanguageChoices({groups: background.skillToolLanguageProficiencies, sourceName, toolNames}));
	}

	return out;
}

/* -------------------------------------------- weapon proficiency choices -------------------------------------------- */

/**
 * Weapon proficiencies a feat asks the player to pick.
 *
 * One feat writes its choice this way — Weapon Master's "choose four martial or mundane weapons",
 * as `{choose: {fromFilter: "type=martial weapon;mundane weapon|miscellaneous=mundane", count: 4}}`.
 * Nothing read `fromFilter`, so the four picks were silently dropped.
 *
 * The filter is not evaluated as a filter: it names weapon *categories*, and every base weapon
 * carries its own `weaponCategory`, so what comes back is the categories to offer. "Mundane" is not
 * a category but the exclusion of magic items, which asking for base weapons already achieves.
 *
 * @return {Array<{count: number, categories: ?Array<string>, label: string}>}
 */
export function getWeaponChoices ({groups, sourceName}) {
	const out = [];

	(groups || []).forEach(grp => {
		const choose = grp?.choose;
		if (!choose) return;

		const count = Number(choose.count) || 1;
		const types = String(choose.fromFilter || "")
			.split("|")
			.map(part => part.split("="))
			.filter(([k]) => k?.trim().toLowerCase() === "type")
			.flatMap(([, v]) => String(v).split(";"))
			.map(it => it.trim().toLowerCase().replace(/ weapons?$/, ""));

		const categories = types.filter(it => it === "martial" || it === "simple");

		out.push({
			id: _nextId(),
			type: CHOICE_TYPE_WEAPON,
			sourceName,
			count,
			categories: categories.length ? categories : null,
			label: `Choose ${count} weapon${count > 1 ? "s" : ""}`,
		});
	});

	return out;
}

/* -------------------------------------------- taking an answer back -------------------------------------------- */

const _SOURCE_PREFIX = /^(Species|Background|Class): /;

/**
 * The entity a choice record's `sourceName` names: "Class: Ranger" is the Ranger. A proficiency a pick
 * added carries the entity's own name as its source, not the record's, so undoing one needs this.
 */
export function getSourceEntityName (sourceName) {
	return String(sourceName || "").replace(_SOURCE_PREFIX, "");
}

const _ABILITY_BY_NAME = () => Object.fromEntries(CHAR_SHEET_ABILITIES.map(([abv, name]) => [name.toLowerCase(), abv]));

/**
 * The increases an ability choice was answered with, as `{abv: n}`.
 *
 * A record written since this existed carries them (`bonuses`); an older one only has its picks as
 * they were shown — "+2 Strength", "+1 Dexterity" — which say the same thing.
 */
export function getRecordBonuses (record) {
	if (record?.bonuses && typeof record.bonuses === "object") return {...record.bonuses};
	const byName = _ABILITY_BY_NAME();
	const out = {};
	(record?.picks || []).forEach(pick => {
		const m = /^([+-]?\d+)\s+(.+)$/.exec(String(pick).trim());
		const abv = m && (byName[m[2].toLowerCase()] || (CHAR_SHEET_ABILITIES.some(([it]) => it === m[2].toLowerCase()) ? m[2].toLowerCase() : null));
		if (abv) out[abv] = (out[abv] || 0) + Number(m[1]);
	});
	return out;
}

/**
 * What a recorded choice put on the character, pick by pick: `[{type, name, source}]`, `type` being
 * a skill, expertise, a tool or a language. An ability choice applies none of these (see
 * `getRecordBonuses`).
 *
 * A record written since this existed says so itself (`applied`). An older one only lists its picks,
 * so they are classified the way they were applied: a mixed pool's pick is a skill if a skill has that
 * name, a language if the character holds it as one, and a tool otherwise.
 */
export function getRecordApplied (record, state = null) {
	if (Array.isArray(record?.applied)) return record.applied;
	if (!record || record.type === CHOICE_TYPE_ABILITY) return [];

	const source = getSourceEntityName(record.sourceName);
	const skillNames = new Set(CHAR_SHEET_SKILLS.map(({name}) => name.toLowerCase()));
	const isHeldLanguage = name => (state?.proficiencies || [])
		.some(it => it.kind === PROF_KIND_LANGUAGE && String(it.name).toLowerCase() === String(name).toLowerCase());

	return (record.picks || []).map(name => {
		const lower = String(name).toLowerCase();
		switch (record.type) {
			case CHOICE_TYPE_SKILL: return {type: CHOICE_TYPE_SKILL, name, source};
			case CHOICE_TYPE_EXPERTISE: return {type: CHOICE_TYPE_EXPERTISE, name, source};
			case CHOICE_TYPE_LANGUAGE: return {type: CHOICE_TYPE_LANGUAGE, name, source};
			case CHOICE_TYPE_TOOL: return {type: CHOICE_TYPE_TOOL, name, source};
			case CHOICE_TYPE_SKILL_TOOL_LANGUAGE:
				if (skillNames.has(lower)) return {type: CHOICE_TYPE_SKILL, name, source};
				return {type: isHeldLanguage(name) ? CHOICE_TYPE_LANGUAGE : CHOICE_TYPE_TOOL, name, source};
			default: return null;
		}
	}).filter(Boolean);
}

/** The skills a set of records made the character proficient (or expert) in, by display name, lower case. */
export function getSkillNamesFromRecords (records, state = null) {
	const out = new Set();
	(records || []).forEach(rec => getRecordApplied(rec, state).forEach(it => {
		if (it.type === CHOICE_TYPE_SKILL || it.type === CHOICE_TYPE_EXPERTISE) out.add(String(it.name).toLowerCase());
	}));
	return out;
}

/** The skills an entity grants outright, by display name, lower case. */
export function getEntitySkillNames (ent) {
	return new Set([...getFixedProficiencyNames({race: ent})[CHOICE_TYPE_SKILL]].map(it => it.toLowerCase()));
}

/**
 * Everything it takes to undo one answered choice, without touching the character.
 *
 * A skill comes off unless something else still grants it (`keepSkillNames` — another source's
 * fixed grant, another choice's pick): a skill records a state and not a count, so taking off one of
 * two grants must leave it ticked. An Expertise pick drops back to proficient. A tool or language
 * comes off where the pick put it, and only there. An ability choice gives back exactly the increase
 * it was logged as.
 *
 * Without this, nothing could be answered twice. Removing a Ranger kept the Nature and Survival it
 * had picked; adding it back offered the rest of its list, and the character ended up with five.
 *
 * @param opts.keepSkillNames lower-case skill names still granted by something else.
 * @return `{skills: {key: level}, proficiencyIds: [], abilityLog: [{id, bonuses}]}`
 */
export function getChoiceReversal ({state, record, keepSkillNames = new Set()}) {
	const out = {skills: {}, proficiencyIds: [], abilityLog: []};
	if (!record) return out;
	const st = state || {};
	const keep = new Set([...keepSkillNames].map(it => String(it).toLowerCase()));
	const source = getSourceEntityName(record.sourceName);

	getRecordApplied(record, st).forEach(it => {
		const name = String(it.name);
		if (it.type === CHOICE_TYPE_SKILL || it.type === CHOICE_TYPE_EXPERTISE) {
			const key = getSkillKeyByName(name);
			if (!key) return;
			const cur = Number(st[`skill_${key}`]) || 0;
			if (it.type === CHOICE_TYPE_EXPERTISE) {
				if (cur >= PROF_STATE_EXPERTISE) out.skills[key] = PROF_STATE_PROFICIENT;
				return;
			}
			if (cur > 0 && !keep.has(name.toLowerCase())) out.skills[key] = PROF_STATE_NONE;
			return;
		}

		const kind = it.type === CHOICE_TYPE_LANGUAGE ? PROF_KIND_LANGUAGE : PROF_KIND_TOOL;
		// Where the pick put it: its own source, or — the rules' languages, and a feature's — "Languages"
		const sources = new Set([it.source, source, record.sourceName, "Languages"].filter(Boolean));
		const row = (st.proficiencies || []).find(p => p.kind === kind && String(p.name).toLowerCase() === name.toLowerCase() && sources.has(p.source));
		if (row && !out.proficiencyIds.includes(row.id)) out.proficiencyIds.push(row.id);
	});

	if (record.type === CHOICE_TYPE_ABILITY) {
		const log = st.abilityBonusLog || [];
		const byId = record.logId ? log.find(it => it.id === record.logId) : null;
		if (byId) out.abilityLog.push({id: byId.id, bonuses: {...byId.bonuses}});
		else {
			// An older record: the entry logged under the entity's name with these very increases
			const want = getRecordBonuses(record);
			const isSame = bonuses => Object.keys(want).length
				&& Object.keys(want).length === Object.keys(bonuses || {}).length
				&& Object.entries(want).every(([abv, n]) => Number(bonuses?.[abv]) === n);
			const hit = log.find(it => it.source === source && isSame(it.bonuses));
			if (hit) out.abilityLog.push({id: hit.id, bonuses: {...hit.bonuses}});
		}
	}

	return out;
}

/**
 * Skills the character is proficient in that nothing on record explains — no species, background,
 * feat or class grants them, and no answered choice picked them.
 *
 * That is how a choice answered twice shows up: the first answer's skills stayed when the second was
 * made. It is also a skill ticked by hand, which is allowed and is still worth saying — the Build
 * Check reports these as unclaimed, not as broken.
 *
 * @param opts.explained lower-case names of every skill something grants.
 * @return `[{key, name, level}]`
 */
export function getUnexplainedSkills ({state, explained = new Set()}) {
	const known = new Set([...explained].map(it => String(it).toLowerCase()));
	return CHAR_SHEET_SKILLS
		.map(({key, name}) => ({key, name, level: Number(state?.[`skill_${key}`]) || 0}))
		.filter(it => it.level > 0 && !known.has(it.name.toLowerCase()));
}

/**
 * Choice records nothing on the character asks any more — answers for a class that was removed, a
 * species that was replaced. Their picks are still applied, which is how a character ends up with
 * more than it was ever offered.
 *
 * @param opts.knownSigs the signatures of every choice the character's entities still ask.
 */
export function getOrphanChoiceRecords ({state, knownSigs = new Set()}) {
	return (state?.choiceLog || []).filter(rec => rec?.sig && !knownSigs.has(rec.sig));
}
