export class ManageExternalUtils {
	static _SUBHASH_KEY_PRERELEASE = "loadExtPrerelease".toLowerCase();
	static _SUBHASH_KEY_HOMEBREW = "loadExtHomebrew".toLowerCase();

	// TODO(Future) allow this to run on other pages
	static async pAddSourcesFromHash () {
		let [, ...subs] = Hist.getHashParts();
		if (!subs.length) return;

		const subsUnpacked = subs.map(sub => UrlUtil.unpackSubHash(sub, true));

		const metas = [
			{
				brewUtil: PrereleaseUtil,
				hashKey: this._SUBHASH_KEY_PRERELEASE,
			},
			{
				brewUtil: BrewUtil2,
				hashKey: this._SUBHASH_KEY_HOMEBREW,
			},
		];

		let cntLoaded = 0;
		const errors = [];
		for (const meta of metas) {
			const sourcesObj = subsUnpacked.find(unpacked => unpacked[meta.hashKey]);
			if (!sourcesObj) continue;

			const sources = sourcesObj[meta.hashKey];
			if (!sources?.length) continue;

			JqueryUtil.doToast(`Loading ${meta.brewUtil.DISPLAY_NAME}...`);

			for (const source of sources) {
				const url = await meta.brewUtil.pGetSourceUrl(source);
				if (!url) {
					errors.push(`Could not find URL for ${meta.brewUtil.DISPLAY_NAME} source "${source}"`);
					continue;
				}

				try {
					await meta.brewUtil.pAddBrewFromUrl(url);
					cntLoaded++;
				} catch (e) {
					errors.push(e.message);
				}
			}
		}

		if (errors.length) {
			// eslint-disable-next-line no-console
			console.error(`Failed to add external content:\n${errors.map(it => `\t${it}`).join("\n")}`);
		}

		if (cntLoaded) {
			Hist.replaceHistoryHash("");
			location.reload();
		}
	}

	/* -------------------------------------------- */

	// TODO(Future) present a dialogue; allow the user to select exact brews/prereleases
	static async pGetUrl () {
		const prereleaseSources = await PrereleaseUtil.pGetUrlExportableSources();
		const brewSources = await BrewUtil2.pGetUrlExportableSources();

		const subhashPrerelease = prereleaseSources.length ? UrlUtil.packSubHash(this._SUBHASH_KEY_PRERELEASE, prereleaseSources, {isEncodeBoth: true}) : null;
		const subhashBrew = brewSources.length ? UrlUtil.packSubHash(this._SUBHASH_KEY_HOMEBREW, brewSources, {isEncodeBoth: true}) : null;

		const hash = Hist.util.getCleanHash(
			[
				HASH_BLANK,
				subhashPrerelease,
				subhashBrew,
			]
				.filter(Boolean)
				.join(HASH_PART_SEP),
		);

		return `${location.origin}/index.html#${hash}`;
	}
}
