import {PageGeneratorRedirectBase} from "./generate-pages-page-generator.js";

class _PageGenerator5etools extends PageGeneratorRedirectBase {
	_page = "5etools.html";

	_pageDescription = "A suite of browser-based tools for Spies & Spiders players and DMs.";

	_redirectHref = "index.html";
	_redirectMessage = "the homepage";
}

export const PAGE_GENERATORS_REDIRECT = [
	new _PageGenerator5etools(),
];
