import {AttachedSpellTag, BasicTextClean, BonusTag, ChargeTag, ConditionImmunityTag, DamageImmunityTag, DamageResistanceTag, DamageVulnerabilityTag, ItemMiscTag, ItemOtherTagsTag, ItemSpellcastingFocusTag, LightTag, RechargeAmountTag, RechargeTypeTag, ReqAttuneTagTag} from "./converterutils-item.js";
import {ConverterBase} from "./converter-base.js";
import {ArtifactPropertiesTag, TagCondition} from "./converterutils-tags.js";
import {TagJsons} from "./converterutils-entries.js";
import {ConverterUtils} from "./converterutils-utils.js";
import {EntryCoalesceEntryLists, EntryCoalesceRawLines} from "./converterutils-entrycoalesce.js";
import {SITE_STYLE__CLASSIC, SITE_STYLE__ONE} from "../consts.js";
import {PropOrder} from "../utils-proporder.js";

export class ConverterItem extends ConverterBase {
	static _ALL_ITEMS = null;
	static _ALL_CLASSES = null;
	static _MAPPED_ITEM_NAMES = {
		"studded leather": "studded leather armor",
		"leather": "leather armor",
		"scale": "scale mail",
	};

	static init (itemData, classData) {
		this._ALL_ITEMS = itemData;
		this._ALL_CLASSES = classData.class;
	}

	static getItem (itemName, {styleHint}) {
		itemName = itemName.trim().toLowerCase();
		itemName = this._MAPPED_ITEM_NAMES[itemName] || itemName;
		const matches = this._ALL_ITEMS
			.filter(it => it.name.toLowerCase() === itemName)
			.filter(it => {
				const src = SourceUtil.getEntitySource(it);
				if (styleHint === SITE_STYLE__ONE && it.edition === src) return false;
				if (styleHint === SITE_STYLE__CLASSIC && !SourceUtil.isClassicSource(src)) return false;
				return true;
			})
			.sort((a, b) => {
				const aDate = Parser.sourceJsonToDate(SourceUtil.getEntitySource(a));
				const bDate = Parser.sourceJsonToDate(SourceUtil.getEntitySource(b));
				return SortUtil.ascSortDateString(aDate, bDate);
			});
		if (matches.length) return matches[0];
		return null;
	}

	/**
	 * Parses items from raw text pastes
	 * @param inText Input text.
	 * @param options Options object.
	 * @param options.cbWarning Warning callback.
	 * @param options.cbOutput Output callback.
	 * @param options.isAppend Default output append mode.
	 * @param options.source Entity source.
	 * @param options.page Entity page.
	 * @param options.titleCaseFields Array of fields to be title-cased in this entity (if enabled).
	 * @param options.isTitleCase Whether title-case fields should be title-cased in this entity.
	 * @param options.styleHint
	 */
	static doParseText (inText, options) {
		options = this._getValidOptions(options);

		if (!inText || !inText.trim()) return options.cbWarning("No input!");
		const toConvert = this._getCleanInput(inText, options)
			.split("\n")
			.filter(it => it && it.trim());
		const item = {};
		item.source = options.source;
		// for the user to fill out
		item.page = options.page;

		// FIXME this duplicates functionality in converterutils
		let prevLine = null;
		let curLine = null;
		let i;
		for (i = 0; i < toConvert.length; i++) {
			prevLine = curLine;
			curLine = toConvert[i].trim();

			if (curLine === "") continue;

			// name of item
			if (i === 0) {
				item.name = this._getAsTitle("name", curLine, options.titleCaseFields, options.isTitleCase);
				continue;
			}

			// tagline
			if (i === 1) {
				this._setCleanTaglineInfo(item, curLine, options);
				continue;
			}

			const ptrI = {_: i};
			item.entries = EntryCoalesceRawLines.mutGetCoalesced(
				ptrI,
				toConvert,
			);
			i = ptrI._;
		}

		const statsOut = this._getFinalState(item, options);
		options.cbOutput(statsOut, options.isAppend);
		return statsOut;
	}

	static _getFinalState (item, options) {
		if (!item.entries?.length) delete item.entries;
		else this._setWeight(item, options);

		if (item.staff) this._setQuarterstaffStats(item, options);
		this._mutRemoveBaseItemProps(item, options);

		this._doItemPostProcess(item, options);
		this._setCleanTaglineInfo_handleGenericType(item, options);
		this._doVariantPostProcess(item, options);
		return PropOrder.getOrdered(item, item.__prop || "item");
	}

	// SHARED UTILITY FUNCTIONS ////////////////////////////////////////////////////////////////////////////////////////
	static _doItemPostProcess (stats, options) {
		TagCondition.tryTagConditions(stats, {styleHint: options.styleHint});
		ArtifactPropertiesTag.tryRun(stats, {styleHint: options.styleHint});
		if (stats.entries) {
			EntryCoalesceEntryLists.mutCoalesce(stats, "entries", {styleHint: options.styleHint});

			if (/is a (tiny|small|medium|large|huge|gargantuan) object/i.test(JSON.stringify(stats.entries))) options.cbWarning(`${stats.name ? `(${stats.name}) ` : ""}Item may be an object!`);
		}
		this._doItemPostProcess_addTags(stats, options);
		BasicTextClean.tryRun(stats);
	}

	static _doItemPostProcess_addTags (stats, options) {
		const manName = stats.name ? `(${stats.name}) ` : "";
		TagJsons.mutTagObject(stats, {keySet: new Set(["entries"]), isOptimistic: true, styleHint: options.styleHint});
		ChargeTag.tryRun(stats);
		RechargeTypeTag.tryRun(stats, {cbMan: () => options.cbWarning(`${manName}Recharge type requires manual conversion`)});
		RechargeAmountTag.tryRun(stats, {cbMan: () => options.cbWarning(`${manName}Recharge amount requires manual conversion`)});
		ItemMiscTag.tryRun(stats);
		BonusTag.tryRun(stats);
		ItemOtherTagsTag.tryRun(stats);
		ItemSpellcastingFocusTag.tryRun(stats);
		DamageResistanceTag.tryRun(stats, {cbMan: () => options.cbWarning(`${manName}Damage resistance tagging requires manual conversion`)});
		DamageImmunityTag.tryRun(stats, {cbMan: () => options.cbWarning(`${manName}Damage immunity tagging requires manual conversion`)});
		DamageVulnerabilityTag.tryRun(stats, {cbMan: () => options.cbWarning(`${manName}Damage vulnerability tagging requires manual conversion`)});
		ConditionImmunityTag.tryRun(stats, {cbMan: () => options.cbWarning(`${manName}Condition immunity tagging requires manual conversion`)});
		ReqAttuneTagTag.tryRun(stats, {cbMan: () => options.cbWarning(`${manName}Attunement requirement tagging requires manual conversion`)});
		AttachedSpellTag.tryRun(stats);
		LightTag.tryRun(stats);

		// TODO
		//  - tag damage type?
		//  - tag ability score adjustments
	}

	static _doVariantPostProcess (stats, options) {
		if (!stats.inherits) return;
		BonusTag.tryRun(stats, {isVariant: true});
	}

	// SHARED PARSING FUNCTIONS ////////////////////////////////////////////////////////////////////////////////////////
	static _setCleanTaglineInfo (stats, curLine, options) {
		const parts = curLine.trim().split(StrUtil.COMMAS_NOT_IN_PARENTHESES_REGEX).map(it => it.trim()).filter(Boolean);

		const handlePartRarity = (rarity) => {
			rarity = rarity.trim().toLowerCase();
			switch (rarity) {
				case "common": stats.rarity = rarity; return true;
				case "uncommon": stats.rarity = rarity; return true;
				case "rare": stats.rarity = rarity; return true;
				case "very rare": stats.rarity = rarity; return true;
				case "legendary": stats.rarity = rarity; return true;
				case "artifact": stats.rarity = rarity; return true;
				case "varies":
				case "rarity varies": {
					stats.rarity = "varies";
					stats.__prop = "itemGroup";
					return true;
				}
				case "unknown rarity": {
					// Make a best-guess as to whether or not the item is magical
					if (stats.wondrous || stats.staff) stats.rarity = "unknown (magic)";
					if (
						stats.type
						&& [
							Parser.ITM_TYP_ABV__POTION,
							Parser.ITM_TYP_ABV__RING,
							Parser.ITM_TYP_ABV__ROD,
							Parser.ITM_TYP_ABV__WAND,
							Parser.ITM_TYP_ABV__SCROLL,
						].includes(DataUtil.itemType.unpackUid(stats.type).abbreviation)
					) return "unknown (magic)";
					else stats.rarity = "unknown";
					return true;
				}
			}
			return false;
		};

		let baseItem = null;

		for (let i = 0; i < parts.length; ++i) {
			let part = parts[i];
			const partLower = part.toLowerCase();

			// region wondrous/item type/staff/etc.
			switch (partLower) {
				case "wondrous item": stats.wondrous = true; continue;
				case "wondrous item (tattoo)": stats.wondrous = true; stats.tattoo = true; continue;
				case "staff": stats.staff = true; continue;
				case "potion": stats.type = options.styleHint === SITE_STYLE__ONE ? Parser.ITM_TYP__ODND_POTION : Parser.ITM_TYP__POTION; continue;
				case "ammunition": stats.type = options.styleHint === SITE_STYLE__ONE ? Parser.ITM_TYP__ODND_AMMUNITION : Parser.ITM_TYP__AMMUNITION; continue;
				case "ring": stats.type = options.styleHint === SITE_STYLE__ONE ? Parser.ITM_TYP__ODND_RING : Parser.ITM_TYP__RING; continue;
				case "rod": stats.type = options.styleHint === SITE_STYLE__ONE ? Parser.ITM_TYP__ODND_ROD : Parser.ITM_TYP__ROD; continue;
				case "wand": stats.type = options.styleHint === SITE_STYLE__ONE ? Parser.ITM_TYP__ODND_WAND : Parser.ITM_TYP__WAND; continue;
				case "scroll": stats.type = options.styleHint === SITE_STYLE__ONE ? Parser.ITM_TYP__ODND_SCROLL : Parser.ITM_TYP__SCROLL; continue;
				case "adventuring gear": stats.type = options.styleHint === SITE_STYLE__ONE ? Parser.ITM_TYP__ODND_ADVENTURING_GEAR : Parser.ITM_TYP__ADVENTURING_GEAR; continue;
			}
			// endregion

			// region rarity/attunement
			// Check if the part is an exact match for a rarity string
			const isHandledRarity = handlePartRarity(partLower);
			if (isHandledRarity) continue;

			if (partLower.includes("(requires attunement")) {
				const [rarityRaw, ...rest] = part.split("(");
				const rarity = rarityRaw.trim().toLowerCase();

				const isHandledRarity = rarity ? handlePartRarity(rarity) : true;
				if (!isHandledRarity) options.cbWarning(`${stats.name ? `(${stats.name}) ` : ""}Rarity "${rarityRaw}" requires manual conversion`);

				let attunement = rest.join("(");
				attunement = attunement.replace(/^requires attunement/i, "").replace(/\)/, "").trim();
				if (!attunement) {
					stats.reqAttune = true;
				} else {
					stats.reqAttune = attunement.toLowerCase();
				}

				// if specific attunement is required, absorb any further parts which are class names
				if (/(^| )by a /i.test(stats.reqAttune)) {
					for (let ii = i + 1; ii < parts.length; ++ii) {
						const nxtPart = parts[ii]
							.trim()
							.replace(/^(?:or|and) /, "")
							.trim()
							.replace(/\)$/, "")
							.trim()
							.toLowerCase();
						const isClassName = ConverterItem._ALL_CLASSES.some(cls => cls.name.toLowerCase() === nxtPart);
						if (isClassName) {
							stats.reqAttune += `, ${parts[ii].replace(/\)$/, "")}`;
							i = ii;
						}
					}
				}

				continue;
			}
			// endregion

			// region weapon/armor
			const isGenericWeaponArmor = this._setCleanTaglineInfo_mutIsGenericWeaponArmor({stats, part, partLower, options});
			if (isGenericWeaponArmor) continue;

			const mBaseWeapon = /^(?<ptPre>weapon|staff|rod) \((?<ptParens>[^)]+)\)$/i.exec(part);
			if (mBaseWeapon) {
				if (mBaseWeapon.groups.ptPre.toLowerCase() === "staff") stats.staff = true;
				if (mBaseWeapon.groups.ptPre.toLowerCase() === "rod") {
					if (stats.type) {
						throw new Error(`Multiple types! "${stats.type}" -> "${mBaseWeapon.groups.ptParens}"`);
					}
					stats.type = options.styleHint === SITE_STYLE__ONE ? Parser.ITM_TYP__ODND_ROD : Parser.ITM_TYP__ROD;
				}

				if (
					/ or /.test(mBaseWeapon.groups.ptParens)
					&& this._GENERIC_REQUIRES_LOOKUP_WEAPON[mBaseWeapon.groups.ptParens.toLowerCase()]
				) {
					(stats.requires ||= []).push(...this._setCleanTaglineInfo_getGenericRequires({stats, str: mBaseWeapon.groups.ptParens, options}));
					stats.__genericType = true;
					continue;
				}

				const ptsParens = ConverterUtils.splitConjunct(mBaseWeapon.groups.ptParens);
				const ptsParensNoAny = ptsParens.map(pt => pt.replace(/^any /i, ""));

				if (ptsParensNoAny.length > 1 && ptsParensNoAny.every(pt => this._GENERIC_REQUIRES_LOOKUP_WEAPON[pt.toLowerCase()])) {
					ptsParensNoAny.forEach(pt => {
						(stats.requires ||= []).push(
							...this._setCleanTaglineInfo_getGenericRequires({stats, str: pt, options}),
						);
					});
					stats.__genericType = true;
					continue;
				}

				const baseItems = ptsParens.map(pt => ConverterItem.getItem(pt, {styleHint: options.styleHint}));
				if (baseItems.some(it => it == null) || !baseItems.length) throw new Error(`Could not find base item(s) for "${mBaseWeapon.groups.ptParens}"`);

				if (baseItems.length === 1) {
					baseItem = baseItems[0];
					continue;
				}

				if (options.styleHint === SITE_STYLE__CLASSIC) options.cbWarning(`${stats.name ? `(${stats.name}) ` : ""}Multiple base item(s) for "${mBaseWeapon.groups.ptParens}"`);

				// e.g. XDMG items have broken down "any sword" into a specific list of items
				(stats.requires ||= [])
					.push(...baseItems.map(({name, source}) => ({name, source})));
				stats.__genericType = true;
				continue;
			}

			const mBaseArmor = /^armou?r \((?<type>[^)]+)\)$/i.exec(part);
			if (mBaseArmor) {
				if (this._setCleanTaglineInfo_isMutAnyArmor({stats, mBaseArmor, options})) {
					stats.__genericType = true;
					continue;
				}

				const ptsParens = ConverterUtils.splitConjunct(mBaseArmor.groups.type);

				const ptsParensClean = ptsParens.map(pt => pt.replace(/ armor$/i, ""));

				const [ptsInclude, ptsExclude] = ptsParensClean.segregate(pt => !/^\bbut not\b/i.test(pt))
					.map((arr, i) => !i ? arr : arr.map(pt => pt.replace(/^\bbut not\b/i, "").trim()));

				if (
					ptsParensClean.length > 1
					&& ptsInclude.every(pt => this._GENERIC_REQUIRES_LOOKUP_ARMOR[pt.toLowerCase()])
					&& ptsExclude.every(pt => this._GENERIC_EXCLUDES_LOOKUP_ARMOR[pt.toLowerCase()])
				) {
					ptsInclude.forEach(pt => {
						(stats.requires ||= []).push(
							...this._setCleanTaglineInfo_getGenericRequires({stats, str: pt, options}),
						);
					});
					ptsExclude.forEach(pt => {
						Object.assign(
							(stats.excludes ||= {}),
							this._GENERIC_EXCLUDES_LOOKUP_ARMOR[pt.toLowerCase()],
						);
					});
					stats.__genericType = true;
					continue;
				}

				baseItem = this._setCleanTaglineInfo_getArmorBaseItem(mBaseArmor.groups.type, options);
				if (!baseItem) throw new Error(`Could not find base item "${mBaseArmor.groups.type}"`);
				continue;
			}
			// endregion

			// Warn about any unprocessed input
			options.cbWarning(`${stats.name ? `(${stats.name}) ` : ""}Tagline part "${part}" requires manual conversion`);
		}

		this._setCleanTaglineInfo_handleBaseItem(stats, baseItem, options);
	}

	static _GENERIC_CATEGORY_TO_PROP = {
		"sword": "sword",
		"polearm": "polearm",
	};

	static _setCleanTaglineInfo_mutIsGenericWeaponArmor ({stats, part, partLower, options}) {
		if (partLower === "weapon" || partLower === "weapon (any)") {
			(stats.requires ||= []).push(...this._setCleanTaglineInfo_getGenericRequires({stats, str: "weapon", options}));
			stats.__genericType = true;
			return true;
		}

		if (/^armou?r(?: \(any\))?$/.test(partLower)) {
			(stats.requires ||= []).push(...this._setCleanTaglineInfo_getGenericRequires({stats, str: "armor", options}));
			stats.__genericType = true;
			return true;
		}

		const mWeaponAnyX = /^weapon \(any (?<ptParens>[^)]+)\)$/i.exec(part);
		if (mWeaponAnyX) {
			const ptsAny = ConverterUtils.splitConjunct(mWeaponAnyX.groups.ptParens);
			// e.g. "any ammunition or melee weapon"
			if (ptsAny.length > 1) return false;

			(stats.requires ||= []).push(...this._setCleanTaglineInfo_getGenericRequires({stats, str: mWeaponAnyX.groups.ptParens.trim(), options}));

			if (mWeaponAnyX[1].trim().toLowerCase() === "ammunition") stats.ammo = true;

			stats.__genericType = true;
			return true;
		}

		const mWeaponCategory = /^weapon \((?<category>[^)]+)\)$/i.exec(part);
		if (!mWeaponCategory) return false;

		const ptsCategory = ConverterUtils.splitConjunct(mWeaponCategory.groups.category);
		if (!ptsCategory.length) return false;

		const strs = ptsCategory
			.map(pt => this._GENERIC_CATEGORY_TO_PROP[pt.toLowerCase()]);
		if (strs.some(it => it == null)) return false;

		(stats.requires ||= []).push(...strs.flatMap(str => this._setCleanTaglineInfo_getGenericRequires({stats, str, options})));
		stats.__genericType = true;
		return true;
	}

	static _setCleanTaglineInfo_getArmorBaseItem (name, options) {
		let baseItem = ConverterItem.getItem(name, {styleHint: options.styleHint});
		if (!baseItem) baseItem = ConverterItem.getItem(`${name} armor`, {styleHint: options.styleHint}); // "armor (plate)" -> "plate armor"
		return baseItem;
	}

	static _setCleanTaglineInfo_getProcArmorPart ({pt, options}) {
		switch (pt) {
			case "light":
			case "light armor":
				return {"type": options.styleHint === SITE_STYLE__ONE ? Parser.ITM_TYP__ODND_LIGHT_ARMOR : Parser.ITM_TYP__LIGHT_ARMOR};
			case "medium":
			case "medium armor":
				return {"type": options.styleHint === SITE_STYLE__ONE ? Parser.ITM_TYP__ODND_MEDIUM_ARMOR : Parser.ITM_TYP__MEDIUM_ARMOR};
			case "heavy":
			case "heavy armor":
				return {"type": options.styleHint === SITE_STYLE__ONE ? Parser.ITM_TYP__ODND_HEAVY_ARMOR : Parser.ITM_TYP__HEAVY_ARMOR};
			default: {
				const baseItem = this._setCleanTaglineInfo_getArmorBaseItem(pt, options);
				if (!baseItem) throw new Error(`Could not find base item "${pt}"`);

				return {name: baseItem.name};
			}
		}
	}

	static _setCleanTaglineInfo_isMutAnyArmor ({stats, mBaseArmor, options}) {
		if (/^any /i.test(mBaseArmor.groups.type)) {
			const ptAny = mBaseArmor.groups.type.replace(/^any /i, "");

			if (/^armor$/.test(ptAny)) {
				(stats.requires ||= [])
					.push(...[
						{"type": options.styleHint === SITE_STYLE__ONE ? Parser.ITM_TYP__ODND_LIGHT_ARMOR : Parser.ITM_TYP__LIGHT_ARMOR},
						{"type": options.styleHint === SITE_STYLE__ONE ? Parser.ITM_TYP__ODND_MEDIUM_ARMOR : Parser.ITM_TYP__MEDIUM_ARMOR},
						{"type": options.styleHint === SITE_STYLE__ONE ? Parser.ITM_TYP__ODND_HEAVY_ARMOR : Parser.ITM_TYP__HEAVY_ARMOR},
					]);
				return true;
			}

			const [ptInclude, ptExclude] = ptAny.split(/(?:, )?\b(?:except|but not)\b/i).map(it => it.trim()).filter(Boolean);

			if (ptInclude) {
				stats.requires = [
					...(stats.requires || []),
					...ptInclude.split(/\bor\b|,/g).map(it => it.trim()).filter(Boolean).map(it => this._setCleanTaglineInfo_getProcArmorPart({pt: it, options})),
				];
			}

			if (ptExclude) {
				Object.assign(
					stats.excludes = stats.excludes || {},
					ptExclude.split(/\bor\b|,/g).map(it => it.trim()).filter(Boolean).mergeMap(it => this._setCleanTaglineInfo_getProcArmorPart({pt: it, options})),
				);
			}

			return true;
		}

		const ptsType = ConverterUtils.splitConjunct(mBaseArmor.groups.type);

		if (!ptsType
			.every(ptType => /^(?:light|medium|heavy)$/i.test(ptType))
		) return false;
		ptsType
			.forEach(ptType => {
				stats.requires = [
					...(stats.requires || []),
					this._setCleanTaglineInfo_getProcArmorPart({pt: ptType, options}),
				];
			});

		return true;
	}

	static _setCleanTaglineInfo_handleBaseItem (stats, baseItem, options) {
		if (!baseItem) return;

		const blocklistedProps = new Set([
			"source",
			"srd",
			"basicRules",
			"freeRules2024",
			"srd52",
			"page",
			"hasFluff",
			"hasFluffImages",
		]);

		// Apply base item stats only if there's no existing data
		Object.entries(baseItem)
			.filter(([k]) => stats[k] === undefined && !k.startsWith("_") && !blocklistedProps.has(k))
			.forEach(([k, v]) => stats[k] = v);

		// Clean unwanted base properties
		delete stats.armor;
		delete stats.value;

		stats.baseItem = `${baseItem.name.toLowerCase()}${baseItem.source === Parser.SRC_DMG ? "" : `|${baseItem.source.toLowerCase()}`}`;
	}

	static _GENERIC_REQUIRES_LOOKUP_WEAPON = {
		"weapon": [{"weapon": true}],
		"sword": [{"sword": true}],
		"axe": [{"axe": true}],
		"armor": [{"armor": true}],
		"bow": [{"bow": true}],
		"crossbow": [{"crossbow": true}],
		"spear": [{"spear": true}],
		"polearm": [{"polearm": true}],
		"dagger": [{"dagger": true}],
		"rapier": [{"rapier": true}],
		"club": [{"club": true}],
		"hammer": [{"hammer": true}],
		"mace": [{"mace": true}],
		"staff": [{"staff": true}],

		"ammunition": ({styleHint}) => [{"type": styleHint === SITE_STYLE__ONE ? Parser.ITM_TYP__ODND_AMMUNITION : Parser.ITM_TYP__AMMUNITION}, {"type": styleHint === SITE_STYLE__ONE ? Parser.ITM_TYP__ODND_AMMUNITION_FUTURISTIC : Parser.ITM_TYP__AMMUNITION_FUTURISTIC}],
		"arrow": [{"arrow": true}],
		"bolt": [{"bolt": true}],

		"melee": ({styleHint}) => [{"type": styleHint === SITE_STYLE__ONE ? Parser.ITM_TYP__ODND_MELEE_WEAPON : Parser.ITM_TYP__MELEE_WEAPON}],
		"melee weapon": ({styleHint}) => [{"type": styleHint === SITE_STYLE__ONE ? Parser.ITM_TYP__ODND_MELEE_WEAPON : Parser.ITM_TYP__MELEE_WEAPON}],

		"simple": [{"weaponCategory": "simple"}],
		"simple weapon": [{"weaponCategory": "simple"}],
		"martial": [{"weaponCategory": "martial"}],
		"martial weapon": [{"weaponCategory": "martial"}],

		"bludgeoning": [{"dmgType": "B"}],
		"weapon that deals bludgeoning damage": [{"dmgType": "B"}],
		"piercing": [{"dmgType": "P"}],
		"slashing": [{"dmgType": "S"}],

		"melee bludgeoning weapon": ({styleHint}) => [{"type": styleHint === SITE_STYLE__ONE ? Parser.ITM_TYP__ODND_MELEE_WEAPON : Parser.ITM_TYP__MELEE_WEAPON, "dmgType": "B"}],
	};

	// TODO(Future) consider using
	static _GENERIC_REQUIRES_LOOKUP_WEAPON_APPROXIMATION = {
		"longbow or shortbow": [{"bow": true}],
		"spear or javelin": [{"spear": true}],
		"bow or crossbow": [{"bow": true}, {"crossbow": true}],
		"arrow or bolt": [{"arrow": true}, {"bolt": true}],

		// region XDMG
		"battleaxe, greataxe, or halberd": ({styleHint}) => [{"axe": true, "property": styleHint === SITE_STYLE__ONE ? Parser.ITM_PROP__ODND_TWO_HANDED : Parser.ITM_PROP__TWO_HANDED}, {"halberd": true, "property": styleHint === SITE_STYLE__ONE ? Parser.ITM_PROP__ODND_TWO_HANDED : Parser.ITM_PROP__TWO_HANDED}],
		"battleaxe, greataxe, halberd, or handaxe": [{"axe": true}, {"halberd": true}],

		"greatsword, longsword, rapier, scimitar, or shortsword": [{"sword": true}],
		"glaive, greatsword, longsword, or scimitar": [{"sword": true, "dmgType": "S"}, {"sword": true, "dmgType": "S"}],
		"glaive, greatsword, longsword, rapier, scimitar, or shortsword": [{"sword": true}, {"glaive": true}],
		"glaive, greatsword, longsword, rapier, scimitar, sickle, or shortsword": [{"sword": true}, {"glaive": true}, {"name": "Sickle"}],

		"maul or warhammer": ({styleHint}) => [{"hammer": true, "property": styleHint === SITE_STYLE__ONE ? Parser.ITM_PROP__ODND_TWO_HANDED : Parser.ITM_PROP__TWO_HANDED}, {"hammer": true, "property": styleHint === SITE_STYLE__ONE ? Parser.ITM_PROP__ODND_VERSATILE : Parser.ITM_PROP__VERSATILE}],
		// endregion
	};

	static _GENERIC_REQUIRES_LOOKUP_ARMOR = {
		"light": ({styleHint}) => [{"type": styleHint === SITE_STYLE__ONE ? Parser.ITM_TYP__ODND_LIGHT_ARMOR : Parser.ITM_TYP__LIGHT_ARMOR}],
		"medium": ({styleHint}) => [{"type": styleHint === SITE_STYLE__ONE ? Parser.ITM_TYP__ODND_MEDIUM_ARMOR : Parser.ITM_TYP__MEDIUM_ARMOR}],
		"heavy": ({styleHint}) => [{"type": styleHint === SITE_STYLE__ONE ? Parser.ITM_TYP__ODND_HEAVY_ARMOR : Parser.ITM_TYP__HEAVY_ARMOR}],

		"hide": ({styleHint}) => [{"name": "Hide Armor", "source": styleHint === SITE_STYLE__ONE ? Parser.SRC_XPHB : Parser.SRC_PHB}],
		"half plate": ({styleHint}) => [{"name": "Half Plate Armor", "source": styleHint === SITE_STYLE__ONE ? Parser.SRC_XPHB : Parser.SRC_PHB}],
		"plate": ({styleHint}) => [{"name": "Plate Armor", "source": styleHint === SITE_STYLE__ONE ? Parser.SRC_XPHB : Parser.SRC_PHB}],
		"chain mail": ({styleHint}) => [{"name": "Chain Mail", "source": styleHint === SITE_STYLE__ONE ? Parser.SRC_XPHB : Parser.SRC_PHB}],
		"chain shirt": ({styleHint}) => [{"name": "Chain Shirt", "source": styleHint === SITE_STYLE__ONE ? Parser.SRC_XPHB : Parser.SRC_PHB}],
	};

	static _GENERIC_EXCLUDES_LOOKUP_ARMOR = {
		"hide": {"name": "Hide Armor"},
	};

	static _setCleanTaglineInfo_getGenericRequires ({stats, str, options}) {
		const strLookup = str.toLowerCase();

		const lookupWeapon = this._GENERIC_REQUIRES_LOOKUP_WEAPON[strLookup];
		if (lookupWeapon) return typeof lookupWeapon === "function" ? lookupWeapon({styleHint: options.styleHint}) : MiscUtil.copyFast(lookupWeapon);

		const lookupArmor = this._GENERIC_REQUIRES_LOOKUP_ARMOR[strLookup];
		if (lookupArmor) return typeof lookupArmor === "function" ? lookupArmor({styleHint: options.styleHint}) : MiscUtil.copyFast(lookupArmor);

		options.cbWarning(`${stats.name ? `(${stats.name}) ` : ""}Tagline part "${str}" requires manual conversion`);
		return [{[str.toCamelCase()]: true}];
	}

	static _RE_CATEGORIES_PREFIX_SUFFIX = /(?:weapon|blade|armor|sword|polearm|bow|crossbow|axe|hammer|ammunition|arrows?|bolts?|plate|chain)/;
	static _RE_CATEGORIES_PREFIX = new RegExp(`^${this._RE_CATEGORIES_PREFIX_SUFFIX.source} `, "i");
	static _RE_CATEGORIES_SUFFIX = new RegExp(` ${this._RE_CATEGORIES_PREFIX_SUFFIX.source}$`, "i");

	static _setCleanTaglineInfo_handleGenericType (stats, options) {
		if (!stats.__genericType) return;
		delete stats.__genericType;

		let prefixSuffixName = stats.name;
		prefixSuffixName = prefixSuffixName
			.replace(this._RE_CATEGORIES_PREFIX, "")
			.replace(this._RE_CATEGORIES_SUFFIX, "");
		const isSuffix = /^\s*of /i.test(prefixSuffixName);

		stats.inherits = MiscUtil.copy(stats);
		// Clean/move inherit props into inherits object
		["name", "requires", "excludes", "ammo"].forEach(prop => delete stats.inherits[prop]); // maintain some props on base object
		Object.keys(stats.inherits).forEach(k => delete stats[k]);

		if (isSuffix) stats.inherits.nameSuffix = ` ${prefixSuffixName.trim()}`;
		else stats.inherits.namePrefix = `${prefixSuffixName.trim()} `;

		stats.__prop = "magicvariant";
		stats.type = options.styleHint === SITE_STYLE__ONE ? Parser.ITM_TYP__ODND_GENERIC_VARIANT : Parser.ITM_TYP__GENERIC_VARIANT;
		if (options.styleHint === SITE_STYLE__CLASSIC) stats.edition = SITE_STYLE__CLASSIC;
	}

	static _setWeight (stats, options) {
		const strEntries = JSON.stringify(stats.entries);

		strEntries.replace(/weighs ([a-zA-Z0-9,]+) (pounds?|lbs?\.|tons?)/, (...m) => {
			if (m[2].toLowerCase().trim().startsWith("ton")) throw new Error(`Handling for tonnage is unimplemented!`);

			const noCommas = m[1].replace(/,/g, "");
			if (!isNaN(noCommas)) stats.weight = Number(noCommas);

			const fromText = Parser.textToNumber(m[1]);
			if (!isNaN(fromText)) stats.weight = fromText;

			if (!stats.weight) options.cbWarning(`${stats.name ? `(${stats.name}) ` : ""}Weight "${m[1]}" requires manual conversion`);
		});
	}

	static _setQuarterstaffStats (stats, options) {
		const cpyStatsQuarterstaff = MiscUtil.copy(ConverterItem._ALL_ITEMS.find(it => it.name === "Quarterstaff" && it.source === (options.styleHint === SITE_STYLE__CLASSIC ? Parser.SRC_PHB : Parser.SRC_XPHB)));

		// remove unwanted properties
		delete cpyStatsQuarterstaff.name;
		delete cpyStatsQuarterstaff.source;
		delete cpyStatsQuarterstaff.otherSources;
		delete cpyStatsQuarterstaff.page;
		delete cpyStatsQuarterstaff.rarity;
		delete cpyStatsQuarterstaff.value;
		delete cpyStatsQuarterstaff.srd;
		delete cpyStatsQuarterstaff.srd52;
		delete cpyStatsQuarterstaff.basicRules;
		delete cpyStatsQuarterstaff.freeRules2024;
		delete cpyStatsQuarterstaff.reprintedAs;

		Object.entries(cpyStatsQuarterstaff)
			.filter(([k]) => !k.startsWith("_"))
			.forEach(([k, v]) => {
				if (stats[k] == null) stats[k] = v;
			});
	}

	static _mutRemoveBaseItemProps (stats) {
		if (stats.__prop === "baseitem") return;

		// region tags found only on basic items
		Object.keys({
			armor: true,
			axe: true,
			sword: true,
			mace: true,
			spear: true,
			hammer: true,
			bow: true,
			crossbow: true,
			club: true,
			dagger: true,
			net: true,
			polearm: true,
			lance: true,
			rapier: true,
			glaive: true,
			halberd: true,
			whip: true,
			arrow: true,
			bolt: true,
			bulletFirearm: true,
			bulletSling: true,
			needleBlowgun: true,
			weapon: true,
		})
			.forEach(prop => delete stats[prop]);
		// endregion

		// region other props
		[
			"reprintedAs",
			"edition",
		]
			.forEach(prop => delete stats[prop]);
		// endregion
	}
}
