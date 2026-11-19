import {BookUtil} from "./bookutils.js";

// NOTE: File is generated with the Node script `generate-quick-reference.js`

let reference;

window.addEventListener("load", async () => {
	BookUtil.dispBook = veEs(`#pagecontent`);

	if (!window.location.hash.length) {
		BookUtil.dispBook
			.vee.empty()
			.vee.html(`${Renderer.utils.getBorderTr()}
			<tr><td colspan="6" class="initial-message initial-message--med">Select a section to begin</td></tr>
			${Renderer.utils.getBorderTr()}`);
	}

	await Promise.all([
		PrereleaseUtil.pInit(),
		BrewUtil2.pInit(),
	]);
	await ExcludeUtil.pInitialise();
	DataUtil.quickreference.loadJSON().then(onJsonLoad);
});

async function onJsonLoad (data) {
	reference = [data.reference["bookref-quick"]];
	BookUtil.contentType = "document";

	BookUtil.isDefaultExpandedContents = true;
	BookUtil.bookIndex = reference;
	BookUtil.referenceId = "bookref-quick";
	BookUtil.typeTitle = "Quick Reference (5e/2014)";
	await BookUtil.pInit();

	window.onhashchange = BookUtil.booksHashChange.bind(BookUtil);
	if (window.location.hash.length) {
		await BookUtil.booksHashChange();
	} else {
		window.location.hash = "#bookref-quick";
	}

	window.dispatchEvent(new Event("toolsLoaded"));
}
