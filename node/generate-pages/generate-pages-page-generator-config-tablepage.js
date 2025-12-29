import {PageGeneratorTablepageBase} from "./generate-pages-page-generator.js";

class _PageGeneratorEncountergen extends PageGeneratorTablepageBase {
	_page = "encountergen.html";

	_pageTitle = "Encounters";
	_navbarTitle = "Encounter Generator";
	_navbarDescriptionHtml = `Choose a table, then roll the dice! Alternatively, try the <a href="${UrlUtil.PG_BESTIARY}#${globalThis.HASH_BLANK},encounterbuilder:true">Bestiary Encounter Builder</a>.`;

	_scripts = [
		"encountergen.js",
	];
}

class _PageGeneratorNames extends PageGeneratorTablepageBase {
	_page = "names.html";

	_pageTitle = "Names";
	_navbarDescription = "Choose a race and a type, then roll the dice!";

	_scripts = [
		"names.js",
	];
}

export const PAGE_GENERATORS_TABLEPAGE = [
	new _PageGeneratorEncountergen(),
	new _PageGeneratorNames(),
];
