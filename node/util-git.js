import simpleGit from "simple-git";
import fs from "fs";

/**
 * @param {?Array<string>} additionalRoots
 */
export const pGetModifiedFiles = async ({additionalRoots = null} = {}) => {
	return [
		...(await simpleGit().diffSummary()).files
			.map(file => file.file),

		...(
			await Promise.all(
				(additionalRoots || [])
					.map(async altDir => {
						return fs.existsSync(altDir)
							? (await simpleGit(altDir).diffSummary()).files
								.map(file => `${altDir}/${file.file}`)
							: [];
					}),
			)
		)
			.flat(),
	];
};
