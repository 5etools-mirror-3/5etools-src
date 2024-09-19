import {ActionTag, DiceConvert, SenseTag, SkillTag, TagCondition, TaggerUtils} from "./converterutils-tags.js";
import {VetoolsConfig} from "../utils-config/utils-config-config.js";
import {ConverterTaggerInitializable} from "./converterutils-taggerbase.js";

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
		await SpellTag.pInit(spells);
		await ItemTag.pInit();
		await FeatTag.pInit();
		await AdventureBookTag.pInit();
	}

	/**
	 * @param json
	 * @param {?Set<string>} keySet
	 * @param {boolean} isOptimistic
	 * @param {?Array<object>} creaturesToTag
	 * @param {"classic" | null} styleHint
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
							obj = SkillTag.tryRun(obj, {styleHint});
							obj = ActionTag.tryRun(obj, {styleHint});
							obj = SenseTag.tryRun(obj, {styleHint});
							obj = SpellTag.tryRun(obj, {styleHint});
							obj = ItemTag.tryRun(obj, {styleHint});
							obj = TableTag.tryRun(obj, {styleHint});
							obj = TrapTag.tryRun(obj, {styleHint});
							obj = HazardTag.tryRun(obj, {styleHint});
							obj = ChanceTag.tryRun(obj, {styleHint});
							obj = DiceConvert.getTaggedEntry(obj, {styleHint});
							obj = QuickrefTag.tryRun(obj, {styleHint});
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

							// TODO(Future)

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
			.forEach(sp => this._SPELL_NAMES[sp.name.toLowerCase()] = {name: sp.name, source: sp.source});

		const spellNamesFiltered = Object.keys(this._SPELL_NAMES)
			.filter(n => !this._NON_STANDARD.has(n));

		this._SPELL_NAME_REGEX = new RegExp(`\\b(${spellNamesFiltered.map(it => it.escapeRegexp()).join("|")})\\b`, "gi");
		this._SPELL_NAME_REGEX_SPELL = new RegExp(`\\b(${spellNamesFiltered.map(it => it.escapeRegexp()).join("|")}) (spell|cantrip)`, "gi");
		this._SPELL_NAME_REGEX_AND = new RegExp(`\\b(${spellNamesFiltered.map(it => it.escapeRegexp()).join("|")}) (and {@spell)`, "gi");
		this._SPELL_NAME_REGEX_CAST = new RegExp(`(?<prefix>casts?(?: the(?: spell)?)? )(?<spell>${spellNamesFiltered.map(it => it.escapeRegexp()).join("|")})\\b`, "gi");
	}

	static _tryRun (it) {
		return TagJsons.WALKER.walk(
			it,
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
							fnTag: this._fnTag.bind(this),
						},
					);
					return ptrStack._;
				},
			},
		);
	}

	static _fnTag (strMod) {
		if (TagJsons.OPTIMISTIC) {
			strMod = strMod
				.replace(this._SPELL_NAME_REGEX_SPELL, (...m) => {
					const spellMeta = this._SPELL_NAMES[m[1].toLowerCase()];
					return `{@spell ${m[1]}${spellMeta.source !== Parser.SRC_PHB ? `|${spellMeta.source}` : ""}} ${m[2]}`;
				});
		}

		// Tag common spells which often don't have e.g. the word "spell" nearby
		strMod = strMod
			.replace(/\b(antimagic field|dispel magic)\b/gi, (...m) => {
				const spellMeta = this._SPELL_NAMES[m[1].toLowerCase()];
				return `{@spell ${m[1]}${spellMeta.source !== Parser.SRC_PHB ? `|${spellMeta.source}` : ""}}`;
			});

		strMod = strMod
			.replace(this._SPELL_NAME_REGEX_CAST, (...m) => {
				const spellMeta = this._SPELL_NAMES[m.last().spell.toLowerCase()];
				return `${m.last().prefix}{@spell ${m.last().spell}${spellMeta.source !== Parser.SRC_PHB ? `|${spellMeta.source}` : ""}}`;
			});

		return strMod
			.replace(this._SPELL_NAME_REGEX_AND, (...m) => {
				const spellMeta = this._SPELL_NAMES[m[1].toLowerCase()];
				return `{@spell ${m[1]}${spellMeta.source !== Parser.SRC_PHB ? `|${spellMeta.source}` : ""}} ${m[2]}`;
			})
			.replace(/(spells(?:|[^.!?:{]*): )([^.!?]+)/gi, (...m) => {
				const spellPart = m[2].replace(this._SPELL_NAME_REGEX, (...n) => {
					const spellMeta = this._SPELL_NAMES[n[1].toLowerCase()];
					return `{@spell ${n[1]}${spellMeta.source !== Parser.SRC_PHB ? `|${spellMeta.source}` : ""}}`;
				});
				return `${m[1]}${spellPart}`;
			})
			.replace(this._SPELL_NAME_REGEX_CAST, (...m) => {
				const spellMeta = this._SPELL_NAMES[m.last().spell.toLowerCase()];
				return `${m.last().prefix}{@spell ${m.last().spell}${spellMeta.source !== Parser.SRC_PHB ? `|${spellMeta.source}` : ""}}`;
			})
		;
	}
}

export class ItemTag extends ConverterTaggerInitializable {
	static _ITEM_NAMES = {};
	static _ITEM_NAMES_REGEX_TOOLS = null;
	static _ITEM_NAMES_REGEX_OTHER = null;
	static _ITEM_NAMES_REGEX_EQUIPMENT = null;

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

		// region Tools
		const toolTypes = new Set([
			Parser.ITM_TYP_ABV__ARTISAN_TOOL,
			Parser.ITM_TYP_ABV__GAMING_SET,
			Parser.ITM_TYP_ABV__INSTRUMENT,
			Parser.ITM_TYP_ABV__TOOL,
		]);
		const tools = standardItems.filter(it => it.type && toolTypes.has(DataUtil.itemType.unpackUid(it.type).abbreviation) && it.name !== "Horn");
		tools.forEach(tool => {
			this._ITEM_NAMES[tool.name.toLowerCase()] = {name: tool.name, source: tool.source};
		});

		this._ITEM_NAMES_REGEX_TOOLS = new RegExp(`\\b(${tools.map(it => it.name.escapeRegexp()).join("|")})\\b`, "gi");
		// endregion

		// region Other items
		const otherItems = standardItems
			.filter(it => {
				if (it.type && toolTypes.has(DataUtil.itemType.unpackUid(it.type).abbreviation)) return false;
				// Disallow specific items
				if (it.name === "Wave" && it.source === Parser.SRC_DMG) return false;
				// Allow all non-specific-variant DMG items
				if (it.source === Parser.SRC_DMG && !Renderer.item.isMundane(it) && it._category !== "Specific Variant") return true;
				// Allow "sufficiently complex name" items
				return it.name.split(" ").length > 2;
			})
			// Prefer specific variants first, as they have longer names
			.sort((itemA, itemB) => Number(itemB._category === "Specific Variant") - Number(itemA._category === "Specific Variant") || SortUtil.ascSortLower(itemA.name, itemB.name))
		;
		otherItems.forEach(it => {
			this._ITEM_NAMES[it.name.toLowerCase()] = {name: it.name, source: it.source};
		});

		this._ITEM_NAMES_REGEX_OTHER = new RegExp(`\\b(${otherItems.map(it => it.name.escapeRegexp()).join("|")})\\b`, "gi");
		// endregion

		// region Basic equipment
		// (Has some overlap with others)
		const nonEquipmentTypes = new Set([
			Parser.ITM_TYP_ABV__MELEE_WEAPON,
			Parser.ITM_TYP_ABV__RANGED_WEAPON,
			Parser.ITM_TYP_ABV__LIGHT_ARMOR,
			Parser.ITM_TYP_ABV__MEDIUM_ARMOR,
			Parser.ITM_TYP_ABV__HEAVY_ARMOR,
			Parser.ITM_TYP_ABV__SHIELD,
		]);
		const itemsEquipment = itemArr
			.filter(itm => itm.source === "PHB" && (!itm.type || !nonEquipmentTypes.has(DataUtil.itemType.unpackUid(itm.type).abbreviation)));
		this._ITEM_NAMES_REGEX_EQUIPMENT = new RegExp(`\\b(${itemsEquipment.map(it => it.name.escapeRegexp()).join("|")})\\b`, "gi");
		itemsEquipment.forEach(itm => this._ITEM_NAMES[itm.name.toLowerCase()] = {name: itm.name, source: itm.source});
		// endregion
	}

	/* -------------------------------------------- */

	static _tryRun (it) {
		return this._WALKER.walk(
			it,
			{
				string: (str) => {
					const ptrStack = {_: ""};
					TaggerUtils.walkerStringHandler(
						["@item"],
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
			.replace(this._ITEM_NAMES_REGEX_TOOLS, (...m) => {
				const itemMeta = this._ITEM_NAMES[m[1].toLowerCase()];
				return `{@item ${m[1]}${itemMeta.source !== Parser.SRC_DMG ? `|${itemMeta.source}` : ""}}`;
			})
			.replace(this._ITEM_NAMES_REGEX_OTHER, (...m) => {
				const itemMeta = this._ITEM_NAMES[m[1].toLowerCase()];
				return `{@item ${m[1]}${itemMeta.source !== Parser.SRC_DMG ? `|${itemMeta.source}` : ""}}`;
			})
		;
	}

	/* -------------------------------------------- */

	static tryRunBasicEquipment (it) {
		return this._WALKER.walk(
			it,
			{
				string: (str) => {
					const ptrStack = {_: ""};
					TaggerUtils.walkerStringHandler(
						["@item"],
						ptrStack,
						0,
						0,
						str,
						{
							fnTag: this._fnTagBasicEquipment.bind(this),
						},
					);
					return ptrStack._;
				},
			},
		);
	}

	static _fnTagBasicEquipment (strMod) {
		return strMod
			.replace(ItemTag._ITEM_NAMES_REGEX_EQUIPMENT, (...m) => {
				const itemMeta = ItemTag._ITEM_NAMES[m[1].toLowerCase()];
				return `{@item ${m[1]}${itemMeta.source !== Parser.SRC_DMG ? `|${itemMeta.source}` : ""}}`;
			})
		;
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

export class HazardTag {
	static _RE_HAZARD_SEE = /\b(?<name>High Altitude|Brown Mold|Green Slime|Webs|Yellow Mold|Extreme Cold|Extreme Heat|Heavy Precipitation|Strong Wind|Desecrated Ground|Frigid Water|Quicksand|Razorvine|Slippery Ice|Thin Ice)(?<suffix> \(see)/gi;

	static tryRun (it) {
		return TagJsons.WALKER.walk(
			it,
			{
				string: (str) => {
					const ptrStack = {_: ""};
					TaggerUtils.walkerStringHandler(
						["@hazard"],
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
					strMod = strMod.replace(re, (...m) => `{@creature ${m[0]}${source !== Parser.SRC_DMG ? `|${source}` : ""}}`);
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
	static tryRun (it) {
		return TagJsons.WALKER.walk(
			it,
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
