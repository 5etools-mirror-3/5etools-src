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
});
