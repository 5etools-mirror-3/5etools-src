import "../../../js/parser.js";
import "../../../js/utils.js";
import "../../../js/render.js";
import "../../../js/utils-config.js";
import {List2SyntaxParser} from "../../../js/list2/list2-syntaxparser.js";

const _RE_COMMAND = /^(?<command>name|stats|info|text)/;

describe("List Syntax Parsing", () => {
	it("Should handle basic search", () => {
		expect(
			List2SyntaxParser.getParsedSyntaxInfo({
				searchTerm: " hello world ",
				reCommand: _RE_COMMAND,
			}),
		)
			.toEqual({
				syntaxMetasRaw: [],
				searchTerm: "hello world",
			});
	});

	it("Should treat invalid syntax as basic search", () => {
		expect(
			List2SyntaxParser.getParsedSyntaxInfo({
				searchTerm: "hello:world",
				reCommand: _RE_COMMAND,
			}),
		)
			.toEqual({
				syntaxMetasRaw: [],
				searchTerm: "hello:world",
			});
	});

	it("Should handle single syntax", () => {
		expect(
			List2SyntaxParser.getParsedSyntaxInfo({
				searchTerm: "name:hello",
				reCommand: _RE_COMMAND,
			}),
		)
			.toEqual({
				syntaxMetasRaw: [
					{command: "name", term: "hello", isDelimited: false},
				],
				searchTerm: "",
			});
	});

	it("Should handle single syntax without a delimiter", () => {
		expect(
			List2SyntaxParser.getParsedSyntaxInfo({
				searchTerm: "name:hello world",
				reCommand: _RE_COMMAND,
			}),
		)
			.toEqual({
				syntaxMetasRaw: [
					{command: "name", term: `"hello world"`, isDelimited: true},
				],
				searchTerm: "",
			});
	});

	it("Should handle space-prefixed single syntax without a delimiter", () => {
		expect(
			List2SyntaxParser.getParsedSyntaxInfo({
				searchTerm: "name: hello world",
				reCommand: _RE_COMMAND,
			}),
		)
			.toEqual({
				syntaxMetasRaw: [
					{command: "name", term: `"hello world"`, isDelimited: true},
				],
				searchTerm: "",
			});
	});

	it("Should handle multiple syntax", () => {
		expect(
			List2SyntaxParser.getParsedSyntaxInfo({
				searchTerm: "name:hello name:world",
				reCommand: _RE_COMMAND,
			}),
		)
			.toEqual({
				syntaxMetasRaw: [
					{command: "name", term: "hello", isDelimited: false},
					{command: "name", term: "world", isDelimited: false},
				],
				searchTerm: "",
			});
	});

	it("Should handle delimited syntax", () => {
		expect(
			List2SyntaxParser.getParsedSyntaxInfo({
				searchTerm: `name:"hello world"`,
				reCommand: _RE_COMMAND,
			}),
		)
			.toEqual({
				syntaxMetasRaw: [
					{command: "name", term: `"hello world"`, isDelimited: true},
				],
				searchTerm: "",
			});
	});

	it("Everything at the same time", () => {
		expect(
			List2SyntaxParser.getParsedSyntaxInfo({
				searchTerm: `name:"hello world" alpha name:"goodbye world" stats:bravo charlie`,
				reCommand: _RE_COMMAND,
			}),
		)
			.toEqual({
				syntaxMetasRaw: [
					{command: "name", term: `"hello world"`, isDelimited: true},
					{command: "name", term: `"goodbye world"`, isDelimited: true},
					{command: "stats", term: `bravo`, isDelimited: false},
				],
				searchTerm: "alpha charlie",
			});
	});
});
