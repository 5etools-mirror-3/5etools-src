export class FilterSnapshotBaseSelectClickHandler extends RenderableCollectionSelectClickHandler {
	_setHighlighted (item, {toVal = false} = {}) {
		item.stgHeader.toggleClass("list-multi-selected", toVal);
	}
}

/** @abstract */
export class RenderableCollectionFilterSnapshotBase extends RenderableCollectionGenericRows {
	constructor (
		{
			filterBox,
			comp,
			prop,
			$wrpRows,
			selectClickHandler,
		},
	) {
		super(comp, prop, $wrpRows);
		this._filterBox = filterBox;
		this._selectClickHandler = selectClickHandler;
	}

	/* -------------------------------------------- */

	doCleanup () {
		const rendered = this._comp._getRenderedCollection();
		Object.values(rendered)
			.forEach(({fnCleanup}) => fnCleanup?.());
	}

	doDeleteExistingRender (rendered) {
		rendered.fnCleanup?.();
	}

	/* -------------------------------------------- */

	getNewRender (entity, i) {
		const rendered = super.getNewRender(entity, i);

		const [wrpRow] = rendered.$wrpRow;
		e_({ele: wrpRow})
			.onn("click", evt => this._selectClickHandler.handleSelectClick(rendered, evt, {isPassThroughEvents: true}));

		rendered.wrpCbSel
			.onn("mousedown", evt => {
				evt.preventDefault();
				evt.stopPropagation();
			})
		;

		return rendered;
	}

	_getWrpRow () {
		return ee`<div class="ve-flex-col w-100"></div>`;
	}

	/* -------------------------------------------- */

	static _getCbSel () {
		return ee`<input type="checkbox" class="no-events">`;
	}

	static _getBtnToggleExpand (comp, {isSibling = false} = {}) {
		const btnExpand = ee`<div class="py-1 ve-flex-vh-center h-100 clickable no-select${isSibling ? ` mr-1 px-2` : ` w-100`}"></div>`
			.onn("click", evt => {
				evt.stopPropagation();
				comp._state.manager_loader_isExpanded = !comp._state.manager_loader_isExpanded;
			});
		comp._addHookBase("manager_loader_isExpanded", () => {
			btnExpand
				.txt(comp._state.manager_loader_isExpanded ? `[\u2013]` : `[+]`)
				.tooltip(comp._state.manager_loader_isExpanded ? "Collapse" : "Expand");
		})();
		return btnExpand;
	}

	/* -------------------------------------------- */

	_getSnapshotsPreviewState ({snapshots}) {
		const previewState = {};
		this._filterBox.filters
			.forEach(filter => {
				if (!filter.isAnySnapshotRelevant({snapshots})) return;
				Object.assign(previewState, filter.getResetState({snapshots}));
			});
		return previewState;
	}

	/* -------------------------------------------- */

	_getSnapshotsDisplayState ({snapshots}) {
		const previewState = this._getSnapshotsPreviewState({snapshots});
		return this._getPreviewStateDisplayState({previewState});
	}

	_getDeckSnapshotsDisplayState ({boxSnapshotDeck}) {
		const snapshots = this._comp.getSnapshots({boxSnapshotDeck});

		const previewState = {};
		this._filterBox.filters
			.forEach(filter => Object.assign(previewState, filter.getResetState({snapshots})));

		return this._getPreviewStateDisplayState({previewState});
	}

	_getPreviewStateDisplayState ({previewState}) {
		const ptsFilter = [];
		const filtersDefault = [];

		this._filterBox.filters
			.forEach(filter => {
				if (!previewState[filter.header]) return;

				const displayStateParts = filter.getDisplayStatePartsHtml({nxtState: previewState, isIgnoreSnapshot: true});
				if (displayStateParts.length) return ptsFilter.push(...displayStateParts);

				filtersDefault.push(filter.header);
			});

		if (!ptsFilter.length && !filtersDefault.length) {
			return this._getPreviewStateDisplayState_getJoined([`<i class="ve-muted">(No filters)</i>`]);
		}

		return this._getPreviewStateDisplayState_getJoined(
			[
				...ptsFilter,
				filtersDefault.length
					? `<span class="ve-text-right w-140p no-shrink mr-2 bold ve-muted">Default:</span><span class="ve-muted">${filtersDefault.join(" | ")}</span>`
					: null,
			],
		);
	}

	_getPreviewStateDisplayState_getJoined (pts) {
		return pts
			.filter(Boolean)
			.map((pt, i, arr) => `<div class="ve-flex-v-center ${arr.length - 1 === i ? "" : "mb-1"}">${pt}</div>`)
			.join("\n");
	}

	/* -------------------------------------------- */

	_getSnapshotsDefaultFilterHeaders ({snapshots}) {
		const previewState = this._getSnapshotsPreviewState({snapshots});

		const filtersDefault = [];

		this._filterBox.filters
			.flatMap(filter => [filter, ...filter.getChildFilters()])
			.forEach(filter => {
				if (!previewState[filter.header]) return;

				if (filter.isAnyStateNotDefault({nxtState: previewState, isIgnoreSnapshot: true})) return;

				filtersDefault.push(filter.header);
			});

		return filtersDefault;
	}
}
