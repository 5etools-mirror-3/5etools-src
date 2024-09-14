"use strict";

const CONTENTS_URL = "data/adventures.json";

window.addEventListener("load", async () => {
	BookUtil.$dispBook = $(`#pagecontent`);
	await Promise.all([
		PrereleaseUtil.pInit(),
		BrewUtil2.pInit(),
	]);
	ExcludeUtil.pInitialise().then(null); // don't await, as this is only used for search
	DataUtil.loadJSON(CONTENTS_URL).then(onJsonLoad);
});

async function onJsonLoad (data) {
	BookUtil.baseDataUrl = "data/adventure/adventure-";
	BookUtil.allPageUrl = "adventures.html";
	BookUtil.propHomebrewData = "adventureData";
	BookUtil.typeTitle = "Adventure";
	BookUtil.initLinkGrabbers();
	BookUtil.initScrollTopFloat();

	BookUtil.contentType = "adventure";

	BookUtil.bookIndex = data?.adventure || [];

	$(`#page__subtitle`).text(`Select an adventure from the list on the left`);
	$(`.book-loading-message`).text(`Select an adventure to begin`);

	BookUtil.bookIndexPrerelease = (await PrereleaseUtil.pGetBrewProcessed())?.adventure || [];
	BookUtil.bookIndexBrew = (await BrewUtil2.pGetBrewProcessed())?.adventure || [];

	window.onhashchange = BookUtil.booksHashChange.bind(BookUtil);
	await BookUtil.booksHashChange();
	window.dispatchEvent(new Event("toolsLoaded"));
}
