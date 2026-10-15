import {
	getAsiCount,
	getCantripsKnown,
	getExpertiseSkillCount,
	getFeatProgressionCounts,
	getFixedSpellsKnownGrants,
	getOptionalFeatureCounts,
	getPreparedSpellCount,
	getSpellGrantGroups,
	getSpellGroupIndex,
	getSpellsKnown,
	getWeaponMasteryCount,
} from "./charactersheet-levelengine.js";
import {CHAR_SHEET_SKILLS, PROF_STATE_EXPERTISE} from "./charactersheet-consts.js";
import {CHOICE_TYPE_ABILITY, CHOICE_TYPE_LANGUAGE, FEAT_CATEGORY_ANY, getChoiceSignature, getChoiceWithoutHeld, getClassFeatureLanguageChoices, getGrantedFeatCategories, getGrantedFeatChoice, getGrantedFeats, getHeldProficiencyNames, getPendingChoices, getRulesLanguageChoice} from "./charactersheet-choices.js";
import {getTraitChoices} from "./charactersheet-traitchoices.js";
import {getFeatureOptionCantripBonus, getFeatureOptionGroups} from "./charactersheet-features.js";

/**
 * Everything still to decide before a character can be played, as one list.
 *
 * The guided setup used to stop after species, class, background, abilities, the origin choices and
 * equipment — which leaves a level-3 Rogue with no subclass, no Expertise, no weapon masteries and,
 * if it casts, no spells. Those decisions were all *available*, spread across the class panel, and a
 * new player had no way to know which of them were owed.
 *
 * So they are enumerated here instead, from the same data the panels read, and the guide walks
 * them. Pure: this says what is outstanding and how much of it, never how to ask. The asking lives
 * in `charactersheet-buildwalk.js`, which has the pickers.
 *
 * Each decision is `{key, label, detail, count, kind, ctx}` — `kind` names the flow that resolves
 * it, and `ctx` carries whatever that flow needs (which class entry, which progression).
 */

export const STEP_SUBCLASS = "subclass";
export const STEP_ASI = "asi";
export const STEP_EXPERTISE = "expertise";
export const STEP_MASTERY = "mastery";
export const STEP_OPTIONAL_FEATURE = "optionalFeature";
export const STEP_CLASS_FEAT = "classFeat";
export const STEP_ORIGIN_CHOICE = "originChoice";
export const STEP_ORIGIN_FEAT = "originFeat";
export const STEP_TRAIT_CHOICE = "traitChoice";
export const STEP_SIZE = "size";
export const STEP_SPELLS = "spells";
/** A spell known at a fixed spell level rather than out of the progression — the Warlock's Mystic Arcanum. */
export const STEP_FIXED_SPELL = "fixedSpell";
export const STEP_HP = "hp";
/** A class's starting proficiencies — the four skills a Rogue picks, the three instruments a Bard does. */
export const STEP_CLASS_PROFICIENCY = "classProficiency";
/** The languages the 2024 rules give every character, which no species or background carries. */
export const STEP_LANGUAGE = "language";
/** A feature that offers a choice of features: Divine Order, Primal Order. */
export const STEP_FEATURE_OPTION = "featureOption";
/** Which of an entity's alternative spell lists it was taken with: a Circle of the Land's terrain, a Genie's kind. */
export const STEP_SPELL_GROUP = "spellGroup";

/** The decision a species or subclass with alternative spell groups owes until one is picked. */
function _getSpellGroupDecision (st, kind, ent, ctx = {}) {
	const groups = getSpellGrantGroups(ent);
	if (!groups.length || getSpellGroupIndex(st, kind, ent) != null) return null;
	return {
		key: `${STEP_SPELL_GROUP}:${kind}:${ent.name}|${ent.source}`,
		kind: STEP_SPELL_GROUP,
		label: `${ent.name}: spell list`,
		detail: groups.map(g => g.name).join(" or "),
		count: 1,
		ctx: {...ctx, kind, ent, groups},
	};
}

/**
 * @param state the character state.
 * @param loaded `[{entry, cls, sc}]` — the character's classes with their data, as the panels load them.
 * @param speciesEnt/backgroundEnt the picked entities, or null.
 * @param [opts.isClassic] the character plays by the 2014 rules, where languages come from the species.
 * @return {Array<{key, kind, label, detail, count, ctx}>} in the order somebody should answer them.
 */
export function getOutstandingDecisions ({state, loaded = [], speciesEnt = null, backgroundEnt = null, isClassic = false} = {}) {
	const out = [];
	const st = state || {};

	/* ---------- what a species and a background still ask ---------- */

	[[speciesEnt, "species"], [backgroundEnt, "background"]].forEach(([ent, kind]) => {
		if (!ent) return;

		const held = getHeldProficiencyNames(st);

		getPendingChoices(kind === "species" ? {race: ent} : {background: ent})
			.filter(choice => !(st.choiceLog || []).some(it => it.sig === getChoiceSignature(choice) && it.picks.length))
			// A choice whose every option the character already has is spent, not owed — asking again
			// would only offer an empty list
			.filter(choice => !!getChoiceWithoutHeld(choice, held))
			.forEach(choice => out.push({
				key: `${STEP_ORIGIN_CHOICE}:${getChoiceSignature(choice)}`,
				kind: STEP_ORIGIN_CHOICE,
				label: choice.label,
				detail: ent.name,
				count: choice.count || 1,
				ctx: {ent, kind, choice},
			}));

		// Origin feats, named and "one of your choice" alike
		const taken = (st.originFeats || []);
		const takenKeys = new Set(taken.map(it => `${it.name}|${it.source}`.toLowerCase()));
		const named = getGrantedFeats(ent.feats, {fromFeature: ent.fromFeature});

		named
			.filter(it => !takenKeys.has(`${it.name}|${it.source}`.toLowerCase()))
			.forEach(feat => out.push({
				key: `${STEP_ORIGIN_FEAT}:${ent.name}:${feat.name}`,
				kind: STEP_ORIGIN_FEAT,
				label: `Origin feat: ${feat.displayName || feat.name}`,
				detail: ent.name,
				count: 1,
				ctx: {ent},
			}));

		// A feature that names several feats is offering one of them — "Lucky, Magic Initiate, or
		// Skilled (your choice)" — which is a decision, not three grants
		const featChoice = getGrantedFeatChoice(ent.feats, {fromFeature: ent.fromFeature});
		if (featChoice && !taken.some(it => featChoice.from.some(f => f.name.toLowerCase() === String(it.name).toLowerCase()))) {
			out.push({
				key: `${STEP_ORIGIN_FEAT}:${ent.name}:pick`,
				kind: STEP_ORIGIN_FEAT,
				label: `Origin feat: ${featChoice.from.map(it => it.displayName || it.name).join(", or ")}`,
				detail: ent.name,
				count: 1,
				ctx: {ent},
			});
		}

		const grants = getGrantedFeatCategories(ent.feats);
		const nChoice = grants.reduce((acc, it) => acc + it.count, 0);
		const nFromHere = taken.filter(it => it.from === ent.name).length;
		const owed = nChoice - Math.max(0, nFromHere - named.length);
		if (owed > 0) {
			out.push({
				key: `${STEP_ORIGIN_FEAT}:${ent.name}:choice`,
				kind: STEP_ORIGIN_FEAT,
				label: grants.every(it => it.category === FEAT_CATEGORY_ANY) ? "Feat of your choice" : "Origin feat of your choice",
				detail: ent.name,
				count: owed,
				ctx: {ent},
			});
		}

		// Thirty species offer a size ("Small or Medium"), and it decides carrying capacity, grappling
		// and squeezing — but the panel only ever printed it as decoration, so nobody chose
		if (kind === "species" && [ent.size].flat().filter(Boolean).length > 1 && !st.size) {
			out.push({
				key: `${STEP_SIZE}:${ent.name}`,
				kind: STEP_SIZE,
				label: "Size",
				detail: ent.name,
				count: 1,
				ctx: {ent},
			});
		}

		// "Choose one of the following" traits — an Elf's Lineage, a Dragonborn's Ancestry, a Goliath's
		// Giant Ancestry. These decide a cantrip, a damage type, a breath weapon; a character without
		// one is not playable, and nothing was listing them
		const level = (st.classes || []).reduce((acc, it) => acc + (Number(it.level) || 0), 0) || 1;
		getTraitChoices(ent)
			.filter(choice => (choice.level || 1) <= level)
			.filter(choice => !(st.traitChoices || []).some(it => it.source === ent.name && it.trait === choice.trait))
			.forEach(choice => out.push({
				key: `${STEP_TRAIT_CHOICE}:${ent.name}:${choice.trait}`,
				kind: STEP_TRAIT_CHOICE,
				label: choice.trait,
				detail: ent.name,
				count: 1,
				ctx: {ent, choice},
			}));

		// An Astral Elf's cantrip is a spell-list choice with no trait to ask it; an Elf's lineage is
		// both, and answering the trait answers the list, so it is not asked twice
		if (kind === "species") {
			const groupNames = getSpellGrantGroups(ent).map(g => g.name.toLowerCase());
			const isAskedByTrait = out.some(it => it.kind === STEP_TRAIT_CHOICE && it.ctx.ent === ent
				&& (it.ctx.choice.options || []).some(opt => groupNames.includes(String(opt?.name ?? opt).toLowerCase())));
			const decision = isAskedByTrait ? null : _getSpellGroupDecision(st, "race", ent);
			if (decision) out.push(decision);
		}
	});

	/* ---------- what each class still asks ---------- */

	loaded.forEach(({entry, cls, sc}) => {
		if (!cls) return;

		/*
		 * The proficiencies the class itself hands out.
		 *
		 * These were missing entirely, which is why a Rogue could be built without ever being asked
		 * for its four skills or its thieves' tools: the panels apply what a class *fixes* and
		 * nothing enumerated what it *offers*.
		 */
		const heldForClass = getHeldProficiencyNames(st);
		getPendingChoices({cls})
			.filter(choice => !(st.choiceLog || []).some(it => it.sig === getChoiceSignature(choice) && it.picks.length))
			.filter(choice => !!getChoiceWithoutHeld(choice, heldForClass))
			.forEach(choice => out.push({
				key: `${STEP_CLASS_PROFICIENCY}:${entry.id}:${getChoiceSignature(choice)}`,
				kind: STEP_CLASS_PROFICIENCY,
				label: choice.label,
				detail: cls.name,
				count: choice.count || 1,
				ctx: {ent: cls, choice},
			}));

		// The subclass, once its level has arrived — a Rogue 3 with no subclass is not playable
		const gainLevel = _getSubclassGainLevel(cls);
		if (gainLevel != null && entry.level >= gainLevel && !entry.subclass) {
			out.push({
				key: `${STEP_SUBCLASS}:${entry.id}`,
				kind: STEP_SUBCLASS,
				label: cls.subclassTitle ? `${cls.subclassTitle}` : "Subclass",
				detail: entry.name,
				count: 1,
				ctx: {entry, cls},
			});
		}

		const asiTotal = getAsiCount(cls, entry.level);
		const asiTaken = (entry.asiFeatChoices || []).filter(Boolean).length;
		if (asiTotal > asiTaken) {
			out.push({
				key: `${STEP_ASI}:${entry.id}`,
				kind: STEP_ASI,
				label: "Ability Score Improvement or feat",
				detail: entry.name,
				count: asiTotal - asiTaken,
				ctx: {entry, cls},
			});
		}

		// A feat the class table grants by category — the 2024 Fighting Style (Fighter 1, Paladin and
		// Ranger 2) and the Epic Boon at 19. These live in `featProgression`, not
		// `optionalfeatureProgression`, which is why a 2024 Fighter was never asked for its style
		[...getFeatProgressionCounts(cls, entry.level), ...(sc ? getFeatProgressionCounts(sc, entry.level) : [])]
			.forEach(prog => {
				// Counted by *category*, not by a key: the class panel already offers these from the
				// feature card that mentions them, under a key of its own. What matters is that a
				// Fighting Style was taken for this class, not which chooser recorded it
				const taken = (st.featureFeats || [])
					.filter(it => it.entryId === entry.id && prog.categories.includes(String(it.category || "").toUpperCase())).length;
				if (taken >= prog.count) return;
				out.push({
					key: `${STEP_CLASS_FEAT}:${entry.id}:${prog.name}`,
					kind: STEP_CLASS_FEAT,
					label: prog.name,
					detail: entry.name,
					count: prog.count - taken,
					ctx: {entry, prog},
				});
			});

		getOptionalFeatureCounts(cls, entry.level).forEach(prog => {
			const chosen = (entry.optionalFeatures || []).filter(it => it.progressionName === prog.name).length;
			if (chosen >= prog.count) return;
			out.push({
				key: `${STEP_OPTIONAL_FEATURE}:${entry.id}:${prog.name}`,
				kind: STEP_OPTIONAL_FEATURE,
				label: prog.name,
				detail: entry.name,
				count: prog.count - chosen,
				ctx: {entry, prog},
			});
		});

		// "One of the following, of your choice" — Protector or Thaumaturge — in the class's features and
		// its subclass's, up to its level
		const reached = [
			...(cls.classFeatures || []).slice(0, entry.level).flat(),
			...(sc?.subclassFeatures || []).flat().filter(f => (f?.level ?? 0) <= entry.level),
		];
		getFeatureOptionGroups(reached).forEach(group => {
			if ((entry.featureOptions || []).some(it => it.feature === group.feature)) return;
			out.push({
				key: `${STEP_FEATURE_OPTION}:${entry.id}:${group.feature}`,
				kind: STEP_FEATURE_OPTION,
				label: group.feature,
				detail: `${entry.name} — ${group.options.map(it => it.name).join(" or ")}`,
				count: 1,
				ctx: {entry, group},
			});
		});

		const groupDecision = sc && _getSpellGroupDecision(st, "subclass", sc, {entry});
		if (groupDecision) out.push(groupDecision);

		const cantripsBase = getCantripsKnown(sc, entry.level) ?? getCantripsKnown(cls, entry.level);
		// Thaumaturge and Magician each know one more
		const cantrips = cantripsBase == null ? null : cantripsBase + getFeatureOptionCantripBonus(entry);
		const known = getSpellsKnown(sc, entry.level) ?? getSpellsKnown(cls, entry.level);
		const isCaster = !!(cls.casterProgression || sc?.casterProgression || cls.spellcastingAbility || cantrips || known);
		if (isCaster) {
			const have = (st.spellsKnown || []).filter(it => !it.className || it.className === entry.name);
			const nCantrips = have.filter(it => !it.level).length;
			const nLeveled = have.filter(it => it.level).length;
			const owedCantrips = Math.max(0, (cantrips || 0) - nCantrips);
			// A prepared caster has a number too — a 2024 Cleric prepares four at 1st level — and a new
			// player is not going to find the panel that says so on their own
			const abv = cls.spellcastingAbility || sc?.spellcastingAbility;
			const abilityMod = abv ? Math.floor(((Number(st[`abil_${abv}`]) || 10) - 10) / 2) : 0;
			const prepared = known == null ? getPreparedSpellCount(cls, entry.level, abilityMod) : null;
			const owedKnown = Math.max(0, (known ?? prepared ?? 0) - nLeveled);

			// A prepared caster has no fixed "known" count, so having nothing at all is the signal
			const isNothingAtAll = !have.length;
			if (owedCantrips || owedKnown || isNothingAtAll) {
				out.push({
					key: `${STEP_SPELLS}:${entry.id}`,
					kind: STEP_SPELLS,
					label: _getSpellLabel({owedCantrips, owedKnown, isNothingAtAll}),
					detail: entry.name,
					count: owedCantrips + owedKnown,
					ctx: {entry, cls},
				});
			}
		}

		// A language a feature grants — Thieves' Cant, Druidic — and any it lets the character choose
		const heldNames = getHeldProficiencyNames(st);
		getClassFeatureLanguageChoices({features: cls.classFeatures, level: entry.level}).forEach(choice => {
			const missing = choice.fixed.filter(name => !heldNames[CHOICE_TYPE_LANGUAGE]?.has(name));
			const picked = (st.choiceLog || []).find(it => it.sig === getChoiceSignature(choice))?.picks.length || 0;
			const owed = Math.max(0, choice.count - picked);
			if (!missing.length && !owed) return;
			out.push({
				key: `${STEP_LANGUAGE}:${entry.id}:${choice.sourceName}`,
				kind: STEP_LANGUAGE,
				label: choice.label,
				detail: entry.name,
				count: missing.length + owed,
				ctx: {choice},
			});
		});

		// Mystic Arcanum: a pick at a fixed spell level, outside the known-spell count entirely, so
		// an unanswered one is invisible to the check above
		getFixedSpellsKnownGrants(cls, entry.level).forEach(grant => {
			const grantKey = `${entry.id}:${cls.name}:${grant.id}`;
			if ((st.grantedSpellChoices || []).some(it => it.grantKey === grantKey)) return;
			out.push({
				key: `${STEP_FIXED_SPELL}:${grantKey}`,
				kind: STEP_FIXED_SPELL,
				label: grant.groupName || "Fixed-level spell",
				detail: `${entry.name} — one spell of level ${grant.spellLevel}`,
				count: 1,
				ctx: {entry, cls, grant, grantKey},
			});
		});
	});

	/* ---------- pools that span the classes ---------- */

	const expertiseTotal = loaded.reduce((acc, {entry, cls}) => acc + (cls ? getExpertiseSkillCount(cls, entry.level) : 0), 0);
	const expertiseTaken = CHAR_SHEET_SKILLS.filter(({key}) => Number(st[`skill_${key}`]) === PROF_STATE_EXPERTISE).length;
	if (expertiseTotal > expertiseTaken) {
		out.push({
			key: STEP_EXPERTISE,
			kind: STEP_EXPERTISE,
			label: "Expertise",
			detail: "double your proficiency in a skill",
			count: expertiseTotal - expertiseTaken,
			ctx: {},
		});
	}

	const masteryTotal = loaded.reduce((acc, {entry, cls}) => acc + (cls ? getWeaponMasteryCount(cls, entry.level) : 0), 0);
	const masteryTaken = (st.weaponMasteries || []).length;
	if (masteryTotal > masteryTaken) {
		out.push({
			key: STEP_MASTERY,
			kind: STEP_MASTERY,
			label: "Weapon mastery",
			detail: "which weapons' mastery properties you can use",
			count: masteryTotal - masteryTaken,
			ctx: {},
		});
	}

	/*
	 * Languages, which in the 2024 rules no entity grants.
	 *
	 * They moved into character creation — Common and two more of your choice — so there is no field
	 * on a species or a background to read, and nothing asked. The 2014 rules keep them on the
	 * species, where the origin choices above already find them.
	 */
	const languageChoice = getRulesLanguageChoice({isClassic});
	if (languageChoice) {
		const held = getHeldProficiencyNames(st);
		const owed = (languageChoice.count || 0) - ((st.choiceLog || []).find(it => it.sig === getChoiceSignature(languageChoice))?.picks.length || 0);
		if (owed > 0 && getChoiceWithoutHeld(languageChoice, held)) {
			out.push({
				key: `${STEP_LANGUAGE}:rules`,
				kind: STEP_LANGUAGE,
				label: languageChoice.label,
				detail: "Every character knows Common and two more",
				count: owed,
				ctx: {choice: languageChoice},
			});
		}
	}

	// Last, because it depends on Constitution, which the decisions above can still change
	if (!(Number(st.hpMax) > 0)) {
		out.push({key: STEP_HP, kind: STEP_HP, label: "Hit points", detail: "roll, average, or maximum", count: 1, ctx: {}});
	}

	return out;
}

/**
 * Every decision the character has already answered, with its answer — the other half of
 * `getOutstandingDecisions`, and read the same way from the same data.
 *
 * Answered decisions used to vanish: the guide listed what was owed, and once a skill or a +2/+1 was
 * picked, nothing anywhere showed the pick or offered to change it. A mistake made in the guide was
 * permanent. Each entry here has the `kind` and `ctx` its outstanding twin had, so whatever asked the
 * question can ask it again.
 *
 * It is also where "too many" is found. `allowed` is how many the rules give (null where there is no
 * count, as for a subclass), and `isOver` says the answer has more — a choice answered twice, a level
 * lowered after its improvement was spent, a class's skills picked again after it was re-added.
 *
 * @param opts as `getOutstandingDecisions`, plus `extraExpertise` — Expertise that feats grant, which
 *   the class tables do not count.
 * @return {Array<{key, kind, label, detail, answer: string[], allowed: ?number, isOver: boolean, ctx}>}
 */
export function getAnsweredDecisions ({state, loaded = [], speciesEnt = null, backgroundEnt = null, isClassic = false, extraExpertise = 0} = {}) {
	const out = [];
	const st = state || {};
	const log = st.choiceLog || [];
	const recordOf = choice => log.find(it => it.sig === getChoiceSignature(choice) && (it.picks || []).length);
	const push = ({key, kind, label, detail, answer, allowed = null, isOver = null, ctx = {}}) => out.push({
		key,
		kind,
		label,
		detail,
		answer: answer.map(String),
		allowed,
		isOver: isOver ?? (allowed != null && answer.length > allowed),
		ctx,
	});

	/* ---------- a species and a background ---------- */

	[[speciesEnt, "species"], [backgroundEnt, "background"]].forEach(([ent, kind]) => {
		if (!ent) return;

		getPendingChoices(kind === "species" ? {race: ent} : {background: ent}).forEach(choice => {
			const rec = recordOf(choice);
			if (!rec) return;
			const sig = getChoiceSignature(choice);
			push({
				key: `${STEP_ORIGIN_CHOICE}:${sig}`,
				kind: STEP_ORIGIN_CHOICE,
				label: choice.label,
				detail: ent.name,
				answer: rec.picks,
				// An ability choice's picks are its increases, which the package itself decides
				allowed: choice.type === CHOICE_TYPE_ABILITY ? null : (choice.count || 1),
				ctx: {ent, kind, choice, sig},
			});
		});

		const fromHere = (st.originFeats || []).filter(it => it.from === ent.name);
		const named = getGrantedFeats(ent.feats, {fromFeature: ent.fromFeature});
		const featChoice = getGrantedFeatChoice(ent.feats, {fromFeature: ent.fromFeature});
		const nOffered = named.length + (featChoice ? 1 : 0) + getGrantedFeatCategories(ent.feats).reduce((acc, it) => acc + it.count, 0);
		fromHere.forEach((feat, ix) => push({
			key: `${STEP_ORIGIN_FEAT}:${ent.name}:taken:${feat.id}`,
			kind: STEP_ORIGIN_FEAT,
			label: "Origin feat",
			detail: ent.name,
			answer: [feat.displayName || feat.name],
			allowed: 1,
			isOver: ix >= nOffered,
			ctx: {ent, feat},
		}));

		if (kind === "species" && [ent.size].flat().filter(Boolean).length > 1 && st.size) {
			push({key: `${STEP_SIZE}:${ent.name}`, kind: STEP_SIZE, label: "Size", detail: ent.name, answer: [st.size], ctx: {ent}});
		}

		getTraitChoices(ent).forEach(choice => {
			const picked = (st.traitChoices || []).find(it => it.source === ent.name && it.trait === choice.trait);
			if (!picked) return;
			push({key: `${STEP_TRAIT_CHOICE}:${ent.name}:${choice.trait}`, kind: STEP_TRAIT_CHOICE, label: choice.trait, detail: ent.name, answer: [picked.option], ctx: {ent, choice}});
		});

		if (kind === "species") _pushSpellGroupAnswer(push, st, "race", ent);
	});

	/* ---------- each class ---------- */

	loaded.forEach(({entry, cls, sc}) => {
		if (!cls) return;

		getPendingChoices({cls}).forEach(choice => {
			const rec = recordOf(choice);
			if (!rec) return;
			const sig = getChoiceSignature(choice);
			push({
				key: `${STEP_CLASS_PROFICIENCY}:${entry.id}:${sig}`,
				kind: STEP_CLASS_PROFICIENCY,
				label: choice.label,
				detail: cls.name,
				answer: rec.picks,
				allowed: choice.count || 1,
				ctx: {ent: cls, choice, sig},
			});
		});

		if (entry.subclass?.name) {
			push({key: `${STEP_SUBCLASS}:${entry.id}`, kind: STEP_SUBCLASS, label: cls.subclassTitle || "Subclass", detail: entry.name, answer: [entry.subclass.name], ctx: {entry, cls}});
		}

		const asi = (entry.asiFeatChoices || []).filter(Boolean);
		if (asi.length) {
			push({
				key: `${STEP_ASI}:${entry.id}`,
				kind: STEP_ASI,
				label: "Ability Score Improvement or feat",
				detail: `${entry.name} ${entry.level}`,
				answer: asi.map(it => it.name),
				allowed: getAsiCount(cls, entry.level),
				ctx: {entry, cls},
			});
		}

		[...getFeatProgressionCounts(cls, entry.level), ...(sc ? getFeatProgressionCounts(sc, entry.level) : [])].forEach(prog => {
			const taken = (st.featureFeats || []).filter(it => it.entryId === entry.id && prog.categories.includes(String(it.category || "").toUpperCase()));
			if (!taken.length) return;
			push({key: `${STEP_CLASS_FEAT}:${entry.id}:${prog.name}`, kind: STEP_CLASS_FEAT, label: prog.name, detail: entry.name, answer: taken.map(it => it.name), allowed: prog.count, ctx: {entry, prog}});
		});

		getOptionalFeatureCounts(cls, entry.level).forEach(prog => {
			const chosen = (entry.optionalFeatures || []).filter(it => it.progressionName === prog.name);
			if (!chosen.length) return;
			push({key: `${STEP_OPTIONAL_FEATURE}:${entry.id}:${prog.name}`, kind: STEP_OPTIONAL_FEATURE, label: prog.name, detail: entry.name, answer: chosen.map(it => it.name), allowed: prog.count, ctx: {entry, prog}});
		});

		const reached = [
			...(cls.classFeatures || []).slice(0, entry.level).flat(),
			...(sc?.subclassFeatures || []).flat().filter(f => (f?.level ?? 0) <= entry.level),
		];
		getFeatureOptionGroups(reached).forEach(group => {
			const picked = (entry.featureOptions || []).find(it => it.feature === group.feature);
			if (!picked) return;
			push({key: `${STEP_FEATURE_OPTION}:${entry.id}:${group.feature}`, kind: STEP_FEATURE_OPTION, label: group.feature, detail: entry.name, answer: [picked.option], ctx: {entry, group}});
		});

		if (sc) _pushSpellGroupAnswer(push, st, "subclass", sc, {entry});

		const cantripsBase = getCantripsKnown(sc, entry.level) ?? getCantripsKnown(cls, entry.level);
		const cantrips = cantripsBase == null ? null : cantripsBase + getFeatureOptionCantripBonus(entry);
		const known = getSpellsKnown(sc, entry.level) ?? getSpellsKnown(cls, entry.level);
		const have = (st.spellsKnown || []).filter(it => !it.className || it.className === entry.name);
		if (have.length) {
			const nCantrips = have.filter(it => !it.level).length;
			const nLeveled = have.filter(it => it.level).length;
			push({
				key: `${STEP_SPELLS}:${entry.id}`,
				kind: STEP_SPELLS,
				label: "Spells",
				detail: entry.name,
				answer: have.map(it => it.name),
				// A prepared caster's list may be longer than what it prepares today; only counts the
				// rules fix are counted against it
				allowed: cantrips != null && known != null ? cantrips + known : null,
				isOver: (cantrips != null && nCantrips > cantrips) || (known != null && nLeveled > known),
				ctx: {entry, cls},
			});
		}

		getClassFeatureLanguageChoices({features: cls.classFeatures, level: entry.level}).forEach(choice => {
			const rec = recordOf(choice);
			if (!rec) return;
			push({key: `${STEP_LANGUAGE}:${entry.id}:${choice.sourceName}`, kind: STEP_LANGUAGE, label: choice.label, detail: entry.name, answer: rec.picks, allowed: choice.count, ctx: {choice, sig: getChoiceSignature(choice)}});
		});

		getFixedSpellsKnownGrants(cls, entry.level).forEach(grant => {
			const grantKey = `${entry.id}:${cls.name}:${grant.id}`;
			const picked = (st.grantedSpellChoices || []).filter(it => it.grantKey === grantKey);
			if (!picked.length) return;
			push({key: `${STEP_FIXED_SPELL}:${grantKey}`, kind: STEP_FIXED_SPELL, label: grant.groupName || "Fixed-level spell", detail: entry.name, answer: picked.map(it => it.name), allowed: 1, ctx: {entry, cls, grant, grantKey}});
		});
	});

	/* ---------- pools that span the classes ---------- */

	const expertise = CHAR_SHEET_SKILLS.filter(({key}) => Number(st[`skill_${key}`]) === PROF_STATE_EXPERTISE).map(({name}) => name);
	if (expertise.length) {
		const total = loaded.reduce((acc, {entry, cls}) => acc + (cls ? getExpertiseSkillCount(cls, entry.level) : 0), 0) + (Number(extraExpertise) || 0);
		push({key: STEP_EXPERTISE, kind: STEP_EXPERTISE, label: "Expertise", detail: "double your proficiency in a skill", answer: expertise, allowed: total, ctx: {}});
	}

	const masteries = st.weaponMasteries || [];
	if (masteries.length) {
		const total = loaded.reduce((acc, {entry, cls}) => acc + (cls ? getWeaponMasteryCount(cls, entry.level) : 0), 0);
		push({key: STEP_MASTERY, kind: STEP_MASTERY, label: "Weapon mastery", detail: "which weapons' mastery properties you can use", answer: masteries, allowed: total, ctx: {}});
	}

	const languageChoice = getRulesLanguageChoice({isClassic});
	const languageRec = languageChoice && recordOf(languageChoice);
	if (languageRec) {
		push({key: `${STEP_LANGUAGE}:rules`, kind: STEP_LANGUAGE, label: languageChoice.label, detail: "Every character knows Common and two more", answer: languageRec.picks, allowed: languageChoice.count, ctx: {choice: languageChoice, sig: getChoiceSignature(languageChoice)}});
	}

	if (Number(st.hpMax) > 0 && (st.classes || []).length) {
		push({key: STEP_HP, kind: STEP_HP, label: "Hit points", detail: st.hpMode || "", answer: [`${st.hpMax}`], ctx: {}});
	}

	return out;
}

function _pushSpellGroupAnswer (push, st, kind, ent, ctx = {}) {
	const groups = getSpellGrantGroups(ent);
	if (groups.length < 2) return;
	const ix = getSpellGroupIndex(st, kind, ent);
	if (ix == null || !groups[ix]) return;
	push({key: `${STEP_SPELL_GROUP}:${kind}:${ent.name}|${ent.source}`, kind: STEP_SPELL_GROUP, label: `${ent.name}: spell list`, detail: groups.map(g => g.name).join(" or "), answer: [groups[ix].name], ctx: {...ctx, kind, ent, groups}});
}

/**
 * The signature of every choice the character's species, background, classes and the rules still
 * ask — what an answer on record must belong to. One that belongs to none is left over from something
 * removed (`getOrphanChoiceRecords`). A feat's own questions are the caller's to add: feats are not
 * loaded here.
 */
export function getAskedChoiceSigs ({loaded = [], speciesEnt = null, backgroundEnt = null, isClassic = false} = {}) {
	const sigs = new Set();
	const add = choice => sigs.add(getChoiceSignature(choice));
	getPendingChoices({race: speciesEnt, background: backgroundEnt}).forEach(add);
	loaded.forEach(({entry, cls}) => {
		if (!cls) return;
		getPendingChoices({cls}).forEach(add);
		getClassFeatureLanguageChoices({features: cls.classFeatures, level: entry.level}).forEach(add);
	});
	const languageChoice = getRulesLanguageChoice({isClassic});
	if (languageChoice) add(languageChoice);
	return sigs;
}

const _getSpellLabel = ({owedCantrips, owedKnown, isNothingAtAll}) => {
	const parts = [];
	if (owedCantrips) parts.push(`${owedCantrips} cantrip${owedCantrips === 1 ? "" : "s"}`);
	if (owedKnown) parts.push(`${owedKnown} spell${owedKnown === 1 ? "" : "s"}`);
	if (!parts.length && isNothingAtAll) return "Spells";
	return `Spells: ${parts.join(" and ")} to choose`;
};

/** The level a class's subclass arrives at, read from where the feature says so. */
function _getSubclassGainLevel (cls) {
	const byLevel = cls?.classFeatures || [];
	for (let i = 0; i < byLevel.length; ++i) {
		const isGain = (byLevel[i] || []).some(f => f?.gainSubclassFeature);
		if (isGain) return i + 1;
	}
	return null;
}
