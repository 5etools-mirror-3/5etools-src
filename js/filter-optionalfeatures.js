"use strict";

class PageFilterOptionalFeatures extends PageFilterBase {
	// region static
	static _filterFeatureTypeSort (a, b) {
		return SortUtil.ascSort(Parser.optFeatureTypeToFull(a.item), Parser.optFeatureTypeToFull(b.item));
	}

	static sortOptionalFeatures (itemA, itemB, options) {
		if (options.sortBy === "level") {
			const aValue = Number(itemA.values.level) || 0;
			const bValue = Number(itemB.values.level) || 0;
			return SortUtil.ascSort(aValue, bValue) || SortUtil.listSort(itemA, itemB, options);
		}
		return SortUtil.listSort(itemA, itemB, options);
	}

	static getLevelFilterItem (prereq) {
		const lvlMeta = prereq.level;

		if (typeof lvlMeta === "number") {
			return new FilterItem({
				item: `Level ${lvlMeta}`,
				nest: `(No Class)`,
			});
		}

		const className = lvlMeta.class ? lvlMeta.class.name : `(No Class)`;
		return new FilterItem({
			item: `${lvlMeta.class ? className : ""}${lvlMeta.subclass ? ` (${lvlMeta.subclass.name})` : ""} Level ${lvlMeta.level}`,
			nest: className,
		});
	}
	// endregion

	constructor () {
		super();

		this._typeFilter = new Filter({
			header: "Feature Type",
			items: [],
			displayFn: Parser.optFeatureTypeToFull,
			itemSortFn: PageFilterOptionalFeatures._filterFeatureTypeSort,
		});
		this._pactFilter = new Filter({
			header: "Pact Boon",
			items: [],
			displayFn: Parser.prereqPactToFull,
		});
		this._patronFilter = new Filter({
			header: "Otherworldly Patron",
			items: [],
			displayFn: Parser.prereqPatronToShort,
		});
		this._spellFilter = new Filter({
			header: "Spell",
			items: [],
			displayFn: StrUtil.toTitleCase.bind(StrUtil),
		});
		this._featureFilter = new Filter({
			header: "Feature",
			displayFn: StrUtil.toTitleCase.bind(StrUtil),
		});
		this._levelFilter = new Filter({
			header: "Level",
			itemSortFn: SortUtil.ascSortNumericalSuffix,
			nests: [],
		});
		this._prerequisiteFilter = new MultiFilter({
			header: "Prerequisite",
			filters: [
				this._pactFilter,
				this._patronFilter,
				this._spellFilter,
				this._levelFilter,
				this._featureFilter,
			],
		});
		this._miscFilter = new Filter({
			header: "Miscellaneous",
			items: ["Has Info", "Has Images", "Legacy", "Grants Additional Spells"],
			isMiscFilter: true,
			deselFn: PageFilterBase.defaultMiscellaneousDeselFn.bind(PageFilterBase),
		});
	}

	static _RE_OPTIONALFEATURE_PACT = /^pact of (?:the )?(?<pactName>[^|]+)(?:\|[^|]+)?$/;

	static _mutateForFilters_getPrerequisitePact (ent) {
		if (!ent.prerequisite) return [];

		const out = [];

		for (const prereq of ent.prerequisite) {
			if (prereq.pact) out.push(prereq.pact);

			// Modern pacts are linked `optionalfeatures`; convert to "pact" filter format
			if (!prereq.optionalfeature) continue;

			for (const uid of prereq.optionalfeature) {
				const m = this._RE_OPTIONALFEATURE_PACT.exec(uid);
				if (!m) continue;
				out.push(m.groups.pactName.toTitleCase());
			}
		}

		return out;
	}

	static mutateForFilters (ent) {
		this._mutateForFilters_commonSources(ent);

		// (Convert legacy string format to array)
		ent.featureType = ent.featureType && ent.featureType instanceof Array ? ent.featureType : ent.featureType ? [ent.featureType] : ["OTH"];
		if (ent.prerequisite) {
			ent._sPrereq = true;
			ent._fPrereqPact = this._mutateForFilters_getPrerequisitePact(ent);
			ent._fPrereqPatron = ent.prerequisite.filter(it => it.patron).map(it => it.patron);
			ent._fprereqSpell = ent.prerequisite
				.filter(it => it.spell)
				.map(prereq => {
					return (prereq.spell || [])
						.map(strOrObj => {
							if (typeof strOrObj === "string") return strOrObj.split("#")[0].split("|")[0];

							// TODO(Future) improve if required -- refactor this + `PageFilterSpells` display fns to e.g. render
							const ptChoose = strOrObj.choose
								.split("|")
								.sort(SortUtil.ascSortLower)
								.map(pt => {
									const [filter, values] = pt.split("=");
									switch (filter.toLowerCase()) {
										case "level": return values.split(";").map(v => Parser.spLevelToFullLevelText(Number(v), {isPluralCantrips: false})).join("/");
										case "class": return values.split(";").map(v => v.toTitleCase()).join("/");
										default: return pt;
									}
								})
								.join(" ");
							return `Any ${ptChoose}`;
						});
				});
			ent._fprereqFeature = ent.prerequisite.filter(it => it.feature).map(it => it.feature);
			ent._fPrereqLevel = ent.prerequisite.filter(it => it.level).map(PageFilterOptionalFeatures.getLevelFilterItem.bind(PageFilterOptionalFeatures));
		}

		ent._dFeatureType = ent.featureType.map(ft => Parser.optFeatureTypeToFull(ft));
		ent._lFeatureType = ent.featureType.join(", ");
		ent.featureType.sort((a, b) => SortUtil.ascSortLower(Parser.optFeatureTypeToFull(a), Parser.optFeatureTypeToFull(b)));

		this._mutateForFilters_commonMisc(ent);
		if (ent.additionalSpells) ent._fMisc.push("Grants Additional Spells");
	}

	addToFilters (it, isExcluded) {
		if (isExcluded) return;

		this._sourceFilter.addItem(it._fSources);
		this._typeFilter.addItem(it.featureType);
		this._pactFilter.addItem(it._fPrereqPact);
		this._patronFilter.addItem(it._fPrereqPatron);
		this._spellFilter.addItem(it._fprereqSpell);
		this._featureFilter.addItem(it._fprereqFeature);
		this._miscFilter.addItem(it._fMisc);

		(it._fPrereqLevel || []).forEach(it => {
			this._levelFilter.addNest(it.nest, {isHidden: true});
			this._levelFilter.addItem(it);
		});
	}

	async _pPopulateBoxOptions (opts) {
		opts.filters = [
			this._sourceFilter,
			this._typeFilter,
			this._prerequisiteFilter,
			this._miscFilter,
		];
	}

	toDisplay (values, it) {
		return this._filterBox.toDisplay(
			values,
			it._fSources,
			it.featureType,
			[
				it._fPrereqPact,
				it._fPrereqPatron,
				it._fprereqSpell,
				it._fPrereqLevel,
				it._fprereqFeature,
			],
			it._fMisc,
		);
	}
}

globalThis.PageFilterOptionalFeatures = PageFilterOptionalFeatures;

class ModalFilterOptionalFeatures extends ModalFilterBase {
	/**
	 * @param opts
	 * @param opts.namespace
	 * @param [opts.isRadio]
	 * @param [opts.allData]
	 */
	constructor (opts) {
		opts = opts || {};
		super({
			...opts,
			modalTitle: `Optional Feature${opts.isRadio ? "" : "s"}`,
			pageFilter: new PageFilterOptionalFeatures(),
		});
	}

	_$getColumnHeaders () {
		const btnMeta = [
			{sort: "name", text: "Name", width: "3"},
			{sort: "type", text: "Type", width: "2"},
			{sort: "prerequisite", text: "Prerequisite", width: "4"},
			{sort: "level", text: "Level", width: "1"},
			{sort: "source", text: "Source", width: "1"},
		];
		return ModalFilterBase._$getFilterColumnHeaders(btnMeta);
	}

	async _pLoadAllData () {
		return [
			...(await DataUtil.loadJSON(`${Renderer.get().baseUrl}data/optionalfeatures.json`)).optionalfeature,
			...((await PrereleaseUtil.pGetBrewProcessed()).optionalfeature || []),
			...((await BrewUtil2.pGetBrewProcessed()).optionalfeature || []),
		];
	}

	_getListItem (pageFilter, optfeat, ftI) {
		const eleRow = document.createElement("div");
		eleRow.className = "px-0 w-100 ve-flex-col no-shrink";

		const hash = UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_OPT_FEATURES](optfeat);
		const source = Parser.sourceJsonToAbv(optfeat.source);
		const prerequisite = Renderer.utils.prerequisite.getHtml(optfeat.prerequisite, {isListMode: true, blocklistKeys: new Set(["level"])});
		const level = Renderer.optionalfeature.getListPrerequisiteLevelText(optfeat.prerequisite);

		eleRow.innerHTML = `<div class="w-100 ve-flex-vh-center lst__row-border veapp__list-row no-select lst__wrp-cells">
			<div class="ve-col-0-5 pl-0 ve-flex-vh-center">${this._isRadio ? `<input type="radio" name="radio" class="no-events">` : `<input type="checkbox" class="no-events">`}</div>

			<div class="ve-col-0-5 px-1 ve-flex-vh-center">
				<div class="ui-list__btn-inline px-2 no-select" title="Toggle Preview (SHIFT to Toggle Info Preview)">[+]</div>
			</div>

			<div class="ve-col-3 px-1 ${optfeat._versionBase_isVersion ? "italic" : ""} ${this._getNameStyle()}">${optfeat._versionBase_isVersion ? `<span class="px-3"></span>` : ""}${optfeat.name}</div>
			<span class="ve-col-2 px-1 ve-text-center" title="${optfeat._dFeatureType.join(", ").qq()}">${optfeat._lFeatureType}</span>
			<span class="ve-col-4 px-1 ve-text-center">${prerequisite}</span>
			<span class="ve-col-1 px-1 ve-text-center">${level}</span>
			<div class="ve-col-1 pl-1 pr-0 ve-flex-h-center ${Parser.sourceJsonToSourceClassname(optfeat.source)}" title="${Parser.sourceJsonToFull(optfeat.source)}" ${Parser.sourceJsonToStyle(optfeat.source)}>${source}${Parser.sourceJsonToMarkerHtml(optfeat.source)}</div>
		</div>`;

		const btnShowHidePreview = eleRow.firstElementChild.children[1].firstElementChild;

		const listItem = new ListItem(
			ftI,
			eleRow,
			optfeat.name,
			{
				hash,
				source,
				sourceJson: optfeat.source,
				page: optfeat.page,
				prerequisite,
				level,
				type: optfeat._lFeatureType,
			},
			{
				cbSel: eleRow.firstElementChild.firstElementChild.firstElementChild,
				btnShowHidePreview,
			},
		);

		ListUiUtil.bindPreviewButton(UrlUtil.PG_FEATS, this._allData, listItem, btnShowHidePreview);

		return listItem;
	}
}

globalThis.ModalFilterOptionalFeatures = ModalFilterOptionalFeatures;
