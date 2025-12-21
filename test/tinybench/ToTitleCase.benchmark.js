import {Bench} from "tinybench";
import {readJsonSync} from "5etools-utils/lib/UtilFs.js";
import "../../js/parser.js";
import "../../js/utils.js";
import "../../js/render.js";
import "../../js/render-dice.js";

const bench = new Bench({name: "ToTitleCase", time: 2000});

const json = readJsonSync("data/book/book-phb.json");
const strings = [];
MiscUtil.getWalker({keyBlocklist: MiscUtil.GENERIC_WALKER_ENTRIES_KEY_BLOCKLIST, isNoModification: true}).walk(json, {
	string: str => {
		strings.push(str);
		return str;
	},
});

const reCurrent = StrUtil._TITLE_RE_INITIAL;
const reOld = /(\w+[^-\u2014\s/]*) */g;

bench
	.add("toTitleCase Current", () => {
		StrUtil._TITLE_RE_INITIAL = reCurrent;
		strings[Math.round(Math.random() * (strings.length - 1))].toTitleCase();
	})
	.add("toTitleCase Old", () => {
		StrUtil._TITLE_RE_INITIAL = reOld;
		strings[Math.round(Math.random() * (strings.length - 1))].toTitleCase();
	});

await bench.run();

console.log(bench.name);
console.table(bench.table());
