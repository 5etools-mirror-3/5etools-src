import fs from "fs";
import "../js/utils.js";
import "../js/render.js";
import "../js/render-dice.js";
import * as ut from "./util.js";
import {TagJsons} from "../js/converter/converterutils-entries.js";
import {SITE_STYLE__ONE} from "../js/consts.js";

function run (args) {
	TagJsons._BLOCKLIST_FILE_PREFIXES = [
		...ut.FILE_PREFIX_BLOCKLIST,

		"foundry-",
		"foundry.json",

		// specific files
		"demo.json",
	];

	let files;
	if (args.file) {
		files = [args.file];
	} else {
		files = ut.listFiles({dir: args.dir || `./data`, blocklistFilePrefixes: TagJsons._BLOCKLIST_FILE_PREFIXES});
		if (args.filePrefix) {
			files = files.filter(f => f.startsWith(args.filePrefix));
			if (!files.length) throw new Error(`No file with prefix "${args.filePrefix}" found!`);
		}
	}

	const styleHint = args.styleHint || SITE_STYLE__ONE;

	const creatureList = getTaggableCreatureList(args.bestiaryFile);

	files.forEach(file => {
		console.log(`Tagging file "${file}"`);
		const json = ut.readJson(file);

		if (json instanceof Array) return;

		const keySet = null; // new Set(["classFeature", "subclassFeature"]); // TODO(Future)
		if (args.strict) TagJsons.mutTagObjectStrictCapsWords(json, {styleHint, keySet});
		else TagJsons.mutTagObject(json, {creaturesToTag: creatureList, styleHint});

		const outPath = args.inplace ? file : file.replace("./data/", "./trash/");
		if (!args.inplace) {
			const dirPart = outPath.split("/").slice(0, -1).join("/");
			fs.mkdirSync(dirPart, {recursive: true});
		}
		fs.writeFileSync(outPath, CleanUtil.getCleanJson(json));
	});
}

/**
 * Return creatures from the provided bestiary which are one of:
 * - A named creature
 * - A copy of a creature
 * - An NPC
 * as these creatures are likely to be missed by the automated tagging during conversion.
 */
function getTaggableCreatureList (filename) {
	if (!filename) return [];
	const bestiaryJson = ut.readJson(filename);
	return (bestiaryJson.monster || [])
		.filter(it => it.isNamedCreature || it.isNpc || it._copy)
		.map(it => ({name: it.name, source: it.source}));
}

function setUp () {
	ut.patchLoadJson();
}

function teardown () {
	ut.unpatchLoadJson();
}

function loadSpells () {
	const spellIndex = ut.readJson(`./data/spells/index.json`);

	return Object.entries(spellIndex).map(([source, filename]) => {
		if (SourceUtil.isNonstandardSource(source)) return [];

		return ut.readJson(`./data/spells/${filename}`).spell;
	}).flat();
}

export {
	setUp,
	loadSpells,
	run,
	teardown,
	getTaggableCreatureList,
};
