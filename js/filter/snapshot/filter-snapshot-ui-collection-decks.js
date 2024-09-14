import {RenderableCollectionFilterSnapshotBase} from "./filter-snapshot-ui-collection-base.js";

class CollectionBoxSnapshotDecks extends RenderableCollectionGenericRows {
	constructor (
		{
			compManager,
			comp,
			wrpRows,
		},
	) {
		super(comp, "boxSnapshotIds", $(wrpRows));
		this._compManager = compManager;
	}

	_getWrpRow () {
		return ee`<div class="ve-flex-col w-100 py-1"></div>`;
	}

	_populateRow ({comp, $wrpRow, entity}) {
		const $iptName = ComponentUiUtil.$getIptStr(comp, "_manager_name", {placeholder: "Name"});

		const btnDelete = this._utils.getBtnDelete({entity});

		const $padDrag = this._utils.$getPadDrag({$wrpRow});

		// Sync our transient name back to the real snapshot state on change
		comp._addHookBase("_manager_name", () => {
			const boxSnapshot = this._compManager._state.boxSnapshots
				.find(entityInfoBoxSnapshot => entityInfoBoxSnapshot.id === comp._state.boxSnapshotId);
			if (!boxSnapshot) return;

			boxSnapshot.entity.manager_name = comp._state._manager_name;
			this._compManager._triggerCollectionUpdate("boxSnapshots");
		});

		$$($wrpRow)`
			<div class="ve-flex-v-center">
				${$iptName.addClass("mr-2")}
				${btnDelete.addClass("mr-2")}
				${$padDrag}
			</div>
		`;
	}
}

export class RenderableCollectionSnapshotDecks extends RenderableCollectionFilterSnapshotBase {
	constructor (
		{
			filterBox,
			comp,
			$wrpRows,
			selectClickHandler,
		},
	) {
		super({filterBox, comp, prop: "boxSnapshotDecks", $wrpRows, selectClickHandler});
	}

	_populateRow ({comp, $wrpRow, entity}) {
		// region Bind cache-flush hooks
		comp._addHookBase("boxSnapshotIds", () => {
			if (this._comp._state.boxSnapshotDeckDefaultId !== entity.id) return;
			this._comp._state.pulse_flushResolverCache = !this._comp._state.pulse_flushResolverCache;
		});
		// endregion

		const {stgHeader, wrpCbSel, cbSel, fnCleanup: fnCleanupStgHeader} = this._populateRow_stgHeader({comp, entity});
		const {stgDetails} = this._populateRow_stgDetails({comp, entity});

		$$($wrpRow)`
			${stgHeader}
			${stgDetails}
		`;

		return {
			stgHeader,
			wrpCbSel,
			cbSel,
			fnCleanup: () => {
				fnCleanupStgHeader();
			},
		};
	}

	_populateRow_stgHeader ({comp, entity}) {
		const cbSel = this.constructor._getCbSel();

		const wrpCbSel = ee`<label class="ve-col-0-5 h-100 ve-flex-h-center">
			${cbSel}
		</label>`;

		const btnToggleExpand = this.constructor._getBtnToggleExpand(comp, {isSibling: true});

		const btnIsDefault = ee`<button class="ve-btn ve-btn-default ve-btn-xs mr-1" title="Set as Default Filter State"><span class="glyphicon glyphicon-heart"></span></button>`
			.onn("click", () => {
				if (this._comp._state.boxSnapshotDeckDefaultId === entity.id) this._comp._state.boxSnapshotDeckDefaultId = null;
				else this._comp._state.boxSnapshotDeckDefaultId = entity.id;
			});
		const hkIsDefault = this._comp._addHookBase("boxSnapshotDeckDefaultId", () => {
			btnIsDefault.toggleClass("active", this._comp._state.boxSnapshotDeckDefaultId === entity.id);
		});
		hkIsDefault();

		const btnApply = ee`<button class="ve-btn ve-btn-xs ve-btn-primary" title="Apply as Filters"><span class="glyphicon glyphicon-ok"></span></button>`
			.onn("click", async () => {
				this._comp.doSetFiltersFromBoxSnapshotDeck_(entity.entity);
				JqueryUtil.doToast("Applied Snapshot Deck as Filters!");
			});

		const $iptName = ComponentUiUtil.$getIptStr(comp, "manager_name", {placeholder: "Name"});

		const btnAddSnapshot = ee`<button class="ve-btn ve-btn-default ve-btn-xs mr-1" title="Add Snapshot"><span class="glyphicon glyphicon-plus"></span></button>`
			.onn("click", async () => {
				await this._populateRow_onClick_pAddSnapshot({comp});
			});

		const btnDuplicate = ee`<button class="ve-btn ve-btn-default ve-btn-xs mr-1" title="Duplicate"><span class="glyphicon glyphicon-duplicate"></span></button>`
			.onn("click", () => {
				const cpy = MiscUtil.copyFast(entity.entity);

				const nameRoot = (cpy.manager_name || "").replace(/\s+\(\d+\)$/, "");
				const reName = new RegExp(`^${nameRoot.escapeRegexp()} \\((?<ordinal>\\d+)\\)$`);

				const ordinalMax = this._comp._state.boxSnapshotDecks
					.map(snapshotDeck => reName.exec(snapshotDeck.entity.manager_name))
					.filter(Boolean)
					.map(m => Number(m.groups.ordinal))
					.sort(SortUtil.ascSort)
					.last();
				cpy.manager_name = StrUtil.getNextDuplicateName(`${nameRoot} (${ordinalMax})`);

				this._comp.addBoxSnapshotDeck_(cpy);
			});

		const btnDelete = this._utils.getBtnDelete({entity});

		const stgHeader = ee`<div class="ve-flex-v-center w-100 py-1 lst__row lst__row-border lst__row-inner">
			${wrpCbSel}

			<div class="ve-flex-vh-center ve-col-1">
				${btnToggleExpand}
				${btnIsDefault}
				${btnApply}
			</div>

			<div class="ve-flex-v-center ve-col-10 px-1">
				${$iptName[0]}
			</div>

			<div class="ve-flex-vh-center ve-grow">
				${btnAddSnapshot}
				${btnDuplicate}
				${btnDelete}
			</div>
		</div>`;

		return {
			stgHeader,
			wrpCbSel,
			cbSel,
			fnCleanup: () => this._comp._removeHookBase("boxSnapshotDeckDefaultId", hkIsDefault),
		};
	}

	_populateRow_stgDetails ({comp, entity}) {
		const wrpRowsBoxSnapshotDecks = ee`<div class="ve-flex-col w-100 relative pl-2"></div>`;
		const collectionBoxSnapshotDecks = new CollectionBoxSnapshotDecks({
			compManager: this._comp,
			comp,
			wrpRows: wrpRowsBoxSnapshotDecks,
		});

		const btnNoSnapshotsAdd = ee`<button class="ve-btn ve-btn-default ve-btn-xs">Add Snapshot</button>`
			.onn("click", async () => {
				await this._populateRow_onClick_pAddSnapshot({comp});
			});

		const dispNoSnapshotDecks = ee`<div class="pl-2 py-1 ve-flex-v-center">
			<i class="ve-muted mr-2 ve-self-flex-end">This deck contains no snapshots.</i>
			${btnNoSnapshotsAdd}
		</div>`;

		const wrpDisplayState = ee`<div class="ve-flex-col w-100"></div>`;

		comp._addHookBase("boxSnapshotIds", () => {
			collectionBoxSnapshotDecks.render();
			dispNoSnapshotDecks.toggleVe(!comp._state.boxSnapshotIds.length);

			wrpDisplayState.html(
				this._getDeckSnapshotsDisplayState({boxSnapshotDeck: entity.entity}),
			);
		})();

		const stgDetails = ee`<div class="ve-flex relative accordion__wrp-preview w-100">
			<div class="vr-0 absolute accordion__vr-preview"></div>
			<div class="ve-flex-col py-3 ml-4 accordion__wrp-preview-inner w-100 min-w-0">
				<h5 class="mt-0 mb-1 pl-2">Snapshots</h5>
				${wrpRowsBoxSnapshotDecks}
				${dispNoSnapshotDecks}
				<hr class="hr-3">
				<div class="ve-flex-col pl-2 w-100">
					<h5 class="mt-0 mb-1">Preview</h5>
					${wrpDisplayState}
				</div>
			</div>
		</div>`
			.onn("click", evt => evt.stopPropagation())
			.onn("mousedown", evt => evt.stopPropagation());

		comp._addHookBase("manager_loader_isExpanded", () => stgDetails.toggleVe(!!comp._state.manager_loader_isExpanded))();

		return {
			stgDetails,
		};
	}

	async _populateRow_onClick_pAddSnapshot ({comp}) {
		if (!this._comp._state.boxSnapshots.length) return JqueryUtil.doToast({content: `No snapshots available! Please create one first.`, type: "warning"});

		const {boxSnapshot} = await this._comp.pGetUserBoxSnapshotInfo();
		if (!boxSnapshot) return;

		comp._state.boxSnapshotIds = [
			...comp._state.boxSnapshotIds || [],
			this._comp.getNewBoxSnapshotId({
				boxSnapshotId: boxSnapshot.id,
				_manager_name: boxSnapshot.entity.manager_name,
			}),
		]
			.unique(entityInfo => entityInfo.entity.boxSnapshotId);

		JqueryUtil.doToast(`Added to Snapshot Deck!`);
	}
}
