import {DataTesterBase} from "5etools-utils";
import {WALKER} from "./test-tags-utils.js";
import {isSiteFoundryFile} from "../../node/util.js";

export class FoundryUuidCheck extends DataTesterBase {
	static _RE_CUSTOM_ID = /^@(?<tag>[a-z][a-zA-Z]+)\[(?<uid>[^\]]+)]$/;

	constructor ({tagTestUrlLookup}) {
		super();
		this._tagTestUrlLookup = tagTestUrlLookup;
	}

	registerParsedFileCheckers (parsedJsonChecker) {
		parsedJsonChecker.registerFileHandler(this);
	}

	async pHandleFile (filePath, contents) {
		if (!isSiteFoundryFile(filePath)) return;

		const uidInfos = [];
		WALKER.walk(contents, {string: str => {
			const m = this.constructor._RE_CUSTOM_ID.exec(str);
			if (!m) return str;

			const {tag, uid} = m.groups;
			uidInfos.push({str, tag, uid});

			return str;
		}});

		await uidInfos
			.pSerialAwaitMap(async ({str, tag, uid}) => {
				let tagMeta;
				try {
					tagMeta = Renderer.utils.getTagMeta(`@${tag}`, uid);
				} catch (e) {
					this._addMessage(`Invalid Foundry UID link: ${str} in file ${filePath} (${e.message})\n`);
					return;
				}

				const ent = await DataLoader.pCacheAndGet(tagMeta.page, tagMeta.source, tagMeta.hash);
				if (ent) return;

				const url = this._tagTestUrlLookup.getEncodedProxy(uid, tag);
				this._addMessage(`Missing link: ${str} in file ${filePath} (evaluates to "${url}")\n${this._tagTestUrlLookup.getLogPtSimilarUrls({url})}`);
			});
	}
}
