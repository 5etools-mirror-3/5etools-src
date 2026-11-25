import {
	PANEL_TYP_ADVENTURE_DYNAMIC_MAP,
	PANEL_TYP_COUNTER,
	PANEL_TYP_GENERIC_EMBED,
	PANEL_TYP_INITIATIVE_TRACKER, PANEL_TYP_INITIATIVE_TRACKER_CREATURE_VIEWER,
	PANEL_TYP_INITIATIVE_TRACKER_PLAYER_V0,
	PANEL_TYP_INITIATIVE_TRACKER_PLAYER_V1, PANEL_TYP_MONEY_CONVERTER, PANEL_TYP_TEXTBOX, PANEL_TYP_TIME_TRACKER, PANEL_TYP_TUBE, PANEL_TYP_TWITCH, PANEL_TYP_TWITCH_CHAT, PANEL_TYP_UNIT_CONVERTER,
} from "../dmscreen-consts.js";
import {InitiativeTracker} from "./initiativetracker/dmscreen-initiativetracker.js";
import {DmScreenPanelAppGenericEmbed} from "./dmscreen-panelapp-genericembed.js";
import {InitiativeTrackerPlayerV0, InitiativeTrackerPlayerV1} from "./dmscreen-panelapp-playerinitiativetracker.js";
import {InitiativeTrackerCreatureViewer} from "../dmscreen-initiativetrackercreatureviewer.js";
import {Counter} from "./dmscreen-panelapp-counter.js";
import {NoteBox} from "./dmscreen-panelapp-notebox.js";
import {UnitConverter} from "./dmscreen-panelapp-unitconverter.js";
import {MoneyConverter} from "./dmscreen-panelapp-moneyconverter.js";
import {TimeTracker} from "./dmscreen-panelapp-timetracker.js";
import {DmScreenPanelAppTwitch} from "./dmscreen-panelapp-twitch.js";
import {DmScreenPanelAppTwitchChat} from "./dmscreen-panelapp-twitchchat.js";
import {DmMapper} from "./dmscreen-panelapp-mapper.js";
import {DmScreenPanelAppYouTube} from "./dmscreen-panelapp-youtube.js";

export class PanelContentManagerFactory {
	static _PANEL_TYPES = {};

	static registerPanelType ({panelType, Cls}) {
		this._PANEL_TYPES[panelType] = Cls;
	}

	/* -------------------------------------------- */

	static async pFromSavedState ({board, saved, ixTab, panel}) {
		if (!this._PANEL_TYPES[saved.t]) return undefined;

		const ContentManager = new this._PANEL_TYPES[saved.t]({board, panel});
		await ContentManager.pLoadState({ixTab, saved});

		return true;
	}

	/* -------------------------------------------- */

	static getSaveableContent (
		{
			type,
			toSaveTitle,
			panelApp,
		},
	) {
		if (!this._PANEL_TYPES[type]) return undefined;

		return this._PANEL_TYPES[type]
			.getSaveableContent({
				type,
				toSaveTitle,
				panelApp,
			});
	}
}

/* -------------------------------------------- */

class _PanelContentManager {
	static _PANEL_TYPE = null;
	static _TITLE = null;
	static _IS_STATELESS = false;

	static _register () {
		PanelContentManagerFactory.registerPanelType({panelType: this._PANEL_TYPE, Cls: this});
		return null;
	}

	static getSaveableContent (
		{
			type,
			toSaveTitle,
			panelApp,
		},
	) {
		return {
			t: type,
			r: toSaveTitle,
			s: this._IS_STATELESS
				? {}
				: panelApp.getState(),
		};
	}

	/* -------------------------------------------- */

	constructor (
		{
			board,
			panel,
		},
	) {
		this._board = board;
		this._panel = panel;
	}

	/* -------------------------------------------- */

	/**
	 * @abstract
	 * @return {*}
	 */
	_getPanelApp ({state}) {
		throw new Error("Unimplemented!");
	}

	async pDoPopulate ({state = {}, title = null} = {}) {
		const panelApp = this._getPanelApp({state});

		this._panel.setEleContentTab({
			panelType: this.constructor._PANEL_TYPE,
			contentMeta: state,
			panelApp,
			eleContent: veT`<div class="panel-content-wrapper-inner"></div>`.vee.appends(panelApp.getPanelElement()),
			title: title || this.constructor._TITLE,
			tabCanRename: true,
		});

		this._board.fireBoardEvent({type: "panelPopulate", payload: {type: this.constructor._PANEL_TYPE}});
	}

	_doHandleTabRenamed ({ixTab, saved}) {
		if (saved.r != null) this._panel.tabDatas[ixTab].tabRenamed = true;
	}

	_mutMigrateState ({saved}) { /* Implement as required */ }

	async pLoadState ({ixTab, saved}) {
		this._mutMigrateState({saved});
		await this.pDoPopulate({state: saved.s, title: saved.r});
		this._doHandleTabRenamed({ixTab, saved});
	}
}

export class PanelContentManager_InitiativeTracker extends _PanelContentManager {
	static _PANEL_TYPE = PANEL_TYP_INITIATIVE_TRACKER;
	static _TITLE = "Initiative Tracker";

	static _ = this._register();

	_getPanelApp ({state}) {
		return InitiativeTracker.getPanelApp({board: this._board, savedState: state});
	}
}

export class PanelContentManager_InitiativeTrackerCreatureViewer extends _PanelContentManager {
	static _PANEL_TYPE = PANEL_TYP_INITIATIVE_TRACKER_CREATURE_VIEWER;
	static _TITLE = "Creature Viewer";
	static _IS_STATELESS = true;

	static _ = this._register();

	_getPanelApp ({state}) {
		return InitiativeTrackerCreatureViewer.getPanelApp({board: this._board, savedState: state});
	}
}

export class PanelContentManager_InitiativeTrackerPlayerViewV1 extends _PanelContentManager {
	static _PANEL_TYPE = PANEL_TYP_INITIATIVE_TRACKER_PLAYER_V1;
	static _TITLE = "Initiative Tracker";
	static _IS_STATELESS = true;

	static _ = this._register();

	_getPanelApp ({state}) {
		return InitiativeTrackerPlayerV1.getPanelApp({board: this._board, savedState: state});
	}
}

export class PanelContentManager_InitiativeTrackerPlayerViewV0 extends _PanelContentManager {
	static _PANEL_TYPE = PANEL_TYP_INITIATIVE_TRACKER_PLAYER_V0;
	static _TITLE = "Initiative Tracker";
	static _IS_STATELESS = true;

	static _ = this._register();

	_getPanelApp ({state}) {
		return InitiativeTrackerPlayerV0.getPanelApp({board: this._board, savedState: state});
	}
}

export class PanelContentManager_Counter extends _PanelContentManager {
	static _PANEL_TYPE = PANEL_TYP_COUNTER;
	static _TITLE = "Counter";

	static _ = this._register();

	_getPanelApp ({state}) {
		return Counter.getPanelApp({board: this._board, savedState: state});
	}
}

export class PanelContentManager_NoteBox extends _PanelContentManager {
	static _PANEL_TYPE = PANEL_TYP_TEXTBOX;
	static _TITLE = "Notes";

	static _ = this._register();

	_getPanelApp ({state}) {
		return NoteBox.getPanelApp({board: this._board, savedState: state});
	}
}

export class PanelContentManager_UnitConverter extends _PanelContentManager {
	static _PANEL_TYPE = PANEL_TYP_UNIT_CONVERTER;
	static _TITLE = "Unit Converter";

	static _ = this._register();

	_getPanelApp ({state}) {
		return UnitConverter.getPanelApp({board: this._board, savedState: state});
	}
}

export class PanelContentManager_MoneyConverter extends _PanelContentManager {
	static _PANEL_TYPE = PANEL_TYP_MONEY_CONVERTER;
	static _TITLE = "Coin Converter";

	static _ = this._register();

	_getPanelApp ({state}) {
		return MoneyConverter.getPanelApp({board: this._board, savedState: state});
	}
}

export class PanelContentManager_TimeTracker extends _PanelContentManager {
	static _PANEL_TYPE = PANEL_TYP_TIME_TRACKER;
	static _TITLE = "Time Tracker";

	static _ = this._register();

	_getPanelApp ({state}) {
		return TimeTracker.getPanelApp({board: this._board, savedState: state});
	}
}

export class PanelContentManager_DynamicMap extends _PanelContentManager {
	static _PANEL_TYPE = PANEL_TYP_ADVENTURE_DYNAMIC_MAP;
	static _TITLE = "Map Viewer";

	static _ = this._register();

	_getPanelApp ({state}) {
		return DmMapper.getPanelApp({board: this._board, savedState: state});
	}
}

/** @abstract */
class _PanelContentManager_EmbedBase extends _PanelContentManager {
	/**
	 * Handle legacy pre-PCM state
	 */
	_mutMigrateState_v1 ({saved}) {
		if (!saved.c) return;

		saved.s = saved.c;
		delete saved.c;
	}

	_mutMigrateState ({saved}) {
		this._mutMigrateState_v1({saved});
	}
}

export class PanelContentManager_YouTube extends _PanelContentManager_EmbedBase {
	static _PANEL_TYPE = PANEL_TYP_TUBE;
	static _TITLE = "YouTube";

	static _ = this._register();

	_getPanelApp ({state}) {
		return DmScreenPanelAppYouTube.getPanelApp({board: this._board, savedState: state});
	}
}

export class PanelContentManager_Twitch extends _PanelContentManager_EmbedBase {
	static _PANEL_TYPE = PANEL_TYP_TWITCH;
	static _TITLE = "Twitch";

	static _ = this._register();

	_getPanelApp ({state}) {
		return DmScreenPanelAppTwitch.getPanelApp({board: this._board, savedState: state});
	}
}

export class PanelContentManager_TwitchChat extends _PanelContentManager_EmbedBase {
	static _PANEL_TYPE = PANEL_TYP_TWITCH_CHAT;
	static _TITLE = "Twitch Chat";

	static _ = this._register();

	_getPanelApp ({state}) {
		return DmScreenPanelAppTwitchChat.getPanelApp({board: this._board, savedState: state});
	}
}

export class PanelContentManager_GenericEmbed extends _PanelContentManager_EmbedBase {
	static _PANEL_TYPE = PANEL_TYP_GENERIC_EMBED;
	static _TITLE = "Embed";

	static _ = this._register();

	_getPanelApp ({state}) {
		return DmScreenPanelAppGenericEmbed.getPanelApp({board: this._board, savedState: state});
	}
}
