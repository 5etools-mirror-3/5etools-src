export class InitiativeTrackerConditionUtil {
	static getNewRowState ({name = null, color = null, turns = null} = {}) {
		return {
			id: CryptUtil.uid(),
			entity: {
				name: name ?? "",
				color: color ?? MiscUtil.randomColor(),
				turns: turns ?? null,
			},
		};
	}
}
