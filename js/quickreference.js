import {BookUtil} from "./bookutils.js";

// NOTE: This file is generated with the Node script `generate-quick-reference.js`
const JSON_URL = "data/generated/bookref-quick.json";

let reference;

window.addEventListener("load", async () => {
	BookUtil.dispBook = es(`#pagecontent`);

	if (!window.location.hash.length) {
		BookUtil.dispBook
			.empty()
			.html(`${Renderer.utils.getBorderTr()}
			<tr><td colspan="6" class="initial-message initial-message--med">Select a section to begin</td></tr>
			${Renderer.utils.getBorderTr()}`);
	}

	await Promise.all([
		PrereleaseUtil.pInit(),
		BrewUtil2.pInit(),
	]);
	await ExcludeUtil.pInitialise();
	DataUtil.loadJSON(JSON_URL).then(onJsonLoad);
});

async function onJsonLoad (data) {
	reference = [data.reference["bookref-quick"]];
	BookUtil.contentType = "document";

	BookUtil.isDefaultExpandedContents = true;
	BookUtil.baseDataUrl = "data/generated/";
	BookUtil.bookIndex = reference;
	BookUtil.referenceId = "bookref-quick";
	BookUtil.typeTitle = "Quick Reference (2014)";
	await BookUtil.pInit();

	window.onhashchange = BookUtil.booksHashChange.bind(BookUtil);
	if (window.location.hash.length) {
		await BookUtil.booksHashChange();
	} else {
		window.location.hash = "#bookref-quick";
	}

	window.dispatchEvent(new Event("toolsLoaded"));
}
