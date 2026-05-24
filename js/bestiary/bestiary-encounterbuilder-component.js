import {EncounterBuilderComponent} from "../encounterbuilder/encounterbuilder-component.js";

export class EncounterBuilderComponentBestiary extends EncounterBuilderComponent {
	_partyComps;

	constructor ({partyComps, ...rest}) {
		super({...rest});
		this._partyComps = partyComps;
	}

	getSublistPluginState () {
		return {
			// region Special handling for `creatureMetas`
			items: this._state.creatureMetas
				.map(creatureMeta => ({
					h: creatureMeta.getHash(),
					c: creatureMeta.getCount(),
					customHashId: creatureMeta.getCustomHashId(),
					cId: creatureMeta.id,
					l: creatureMeta.getIsLocked(),
				})),
			sources: this._state.creatureMetas
				.map(creatureMeta => creatureMeta.getCreature().source)
				.unique(),
			// endregion

			// region State from sub-components
			// Note that we do not track rule comp state here, as it is purely "UI" state,
			//   rather than "portable encounter info" state.
			activePartyId: this._activePartyComp?.partyId || this._partyComps[0]?.partyId,
			statePartyComps: Object.fromEntries(
				this._partyComps
					.map(partyComp => [partyComp.partyId, partyComp.getSaveableState()]),
			),
			// endregion

			// region Other state, tracked on the UI component
			// Currently:
			//    - `"customShapeGroups"`
			...Object.fromEntries(
				Object.entries(this._state)
					.filter(([k]) => k !== "creatureMetas" && !k.startsWith("pulse"))
					.map(([k, v]) => [k, MiscUtil.copyFast(v)]),
			),
			// endregion
		};
	}

	/** Get a generic representation of the encounter, which can be used elsewhere. */
	static getStateFromExportedSublist ({exportedSublist}) {
		exportedSublist = MiscUtil.copyFast(exportedSublist);

		const out = this._getDefaultState();
		Object.keys(out)
			.filter(k => exportedSublist[k] != null)
			.forEach(k => out[k] = exportedSublist[k]);

		if (exportedSublist.activePartyId != null) out.activePartyId = exportedSublist.activePartyId;
		if (exportedSublist.statePartyComps != null) out.statePartyComps = exportedSublist.statePartyComps;

		return out;
	}
}
