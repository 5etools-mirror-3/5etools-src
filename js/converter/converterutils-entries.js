import {ActionTag, DiceConvert, SenseTag, SkillTag, TagCondition, TaggerUtils} from "./converterutils-tags.js";
import {VetoolsConfig} from "../utils-config/utils-config-config.js";
import {ConverterTaggerInitializable} from "./converterutils-taggerbase.js";
import {SITE_STYLE__CLASSIC, SITE_STYLE__ONE} from "../consts.js";
import {ConverterUtils} from "./converterutils-utils.js";

const LAST_KEY_ALLOWLIST = new Set([
	"entries",
	"entry",
	"items",
	"entriesHigherLevel",
	"rows",
	"row",
	"fluff",
]);

export class TagJsons {
	static async pInit ({spells}) {
		await TagCondition.pInit();
		await SkillTag.pInit();
		await SenseTag.pInit();
		await SpellTag.pInit(spells);
		await ItemTag.pInit();
		await ActionTag.pInit();
		await HazardTag.pInit();
		await CoreRuleTag.pInit();
		await FeatTag.pInit();
		await AdventureBookTag.pInit();
	}

	/**
	 * @param json
	 * @param {?Set<string>} keySet
	 * @param {boolean} isOptimistic
	 * @param {?Array<object>} creaturesToTag
	 * @param {"classic" | "one" | null} styleHint
	 */
	static mutTagObject (json, {keySet = null, isOptimistic = true, creaturesToTag = null, styleHint = null} = {}) {
		TagJsons.OPTIMISTIC = isOptimistic;
		styleHint ||= VetoolsConfig.get("styleSwitcher", "style");

		const fnCreatureTagSpecific = CreatureTag.getFnTryRunSpecific(creaturesToTag);

		Object.keys(json)
			.forEach(k => {
				if (keySet != null && !keySet.has(k)) return;

				json[k] = TagJsons.WALKER.walk(
					{_: json[k]},
					{
						object: (obj, lastKey) => {
							if (lastKey != null && !LAST_KEY_ALLOWLIST.has(lastKey)) return obj;

							obj = TagCondition.tryRun(obj, {styleHint});
							obj = SkillTag.tryRunStrictCapsWords(obj, {styleHint});
							obj = SenseTag.tryRun(obj, {styleHint});
							obj = SpellTag.tryRun(obj, {styleHint});
							// items > actions, as "Hide Armor" can be mis-tagged as "Hide"
							obj = ItemTag.tryRun(obj, {styleHint});
							obj = ActionTag.tryRunStrictCapsWords(obj, {styleHint});
							obj = TableTag.tryRun(obj, {styleHint});
							obj = TrapTag.tryRun(obj, {styleHint});
							obj = HazardTag.tryRun(obj, {styleHint});
							obj = ChanceTag.tryRun(obj, {styleHint});
							obj = QuickrefTag.tryRun(obj, {styleHint});
							// rules > dice, as "D20 Test" can be mis-tagged as a rollable dice
							obj = CoreRuleTag.tryRun(obj, {styleHint});
							obj = DiceConvert.getTaggedEntry(obj, {styleHint});
							obj = FeatTag.tryRun(obj, {styleHint});
							obj = AdventureBookTag.tryRun(obj, {styleHint});

							if (fnCreatureTagSpecific) obj = fnCreatureTagSpecific(obj);

							return obj;
						},
					},
				)._;
			});
	}

	/**
	 * @param json
	 * @param {?Set<string>} keySet
	 * @param {boolean} isOptimistic
	 * @param {"classic" | null} styleHint
	 */
	static mutTagObjectStrictCapsWords (json, {keySet = null, styleHint = null} = {}) {
		styleHint ||= VetoolsConfig.get("styleSwitcher", "style");

		Object.keys(json)
			.forEach(k => {
				if (keySet != null && !keySet.has(k)) return;

				json[k] = TagJsons.WALKER.walk(
					{_: json[k]},
					{
						object: (obj, lastKey) => {
							if (lastKey != null && !LAST_KEY_ALLOWLIST.has(lastKey)) return obj;

							obj = ItemTag.tryRunStrictCapsWords(obj, {styleHint});
							obj = SpellTag.tryRunStrictCapsWords(obj, {styleHint});

							return obj;
						},
					},
				)._;
			});
	}
}

TagJsons.OPTIMISTIC = true;

TagJsons._BLOCKLIST_FILE_PREFIXES = null;

TagJsons.WALKER_KEY_BLOCKLIST = new Set([
	...MiscUtil.GENERIC_WALKER_ENTRIES_KEY_BLOCKLIST,
]);

TagJsons.WALKER = MiscUtil.getWalker({
	keyBlocklist: TagJsons.WALKER_KEY_BLOCKLIST,
});

export class SpellTag extends ConverterTaggerInitializable {
	static _SPELL_NAMES = {};
	static _SPELL_NAMES_LEGACY = {};
	static _SPELL_NAME_REGEX = null;
	static _SPELL_NAME_REGEX_SPELL = null;
	static _SPELL_NAME_REGEX_AND = null;
	static _SPELL_NAME_REGEX_CAST = null;

	static _NON_STANDARD = new Set([
		// Skip "Divination" to avoid tagging occurrences of the school
		"Divination",
		// Skip spells we specifically handle
		"Antimagic Field",
		"Dispel Magic",
	].map(it => it.toLowerCase()));

	static async _pInit (spells) {
		spells
			.forEach(sp => {
				const tgt = SourceUtil.isClassicSource(sp.source) ? this._SPELL_NAMES_LEGACY : this._SPELL_NAMES;
				tgt[sp.name.toLowerCase()] = {name: sp.name, source: sp.source};
			});

		const spellNamesFiltered = [
			...Object.keys(this._SPELL_NAMES),
			...Object.keys(this._SPELL_NAMES_LEGACY),
		]
			.unique()
			.filter(n => !this._NON_STANDARD.has(n));

		this._SPELL_NAME_REGEX = new RegExp(`\\b(${spellNamesFiltered.map(it => it.escapeRegexp()).join("|")})\\b`, "gi");
		this._SPELL_NAME_REGEX_SPELL = new RegExp(`\\b(${spellNamesFiltered.map(it => it.escapeRegexp()).join("|")}) (spell|cantrip)`, "gi");
		this._SPELL_NAME_REGEX_AND = new RegExp(`\\b(${spellNamesFiltered.map(it => it.escapeRegexp()).join("|")}) (and {@spell)`, "gi");
		this._SPELL_NAME_REGEX_CAST = new RegExp(`(?<prefix>casts?(?: the(?: spell)?)? )(?<spell>${spellNamesFiltered.map(it => it.escapeRegexp()).join("|")})\\b`, "gi");
		this._SPELL_NAME_REGEX_STRICT = new RegExp(`^(${Object.values(this._SPELL_NAMES).map(it => it.name.escapeRegexp()).join("|")})$`, "g");
	}

	static _tryRun (ent, {styleHint = null, blocklistNames = null} = {}) {
		styleHint ||= VetoolsConfig.get("styleSwitcher", "style");

		if (blocklistNames) blocklistNames = blocklistNames.getWithBlocklistIgnore([ent.name]);

		return TagJsons.WALKER.walk(
			ent,
			{
				string: (str) => {
					const ptrStack = {_: ""};
					TaggerUtils.walkerStringHandler(
						["@spell"],
						ptrStack,
						0,
						0,
						str,
						{
							fnTag: (strMod) => this._fnTag({strMod, styleHint, blocklistNames}),
						},
					);
					return ptrStack._;
				},
			},
		);
	}

	static _getSpellMeta ({name, styleHint}) {
		name = name.toLowerCase();
		if (styleHint === SITE_STYLE__ONE && this._SPELL_NAMES[name]) return this._SPELL_NAMES[name];
		return this._SPELL_NAMES_LEGACY[name];
	}

	static _fnTag ({strMod, styleHint, blocklistNames}) {
		if (TagJsons.OPTIMISTIC) {
			strMod = strMod
				.replace(this._SPELL_NAME_REGEX_SPELL, (...m) => {
					const spellMeta = this._getSpellMeta({name: m[1], styleHint});
					if (!spellMeta) return m[0];
					if (blocklistNames?.isBlocked(spellMeta.name)) return m[0];
					return `{@spell ${m[1]}${spellMeta.source !== Parser.SRC_PHB ? `|${spellMeta.source}` : ""}} ${m[2]}`;
				});
		}

		// Tag common spells which often don't have e.g. the word "spell" nearby
		strMod = strMod
			.replace(/\b(antimagic field|dispel magic)\b/gi, (...m) => {
				const spellMeta = this._getSpellMeta({name: m[1], styleHint});
				if (!spellMeta) return m[0];
				if (blocklistNames?.isBlocked(spellMeta.name)) return m[0];
				return `{@spell ${m[1]}${spellMeta.source !== Parser.SRC_PHB ? `|${spellMeta.source}` : ""}}`;
			});

		strMod = strMod
			.replace(this._SPELL_NAME_REGEX_CAST, (...m) => {
				const spellMeta = this._getSpellMeta({name: m.last().spell, styleHint});
				if (!spellMeta) return m[0];
				if (blocklistNames?.isBlocked(spellMeta.name)) return m[0];
				return `${m.last().prefix}{@spell ${m.last().spell}${spellMeta.source !== Parser.SRC_PHB ? `|${spellMeta.source}` : ""}}`;
			});

		return strMod
			.replace(this._SPELL_NAME_REGEX_AND, (...m) => {
				const spellMeta = this._getSpellMeta({name: m[1], styleHint});
				if (!spellMeta) return m[0];
				if (blocklistNames?.isBlocked(spellMeta.name)) return m[0];
				return `{@spell ${m[1]}${spellMeta.source !== Parser.SRC_PHB ? `|${spellMeta.source}` : ""}} ${m[2]}`;
			})
			.replace(/(spells(?:|[^.!?:{]*): )([^.!?]+)/gi, (...mOuter) => {
				const spellPart = mOuter[2].replace(this._SPELL_NAME_REGEX, (...m) => {
					const spellMeta = this._getSpellMeta({name: m[1], styleHint});
					if (!spellMeta) return m[0];
					if (blocklistNames?.isBlocked(spellMeta.name)) return m[0];
					return `{@spell ${m[1]}${spellMeta.source !== Parser.SRC_PHB ? `|${spellMeta.source}` : ""}}`;
				});
				return `${mOuter[1]}${spellPart}`;
			})
			.replace(this._SPELL_NAME_REGEX_CAST, (...m) => {
				const spellMeta = this._getSpellMeta({name: m.last().spell, styleHint});
				if (!spellMeta) return m[0];
				if (blocklistNames?.isBlocked(spellMeta.name)) return m[0];
				return `${m.last().prefix}{@spell ${m.last().spell}${spellMeta.source !== Parser.SRC_PHB ? `|${spellMeta.source}` : ""}}`;
			})
		;
	}

	/* -------------------------------------------- */

	static _tryRunStrictCapsWords (ent, {styleHint = null, blocklistNames = null} = {}) {
		styleHint ||= VetoolsConfig.get("styleSwitcher", "style");

		if (blocklistNames) blocklistNames = blocklistNames.getWithBlocklistIgnore([ent.name]);

		return TagJsons.WALKER.walk(
			ent,
			{
				string: (str) => {
					const ptrStack = {_: ""};
					TaggerUtils.walkerStringHandlerStrictCapsWords(
						["@spell"],
						ptrStack,
						str,
						{
							fnTag: (strMod) => this._fnTagStrict({strMod, styleHint, blocklistNames}),
						},
					);
					return ptrStack._
						.replace(/{@spell (Resistance)\|XPHB}( to)/g, "$1$2")
						.replace(/(bypasses ){@spell (Resistance)\|XPHB}/g, "$1$2")

						.replace(/{@spell (Darkvision)\|XPHB}( can't| \d+ (?:ft\.|feet))/g, "$1$2")

						.replace(/(Dim Light or ){@spell (Darkness)\|XPHB}/g, "$1$2")
						.replace(/(magical ){@spell (Darkness)\|XPHB}/g, "$1$2")

						.replace(/{@spell (Fly)\|XPHB}( \d+ (?:ft\.|feet))/g, "$1$2")
					;
				},
			},
		);
	}

	static _fnTagStrict ({strMod, styleHint, blocklistNames}) {
		const mBase = strMod.match(this._SPELL_NAME_REGEX_STRICT);
		if (mBase?.length) {
			const [strMatch] = mBase;
			const spellMeta = this._getSpellMeta({name: strMatch, styleHint});
			if (!spellMeta) return strMatch;
			if (blocklistNames?.isBlocked(spellMeta.name)) return strMatch;
			return `{@spell ${strMatch}|${spellMeta.source}}`;
		}

		// Split title-case runs on lowercase conjunctions/etc., as we may have e.g.:
		//   - "Fireball or Counterspell"
		//   - "replace one Fireball with Hold Monster" (Pit Fiend; XMM)
		const pts = strMod
			.split(/(,? (?:and|or|with) |, )/g)
			.map(it => it.trim())
			.filter(Boolean);
		if (pts.length === 1) return strMod;

		return pts
			.map(pt => {
				return pt
					.replace(this._SPELL_NAME_REGEX_STRICT, (...m) => {
						const spellMeta = this._getSpellMeta({name: m[1], styleHint});
						if (!spellMeta) return m[0];
						if (blocklistNames?.isBlocked(spellMeta.name)) return m[0];
						return `{@spell ${m[1]}|${spellMeta.source}}`;
					});
			})
			.join(" ");
	}
}

export class ItemTag extends ConverterTaggerInitializable {
	static _WALKER = MiscUtil.getWalker({
		keyBlocklist: new Set([
			...TagJsons.WALKER_KEY_BLOCKLIST,
			"packContents", // Avoid tagging item pack contents
			"items", // Avoid tagging item group item lists
		]),
	});

	static async _pInit () {
		const itemArr = await Renderer.item.pBuildList();
		const standardItems = itemArr.filter(it => !SourceUtil.isNonstandardSource(it.source));
		const [standardItemsClassic, standardItemsOne] = standardItems.segregate(ent => SourceUtil.isClassicSource(ent.source));

		const itemProperties = await DataLoader.pCacheAndGetAllSite("itemProperty");
		const standardItemProperties = itemProperties.filter(it => !SourceUtil.isNonstandardSource(it.source));
		const [standardItemPropertiesClassic, standardItemPropertiesOne] = standardItemProperties.segregate(ent => SourceUtil.isClassicSource(ent.source));

		await this._pInit_one({standardItems: standardItemsOne, standardProperties: standardItemPropertiesOne});
		await this._pInit_classic({standardItems: standardItemsClassic, standardProperties: standardItemPropertiesClassic});
	}

	static _ITEM_NAMES__ONE = {};
	static _ITEM_PROPERTY_NAMES__ONE = {};
	static _ITEM_NAMES_REGEX_TOOLS__ONE = null;
	static ITEM_NAMES_REGEX_OTHER__ONE = null;
	static _ITEM_NAMES_REGEX_EQUIPMENT__ONE = null;
	static _ITEM_NAMES_REGEX_STRICT__ONE = null;
	static _ITEM_PROPERTY_REGEX__ONE = null;

	static async _pInit_one ({standardItems, standardProperties}) {
		await this._pInit_generic({
			standardItems,
			standardProperties,
			lookupItemNames: this._ITEM_NAMES__ONE,
			lookupItemPropertyNames: this._ITEM_PROPERTY_NAMES__ONE,
			propItemNamesRegexTools: "_ITEM_NAMES_REGEX_TOOLS__ONE",
			propItemNamesRegexOther: "ITEM_NAMES_REGEX_OTHER__ONE",
			propItemNamesRegexEquipment: "_ITEM_NAMES_REGEX_EQUIPMENT__ONE",
			propItemNamesRegexStrict: "_ITEM_NAMES_REGEX_STRICT__ONE",
			propItemPropertyNamesRegex: "_ITEM_PROPERTY_REGEX__ONE",
			srcPhb: Parser.SRC_XPHB,
		});
	}

	static _ITEM_NAMES__CLASSIC = {};
	static _ITEM_PROPERTY_NAMES__CLASSIC = {};
	static _ITEM_NAMES_REGEX_TOOLS__CLASSIC = null;
	static ITEM_NAMES_REGEX_OTHER__CLASSIC = null;
	static _ITEM_NAMES_REGEX_EQUIPMENT__CLASSIC = null;
	static _ITEM_PROPERTY_REGEX__CLASSIC = null;

	static async _pInit_classic ({standardItems, standardProperties}) {
		await this._pInit_generic({
			standardItems,
			standardProperties,
			lookupItemNames: this._ITEM_NAMES__CLASSIC,
			lookupItemPropertyNames: this._ITEM_PROPERTY_NAMES__CLASSIC,
			propItemNamesRegexTools: "_ITEM_NAMES_REGEX_TOOLS__CLASSIC",
			propItemNamesRegexOther: "ITEM_NAMES_REGEX_OTHER__CLASSIC",
			propItemNamesRegexEquipment: "_ITEM_NAMES_REGEX_EQUIPMENT__CLASSIC",
			propItemPropertyNamesRegex: "_ITEM_PROPERTY_REGEX__CLASSIC",
			srcPhb: Parser.SRC_PHB,
		});
	}

	static _TOOL_TYPES = new Set([
		Parser.ITM_TYP_ABV__ARTISAN_TOOL,
		Parser.ITM_TYP_ABV__GAMING_SET,
		Parser.ITM_TYP_ABV__INSTRUMENT,
		Parser.ITM_TYP_ABV__TOOL,
	]);

	static _NON_EQUIPMENT_TYPES = new Set([
		Parser.ITM_TYP_ABV__MELEE_WEAPON,
		Parser.ITM_TYP_ABV__RANGED_WEAPON,
		Parser.ITM_TYP_ABV__LIGHT_ARMOR,
		Parser.ITM_TYP_ABV__MEDIUM_ARMOR,
		Parser.ITM_TYP_ABV__HEAVY_ARMOR,
		Parser.ITM_TYP_ABV__SHIELD,
	]);

	static _pInit_generic (
		{
			standardItems,
			standardProperties,
			lookupItemNames,
			lookupItemPropertyNames,
			propItemNamesRegexTools,
			propItemNamesRegexOther,
			propItemNamesRegexEquipment,
			propItemNamesRegexStrict,
			propItemPropertyNamesRegex,
			srcPhb,
		},
	) {
		if (!standardItems.length) return;

		// region Tools
		const tools = standardItems.filter(it => it.type && this._TOOL_TYPES.has(DataUtil.itemType.unpackUid(it.type).abbreviation) && it.name !== "Horn");
		tools.forEach(tool => {
			lookupItemNames[tool.name.toLowerCase()] = {name: tool.name, source: tool.source};
		});

		if (tools.length) this[propItemNamesRegexTools] = new RegExp(`\\b(${tools.map(it => it.name.escapeRegexp()).join("|")})\\b`, "gi");
		// endregion

		// region Other items
		const otherItems = standardItems
			.filter(it => {
				if (it.type && this._TOOL_TYPES.has(DataUtil.itemType.unpackUid(it.type).abbreviation)) return false;
				// Disallow specific items
				if (it.name === "Wave" && [Parser.SRC_DMG, Parser.SRC_XDMG].includes(it.source)) return false;
				// Allow all non-specific-variant DMG items
				if (it.source === Parser.SRC_DMG && it.source === Parser.SRC_XDMG && !Renderer.item.isMundane(it) && it._category !== "Specific Variant") return true;
				// Allow "sufficiently complex name" items
				return it.name.split(" ").length > 2;
			})
			// Prefer specific variants first, as they have longer names
			.sort((itemA, itemB) => Number(itemB._category === "Specific Variant") - Number(itemA._category === "Specific Variant") || SortUtil.ascSortLower(itemA.name, itemB.name))
		;
		otherItems.forEach(it => {
			lookupItemNames[it.name.toLowerCase()] = {name: it.name, source: it.source};
		});

		if (otherItems.length) this[propItemNamesRegexOther] = new RegExp(`\\b(${otherItems.map(it => it.name.escapeRegexp()).join("|")})\\b`, "gi");
		// endregion

		// region Basic equipment
		// (Has some overlap with others)
		const itemsEquipment = standardItems
			.filter(itm => itm.source === srcPhb && (!itm.type || !this._NON_EQUIPMENT_TYPES.has(DataUtil.itemType.unpackUid(itm.type).abbreviation)));
		if (itemsEquipment.length) this[propItemNamesRegexEquipment] = new RegExp(`\\b(${itemsEquipment.map(it => it.name.escapeRegexp()).join("|")})\\b`, "gi");
		itemsEquipment.forEach(itm => lookupItemNames[itm.name.toLowerCase()] = {name: itm.name, source: itm.source});
		// endregion

		// region Strict naming
		if (propItemNamesRegexStrict) {
			this[propItemNamesRegexStrict] = new RegExp(`^(${standardItems.map(it => it.name.escapeRegexp()).join("|")})$`, "gi");
			standardItems.forEach(itm => lookupItemNames[itm.name.toLowerCase()] = {name: itm.name, source: itm.source});
		}
		// endregion

		// region Item properties
		standardProperties.forEach(ent => {
			const name = Renderer.item.getPropertyName(ent);
			lookupItemPropertyNames[name.toLowerCase()] = {abbreviation: ent.abbreviation, source: ent.source};
		});

		if (standardProperties.length) this[propItemPropertyNamesRegex] = new RegExp(`the (${standardProperties.map(ent => Renderer.item.getPropertyName(ent).escapeRegexp()).join("|")}) property`, "gi");
		// endregion
	}

	/* -------------------------------------------- */

	/**
	 * @param ent
	 * @param {"classic" | "one" | null} styleHint
	 */
	static _tryRun (ent, {styleHint = null} = {}) {
		styleHint ||= VetoolsConfig.get("styleSwitcher", "style");

		return this._WALKER.walk(
			ent,
			{
				string: (str) => {
					const ptrStack = {_: ""};

					if (styleHint === SITE_STYLE__ONE) {
						TaggerUtils.walkerStringHandler(
							["@item"],
							ptrStack,
							0,
							0,
							str,
							{
								fnTag: this._fnTag_one.bind(this),
							},
						);

						str = ptrStack._;
						ptrStack._ = "";
					}

					TaggerUtils.walkerStringHandler(
						["@item"],
						ptrStack,
						0,
						0,
						str,
						{
							fnTag: this._fnTag_classic.bind(this),
						},
					);

					str = ptrStack._;
					ptrStack._ = "";

					if (styleHint === SITE_STYLE__ONE) {
						TaggerUtils.walkerStringHandler(
							["@itemProperty"],
							ptrStack,
							0,
							0,
							str,
							{
								fnTag: this._fnTag_one_properties.bind(this),
							},
						);

						str = ptrStack._;
						ptrStack._ = "";
					}

					TaggerUtils.walkerStringHandler(
						["@itemProperty"],
						ptrStack,
						0,
						0,
						str,
						{
							fnTag: this._fnTag_classic_properties.bind(this),
						},
					);

					return ptrStack._;
				},
			},
		);
	}

	static _fnTag_one (strMod) {
		if (this._ITEM_NAMES_REGEX_TOOLS__ONE != null) {
			strMod = strMod
				.replace(this._ITEM_NAMES_REGEX_TOOLS__ONE, (...m) => {
					const itemMeta = this._ITEM_NAMES__ONE[m[1].toLowerCase()];
					return `{@item ${m[1]}|${itemMeta.source}}`;
				});
		}

		if (this.ITEM_NAMES_REGEX_OTHER__ONE != null) {
			strMod = strMod
				.replace(this.ITEM_NAMES_REGEX_OTHER__ONE, (...m) => {
					const itemMeta = this._ITEM_NAMES__ONE[m[1].toLowerCase()];
					return `{@item ${m[1]}|${itemMeta.source}}`;
				});
		}

		return strMod;
	}

	static _fnTag_classic (strMod) {
		if (this._ITEM_NAMES_REGEX_TOOLS__CLASSIC != null) {
			strMod = strMod
				.replace(this._ITEM_NAMES_REGEX_TOOLS__CLASSIC, (...m) => {
					const itemMeta = this._ITEM_NAMES__CLASSIC[m[1].toLowerCase()];
					return `{@item ${m[1]}${itemMeta.source !== Parser.SRC_DMG ? `|${itemMeta.source}` : ""}}`;
				});
		}

		if (this.ITEM_NAMES_REGEX_OTHER__CLASSIC != null) {
			strMod = strMod
				.replace(this.ITEM_NAMES_REGEX_OTHER__CLASSIC, (...m) => {
					const itemMeta = this._ITEM_NAMES__CLASSIC[m[1].toLowerCase()];
					return `{@item ${m[1]}${itemMeta.source !== Parser.SRC_DMG ? `|${itemMeta.source}` : ""}}`;
				});
		}

		return strMod;
	}

	static _fnTag_one_properties (strMod) {
		if (this._ITEM_PROPERTY_REGEX__ONE != null) {
			strMod = strMod
				.replace(this._ITEM_PROPERTY_REGEX__ONE, (...m) => {
					const meta = this._ITEM_PROPERTY_NAMES__ONE[m[1].toLowerCase()];
					return `{@itemProperty ${meta.abbreviation}|${meta.source}|${m[1]}}`;
				});
		}

		return strMod;
	}

	static _fnTag_classic_properties (strMod) {
		if (this._ITEM_PROPERTY_REGEX__CLASSIC != null) {
			strMod = strMod
				.replace(this._ITEM_PROPERTY_REGEX__CLASSIC, (...m) => {
					const meta = this._ITEM_PROPERTY_NAMES__CLASSIC[m[1].toLowerCase()];
					return `{@itemProperty ${meta.abbreviation}${meta.source !== Parser.SRC_PHB ? `|${meta.source}` : ""}|${m[1]}}`;
				});
		}

		return strMod;
	}

	/* -------------------------------------------- */

	static tryRunBasicEquipment (ent, {styleHint = null} = {}) {
		if (!this._IS_INIT) throw new Error("Not initialized!");

		styleHint ||= VetoolsConfig.get("styleSwitcher", "style");

		return this._WALKER.walk(
			ent,
			{
				string: (str) => {
					const ptrStack = {_: ""};

					if (styleHint === SITE_STYLE__ONE) {
						TaggerUtils.walkerStringHandler(
							["@item"],
							ptrStack,
							0,
							0,
							str,
							{
								fnTag: this._fnTagBasicEquipment_one.bind(this),
							},
						);

						str = ptrStack._;
						ptrStack._ = "";
					}

					TaggerUtils.walkerStringHandler(
						["@item"],
						ptrStack,
						0,
						0,
						str,
						{
							fnTag: this._fnTagBasicEquipment_classic.bind(this),
						},
					);
					return ptrStack._;
				},
			},
		);
	}

	static _fnTagBasicEquipment_one (strMod) {
		if (this._ITEM_NAMES_REGEX_EQUIPMENT__ONE == null) return strMod;

		return strMod
			.replace(this._ITEM_NAMES_REGEX_EQUIPMENT__ONE, (...m) => {
				const itemMeta = this._ITEM_NAMES__ONE[m[1].toLowerCase()];
				return `{@item ${m[1]}|${itemMeta.source}}`;
			})
		;
	}

	static _fnTagBasicEquipment_classic (strMod) {
		if (this._ITEM_NAMES_REGEX_EQUIPMENT__CLASSIC == null) return strMod;

		return strMod
			.replace(this._ITEM_NAMES_REGEX_EQUIPMENT__CLASSIC, (...m) => {
				const itemMeta = this._ITEM_NAMES__CLASSIC[m[1].toLowerCase()];
				return `{@item ${m[1]}${itemMeta.source !== Parser.SRC_DMG ? `|${itemMeta.source}` : ""}}`;
			})
		;
	}

	/* -------------------------------------------- */

	static _tryRunStrictCapsWords (ent) {
		return TagJsons.WALKER.walk(
			ent,
			{
				string: (str) => {
					const ptrStack = {_: ""};
					TaggerUtils.walkerStringHandlerStrictCapsWords(
						["@item"],
						ptrStack,
						str,
						{
							fnTag: (strMod) => this._fnTagStrict({strMod}),
						},
					);
					return ptrStack._;
				},
			},
		);
	}

	static _fnTagStrict ({strMod}) {
		return strMod
			.replace(this._ITEM_NAMES_REGEX_STRICT__ONE, (...m) => {
				const itemMeta = this._ITEM_NAMES__ONE[m[1].toLowerCase()];
				return `{@item ${m[1]}|${itemMeta.source}}`;
			});
	}
}

export class TableTag {
	static tryRun (it) {
		return TagJsons.WALKER.walk(
			it,
			{
				string: (str) => {
					const ptrStack = {_: ""};
					TaggerUtils.walkerStringHandler(
						["@table"],
						ptrStack,
						0,
						0,
						str,
						{
							fnTag: this._fnTag.bind(this),
						},
					);
					return ptrStack._;
				},
			},
		);
	}

	static _fnTag (strMod) {
		return strMod
			.replace(/Wild Magic Surge table/g, `{@table Wild Magic Surge|PHB} table`)
		;
	}
}

export class TrapTag {
	static tryRun (it) {
		return TagJsons.WALKER.walk(
			it,
			{
				string: (str) => {
					const ptrStack = {_: ""};
					TaggerUtils.walkerStringHandler(
						["@trap"],
						ptrStack,
						0,
						0,
						str,
						{
							fnTag: this._fnTag.bind(this),
						},
					);
					return ptrStack._;
				},
			},
		);
	}

	static _fnTag (strMod) {
		return strMod
			.replace(TrapTag._RE_TRAP_SEE, (...m) => `{@trap ${m[1]}}${m[2]}`)
		;
	}
}
TrapTag._RE_TRAP_SEE = /\b(Fire-Breathing Statue|Sphere of Annihilation|Collapsing Roof|Falling Net|Pits|Poison Darts|Poison Needle|Rolling Sphere)( \(see)/gi;

export class HazardTag extends ConverterTaggerInitializable {
	static _RE_BASIC_XPHB = null;
	static _RE_HAZARD_SEE = /\b(?<name>High Altitude|Brown Mold|Green Slime|Webs|Yellow Mold|Extreme Cold|Extreme Heat|Heavy Precipitation|Strong Wind|Desecrated Ground|Frigid Water|Quicksand|Razorvine|Slippery Ice|Thin Ice)(?<suffix> \(see)/gi;

	static async _pInit () {
		const hazardData = await DataLoader.pCacheAndGetAllSite("hazard");

		const coreHazards = [...hazardData]
			.filter(ent => ent.source === Parser.SRC_XPHB);

		this._RE_BASIC_XPHB = new RegExp(`\\b(?<name>${(coreHazards.map(ent => ent.name).join("|"))})\\b`, "g");
	}

	/**
	 * @param ent
	 * @param {"classic" | "one" | null} styleHint
	 */
	static _tryRun (ent, {styleHint = null} = {}) {
		styleHint ||= VetoolsConfig.get("styleSwitcher", "style");

		return TagJsons.WALKER.walk(
			ent,
			{
				string: (str) => {
					const ptrStack = {_: ""};

					if (styleHint === SITE_STYLE__ONE) {
						TaggerUtils.walkerStringHandler(
							["@hazard"],
							ptrStack,
							0,
							0,
							str,
							{
								fnTag: this._fnTag_one.bind(this),
							},
						);

						str = ptrStack._;
						ptrStack._ = "";
					}

					TaggerUtils.walkerStringHandler(
						["@hazard"],
						ptrStack,
						0,
						0,
						str,
						{
							fnTag: this._fnTag_classic.bind(this),
						},
					);

					return ptrStack._;
				},
			},
		);
	}

	static _fnTag_one (strMod) {
		return strMod
			.replace(this._RE_BASIC_XPHB, (...m) => `{@hazard ${m.at(-1).name}|${Parser.SRC_XPHB}}`)
		;
	}

	static _fnTag_classic (strMod) {
		return strMod
			.replace(HazardTag._RE_HAZARD_SEE, (...m) => {
				const {name, suffix} = m.at(-1);
				return `{@hazard ${name}}${suffix}`;
			})
		;
	}
}

export class CreatureTag {
	/**
	 * Dynamically create a walker which can be re-used.
	 */
	static getFnTryRunSpecific (creaturesToTag) {
		if (!creaturesToTag?.length) return null;

		// region Create a regular expression per source
		const bySource = {};
		creaturesToTag.forEach(({name, source}) => {
			(bySource[source] = bySource[source] || []).push(name);
		});
		const res = Object.entries(bySource)
			.mergeMap(([source, names]) => {
				const re = new RegExp(`\\b(${names.map(it => it.escapeRegexp()).join("|")})\\b`, "gi");
				return {[source]: re};
			});
		// endregion

		const fnTag = strMod => {
			Object.entries(res)
				.forEach(([source, re]) => {
					strMod = strMod.replace(re, (...m) => `{@creature ${m[0]}${source !== Parser.SRC_MM ? `|${source}` : ""}}`);
				});
			return strMod;
		};

		return (it) => {
			return TagJsons.WALKER.walk(
				it,
				{
					string: (str) => {
						const ptrStack = {_: ""};
						TaggerUtils.walkerStringHandler(
							["@creature"],
							ptrStack,
							0,
							0,
							str,
							{
								fnTag,
							},
						);
						return ptrStack._;
					},
				},
			);
		};
	}
}

export class ChanceTag {
	static tryRun (it) {
		return TagJsons.WALKER.walk(
			it,
			{
				string: (str) => {
					const ptrStack = {_: ""};
					TaggerUtils.walkerStringHandler(
						["@chance"],
						ptrStack,
						0,
						0,
						str,
						{
							fnTag: this._fnTag.bind(this),
						},
					);
					return ptrStack._;
				},
			},
		);
	}

	static _fnTag (strMod) {
		return strMod
			.replace(/\b(?<pct>\d+)(?: percent)(?<suffix> chance)/g, (...m) => `{@chance ${m.at(-1).pct}}${m.at(-1).suffix}`)
		;
	}
}

export class QuickrefTag {
	static tryRun (ent, {styleHint = null} = {}) {
		// Avoid tagging; we expect these to be tagged as core rules
		if (styleHint === SITE_STYLE__ONE) return ent;

		return TagJsons.WALKER.walk(
			ent,
			{
				string: (str) => {
					const ptrStack = {_: ""};
					TaggerUtils.walkerStringHandler(
						["@quickref"],
						ptrStack,
						0,
						0,
						str,
						{
							fnTag: this._fnTag.bind(this),
						},
					);
					return ptrStack._;
				},
			},
		);
	}

	static _fnTag (strMod) {
		return strMod
			.replace(QuickrefTag._RE_BASIC, (...m) => `{@quickref ${QuickrefTag._LOOKUP_BASIC[m[0].toLowerCase()]}}`)
			.replace(QuickrefTag._RE_VISION, (...m) => `{@quickref ${QuickrefTag._LOOKUP_VISION[m[0].toLowerCase()]}||${m[0]}}`)
			.replace(QuickrefTag._RE_COVER, (...m) => `{@quickref ${QuickrefTag._LOOKUP_COVER[m[0].toLowerCase()]}||${m[0]}}`)
		;
	}
}
QuickrefTag._RE_BASIC = /\b([Dd]ifficult [Tt]errain|Vision and Light)\b/g;
QuickrefTag._RE_VISION = /\b(dim light|bright light|lightly obscured|heavily obscured)\b/gi;
QuickrefTag._RE_COVER = /\b(half cover|three-quarters cover|total cover)\b/gi;
QuickrefTag._LOOKUP_BASIC = {
	"difficult terrain": "difficult terrain||3",
	"vision and light": "Vision and Light||2",
};
QuickrefTag._LOOKUP_VISION = {
	"bright light": "Vision and Light||2",
	"dim light": "Vision and Light||2",
	"lightly obscured": "Vision and Light||2",
	"heavily obscured": "Vision and Light||2",
};
QuickrefTag._LOOKUP_COVER = {
	"half cover": "Cover||3",
	"three-quarters cover": "Cover||3",
	"total cover": "Cover||3",
};

export class CoreRuleTag extends ConverterTaggerInitializable {
	static _RE_BASIC_XPHB = null;
	static _BLOCKLIST_XPHB = new Set([
		"Target",
		"Monster",
		"Weapon",
		"Spell",
		"Illusions",
	]);
	static _LOOKUP_XPHB = {};

	static async _pInit () {
		const variantruleData = await DataUtil.variantrule.loadJSON();

		const coreRules = [...variantruleData.variantrule]
			.filter(rule => SourceUtil.getEntitySource(rule) === Parser.SRC_XPHB && rule.ruleType === "C" && !this._BLOCKLIST_XPHB.has(rule.name))
			.map(rule => ({
				...MiscUtil.copyFast(rule),
				_sortWeight: rule.name.countSubstring(" "),
			}))
			.sort((a, b) => SortUtil.ascSort(b._sortWeight, a._sortWeight));

		coreRules
			.forEach(rule => {
				this._LOOKUP_XPHB[rule.name] = rule;

				const nameNoSquareBrackets = rule.name.replace(/ \[[^\]]]+$/, "").trim();
				const nameNoPlural = rule.name.replace(/s$/, "").trim();

				this._LOOKUP_XPHB[nameNoSquareBrackets] = rule;
				this._LOOKUP_XPHB[nameNoPlural] = rule;
			});

		this._RE_BASIC_XPHB = new RegExp(`\\b(?<ruleName>${(Object.keys(this._LOOKUP_XPHB).join("|"))})\\b`, "g");
	}

	static _tryRun (it, {styleHint = null} = {}) {
		if (styleHint === SITE_STYLE__CLASSIC) return it;

		return TagJsons.WALKER.walk(
			it,
			{
				string: (str) => {
					const ptrStack = {_: ""};
					TaggerUtils.walkerStringHandler(
						["@variantrule"],
						ptrStack,
						0,
						0,
						str,
						{
							fnTag: this._fnTag.bind(this),
						},
					);
					return ptrStack._
						.replace(/{@dice D20} Test(?<plural>s?)/g, (...m) => `{@variantrule D20 Test|XPHB${m.at(-1).plural ? `|D20 Tests` : ""}}`)
					;
				},
			},
		);
	}

	static _fnTag (strMod) {
		return strMod
			.replace(this._RE_BASIC_XPHB, (...m) => {
				const {ruleName} = m.at(-1);
				const rule = this._LOOKUP_XPHB[ruleName];
				if (ruleName === rule.name) return `{@variantrule ${ruleName}|${Parser.SRC_XPHB}}`;
				return `{@variantrule ${rule.name}|${Parser.SRC_XPHB}|${ruleName}}`;
			})
			.replace(/{@variantrule Proficiency\|XPHB} Bonus/g, (...m) => {
				return `{@variantrule Proficiency|XPHB|Proficiency Bonus}`;
			})
			.replace(/Short or {@variantrule Long Rest\|XPHB}/g, (...m) => {
				return `{@variantrule Short Rest|XPHB|Short} or {@variantrule Long Rest|XPHB}`;
			})
			.replace(/(Half|Three-Quarters|Total) {@variantrule Cover\|XPHB}/g, (...m) => {
				return `{@variantrule Cover|XPHB|${m[1]} Cover}`;
			})
			.replace(/\b(Cone|Cube|Cylinder|Emanation|Line|Sphere)\b/g, (...m) => {
				return `{@variantrule ${m[1]} [Area of Effect]|XPHB|${m[1]}}`;
			})
			.replace(/\b(Friendly|Hostile|Indifferent)\b/g, (...m) => {
				return `{@variantrule ${m[1]} [Attitude]|XPHB|${m[1]}}`;
			})
			.replace(/\b(Legendary) {@variantrule Action\|XPHB}/g, "$1 Action")
			.replace(/{@variantrule Flying\|XPHB} (Sword)/g, "Flying $1")
		;
	}
}

export class FeatTag extends ConverterTaggerInitializable {
	static _FEAT_LOOKUP = [];

	static async _pInit () {
		const featData = await DataUtil.feat.loadJSON();
		const [featsNonStandard, feats] = [...featData.feat]
			.sort((a, b) => SortUtil.ascSortDateString(Parser.sourceJsonToDate(a.source), Parser.sourceJsonToDate(b.source)) || SortUtil.ascSortLower(a.name, b.name) || SortUtil.ascSortLower(a.source, b.source))
			.segregate(feat => SourceUtil.isNonstandardSource(feat.source));
		this._FEAT_LOOKUP = [
			...feats,
			...featsNonStandard,
		]
			.map(feat => ({searchName: feat.name.toLowerCase(), feat}));
	}

	static _tryRun (it) {
		return TagJsons.WALKER.walk(
			it,
			{
				string: (str) => {
					const ptrStack = {_: ""};
					TaggerUtils.walkerStringHandler(
						["@feat"],
						ptrStack,
						0,
						0,
						str,
						{
							fnTag: this._fnTag.bind(this),
						},
					);
					return ptrStack._;
				},
			},
		);
	}

	static _fnTag (strMod) {
		return strMod
			.replace(/(?<pre>\bgain the )(?<name>.*)(?<post> feat\b)/, (...m) => {
				const {pre, post, name} = m.at(-1);
				const feat = this._getFeat(name);
				if (!feat) return m[0];
				const uid = DataUtil.proxy.getUid("feat", feat, {isMaintainCase: true});
				const [uidName, ...uidRest] = uid.split("|");

				// Tag display name not expected
				if (name.toLowerCase() !== uidName.toLowerCase()) throw new Error(`Unimplemented!`);

				const uidFinal = [
					name,
					...uidRest,
				]
					.join("|");
				return `${pre}{@feat ${uidFinal}}${post}`;
			})
		;
	}

	static _getFeat (name) {
		const searchName = name.toLowerCase().trim();
		const featMeta = this._FEAT_LOOKUP.find(it => it.searchName === searchName);
		if (!featMeta) return null;
		return featMeta.feat;
	}
}

export class AdventureBookTag extends ConverterTaggerInitializable {
	static _ADVENTURE_RES = [];
	static _BOOK_RES = [];

	static async _pInit () {
		for (const meta of [
			{
				propRes: "_ADVENTURE_RES",
				propData: "adventure",
				tag: "adventure",
				contentsUrl: `${Renderer.get().baseUrl}data/adventures.json`,
			},
			{
				propRes: "_BOOK_RES",
				propData: "book",
				tag: "book",
				contentsUrl: `${Renderer.get().baseUrl}data/books.json`,
			},
		]) {
			const contents = await DataUtil.loadJSON(meta.contentsUrl);

			this[meta.propRes] = contents[meta.propData]
				.map(({name, id}) => {
					const re = new RegExp(`\\b${name.escapeRegexp()}\\b`, "g");
					return str => str.replace(re, (...m) => `{@${meta.tag} ${m[0]}|${id}}`);
				});
		}
	}

	static _tryRun (it) {
		return TagJsons.WALKER.walk(
			it,
			{
				string: (str) => {
					const ptrStack = {_: ""};
					TaggerUtils.walkerStringHandler(
						["@adventure", "@book"],
						ptrStack,
						0,
						0,
						str,
						{
							fnTag: this._fnTag.bind(this),
						},
					);
					return ptrStack._;
				},
			},
		);
	}

	static _fnTag (strMod) {
		for (const arr of [this._ADVENTURE_RES, this._BOOK_RES]) {
			strMod = arr.reduce((str, fn) => fn(str), strMod);
		}
		return strMod;
	}
}
