import {EntityFileHandlerBase} from "./test-tags-entity-file-base.js";

export class EntityFileHandlerFoundrySpells extends EntityFileHandlerBase {
	_props = ["foundrySpell"];

	static _RE_CUSTOM_ID = /^@(?<tag>[a-z][a-zA-Z]+)\[(?<text>[^\]]+)]$/;

	async _pDoTestEntity ({filePath, fileState, ent, prop, propPrefixed}) {
		this._testFoundryActivities(filePath, ent);

		const summonProfiles = MiscUtil.get(ent, "system", "summons", "profiles");
		if (!summonProfiles?.length) return;

		await summonProfiles
			.pSerialAwaitMap(async profile => {
				const {tag, text} = this.constructor._RE_CUSTOM_ID.exec(profile.uuid).groups;
				const {name, page, source, hash} = Renderer.utils.getTagMeta(`@${tag}`, text);
				const ent = await DataLoader.pCacheAndGet(page, source, hash);
				if (ent) return;

				const url = this._tagTestUrlLookup.getEncodedProxy(text, tag);
				this._addMessage(`Missing link: ${name} in file ${filePath} "system.summons.profiles" (evaluates to "${url}")\n${this._tagTestUrlLookup.getLogPtSimilarUrls({url})}`);
			});
	}
}
