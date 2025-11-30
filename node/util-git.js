import simpleGit from "simple-git";
import fs from "fs";

const pGetDiffSummaryFiles = async ({dir = null} = {}) => {
	const git = dir ? simpleGit(dir) : simpleGit();

	const filesUnstaged = (await git.diffSummary()).files
		.map(file => file.file);
	const filesStaged = (await git.diffSummary(["--staged"])).files
		.map(file => file.file);

	return Object.keys(
		Object.fromEntries(
			[...filesStaged, ...filesUnstaged]
				.map(file => [dir ? `${dir}/${file}` : file, true]),
		),
	);
};

/**
 * @param {?Array<string>} additionalRoots
 */
export const pGetModifiedFiles = async ({additionalRoots = null} = {}) => {
	return [
		...await pGetDiffSummaryFiles(),

		...(
			await Promise.all(
				(additionalRoots || [])
					.map(async altDir => {
						return fs.existsSync(altDir)
							? pGetDiffSummaryFiles({dir: altDir})
							: [];
					}),
			)
		)
			.flat(),
	];
};
