import {rmDirRecursiveSync} from "./util.js";

if (process.argv.length < 3) throw new Error(`At least one argument is required!`);

process.argv.slice(2)
	.forEach(tgt => {
		console.log(`Removing: ${tgt}`);
		rmDirRecursiveSync(tgt);
	});
