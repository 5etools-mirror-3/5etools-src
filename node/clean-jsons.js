import fs from "fs";
import * as ut from "./util.js";

import "../js/parser.js";
import "../js/utils.js";
import "../js/render.js";

/**
 * @param folder
 * @param {?boolean} [isFast]
 * @param {?Set<string>} [pathsIgnore]
 */
function cleanFolder (folder, {isFast = false, pathsIgnore = null} = {}) {
	console.log(`Cleaning directory ${folder}...`);
	const files = ut.listFiles({
		dir: folder,
	});
	files
		.filter(file => file.endsWith(".json") && (pathsIgnore == null || !pathsIgnore.has(file)))
		.forEach(file => {
			console.log(`\tCleaning ${file}...`);
			fs.writeFileSync(file, CleanUtil.getCleanJson(ut.readJson(file), {isFast}), "utf-8");
		});
}

cleanFolder(`./data`);
cleanFolder(`./homebrew`, {isFast: true, pathsIgnore: new Set(["homebrew/index.json"])});
cleanFolder(`./prerelease`, {isFast: true, pathsIgnore: new Set(["prerelease/index.json"])});
console.log("Cleaning complete.");
