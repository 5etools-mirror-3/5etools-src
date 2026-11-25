import {ScaleCreature} from "../scalecreature/scalecreature-scaler-cr.js";
import {BUDGET_MODE_CR, BUDGET_MODE_XP} from "./consts/encounterbuilder-consts.js";

export class EncounterBuilderCreatureGroupRegistry {
	static _TYPE_TO_CLASS = {};

	static register ({Cls}) {
		if (!Cls.TYPE) throw new Error(`Encounter builder creature group class had no type! This is a bug!`);
		return (this._TYPE_TO_CLASS[Cls.TYPE] = Cls);
	}

	static fromSerial (serial) {
		const type = serial.type || "entityCreature";

		const Cls = this._TYPE_TO_CLASS[type];
		if (!Cls) throw new Error(`Unhandled encounter builder creature group type "${type}"!`);

		return new Cls({
			id: serial.id,
			...serial.entity,
		});
	}
}

/** @abstract */
export class EncounterBuilderCreatureGroupBase {
	static TYPE = null;

	static _ClsVttAdapter = null;

	static setClsVttAdapter (ClsVttAdapter) {
		this._ClsVttAdapter = ClsVttAdapter;
	}

	constructor (
		{
			id,
			...rest
		},
	) {
		this.type = this.constructor.TYPE;
		this.id = id || CryptUtil.uid();
		this.entity = {...rest};
		this._vttAdapter = this.constructor._ClsVttAdapter
			? new this.constructor._ClsVttAdapter({creatureGroup: this})
			: null;
	}

	getCount () { return this.entity.count; }
	setCount (val) { return this.entity.count = val; }

	getIsLocked () { return !!this.entity.isLocked; }

	getHash () { return null; }
	getCustomHashId () { return null; }

	/* -------------------------------------------- */

	/**
	 * @abstract
	 * @returns {boolean}
	 */
	isSameCreatureGroup (other) { throw new Error("Unimplemented!"); }

	isValid () { return this._vttAdapter?.isValid() ?? true; }

	/**
	 * @abstract
	 * @returns {number}
	 */
	getCrNumber () { throw new Error("Unimplemented!"); }

	/**
	 * @abstract
	 * @returns {number}
	 */
	getXp () { throw new Error("Unimplemented!"); }

	getSpend ({budgetMode}) {
		switch (budgetMode) {
			case BUDGET_MODE_XP: return this.getXp();
			case BUDGET_MODE_CR: return this.getCrNumber();
			default: throw new Error(`Unhandled budget mode "${budgetMode}"!`);
		}
	}

	getApproxHp () { return null; }
	getApproxAc () { return null; }

	/**
	 * @abstract
	 * @returns {string}
	 */
	getDisplayName () { throw new Error("Unimplemented!"); }

	getSortPriorityInfo () {
		return {
			count: this.getCount(),
			name: this.getDisplayName(),
			isNamedCreature: false,
			isNpc: false,
		};
	}

	_getRenderedRowElements_getBtnShuffle ({encounterBuilderComp, creatureGroup}) {
		return veT`<button title="Randomize Monster" class="ve-btn ve-btn-default ve-btn-xs"><span class="glyphicon glyphicon-random"></span></button>`
			.vee.onn("click", () => encounterBuilderComp.doShuffleCreatureGroup({creatureGroup}));
	}

	/**
	 * @abstract
	 * @returns {object}
	 */
	getRenderedRowElements () { throw new Error("Unimplemented!"); }

	getVttAdapter ({isRequired = false} = {}) {
		if (isRequired && !this._vttAdapter) throw new Error(`No VTT adapter present for instance of "${this.constructor.name}"! This is a bug!`);
		return this._vttAdapter;
	}

	_getWrpHoverOuter () {
		return veT`<div class="ve-flex-vh-center ve-mr-2 ve-w-16p"></div>`;
	}

	getCopy () {
		return EncounterBuilderCreatureGroupRegistry.fromSerial(this.toSerial());
	}

	toSerial () {
		return {
			type: this.type,
			id: this.id,
			entity: MiscUtil.copyFast(this.entity),
		};
	}
}

export class EncounterBuilderCreatureGroupEntityCreature extends EncounterBuilderCreatureGroupBase {
	static TYPE = "entityCreature";
	static _ = EncounterBuilderCreatureGroupRegistry.register({Cls: this});

	constructor (
		{
			id,

			creature,
			count,

			isLocked = false,

			customHashId = null,
			baseCreature = null,
		},
	) {
		super({
			id,

			count,
			creature,
			customHashId,
			baseCreature,
			isLocked,
		});
	}

	/* -------------------------------------------- */

	getHash () { return UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_BESTIARY](this.entity.creature); }

	getCustomHashId () { return this.entity.customHashId || undefined; }

	getCrNumber () {
		return Parser.crToNumber(this.entity.creature.cr, {isDefaultNull: true});
	}

	getXp () {
		if (this.entity.creature.cr?.xp != null) return this.entity.creature.cr.xp;
		return Parser.crToXpNumber(this.entity.creature.cr);
	}

	getApproxHp () {
		if (this.entity.creature.hp && this.entity.creature.hp.average && !isNaN(this.entity.creature.hp.average)) return Number(this.entity.creature.hp.average);
		return null;
	}

	getApproxAc () {
		// Use the first AC listed, as this is usually the "primary"
		if (this.entity.creature.ac && this.entity.creature.ac[0] != null) {
			if (this.entity.creature.ac[0].ac) return this.entity.creature.ac[0].ac;
			if (typeof this.entity.creature.ac[0] === "number") return this.entity.creature.ac[0];
		}
		return null;
	}

	getDisplayName () { return this.entity.creature._displayName || this.entity.creature.name; }

	getSortPriorityInfo () {
		return {
			...super.getSortPriorityInfo(),
			isNamedCreature: !!this.entity.creature.isNamedCreature,
			isNpc: !!this.entity.creature.isNpc,
		};
	}

	/* -------------------------------------------- */

	isSameCreatureGroup (other) {
		if (this.getHash() !== other?.getHash()) return false;
		return MiscUtil.isNearStrictlyEqual(this.getCustomHashId(), other.getCustomHashId());
	}

	_doBindCreatureHover ({comp, ele}) {
		return ele
			.vee.onn("mouseover", evt => {
				return Renderer.hover.pHandleLinkMouseOver(
					evt,
					evt.currentTarget,
					{
						isSpecifiedLinkData: true,
						page: UrlUtil.PG_BESTIARY,
						source: comp._state.creature.source,
						hash: UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_BESTIARY](comp._state.creature),
						customHashId: Renderer.monster.getCustomHashId(comp._state.creature),
					},
				);
			})
			.vee.onn("mousemove", evt => Renderer.hover.handleLinkMouseMove(evt, evt.currentTarget))
			.vee.onn("mouseleave", evt => Renderer.hover.handleLinkMouseLeave(evt, evt.currentTarget));
	}

	// (Exposed for Plutonium use)
	_getRenderedRowElements_wrpHovs (
		{
			comp,
			fnsCleanup,
		},
	) {
		let hoverMetaToken = null;
		let hoverMetaImage = null;

		const wrpHovToken = this._getWrpHoverOuter();
		const wrpHovImage = this._getWrpHoverOuter();

		comp._addHookBase("creature", () => {
			// Track hash, to avoid remaking the hover when scaling the creature
			const hashCreature = UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_BESTIARY](comp._state.creature);

			if (!hoverMetaToken || hoverMetaToken?.hashCreature !== hashCreature) {
				if (hoverMetaToken) hoverMetaToken.pFnCleanup().then(null);

				const hovToken = veT`<span class="glyphicon glyphicon glyphicon-record ve-top-0" title="Hover to View Token"></span>`
					.vee.appendTo(wrpHovToken.vee.empty());

				hoverMetaToken = Renderer.monster.hover.bindTokenMouseover({mon: comp._state.creature, ele: hovToken});
				hoverMetaToken.hashCreature = hashCreature;
			}

			if (!hoverMetaImage || hoverMetaImage?.hashCreature !== hashCreature) {
				if (hoverMetaImage) hoverMetaImage.pFnCleanup().then(null);

				const hovImage = veT`<span class="glyphicon glyphicon-picture ve-top-0" title="Hover to View Image"></span>`
					.vee.appendTo(wrpHovImage.vee.empty());

				hoverMetaImage = Renderer.monster.hover.bindFluffImageMouseover({mon: comp._state.creature, ele: hovImage});
				hoverMetaImage.hashCreature = hashCreature;
			}
		})();

		fnsCleanup.push(() => {
			if (hoverMetaToken) hoverMetaToken.pFnCleanup().then(null);
			if (hoverMetaImage) hoverMetaImage.pFnCleanup().then(null);
		});

		return [
			wrpHovToken,
			wrpHovImage,
		];
	}

	getRenderedRowElements (
		{
			comp,
			entity,
			encounterBuilderComp,
			rendererWrapped,
		},
	) {
		const fnsCleanup = [];

		const dispCreature = veT`<div class="ve-mr-2 ve-mr-auto ve-grow"></div>`;

		const pDoScaleCr = async ({targetCr = null} = {}) => {
			// Fetch original
			const ent = await DataLoader.pCacheAndGetHash(
				UrlUtil.PG_BESTIARY,
				UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_BESTIARY](comp._state.creature),
				{isCopy: true},
			);

			const baseCr = ent.cr.cr || ent.cr;
			if (baseCr == null) return;

			const baseCrNum = Parser.crToNumber(baseCr);
			const scaledToNum = comp._state.creature._isScaledCr ? comp._state.creature._scaledCr : null;

			if (targetCr == null) {
				comp._state.creature = ent;
				iptCr.vee.val(Parser.numberToCr(baseCrNum));
				return;
			}

			if (!targetCr) {
				iptCr.vee.val(Parser.numberToCr(scaledToNum ?? baseCrNum));
				return;
			}

			const targetCrClean = UiUtil.strToCr(targetCr);

			if (targetCrClean == null) {
				JqueryUtil.doToast({
					content: `"${targetCr}" is not a valid Challenge Rating! Please enter a valid CR (0-30).`,
					type: "danger",
				});

				iptCr.vee.val(Parser.numberToCr(scaledToNum ?? baseCrNum));
				return;
			}

			const targetCrNum = Parser.crToNumber(targetCrClean);

			if (targetCrNum === scaledToNum) {
				iptCr.vee.val(Parser.numberToCr(scaledToNum ?? baseCrNum));
				return;
			}

			if (targetCrNum === baseCrNum) {
				comp._state.creature = ent;
				iptCr.vee.val(Parser.numberToCr(baseCrNum));
				return;
			}

			const entScaled = await ScaleCreature.scale(ent, targetCrNum);

			const creatureGroupOther = encounterBuilderComp.creatureGroups
				.find(creatureGroupOther => {
					if (creatureGroupOther.id === entity.id) return false;
					return creatureGroupOther.getHash() === entity.getHash()
						&& MiscUtil.isNearStrictlyEqual(creatureGroupOther.getCustomHashId(), entity.getCustomHashId());
				});

			if (creatureGroupOther) {
				const cntToAdd = comp._state.count;
				encounterBuilderComp.doDeleteCreatureGroup({creatureGroup: entity});
				creatureGroupOther.setCount(creatureGroupOther.getCount() + cntToAdd);
				encounterBuilderComp.doPulseCreatureGroups();
				return;
			}

			comp._state.creature = entScaled;
		};

		let pScalingCr = null;
		const iptCr = veT`<input class="ve-text-center ve-form-control form-control--minimal ve-input-xs ve-w-50p">`
			.vee.onn("click", () => iptCr.vee.select())
			.vee.onn("change", async () => {
				try {
					await pScalingCr;
				} catch (e) { setTimeout(() => { throw e; }); }

				pScalingCr = pDoScaleCr({targetCr: iptCr.vee.val().trim()});
				await pScalingCr;
				pScalingCr = null;
			});

		const btnResetCr = veT`<button title="Reset CR" class="ve-btn ve-btn-default ve-btn-xs ve-w-24p"><span class="glyphicon glyphicon-refresh"></span></button>`
			.vee.onn("click", async () => {
				try {
					await pScalingCr;
				} catch (e) { setTimeout(() => { throw e; }); }

				pScalingCr = pDoScaleCr();
				await pScalingCr;
				pScalingCr = null;
			});
		comp._addHookBase("creature", () => {
			btnResetCr.vee.prop("disabled", !comp._state.creature._isScaledCr);
		})();

		const stgCr = veT`<div class="ve-mr-2 ve-no-wrap ve-no-shrink ve-flex-v-center">
			<span class="ve-mr-2">CR</span>
			<div class="ve-flex-v-center ve-input-group">
				${iptCr}
				${btnResetCr}
			</div>
		</div>`;

		comp._addHookBase("creature", () => {
			iptCr.vee.val(comp._state.creature.cr?.cr || comp._state.creature.cr);

			stgCr.vee.toggle(ScaleCreature.isCrInScaleRange(comp._state.creature));

			if (!Renderer.monster.isScaled(comp._state.creature)) {
				dispCreature.vee.html(`${rendererWrapped.er(`{@creature ${comp._state.creature.name}|${comp._state.creature.source}|${comp._state.creature._displayName || comp._state.creature.name}}`)}`);
				return;
			}

			dispCreature
				.vee.empty()
				.append(
					this._doBindCreatureHover({
						comp,
						ele: veT`<span class="ve-help ve-help--hover">${comp._state.creature._displayName || comp._state.creature.name}</span>`,
					}),
				);
		})();

		return {
			wrpHovs: this._getRenderedRowElements_wrpHovs({comp, fnsCleanup}),
			dispCreature,
			stgCr,
			btnShuffle: this._getRenderedRowElements_getBtnShuffle({encounterBuilderComp, creatureGroup: entity}),
			fnCleanup: () => {
				fnsCleanup.splice(0, fnsCleanup.length).forEach(fn => fn());
			},
		};
	}

	/* -------------------------------------------- */

	// Bestiary-specific
	getCreature () { return this.entity.creature; }
}
