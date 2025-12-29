import {RenderOptionalFeatures} from "./render-optionalfeatures.js";

class OptionalFeaturesSublistManager extends SublistManager {
	constructor () {
		super({
			sublistListOptions: {
				fnSort: PageFilterOptionalFeatures.sortOptionalFeatures,
			},
		});
	}

	static _getRowTemplate () {
		return [
			new SublistCellTemplate({
				name: "Name",
				css: "bold ve-col-4 pl-0 pr-1",
				colStyle: "",
			}),
			new SublistCellTemplate({
				name: "Type",
				css: "ve-col-2 px-1 ve-text-center",
				colStyle: "text-center",
			}),
			new SublistCellTemplate({
				name: "Prerequisite",
				css: "ve-col-4-5 px-1",
				colStyle: "",
			}),
			new SublistCellTemplate({
				name: "Level",
				css: "ve-col-1-5 ve-text-center pl-1 pr-0",
				colStyle: "text-center",
			}),
		];
	}

	pGetSublistItem (it, hash) {
		const prerequisite = Renderer.utils.prerequisite.getHtml(it.prerequisite, {isListMode: true, keyOptions: {level: {isNameOnly: true}}});
		const level = Renderer.optionalfeature.getListPrerequisiteLevelText(it.prerequisite);
		const cellsText = [
			it.name,
			new SublistCell({title: it._dFeatureType.join(", "), text: it._lFeatureType}),
			prerequisite,
			level,
		];

		const ele = ee`<div class="lst__row lst__row--sublist ve-flex-col">
			<a href="#${hash}" class="lst__row-border lst__row-inner">
				${this.constructor._getRowCellsHtml({values: cellsText})}
			</a>
		</div>`
			.onn("contextmenu", evt => this._handleSublistItemContextMenu(evt, listItem))
			.onn("click", evt => this._listSub.doSelect(listItem, evt));

		const listItem = new ListItem(
			hash,
			ele,
			it.name,
			{
				hash,
				page: it.page,
				type: it._lFeatureType,
				prerequisite,
				level,
			},
			{
				entity: it,
				mdRow: [...cellsText],
			},
		);
		return listItem;
	}
}

class OptionalFeaturesPage extends ListPage {
	constructor () {
		const pageFilter = new PageFilterOptionalFeatures();

		super({
			dataSource: DataUtil.optionalfeature.loadJSON.bind(DataUtil.optionalfeature),

			pFnGetFluff: Renderer.optionalfeature.pGetFluff.bind(Renderer.optionalfeature),

			pageFilter,

			listOptions: {
				fnSort: PageFilterOptionalFeatures.sortOptionalFeatures,
			},

			dataProps: ["optionalfeature"],

			bookViewOptions: {
				nameSingular: "optional feature",
				namePlural: "optional features",
				pageTitle: "Optional Features Book View",
			},

			isPreviewable: true,
		});
	}

	getListItem (it, ivI, isExcluded) {
		this._pageFilter.mutateAndAddToFilters(it, isExcluded);

		const eleLi = document.createElement("div");
		eleLi.className = `lst__row ve-flex-col ${isExcluded ? "lst__row--blocklisted" : ""}`;

		const source = Parser.sourceJsonToAbv(it.source);
		const hash = UrlUtil.autoEncodeHash(it);
		const prerequisite = Renderer.utils.prerequisite.getHtml(it.prerequisite, {isListMode: true, keyOptions: {level: {isNameOnly: true}}});
		const level = Renderer.optionalfeature.getListPrerequisiteLevelText(it.prerequisite);

		eleLi.innerHTML = `<a href="#${hash}" class="lst__row-border lst__row-inner">
			<span class="ve-col-0-3 px-0 ve-flex-vh-center lst__btn-toggle-expand ve-self-flex-stretch no-select">[+]</span>
			<span class="bold ve-col-3 px-1">${it.name}</span>
			<span class="ve-col-1-5 px-1 ve-text-center" title="${it._dFeatureType.join(", ").qq()}">${it._lFeatureType}</span>
			<span class="ve-col-4-7 px-1">${prerequisite}</span>
			<span class="ve-col-1 px-1 ve-text-center">${level}</span>
			<span class="ve-col-1-5 ${Parser.sourceJsonToSourceClassname(it.source)} ve-text-center pl-1 pr-0" title="${Parser.sourceJsonToFull(it.source)}">${source}</span>
		</a>
		<div class="ve-flex ve-hidden relative accordion__wrp-preview">
			<div class="vr-0 absolute accordion__vr-preview"></div>
			<div class="ve-flex-col py-3 ml-4 accordion__wrp-preview-inner"></div>
		</div>`;

		const listItem = new ListItem(
			ivI,
			eleLi,
			it.name,
			{
				hash,
				source,
				page: it.page,
				prerequisite,
				level,
				type: it._lFeatureType,
			},
			{
				isExcluded,
			},
		);

		eleLi.addEventListener("click", (evt) => this._list.doSelect(listItem, evt));
		eleLi.addEventListener("contextmenu", (evt) => this._openContextMenu(evt, this._list, listItem));

		return listItem;
	}

	_renderStats_doBuildStatsTab ({ent}) {
		this._wrpTabs.parente().find(`.opt-feature-type`)?.remove();

		Promise.any([
			Renderer.utils.pHasFluffText(ent, "optionalfeatureFluff"),
			Renderer.utils.pHasFluffImages(ent, "optionalfeatureFluff"),
		])
			.then(hasAnyFluff => {
				const wrpOptFeatType = ee`<div class="opt-feature-type"></div>`;

				if (hasAnyFluff) wrpOptFeatType.addClass("ml-0 mb-1").insertBefore(this._wrpTabs);
				else wrpOptFeatType.prependTo(this._wrpTabs);

				const commonPrefix = ent.featureType.length > 1 ? MiscUtil.findCommonPrefix(ent.featureType.map(fs => Parser.optFeatureTypeToFull(fs)), {isRespectWordBoundaries: true}) : "";
				if (commonPrefix) wrpOptFeatType.appends(`<span>${commonPrefix.trim()} </span>`);

				ent.featureType.forEach((ft, i) => {
					if (i > 0) wrpOptFeatType.appends(`<span>/</span>`);
					ee`<span class="roller">${Parser.optFeatureTypeToFull(ft).substring(commonPrefix.length)}</span>`
						.onn("click", () => {
							this._filterBox.setFromValues({"Feature Type": {[ft]: 1}});
							this.handleFilterChange();
						})
						.appendTo(wrpOptFeatType);
				});
			});

		this._pgContent.empty().appends(RenderOptionalFeatures.getRenderedOptionalFeature(ent));
	}
}

const optionalFeaturesPage = new OptionalFeaturesPage();
optionalFeaturesPage.sublistManager = new OptionalFeaturesSublistManager();
window.addEventListener("load", () => optionalFeaturesPage.pOnLoad());

globalThis.dbg_page = optionalFeaturesPage;
