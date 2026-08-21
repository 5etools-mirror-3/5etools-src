import fs from "fs";

import "../js/parser.js";
import "../js/utils.js";

function getCardsByDeck (dataDecks) {
	const out = {};
	(dataDecks.card || [])
		.forEach(card => (out[`${card.set}|${card.source}`] ||= []).push(card));
	return out;
}

/**
 * The "Fortunes of Ravenloft" spread reads its outcome text out of the adventure at runtime, so guard the structure
 * that parsing depends on: an `insetReadaloud` per card, keyed by a `{@card ...}` tag in its header.
 */
function getOutcomeCardNames ({node, out}) {
	if (node instanceof Array) return node.forEach(child => getOutcomeCardNames({node: child, out}));
	if (typeof node !== "object" || node == null) return;

	(node.entries || [])
		.forEach(entry => {
			if (entry?.type !== "insetReadaloud") return getOutcomeCardNames({node: entry, out});
			const header = (entry.entries || [])[0];
			const mCard = /\{@card ([^|}]+)\|/.exec(header || "");
			if (mCard) out.add(mCard[1]);
		});
}

async function pMain () {
	const errors = [];

	const dataDecks = JSON.parse(fs.readFileSync("./data/decks.json", "utf-8"));
	const dataSpreads = JSON.parse(fs.readFileSync("./data/deck-spreads.json", "utf-8"));

	const decksByKey = Object.fromEntries((dataDecks.deck || []).map(deck => [`${deck.name}|${deck.source}`, deck]));
	const cardsByDeck = getCardsByDeck(dataDecks);

	(dataSpreads.deckSpread || [])
		.forEach(spread => {
			const ident = `${spread.name} (${spread.source})`;

			const deck = decksByKey[spread.deck];
			if (!deck) return errors.push(`Spread "${ident}" referenced unknown deck "${spread.deck}"!`);

			const cards = cardsByDeck[spread.deck] || [];
			if (!cards.length) return errors.push(`Spread "${ident}" deck "${spread.deck}" had no cards!`);

			if (!spread.positions?.length) return errors.push(`Spread "${ident}" had no positions!`);

			const suitsAvailable = new Set(cards.map(card => card.suit ?? null));

			spread.positions
				.forEach(position => {
					if (!position.name) errors.push(`Spread "${ident}" had a position with no name!`);
					if (!position.entries?.length) errors.push(`Spread "${ident}" position "${position.name}" had no entries!`);

					(position.suits || [])
						.forEach(suit => {
							if (!suitsAvailable.has(suit)) errors.push(`Spread "${ident}" position "${position.name}" required suit "${suit}", which the deck does not have!`);
						});
				});

			// A spread must never require more cards of a suit than the deck holds
			const cntBySuits = new Map();
			spread.positions
				.forEach(position => {
					if (!position.suits) return;
					const key = JSON.stringify(position.suits);
					cntBySuits.set(key, (cntBySuits.get(key) || 0) + 1);
				});
			cntBySuits
				.forEach((cnt, key) => {
					const suits = JSON.parse(key);
					const cntAvailable = cards.filter(card => suits.includes(card.suit ?? null)).length;
					if (cnt > cntAvailable) errors.push(`Spread "${ident}" wanted ${cnt} cards of suits ${key}, but the deck has only ${cntAvailable}!`);
				});

			if (spread.positions.length > cards.length) errors.push(`Spread "${ident}" wanted ${spread.positions.length} cards, but the deck has only ${cards.length}!`);

			// region Outcome-driven spreads
			if (!spread.outcomeSource) return;

			const {id, section} = spread.outcomeSource;
			const pathAdventure = `./data/adventure/adventure-${id.toLowerCase()}.json`;
			if (!fs.existsSync(pathAdventure)) return errors.push(`Spread "${ident}" referenced missing adventure "${pathAdventure}"!`);

			const dataAdventure = JSON.parse(fs.readFileSync(pathAdventure, "utf-8"));
			const nodeSection = (dataAdventure.data || [])
				.flatMap(chapter => chapter.entries || [])
				.find(entry => entry?.name === section);
			if (!nodeSection) return errors.push(`Spread "${ident}" referenced missing adventure section "${section}"!`);

			const namesCards = new Set(cards.map(card => card.name));

			spread.positions
				.filter(position => position.outcomeGroup)
				.forEach(position => {
					const nodeGroup = (nodeSection.entries || [])
						.find(entry => entry?.name === position.outcomeGroup);
					if (!nodeGroup) return errors.push(`Spread "${ident}" position "${position.name}" referenced missing outcome group "${position.outcomeGroup}"!`);

					const namesFound = new Set();
					getOutcomeCardNames({node: nodeGroup, out: namesFound});

					if (!namesFound.size) return errors.push(`Spread "${ident}" outcome group "${position.outcomeGroup}" yielded no cards!`);

					// Every card the position could draw must have outcome text
					const cardsDrawable = cards
						.filter(card => !position.suits || position.suits.includes(card.suit ?? null));
					cardsDrawable
						.forEach(card => {
							if (!namesFound.has(card.name)) errors.push(`Spread "${ident}" outcome group "${position.outcomeGroup}" was missing text for card "${card.name}"!`);
						});

					[...namesFound]
						.forEach(name => {
							if (!namesCards.has(name)) errors.push(`Spread "${ident}" outcome group "${position.outcomeGroup}" had text for unknown card "${name}"!`);
						});
				});
			// endregion
		});

	if (errors.length) {
		errors.forEach(err => console.error(err));
		console.error(`Deck spreads test failed! (${errors.length} error${errors.length === 1 ? "" : "s"})`);
		return false;
	}

	console.log("Deck spreads test passed.");
	return true;
}

export default pMain();

if (import.meta.main && !(await pMain())) process.exitCode = 1;
