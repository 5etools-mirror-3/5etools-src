import * as ut from "../node/util.js";

const _TESTS = [
	{file: "./data/actions.json", prop: "action", name: "Influence", source: "XPHB", isSrd52: true},
	{file: "./data/actions.json", prop: "action", name: "Study", source: "XPHB", isSrd52: true},
	{file: "./data/items-base.json", prop: "baseitem", name: "Firearm Bullet", source: "XPHB", isSrd52: true},
	{file: "./data/items-base.json", prop: "baseitem", name: "Firearm Bullets (10)", source: "XPHB", isSrd52: true},
	{file: "./data/items.json", prop: "item", name: "Airship", source: "XPHB", isSrd52: true},
	{file: "./data/items.json", prop: "item", name: "Dragonchess Set", source: "XPHB", isSrd52: true},
	{file: "./data/items.json", prop: "item", name: "Map", source: "XPHB", isSrd52: true},
	{file: "./data/items.json", prop: "item", name: "String", source: "XPHB", isSrd52: true},
	{file: "./data/items.json", prop: "item", name: "Three-Dragon Ante Set", source: "XPHB", isSrd52: true},
	{file: "./data/items.json", prop: "item", name: "Trinket", source: "XPHB", isSrd52: true},
	{file: "./data/items.json", prop: "itemGroup", name: "Arcane Focus", source: "XPHB", isSrd52: true},
	{file: "./data/items.json", prop: "itemGroup", name: "Druidic Focus", source: "XPHB", isSrd52: true},
	{file: "./data/items.json", prop: "itemGroup", name: "Holy Symbol", source: "XPHB", isSrd52: true},
	{file: "./data/bestiary/bestiary-xdmg.json", prop: "monster", name: "Avatar of Death", source: "XDMG", isSrd52: true},
	{file: "./data/bestiary/bestiary-xdmg.json", prop: "monster", name: "Giant Fly", source: "XDMG", isSrd52: true},
	{file: "./data/bestiary/bestiary-xmm.json", prop: "monster", name: "Psychic Gray Ooze", source: "XMM", isSrd52: false},
	{file: "./data/variantrules.json", prop: "variantrule", name: "Reach", source: "XPHB", isSrd52: true},

	{file: "./data/optionalfeatures.json", prop: "optionalfeature", name: "Devouring Blade", source: "XPHB", isSrd52: true},
	{file: "./data/optionalfeatures.json", prop: "optionalfeature", name: "Eldritch Mind", source: "XPHB", isSrd52: true},
	{file: "./data/optionalfeatures.json", prop: "optionalfeature", name: "Eldritch Smite", source: "XPHB", isSrd52: true},
	{file: "./data/optionalfeatures.json", prop: "optionalfeature", name: "Gift of the Depths", source: "XPHB", isSrd52: true},
	{file: "./data/optionalfeatures.json", prop: "optionalfeature", name: "Gift of the Protectors", source: "XPHB", isSrd52: true},
	{file: "./data/optionalfeatures.json", prop: "optionalfeature", name: "Investment of the Chain Master", source: "XPHB", isSrd52: true},
	{file: "./data/optionalfeatures.json", prop: "optionalfeature", name: "Lessons of the First Ones", source: "XPHB", isSrd52: true},
	{file: "./data/optionalfeatures.json", prop: "optionalfeature", name: "Seeking Spell", source: "XPHB", isSrd52: true},
	{file: "./data/optionalfeatures.json", prop: "optionalfeature", name: "Transmuted Spell", source: "XPHB", isSrd52: true},

	{file: "./data/trapshazards.json", prop: "hazard", name: "Burning", source: "XPHB", isSrd52: true},
	{file: "./data/trapshazards.json", prop: "hazard", name: "Dehydration", source: "XPHB", isSrd52: true},
	{file: "./data/trapshazards.json", prop: "hazard", name: "Falling", source: "XPHB", isSrd52: true},
	{file: "./data/trapshazards.json", prop: "hazard", name: "Malnutrition", source: "XPHB", isSrd52: true},
	{file: "./data/trapshazards.json", prop: "hazard", name: "Suffocation", source: "XPHB", isSrd52: true},
	{file: "./data/trapshazards.json", prop: "hazard", name: "Deep Water", source: "XDMG", isSrd52: true},
	{file: "./data/trapshazards.json", prop: "hazard", name: "Extreme Cold", source: "XDMG", isSrd52: true},
	{file: "./data/trapshazards.json", prop: "hazard", name: "Extreme Heat", source: "XDMG", isSrd52: true},
	{file: "./data/trapshazards.json", prop: "hazard", name: "Frigid Water", source: "XDMG", isSrd52: true},
	{file: "./data/trapshazards.json", prop: "hazard", name: "Heavy Precipitation", source: "XDMG", isSrd52: true},
	{file: "./data/trapshazards.json", prop: "hazard", name: "High Altitude", source: "XDMG", isSrd52: true},
	{file: "./data/trapshazards.json", prop: "hazard", name: "Slippery Ice", source: "XDMG", isSrd52: true},
	{file: "./data/trapshazards.json", prop: "hazard", name: "Strong Wind", source: "XDMG", isSrd52: true},
	{file: "./data/trapshazards.json", prop: "hazard", name: "Thin Ice", source: "XDMG", isSrd52: true},

	{file: "./data/generated/gendata-tables.json", prop: "table", name: "Fear Effects; Sample Fear DCs", source: "XDMG", isSrd52: true},
	{file: "./data/generated/gendata-tables.json", prop: "table", name: "Sample Mental Stress Effects", source: "XDMG", isSrd52: true},
	{file: "./data/generated/gendata-tables.json", prop: "table", name: "Determine Your XP Budget; XP Budget per Character", source: "XDMG", isSrd52: true},
	{file: "./data/generated/gendata-tables.json", prop: "table", name: "Magic Item Categories", source: "XDMG", isSrd52: true},
	{file: "./data/generated/gendata-tables.json", prop: "table", name: "Mixing Potions; Potion Miscibility", source: "XDMG", isSrd52: true},
	{file: "./data/generated/gendata-tables.json", prop: "table", name: "Magic Item Values by Rarity; Magic Item Rarities and Values", source: "XDMG", isSrd52: true},
	{file: "./data/generated/gendata-tables.json", prop: "table", name: "Magic Item Tools", source: "XDMG", isSrd52: true},
	{file: "./data/generated/gendata-tables.json", prop: "table", name: "Magic Item Crafting Time and Cost", source: "XDMG", isSrd52: true},
	{file: "./data/generated/gendata-tables.json", prop: "table", name: "Special Purpose; Sentient Item's Alignment", source: "XDMG", isSrd52: true},
	{file: "./data/generated/gendata-tables.json", prop: "table", name: "Special Purpose; Sentient Item's Communication", source: "XDMG", isSrd52: true},
	{file: "./data/generated/gendata-tables.json", prop: "table", name: "Special Purpose; Sentient Item's Senses", source: "XDMG", isSrd52: true},
	{file: "./data/generated/gendata-tables.json", prop: "table", name: "Sentient Item's Special Purpose", source: "XDMG", isSrd52: true},
	{file: "./data/generated/gendata-tables.json", prop: "table", name: "Wand of Wonder Effects", source: "XDMG", isSrd52: true},
	{file: "./data/generated/gendata-variantrules.json", prop: "variantrule", name: "Mixing Potions", source: "XDMG", isSrd52: true},
];

const _NESTED_TABLE_TESTS = [
	{file: "./data/book/book-xdmg.json", caption: "Sample Fear DCs"},
	{file: "./data/book/book-xdmg.json", caption: "Sample Mental Stress Effects"},
	{file: "./data/book/book-xdmg.json", caption: "XP Budget per Character"},
	{file: "./data/book/book-xdmg.json", caption: "Magic Item Categories"},
	{file: "./data/book/book-xdmg.json", caption: "Potion Miscibility"},
	{file: "./data/book/book-xdmg.json", caption: "Magic Item Rarities and Values"},
	{file: "./data/book/book-xdmg.json", caption: "Magic Item Tools"},
	{file: "./data/book/book-xdmg.json", caption: "Magic Item Crafting Time and Cost"},
	{file: "./data/book/book-xdmg.json", caption: "Sentient Item's Alignment"},
	{file: "./data/book/book-xdmg.json", caption: "Sentient Item's Communication"},
	{file: "./data/book/book-xdmg.json", caption: "Sentient Item's Senses"},
	{file: "./data/book/book-xdmg.json", caption: "Sentient Item's Special Purpose"},
	{file: "./data/items.json", caption: "Wand of Wonder Effects"},
];

const _NESTED_VARIANTRULE_TESTS = [
	{file: "./data/book/book-xdmg.json", name: "Mixing Potions"},
];

const _SRD52_VALUE_TESTS = [
	{file: "./data/items.json", prop: "item", name: "Carrion Crawler Mucus", source: "XDMG", srd52: "Crawler Mucus"},
	{file: "./data/items.json", prop: "item", name: "Iron Bands of Bilarro", source: "XDMG", srd52: "Iron Bands"},
	{file: "./data/items.json", prop: "item", name: "Lolth's Sting", source: "XDMG", srd52: "Spider's Sting"},
	{file: "./data/items.json", prop: "itemGroup", name: "Quaal's Feather Token", source: "XDMG", srd52: "Feather Token"},
];

const _XDMG_TRADE_GOOD_NAMES = new Set([
	"Canvas (1 sq. yd.)",
	"Chicken",
	"Cinnamon",
	"Cloves",
	"Copper",
	"Cotton Cloth (1 sq. yd.)",
	"Cow",
	"Flour",
	"Ginger",
	"Goat",
	"Gold",
	"Iron",
	"Linen (1 sq. yd.)",
	"Ox",
	"Pepper",
	"Pig",
	"Platinum",
	"Saffron",
	"Salt",
	"Sheep",
	"Silk",
	"Silver",
	"Wheat",
]);

const _DECK_OF_ILLUSIONS_SRD52 = new Map([
	["Adult Red Dragon", true],
	["Archmage", true],
	["Assassin", true],
	["Bandit Captain", true],
	["Beholder", false],
	["Berserker", true],
	["Bugbear Warrior", true],
	["Cloud Giant", true],
	["Druid", true],
	["Erinyes", true],
	["Ettin", true],
	["Fire Giant", true],
	["Frost Giant", true],
	["Gnoll Warrior", true],
	["Goblin Warrior", true],
	["Guardian Naga", true],
	["Hill Giant", true],
	["Hobgoblin Warrior", true],
	["Incubus", true],
	["Iron Golem", true],
	["Knight", true],
	["Kobold Warrior", true],
	["Lich", true],
	["Medusa", true],
	["Night Hag", true],
	["Ogre", true],
	["Oni", true],
	["Priest", true],
	["Succubus", true],
	["The Card Drawer", true],
	["Troll", true],
	["Warrior Veteran", "Veteran Warrior"],
	["Wyvern", true],
]);

const _BOOK_STATBLOCK_TESTS = [
	{file: "./data/book/book-xphb.json", tag: "variantrule", name: "Reach", source: "XPHB"},
];

function _getNestedTables (data) {
	const out = [];

	const walker = val => {
		if (!val || typeof val !== "object") return;
		if (val.type === "table") out.push(val);
		Object.values(val).forEach(walker);
	};

	walker(data);
	return out;
}

function _getNestedVariantrules (data) {
	const out = [];

	const walker = val => {
		if (!val || typeof val !== "object") return;
		if (val.data?.variantRuleInclude) out.push(val);
		Object.values(val).forEach(walker);
	};

	walker(data);
	return out;
}

function _getNestedStatblocks (data) {
	const out = [];

	const walker = val => {
		if (!val || typeof val !== "object") return;
		if (val.type === "statblock") out.push(val);
		Object.values(val).forEach(walker);
	};

	walker(data);
	return out;
}

function main () {
	console.log(`##### Testing SRD 5.2.1 membership... #####`);

	const errors = [];
	const cache = new Map();

	_TESTS.forEach(({file, prop, name, source, isSrd52}) => {
		if (!cache.has(file)) cache.set(file, ut.readJson(file));
		const data = cache.get(file);
		const matches = (data[prop] || []).filter(ent => ent.name === name && ent.source === source);

		if (matches.length !== 1) {
			errors.push(`${file} :: ${prop} :: ${name}|${source} :: expected exactly one entity, found ${matches.length}`);
			return;
		}

		const isSrd52Actual = !!matches[0].srd52;
		if (isSrd52Actual === isSrd52) return;

		errors.push(`${file} :: ${prop} :: ${name}|${source} :: expected srd52=${isSrd52}, found ${isSrd52Actual}`);
	});

	_SRD52_VALUE_TESTS.forEach(({file, prop, name, source, srd52}) => {
		if (!cache.has(file)) cache.set(file, ut.readJson(file));
		const data = cache.get(file);
		const matches = (data[prop] || []).filter(ent => ent.name === name && ent.source === source);

		if (matches.length !== 1) {
			errors.push(`${file} :: ${prop} :: ${name}|${source} :: expected exactly one entity, found ${matches.length}`);
			return;
		}

		if (matches[0].srd52 === srd52) return;
		errors.push(`${file} :: ${prop} :: ${name}|${source} :: expected srd52=${JSON.stringify(srd52)}, found ${JSON.stringify(matches[0].srd52)}`);
	});

	{
		const file = "./data/items.json";
		if (!cache.has(file)) cache.set(file, ut.readJson(file));
		const tradeGoods = (cache.get(file).item || []).filter(ent => ent.source === "XDMG" && ent.type === "TG|XDMG");
		const names = new Set(tradeGoods.map(ent => ent.name));

		if (tradeGoods.length !== _XDMG_TRADE_GOOD_NAMES.size) errors.push(`${file} :: XDMG trade goods :: expected ${_XDMG_TRADE_GOOD_NAMES.size} entities, found ${tradeGoods.length}`);
		_XDMG_TRADE_GOOD_NAMES.forEach(name => {
			if (!names.has(name)) errors.push(`${file} :: XDMG trade goods :: missing ${name}`);
		});
		tradeGoods.forEach(ent => {
			if (!_XDMG_TRADE_GOOD_NAMES.has(ent.name)) errors.push(`${file} :: XDMG trade goods :: unexpected ${ent.name}`);
			if (ent.srd52) errors.push(`${file} :: item :: ${ent.name}|XDMG :: expected no srd52 membership, found ${JSON.stringify(ent.srd52)}`);
		});
	}

	{
		const file = "./data/decks.json";
		if (!cache.has(file)) cache.set(file, ut.readJson(file));
		const cards = (cache.get(file).card || []).filter(ent => ent.source === "XDMG" && ent.set === "Deck of Illusions");
		const names = new Set(cards.map(ent => ent.name));

		if (cards.length !== _DECK_OF_ILLUSIONS_SRD52.size) errors.push(`${file} :: Deck of Illusions|XDMG cards :: expected ${_DECK_OF_ILLUSIONS_SRD52.size} entities, found ${cards.length}`);
		_DECK_OF_ILLUSIONS_SRD52.forEach((srd52, name) => {
			if (!names.has(name)) errors.push(`${file} :: Deck of Illusions|XDMG cards :: missing ${name}`);
		});
		cards.forEach(ent => {
			if (!_DECK_OF_ILLUSIONS_SRD52.has(ent.name)) {
				errors.push(`${file} :: Deck of Illusions|XDMG cards :: unexpected ${ent.name}`);
				return;
			}
			const srd52Expected = _DECK_OF_ILLUSIONS_SRD52.get(ent.name);
			const srd52Actual = ent.srd52 || false;
			if (srd52Actual === srd52Expected) return;
			errors.push(`${file} :: card :: ${ent.name}|Deck of Illusions|XDMG :: expected srd52=${JSON.stringify(srd52Expected)}, found ${JSON.stringify(ent.srd52)}`);
		});
	}

	_NESTED_TABLE_TESTS.forEach(({file, caption}) => {
		if (!cache.has(file)) cache.set(file, ut.readJson(file));
		const matches = _getNestedTables(cache.get(file)).filter(ent => ent.caption === caption);

		if (matches.length !== 1) {
			errors.push(`${file} :: nested table :: ${caption} :: expected exactly one entity, found ${matches.length}`);
			return;
		}

		if (matches[0].srd52) return;
		errors.push(`${file} :: nested table :: ${caption} :: expected srd52=true, found false`);
	});

	_NESTED_VARIANTRULE_TESTS.forEach(({file, name}) => {
		if (!cache.has(file)) cache.set(file, ut.readJson(file));
		const matches = _getNestedVariantrules(cache.get(file)).filter(ent => ent.name === name);

		if (matches.length !== 1) {
			errors.push(`${file} :: nested variantrule :: ${name} :: expected exactly one entity, found ${matches.length}`);
			return;
		}

		if (matches[0].data.variantRuleInclude.srd52) return;
		errors.push(`${file} :: nested variantrule :: ${name} :: expected srd52=true, found false`);
	});

	_BOOK_STATBLOCK_TESTS.forEach(({file, tag, name, source}) => {
		if (!cache.has(file)) cache.set(file, ut.readJson(file));
		const matches = _getNestedStatblocks(cache.get(file)).filter(ent => ent.tag === tag && ent.name === name && ent.source === source);

		if (matches.length === 1) return;
		errors.push(`${file} :: nested statblock :: ${tag} :: ${name}|${source} :: expected exactly one entity, found ${matches.length}`);
	});

	if (!errors.length) {
		console.log(`##### SRD 5.2.1 membership test passed! #####`);
		return true;
	}

	console.error(`##### SRD 5.2.1 membership test failed! #####\n${errors.map(it => `\t${it}`).join("\n")}`);
	return false;
}

const pMain = main();

if (import.meta.main && !(await pMain)) process.exitCode = 1;

export default pMain;
