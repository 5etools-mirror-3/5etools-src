window.addEventListener("load", async () => {
	await Promise.all([
		PrereleaseUtil.pInit(),
		BrewUtil2.pInit(),
	]);
	ExcludeUtil.pInitialise().then(null); // don't await, as this is only used for search

	const changelog = await DataUtil.loadJSON(`${Renderer.get().baseUrl}data/changelog.json`);
	const wrp = es(`#pagecontent`).empty();
	UtilsChangelog.renderChangelog(changelog, wrp);

	window.dispatchEvent(new Event("toolsLoaded"));
});
