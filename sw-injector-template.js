import { Workbox } from "workbox-window/Workbox.mjs";

// throwing an uncaught error ends execution of this script.
if (!navigator?.serviceWorker) throw new Error("no serviceWorker in navigator, no sw will be injected");

const throttle = (func, delay) => {
	let timeout = null;
	return function (...args) {
		if (timeout === null) {
			func.apply(this, args);
			timeout = setTimeout(() => { timeout = null; }, delay);
		}
	};
};

const pDoWaitForServiceWorkerActivation = sw => {
	if (sw.state === "activated") return Promise.resolve();

	return new Promise(resolve => {
		const onStateChange = () => {
			if (sw.state !== "activated") return;

			sw.removeEventListener("statechange", onStateChange);
			resolve();
		};

		sw.addEventListener("statechange", onStateChange);
	});
};

const fetchError = {
	"generic": throttle(() => {
		JqueryUtil.doToast({
			content: `Failed to fetch some generic content\u2014you are offline and have not viewed this content before. Pages may not load correctly.`,
			type: "warning",
			autoHideTime: 2_500 /* 2.5 seconds */,
		});
	}, 10_000 /* 10 seconds */),

	"json": throttle(() => {
		JqueryUtil.doToast({
			content: `Failed to fetch data\u2014you are offline and have not viewed this content before. This page may not load correctly.`,
			type: "danger",
			autoHideTime: 9_000 /* 9 seconds */,
		});
	}, 2_000 /* 2 seconds */),

	"image": throttle(() => {
		JqueryUtil.doToast({
			content: `Failed to fetch images\u2014you are offline and have not viewed this content before. Images may not display correctly.`,
			type: "info",
			autoHideTime: 5_000 /* 5 seconds */,
		});
	}, 60_000 /* 60 seconds */),
};

const wb = new Workbox("sw.js");

wb.addEventListener("waiting", ({sw}) => {
	if (!VetoolsConfig.get("ui", "isNotifyUpdates")) return;

	const btnUpdate = veT`<button class="ve-btn ve-btn-primary ve-btn-xs ve-ml-2 ve-w-140p">Update and Reload</button>`
		.vee.onn("click", async evt => {
			evt.stopPropagation();

			btnUpdate
				.vee.prop("disabled", true)
				.vee.txt("Updating...")
				.vee.addClass("ve-text-center");

			const pActivated = pDoWaitForServiceWorkerActivation(sw);
			wb.messageSkipWaiting();
			await pActivated;

			window.location.reload();
		});

	const lnk = veT`<a href="${Renderer.get().baseUrl}changelog.html" class="alert-link">changelog</a>`
		.vee.onn("click", evt => {
			evt.stopPropagation();
		});

	JqueryUtil.doToast({
		content: veT`<div>An update to ${window.location.hostname} is ready. See the ${lnk} for more info. ${btnUpdate}</div>`,
		type: "info",
		isAutoHide: false,
	});
});
// this is where we tell the service worker to start - after the page has loaded
// event listeners need to be added first
wb.register();

// below here is dragons, display ui for caching state

/**
 * ask the service worker to runtime cache files that match a regex
 * @param {RegExp} routeRegex the regex to use to determine if a file should be cached
 */
const swCacheRoutes = (routeRegex) => {
	wb.messageSW({
		type: "CACHE_ROUTES",
		payload: { routeRegex },
	});
	JqueryUtil.doToast({content: "Starting preload...", autoHideTime: 500});
};

/**
 * ask the service worker to cancel route caching
 */
const swCancelCacheRoutes = () => {
	wb.messageSW({type: "CANCEL_CACHE_ROUTES"});
	setTimeout(() => {
		removeDownloadBar();
		JqueryUtil.doToast("Preload was canceled. Some data may have been preloaded.");
	}, 1000);
};

/**
 * Ask the service worker to remove itself.
 */
const swResetAll = () => {
	wb.messageSW({type: "RESET"});
	JqueryUtil.doToast({content: "Resetting..."});
};

// icky global but no bundler, so no other good choice
globalThis.swCacheRoutes = swCacheRoutes;
globalThis.swResetAll = swResetAll;

let downloadBar = null;

/**
 * Remove the download bar from the dom, and null downloadBar.
 */
const removeDownloadBar = () => {
	if (downloadBar === null) return;
	downloadBar.wrapOuter.remove();
	downloadBar = null;
};

/**
 * Add the download bar to the dom, and write the jQuery object to downloadBar.
 * Bind event handlers.
 */
const initDownloadBar = () => {
	if (downloadBar !== null) removeDownloadBar();

	const displayProgress = veT`<div class="page__disp-download-progress-bar"></div>`;
	const displayPercent = veT`<div class="page__disp-download-progress-text ve-flex-vh-center ve-bold">0%</div>`;

	const btnCancel = veT`<button class="ve-btn ve-btn-default"><span class="glyphicon glyphicon-remove"></span></button>`
		.vee.onn("click", () => {
			swCancelCacheRoutes();
		});

	const wrapBar = veT`<div class="page__wrp-download-bar ve-w-100 ve-relative ve-mr-2">${displayProgress}${displayPercent}</div>`;
	const wrapOuter = veT`<div class="page__wrp-download">
		${wrapBar}
		${btnCancel}
	</div>`.appendTo(document.body);

	downloadBar = {wrapOuter, wrapBar, displayProgress, displayPercent};
};

/**
 * Update the ui of the download bar based on a new message from the service worker. If there is no download bar, make one.
 * @param {{type: string, payload: Object}} msg the message from the sw
 */
const updateDownloadBar = (msg) => {
	if (downloadBar === null) initDownloadBar();

	switch (msg.type) {
		case "CACHE_ROUTES_PROGRESS":
			// eslint-disable-next-line no-case-declarations
			const percent = msg.payload.fetchTotal
				? `${(100 * (msg.payload.fetched / msg.payload.fetchTotal)).toFixed(3)}%`
				: "100%";
			downloadBar.displayProgress.css({width: percent});
			downloadBar.displayPercent.txt(percent);
			// do a toast and cleanup if every single file has been downloaded.
			if (msg.payload.fetched === msg.payload.fetchTotal) finishedDownload();
			break;

		case "CACHE_ROUTES_ERROR":
			for (const error of msg.payload.errors) {
				// eslint-disable-next-line no-console
				console.error(error);
			}

			downloadBar.wrapBar.addClass("page__wrp-download-bar--error");
			downloadBar.displayProgress.addClass("page__disp-download-progress-bar--error");
			downloadBar.displayPercent.txt("Error!");

			setTimeout(() => {
				removeDownloadBar();
				JqueryUtil.doToast(
					{
						type: "warning",
						autoHideTime: 15_000,
						content: msg.payload.isQuotaExceeded
							? `Storage quota exceeded. You may have to reset preloaded data \u2014 or choose a smaller preload \u2014 then try again.`
							: `An error occurred while preloading. You may have gone offline, or the server may not be responding. Please try again. ${VeCt.STR_SEE_CONSOLE}`,
					},
				);
			}, 2_000);
			break;
	}
};

/**
 * Call when the progress is 100%, to remove the bar and do a toast
 */
const finishedDownload = () => {
	removeDownloadBar();
	JqueryUtil.doToast({type: "success", content: "Preload complete! The preloaded content is now ready for offline use."});
};

wb.addEventListener("message", event => {
	const msg = event.data;
	switch (msg.type) {
		case "FETCH_ERROR":
			fetchError[msg.payload]();
			break;
		case "CACHE_ROUTES_PROGRESS":
		case "CACHE_ROUTES_ERROR":
			updateDownloadBar(msg);
			break;
	}
});
