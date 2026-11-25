import "../../../js/parser.js";
import "../../../js/utils.js";
import "../../../js/render.js";
import "../../../js/utils-config.js";

describe("Number to fractional", () => {
	it("Should handle simple cases", () => {
		expect(Parser.numberToFractional(-1)).toBe("-1");
		expect(Parser.numberToFractional(-0.5)).toBe("-1/2");
		expect(Parser.numberToFractional(0)).toBe("0");
		expect(Parser.numberToFractional(1)).toBe("1");
		expect(Parser.numberToFractional(10)).toBe("10");
		expect(Parser.numberToFractional(0.5)).toBe("1/2");
	});

	it("Should handle many decimal places", () => {
		expect(Parser.numberToFractional(-0.00000000000001)).toBe("0");
		expect(Parser.numberToFractional(0.00000000000001)).toBe("0");
		expect(Parser.numberToFractional(0.10000000000001)).toBe("1/10");
	});
});
