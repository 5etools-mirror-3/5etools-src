import * as ut from "./util.js";
import "../js/parser.js";
import "../js/utils.js";
import "../js/render.js";
import {Command} from "commander";
import {writeJsonSync} from "5etools-utils/lib/UtilFs.js";
import {getCliFiles} from "./util-commander.js";

class AreaTagger {
	constructor (json) {
		this._json = json;

		this._maxTag = 0;
		this._existingTags = null;
	}

	_getNewTag () {
		let hexTag;
		do {
			if (this._maxTag >= 4095) throw new Error("Exhausted tags!");
			hexTag = this._maxTag.toString(16).padStart(3, "0");
			this._maxTag++;
		} while (this._existingTags.has(hexTag));
		this._existingTags.add(hexTag);
		return hexTag;
	}

	_doPopulateExistingTags () {
		const map = Renderer.adventureBook.getEntryIdLookup(this._json.data);
		this._existingTags = new Set(Object.keys(map));
	}

	_addNewTags () {
		const handlers = {
			object: (obj) => {
				Renderer.ENTRIES_WITH_CHILDREN
					.filter(meta => meta.key === "entries")
					.forEach(meta => {
						if (obj.type !== meta.type) return;
						if (!obj.id) obj.id = this._getNewTag();
					});

				if (obj.id) return obj;

				if (obj.type === "image" && (obj.mapRegions || obj.imageType === "map")) obj.id = this._getNewTag();

				if (obj.type === "list" && obj._isAddIds) {
					obj.items.forEach(itm => itm.id ||= this._getNewTag());
					delete obj._isAddIds;
				}

				return obj;
			},
		};

		this._json.data.forEach(chap => MiscUtil.getWalker().walk(chap, handlers));
	}

	run () {
		this._doPopulateExistingTags();
		this._addNewTags();
	}
}

const program = new Command()
	.option("--file <file...>", `Input files`)
	.option("--dir <dir...>", `Input directories`)
;

program.parse(process.argv);
const params = program.opts();

console.log(`Running area tagging pass...`);

getCliFiles(
	{
		dirs: params.dir,
		files: params.file,
		fnMutDefaultSelection: ({files}) => {
			[
				{
					index: ut.readJson("./data/adventures.json"),
					type: "adventure",
				},
				{
					index: ut.readJson("./data/books.json"),
					type: "book",
				},
			]
				.forEach(({index, type}) => {
					index[type]
						.forEach(meta => {
							files.push(`./data/${type}/${type}-${meta.id.toLowerCase()}.json`);
						});
				});
		},
	},
)
	.forEach(({path, json}) => {
		console.log(`\tTagging "${path}"...`);

		if (json.data) {
			new AreaTagger(json).run();
		} else {
			(json.adventureData || [])
				.forEach(corpus => new AreaTagger(corpus).run());
			(json.bookData || [])
				.forEach(corpus => new AreaTagger(corpus).run());
		}

		writeJsonSync(path, json, {isClean: true});

		console.log(`\tTagged "${path}".`);
	});

console.log(`Area tagging complete.`);
