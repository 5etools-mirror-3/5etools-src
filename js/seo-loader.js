import {RenderBestiary} from "./render-bestiary.js";
import {RenderSpells} from "./render-spells.js";
import {RenderItems} from "./render-items.js";

const onLoadSeo = async () => {
	const fullPage = `${globalThis._SEO_PAGE}.html`;
	const it = await DataLoader.pCacheAndGet(fullPage, globalThis._SEO_SOURCE, globalThis._SEO_HASH);

	document.title = `${it.name} - 5etools`;
	$(`.page__title`).text(`${globalThis._SEO_PAGE.toTitleCase()}: ${it.name}`);

	$(`<div class="ve-col-12 ve-flex-vh-center my-2 pt-3 no-print">
		<button class="ve-btn ve-btn-primary">
			<a href="/${globalThis._SEO_PAGE}.html" style="font-size: 1.7em; color: white;">${globalThis._SEO_STYLE === 1 ? `View All` : `View Complete`} ${globalThis._SEO_PAGE.toTitleCase()}</a>
		</button>
	</div>`).appendTo($(`#link-page`));

	const $wrpContent = $(`#wrp-pagecontent`);

	const $content = $(`#pagecontent`).addClass("shadow-big").empty();

	$(`.nav__link`).each((i, e) => {
		const $e = $(e);
		const href = $e.attr("href");
		if (!href.startsWith("http") && href.endsWith(".html")) $e.attr("href", `../${href}`);

		if (href.startsWith("https://wiki.tercept.net")) $e.remove();
	});

	switch (globalThis._SEO_PAGE) {
		case "spells": $content.append(RenderSpells.$getRenderedSpell(it)); break;
		case "bestiary": {
			Renderer.utils.bindPronounceButtons();
			$content.append(RenderBestiary.$getRenderedCreature(it, {isSkipTokenRender: true}));
			break;
		}
		case "items": $content.append(RenderItems.$getRenderedItem(it)); break;

		// TODO expand this as required
		// case "races": {
		// 	Renderer.utils.bindPronounceButtons();
		// 	break;
		// }
	}

	if (globalThis._SEO_FLUFF) {
		const fluff = await DataLoader.pCacheAndGet(`${fullPage}fluff`, globalThis._SEO_SOURCE, globalThis._SEO_HASH);
		if (fluff) {
			$$`<div class="mt-5 py-2">
				${Renderer.hover.$getHoverContent_fluff(globalThis._SEO_PAGE, fluff, null, {isSkipNameRow: true, isSkipPageRow: true}).addClass("shadow-big stats--book stats--book-large")}
			</div>`.insertAfter($wrpContent);
		}
	}
};

window.addEventListener("load", () => {
	// Attempt to sneak this in before the navigation onload fires
	Renderer.get().setBaseUrl("/");
	onLoadSeo().then(null);
});
