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

			const urlInfoResults = await Promise.allSettled(sources.map(async source => ({
				url: await meta.brewUtil.pGetSourceUrl(source),
				source,
			})));

			const [urlInfosFound, urlInfosNotFound] = urlInfoResults
				.segregate(result => result.status === "fulfilled" && result.value.url != null)
				.map(arr => arr.map(result => result.value));
			urlInfosNotFound
				.forEach(({source}) => errors.push(`Could not find URL for ${meta.brewUtil.DISPLAY_NAME} source "${source}"`));

			await Promise.allSettled(urlInfosFound.map(async urlInfo => {
				await meta.brewUtil.pAddBrewFromUrl(urlInfo.url, {isLazy: true});
				cntLoaded++;
			}));
			await meta.brewUtil.pAddBrewsLazyFinalize();
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

	/* -------------------------------------------- */

	static isLoadExternalUrl (url) {
		return url.includes(HASH_BLANK) && (url.includes(this._SUBHASH_KEY_PRERELEASE) || url.includes(this._SUBHASH_KEY_HOMEBREW));
	}
}
