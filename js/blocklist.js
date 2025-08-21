"use strict";

class Blocklist {
	static async pInit () {
		const data = await BlocklistUtil.pLoadData({
			isIncludePrerelease: true,
			isIncludeBrew: true,
		});
		const ui = new BlocklistUi({wrpContent: es(`#blocklist-content`), data});
		await ui.pInit();
		window.dispatchEvent(new Event("toolsLoaded"));
	}
}

window.addEventListener("load", async () => {
	await Promise.all([
		PrereleaseUtil.pInit(),
		BrewUtil2.pInit(),
	]);
	await ExcludeUtil.pInitialise();
	await Blocklist.pInit();
});
