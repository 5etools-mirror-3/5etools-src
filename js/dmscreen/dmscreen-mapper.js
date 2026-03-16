import {RenderMap} from "../render-map.js";
import {PanelContentManager_DynamicMap} from "./dmscreen-panels.js";
import {DmScreenPanelAppBase} from "./dmscreen-panelapp-base.js";

export class DmMapper extends DmScreenPanelAppBase {
	constructor (...args) {
		super(...args);

		this._comp = null;
	}

	_getPanelElement (board, state) {
		const wrpPanel = ee`<div class="ve-w-100 ve-h-100 dm-map__root dm__panel-bg"></div>`;
		this._comp = new DmMapperRoot(board, wrpPanel);
		this._comp.setStateFrom(state);
		this._comp.render(wrpPanel);
		return wrpPanel;
	}

	getState () {
		return this._comp.getSaveableState();
	}

	static _getProps ({catId}) {
		const prop = catId === Parser.CAT_ID_ADVENTURE ? "adventure" : "book";
		return {prop, propData: `${prop}Data`};
	}

	static async pHandleMenuButtonClick (menu) {
		const chosenDoc = await SearchWidget.pGetUserAdventureBookSearch({
			fnFilterResults: doc => doc.hasMaps,
			contentIndexName: "entity_AdventuresBooks_maps",
			pFnGetDocExtras: async ({doc}) => {
				// Load the adventure/book, and scan it for maps
				const {propData} = this._getProps({catId: doc.c});
				const {page, source, hash} = SearchWidget.docToPageSourceHash(doc);
				const adventureBookPack = await DataLoader.pCacheAndGet(page, source, hash);
				let hasMaps = false;
				const walker = MiscUtil.getWalker({
					isBreakOnReturn: true,
					keyBlocklist: MiscUtil.GENERIC_WALKER_ENTRIES_KEY_BLOCKLIST,
					isNoModification: true,
				});
				walker.walk(
					adventureBookPack[propData],
					{
						object: (obj) => {
							if (obj.type === "image" && obj.mapRegions?.length) return hasMaps = true;
						},
					},
				);
				return {hasMaps};
			},
		});

		if (!chosenDoc) return;

		menu.doClose();

		const {eleModalInner, doClose} = UiUtil.getShowModal({
			title: `Select Map\u2014${chosenDoc.n}`,
			isWidth100: true,
			isHeight100: true,
			isUncappedHeight: true,
		});

		eleModalInner.appends(`<div class="ve-flex-vh-center ve-w-100 ve-h-100"><i class="ve-dnd-font ve-muted">Loading...</i></div>`);

		const {page, source, hash} = SearchWidget.docToPageSourceHash(chosenDoc);
		const adventureBookPack = await DataLoader.pCacheAndGet(page, source, hash);

		const mapDatas = [];
		const walker = MiscUtil.getWalker();

		const {prop, propData} = this._getProps({catId: chosenDoc.c});

		adventureBookPack[propData].data.forEach((chap, ixChap) => {
			let cntChapImages = 0;

			const handlers = {
				object (obj) {
					if (obj.mapRegions) {
						const out = {
							...Renderer.get().getMapRegionData(obj),
							page: chosenDoc.q,
							source: adventureBookPack[prop].source,
							hash: UrlUtil.URL_TO_HASH_BUILDER[chosenDoc.q](adventureBookPack[prop]),
						};
						mapDatas.push(out);

						if (obj.title) {
							out.name = Renderer.stripTags(obj.title);
						} else {
							out.name = `${(adventureBookPack[prop].contents[ixChap] || {}).name || "(Unknown)"}, Map ${cntChapImages + 1}`;
						}

						cntChapImages++;
					}

					return obj;
				},
			};

			walker.walk(
				chap,
				handlers,
			);
		});

		if (!mapDatas.length) {
			eleModalInner
				.empty()
				.appends(`<div class="ve-flex-vh-center ve-w-100 ve-h-100"><span class="ve-dnd-font">Adventure did not contain any valid maps!</span></div>`);
			return;
		}

		eleModalInner
			.empty()
			.removeClass("ve-flex-col")
			.addClass("ve-text-center");

		mapDatas.map(mapData => {
			ee`<div class="ve-m-1 ve-p-1 ve-clickable dm-map__picker-wrp-img ve-relative">
				<div class="dm-map__picker-img" style="background-image: url(${encodeURI(mapData.hrefThumbnail || mapData.href)})"></div>
				<span class="ve-absolute ve-text-center dm-map__picker-disp-name">${mapData.name.escapeQuotes()}</span>
			</div>`
				.onn("click", async () => {
					doClose();
					const pcm = new PanelContentManager_DynamicMap({board: menu.pnl.board, panel: menu.pnl});
					await pcm.pDoPopulate({state: {state: mapData}});
				})
				.appendTo(eleModalInner);
		});
	}
}

class DmMapperRoot extends BaseComponent {
	/**
	 * @param board DM Screen board.
	 * @param wrpPanel Panel wrapper element for us to populate.
	 */
	constructor (board, wrpPanel) {
		super();
		this._board = board;
		this._wrpPanel = wrpPanel;
	}

	render (eleParent) {
		eleParent.empty();

		eleParent.appends(`<div class="ve-flex-vh-center ve-w-100 ve-h-100"><i class="ve-dnd-font ve-muted">Loading...</i></div>`);

		RenderMap.pGetRendered(
			this._state,
			{
				fnGetContainerDimensions: () => {
					const bcr = eleParent.getBoundingClientRect();
					return {
						w: bcr.width,
						h: bcr.height,
					};
				},
			},
		)
			.then(ele => eleParent.empty().appends(ele));
	}
}
