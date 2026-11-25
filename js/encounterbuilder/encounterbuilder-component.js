import {EncounterBuilderCreatureGroupEntityCreature, EncounterBuilderCreatureGroupRegistry} from "./encounterbuilder-models-creaturegroup.js";
import {EncounterPartyPlayerMeta} from "./encounterbuilder-models-other.js";

export class EncounterBuilderComponent extends BaseComponent {
	constructor ({cache}) {
		super();
		this._cache = cache;
	}

	/* -------------------------------------------- */

	get creatureGroups () { return this._state.creatureGroups; }
	set creatureGroups (val) { this._state.creatureGroups = val; }

	get customShapeGroups () { return this._state.customShapeGroups; }
	set customShapeGroups (val) { this._state.customShapeGroups = val; }

	pulseDerivedPartyMeta () { this._state.pulseDerivedPartyMeta = !this._state.pulseDerivedPartyMeta; }

	/* -------------------------------------------- */

	addHookCreatureGroups (hk) { return this._addHookBase("creatureGroups", hk); }
	addHookCustomShapeGroups (hk) { return this._addHookBase("customShapeGroups", hk); }
	addHookPulseDeriverPartyMeta (hk) { return this._addHookBase("pulseDerivedPartyMeta", hk); }

	/* -------------------------------------------- */

	_activeRulesComp = null;
	_activePartyComp = null;

	setActiveRulesComp (rulesComp) { this._activeRulesComp = rulesComp; }
	setActivePartyComp (partyComp) { this._activePartyComp = partyComp; }

	doAddCreatureGroup ({creatureGroup}) {
		const creatureGroupsNxt = [...this.creatureGroups];
		const existingGroup = creatureGroupsNxt.find(creatureGroupNxt => creatureGroupNxt.isSameCreatureGroup(creatureGroup));

		if (existingGroup) {
			existingGroup.setCount(existingGroup.getCount() + creatureGroup.getCount());
			this.creatureGroups = creatureGroupsNxt;
			return;
		}

		this.creatureGroups = [
			...creatureGroupsNxt,
			creatureGroup,
		];
	}

	doSubtractCreatureGroup ({creatureGroup, quantity = null}) {
		quantity ??= creatureGroup.getCount();

		let isAnyMod = false;
		const creatureGroupsNxt = this.creatureGroups
			.map(creatureGroupNxt => {
				if (!creatureGroupNxt.isSameCreatureGroup(creatureGroup)) return creatureGroupNxt;

				isAnyMod = true;

				const countNxt = creatureGroupNxt.getCount() - quantity;
				if (countNxt <= 0) return null;

				creatureGroupNxt.setCount(countNxt);
				return creatureGroupNxt;
			})
			.filter(Boolean);

		if (!isAnyMod) return;
		this.creatureGroups = creatureGroupsNxt;
	}

	_getReplacementEntityCreature ({creatureGroup}) {
		const lockedHashes = new Set(
			this.creatureGroups
				.filter(creatureGroup => creatureGroup.getIsLocked())
				.map(creatureGroup => creatureGroup.getHash())
				.filter(Boolean),
		);

		const budgetMode = this._activeRulesComp.getBudgetMode();

		const spendValue = creatureGroup.getSpend({budgetMode});
		const hash = creatureGroup.getHash();

		const availMons = this._cache.getCreatures({budgetMode, spendValue})
			.filter(mon => {
				const hashNxt = UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_BESTIARY](mon);
				return !lockedHashes.has(hashNxt) && hashNxt !== hash;
			});
		if (!availMons.length) return null;

		return RollerUtil.rollOnArray(availMons);
	}

	_doReplaceCreatureGroup ({creatureGroup, creatureGroupNxt}) {
		const ix = this.creatureGroups.findIndex(creatureGroup_ => creatureGroup_.id === creatureGroup.id);
		if (!~ix) throw new Error(`Could not find creature group "${creatureGroup.id}"!`);

		const creatureGroupsNxt = [...this.creatureGroups];
		const existingGroup = creatureGroupsNxt.find(creatureGroup_ => creatureGroup_.id !== creatureGroup.id && creatureGroup_.isSameCreatureGroup(creatureGroupNxt));
		if (existingGroup) {
			existingGroup.setCount(existingGroup.getCount() + creatureGroupNxt.getCount());
			creatureGroupsNxt.splice(ix, 1);
		} else {
			creatureGroupsNxt[ix] = creatureGroupNxt;
		}

		this.creatureGroups = creatureGroupsNxt;
	}

	doReplaceCreatureGroupWithRandomEntityCreature ({creatureGroup}) {
		if (creatureGroup.getIsLocked()) return;

		const creature = this._getReplacementEntityCreature({creatureGroup});
		if (!creature) return JqueryUtil.doToast({content: "Could not find another creature worth the same amount of XP!", type: "warning"});

		this._doReplaceCreatureGroup({
			creatureGroup,
			creatureGroupNxt: new EncounterBuilderCreatureGroupEntityCreature({
				creature,
				count: creatureGroup.getCount(),
			}),
		});
	}

	doShuffleCreatureGroup ({creatureGroup}) {
		if (creatureGroup.getIsLocked()) return;
		this.doReplaceCreatureGroupWithRandomEntityCreature({creatureGroup});
	}

	doDeleteCreatureGroup ({creatureGroup}) {
		this.creatureGroups = this.creatureGroups.filter(creatureGroup_ => creatureGroup_.id !== creatureGroup.id);
	}

	doPulseCreatureGroups () {
		this._triggerCollectionUpdate("creatureGroups");
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

	getBaseSaveableState () {
		return {
			state: MiscUtil.copyFast({
				...this.__state,
				creatureGroups: this.__state.creatureGroups
					?.map(creatureGroup => creatureGroup.toSerial()),
			}),
		};
	}

	/* ----- */

	_mutValidateLoadedState (loadedState) {
		if (loadedState.creatureMetas?.length && !loadedState.creatureGroups?.length) {
			loadedState.creatureGroups = loadedState.creatureMetas;
			delete loadedState.creatureMetas;
		}

		if (loadedState.creatureGroups?.length) {
			loadedState.creatureGroups = loadedState.creatureGroups
				.map(creatureGroup => EncounterBuilderCreatureGroupRegistry.fromSerial(creatureGroup))
				.filter(creatureGroup => creatureGroup.isValid());
		}
	}

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

	/* -------------------------------------------- */

	static _getDefaultState () {
		return {
			creatureGroups: [],

			customShapeGroups: [],

			pulseDerivedPartyMeta: false,
		};
	}

	_getDefaultState () {
		return {
			...this.constructor._getDefaultState(),
		};
	}

	getDefaultStateKeys () {
		return Object.keys(this.constructor._getDefaultState());
	}
}
