import "../../js/parser.js";
import "../../js/utils.js";

describe("Trie", () => {
	it("Should find the longest string", () => {
		const tst = new Trie();

		tst.add("the cat");
		tst.add("the mat");
		tst.add("the cat sat");

		expect(
			tst.findLongestComplete("the cat sat on the mat"),
		)
			.toStrictEqual("the cat sat".split(""));

		expect(
			tst.findLongestComplete("the mat"),
		)
			.toStrictEqual("the mat".split(""));

		expect(
			tst.findLongestComplete("hello world"),
		)
			.toBe(null);
	});
});
