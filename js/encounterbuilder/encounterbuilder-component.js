import {EncounterBuilderCreatureMeta, EncounterPartyPlayerMeta} from "./encounterbuilder-models.js";

export class EncounterBuilderComponent extends BaseComponent {
	constructor ({cache}) {
		super();
		this._cache = cache;
	}

	/* -------------------------------------------- */

	get creatureMetas () { return this._state.creatureMetas; }
	set creatureMetas (val) { this._state.creatureMetas = val; }

	get customShapeGroups () { return this._state.customShapeGroups; }
	set customShapeGroups (val) { this._state.customShapeGroups = val; }

	pulseDerivedPartyMeta () { this._state.pulseDerivedPartyMeta = !this._state.pulseDerivedPartyMeta; }

	/* -------------------------------------------- */

	addHookCreatureMetas (hk) { return this._addHookBase("creatureMetas", hk); }
	addHookCustomShapeGroups (hk) { return this._addHookBase("customShapeGroups", hk); }
	addHookPulseDeriverPartyMeta (hk) { return this._addHookBase("pulseDerivedPartyMeta", hk); }

	/* -------------------------------------------- */

	_activeRulesComp = null;
	_activePartyComp = null;

	setActiveRulesComp (rulesComp) { this._activeRulesComp = rulesComp; }
	setActivePartyComp (partyComp) { this._activePartyComp = partyComp; }

	doAddCreature ({creature = null, quantity = 1}) {
		if (!creature) return;

		const creatureMetasNxt = [...this.creatureMetas];
		const existingMeta = creatureMetasNxt.find(creatureMeta => creatureMeta.hasCreature(creature));

		if (existingMeta) {
			existingMeta.setCount(existingMeta.getCount() + quantity);
			this.creatureMetas = creatureMetasNxt;
			return;
		}

		this.creatureMetas = [
			...creatureMetasNxt,
			new EncounterBuilderCreatureMeta({
				creature,
				count: quantity,
			}),
		];
	}

	doSubtractCreature ({creature = null, quantity = 1}) {
		if (!creature) return;

		let isAnyMod = false;
		const creatureMetasNxt = this.creatureMetas
			.map(creatureMeta => {
				if (!creatureMeta.hasCreature(creature)) return creatureMeta;

				isAnyMod = true;

				const countNxt = creatureMeta.getCount() - quantity;
				if (countNxt <= 0) return null;

				creatureMeta.setCount(countNxt);
				return creatureMeta;
			})
			.filter(Boolean);

		if (!isAnyMod) return;
		this.creatureMetas = creatureMetasNxt;
	}

	doShuffleCreature ({creatureMeta}) {
		if (creatureMeta.getIsLocked()) return;

		const ix = this.creatureMetas.findIndex(creatureMeta_ => creatureMeta_.isSameCreature(creatureMeta));
		if (!~ix) throw new Error(`Could not find creature ${creatureMeta.getHash()} (${creatureMeta.customHashId})`);

		const creatureMeta_ = this.creatureMetas[ix];
		if (creatureMeta_.getIsLocked()) return;

		const lockedHashes = new Set(
			this.creatureMetas
				.filter(creatureMeta => creatureMeta.getIsLocked())
				.map(creatureMeta => creatureMeta.getHash()),
		);

		const monRolled = this._doShuffleCreature_getShuffled({creatureMeta: creatureMeta_, lockedHashes});
		if (!monRolled) return JqueryUtil.doToast({content: "Could not find another creature worth the same amount of XP!", type: "warning"});

		const creatureMetaNxt = new EncounterBuilderCreatureMeta({
			creature: monRolled,
			count: creatureMeta_.getCount(),
		});

		const creatureMetasNxt = [...this.creatureMetas];
		const withMonRolled = creatureMetasNxt.find(creatureMeta_ => creatureMeta_.hasCreature(monRolled));
		if (withMonRolled) {
			withMonRolled.setCount(withMonRolled.getCount() + creatureMetaNxt.getCount());
			creatureMetasNxt.splice(ix, 1);
		} else {
			creatureMetasNxt[ix] = creatureMetaNxt;
		}

		this.creatureMetas = creatureMetasNxt;
	}

	_doShuffleCreature_getShuffled ({creatureMeta, lockedHashes}) {
		const budgetMode = this._activeRulesComp.getBudgetMode();

		const spendValue = creatureMeta.getSpend({budgetMode});
		const hash = creatureMeta.getHash();

		const availMons = this._cache.getCreatures({budgetMode, spendValue})
			.filter(mon => {
				const hash_ = UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_BESTIARY](mon);
				return !lockedHashes.has(hash) && hash_ !== hash;
			});
		if (!availMons.length) return null;

		return RollerUtil.rollOnArray(availMons);
	}

	/* -------------------------------------------- */

	getPartyPlayerMetas () {
		if (!this._activePartyComp) return [new EncounterPartyPlayerMeta({level: 1, count: 1})];
		return this._activePartyComp.getPartyPlayerMetas();
	}

	/* ----- */

	static getDefaultCustomShapeGroup (
		{
			countMinMaxMin = 0,
			countMinMaxMax = 1,
			ratioPercentage = 0,
		} = {},
	) {
		return {
			id: CryptUtil.uid(),
			entity: {
				// region Count
				countMinMaxMin,
				countMinMaxMax,
				// endregion

				// region Ratio
				ratioPercentage,
				// endregion
			},
		};
	}

	/* -------------------------------------------- */

	setStateFrom (toLoad, isOverwrite = false) {
		if (toLoad.state) this._mutValidateLoadedState(toLoad.state);
		return super.setStateFrom(toLoad, isOverwrite);
	}

	setStateFromLoaded (loadedState) {
		this._mutValidateLoadedState(loadedState);

		const nxt = MiscUtil.copyFast(this._getDefaultState());
		Object.assign(nxt, loadedState);

		this._proxyAssignSimple("state", nxt, true);
	}

	setPartialStateFromLoaded (partialLoadedState) {
		this._mutValidateLoadedState(partialLoadedState);
		this._proxyAssignSimple("state", partialLoadedState);
	}

	_mutValidateLoadedState (loadedState) {
		if (loadedState.creatureMetas?.length) {
			loadedState.creatureMetas = loadedState.creatureMetas
				.map(creatureMeta => {
					return creatureMeta instanceof EncounterBuilderCreatureMeta
						? creatureMeta
						: new EncounterBuilderCreatureMeta({...creatureMeta.entity});
				});
		}
	}

	/* -------------------------------------------- */

	getDefaultStateKeys () {
		return Object.keys(this.constructor._getDefaultState());
	}

	static _getDefaultState () {
		return {
			creatureMetas: [],

			customShapeGroups: [],

			pulseDerivedPartyMeta: false,
		};
	}

	_getDefaultState () {
		return {
			...this.constructor._getDefaultState(),
		};
	}
}
