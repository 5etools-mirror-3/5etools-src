const _HISTORY_DEFAULT_SIZE = 10;

export class DmScreenSettings extends BaseComponent {
	getIsConfirmOnPanelTabClose () { return this._state.isConfirmOnPanelTabClose; }
	getIsHistoryEnabled () { return this._state.isHistoryEnabled; }
	getIsPreserveEmbedsOnSaveSlotChange () { return this._state.isPreserveEmbedsOnSaveSlotChange; }
	getHistorySize () { return this._state.historySize; }

	getSerializedState () {
		return {
			ctc: !!this._state.isConfirmOnPanelTabClose,
			he: !!this._state.isHistoryEnabled,
			pe: !!this._state.isPreserveEmbedsOnSaveSlotChange,
			hs: this._state.historySize,
		};
	}

	setStateFromSerialized ({ctc, he, pe, hs} = {}) {
		const historySize = !isNaN(hs)
			? Math.min(Math.max(Number(hs), 1), 99)
			: _HISTORY_DEFAULT_SIZE;

		this._proxyAssignSimple(
			"state",
			{
				isConfirmOnPanelTabClose: ctc ?? false,
				isHistoryEnabled: he ?? true,
				isPreserveEmbedsOnSaveSlotChange: pe ?? false,
				historySize,
			},
		);
	}

	_getDefaultState () {
		return {
			isConfirmOnPanelTabClose: false,
			isHistoryEnabled: true,
			isPreserveEmbedsOnSaveSlotChange: false,
			historySize: _HISTORY_DEFAULT_SIZE,
		};
	}
}
