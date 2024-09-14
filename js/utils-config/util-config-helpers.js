export class UtilConfigHelpers {
	static packSettingId (groupId, configId) {
		return `${groupId}.${configId}`;
	}

	static unpackSettingId (settingId) {
		const [groupId, configId] = settingId.split(".");
		return {groupId, configId};
	}
}
