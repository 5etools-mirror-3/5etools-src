import {RenderableCollectionSnapshotDecks} from "./filter-snapshot-ui-collection-decks.js";
import {FilterSnapshotUiTabUtils} from "./filter-snapshot-ui-tab-utils.js";
import {FilterSnapshotBaseSelectClickHandler} from "./filter-snapshot-ui-collection-base.js";

export class FilterSnapshotUiTabSnapshotDecks {
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

	_getSelectedSnapshotDeckIds () {
		return Object.entries(this._compManager._getRenderedCollection({prop: "boxSnapshotDecks"}))
			.filter(([, rendered]) => rendered.cbSel.checked)
			.map(([id]) => id);
	}

	async pRender () {
		const selectClickHandler = new FilterSnapshotBaseSelectClickHandler({
			comp: this._compManager,
			prop: "boxSnapshotDecks",
		});

		const {stgControls} = this._pRender_stgControls();
		const {stgNoRows} = this._pRender_stgNoRows();
		const {stgRows, compRows} = this._pRender_stgRows({selectClickHandler});

		this._tabMeta.$wrpTab.addClass("ve-overflow-visible");

		ee(this._tabMeta.$wrpTab[0])`
			${stgControls}
			<hr class="hr-2">
			${stgNoRows}
			${stgRows}
		`;

		const hk = this._compManager._addHookBase("boxSnapshotDecks", () => {
			stgNoRows.toggleVe(!this._compManager._state.boxSnapshotDecks.length);
			stgRows.toggleVe(!!this._compManager._state.boxSnapshotDecks.length);

			compRows.render();
		});
		this._rdState.fnsCleanup.push(() => {
			this._compManager._removeHookBase("boxSnapshotDecks", hk);
			compRows.doCleanup();
		});
		hk();
	}

	_pRender_stgControls () {
		const stgControls = FilterSnapshotUiTabUtils.getStgControls();

		const {menuMass} = this._pRender_stgControls_menuMass();

		const btnMass = ee`<button class="ve-btn ve-btn-primary ve-btn-xs mr-2">Mass...</button>`
			.onn("click", async evt => {
				await ContextUtil.pOpenMenu(evt, menuMass);
			});

		const btnCreateSnapshotDeck = ee`<button class="ve-btn ve-btn-primary ve-btn-xs mr-2">Create Snapshot Deck</button>`
			.onn("click", async () => {
				await this._compManager.pHandleClick_createSnapshotDeck();
			});

		ee(stgControls)`<div class="ve-flex-v-center">
			${btnMass}
			${btnCreateSnapshotDeck}
		</div>`;

		return {stgControls};
	}

	_pRender_stgControls_menuMass () {
		const menuMass = ContextUtil.getMenu([
			new ContextUtil.Action(
				"Delete",
				async () => {
					const selectedSnapshotDeckIds = this._getSelectedSnapshotDeckIds();
					if (!selectedSnapshotDeckIds.length) return JqueryUtil.doToast({content: `Please select some snapshot decks first!`, type: "warning"});

					if (!await InputUiUtil.pGetUserBoolean({title: "Delete Snapshot Decks", htmlDescription: `This will delete ${selectedSnapshotDeckIds.length} snapshot deck${selectedSnapshotDeckIds.length === 1 ? "" : "s"}. Are you sure?`, textYes: "Yes", textNo: "Cancel"})) return;

					const toDelete = new Set(selectedSnapshotDeckIds);

					this._compManager._state.boxSnapshotDecks = this._compManager._state.boxSnapshotDecks
						.filter(boxSnapshot => !toDelete.has(boxSnapshot.id));
				},
			),
		]);
		this._rdState.fnsCleanup.push(() => ContextUtil.deleteMenu(menuMass));

		return {menuMass};
	}

	_pRender_stgNoRows () {
		const stgNoRows = FilterSnapshotUiTabUtils.getStgNoRows();

		const btnAddSnapshotDeckNoRows = ee`<button class="ve-btn ve-btn-primary">Create Snapshot Deck</button>`
			.onn("click", async () => {
				await this._compManager.pHandleClick_createSnapshotDeck();
			});

		ee(stgNoRows)`<div class="ve-flex-col">
			<div class="mb-2 ve-muted"><i>No Snapshot Decks.</i></div>
			${btnAddSnapshotDeckNoRows}
		</div>`;

		return {stgNoRows};
	}

	_pRender_stgRows ({selectClickHandler}) {
		const cbMulti = ee`<input type="checkbox">`;
		selectClickHandler.bindSelectAllCheckbox(cbMulti);

		const isEveryExpanded = boxSnapshotDecks => boxSnapshotDecks.every(boxSnapshot => boxSnapshot.entity.manager_loader_isExpanded);

		const btnExpandCollapseAll = ee`<button class="ve-btn ve-btn-default ve-btn-xs px-1 ve-flex-vh-center h-100 no-shrink ve-col-1 no-select">[+]</button>`
			.onn("click", () => {
				if (!this._compManager._state.boxSnapshotDecks.length) return;

				const isCollapse = isEveryExpanded(this._compManager._state.boxSnapshotDecks);
				this._compManager._state.boxSnapshotDecks.forEach(boxSnapshot => boxSnapshot.entity.manager_loader_isExpanded = !isCollapse);
				this._compManager._triggerCollectionUpdate("boxSnapshotDecks");
			});

		const hkBtnExpandCollapseAll = this._compManager._addHookBase("boxSnapshotDecks", () => {
			btnExpandCollapseAll.txt(
				!this._compManager._state.boxSnapshotDecks.length
					? `[+]`
					: isEveryExpanded(this._compManager._state.boxSnapshotDecks) ? `[\u2013]` : `[+]`,
			);
		});
		this._rdState.fnsCleanup.push(() => this._compManager._removeHookBase("boxSnapshotDecks", hkBtnExpandCollapseAll));
		hkBtnExpandCollapseAll();

		const wrpRowBtns = ee`<div class="ve-flex-v-center my-1 pl-1p pr-10p ve-btn-group">
			<label class="ve-btn ve-btn-default ve-btn-xs ve-col-0-5 ve-flex-vh-center h-100">
				${cbMulti}
			</label>
			${btnExpandCollapseAll}
			<button class="ve-btn ve-btn-default ve-btn-xs ve-col-10" disabled>&nbsp;</button>
			<button class="ve-btn ve-btn-default ve-btn-xs ve-grow" disabled>&nbsp;</button>
		</div>`;

		const wrpRows = ee`<div class="h-100 w-100 ve-overflow-y-scroll ve-flex-col"></div>`;

		const compRows = new RenderableCollectionSnapshotDecks({
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
