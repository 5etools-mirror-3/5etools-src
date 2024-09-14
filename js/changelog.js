window.addEventListener("load", async () => {
	await Promise.all([
		PrereleaseUtil.pInit(),
		BrewUtil2.pInit(),
	]);
	ExcludeUtil.pInitialise().then(null); // don't await, as this is only used for search

	DataUtil.loadJSON(`${Renderer.get().baseUrl}data/changelog.json`)
		.then(changelog => {
			const $wrp = $(`#pagecontent`).empty();
			UtilsChangelog.renderChangelog(changelog, $wrp);
		});
});
