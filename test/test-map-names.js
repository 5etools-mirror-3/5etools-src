import "../js/parser.js";
import "../js/utils.js";
import "../js/render.js";
import * as ut from "../node/util.js";
import {CorpusMapImageExtractor} from "../js/foundry/foundry-maps.js";
import {Command} from "commander";
import {getCliJsonFiles, mutCommanderJsonFileOptions, pInitConsoleOut} from "../node/util-commander.js";
import {getCleanPath, JsonFile} from "../node/util-json-files.js";

const getJoinedWarnings = ({jsonFile, warnings}) => {
	return `in "${jsonFile.getFilePath()}"\n${warnings.map(it => `\t${it}`).join("\n")}`;
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

const getFauxCorporaVehicleFluff = ({jsonFile}) => {
	return (jsonFile.getContents().vehicleFluff || [])
		.filter(fluff => fluff?.images?.some(img => ["map", "mapPlayer"].includes(img?.imageType)))
		.map(fluff => {
			const {prop} = Parser.SOURCES_ADVENTURES.has(fluff.source)
				? {propData: "adventureData", prop: "adventure"}
				: {propData: "bookData", prop: "book"};

			return {
				head: {
					name: Parser.sourceJsonToFull(fluff.source),
					id: DataUtil.proxy.getUid("vehicleFluff", fluff),
					source: fluff.source,
					contents: [
						{
							name: "Vehicles",
						},
					],
				},
				body: {
					data: [
						{
							type: "section",
							name: "Vehicles",
							entries: [
								...fluff.images,
							],
						},
					],
				},
				corpusType: prop,
				propOriginal: "vehicleFluff",
			};
		});
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
			lookupOfficial[getCleanPath(filename)] = [{head, corpusType: prop}];
		});
	lookupOfficial[getCleanPath("./data/fluff-vehicles.json")] = getFauxCorporaVehicleFluff({
		jsonFile: new JsonFile({
			filePath: "./data/fluff-vehicles.json",
		}),
	});

	const jsonFiles = getCliJsonFiles(
		{
			dirs: params.dir,
			files: params.file,
			convertedBy: params.convertedBy,
			filter: params.filter,
			fnMutDefaultSelection: ({files}) => {
				files.push(...Object.keys(lookupOfficial));
			},
		},
	);

	const getCorpora = ({jsonFile}) => {
		if (lookupOfficial[jsonFile.getFilePath()]) {
			return lookupOfficial[jsonFile.getFilePath()]
				.map(fromLookup => ({body: jsonFile.getContents(), ...fromLookup}));
		}

		return [
			...[
				{prop: "adventure", propData: "adventureData"},
				{prop: "book", propData: "bookData"},
			]
				.flatMap(({prop, propData}) => {
					if (!jsonFile.getContents()[prop]?.length) return [];

					return jsonFile.getContents()[prop]
						.map(head => {
							const body = jsonFile.getContents()[propData]?.find(body => body.id === head.id);
							if (!body) return null;
							return {head, corpusType: prop, body};
						})
						.filter(Boolean);
				}),
			...getFauxCorporaVehicleFluff({jsonFile}),
		];
	};

	jsonFiles
		.forEach(jsonFile => {
			getCorpora({jsonFile})
				.forEach(({head, corpusType, propOriginal, body}) => {
					console.log(`\tValidating ${corpusType}${propOriginal ? ` (from ${propOriginal})` : ""} "${head.id}"...`);

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
