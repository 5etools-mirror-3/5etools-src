import {ManageBrewUi} from "./utils-brew/utils-brew-ui-manage.js";

class ManagePrerelease {
	static async pInitialise () {
		return ManagePrerelease.pRender();
	}

	static async pRender () {
		const manager = new ManageBrewUi({brewUtil: PrereleaseUtil});
		return manager.pRender($(`#manager`).empty());
	}
}

window.addEventListener("load", async () => {
	await Promise.all([
		PrereleaseUtil.pInit(),
		BrewUtil2.pInit(),
	]);
	ExcludeUtil.pInitialise().then(null); // don't await, as this is only used for search
	await ManagePrerelease.pInitialise();

	window.dispatchEvent(new Event("toolsLoaded"));
});
