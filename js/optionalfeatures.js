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
				css: "ve-bold ve-col-4 ve-pl-0 ve-pr-1",
				colStyle: "",
			}),
			new SublistCellTemplate({
				name: "Type",
				css: "ve-col-2 ve-px-1 ve-text-center",
				colStyle: "text-center",
			}),
			new SublistCellTemplate({
				name: "Prerequisite",
				css: "ve-col-4-5 ve-px-1",
				colStyle: "",
			}),
			new SublistCellTemplate({
				name: "Level",
				css: "ve-col-1-5 ve-text-center ve-pl-1 ve-pr-0",
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

		const ele = veT`<div class="ve-lst__row ve-lst__row--sublist ve-flex-col">
			<a href="#${hash}" class="ve-lst__row-border ve-lst__row-inner">
				${this.constructor._getRowCellsHtml({values: cellsText})}
			</a>
		</div>`
			.vee.onn("contextmenu", evt => this._handleSublistItemContextMenu(evt, listItem))
			.vee.onn("click", evt => this._listSub.doSelect(listItem, evt));

		const listItem = new ListItem(
			hash,
			ele,
			it.name,
			{
				...ListItem.getCommonValues(it),
				type: it._lFeatureType,
				prerequisite,
				level,
			},
			{
				hash,
				page: it.page,
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
		eleLi.className = `ve-lst__row ve-flex-col ${isExcluded ? "ve-lst__row--blocklisted" : ""}`;

		const source = Parser.sourceJsonToAbv(it.source);
		const hash = UrlUtil.autoEncodeHash(it);
		const prerequisite = Renderer.utils.prerequisite.getHtml(it.prerequisite, {isListMode: true, keyOptions: {level: {isNameOnly: true}}});
		const level = Renderer.optionalfeature.getListPrerequisiteLevelText(it.prerequisite);

		eleLi.innerHTML = `<a href="#${hash}" class="ve-lst__row-border ve-lst__row-inner">
			<span class="ve-col-0-3 ve-px-0 ve-flex-vh-center ve-lst__btn-toggle-expand ve-self-flex-stretch ve-no-select">[+]</span>
			<span class="ve-bold ve-col-3 ve-px-1">${it.name}</span>
			<span class="ve-col-1-5 ve-px-1 ve-text-center" title="${it._dFeatureType.join(", ").qq()}">${it._lFeatureType}</span>
			<span class="ve-col-4-7 ve-px-1">${prerequisite}</span>
			<span class="ve-col-1 ve-px-1 ve-text-center">${level}</span>
			<span class="ve-col-1-5 ${Parser.sourceJsonToSourceClassname(it.source)} ve-text-center ve-pl-1 ve-pr-0" title="${Parser.sourceJsonToFull(it.source)}">${source}</span>
		</a>
		<div class="ve-flex ve-hidden ve-relative ve-accordion__wrp-preview">
			<div class="ve-vr-0 ve-absolute ve-accordion__vr-preview"></div>
			<div class="ve-flex-col ve-py-3 ve-ml-4 ve-accordion__wrp-preview-inner"></div>
		</div>`;

		const listItem = new ListItem(
			ivI,
			eleLi,
			it.name,
			{
				source,
				...ListItem.getCommonValues(it),
				prerequisite,
				level,
				type: it._lFeatureType,
			},
			{
				hash,
				page: it.page,
				isExcluded,
			},
		);

		eleLi.addEventListener("click", (evt) => this._list.doSelect(listItem, evt));
		eleLi.addEventListener("contextmenu", (evt) => this._openContextMenu(evt, this._list, listItem));

		return listItem;
	}

	_renderStats_doBuildStatsTab ({ent}) {
		this._wrpTabs.vee.parent().vee.find(`[data-name="opt-feature-type"]`)?.remove();

		Promise.any([
			Renderer.utils.pHasFluffText(ent, "optionalfeatureFluff"),
			Renderer.utils.pHasFluffImages(ent, "optionalfeatureFluff"),
		])
			.then(hasAnyFluff => {
				const wrpOptFeatType = veT`<div data-name="opt-feature-type" class="ve-italic ve-inline-block"></div>`;

				if (hasAnyFluff) wrpOptFeatType.vee.addClass("ve-mb-1").vee.insertBefore(this._wrpTabs);
				else wrpOptFeatType.vee.addClass("ve-pl-7p").vee.prependTo(this._wrpTabs);

				const commonPrefix = ent.featureType.length > 1 ? MiscUtil.findCommonPrefix(ent.featureType.map(fs => Parser.optFeatureTypeToFull(fs)), {isRespectWordBoundaries: true}) : "";
				if (commonPrefix) wrpOptFeatType.vee.appends(`<span>${commonPrefix.trim()} </span>`);

				ent.featureType.forEach((ft, i) => {
					if (i > 0) wrpOptFeatType.vee.appends(`<span>/</span>`);
					veT`<span class="ve-roller">${Parser.optFeatureTypeToFull(ft).substring(commonPrefix.length)}</span>`
						.vee.onn("click", () => {
							this._filterBox.setFromValues({"Feature Type": {[ft]: 1}});
							this.handleFilterChange();
						})
						.vee.appendTo(wrpOptFeatType);
				});
			});

		this._pgContent.vee.empty().vee.appends(RenderOptionalFeatures.getRenderedOptionalFeature(ent));
	}
}

const optionalFeaturesPage = new OptionalFeaturesPage();
optionalFeaturesPage.sublistManager = new OptionalFeaturesSublistManager();
window.addEventListener("load", () => optionalFeaturesPage.pOnLoad());

globalThis.dbg_page = optionalFeaturesPage;
