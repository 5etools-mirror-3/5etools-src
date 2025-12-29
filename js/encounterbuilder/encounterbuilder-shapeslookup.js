import {ENCOUNTER_SHAPE_CUSTOM_NAME, ENCOUNTER_SHAPE_CUSTOM_SOURCE, ENCOUNTER_SHAPE_RANDOM_NAME, ENCOUNTER_SHAPE_RANDOM_SOURCE} from "./encounterbuilder-consts.js";

export class EncounterBuilderShapesLookup {
	static _ENCOUNTER_SHAPE_RANDOM = {name: ENCOUNTER_SHAPE_RANDOM_NAME, source: ENCOUNTER_SHAPE_RANDOM_SOURCE};
	static _ENCOUNTER_SHAPE_CUSTOM = {name: ENCOUNTER_SHAPE_CUSTOM_NAME, source: ENCOUNTER_SHAPE_CUSTOM_SOURCE};

	static _sortEncounterShapes (entA, entB) {
		if (entA === this._ENCOUNTER_SHAPE_RANDOM) return -1;
		if (entB === this._ENCOUNTER_SHAPE_RANDOM) return 1;
		if (entA === this._ENCOUNTER_SHAPE_CUSTOM) return 1;
		if (entB === this._ENCOUNTER_SHAPE_CUSTOM) return -1;
		return SortUtil.ascSortGenericEntity(entA, entB);
	}

	/* -------------------------------------------- */

	_lookup = {};
	_list = [];

	_customEncounterShapeTemplate = null;

	async pInit () {
		const encounterShapes = [
			this.constructor._ENCOUNTER_SHAPE_RANDOM,
			...(await DataLoader.pCacheAndGetAllSite("encounterShape")),
			...(await DataLoader.pCacheAndGetAllBrew("encounterShape")),
			...(await DataLoader.pCacheAndGetAllPrerelease("encounterShape")),
			this.constructor._ENCOUNTER_SHAPE_CUSTOM,
		];
		this.addData({encounterShapes});
	}

	addData ({encounterShapes}) {
		(encounterShapes || [])
			.forEach(encounterShape => {
				const hash = UrlUtil.URL_TO_HASH_BUILDER["encounterShape"](encounterShape);
				this._lookup[hash] = encounterShape;
			});

		this._list = Object.entries(this._lookup)
			.sort(([, entA], [, entB]) => this.constructor._sortEncounterShapes(entA, entB));
	}

	/* -------------------------------------------- */

	getEncounterShape (encounterShapeHash) {
		const encounterShape = this._lookup[encounterShapeHash];
		if (
			encounterShape !== this.constructor._ENCOUNTER_SHAPE_CUSTOM
			|| this._customEncounterShapeTemplate == null
		) return encounterShape;

		return {
			...encounterShape,
			shapeTemplate: [
				MiscUtil.copyFast(this._customEncounterShapeTemplate),
			],
		};
	}

	/* -------------------------------------------- */

	getHashList () {
		return this._list.map(([hash]) => hash);
	}

	getEntityList () {
		return this._list.map(([, ent]) => ent);
	}

	/* -------------------------------------------- */

	setCustomShapeTemplate (val) { this._customEncounterShapeTemplate = val; }

	/* -------------------------------------------- */

	isCustomEncounterHash (hash) {
		return hash === UrlUtil.URL_TO_HASH_BUILDER["encounterShape"](this.constructor._ENCOUNTER_SHAPE_CUSTOM);
	}
}
