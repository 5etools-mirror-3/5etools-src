import "../../js/parser.js";
import "../../js/utils.js";
import "../../js/render.js";

describe("Title-case strings", () => {
	it("Should handle lower-case strings", () => {
		expect("hello world".toTitleCase()).toBe("Hello World");
		expect("hello world!".toTitleCase()).toBe("Hello World!");
		expect("hello world! hello world!".toTitleCase()).toBe("Hello World! Hello World!");
	});

	it("Should handle always-caps words", () => {
		expect("d&d".toTitleCase()).toBe("D&D");
		expect("the game of d&d".toTitleCase()).toBe("The Game of D&D");
		expect("turn off your tvs".toTitleCase()).toBe("Turn Off Your TVs");
	});

	it("Should handle connecting lowercase words", () => {
		expect("roll the dice".toTitleCase()).toBe("Roll the Dice");
	});

	it("Should handle connecting lowercase words after punctuation", () => {
		expect("the rise: the fall".toTitleCase()).toBe("The Rise: The Fall");
	});

	it("Should handle compound words", () => {
		expect("compound-word".toTitleCase()).toBe("Compound-Word");
	});

	it("Should handle multiple lower-case words", () => {
		expect("start of the fight".toTitleCase()).toBe("Start of the Fight");
	});

	it("Should handle ending in a lower-case word", () => {
		expect("the place between".toTitleCase()).toBe("The Place Between");
	});

	it("Should handle quotes", () => {
		expect(`The "Fun" Awaits`.toTitleCase()).toBe(`The "Fun" Awaits`);
		expect(`The 'Fun' Awaits`.toTitleCase()).toBe(`The 'Fun' Awaits`);
	});

	it("Should handle modern book rules", () => {
		// XMM
		expect("bull-like guardians with petrifying breath".toTitleCase()).toBe("Bull-like Guardians with Petrifying Breath");
		expect("tyrants among corpses".toTitleCase()).toBe("Tyrants among Corpses");
		expect("beholder beyond death".toTitleCase()).toBe("Beholder beyond Death");
		expect("vengeance from beyond the grave".toTitleCase()).toBe("Vengeance from beyond the Grave");
	});

	it("Should handle @tags and =values", () => {
		expect("cast the {@spell fireball|PHB|fire ball} spell".toTitleCase()).toBe("Cast the {@spell Fireball|Phb|Fire Ball} Spell");
		expect("You have a {=bonusAc} bonus to AC while wearing this armor".toTitleCase()).toBe("You Have a {=bonusAc} Bonus to AC While Wearing This Armor");
	});
});
