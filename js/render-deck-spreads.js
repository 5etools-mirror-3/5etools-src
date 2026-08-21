"use strict";

/**
 * Draw cards into the named positions of a "spread"--a way of laying out cards for divination, adventure generation,
 * etc., as described by various sources.
 *
 * Most spreads are interpretive: the position supplies a meaning ("the past", "what opposes the focus") and the card
 * is read through it. Some--currently only "Fortunes of Ravenloft" (CoS)--instead have pre-written outcome text per
 * card, authored in the adventure; see {@link RenderDeckSpreads._pGetOutcomes}.
 */
class RenderDeckSpreads {
	static _URL_SPREADS = "data/deck-spreads.json";

	static _pLoadSpreads = null;
	static _CACHE_OUTCOMES = {};

	static async _pGetSpreads () {
		return this._pLoadSpreads ||= DataUtil.loadJSON(`${Renderer.get().baseUrl}${this._URL_SPREADS}`)
			.then(json => json.deckSpread || []);
	}

	/** @return {Array} The spreads which may be drawn using the deck, if any. */
	static async pGetSpreadsForDeck (deck) {
		const key = `${deck.name}|${deck.source}`;
		return (await this._pGetSpreads())
			.filter(spread => spread.deck === key);
	}

	/* -------------------------------------------- */

	/**
	 * Draw one card per position, without replacement. Positions which specify `suits` draw only from those suits, so
	 * that e.g. the last two cards of a Tarokka reading come from the high deck.
	 */
	static getDrawn ({spread, deck}) {
		const cardsAvailable = [...deck.cards];

		return spread.positions
			.map(position => {
				const pool = position.suits
					? cardsAvailable.filter(card => position.suits.includes(card.suit ?? null))
					: cardsAvailable;
				if (!pool.length) return {position, card: null};

				const card = RollerUtil.rollOnArray(pool);
				cardsAvailable.splice(cardsAvailable.indexOf(card), 1);
				return {position, card};
			});
	}

	/* -------------------------------------------- */

	static async pGetRenderedSpread ({spread, deck}) {
		const outcomes = spread.outcomeSource ? await this._pGetOutcomes(spread) : null;

		const rows = this.getDrawn({spread, deck})
			.map(drawn => this._getRenderedDrawn({...drawn, deck, outcomes}));

		return veT`<div class="ve-flex-col">${rows}</div>`;
	}

	static _getRenderedDrawn ({position, card, deck, outcomes}) {
		if (!card) {
			return veT`<div class="deck-spread__wrp-row ve-stats ve-stats--book ve-p-2 ve-mb-2">
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
			`{@b Drawn:} {@card ${card.name}|${card.set}|${card.source}}`,
			...(position.entries || []),
			...this._getOutcomeEntries({position, card, outcomes}),
		];

		const ptText = Renderer.get()
			.setFirstSection(true)
			.setPartPageExpandCollapseDisabled(true)
			.render({name: position.name, entries}, 1);
		Renderer.get().setPartPageExpandCollapseDisabled(false);

		return veT`<div class="ve-flex-v-center decks__wrp-row ve-stats ve-stats--book ve-p-2 ve-mb-2">
			${wrpFace}
			<div class="ve-ml-2 decks__wrp-card-text ve-w-100">${ptText}</div>
		</div>`;
	}

	/**
	 * Interpretive spreads have no per-card outcome, so fall back to the card's own text--the reader interprets it
	 * through the lens of the position.
	 */
	static _getOutcomeEntries ({position, card, outcomes}) {
		if (!position.outcomeGroup) return Renderer.card.getFullEntries(card);

		const found = outcomes?.[position.outcomeGroup]?.[card.name];
		if (!found) return [`{@note No reading text could be found for this card.}`];
		return found.flatMap(({readaloud, notes}) => [readaloud, ...notes]);
	}

	/* -------------------------------------------- */

	/**
	 * Load the pre-written outcome text for a spread which has one. Each outcome in the adventure text is an
	 * `insetReadaloud` whose header names its card, followed by the DM-facing notes for that card, up until the next
	 * `insetReadaloud`.
	 */
	static async _pGetOutcomes (spread) {
		const {id, section} = spread.outcomeSource;
		if (this._CACHE_OUTCOMES[id]) return this._CACHE_OUTCOMES[id];

		const url = `${Renderer.get().baseUrl}data/adventure/adventure-${id.toLowerCase()}.json`;
		const data = await DataUtil.loadJSON(url);

		const nodeSection = (data.data || [])
			.flatMap(chapter => chapter.entries || [])
			.find(entry => entry?.name === section);
		if (!nodeSection) throw new Error(`Could not find adventure section "${section}"!`);

		// Only the groups the spread actually references--the section also contains prose which is not an outcome
		const namesGroups = new Set(
			spread.positions
				.map(position => position.outcomeGroup)
				.filter(Boolean),
		);

		const out = {};
		(nodeSection.entries || [])
			.filter(entry => namesGroups.has(entry?.name))
			.forEach(entry => {
				const outGroup = out[entry.name] = {};
				this._pGetOutcomes_recurse(entry, outGroup);
			});

		return this._CACHE_OUTCOMES[id] = out;
	}

	static _pGetOutcomes_recurse (node, out) {
		if (node instanceof Array) return node.forEach(child => this._pGetOutcomes_recurse(child, out));
		if (typeof node !== "object" || node == null) return;

		const entries = node.entries || [];
		for (let i = 0; i < entries.length; ++i) {
			const entry = entries[i];

			if (entry?.type !== "insetReadaloud") {
				this._pGetOutcomes_recurse(entry, out);
				continue;
			}

			const notes = [];
			let j = i + 1;
			for (; j < entries.length && entries[j]?.type !== "insetReadaloud"; ++j) notes.push(entries[j]);

			const nameCard = this._pGetOutcomes_getCardName(entry);
			if (nameCard) (out[nameCard] = out[nameCard] || []).push({readaloud: entry, notes});

			i = j - 1;
		}
	}

	/** @return {?string} The card the readaloud is an outcome for, or `null` if it is not an outcome. */
	static _pGetOutcomes_getCardName (entry) {
		const header = (entry.entries || [])[0];
		const mCard = /\{@card ([^|}]+)\|/.exec(header || "");
		return mCard ? mCard[1] : null;
	}
}

globalThis.RenderDeckSpreads = RenderDeckSpreads;
