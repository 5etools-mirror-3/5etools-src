import {BookUtil} from "./bookutils.js";

const JSON_URL = "data/books.json";

window.addEventListener("load", async () => {
	BookUtil.dispBook = es(`#pagecontent`);
	await Promise.all([
		PrereleaseUtil.pInit(),
		BrewUtil2.pInit(),
	]);
	ExcludeUtil.pInitialise().then(null); // don't await, as this is only used for search
	DataUtil.loadJSON(JSON_URL).then(onJsonLoad);
});

async function onJsonLoad (data) {
	BookUtil.baseDataUrl = "data/book/book-";
	BookUtil.allPageUrl = "books.html";
	BookUtil.propHomebrewData = "bookData";
	BookUtil.typeTitle = "Book";
	await BookUtil.pInit();

	BookUtil.contentType = "book";

	BookUtil.bookIndex = data?.book || [];

	es(`#page__subtitle`).txt(`Select a book from the list on the left`);
	es(`.book-loading-message`).txt(`Select a book to begin`);

	BookUtil.bookIndexPrerelease = (await PrereleaseUtil.pGetBrewProcessed())?.book || [];
	BookUtil.bookIndexBrew = (await BrewUtil2.pGetBrewProcessed())?.book || [];

	window.onhashchange = BookUtil.booksHashChange.bind(BookUtil);
	await BookUtil.booksHashChange();
	window.dispatchEvent(new Event("toolsLoaded"));
}
