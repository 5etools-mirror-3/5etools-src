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
		<div class="edge__title mb-2">UPDATE YOUR BROWSER</div>
		<div><i>It looks like you're using an outdated/unsupported browser.<br>
		5etools recommends and supports the latest <a href="https://www.google.com/chrome/" class="edge__link">Chrome</a> and the latest <a href="https://www.mozilla.org/firefox/" class="edge__link">Firefox</a>.</i></div>
	</div>`;

	eleOverlay.prepend(btnClose);

	document.body.appendChild(eleOverlay);
});
