import "../../js/parser.js";
import "../../js/utils.js";
import "../../js/render.js";
import "../../js/utils-config.js";

/**
 * Examples, in order of printing (newest to oldest):
 *
 *  - Aurnozci (BMT) -- acid, fire, poison; bludgeoning, piercing, and slashing from nonmagical attacks
 *  - Deathlock (MPMM) -- necrotic; bludgeoning, piercing, and slashing from nonmagical attacks that aren't silvered
 *  - Air Elemental (MM) -- lightning, thunder; bludgeoning, piercing, and slashing from nonmagical attacks
 */

describe("Basic rendering", () => {
	it("Should render flat resistances", () => {
		expect(Parser.getFullImmRes(["acid"])).toBe("acid");
		expect(Parser.getFullImmRes(["acid", "bludgeoning"])).toBe("acid, bludgeoning");
	});
});

describe("Complex rendering", () => {
	it("Should render complex resistances", () => {
		expect(
			Parser.getFullImmRes(
				[
					"acid",
					"bludgeoning",
					{
						resist: [
							"cold",
						],
					},
				],
			),
		).toBe("acid, bludgeoning; cold");

		expect(
			Parser.getFullImmRes(
				[
					"acid",
					"bludgeoning",
					{
						resist: [
							"cold",
							"fire",
						],
					},
				],
			),
		).toBe("acid, bludgeoning; cold and fire");

		expect(
			Parser.getFullImmRes(
				[
					"acid",
					"bludgeoning",
					{
						resist: [
							"cold",
							"fire",
							"force",
						],
					},
				],
			),
		).toBe("acid, bludgeoning; cold, fire, and force");

		expect(
			Parser.getFullImmRes(
				[
					"acid",
					"bludgeoning",
					{
						resist: [
							"cold",
							"fire",
						],
						note: "from nonmagical attacks",
					},
				],
			),
		).toBe("acid, bludgeoning; cold and fire from nonmagical attacks");
	});
});

describe("Nested rendering", () => {
	it("Should render nested resistances", () => {
		expect(
			Parser.getFullImmRes(
				[
					{
						resist: [
							"acid",
							"bludgeoning",
							{
								resist: [
									"cold",
								],
								note: "from nonmagical attacks",
							},
						],
						preNote: "While bloodied:",
					},
				],
			),
		).toBe("While bloodied: acid, bludgeoning; cold from nonmagical attacks");
	});
});

describe(`"special" rendering`, () => {
	it("Should render special resistances", () => {
		expect(
			Parser.getFullImmRes(
				[
					{
						"special": "damage of the type matching the animated breath's form (acid, cold, fire, lightning, or poison)",
					},
				],
			),
		).toBe("damage of the type matching the animated breath's form (acid, cold, fire, lightning, or poison)");

		expect(
			Parser.getFullImmRes(
				[
					{
						"special": "damage of the type matching the animated breath's form (acid, cold, fire, lightning, or poison)",
					},
				],
				{
					isTitleCase: true,
				},
			),
		).toBe("damage of the type matching the animated breath's form (acid, cold, fire, lightning, or poison)");

		expect(
			Parser.getFullImmRes(
				[
					{
						"special": "Damage of the type matching the animated breath's form (Acid, Cold, Fire, Lightning, or Poison)",
					},
				],
				{
					isTitleCase: true,
				},
			),
		).toBe("Damage of the type matching the animated breath's form (Acid, Cold, Fire, Lightning, or Poison)");

		expect(
			Parser.getFullImmRes(
				[
					{
						resist: [
							"acid",
						],
					},
					{
						"special": "damage of the type matching the animated breath's form (cold, fire, lightning, or poison)",
					},
				],
			),
		).toBe("acid; damage of the type matching the animated breath's form (cold, fire, lightning, or poison)");
	});
});
