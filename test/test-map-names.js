import "../js/parser.js";
import "../js/utils.js";
import "../js/render.js";
import * as ut from "../node/util.js";
import {CorpusMapImageExtractor} from "../js/foundry/foundry-maps.js";
import {Command} from "commander";
import {getCliJsonFiles, mutCommanderJsonFileOptions, pInitConsoleOut} from "../node/util-commander.js";
import {getCleanPath} from "../node/util-json-files.js";

const getJoinedWarnings = ({jsonFile, warnings}) => {
	return `in "${jsonFile.getFilePath()}"\n${warnings.map(warning => `\t${warning}`).join("\n")}`;
};

let ixLogGroup = 0;
const logGroup = ({name, lines}) => {
	if (!lines.length) return;
	if (ixLogGroup++) console.log(`\n${"-".repeat(20)}`);

	console.log(`\n=== ${name} ===\n`);
	lines.forEach(wrn => console.warn(wrn));
};

const program = mutCommanderJsonFileOptions({command: new Command()});

program.parse(process.argv);
const params = program.opts();

const getFauxJsonVehicleFluff = ({jsonFile}) => {
	return (jsonFile.getContents().vehicleFluff || [])
		.filter(fluff => fluff?.images?.some(img => ["map", "mapPlayer"].includes(img?.imageType)))
		.map(fluff => {
			const id = DataUtil.proxy.getUid("vehicleFluff", fluff);
			return {
				book: {
					name: Parser.sourceJsonToFull(fluff.source),
					id,
					source: fluff.source,
					contents: [{name: "Vehicles"}],
				},
				bookData: {
					id,
					source: fluff.source,
					data: [{
						type: "section",
						name: "Vehicles",
						entries: [...fluff.images],
					}],
				},
			};
		})
		.reduce(
			(accum, {book, bookData}) => {
				(accum.book ||= []).push(book);
				(accum.bookData ||= []).push(bookData);
				return accum;
			},
			{},
		);
};

async function main () {
	await pInitConsoleOut();

	console.log(`##### Validating map names #####`);

	const warnings = [];

	const lookupOfficial = {};
	[
		{filename: "adventures.json", prop: "adventure", dir: "adventure"},
		{filename: "books.json", prop: "book", dir: "book"},
	]
		.flatMap(({filename, prop, dir}) => ut.readJson(`./data/${filename}`)[prop]
			.map(head => ({head, prop, filename: `./data/${dir}/${dir}-${head.id.toLowerCase()}.json`})))
		.forEach(({head, prop, filename}) => {
			lookupOfficial[getCleanPath(filename)] = {[prop]: [head]};
		});

	const jsonFiles = getCliJsonFiles(
		{
			dirs: params.dir,
			files: params.file,
			convertedBy: params.convertedBy,
			author: params.author,
			filter: params.filter,
			fnMutDefaultSelection: ({files}) => {
				files.push(...Object.keys(lookupOfficial));
				files.push("./data/fluff-vehicles.json");
			},
		},
	);

	const getCorpora = ({jsonFile}) => {
		const jsonSources = [
			jsonFile.getContents(),
			lookupOfficial[jsonFile.getFilePath()] || {},
			getFauxJsonVehicleFluff({jsonFile}),
		];

		return ["adventure", "book"]
			.flatMap(corpusType => {
				const {propHead, propBody} = UrlUtil.getPagePropsCorpus(corpusType);
				const bodies = jsonSources.flatMap(json => json[propBody] || []);
				return jsonSources.flatMap(json => json[propHead] || [])
					.map(head => {
						const body = bodies.find(corpusData => corpusData.id === head.id);
						if (!body) return null;
						return {head, corpusType, body};
					})
					.filter(Boolean);
			});
	};

	jsonFiles
		.forEach(jsonFile => {
			getCorpora({jsonFile})
				.forEach(({head, corpusType, body}) => {
					console.log(`\tValidating ${corpusType} "${head.id}"...`);

					const {availableMaps} = new CorpusMapImageExtractor().getMutMapMeta({head, body, corpusType});

					const entriesByName = {};
					Object.values(availableMaps)
						.forEach(urlToEntry => {
							Object.values(urlToEntry)
								.forEach(entry => {
									(entriesByName[entry.name] ||= []).push(entry);
								});
						});

					let cntCollisions = 0;
					const withDuplicates = Object.entries(entriesByName)
						.filter(([, entries]) => entries.length > 1)
						.map(([name, entries]) => {
							cntCollisions += entries.length;
							return `${name}\n${entries.map(entry => `\t\t${JSON.stringify(entry.href)}`).join("\n")})`;
						});
					if (!withDuplicates.length) return;

					warnings.push(`Found ${cntCollisions} collision${cntCollisions === 1 ? "" : "s"} ${getJoinedWarnings({jsonFile, warnings: withDuplicates})}`);
				});
		});

	logGroup({name: "Map Name Collisions", lines: warnings});

	if (warnings.length) return false;

	return true;
}

const pMain = main();

if (import.meta.main && !(await pMain)) process.exitCode = 1;

export default pMain;
