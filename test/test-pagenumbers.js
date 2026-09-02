import * as ut from "../node/util.js";
import * as rl from "readline-sync";
import fs from "fs";
import {readJsonSync} from "5etools-utils/lib/UtilFs.js";
import "../js/parser.js";
import "../js/utils.js";
import {BLOCKLIST_SOURCES_PAGES} from "./util-test.js";

const _BLOCKLIST_FILE_PREFIXES = [
	...ut.BLOCKLIST_FILE_PREFIXES,
	"fluff-",

	"foundry-",
	"foundry.json",

	// specific files
	"makebrew-creature.json",
	"makecards.json",
	"characters.json",
	"converter.json",
];

const _BLOCKLIST_KEYS = new Set([
	"_meta",
	"_test",
	"data",
	"itemProperty",
	"itemEntry",
	"lifeClass",
	"lifeBackground",
	"lifeTrinket",
	"cr",
	"monsterfeatures",
	"adventure",
	"book",
	"itemTypeAdditionalEntries",
	"legendaryGroup",
	"languageScript",
	"dragonMundaneItems",
]);

// But: Who Test The Tester?
// Not me!
const _BLOCKLIST_ENTITIES = readJsonSync("./test/test-pagenumbers/blocklist-entities.json");

const isBlocklistedEntity = ({prop, ent}) => {
	const source = SourceUtil.getEntitySource(ent);

	if (source === VeCt.STR_GENERIC) return true;
	if (BLOCKLIST_SOURCES_PAGES.has(source)) return true;

	const lookup = MiscUtil.get(_BLOCKLIST_ENTITIES, prop, source);
	return !!(lookup?.["*"] || lookup?.[ent.name]);
};

const _isMissingPage = ({ent}) => {
	if (ent.inherits ? ent.inherits.page : ent.page) return false;
	if (ent._copy?._preserve?.page) return false;
	return true;
};

const _doSaveMods = ({mods, json, file}) => {
	if (!mods) return;

	let answer = "";
	while (!["y", "n", "quit"].includes(answer)) {
		answer = rl.question(`Save file with ${mods} modification${mods === 1 ? "" : "s"}? [y/n/quit]`);
		if (answer === "y") {
			console.log(`Saving ${file}...`);
			fs.writeFileSync(file, CleanUtil.getCleanJson(json), "utf-8");
		} else if (answer === "quit") {
			process.exit(1);
		}
	}
};

const main = ({isModificationMode = false} = {}) => {
	console.log(`##### Checking for Missing Page Numbers #####`);

	const FILE_MAP = {};
	ut.listFiles({dir: `./data`, blocklistFilePrefixes: _BLOCKLIST_FILE_PREFIXES})
		.forEach(file => {
			let mods = 0;

			const json = ut.readJson(file);
			Object.keys(json)
				.filter(k => !_BLOCKLIST_KEYS.has(k))
				.forEach(prop => {
					const data = json[prop];
					if (!(data instanceof Array)) return;

					const entsNoPage = data
						.filter(ent => !isBlocklistedEntity({prop, ent}) && _isMissingPage({ent}));

					if (entsNoPage.length && isModificationMode) {
						console.log(`${file}:`);
						console.log(`\t${entsNoPage.length} missing page number${entsNoPage.length === 1 ? "" : "s"}`);
					}

					entsNoPage
						.forEach(it => {
							const ident = `${prop.padEnd(20, " ")} ${SourceUtil.getEntitySource(it).padEnd(32, " ")} ${it.name}`;

							if (!isModificationMode) {
								const list = (FILE_MAP[file] = FILE_MAP[file] || []);
								list.push(ident);
								return;
							}

							console.log(`  ${ident}`);
							const page = rl.questionInt("  - Page = ");
							if (page) {
								it.page = page;
								mods++;
							}
						});
				});

			_doSaveMods({mods, json, file});
		});

	const filesWithMissingPages = Object.keys(FILE_MAP);
	if (!filesWithMissingPages.length) {
		console.log(`Page numbers are as expected.`);
		return true;
	}

	console.warn(`##### Files with Missing Page Numbers #####`);
	filesWithMissingPages.forEach(f => {
		console.warn(`${f}:`);
		FILE_MAP[f].forEach(it => console.warn(`\t${it}`));
	});

	return false;
};

const pMain = main();

if (import.meta.main && !(await pMain)) process.exitCode = 1;

export default pMain;
