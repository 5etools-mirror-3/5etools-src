import "../../js/parser.js";
import "../../js/utils.js";
import "../../js/render.js";

describe("Splitting by tags", () => {
	it("Should handle a single tag", () => {
		expect(Renderer.splitByTags("aa {@b bb} cc"))
			.toStrictEqual([
				"aa ",
				"{@b bb}",
				" cc",
			]);

		expect(Renderer.splitByTags("aa{@b bb}"))
			.toStrictEqual([
				"aa",
				"{@b bb}",
			]);

		expect(Renderer.splitByTags("{@b bb}"))
			.toStrictEqual([
				"{@b bb}",
			]);

		expect(Renderer.splitByTags("{@h}"))
			.toStrictEqual([
				"{@h}",
			]);
	});

	it("Should handle multiple tags", () => {
		expect(Renderer.splitByTags("{@b {@i aaa} bb} {@b cc}"))
			.toStrictEqual([
				"{@b {@i aaa} bb}",
				" ",
				"{@b cc}",
			]);
	});

	it("Should handle property injectors", () => {
		expect(Renderer.splitByTags("{=amount1/v} {=amount2}"))
			.toStrictEqual([
				"{=amount1/v}",
				" ",
				"{=amount2}",
			]);

		expect(Renderer.splitByTags("{=amount1/v} {@unit {=amount1}|egg|eggs}"))
			.toStrictEqual([
				"{=amount1/v}",
				" ",
				"{@unit {=amount1}|egg|eggs}",
			]);
	});

	it("Should handle non-tags", () => {
		expect(Renderer.splitByTags("{@@a {@@b"))
			.toStrictEqual([
				"{@@a {@@b",
			]);

		expect(Renderer.splitByTags("{@}"))
			.toStrictEqual([
				"{@}",
			]);
	});

	it("Should not handle non-closing braces", () => {
		expect(Renderer.splitByTags("{@a {}"))
			.toStrictEqual([
				"{@a {}",
			]);

		expect(Renderer.splitByTags("{@a {}}"))
			.toStrictEqual([
				"{@a {}",
				"}",
			]);

		expect(Renderer.splitByTags("{@a {}}}"))
			.toStrictEqual([
				"{@a {}",
				"}}",
			]);
	});
});
