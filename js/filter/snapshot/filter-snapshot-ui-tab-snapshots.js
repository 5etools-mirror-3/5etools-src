import {RenderableCollectionSnapshots} from "./filter-snapshot-ui-collection-snapshots.js";
import {FilterSnapshotUiTabUtils} from "./filter-snapshot-ui-tab-utils.js";
import {FilterSnapshotBaseSelectClickHandler} from "./filter-snapshot-ui-collection-base.js";

export class FilterSnapshotUiTabSnapshots {
	constructor (
		{
			filterBox,
			compManager,
			rdState,
			tabMeta,
		},
	) {
		this._filterBox = filterBox;
		this._compManager = compManager;
		this._rdState = rdState;
		this._tabMeta = tabMeta;
	}

	_getSelectedSnapshotIds () {
		return Object.entries(this._compManager._getRenderedCollection({prop: "boxSnapshots"}))
			.filter(([, rendered]) => rendered.cbSel.checked)
			.map(([id]) => id);
	}

	async pRender () {
		const selectClickHandler = new FilterSnapshotBaseSelectClickHandler({
			comp: this._compManager,
			prop: "boxSnapshots",
		});

		const {stgControls} = this._pRender_stgControls({selectClickHandler});
		const {stgNoRows} = this._pRender_stgNoRows();
		const {stgRows, compRows} = this._pRender_stgRows({selectClickHandler});

		ee(this._tabMeta.$wrpTab[0])`
			${stgControls}
			<hr class="hr-2">
			${stgNoRows}
			${stgRows}
		`;

		const hk = this._compManager._addHookBase("boxSnapshots", () => {
			stgNoRows.toggleVe(!this._compManager._state.boxSnapshots.length);
			stgRows.toggleVe(!!this._compManager._state.boxSnapshots.length);

			compRows.render();
		});
		this._rdState.fnsCleanup.push(() => this._compManager._removeHookBase("boxSnapshots", hk));
		hk();
	}

	_pRender_stgControls ({selectClickHandler}) {
		const stgControls = FilterSnapshotUiTabUtils.getStgControls();

		const {menuMass} = this._pRender_stgControls_menuMass({selectClickHandler});

		const btnMass = ee`<button class="ve-btn ve-btn-primary ve-btn-xs mr-2">Mass...</button>`
			.onn("click", async evt => {
				await ContextUtil.pOpenMenu(evt, menuMass);
			});

		const btnTakeSnapshot = ee`<button class="ve-btn ve-btn-primary ve-btn-xs mr-2">Take Snapshot</button>`
			.onn("click", async () => {
				await this._compManager.pHandleClick_takeSnapshot();
			});

		ee(stgControls)`<div class="ve-flex-v-center">
			${btnMass}
			${btnTakeSnapshot}
		</div>`;

		return {stgControls};
	}

	_pRender_stgControls_menuMass ({selectClickHandler}) {
		const getValidAddToDeckInitial = () => {
			const selectedSnapshotIds = this._getSelectedSnapshotIds();
			if (!selectedSnapshotIds.length) {
				JqueryUtil.doToast({content: `Please select some snapshots first!`, type: "warning"});
				return {isValid: false, selectedSnapshotIds};
			}

			if (!this._compManager._state.boxSnapshotDecks.length) {
				JqueryUtil.doToast({content: `No snapshot decks available! Please create one first.`, type: "warning"});
				return {isValid: false, selectedSnapshotIds};
			}

			return {isValid: true, selectedSnapshotIds};
		};

		const addSelectedSnapshotsToDeck = (
			{
				boxSnapshotDeck,
				selectedSnapshotIds,
			},
		) => {
			boxSnapshotDeck.entity.boxSnapshotIds = [
				...boxSnapshotDeck.entity.boxSnapshotIds || [],
				selectedSnapshotIds
					.map(boxSnapshotId => this._compManager.getNewBoxSnapshotId({
						boxSnapshotId: boxSnapshotId,
						_manager_name: this._compManager.getBoxSnapshotName({boxSnapshotId}),
					})),
			]
				.unique(entityInfo => entityInfo.entity.boxSnapshotId);

			this._compManager._triggerCollectionUpdate("boxSnapshotDecks");

			JqueryUtil.doToast(`Added ${selectedSnapshotIds.length} Snapshot${selectedSnapshotIds.length === 1 ? "" : "s"} to Snapshot Deck!`);

			selectClickHandler.setCheckboxes({isChecked: false});
		};

		const menuMass = ContextUtil.getMenu([
			new ContextUtil.Action(
				"Add to Active Snapshot Deck",
				async () => {
					const {isValid, selectedSnapshotIds} = getValidAddToDeckInitial();
					if (!isValid) return;

					const boxSnapshotDeck = this._compManager.getActiveSnapshotDeck();
					if (!boxSnapshotDeck) return JqueryUtil.doToast({content: `No active snapshot deck! Please active one first.`, type: "warning"});

					addSelectedSnapshotsToDeck({boxSnapshotDeck, selectedSnapshotIds});
				},
			),
			new ContextUtil.Action(
				"Add to Snapshot Deck...",
				async () => {
					const {isValid, selectedSnapshotIds} = getValidAddToDeckInitial();
					if (!isValid) return;

					const {boxSnapshotDeck} = await this._compManager.pGetUserBoxSnapshotDeckInfo();
					if (!boxSnapshotDeck) return;

					addSelectedSnapshotsToDeck({boxSnapshotDeck, selectedSnapshotIds});
				},
			),
			new ContextUtil.Action(
				"Delete",
				async () => {
					const selectedSnapshotIds = this._getSelectedSnapshotIds();
					if (!selectedSnapshotIds.length) return JqueryUtil.doToast({content: `Please select some snapshots first!`, type: "warning"});

					if (!await InputUiUtil.pGetUserBoolean({title: "Delete Snapshots", htmlDescription: `This will delete ${selectedSnapshotIds.length} snapshot${selectedSnapshotIds.length === 1 ? "" : "s"}. Are you sure?`, textYes: "Yes", textNo: "Cancel"})) return;

					const toDelete = new Set(selectedSnapshotIds);

					this._compManager._state.boxSnapshots = this._compManager._state.boxSnapshots
						.filter(boxSnapshot => !toDelete.has(boxSnapshot.id));
				},
			),
		]);
		this._rdState.fnsCleanup.push(() => ContextUtil.deleteMenu(menuMass));

		return {menuMass};
	}

	_pRender_stgNoRows () {
		const stgNoRows = FilterSnapshotUiTabUtils.getStgNoRows();

		const btnAddSnapshotNoRows = ee`<button class="ve-btn ve-btn-primary">Take Snapshot</button>`
			.onn("click", async () => {
				await this._compManager.pHandleClick_takeSnapshot();
			});

		ee(stgNoRows)`<div class="ve-flex-col">
			<div class="mb-2 ve-muted"><i>No Snapshots.</i></div>
			${btnAddSnapshotNoRows}
		</div>`;

		return {stgNoRows};
	}

	_pRender_stgRows ({selectClickHandler}) {
		const cbMulti = ee`<input type="checkbox">`;
		selectClickHandler.bindSelectAllCheckbox(cbMulti);

		const isEveryExpanded = boxSnapshots => boxSnapshots.every(boxSnapshot => boxSnapshot.entity.manager_loader_isExpanded);

		const btnExpandCollapseAll = ee`<button class="ve-btn ve-btn-default ve-btn-xs px-1 ve-flex-vh-center h-100 no-shrink ve-col-0-5 no-select">[+]</button>`
			.onn("click", () => {
				if (!this._compManager._state.boxSnapshots.length) return;

				const isCollapse = isEveryExpanded(this._compManager._state.boxSnapshots);
				this._compManager._state.boxSnapshots.forEach(boxSnapshot => boxSnapshot.entity.manager_loader_isExpanded = !isCollapse);
				this._compManager._triggerCollectionUpdate("boxSnapshots");
			});

		const hkBtnExpandCollapseAll = this._compManager._addHookBase("boxSnapshots", () => {
			btnExpandCollapseAll.txt(
				!this._compManager._state.boxSnapshots.length
					? `[+]`
					: isEveryExpanded(this._compManager._state.boxSnapshots) ? `[\u2013]` : `[+]`,
			);
		});
		this._rdState.fnsCleanup.push(() => this._compManager._removeHookBase("boxSnapshots", hkBtnExpandCollapseAll));
		hkBtnExpandCollapseAll();

		const wrpRowBtns = ee`<div class="ve-flex-v-center my-1 pl-1p pr-10p ve-btn-group">
			<label class="ve-btn ve-btn-default ve-btn-xs ve-col-0-5 ve-flex-vh-center h-100">
				${cbMulti}
			</label>
			${btnExpandCollapseAll}
			<button class="ve-btn ve-btn-default ve-btn-xs ve-col-9" disabled>&nbsp;</button>
			<button class="ve-btn ve-btn-default ve-btn-xs ve-grow" disabled>&nbsp;</button>
		</div>`;

		const wrpRows = ee`<div class="h-100 w-100 ve-overflow-y-scroll ve-flex-col"></div>`;

		const compRows = new RenderableCollectionSnapshots({
			filterBox: this._filterBox,
			comp: this._compManager,
			$wrpRows: $(wrpRows),
			selectClickHandler,
		});

		const stgRows = ee`<div class="h-100 min-h-0 w-100 ve-flex-col">
			${wrpRowBtns}
			${wrpRows}
		</div>`;

		return {stgRows, compRows};
	}
}
