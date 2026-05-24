import "../js/parser.js";
import "../js/utils.js";
import * as utB from "./util-book-reference.js";
import {writeJsonSync} from "5etools-utils/lib/UtilFs.js";

const index = utB.UtilBookReference.getIndex(
	{
		name: "Quick Reference (5e/2014)",
		id: "bookref-quick",
		tag: "quickref",
	},
	{
		name: "DM Reference",
		id: "bookref-dmscreen",
		tag: "dmref",
	},
);

writeJsonSync("data/generated/bookref-dmscreen.json", index, {isClean: true, isMinify: true});

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

writeJsonSync("data/generated/bookref-dmscreen-index.json", flattenReferenceIndex(index.reference), {isClean: true, isMinify: true});
console.log("Updated DM Screen references.");
