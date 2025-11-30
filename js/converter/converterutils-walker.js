export const WALKER_CONVERTER_KEY_BLOCKLIST = new Set([
	...MiscUtil.GENERIC_WALKER_ENTRIES_KEY_BLOCKLIST,
	"heightMod",
	"weightMod",
	"traitTags",
	"replace",
	"toolProficiencies",
	"overwrite",
	"conditionImmune",
	"classFeatures",
	"subclassFeatures",
]);

export const WALKER_CONVERTER = MiscUtil.getWalker({
	keyBlocklist: WALKER_CONVERTER_KEY_BLOCKLIST,
});
