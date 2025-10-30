import {BrewUtil2Base} from "./utils-brew-base.js";

export class PrereleaseUtil_ extends BrewUtil2Base {
	_STORAGE_KEY_LEGACY = null;
	_STORAGE_KEY_LEGACY_META = null;

	_STORAGE_KEY = "PRERELEASE_STORAGE";
	_STORAGE_KEY_META = "PRERELEASE_META_STORAGE";

	_STORAGE_KEY_RELOAD_MESSAGE = "PRERELEASE_RELOAD_MESSAGE";
	_STORAGE_KEY_CUSTOM_URL = "PRERELEASE_CUSTOM_REPO_URL";
	_STORAGE_KEY_MIGRATION_VERSION = "PRERELEASE_STORAGE_MIGRATION";

	_PATH_LOCAL_DIR = "prerelease";
	_PATH_LOCAL_INDEX = VeCt.JSON_PRERELEASE_INDEX;

	_VERSION = 1;

	IS_EDITABLE = false;
	PAGE_MANAGE = UrlUtil.PG_MANAGE_PRERELEASE;
	URL_REPO_DEFAULT = VeCt.URL_PRERELEASE;
	URL_REPO_ROOT_DEFAULT = VeCt.URL_ROOT_PRERELEASE;
	DISPLAY_NAME = "prerelease content";
	DISPLAY_NAME_PLURAL = "prereleases";
	DEFAULT_AUTHOR = "Wizards of the Coast";
	STYLE_BTN = "ve-btn-primary";
	IS_PREFER_DATE_ADDED = false;
	IS_ADD_BTN_ALL_PARTNERED = false;

	/* -------------------------------------------- */

	async pGetSourceIndex (urlRoot) { return DataUtil.prerelease.pLoadSourceIndex(urlRoot); }

	getFileUrl (path, urlRoot) { return DataUtil.prerelease.getFileUrl(path, urlRoot); }

	pLoadTimestamps (urlRoot) { return DataUtil.prerelease.pLoadTimestamps(urlRoot); }

	pLoadPropIndex (urlRoot) { return DataUtil.prerelease.pLoadPropIndex(urlRoot); }

	pLoadMetaIndex (urlRoot) { return DataUtil.prerelease.pLoadMetaIndex(urlRoot); }

	pLoadAdventureBookIdsIndex (urlRoot) { return DataUtil.prerelease.pLoadAdventureBookIdsIndex(urlRoot); }

	/* -------------------------------------------- */

	// region Editable

	pGetEditableBrewDoc (brew) { return super.pGetEditableBrewDoc(brew); }
	pGetOrCreateEditableBrewDoc () { return super.pGetOrCreateEditableBrewDoc(); }
	pSetEditableBrewDoc () { return super.pSetEditableBrewDoc(); }
	pGetEditableBrewEntity (prop, uniqueId, {isDuplicate = false} = {}) { return super.pGetEditableBrewEntity(prop, uniqueId, {isDuplicate}); }
	pPersistEditableBrewEntity (prop, ent) { return super.pPersistEditableBrewEntity(prop, ent); }
	pRemoveEditableBrewEntity (prop, uniqueId) { return super.pRemoveEditableBrewEntity(prop, uniqueId); }
	pAddSource (sourceObj) { return super.pAddSource(sourceObj); }
	pEditSource (sourceObj) { return super.pEditSource(sourceObj); }
	pIsEditableSourceJson (sourceJson) { return super.pIsEditableSourceJson(sourceJson); }
	pMoveOrCopyToEditableBySourceJson (sourceJson) { return super.pMoveOrCopyToEditableBySourceJson(sourceJson); }
	pMoveToEditable ({brews}) { return super.pMoveToEditable({brews}); }
	pCopyToEditable ({brews}) { return super.pCopyToEditable({brews}); }
	async pHasEditableSourceJson () { return false; }

	// endregion
}
