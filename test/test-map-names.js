import "../js/parser.js";
import "../js/utils.js";
import "../js/render.js";
import * as ut from "../node/util.js";
import {CorpusMapImageExtractor} from "../js/foundry/foundry-maps.js";
import {Command} from "commander";
import {getCliFiles, pInitConsoleOut} from "../node/util-commander.js";
import path from "path";
import {readJsonSync} from "5etools-utils/lib/UtilFs.js";

const getJoinedWarnings = ({filename, warnings}) => {
	return `in "${filename}"\n${warnings.map(it => `\t${it}`).join("\n")}`;
};

const getCleanPath = pth => path.normalize(pth).toString().replace(/\\/g, "/");

let ixLogGroup = 0;
const logGroup = ({name, lines}) => {
	if (!lines.length) return;
	if (ixLogGroup++) console.log(`\n${"-".repeat(20)}`);

	console.log(`\n=== ${name} ===\n`);
	lines.forEach(wrn => console.warn(wrn));
};

const program = new Command()
	.option("--file <file...>", `Input files`)
	.option("--dir <dir...>", `Input directories`)
;

program.parse(process.argv);
const params = program.opts();

const getFauxCorporaVehicleFluff = ({json}) => {
	return (json.vehicleFluff || [])
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
	lookupOfficial[getCleanPath("./data/fluff-vehicles.json")] = getFauxCorporaVehicleFluff({json: readJsonSync("./data/fluff-vehicles.json")});

	const files = getCliFiles(
		{
			dirs: params.dir,
			files: params.file,
		},
	)
		.map(({json, path}) => ({json, path: getCleanPath(path)}));
	if (!files.length) {
		Object.keys(lookupOfficial)
			.forEach(filePath => files.push({json: readJsonSync(filePath), path: filePath}));
	}

	const getCorpora = ({json, path}) => {
		if (lookupOfficial[path]) {
			return lookupOfficial[path]
				.map(fromLookup => ({body: json, ...fromLookup}));
		}

		return [
			...[
				{prop: "adventure", propData: "adventureData"},
				{prop: "book", propData: "bookData"},
			]
				.flatMap(({prop, propData}) => {
					if (!json[prop]?.length) return [];

					return json[prop]
						.map(head => {
							const body = json[propData]?.find(body => body.id === head.id);
							if (!body) return null;
							return {head, corpusType: prop, body};
						})
						.filter(Boolean);
				}),
			...getFauxCorporaVehicleFluff({json}),
		];
	};

	files
		.forEach(({json, path}) => {
			getCorpora({json, path})
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

					warnings.push(`Found ${cntCollisions} collision${cntCollisions === 1 ? "" : "s"} ${getJoinedWarnings({filename: path, warnings: withDuplicates})}`);
				});
		});

	logGroup({name: "Map Name Collisions", lines: warnings});

	if (warnings.length) return false;

	return true;
}

export default main();
