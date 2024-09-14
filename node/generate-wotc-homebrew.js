import fs from "fs";
import * as ut from "./util.js";
import "../js/utils.js";

const toDump = [
	{prop: "book", json: JSON.parse(fs.readFileSync("./data/books.json", "utf-8"))},
	{prop: "adventure", json: JSON.parse(fs.readFileSync("./data/adventures.json", "utf-8"))},
];

toDump.forEach(it => {
	const out = {};

	Object.assign(out, it.json);
	it.json[it.prop].forEach(meta => {
		const json = JSON.parse(fs.readFileSync(`./data/${it.prop}/${it.prop}-${meta.id.toLowerCase()}.json`, "utf-8"));
		// do the linking required by homebrew
		json.source = meta.source;
		json.id = meta.id;
		const dataProp = `${it.prop}Data`;
		(out[dataProp] = out[dataProp] || []).push(json);
	});

	const path = `./data/generated/gendata-wotc-${it.prop}.json`;
	fs.writeFileSync(path, CleanUtil.getCleanJson(out, {isMinify: true}), "utf-8");
	console.log(`Saved combined ${it.prop} file to "${path}".`);
});
