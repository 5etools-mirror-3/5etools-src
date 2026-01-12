import {DmScreenUtil} from "./dmscreen-util.js";
import {PANEL_TYP_INITIATIVE_TRACKER} from "./dmscreen-consts.js";

// TODO(Future) refactor to subclass `DmScreenPanelAppBase`; move state to `_comp`
export class InitiativeTrackerCreatureViewer extends BaseComponent {
	static getPanelApp ({board, savedState}) {
		return new this({board, savedState});
	}

	$getPanelElement () {
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
		const $out = $$`<div class="ve-flex-col w-100 h-100 min-h-0">
			${this._render_$getStgNoTrackerAvailable()}
			${this._render_$getStgConnect()}
			${this._render_$getStgCreature()}
		</div>`;

		this._addHookBase("cntPanelsAvailable", (prop, val, prev) => {
			if (prop == null) return;
			if (prev || val !== 1) return;

			this._setLinkedTrackerFromPanelApp({
				panelApp: DmScreenUtil.getPanelApps({board: this._board, type: PANEL_TYP_INITIATIVE_TRACKER})[0],
			});
		})();

		this._hkBoardPanels();

		return $out;
	}

	_render_$getStgNoTrackerAvailable () {
		const $stg = $$`<div class="ve-flex-vh-center w-100 h-100 min-h-0">
			<div class="dnd-font italic small-caps ve-muted">No Initiative Tracker available.</div>
		</div>`;

		const hkIsVisible = () => $stg.toggleVe(!this._state.isActive && !this._state.cntPanelsAvailable);
		this._addHookBase("isActive", hkIsVisible);
		this._addHookBase("cntPanelsAvailable", hkIsVisible);
		hkIsVisible();

		return $stg;
	}

	_render_$getStgConnect () {
		const $btnConnect = $(`<button class="ve-btn ve-btn-primary min-w-200p">Connect to Tracker</button>`)
			.on("click", async () => {
				const panelApps = DmScreenUtil.getPanelApps({board: this._board, type: PANEL_TYP_INITIATIVE_TRACKER});

				if (panelApps.length === 1) return this._setLinkedTrackerFromPanelApp({panelApp: panelApps[0]});

				const {$modalInner, doClose, pGetResolved} = UiUtil.getShowModal({
					isMinHeight0: true,
					isHeaderBorder: true,
					title: "Select Tracker",
				});

				const $selTracker = $(`<select class="form-control input-xs mb-2">
					<option value="-1" disabled>Select tracker</option>
					${panelApps.map((panelApp, i) => `<option value="${i}">${panelApp.getSummary()}</option>`).join("")}
				</select>`)
					.on("change", () => $selTracker.removeClass("error-background"));

				const $btnSubmit = $(`<button class="ve-btn ve-btn-primary ve-btn-xs">Connect</button>`)
					.on("click", () => {
						const ix = Number($selTracker.val());
						if (!~ix) {
							$selTracker.addClass("error-background");
							return;
						}

						doClose(true, ix);
					});

				$$($modalInner)`
					${$selTracker}
					${$btnSubmit}
				`;

				const [isDataEntered, ixSel] = await pGetResolved();
				if (!isDataEntered || ixSel == null) return;

				this._setLinkedTrackerFromPanelApp({panelApp: panelApps[ixSel]});
			});

		const $stg = $$`<div class="ve-flex-vh-center w-100 h-100 min-h-0">
			${$btnConnect}
		</div>`;

		const hkIsVisible = () => $stg.toggleVe(!this._state.isActive && this._state.cntPanelsAvailable);
		this._addHookBase("isActive", hkIsVisible);
		this._addHookBase("cntPanelsAvailable", hkIsVisible);
		hkIsVisible();

		return $stg;
	}

	_render_$getStgCreature () {
		const dispCreature = e_({
			tag: "div",
			clazz: "ve-flex-col w-100 h-100 min-h-0",
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

			if (!mon) return dispCreature.innerHTML = `<div class="dnd-font italic small-caps ve-muted ve-flex-vh-center w-100 h-100">No active creature.</div>`;

			dispCreature.innerHTML = `<table class="w-100 stats"><tbody>${Renderer.monster.getCompactRenderedString(mon, {isShowScalers: false})}</tbody></table>`;
		};

		this._addHookBase("creaturePulse", async () => {
			try {
				await lock.pLock();
				await hkCreature();
			} finally {
				lock.unlock();
			}
		})().then(null);

		const $stg = $$`<div class="ve-flex-col w-100 h-100 min-h-0 ve-overflow-y-auto">
			${dispCreature}
		</div>`;

		this._addHookBase("isActive", () => $stg.toggleVe(this._state.isActive))();

		return $stg;
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
