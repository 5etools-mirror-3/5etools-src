import "../../js/parser.js";
import "../../js/utils.js";
import "../../js/render.js";

describe("Number to text", () => {
	it("Should handle three-plus-digit numbers", () => {
		expect(Parser.numberToText(100)).toBe("100");
		expect(Parser.numberToText(1000)).toBe("1000");
	});

	it("Should handle non-integers", () => {
		expect(Parser.numberToText(1.5)).toBe("one and one-half");
		expect(Parser.numberToText(1.1)).toBe("1.1");
	});

	it("Should handle ordinal output", () => {
		expect(Parser.numberToText(0, {isOrdinalForm: true})).toBe("zeroth");
		expect(Parser.numberToText(1, {isOrdinalForm: true})).toBe("first");
		expect(Parser.numberToText(10, {isOrdinalForm: true})).toBe("tenth");
		expect(Parser.numberToText(11, {isOrdinalForm: true})).toBe("eleventh");
		expect(Parser.numberToText(20, {isOrdinalForm: true})).toBe("twentieth");
		expect(Parser.numberToText(21, {isOrdinalForm: true})).toBe("twenty-first");

		expect(Parser.numberToText(100, {isOrdinalForm: true})).toBe("100th");
		expect(Parser.numberToText(1000, {isOrdinalForm: true})).toBe("1000th");

		expect(Parser.numberToText(1.5, {isOrdinalForm: true})).toBe("1.5th");
		expect(Parser.numberToText(1.1, {isOrdinalForm: true})).toBe("1.1st");
		expect(Parser.numberToText(1.3, {isOrdinalForm: true})).toBe("1.3rd");
		expect(Parser.numberToText(1.11, {isOrdinalForm: true})).toBe("1.11th");
	});
});
