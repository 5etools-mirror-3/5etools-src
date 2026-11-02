import "../../../js/parser.js";
import "../../../js/utils.js";
import "../../../js/render.js";
import {DiceConvert} from "../../../js/converter/converterutils-tags.js";

describe("DiceConvert", () => {
	it.each(["D20 Test", "D20 Tests", "d20 test"])("Avoids tagging rule references (reference=%s)", reference => {
		const input = `${reference}; roll d20 or 1d20. It deals 2d6 fire damage.`;

		expect(DiceConvert.getTaggedEntry(input))
			.toBe(`${reference}; roll {@dice d20} or {@dice 1d20}. It deals {@damage 2d6} fire damage.`);
	});

	it("Avoids double-tagging", () => {
		const input = "{@dice 1d6} or {@dice 1d6 + 4} or {@b {@damage 2d6}} fire damage and {@dice 1d20|a die}.";

		expect(DiceConvert.getTaggedEntry(input)).toBe(input);
	});
});
