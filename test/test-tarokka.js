import * as fs from "fs";

/**
 * The Tarokka Reader (`js/tarokka.js`) parses its reading text out of the CoS adventure JSON at runtime, rather than
 * duplicating it. Verify that the structure it relies on still holds--i.e. that every card in the deck has reading
 * text for each position it can be drawn into.
 */

const NAME_SECTION = "Fortunes of Ravenloft";
const NAME_TREASURE = "Treasure Locations";
const NAME_ENEMY = "Strahd's Enemy";
const NAME_LOCATION = "Strahd's Location in the Castle";

const loadJson = path => JSON.parse(fs.readFileSync(path, "utf-8"));

/** Mirrors `TarokkaData._getOutcomes`. */
function getOutcomes (section, name, errors) {
	const child = (section.entries || []).find(entry => entry?.name === name);
	if (!child) {
		errors.push(`Could not find adventure section "${name}"!`);
		return null;
	}

	const out = {};

	const recurse = node => {
		if (node instanceof Array) return node.forEach(recurse);
		if (typeof node !== "object" || node == null) return;

		const entries = node.entries || [];
		for (let i = 0; i < entries.length; ++i) {
			const entry = entries[i];

			if (entry?.type !== "insetReadaloud") {
				recurse(entry);
				continue;
			}

			const notes = [];
			let j = i + 1;
			for (; j < entries.length && entries[j]?.type !== "insetReadaloud"; ++j) notes.push(entries[j]);

			const header = (entry.entries || [])[0];
			const mCard = /\{@card ([^|}]+)\|/.exec(header || "");
			if (!mCard) errors.push(`Section "${name}": could not find card tag in readaloud header "${header}"!`);
			else (out[mCard[1]] = out[mCard[1]] || []).push({readaloud: entry, notes});

			i = j - 1;
		}
	};
	recurse(child);

	return out;
}

function testTarokka () {
	const errors = [];

	const dataDecks = loadJson("./data/decks.json");
	const dataAdventure = loadJson("./data/adventure/adventure-cos.json");

	const deck = dataDecks.deck.find(it => it.name === "Tarokka Deck" && it.source === "CoS");
	if (!deck) {
		errors.push(`Could not find the Tarokka Deck (CoS)!`);
		return errors;
	}

	const cards = dataDecks.card.filter(it => it.set === "Tarokka Deck" && it.source === "CoS");
	const namesCommon = cards.filter(it => it.suit).map(it => it.name);
	const namesHigh = cards.filter(it => !it.suit).map(it => it.name);

	if (cards.length !== 54) errors.push(`Expected a 54-card tarokka deck, but found ${cards.length}!`);
	if (deck.cards.length !== 54) errors.push(`Expected the deck to reference 54 cards, but found ${deck.cards.length}!`);
	if (namesCommon.length !== 40) errors.push(`Expected a 40-card common deck, but found ${namesCommon.length}!`);
	if (namesHigh.length !== 14) errors.push(`Expected a 14-card high deck, but found ${namesHigh.length}!`);

	const section = (dataAdventure.data || [])
		.flatMap(chapter => chapter.entries || [])
		.find(entry => entry?.name === NAME_SECTION);
	if (!section) {
		errors.push(`Could not find adventure section "${NAME_SECTION}"!`);
		return errors;
	}

	// Every card which can be drawn into a position must have reading text for it, else the page renders a blank result
	[
		{name: NAME_TREASURE, namesExpected: namesCommon},
		{name: NAME_ENEMY, namesExpected: namesHigh},
		{name: NAME_LOCATION, namesExpected: namesHigh},
	]
		.forEach(({name, namesExpected}) => {
			const outcomes = getOutcomes(section, name, errors);
			if (!outcomes) return;

			namesExpected
				.filter(it => !outcomes[it]?.length)
				.forEach(it => errors.push(`Section "${name}" was missing reading text for card "${it}"!`));

			Object.keys(outcomes)
				.filter(it => !namesExpected.includes(it))
				.forEach(it => errors.push(`Section "${name}" had reading text for unexpected card "${it}"!`));

			// Each outcome must be followed by DM-facing notes, else the reading gives the DM nothing to act on
			Object.entries(outcomes)
				.forEach(([nameCard, outs]) => {
					outs
						.filter(({notes}) => !notes.length)
						.forEach(() => errors.push(`Section "${name}", card "${nameCard}" had no notes!`));
				});
		});

	return errors;
}

async function main () {
	let anyErrors = false;

	const errors = testTarokka();
	if (errors.length) {
		anyErrors = true;
		console.error(`Tarokka errors:`);
		errors.forEach(it => console.error(`\t${it}`));
	}

	if (!anyErrors) console.log("##### Tarokka Tests Passed #####");
	return !anyErrors; // invert the result as this is what the test runner expects
}

const pMain = main();

if (import.meta.main && !(await pMain)) process.exitCode = 1;

export default pMain;
