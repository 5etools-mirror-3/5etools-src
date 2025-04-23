import {RenderableCollectionFilterSnapshotBase} from "./filter-snapshot-ui-collection-base.js";

export class RenderableCollectionSnapshots extends RenderableCollectionFilterSnapshotBase {
	constructor (
		{
			filterBox,
			comp,
			$wrpRows,
			selectClickHandler,
		},
	) {
		super({filterBox, comp, prop: "boxSnapshots", $wrpRows, selectClickHandler});
	}

	/* -------------------------------------------- */

	_populateRow ({comp, $wrpRow, entity}) {
		// region Bind cache-flush hooks
		comp._addHookBase("filterSnapshots", () => {
			const activeSnapshotDeck = this._comp.getActiveSnapshotDeck();
			if (activeSnapshotDeck == null) return;

			if (!activeSnapshotDeck.entity?.boxSnapshotIds?.includes(entity.id)) return;

			this._comp._state.pulse_flushResolverCache = !this._comp._state.pulse_flushResolverCache;
		});
		// endregion

		// region Trigger deck display update
		comp._addHookBase("filterSnapshots", () => {
			const linkedSnapshotDecks = (this._comp._state.boxSnapshotDecks || [])
				.filter(boxSnapshotDeck => boxSnapshotDeck.entity?.boxSnapshotIds?.some(boxSnapshotId => boxSnapshotId.entity.boxSnapshotId === entity.id));
			if (!linkedSnapshotDecks.length) return;

			const boxSnapshotDeckCollectionRenders = this._comp._getRenderedCollection({prop: "boxSnapshotDecks"});
			linkedSnapshotDecks
				.map(boxSnapshotDeck => boxSnapshotDeckCollectionRenders[boxSnapshotDeck.id])
				.forEach(({comp}) => comp._triggerCollectionUpdate("boxSnapshotIds"));
		});
		// endregion

		const cbSel = this.constructor._getCbSel();

		const wrpCbSel = ee`<label class="ve-col-0-5 h-100 ve-flex-h-center">
			${cbSel}
		</label>`;

		const btnToggleExpand = this.constructor._getBtnToggleExpand(comp, {isSibling: true});

		const $iptName = ComponentUiUtil.$getIptStr(comp, "manager_name", {placeholder: "Name"});

		// On updating name, find all decks in which this snapshot is used, and update the transient name
		comp._addHookBase("manager_name", () => {
			let isAnyChange = false;

			this._comp._state.boxSnapshotDecks
				.forEach(entityInfoBoxSnapshotDeck => {
					entityInfoBoxSnapshotDeck.entity.boxSnapshotIds
						.forEach(entityInfoBoxSnapshotId => {
							if (entityInfoBoxSnapshotId.entity.boxSnapshotId !== entity.id) return;

							entityInfoBoxSnapshotId.entity._manager_name = comp._state.manager_name;

							isAnyChange = true;
						});
				});

			if (!isAnyChange) return;

			this._comp._triggerCollectionUpdate("boxSnapshotDecks");
		});

		const btnDelete = this._utils.getBtnDelete({entity});

		const btnApply = ee`<button class="ve-btn ve-btn-xs ve-btn-primary" title="Apply as Filters"><span class="glyphicon glyphicon-ok"></span></button>`
			.onn("click", async () => {
				this._comp.doSetFiltersFromBoxSnapshot_(entity.entity);
				JqueryUtil.doToast("Applied Snapshot as Filters!");
			});

		const btnAddToDeck = ee`<button class="ve-btn ve-btn-xs ve-btn-default mr-2">Add to Snapshot Deck</button>`
			.onn("click", async () => {
				if (!this._comp._state.boxSnapshotDecks.length) return JqueryUtil.doToast({content: `No snapshot decks available! Please create one first.`, type: "warning"});

				const {boxSnapshotDeck} = await this._comp.pGetUserBoxSnapshotDeckInfo();
				if (!boxSnapshotDeck) return;

				boxSnapshotDeck.entity.boxSnapshotIds = [
					...boxSnapshotDeck.entity.boxSnapshotIds || [],
					this._comp.getNewBoxSnapshotId({
						boxSnapshotId: entity.id,
						_manager_name: entity.entity?.manager_name,
					}),
				]
					.unique(entityInfo => entityInfo.entity.boxSnapshotId);

				this._comp._triggerCollectionUpdate("boxSnapshotDecks");

				JqueryUtil.doToast(`Added to Snapshot Deck!`);
			});

		const stgHeader = ee`<div class="ve-flex-v-center w-100 py-1 lst__row lst__row-border lst__row-inner">
			${wrpCbSel}

			<div class="ve-flex-vh-center ve-col-1">
				${btnToggleExpand}
				${btnApply}
			</div>

			<div class="ve-flex-v-center ve-col-8-5 px-1">
				${$iptName[0]}
			</div>

			<div class="ve-flex-vh-center ve-grow">
				${btnAddToDeck}
				${btnDelete}
			</div>
		</div>`;

		const wrpDisplayState = ee`<div class="ve-flex-col w-100"></div>`;
		comp._addHookBase("filterSnapshots", () => {
			wrpDisplayState.html(this._getSnapshotsDisplayState({snapshots: comp._state.filterSnapshots}));
		})();

		const btnClearDefaults = ee`<button class="ve-btn ve-btn-xs ve-btn-default" title="Remove any defaulted filters from the snapshot. This allows a snapshot to more easily combine with other snapshots in a snapshot deck.">Remove &quot;Default&quot;</button>`
			.onn("click", () => {
				const headersDefault = new Set(this._getSnapshotsDefaultFilterHeaders({snapshots: comp._state.filterSnapshots}));

				comp._state.filterSnapshots = comp._state.filterSnapshots
					.filter(snapshot => !headersDefault.has(snapshot.header));
			});

		const wrpDetailsFooter = ee`<div class="w-100 ve-flex-v-center mt-2 pl-2">
			<div class="w-140p h-100 no-shrink mr-2"></div>
			${btnClearDefaults}
		</div>`;
		comp._addHookBase("filterSnapshots", () => {
			wrpDetailsFooter.toggleVe(
				!!this._getSnapshotsDefaultFilterHeaders({snapshots: comp._state.filterSnapshots}).length,
			);
		})();

		const stgDetails = ee`<div class="ve-flex relative accordion__wrp-preview w-100">
			<div class="vr-0 absolute accordion__vr-preview"></div>
			<div class="ve-flex-col py-3 ml-4 accordion__wrp-preview-inner w-100 min-w-0">
				<div class="ve-flex-col pl-2 w-100">
					<h5 class="mt-0 mb-1">Preview</h5>
					${wrpDisplayState}
				</div>
				${wrpDetailsFooter}
			</div>
		</div>`
			.onn("click", evt => evt.stopPropagation())
			.onn("mousedown", evt => evt.stopPropagation());
		comp._addHookBase("manager_loader_isExpanded", () => stgDetails.toggleVe(!!comp._state.manager_loader_isExpanded))();

		$$($wrpRow)`
			${stgHeader}
			${stgDetails}
		`;

		return {
			stgHeader,
			wrpCbSel,
			cbSel,
		};
	}
}
