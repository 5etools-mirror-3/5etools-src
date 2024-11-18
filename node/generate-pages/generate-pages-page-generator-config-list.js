import {PageGeneratorListBase} from "./generate-pages-page-generator.js";
import {HtmlGeneratorListButtons} from "./generate-pages-html-generator.js";

class _PageGeneratorListActions extends PageGeneratorListBase {
	_page = UrlUtil.PG_ACTIONS;
	_pageTitle = "Actions";
	_scriptIdentList = "actions";

	_btnsList = [
		HtmlGeneratorListButtons.getBtnPreviewToggle(),
		HtmlGeneratorListButtons.getBtn({width: "5-7", sortIdent: "name", text: "Name"}),
		HtmlGeneratorListButtons.getBtn({width: "4", sortIdent: "time", text: "Time"}),
		HtmlGeneratorListButtons.getBtnSource(),
	];

	_btnsSublist = [
		HtmlGeneratorListButtons.getBtn({width: "8", sortIdent: "name", text: "Name"}),
		HtmlGeneratorListButtons.getBtn({width: "4", sortIdent: "time", text: "Time"}),
	];
}

class _PageGeneratorListBackgrounds extends PageGeneratorListBase {
	_page = UrlUtil.PG_BACKGROUNDS;
	_pageTitle = "Backgrounds";
	_scriptIdentList = "backgrounds";
	_isHasRenderer = false;

	_isModule = true;

	_btnsList = [
		HtmlGeneratorListButtons.getBtn({width: "2-5", sortIdent: "name", text: "Name"}),
		HtmlGeneratorListButtons.getBtn({width: "3-5", sortIdent: "ability", text: "Ability"}),
		HtmlGeneratorListButtons.getBtn({width: "4", sortIdent: "skills", text: "Skill Proficiencies"}),
		HtmlGeneratorListButtons.getBtnSource(),
	];

	_btnsSublist = [
		HtmlGeneratorListButtons.getBtn({width: "3", sortIdent: "name", text: "Name"}),
		HtmlGeneratorListButtons.getBtn({width: "5", sortIdent: "ability", text: "Ability"}),
		HtmlGeneratorListButtons.getBtn({width: "4", sortIdent: "skills", text: "Skills"}),
	];

	_isPrinterView = true;
}

class _PageGeneratorListBestiary extends PageGeneratorListBase {
	_page = UrlUtil.PG_BESTIARY;
	_pageTitle = "Bestiary";

	_stylesheets = [
		"bestiary",
		"encounterbuilder-bundle",
	];

	_scriptIdentList = "bestiary";
	_isHasRenderer = false;

	_scriptsUtilsAdditional = [
		"utils-tableview.js",
	];

	_isModule = true;
	_isMultisource = true;
	_isWrpToken = true;

	_btnsList = [
		HtmlGeneratorListButtons.getBtn({width: "4-2", sortIdent: "name", text: "Name"}),
		HtmlGeneratorListButtons.getBtn({width: "4-1", sortIdent: "type", text: "Type"}),
		HtmlGeneratorListButtons.getBtn({width: "1-7", sortIdent: "cr", text: "CR"}),
		HtmlGeneratorListButtons.getBtnSource(),
	];

	_btnsSublist = [
		HtmlGeneratorListButtons.getBtn({width: "5", sortIdent: "name", text: "Name"}),

		HtmlGeneratorListButtons.getBtn({width: "3-8", classListAdditional: ["best-ecgen__hidden"], sortIdent: "type", text: "Type"}),
		HtmlGeneratorListButtons.getBtn({width: "3-8", classListAdditional: ["best-ecgen__visible"], isDisabled: true, text: "&nbsp;"}),

		HtmlGeneratorListButtons.getBtn({width: "1-2", sortIdent: "cr", text: "CR"}),
		HtmlGeneratorListButtons.getBtn({width: "2", sortIdent: "count", text: "Number"}),
	];

	_registerPartials () {
		super._registerPartials();

		this._registerPartial({
			ident: "listContentwrapperBestiary",
			filename: "list/template-list-contentwrapper--bestiary.hbs",
		});

		this._registerPartial({
			ident: "listSublistContainerBestiary",
			filename: "list/template-list-sublist-container--bestiary.hbs",
		});
	}

	_getData () {
		return {
			...super._getData(),
			identPartialListContentwrapper: "listContentwrapperBestiary",
		};
	}

	_isPrinterView = true;
}

class _PageGeneratorListCharCreationOptions extends PageGeneratorListBase {
	_page = UrlUtil.PG_CHAR_CREATION_OPTIONS;
	_pageTitle = "Other Character Creation Options";
	_scriptIdentList = "charcreationoptions";

	_btnsList = [
		HtmlGeneratorListButtons.getBtn({width: "5", sortIdent: "type", text: "Type"}),
		HtmlGeneratorListButtons.getBtn({width: "5", sortIdent: "name", text: "Name"}),
		HtmlGeneratorListButtons.getBtnSource(),
	];

	_btnsSublist = [
		HtmlGeneratorListButtons.getBtn({width: "5", sortIdent: "type", text: "Type"}),
		HtmlGeneratorListButtons.getBtn({width: "7", sortIdent: "name", text: "Name"}),
	];
}

class _PageGeneratorListConditionsDiseases extends PageGeneratorListBase {
	_page = UrlUtil.PG_CONDITIONS_DISEASES;
	_pageTitle = "Conditions & Diseases";
	_scriptIdentList = "conditionsdiseases";
	_isHasRenderer = false;

	_isModule = true;

	_btnsList = [
		HtmlGeneratorListButtons.getBtnPreviewToggle(),
		HtmlGeneratorListButtons.getBtn({width: "3", sortIdent: "type", text: "Type"}),
		HtmlGeneratorListButtons.getBtn({width: "6-7", sortIdent: "name", text: "Name"}),
		HtmlGeneratorListButtons.getBtnSource(),
	];

	_btnsSublist = [
		HtmlGeneratorListButtons.getBtn({width: "2", sortIdent: "type", text: "Type"}),
		HtmlGeneratorListButtons.getBtn({width: "10", sortIdent: "name", text: "Name"}),
	];
}

class _PageGeneratorListCultsBoons extends PageGeneratorListBase {
	_page = UrlUtil.PG_CULTS_BOONS;
	_pageTitle = "Cults & Supernatural Boons";
	_scriptIdentList = "cultsboons";

	_btnsList = [
		HtmlGeneratorListButtons.getBtn({width: "2", sortIdent: "type", text: "Type"}),
		HtmlGeneratorListButtons.getBtn({width: "2", sortIdent: "subType", text: "Subtype"}),
		HtmlGeneratorListButtons.getBtn({width: "6", sortIdent: "name", text: "Name"}),
		HtmlGeneratorListButtons.getBtnSource(),
	];

	_btnsSublist = [
		HtmlGeneratorListButtons.getBtn({width: "2", sortIdent: "type", text: "Type"}),
		HtmlGeneratorListButtons.getBtn({width: "2", sortIdent: "subType", text: "Subtype"}),
		HtmlGeneratorListButtons.getBtn({width: "8", sortIdent: "name", text: "Name"}),
	];
}

class _PageGeneratorListDecks extends PageGeneratorListBase {
	_page = UrlUtil.PG_DECKS;
	_pageTitle = "Decks";

	_isFontAwesome = true;

	_stylesheets = [
		"decks",
	];
	_isStyleBook = true;

	_scriptIdentList = "decks";

	_styleListContainerAdditional = "ve-flex-4";
	_styleContentWrapperAdditional = "ve-flex-7";

	_btnsList = [
		HtmlGeneratorListButtons.getBtn({width: "10", sortIdent: "name", text: "Name"}),
		HtmlGeneratorListButtons.getBtnSource(),
	];

	_btnsSublist = [
		HtmlGeneratorListButtons.getBtn({width: "12", sortIdent: "name", text: "Name"}),
	];
}

class _PageGeneratorListDeities extends PageGeneratorListBase {
	_page = UrlUtil.PG_DEITIES;
	_pageTitle = "Deities";
	_scriptIdentList = "deities";

	_styleListContainerAdditional = "ve-flex-6";
	_styleContentWrapperAdditional = "ve-flex-4";

	_btnsList = [
		HtmlGeneratorListButtons.getBtn({width: "3", sortIdent: "name", text: "Name"}),
		HtmlGeneratorListButtons.getBtn({width: "2", sortIdent: "pantheon", text: "Pantheon"}),
		HtmlGeneratorListButtons.getBtn({width: "2", sortIdent: "alignment", text: "Alignment"}),
		HtmlGeneratorListButtons.getBtn({width: "3", sortIdent: "domains", text: "Domains"}),
		HtmlGeneratorListButtons.getBtnSource(),
	];

	_btnsSublist = [
		HtmlGeneratorListButtons.getBtn({width: "4", sortIdent: "name", text: "Name"}),
		HtmlGeneratorListButtons.getBtn({width: "2", sortIdent: "pantheon", text: "Pantheon"}),
		HtmlGeneratorListButtons.getBtn({width: "2", sortIdent: "alignment", text: "Alignment"}),
		HtmlGeneratorListButtons.getBtn({width: "4", sortIdent: "domains", text: "Domains"}),
	];
}

class _PageGeneratorListFeats extends PageGeneratorListBase {
	_page = UrlUtil.PG_FEATS;
	_pageTitle = "Feats";
	_scriptIdentList = "feats";
	_isHasRenderer = false;

	_styleListContainerAdditional = "ve-flex-6";
	_styleContentWrapperAdditional = "ve-flex-5";

	_isModule = true;

	_btnsList = [
		HtmlGeneratorListButtons.getBtnPreviewToggle(),
		HtmlGeneratorListButtons.getBtn({width: "3-2", sortIdent: "name", text: "Name"}),
		HtmlGeneratorListButtons.getBtn({width: "1-3", sortIdent: "category", text: "Category"}),
		HtmlGeneratorListButtons.getBtn({width: "2-5", sortIdent: "ability", text: "Ability"}),
		HtmlGeneratorListButtons.getBtn({width: "3", sortIdent: "prerequisite", text: "Prerequisite"}),
		HtmlGeneratorListButtons.getBtnSource(),
	];

	_btnsSublist = [
		HtmlGeneratorListButtons.getBtn({width: "4", sortIdent: "name", text: "Name"}),
		HtmlGeneratorListButtons.getBtn({width: "2", sortIdent: "ability", text: "Category"}),
		HtmlGeneratorListButtons.getBtn({width: "2", sortIdent: "ability", text: "Ability"}),
		HtmlGeneratorListButtons.getBtn({width: "4", sortIdent: "prerequisite", text: "Prerequisite"}),
	];

	_isPrinterView = true;
}

class _PageGeneratorListItems extends PageGeneratorListBase {
	_page = UrlUtil.PG_ITEMS;
	_pageTitle = "Items";

	_stylesheets = [
		"items",
	];

	_scriptIdentList = "items";
	_isHasRenderer = false;

	_isModule = true;

	_scriptsUtilsAdditional = [
		"utils-tableview.js",
	];

	_styleListContainerAdditional = "ve-flex-6 itm__wrp-lists";
	_styleContentWrapperAdditional = "ve-flex-4 itm__wrp-stats";

	_btnsSublist = [
		HtmlGeneratorListButtons.getBtn({width: "6", sortIdent: "name", text: "Name"}),
		HtmlGeneratorListButtons.getBtn({width: "2", sortIdent: "weight", text: "Weight"}),
		HtmlGeneratorListButtons.getBtn({width: "2", sortIdent: "cost", text: "Cost"}),
		HtmlGeneratorListButtons.getBtn({width: "2", sortIdent: "count", text: "Number"}),
	];

	_registerPartials () {
		super._registerPartials();

		this._registerPartial({
			ident: "listListcontainerItems",
			filename: "list/template-list-listcontainer--items.hbs",
		});

		this._registerPartial({
			ident: "listContentwrapperItems",
			filename: "list/template-list-contentwrapper--items.hbs",
		});

		this._registerPartial({
			ident: "listSublistContainerItems",
			filename: "list/template-list-sublist-container--items.hbs",
		});
	}

	_getData () {
		return {
			...super._getData(),
			identPartialListListcontainer: "listListcontainerItems",
			identPartialListContentwrapper: "listContentwrapperItems",
		};
	}

	_isPrinterView = true;
}

class _PageGeneratorListTrapsHazards extends PageGeneratorListBase {
	_page = UrlUtil.PG_TRAPS_HAZARDS;
	_pageTitle = "Traps & Hazards";
	_scriptIdentList = "trapshazards";

	_btnsList = [
		HtmlGeneratorListButtons.getBtn({width: "3", sortIdent: "trapType", text: "Type"}),
		HtmlGeneratorListButtons.getBtn({width: "7", sortIdent: "name", text: "Name"}),
		HtmlGeneratorListButtons.getBtnSource(),
	];

	_btnsSublist = [
		HtmlGeneratorListButtons.getBtn({width: "4", sortIdent: "trapType", text: "Type"}),
		HtmlGeneratorListButtons.getBtn({width: "8", sortIdent: "name", text: "Name"}),
	];
}

class _PageGeneratorListRewards extends PageGeneratorListBase {
	_page = UrlUtil.PG_REWARDS;
	_pageTitle = "Supernatural Gifts & Rewards";
	_scriptIdentList = "rewards";

	_btnsList = [
		HtmlGeneratorListButtons.getBtnPreviewToggle(),
		HtmlGeneratorListButtons.getBtn({width: "2", sortIdent: "type", text: "Type"}),
		HtmlGeneratorListButtons.getBtn({width: "7-7", sortIdent: "name", text: "Name"}),
		HtmlGeneratorListButtons.getBtnSource(),
	];

	_btnsSublist = [
		HtmlGeneratorListButtons.getBtn({width: "2", sortIdent: "type", text: "Type"}),
		HtmlGeneratorListButtons.getBtn({width: "10", sortIdent: "name", text: "Name"}),
	];
}

class _PageGeneratorListLanguages extends PageGeneratorListBase {
	_page = UrlUtil.PG_LANGUAGES;
	_pageTitle = "Languages";
	_scriptIdentList = "languages";

	_stylesheets = [
		"languages",
	];

	_btnsList = [
		HtmlGeneratorListButtons.getBtn({width: "6", sortIdent: "name", text: "Name"}),
		HtmlGeneratorListButtons.getBtn({width: "2", sortIdent: "type", text: "Type"}),
		HtmlGeneratorListButtons.getBtn({width: "2", sortIdent: "script", text: "Script"}),
		HtmlGeneratorListButtons.getBtnSource(),
	];

	_btnsSublist = [
		HtmlGeneratorListButtons.getBtn({width: "8", sortIdent: "name", text: "Name"}),
		HtmlGeneratorListButtons.getBtn({width: "2", sortIdent: "type", text: "Type"}),
		HtmlGeneratorListButtons.getBtn({width: "2", sortIdent: "script", text: "Script"}),
	];
}

class _PageGeneratorListObjects extends PageGeneratorListBase {
	_page = UrlUtil.PG_OBJECTS;
	_pageTitle = "Objects";
	_scriptIdentList = "objects";

	_btnsList = [
		HtmlGeneratorListButtons.getBtn({width: "8", sortIdent: "name", text: "Name"}),
		HtmlGeneratorListButtons.getBtn({width: "2", sortIdent: "size", text: "Size"}),
		HtmlGeneratorListButtons.getBtnSource(),
	];

	_btnsSublist = [
		HtmlGeneratorListButtons.getBtn({width: "9", sortIdent: "name", text: "Name"}),
		HtmlGeneratorListButtons.getBtn({width: "3", sortIdent: "size", text: "Size"}),
	];

	_isWrpToken = true;
}

class _PageGeneratorListOptionalFeatures extends PageGeneratorListBase {
	_page = UrlUtil.PG_OPT_FEATURES;
	_pageTitle = "Other Options and Features";
	_scriptIdentList = "optionalfeatures";
	_isHasRenderer = false;

	_isModule = true;

	_isPrinterView = true;

	_stylesheets = [
		"optionalfeatures",
	];

	_styleListContainerAdditional = "ve-flex-6";
	_styleContentWrapperAdditional = "ve-flex-4";

	_btnsList = [
		HtmlGeneratorListButtons.getBtnPreviewToggle(),
		HtmlGeneratorListButtons.getBtn({width: "3", sortIdent: "name", text: "Name"}),
		HtmlGeneratorListButtons.getBtn({width: "1-5", sortIdent: "type", text: "Type"}),
		HtmlGeneratorListButtons.getBtn({width: "4-7", sortIdent: "prerequisite", text: "Prerequisite"}),
		HtmlGeneratorListButtons.getBtn({width: "1", sortIdent: "level", text: "Level"}),
		HtmlGeneratorListButtons.getBtnSource(),
	];

	_btnsSublist = [
		HtmlGeneratorListButtons.getBtn({width: "4", sortIdent: "name", text: "Name"}),
		HtmlGeneratorListButtons.getBtn({width: "2", sortIdent: "type", text: "Type"}),
		HtmlGeneratorListButtons.getBtn({width: "4-5", sortIdent: "prerequisite", text: "Prerequisite"}),
		HtmlGeneratorListButtons.getBtn({width: "1-5", sortIdent: "level", text: "Level"}),
	];
}

class _PageGeneratorListPsionics extends PageGeneratorListBase {
	_page = UrlUtil.PG_PSIONICS;
	_pageTitle = "Psionics";
	_scriptIdentList = "psionics";

	_scriptsUtilsAdditional = [
		"utils-tableview.js",
	];

	_btnsList = [
		HtmlGeneratorListButtons.getBtn({width: "6", sortIdent: "name", text: "Name"}),
		HtmlGeneratorListButtons.getBtn({width: "2", sortIdent: "type", text: "Type"}),
		HtmlGeneratorListButtons.getBtn({width: "2", sortIdent: "order", text: "Order"}),
		HtmlGeneratorListButtons.getBtnSource(),
	];

	_btnsSublist = [
		HtmlGeneratorListButtons.getBtn({width: "6", sortIdent: "name", text: "Name"}),
		HtmlGeneratorListButtons.getBtn({width: "3", sortIdent: "type", text: "Type"}),
		HtmlGeneratorListButtons.getBtn({width: "3", sortIdent: "order", text: "Order"}),
	];

	_registerPartials () {
		super._registerPartials();

		this._registerPartial({
			ident: "listContentwrapperPsionics",
			filename: "list/template-list-contentwrapper--psionics.hbs",
		});
	}

	_getData () {
		return {
			...super._getData(),
			identPartialListContentwrapper: "listContentwrapperPsionics",
		};
	}
}

class _PageGeneratorListRaces extends PageGeneratorListBase {
	_page = UrlUtil.PG_RACES;
	_pageTitle = "Species";
	_scriptIdentList = "races";
	_isHasRenderer = false;

	_isModule = true;

	_btnsList = [
		HtmlGeneratorListButtons.getBtn({width: "4", sortIdent: "name", text: "Name"}),
		HtmlGeneratorListButtons.getBtn({width: "4", sortIdent: "ability", text: "Ability"}),
		HtmlGeneratorListButtons.getBtn({width: "2", sortIdent: "size", text: "Size"}),
		HtmlGeneratorListButtons.getBtnSource(),
	];

	_btnsSublist = [
		HtmlGeneratorListButtons.getBtn({width: "5", sortIdent: "name", text: "Name"}),
		HtmlGeneratorListButtons.getBtn({width: "5", sortIdent: "ability", text: "Ability"}),
		HtmlGeneratorListButtons.getBtn({width: "2", sortIdent: "size", text: "Size"}),
	];

	_isPrinterView = true;
}

class _PageGeneratorListRecipes extends PageGeneratorListBase {
	_page = UrlUtil.PG_RECIPES;
	_pageTitle = "Recipes";
	_scriptIdentList = "recipes";

	_stylesheets = [
		"recipes",
	];

	_isStyleBook = true;

	_styleListContainerAdditional = "ve-flex-4";
	_styleContentWrapperAdditional = "ve-flex-7";
	_stylePageContentAdditional = "recipes__tbl-recipes";

	_btnsList = [
		HtmlGeneratorListButtons.getBtn({width: "6", sortIdent: "name", text: "Name"}),
		HtmlGeneratorListButtons.getBtn({width: "4", sortIdent: "type", text: "Category"}),
		HtmlGeneratorListButtons.getBtnSource(),
	];

	_btnsSublist = [
		HtmlGeneratorListButtons.getBtn({width: "9", sortIdent: "name", text: "Name"}),
		HtmlGeneratorListButtons.getBtn({width: "3", sortIdent: "type", text: "Category"}),
	];

	_registerPartials () {
		super._registerPartials();

		this._registerPartial({
			ident: "listContentwrapperRecipes",
			filename: "list/template-list-contentwrapper--recipes.hbs",
		});
	}

	_getData () {
		return {
			...super._getData(),
			identPartialListContentwrapper: "listContentwrapperRecipes",
		};
	}
}

class _PageGeneratorListSpells extends PageGeneratorListBase {
	_page = UrlUtil.PG_SPELLS;
	_pageTitle = "Spells";
	_scriptIdentList = "spells";
	_isHasRenderer = false;

	_stylesheets = [
		"spells",
	];

	_styleListContainerAdditional = "ve-flex-7";
	_styleContentWrapperAdditional = "ve-flex-5";

	_isModule = true;
	_isMultisource = true;

	_scriptsUtilsAdditional = [
		"utils-tableview.js",
	];

	_btnsList = [
		HtmlGeneratorListButtons.getBtn({width: "2-9", sortIdent: "name", text: "Name"}),
		HtmlGeneratorListButtons.getBtn({width: "1-5", sortIdent: "level", text: "Level"}),
		HtmlGeneratorListButtons.getBtn({width: "1-7", sortIdent: "time", text: "Time"}),
		HtmlGeneratorListButtons.getBtn({width: "1-2", sortIdent: "school", text: "School"}),
		HtmlGeneratorListButtons.getBtn({width: "0-6", sortIdent: "concentration", title: "Concentration", text: "C."}),
		HtmlGeneratorListButtons.getBtn({width: "2-4", sortIdent: "range", text: "Range"}),
		HtmlGeneratorListButtons.getBtnSource(),
	];

	_btnsSublist = [
		HtmlGeneratorListButtons.getBtn({width: "3-2", sortIdent: "name", text: "Name"}),
		HtmlGeneratorListButtons.getBtn({width: "1-5", sortIdent: "level", text: "Level"}),
		HtmlGeneratorListButtons.getBtn({width: "1-8", sortIdent: "time", text: "Time"}),
		HtmlGeneratorListButtons.getBtn({width: "1-6", sortIdent: "school", text: "School"}),
		HtmlGeneratorListButtons.getBtn({width: "0-7", sortIdent: "concentration", title: "Concentration", text: "C."}),
		HtmlGeneratorListButtons.getBtn({width: "3-2", sortIdent: "range", text: "Range"}),
	];

	_registerPartials () {
		super._registerPartials();

		this._registerPartial({
			ident: "listContentwrapperSpells",
			filename: "list/template-list-contentwrapper--spells.hbs",
		});
	}

	_getData () {
		return {
			...super._getData(),
			identPartialListContentwrapper: "listContentwrapperSpells",
		};
	}
}

class _PageGeneratorListTables extends PageGeneratorListBase {
	_page = UrlUtil.PG_TABLES;
	_pageTitle = "Tables";
	_scriptIdentList = "tables";

	_styleListContainerAdditional = "ve-flex-4";
	_styleContentWrapperAdditional = "ve-flex-6";

	_btnsList = [
		HtmlGeneratorListButtons.getBtn({width: "10", sortIdent: "sortName", text: "Name"}),
		HtmlGeneratorListButtons.getBtnSource(),
	];

	_btnsSublist = [
		HtmlGeneratorListButtons.getBtn({width: "12", sortIdent: "sortName", text: "Name"}),
	];
}

class _PageGeneratorListVariantRules extends PageGeneratorListBase {
	_page = UrlUtil.PG_VARIANTRULES;
	_pageTitle = "Rules Glossary";
	_navbarTitle = "Rules Glossary";
	_scriptIdentList = "variantrules";

	_btnsList = [
		HtmlGeneratorListButtons.getBtn({width: "7", sortIdent: "name", text: "Name"}),
		HtmlGeneratorListButtons.getBtn({width: "3", sortIdent: "ruleType", text: "Type"}),
		HtmlGeneratorListButtons.getBtnSource(),
	];

	_btnsSublist = [
		HtmlGeneratorListButtons.getBtn({width: "9", sortIdent: "name", text: "Name"}),
		HtmlGeneratorListButtons.getBtn({width: "3", sortIdent: "ruleType", text: "Type"}),
	];
}

class _PageGeneratorListVehicles extends PageGeneratorListBase {
	_page = UrlUtil.PG_VEHICLES;
	_pageTitle = "Vehicles";
	_scriptIdentList = "vehicles";

	_btnsList = [
		HtmlGeneratorListButtons.getBtn({width: "6", sortIdent: "type", text: "Type"}),
		HtmlGeneratorListButtons.getBtn({width: "4", sortIdent: "name", text: "Name"}),
		HtmlGeneratorListButtons.getBtnSource(),
	];

	_btnsSublist = [
		HtmlGeneratorListButtons.getBtn({width: "8", sortIdent: "type", text: "Type"}),
		HtmlGeneratorListButtons.getBtn({width: "4", sortIdent: "name", text: "Name"}),
	];

	_isWrpToken = true;
}

class _PageGeneratorListBastions extends PageGeneratorListBase {
	_page = UrlUtil.PG_BASTIONS;
	_pageTitle = "Bastions";
	_scriptIdentList = "bastions";
	_isHasRenderer = false;

	_isModule = true;

	_btnsList = [
		HtmlGeneratorListButtons.getBtn({width: "2", sortIdent: "facilityType", text: "Type"}),
		HtmlGeneratorListButtons.getBtn({width: "3", sortIdent: "name", text: "Name"}),
		HtmlGeneratorListButtons.getBtn({width: "1", sortIdent: "level", text: "Level"}),
		HtmlGeneratorListButtons.getBtn({width: "4", sortIdent: "prerequisite", text: "Prerequisite"}),
		HtmlGeneratorListButtons.getBtnSource(),
	];

	_btnsSublist = [
		HtmlGeneratorListButtons.getBtn({width: "2", sortIdent: "facilityType", text: "Type"}),
		HtmlGeneratorListButtons.getBtn({width: "3", sortIdent: "name", text: "Name"}),
		HtmlGeneratorListButtons.getBtn({width: "2", sortIdent: "level", text: "Level"}),
		HtmlGeneratorListButtons.getBtn({width: "5", sortIdent: "prerequisite", text: "Prerequisite"}),
	];

	_isPrinterView = true;
}

class _PageGeneratorListClasses extends PageGeneratorListBase {
	_filename = "list/template-list--classes.hbs";

	_page = UrlUtil.PG_CLASSES;
	_pageTitle = "Classes";
	_scriptIdentList = "classes";
	_isHasRenderer = false;

	_stylesheets = [
		"classes",
	];

	_isModule = true;
}

export const PAGE_GENERATORS_LISTPAGE = [
	new _PageGeneratorListActions(),
	new _PageGeneratorListBackgrounds(),
	new _PageGeneratorListBestiary(),
	new _PageGeneratorListCharCreationOptions(),
	new _PageGeneratorListConditionsDiseases(),
	new _PageGeneratorListCultsBoons(),
	new _PageGeneratorListDecks(),
	new _PageGeneratorListDeities(),
	new _PageGeneratorListFeats(),
	new _PageGeneratorListItems(),
	new _PageGeneratorListTrapsHazards(),
	new _PageGeneratorListRewards(),
	new _PageGeneratorListLanguages(),
	new _PageGeneratorListObjects(),
	new _PageGeneratorListOptionalFeatures(),
	new _PageGeneratorListPsionics(),
	new _PageGeneratorListRaces(),
	new _PageGeneratorListRecipes(),
	new _PageGeneratorListSpells(),
	new _PageGeneratorListTables(),
	new _PageGeneratorListVariantRules(),
	new _PageGeneratorListVehicles(),
	new _PageGeneratorListBastions(),

	new _PageGeneratorListClasses(),
];
