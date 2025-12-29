import "../js/parser.js";
import "../js/utils.js";
import * as ut from "../node/util.js";

const getClosestEntryId = stack => {
	const ent = [...stack].reverse().find(ent => ent.id);
	if (!ent) return null;
	return ent.id;
};

const getMapLogName = ({obj, stack}) => {
	const closestEntryId = getClosestEntryId(stack);
	const ptsId = [
		obj.id ? `id "${obj.id}"` : "",
		obj.mapParent?.id ? `parent id "${obj.mapParent.id}"` : "",
		closestEntryId ? `closest entry id "${closestEntryId}"` : "",
	]
		.filter(Boolean)
		.join("; ");

	return `${obj.title ? `"${obj.title}"` : "[Untitled]"}${ptsId ? ` (${ptsId})` : ""}`;
};

const getJoinedWarnings = ({filename, warnings}) => {
	return `in "${filename}"\n${warnings.map(it => `\t${it}`).join("\n")}`;
};

let ixLogGroup = 0;
const logGroup = ({name, lines}) => {
	if (!lines.length) return;
	if (ixLogGroup++) console.log(`\n${"-".repeat(20)}`);

	console.log(`\n=== ${name} ===\n`);
	lines.forEach(wrn => console.warn(wrn));
};

async function main () {
	console.log(`##### Validating map grids #####`);

	const warningsNoParent = [];
	const warningsNoGrid = [];

	const walker = MiscUtil.getWalker({isNoModification: true, keyBlocklist: MiscUtil.GENERIC_WALKER_ENTRIES_KEY_BLOCKLIST});
	const IMAGE_TYPES_MAP = new Set(["map", "mapPlayer"]);

	[
		...[
			{filename: "adventures.json", prop: "adventure", dir: "adventure"},
			{filename: "books.json", prop: "book", dir: "book"},
		]
			.flatMap(({filename, prop, dir}) => ut.readJson(`./data/${filename}`)[prop]
				.map(({id}) => ({filename: `./data/${dir}/${dir}-${id.toLowerCase()}.json`}))),
		{filename: "./data/fluff-vehicles.json"},
	]
		.forEach(({filename}) => {
			const json = ut.readJson(filename);

			const warningsNoParentFile = [];
			const warningsNoGridFile = [];

			const stack = [];
			walker.walk(
				json,
				{
					object: (obj) => {
						if (obj.type !== "image" || !IMAGE_TYPES_MAP.has(obj.imageType)) return;

						if (obj.imageType === "mapPlayer" && !obj.mapParent?.id) {
							warningsNoParentFile.push(getMapLogName({obj, stack}));
						}

						if (obj.grid !== undefined) return;

						warningsNoGridFile.push(getMapLogName({obj, stack}));
					},
				},
				null,
				stack,
			);

			if (warningsNoParentFile.length) warningsNoParent.push(`Found "mapPlayer"${warningsNoParentFile.length === 1 ? "" : "s"} with no "mapParent" ${getJoinedWarnings({filename, warnings: warningsNoParentFile})}`);
			if (warningsNoGridFile.length) warningsNoGrid.push(`Found map${warningsNoGridFile.length === 1 ? "" : "s"} with no "grid" ${getJoinedWarnings({filename, warnings: warningsNoGridFile})}`);
		});

	logGroup({name: "Map Parents", lines: warningsNoParent});
	logGroup({name: "Map Grids", lines: warningsNoGrid});

	if (warningsNoParent.length || warningsNoGrid.length) return false;

	return true;
}

export default main();
