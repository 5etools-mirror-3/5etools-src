/**
 * A reader for the "Fortunes of Ravenloft" card reading (Curse of Strahd, p11).
 *
 * All card data (art, suits, meanings) and all reading outcome text already exist in the site data, in
 * `data/decks.json` and `data/adventure/adventure-cos.json` respectively, so both are parsed at runtime rather than
 * being duplicated here.
 */
class TarokkaData {
	static _SOURCE = "CoS";
	static _DECK_NAME = "Tarokka Deck";
	static _URL_ADVENTURE = "data/adventure/adventure-cos.json";

	// The section of the adventure which contains the reading, and all its outcome text
	static _NAME_SECTION = "Fortunes of Ravenloft";
	static _NAME_TREASURE = "Treasure Locations";
	static _NAME_ENEMY = "Strahd's Enemy";
	static _NAME_LOCATION = "Strahd's Location in the Castle";

	/**
	 * The five positions of the reading, per "Card Reading" (CoS p11).
	 * Cards 1-3 are drawn from the common deck (the suited cards); cards 4-5 from the high deck (the unsuited cards).
	 */
	static POSITIONS = [
		{
			ix: 1,
			name: "The Tome of Strahd",
			isHighDeck: false,
			outcomeProp: "treasure",
			readaloud: "This card tells of history. Knowledge of the ancient will help you better understand your enemy.",
		},
		{
			ix: 2,
			name: "The Holy Symbol of Ravenkind",
			isHighDeck: false,
			outcomeProp: "treasure",
			readaloud: "This card tells of a powerful force for good and protection, a holy symbol of great hope.",
		},
		{
			ix: 3,
			name: "The Sunsword",
			isHighDeck: false,
			outcomeProp: "treasure",
			readaloud: "This is a card of power and strength. It tells of a weapon of vengeance: a sword of sunlight.",
		},
		{
			ix: 4,
			name: "Strahd's Enemy",
			isHighDeck: true,
			outcomeProp: "enemy",
			readaloud: "This card sheds light on one who will help you greatly in the battle against darkness.",
		},
		{
			ix: 5,
			name: "Strahd",
			isHighDeck: true,
			outcomeProp: "location",
			readaloud: "Your enemy is a creature of darkness, whose powers are beyond mortality. This card will lead you to him!",
		},
	];

	static _deck = null;
	static _outcomes = null;

	static getDeck () { return this._deck; }

	/**
	 * @return {?Array} The outcomes for the card in the position. Note that a card may have multiple outcomes--the
	 * "A"/"B" variants under {@link _NAME_ENEMY}.
	 */
	static getOutcomes ({position, card}) {
		return this._outcomes[position.outcomeProp][card.name] || null;
	}

	static async pInit () {
		const [dataDecks, dataAdventure] = await Promise.all([
			DataUtil.deck.loadJSON(),
			DataUtil.loadJSON(`${Renderer.get().baseUrl}${this._URL_ADVENTURE}`),
		]);

		this._deck = dataDecks.deck
			.find(deck => deck.name === this._DECK_NAME && deck.source === this._SOURCE);
		if (!this._deck) throw new Error(`Could not find deck "${this._DECK_NAME}" (${this._SOURCE})!`);

		const section = this._getSection(dataAdventure);
		this._outcomes = {
			treasure: this._getOutcomes(section, this._NAME_TREASURE),
			enemy: this._getOutcomes(section, this._NAME_ENEMY),
			location: this._getOutcomes(section, this._NAME_LOCATION),
		};
	}

	static _getSection (dataAdventure) {
		const out = (dataAdventure.data || [])
			.flatMap(chapter => chapter.entries || [])
			.find(entry => entry?.name === this._NAME_SECTION);
		if (!out) throw new Error(`Could not find adventure section "${this._NAME_SECTION}"!`);
		return out;
	}

	static _getOutcomes (section, name) {
		const child = (section.entries || [])
			.find(entry => entry?.name === name);
		if (!child) throw new Error(`Could not find adventure section "${name}"!`);

		const out = {};
		this._getOutcomes_recurse(child, out);
		return out;
	}

	/**
	 * Each outcome in the adventure text is an `insetReadaloud` whose header names its card, followed by the DM-facing
	 * notes for that card, up until the next `insetReadaloud`. Walk the section, and bucket these by card name.
	 */
	static _getOutcomes_recurse (node, out) {
		if (node instanceof Array) return node.forEach(child => this._getOutcomes_recurse(child, out));
		if (typeof node !== "object" || node == null) return;

		const entries = node.entries || [];
		for (let i = 0; i < entries.length; ++i) {
			const entry = entries[i];

			if (entry?.type !== "insetReadaloud") {
				this._getOutcomes_recurse(entry, out);
				continue;
			}

			const notes = [];
			let j = i + 1;
			for (; j < entries.length && entries[j]?.type !== "insetReadaloud"; ++j) notes.push(entries[j]);

			const nameCard = this._getOutcomes_getCardName(entry);
			(out[nameCard] = out[nameCard] || []).push({readaloud: entry, notes});

			i = j - 1;
		}
	}

	static _getOutcomes_getCardName (entry) {
		const header = (entry.entries || [])[0];
		const mCard = /\{@card ([^|}]+)\|/.exec(header || "");
		if (!mCard) throw new Error(`Could not find card tag in readaloud header "${header}"!`);
		return mCard[1];
	}
}

class TarokkaReading {
	/** Draw the five cards, keeping the common and high decks separate, as per "Card Reading" (CoS p11). */
	static getRandom () {
		const cardsCommon = TarokkaData.getDeck().cards.filter(card => card.suit).shuffle();
		const cardsHigh = TarokkaData.getDeck().cards.filter(card => !card.suit).shuffle();

		return TarokkaData.POSITIONS
			.map(position => ({
				position,
				card: (position.isHighDeck ? cardsHigh : cardsCommon).pop(),
			}));
	}
}

class TarokkaPage {
	constructor () {
		this._wrpReading = null;
	}

	async pInit () {
		await Promise.all([
			PrereleaseUtil.pInit(),
			BrewUtil2.pInit(),
		]);
		await ExcludeUtil.pInitialise();

		await TarokkaData.pInit();

		const btnDraw = veT`<button class="ve-btn ve-btn-primary ve-btn-lg" title="Draw a new five-card reading">Read the Cards</button>`
			.vee.onn("click", () => this._doDraw());

		this._wrpReading = veE({tag: "div", clazz: "ve-flex-col ve-w-100"});

		veEs(`#tarokka-main`).vee.empty();
		veT`<div class="ve-flex-col ve-w-100">
			<div class="ve-flex-vh-center ve-mb-3">${btnDraw}</div>
			${this._wrpReading}
		</div>`
			.vee.appendTo(veEs(`#tarokka-main`));

		this._doDraw();

		window.dispatchEvent(new Event("toolsLoaded"));
	}

	_doDraw () {
		this._wrpReading.vee.empty();

		TarokkaReading.getRandom()
			.map(drawn => this._getRenderedDrawn(drawn))
			.forEach(ele => ele.vee.appendTo(this._wrpReading));

		Renderer.dice.bindOnclickListener(this._wrpReading);
	}

	_getRenderedDrawn ({position, card}) {
		const deck = TarokkaData.getDeck();

		const btnViewer = veT`<button class="ve-btn ve-btn-default ve-btn-xs" title="Open Card Viewer"><span class="glyphicon glyphicon-eye-open"></span></button>`
			.vee.onn("click", async () => {
				try {
					btnViewer.vee.prop("disabled", true);
					await RenderDecks.pRenderStgCard({deck, card});
				} finally {
					btnViewer.vee.prop("disabled", false);
				}
			});

		// ponytail: inline width, as this is the only place which needs it; move to SCSS if the page grows more styling
		const wrpFace = veT`<div class="ve-no-shrink ve-px-1 decks__wrp-card-face ve-relative" style="width: 180px;">
			<div class="ve-absolute ve-pt-2 ve-pr-2 decks__wrp-btn-show-card">
				<div class="ve-btn-group ve-flex-v-center">${btnViewer}</div>
			</div>
			${Renderer.get().setFirstSection(true).render({...card.face, title: card.name, altText: card.name})}
		</div>`;

		const outcomes = TarokkaData.getOutcomes({position, card});

		const entries = [
			`{@b Drawn:} {@card ${card.name}|${card.set}|${card.source}}`,
			{type: "insetReadaloud", entries: [position.readaloud]},
			...(
				outcomes
					? outcomes.flatMap(({readaloud, notes}) => [readaloud, ...notes])
					: [`{@note No reading text could be found for this card.}`]
			),
		];

		const ptText = Renderer.get()
			.setFirstSection(true)
			.setPartPageExpandCollapseDisabled(true)
			.render({name: `${position.ix}. ${position.name}`, entries}, 1);
		Renderer.get().setPartPageExpandCollapseDisabled(false);

		return veT`<div class="ve-flex-v-center decks__wrp-row ve-stats ve-stats--book ve-p-2 ve-mb-2">
			${wrpFace}
			<div class="ve-ml-2 decks__wrp-card-text ve-w-100">${ptText}</div>
		</div>`;
	}
}

const tarokkaPage = new TarokkaPage();
window.addEventListener("load", () => void tarokkaPage.pInit());
globalThis.dbg_tarokkaPage = tarokkaPage;
