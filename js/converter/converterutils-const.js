export class ConverterConst {
	static STR_RE_DAMAGE_TYPE = `(${Parser.DMG_TYPES.map(it => it.toTitleCase()).join("|")})`;
	static RE_DAMAGE_TYPE = new RegExp(`\\b${ConverterConst.STR_RE_DAMAGE_TYPE}\\b`, "gi");
	static STR_RE_CLASS = `(?<name>artificer|barbarian|bard|cleric|druid|fighter|monk|paladin|ranger|rogue|sorcerer|warlock|wizard)`;
}
