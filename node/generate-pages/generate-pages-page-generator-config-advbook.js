import {PageGeneratorAdventureBookBase, PageGeneratorAdventuresBooksBase} from "./generate-pages-page-generator.js";
import {HtmlGeneratorListButtons} from "./generate-pages-html-generator.js";

class _PageGeneratorAdventure extends PageGeneratorAdventureBookBase {
	_page = UrlUtil.PG_ADVENTURE;

	_pageTitle = "Adventure";
	_navbarTitle = "Adventure Details";
	_navbarDescription = "Loading...";
	_scriptIdentAdvBook = "adventure";
	_advBookPlaceholder = `Did you ever hear the tragedy of Darth Plagueis The Wise? I thought not. It's not a story the Jedi would tell you. It's a Sith legend. Darth Plagueis was a Dark Lord of the Sith, so powerful and so wise he could use the Force to influence the midichlorians to create life… He had such a knowledge of the dark side that he could even keep the ones he cared about from dying. The dark side of the Force is a pathway to many abilities some consider to be unnatural. He became so powerful… the only thing he was afraid of was losing his power, which eventually, of course, he did. Unfortunately, he taught his apprentice everything he knew, then his apprentice killed him in his sleep. Ironic. He could save others from death, but not himself.`;
}

class _PageGeneratorBook extends PageGeneratorAdventureBookBase {
	_page = UrlUtil.PG_BOOK;

	_pageTitle = "Book";
	_navbarTitle = "Book Details";
	_navbarDescription = "Loading...";
	_scriptIdentAdvBook = "book";
	_advBookPlaceholder = `What the fuck did you just fucking say about me, you little bitch? I'll have you know I graduated top of my class in the Navy Seals, and I've been involved in numerous secret raids on Al-Quaeda, and I have over 300 confirmed kills. I am trained in gorilla warfare and I'm the top sniper in the entire US armed forces. You are nothing to me but just another target. I will wipe you the fuck out with precision the likes of which has never been seen before on this Earth, mark my fucking words. You think you can get away with saying that shit to me over the Internet? Think again, fucker. As we speak I am contacting my secret network of spies across the USA and your IP is being traced right now so you better prepare for the storm, maggot. The storm that wipes out the pathetic little thing you call your life. You're fucking dead, kid. I can be anywhere, anytime, and I can kill you in over seven hundred ways, and that's just with my bare hands. Not only am I extensively trained in unarmed combat, but I have access to the entire arsenal of the United States Marine Corps and I will use it to its full extent to wipe your miserable ass off the face of the continent, you little shit. If only you could have known what unholy retribution your little "clever" comment was about to bring down upon you, maybe you would have held your fucking tongue. But you couldn't, you didn't, and now you're paying the price, you goddamn idiot. I will shit fury all over you and you will drown in it. You're fucking dead, kiddo.`;
}

class _PageGeneratorQuickref extends PageGeneratorAdventureBookBase {
	_page = UrlUtil.PG_QUICKREF;

	_pageTitle = "Quick Reference (2014)";
	_navbarTitle = "Quick Reference (2014)";
	_navbarDescription = "Browse content. Press F to find, and G to go to page.";
	_scriptIdentAdvBook = "quickreference";
	_advBookPlaceholder = `Trans rights are human rights.`;
}

class _PageGeneratorAdventures extends PageGeneratorAdventuresBooksBase {
	_page = UrlUtil.PG_ADVENTURES;

	_pageTitle = "Adventures";
	_navbarTitle = "Adventures";
	_navbarDescription = "Browse adventures by name and contents";
	_scriptIdentAdvsBooks = "adventures";
	_searchName = "adventure";

	_btnsList = [
		HtmlGeneratorListButtons.getBtn({width: "1-3", sortIdent: "group", text: "Type"}),
		HtmlGeneratorListButtons.getBtn({width: "5-5", sortIdent: "name", text: "Name"}),
		HtmlGeneratorListButtons.getBtn({width: "2-5", sortIdent: "storyline", text: "Storyline"}),
		HtmlGeneratorListButtons.getBtn({width: "1", sortIdent: "level", text: "Levels"}),
		HtmlGeneratorListButtons.getBtn({width: "1-7", sortIdent: "published", text: "Published"}),
	];
}

class _PageGeneratorBooks extends PageGeneratorAdventuresBooksBase {
	_page = UrlUtil.PG_BOOKS;

	_pageTitle = "Books";
	_navbarTitle = "Books";
	_navbarDescription = "Browse books by name and contents";
	_scriptIdentAdvsBooks = "books";
	_searchName = "book";

	_btnsList = [
		HtmlGeneratorListButtons.getBtn({width: "1-3", sortIdent: "group", text: "Type"}),
		HtmlGeneratorListButtons.getBtn({width: "8-5", sortIdent: "name", text: "Name"}),
		HtmlGeneratorListButtons.getBtn({sortIdent: "published", text: "Published"}),
	];
}

export const PAGE_GENERATORS_ADVENTURE_BOOK = [
	new _PageGeneratorAdventure(),
	new _PageGeneratorBook(),
	new _PageGeneratorQuickref(),

	new _PageGeneratorAdventures(),
	new _PageGeneratorBooks(),
];
