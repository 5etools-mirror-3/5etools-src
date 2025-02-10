import "../js/parser.js";
import "../js/utils.js";
import "../js/utils-config.js";

function handleFail () {
	console.error("Tests failed!");
	process.exit(1);
}

async function main () {
	if (!(await (await import("./test-tags.js")).default)) handleFail();
	if (!(await (await import("./test-images.js")).default)) handleFail();
	if (!(await (await import("./test-image-paths.js")).default)) handleFail();
	await (await import("./test-pagenumbers.js")).default; // don't fail on missing page numbers
	await (await import("./test-image-credits.js")).default; // don't fail on missing image credits
	if (!(await (await import("./test-json.js")).default)) handleFail();
	if (!(await (await import("./test-misc.js")).default)) handleFail();
	if (!(await (await import("./test-multisource.js")).default)) handleFail();
	if (!(await (await import("./test-language-fonts.js")).default)) handleFail();
	if (!(await (await import("./test-adventure-book-contents.js")).default)) handleFail();
	await (await import("./test-adventure-book-map-grids-parents.js")).default; // don't fail on missing map grids
	if (!(await (await import("./test-foundry.js")).default)) handleFail();
	process.exit(0);

	// region Manual tests
	// - `test-adventure-book-credits.js`
	// - `test-adventure-book-pages.js`
	// - `test-page-generator.js`
	// - `test-tag-source-versions.js`
	// endregion
}

main()
	.then(() => console.log("Tests complete."))
	.catch(e => {
		console.error(e);
		throw e;
	});
