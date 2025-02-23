import {ManageExternalUtils} from "./manageexternal/manageexternal-utils.js";

class IndexPage {
	static async _pOnLoad_pInitGeneric () {
		await Promise.all([
			PrereleaseUtil.pInit(),
			BrewUtil2.pInit(),
		]);
		ExcludeUtil.pInitialise().then(null);
	}

	static _pOnLoad_initElements () {
		es(`#current_year`).txt((new Date()).getFullYear());

		es(`#version_number`).txt(VERSION_NUMBER).attr("href", `https://github.com/5etools-mirror-3/5etools-src/releases/latest`);

		es(`#wrp-patreon`)
			.html(`<a href="https://www.patreon.com/bePatron?u=22018559" rel="noopener noreferrer"><img src="${Renderer.get().getMediaUrl("img", "patreon.webp")}" alt="Become a Patron" style="width: 217px; height: 51px"></a>`);

		const lnkB20 = es(`#betteR20_link`);
		lnkB20.attr("href", `${lnkB20.attr("href")}?v=${VERSION_NUMBER}_${Date.now()}`);

		window.__cmp2 = () => {
			alert("This only works on a live version of the site!");
		};
	}

	static async _pOnLoad_pAddHashChangeListener () {
		window.addEventListener("hashchange", () => this._pOnHashChange());
		await this._pOnHashChange();
	}

	static async pOnLoad () {
		await this._pOnLoad_pInitGeneric();
		this._pOnLoad_initElements();
		await this._pOnLoad_pAddHashChangeListener();

		window.dispatchEvent(new Event("toolsLoaded"));
	}

	/* -------------------------------------------- */

	static _HASHCHANGE_LOCK = null;

	static async _pOnHashChange () {
		this._HASHCHANGE_LOCK ||= new VeLock();
		try {
			await this._HASHCHANGE_LOCK.pLock();
			await this._pOnHashChange_();
		} finally {
			this._HASHCHANGE_LOCK.unlock();
		}
	}

	static async _pOnHashChange_ () {
		await ManageExternalUtils.pAddSourcesFromHash();
	}
}

window.addEventListener("load", () => IndexPage.pOnLoad());
