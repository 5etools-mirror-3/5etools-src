import {injectManifest} from "workbox-build";
import esbuild from "esbuild";

const args = process.argv.slice(2);
const prod = args[0] === "prod";

/**
 * convert from bytes to mb and label the units
 * @param {number} bytes
 * @returns String of the mb conversion with label
 */
const bytesToMb = (bytes) => `${(bytes / 1e6).toPrecision(3)} mb`;

const buildResultLog = (label, buildResult) => {
	console.log(`\n${label}:`);
	console.log(buildResult);
};

// we need to build the injector first so the glob matches and hashes the newest file
const esbuildBuildResultSwInjector = await esbuild.build({
	entryPoints: ["sw-injector-template.js"],
	bundle: true,
	minify: prod,
	drop: prod ? ["console"] : undefined,
	allowOverwrite: true,
	outfile: "sw-injector.js",
});

buildResultLog("esbuild bundling sw-injector-template.js", esbuildBuildResultSwInjector);

const workboxPrecacheBuildResult = await injectManifest({
	swSrc: "sw-template.js",
	swDest: "sw.js",
	injectionPoint: "self.__WB_PRECACHE_MANIFEST",
	maximumFileSizeToCacheInBytes: 5 /* mb */ * 1e6,
	globDirectory: "", // use the current directory - run this script from project root.
	globPatterns: [
		"js/**/*.js", // all js needs to be loaded
		"lib/**/*.js", // js in lib needs to be loaded
		"css/**/*.css", // all css needs to be loaded
		"homebrew/**/*.json", // presumably if there is homebrew data it should also be loaded
		"prerelease/**/*.json", // as above
		// we want to match all data unless its for an adventure
		"data/*.json", // root level data
		"data/**/!(adventure)/*.json", // matches all json in data unless it is a file inside a directory called adventure
		"*.html", // all html pages need to be loaded
		"search/*.json", // search data is needed
		"manifest.webmanifest", // we should make sure we have the manifest, although its not strictly needed...
		// we want to store fonts to make things styled nicely
		"fonts/glyphicons-halflings-regular.woff2",
		"fonts/Convergence-Regular.woff2",
		"fonts/Roboto-Regular.woff2",
		// we need to cache the sw-injector or we won't be injected
		"sw-injector.js",
	],
});

buildResultLog(
	`workbox manifest "self.__WB_PRECACHE_MANIFEST" injection`,
	{...workboxPrecacheBuildResult, size: bytesToMb(workboxPrecacheBuildResult.size)},
);

const workboxRuntimeBuildResult = await injectManifest({
	swSrc: "sw.js",
	swDest: "sw.js",
	injectionPoint: "self.__WB_RUNTIME_MANIFEST",
	maximumFileSizeToCacheInBytes: 50 /* mb */ * 1e6,
	globDirectory: "", // use the current directory - run this script from project root.
	/*
	it is less then ideal for these globs to match files that were already matched for pre-caching, but it wont break anything
	route precedence goes to pre-cache, so they won't fight and double cache the file
	however, doubly included files bloat the manifest, so ideal to avoid
	*/
	globPatterns: [
		"data/adventure/**/*.json", // matches all adventure json
		"img/**/*", // matches all images
		"icon/*.png", // all icons
		"*.png", // root images
		"*.svg", // root svg
	],
	manifestTransforms: [
		(manifest) =>
			({manifest: manifest.map(
				entry =>
					[
						entry.url
							// sanitize spaces
							.replaceAll(" ", "%20"),
						entry.revision,
					],
			)}),
	],
});

buildResultLog(
	`workbox manifest "self.__WB_RUNTIME_MANIFEST" injection`,
	{...workboxRuntimeBuildResult, size: bytesToMb(workboxRuntimeBuildResult.size)},
);

const esbuildBuildResultSw = await esbuild.build({
	entryPoints: ["sw.js"],
	bundle: true,
	minify: prod,
	drop: prod ? ["console"] : undefined,
	allowOverwrite: true,
	outfile: "sw.js",
});

buildResultLog("esbuild bundling sw-template.js", esbuildBuildResultSw);
