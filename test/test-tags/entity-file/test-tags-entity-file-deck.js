import {DeckSpreads} from "../../../js/decks/decks-spreads.js";
import {EntityFileHandlerBase} from "./test-tags-entity-file-base.js";
import {getInvalidCorpusHeaderUidMessage} from "../test-tags-utils-corpus.js";

export class EntityFileHandlerDeck extends EntityFileHandlerBase {
	_props = ["deck"];

	async _pHandleFile_preProcess ({filePath, contents, fileState}) {
		fileState.deckUidToCardList = (contents.card || [])
			.reduce((accum, card) => {
				const deckUid = DataUtil.proxy.getUid("deck", {name: card.set, source: card.source}, {isMaintainCase: true});
				(accum[deckUid] ||= []).push(card);

				return accum;
			}, {});
	}

	/* -------------------------------------------- */

	_doTestEntity_spread_seeAlsoHeaders ({filePath, spread}) {
		[{prop: "adventure", propSeeAlso: "seeAlsoAdventureHeader"}, {prop: "book", propSeeAlso: "seeAlsoBookHeader"}]
			.forEach(({prop, propSeeAlso}) => {
				(spread[propSeeAlso] || [])
					.forEach(uid => {
						const message = getInvalidCorpusHeaderUidMessage({
							tagTestUrlLookup: this._tagTestUrlLookup,
							tagTestCorpusHeaderUidMap: this._tagTestCorpusHeaderUidMap,
							prop,
							uid,
							filePath,
						});
						if (message) this._addMessage(message);
					});
			});
	}

	/* -------------------------------------------- */

	async _pDoTestEntity_spread_outcomes_entry ({filePath, spreadUid, cardUids, type, id, uid, areaId}) {
		if (!cardUids.has(uid)) this._addMessage(`Spread "${spreadUid}" in file ${filePath} had an outcome for card "${uid}", which is not in the deck!\n`);

		const entryIdLookup = await DeckSpreads.pGetEntryIdLookup({type, id});
		if (!entryIdLookup) return this._addMessage(`Spread "${spreadUid}" in file ${filePath} outcome card "${uid}" referenced missing ${type} "${id}"!\n`);

		const entry = entryIdLookup[areaId]?.entry;
		if (!entry) return this._addMessage(`Spread "${spreadUid}" in file ${filePath} outcome card "${uid}" referenced missing area "${areaId}" in ${type} "${id}"!\n`);
	}

	async _pDoTestEntity_spread_outcomes_scope ({filePath, spreadUid, cardUids, outcomeMetas}) {
		const uidsSeen = new Set();
		for (const outcomeMeta of outcomeMetas) {
			if (uidsSeen.has(outcomeMeta.uid)) this._addMessage(`Spread "${spreadUid}" in file ${filePath} had multiple outcomes for card "${outcomeMeta.uid}" in the same scope!\n`);
			uidsSeen.add(outcomeMeta.uid);
			await this._pDoTestEntity_spread_outcomes_entry({filePath, spreadUid, cardUids, ...outcomeMeta});
		}
		return uidsSeen;
	}

	async _pDoTestEntity_spread_outcomes ({filePath, spreadUid, cards, spread}) {
		if (!spread.outcomes && !spread.positions.some(position => position.outcomes)) return;

		const cardUids = new Set(cards.map(card => DataUtil.deck.getUidCard(card)));
		const spreadOutcomeMetas = DeckSpreads.getOutcomeMetas({outcomes: spread.outcomes});
		const spreadOutcomeUids = await this._pDoTestEntity_spread_outcomes_scope({filePath, spreadUid, cardUids, outcomeMetas: spreadOutcomeMetas});

		for (const position of spread.positions) {
			const positionOutcomeMetas = DeckSpreads.getOutcomeMetas({outcomes: position.outcomes});
			const positionOutcomeUids = await this._pDoTestEntity_spread_outcomes_scope({filePath, spreadUid, cardUids, outcomeMetas: positionOutcomeMetas});

			cards
				.filter(card => !position.suits || position.suits.includes(card.suit ?? "None"))
				.forEach(card => {
					const uid = DataUtil.deck.getUidCard(card);
					if (!positionOutcomeUids.has(uid) && !spreadOutcomeUids.has(uid)) this._addMessage(`Spread "${spreadUid}" in file ${filePath} position "${position.name}" had no outcome for card "${uid}"!\n`);
				});
		}
	}

	async _pDoTestEntity_spread ({filePath, fileState, ent, spread}) {
		const spreadUid = `${spread.name}|${spread.source}`;
		const deckUid = DataUtil.proxy.getUid("deck", ent, {isMaintainCase: true});
		const cards = fileState.deckUidToCardList[deckUid] || [];

		this._doTestEntity_spread_seeAlsoHeaders({filePath, spread});

		if (!cards.length) return this._addMessage(`Spread "${spreadUid}" in file ${filePath} deck "${deckUid}" had no cards!\n`);

		const suitsAvailable = new Set(cards.map(card => card.suit ?? "None"));

		spread.positions
			.forEach(position => {
				(position.suits || [])
					.forEach(suit => {
						if (!suitsAvailable.has(suit)) this._addMessage(`Spread "${spreadUid}" in file ${filePath} position "${position.name}" required suit "${suit}", which the deck does not have!\n`);
					});
			});

		const cntBySuits = {};
		spread.positions
			.forEach(position => {
				if (!position.suits) return;
				const key = JSON.stringify(position.suits);
				cntBySuits[key] = (cntBySuits[key] || 0) + 1;
			});
		Object.entries(cntBySuits)
			.forEach(([key, cnt]) => {
				const suits = JSON.parse(key);
				const cntAvailable = cards.filter(card => suits.includes(card.suit ?? "None")).length;
				if (cnt > cntAvailable) this._addMessage(`Spread "${spreadUid}" in file ${filePath} wanted ${cnt} cards of suits ${key}, but the deck has only ${cntAvailable}!\n`);
			});

		if (spread.positions.length > cards.length) this._addMessage(`Spread "${spreadUid}" in file ${filePath} wanted ${spread.positions.length} cards, but the deck has only ${cards.length}!\n`);

		await this._pDoTestEntity_spread_outcomes({filePath, spreadUid, cards, spread});
	}

	/* -------------------------------------------- */

	async _pDoTestEntity ({filePath, fileState, ent, prop, propPrefixed}) {
		this._testSrd(filePath, ent);

		(ent.cards || [])
			.forEach(cardMeta => {
				const uid = typeof cardMeta === "string" ? cardMeta : cardMeta.uid;
				const unpacked = DataUtil.deck.unpackUidCard(uid, {isLower: true});
				const hash = UrlUtil.URL_TO_HASH_BUILDER["card"](unpacked);
				const url = `card#${hash}`.toLowerCase().trim();
				if (!this._tagTestUrlLookup.hasUrl(url)) this._addMessage(`Missing link: ${uid} in file ${filePath} (evaluates to "${url}") in "cards"\n${this._tagTestUrlLookup.getLogPtSimilarUrls({url})}`);
			});

		await (ent.spreads || []).pSerialAwaitMap(spread => this._pDoTestEntity_spread({filePath, fileState, ent, spread}));
	}
}
