import {SOURCE_UNKNOWN_ABBREVIATION, SOURCE_UNKNOWN_FULL} from "./utils-brew-constants.js";
import {EVNT_VALCHANGE} from "../filter/filter-constants.js";

export class ManageEditableBrewContentsUi extends BaseComponent {
	static _RenderState = class {
		constructor () {
			this.tabMetaEntities = null;
			this.tabMetaSources = null;

			this.listEntities = null;
			this.listEntitiesSelectClickHandler = null;
			this.listSources = null;
			this.listSourcesSelectClickHandler = null;

			this.contentEntities = null;
			this.pageFilterEntities = new ManageEditableBrewContentsUi._PageFilter();
		}
	};

	static _PageFilter = class extends PageFilterBase {
		constructor () {
			super();
			this._categoryFilter = new Filter({header: "Category"});
		}

		_getNamespaceSnapshots () { return "PageFilterManageEditableBrewContents"; }

		static mutateForFilters (meta) {
			const {ent, prop} = meta;
			meta._fSource = SourceUtil.getEntitySource(ent);
			meta._fCategory = ManageEditableBrewContentsUi._getDisplayProp({ent, prop});
		}

		addToFilters (meta) {
			this._sourceFilter.addItem(meta._fSource);
			this._categoryFilter.addItem(meta._fCategory);
		}

		async _pPopulateBoxOptions (opts) {
			opts.filters = [
				this._sourceFilter,
				this._categoryFilter,
			];
		}

		toDisplay (values, meta) {
			return this._filterBox.toDisplay(
				values,
				meta._fSource,
				meta._fCategory,
			);
		}
	};

	static async pDoOpen ({brewUtil, brew, isModal: isParentModal = false}) {
		return new Promise((resolve, reject) => {
			const ui = new this({brewUtil, brew, isModal: true});
			const rdState = new this._RenderState();
			const {$modalInner} = UiUtil.getShowModal({
				isHeight100: true,
				title: `Manage Document Contents`,
				isUncappedHeight: true,
				isWidth100: true,
				$titleSplit: $$`<div class="ve-flex-v-center ve-btn-group">
					${ui._$getBtnDeleteSelected({rdState})}
				</div>`,
				overlayColor: isParentModal ? "transparent" : undefined,
				cbClose: () => {
					resolve(ui._getFormData());
					rdState.pageFilterEntities.filterBox.teardown();
				},
			});
			ui.pRender($modalInner, {rdState})
				.catch(e => reject(e));
		});
	}

	constructor ({brewUtil, brew, isModal}) {
		super();

		TabUiUtil.decorate(this, {isInitMeta: true});

		this._brewUtil = brewUtil;
		this._brew = MiscUtil.copyFast(brew);
		this._isModal = isModal;

		this._isDirty = false;
	}

	_getFormData () {
		return {
			isDirty: this._isDirty,
			brew: this._brew,
		};
	}

	_$getBtnDeleteSelected ({rdState}) {
		return $(`<button class="ve-btn ve-btn-danger ve-btn-xs">Delete Selected</button>`)
			.click(() => this._handleClick_pButtonDeleteSelected({rdState}));
	}

	async _handleClick_pButtonDeleteSelected ({rdState}) {
		if (this._getActiveTab() === rdState.tabMetaEntities) return this._handleClick_pButtonDeleteSelected_entities({rdState});
		if (this._getActiveTab() === rdState.tabMetaSources) return this._handleClick_pButtonDeleteSelected_sources({rdState});
		// (The metadata tab does not have any selectable elements, so, no-op)
	}

	async _handleClick_pButtonDeleteSelected_entities ({rdState}) {
		const listItemsSel = rdState.listEntities.items
			.filter(it => it.data.cbSel.checked);

		if (!listItemsSel.length) return;

		if (!await InputUiUtil.pGetUserBoolean({title: "Delete Entities", htmlDescription: `Are you sure you want to delete the ${listItemsSel.length === 1 ? "selected entity" : `${listItemsSel.length} selected entities`}?`, textYes: "Yes", textNo: "Cancel"})) return;

		this._isDirty = true;

		// Remove the array items from our copy of the brew, and remove the corresponding list items
		listItemsSel
			.forEach(li => this._doEntityListDelete({rdState, li}));
		rdState.listEntities.update();
	}

	_doEntityListDelete ({rdState, li}) {
		const ix = this._brew.body[li.data.prop].indexOf(li.data.ent);
		if (!~ix) return;
		this._brew.body[li.data.prop].splice(ix, 1);
		if (!this._brew.body[li.data.prop].length) delete this._brew.body[li.data.prop];
		rdState.listEntities.removeItem(li);
	}

	async _handleClick_pButtonDeleteSelected_sources ({rdState}) {
		const listItemsSel = rdState.listSources.items
			.filter(it => it.data.cbSel.checked);

		if (!listItemsSel.length) return;

		if (
			!await InputUiUtil.pGetUserBoolean({
				title: "Delete Sources",
				htmlDescription: `<div>Are you sure you want to delete the ${listItemsSel.length === 1 ? "selected source" : `${listItemsSel.length} selected sources`}?<br><b>This will delete all entities with ${listItemsSel.length === 1 ? "that source" : `these sources`}</b>.</div>`,
				textYes: "Yes",
				textNo: "Cancel",
			})
		) return;

		this._isDirty = true;

		// Remove the sources from our copy of the brew, and remove the corresponding list items
		listItemsSel
			.forEach(li => {
				const ix = this._brew.body._meta.sources.indexOf(li.data.source);
				if (!~ix) return;
				this._brew.body._meta.sources.splice(ix, 1);
				rdState.listSources.removeItem(li);
			});
		rdState.listSources.update();

		// Remove all entities with matching sources, and remove the corresponding list items
		const sourceSetRemoved = new Set(listItemsSel.map(li => li.data.source.json));
		rdState.listEntities.visibleItems
			.forEach(li => {
				const source = SourceUtil.getEntitySource(li.data.ent);
				if (!sourceSetRemoved.has(source)) return;

				this._doEntityListDelete({rdState, li});
			});
		rdState.listEntities.update();
	}

	async pRender ($wrp, {rdState = null} = {}) {
		rdState = rdState || new this.constructor._RenderState();

		const iptTabMetas = [
			new TabUiUtil.TabMeta({name: "Entities", hasBorder: true}),
			new TabUiUtil.TabMeta({name: "Metadata", hasBorder: true}),
			new TabUiUtil.TabMeta({name: "Sources", hasBorder: true}),
		];

		const tabMetas = this._renderTabs(iptTabMetas, {$parent: $wrp});
		const [tabMetaEntities, tabMetaMetadata, tabMetaSources] = tabMetas;

		rdState.tabMetaEntities = tabMetaEntities;
		rdState.tabMetaSources = tabMetaSources;

		this._pRender_tabEntities({tabMeta: tabMetaEntities, rdState});
		this._pRender_tabMetadata({tabMeta: tabMetaMetadata, rdState});
		this._pRender_tabSources({tabMeta: tabMetaSources, rdState});
	}

	_pRender_tabEntities ({tabMeta, rdState}) {
		const $btnFilter = $(`<button class="ve-btn ve-btn-default">Filter</button>`);

		const $btnToggleSummaryHidden = $(`<button class="ve-btn ve-btn-default" title="Toggle Filter Summary Display"><span class="glyphicon glyphicon-resize-small"></span></button>`);

		const $btnReset = $(`<button class="ve-btn ve-btn-default">Reset</button>`);

		const $wrpMiniPills = $(`<div class="fltr__mini-view ve-btn-group"></div>`);

		const $cbAll = $(`<input type="checkbox">`);
		const $wrpRows = $$`<div class="list ve-flex-col w-100 max-h-unset"></div>`;
		const $iptSearch = $(`<input type="search" class="search manbrew__search form-control w-100 lst__search lst__search--no-border-h" placeholder="Search entries...">`);
		const $dispCntVisible = $(`<div class="lst__wrp-search-visible no-events ve-flex-vh-center"></div>`);
		const $wrpBtnsSort = $$`<div class="filtertools manbrew__filtertools input-group input-group--bottom ve-flex no-shrink">
			<label class="ve-btn ve-btn-default ve-btn-xs ve-col-1 pr-0 ve-flex-vh-center">${$cbAll}</label>
			<button class="ve-col-5 sort ve-btn ve-btn-default ve-btn-xs" data-sort="name">Name</button>
			<button class="ve-col-1 sort ve-btn ve-btn-default ve-btn-xs" data-sort="source">Source</button>
			<button class="ve-col-5 sort ve-btn ve-btn-default ve-btn-xs" data-sort="category">Category</button>
		</div>`;

		$$(tabMeta.$wrpTab)`
		<div class="ve-flex-v-stretch input-group input-group--top no-shrink mt-1">
			${$btnFilter}
			${$btnToggleSummaryHidden}
			<div class="w-100 relative">
				${$iptSearch}
				<div id="lst__search-glass" class="lst__wrp-search-glass no-events ve-flex-vh-center"><span class="glyphicon glyphicon-search"></span></div>
				${$dispCntVisible}
			</div>
			${$btnReset}
		</div>

		${$wrpMiniPills}

		${$wrpBtnsSort}
		${$wrpRows}`;

		rdState.listEntities = new List({
			$iptSearch,
			$wrpList: $wrpRows,
			fnSort: SortUtil.listSort,
		});

		rdState.listEntities.on("updated", () => $dispCntVisible.html(`${rdState.listEntities.visibleItems.length}/${rdState.listEntities.items.length}`));

		rdState.listEntitiesSelectClickHandler = new ListSelectClickHandler({list: rdState.listEntities});
		rdState.listEntitiesSelectClickHandler.bindSelectAllCheckbox($cbAll);
		SortUtil.initBtnSortHandlers($wrpBtnsSort, rdState.listEntities);

		let ixParent = 0;
		rdState.contentEntities = Object.entries(this._brew.body)
			.filter(([, v]) => v instanceof Array && v.length)
			.map(([prop, arr]) => arr.map(ent => ({ent, prop, ixParent: ixParent++})))
			.flat();

		rdState.contentEntities.forEach(({ent, prop, ixParent}) => {
			const {listItem} = this._pRender_getEntityRowMeta({rdState, prop, ent, ixParent});
			rdState.listEntities.addItem(listItem);
		});

		rdState.pageFilterEntities.pInitFilterBox({
			$iptSearch: $iptSearch,
			$btnReset: $btnReset,
			$btnOpen: $btnFilter,
			$btnToggleSummaryHidden: $btnToggleSummaryHidden,
			$wrpMiniPills: $wrpMiniPills,
			namespace: `${this.constructor.name}__tabEntities`,
		}).then(async () => {
			rdState.contentEntities.forEach(meta => rdState.pageFilterEntities.mutateAndAddToFilters(meta));

			rdState.listEntities.init();

			rdState.pageFilterEntities.trimState();
			rdState.pageFilterEntities.filterBox.render();

			rdState.pageFilterEntities.filterBox.on(
				EVNT_VALCHANGE,
				this._handleFilterChange_entities.bind(this, {rdState}),
			);

			this._handleFilterChange_entities({rdState});

			$iptSearch.focus();
		});
	}

	_handleFilterChange_entities ({rdState}) {
		const f = rdState.pageFilterEntities.filterBox.getValues();
		rdState.listEntities.filter(li => rdState.pageFilterEntities.toDisplay(f, rdState.contentEntities[li.ix]));
	}

	_pRender_getEntityRowMeta ({rdState, prop, ent, ixParent}) {
		const eleLi = document.createElement("div");
		eleLi.className = "lst__row ve-flex-col px-0";

		const dispName = this.constructor._getDisplayName({brew: this._brew, ent, prop});
		const sourceMeta = this.constructor._getSourceMeta({brew: this._brew, ent});
		const dispProp = this.constructor._getDisplayProp({ent, prop});

		eleLi.innerHTML = `<label class="lst__row-border lst__row-inner no-select mb-0 ve-flex-v-center">
			<div class="pl-0 ve-col-1 ve-flex-vh-center"><input type="checkbox" class="no-events"></div>
			<div class="ve-col-5 bold">${dispName}</div>
			<div class="ve-col-1 ve-text-center" title="${(sourceMeta.full || "").qq()}" ${this._brewUtil.sourceToStyle(sourceMeta)}>${sourceMeta.abbreviation}</div>
			<div class="ve-col-5 ve-flex-vh-center pr-0">${dispProp}</div>
		</label>`;

		const listItem = new ListItem(
			ixParent, // We identify the item in the list according to its position across all props
			eleLi,
			dispName,
			{
				source: sourceMeta.abbreviation,
				category: dispProp,
			},
			{
				cbSel: eleLi.firstElementChild.firstElementChild.firstElementChild,
				prop,
				ent,
			},
		);

		eleLi.addEventListener("click", evt => rdState.listEntitiesSelectClickHandler.handleSelectClick(listItem, evt));

		return {
			listItem,
		};
	}

	_pRender_tabMetadata ({tabMeta, rdState}) {
		const infoTuples = Object.entries(this.constructor._PROP_INFOS_META).filter(([k]) => Object.keys(this._brew.body?._meta?.[k] || {}).length);

		if (!infoTuples.length) {
			$$(tabMeta.$wrpTab)`
				<h4>Metadata</h4>
				<p><i>No metadata found.</i></p>
			`;
			return;
		}

		const metasSections = infoTuples
			.map(([prop, info]) => this._pRender_getMetaRowMeta({prop, info}));

		$$(tabMeta.$wrpTab)`
			<div class="pt-2"><i>Warning: deleting metadata may invalidate or otherwise corrupt homebrew which depends on it. Use with caution.</i></div>
			<hr class="hr-3">
			${metasSections.map(({$wrp}) => $wrp)}
		`;
	}

	_pRender_getMetaRowMeta ({prop, info}) {
		const displayName = info.displayName || prop.toTitleCase();
		const displayFn = info.displayFn || ((...args) => args.last().toTitleCase());

		const $rows = Object.keys(this._brew.body._meta[prop])
			.map(k => {
				const $btnDelete = $(`<button class="ve-btn ve-btn-danger ve-btn-xs" title="Delete"><span class="glyphicon glyphicon-trash"></span></button>`)
					.click(() => {
						this._isDirty = true;
						MiscUtil.deleteObjectPath(this._brew.body._meta, prop, k);
						$row.remove();

						// If we deleted the last key and the whole prop has therefore been cleaned up, delete the section
						if (this._brew.body._meta[prop]) return;

						$wrp.remove();
					});

				const $row = $$`<div class="lst__row ve-flex-col px-0">
					<div class="split-v-center lst__row-border lst__row-inner no-select mb-0 ve-flex-v-center">
						<div class="ve-col-10">${displayFn(this._brew, prop, k)}</div>
						<div class="ve-col-2 ve-btn-group ve-flex-v-center ve-flex-h-right">
							${$btnDelete}
						</div>
					</div>
				</div>`;

				return $row;
			});

		const $wrp = $$`<div class="ve-flex-col mb-4">
			<div class="bold mb-2">${displayName}:</div>
			<div class="ve-flex-col list-display-only">${$rows}</div>
		</div>`;

		return {
			$wrp,
		};
	}

	_pRender_tabSources ({tabMeta, rdState}) {
		const $cbAll = $(`<input type="checkbox">`);
		const $wrpRows = $$`<div class="list ve-flex-col w-100 max-h-unset"></div>`;
		const $iptSearch = $(`<input type="search" class="search manbrew__search form-control w-100 mt-1" placeholder="Search source...">`);
		const $wrpBtnsSort = $$`<div class="filtertools manbrew__filtertools input-group input-group--bottom ve-flex no-shrink">
			<label class="ve-btn ve-btn-default ve-btn-xs ve-col-1 pr-0 ve-flex-vh-center">${$cbAll}</label>
			<button class="ve-col-5 sort ve-btn ve-btn-default ve-btn-xs" data-sort="name">Name</button>
			<button class="ve-col-2 sort ve-btn ve-btn-default ve-btn-xs" data-sort="abbreviation">Abbreviation</button>
			<button class="ve-col-4 sort ve-btn ve-btn-default ve-btn-xs" data-sort="json">JSON</button>
		</div>`;

		$$(tabMeta.$wrpTab)`
		${$iptSearch}
		${$wrpBtnsSort}
		${$wrpRows}`;

		rdState.listSources = new List({
			$iptSearch,
			$wrpList: $wrpRows,
			fnSort: SortUtil.listSort,
		});

		rdState.listSourcesSelectClickHandler = new ListSelectClickHandler({list: rdState.listSources});
		rdState.listSourcesSelectClickHandler.bindSelectAllCheckbox($cbAll);
		SortUtil.initBtnSortHandlers($wrpBtnsSort, rdState.listSources);

		(this._brew.body?._meta?.sources || [])
			.forEach((source, ix) => {
				const {listItem} = this._pRender_getSourceRowMeta({rdState, source, ix});
				rdState.listSources.addItem(listItem);
			});

		rdState.listSources.init();
		$iptSearch.focus();
	}

	_pRender_getSourceRowMeta ({rdState, source, ix}) {
		const eleLi = document.createElement("div");
		eleLi.className = "lst__row ve-flex-col px-0";

		const name = source.full || SOURCE_UNKNOWN_FULL;
		const abv = source.abbreviation || SOURCE_UNKNOWN_ABBREVIATION;

		eleLi.innerHTML = `<label class="lst__row-border lst__row-inner no-select mb-0 ve-flex-v-center">
			<div class="pl-0 ve-col-1 ve-flex-vh-center"><input type="checkbox" class="no-events"></div>
			<div class="ve-col-5 bold">${name}</div>
			<div class="ve-col-2 ve-text-center">${abv}</div>
			<div class="ve-col-4 ve-flex-vh-center pr-0">${source.json}</div>
		</label>`;

		const listItem = new ListItem(
			ix,
			eleLi,
			name,
			{
				abbreviation: abv,
				json: source.json,
			},
			{
				cbSel: eleLi.firstElementChild.firstElementChild.firstElementChild,
				source,
			},
		);

		eleLi.addEventListener("click", evt => rdState.listSourcesSelectClickHandler.handleSelectClick(listItem, evt));

		return {
			listItem,
		};
	}

	static _NAME_UNKNOWN = "(Unknown)";

	static _getDisplayName ({brew, ent, prop}) {
		switch (prop) {
			case "itemProperty": {
				if (ent.name) return ent.name || this._NAME_UNKNOWN;
				if (ent.entries) {
					const name = Renderer.findName(ent.entries);
					if (name) return name;
				}
				if (ent.entriesTemplate) {
					const name = Renderer.findName(ent.entriesTemplate);
					if (name) return name;
				}
				return ent.abbreviation || this._NAME_UNKNOWN;
			}

			case "adventureData":
			case "bookData": {
				const propContents = prop === "adventureData" ? "adventure" : "book";

				if (!brew[propContents]) return ent.id || this._NAME_UNKNOWN;

				return brew[propContents].find(it => it.id === ent.id)?.name || ent.id || this._NAME_UNKNOWN;
			}

			default: return ent.name || this._NAME_UNKNOWN;
		}
	}

	static _getSourceMeta ({brew, ent}) {
		const entSource = SourceUtil.getEntitySource(ent);
		if (!entSource) return {abbreviation: SOURCE_UNKNOWN_ABBREVIATION, full: SOURCE_UNKNOWN_FULL};
		const source = (brew.body?._meta?.sources || []).find(src => src.json === entSource);
		if (!source) return {abbreviation: SOURCE_UNKNOWN_ABBREVIATION, full: SOURCE_UNKNOWN_FULL};
		return source;
	}

	static _getDisplayProp ({ent, prop}) {
		const out = [Parser.getPropDisplayName(prop)];

		switch (prop) {
			case "subclass": out.push(` (${ent.className})`); break;
			case "subrace": out.push(` (${ent.raceName})`); break;
			case "psionic": out.push(` (${Parser.psiTypeToMeta(ent.type).short})`); break;
		}

		return out.filter(Boolean).join(" ");
	}

	/** These are props found in "_meta" sections of files */
	static _PROP_INFOS_META = {
		"spellDistanceUnits": {
			displayName: "Spell Distance Units",
		},
		"spellSchools": {
			displayName: "Spell Schools",
			displayFn: (brew, propMeta, k) => brew.body._meta[propMeta][k].full || k,
		},
		"currencyConversions": {
			displayName: "Currency Conversion Tables",
			displayFn: (brew, propMeta, k) => `${k}: ${brew.body._meta[propMeta][k].map(it => `${it.coin}=${it.mult}`).join(", ")}`,
		},
		"skills": {
			displayName: "Skills",
		},
		"senses": {
			displayName: "Senses",
		},
		"featCategories": {
			displayName: "Feat Categories",
			displayFn: (brew, propMeta, k) => brew.body._meta[propMeta][k] || k,
		},
		"optionalFeatureTypes": {
			displayName: "Optional Feature Types",
			displayFn: (brew, propMeta, k) => brew.body._meta[propMeta][k] || k,
		},
		"charOption": {
			displayName: "Character Creation Option Types",
			displayFn: (brew, propMeta, k) => brew.body._meta[propMeta][k] || k,
		},
		"psionicTypes": {
			displayName: "Psionic Types",
			displayFn: (brew, propMeta, k) => brew.body._meta[propMeta][k].full || k,
		},
	};
}
