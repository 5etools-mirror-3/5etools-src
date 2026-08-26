import {EntityFileHandlerBase} from "./test-tags-entity-file-base.js";
import {WALKER} from "../test-tags-utils.js";

export class EntityFileHandlerAdventureBook extends EntityFileHandlerBase {
	_props = ["adventure", "book"];

	static _getStatblockHashes (chap) {
		const out = [];
		WALKER.walk(chap, {object: obj => {
			if (obj?.type !== "statblock") return obj;

			const prop = obj.prop || Parser.getTagProps(obj.tag)[0];
			if (prop?.endsWith("Fluff")) return obj;

			const page = obj.prop || Renderer.tag.getPage(obj.tag);
			const source = Parser.getTagSource(obj.tag, obj.source);

			out.push(obj.hash || UrlUtil.URL_TO_HASH_BUILDER[page]({...obj, source}));

			return obj;
		}});
		return out;
	}

	async _pDoTestEntity ({filePath, ent, prop}) {
		const page = DataLoader.getPropPage(prop);
		const hash = UrlUtil.getHashBuilder(page)({id: ent.id});
		const corpus = await DataLoader.pCacheAndGet(page, ent.source, hash);

		const chapters = corpus?.[`${prop}Data`]?.data;
		if (!chapters) {
			this._addMessage(`Could not load ${prop} data for "${ent.id}" in file ${filePath}\n`);
			return;
		}

		ent.contents
			.forEach((chapter, ixChapter) => {
				const hashes = this.constructor._getStatblockHashes(chapters[ixChapter]);

				(chapter.headers || [])
					.filter(header => header.statblock)
					.forEach(header => {
						const hash = UrlUtil.URL_TO_HASH_GENERIC({
							name: header.header,
							source: header.source || ent.source,
						});

						const count = hashes.filter(hash_ => hash_ === hash).length;
						if (count === 1) return;

						this._addMessage(`Invalid statblock header link: ${ent.id} chapter ${ixChapter} header "${header.header}" (evaluates to "${VeCt.HASH_PREFIX_STATS_SCROLLER}${hash}") matched ${count} statblocks in file ${filePath} (expected exactly 1)\n`);
					});
			});
	}
}
