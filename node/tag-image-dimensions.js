import fs from "fs";
import "../js/parser.js";
import "../js/utils.js";
import probe from "probe-image-size";
import {ObjectWalker} from "5etools-utils";
import {Command} from "commander";
import {readJsonSync} from "5etools-utils/lib/UtilFs.js";
import {getAllJson} from "./util-json-files.js";

function getFileProbeTarget (path) {
	const target = fs.createReadStream(path);
	return {
		target,
		location: path,
		fnCleanup: () => target.destroy(), // stream cleanup
	};
}

function getProbeTarget (imgEntry, {localBrewDir = null, localBrewDirImg = null, isAllowExternal = false}) {
	if (imgEntry.href.type === "internal") {
		return getFileProbeTarget(`img/${imgEntry.href.path}`);
	}

	if (imgEntry.href.type === "external") {
		if (localBrewDir && imgEntry.href.url.startsWith(VeCt.URL_ROOT_BREW)) {
			return getFileProbeTarget(
				decodeURI(imgEntry.href.url.replace(`${VeCt.URL_ROOT_BREW}_img`, `${localBrewDir}/_img`)),
			);
		}

		if (localBrewDirImg && imgEntry.href.url.startsWith(VeCt.URL_ROOT_BREW_IMG)) {
			return getFileProbeTarget(
				decodeURI(imgEntry.href.url.replace(VeCt.URL_ROOT_BREW_IMG, `${localBrewDirImg}/`)),
			);
		}

		if (!isAllowExternal) { // Local files are not truly "external"
			console.warn(`Skipping "external" image (URL was "${imgEntry.href.url}"); run with the "--allow-external" option if you wish to probe external URLs.`);
			return null;
		}

		return {
			target: imgEntry.href.url,
			location: imgEntry.href.url,
		};
	}

	throw new Error(`Unhandled image href.type "${imgEntry.href.type}"!`);
}

function getImageEntries (imageEntries, obj) {
	if (obj.type === "image" && obj.href) {
		imageEntries.push(obj);
	}
	return obj;
}

async function pMutImageDimensions (imgEntry, {localBrewDir = null, localBrewDirImg = null, isAllowExternal = false}) {
	const probeMeta = getProbeTarget(imgEntry, {localBrewDir, localBrewDirImg, isAllowExternal});
	if (probeMeta == null) return;

	const {target, location, fnCleanup} = probeMeta;
	try {
		const dimensions = await probe(target);
		if (fnCleanup) fnCleanup();

		imgEntry.width = dimensions.width;
		imgEntry.height = dimensions.height;
	} catch (e) {
		console.error(`Failed to set dimensions for ${location} -- ${e.message}`);
	}
}

async function main (
	{
		dirs,
		files,
		localBrewDir = null,
		localBrewDirImg = null,
		isAllowExternal = false,
	},
) {
	const tStart = Date.now();

	const allFiles = getAllJson({dirs, files});
	console.log(`Running on ${allFiles.length} JSON file${allFiles.length === 1 ? "" : "s"}...`);

	const imageEntries = [];
	allFiles.forEach(meta => {
		ObjectWalker.walk({
			filePath: meta.path,
			obj: meta.json,
			primitiveHandlers: {
				object: getImageEntries.bind(this, imageEntries),
			},
		});
	});

	await Promise.all(
		[...new Array(4)]
			.map(async () => {
				while (imageEntries.length) {
					const imageEntry = imageEntries.pop();
					await pMutImageDimensions(imageEntry, {localBrewDir, localBrewDirImg, isAllowExternal});
				}
			}),
	);

	allFiles.forEach(meta => fs.writeFileSync(meta.path, CleanUtil.getCleanJson(meta.json), "utf-8"));

	const tEnd = Date.now();
	console.log(`Completed in ${((tEnd - tStart) / 1000).toFixed(2)}s.`);
}

const program = new Command()
	.option("--file <file...>", `Input files`)
	.option("--dir <dir...>", `Input directories`)
	.option("--allow-external", "Allow external URLs to be probed.")
	.option("--local-brew-dir <localBrewDir>", "Use local homebrew directory for relevant URLs.")
	.option("--local-brew-dir-img <localBrewDirImg>", "Use local homebrew-img directory for relevant URLs.")
;

program.parse(process.argv);
const params = program.opts();

const dirs = [...(params.dir || [])];
const files = [...(params.file || [])];

// If no options specified, use default selection
if (!dirs.length && !files.length) {
	dirs.push("./data/adventure");
	dirs.push("./data/book");

	files.push("./data/decks.json");
	files.push("./data/fluff-recipes.json");
	files.push("./data/fluff-backgrounds.json");
	files.push("./data/fluff-races.json");

	Object.values(readJsonSync("./data/class/fluff-index.json"))
		.forEach((fname) => files.push(`./data/class/${fname}`));
}

main({
	dirs,
	files,
	localBrewDir: params.localBrewDir,
	localBrewDirImg: params.localBrewDirImg,
	isAllowExternal: params.allowExternal,
})
	.catch(e => console.error(e));
