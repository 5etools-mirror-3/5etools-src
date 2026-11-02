import "../../../js/parser.js";
import "../../../js/utils.js";
import "../../../js/utils-dataloader.js";
import "../../../js/utils-config.js";
import "../../../js/render.js";
import "../../../js/render-dice.js";
import {CoreRuleTag, ItemTag, TagJsons} from "../../../js/converter/converterutils-entries.js";
import {ActionTag, TagCondition} from "../../../js/converter/converterutils-tags.js";
import {loadSpells, setUp, teardown} from "../../../node/util-tag-jsons.js";

beforeAll(async () => {
	setUp();
	try {
		await TagJsons.pInit({
			spells: loadSpells(),
		});
	} finally {
		teardown();
	}
});

describe.each(["mutTagObject", "mutTagObjectStrictCapsWords"])("method=%s", method => {
	it.each([false, true])("Avoid tagging metadata (isWrapped=%s)", isWrapped => {
		const ent = {
			name: "Darkvision",
			source: "PHB",
			reprintedAs: ["Darkvision"],
			srd: "Darkvision",
			srd52: "Darkvision",
		};
		const entity = MiscUtil.copyFast(ent);
		const json = isWrapped ? {spell: [entity]} : entity;

		TagJsons[method](json, {styleHint: "classic"});

		expect(entity).toEqual(ent);
	});
});

describe("Tagging flow", () => {
	it("Match spell references before matching senses", () => {
		const input = {entries: ["The creature casts Darkvision. It has Darkvision out to 60 feet."]};

		TagJsons.mutTagObject(input, {styleHint: "classic"});

		expect(input.entries).toEqual(["The creature casts {@spell Darkvision}. It has {@sense Darkvision} out to 60 feet."]);
	});
});

// TODO(Future) factor out with `TagCondition`
describe("TagCondition: Context matching", () => {
	it("Avoids over-tagging in strict mode", () => {
		expect(TagCondition.tryRunStrictCapsWords("Prone to trouble; Invisible Stalkers; it is Prone.", {styleHint: "one"}))
			.toBe("Prone to trouble; Invisible Stalkers; it is {@condition Prone|XPHB}.");
	});

	it.each([
		["prone to trouble and petrified wood", "prone to trouble and petrified wood"],
		["invisible stalker and poisoned food", "invisible stalker and poisoned food"],
		["invisible stalkers and poisoned weapons", "invisible stalkers and poisoned weapons"],

		["knocked prone and poisoned", "knocked {@condition prone} and {@condition poisoned}"],

		["{@condition prone} to trouble and {@condition petrified} wood", "{@condition prone} to trouble and {@condition petrified} wood"],

		["prone to trouble and petrified of petrified wood", "prone to trouble and petrified of petrified wood"],
		["prone to trouble and petrified by petrified wood", "prone to trouble and {@condition petrified} by petrified wood"],
	])("Avoids over-tagging in standard mode (input=%s)", (input, expected) => {
		expect(TagCondition.tryRun(input, {styleHint: "classic"})).toBe(expected);
	});
});

// TODO(Future) factor out with `ActionTag`
describe.each(["classic", "one"])("ActionTag: Strict action tagging (styleHint=%s)", styleHint => {
	const source = styleHint === "one" ? "|XPHB" : "";

	it("Tags using expected edition", () => {
		expect(ActionTag.tryRunStrictCapsWords("take the Dash action", {styleHint})).toBe(`take the {@action Dash${source}} action`);
	});

	it.each(["Attack or damage roll", "Attack and damage rolls"])(`Avoids bad "Attack" tags (input=%s)`, input => {
		expect(ActionTag.tryRunStrictCapsWords(input, {styleHint})).toBe(input);
	});

	it("Tags plural opportunity attacks", () => {
		expect(ActionTag.tryRunStrictCapsWords("several Opportunity Attacks are made", {styleHint}))
			.toBe(`several {@action Opportunity Attack|${styleHint === "one" ? "XPHB" : ""}|Opportunity Attacks} are made`);
	});
});

// TODO(Future) factor out with `CoreRuleTag`
describe("CoreRuleTag: Name matching", () => {
	it.each([
		["Cone [Area of Effect]", "{@variantrule Cone [Area of Effect]|XPHB}"],

		["Cone", "{@variantrule Cone [Area of Effect]|XPHB|Cone}"],

		["Proficiency Bonus", "{@variantrule Proficiency|XPHB|Proficiency Bonus}"],
		["Half Cover", "{@variantrule Cover|XPHB|Half Cover}"],

		["Short or Long Rest", "{@variantrule Short Rest|XPHB|Short} or {@variantrule Long Rest|XPHB}"],
		["Short or {@variantrule Long Rest|XPHB}", "{@variantrule Short Rest|XPHB|Short} or {@variantrule Long Rest|XPHB}"],
		["Short or {@variantrule Long Rest|XPHB|Long Rest}", "{@variantrule Short Rest|XPHB|Short} or {@variantrule Long Rest|XPHB|Long Rest}"],
		["Short Sword", "Short Sword"],

		["Hit Point Die and Hit Point Dice", "{@variantrule Hit Point Dice|XPHB|Hit Point Die} and {@variantrule Hit Point Dice|XPHB}"],

		["Death Saving Throws", "{@variantrule Death Saving Throw|XPHB|Death Saving Throws}"],

		["D20 Tests", "{@variantrule D20 Test|XPHB|D20 Tests}"],
		["D20 Testimony", "D20 Testimony"],

		["Legendary Action and Flying Sword", "Legendary Action and Flying Sword"],
		["Legendary {@variantrule Action|XPHB} and {@variantrule Flying|XPHB} Sword", "Legendary {@variantrule Action|XPHB} and {@variantrule Flying|XPHB} Sword"],
	])("Correctly tags in standard mode (input=%s)", (input, expected) => {
		expect(CoreRuleTag.tryRun(input, {styleHint: "one"})).toBe(expected);
		expect(CoreRuleTag.tryRun(expected, {styleHint: "one"})).toBe(expected);
	});

	it.each([
		["Half Cover and Proficiency Bonus", "{@variantrule Cover|XPHB|Half Cover} and {@variantrule Proficiency|XPHB|Proficiency Bonus}"],

		["Short or {@variantrule Long Rest|XPHB}", "{@variantrule Short Rest|XPHB|Short} or {@variantrule Long Rest|XPHB}"],
		["Short or {@variantrule Long Rest|XPHB|Long Rest}", "{@variantrule Short Rest|XPHB|Short} or {@variantrule Long Rest|XPHB|Long Rest}"],

		["Legendary Action and Flying Sword", "Legendary Action and Flying Sword"],

		["Cone [Area of Effect]", "{@variantrule Cone [Area of Effect]|XPHB}"],
		["Cone", "{@variantrule Cone [Area of Effect]|XPHB|Cone}"],
	])("Correctly tags in strict mode (input=%s)", (input, expected) => {
		expect(CoreRuleTag.tryRunStrictCapsWords(input, {styleHint: "one"})).toBe(expected);
		expect(CoreRuleTag.tryRunStrictCapsWords(expected, {styleHint: "one"})).toBe(expected);
	});
});

// TODO(Future) factor out with `ItemTag`
describe.each(["classic", "one"])("ItemTag: Name matching (styleHint=%s)", styleHint => {
	const source = styleHint === "one" ? "|XDMG" : "";

	it.each([
		"Horn of Valhalla, Brass",
		"Instrument of the Bards, Cli Lyre",
		styleHint === "one" ? "Half Plate Armor of Vulnerability (Bludgeoning)" : "Armor of Vulnerability (Bludgeoning)",
		"+1 Battleaxe",
	])("Tags complete item names once (input=%s)", input => {
		const expected = `{@item ${input}${source}}`;

		expect(ItemTag.tryRun(input, {styleHint})).toBe(expected);
		expect(ItemTag.tryRun(expected, {styleHint})).toBe(expected);
	});

	it("Tags tools", () => {
		const sourceTool = styleHint === "one" ? "XPHB" : "PHB";

		expect(ItemTag.tryRun("Thieves' Tools and a Staff of Healing", {styleHint}))
			.toBe(`{@item Thieves' Tools|${sourceTool}} and a {@item Staff of Healing${source}}`);
	});
});
