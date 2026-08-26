export class DeckSpreads {
	static _CACHE_PS_ENTRY_ID_LOOKUPS = {};

	static pGetEntryIdLookup ({type, id}) {
		const cacheKey = `${type}__${id}`.toLowerCase();
		return this._CACHE_PS_ENTRY_ID_LOOKUPS[cacheKey] ||= (async () => {
			const page = DataLoader.getPropPage(type);
			if (!page) return null;

			const hash = UrlUtil.getHashBuilder(type)({id});
			const corpus = await DataLoader.pCacheAndGetHash(page, hash);
			const data = corpus?.[`${type}Data`]?.data;
			if (!data) return null;

			return Renderer.adventureBook.getEntryIdLookup(data, {isSilent: true});
		})();
	}

	/* -------------------------------------------- */

	static getOutcomeMetas ({outcomes, uid = null}) {
		return Object.entries(outcomes || {})
			.flatMap(([type, byId]) => Object.entries(byId)
				.flatMap(([id, byUid]) => Object.entries(byUid)
					.filter(([uidCard]) => uid == null || uidCard === uid)
					.map(([uid, areaId]) => ({type, id, uid, areaId}))));
	}

	static _getOutcomeMeta ({outcomes, uid}) {
		const metas = this.getOutcomeMetas({outcomes, uid});

		if (metas.length > 1) throw new Error(`Card "${uid}" had multiple outcomes in the same scope!`);
		return metas[0];
	}

	static async _pGetOutcomeMeta ({spread, position, card}) {
		if (!spread.outcomes && !position.outcomes) return null;

		const uid = DataUtil.deck.getUidCard(card);

		const outcomeMeta = this._getOutcomeMeta({outcomes: position.outcomes, uid})
			|| this._getOutcomeMeta({outcomes: spread.outcomes, uid});
		if (!outcomeMeta) return null;

		const {type, id, areaId} = outcomeMeta;

		if (areaId == null) return null;

		const entry = (await this.pGetEntryIdLookup({type, id}))?.[areaId]?.entry;
		if (!entry) throw new Error(`Could not find outcome area "${areaId}" in ${type} "${id}" for card "${uid}"!`);

		return {entry};
	}

	/* -------------------------------------------- */

	static _getOutcomeEntries ({card, outcomeMeta}) {
		if (!outcomeMeta) return Renderer.card.getFullEntries(card);
		return [outcomeMeta.entry].filter(Boolean);
	}

	static _getWrpRenderedDrawn ({position, card, deck, outcomeMeta}) {
		if (!card) {
			return veT`<div class="ve-flex-v-center ve-stats ve-stats--book ve-p-2 ve-mb-2 ve-bg-solid ve-shadow-big ve-b-1p ve-bc-5p">
				${Renderer.get().render(`{@note No card was available for position "${position.name}".}`)}
			</div>`;
		}

		const btnViewer = veT`<button class="ve-btn ve-btn-default ve-btn-xs" title="Open Card Viewer"><span class="glyphicon glyphicon-eye-open"></span></button>`
			.vee.onn("click", async () => {
				try {
					btnViewer.vee.prop("disabled", true);
					await RenderDecks.pRenderStgCard({deck, card});
				} finally {
					btnViewer.vee.prop("disabled", false);
				}
			});

		const wrpFace = veT`<div class="ve-no-shrink ve-px-1 decks__wrp-card-face deck-spread__wrp-card-face ve-relative">
			<div class="ve-absolute ve-pt-2 ve-pr-2 decks__wrp-btn-show-card">
				<div class="ve-btn-group ve-flex-v-center">${btnViewer}</div>
			</div>
			${Renderer.get().setFirstSection(true).render({...card.face, title: card.name, altText: card.name})}
		</div>`;

		const entries = [
			`{@b Drawn:} {@card ${DataUtil.deck.getUidCard(card, {isMaintainCase: true})}}`,
			...(position.entries || []),
			...this._getOutcomeEntries({card, outcomeMeta}),
		];

		const ptText = Renderer.get()
			.setFirstSection(true)
			.setPartPageExpandCollapseDisabled(true)
			.render({name: position.name, entries}, 1);
		Renderer.get().setPartPageExpandCollapseDisabled(false);

		return veT`<div class="ve-flex-v-center ve-stats ve-stats--book ve-p-2 ve-mb-2 ve-bg-solid ve-shadow-big ve-b-1p ve-bc-5p">
			${wrpFace}
			<div class="ve-ml-2 decks__wrp-card-text ve-w-100">${ptText}</div>
		</div>`;
	}

	/* -------------------------------------------- */

	static _getDrawn ({spread, deck}) {
		const cardsAvailable = [...deck.cards];

		return spread.positions
			.map(position => {
				const cardsPool = position.suits
					? cardsAvailable.filter(card => {
						// `null` suit is "cards with no suit"
						if (!card.suit) return position.suits.includes(null);
						return position.suits.includes(card.suit);
					})
					: cardsAvailable;

				if (!cardsPool.length) return {position, card: null};

				const card = RollerUtil.rollOnArray(cardsPool);
				cardsAvailable.splice(cardsAvailable.indexOf(card), 1);
				return {position, card};
			});
	}

	static async pGetWrpRenderedSpread ({spread, deck}) {
		const rows = await this._getDrawn({spread, deck})
			.pSerialAwaitMap(async drawn => this._getWrpRenderedDrawn({
				...drawn,
				deck,
				outcomeMeta: drawn.card ? await this._pGetOutcomeMeta({...drawn, spread}) : null,
			}));

		return veT`<div class="ve-flex-col">${rows}</div>`;
	}
}
