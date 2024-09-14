import {FilterSnapshotUiTabSnapshotDecks} from "./filter-snapshot-ui-tab-decks.js";
import {FilterSnapshotUiTabSnapshots} from "./filter-snapshot-ui-tab-snapshots.js";

export class FilterSnapshotUi extends BaseComponent {
	static _RenderState = class {
		constructor () {
			this.fnsCleanup = [];
		}

		doCleanup () {
			this.fnsCleanup.forEach(fn => fn());
		}
	};

	constructor (
		{
			filterBox,
			filters,
			compManager,
		},
	) {
		super();

		this._filterBox = filterBox;
		this._filters = filters;
		this._compManager = compManager;

		TabUiUtil.decorate(this, {isInitMeta: true});
	}

	async pRender ({activeTab = "snapshotDecks"} = {}) {
		const rdState = new this.constructor._RenderState();

		const {
			$modal,
			doClose,
			pGetResolved,
			tabMetaSnapshotDecks,
			tabMetaSnapshots,
		} = await this._pRender_pGetShowModal({rdState, activeTab});

		await this._pRender_pSnapshotDecks({
			rdState,
			tabMeta: tabMetaSnapshotDecks,
		});

		await this._pRender_pSnapshots({
			rdState,
			tabMeta: tabMetaSnapshots,
		});
	}

	async _pRender_pGetShowModal (
		{
			rdState,
			activeTab,
		},
	) {
		const {$modal, doClose, pGetResolved} = await UiUtil.pGetShowModal({
			isMinHeight0: true,
			isHeight100: true,
			isWidth100: true,
			isUncappedHeight: true,
			isHeaderBorder: false,
			isEmpty: true,
			cbClose: () => {
				rdState.doCleanup();
			},
		});

		const iptTabMetas = [
			new TabUiUtil.TabMeta({name: "Snapshot Decks", hasBorder: true}),
			new TabUiUtil.TabMeta({name: "Snapshots", hasBorder: true}),

			new TabUiUtil.TabMeta({
				type: "buttons",
				isSplitStart: true,
				buttons: [
					{
						html: `<span class="glyphicon glyphicon-download"></span>`,
						title: "Save to File",
						pFnClick: () => {
							DataUtil.userDownload(
								"filter-snapshot",
								this._compManager.getSaveableState(),
								{fileType: this._getFileType()},
							);
						},
					},
					{
						html: `<span class="glyphicon glyphicon-upload"></span>`,
						title: "Load from File",
						pFnClick: async () => {
							const {jsons, errors} = await InputUiUtil.pGetUserUploadJson({expectedFileTypes: [this._getFileType()]});

							DataUtil.doHandleFileLoadErrorsGeneric(errors);

							if (!jsons?.length) return;
							this._compManager.setStateFrom(jsons[0]);
						},
					},
				],
			}),

			new TabUiUtil.TabMeta({
				type: "buttons",
				buttons: [
					{
						html: `<span class="glyphicon glyphicon-info-sign"></span>`,
						title: "Help",
						type: "default",
						pFnClick: async () => {
							await this._pOnClick_doShowHelp();
						},
					},
				],
			}),
		];

		const tabMetas = this._renderTabs(iptTabMetas, {$parent: $modal});

		const [tabMetaSnapshotDecks, tabMetaSnapshots] = tabMetas;

		this._setActiveTab({tab: activeTab === "snapshots" ? tabMetaSnapshots : tabMetaSnapshotDecks});

		return {
			$modal,
			doClose,
			pGetResolved,
			tabMetaSnapshotDecks,
			tabMetaSnapshots,
		};
	}

	_getFileType () {
		return `filter-snapshot-${this._compManager.namespaceSnapshots}`;
	}

	_pOnClick_doShowHelp () {
		const {$modalInner} = UiUtil.getShowModal({
			title: "Help",
			isMinHeight0: true,
		});

		$modalInner.append(`
			<p>Customize how your filters default upon hitting &quot;Reset&quot;.</p>
			<p>Save your current filter(s) by taking a <b>Snapshot</b>.</p>
			<p>Use your snapshots to create a <b>Snapshot Deck</b>.</p>
			<p>Make a snapshot deck your default &quot;Reset&quot; state by toggling the <span class="glyphicon glyphicon-heart" aria-label="&quot;Make Default&quot; button"></span>.</p>
		`);
	}

	async _pRender_pSnapshotDecks (
		{
			rdState,
			tabMeta,
		},
	) {
		const tabUi = new FilterSnapshotUiTabSnapshotDecks({
			filterBox: this._filterBox,
			compManager: this._compManager,
			rdState,
			tabMeta,
		});
		await tabUi.pRender();
	}

	async _pRender_pSnapshots (
		{
			rdState,
			tabMeta,
		},
	) {
		const tabUi = new FilterSnapshotUiTabSnapshots({
			filterBox: this._filterBox,
			compManager: this._compManager,
			rdState,
			tabMeta,
		});
		await tabUi.pRender();
	}
}
