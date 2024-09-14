"use strict";

class Hist {
	static lastLoadedLink = null;
	static _lastUnknownLink = null;
	static lastLoadedId = null;
	static initialLoad = true;
	static isHistorySuppressed = false;
	static _pLoadingUnknownHash = null;

	static _pHandleUnknownHash = null;
	static _pLoadHash = null;
	static _pLoadSubHash = null;

	static setFnHandleUnknownHash (fn) { this._pHandleUnknownHash = fn; }
	static setFnLoadHash (fn) { this._pLoadHash = fn; }
	static setFnLoadSubhash (fn) { this._pLoadSubHash = fn; }

	static hashChange ({isForceLoad, isBlankFilterLoad = false} = {}) {
		if (this.isHistorySuppressed) return this.setSuppressHistory(false);

		const [link, ...sub] = this.getHashParts();

		if (link !== this.lastLoadedLink || sub.length === 0 || isForceLoad) {
			this.lastLoadedLink = link;
			if (link === HASH_BLANK) {
				isBlankFilterLoad = true;
			} else {
				const listItem = this.getActiveListItem(link);

				if (listItem == null) {
					if (typeof this._pHandleUnknownHash === "function" && window.location.hash.length && this._lastUnknownLink !== link) {
						this._lastUnknownLink = link;
						this._pLoadingUnknownHash = this._pHandleUnknownHash(link, sub);
						return;
					} else {
						this._freshLoad();
						return;
					}
				}

				const toLoad = listItem.ix;
				if (toLoad === undefined) this._freshLoad();
				else {
					this.lastLoadedId = listItem.ix;
					this._pLoadHash(listItem.ix);
					document.title = `${listItem.name ? `${listItem.name} - ` : ""}5etools`;
				}
			}
		}

		if (typeof this._pLoadSubHash === "function" && (sub.length > 0 || isForceLoad)) this._pLoadSubHash(sub);
		if (isBlankFilterLoad) this._freshLoad();
	}

	static init (initialLoadComplete) {
		window.onhashchange = () => Hist.hashChange({isForceLoad: true});
		if (window.location.hash.length) {
			Hist.hashChange();
		} else {
			Hist._freshLoad();
		}
		if (initialLoadComplete) Hist.initialLoad = false;
	}

	/**
	 * Allows the hash to be modified without triggering a hashchange
	 * @param val
	 */
	static setSuppressHistory (val) {
		Hist.isHistorySuppressed = val;
	}

	static _listPage = null;

	static setListPage (listPage) { this._listPage = listPage; }

	static getSelectedListItem () {
		const [link] = Hist.getHashParts();
		return Hist.getActiveListItem(link);
	}

	static getSelectedListElementWithLocation () {
		const [link] = Hist.getHashParts();
		return Hist.getActiveListItem(link, true);
	}

	static getHashParts () {
		return Hist.util.getHashParts(window.location.hash);
	}

	static getActiveListItem (link, getIndex) {
		const primaryLists = this._listPage.primaryLists;
		if (primaryLists && primaryLists.length) {
			for (let x = 0; x < primaryLists.length; ++x) {
				const list = primaryLists[x];

				const foundItemIx = list.items.findIndex(it => it.values.hash === link);
				if (~foundItemIx) {
					if (getIndex) return {item: list.items[foundItemIx], x: x, y: foundItemIx, list};
					return list.items[foundItemIx];
				}
			}
		}
	}

	static _freshLoad () {
		// Wait for any unknown hash handling to resolve. This avoids the case where an async homebrew load
		//   fails to reload the page, as the hash was over-eagerly reset while the load took place.
		(this._pLoadingUnknownHash || Promise.resolve())
			.then(() => {
				// defer this, in case the list needs to filter first
				setTimeout(() => {
					const goTo = $("#listcontainer").find(".list a").attr("href");
					if (goTo) {
						const parts = location.hash.split(HASH_PART_SEP);
						const fullHash = `${goTo}${parts.length > 1 ? `${HASH_PART_SEP}${parts.slice(1).join(HASH_PART_SEP)}` : ""}`;
						location.replace(fullHash);
					}
				}, 1);
			});
	}

	/**
	 * Avoid "stuck brew" loops which can occur via:
	 *  - user is viewing a homebrew statblock; hash has homebrew source
	 *  - user deletes that homebrew; page reloads
	 *  - "unknown hash" flow triggers for that hash; deleted homebrew is re-loaded by source; page reloads
	 *  - user is presented with the same statblock, from the source they just tried to delete.
	 */
	static doPreLocationReload () {
		const [link] = this.getHashParts();
		if (link === HASH_BLANK) return;

		const {source} = UrlUtil.autoDecodeHash(link);
		if (!source) return;

		// If the hash has a site source, do nothing; site data is always present...
		if (Parser.hasSourceJson(source)) return;

		// ...if the hash has a prerelease/homebrew source, and that source exists, do nothing...
		if (
			[PrereleaseUtil, BrewUtil2]
				.some(brewUtil => brewUtil.hasSourceJson(source))
		) return;

		// ...otherwise, the hash must be from a prerelease/homebrew source which does not exist (i.e. the user just deleted it); wipe the hash.
		// If the source does not exist for some other reason, this is still fine, as we assume that the hash is un-loadable anyway.
		window.location.hash = "";
	}

	static cleanSetHash (toSet) {
		window.location.hash = Hist.util.getCleanHash(toSet);
	}

	static getHashSource () {
		const [link] = Hist.getHashParts();
		// by convention, the source is the last hash segment
		return link ? link.split(HASH_LIST_SEP).last() : null;
	}

	static getSubHash (key) {
		return Hist.util.getSubHash(window.location.hash, key);
	}

	/**
	 * Sets a subhash with the key specified, overwriting any existing.
	 * @param key Subhash key.
	 * @param val Subhash value. Passing a nully object removes the k/v pair.
	 */
	static setSubhash (key, val) {
		const nxtHash = Hist.util.setSubhash(window.location.hash, key, val);
		Hist.cleanSetHash(nxtHash);
	}

	static setMainHash (hash) {
		const subHashPart = Hist.util.getHashParts(window.location.hash, key, val).slice(1).join(HASH_PART_SEP);
		Hist.cleanSetHash([hash, subHashPart].filter(Boolean).join(HASH_PART_SEP));
	}

	static replaceHistoryHash (hash) {
		window.history.replaceState(
			{},
			document.title,
			`${location.origin}${location.pathname}${hash ? `#${hash}` : ""}`,
		);
	}
}

Hist.util = class {
	static getCleanHash (hash) {
		return hash.replace(/,+/g, ",").replace(/,$/, "").toLowerCase();
	}

	static _SYMS_NO_ENCODE = [/(,)/g, /(:)/g, /(=)/g];

	static getHashParts (location, {isReturnEncoded = false} = {}) {
		if (location[0] === "#") location = location.slice(1);

		// Handle junk from external ads
		if (location === "google_vignette") location = "";

		if (isReturnEncoded) {
			return location
				.split(HASH_PART_SEP);
		}

		// region Normalize encoding
		let pts = [location];
		this._SYMS_NO_ENCODE.forEach(re => {
			pts = pts.map(pt => pt.split(re)).flat();
		});
		pts = pts.map(pt => {
			if (this._SYMS_NO_ENCODE.some(re => re.test(pt))) return pt;
			return decodeURIComponent(pt).toUrlified();
		});
		location = pts.join("");
		// endregion

		return location
			.split(HASH_PART_SEP);
	}

	static getSubHash (location, key) {
		const [link, ...sub] = Hist.util.getHashParts(location);
		const hKey = `${key}${HASH_SUB_KV_SEP}`;
		const part = sub.find(it => it.startsWith(hKey));
		if (part) return part.slice(hKey.length);
		return null;
	}

	static setSubhash (location, key, val) {
		if (key.endsWith(HASH_SUB_KV_SEP)) key = key.slice(0, -1);

		const [link, ...sub] = Hist.util.getHashParts(location);
		if (!link) return "";

		const hKey = `${key}${HASH_SUB_KV_SEP}`;
		const out = [link];
		if (sub.length) sub.filter(it => !it.startsWith(hKey)).forEach(it => out.push(it));
		if (val != null) out.push(`${hKey}${val}`);

		return Hist.util.getCleanHash(out.join(HASH_PART_SEP));
	}
};

globalThis.Hist = Hist;
