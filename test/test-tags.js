import {Command} from "commander";
import "../js/parser.js";
import "../js/utils.js";
import "../js/utils-ui.js";
import "../js/render.js";
import "../js/render-dice.js";
import "../js/hist.js";
import "../js/utils-dataloader.js";
import "../js/utils-config.js";
import "../js/filter.js";
import "../js/utils-brew.js";
import "../js/omnidexer.js";
import * as ut from "../node/util.js";
import {DataTesterBase, DataTester, ObjectWalker, BraceCheck, EscapeCharacterCheck} from "5etools-utils";
import {readJsonSync} from "5etools-utils/lib/UtilFs.js";
import {TagTestUrlLookup} from "./test-tags/test-tags-entity-registry.js";
import {EntityFileHandlerLoot} from "./test-tags/entity-file/test-tags-entity-file-loot.js";
import {EntityFileHandlerItems} from "./test-tags/entity-file/test-tags-entity-file-items.js";
import {EntityFileHandlerAction} from "./test-tags/entity-file/test-tags-entity-file-action.js";
import {EntityFileHandlerBackground} from "./test-tags/entity-file/test-tags-entity-file-background.js";
import {EntityFileHandlerBestiary} from "./test-tags/entity-file/test-tags-entity-file-bestiary.js";
import {EntityFileHandlerClass} from "./test-tags/entity-file/test-tags-entity-file-class.js";
import {EntityFileHandlerConditionDisease} from "./test-tags/entity-file/test-tags-entity-file-condition-disease.js";
import {EntityFileHandlerCultsBoons} from "./test-tags/entity-file/test-tags-entity-file-cults-boons.js";
import {EntityFileHandlerDeck} from "./test-tags/entity-file/test-tags-entity-file-deck.js";
import {EntityFileHandlerDeity} from "./test-tags/entity-file/test-tags-entity-file-deity.js";
import {EntityFileHandlerFeat} from "./test-tags/entity-file/test-tags-entity-file-feat.js";
import {EntityFileHandlerFoundryClass} from "./test-tags/entity-file/test-tags-entity-file-foundry-class.js";
import {EntityFileHandlerFoundrySpells} from "./test-tags/entity-file/test-tags-entity-file-foundry-spells.js";
import {EntityFileHandlerOptionalfeature} from "./test-tags/entity-file/test-tags-entity-file-optionalfeature.js";
import {EntityFileHandlerRace} from "./test-tags/entity-file/test-tags-entity-file-race.js";
import {EntityFileHandlerRewards} from "./test-tags/entity-file/test-tags-entity-file-rewards.js";
import {EntityFileHandlerSenses} from "./test-tags/entity-file/test-tags-entity-file-senses.js";
import {EntityFileHandlerSkills} from "./test-tags/entity-file/test-tags-entity-file-skills.js";
import {EntityFileHandlerSpell} from "./test-tags/entity-file/test-tags-entity-file-spell.js";
import {EntityFileHandlerVariantrule} from "./test-tags/entity-file/test-tags-entity-file-variantrule.js";

const program = new Command()
	.option("--log-similar", `If, when logging a missing link, a list of potentially-similar links should additionally be logged.`)
	.option("--file-additional <filepath>", `An additional file (e.g. homebrew JSON) to load/check [WIP/unstable].`)
	.option("--skip-non-additional", `If checking non-additional files (i.e., the "data" directory) should be skipped [WIP/unstable].`)
;

program.parse(process.argv);
const params = program.opts();

const tagTestUrlLookup = new TagTestUrlLookup({
	fileAdditional: params.fileAdditional,
	isLogSimilar: params.logSimilar,
});

const WALKER = MiscUtil.getWalker({
	keyBlocklist: MiscUtil.GENERIC_WALKER_ENTRIES_KEY_BLOCKLIST,
	isNoModification: true,
});

class LinkCheck extends DataTesterBase {
	static _RE_TAG_BLOCKLIST = new Set(["quickref"]);
	static _RE = RegExp(`{@(${Renderer.tag.TAGS.filter(it => it.defaultSource).map(it => it.tagName).filter(tag => !LinkCheck._RE_TAG_BLOCKLIST.has(tag)).join("|")}) ([^}]*?)}`, "g");

	registerParsedPrimitiveHandlers (parsedJsonChecker) {
		parsedJsonChecker.addPrimitiveHandler("string", this._checkString.bind(this));
		parsedJsonChecker.addPrimitiveHandler("object", this._checkObject.bind(this));
	}

	_checkString (str, {filePath}) {
		let match;
		while ((match = this.constructor._RE.exec(str))) {
			const [original, tag, text] = match;
			this._checkTagText({original, tag, text, filePath});
		}
	}

	_checkTagText ({original, tag, text, filePath, isStatblock = false}) {
		const tagMeta = Renderer.utils.getTagMeta(`@${tag}`, text);

		// Prefer `hashHover`, as we expect it to point to the actual entity
		const encoded = tagMeta.hashHover || tagMeta.hash;

		const url = `${tagMeta.page || Renderer.tag.getPage(tag)}#${encoded}`.toLowerCase().trim();
		if (!tagTestUrlLookup.hasUrl(url)) {
			this._addMessage(`Missing link: ${isStatblock ? `(as "statblock" entry) ` : ""}${original} in file ${filePath} (evaluates to "${url}")\n${tagTestUrlLookup.getLogPtSimilarUrls({url})}`);
		}

		// Additional checks
		switch (tag) {
			case "class": this._checkTagText_class({original, tag, text, filePath, isStatblock, tagMeta}); break;
		}
	}

	_checkTagText_class ({original, tag, text, filePath, isStatblock, tagMeta}) {
		// e.g. "{@class fighter|phb|and class feature added|Eldritch Knight|phb|2-0}"
		if (!tagMeta.others?.length) return;

		let [subclassShortName, subclassSource, featurePart] = tagMeta.others;

		if (!subclassShortName) return;
		subclassSource ||= tagMeta.source;

		const featureIndex = tagTestUrlLookup.getSubclassFeatureIndex(tagMeta.name, tagMeta.source, subclassShortName, subclassSource);
		if (!featureIndex) {
			this._addMessage(`Missing subclass link: ${isStatblock ? `(as "statblock" entry) ` : ""}${original} in file ${filePath} -- could not find subclass with matching subclassShortName/source\n`);
		}

		if (featureIndex && featurePart && !featureIndex.includes(featurePart)) {
			this._addMessage(`Malformed subclass link: ${isStatblock ? `(as "statblock" entry) ` : ""}${original} in file ${filePath} -- feature index "${featurePart}" was outside expected range\n`);
		}
	}

	_checkObject (obj, {filePath}) {
		if (obj.type !== "statblock") return obj;

		const prop = obj.prop || Parser.getTagProps(obj.tag)[0];
		const tag = obj.tag || Parser.getPropTag(prop);

		if (!tag && prop?.endsWith("Fluff")) {
			const tagNonFluff = Parser.getPropTag(prop.replace(/Fluff$/, ""));
			const tagFaux = `${tagNonFluff}Fluff`;

			const sourceDefault = Renderer.tag.TAG_LOOKUP[tagNonFluff].defaultSource;
			const uid = DataUtil.proxy.getUid(prop, {...obj, source: obj.source || sourceDefault});

			this._checkTagText({original: JSON.stringify(obj), tag: tagFaux, text: uid, filePath, isStatblock: true});

			return obj;
		}

		const sourceDefault = Renderer.tag.TAG_LOOKUP[tag].defaultSource;
		const uid = DataUtil.proxy.getUid(prop, {...obj, source: obj.source || sourceDefault});
		this._checkTagText({original: JSON.stringify(obj), tag, text: uid, filePath, isStatblock: true});

		return obj;
	}
}

class FilterCheck extends DataTesterBase {
	registerParsedPrimitiveHandlers (parsedJsonChecker) {
		parsedJsonChecker.addPrimitiveHandler("string", this._checkString.bind(this));
	}

	_checkString (str, {filePath}) {
		str.replace(/{@filter ([^}]*)}/g, (m0, m1) => {
			const spl = m1.split("|");
			if (spl.length < 3) {
				this._addMessage(`Invalid filter tag in file ${filePath}: "${str}" was too short!\n`);
				return m0;
			}

			if (!UrlUtil.pageToDisplayPage(`${spl[1]}.html`)) {
				this._addMessage(`Invalid filter tag in file ${filePath}: unknown page in "${str}"\n`);
			}

			const missingEq = [];
			for (let i = 2; i < spl.length; ++i) {
				const part = spl[i];

				if (part === "preserve") continue;

				if (!part.includes("=")) {
					missingEq.push(part);
				}

				const hasOpenRange = part.startsWith("[");
				const hasCloseRange = part.startsWith("]");
				if (hasOpenRange || hasCloseRange) {
					if (!(hasOpenRange && hasCloseRange)) {
						this._addMessage(`Invalid filter tag in file ${filePath}: malformed range expression in  "${str}"\n`);
					}

					const [, values] = part.split("=");
					const valuesSpl = values.replace(/^\[/, "").replace(/]$/, "").split(";");
					if (valuesSpl.length > 2) {
						this._addMessage(`Invalid filter tag in file ${filePath}: too many values in range expression in "${str}" (expected 1-2)\n`);
					}
				}
			}
			if (missingEq.length) {
				this._addMessage(`Invalid filter tag in file ${filePath}: missing equals in "${str}" in part${missingEq.length > 1 ? "s" : ""} ${missingEq.join(", ")}\n`);
			}

			return m0;
		});
	}
}

class ScaleDiceCheck extends DataTesterBase {
	registerParsedPrimitiveHandlers (parsedJsonChecker) {
		parsedJsonChecker.addPrimitiveHandler("string", this._checkString.bind(this));
	}

	_checkString (str, {filePath}) {
		str.replace(/{@(scaledice|scaledamage) ([^}]*)}/g, (m0, m1, m2) => {
			const spl = m2.split("|");
			if (spl.length < 3) {
				this._addMessage(`${m1} tag "${str}" was too short!\n`);
			} else if (spl.length > 5) {
				this._addMessage(`${m1} tag "${str}" was too long!\n`);
			} else {
				let range;
				try {
					range = MiscUtil.parseNumberRange(spl[1], 1, 9);
				} catch (e) {
					this._addMessage(`Range "${spl[1]}" is invalid!\n`);
					return;
				}
				if (range.size < 2) this._addMessage(`Invalid scaling dice in file ${filePath}: range "${spl[1]}" has too few entries! Should be 2 or more.\n`);
				if (spl[3] && spl[3] !== "psi") this._addMessage(`Unknown mode "${spl[4]}".\n`);
			}
			return m0;
		});
	}
}

class StripTagTest extends DataTesterBase {
	_seenErrors = new Set();

	registerParsedPrimitiveHandlers (parsedJsonChecker) {
		parsedJsonChecker.addPrimitiveHandler("string", this._checkString.bind(this));
	}

	_checkString (str, {filePath}) {
		if (filePath === "./data/bestiary/template.json") return;

		try {
			Renderer.stripTags(str);
		} catch (e) {
			if (!this._seenErrors.has(e.message)) {
				this._seenErrors.add(e.message);
				this._addMessage(`Tag stripper error: ${e.message} (${filePath})\n`);
			}
		}
	}
}

class StandaloneTagTest extends DataTesterBase {
	registerParsedPrimitiveHandlers (parsedJsonChecker) {
		parsedJsonChecker.addPrimitiveHandler("string", this._checkString.bind(this));
	}

	_checkString (str, {filePath}) {
		const tagSplit = Renderer.splitByTags(str);
		const len = tagSplit.length;
		for (let i = 0; i < len; ++i) {
			const s = tagSplit[i];
			if (!s) continue;

			if (!s.startsWith("{@")) {
				continue;
			}

			const [tag, text] = Renderer.splitFirstSpace(s.slice(1, -1));

			const tagInfo = Renderer.tag.TAG_LOOKUP[tag];
			if (!tagInfo) continue;

			if (!tagInfo.isStandalone && !text) {
				this._addMessage(`Empty non-standalone tag "${tag}" in "${str}" (${filePath})\n`);
			}

			const stripped = tagInfo.getStripped(tag, text);

			this._checkString(stripped, {filePath});
		}
	}
}

class TableDiceTest extends DataTesterBase {
	static _INF_CAP = 999;

	registerParsedPrimitiveHandlers (parsedJsonChecker) {
		parsedJsonChecker.addPrimitiveHandler("object", this._checkTable.bind(this));
	}

	_checkTable (obj, {filePath}) {
		if (obj.type !== "table") return;

		const headerRowMetas = Renderer.table.getHeaderRowMetas(obj);
		const autoRollMode = Renderer.table.getAutoConvertedRollMode(obj, {headerRowMetas});
		if (!autoRollMode) return;

		const toRenderLabel = autoRollMode ? RollerUtil.getFullRollCol(headerRowMetas.last()[0]) : null;
		const isInfiniteResults = autoRollMode === RollerUtil.ROLL_COL_VARIABLE;

		const possibleResults = new Set();
		const errors = [];
		const cbErr = (cell, e) => this._addMessage(`Row parse failed! Cell was: "${JSON.stringify(cell)}"; error was: "${e.message}"\n`);

		const len = obj.rows.length;
		obj.rows.forEach((r, i) => {
			const row = Renderer.getRollableRow(r, {cbErr, isForceInfiniteResults: isInfiniteResults, isFirstRow: i === 0, isLastRow: i === len - 1});
			const cell = row[0].roll;
			if (!cell) return;
			if (cell.exact != null) {
				if (cell.exact === 0 && cell.pad) cell.exact = 100;
				if (possibleResults.has(cell.exact)) errors.push(`"exact" value "${cell.exact}" was repeated!`);
				possibleResults.add(cell.exact);
			} else {
				if (cell.max === 0) cell.max = 100;
				// convert inf to a reasonable range (no official table goes to 999+ or into negatives as of 2020-09-19)
				if (cell.min === -Renderer.dice.POS_INFINITE) cell.min = cell.displayMin; // Restore the original minimum
				if (cell.max === Renderer.dice.POS_INFINITE) cell.max = this.constructor._INF_CAP;
				for (let i = cell.min; i <= cell.max; ++i) {
					if (possibleResults.has(i)) {
						// if the table is e.g. 0-110, avoid double-counting the 0
						if (!(i === 100 && cell.max > 100)) errors.push(`"min-max" value "${i}" was repeated!`);
					}
					possibleResults.add(i);
				}
			}
		});

		const tmpParts = [];
		let cleanHeader = toRenderLabel
			.trim()
			.replace(/^{@dice ([^}]+)}/g, (...m) => {
				tmpParts.push(m[1].split("|")[0]);
				return `__TMP_DICE__${tmpParts.length - 1}__`;
			});
		cleanHeader = Renderer.stripTags(cleanHeader).replace(/__TMP_DICE__(\d+)__/g, (...m) => tmpParts[Number(m[1])]);
		const possibleRolls = new Set();
		let hasPrompt = false;

		cleanHeader.split(";").forEach(rollable => {
			if (rollable.includes("#$prompt_")) hasPrompt = true;

			const wrpRollTree = Renderer.dice.lang.getTree3(rollable);
			if (wrpRollTree) {
				const min = wrpRollTree.tree.min({});
				const max = wrpRollTree.tree.max({});
				for (let i = min; i < max + 1; ++i) possibleRolls.add(i);
			} else {
				if (!hasPrompt) errors.push(`${JSON.stringify(obj.colLabels[0])} was not a valid rollable header?!`);
			}
		});

		if (!CollectionUtil.setEq(possibleResults, possibleRolls) && !hasPrompt) {
			errors.push(`Possible results did not match possible rolls!\nPossible results: (${this._flattenSequence([...possibleResults])})\nPossible rolls: (${this._flattenSequence([...possibleRolls])})`);
		}

		if (errors.length) this._addMessage(`Errors in ${obj.caption ? `table "${obj.caption}"` : `${JSON.stringify(obj.rows[0]).substring(0, 30)}...`} in ${filePath}:\n${errors.map(it => `\t${it}`).join("\n")}\n`);
	}

	_flattenSequence (nums) {
		const out = [];
		let l = null; let r = null;
		nums.sort(SortUtil.ascSort).forEach(n => {
			if (l == null) {
				l = n;
				r = n;
			} else if (n === (r + 1)) {
				r = n;
			} else {
				if (l === r) out.push(`${l}`);
				else out.push(`${l}-${r}`);
				l = n;
				r = n;
			}
		});
		if (l === r) out.push(`${l}`);
		else out.push(`${l}-${r}`);
		return out.join(", ");
	}
}

class AreaCheck extends DataTesterBase {
	_headerMap = null;
	_errorSet = new Set();
	_fileMatcherValid = /\/(adventure-|book-).*\.json/;

	registerParsedFileCheckers (parsedJsonChecker) {
		parsedJsonChecker.registerFileHandler(this);
	}

	_buildMap (file, data) {
		this._headerMap = Renderer.adventureBook.getEntryIdLookup(data, false);
	}

	_checkStringAreaNotSupported (file, str) {
		str.replace(/{@area ([^}]*)}/g, (...m) => {
			this._addMessage(`Unexpected @area tag: ${m[0]} in file ${file}\n`);
			return m[0];
		});
	}

	_handleFile_areaNotSupported (file, contents) {
		ObjectWalker.walk({
			obj: contents,
			filePath: file,
			primitiveHandlers: {
				string: this._checkStringAreaNotSupported.bind(this, file),
			},
		});
	}

	_checkStringAreaSupported (str) {
		str.replace(/{@area ([^}]*)}/g, (m0, m1) => {
			const [, areaId] = m1.split("|");
			if (!this._headerMap[areaId]) {
				this._errorSet.add(m0);
			}
			return m0;
		});
	}

	_handleFile_areaSupported (file, contents) {
		this._errorSet = new Set();
		this._buildMap(file, contents.data);
		ObjectWalker.walk({
			obj: contents,
			filePath: file,
			primitiveHandlers: {
				string: this._checkStringAreaSupported.bind(this),
			},
		});

		if (this._errorSet.size || this._headerMap.__BAD?.length) this._addMessage(`Errors in ${file}! See below:\n`);

		if (this._errorSet.size) {
			const toPrint = [...this._errorSet].sort(SortUtil.ascSortLower);
			toPrint.forEach(tp => this._addMessage(`${tp}\n`));
		}

		if (this._headerMap.__BAD) {
			this._headerMap.__BAD.forEach(dupId => this._addMessage(`Duplicate ID: "${dupId}"\n`));
		}
	}

	handleFile (file, contents) {
		if (!this._fileMatcherValid.test(file)) return this._handleFile_areaNotSupported(file, contents);
		return this._handleFile_areaSupported(file, contents);
	}
}

class DuplicateEntityCheck extends DataTesterBase {
	registerParsedFileCheckers (parsedJsonChecker) {
		parsedJsonChecker.registerFileHandler(this);
	}

	handleFile (file, contents, {isSkipVersionCheck = false, isSkipBaseCheck = false} = {}) {
		DuplicateEntityCheck.errors = [];

		if (file.endsWith("data/races.json") && !isSkipVersionCheck) {
			// First, run check for races on the raw race/subrace data
			this.handleFile(file, contents, {isSkipVersionCheck: true});

			// Then, merge races+subraces, so we can run a check on versions
			contents = MiscUtil.copyFast(contents);
			contents = DataUtil.race.getPostProcessedSiteJson(contents);
			isSkipBaseCheck = true;
		}

		Object.entries(contents)
			.filter(([_, arr]) => arr instanceof Array)
			.forEach(([prop, arr]) => {
				const positions = {};
				arr.forEach((ent, i) => {
					if (ent == null) return;
					if (typeof ent !== "object" || ent instanceof Array) return;

					ent.__prop = prop;

					isSkipBaseCheck || this._doAddPosition({prop, ent, ixArray: i, positions});

					if (!ent._versions) return;

					isSkipVersionCheck || DataUtil.proxy.getVersions(prop, ent, {isExternalApplicationIdentityOnly: true})
						.forEach((entVer, j) => {
							this._doAddPosition({prop, ent: entVer, ixArray: i, ixVersion: j, positions});
						});
				});

				if (Object.keys(positions).length) {
					const withDuplicates = Object.entries(positions)
						.filter(([, v]) => v.length > 1);
					if (withDuplicates.length) {
						this._addMessage(`Duplicate entity keys in ${file} array .${prop}! See below:\n`);
						withDuplicates.forEach(([k, v]) => {
							this._addMessage(`\t${k} (at indexes ${v.join(", ")})\n`);
						});
					}
				}
			});
	}

	_doAddPosition ({prop, ent, ixArray, ixVersion, positions}) {
		const keyIx = [ixArray, ixVersion].filter(it => it != null).join("-v");

		const name = ent.name;
		const source = SourceUtil.getEntitySource(ent);

		// TODO(Future) simplify/use hash
		switch (prop) {
			case "deity": {
				if (name != null && source != null) {
					const key = `${source} :: ${ent.pantheon} :: ${name}`;
					(positions[key] = positions[key] || []).push(keyIx);
				}
				break;
			}
			case "card": {
				if (name != null && source != null) {
					const key = `${source} :: ${ent.set} :: ${name}`;
					(positions[key] = positions[key] || []).push(keyIx);
				}
				break;
			}
			case "subclass": {
				if (name != null && source != null) {
					const key = `${source} :: ${ent.classSource} :: ${ent.className} :: ${name}`;
					(positions[key] = positions[key] || []).push(keyIx);
				}
				break;
			}
			case "classFeature": {
				if (name != null && source != null) {
					const key = `${source} :: ${ent.level} :: ${ent.classSource} :: ${ent.className} :: ${name}`;
					(positions[key] = positions[key] || []).push(keyIx);
				}
				break;
			}
			case "subclassFeature": {
				if (name != null && source != null) {
					const key = `${source} :: ${ent.level} :: ${ent.classSource} :: ${ent.className} :: ${ent.subclassSource} :: ${ent.subclassShortName} :: ${name}`;
					(positions[key] = positions[key] || []).push(keyIx);
				}
				break;
			}
			case "raceFeature": {
				if (name != null && source != null) {
					const key = `${source} :: ${ent.raceSource} :: ${ent.raceName} :: ${name}`;
					(positions[key] = positions[key] || []).push(keyIx);
				}
				break;
			}
			case "subrace": {
				if (name != null && source != null) {
					const key = `${source} :: ${ent.raceSource} :: ${ent.raceName} :: ${name}`;
					(positions[key] = positions[key] || []).push(keyIx);
				}
				break;
			}
			default: {
				if (name != null && source != null) {
					const key = `${source} :: ${name}`;
					(positions[key] = positions[key] || []).push(keyIx);
				}
				break;
			}
		}
	}
}

class RefTagCheck extends DataTesterBase {
	static _RE_TAG = /^ref[A-Z]/;
	static _TO_CHECK = [];

	registerParsedFileCheckers (parsedJsonChecker) {
		parsedJsonChecker.registerFileHandler(this);
	}

	handleFile (file, contents) {
		Object.entries(contents)
			.filter(([_, arr]) => arr instanceof Array)
			.forEach(([, arr]) => {
				arr.forEach(ent => {
					if (!ent.hasRefs) return;
					WALKER.walk(
						ent,
						{
							object: (obj) => {
								if (!obj.type || !RefTagCheck._RE_TAG.test(obj.type)) return;
								const prop = obj.type.slice(3).lowercaseFirst();
								RefTagCheck._TO_CHECK.push(`{#${prop} ${obj[prop]}}`);
							},
							string: (str) => {
								if (!str.startsWith("{#") || !str.endsWith("}")) return;
								RefTagCheck._TO_CHECK.push(str);
							},
						},
					);
				});
			});
	}

	async pPostRun () {
		if (!RefTagCheck._TO_CHECK.length) return;

		for (const toCheck of RefTagCheck._TO_CHECK) {
			const toCheckMeta = Renderer.hover.getRefMetaFromTag(toCheck);

			const prop = toCheckMeta.type.slice(3).lowercaseFirst();

			const refUnpacked = DataUtil.generic.unpackUid(toCheckMeta[prop], prop);
			const refHash = UrlUtil.URL_TO_HASH_BUILDER[prop](refUnpacked);

			const cpy = await DataLoader.pCacheAndGetHash(prop, refHash, {isCopy: true});
			if (!cpy) {
				this._addMessage(`Missing ref tag: ${toCheck}\n`);
			}
		}
	}
}

class TestCopyCheck extends DataTesterBase {
	registerParsedFileCheckers (parsedJsonChecker) {
		parsedJsonChecker.registerFileHandler(this);
	}

	handleFile (file, contents) {
		if (!contents._meta) return;

		const fileErrors = [];

		Object.entries(contents)
			.forEach(([prop, arr]) => {
				if (!(arr instanceof Array)) return;

				const propNoFluff = prop.replace(/Fluff$/, "");
				const hashBuilder = UrlUtil.URL_TO_HASH_BUILDER[prop] || UrlUtil.URL_TO_HASH_BUILDER[propNoFluff];
				if (!hashBuilder) return;

				arr.forEach(ent => {
					if (!ent._copy) return;

					const hash = hashBuilder(ent);
					const hashCopy = hashBuilder(ent._copy);

					if (hash !== hashCopy) return;

					fileErrors.push({prop, hash, ent});
				});
			});

		if (!fileErrors.length) return;

		this._addMessage(`Self-referencing _copy hashes in ${file}! See below:\n`);
		fileErrors.forEach(({prop, hash, ent}) => {
			this._addMessage(`\t${prop} "${ent.name}" with hash "${hash}"\n`);
		});
	}
}

class HasFluffCheck extends DataTesterBase {
	static _LEN_PAD_HASH = 70;

	async pRun () {
		const withLoaders = Object.entries(DataUtil)
			.filter(([, impl]) => Object.getPrototypeOf(impl).name !== "_DataUtilPropConfig" && impl.loadJSON);

		const metas = {};

		for (const [prop, impl] of withLoaders) {
			const isFluff = prop.endsWith("Fluff");
			const propBase = isFluff ? prop.replace(/Fluff$/, "") : prop;

			const allData = await impl.loadJSON({isAddBaseRaces: true});

			const tgt = (metas[propBase] = metas[propBase] || {});
			tgt.prop = propBase;
			tgt.page = impl.PAGE;

			if (isFluff) {
				tgt.propFluff = prop;
				tgt.dataFluff = allData;
				tgt.dataFluffUnmerged = await impl.loadUnmergedJSON();
			} else {
				tgt.data = allData;
			}
		}

		const [metasWithFluff] = Object.values(metas)
			.segregate(it => it.propFluff);

		for (const {prop, propFluff, dataFluff, dataFluffUnmerged, data, page} of metasWithFluff) {
			const fluffLookup = (dataFluff[propFluff] || [])
				.mergeMap(flf => ({
					[UrlUtil.URL_TO_HASH_BUILDER[page](flf)]: {
						hasFluff: !!flf.entries,
						hasFluffImages: !!flf.images,
					},
				}));
			const fluffLookupUsed = {};

			// Tag parent fluff, so we can ignore e.g. "unused" fluff which is only used by `_copy`s
			(dataFluffUnmerged[propFluff] || []).forEach(flfUm => {
				if (!flfUm._copy) return;
				const hashParent = UrlUtil.URL_TO_HASH_BUILDER[page](flfUm._copy);
				// Track fluff vs. images, as e.g. the child overwriting the images means we don't use the parent images
				fluffLookup[hashParent].isCopiedFluff = !flfUm.entries;
				fluffLookup[hashParent].isCopiedFluffImages = !flfUm.images;
			});

			data[prop].forEach(ent => {
				if (!ent.hasFluff && !ent.hasFluffImages) return;

				const hash = UrlUtil.URL_TO_HASH_BUILDER[page](ent);
				// Replacement hashes, to be used instead of the main hash
				const hashesAlt = this._getHashesAlt({page, ent});
				const hashUsed = [hash, ...hashesAlt].find(h => fluffLookup[h] || fluffLookupUsed[h]) || hash;

				// This fluff has already been completely marked as "used"
				if (fluffLookupUsed[hashUsed]) return;

				const fromLookup = fluffLookup[hashUsed];
				if (!fromLookup) {
					this._addMessage(`${prop} hash ${`"${hash}"`.padEnd(this.constructor._LEN_PAD_HASH, " ")} not found in corresponding "${propFluff}" fluff!\n`);
					return;
				}

				const ptsMessage = [];

				if (!!ent.hasFluff !== fromLookup.hasFluff) {
					ptsMessage.push(`hasFluff mismatch (entity ${ent.hasFluff} | fluff ${fromLookup.hasFluff})`);
				} else if (ent.hasFluff) {
					delete fluffLookup[hashUsed]?.hasFluff;
				}

				if (!!ent.hasFluffImages !== fromLookup.hasFluffImages) {
					ptsMessage.push(`hasFluffImages mismatch (entity ${ent.hasFluffImages} | fluff ${fromLookup.hasFluffImages})`);
				} else if (ent.hasFluffImages) {
					delete fluffLookup[hashUsed]?.hasFluffImages;
				}

				if (!fluffLookup[hashUsed].hasFluff && !fluffLookup[hashUsed].hasFluffImages) {
					delete fluffLookup[hashUsed];
					fluffLookupUsed[hashUsed] = true;
				}

				if (!ptsMessage.length) return;

				this._addMessage(`${prop} hash ${`"${hashUsed}"`.padEnd(this.constructor._LEN_PAD_HASH, " ")} fluff did not match fluff file: ${ptsMessage.join("; ")}\n`);
			});

			const unusedFluff = Object.entries(fluffLookup)
				.filter(([, meta]) => !meta.isCopiedFluff && !meta.isCopiedFluffImages);

			if (unusedFluff.length) {
				const errors = unusedFluff
					.map(([hash, {hasFluff, hasFluffImages}]) => `${`"${hash}"`.padEnd(this.constructor._LEN_PAD_HASH, " ")} ${[hasFluff ? "hasFluff" : null, hasFluffImages ? "hasFluffImages" : null].filter(Boolean).join(" | ")}`);
				this._addMessage(`Extra ${propFluff} fluff found!\n${errors.map(it => `\t${it}`).join("\n")}\n`);
			}
		}
	}

	_getHashesAlt ({page, ent}) {
		if (ent.__prop === "item" && ent._variantName) return [UrlUtil.URL_TO_HASH_BUILDER[page]({name: ent._variantName, source: ent.source})];
		return [];
	}
}

class AdventureBookTagCheck extends DataTesterBase {
	_ADV_BOOK_LOOKUP = {};

	constructor ({fileAdditional}) {
		super();
		this._fileAdditional = fileAdditional;
	}

	registerParsedPrimitiveHandlers (parsedJsonChecker) {
		const jsonAdditional = this._fileAdditional ? readJsonSync(this._fileAdditional) : null;

		[
			{
				path: "./data/adventures.json",
				prop: "adventure",
				tag: "adventure",
			},
			{
				path: "./data/books.json",
				prop: "book",
				tag: "book",
			},
		].forEach(({path, prop, tag}) => {
			const json = ut.readJson(path);
			this._ADV_BOOK_LOOKUP[tag] = json[prop].mergeMap(({id}) => ({[id.toLowerCase()]: true}));

			if (!jsonAdditional?.[prop]) return;

			jsonAdditional[prop]
				.forEach(({id}) => this._ADV_BOOK_LOOKUP[tag][id.toLowerCase()] = true);
		});

		parsedJsonChecker.addPrimitiveHandler("string", this._checkString.bind(this));
	}

	static _ALLOWED_SUB_TAGS = new Set([
		"@i",
		"@b",
	]);

	_checkString (str, {filePath}) {
		const tagSplit = Renderer.splitByTags(str);

		const len = tagSplit.length;
		for (let i = 0; i < len; ++i) {
			const s = tagSplit[i];

			if (!s) continue;
			if (s.startsWith("{@")) {
				const [tag, text] = Renderer.splitFirstSpace(s.slice(1, -1));
				if (!["@adventure", "@book"].includes(tag)) continue;

				const [displayText, id, chap] = text.toLowerCase().split("|");
				if (!id) throw new Error(`${tag} tag had ${s} no source!`); // Should never occur

				if (!this._ADV_BOOK_LOOKUP[tag.slice(1)][id]) this._addMessage(`Missing link: ${s} in file ${filePath} had unknown "${tag}" ID "${id}"\n`);

				if (chap && Number(chap) < 0) this._addMessage(`Missing link: ${s} in file ${filePath} had unknown "${tag}" chapter "${chap}"\n`);

				if (!displayText.includes("{@")) return;

				const tagSplitSub = Renderer.splitByTags(displayText);
				for (let j = 0; j < len; ++j) {
					const sSub = tagSplitSub[j];

					if (!sSub) continue;
					if (!sSub.startsWith("{@")) continue;

					const [tagSub] = Renderer.splitFirstSpace(sSub.slice(1, -1));
					if (this.constructor._ALLOWED_SUB_TAGS.has(tagSub)) continue;

					this._addMessage(`Link contained sub-tag "${tagSub}": ${s}\n`);
				}
			}
		}
	}
}

async function main () {
	const TIME_TAG = "\tRun duration";
	console.time(TIME_TAG);

	ut.patchLoadJson();

	await tagTestUrlLookup.pInit();

	const sharedParamsEntityTypeTester = {tagTestUrlLookup};

	const dataTesters = [
		new LinkCheck(),
		new BraceCheck(),
		new FilterCheck(),
		new ScaleDiceCheck(),
		new StripTagTest(),
		new StandaloneTagTest(),
		new TableDiceTest(),
		new AdventureBookTagCheck({fileAdditional: params.fileAdditional}),
		new AreaCheck(),
		new EscapeCharacterCheck(),
		new DuplicateEntityCheck(),
		new RefTagCheck(),
		new TestCopyCheck(),
		new HasFluffCheck(),

		new EntityFileHandlerAction(sharedParamsEntityTypeTester),
		new EntityFileHandlerBackground(sharedParamsEntityTypeTester),
		new EntityFileHandlerBestiary(sharedParamsEntityTypeTester),
		new EntityFileHandlerClass(sharedParamsEntityTypeTester),
		new EntityFileHandlerConditionDisease(sharedParamsEntityTypeTester),
		new EntityFileHandlerCultsBoons(sharedParamsEntityTypeTester),
		new EntityFileHandlerDeck(sharedParamsEntityTypeTester),
		new EntityFileHandlerDeity(sharedParamsEntityTypeTester),
		new EntityFileHandlerFeat(sharedParamsEntityTypeTester),
		new EntityFileHandlerItems(sharedParamsEntityTypeTester),
		new EntityFileHandlerLoot(sharedParamsEntityTypeTester),
		new EntityFileHandlerOptionalfeature(sharedParamsEntityTypeTester),
		new EntityFileHandlerRace(sharedParamsEntityTypeTester),
		new EntityFileHandlerRewards(sharedParamsEntityTypeTester),
		new EntityFileHandlerSenses(sharedParamsEntityTypeTester),
		new EntityFileHandlerSkills(sharedParamsEntityTypeTester),
		new EntityFileHandlerSpell(sharedParamsEntityTypeTester),
		new EntityFileHandlerVariantrule(sharedParamsEntityTypeTester),

		new EntityFileHandlerFoundryClass(sharedParamsEntityTypeTester),
		new EntityFileHandlerFoundrySpells(sharedParamsEntityTypeTester),
	];
	DataTester.register({dataTesters});

	if (!params.skipNonAdditional) {
		await DataTester.pRun(
			"./data",
			dataTesters,
			{
				fnIsIgnoredFile: filePath => filePath.endsWith("changelog.json")
					|| filePath.includes("/generated/")
					|| filePath.endsWith("converter.json"),
			},
		);
	}

	if (params.fileAdditional) {
		await DataTester.pRun(params.fileAdditional, dataTesters);
	}

	ut.unpatchLoadJson();

	const outMessage = DataTester.getLogReport(dataTesters);

	console.timeEnd(TIME_TAG);

	return !outMessage;
}

export default main();
