/**
 * Generator script which creates stub per-entity pages for SEO.
 */

import fs from "fs";
import "../js/parser.js";
import "../js/utils.js";
import "../js/utils-dataloader.js";
import "../js/utils-config.js";
import "../js/render.js";
import "../js/render-dice.js";
import * as ut from "./util.js";

const BASE_SITE_URL = process.env.VET_BASE_SITE_URL || "https://5e.tools/";
const LOG_EVERY = 1000; // Certain stakeholders prefer less logspam
const isSkipUaEtc = !!process.env.VET_SEO_IS_SKIP_UA_ETC;
const isOnlyVanilla = !!process.env.VET_SEO_IS_ONLY_VANILLA;

const templateHeadInner = fs.readFileSync("node/generate-pages/template/seo/template-seo-index-head-inner.hbs");
const templateBody = fs.readFileSync("node/generate-pages/template/seo/template-seo-index-body.hbs");

const lastMod = (() => {
	const date = new Date();
	return `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, "0")}-${`${date.getDate()}`.padStart(2, "0")}`;
})();

const baseSitemapData = (() => {
	const out = {};

	// Scrape all the links from navigation.js -- avoid any unofficial HTML files which might exist
	const navText = fs.readFileSync("./js/navigation.js", "utf-8");
	navText.replace(/(?:"([^"]+\.html)"|'([^']+)\.html'|`([^`]+)\.html`)/gi, (...m) => {
		const str = m[1] || m[2] || m[3];
		if (str.includes("${")) return;
		out[str] = true;
	});

	return out;
})();

const getTemplate = ({page, name, source, hash, img, description, isFluff}) => `<!DOCTYPE html><head>
${templateHeadInner}
<meta property="og:title" content="${name}">
<meta property="og:url" content="${BASE_SITE_URL}${page}.html#${hash}">
${img ? `<meta property="og:image" content="${BASE_SITE_URL}${img.qq()}">` : ""}
${description ? `<meta  name="og:description" content="${description.qq()}">` : ""}
<script>globalThis._SEO_PAGE="${page}";globalThis._SEO_SOURCE="${source}";globalThis._SEO_HASH="${hash}";globalThis._SEO_FLUFF=${isFluff}</script>
</head>
${templateBody}
</html>`;

const filterSkipUaEtc = (ent) => !isSkipUaEtc || !SourceUtil.isNonstandardSourceWotc(SourceUtil.getEntitySource(ent));

const filterOnlyVanilla = (ent) => !isOnlyVanilla || Parser.SOURCES_VANILLA.has(SourceUtil.getEntitySource(ent));

const _DESCRIPTION_WALKER = MiscUtil.getWalker({isNoModification: true, isBreakOnReturn: true, keyBlocklist: MiscUtil.GENERIC_WALKER_ENTRIES_KEY_BLOCKLIST});

const getGenericDescription = ({fluff, entries}) => {
	// Prefer fluff, where provided
	const entriesAvailable = fluff?.entries || entries;
	if (!entriesAvailable?.length) return null;

	if (typeof entriesAvailable[0] === "string") return Renderer.stripTags(entriesAvailable[0]);

	let strPrime;
	_DESCRIPTION_WALKER.walk(entriesAvailable, {string: str => {
		strPrime = str;
		return true;
	}});
	if (!strPrime) return null;

	return Renderer.stripTags(strPrime);
};

const toGenerate = [
	{
		page: "spells",
		pGetEntityMetas: async () => {
			const entities = (await DataUtil.spell.pLoadAll())
				.filter(filterSkipUaEtc)
				.filter(filterOnlyVanilla);
			return entities.pSerialAwaitMap(async ent => ({
				entity: ent,
				fluff: await Renderer.spell.pGetFluff(ent),
				// Avoid fluff for description, as generally not useful
				description: getGenericDescription({entries: ent.entries}),
			}));
		},
		isFluff: 1,
	},
	{
		page: "bestiary",
		pGetEntityMetas: async () => {
			const entities = (await DataUtil.monster.pLoadAll())
				.filter(filterSkipUaEtc)
				.filter(filterOnlyVanilla);
			return entities.pSerialAwaitMap(async ent => {
				const fluff = await Renderer.monster.pGetFluff(ent);
				return {
					entity: ent,
					fluff,
					img: Renderer.monster.hasToken(ent) ? Renderer.monster.getTokenUrl(ent) : null,
					description: getGenericDescription({fluff, entries: ent.entries}),
				};
			});
		},
		isFluff: 1,
	},
	{
		page: "items",
		pGetEntityMetas: async () => {
			const entities = (await Renderer.item.pBuildList()).filter(it => !it._isItemGroup)
				.filter(filterSkipUaEtc)
				.filter(filterOnlyVanilla);
			return entities.pSerialAwaitMap(async ent => ({
				entity: ent,
				fluff: await Renderer.item.pGetFluff(ent),
				// Avoid fluff for description, as generally not useful
				description: getGenericDescription({entries: ent._fullEntries || ent.entries}),
			}));
		},
		isFluff: 1,
	},

	// TODO expand this as required
];

const siteMapData = {};

async function main () {
	ut.patchLoadJson();

	let total = 0;
	console.log(`Generating SEO pages...`);
	await Promise.all(toGenerate.map(async meta => {
		try {
			fs.mkdirSync(`./${meta.page}`, { recursive: true });
		} catch (err) {
			if (err.code !== "EEXIST") throw err;
		}

		const entityMetas = await meta.pGetEntityMetas();
		const builder = UrlUtil.URL_TO_HASH_BUILDER[`${meta.page}.html`];
		entityMetas.forEach(({entity, fluff, img, description}) => {
			let offset = 0;
			let html;
			let path;
			while (true) {
				const hash = builder(entity);
				const sluggedHash = UrlUtil.getSluggedHash(hash);
				path = `${meta.page}/${sluggedHash}${offset ? `-${offset}` : ""}.html`;
				if (siteMapData[path]) {
					++offset;
					continue;
				}

				if (!img && fluff?.images?.length) {
					img = Renderer.utils.getEntryMediaUrl(fluff.images[0], "href", "img");
				}

				html = getTemplate({
					page: meta.page,
					name: entity.name,
					source: entity.source,
					hash,
					img,
					description,
					textStyle: meta.style,
					isFluff: meta.isFluff,
				});

				siteMapData[path] = true;
				break;
			}

			if (offset > 0) console.warn(`\tDeduplicated URL using suffix: ${path}`);

			fs.writeFileSync(`./${path}`, html, "utf-8");

			total++;
			if (total % LOG_EVERY === 0) console.log(`Wrote ${total} files...`);
		});
	}));
	console.log(`Wrote ${total} files.`);

	let sitemapLinkCount = 0;
	let sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n`;
	sitemap += `<urlset xmlns="https://www.sitemaps.org/schemas/sitemap/0.9">\n`;

	sitemap += `<url>
	<loc>${BASE_SITE_URL}</loc>
	<lastmod>${lastMod}</lastmod>
	<changefreq>monthly</changefreq>
</url>\n`;
	sitemapLinkCount++;

	Object.keys(baseSitemapData).forEach(url => {
		sitemap += `<url>
	<loc>${BASE_SITE_URL}${url}</loc>
	<lastmod>${lastMod}</lastmod>
	<changefreq>monthly</changefreq>
</url>\n`;
		sitemapLinkCount++;
	});

	Object.keys(siteMapData).forEach(url => {
		sitemap += `<url>
	<loc>${BASE_SITE_URL}${url}</loc>
	<lastmod>${lastMod}</lastmod>
	<changefreq>weekly</changefreq>
</url>\n`;
		sitemapLinkCount++;
	});

	sitemap += `</urlset>\n`;

	fs.writeFileSync("./sitemap.xml", sitemap, "utf-8");
	console.log(`Wrote ${sitemapLinkCount.toLocaleStringVe()} URL${sitemapLinkCount === 1 ? "" : "s"} to sitemap.xml`);

	ut.unpatchLoadJson();
}

main().then(() => console.log(`SEO page generation complete.`)).catch(e => console.error(e));
