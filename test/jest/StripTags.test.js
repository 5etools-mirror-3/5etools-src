import "../../js/parser.js";
import "../../js/utils.js";
import "../../js/render.js";

describe("Stripping tags", () => {
	it("Should handle a single tag", () => {
		expect(Renderer.stripTags("aa {@b bb} cc")).toBe("aa bb cc");
		expect(Renderer.stripTags("aa{@b bb}")).toBe("aabb");
		expect(Renderer.stripTags("{@b bb}")).toBe("bb");
		expect(Renderer.stripTags("{@h}")).toBe("Hit: ");
		expect(Renderer.stripTags("{@font a|b}")).toBe("a");
		expect(Renderer.stripTags("{@dice 1d20}")).toBe("1d20");
		expect(Renderer.stripTags("{@dice 1d20|Display Text}")).toBe("Display Text");
	});

	it("Should handle multiple tags", () => {
		expect(Renderer.stripTags("{@b {@i aaa} bb} {@b cc}")).toBe("aaa bb cc");
	});

	it("Should ignore property injectors", () => {
		expect(Renderer.stripTags("{=amount1/v} {=amount2}")).toBe("{=amount1/v} {=amount2}");
		expect(Renderer.stripTags("{=amount1/v} {@unit {=amount1}|egg|eggs}")).toBe("{=amount1/v} egg");
	});

	it("Should ignore tags in allowlist", () => {
		expect(Renderer.stripTags("{@b {@i aaa} bb} {@b cc}", {allowlistTags: new Set(["@i"])})).toBe("{@i aaa} bb cc");
		expect(Renderer.stripTags("{@b {@i aaa} bb} {@b cc}", {allowlistTags: new Set([])})).toBe("aaa bb cc");
	});

	it("Should only remove tags in blocklist", () => {
		expect(Renderer.stripTags("{@b {@i aaa} bb} {@b cc}", {blocklistTags: new Set(["@b"])})).toBe("{@i aaa} bb cc");
		expect(Renderer.stripTags("{@b {@i aaa} bb} {@b cc}", {blocklistTags: new Set([])})).toBe("{@b {@i aaa} bb} {@b cc}");
	});
});
