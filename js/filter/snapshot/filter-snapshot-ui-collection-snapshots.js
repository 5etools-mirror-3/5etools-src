import {RenderableCollectionFilterSnapshotBase} from "./filter-snapshot-ui-collection-base.js";

export class RenderableCollectionSnapshots extends RenderableCollectionFilterSnapshotBase {
	constructor (
		{
			filterBox,
			comp,
			wrpRows,
			selectClickHandler,
		},
	) {
		super({filterBox, comp, prop: "boxSnapshots", wrpRows, selectClickHandler});
	}

	/* -------------------------------------------- */

	_populateRow ({comp, wrpRow, entity}) {
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

		const wrpCbSel = veT`<label class="ve-col-0-5 ve-h-100 ve-flex-h-center">
			${cbSel}
		</label>`;

		const btnToggleExpand = this.constructor._getBtnToggleExpand(comp, {isSibling: true});

		const iptName = ComponentUiUtil.getIptStr(comp, "manager_name", {placeholder: "Name"});

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

		const btnApply = veT`<button class="ve-btn ve-btn-xs ve-btn-primary" title="Apply as Filters"><span class="glyphicon glyphicon-ok"></span></button>`
			.vee.onn("click", async () => {
				this._comp.doSetFiltersFromBoxSnapshot_(entity.entity);
				JqueryUtil.doToast("Applied Snapshot as Filters!");
			});

		const btnAddToDeck = veT`<button class="ve-btn ve-btn-xs ve-btn-default ve-mr-2">Add to Snapshot Deck</button>`
			.vee.onn("click", async () => {
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

		const stgHeader = veT`<div class="ve-flex-v-center ve-w-100 ve-py-1 ve-lst__row ve-lst__row-border ve-lst__row-inner">
			${wrpCbSel}

			<div class="ve-flex-vh-center ve-col-1">
				${btnToggleExpand}
				${btnApply}
			</div>

			<div class="ve-flex-v-center ve-col-8-5 ve-px-1">
				${iptName}
			</div>

			<div class="ve-flex-vh-center ve-grow">
				${btnAddToDeck}
				${btnDelete}
			</div>
		</div>`;

		const wrpDisplayState = veT`<div class="ve-flex-col ve-w-100"></div>`;
		comp._addHookBase("filterSnapshots", () => {
			wrpDisplayState.vee.html(this._getSnapshotsDisplayState({snapshots: comp._state.filterSnapshots}));
		})();

		const btnClearDefaults = veT`<button class="ve-btn ve-btn-xs ve-btn-default" title="Remove any defaulted filters from the snapshot. This allows a snapshot to more easily combine with other snapshots in a snapshot deck.">Remove &quot;Default&quot;</button>`
			.vee.onn("click", () => {
				const headersDefault = new Set(this._getSnapshotsDefaultFilterHeaders({snapshots: comp._state.filterSnapshots}));

				comp._state.filterSnapshots = comp._state.filterSnapshots
					.filter(snapshot => !headersDefault.has(snapshot.header));
			});

		const wrpDetailsFooter = veT`<div class="ve-w-100 ve-flex-v-center ve-mt-2 ve-pl-2">
			<div class="ve-w-140p ve-h-100 ve-no-shrink ve-mr-2"></div>
			${btnClearDefaults}
		</div>`;
		comp._addHookBase("filterSnapshots", () => {
			wrpDetailsFooter.vee.toggle(
				!!this._getSnapshotsDefaultFilterHeaders({snapshots: comp._state.filterSnapshots}).length,
			);
		})();

		const stgDetails = veT`<div class="ve-flex ve-relative ve-accordion__wrp-preview ve-w-100">
			<div class="ve-vr-0 ve-absolute ve-accordion__vr-preview"></div>
			<div class="ve-flex-col ve-py-3 ve-ml-4 ve-accordion__wrp-preview-inner ve-w-100 ve-min-w-0">
				<div class="ve-flex-col ve-pl-2 ve-w-100">
					<h5 class="ve-mt-0 ve-mb-1">Preview</h5>
					${wrpDisplayState}
				</div>
				${wrpDetailsFooter}
			</div>
		</div>`
			.vee.onn("click", evt => evt.stopPropagation())
			.vee.onn("mousedown", evt => evt.stopPropagation());
		comp._addHookBase("manager_loader_isExpanded", () => stgDetails.vee.toggle(!!comp._state.manager_loader_isExpanded))();

		veT(wrpRow)`
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
