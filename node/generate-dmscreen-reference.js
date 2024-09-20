import fs from "fs";
import "../js/parser.js";
import "../js/utils.js";
import * as utB from "./util-book-reference.js";

const index = utB.UtilBookReference.getIndex(
	{
		name: "Quick Reference (2014)",
		id: "bookref-quick",
		tag: "quickref",
	},
	{
		name: "DM Reference",
		id: "bookref-dmscreen",
		tag: "dmref",
	},
);

fs.writeFileSync("data/generated/bookref-dmscreen.json", CleanUtil.getCleanJson(index, {isMinify: true}), "utf8");

function flattenReferenceIndex (ref, skipHeaders) {
	const outMeta = {
		name: {},
		id: {},
		section: {},
	};

	const meta = {
		name: {},
		id: {},
		section: {},
	};

	const out = [];

	let nameId = 1;
	let idId = 1;
	let sectionId = 1;

	let indexId = 1;

	Object.values(ref).forEach(book => {
		if (!meta.name[book.name]) {
			outMeta.name[nameId] = book.name;
			meta.name[book.name] = nameId++;
		}

		if (!meta.id[book.id]) {
			outMeta.id[idId] = book.id;
			meta.id[book.id] = idId++;
		}

		book.contents.forEach((c, i) => {
			if (!meta.section[c.name]) {
				outMeta.section[sectionId] = c.name;
				meta.section[c.name] = sectionId++;
			}

			if (skipHeaders) return;
			(c.headers || []).forEach(h => {
				out.push({
					id: indexId++,
					b: meta.id[book.id], // book
					s: meta.section[c.name], // section name
					p: i, // section index
					h, // header name
				});
			});
		});
	});

	return {
		_meta: outMeta,
		data: out,
	};
}

fs.writeFileSync("data/generated/bookref-dmscreen-index.json", JSON.stringify(flattenReferenceIndex(index.reference)), "utf8");
console.log("Updated DM Screen references.");
