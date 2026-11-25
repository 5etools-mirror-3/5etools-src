export class DeckSpreads {
	static _REVEAL_INITIAL_DELAY_MS = 100;
	static _REVEAL_CARD_DELAY_MS = 150;

	static getEntries ({spread}) {
		const seeAlso = [
			...(spread.seeAlsoAdventureHeader || []).map(uid => `{@adventure ${uid}}`),
			...(spread.seeAlsoBookHeader || []).map(uid => `{@book ${uid}}`),
		];

		return [
			...(spread.entries || []),
			seeAlso.length ? `{@note See also: ${seeAlso.join(", ")}.}` : null,
		].filter(Boolean);
	}

	/* -------------------------------------------- */

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

	static _getRenderedDrawnMeta ({position, card, deck, outcomeMeta}) {
		if (!card) {
			return {
				wrp: veT`<div class="ve-flex-v-center ve-stats ve-stats--book ve-p-2 ve-mb-2 ve-bg-solid ve-shadow-big ve-b-1p ve-bc-5p">
					${Renderer.get().render(`{@note No card was available for position "${position.name}".}`)}
				</div>`,
			};
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
			.render({entries}, 1);
		Renderer.get().setPartPageExpandCollapseDisabled(false);

		const wrpFront = veT`<div class="deck-spread__wrp-position-face ve-flex-col ve-stats ve-stats--book ve-p-2 ve-bg-solid ve-shadow-big ve-b-1p ve-bc-5p">
			<h4 class="ve-mt-0 ve-mb-2 ve-text-center ve-dnd-font"><span class="ve-muted ve-small">Position${position.name ? ":" : ""}</span>${position.name ? ` &quot;<u>${position.name}</u>&quot;` : ""}</h4>
			<div class="ve-flex-v-center">
				${wrpFace}
				<div class="ve-ml-2 decks__wrp-card-text ve-w-100">${ptText}</div>
			</div>
		</div>`
			.vee.prop("inert", true);

		const wrpBack = veT`<div class="deck-spread__wrp-position-face deck-spread__wrp-position-face--back ve-flex-vh-center ve-stats ve-stats--book ve-absolute ve-p-2 ve-bg-solid ve-shadow-big ve-b-1p ve-bc-5p">
			<div class="deck-spread__disp-card-back ve-dnd-font ve-muted">?</div>
		</div>`
			.vee.prop("inert", true);

		return {
			wrp: veT`<div class="deck-spread__wrp-position-flip deck-spread__wrp-position-flip--face-down ve-relative ve-mb-2">
				${wrpBack}
				${wrpFront}
			</div>`,
			wrpFront,
		};
	}

	/* -------------------------------------------- */

	static _getDrawn ({spread, deck}) {
		const cardsAvailable = [...deck.cards];

		return spread.positions
			.map(position => {
				const cardsPool = position.suits
					? cardsAvailable.filter(card => {
						return position.suits.includes(card.suit ?? "None");
					})
					: cardsAvailable;

				if (!cardsPool.length) return {position, card: null};

				const card = RollerUtil.rollOnArray(cardsPool);
				cardsAvailable.splice(cardsAvailable.indexOf(card), 1);
				return {position, card};
			});
	}

	static async pGetSpreadDrawnMetas ({spread, deck}) {
		return this._getDrawn({spread, deck})
			.pSerialAwaitMap(async drawn => ({
				...drawn,
				deck,
				outcomeMeta: drawn.card ? await this._pGetOutcomeMeta({...drawn, spread}) : null,
			}));
	}

	static getWrpRenderedSpreadMeta ({spread, drawnMetas}) {
		const entries = this.getEntries({spread});
		const wrpEntries = entries.length
			? veT`<div class="ve-mb-2">${Renderer.get().setFirstSection(true).render({entries})}</div>`
			: null;

		const rowMetas = drawnMetas.map(drawn => this._getRenderedDrawnMeta(drawn));

		return {
			wrp: veT`<div class="ve-flex-col">${wrpEntries}${rowMetas.map(({wrp}) => wrp)}</div>`
				.vee.cssVar("--time-deck-spread-iteration", `${this._REVEAL_CARD_DELAY_MS}ms`),
			rowMetas,
		};
	}

	static async pRevealSpread ({rowMetas, isSkipAnimation, abortSignal}) {
		const rowMetasToReveal = rowMetas.filter(({wrpFront}) => wrpFront);

		const doRevealPosition = ({wrp, wrpFront}) => {
			wrp.vee.removeClass("deck-spread__wrp-position-flip--face-down");
			wrpFront.vee.prop("inert", false);
		};

		if (abortSignal.aborted) return;

		if (isSkipAnimation) return rowMetasToReveal.forEach(rowMeta => doRevealPosition(rowMeta));

		await AnimationUtil.pRecomputeStyles();
		if (abortSignal.aborted) return;
		await MiscUtil.pDelay(this._REVEAL_INITIAL_DELAY_MS, null, {abortSignal});

		for (const rowMeta of rowMetasToReveal) {
			if (!rowMeta.wrp.isConnected) return;

			doRevealPosition(rowMeta);
			await MiscUtil.pDelay(this._REVEAL_CARD_DELAY_MS, null, {abortSignal});
		}
	}
}
