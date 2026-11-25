import * as ut from "./util.js";
import "../js/parser.js";
import "../js/utils.js";
import "../js/render.js";
import {Command} from "commander";
import {writeJsonSync} from "5etools-utils/lib/UtilFs.js";
import {getCliJsonFiles, mutCommanderJsonFileOptions} from "./util-commander.js";
import {AreaTagger} from "./tag-adventure-book-areas-lib.js";

const program = mutCommanderJsonFileOptions({command: new Command()});

program.parse(process.argv);
const params = program.opts();

console.log(`Running area tagging pass...`);

getCliJsonFiles(
	{
		dirs: params.dir,
		files: params.file,
		convertedBy: params.convertedBy,
		author: params.author,
		filter: params.filter,
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
	.forEach(jsonFile => {
		const path = jsonFile.getFilePath();
		const json = jsonFile.getContents();

		console.log(`\tTagging "${path}"...`);

		["adventureData", "bookData"]
			.forEach(prop => {
				const data = json[prop];
				if (!data?.length) return;
				data.forEach(corpus => new AreaTagger(corpus).run());
			});

		writeJsonSync(path, json, {isClean: true});

		console.log(`\tTagged "${path}".`);
	});

console.log(`Area tagging complete.`);
