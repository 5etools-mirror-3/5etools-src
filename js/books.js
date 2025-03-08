import {AdventuresBooksList} from "./bookslist.js";

class BooksList extends AdventuresBooksList {
	constructor () {
		super({
			contentsUrl: "data/books.json",
			fnSort: AdventuresBooksList._sortAdventuresBooks.bind(AdventuresBooksList),
			sortByInitial: "group",
			sortDirInitial: "asc",
			dataProp: "book",
			rootPage: "book.html",
			enhanceRowDataFn: (bk) => {
				bk._pubDate = new Date(bk.published || "1970-01-01");
			},
			rowBuilderFn: (bk) => {
				return `
					<span class="ve-col-1-3 ve-text-center">${AdventuresBooksList._getGroupHtml(bk)}</span>
					<span class="ve-col-8-5 bold">${bk.name}</span>
					<span class="ve-grow ve-text-center code">${AdventuresBooksList._getDateStr(bk)}</span>
				`;
			},
		});
	}
}

const booksList = new BooksList();

function handleBrew (homebrew) {
	booksList.addData(homebrew);
	return Promise.resolve();
}

window.addEventListener("load", () => booksList.pOnPageLoad({handleBrew}));
