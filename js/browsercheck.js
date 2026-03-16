window.addEventListener("DOMContentLoaded", () => {
	if (typeof [].flat === "function") return;

	document.body.classList.add("edge__body");

	const btnClose = document.createElement("button");
	btnClose.className = "ve-btn ve-btn-danger edge__btn-close";
	btnClose.innerHTML = `<span class="glyphicon glyphicon-remove"></span>`;
	btnClose.addEventListener("click", () => {
		eleOverlay.remove();
		document.body.classList.remove("edge__body");
	});

	const eleOverlay = document.createElement("div");
	eleOverlay.className = "ve-flex-col ve-flex-vh-center edge__overlay";
	eleOverlay.innerHTML = `<div class="ve-flex-col ve-flex-vh-center">
		<div class="edge__title ve-mb-2">UPDATE YOUR BROWSER</div>
		<div><i>It looks like you're using an outdated/unsupported browser.<br>
		5etools recommends and supports the latest <a href="https://www.google.com/chrome/" class="edge__link">Chrome</a> and the latest <a href="https://www.mozilla.org/firefox/" class="edge__link">Firefox</a>.</i></div>
	</div>`;

	eleOverlay.prepend(btnClose);

	document.body.appendChild(eleOverlay);
});

window.addEventListener("load", () => {
	if (!navigator.userAgent.includes("FoundryVirtualTabletop")) return;

	JqueryUtil.initEnhancements();

	const btnGoBack = ee`<button class="ve-btn ve-btn-default ve-btn-xxs">Go Back</button>`
		.onn("click", () => {
			history.back();
		});

	JqueryUtil.doToast({
		content: ee`<div>It looks like you're using the Foundry app! Some module features may be unavailable or fail to function. Consider using a <a href="https://foundryvtt.com/article/installation/#dedicated">dedicated/headless server</a> instead, and connecting with your browser. Alternatively, ${btnGoBack}.</div>`
			.onn("click", evt => {
				evt.stopPropagation();
			}),
		type: "warning",
		isAutoHide: false,
	});
});
