import {PageGeneratorSeoIndexBase} from "./generate-pages-page-generator.js";

class _PageGeneratorSeoIndexBestiary extends PageGeneratorSeoIndexBase {
	_page = "bestiary/index.html";
}

class _PageGeneratorSeoIndexItems extends PageGeneratorSeoIndexBase {
	_page = "items/index.html";
}

class _PageGeneratorSeoIndexSpells extends PageGeneratorSeoIndexBase {
	_page = "spells/index.html";
}

export const PAGE_GENERATORS_SEO_INDEX = [
	new _PageGeneratorSeoIndexBestiary(),
	new _PageGeneratorSeoIndexItems(),
	new _PageGeneratorSeoIndexSpells(),
];
