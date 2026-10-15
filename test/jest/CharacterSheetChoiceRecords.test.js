import {describe, expect, it} from "@jest/globals";
// The language choices name `Parser.LANGUAGES_STANDARD`, as every module that names a language does
import "../../js/parser.js";
import {
	CHOICE_TYPE_ABILITY,
	CHOICE_TYPE_LANGUAGE,
	CHOICE_TYPE_SKILL,
	CHOICE_TYPE_SKILL_TOOL_LANGUAGE,
	CHOICE_TYPE_TOOL,
	getChoiceReversal,
	getChoiceSignature,
	getEntitySkillNames,
	getOrphanChoiceRecords,
	getPendingChoices,
	getRecordApplied,
	getRecordBonuses,
	getSkillNamesFromRecords,
	getSourceEntityName,
	getUnexplainedSkills,
} from "../../js/charactersheet/charactersheet-choices.js";
import {
	STEP_ASI,
	STEP_CLASS_PROFICIENCY,
	STEP_ORIGIN_CHOICE,
	getAnsweredDecisions,
	getAskedChoiceSigs,
	getOutstandingDecisions,
} from "../../js/charactersheet/charactersheet-buildsteps.js";

/**
 * Answers that can be taken back, shown, and counted.
 *
 * A Ranger removed and added back kept the Nature and Survival it had picked the first time; the
 * second time it was offered the rest of its list and ended up with five. A background's +2/+1, once
 * given, could not be changed at all. These are the pieces that make an answer reversible and visible.
 */

const RANGER = {
	name: "Ranger",
	source: "XPHB",
	startingProficiencies: {skills: [{choose: {from: ["animal handling", "athletics", "insight", "investigation", "nature", "perception", "stealth", "survival"], count: 3}}]},
	classFeatures: [[{name: "Spellcasting"}], [{name: "Fighting Style"}], [{name: "Ranger Subclass", gainSubclassFeature: true}], [{name: "Ability Score Improvement"}]],
};

const SAGE = {
	name: "Sage",
	source: "XPHB",
	ability: [{choose: {weighted: {from: ["con", "int", "wis"], weights: [2, 1]}}}],
	skillProficiencies: [{arcana: true, history: true}],
};

const rangerChoice = () => getPendingChoices({cls: RANGER}).find(it => it.type === CHOICE_TYPE_SKILL);
const sageAbility = () => getPendingChoices({background: SAGE}).find(it => it.type === CHOICE_TYPE_ABILITY);

describe("Choice records: what an answer applied", () => {
	it("Names the entity behind a record's source", () => {
		expect(getSourceEntityName("Class: Ranger")).toBe("Ranger");
		expect(getSourceEntityName("Background: Sage")).toBe("Sage");
		expect(getSourceEntityName("Languages")).toBe("Languages");
	});

	it("Reads an older record's picks by its type, and a mixed pool's by what the name is", () => {
		const state = {proficiencies: [{id: "p1", kind: "language", name: "Elvish", source: "Skilled"}]};
		const applied = getRecordApplied({sig: "x", sourceName: "Skilled", type: CHOICE_TYPE_SKILL_TOOL_LANGUAGE, picks: ["Stealth", "Elvish", "Lute"]}, state);
		expect(applied.map(it => it.type)).toEqual([CHOICE_TYPE_SKILL, CHOICE_TYPE_LANGUAGE, CHOICE_TYPE_TOOL]);
	});

	it("Prefers what a newer record says it applied", () => {
		const applied = [{type: CHOICE_TYPE_TOOL, name: "Stealth", source: "X"}];
		expect(getRecordApplied({type: CHOICE_TYPE_SKILL, picks: ["Stealth"], applied})).toBe(applied);
	});

	it("Reads an ability choice's increases from its picks when it has no bonuses stored", () => {
		expect(getRecordBonuses({type: CHOICE_TYPE_ABILITY, picks: ["+2 Wisdom", "+1 Intelligence"]})).toEqual({wis: 2, int: 1});
		expect(getRecordBonuses({type: CHOICE_TYPE_ABILITY, bonuses: {con: 2}, picks: ["anything"]})).toEqual({con: 2});
	});

	it("Collects the skills a set of records picked, and those an entity grants outright", () => {
		expect([...getSkillNamesFromRecords([{type: CHOICE_TYPE_SKILL, picks: ["Nature", "Survival"]}])].sort()).toEqual(["nature", "survival"]);
		expect([...getEntitySkillNames(SAGE)].sort()).toEqual(["arcana", "history"]);
	});
});

describe("Choice records: taking an answer back", () => {
	const record = {sig: getChoiceSignature(rangerChoice()), sourceName: "Class: Ranger", type: CHOICE_TYPE_SKILL, picks: ["Nature", "Survival", "Stealth"]};
	const state = {skill_nature: 1, skill_survival: 1, skill_stealth: 2, choiceLog: [record]};

	it("Takes the picked skills off", () => {
		const rev = getChoiceReversal({state, record});
		expect(rev.skills).toEqual({nature: 0, survival: 0, stealth: 0});
	});

	it("Leaves a skill something else still grants", () => {
		const rev = getChoiceReversal({state, record, keepSkillNames: new Set(["stealth"])});
		expect(rev.skills).toEqual({nature: 0, survival: 0});
	});

	it("Drops an Expertise pick back to proficient", () => {
		const exp = {sig: "e", sourceName: "Skill Expert", type: "expertise", picks: ["Stealth"]};
		expect(getChoiceReversal({state, record: exp}).skills).toEqual({stealth: 1});
	});

	it("Takes a tool or language off only where the pick put it", () => {
		const st = {proficiencies: [
			{id: "a", kind: "tool", name: "Lute", source: "Bard"},
			{id: "b", kind: "tool", name: "Lute", source: "Entertainer"},
			{id: "c", kind: "language", name: "Elvish", source: "Languages"},
		]};
		expect(getChoiceReversal({state: st, record: {sourceName: "Class: Bard", type: CHOICE_TYPE_TOOL, picks: ["Lute"]}}).proficiencyIds).toEqual(["a"]);
		expect(getChoiceReversal({state: st, record: {sourceName: "Languages", type: CHOICE_TYPE_LANGUAGE, picks: ["Elvish"]}}).proficiencyIds).toEqual(["c"]);
	});

	it("Gives back a background's increase by the log entry it was written as", () => {
		const st = {abilityBonusLog: [{id: "L1", source: "Sage", bonuses: {wis: 2, int: 1}}]};
		const rec = {sourceName: "Background: Sage", type: CHOICE_TYPE_ABILITY, picks: ["+2 Wisdom", "+1 Intelligence"], logId: "L1"};
		expect(getChoiceReversal({state: st, record: rec}).abilityLog).toEqual([{id: "L1", bonuses: {wis: 2, int: 1}}]);
	});

	it("Finds an older record's increase by source and amounts", () => {
		const st = {abilityBonusLog: [
			{id: "other", source: "Sage", bonuses: {con: 1}},
			{id: "L2", source: "Sage", bonuses: {wis: 2, int: 1}},
		]};
		const rec = {sourceName: "Background: Sage", type: CHOICE_TYPE_ABILITY, picks: ["+2 Wisdom", "+1 Intelligence"]};
		expect(getChoiceReversal({state: st, record: rec}).abilityLog.map(it => it.id)).toEqual(["L2"]);
	});

	it("Has nothing to undo for nothing", () => {
		expect(getChoiceReversal({state: {}, record: null})).toEqual({skills: {}, proficiencyIds: [], abilityLog: []});
	});
});

describe("Choice records: what nothing explains", () => {
	it("Reports a skill nothing grants and no answer picked", () => {
		const out = getUnexplainedSkills({state: {skill_nature: 1, skill_arcana: 1, skill_stealth: 2}, explained: new Set(["arcana"])});
		expect(out.map(it => it.key).sort()).toEqual(["nature", "stealth"]);
	});

	it("Reports an answer for a class the character no longer has", () => {
		const live = getAskedChoiceSigs({loaded: [], backgroundEnt: SAGE});
		const rec = {sig: getChoiceSignature(rangerChoice()), sourceName: "Class: Ranger", type: CHOICE_TYPE_SKILL, picks: ["Nature"]};
		expect(getOrphanChoiceRecords({state: {choiceLog: [rec]}, knownSigs: live})).toEqual([rec]);
		const withRanger = getAskedChoiceSigs({loaded: [{entry: {id: "r", level: 1}, cls: RANGER}]});
		expect(getOrphanChoiceRecords({state: {choiceLog: [rec]}, knownSigs: withRanger})).toEqual([]);
	});
});

describe("Answered decisions: shown, and counted", () => {
	const entry = {id: "r", name: "Ranger", level: 4, asiFeatChoices: []};
	const loaded = [{entry, cls: RANGER}];
	const sig = getChoiceSignature(rangerChoice());

	it("Lists a class's skills with what was picked, and stops owing them", () => {
		const state = {classes: [entry], choiceLog: [{sig, sourceName: "Class: Ranger", type: CHOICE_TYPE_SKILL, picks: ["Nature", "Survival", "Stealth"]}]};
		const answered = getAnsweredDecisions({state, loaded}).find(it => it.kind === STEP_CLASS_PROFICIENCY);
		expect(answered.answer).toEqual(["Nature", "Survival", "Stealth"]);
		expect(answered.allowed).toBe(3);
		expect(answered.isOver).toBe(false);
		expect(getOutstandingDecisions({state, loaded}).some(it => it.kind === STEP_CLASS_PROFICIENCY)).toBe(false);
	});

	it("Says when more were picked than the class offers", () => {
		const state = {classes: [entry], choiceLog: [{sig, sourceName: "Class: Ranger", type: CHOICE_TYPE_SKILL, picks: ["Nature", "Survival", "Stealth", "Insight", "Athletics"]}]};
		expect(getAnsweredDecisions({state, loaded}).find(it => it.kind === STEP_CLASS_PROFICIENCY).isOver).toBe(true);
	});

	it("Keeps a background's +2/+1 on show once given, with the question that changes it", () => {
		const choice = sageAbility();
		const state = {choiceLog: [{sig: getChoiceSignature(choice), sourceName: "Background: Sage", type: CHOICE_TYPE_ABILITY, picks: ["+2 Wisdom", "+1 Intelligence"]}]};
		const answered = getAnsweredDecisions({state, backgroundEnt: SAGE}).find(it => it.kind === STEP_ORIGIN_CHOICE);
		expect(answered.answer).toEqual(["+2 Wisdom", "+1 Intelligence"]);
		expect(answered.ctx.choice.type).toBe(CHOICE_TYPE_ABILITY);
		expect(answered.isOver).toBe(false);
	});

	it("Counts improvements spent past what the level gives", () => {
		const low = {...entry, level: 3, asiFeatChoices: [{id: "a", type: "asi", name: "+2 Wisdom"}]};
		const state = {classes: [low]};
		const answered = getAnsweredDecisions({state, loaded: [{entry: low, cls: RANGER}]}).find(it => it.kind === STEP_ASI);
		expect(answered.allowed).toBe(0);
		expect(answered.isOver).toBe(true);
	});

	it("Counts Expertise a feat grants as allowed", () => {
		const state = {skill_stealth: 2};
		const fromRules = getAnsweredDecisions({state, loaded}).find(it => it.label === "Expertise");
		expect(fromRules.isOver).toBe(true);
		expect(getAnsweredDecisions({state, loaded, extraExpertise: 1}).find(it => it.label === "Expertise").isOver).toBe(false);
	});

	it("Has nothing to report for nothing answered", () => {
		expect(getAnsweredDecisions({state: {}})).toEqual([]);
		expect(getAnsweredDecisions()).toEqual([]);
	});
});
