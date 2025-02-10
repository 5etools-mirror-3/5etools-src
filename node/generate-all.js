import "../js/parser.js";
import "../js/utils.js";
import "../js/utils-config.js";

async function main () {
	await import("./generate-dmscreen-reference.js");
	await import("./generate-quick-reference.js");
	await (await import("./generate-tables-data.js")).default;
	await import("./generate-subclass-lookup.js");
	await import("./generate-variantrules-data.js");
	await (await import("./generate-spell-source-lookup.js")).default;
	await import("./generate-nav-adventure-book-index.js");
	await import("./generate-all-maps.js");
	await import("./generate-pages.js");
	// await import("./generate-wotc-homebrew.js"); // unused

	// Generate the search index at the end, as it catches data generated earlier
	await (await import("./generate-search-index.js")).default;
}

main().catch(e => { throw e; });
