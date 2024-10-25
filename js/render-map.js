"use strict";

class RenderMap {
	static _ZOOM_ADJUSTMENT_FACTOR = 1.5;

	// See:
	//  - https://developer.mozilla.org/en-US/docs/Web/HTML/Element/canvas#maximum_canvas_size
	//  - https://jhildenbiddle.github.io/canvas-size/#/?id=test-results
	static _MAX_CANVAS_AREA = Math.pow(2, 14) * Math.pow(2, 14);
	// Arbitrary
	static _MIN_CANVAS_AREA = Math.pow(2, 8) * Math.pow(2, 8);

	static _AREA_CACHE = {};

	/* -------------------------------------------- */

	static async pShowViewer (evt, ele) {
		const mapData = JSON.parse(ele.dataset.rdPackedMap);

		if (!mapData.page) mapData.page = ele.dataset.rdAdventureBookMapPage;
		if (!mapData.source) mapData.source = ele.dataset.rdAdventureBookMapSource;
		if (!mapData.hash) mapData.hash = ele.dataset.rdAdventureBookMapHash;

		await RenderMap._pMutMapData(mapData);

		if (!mapData.loadedImage) return;

		const fnGetContainerDimensions = () => {
			const {wWrpContent, hWrapContent} = hoverWindow.getPosition();
			return {w: wWrpContent, h: hWrapContent};
		};

		const {$wrp, setZoom} = this._$getWindowContent({mapData, fnGetContainerDimensions});

		const hoverWindow = Renderer.hover.getShowWindow(
			$wrp,
			// Open in the top-right corner of the screen
			Renderer.hover.getWindowPositionExact(document.body.clientWidth, 7, evt),
			{
				title: `Dynamic Map Viewer`,
				isPermanent: true,
				isBookContent: true,
				width: Math.min(Math.floor(document.body.clientWidth / 2), mapData.width),
				height: mapData.height + 32,
				$pFnGetPopoutContent: () => this._$getWindowContent({mapData, fnGetContainerDimensions}).$wrp,
				fnGetPopoutSize: () => {
					const zoomInfo = this._getValidZoomInfo(mapData);
					return {
						width: Math.min(window.innerWidth, zoomInfo.widthZoomed),
						height: Math.min(window.innerHeight, zoomInfo.heightZoomed + 32),
					};
				},
				isPopout: !!evt.shiftKey,
			},
		);

		this._mutInitialZoom({
			fnGetContainerDimensions,
			mapData,
			setZoom,
		});
	}

	/* -------------------------------------------- */

	static async $pGetRendered (mapData, {fnGetContainerDimensions = null} = {}) {
		await RenderMap._pMutMapData(mapData);
		if (!mapData.loadedImage) return;
		const {$wrp, setZoom} = this._$getWindowContent({mapData, fnGetContainerDimensions});
		this._mutInitialZoom({
			fnGetContainerDimensions,
			mapData,
			setZoom,
		});
		return $wrp;
	}

	/* -------------------------------------------- */

	static _mutInitialZoom ({fnGetContainerDimensions, mapData, setZoom}) {
		if (!fnGetContainerDimensions) return;

		const zoomLevelFill = this._getValidZoomInfoFitFill({width: mapData.width, height: mapData.height, fnGetContainerDimensions, mode: "fill"});

		setZoom(zoomLevelFill.zoomLevel);
	}

	/* -------------------------------------------- */

	static async _pMutMapData (mapData) {
		// Store some additional data on this mapData state object
		mapData.activeWindows = {};
		mapData.loadedImage = await RenderMap._pLoadImage(mapData);

		if (!mapData.loadedImage) return;

		mapData.width = mapData.width || mapData.loadedImage.naturalWidth;
		mapData.height = mapData.height || mapData.loadedImage.naturalHeight;

		const zoomInfo = this._getValidZoomInfo({width: mapData.width, height: mapData.height, zoomLevel: 1.0});
		mapData.zoomLevel = zoomInfo.zoomLevel;
	}

	static async _pLoadImage (mapData) {
		const image = new Image();
		const pLoad = new Promise((resolve, reject) => {
			image.onload = () => resolve(image);
			image.onerror = err => reject(err);
		});
		image.src = mapData.href;

		let out = null;
		try {
			out = await pLoad;
		} catch (e) {
			JqueryUtil.doToast({type: "danger", content: `Failed to load image! ${VeCt.STR_SEE_CONSOLE}`});
			setTimeout(() => { throw e; });
		}
		return out;
	}

	/* -------------------------------------------- */

	static _ZoomInfo = class {
		isCappedMin = false;
		isCappedMax = false;
		zoomLevel;
		widthZoomed;
		heightZoomed;

		constructor (
			{
				isCappedMin = false,
				isCappedMax = false,
				zoomLevel,
				widthZoomed,
				heightZoomed,
			},
		) {
			this.isCappedMin = isCappedMin;
			this.isCappedMax = isCappedMax;
			this.zoomLevel = zoomLevel;
			this.widthZoomed = widthZoomed;
			this.heightZoomed = heightZoomed;
		}
	};

	static _getValidZoomInfo ({width, height, zoomLevel}) {
		const widthZoomed = Math.round(width * zoomLevel);
		const heightZoomed = Math.round(height * zoomLevel);
		const area = widthZoomed * heightZoomed;

		if (area > this._MAX_CANVAS_AREA) {
			const zoomLevelMax = Math.sqrt(1 / (width * height / this._MAX_CANVAS_AREA));

			// Use `.floor` to ensure rounding doesn't push us over the limit
			const widthZoomedMax = Math.floor(width * zoomLevelMax);
			const heightZoomedMax = Math.floor(height * zoomLevelMax);

			return new this._ZoomInfo({isCappedMax: true, zoomLevel: zoomLevelMax, widthZoomed: widthZoomedMax, heightZoomed: heightZoomedMax});
		}

		if (area < this._MIN_CANVAS_AREA) {
			const zoomLevelMin = Math.sqrt(1 / (width * height / this._MIN_CANVAS_AREA));

			// Use `.ceil` to ensure rounding doesn't push us under the limit
			const widthZoomedMin = Math.ceil(width * zoomLevelMin);
			const heightZoomedMin = Math.ceil(height * zoomLevelMin);

			return new this._ZoomInfo({isCappedMin: true, zoomLevel: zoomLevelMin, widthZoomed: widthZoomedMin, heightZoomed: heightZoomedMin});
		}

		return new this._ZoomInfo({isCappedMax: area === this._MAX_CANVAS_AREA, isCappedMin: area === this._MIN_CANVAS_AREA, zoomLevel, widthZoomed, heightZoomed});
	}

	/* -------------------------------------------- */

	static _getValidZoomInfoFitFill ({width, height, fnGetContainerDimensions = null, mode}) {
		if (!fnGetContainerDimensions) return this._getValidZoomInfo({width, height, zoomLevel: 1.0});

		const {w: widthContainer, h: heightContainer} = fnGetContainerDimensions();
		// Compensate for scrollbars/header
		const widthMapDisplay = widthContainer - 10;
		const heightMapDisplay = heightContainer - 56;

		const zoomLevelFillWidth = widthMapDisplay / width;
		const zoomInfoFillWidth = this._getValidZoomInfo({width, height, zoomLevel: zoomLevelFillWidth});

		const zoomLevelFillHeight = heightMapDisplay / height;
		const zoomInfoFillHeight = this._getValidZoomInfo({width, height, zoomLevel: zoomLevelFillHeight});

		switch (mode) {
			case "fit": return zoomInfoFillHeight.zoomLevel > zoomInfoFillWidth.zoomLevel ? zoomInfoFillWidth : zoomInfoFillHeight;
			case "fill": return zoomInfoFillWidth.zoomLevel > zoomInfoFillHeight.zoomLevel ? zoomInfoFillWidth : zoomInfoFillHeight;
			default: throw new Error(`Unhandled mode "${mode}"!`);
		}
	}

	/* -------------------------------------------- */

	/**
	 * @param {object} mapData
	 * @param {?Function} fnGetContainerDimensions
	 */
	static _$getWindowContent ({mapData, fnGetContainerDimensions = null}) {
		const X = 0;
		const Y = 1;

		const $cvs = $(`<canvas class="p-0 m-0"></canvas>`);
		const cvs = $cvs[0];
		cvs.width = mapData.width;
		cvs.height = mapData.height;
		const ctx = cvs.getContext("2d");

		const zoomChange = (direction) => {
			if (direction != null) {
				const lastZoomLevel = mapData.zoomLevel;

				switch (direction) {
					case "in": {
						const zoomInfoCurrent = this._getValidZoomInfo(mapData);
						if (zoomInfoCurrent.isCappedMax) return; // FIXME(Future) always false

						mapData.zoomLevel = this._getValidZoomInfo({
							width: mapData.width,
							height: mapData.height,
							zoomLevel: mapData.zoomLevel * this._ZOOM_ADJUSTMENT_FACTOR,
						}).zoomLevel;
						break;
					}

					case "out": {
						const zoomInfoCurrent = this._getValidZoomInfo(mapData);
						if (zoomInfoCurrent.isCappedMin) return; // FIXME(Future) always false

						mapData.zoomLevel = this._getValidZoomInfo({
							width: mapData.width,
							height: mapData.height,
							zoomLevel: mapData.zoomLevel / this._ZOOM_ADJUSTMENT_FACTOR,
						}).zoomLevel;
						break;
					}

					case "fill": {
						mapData.zoomLevel = this._getValidZoomInfoFitFill({
							width: mapData.width,
							height: mapData.height,
							fnGetContainerDimensions,
							mode: "fill",
						}).zoomLevel;
						break;
					}

					case "fit": {
						mapData.zoomLevel = this._getValidZoomInfoFitFill({
							width: mapData.width,
							height: mapData.height,
							fnGetContainerDimensions,
							mode: "fit",
						}).zoomLevel;
					}
				}

				if (Parser.isNumberNearEqual(lastZoomLevel, mapData.zoomLevel)) return;
			}

			onZoomChange();
		};

		const onZoomChange = () => {
			const zoomInfo = this._getValidZoomInfo(mapData);

			const diffWidth = zoomInfo.widthZoomed - cvs.width;
			const diffHeight = zoomInfo.heightZoomed - cvs.height;

			const eleWrpCvs = $wrpCvs[0];
			const scrollLeft = eleWrpCvs.scrollLeft;
			const scrollTop = eleWrpCvs.scrollTop;

			cvs.width = zoomInfo.widthZoomed;
			cvs.height = zoomInfo.heightZoomed;

			// Scroll to offset the zoom, keeping the same region centred
			eleWrpCvs.scrollTo(
				scrollLeft + Math.round(diffWidth / 2),
				scrollTop + Math.round(diffHeight / 2),
			);
			paint();
		};

		const zoomChangeDebounced = MiscUtil.debounce(zoomChange, 20);

		const getZoomedPoint = (pt) => {
			return [
				Math.round(pt[X] * mapData.zoomLevel),
				Math.round(pt[Y] * mapData.zoomLevel),
			];
		};

		const paint = () => {
			ctx.clearRect(0, 0, cvs.width, cvs.height);
			ctx.drawImage(mapData.loadedImage, 0, 0, cvs.width, cvs.height);

			mapData.regions.forEach(region => {
				ctx.lineWidth = 2;
				ctx.strokeStyle = "#337ab7";
				ctx.fillStyle = "#337ab760";

				ctx.beginPath();
				region.points.forEach(pt => {
					pt = getZoomedPoint(pt);
					ctx.lineTo(pt[X], pt[Y]);
				});

				let firstPoint = region.points[0];
				firstPoint = getZoomedPoint(firstPoint);
				ctx.lineTo(firstPoint[X], firstPoint[Y]);

				ctx.fill();
				ctx.stroke();
				ctx.closePath();
			});
		};

		const getEventPoint = evt => {
			const {top: cvsTopPos, left: cvsLeftPos} = cvs.getBoundingClientRect();
			const clientX = EventUtil.getClientX(evt);
			const clientY = EventUtil.getClientY(evt);

			const cvsSpaceX = clientX - cvsLeftPos;
			const cvsSpaceY = clientY - cvsTopPos;

			const cvsZoomedSpaceX = Math.round((1 / mapData.zoomLevel) * cvsSpaceX);
			const cvsZoomedSpaceY = Math.round((1 / mapData.zoomLevel) * cvsSpaceY);

			return [
				cvsZoomedSpaceX,
				cvsZoomedSpaceY,
			];
		};

		const lastRmbMeta = {
			body: null,
			point: null,
			time: null,
			scrollPos: null,
		};

		$cvs
			.on("click", async evt => {
				const clickPt = getEventPoint(evt);

				const intersectedRegions = RenderMap._getIntersectedRegions(mapData.regions, clickPt);

				// Arbitrarily choose the first region if we intersect multiple
				const intersectedRegion = intersectedRegions[0];
				if (!intersectedRegion) return;

				const area = await RenderMap._pGetArea(intersectedRegion.area, mapData);

				// When in book mode, shift-click a region to navigate to it
				if (evt.shiftKey && typeof BookUtil !== "undefined") {
					const oldHash = location.hash;
					location.hash = `#${BookUtil.curRender.curBookId},${area.chapter},${UrlUtil.encodeForHash(area.entry.name)},0`;
					if (oldHash.toLowerCase() === location.hash.toLowerCase()) {
						BookUtil.isHashReload = true;
						BookUtil.booksHashChange();
					}
					return;
				}

				// If the window already exists, maximize it and bring it to the front
				if (mapData.activeWindows[area.entry.id]) {
					const windowMeta = mapData.activeWindows[area.entry.id];
					windowMeta.doZIndexToFront();
					windowMeta.doMaximize();
					return;
				}

				const $content = Renderer.hover.$getHoverContent_generic(area.entry, {isLargeBookContent: true, depth: area.depth});
				mapData.activeWindows[area.entry.id] = Renderer.hover.getShowWindow(
					$content,
					Renderer.hover.getWindowPositionExactVisibleBottom(
						EventUtil.getClientX(evt),
						EventUtil.getClientY(evt),
						evt,
					),
					{
						title: area.entry.name || "",
						isPermanent: true,
						isBookContent: true,
						cbClose: () => {
							delete mapData.activeWindows[area.entry.id];
						},
					},
				);
			})
			.on("mousedown", evt => {
				if (evt.button !== 2) return; // RMB

				const eleWrpCvs = $wrpCvs[0];
				cvs.style.cursor = "grabbing";

				// Find the nearest body, in case we're in a popout window
				lastRmbMeta.body = lastRmbMeta.body || $out.closest("body")[0];
				lastRmbMeta.point = [EventUtil.getClientX(evt), EventUtil.getClientY(evt)];
				lastRmbMeta.time = Date.now();
				lastRmbMeta.scrollPos = [eleWrpCvs.scrollLeft, eleWrpCvs.scrollTop];

				$(lastRmbMeta.body)
					.off(`mouseup.rd__map`)
					.on(`mouseup.rd__map`, evt => {
						if (evt.button !== 2) return; // RMB

						$(lastRmbMeta.body)
							.off(`mouseup.rd__map`)
							.off(`mousemove.rd__map`);

						cvs.style.cursor = "";

						lastRmbMeta.point = null;
						lastRmbMeta.time = null;
						lastRmbMeta.scrollPos = null;
					})
					.off(`mousemove.rd__map`)
					.on(`mousemove.rd__map`, evt => {
						if (lastRmbMeta.point == null) return;

						const movePt = [EventUtil.getClientX(evt), EventUtil.getClientY(evt)];

						const diffX = lastRmbMeta.point[X] - movePt[X];
						const diffY = lastRmbMeta.point[Y] - movePt[Y];

						lastRmbMeta.time = Date.now();

						eleWrpCvs.scrollTo(
							lastRmbMeta.scrollPos[X] + diffX,
							lastRmbMeta.scrollPos[Y] + diffY,
						);
					})
					// Bind a document-wide handler to block the context menu at the end of the pan
					.off(`contextmenu.rd__map`)
					.on(`contextmenu.rd__map`, evt => {
						evt.stopPropagation();
						evt.preventDefault();

						$(lastRmbMeta.body).off(`contextmenu.rd__map`);
					});
			});

		const $btnZoomMinus = $(`<button class="ve-btn ve-btn-xs ve-btn-default"><span class="glyphicon glyphicon-zoom-out"></span> Zoom Out</button>`)
			.on("click", () => zoomChange("out"));

		const $btnZoomPlus = $(`<button class="ve-btn ve-btn-xs ve-btn-default"><span class="glyphicon glyphicon-zoom-in"></span> Zoom In</button>`)
			.on("click", () => zoomChange("in"));

		const $btnZoomReset = $(`<button class="ve-btn ve-btn-xs ve-btn-default mr-2"><span class="glyphicon glyphicon-search"></span> Reset Zoom</button>`)
			.on("click", () => zoomChange("fill"));

		const $btnZoomFit = $(`<button class="ve-btn ve-btn-xs ve-btn-default"><span class="glyphicon glyphicon-search"></span> Zoom to Fit</button>`)
			.on("click", () => zoomChange("fit"));

		const $btnHelp = $(`<button class="ve-btn ve-btn-xs ve-btn-default ml-auto mr-4" title="Help"><span class="glyphicon glyphicon-info-sign"></span> Help</button>`)
			.on("click", evt => {
				const {$modalInner} = UiUtil.getShowModal({
					title: "Help",
					isMinHeight0: true,
					window: evt.view?.window,
				});

				$modalInner.append(`
					<p><i>Use of the &quot;Open as Popup Window&quot; button in the window title bar is recommended.</i></p>
					<ul>
						<li>Left-click to open an area as a new window.</li>
						<li><kbd>SHIFT</kbd>-left-click to jump to an area.</li>
						<li>Right-click and drag to pan.</li>
						<li><kbd>CTRL</kbd>-scroll to zoom.</li>
					</ul>
				`);
			});

		const $wrpCvs = $$`<div class="w-100 h-100 ve-overflow-x-scroll ve-overflow-y-scroll rd__scroller-viewer ${mapData.expectsLightBackground ? "rd__scroller-viewer--bg-light" : mapData.expectsDarkBackground ? "rd__scroller-viewer--bg-dark" : ""}">
			${$cvs}
		</div>`
			.on("mousewheel DOMMouseScroll", evt => {
				if (!EventUtil.isCtrlMetaKey(evt)) return;
				evt.stopPropagation();
				evt.preventDefault();
				evt = evt.originalEvent; // Access the underlying properties

				const direction = (evt.wheelDelta != null && evt.wheelDelta > 0)
					|| (evt.deltaY != null && evt.deltaY < 0)
					// `evt.detail` seems to work on Firefox
					|| (evt.detail != null && !isNaN(evt.detail) && evt.detail < 0) ? "in" : "out";
				zoomChangeDebounced(direction);
			});

		const $out = $$`<div class="ve-flex-col w-100 h-100">
			<div class="ve-flex no-shrink p-2">
				<div class="ve-btn-group ve-flex mr-2">
					${$btnZoomMinus}
					${$btnZoomPlus}
				</div>
				${$btnZoomReset}
				${$btnZoomFit}
				${$btnHelp}
			</div>
			${$wrpCvs}
		</div>`;

		zoomChange();

		return {
			$wrp: $out,
			setZoom: zoomLevel => {
				if (Parser.isNumberNearEqual(zoomLevel, mapData.zoomLevel)) return;

				const zoomInfo = this._getValidZoomInfo({width: mapData.width, height: mapData.height, zoomLevel});
				mapData.zoomLevel = zoomInfo.zoomLevel;

				onZoomChange();
			},
		};
	}

	static async _pGetArea (areaId, mapData) {
		// When in book mode, we already have the area info cached
		if (typeof BookUtil !== "undefined") return BookUtil.curRender.headerMap[areaId] || {entry: {name: ""}};

		if (mapData.page && mapData.source && mapData.hash) {
			const fromCache = MiscUtil.get(RenderMap._AREA_CACHE, mapData.source, mapData.hash, areaId);
			if (fromCache) return fromCache;

			const loaded = await DataLoader.pCacheAndGet(mapData.page, mapData.source, mapData.hash);
			(RenderMap._AREA_CACHE[mapData.source] =
				RenderMap._AREA_CACHE[mapData.source] || {})[mapData.hash] =
				Renderer.adventureBook.getEntryIdLookup((loaded.adventureData || loaded.bookData).data);
			return RenderMap._AREA_CACHE[mapData.source][mapData.hash][areaId];
		}

		throw new Error(`Could not load area "${areaId}"`);
	}

	static _getIntersectedRegions (regions, pt) {
		return regions.filter(region => this._getIntersectedRegions_isIntersected(region.points.map(it => ({x: it[0], y: it[1]})), pt));
	}

	// Based on: https://rosettacode.org/wiki/Ray-casting_algorithm
	static _getIntersectedRegions_isIntersected (bounds, pt) {
		const [x, y] = pt;

		let count = 0;
		const len = bounds.length;
		for (let i = 0; i < len; ++i) {
			const vertex1 = bounds[i];
			const vertex2 = bounds[(i + 1) % len];
			if (this._getIntersectedRegions_isWest(vertex1, vertex2, x, y)) ++count;
		}

		return count % 2;
	}

	/**
	 * @return {boolean} true if (x,y) is west of the line segment connecting A and B
	 */
	static _getIntersectedRegions_isWest (A, B, x, y) {
		if (A.y <= B.y) {
			if (y <= A.y || y > B.y || (x >= A.x && x >= B.x)) {
				return false;
			} else if (x < A.x && x < B.x) {
				return true;
			} else {
				return (y - A.y) / (x - A.x) > (B.y - A.y) / (B.x - A.x);
			}
		} else {
			return this._getIntersectedRegions_isWest(B, A, x, y);
		}
	}
}
