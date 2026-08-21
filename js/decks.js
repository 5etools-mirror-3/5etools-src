"use strict";

class DecksSublistManager extends SublistManager {
	static _getRowTemplate () {
		return [
			new SublistCellTemplate({
				name: "Name",
				css: "ve-bold ve-col-12 ve-px-0",
				colStyle: "",
			}),
		];
	}

	pGetSublistItem (ent, hash) {
		const cellsText = [ent.name];

		const ele = veT`<div class="ve-lst__row ve-lst__row--sublist ve-flex-col">
			<a href="#${hash}" class="ve-lst__row-border ve-lst__row-inner">
				${this.constructor._getRowCellsHtml({values: cellsText})}
			</a>
		</div>`
			.vee.onn("contextmenu", evt => this._handleSublistItemContextMenu(evt, listItem))
			.vee.onn("click", evt => this._listSub.doSelect(listItem, evt));

		const listItem = new ListItem(
			hash,
			ele,
			ent.name,
			{
				...ListItem.getCommonValues(ent),
				alias: PageFilterDecks.getListAliases(ent),
			},
			{
				hash,
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

			// TODO(Future) implement e.g. custom `ClsBookView` to allow more useful deck printing
			bookViewOptions: {
				nameSingular: "deck",
				namePlural: "decks",
				pageTitle: "Decks Book View",
			},

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
		eleLi.className = `ve-lst__row ve-flex-col ${isExcluded ? "ve-lst__row--blocklisted" : ""}`;

		const source = Parser.sourceJsonToAbv(ent.source);
		const hash = UrlUtil.autoEncodeHash(ent);

		eleLi.innerHTML = `<a href="#${hash}" class="ve-lst__row-border ve-lst__row-inner">
			<span class="ve-col-10 ve-bold ve-pl-0 ve-pr-1">${ent.name}</span>
			<span class="ve-col-2 ve-text-center ${Parser.sourceJsonToSourceClassname(ent.source)} ve-pl-1 ve-pr-0" title="${Parser.sourceJsonToFull(ent.source)}">${source}</span>
		</a>`;

		const listItem = new ListItem(
			anI,
			eleLi,
			ent.name,
			{
				source,
				...ListItem.getCommonValues(ent),
			},
			{
				hash,
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
			.vee.find(`[data-name="deck-wrp-controls"]`)?.remove();

		const wrpControls = veT`<div class="ve-flex ve-mt-auto" data-name="deck-wrp-controls"></div>`
			.vee.prependTo(this._wrpTabs);

		const btnDraw = veT`<button class="ve-btn ve-btn-xs ve-btn-primary ve-bb-0 ve-bbr-0 ve-bbl-0" title="Draw a Card (SHIFT to Skip Replacement; CTRL to Skip Animation)"><i class="fas fa-fw fa-cards"></i></button>`
			.vee.onn("click", async evt => {
				const cards = this._compCardState.getUndrawnCards(ent);
				if (!cards.length) return JqueryUtil.doToast({content: "All cards have already been drawn!", type: "warning"});

				const card = RollerUtil.rollOnArray(cards);
				if (!card._isReplacement || evt.shiftKey) await this._compCardState.pDrawCard(ent, card);

				if (EventUtil.isCtrlMetaKey(evt)) {
					const eleChat = veT`<span>Drew card: ${Renderer.get().render(`{@card ${card.name}|${card.set}|${card.source}}`)}</span>`;

					Renderer.dice.addRoll({
						rolledBy: {
							name: ent.name,
						},
						ele: eleChat,
					});

					return;
				}

				try {
					btnDraw.vee.prop("disabled", true);
					await RenderDecks.pRenderStgCard({deck: ent, card});
				} finally {
					btnDraw.vee.prop("disabled", false);
				}
			});

		const btnReset = veT`<button class="ve-btn ve-btn-xs ve-btn-default ve-bb-0 ve-bbr-0 ve-bbl-0" title="Reset Deck"><i class="fas fa-fw fa-rotate-left"></i></button>`
			.vee.onn("click", async () => {
				await this._compCardState.pResetDeck(ent);
				JqueryUtil.doToast("Reset deck!");
			});

		// region List vs Grid view
		const btnViewList = this._compSettings ? veT`<button class="ve-btn ve-btn-xs ve-btn-default ve-bb-0 ve-bbr-0 ve-bbl-0" title="Card List View"><i class="fas fa-fw fa-list"></i></button>`
			.vee.onn("click", () => {
				this._compSettings.pSet("cardLayout", "list").then(null);
			}) : null;

		const btnViewGrid = this._compSettings ? veT`<button class="ve-btn ve-btn-xs ve-btn-default ve-bb-0 ve-bbr-0 ve-bbl-0" title="Card Grid View"><i class="fas fa-fw fa-grid-2"></i></button>`
			.vee.onn("click", () => {
				this._compSettings.pSet("cardLayout", "grid").then(null);
			}) : null;

		const hkCardLayout = this._compSettings.addHookBase("cardLayout", () => {
			const mode = this._compSettings.get("cardLayout");
			btnViewList.vee.toggleClass("ve-active", mode === "list");
			btnViewGrid.vee.toggleClass("ve-active", mode === "grid");
		});
		this._renderFnsCleanup.push(() => this._compSettings.removeHookBase("cardLayout", hkCardLayout));
		hkCardLayout();
		// endregion

		// region Spreads
		// Only decks with a documented way of laying out cards get the button
		const btnSpread = veT`<button class="ve-btn ve-btn-xs ve-btn-default ve-bb-0 ve-bbr-0 ve-bbl-0 ve-hidden" title="Read a Spread"><i class="fas fa-fw fa-layer-group"></i></button>`
			.vee.onn("click", () => this._pDoOpenSpread(ent, btnSpread).then(null));

		RenderDeckSpreads.pGetSpreadsForDeck(ent)
			.then(spreads => btnSpread.vee.toggleClass("ve-hidden", !spreads.length));
		// endregion

		veT(wrpControls)`<div class="ve-flex">
			<div class="ve-flex-v-center ve-btn-group">
				${btnDraw}
				${btnReset}
				${btnSpread}
			</div>

			<div class="ve-flex-v-center ve-btn-group ve-ml-2">
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
			.vee.empty()
			.vee.appends(ele);
	}

	async _pDoOpenSpread (ent, btnSpread) {
		try {
			btnSpread.vee.prop("disabled", true);

			const spreads = await RenderDeckSpreads.pGetSpreadsForDeck(ent);
			if (!spreads.length) return;

			const {eleModalInner} = UiUtil.getShowModal({
				title: `Spread \u2014 ${ent.name}`,
				isMinHeight0: true,
				isUncappedHeight: true,
			});
			const wrpModal = veE({ele: eleModalInner});

			const wrpOut = veE({tag: "div", clazz: "ve-flex-col ve-w-100"});

			const selSpread = veT`<select class="form-control input-sm ve-w-100">
				${spreads.map((spread, ix) => veT`<option value="${ix}">${spread.name} (${Parser.sourceJsonToAbv(spread.source)})</option>`)}
			</select>`;

			const pDoRender = async () => {
				const spread = spreads[Number(selSpread.vee.val())];
				wrpOut.vee.empty();
				veT`<div class="ve-mb-2">${Renderer.get().setFirstSection(true).render({entries: spread.entries || []})}</div>`
					.vee.appendTo(wrpOut);
				(await RenderDeckSpreads.pGetRenderedSpread({spread, deck: ent}))
					.vee.appendTo(wrpOut);
				Renderer.dice.bindOnclickListener(wrpOut);
			};

			const btnRedraw = veT`<button class="ve-btn ve-btn-primary ve-btn-sm ve-ml-2 ve-no-shrink">Draw</button>`
				.vee.onn("click", () => pDoRender().then(null));

			selSpread.vee.onn("change", () => pDoRender().then(null));

			veT`<div class="ve-flex-col ve-w-100 ve-min-h-0">
				<div class="ve-flex-v-center ve-mb-2">${selSpread}${btnRedraw}</div>
				<div class="ve-flex-col ve-w-100 ve-overflow-y-auto">${wrpOut}</div>
			</div>`
				.vee.appendTo(wrpModal);

			await pDoRender();
		} finally {
			btnSpread.vee.prop("disabled", false);
		}
	}
}

const decksPage = new DecksPage();
decksPage.sublistManager = new DecksSublistManager();
window.addEventListener("load", () => decksPage.pOnLoad());

globalThis.dbg_page = decksPage;
