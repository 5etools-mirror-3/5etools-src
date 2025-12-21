import {Bench} from "tinybench";
import "../../js/parser.js";
import "../../js/utils.js";
import "../../js/render.js";
import "../../js/render-dice.js";

const bench = new Bench({name: "ItemValueToFullMultiCurrency", time: 2000});

bench
	.add("itemValueToFullMultiCurrency Current", () => {
		Parser.itemValueToFullMultiCurrency({value: Math.round(Math.random() * 1000)}, {styleHint: "classic"});
	});

await bench.run();

console.log(bench.name);
console.table(bench.table());
