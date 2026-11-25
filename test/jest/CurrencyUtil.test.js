import "../../js/parser.js";
import "../../js/utils.js";

describe("Conversion to copper", () => {
	it("Should handle custom currency conversion tables", () => {
		const currencyConversionTable = [
			{coin: "cp", mult: 2.5},
			{coin: "gp", mult: 0.08},
		];

		expect(
			CurrencyUtil.getAsCopper(
				{
					cp: 5,
					sp: 999, // ignored
					gp: 2,
				},
				{currencyConversionTable},
			),
		)
			.toBe(27);
	});
});
