import {StatGenUiRenderLevelOneEntityBase} from "./statgen-ui-comp-levelone-entitybase.js";

export class StatGenUiRenderLevelOneBackground extends StatGenUiRenderLevelOneEntityBase {
	_title = "Background";
	_titleShort = "Backg.";
	_propIxEntity = "common_ixBackground";
	_propIxAbilityScoreSet = "common_ixAbilityScoreSetBackground";
	_propData = "_backgrounds";
	_propModalFilter = "_modalFilterBackgrounds";
	_propIsPreview = "common_isPreviewBackground";
	_propEntity = "background";
	_page = UrlUtil.PG_BACKGROUNDS;
	_propChoiceMetasFrom = "common_backgroundChoiceMetasFrom";
	_propChoiceWeighted = "common_backgroundChoiceMetasWeighted";

	_pb_getAbilityList () {
		return this._parent._pb_getBackgroundAbilityList();
	}

	_pb_getAbility () {
		return this._parent._pb_getBackgroundAbility();
	}
}
