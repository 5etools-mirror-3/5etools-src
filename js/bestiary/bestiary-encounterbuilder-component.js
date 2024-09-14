import {EncounterBuilderComponent} from "../encounterbuilder/encounterbuilder-component.js";

export class EncounterBuilderComponentBestiary extends EncounterBuilderComponent {
	getSublistPluginState () {
		return {
			// region Special handling for `creatureMetas`
			items: this._state.creatureMetas
				.map(creatureMeta => ({
					h: creatureMeta.getHash(),
					c: creatureMeta.count,
					customHashId: creatureMeta.customHashId || undefined,
					l: creatureMeta.isLocked,
				})),
			sources: this._state.creatureMetas
				.map(creatureMeta => creatureMeta.creature.source)
				.unique(),
			// endregion

			...Object.fromEntries(
				Object.entries(this._state)
					.filter(([k]) => k !== "creatureMetas")
					.map(([k, v]) => [k, MiscUtil.copyFast(v)]),
			),
		};
	}

	/** Get a generic representation of the encounter, which can be used elsewhere. */
	static getStateFromExportedSublist ({exportedSublist}) {
		exportedSublist = MiscUtil.copyFast(exportedSublist);

		const out = this._getDefaultState();
		Object.keys(out)
			.filter(k => exportedSublist[k] != null)
			.forEach(k => out[k] = exportedSublist[k]);
		return out;
	}
}
