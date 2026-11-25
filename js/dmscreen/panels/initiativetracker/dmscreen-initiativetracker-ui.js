export class InitiativeTrackerUi {
	static getBtnPlayerVisible ({isVisible, fnOnClick, isTriState = false, additionalClasses}) {
		let isVisNum = Number(isVisible || false);

		const getTitle = () => isVisNum === 0 ? `Hidden in player view` : isVisNum === 1 ? `Shown in player view` : `Shown in player view on player characters, hidden in player view on monsters`;
		const getClasses = () => `${isVisNum === 0 ? `ve-btn-default` : isVisNum === 1 ? `ve-btn-primary` : `ve-btn-primary ve-btn-primary--half`} ve-btn ve-btn-xs ${(additionalClasses || []).join(" ")}`;
		const getIconClasses = () => isVisNum === 0 ? `glyphicon glyphicon-eye-close` : `glyphicon glyphicon-eye-open`;

		const dispIcon = veT`<span class="glyphicon ${getIconClasses()}"></span>`;
		const btnVisible = veT`<button class="${getClasses()}" title="${getTitle()}" tabindex="-1">${dispIcon}</button>`
			.vee.onn("click", () => {
				if (isVisNum === 0) isVisNum++;
				else if (isVisNum === 1) isVisNum = isTriState ? 2 : 0;
				else if (isVisNum === 2) isVisNum = 0;

				btnVisible.vee.tooltip(getTitle());
				btnVisible.vee.attr("class", getClasses());
				dispIcon.vee.attr("class", getIconClasses());

				fnOnClick();
			});

		return btnVisible;
	}
}
