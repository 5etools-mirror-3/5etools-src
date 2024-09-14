import {PageGeneratorTablepageBase} from "./generate-pages-page-generator.js";

class _PageGeneratorEncountergen extends PageGeneratorTablepageBase {
	_page = "encountergen.html";

	_pageTitle = "Encounters";
	_navbarTitle = "Encounter Generator";
	_navbarDescription = "Choose a setting and level range, then roll the dice!";

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
