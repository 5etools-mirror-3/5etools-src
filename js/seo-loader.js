import {RenderBestiary} from "./render-bestiary.js";
import {RenderSpells} from "./render-spells.js";
import {RenderItems} from "./render-items.js";

const onLoadSeo = async () => {
	const fullPage = `${globalThis._SEO_PAGE}.html`;
	const it = await DataLoader.pCacheAndGet(fullPage, globalThis._SEO_SOURCE, globalThis._SEO_HASH);

	document.title = `${it.name} - 5etools`;
	es(`.page__title`).txt(`${globalThis._SEO_PAGE.toTitleCase()}: ${it.name}`);

	ee`<div class="ve-col-12 ve-flex-vh-center ve-my-2 ve-pt-3 no-print">
		<button class="ve-btn ve-btn-primary">
			<a href="/${globalThis._SEO_PAGE}.html" style="font-size: 1.7em; color: white;">View All</a>
		</button>
	</div>`.appendTo(es(`#link-page`));

	const wrpContent = es(`#wrp-pagecontent`);

	const eleContent = es(`#pagecontent`).addClass("shadow-big").empty();

	em(`.nav__link`)
		.forEach((ele) => {
			const href = ele.attr("href");
			if (!href.startsWith("http") && href.endsWith(".html")) ele.attr("href", `../${href}`);

			if (href.startsWith("https://wiki.tercept.net")) ele.remove();
		});

	switch (globalThis._SEO_PAGE) {
		case "spells": eleContent.appends(RenderSpells.getRenderedSpell(it, {isSkipExcludesRender: true})); break;
		case "bestiary": {
			Renderer.utils.bindPronounceButtons();
			eleContent.appends(RenderBestiary.getRenderedCreature(it, {isSkipTokenRender: true, isSkipExcludesRender: true}));
			break;
		}
		case "items": eleContent.appends(RenderItems.getRenderedItem(it, {isSkipExcludesRender: true})); break;

		// TODO expand this as required
		// case "races": {
		// 	Renderer.utils.bindPronounceButtons();
		// 	break;
		// }
	}

	if (globalThis._SEO_FLUFF) {
		const fluff = await DataLoader.pCacheAndGet(`${fullPage}fluff`, globalThis._SEO_SOURCE, globalThis._SEO_HASH);
		if (fluff) {
			const eleFluff = Renderer.hover.getHoverContent_fluff(globalThis._SEO_PAGE, fluff, null, {isSkipNameRow: true, isSkipPageRow: true})
				.addClass("shadow-big")
				.addClass("ve-stats--book")
				.addClass("ve-stats--book-large");
			ee`<div class="ve-mt-5 ve-py-2">${eleFluff}</div>`.insertAfter(wrpContent);
		}
	}
};

window.addEventListener("load", () => {
	onLoadSeo().then(null);
});
