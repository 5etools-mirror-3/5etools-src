import "../../../js/parser.js";
import "../../../js/utils.js";
import {TaggerUtils} from "../../../js/converter/converterutils-tags.js";

describe("getNameRegex", () => {
	it("Prefers longer versions", () => {
		const re = TaggerUtils.getNameRegex(["Horn of Valhalla", "Horn of Valhalla, Brass", "Horn of Valhalla"], {flags: "gi"});

		expect("Horn of Valhalla, Brass; Horn of Valhalla".matchAllSafe(re).map(m => m.groups.name))
			.toEqual(["Horn of Valhalla, Brass", "Horn of Valhalla"]);
	});

	it("Handles punctuation", () => {
		const re = TaggerUtils.getNameRegex(["Cone [Area of Effect]", "Weapon (+1)"], {flags: "gi"});

		expect("Cone [Area of Effect]; Weapon (+1); Weapon 1".matchAllSafe(re).map(m => m.groups.name))
			.toEqual(["Cone [Area of Effect]", "Weapon (+1)"]);
	});

	it("Avoids partial words", () => {
		const re = TaggerUtils.getNameRegex(["spell"], {flags: "gi"});

		expect("spell spellbook spell_2 2spell _spell (spell)".matchAllSafe(re).map(m => m.groups.name))
			.toEqual(["spell", "spell"]);
	});

	it.each([
		["Fly", ["Fly"]],
		["fly", []],
		["Fly spell", []],
		["a Fly", []],
	])("Matches exact terms", (input, expected) => {
		const re = TaggerUtils.getNameRegex(["Fly"], {isExact: true});

		expect(input.matchAllSafe(re).map(m => m.groups.name)).toEqual(expected);
	});
});
