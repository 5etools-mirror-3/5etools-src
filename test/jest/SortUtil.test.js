import "../../js/parser.js";
import "../../js/utils.js";

describe("SortUtil", () => {
	describe("ascSort", () => {
		it("Should sensibly handle null/undefined", () => {
			expect(SortUtil.ascSort(null, "a")).toBe(-1);
			expect(SortUtil.ascSort("a", null)).toBe(1);
			expect(SortUtil.ascSort(undefined, "a")).toBe(-1);
			expect(SortUtil.ascSort("a", undefined)).toBe(1);
			expect(SortUtil.ascSort(undefined, null)).toBe(0);
		});
	});

	describe("ascSortLowerNormalized", () => {
		it("Should treat diacritic variants as base characters", () => {
			expect(SortUtil.ascSortLowerNormalized("Ørjan", "Orjan")).toBe(0);
			expect(SortUtil.ascSortLowerNormalized("Óscar", "Oscar")).toBe(0);
		});

		it("Should be case-insensitive", () => {
			expect(SortUtil.ascSortLowerNormalized("a", "A")).toBe(0);
			expect(SortUtil.ascSortLowerNormalized("Z", "z")).toBe(0);
		});
	});

	describe("ascSortSpellRechargeKeys", () => {
		it("Should correctly sort keys", () => {
			expect(SortUtil.ascSortSpellRechargeKeys("1", "1")).toBe(0);
			expect(SortUtil.ascSortSpellRechargeKeys("1e", "1e")).toBe(0);
			expect(SortUtil.ascSortSpellRechargeKeys("1", "1e")).toBe(-1);
			expect(SortUtil.ascSortSpellRechargeKeys("11", "1e")).toBe(1);
		});
	});
});
