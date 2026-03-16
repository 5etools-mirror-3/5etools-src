import {DmScreenUtil} from "./dmscreen-util.js";
import {PANEL_TYP_INITIATIVE_TRACKER} from "./dmscreen-consts.js";

// TODO(Future) refactor to subclass `DmScreenPanelAppBase`; move state to `_comp`
export class InitiativeTrackerCreatureViewer extends BaseComponent {
	static getPanelApp ({board, savedState}) {
		return new this({board, savedState});
	}

	getPanelElement () {
		return this.render();
	}

	/* -------------------------------------------- */

	constructor ({board, savedState}) {
		super();
		this._board = board;
		this._savedState = savedState;

		this._trackerLinked = null;
	}

	/* -------------------------------------------- */

	onDestroy () {
		if (!this._trackerLinked) return;
		this._trackerLinked.doDisconnectCreatureViewer({creatureViewer: this});
		this._state.isActive = false;
	}

	onBoardEvent ({type, payload = {}}) {
		if (
			!(
				type === "panelDestroy"
				|| (type === "panelPopulate" && payload.type === PANEL_TYP_INITIATIVE_TRACKER)
				|| (type === "panelIdSetActive" && payload.type === PANEL_TYP_INITIATIVE_TRACKER)
			)
		) return;

		this._hkBoardPanels();
	}

	/* -------------------------------------------- */

	_hkBoardPanels () {
		const panelApps = DmScreenUtil.getPanelApps({board: this._board, type: PANEL_TYP_INITIATIVE_TRACKER});
		this._state.cntPanelsAvailable = panelApps.length;
	}

	render () {
		const out = ee`<div class="ve-flex-col ve-w-100 ve-h-100 ve-min-h-0">
			${this._render_getStgNoTrackerAvailable()}
			${this._render_getStgConnect()}
			${this._render_getStgCreature()}
		</div>`;

		this._addHookBase("cntPanelsAvailable", (prop, val, prev) => {
			if (prop == null) return;
			if (prev || val !== 1) return;

			this._setLinkedTrackerFromPanelApp({
				panelApp: DmScreenUtil.getPanelApps({board: this._board, type: PANEL_TYP_INITIATIVE_TRACKER})[0],
			});
		})();

		this._hkBoardPanels();

		return out;
	}

	_render_getStgNoTrackerAvailable () {
		const stg = ee`<div class="ve-flex-vh-center ve-w-100 ve-h-100 ve-min-h-0">
			<div class="ve-dnd-font ve-italic ve-small-caps ve-muted">No Initiative Tracker available.</div>
		</div>`;

		const hkIsVisible = () => stg.toggleVe(!this._state.isActive && !this._state.cntPanelsAvailable);
		this._addHookBase("isActive", hkIsVisible);
		this._addHookBase("cntPanelsAvailable", hkIsVisible);
		hkIsVisible();

		return stg;
	}

	_render_getStgConnect () {
		const btnConnectConnect = ee`<button class="ve-btn ve-btn-primary ve-min-w-200p">Connect to Tracker</button>`
			.onn("click", async () => {
				const panelApps = DmScreenUtil.getPanelApps({board: this._board, type: PANEL_TYP_INITIATIVE_TRACKER});

				if (panelApps.length === 1) return this._setLinkedTrackerFromPanelApp({panelApp: panelApps[0]});

				const {eleModalInner, doClose, pGetResolved} = UiUtil.getShowModal({
					isMinHeight0: true,
					isHeaderBorder: true,
					title: "Select Tracker",
				});

				const selTracker = ee`<select class="ve-form-control ve-input-xs ve-mb-2">
					<option value="-1" disabled>Select tracker</option>
					${panelApps.map((panelApp, i) => `<option value="${i}">${panelApp.getSummary()}</option>`).join("")}
				</select>`
					.onn("change", () => selTracker.removeClass("error-background"));

				const BtnConnectSubmit = ee`<button class="ve-btn ve-btn-primary ve-btn-xs">Connect</button>`
					.onn("click", () => {
						const ix = Number(selTracker.val());
						if (!~ix) {
							selTracker.addClass("error-background");
							return;
						}

						doClose(true, ix);
					});

				ee(eleModalInner)`
					${selTracker}
					${BtnConnectSubmit}
				`;

				const [isDataEntered, ixSel] = await pGetResolved();
				if (!isDataEntered || ixSel == null) return;

				this._setLinkedTrackerFromPanelApp({panelApp: panelApps[ixSel]});
			});

		const stg = ee`<div class="ve-flex-vh-center ve-w-100 ve-h-100 ve-min-h-0">
			${btnConnectConnect}
		</div>`;

		const hkIsVisible = () => stg.toggleVe(!this._state.isActive && this._state.cntPanelsAvailable);
		this._addHookBase("isActive", hkIsVisible);
		this._addHookBase("cntPanelsAvailable", hkIsVisible);
		hkIsVisible();

		return stg;
	}

	_render_getStgCreature () {
		const dispCreature = e_({
			tag: "div",
			clazz: "ve-flex-col ve-w-100 ve-h-100 ve-min-h-0",
		});

		const lock = new VeLock({name: "Creature display"});

		const hkCreature = async () => {
			const mon = (this._state.creatureName && this._state.creatureSource)
				? await DmScreenUtil.pGetScaledCreature({
					name: this._state.creatureName,
					source: this._state.creatureSource,
					scaledCr: this._state.creatureScaledCr,
					scaledSummonSpellLevel: this._state.creatureScaledSummonSpellLevel,
					scaledSummonClassLevel: this._state.creatureScaledSummonClassLevel,
				})
				: null;

			if (!mon) return dispCreature.innerHTML = `<div class="ve-dnd-font ve-italic ve-small-caps ve-muted ve-flex-vh-center ve-w-100 ve-h-100">No active creature.</div>`;

			dispCreature.innerHTML = `<table class="ve-w-100 ve-stats"><tbody>${Renderer.monster.getCompactRenderedString(mon, {isShowScalers: false})}</tbody></table>`;
		};

		this._addHookBase("creaturePulse", async () => {
			try {
				await lock.pLock();
				await hkCreature();
			} finally {
				lock.unlock();
			}
		})().then(null);

		const stg = ee`<div class="ve-flex-col ve-w-100 ve-h-100 ve-min-h-0 ve-overflow-y-auto">
			${dispCreature}
		</div>`;

		this._addHookBase("isActive", () => stg.toggleVe(this._state.isActive))();

		return stg;
	}

	/* -------------------------------------------- */

	_setLinkedTrackerFromPanelApp ({panelApp}) {
		this._trackerLinked = panelApp.getApi().doConnectCreatureViewer({creatureViewer: this});
		this._state.isActive = true;
	}

	/* -------------------------------------------- */

	setCreatureState (state) {
		if (state == null) return;

		this._proxyAssignSimple(
			"state",
			Object.fromEntries(
				Object.entries(state)
					.map(([k, v]) => [`creature${k.uppercaseFirst()}`, v]),
			),
		);

		// Avoid render spam
		this._state.creaturePulse = !this._state.creaturePulse;
	}

	/* -------------------------------------------- */

	_getDefaultState () {
		return {
			isActive: false,
			cntPanelsAvailable: 0,

			creatureName: null,
			creatureSource: null,
			creatureScaledCr: null,
			creatureScaledSummonSpellLevel: null,
			creatureScaledSummonClassLevel: null,
			creaturePulse: false,
		};
	}
}
