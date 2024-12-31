import "../../js/parser.js";
import "../../js/utils.js";
import "../../js/render.js";
import "../../js/utils-config.js";

describe("CR to PB", () => {
	it("Should handle known CRs", () => {
		expect(Parser.crToPb("0")).toBe(2);
		expect(Parser.crToPb("1/2")).toBe(2);
		expect(Parser.crToPb("2")).toBe(2);
		expect(Parser.crToPb("5")).toBe(3);
		expect(Parser.crToPb("30")).toBe(9);

		expect(Parser.crToPb("Unknown")).toBe(0);
		expect(Parser.crToPb("\u2014")).toBe(0);
		expect(Parser.crToPb(null)).toBe(0);
	});

	it("Should handle unknown CRs", () => {
		expect(Parser.crToPb("-1")).toBe(null);
		expect(Parser.crToPb("")).toBe(null);
		expect(Parser.crToPb("other")).toBe(null);
	});
});
