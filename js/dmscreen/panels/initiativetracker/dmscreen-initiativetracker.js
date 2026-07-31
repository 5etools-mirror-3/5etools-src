import {InitiativeTrackerConst} from "./dmscreen-initiativetracker-consts.js";
import {InitiativeTrackerNetworking} from "./dmscreen-initiativetracker-networking.js";
import {InitiativeTrackerSettings} from "./dmscreen-initiativetracker-settings.js";
import {InitiativeTrackerSettingsImport} from "./dmscreen-initiativetracker-importsettings.js";
import {InitiativeTrackerMonsterAdd} from "./dmscreen-initiativetracker-monsteradd.js";
import {InitiativeTrackerRoller} from "./dmscreen-initiativetracker-roller.js";
import {InitiativeTrackerEncounterConverter} from "./dmscreen-initiativetracker-encounterconverter.js";
import {
	InitiativeTrackerStatColumnFactory,
	IS_PLAYER_VISIBLE_ALL,
} from "./dmscreen-initiativetracker-statcolumns.js";
import {
	InitiativeTrackerRowDataViewActive,
} from "./dmscreen-initiativetracker-rowsactive.js";
import {
	InitiativeTrackerConditionCustomSerializer,
	InitiativeTrackerRowDataSerializer,
	InitiativeTrackerStatColumnDataSerializer,
} from "./dmscreen-initiativetracker-serial.js";
import {InitiativeTrackerSort} from "./dmscreen-initiativetracker-sort.js";
import {InitiativeTrackerUtil} from "../../../initiativetracker/initiativetracker-utils.js";
import {DmScreenUtil} from "../../dmscreen-util.js";
import {
	InitiativeTrackerRowStateBuilderActive,
	InitiativeTrackerRowStateBuilderDefaultParty,
} from "./dmscreen-initiativetracker-rowstatebuilder.js";
import {InitiativeTrackerDefaultParty} from "./dmscreen-initiativetracker-defaultparty.js";
import {ListUtilBestiary} from "../../../utils-list-bestiary.js";
import {DmScreenPanelAppBase} from "../dmscreen-panelapp-base.js";

export class InitiativeTracker extends DmScreenPanelAppBase {
	constructor (...args) {
		super(...args);

		this._comp = null;
	}

	_getPanelElement (board, state) {
		this._comp = new InitiativeTrackerComponent({board, savedState: state});
		return this._comp.render();
	}

	getState () { return this._comp?.getState(); }

	async pDoConnectLocalV1 () { return this._comp.pDoConnectLocalV1(); }
	async pDoConnectLocalV0 (clientView) { return this._comp.pDoConnectLocalV0(clientView); }

	getSummary () { return this._comp.getSummary(); }

	async pDoLoadEncounter ({entityInfos, encounterInfo}) {
		return this._comp.pDoLoadEncounter({entityInfos, encounterInfo});
	}

	getApi () { return this._comp; }
}

class InitiativeTrackerComponent extends BaseComponent {
	constructor ({board, savedState}) {
		super();

		this._board = board;
		this._savedState = savedState;

		this._networking = new InitiativeTrackerNetworking({board});
		this._roller = new InitiativeTrackerRoller();
		this._rowStateBuilderActive = new InitiativeTrackerRowStateBuilderActive({comp: this, roller: this._roller});
		this._rowStateBuilderDefaultParty = new InitiativeTrackerRowStateBuilderDefaultParty({comp: this, roller: this._roller});

		this._viewRowsActive = null;
		this._viewRowsActiveMeta = null;

		this._compDefaultParty = null;

		this._creatureViewers = [];

		this._doUpdateExternalStates = null;
		this._sendStateToClientsDebounced = null;
	}

	getState () {
		return this._getSerializedState();
	}

	async pDoConnectLocalV1 () {
		const {token} = await this._networking.startServerV1({doUpdateExternalStates: this._doUpdateExternalStates});
		return token;
	}

	async pDoConnectLocalV0 (clientView) {
		await this._networking.pHandleDoConnectLocalV0({clientView});
		this._sendStateToClientsDebounced();
	}

	getSummary () {
		const names = this._state.rows
			.map(({entity}) => entity.name)
			.filter(name => name && name.trim());

		return `${this._state.rows.length} creature${this._state.rows.length === 1 ? "" : "s"} ${names.length ? `(${names.slice(0, 3).join(", ")}${names.length > 3 ? "..." : ""})` : ""}`;
	}

	async pDoLoadEncounter ({entityInfos, encounterInfo}) {
		await this._pDoLoadEncounter({entityInfos, encounterInfo});
	}

	getApi () {
		return this;
	}

	render () {
		if (this._viewRowsActiveMeta) this._viewRowsActiveMeta.cbDoCleanup();
		this._resetHooks("state");
		this._resetHooksAll("state");

		this._setStateFromSerialized();

		this._render_bindSortDirHooks();

		const wrpTracker = veT`<div class="dm-init dm__panel-bg"></div>`
			.vee.onn("drop", evt => this._pDoHandleImportDrop(evt));

		this._sendStateToClientsDebounced = MiscUtil.debounce(
			() => {
				this._networking.sendStateToClients({fnGetToSend: this._getPlayerFriendlyState.bind(this)});
				this._sendStateToCreatureViewers();
			},
			100, // long delay to avoid network spam
		);

		this._doUpdateExternalStates = () => {
			this._board.doSaveStateDebounced();
			this._sendStateToClientsDebounced();
		};
		this._addHookAllBase(this._doUpdateExternalStates);

		this._viewRowsActive = new InitiativeTrackerRowDataViewActive({
			comp: this,
			prop: "rows",
			roller: this._roller,
			networking: this._networking,
			rowStateBuilder: this._rowStateBuilderActive,
		});
		this._viewRowsActiveMeta = this._viewRowsActive.getRenderedView();
		this._viewRowsActiveMeta.ele.vee.appendTo(wrpTracker);

		this._render_getWrpFooter({wrpTracker, doUpdateExternalStates: this._doUpdateExternalStates}).vee.appendTo(wrpTracker);

		return wrpTracker;
	}

	_render_getWrpButtonsSort () {
		const btnSortAlpha = veT`<button title="Sort Alphabetically" class="ve-btn ve-btn-default ve-btn-xs"><span class="glyphicon glyphicon-sort-by-alphabet"></span></button>`
			.vee.onn("click", () => {
				if (this._state.sort === InitiativeTrackerConst.SORT_ORDER_ALPHA) return this._doReverseSortDir();
				this._proxyAssignSimple(
					"state",
					{
						sort: InitiativeTrackerConst.SORT_ORDER_ALPHA,
						dir: InitiativeTrackerConst.SORT_DIR_ASC,
					},
				);
			});

		const btnSortNumber = veT`<button title="Sort Numerically" class="ve-btn ve-btn-default ve-btn-xs"><span class="glyphicon glyphicon-sort-by-order"></span></button>`
			.vee.onn("click", () => {
				if (this._state.sort === InitiativeTrackerConst.SORT_ORDER_NUM) return this._doReverseSortDir();
				this._proxyAssignSimple(
					"state",
					{
						sort: InitiativeTrackerConst.SORT_ORDER_NUM,
						dir: InitiativeTrackerConst.SORT_DIR_DESC,
					},
				);
			});

		const hkSortDir = () => {
			btnSortAlpha.vee.toggleClass("ve-active", this._state.sort === InitiativeTrackerConst.SORT_ORDER_ALPHA);
			btnSortNumber.vee.toggleClass("ve-active", this._state.sort === InitiativeTrackerConst.SORT_ORDER_NUM);
		};
		this._addHookBase("sort", hkSortDir);
		this._addHookBase("dir", hkSortDir);
		hkSortDir();

		return veT`<div class="ve-btn-group ve-flex">
			${btnSortAlpha}
			${btnSortNumber}
		</div>`;
	}

	_render_getWrpFooter ({wrpTracker, doUpdateExternalStates}) {
		const btnAdd = veT`<button class="ve-btn ve-btn-primary ve-btn-xs dm-init-lockable" title="Add Player"><span class="glyphicon glyphicon-plus"></span></button>`
			.vee.onn("click", async () => {
				if (this._state.isLocked) return;
				this._state.rows = [
					...this._state.rows,
					await this._rowStateBuilderActive.pGetNewRowState({
						isPlayerVisible: true,
					}),
				]
					.filter(Boolean);
			});

		const btnAddMonster = veT`<button class="ve-btn ve-btn-success ve-btn-xs dm-init-lockable ve-mr-2" title="Add Creature"><span class="glyphicon glyphicon-print"></span></button>`
			.vee.onn("click", async () => {
				if (this._state.isLocked) return;

				const [isDataEntered, monstersToLoad] = await new InitiativeTrackerMonsterAdd({board: this._board, isRollHp: this._state.isRollHp})
					.pGetShowModalResults();
				if (!isDataEntered) return;

				this._state.isRollHp = monstersToLoad.isRollHp;

				const isGroupRollEval = monstersToLoad.count > 1 && this._state.isRollGroups;

				const mon = isGroupRollEval
					? await DmScreenUtil.pGetScaledCreature({
						name: monstersToLoad.name,
						source: monstersToLoad.source,
						scaledCr: monstersToLoad.scaledCr,
						scaledSummonSpellLevel: monstersToLoad.scaledSummonSpellLevel,
						scaledSummonClassLevel: monstersToLoad.scaledSummonClassLevel,
					})
					: null;

				const initiative = isGroupRollEval
					? await this._roller.pGetRollInitiative({mon})
					: null;

				const rowsNxt = [...this._state.rows];

				(await [...new Array(monstersToLoad.count)]
					.pSerialAwaitMap(async () => {
						const rowNxt = await this._rowStateBuilderActive.pGetNewRowState({
							name: monstersToLoad.name,
							source: monstersToLoad.source,
							initiative,
							rows: rowsNxt,
							displayName: monstersToLoad.displayName,
							customName: monstersToLoad.customName,
							scaledCr: monstersToLoad.scaledCr,
							scaledSummonSpellLevel: monstersToLoad.scaledSummonSpellLevel,
							scaledSummonClassLevel: monstersToLoad.scaledSummonClassLevel,
						});
						if (!rowNxt) return;
						rowsNxt.push(rowNxt);
					}));

				this._state.rows = rowsNxt;
			});

		const btnSetPrevActive = veT`<button class="ve-btn ve-btn-default ve-btn-xs" title="Previous Turn"><span class="glyphicon glyphicon-step-backward"></span></button>`
			.vee.onn("click", () => this._viewRowsActive.pDoShiftActiveRow({direction: InitiativeTrackerConst.DIR_BACKWARDS}));
		const btnSetNextActive = veT`<button class="ve-btn ve-btn-default ve-btn-xs ve-mr-2" title="Next Turn"><span class="glyphicon glyphicon-step-forward"></span></button>`
			.vee.onn("click", () => this._viewRowsActive.pDoShiftActiveRow({direction: InitiativeTrackerConst.DIR_FORWARDS}));

		const iptRound = ComponentUiUtil.getIptInt(this, "round", 1, {min: 1})
			.vee.addClass("dm-init__rounds")
			.vee.removeClass("ve-text-right")
			.vee.addClass("ve-text-center")
			.vee.tooltip("Round");

		const menuPlayerWindow = ContextUtil.getMenu([
			new ContextUtil.Action(
				"Standard",
				async () => {
					this._networking.handleClick_playerWindowV1({doUpdateExternalStates});
				},
			),
			new ContextUtil.Action(
				"Manual (Legacy)",
				async () => {
					this._networking.handleClick_playerWindowV0({doUpdateExternalStates});
				},
			),
		]);

		const btnNetworking = veT`<button class="ve-btn ve-btn-primary ve-btn-xs ve-mr-2" title="Configure Player View (SHIFT to Open Configuration for &quot;Standard&quot; View)"><span class="glyphicon glyphicon-user"></span></button>`
			.vee.onn("click", evt => {
				if (evt.shiftKey) return this._networking.handleClick_playerWindowV1({doUpdateExternalStates});
				return ContextUtil.pOpenMenu(evt, menuPlayerWindow);
			});

		const btnLock = veT`<button class="ve-btn ve-btn-danger ve-btn-xs" title="Lock Tracker"><span class="glyphicon glyphicon-lock"></span></button>`
			.vee.onn("click", () => this._state.isLocked = !this._state.isLocked);
		this._addHookBase("isLocked", () => {
			btnLock
				.vee.toggleClass("ve-btn-success", !!this._state.isLocked)
				.vee.toggleClass("ve-btn-danger", !this._state.isLocked)
				.vee.tooltip(this._state.isLocked ? "Unlock Tracker" : "Lock Tracker");
			wrpTracker.vee.findAll(".dm-init-lockable").forEach(ele => ele.vee.toggleClass("ve-disabled", !!this._state.isLocked));
			wrpTracker.vee.findAll("input.dm-init-lockable").forEach(ele => ele.vee.prop("disabled", !!this._state.isLocked));
		})();

		this._compDefaultParty = new InitiativeTrackerDefaultParty({comp: this, roller: this._roller, rowStateBuilder: this._rowStateBuilderDefaultParty});

		const pHandleClickSettings = async () => {
			const compSettings = new InitiativeTrackerSettings({state: MiscUtil.copyFast(this._state)});
			await compSettings.pGetShowModalResults();
			Object.assign(this._state, compSettings.getStateUpdate());
		};

		const menuConfigure = ContextUtil.getMenu([
			new ContextUtil.Action(
				"Settings",
				() => pHandleClickSettings(),
			),
			null,
			new ContextUtil.Action(
				"Edit Default Party",
				async () => {
					await this._compDefaultParty.pGetShowModalResults();
				},
			),
		]);

		const btnConfigure = veT`<button class="ve-btn ve-btn-default ve-btn-xs ve-mr-2" title="Configure (SHIFT to Open &quot;Settings&quot;)"><span class="glyphicon glyphicon-cog"></span></button>`
			.vee.onn("click", async evt => {
				if (evt.shiftKey) return pHandleClickSettings();
				return ContextUtil.pOpenMenu(evt, menuConfigure);
			});

		const menuImport = ContextUtil.getMenu([
			...ListUtilBestiary.getContextOptionsLoadSublist({
				pFnOnSelect: this._pDoLoadEncounter.bind(this),
			}),
			null,
			new ContextUtil.Action(
				"Import Settings",
				async () => {
					const compImportSettings = new InitiativeTrackerSettingsImport({state: MiscUtil.copyFast(this._state)});
					await compImportSettings.pGetShowModalResults();
					Object.assign(this._state, compImportSettings.getStateUpdate());
				},
			),
		]);

		const btnLoad = veT`<button title="Import an encounter from the Bestiary" class="ve-btn ve-btn-success ve-btn-xs dm-init-lockable"><span class="glyphicon glyphicon-upload"></span></button>`
			.vee.onn("click", (evt) => {
				if (this._state.isLocked) return;
				ContextUtil.pOpenMenu(evt, menuImport);
			});
		const btnReset = veT`<button title="Reset Tracker" class="ve-btn ve-btn-danger ve-btn-xs dm-init-lockable"><span class="glyphicon glyphicon-trash"></span></button>`
			.vee.onn("click", async () => {
				if (this._state.isLocked) return;
				if (!await InputUiUtil.pGetUserBoolean({title: "Reset", htmlDescription: "Are you sure?", textYes: "Yes", textNo: "Cancel"})) return;

				const stateNxt = {
					rows: await this._compDefaultParty.pGetConvertedDefaultPartyActiveRows(),
				};
				const defaultState = this._getDefaultState();
				["round", "sort", "dir"]
					.forEach(prop => stateNxt[prop] = defaultState[prop]);

				this._proxyAssignSimple("state", stateNxt);
			});

		const btnSendToFoundry = veT`<button title="Send to Foundry" class="no-print ve-btn ve-btn-default ve-btn-xs dm-init-lockable"><span class="glyphicon glyphicon-send"></span></button>`
			.vee.onn("click", async () => {
				if (this._state.isLocked) return;

				const encounterActorName = await InputUiUtil.pGetUserString({title: "Encounter Actor Name", isSkippable: true});

				const creatureMetasSerial = await Object.values(
					this._state.rows
						.filter(row => row.entity.source)
						.reduce(
							(accum, row) => {
								const uidRow = [
									row.entity.name,
									row.entity.source,
									row.entity.scaledCr,
									row.entity.scaledSummonSpellLevel,
									row.entity.scaledSummonClassLevel,
								]
									.join("__");

								if (accum[uidRow]) {
									accum[uidRow].count++;
									return accum;
								}

								accum[uidRow] = {entityPrime: row.entity, count: 1};

								return accum;
							},
							{},
						),
				)
					.pSerialAwaitMap(async ({entityPrime, count}) => {
						const creature = await DmScreenUtil.pGetScaledCreature({
							name: entityPrime.name,
							source: entityPrime.source,
							scaledCr: entityPrime.scaledCr,
							scaledSummonSpellLevel: entityPrime.scaledSummonSpellLevel,
							scaledSummonClassLevel: entityPrime.scaledSummonClassLevel,
						});

						return {
							creature,
							count,
						};
					});

				await ExtensionUtil.pDoSend({
					type: "5etools.encounterbuilder.encounter",
					data: {
						encounterActorName,
						creatureMetasSerial,
					},
				});
			});

		return veT`<div class="dm-init__wrp-controls">
			<div class="ve-flex">
				<div class="ve-btn-group ve-flex">
					${btnAdd}
					${btnAddMonster}
				</div>
				<div class="ve-btn-group">${btnSetPrevActive}${btnSetNextActive}</div>
				${iptRound}
			</div>

			${this._render_getWrpButtonsSort()}

			<div class="ve-flex">
				${btnNetworking}

				<div class="ve-btn-group ve-flex-v-center">
					${btnLock}
					${btnConfigure}
				</div>

				<div class="ve-btn-group ve-flex-v-center">
					${btnLoad}
					${btnSendToFoundry}
					${btnReset}
				</div>
			</div>
		</div>`;
	}

	_render_bindSortDirHooks () {
		const hkSortDir = () => {
			this._state.rows = InitiativeTrackerSort.getSortedRows({
				rows: this._state.rows,
				sortBy: this._state.sort,
				sortDir: this._state.dir,
			});
		};
		this._addHookBase("sort", hkSortDir);
		this._addHookBase("dir", hkSortDir);
		hkSortDir();
	}

	/* -------------------------------------------- */

	_doReverseSortDir () {
		this._state.dir = this._state.dir === InitiativeTrackerConst.SORT_DIR_ASC ? InitiativeTrackerConst.SORT_DIR_DESC : InitiativeTrackerConst.SORT_DIR_ASC;
	}

	/* -------------------------------------------- */

	_getPlayerFriendlyState () {
		const visibleStatsCols = this._state.statsCols
			.filter(data => data.isPlayerVisible);

		const rows = this._state.rows
			.map(({entity}) => {
				if (!entity.isPlayerVisible) return null;

				const isMon = !!entity.source;

				const out = {
					name: entity.name,
					initiative: entity.initiative,
					isActive: entity.isActive,
					conditions: entity.conditions || [],
					rowStatColData: entity.rowStatColData
						.map(cell => {
							const mappedCol = visibleStatsCols.find(sc => sc.id === cell.id);
							if (!mappedCol) return null;

							if (mappedCol.isPlayerVisible === IS_PLAYER_VISIBLE_ALL || !isMon) {
								const meta = InitiativeTrackerStatColumnFactory.fromStateData({data: mappedCol});
								return meta.getPlayerFriendlyState({cell});
							}

							return {id: null, entity: {isUnknown: true}};
						})
						.filter(Boolean),
				};

				if (entity.customName) out.customName = entity.customName;

				if (isMon ? !!this._state.playerInitShowExactMonsterHp : !!this._state.playerInitShowExactPlayerHp) {
					out.hpCurrent = entity.hpCurrent;
					out.hpMax = entity.hpMax;
				}

				if (isNaN(entity.hpCurrent) || isNaN(entity.hpMax)) {
					out.hpWoundLevel = -1;
				} else {
					const pctWounded = this._state.isInvertWoundDirection
						? 100 * (entity.hpMax - entity.hpCurrent) / entity.hpMax
						: 100 * entity.hpCurrent / entity.hpMax;
					out.hpWoundLevel = InitiativeTrackerUtil.getWoundLevel(pctWounded);
				}

				if (this._state.playerInitShowOrdinals && entity.isShowOrdinal) out.ordinal = entity.ordinal;

				return out;
			})
			.filter(Boolean);

		return {
			type: "state",
			payload: {
				rows,
				statsCols: visibleStatsCols
					.map(({id, abbreviation}) => ({id, abbreviation})),
				round: this._state.round,
			},
		};
	}

	/* -------------------------------------------- */

	async _pDoLoadEncounter ({entityInfos, encounterInfo}) {
		const rowsPrev = [...this._state.rows];

		// Reset rows early, such that our ordinals are correct for creatures from the encounter
		this._state.rows = [];

		const isAddPlayers = this._state.importIsAddPlayers && !this._state.rowsDefaultParty.length;

		const nxtState = await new InitiativeTrackerEncounterConverter({
			roller: this._roller,
			rowStateBuilderActive: this._rowStateBuilderActive,

			isInvertWoundDirection: this._state.isInvertWoundDirection,
			importIsAddPlayers: isAddPlayers,
			importIsRollGroups: this._state.importIsRollGroups,
			isRollInit: this._state.isRollInit,
			isRollHp: this._state.isRollHp,
			isRollGroups: this._state.isRollGroups,
		})
			.pGetConverted({entityInfos, encounterInfo});

		const rowsFromDefaultParty = await this._compDefaultParty.pGetConvertedDefaultPartyActiveRows({rowsPrev});
		const idsDefaultParty = new Set(rowsFromDefaultParty.map(({id}) => id));
		const rowsPrevNonDefaultParty = rowsPrev
			.filter(({id}) => !idsDefaultParty.has(id));

		const stateNxt = {
			rows: this._state.importIsAppend
				? [
					...rowsPrevNonDefaultParty,
					...rowsFromDefaultParty,
					...nxtState.rows,
				]
				: [
					...rowsFromDefaultParty,
					...nxtState.rows,
				],
		};

		if (nxtState.isOverwriteStatsCols) {
			const userVal = await InputUiUtil.pGetUserGenericButton({
				title: "Overwrite Additional Columns",
				buttons: [
					new InputUiUtil.GenericButtonInfo({
						text: "Yes",
						clazzIcon: "glyphicon glyphicon-ok",
						value: "yes",
					}),
					new InputUiUtil.GenericButtonInfo({
						text: "No",
						clazzIcon: "glyphicon glyphicon-remove",
						isPrimary: true,
						value: "no",
					}),
					new InputUiUtil.GenericButtonInfo({
						text: "Cancel",
						clazzIcon: "glyphicon glyphicon-stop",
						isSmall: true,
						value: "cancel",
					}),
				],
				htmlDescription: `<p>The encounter you are trying to load contains additional column data from the Encounter Builder's "Advanced" mode.<br>Do you want to overwrite your existing additional columns with columns from the encounter?</p>`,
			});

			switch (userVal) {
				case null:
				case "cancel": {
					this._state.rows = rowsPrev;
					return;
				}

				case "yes": {
					stateNxt.isStatsAddColumns = nxtState.isStatsAddColumns;
					stateNxt.statsCols = nxtState.statsCols
						.map(it => it.getAsStateData());
					break;
				}

				case "no": {
					// No-op
					break;
				}

				default: throw new Error(`Unexpected value "${userVal}"`);
			}
		}

		if (!this._state.importIsAppend) {
			const defaultState = this._getDefaultState();
			["round", "sort", "dir"]
				.forEach(prop => stateNxt[prop] = defaultState[prop]);
		}

		this._proxyAssignSimple("state", stateNxt);
	}

	/* -------------------------------------------- */

	async _pDoHandleImportDrop (evt) {
		const data = EventUtil.getDropJson(evt);
		if (!data) return;

		if (data.type !== VeCt.DRAG_TYPE_IMPORT) return;

		evt.stopPropagation();
		evt.preventDefault();

		const {page, source, hash} = data;
		if (page !== UrlUtil.PG_BESTIARY) return;

		const ent = await DataLoader.pCacheAndGet(page, source, hash, {isRequired: true});

		const rowsNxt = [...this._state.rows];
		const rowToAdd = await this._rowStateBuilderActive.pGetNewRowState({
			name: ent.name,
			source: ent.source,
			initiative: null,
			rows: rowsNxt,
		});
		if (!rowToAdd) return;
		rowsNxt.push(rowToAdd);
		this._state.rows = rowsNxt;
	}

	/* -------------------------------------------- */

	doConnectCreatureViewer ({creatureViewer}) {
		if (this._creatureViewers.includes(creatureViewer)) return this;
		this._creatureViewers.push(creatureViewer);
		creatureViewer.setCreatureState(this._getCreatureViewerFriendlyState());
		return this;
	}

	static _CREATURE_VIEWER_STATE_PROPS = [
		"name",
		"source",
		"scaledCr",
		"scaledSummonSpellLevel",
		"scaledSummonClassLevel",
	];

	_getCreatureViewerFriendlyState () {
		const activeRowPrime = this._state.rows
			.filter(({entity}) => entity.isActive)
			.find(Boolean);

		if (!activeRowPrime) {
			return Object.fromEntries(this.constructor._CREATURE_VIEWER_STATE_PROPS.map(prop => [prop, null]));
		}

		return Object.fromEntries(this.constructor._CREATURE_VIEWER_STATE_PROPS.map(prop => [prop, activeRowPrime.entity[prop]]));
	}

	doDisconnectCreatureViewer ({creatureViewer}) {
		this._creatureViewers = this._creatureViewers.filter(it => it !== creatureViewer);
	}

	_sendStateToCreatureViewers () {
		if (!this._creatureViewers.length) return;
		const creatureViewerFriendlyState = this._getCreatureViewerFriendlyState();
		this._creatureViewers.forEach(it => it.setCreatureState(creatureViewerFriendlyState));
	}

	/* -------------------------------------------- */

	_setStateFromSerialized () {
		const stateNxt = {
			// region Config
			sort: this._savedState.s || InitiativeTrackerConst.SORT_ORDER_NUM,
			dir: this._savedState.d || InitiativeTrackerConst.SORT_DIR_DESC,
			statsCols: (this._savedState.c || [])
				.map(dataSerial => this._setStateFromSerialized_statsCol({dataSerial}))
				.filter(Boolean),
			// endregion

			// region Custom conditions
			conditionsCustom: (this._savedState.cndc || [])
				.map(dataSerial => InitiativeTrackerConditionCustomSerializer.fromSerial(dataSerial)),
			// endregion

			// region Rows
			rows: (this._savedState.r || [])
				.map(dataSerial => InitiativeTrackerRowDataSerializer.fromSerial(dataSerial))
				.filter(Boolean),
			rowsDefaultParty: (this._savedState.rdp || [])
				.map(dataSerial => InitiativeTrackerRowDataSerializer.fromSerial(dataSerial))
				.filter(Boolean),
			// endregion

			// region Round
			round: isNaN(this._savedState.n) ? 1 : Number(this._savedState.n),
			// endregion

			// region Temporary
			isLocked: false,
			// endregion
		};

		// region Config
		if (this._savedState.ri != null) stateNxt.isRollInit = this._savedState.ri;
		if (this._savedState.m != null) stateNxt.isRollHp = this._savedState.m;
		if (this._savedState.rg != null) stateNxt.isRollGroups = this._savedState.rg;
		if (this._savedState.rri != null) stateNxt.isRerollInitiativeEachRound = this._savedState.rri;
		if (this._savedState.wId != null) stateNxt.isInvertWoundDirection = this._savedState.wId;
		if (this._savedState.g != null) stateNxt.importIsRollGroups = this._savedState.g;
		if (this._savedState.p != null) stateNxt.importIsAddPlayers = this._savedState.p;
		if (this._savedState.a != null) stateNxt.importIsAppend = this._savedState.a;
		if (this._savedState.k != null) stateNxt.isStatsAddColumns = this._savedState.k;
		if (this._savedState.piHp != null) stateNxt.playerInitShowExactPlayerHp = this._savedState.piHp;
		if (this._savedState.piHm != null) stateNxt.playerInitShowExactMonsterHp = this._savedState.piHm;
		if (this._savedState.piV != null) stateNxt.playerInitHideNewMonster = this._savedState.piV;
		if (this._savedState.piO != null) stateNxt.playerInitShowOrdinals = this._savedState.piO;
		// endregion

		this._proxyAssignSimple("state", stateNxt);
	}

	_setStateFromSerialized_statsCol ({dataSerial}) {
		if (!dataSerial) return null;
		return InitiativeTrackerStatColumnFactory.fromStateData({dataSerial})
			.getAsStateData();
	}

	_getSerializedState () {
		return {
			// region Config
			s: this._state.sort,
			d: this._state.dir,
			ri: this._state.isRollInit,
			m: this._state.isRollHp,
			rg: this._state.isRollGroups,
			rri: this._state.isRerollInitiativeEachRound,
			wId: this._state.isInvertWoundDirection,
			g: this._state.importIsRollGroups,
			p: this._state.importIsAddPlayers,
			a: this._state.importIsAppend,
			k: this._state.isStatsAddColumns,
			piHp: this._state.playerInitShowExactPlayerHp,
			piHm: this._state.playerInitShowExactMonsterHp,
			piV: this._state.playerInitHideNewMonster,
			piO: this._state.playerInitShowOrdinals,
			c: (this._state.statsCols || [])
				.map(data => InitiativeTrackerStatColumnDataSerializer.toSerial(data)),
			// endregion

			// region Custom conditions
			cndc: (this._state.conditionsCustom || [])
				.map(data => InitiativeTrackerConditionCustomSerializer.toSerial(data)),
			// endregion

			// region Rows
			r: (this._state.rows || [])
				.map(data => InitiativeTrackerRowDataSerializer.toSerial(data)),
			rdp: (this._state.rowsDefaultParty || [])
				.map(data => InitiativeTrackerRowDataSerializer.toSerial(data)),
			// endregion

			// region Round
			n: this._state.round,
			// endregion
		};
	}

	_getDefaultState () {
		return {
			// region Config
			sort: InitiativeTrackerConst.SORT_ORDER_NUM,
			dir: InitiativeTrackerConst.SORT_DIR_DESC,
			isRollInit: true,
			isRollHp: false,
			isRollGroups: false,
			isRerollInitiativeEachRound: false,
			isInvertWoundDirection: false,
			importIsRollGroups: true,
			importIsAddPlayers: true,
			importIsAppend: false,
			isStatsAddColumns: false,
			playerInitShowExactPlayerHp: false,
			playerInitShowExactMonsterHp: false,
			playerInitHideNewMonster: true,
			playerInitShowOrdinals: false,
			statsCols: [],
			// endregion

			// region Custom conditions
			conditionsCustom: [],
			// endregion

			// region Rows
			rows: [],
			rowsDefaultParty: [],
			// endregion

			// region Round
			round: 1,
			// endregion

			// region Temporary
			isLocked: false,
			// endregion
		};
	}

	/* -------------------------------------------- */
}
