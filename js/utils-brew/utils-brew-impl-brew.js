import {BrewUtil2Base} from "./utils-brew-base.js";
import {BrewDoc} from "./utils-brew-models.js";

export class BrewUtil2_ extends BrewUtil2Base {
	_STORAGE_KEY_LEGACY = "HOMEBREW_STORAGE";
	_STORAGE_KEY_LEGACY_META = "HOMEBREW_META_STORAGE";

	// Keep these distinct from the OG brew key, so users can recover their old brew if required.
	_STORAGE_KEY = "HOMEBREW_2_STORAGE";
	_STORAGE_KEY_META = "HOMEBREW_2_STORAGE_METAS";

	_STORAGE_KEY_CUSTOM_URL = "HOMEBREW_CUSTOM_REPO_URL";
	_STORAGE_KEY_MIGRATION_VERSION = "HOMEBREW_2_STORAGE_MIGRATION";

	_VERSION = 2;

	_PATH_LOCAL_DIR = "homebrew";
	_PATH_LOCAL_INDEX = VeCt.JSON_BREW_INDEX;

	IS_EDITABLE = true;
	PAGE_MANAGE = UrlUtil.PG_MANAGE_BREW;
	URL_REPO_DEFAULT = VeCt.URL_BREW;
	URL_REPO_ROOT_DEFAULT = VeCt.URL_ROOT_BREW;
	DISPLAY_NAME = "homebrew";
	DISPLAY_NAME_PLURAL = "homebrews";
	DEFAULT_AUTHOR = "";
	STYLE_BTN = "ve-btn-info";
	IS_PREFER_DATE_ADDED = true;

	/* -------------------------------------------- */

	_pInit_doBindDragDrop () {
		document.body.addEventListener("drop", async evt => {
			if (EventUtil.isInInput(evt)) return;

			evt.stopPropagation();
			evt.preventDefault();

			const files = evt.dataTransfer?.files;
			if (!files?.length) return;

			const pFiles = [...files].map((file, i) => {
				if (!/\.json$/i.test(file.name)) return null;

				return new Promise(resolve => {
					const reader = new FileReader();
					reader.onload = () => {
						let json;
						try {
							json = JSON.parse(reader.result);
						} catch (ignored) {
							return resolve(null);
						}

						resolve({name: file.name, json});
					};

					reader.readAsText(files[i]);
				});
			});

			const fileMetas = (await Promise.allSettled(pFiles))
				.filter(({status}) => status === "fulfilled")
				.map(({value}) => value)
				.filter(Boolean);

			await this.pAddBrewsFromFiles(fileMetas);

			if (this.isReloadRequired()) this.doLocationReload();
		});

		document.body.addEventListener("dragover", evt => {
			if (EventUtil.isInInput(evt)) return;

			evt.stopPropagation();
			evt.preventDefault();
		});
	}

	/* -------------------------------------------- */

	async pGetSourceIndex (urlRoot) { return DataUtil.brew.pLoadSourceIndex(urlRoot); }

	getFileUrl (path, urlRoot) { return DataUtil.brew.getFileUrl(path, urlRoot); }

	pLoadTimestamps (urlRoot) { return DataUtil.brew.pLoadTimestamps(urlRoot); }

	pLoadPropIndex (urlRoot) { return DataUtil.brew.pLoadPropIndex(urlRoot); }

	pLoadMetaIndex (urlRoot) { return DataUtil.brew.pLoadMetaIndex(urlRoot); }

	pLoadAdventureBookIdsIndex (urlRoot) { return DataUtil.brew.pLoadAdventureBookIdsIndex(urlRoot); }

	/* -------------------------------------------- */

	// region Editable
	async pGetEditableBrewDoc () {
		return this._findEditableBrewDoc({brewRaw: await this._pGetBrewRaw()});
	}

	_findEditableBrewDoc ({brewRaw}) {
		return brewRaw.find(it => it.head.isEditable);
	}

	async pGetOrCreateEditableBrewDoc () {
		const existing = await this.pGetEditableBrewDoc();
		if (existing) return existing;

		const brew = this._getNewEditableBrewDoc();
		const brews = [...MiscUtil.copyFast(await this._pGetBrewRaw()), brew];
		await this.pSetBrew(brews);

		return brew;
	}

	async pSetEditableBrewDoc (brew) {
		if (!brew?.head?.docIdLocal || !brew?.body) throw new Error(`Invalid editable brew document!`); // Sanity check
		await this.pUpdateBrew(brew);
	}

	/**
	 * @param prop
	 * @param uniqueId
	 * @param isDuplicate If the entity should be a duplicate, i.e. have a new `uniqueId`.
	 */
	async pGetEditableBrewEntity (prop, uniqueId, {isDuplicate = false} = {}) {
		if (!uniqueId) throw new Error(`A "uniqueId" must be provided!`);

		const brew = await this.pGetOrCreateEditableBrewDoc();

		const out = (brew.body?.[prop] || []).find(it => it.uniqueId === uniqueId);
		if (!out || !isDuplicate) return out;

		if (isDuplicate) out.uniqueId = CryptUtil.uid();

		return out;
	}

	async pPersistEditableBrewEntity (prop, ent) {
		if (!ent.uniqueId) throw new Error(`Entity did not have a "uniqueId"!`);

		const brew = await this.pGetOrCreateEditableBrewDoc();

		const ixExisting = (brew.body?.[prop] || []).findIndex(it => it.uniqueId === ent.uniqueId);
		if (!~ixExisting) {
			const nxt = MiscUtil.copyFast(brew);
			MiscUtil.getOrSet(nxt.body, prop, []).push(ent);

			await this.pUpdateBrew(nxt);

			return;
		}

		const nxt = MiscUtil.copyFast(brew);
		nxt.body[prop][ixExisting] = ent;

		await this.pUpdateBrew(nxt);
	}

	async pRemoveEditableBrewEntity (prop, uniqueId) {
		if (!uniqueId) throw new Error(`A "uniqueId" must be provided!`);

		const brew = await this.pGetOrCreateEditableBrewDoc();

		if (!brew.body?.[prop]?.length) return;

		const nxt = MiscUtil.copyFast(brew);
		nxt.body[prop] = nxt.body[prop].filter(it => it.uniqueId !== uniqueId);

		if (nxt.body[prop].length === brew.body[prop]) return; // Silently allow no-op deletes

		await this.pUpdateBrew(nxt);
	}

	async pAddSource (sourceObj) {
		const existing = await this.pGetEditableBrewDoc();

		if (existing) {
			const nxt = MiscUtil.copyFast(existing);
			const sources = MiscUtil.getOrSet(nxt.body, "_meta", "sources", []);
			sources.push(sourceObj);

			await this.pUpdateBrew(nxt);

			return;
		}

		const json = {_meta: {sources: [sourceObj]}};
		const brew = this._getBrewDoc({json, isEditable: true});
		const brews = [...MiscUtil.copyFast(await this._pGetBrewRaw()), brew];
		await this.pSetBrew(brews);
	}

	async pEditSource (sourceObj) {
		const existing = await this.pGetEditableBrewDoc();
		if (!existing) throw new Error(`Editable brew document does not exist!`);

		const nxt = MiscUtil.copyFast(existing);
		const sources = MiscUtil.get(nxt.body, "_meta", "sources");
		if (!sources) throw new Error(`Source "${sourceObj.json}" does not exist in editable brew document!`);

		const existingSourceObj = sources.find(it => it.json === sourceObj.json);
		if (!existingSourceObj) throw new Error(`Source "${sourceObj.json}" does not exist in editable brew document!`);
		Object.assign(existingSourceObj, sourceObj);

		await this.pUpdateBrew(nxt);
	}

	async pIsEditableSourceJson (sourceJson) {
		const brew = await this.pGetEditableBrewDoc();
		if (!brew) return false;

		const sources = MiscUtil.get(brew.body, "_meta", "sources") || [];
		return sources.some(it => it.json === sourceJson);
	}

	/**
	 * Move the brews containing a given source to the editable document. If a brew cannot be moved to the editable
	 *   document, copy the source to the editable document instead.
	 */
	async pMoveOrCopyToEditableBySourceJson (sourceJson) {
		if (await this.pIsEditableSourceJson(sourceJson)) return;

		// Fetch all candidate brews
		const brews = (await this._pGetBrewRaw()).filter(brew => (brew.body._meta?.sources || []).some(src => src.json === sourceJson));
		const brewsLocal = (await this._pGetBrew_pGetLocalBrew()).filter(brew => (brew.body._meta?.sources || []).some(src => src.json === sourceJson));

		// Arbitrarily select one, preferring non-local
		let brew = brews.find(brew => BrewDoc.isOperationPermitted_moveToEditable({brew}));
		if (!brew) brew = brewsLocal.find(brew => BrewDoc.isOperationPermitted_moveToEditable({brew, isAllowLocal: true}));

		if (!brew) return;

		if (brew.head.isLocal) return this.pCopyToEditable({brews: [brew]});

		return this.pMoveToEditable({brews: [brew]});
	}

	async pMoveToEditable ({brews}) {
		const out = await this.pCopyToEditable({brews});
		await this.pDeleteBrews(brews);
		return out;
	}

	async pCopyToEditable ({brews}) {
		const brewEditable = await this.pGetOrCreateEditableBrewDoc();

		const cpyBrewEditableDoc = BrewDoc.fromObject(brewEditable, {isCopy: true});
		brews.forEach((brew, i) => cpyBrewEditableDoc.mutMerge({json: brew.body, isLazy: i !== brews.length - 1}));

		await this.pSetEditableBrewDoc(cpyBrewEditableDoc.toObject());

		return cpyBrewEditableDoc;
	}

	async pHasEditableSourceJson () {
		const brewsStored = await this._pGetBrewRaw();
		if (!brewsStored?.length) return false;

		return brewsStored
			.map(brew => BrewDoc.fromObject(brew))
			.some(brew => brew.head.isEditable && !brew.isEmpty());
	}
	// endregion
}
