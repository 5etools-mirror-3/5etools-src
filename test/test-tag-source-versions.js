import * as Uf from "5etools-utils/lib/UtilFs.js";
import {readJsonSync, writeJsonSync} from "5etools-utils/lib/UtilFs.js";
import "../js/parser.js";
import "../js/utils.js";
import "../js/render.js";

const _DATE_MODERN = new Date("2024-09-16");

const _SOURCES_MODERN = new Set(
	Object.entries(Parser.SOURCE_JSON_TO_DATE)
		.filter(([, date]) => new Date(date) >= _DATE_MODERN)
		.map(([src]) => src),
);

const _WALKER = MiscUtil.getWalker();

const _TAGS_IGNORED = new Set(["@recipe"]);

const _TAG_TO_MODERN_SOURCE = {
	"@condition": Parser.SRC_XPHB,
	"@skill": Parser.SRC_XPHB,
	"@sense": Parser.SRC_XPHB,

	"@item": Parser.SRC_XDMG,
	"@hazard": Parser.SRC_XDMG,

	"@creature": Parser.SRC_XMM,
};

const walkerStringHandler = ({stack}, str) => {
	const recurse = (str) => {
		const tagSplit = Renderer.splitByTags(str);
		const len = tagSplit.length;

		let out = "";

		for (let i = 0; i < len; ++i) {
			const s = tagSplit[i];
			if (!s) continue;
			if (!s.startsWith("{@")) {
				out += s;
				continue;
			}

			const [tag, text] = Renderer.splitFirstSpace(s.slice(1, -1));

			if (_TAGS_IGNORED.has(tag)) {
				out += s;
				continue;
			}

			const tagInfo = Renderer.tag.TAG_LOOKUP[tag];
			if (!tagInfo.defaultSource) {
				out += `{${tag} ${recurse(text)}}`;
				continue;
			}

			const tagMeta = Renderer.utils.getTagMeta(tag, text);
			if (tagMeta.source == null) {
				out += s;
				continue;
			}

			const srcJson = Parser.sourceJsonToJson(tagMeta.source);
			if (_SOURCES_MODERN.has(srcJson)) {
				out += s;
				continue;
			}

			stack.push(`{${tag} ${text}}`);

			// FIXME(Future)
			if (_TAG_TO_MODERN_SOURCE[tag]) {
				const prop = Parser.getTagProps(tag.slice(1))[0];
				tagMeta.source = _TAG_TO_MODERN_SOURCE[tag];
				const uid = DataUtil.proxy.getUid(prop, tagMeta, {isMaintainCase: true, displayName: tagMeta.displayText});
				out += `{${tag} ${uid}}`;
				continue;
			}

			out += s;
		}

		return out;
	};

	return recurse(str);
};

class _TestTagSourcesEntities {
	static run () {
		console.log(`Checking entities...`);
		Uf.listJsonFiles("./data")
			.forEach(fpath => {
				if (
					fpath.includes("/adventure/")
					|| fpath.includes("/book/")
					|| fpath.includes("/generated/")
				) return;

				let cntChanges = 0;
				const json = readJsonSync(fpath);
				Object.entries(json)
					.forEach(([k, arr]) => {
						if (!arr || !(arr instanceof Array)) return;

						json[k] = arr
							.map(ent => {
								const src = SourceUtil.getEntitySource(ent);
								if (!src) return ent;

								const srcJson = Parser.sourceJsonToJson(src);
								if (!_SOURCES_MODERN.has(srcJson)) return ent;

								const stack = [];
								ent = _WALKER
									.walk(ent, {string: walkerStringHandler.bind(null, {stack})});
								if (!stack.length) return ent;
								cntChanges += stack.length;

								console.log(`Found tags with prior edition source in "${fpath}" for entity ${ent.name} (${srcJson})...\n${stack.map(it => `\t${it}`).join(`\n`)}`);

								return ent;
							});
					});
				if (!cntChanges) return;

				writeJsonSync(fpath, json, {isClean: true});
			});
	}
}

class _TestTagSourcesCorpus {
	static run () {
		console.log(`Checking corpora...`);
		[
			{
				fnameIndex: `adventures.json`,
				type: "adventure",
			},
			{
				fnameIndex: `books.json`,
				type: "book",
			},
		]
			.forEach(({fnameIndex, type}) => {
				const index = readJsonSync(`data/${fnameIndex}`);
				index[type]
					.filter(({source}) => _SOURCES_MODERN.has(source))
					.forEach(({id}) => {
						const fname = `${type}-${id.toLowerCase()}.json`;
						const fpath = `data/${type}/${fname}`;
						const json = readJsonSync(fpath);

						const stack = [];
						const jsonOut = _WALKER
							.walk(json, {string: walkerStringHandler.bind(null, {stack})});
						if (!stack.length) return;

						console.log(`Found tags with prior edition source in "${fname}"...\n${stack.map(it => `\t${it}`).join(`\n`)}`);

						writeJsonSync(fpath, jsonOut, {isClean: true});
					});
			});
	}
}

_TestTagSourcesEntities.run();
console.log(`\n===\n`);
_TestTagSourcesCorpus.run();
