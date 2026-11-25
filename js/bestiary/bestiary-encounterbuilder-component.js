import {EncounterBuilderComponent} from "../encounterbuilder/encounterbuilder-component.js";

export class EncounterBuilderComponentBestiary extends EncounterBuilderComponent {
	_partyComps;

	constructor ({partyComps, ...rest}) {
		super({...rest});
		this._partyComps = partyComps;
	}

	getSublistPluginState () {
		return {
			// region Special handling for `creatureGroups`
			items: this._state.creatureGroups
				.map(creatureGroup => ({
					h: creatureGroup.getHash(),
					c: creatureGroup.getCount(),
					customHashId: creatureGroup.getCustomHashId(),
					cId: creatureGroup.id,
					l: creatureGroup.getIsLocked(),
				})),
			sources: this._state.creatureGroups
				.map(creatureGroup => creatureGroup.getCreature().source)
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
					.filter(([k]) => k !== "creatureGroups" && !k.startsWith("pulse"))
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
