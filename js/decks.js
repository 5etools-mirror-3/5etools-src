"use strict";

class DecksSublistManager extends SublistManager {
	static _getRowTemplate () {
		return [
			new SublistCellTemplate({
				name: "Name",
				css: "bold ve-col-12 px-0",
				colStyle: "",
			}),
		];
	}

	pGetSublistItem (ent, hash) {
		const cellsText = [ent.name];

		const ele = ee`<div class="lst__row lst__row--sublist ve-flex-col">
			<a href="#${hash}" class="lst__row-border lst__row-inner">
				${this.constructor._getRowCellsHtml({values: cellsText})}
			</a>
		</div>`
			.onn("contextmenu", evt => this._handleSublistItemContextMenu(evt, listItem))
			.onn("click", evt => this._listSub.doSelect(listItem, evt));

		const listItem = new ListItem(
			hash,
			ele,
			ent.name,
			{
				hash,
				page: ent.page,
				alias: PageFilterDecks.getListAliases(ent),
			},
			{
				entity: ent,
				mdRow: [...cellsText],
			},
		);
		return listItem;
	}
}

class DecksPageSettingsManager extends ListPageSettingsManager {
	_getSettings () {
		return {
			...RenderDecks.SETTINGS,
		};
	}
}

class DecksPageCardStateManager extends ListPageStateManager {
	static _STORAGE_KEY = "cardState";

	async pPruneState ({dataList}) {
		const knownHashes = new Set(dataList.map(deck => UrlUtil.autoEncodeHash(deck)));
		Object.keys(this._state)
			.filter(k => {
				const hashDeck = k.split("__").slice(0, -1).join("__");
				return !knownHashes.has(hashDeck);
			})
			.forEach(k => delete this._state[k]);
		await this._pPersistState();
	}

	getPropCardDrawn ({deck, card, hashDeck, ixCard}) {
		hashDeck = hashDeck || UrlUtil.autoEncodeHash(deck);
		ixCard = ixCard ?? deck.cards.indexOf(card);
		return `${hashDeck}__${ixCard}`;
	}

	async pDrawCard (deck, card) {
		this._state[this.getPropCardDrawn({deck, card})] = true;
		await this._pPersistState();
	}

	async pReplaceCard (deck, card) {
		delete this._state[this.getPropCardDrawn({deck, card})];
		await this._pPersistState();
	}

	async pResetDeck (deck) {
		const hashDeck = UrlUtil.autoEncodeHash(deck);
		deck.cards
			.forEach((_, ixCard) => delete this._state[this.getPropCardDrawn({hashDeck, ixCard})]);
		await this._pPersistState();
	}

	getUndrawnCards (deck) {
		const hashDeck = UrlUtil.autoEncodeHash(deck);
		return deck.cards
			.filter((_, ixCard) => !this._state[this.getPropCardDrawn({hashDeck, ixCard})]);
	}

	get (key) { return this._state[key]; }
}

class DecksPage extends ListPage {
	constructor () {
		const pageFilter = new PageFilterDecks();

		super({
			dataSource: DataUtil.deck.loadJSON.bind(DataUtil.deck),
			prereleaseDataSource: DataUtil.deck.loadPrerelease.bind(DataUtil.deck),
			brewDataSource: DataUtil.deck.loadBrew.bind(DataUtil.deck),

			pageFilter,

			dataProps: ["deck"],

			listSyntax: new ListSyntaxDecks({fnGetDataList: () => this._dataList}),

			compSettings: new DecksPageSettingsManager(),
		});

		this._compCardState = new DecksPageCardStateManager();
		this._renderFnsCleanup = [];
	}

	async _pOnLoad_pInitSettingsManager () {
		await super._pOnLoad_pInitSettingsManager();

		await this._compCardState.pInit();
	}

	_pOnLoad_pPostLoad () {
		this._compCardState.pPruneState({dataList: this._dataList}).then(null);
	}

	getListItem (ent, anI, isExcluded) {
		this._pageFilter.mutateAndAddToFilters(ent, isExcluded);

		const eleLi = document.createElement("div");
		eleLi.className = `lst__row ve-flex-col ${isExcluded ? "lst__row--blocklisted" : ""}`;

		const source = Parser.sourceJsonToAbv(ent.source);
		const hash = UrlUtil.autoEncodeHash(ent);

		eleLi.innerHTML = `<a href="#${hash}" class="lst__row-border lst__row-inner">
			<span class="ve-col-10 bold pl-0 pr-1">${ent.name}</span>
			<span class="ve-col-2 ve-text-center ${Parser.sourceJsonToSourceClassname(ent.source)} pl-1 pr-0" title="${Parser.sourceJsonToFull(ent.source)}">${source}</span>
		</a>`;

		const listItem = new ListItem(
			anI,
			eleLi,
			ent.name,
			{
				hash,
				source,
				page: ent.page,
			},
			{
				isExcluded,
			},
		);

		eleLi.addEventListener("click", (evt) => this._list.doSelect(listItem, evt));
		eleLi.addEventListener("contextmenu", (evt) => this._openContextMenu(evt, this._list, listItem));

		return listItem;
	}

	_renderStats_doBuildStatsTab ({ent}) {
		this._renderFnsCleanup
			.splice(1, this._renderFnsCleanup.length)
			.forEach(fn => fn());

		this._wrpTabs
			.find(`[data-name="deck-wrp-controls"]`)?.remove();

		const wrpControls = ee`<div class="ve-flex mt-auto" data-name="deck-wrp-controls"></div>`
			.prependTo(this._wrpTabs);

		const btnDraw = ee`<button class="ve-btn ve-btn-xs ve-btn-primary bb-0 bbr-0 bbl-0" title="Draw a Card (SHIFT to Skip Replacement; CTRL to Skip Animation)"><i class="fas fa-fw fa-cards"></i></button>`
			.onn("click", async evt => {
				const cards = this._compCardState.getUndrawnCards(ent);
				if (!cards.length) return JqueryUtil.doToast({content: "All cards have already been drawn!", type: "warning"});

				const card = RollerUtil.rollOnArray(cards);
				if (!card._isReplacement || evt.shiftKey) await this._compCardState.pDrawCard(ent, card);

				if (EventUtil.isCtrlMetaKey(evt)) {
					const eleChat = ee`<span>Drew card: ${Renderer.get().render(`{@card ${card.name}|${card.set}|${card.source}}`)}</span>`;

					Renderer.dice.addRoll({
						rolledBy: {
							name: ent.name,
						},
						ele: eleChat,
					});

					return;
				}

				try {
					btnDraw.prop("disabled", true);
					await RenderDecks.pRenderStgCard({deck: ent, card});
				} finally {
					btnDraw.prop("disabled", false);
				}
			});

		const btnReset = ee`<button class="ve-btn ve-btn-xs ve-btn-default bb-0 bbr-0 bbl-0" title="Reset Deck"><i class="fas fa-fw fa-rotate-left"></i></button>`
			.onn("click", async () => {
				await this._compCardState.pResetDeck(ent);
				JqueryUtil.doToast("Reset deck!");
			});

		// region List vs Grid view
		const btnViewList = this._compSettings ? ee`<button class="ve-btn ve-btn-xs ve-btn-default bb-0 bbr-0 bbl-0" title="Card List View"><i class="fas fa-fw fa-list"></i></button>`
			.onn("click", () => {
				this._compSettings.pSet("cardLayout", "list").then(null);
			}) : null;

		const btnViewGrid = this._compSettings ? ee`<button class="ve-btn ve-btn-xs ve-btn-default bb-0 bbr-0 bbl-0" title="Card Grid View"><i class="fas fa-fw fa-grid-2"></i></button>`
			.onn("click", () => {
				this._compSettings.pSet("cardLayout", "grid").then(null);
			}) : null;

		const hkCardLayout = this._compSettings.addHookBase("cardLayout", () => {
			const mode = this._compSettings.get("cardLayout");
			btnViewList.toggleClass("active", mode === "list");
			btnViewGrid.toggleClass("active", mode === "grid");
		});
		this._renderFnsCleanup.push(() => this._compSettings.removeHookBase("cardLayout", hkCardLayout));
		hkCardLayout();
		// endregion

		ee(wrpControls)`<div class="ve-flex">
			<div class="ve-flex-v-center ve-btn-group">
				${btnDraw}
				${btnReset}
			</div>

			<div class="ve-flex-v-center ve-btn-group ml-2">
				${btnViewList}
				${btnViewGrid}
			</div>
		</div>`;

		const {ele, fnsCleanup} = RenderDecks.getRenderedDeckMeta(
			ent,
			{
				settingsManager: this._compSettings,
				cardStateManager: this._compCardState,
			},
		);
		this._renderFnsCleanup.push(...fnsCleanup);

		this._pgContent
			.empty()
			.appends(ele);
	}
}

const decksPage = new DecksPage();
decksPage.sublistManager = new DecksSublistManager();
window.addEventListener("load", () => decksPage.pOnLoad());

globalThis.dbg_page = decksPage;
