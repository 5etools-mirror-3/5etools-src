import {FilterItemClassSubclass} from "./filter-item.js";
import {MISC_FILTER_VALUE__BASIC_RULES_2014, MISC_FILTER_VALUE__BASIC_RULES_2024, MISC_FILTER_VALUE__SRD_5_1, MISC_FILTER_VALUE__SRD_5_2} from "./filter-constants.js";

/** @abstract */
export class PageFilterBase {
	static defaultSourceSelFn (val) {
		// Assume the user wants to select their loaded homebrew/prerelease content by default
		// Overridden by the options:
		//   - "Deselect Prerelease Content Sources by Default"
		//   - "Deselect Homebrew Sources by Default"
		return PageFilterBase.defaultSourceSelFnStandardPartnered(val)
			|| SourceUtil.getFilterGroup(val) === SourceUtil.FILTER_GROUP_PRERELEASE
			|| SourceUtil.getFilterGroup(val) === SourceUtil.FILTER_GROUP_HOMEBREW;
	}

	static defaultSourceSelFnStandardPartnered (val) {
		return SourceUtil.getFilterGroup(val) === SourceUtil.FILTER_GROUP_STANDARD
			|| (SourceUtil.getFilterGroup(val) === SourceUtil.FILTER_GROUP_PARTNERED && (typeof BrewUtil2 === "undefined" || BrewUtil2.hasSourceJson(val)));
	}

	static defaultMiscellaneousDeselFn (val) {
		return val === "Reprinted";
	}

	constructor (opts) {
		opts = opts || {};
		this._sourceFilter = new SourceFilter(opts.sourceFilterOpts);
		this._filterBox = null;
		this._miscFilter = null;
	}

	/**
	 * @return {?FilterBox}
	 */
	get filterBox () { return this._filterBox; }
	get sourceFilter () { return this._sourceFilter; }
	get miscFilter () { return this._miscFilter; }

	mutateAndAddToFilters (entity, isExcluded, opts) {
		this.constructor.mutateForFilters(entity, opts);
		this.addToFilters(entity, isExcluded, opts);
	}

	/** @abstract */
	static mutateForFilters (entity, opts) { throw new Error("Unimplemented!"); }
	/** @abstract */
	addToFilters (entity, isExcluded, opts) { throw new Error("Unimplemented!"); }
	/** @abstract */
	toDisplay (values, entity) { throw new Error("Unimplemented!"); }
	/** @abstract */
	async _pPopulateBoxOptions (opts) { throw new Error("Unimplemented!"); }

	async _pPopulateBoxBaseOptions (opts) {
		opts.namespaceSnapshots = this._getNamespaceSnapshots();
	}

	_getNamespaceSnapshots () { return this.constructor.name; }

	async pInitFilterBox (opts) {
		opts = opts || {};
		await this._pPopulateBoxBaseOptions(opts);
		await this._pPopulateBoxOptions(opts);
		this._filterBox = new FilterBox(opts);
		await this._filterBox.pDoLoadState();
		return this._filterBox;
	}

	trimState () { return this._filterBox.trimState_(); }

	// region Helpers
	static _getClassFilterItem ({className, classSource, isVariantClass, definedInSource}) {
		const nm = className.split("(")[0].trim();
		const variantSuffix = isVariantClass ? ` [${definedInSource ? Parser.sourceJsonToAbv(definedInSource) : "Unknown"}]` : "";
		const sourceSuffix = (
			SourceUtil.isNonstandardSource(classSource || Parser.SRC_PHB)
			|| (typeof PrereleaseUtil !== "undefined" && PrereleaseUtil.hasSourceJson(classSource || Parser.SRC_PHB))
			|| (typeof BrewUtil2 !== "undefined" && BrewUtil2.hasSourceJson(classSource || Parser.SRC_PHB))
		)
			? ` (${Parser.sourceJsonToAbv(classSource)})` : "";
		const name = `${nm}${variantSuffix}${sourceSuffix}`;

		const opts = {
			item: name,
			group: SourceUtil.getFilterGroup(classSource || Parser.SRC_PHB),
		};

		if (isVariantClass) {
			opts.nest = definedInSource ? Parser.sourceJsonToFull(definedInSource) : "Unknown";
			opts.equivalentClassName = `${nm}${sourceSuffix}`;
			opts.definedInSource = definedInSource;
		}

		return new FilterItemClassSubclass(opts);
	}

	static _getSubclassFilterItem ({className, classSource, subclassShortName, subclassName, subclassSource, subSubclassName, isVariantClass, definedInSource}) {
		const group = SourceUtil.isSubclassReprinted(className, classSource, subclassShortName, subclassSource) || Parser.sourceJsonToFull(subclassSource).startsWith(Parser.UA_PREFIX) || Parser.sourceJsonToFull(subclassSource).startsWith(Parser.PS_PREFIX);

		const classFilterItem = this._getClassFilterItem({
			className: subclassShortName || subclassName,
			classSource: subclassSource,
		});

		return new FilterItemClassSubclass({
			item: `${className}: ${classFilterItem.item}${subSubclassName ? `, ${subSubclassName}` : ""}`,
			nest: className,
			group,
		});
	}

	static isReprinted (ent, {fnMissingBuilder = null} = {}) {
		if (!ent?.reprintedAs?.length) return false;
		return ent.reprintedAs
			.some(it => {
				if (!UrlUtil.URL_TO_HASH_BUILDER[ent.__prop]) {
					if (fnMissingBuilder) fnMissingBuilder(ent);
					return true;
				}

				const unpacked = DataUtil.proxy.unpackUid(ent.__prop, it?.uid ?? it, Parser.getPropTag(ent.__prop));
				const hash = UrlUtil.URL_TO_HASH_BUILDER[ent.__prop](unpacked);
				return !ExcludeUtil.isExcluded(hash, ent.__prop, unpacked.source, {isNoCount: true});
			});
	}

	static getListAliases (ent) {
		return (ent.alias || []).map(it => `"${it}"`).join(",");
	}

	static _hasFluff (ent) { return !!(ent.hasFluff || ent.fluff?.entries); }
	static _hasFluffImages (ent) { return !!(ent.hasFluffImages || ent.fluff?.images); }

	static _hasSoundClip (ent) { return !!ent.soundClip; }

	static _mutateForFilters_commonSources (ent, {isIncludeBaseSource = false} = {}) {
		ent._fSources = SourceFilter.getCompleteFilterSources(ent, {isIncludeBaseSource});
	}

	static _mutateForFilters_commonMisc (ent) {
		ent._fMisc = [];

		if (ent.srd) ent._fMisc.push(MISC_FILTER_VALUE__SRD_5_1);
		if (ent.basicRules) ent._fMisc.push(MISC_FILTER_VALUE__BASIC_RULES_2014);

		if (ent.srd52) ent._fMisc.push(MISC_FILTER_VALUE__SRD_5_2);
		if (ent.basicRules2024) ent._fMisc.push(MISC_FILTER_VALUE__BASIC_RULES_2024);

		if (SourceUtil.isLegacySourceWotc(ent.source)) ent._fMisc.push("Legacy");

		if (ent.isReprinted) ent._fMisc.push("Reprinted");
		if (ent._isCopy) ent._fMisc.push("Modified Copy");

		if (this._hasFluff(ent)) ent._fMisc.push("Has Info");
		if (this._hasFluffImages(ent)) ent._fMisc.push("Has Images");

		if (this._hasSoundClip(ent)) ent._fMisc.push("Has Pronunciation Audio");

		if (this.isReprinted(ent)) ent._fMisc.push("Reprinted");

		if (ent.tokenCustom) ent._fMisc.push("Has Custom/Unofficial Token");
		if (ent.tokenCredit) ent._fMisc.push("Has Token Credit");
	}
	// endregion
}
