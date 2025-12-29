"use strict";

// ENTRY RENDERING =====================================================================================================
/*
 * // EXAMPLE USAGE //
 *
 * const entryRenderer = new Renderer();
 *
 * const topLevelEntry = mydata[0];
 * // prepare an array to hold the string we collect while recursing
 * const textStack = [];
 *
 * // recurse through the entry tree
 * entryRenderer.renderEntries(topLevelEntry, textStack);
 *
 * // render the final product by joining together all the collected strings
 * $("#myElement").html(toDisplay.join(""));
 */
globalThis.Renderer = function () {
	this.wrapperTag = "div";
	this.baseUrl = "";
	this.baseMediaUrls = {};

	if (globalThis.RENDERER_BASE_URL) {
		this.baseUrl = globalThis.RENDERER_BASE_URL;
	}

	if (globalThis.DEPLOYED_IMG_ROOT) {
		this.baseMediaUrls["img"] = globalThis.DEPLOYED_IMG_ROOT;
	}

	this._lazyImages = false;
	this._lazyImages_opts = {};
	this._isMinimizeLayoutShift = false;
	this._subVariant = false;
	this._firstSection = true;
	this._isAddHandlers = true;
	this._headerIndex = 1;
	this._tagExportDict = null;
	this._roll20Ids = null;
	this._trackTitles = {enabled: false, titles: {}};
	this._enumerateTitlesRel = {enabled: false, titles: {}};
	this._isHeaderIndexIncludeTableCaptions = false;
	this._isHeaderIndexIncludeImageTitles = false;
	this._plugins = {};
	this._fnPostProcess = null;
	this._extraSourceClasses = null;
	this._depthTracker = null;
	this._depthTrackerAdditionalProps = [];
	this._depthTrackerAdditionalPropsInherited = [];
	this._lastDepthTrackerInheritedProps = {};
	this._isInternalLinksDisabled = false;
	this._isPartPageExpandCollapseDisabled = false;
	this._fnsGetStyleClasses = {};

	/**
	 * Enables/disables lazy-load image rendering.
	 * @param bool true to enable, false to disable.
	 */
	this.setLazyImages = function (bool) {
		// hard-disable lazy loading if the Intersection API is unavailable (e.g. under iOS 12)
		if (typeof IntersectionObserver === "undefined") this._lazyImages = false;
		else this._lazyImages = !!bool;
		return this;
	};

	this.withLazyImages = function (fn, {isAllowCanvas = false} = {}) {
		const valOriginal = this._lazyImages;
		const optsOriginal = this._lazyImages_opts;
		try {
			this.setLazyImages(true);
			this._lazyImages_opts = {isAllowCanvas};
			const out = fn(this);
			Renderer.initLazyImageLoaders();
			return out;
		} finally {
			this.setLazyImages(valOriginal);
			this._lazyImages_opts = optsOriginal;
		}
	};

	this.setMinimizeLayoutShift = function (bool) {
		this._isMinimizeLayoutShift = !!bool;
		return this;
	};

	this.withMinimizeLayoutShift = function (fn) {
		const valOriginal = this._isMinimizeLayoutShift;
		try {
			this.setMinimizeLayoutShift(true);
			return fn(this);
		} finally {
			this.setMinimizeLayoutShift(valOriginal);
		}
	};

	/**
	 * Set the tag used to group rendered elements
	 * @param tag to use
	 */
	this.setWrapperTag = function (tag) { this.wrapperTag = tag; return this; };

	/**
	 * Set the base url for rendered links.
	 * Usage: `renderer.setBaseUrl("https://www.example.com/")` (note the "http" prefix and "/" suffix)
	 * @param url to use
	 */
	this.setBaseUrl = function (url) { this.baseUrl = url; return this; };

	this.setBaseMediaUrl = function (mediaDir, url) { this.baseMediaUrls[mediaDir] = url; return this; };

	this.getMediaUrl = function (mediaDir, path) {
		if (Renderer.get().baseMediaUrls[mediaDir]) return `${Renderer.get().baseMediaUrls[mediaDir]}${path}`;
		return `${Renderer.get().baseUrl}${mediaDir}/${path}`;
	};

	/**
	 * Other sections should be prefixed with a vertical divider
	 * @param bool
	 */
	this.setFirstSection = function (bool) { this._firstSection = bool; return this; };

	/**
	 * Disable adding JS event handlers on elements.
	 * @param bool
	 */
	this.setAddHandlers = function (bool) { this._isAddHandlers = bool; return this; };

	/**
	 * Add a post-processing function which acts on the final rendered strings from a root call.
	 * @param fn
	 */
	this.setFnPostProcess = function (fn) { this._fnPostProcess = fn; return this; };

	/**
	 * Specify a list of extra classes to be added to those rendered on entries with sources.
	 * @param arr
	 */
	this.setExtraSourceClasses = function (arr) { this._extraSourceClasses = arr; return this; };

	// region Header index
	/**
	 * Headers are ID'd using the attribute `data-title-index` using an incrementing int. This resets it to 1.
	 */
	this.resetHeaderIndex = function () {
		this._headerIndex = 1;
		this._trackTitles.titles = {};
		this._enumerateTitlesRel.titles = {};
		return this;
	};

	this.getHeaderIndex = function () { return this._headerIndex; };

	this.setHeaderIndexTableCaptions = function (bool) { this._isHeaderIndexIncludeTableCaptions = bool; return this; };
	this.setHeaderIndexImageTitles = function (bool) { this._isHeaderIndexIncludeImageTitles = bool; return this; };
	// endregion

	/**
	 * Pass an object to have the renderer export lists of found @-tagged content during renders
	 *
	 * @param toObj the object to fill with exported data. Example results:
	 * 			{
	 *				commoner_mm: {page: "bestiary.html", source: "MM", hash: "commoner_mm"},
	 *				storm%20giant_mm: {page: "bestiary.html", source: "MM", hash: "storm%20giant_mm"},
	 *				detect%20magic_phb: {page: "spells.html", source: "PHB", hash: "detect%20magic_phb"}
	 *			}
	 * 			These results intentionally match those used for hover windows, so can use the same cache/loading paths
	 */
	this.doExportTags = function (toObj) {
		this._tagExportDict = toObj;
		return this;
	};

	/**
	 * Reset/disable tag export
	 */
	this.resetExportTags = function () {
		this._tagExportDict = null;
		return this;
	};

	this.setRoll20Ids = function (roll20Ids) {
		this._roll20Ids = roll20Ids;
		return this;
	};

	this.resetRoll20Ids = function () {
		this._roll20Ids = null;
		return this;
	};

	/** Used by Foundry config. */
	this.setInternalLinksDisabled = function (val) { this._isInternalLinksDisabled = !!val; return this; };
	this.isInternalLinksDisabled = function () { return !!this._isInternalLinksDisabled; };

	this.setPartPageExpandCollapseDisabled = function (val) { this._isPartPageExpandCollapseDisabled = !!val; return this; };

	/** Bind function which apply extra CSS classes to entry/list renders.  */
	this.setFnGetStyleClasses = function (identifier, fn) {
		if (fn == null) {
			delete this._fnsGetStyleClasses[identifier];
			return this;
		}

		this._fnsGetStyleClasses[identifier] = fn;
		return this;
	};

	/**
	 * If enabled, titles with the same name will be given numerical identifiers.
	 * This identifier is stored in `data-title-relative-index`
	 */
	this.setEnumerateTitlesRel = function (bool) {
		this._enumerateTitlesRel.enabled = bool;
		return this;
	};

	this._getEnumeratedTitleRel = function (name) {
		if (this._enumerateTitlesRel.enabled && name) {
			const clean = name.toLowerCase();
			this._enumerateTitlesRel.titles[clean] = this._enumerateTitlesRel.titles[clean] || 0;
			return `data-title-relative-index="${this._enumerateTitlesRel.titles[clean]++}"`;
		} else return "";
	};

	this.setTrackTitles = function (bool) {
		this._trackTitles.enabled = bool;
		return this;
	};

	this.getTrackedTitles = function () {
		return MiscUtil.copyFast(this._trackTitles.titles);
	};

	this.getTrackedTitlesInverted = function ({isStripTags = false} = {}) {
		// `this._trackTitles.titles` is a map of `{[data-title-index]: "<name>"}`
		// Invert it such that we have a map of `{"<name>": ["data-title-index-0", ..., "data-title-index-n"]}`
		const trackedTitlesInverse = {};
		Object.entries(this._trackTitles.titles || {}).forEach(([titleIx, titleName]) => {
			if (isStripTags) titleName = Renderer.stripTags(titleName);
			titleName = titleName.toLowerCase().trim();
			(trackedTitlesInverse[titleName] = trackedTitlesInverse[titleName] || []).push(titleIx);
		});
		return trackedTitlesInverse;
	};

	this._handleTrackTitles = function (name, {isTable = false, isImage = false} = {}) {
		if (!this._trackTitles.enabled) return;
		if (isTable && !this._isHeaderIndexIncludeTableCaptions) return;
		if (isImage && !this._isHeaderIndexIncludeImageTitles) return;
		this._trackTitles.titles[this._headerIndex] = name;
	};

	this._handleTrackDepth = function (entry, depth) {
		if (!entry.name || !this._depthTracker) return;

		this._lastDepthTrackerInheritedProps = MiscUtil.copyFast(this._lastDepthTrackerInheritedProps);
		if (entry.source) this._lastDepthTrackerInheritedProps.source = entry.source;
		if (this._depthTrackerAdditionalPropsInherited?.length) {
			this._depthTrackerAdditionalPropsInherited.forEach(prop => this._lastDepthTrackerInheritedProps[prop] = entry[prop] || this._lastDepthTrackerInheritedProps[prop]);
		}

		const additionalData = this._depthTrackerAdditionalProps.length
			? this._depthTrackerAdditionalProps.mergeMap(it => ({[it]: entry[it]}))
			: {};

		this._depthTracker.push({
			...this._lastDepthTrackerInheritedProps,
			...additionalData,
			depth,
			name: entry.name,
			type: entry.type,
			ixHeader: this._headerIndex,
			source: this._lastDepthTrackerInheritedProps.source,
			data: entry.data,
			page: entry.page,
			alias: entry.alias,
			entry,
		});
	};

	/**
	 * Specify an array where the renderer will record rendered header depths.
	 * Items added to the array are of the form: `{name: "Header Name", depth: 1, type: "entries", source: "PHB"}`
	 * @param arr
	 * @param additionalProps Additional data props which should be tracked per-entry.
	 * @param additionalPropsInherited As per additionalProps, but if a parent entry has the prop, it should be passed
	 * to its children.
	 */
	this.setDepthTracker = function (arr, {additionalProps, additionalPropsInherited} = {}) {
		this._depthTracker = arr;
		this._depthTrackerAdditionalProps = additionalProps || [];
		this._depthTrackerAdditionalPropsInherited = additionalPropsInherited || [];
		return this;
	};

	this.withDepthTracker = function (arr, fn, {additionalProps, additionalPropsInherited} = {}) {
		const depthTrackerPrev = this._depthTracker;
		const depthTrackerAdditionalPropsPrev = this._depthTrackerAdditionalProps;
		const depthTrackerAdditionalPropsInheritedPrev = this._depthTrackerAdditionalPropsInherited;

		let out;
		try {
			this.setDepthTracker(
				arr,
				{
					additionalProps,
					additionalPropsInherited,
				},
			);
			out = fn({renderer: this});
		} finally {
			this.setDepthTracker(
				depthTrackerPrev,
				{
					additionalProps: depthTrackerAdditionalPropsPrev,
					additionalPropsInherited: depthTrackerAdditionalPropsInheritedPrev,
				},
			);
		}
		return out;
	};

	/* -------------------------------------------- */

	// region Plugins
	this.addPlugin = function (pluginType, fnPlugin) {
		MiscUtil.getOrSet(this._plugins, pluginType, []).push(fnPlugin);
	};

	this.removePlugin = function (pluginType, fnPlugin) {
		if (!fnPlugin) return;
		const ix = (MiscUtil.get(this._plugins, pluginType) || []).indexOf(fnPlugin);
		if (~ix) this._plugins[pluginType].splice(ix, 1);
	};

	this.removePlugins = function (pluginType) {
		MiscUtil.delete(this._plugins, pluginType);
	};

	this._getPlugins = function (pluginType) { return this._plugins[pluginType] ||= []; };

	this._applyPlugins_useFirst = function (pluginType, commonArgs, pluginArgs) {
		for (const plugin of this._getPlugins(pluginType)) {
			const out = plugin(commonArgs, pluginArgs);
			if (out) return out;
		}
	};

	this._applyPlugins_useAll = function (pluginType, commonArgs, pluginArgs) {
		const plugins = this._getPlugins(pluginType);
		if (!plugins?.length) return null;

		let input = pluginArgs.input;
		for (const plugin of plugins) {
			input = plugin(commonArgs, pluginArgs) ?? input;
		}
		return input;
	};

	this._applyPlugins_getAll = function (pluginType, commonArgs, pluginArgs) {
		const plugins = this._getPlugins(pluginType);
		if (!plugins?.length) return [];

		return plugins
			.map(plugin => plugin(commonArgs, pluginArgs))
			.filter(Boolean);
	};

	/** Run a function with the given plugin active. */
	this.withPlugin = function ({pluginTypes, fnPlugin, fn}) {
		for (const pt of pluginTypes) this.addPlugin(pt, fnPlugin);
		try {
			return fn(this);
		} finally {
			for (const pt of pluginTypes) this.removePlugin(pt, fnPlugin);
		}
	};

	/** Run an async function with the given plugin active. */
	this.pWithPlugin = async function ({pluginTypes, fnPlugin, pFn}) {
		for (const pt of pluginTypes) this.addPlugin(pt, fnPlugin);
		try {
			const out = await pFn(this);
			return out;
		} finally {
			for (const pt of pluginTypes) this.removePlugin(pt, fnPlugin);
		}
	};
	// endregion

	this.getLineBreak = function () { return "<br>"; };

	/**
	 * Recursively walk down a tree of "entry" JSON items, adding to a stack of strings to be finally rendered to the
	 * page. Note that this function does _not_ actually do the rendering, see the example code above for how to display
	 * the result.
	 *
	 * @param entry An "entry" usually defined in JSON. A schema is available in tests/schema
	 * @param textStack A reference to an array, which will hold all our strings as we recurse
	 * @param [meta] Meta state.
	 * @param [meta.depth] The current recursion depth. Optional; default 0, or -1 for type "section" entries.
	 * @param [options] Render options.
	 * @param [options.prefix] String to prefix rendered lines with.
	 * @param [options.suffix] String to suffix rendered lines with.
	 */
	this.recursiveRender = function (entry, textStack, meta, options) {
		if (entry instanceof Array) {
			entry.forEach(nxt => this.recursiveRender(nxt, textStack, meta, options));
			setTimeout(() => { throw new Error(`Array passed to renderer! The renderer only guarantees support for primitives and basic objects.`); });
			return this;
		}

		// respect the API of the original, but set up for using string concatenations
		if (textStack.length === 0) textStack[0] = "";
		else textStack.reverse();

		// initialise meta
		meta = meta || {};
		meta._typeStack = [];
		meta.depth = meta.depth == null ? 0 : meta.depth;
		meta.styleHint ||= VetoolsConfig.get("styleSwitcher", "style");

		this._recursiveRender(entry, textStack, meta, options);
		if (this._fnPostProcess) textStack[0] = this._fnPostProcess(textStack[0]);
		textStack.reverse();

		return this;
	};

	/**
	 * Inner rendering code. Uses string concatenation instead of an array stack, for ~2x the speed.
	 * @param entry As above.
	 * @param textStack As above.
	 * @param meta As above, with the addition of...
	 * @param options
	 *          .prefix The (optional) prefix to be added to the textStack before whatever is added by the current call
	 *          .suffix The (optional) suffix to be added to the textStack after whatever is added by the current call
	 * @private
	 */
	this._recursiveRender = function (entry, textStack, meta, options) {
		if (entry == null) return; // Avoid dying on nully entries
		if (!textStack) throw new Error("Missing stack!");
		if (!meta) throw new Error("Missing metadata!");

		options = options || {};

		// For wrapped entries, simply recurse
		if (entry.type === "wrapper") return this._recursiveRender(entry.wrapped, textStack, meta, options);

		if (entry.type === "section") meta.depth = -1;

		meta._didRenderPrefix = false;
		meta._didRenderSuffix = false;

		if (typeof entry === "object") {
			// the root entry (e.g. "Rage" in barbarian "classFeatures") is assumed to be of type "entries"
			const type = entry.type == null || entry.type === "section" ? "entries" : entry.type;

			meta._typeStack.push(type);

			switch (type) {
				// recursive
				case "entries": this._renderEntries(entry, textStack, meta, options); break;
				case "options": this._renderOptions(entry, textStack, meta, options); break;
				case "list": this._renderList(entry, textStack, meta, options); break;
				case "table": this._renderTable(entry, textStack, meta, options); break;
				case "tableGroup": this._renderTableGroup(entry, textStack, meta, options); break;
				case "inset": this._renderInset(entry, textStack, meta, options); break;
				case "insetReadaloud": this._renderInsetReadaloud(entry, textStack, meta, options); break;
				case "variant": this._renderVariant(entry, textStack, meta, options); break;
				case "variantInner": this._renderVariantInner(entry, textStack, meta, options); break;
				case "variantSub": this._renderVariantSub(entry, textStack, meta, options); break;
				case "spellcasting": this._renderSpellcasting(entry, textStack, meta, options); break;
				case "quote": this._renderQuote(entry, textStack, meta, options); break;
				case "optfeature": this._renderOptfeature(entry, textStack, meta, options); break;
				case "patron": this._renderPatron(entry, textStack, meta, options); break;

				// block
				case "abilityDc": this._renderAbilityDc(entry, textStack, meta, options); break;
				case "abilityAttackMod": this._renderAbilityAttackMod(entry, textStack, meta, options); break;
				case "abilityGeneric": this._renderAbilityGeneric(entry, textStack, meta, options); break;

				// inline
				case "inline": this._renderInline(entry, textStack, meta, options); break;
				case "inlineBlock": this._renderInlineBlock(entry, textStack, meta, options); break;
				case "bonus": this._renderBonus(entry, textStack, meta, options); break;
				case "bonusSpeed": this._renderBonusSpeed(entry, textStack, meta, options); break;
				case "dice": this._renderDice(entry, textStack, meta, options); break;
				case "link": this._renderLink(entry, textStack, meta, options); break;
				case "actions": this._renderActions(entry, textStack, meta, options); break;
				case "attack": this._renderAttack(entry, textStack, meta, options); break;
				case "ingredient": this._renderIngredient(entry, textStack, meta, options); break;

				// list items
				case "item": this._renderItem(entry, textStack, meta, options); break;
				case "itemSub": this._renderItemSub(entry, textStack, meta, options); break;
				case "itemSpell": this._renderItemSpell(entry, textStack, meta, options); break;

				// embedded entities
				case "statblockInline": this._renderStatblockInline(entry, textStack, meta, options); break;
				case "statblock": this._renderStatblock(entry, textStack, meta, options); break;

				// images
				case "image": this._renderImage(entry, textStack, meta, options); break;
				case "gallery": this._renderGallery(entry, textStack, meta, options); break;

				// flowchart
				case "flowchart": this._renderFlowchart(entry, textStack, meta, options); break;
				case "flowBlock": this._renderFlowBlock(entry, textStack, meta, options); break;

				// homebrew changes
				case "homebrew": this._renderHomebrew(entry, textStack, meta, options); break;

				// misc
				case "code": this._renderCode(entry, textStack, meta, options); break;
				case "hr": this._renderHr(entry, textStack, meta, options); break;

				// raw
				case "wrappedHtml": textStack[0] += entry.html; break;
			}

			meta._typeStack.pop();
		} else if (typeof entry === "string") { // block
			this._renderPrefix(entry, textStack, meta, options);
			this._renderString(entry, textStack, meta, options);
			this._renderSuffix(entry, textStack, meta, options);
		} else { // block
			// for ints or any other types which do not require specific rendering
			this._renderPrefix(entry, textStack, meta, options);
			this._renderPrimitive(entry, textStack, meta, options);
			this._renderSuffix(entry, textStack, meta, options);
		}
	};

	this._RE_TEXT_ALIGN = /\btext-(?:center|right|left)\b/g;
	this._RE_COL_D = /\bcol-\d\d?(?:-\d\d?)?\b/g;

	this._getMutatedStyleString = function (str) {
		if (!str) return str;
		return str
			.replace(this._RE_TEXT_ALIGN, "ve-$&")
			.replace(this._RE_COL_D, "ve-$&")
		;
	};

	this._adjustDepth = function (meta, dDepth) {
		const cachedDepth = meta.depth;
		meta.depth += dDepth;
		meta.depth = Math.min(Math.max(-1, meta.depth), 2); // cap depth between -1 and 2 for general use
		return cachedDepth;
	};

	this._renderPrefix = function (entry, textStack, meta, options) {
		if (meta._didRenderPrefix) return;
		if (options.prefix != null) {
			textStack[0] += options.prefix;
			meta._didRenderPrefix = true;
		}
	};

	this._renderSuffix = function (entry, textStack, meta, options) {
		if (meta._didRenderSuffix) return;
		if (options.suffix != null) {
			textStack[0] += options.suffix;
			meta._didRenderSuffix = true;
		}
	};

	this._renderImage = function (entry, textStack, meta, options) {
		if (entry.title) this._handleTrackTitles(entry.title, {isImage: true});

		if (entry.imageType === "map" || entry.imageType === "mapPlayer") textStack[0] += `<div class="rd__wrp-map">`;
		textStack[0] += `<div class="${meta._typeStack.includes("gallery") ? "rd__wrp-gallery-image" : ""}">`;

		const href = this._renderImage_getUrl(entry);

		const ptTitleCreditTooltip = this._renderImage_getTitleCreditTooltipText(entry);
		const ptTitle = ptTitleCreditTooltip ? `title="${ptTitleCreditTooltip}"` : "";
		const pluginDataIsNoLink = this._applyPlugins_useFirst("image_isNoLink", {textStack, meta, options}, {input: entry});

		const ptLabels = this._renderImage_geLabels(entry);

		textStack[0] += `<div class="${this._renderImage_getWrapperClasses(entry, meta)}" ${entry.title && this._isHeaderIndexIncludeImageTitles ? `data-title-index="${this._headerIndex++}"` : ""}>
			<div class="w-100 h-100 relative">
				${pluginDataIsNoLink ? "" : `<a class="relative" href="${href}" target="_blank" rel="noopener noreferrer" ${ptTitle}>`}
					${this._renderImage_getImg({entry, meta, href, pluginDataIsNoLink, ptTitle})}
				${pluginDataIsNoLink ? "" : `</a>`}
				${ptLabels}
			</div>
		</div>`;

		if (!this._renderImage_isComicStyling(entry) && (entry.title || entry.credit || entry.mapRegions)) {
			const ptAdventureBookMeta = entry.mapRegions && meta.adventureBookPage && meta.adventureBookSource && meta.adventureBookHash
				? `data-rd-adventure-book-map-page="${meta.adventureBookPage.qq()}" data-rd-adventure-book-map-source="${meta.adventureBookSource.qq()}" data-rd-adventure-book-map-hash="${meta.adventureBookHash.qq()}"`
				: "";

			textStack[0] += `<div class="rd__image-title">`;

			const isDynamicViewer = entry.mapRegions && !globalThis.IS_VTT;

			if (entry.title && !isDynamicViewer) textStack[0] += `<div class="rd__image-title-inner">${this.render(entry.title)}</div>`;

			if (isDynamicViewer) {
				textStack[0] += `<button class="ve-btn ve-btn-xs ve-btn-default rd__image-btn-viewer" onclick="RenderMap.pShowViewer(event, this)" data-rd-packed-map="${this._renderImage_getMapRegionData(entry)}" ${ptAdventureBookMeta} title="Open Dynamic Viewer (SHIFT to Open in New Window)"><span class="glyphicon glyphicon-picture"></span> ${Renderer.stripTags(entry.title) || "Dynamic Viewer"}</button>`;
			}

			if (entry.credit) textStack[0] += `<div class="rd__image-credit ve-muted"><span class="glyphicon glyphicon-pencil" title="Art Credit"></span> ${this.render(entry.credit)}</div>`;

			textStack[0] += `</div>`;
		}

		if (entry._galleryTitlePad) textStack[0] += `<div class="rd__image-title">&nbsp;</div>`;
		if (entry._galleryCreditPad) textStack[0] += `<div class="rd__image-credit">&nbsp;</div>`;

		textStack[0] += `</div>`;
		if (entry.imageType === "map" || entry.imageType === "mapPlayer") textStack[0] += `</div>`;
	};

	this._renderImage_getImg = function (
		{
			entry,
			meta,
			href,
			pluginDataIsNoLink,
			ptTitle,
		},
	) {
		const hasWidthHeight = entry.width != null && entry.height != null;
		const isLazy = this._lazyImages && hasWidthHeight;
		const isMinimizeLayoutShift = this._isMinimizeLayoutShift && hasWidthHeight;

		const svg = isLazy || isMinimizeLayoutShift
			? `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${entry.width}" height="${entry.height}"><rect width="100%" height="100%" fill="${Renderer.utils.lazy.COLOR_PLACEHOLDER}"></rect></svg>`)}`
			: null;

		const ptAttributesShared = [
			pluginDataIsNoLink ? ptTitle : "",
			entry.altText || entry.title ? `alt="${Renderer.stripTags((entry.altText || entry.title)).qq()}"` : "",
			isLazy || isMinimizeLayoutShift ? `${Renderer.utils.lazy.ATTR_IMG_FINAL_SRC}="${href}"` : `loading="lazy"`,
			this._renderImage_getStylePart(entry),
		]
			.filter(Boolean)
			.join(" ");

		const imgOut = `<img class="${this._renderImage_getImageClasses(entry, meta)}" ${ptAttributesShared} src="${svg || href}" ${!isLazy && isMinimizeLayoutShift ? `onload="Renderer.utils.lazy.handleLoad_imgMinimizeLayoutShift(this)"` : ""}>`;

		if (
			!hasWidthHeight
			|| !isLazy
			|| pluginDataIsNoLink
		) return imgOut;

		if (!this._lazyImages_opts?.isAllowCanvas) return imgOut;

		const {width: screenWidth} = window.screen;

		if (entry.width <= screenWidth) return imgOut;

		const cappedWidth = screenWidth;
		const cappedHeight = Math.round(entry.height / (entry.width / cappedWidth));

		return `<canvas class="${this._renderImage_getImageClasses(entry, meta)} rd__cvs-image" ${ptAttributesShared} width="${cappedWidth}" height="${cappedHeight}"></canvas>`;
	};

	this._renderImage_getTitleCreditTooltipText = function (entry) {
		if (!entry.title && !entry.credit) return null;
		return Renderer.stripTags(
			[entry.title, entry.credit ? `Art credit: ${entry.credit}` : null]
				.filter(Boolean)
				.join(". "),
		).qq();
	};

	this._renderImage_geLabels = function (entry) {
		if (
			!entry.labelMapRegions
			|| !globalThis.BookUtil?.curRender?.headerMap
			|| !globalThis.polylabel
			|| !entry.width
			|| !entry.height
			|| !entry.mapRegions?.length
		) return "";

		const tagInfo = Renderer.tag.TAG_LOOKUP.area;

		return entry.mapRegions
			.map(region => {
				const area = globalThis.BookUtil.curRender.headerMap[region.area];
				if (!area) return "";

				// TODO(Future) refine
				// TODO(Future) allow area to define name
				const areaName = area.name.split(/[.:; ]/)[0].slice(0, 4);

				const mapRegionPointsGeoJson = [region.points];
				const [xNote, yNote] = polylabel(mapRegionPointsGeoJson);

				const [xLabel, yLabel] = polylabel(mapRegionPointsGeoJson);

				const pctLeft = ((xLabel / entry.width) * 100).toFixed(3);
				const pctTop = ((yLabel / entry.height) * 100).toFixed(3);

				const hoverMeta = Renderer.hover.getInlineHover(area.entry, {isLargeBookContent: true, depth: area.depth});

				const variantClass = areaName.length === 3 ? "rd__image-label-map-region--chars-3" : areaName.length >= 4 ? "rd__image-label-map-region--chars-4" : "";

				return `<a class="rd__image-label-map-region ${variantClass} absolute small-caps dnd-font bold ve-block ve-text-center ve-overflow-hidden" style="left: ${pctLeft}%; top: ${pctTop}%;" href="${tagInfo.getHref(globalThis.BookUtil.curRender, area)}" ${hoverMeta.html}>
					${areaName}
				</a>`;
			})
			.join("");
	};

	this._renderImage_getStylePart = function (entry) {
		const styles = [
			// N.b. this width/height should be reflected in the renderer image CSS
			// Clamp the max width at 100%, as per the renderer styling
			entry.maxWidth ? `max-width: min(100%, ${entry.maxWidth}${entry.maxWidthUnits || "px"})` : "",
			// Clamp the max height at 60vh, as per the renderer styling
			entry.maxHeight ? `max-height: min(60vh, ${entry.maxHeight}${entry.maxHeightUnits || "px"})` : "",
		].filter(Boolean).join("; ");
		return styles ? `style="${styles}"` : "";
	};

	this._renderImage_getMapRegionData = function (entry) {
		return JSON.stringify(this.getMapRegionData(entry)).escapeQuotes();
	};

	this.getMapRegionData = function (entry) {
		return {
			regions: entry.mapRegions,
			width: entry.width,
			height: entry.height,
			href: this._renderImage_getUrl(entry),
			hrefThumbnail: this._renderImage_getUrlThumbnail(entry),
			page: entry.page,
			source: entry.source,
			hash: entry.hash,
			...entry.expectsLightBackground
				? {expectsLightBackground: true}
				: entry.expectsDarkBackground
					? {expectsDarkBackground: true}
					: {},
		};
	};

	this._renderImage_isComicStyling = function (entry) {
		if (!entry.style) return false;
		return ["comic-speaker-left", "comic-speaker-right"].includes(entry.style);
	};

	this._renderImage_getWrapperClasses = function (entry) {
		const out = ["rd__wrp-image", "relative"];
		if (entry.expectsLightBackground) out.push("rd__wrp-image--bg", "rd__wrp-image--bg-light");
		else if (entry.expectsDarkBackground) out.push("rd__wrp-image--bg", "rd__wrp-image--bg-dark");
		if (entry.style) {
			switch (entry.style) {
				case "comic-speaker-left": out.push("rd__comic-img-speaker", "rd__comic-img-speaker--left"); break;
				case "comic-speaker-right": out.push("rd__comic-img-speaker", "rd__comic-img-speaker--right"); break;
			}
		}
		return out.join(" ");
	};

	this._renderImage_getImageClasses = function (entry) {
		const out = ["rd__image"];
		if (entry.style) {
			switch (entry.style) {
				case "deity-symbol": out.push("rd__img-small"); break;
			}
		}
		return out.join(" ");
	};

	this._renderImage_getUrl = function (entry) {
		let url = Renderer.utils.getEntryMediaUrl(entry, "href", "img");
		url = this._applyPlugins_useAll("image_urlPostProcess", null, {input: url}) ?? url;
		return url;
	};

	this._renderImage_getUrlThumbnail = function (entry) {
		let url = Renderer.utils.getEntryMediaUrl(entry, "hrefThumbnail", "img");
		url = this._applyPlugins_useAll("image_urlThumbnailPostProcess", null, {input: url}) ?? url;
		return url;
	};

	this._renderList_getListCssClasses = function (entry, textStack, meta, options) {
		const out = [`rd__list`];
		if (entry.style || entry.columns) {
			if (entry.style) out.push(...entry.style.split(" ").map(it => `rd__${it}`));
			if (entry.columns) out.push(`columns-${entry.columns}`);
		}
		return out.join(" ");
	};

	this._renderTableGroup = function (entry, textStack, meta, options) {
		const len = entry.tables.length;
		for (let i = 0; i < len; ++i) this._recursiveRender(entry.tables[i], textStack, meta);
	};

	this._renderTable = function (entry, textStack, meta, options) {
		// TODO add handling for rowLabel property
		if (entry.intro) {
			const len = entry.intro.length;
			for (let i = 0; i < len; ++i) {
				this._recursiveRender(entry.intro[i], textStack, meta, {prefix: "<p>", suffix: "</p>"});
			}
		}

		textStack[0] += `<table class="w-100 rd__table ${this._getMutatedStyleString(entry.style || "")} ${entry.isStriped === false ? "" : "stripe-odd-table"}" ${entry.caption ? `data-roll-name-ancestor="${Renderer.stripTags(entry.caption).qq()}"` : ""}>`;

		const headerRowMetas = Renderer.table.getHeaderRowMetas(entry);
		const autoRollMode = Renderer.table.getAutoConvertedRollMode(entry, {headerRowMetas});
		const isInfiniteResults = autoRollMode === RollerUtil.ROLL_COL_VARIABLE;

		// caption
		if (entry.caption != null) {
			this._handleTrackTitles(entry.caption, {isTable: true});
			textStack[0] += `<caption ${this._isHeaderIndexIncludeTableCaptions ? `data-title-index="${this._headerIndex++}"` : ""}>${entry.caption}</caption>`;
		}

		// body -- temporarily build this to own string; append after headers
		const rollCols = [];
		let bodyStack = [""];
		bodyStack[0] += "<tbody>";
		const lenRows = entry.rows.length;
		for (let ixRow = 0; ixRow < lenRows; ++ixRow) {
			bodyStack[0] += "<tr>";
			const r = entry.rows[ixRow];
			let roRender = r.type === "row" ? r.row : r;

			const len = roRender.length;
			for (let ixCell = 0; ixCell < len; ++ixCell) {
				rollCols[ixCell] = rollCols[ixCell] || false;

				// pre-convert rollables
				if (autoRollMode && ixCell === 0) {
					roRender = Renderer.getRollableRow(
						roRender,
						{
							isForceInfiniteResults: isInfiniteResults,
							isFirstRow: ixRow === 0,
							isLastRow: ixRow === lenRows - 1,
						},
					);
					rollCols[ixCell] = true;
				}

				let toRenderCell;
				if (roRender[ixCell].type === "cell") {
					if (roRender[ixCell].roll) {
						rollCols[ixCell] = true;
						if (roRender[ixCell].entry) {
							toRenderCell = roRender[ixCell].entry;
						} else if (roRender[ixCell].roll.exact != null) {
							toRenderCell = roRender[ixCell].roll.pad ? StrUtil.padNumber(roRender[ixCell].roll.exact, 2, "0") : roRender[ixCell].roll.exact;
						} else {
							// TODO(Future) render "negative infinite" minimum nicely (or based on an example from a book, if one ever occurs)
							//   "Selling a Magic Item" from DMG p129 almost meets this, but it has its own display

							const dispMin = roRender[ixCell].roll.displayMin != null ? roRender[ixCell].roll.displayMin : roRender[ixCell].roll.min;
							const dispMax = roRender[ixCell].roll.displayMax != null ? roRender[ixCell].roll.displayMax : roRender[ixCell].roll.max;

							if (dispMax === Renderer.dice.POS_INFINITE) {
								toRenderCell = roRender[ixCell].roll.pad
									? `${StrUtil.padNumber(dispMin, 2, "0")}+`
									: `${dispMin}+`;
							} else {
								toRenderCell = roRender[ixCell].roll.pad
									? `${StrUtil.padNumber(dispMin, 2, "0")}-${StrUtil.padNumber(dispMax, 2, "0")}`
									: `${dispMin}-${dispMax}`;
							}
						}
					} else if (roRender[ixCell].entry) {
						toRenderCell = roRender[ixCell].entry;
					}
				} else {
					toRenderCell = roRender[ixCell];
				}
				bodyStack[0] += `<td ${this._renderTable_makeTableTdClassText(entry, ixCell)} ${this._renderTable_getCellDataStr(roRender[ixCell])} ${roRender[ixCell].type === "cell" && roRender[ixCell].width ? `colspan="${roRender[ixCell].width}"` : ""}>`;
				if (r.style === "row-indent-first" && ixCell === 0) bodyStack[0] += `<div class="rd__tab-indent"></div>`;
				const cacheDepth = this._adjustDepth(meta, 1);
				this._recursiveRender(toRenderCell, bodyStack, meta);
				meta.depth = cacheDepth;
				bodyStack[0] += "</td>";
			}
			bodyStack[0] += "</tr>";
		}
		bodyStack[0] += "</tbody>";

		// header
		if (headerRowMetas) {
			textStack[0] += "<thead>";

			for (let ixRow = 0, lenRows = headerRowMetas.length; ixRow < lenRows; ++ixRow) {
				textStack[0] += "<tr>";

				const headerRowMeta = headerRowMetas[ixRow];
				for (let ixCell = 0, lenCells = headerRowMeta.length; ixCell < lenCells; ++ixCell) {
					const entCellHeader = headerRowMeta[ixCell];
					const colSpan = entCellHeader?.type === "cellHeader" ? entCellHeader.width : null;
					textStack[0] += `<th ${this._renderTable_getTableThClassText(entry, ixCell, entCellHeader)} data-rd-isroller="${rollCols[ixCell]}" ${entry.isNameGenerator ? `data-rd-namegeneratorrolls="${headerRowMeta.length - 1}"` : ""} ${colSpan ? `colspan="${colSpan}"` : ""}>`;
					const entryNxt = autoRollMode && ixCell === 0
						? RollerUtil.getFullRollCol(entCellHeader)
						: entCellHeader?.type === "cellHeader"
							? entCellHeader.entry
							: entCellHeader;
					this._recursiveRender(entryNxt, textStack, meta);
					textStack[0] += `</th>`;
				}

				textStack[0] += "</tr>";
			}

			textStack[0] += "</thead>";
		}

		textStack[0] += bodyStack[0];

		// footer
		if (entry.footnotes != null) {
			textStack[0] += "<tfoot>";
			const len = entry.footnotes.length;
			for (let i = 0; i < len; ++i) {
				textStack[0] += `<tr><td colspan="99">`;
				const cacheDepth = this._adjustDepth(meta, 1);
				this._recursiveRender(entry.footnotes[i], textStack, meta);
				meta.depth = cacheDepth;
				textStack[0] += "</td></tr>";
			}
			textStack[0] += "</tfoot>";
		}
		textStack[0] += "</table>";

		if (entry.outro) {
			const len = entry.outro.length;
			for (let i = 0; i < len; ++i) {
				this._recursiveRender(entry.outro[i], textStack, meta, {prefix: "<p>", suffix: "</p>"});
			}
		}
	};

	this._renderTable_getCellDataStr = function (ent) {
		function convertZeros (num) {
			if (num === 0) return 100;
			return num;
		}

		if (ent.roll) {
			return `data-roll-min="${convertZeros(ent.roll.exact != null ? ent.roll.exact : ent.roll.min)}" data-roll-max="${convertZeros(ent.roll.exact != null ? ent.roll.exact : ent.roll.max)}"`;
		}

		return "";
	};

	this._renderTable_getTableThClassText = function (entry, i, entCell) {
		const ptFromCol = entry.colStyles?.[i] ? this._getMutatedStyleString(entry.colStyles[i]) : "";
		const ptFromCell = entCell?.style ? entCell.style.split(" ").map(it => `rd__${it}`).join(" ") : "";
		return `class="rd__th ${ptFromCol} ${ptFromCell}"`;
	};

	this._renderTable_makeTableTdClassText = function (entry, i) {
		if (entry.rowStyles != null) return i >= entry.rowStyles.length ? "" : `class="${this._getMutatedStyleString(entry.rowStyles[i])}"`;
		else return this._renderTable_getTableThClassText(entry, i);
	};

	this._renderEntries = function (entry, textStack, meta, options) {
		this._renderEntriesSubtypes(entry, textStack, meta, options, true);
	};

	this._getPagePart = function (entry, isInset) {
		const isDisplaySource = !!entry.source;
		const isDisplayPage = Renderer.utils.isDisplayPage(entry.page);
		if (!isDisplaySource && !isDisplayPage) return "";
		return ` <span class="rd__title-link ${isInset ? `rd__title-link--inset` : ""}">${isDisplaySource ? `<span class="help-subtle" title="${Parser.sourceJsonToFull(entry.source)}">${Parser.sourceJsonToAbv(entry.source)}</span> ` : ""}${isDisplayPage ? `<span title="Page ${entry.page}">p${entry.page}</span>` : ""}</span>`;
	};

	this._renderEntriesSubtypes = function (entry, textStack, meta, options, incDepth) {
		const displayName = entry._displayName || entry.name;
		const isInlineTitle = meta.depth >= 2;

		const cachedLastDepthTrackerProps = MiscUtil.copyFast(this._lastDepthTrackerInheritedProps);
		this._handleTrackDepth(entry, meta.depth);

		if (isInlineTitle) {
			this._renderEntriesSubtypes_inline({
				entry,
				textStack,
				meta,
				options,
				displayName,
			});
		} else {
			this._renderEntriesSubtypes_block({
				entry,
				textStack,
				meta,
				options,
				incDepth,
				displayName,
			});
		}

		this._lastDepthTrackerInheritedProps = cachedLastDepthTrackerProps;
	};

	this._renderEntriesSubtypes_block = function ({entry, textStack, meta, options, incDepth, displayName}) {
		const pagePart = !this._isPartPageExpandCollapseDisabled
			? this._getPagePart(entry)
			: "";
		const partExpandCollapse = !this._isPartPageExpandCollapseDisabled
			? this._getPtExpandCollapse()
			: "";
		const partPageExpandCollapse = !this._isPartPageExpandCollapseDisabled && (pagePart || partExpandCollapse)
			? `<span class="ve-flex-vh-center">${[pagePart, partExpandCollapse].filter(Boolean).join("")}</span>`
			: "";

		const nextDepth = incDepth ? meta.depth + 1 : meta.depth;

		const styleString = this._renderEntriesSubtypes_getStyleString({entry, meta});

		const dataString = this._renderEntriesSubtypes_getDataString(entry);
		if (entry.name != null && Renderer.ENTRIES_WITH_ENUMERATED_TITLES_LOOKUP[entry.type]) this._handleTrackTitles(entry.name);

		const headerSpan = this._renderEntriesSubtypes_getHeaderSpan({
			entry,
			textStack,
			meta,
			options,
			displayName,
			headerTag: `h${Math.min(Math.max(meta.depth + 2, 1), 6)}`,
			pagePart,
			partPageExpandCollapse,
		});

		if (meta.depth === -1) {
			if (!this._firstSection) textStack[0] += `<hr class="rd__hr rd__hr--section">`;
			this._firstSection = false;
		}

		if (!entry.entries && !displayName) return;

		textStack[0] += `<${this.wrapperTag} ${dataString} ${styleString}>${headerSpan}`;
		this._renderEntriesSubtypes_renderPreReqText(entry, textStack, meta);
		if (entry.entries) {
			const cacheDepth = meta.depth;
			const len = entry.entries.length;
			for (let i = 0; i < len; ++i) {
				meta.depth = nextDepth;
				this._recursiveRender(entry.entries[i], textStack, meta, {prefix: "<p>", suffix: "</p>"});
			}
			meta.depth = cacheDepth;
		}
		textStack[0] += `</${this.wrapperTag}>`;
	};

	this._renderEntriesSubtypes_inline = function ({entry, textStack, meta, options, displayName}) {
		const styleString = this._renderEntriesSubtypes_getStyleString({entry, meta, isInlineTitle: true});

		const dataString = this._renderEntriesSubtypes_getDataString(entry);
		if (entry.name != null && Renderer.ENTRIES_WITH_ENUMERATED_TITLES_LOOKUP[entry.type]) this._handleTrackTitles(entry.name);

		const headerSpan = this._renderEntriesSubtypes_getHeaderSpan({
			entry,
			textStack,
			meta,
			options,
			displayName,
			headerTag: "span",
			isAddPeriod: displayName && !Renderer._INLINE_HEADER_TERMINATORS.has(displayName[displayName.length - 1]),
		});

		if (!entry.entries && !displayName) return;

		textStack[0] += `<${this.wrapperTag} ${dataString} ${styleString}>`;
		if (entry.entries) {
			const cacheDepth = meta.depth;
			const len = entry.entries.length;
			for (let i = 0; i < len; ++i) {
				meta.depth = 2;
				const toRender = i === 0 ? {type: "inlineBlock", entries: [{type: "wrappedHtml", html: headerSpan}, entry.entries[i]]} : entry.entries[i];
				this._recursiveRender(toRender, textStack, meta, {prefix: "<p>", suffix: "</p>"});
			}
			meta.depth = cacheDepth;
		} else {
			this._recursiveRender({type: "inlineBlock", entries: [{type: "wrappedHtml", html: headerSpan}]}, textStack, meta, {prefix: "<p>", suffix: "</p>"});
		}
		textStack[0] += `</${this.wrapperTag}>`;
	};

	this._renderEntriesSubtypes_getDataString = function (entry) {
		const displayName = entry._displayName || entry.name;
		let dataString = "";
		if (displayName) dataString += ` data-roll-name-ancestor="${Renderer.stripTags(displayName).qq()}"`;
		if (entry.source) dataString += ` data-source="${entry.source.qq()}"`;
		if (entry.data) {
			for (const k in entry.data) {
				if (!k.startsWith("rd-")) continue;
				dataString += ` data-${k}="${`${entry.data[k]}`.escapeQuotes()}"`;
			}
		}
		return dataString;
	};

	this._renderEntriesSubtypes_getHeaderSpan = function ({
		entry,
		textStack,
		meta,
		options,
		displayName,
		headerTag,
		pagePart = "",
		partPageExpandCollapse = "",
		isAddPeriod = false,
		isInset = false,
	}) {
		if (!displayName) return "";

		const type = entry.type || "entries";

		const headerClass = `rd__h--${meta.depth + 1}${isInset ? "-inset" : ""}`; // adjust as the CSS is 0..4 rather than -1..3
		const pluginDataNamePrefix = this._applyPlugins_getAll(`${type}_namePrefix`, {textStack, meta, options}, {input: entry});

		const ptText = `${pluginDataNamePrefix.join("")}${this.render({type: "inline", entries: [displayName]})}${isAddPeriod ? "." : ""}`;

		return `<${headerTag} class="rd__h ${headerClass}" data-title-index="${this._headerIndex++}" ${this._getEnumeratedTitleRel(entry.name)}> <span class="entry-title-inner${!pagePart && entry.source ? ` help-subtle` : ""}"${!pagePart && entry.source ? ` title="Source: ${Parser.sourceJsonToFull(entry.source)}${entry.page ? `, p${entry.page}` : ""}"` : ""}>${ptText}</span>${partPageExpandCollapse}</${headerTag}> `;
	};

	this._renderEntriesSubtypes_renderPreReqText = function (entry, textStack, meta) {
		if (!entry.prerequisite) return;

		/** @deprecated */
		if (entry.type === "optfeature") {
			textStack[0] += `<span class="rd__prerequisite">Prerequisite: `;
			this._recursiveRender({type: "inline", entries: [entry.prerequisite]}, textStack, meta);
			textStack[0] += `</span>`;
			return;
		}

		textStack[0] += `<p><i>${Renderer.utils.prerequisite.getHtml(entry.prerequisite, {styleHint: meta.styleHint})}</i></p>`;
	};

	this._renderEntriesSubtypes_getStyleString = function ({entry, meta, isInlineTitle = false}) {
		const styleClasses = ["rd__b"];
		styleClasses.push(this._getStyleClass(entry.type || "entries", entry));
		if (isInlineTitle) {
			if (this._subVariant) styleClasses.push(Renderer.HEAD_2_SUB_VARIANT);
			else styleClasses.push(Renderer.HEAD_2);
		} else {
			styleClasses.push(meta.depth === -1 ? Renderer.HEAD_NEG_1 : meta.depth === 0 ? Renderer.HEAD_0 : Renderer.HEAD_1);
		}
		return styleClasses.length > 0 ? `class="${styleClasses.join(" ")}"` : "";
	};

	this._renderOptions = function (entry, textStack, meta, options) {
		if (!entry.entries) return;
		entry.entries = entry.entries.sort((a, b) => a.name && b.name ? SortUtil.ascSort(a.name, b.name) : a.name ? -1 : b.name ? 1 : 0);

		if (entry.style && entry.style === "list-hang-notitle") {
			const fauxEntry = {
				type: "list",
				style: "list-hang-notitle",
				items: entry.entries.map(ent => {
					if (typeof ent === "string") return ent;
					if (ent.type === "item") return ent;

					const out = {...ent, type: "item"};
					if (ent.name) out.name = Renderer._INLINE_HEADER_TERMINATORS.has(ent.name[ent.name.length - 1]) ? out.name : `${out.name}.`;
					return out;
				}),
			};
			this._renderList(fauxEntry, textStack, meta, options);
		} else this._renderEntriesSubtypes(entry, textStack, meta, options, false);
	};

	this._renderList = function (entry, textStack, meta, options) {
		if (!entry.items) return;

		const start = (entry.start ?? 1) + (entry.name ? -1 : 0);
		const tag = start !== 1 ? "ol" : "ul";
		const cssClasses = this._renderList_getListCssClasses(entry, textStack, meta, options);
		textStack[0] += `<${tag} ${cssClasses ? `class="${cssClasses}"` : ""} ${start !== 1 ? `start="${start}"` : ""}>`;
		if (entry.name) textStack[0] += `<li class="rd__list-name">${this.render({type: "inline", entries: [entry.name]})}</li>`;
		const isListHang = entry.style && entry.style.split(" ").includes("list-hang");
		const len = entry.items.length;
		for (let i = 0; i < len; ++i) {
			const item = entry.items[i];
			// Special case for child lists -- avoid wrapping in LI tags to avoid double-bullet
			if (item.type !== "list") {
				const className = `${this._getStyleClass(entry.type, item)}${item.type === "itemSpell" ? " rd__li-spell" : ""}`;
				textStack[0] += `<li class="rd__li ${className}">`;
			}
			// If it's a raw string in a hanging list, wrap it in a div to allow for the correct styling
			if (isListHang && typeof item === "string") textStack[0] += "<div>";
			this._recursiveRender(item, textStack, meta);
			if (isListHang && typeof item === "string") textStack[0] += "</div>";
			if (item.type !== "list") textStack[0] += "</li>";
		}
		textStack[0] += `</${tag}>`;
	};

	this._getPtExpandCollapse = function () {
		return `<span class="rd__h-toggle ml-2 clickable no-select no-print lst-is-exporting-image__hidden" data-rd-h-toggle-button="true" title="Toggle Visibility (CTRL to Toggle All)">[\u2013]</span>`;
	};

	this._getPtExpandCollapseSpecial = function () {
		return `<span class="rd__h-toggle ml-2 clickable no-select no-print lst-is-exporting-image__hidden" data-rd-h-special-toggle-button="true" title="Toggle Visibility (CTRL to Toggle All)">[\u2013]</span>`;
	};

	/* -------------------------------------------- */

	this._renderInset_getCssClasses = function (entry, textStack, meta, options) {
		const out = ["rd__b-special", "rd__b-inset"];
		if (entry.type === "insetReadaloud") out.push("rd__b-inset--readaloud");
		if (entry.style) {
			out.push(
				...entry.style.split(" ")
					.map(pt => {
						if (pt === "comic-speaker") return "rd__b-inset--comic-speaker";

						const mutGeneric = this._getMutatedStyleString(pt);
						if (mutGeneric !== pt) return mutGeneric;

						return pt;
					}),
			);
		}
		return out.join(" ");
	};

	this._renderInset = function (entry, textStack, meta, options) {
		const dataString = this._renderEntriesSubtypes_getDataString(entry);
		textStack[0] += `<${this.wrapperTag} class="${this._renderInset_getCssClasses(entry, textStack, meta, options)}" ${dataString}>`;

		const cachedLastDepthTrackerProps = MiscUtil.copyFast(this._lastDepthTrackerInheritedProps);
		this._handleTrackDepth(entry, 1);

		const pagePart = this._getPagePart(entry, true);
		const partExpandCollapse = !this._isPartPageExpandCollapseDisabled ? this._getPtExpandCollapseSpecial() : "";
		const partPageExpandCollapse = `<span class="ve-flex-vh-center">${[pagePart, partExpandCollapse].filter(Boolean).join("")}</span>`;

		if (entry.name != null) {
			if (Renderer.ENTRIES_WITH_ENUMERATED_TITLES_LOOKUP[entry.type]) this._handleTrackTitles(entry.name);

			const cacheDepth = meta.depth;
			meta.depth = 1;
			const headerSpan = this._renderEntriesSubtypes_getHeaderSpan({
				entry,
				textStack,
				meta,
				options,
				displayName: entry.name,
				headerTag: `h4`,
				pagePart,
				partPageExpandCollapse,
				isInset: true,
			});
			meta.depth = cacheDepth;

			textStack[0] += headerSpan;
		} else {
			textStack[0] += `<span class="rd__h rd__h--2-inset rd__h--2-inset-no-name">${partPageExpandCollapse}</span>`;
		}

		if (entry.entries) {
			const len = entry.entries.length;
			for (let i = 0; i < len; ++i) {
				const cacheDepth = meta.depth;
				meta.depth = 2;
				this._recursiveRender(entry.entries[i], textStack, meta, {prefix: "<p>", suffix: "</p>"});
				meta.depth = cacheDepth;
			}
		}
		textStack[0] += `</${this.wrapperTag}>`;

		this._lastDepthTrackerInheritedProps = cachedLastDepthTrackerProps;
	};

	this._renderInsetReadaloud = function (entry, textStack, meta, options) {
		const dataString = this._renderEntriesSubtypes_getDataString(entry);
		textStack[0] += `<${this.wrapperTag} class="${this._renderInset_getCssClasses(entry, textStack, meta, options)}" ${dataString}>`;

		const cachedLastDepthTrackerProps = MiscUtil.copyFast(this._lastDepthTrackerInheritedProps);
		this._handleTrackDepth(entry, 1);

		const pagePart = this._getPagePart(entry, true);
		const partExpandCollapse = !this._isPartPageExpandCollapseDisabled ? this._getPtExpandCollapseSpecial() : "";
		const partPageExpandCollapse = `<span class="ve-flex-vh-center">${[pagePart, partExpandCollapse].filter(Boolean).join("")}</span>`;

		if (entry.name != null) {
			if (Renderer.ENTRIES_WITH_ENUMERATED_TITLES_LOOKUP[entry.type]) this._handleTrackTitles(entry.name);

			const cacheDepth = meta.depth;
			meta.depth = 1;
			const headerSpan = this._renderEntriesSubtypes_getHeaderSpan({
				entry,
				textStack,
				meta,
				options,
				displayName: entry.name,
				headerTag: `h4`,
				pagePart,
				partPageExpandCollapse,
				isInset: true,
			});
			meta.depth = cacheDepth;

			textStack[0] += headerSpan;
		} else {
			textStack[0] += `<span class="rd__h rd__h--2-inset rd__h--2-inset-no-name">${partPageExpandCollapse}</span>`;
		}

		const len = entry.entries.length;
		for (let i = 0; i < len; ++i) {
			const cacheDepth = meta.depth;
			meta.depth = 2;
			this._recursiveRender(entry.entries[i], textStack, meta, {prefix: "<p>", suffix: "</p>"});
			meta.depth = cacheDepth;
		}
		textStack[0] += `</${this.wrapperTag}>`;

		this._lastDepthTrackerInheritedProps = cachedLastDepthTrackerProps;
	};

	this._renderVariant = function (entry, textStack, meta, options) {
		const dataString = this._renderEntriesSubtypes_getDataString(entry);

		if (entry.name != null && Renderer.ENTRIES_WITH_ENUMERATED_TITLES_LOOKUP[entry.type]) this._handleTrackTitles(entry.name);
		const cachedLastDepthTrackerProps = MiscUtil.copyFast(this._lastDepthTrackerInheritedProps);
		this._handleTrackDepth(entry, 1);

		const pagePart = this._getPagePart(entry, true);
		const partExpandCollapse = !this._isPartPageExpandCollapseDisabled ? this._getPtExpandCollapseSpecial() : "";
		const partPageExpandCollapse = `<span class="ve-flex-vh-center">${[pagePart, partExpandCollapse].filter(Boolean).join("")}</span>`;

		textStack[0] += `<${this.wrapperTag} class="rd__b-special rd__b-inset" ${dataString}>`;

		const cacheDepth = meta.depth;
		meta.depth = 1;
		const headerSpan = this._renderEntriesSubtypes_getHeaderSpan({
			entry,
			textStack,
			meta,
			options,
			displayName: entry.name ? `Variant: ${entry.name}` : "Variant",
			headerTag: `h4`,
			pagePart,
			partPageExpandCollapse,
			isInset: true,
		});
		meta.depth = cacheDepth;

		textStack[0] += headerSpan;

		const len = entry.entries.length;
		for (let i = 0; i < len; ++i) {
			const cacheDepth = meta.depth;
			meta.depth = 2;
			this._recursiveRender(entry.entries[i], textStack, meta, {prefix: "<p>", suffix: "</p>"});
			meta.depth = cacheDepth;
		}
		if (entry.source) textStack[0] += Renderer.utils.getSourceAndPageTrHtml({source: entry.source, page: entry.page});
		textStack[0] += `</${this.wrapperTag}>`;

		this._lastDepthTrackerInheritedProps = cachedLastDepthTrackerProps;
	};

	this._renderVariantInner = function (entry, textStack, meta, options) {
		const dataString = this._renderEntriesSubtypes_getDataString(entry);

		if (entry.name != null && Renderer.ENTRIES_WITH_ENUMERATED_TITLES_LOOKUP[entry.type]) this._handleTrackTitles(entry.name);
		const cachedLastDepthTrackerProps = MiscUtil.copyFast(this._lastDepthTrackerInheritedProps);
		this._handleTrackDepth(entry, 1);

		textStack[0] += `<${this.wrapperTag} class="rd__b-inset-inner" ${dataString}>`;
		textStack[0] += `<span class="rd__h rd__h--2-inset" data-title-index="${this._headerIndex++}" ${this._getEnumeratedTitleRel(entry.name)}><h4 class="entry-title-inner">${entry.name}</h4></span>`;
		const len = entry.entries.length;
		for (let i = 0; i < len; ++i) {
			const cacheDepth = meta.depth;
			meta.depth = 2;
			this._recursiveRender(entry.entries[i], textStack, meta, {prefix: "<p>", suffix: "</p>"});
			meta.depth = cacheDepth;
		}
		if (entry.source) textStack[0] += Renderer.utils.getSourceAndPageTrHtml({source: entry.source, page: entry.page});
		textStack[0] += `</${this.wrapperTag}>`;

		this._lastDepthTrackerInheritedProps = cachedLastDepthTrackerProps;
	};

	this._renderVariantSub = function (entry, textStack, meta, options) {
		// pretend this is an inline-header'd entry, but set a flag so we know not to add bold
		this._subVariant = true;
		const fauxEntry = entry;
		fauxEntry.type = "entries";
		const cacheDepth = meta.depth;
		meta.depth = 3;
		this._recursiveRender(fauxEntry, textStack, meta, {prefix: "<p>", suffix: "</p>"});
		meta.depth = cacheDepth;
		this._subVariant = false;
	};

	/* -------------------------------------------- */

	this._SPELLCASTING_PROPS = [
		"constant",
		"will",
		"recharge",
		"charges",
		"rest",
		"restLong",
		"daily",
		"weekly",
		"monthly",
		"yearly",
		"ritual",
		"legendary",
	];

	this._renderSpellcasting_getEntries = function (entry) {
		const hidden = new Set(entry.hidden || []);
		const toRender = [{type: "entries", name: entry.name, entries: entry.headerEntries ? MiscUtil.copyFast(entry.headerEntries) : []}];

		if (this._SPELLCASTING_PROPS.some(prop => entry[prop])) {
			const tempList = {type: "list", style: "list-hang-notitle", items: [], data: {isSpellList: true}};
			if (entry.constant && !hidden.has("constant")) tempList.items.push({type: "itemSpell", name: `Constant:`, entry: this._renderSpellcasting_getRenderableList(entry.constant).join(", ")});
			if (entry.will && !hidden.has("will")) tempList.items.push({type: "itemSpell", name: `At will:`, entry: this._renderSpellcasting_getRenderableList(entry.will).join(", ")});

			this._renderSpellcasting_getEntries_procPerDuration({entry, tempList, hidden, prop: "recharge", fnGetDurationText: num => `{@recharge ${num}|m}`, isSkipPrefix: true});
			this._renderSpellcasting_getEntries_procPerDuration({entry, tempList, hidden, prop: "legendary", fnGetDurationText: num => ` legendary action${num === 1 ? "" : "s"}`});
			this._renderSpellcasting_getEntries_procPerDuration({entry, tempList, hidden, prop: "charges", fnGetDurationText: num => ` charge${num === 1 ? "" : "s"}`});
			this._renderSpellcasting_getEntries_procPerDuration({entry, tempList, hidden, prop: "rest", durationText: "/rest"});
			this._renderSpellcasting_getEntries_procPerDuration({entry, tempList, hidden, prop: "restLong", durationText: "/long rest"});
			this._renderSpellcasting_getEntries_procPerDuration({entry, tempList, hidden, prop: "daily", durationText: "/day"});
			this._renderSpellcasting_getEntries_procPerDuration({entry, tempList, hidden, prop: "weekly", durationText: "/week"});
			this._renderSpellcasting_getEntries_procPerDuration({entry, tempList, hidden, prop: "monthly", durationText: "/month"});
			this._renderSpellcasting_getEntries_procPerDuration({entry, tempList, hidden, prop: "yearly", durationText: "/year"});

			if (entry.ritual && !hidden.has("ritual")) tempList.items.push({type: "itemSpell", name: `Rituals:`, entry: this._renderSpellcasting_getRenderableList(entry.ritual).join(", ")});
			tempList.items = tempList.items.filter(it => it.entry !== "");
			if (tempList.items.length) toRender[0].entries.push(tempList);
		}

		if (entry.spells && !hidden.has("spells")) {
			const tempList = {type: "list", style: "list-hang-notitle", items: [], data: {isSpellList: true}};

			const lvls = Object.keys(entry.spells)
				.map(lvl => Number(lvl))
				.sort(SortUtil.ascSort);

			for (const lvl of lvls) {
				const spells = entry.spells[lvl];
				if (spells) {
					let levelCantrip = `${Parser.spLevelToFull(lvl)}${(lvl === 0 ? "s" : " level")}`;
					let slotsAtWill = ` (at will)`;
					const slots = spells.slots;
					if (slots >= 0) slotsAtWill = slots > 0 ? ` (${slots} slot${slots > 1 ? "s" : ""})` : ``;
					if (spells.lower && spells.lower !== lvl) {
						levelCantrip = `${Parser.spLevelToFull(spells.lower)}-${levelCantrip}`;
						if (slots >= 0) slotsAtWill = slots > 0 ? ` (${slots} ${Parser.spLevelToFull(lvl)}-level slot${slots > 1 ? "s" : ""})` : ``;
					}
					tempList.items.push({type: "itemSpell", name: `${levelCantrip}${slotsAtWill}:`, entry: this._renderSpellcasting_getRenderableList(spells.spells).join(", ") || "\u2014"});
				}
			}

			toRender[0].entries.push(tempList);
		}

		if (entry.footerEntries) toRender.push({type: "entries", entries: entry.footerEntries});
		return toRender;
	};

	this._renderSpellcasting_getEntries_procPerDuration = function ({entry, hidden, tempList, prop, durationText, fnGetDurationText, isSkipPrefix}) {
		if (!entry[prop] || hidden.has(prop)) return;

		for (let lvl = 9; lvl > 0; lvl--) {
			const perDur = entry[prop];
			if (perDur[lvl]) {
				tempList.items.push({
					type: "itemSpell",
					name: `${isSkipPrefix ? "" : lvl}${fnGetDurationText ? fnGetDurationText(lvl) : durationText}:`,
					entry: this._renderSpellcasting_getRenderableList(perDur[lvl]).join(", "),
				});
			}

			const lvlEach = `${lvl}e`;
			if (perDur[lvlEach]) {
				const isHideEach = !perDur[lvl] && perDur[lvlEach].length === 1;
				tempList.items.push({
					type: "itemSpell",
					name: `${isSkipPrefix ? "" : lvl}${fnGetDurationText ? fnGetDurationText(lvl) : durationText}${isHideEach ? "" : ` each`}:`,
					entry: this._renderSpellcasting_getRenderableList(perDur[lvlEach]).join(", "),
				});
			}
		}
	};

	this._renderSpellcasting_getRenderableList = function (spellList) {
		return spellList.filter(it => !it.hidden).map(it => it.entry || it);
	};

	this._renderSpellcasting = function (entry, textStack, meta, options) {
		const toRender = this._renderSpellcasting_getEntries(entry);
		if (!toRender?.[0].entries?.length) return;
		this._recursiveRender({type: "entries", entries: toRender}, textStack, meta);
	};

	/* -------------------------------------------- */

	this._renderQuote = function (entry, textStack, meta, options) {
		textStack[0] += `<div class="${this._renderList_getQuoteCssClasses(entry, textStack, meta, options)}">`;

		const len = entry.entries.length;
		for (let i = 0; i < len; ++i) {
			textStack[0] += `<p class="rd__quote-line ${i === len - 1 && entry.by ? `rd__quote-line--last` : ""}">${i === 0 && !entry.skipMarks ? "&ldquo;" : ""}`;
			this._recursiveRender(entry.entries[i], textStack, meta, {prefix: entry.skipItalics ? "" : "<i>", suffix: entry.skipItalics ? "" : "</i>"});
			textStack[0] += `${i === len - 1 && !entry.skipMarks ? "&rdquo;" : ""}</p>`;
		}

		if (entry.by || entry.from) {
			textStack[0] += `<p>`;
			const tempStack = [""];
			const byArr = this._renderQuote_getBy(entry);
			if (byArr) {
				for (let i = 0, len = byArr.length; i < len; ++i) {
					const by = byArr[i];
					this._recursiveRender(by, tempStack, meta);
					if (i < len - 1) tempStack[0] += "<br>";
				}
			}
			textStack[0] += `<span class="rd__quote-by">\u2014 ${byArr ? tempStack.join("") : ""}${byArr && entry.from ? `, ` : ""}${entry.from ? `<i>${this.render(entry.from)}</i>` : ""}</span>`;
			textStack[0] += `</p>`;
		}

		textStack[0] += `</div>`;
	};

	this._renderList_getQuoteCssClasses = function (entry, textStack, meta, options) {
		const out = [`rd__quote`];
		if (entry.style) {
			if (entry.style) out.push(...entry.style.split(" ").map(it => `rd__${it}`));
		}
		return out.join(" ");
	};

	this._renderQuote_getBy = function (entry) {
		if (!entry.by?.length) return null;
		return entry.by instanceof Array ? entry.by : [entry.by];
	};

	this._renderOptfeature = function (entry, textStack, meta, options) {
		this._renderEntriesSubtypes(entry, textStack, meta, options, true);
	};

	this._renderPatron = function (entry, textStack, meta, options) {
		this._renderEntriesSubtypes(entry, textStack, meta, options, false);
	};

	this._renderAbilityDc = function (entry, textStack, meta, options) {
		textStack[0] += `<div class="rd__wrp-centered-ability"><b>`;
		this._recursiveRender(entry.name, textStack, meta);
		if (options.styleHint === "classic") textStack[0] += ` save DC</b> = 8 + your proficiency bonus + your ${Parser.attrChooseToFull(entry.attributes)}</div>`;
		else textStack[0] += ` save DC</b> = 8 + ${Parser.attrChooseToFull(entry.attributes)} + Proficiency Bonus</div>`;
	};

	this._renderAbilityAttackMod = function (entry, textStack, meta, options) {
		textStack[0] += `<div class="rd__wrp-centered-ability"><b>`;
		this._recursiveRender(entry.name, textStack, meta);
		if (options.styleHint === "classic") textStack[0] += ` attack modifier</b> = your proficiency bonus + your ${Parser.attrChooseToFull(entry.attributes)}</div>`;
		else textStack[0] += ` attack modifier</b> = ${Parser.attrChooseToFull(entry.attributes)} + Proficiency Bonus</div>`;
	};

	this._renderAbilityGeneric = function (entry, textStack, meta, options) {
		textStack[0] += `<div class="rd__wrp-centered-ability">`;
		if (entry.name) this._recursiveRender(entry.name, textStack, meta, {prefix: "<b>", suffix: "</b> = "});
		if (entry.text) this._recursiveRender(entry.text, textStack, meta);
		textStack[0] += `${entry.attributes ? ` ${Parser.attrChooseToFull(entry.attributes)}` : ""}</div>`;
	};

	this._renderInline = function (entry, textStack, meta, options) {
		if (entry.entries) {
			const len = entry.entries.length;
			for (let i = 0; i < len; ++i) this._recursiveRender(entry.entries[i], textStack, meta);
		}
	};

	this._renderInlineBlock = function (entry, textStack, meta, options) {
		this._renderPrefix(entry, textStack, meta, options);
		if (entry.entries) {
			const len = entry.entries.length;
			for (let i = 0; i < len; ++i) this._recursiveRender(entry.entries[i], textStack, meta);
		}
		this._renderSuffix(entry, textStack, meta, options);
	};

	this._renderBonus = function (entry, textStack, meta, options) {
		textStack[0] += (entry.value < 0 ? "" : "+") + entry.value;
	};

	this._renderBonusSpeed = function (entry, textStack, meta, options) {
		textStack[0] += entry.value === 0 ? "\u2014" : `${entry.value < 0 ? "" : "+"}${entry.value} ft.`;
	};

	this._renderDice = function (entry, textStack, meta, options) {
		const pluginResults = this._applyPlugins_getAll("dice", {textStack, meta, options}, {input: entry});

		for (const res of pluginResults) {
			if (res.rendered) {
				textStack[0] += res.rendered;
				return;
			}
		}

		const toDisplay = Renderer.getEntryDiceDisplayText(entry);

		if (entry.rollable === true) {
			textStack[0] += Renderer.getRollableEntryDice(entry, entry.name, toDisplay, {isAddHandlers: this._isAddHandlers, pluginResults});
			return;
		}

		textStack[0] += toDisplay;
	};

	this._renderActions = function (entry, textStack, meta, options) {
		const dataString = this._renderEntriesSubtypes_getDataString(entry);

		if (entry.name != null && Renderer.ENTRIES_WITH_ENUMERATED_TITLES_LOOKUP[entry.type]) this._handleTrackTitles(entry.name);
		const cachedLastDepthTrackerProps = MiscUtil.copyFast(this._lastDepthTrackerInheritedProps);
		this._handleTrackDepth(entry, 2);

		const headerSpan = `<span class="rd__h rd__h--3" data-title-index="${this._headerIndex++}" ${this._getEnumeratedTitleRel(entry.name)}><span class="entry-title-inner">${entry.name}.</span></span> `;

		textStack[0] += `<${this.wrapperTag} class="${Renderer.HEAD_2}" ${dataString}>`;
		if (entry.entries) {
			const len = entry.entries.length;
			for (let i = 0; i < len; ++i) {
				const toRender = i === 0 ? {type: "inlineBlock", entries: [{type: "wrappedHtml", html: headerSpan}, entry.entries[i]]} : entry.entries[i];
				this._recursiveRender(toRender, textStack, meta, {prefix: "<p>", suffix: "</p>"});
			}
		} else {
			this._recursiveRender({type: "inlineBlock", entries: [{type: "wrappedHtml", html: headerSpan}]}, textStack, meta, {prefix: "<p>", suffix: "</p>"});
		}
		textStack[0] += `</${this.wrapperTag}>`;

		this._lastDepthTrackerInheritedProps = cachedLastDepthTrackerProps;
	};

	this._renderAttack = function (entry, textStack, meta, options) {
		this._renderPrefix(entry, textStack, meta, options);
		textStack[0] += `<i>${Parser.attackTypeToFull(entry.attackType)}:</i> `;
		const len = entry.attackEntries.length;
		for (let i = 0; i < len; ++i) this._recursiveRender(entry.attackEntries[i], textStack, meta);
		textStack[0] += ` <i>Hit:</i> `;
		const len2 = entry.hitEntries.length;
		for (let i = 0; i < len2; ++i) this._recursiveRender(entry.hitEntries[i], textStack, meta);
		this._renderSuffix(entry, textStack, meta, options);
	};

	this._renderIngredient = function (entry, textStack, meta, options) {
		this._renderPrefix(entry, textStack, meta, options);
		this._recursiveRender(entry.entry, textStack, meta);
		this._renderSuffix(entry, textStack, meta, options);
	};

	this._renderItemSubtypes = function (entry, textStack, meta, options) {
		this._renderPrefix(entry, textStack, meta, options);
		textStack[0] += `<p class="rd__p-list-item" ${entry.name ? `data-roll-name-ancestor="${Renderer.stripTags(entry.name).qq()}"` : ""}>`;
		if (entry.name) {
			textStack[0] += `<span class="${entry.type === "itemSub" ? "italic" : "bold"} rd__list-item-name">${this.render(entry.name)}${this._renderItemSubtypes_isAddPeriod(entry) ? "." : ""}</span> `;
		}
		if (entry.entry) this._recursiveRender(entry.entry, textStack, meta);
		else if (entry.entries) {
			const len = entry.entries.length;
			for (let i = 0; i < len; ++i) this._recursiveRender(entry.entries[i], textStack, meta, {prefix: i > 0 ? `<span class="rd__p-cont-indent">` : "", suffix: i > 0 ? "</span>" : ""});
		}
		textStack[0] += "</p>";
		this._renderSuffix(entry, textStack, meta, options);
	};

	this._renderItemSubtypes_isAddPeriod = function (entry) {
		return entry.name && entry.nameDot !== false && !Renderer._INLINE_HEADER_TERMINATORS.has(entry.name[entry.name.length - 1]);
	};

	this._renderItem = function (entry, textStack, meta, options) {
		this._renderItemSubtypes(entry, textStack, meta, options);
	};

	this._renderItemSub = function (entry, textStack, meta, options) {
		this._renderItemSubtypes(entry, textStack, meta, options);
	};

	this._renderItemSpell = function (entry, textStack, meta, options) {
		this._renderPrefix(entry, textStack, meta, options);

		const tempStack = [""];
		this._recursiveRender(entry.name || "", tempStack, meta);

		this._recursiveRender(entry.entry, textStack, meta, {prefix: `<p>${tempStack.join("")} `, suffix: "</p>"});
		this._renderSuffix(entry, textStack, meta, options);
	};

	this._InlineStatblockStrategy = function (
		{
			pFnPreProcess,
		},
	) {
		this.pFnPreProcess = pFnPreProcess;
	};

	this._INLINE_STATBLOCK_STRATEGIES = {
		"item": new this._InlineStatblockStrategy({
			pFnPreProcess: async (ent) => {
				await Renderer.item.pPopulatePropertyAndTypeReference();
				Renderer.item.enhanceItem(ent);
				return ent;
			},
		}),
	};

	this._renderStatblockInline = function (entry, textStack, meta, options) {
		const fnGetRenderCompact = Renderer.hover.getFnRenderCompact(entry.dataType);

		const headerName = entry.displayName || entry.data?.name;
		const headerStyle = entry.style;

		const isFluff = entry.dataType?.includes("Fluff");

		if (!fnGetRenderCompact) {
			this._renderDataHeader(textStack, headerName, headerStyle, {isStats: !isFluff});
			textStack[0] += `<tr>
				<td colspan="6">
					<i class="text-danger">Cannot render &quot;${entry.type}&quot;&mdash;unknown data type &quot;${entry.dataType}&quot;!</i>
				</td>
			</tr>`;
			this._renderDataFooter(textStack);
			return;
		}

		if (!entry.data) {
			this._renderDataHeader(textStack, headerName, headerStyle, {isStats: !isFluff});
			textStack[0] += `<tr>
				<td colspan="6">
					<i class="text-danger">Entry &quot;<i><code>${JSON.stringify(entry).qq()}</code></i> did not contain required &quot;data&quot; key!</i>
				</td>
			</tr>`;
			this._renderDataFooter(textStack);
			return;
		}

		const strategy = this._INLINE_STATBLOCK_STRATEGIES[entry.dataType];

		if (!strategy?.pFnPreProcess && !entry.data?._copy) {
			this._renderDataHeader(textStack, headerName, headerStyle, {isStats: !isFluff, isCollapsed: entry.collapsed});
			textStack[0] += fnGetRenderCompact(entry.data, {isEmbeddedEntity: true});
			this._renderDataFooter(textStack);
			return;
		}

		this._renderDataHeader(textStack, headerName, headerStyle, {isStats: !isFluff, isCollapsed: entry.collapsed});

		const id = CryptUtil.uid();
		Renderer._cache.inlineStatblock[id] = {
			pFn: async (ele) => {
				const entLoaded = entry.data?._copy
					? (await DataUtil.pDoMetaMergeSingle(
						entry.dataType,
						{dependencies: {[entry.dataType]: entry.dependencies}},
						entry.data,
					))
					: entry.data;

				const ent = entLoaded && strategy?.pFnPreProcess ? await strategy.pFnPreProcess(entLoaded) : entLoaded;

				const tbl = ele.closest("table");
				const nxt = e_({
					outer: Renderer.utils.getEmbeddedDataHeader(headerName, headerStyle, {isCollapsed: entry.collapsed, isStats: !isFluff})
						+ fnGetRenderCompact(ent, {isEmbeddedEntity: true})
						+ Renderer.utils.getEmbeddedDataFooter(),
				});
				tbl.parentNode.replaceChild(
					nxt,
					tbl,
				);
			},
		};

		textStack[0] += `<tr><td colspan="6"><style data-rd-cache-id="${id}" data-rd-cache="inlineStatblock" onload="Renderer._cache.pRunFromEle(this)"></style></td></tr>`;
		this._renderDataFooter(textStack);
	};

	this._renderDataHeader = function (textStack, name, style, {isStats = false, isCollapsed = false, htmlNameExpanded = null, htmlNameCollapsed = null} = {}) {
		textStack[0] += Renderer.utils.getEmbeddedDataHeader(name, style, {isStats, isCollapsed, htmlNameExpanded, htmlNameCollapsed});
	};

	this._renderDataFooter = function (textStack) {
		textStack[0] += Renderer.utils.getEmbeddedDataFooter();
	};

	this._renderStatblock = function (entry, textStack, meta, options) {
		const page = entry.prop || Renderer.tag.getPage(entry.tag);
		const source = Parser.getTagSource(entry.tag, entry.source);
		const hash = entry.hash || (UrlUtil.URL_TO_HASH_BUILDER[page] ? UrlUtil.URL_TO_HASH_BUILDER[page]({...entry, source}) : null);
		const tag = entry.tag || Parser.getPropTag(entry.prop);

		const prop = entry.prop || Parser.getTagProps(entry.tag)[0];
		const uid = prop ? DataUtil.proxy.getUid(prop, {...entry, source}, {isMaintainCase: true}) : "unknown|unknown";
		const asTag = tag ? `{@${tag} ${uid}${entry.displayName ? `|${entry.displayName}` : ""}}` : null;

		const isFluff = prop?.endsWith("Fluff");

		const displayName = entry.displayName || entry.name || entry.abbreviation;

		const fromPlugins = this._applyPlugins_useFirst(
			"statblock_render",
			{textStack, meta, options},
			{input: {entry, page, source, hash, tag, prop, uid, asTag, displayName}},
		);
		if (fromPlugins) return void (textStack[0] += fromPlugins);

		if (!page || !source || !hash) {
			this._renderDataHeader(textStack, displayName, entry.style, {isStats: !isFluff});
			textStack[0] += `<tr>
				<td colspan="6">
					<i class="text-danger">Cannot load ${asTag ? `&quot;${asTag}&quot;` : displayName}! An unknown tag/prop, source, or hash was provided.</i>
				</td>
			</tr>`;
			this._renderDataFooter(textStack);

			return;
		}

		this._renderDataHeader(textStack, displayName, entry.style, {isStats: !isFluff, isCollapsed: entry.collapsed});
		textStack[0] += `<tr>
			<td colspan="6" data-rd-tag="${(tag || "").qq()}" data-rd-uid="${(uid || "").qq()}" data-rd-page="${(page || "").qq()}" data-rd-source="${(source || "").qq()}" data-rd-hash="${(hash || "").qq()}" data-rd-name="${(entry.name || "").qq()}" data-rd-display-name="${(displayName || "").qq()}" data-rd-style="${(entry.style || "").qq()}" data-rd-entry-data="${JSON.stringify(entry.data || {}).qq()}">
				<i>Loading ${asTag ? `${Renderer.get().render(asTag)}` : displayName}...</i>
				<style onload="Renderer.events.handleLoad_inlineStatblock(this)"></style>
			</td>
		</tr>`;
		this._renderDataFooter(textStack);
	};

	this._renderGallery = function (entry, textStack, meta, options) {
		if (entry.name) textStack[0] += `<h5 class="rd__gallery-name">${entry.name}</h5>`;
		textStack[0] += `<div class="rd__wrp-gallery">`;
		const len = entry.images.length;
		const anyNamed = entry.images.some(it => it.title);
		const isAnyCredited = entry.images.some(it => it.credit);
		for (let i = 0; i < len; ++i) {
			const img = MiscUtil.copyFast(entry.images[i]);

			// force untitled/uncredited images to pad to match their siblings
			if (anyNamed && !img.title) img._galleryTitlePad = true;
			if (isAnyCredited && !img.credit) img._galleryCreditPad = true;

			delete img.imageType;
			this._recursiveRender(img, textStack, meta, options);
		}
		textStack[0] += `</div>`;
	};

	this._renderFlowchart = function (entry, textStack, meta, options) {
		textStack[0] += `<div class="rd__wrp-flowchart">`;
		const len = entry.blocks.length;
		for (let i = 0; i < len; ++i) {
			this._recursiveRender(entry.blocks[i], textStack, meta, options);
			if (i !== len - 1) {
				textStack[0] += `<div class="rd__s-v-flow"></div>`;
			}
		}
		textStack[0] += `</div>`;
	};

	this._renderFlowBlock = function (entry, textStack, meta, options) {
		const dataString = this._renderEntriesSubtypes_getDataString(entry);
		textStack[0] += `<${this.wrapperTag} class="rd__b-special rd__b-flow ve-text-center" ${dataString}>`;

		const cachedLastDepthTrackerProps = MiscUtil.copyFast(this._lastDepthTrackerInheritedProps);
		this._handleTrackDepth(entry, 1);

		if (entry.name != null) {
			if (Renderer.ENTRIES_WITH_ENUMERATED_TITLES_LOOKUP[entry.type]) this._handleTrackTitles(entry.name);
			textStack[0] += `<span class="rd__h rd__h--2-flow-block" data-title-index="${this._headerIndex++}" ${this._getEnumeratedTitleRel(entry.name)}><h4 class="entry-title-inner">${this.render({type: "inline", entries: [entry.name]})}</h4></span>`;
		}
		if (entry.entries) {
			const len = entry.entries.length;
			for (let i = 0; i < len; ++i) {
				const cacheDepth = meta.depth;
				meta.depth = 2;
				this._recursiveRender(entry.entries[i], textStack, meta, {prefix: "<p>", suffix: "</p>"});
				meta.depth = cacheDepth;
			}
		}
		textStack[0] += `</${this.wrapperTag}>`;

		this._lastDepthTrackerInheritedProps = cachedLastDepthTrackerProps;
	};

	this._renderHomebrew = function (entry, textStack, meta, options) {
		textStack[0] += `<div class="rd-homebrew__b"><div class="rd-homebrew__wrp-notice"><span class="rd-homebrew__disp-notice"></span>`;

		if (entry.oldEntries) {
			const hoverMeta = Renderer.hover.getInlineHover({type: "entries", name: "Homebrew", entries: entry.oldEntries});
			let markerText;
			if (entry.movedTo) {
				markerText = "(See moved content)";
			} else if (entry.entries) {
				markerText = "(See replaced content)";
			} else {
				markerText = "(See removed content)";
			}
			textStack[0] += `<span class="rd-homebrew__disp-old-content" href="#${window.location.hash}" ${hoverMeta.html}>${markerText}</span>`;
		}

		textStack[0] += `</div>`;

		if (entry.entries) {
			const len = entry.entries.length;
			for (let i = 0; i < len; ++i) this._recursiveRender(entry.entries[i], textStack, meta, {prefix: "<p>", suffix: "</p>"});
		} else if (entry.movedTo) {
			textStack[0] += `<i>This content has been moved to ${entry.movedTo}.</i>`;
		} else {
			textStack[0] += "<i>This content has been deleted.</i>";
		}

		textStack[0] += `</div>`;
	};

	this._renderCode = function (entry, textStack, meta, options) {
		const isWrapped = !!StorageUtil.syncGet("rendererCodeWrap");
		textStack[0] += `
			<div class="ve-flex-col h-100">
				<div class="ve-flex no-shrink pt-1">
					<button class="ve-btn ve-btn-default ve-btn-xs mb-1 mr-2" onclick="Renderer.events.handleClick_copyCode(event, this)">Copy Code</button>
					<button class="ve-btn ve-btn-default ve-btn-xs mb-1 ${isWrapped ? "active" : ""}" onclick="Renderer.events.handleClick_toggleCodeWrap(event, this)">Word Wrap</button>
				</div>
				<pre class="h-100 w-100 mb-1 ${isWrapped ? "rd__pre-wrap" : ""}">${entry.preformatted}</pre>
			</div>
		`;
	};

	this._renderHr = function (entry, textStack, meta, options) {
		textStack[0] += `<hr class="rd__hr">`;
	};

	this._getStyleClass = function (entryType, entry) {
		const outList = [];

		const pluginResults = this._applyPlugins_getAll(`${entryType}_styleClass_fromSource`, null, {input: {entryType, entry}});

		if (!pluginResults.some(it => it.isSkip)) {
			if (
				SourceUtil.isNonstandardSource(entry.source)
				|| (typeof PrereleaseUtil !== "undefined" && PrereleaseUtil.hasSourceJson(entry.source))
			) outList.push("spicy-sauce");
			if (typeof BrewUtil2 !== "undefined" && BrewUtil2.hasSourceJson(entry.source)) outList.push("refreshing-brew");
		}

		if (this._extraSourceClasses) outList.push(...this._extraSourceClasses);
		for (const k in this._fnsGetStyleClasses) {
			const fromFn = this._fnsGetStyleClasses[k](entry);
			if (fromFn) outList.push(...fromFn);
		}
		if (entry.style) outList.push(this._getMutatedStyleString(entry.style));
		return outList.join(" ");
	};

	this._renderString = function (entry, textStack, meta, options) {
		const str = this._applyPlugins_useAll("string_preprocess", {textStack, meta, options}, {input: entry}) ?? entry;

		const tagSplit = Renderer.splitByTags(str);
		const len = tagSplit.length;
		for (let i = 0; i < len; ++i) {
			const s = tagSplit[i];
			if (!s) continue;

			if (!s.startsWith("{@")) {
				this._renderString_renderBasic(textStack, meta, options, s);
				continue;
			}

			const [tag, text] = Renderer.splitFirstSpace(s.slice(1, -1));
			this._renderString_renderTag(textStack, meta, options, tag, text);
		}
	};

	this._renderString_renderBasic = function (textStack, meta, options, str) {
		const fromPlugins = this._applyPlugins_useFirst("string_basic", {textStack, meta, options}, {input: str});
		if (fromPlugins) return void (textStack[0] += fromPlugins);

		textStack[0] += str;
	};

	this._renderString_renderTag = function (textStack, meta, options, tag, text) {
		// region Plugins
		// Tag-specific
		const fromPluginsSpecific = this._applyPlugins_useFirst(`string_${tag}`, {textStack, meta, options}, {input: {tag, text}});
		if (fromPluginsSpecific) return void (textStack[0] += fromPluginsSpecific);

		// Generic
		const fromPluginsGeneric = this._applyPlugins_useFirst("string_tag", {textStack, meta, options}, {input: {tag, text}});
		if (fromPluginsGeneric) return void (textStack[0] += fromPluginsGeneric);
		// endregion

		switch (tag) {
			// BASIC STYLES/TEXT ///////////////////////////////////////////////////////////////////////////////
			case "@b":
			case "@bold":
				textStack[0] += `<b>`;
				this._recursiveRender(text, textStack, meta);
				textStack[0] += `</b>`;
				break;
			case "@i":
			case "@italic":
				textStack[0] += `<i>`;
				this._recursiveRender(text, textStack, meta);
				textStack[0] += `</i>`;
				break;
			case "@s":
			case "@strike":
				textStack[0] += `<s>`;
				this._recursiveRender(text, textStack, meta);
				textStack[0] += `</s>`;
				break;
			case "@s2":
			case "@strikeDouble":
				textStack[0] += `<s class="ve-strike-double">`;
				this._recursiveRender(text, textStack, meta);
				textStack[0] += `</s>`;
				break;
			case "@u":
			case "@underline":
				textStack[0] += `<u>`;
				this._recursiveRender(text, textStack, meta);
				textStack[0] += `</u>`;
				break;
			case "@u2":
			case "@underlineDouble":
				textStack[0] += `<u class="ve-underline-double">`;
				this._recursiveRender(text, textStack, meta);
				textStack[0] += `</u>`;
				break;
			case "@sup":
				textStack[0] += `<sup>`;
				this._recursiveRender(text, textStack, meta);
				textStack[0] += `</sup>`;
				break;
			case "@sub":
				textStack[0] += `<sub>`;
				this._recursiveRender(text, textStack, meta);
				textStack[0] += `</sub>`;
				break;
			case "@kbd":
				textStack[0] += `<kbd>`;
				this._recursiveRender(text, textStack, meta);
				textStack[0] += `</kbd>`;
				break;
			case "@code":
				textStack[0] += `<span class="code">`;
				this._recursiveRender(text, textStack, meta);
				textStack[0] += `</span>`;
				break;
			case "@style": {
				const [displayText, styles] = Renderer.splitTagByPipe(text);
				const classNames = (styles || "").split(";").map(it => Renderer._STYLE_TAG_ID_TO_STYLE[it.trim()]).filter(Boolean).join(" ");
				textStack[0] += `<span class="${classNames}">`;
				this._recursiveRender(displayText, textStack, meta);
				textStack[0] += `</span>`;
				break;
			}
			case "@font": {
				const [displayText, fontDecl] = Renderer.splitTagByPipe(text);
				const fontInfo = Renderer.tag.TagFont.getFontInfo(fontDecl);
				if (fontInfo.fontUrl) FontManager.pAddFont({fontId: fontInfo.fontId, fontUrl: fontInfo.fontUrl}).then(null);
				textStack[0] += `<span style="font-family: '${fontInfo.fontId}'">`;
				this._recursiveRender(displayText, textStack, meta);
				textStack[0] += `</span>`;
				break;
			}
			case "@note":
				textStack[0] += `<i class="ve-muted">`;
				this._recursiveRender(text, textStack, meta);
				textStack[0] += `</i>`;
				break;
			case "@tip": {
				const [displayText, titielText] = Renderer.splitTagByPipe(text);
				textStack[0] += `<span title="${titielText.qq()}">`;
				this._recursiveRender(displayText, textStack, meta);
				textStack[0] += `</span>`;
				break;
			}
			case "@atk":
			case "@atkr":
				textStack[0] += `<i>${Renderer.attackTagToFull(text, {isRoll: tag === "@atkr"})}</i>`;
				break;
			case "@actSave": textStack[0] += `<i>${Parser.attAbvToFull(text)} Saving Throw:</i>`; break;
			case "@actSaveSuccess": textStack[0] += `<i>Success:</i>`; break;
			case "@actSaveFail": {
				const [ordinal] = Renderer.splitTagByPipe(text);
				if (ordinal) textStack[0] += `<i>${Parser.numberToText(ordinal, {isOrdinalForm: true}).toTitleCase()} Failure:</i>`;
				else textStack[0] += `<i>Failure:</i>`;
				break;
			}
			case "@actSaveFailBy": {
				const [amount] = Renderer.splitTagByPipe(text);
				textStack[0] += `<i>Failure by ${amount} or More:</i>`;
				break;
			}
			case "@actSaveSuccessOrFail": textStack[0] += `<i>Failure or Success:</i>`; break;
			case "@actTrigger": textStack[0] += `<i>Trigger:</i>`; break;
			case "@actResponse": textStack[0] += `<i>Response${text.includes("d") ? "\u2014" : ":"}</i>`; break;
			case "@h": textStack[0] += `<i>Hit:</i> `; break;
			case "@m": textStack[0] += `<i>Miss:</i> `; break;
			case "@hom": textStack[0] += `<i>Hit or Miss:</i> `; break;
			case "@color": {
				const [toDisplay, color] = Renderer.splitTagByPipe(text);
				const ptColor = this._renderString_renderTag_getBrewColorPart(color);

				textStack[0] += `<span class="rd__color" style="color: ${ptColor}">`;
				this._recursiveRender(toDisplay, textStack, meta);
				textStack[0] += `</span>`;
				break;
			}
			case "@highlight": {
				const [toDisplay, color] = Renderer.splitTagByPipe(text);
				const ptColor = this._renderString_renderTag_getBrewColorPart(color);

				textStack[0] += ptColor ? `<span style="background-color: ${ptColor}">` : `<span class="rd__highlight">`;
				textStack[0] += toDisplay;
				textStack[0] += `</span>`;
				break;
			}
			case "@help": {
				const [toDisplay, title = ""] = Renderer.splitTagByPipe(text);
				textStack[0] += `<span class="help" title="${title.qq()}">`;
				this._recursiveRender(toDisplay, textStack, meta);
				textStack[0] += `</span>`;
				break;
			}

			// Misc utilities //////////////////////////////////////////////////////////////////////////////////
			case "@unit": {
				const [amount, unitSingle, unitPlural] = Renderer.splitTagByPipe(text);
				textStack[0] += isNaN(amount) ? unitSingle : Number(amount) > 1 ? (unitPlural || unitSingle.toPlural()) : unitSingle;
				break;
			}

			// Comic styles ////////////////////////////////////////////////////////////////////////////////////
			case "@comic":
				textStack[0] += `<span class="rd__comic">`;
				this._recursiveRender(text, textStack, meta);
				textStack[0] += `</span>`;
				break;
			case "@comicH1":
				textStack[0] += `<span class="rd__comic rd__comic--h1">`;
				this._recursiveRender(text, textStack, meta);
				textStack[0] += `</span>`;
				break;
			case "@comicH2":
				textStack[0] += `<span class="rd__comic rd__comic--h2">`;
				this._recursiveRender(text, textStack, meta);
				textStack[0] += `</span>`;
				break;
			case "@comicH3":
				textStack[0] += `<span class="rd__comic rd__comic--h3">`;
				this._recursiveRender(text, textStack, meta);
				textStack[0] += `</span>`;
				break;
			case "@comicH4":
				textStack[0] += `<span class="rd__comic rd__comic--h4">`;
				this._recursiveRender(text, textStack, meta);
				textStack[0] += `</span>`;
				break;
			case "@comicNote":
				textStack[0] += `<span class="rd__comic rd__comic--note">`;
				this._recursiveRender(text, textStack, meta);
				textStack[0] += `</span>`;
				break;

			// DCs /////////////////////////////////////////////////////////////////////////////////////////////
			case "@dc": {
				const [dcText, displayText] = Renderer.splitTagByPipe(text);
				textStack[0] += `DC <span class="rd__dc">${displayText || dcText}</span>`;
				break;
			}

			case "@dcYourSpellSave": {
				const [displayText] = Renderer.splitTagByPipe(text);
				textStack[0] += displayText || "your spell save DC";
				break;
			}

			// DICE ////////////////////////////////////////////////////////////////////////////////////////////
			case "@dice":
			case "@autodice":
			case "@damage":
			case "@hit":
			case "@d20":
			case "@chance":
			case "@coinflip":
			case "@recharge":
			case "@ability":
			case "@savingThrow":
			case "@skillCheck":
			case "@initiative": {
				const fauxEntry = Renderer.utils.getTagEntry(tag, text);

				if (tag === "@recharge") {
					const [, flagsRaw] = Renderer.splitTagByPipe(text);
					const flags = flagsRaw ? flagsRaw.split("") : null;
					textStack[0] += `${flags && flags.includes("m") ? "" : "("}Recharge `;
					this._recursiveRender(fauxEntry, textStack, meta);
					textStack[0] += `${flags && flags.includes("m") ? "" : ")"}`;
				} else {
					this._recursiveRender(fauxEntry, textStack, meta);
				}

				break;
			}

			case "@hitYourSpellAttack": this._renderString_renderTag_hitYourSpellAttack(textStack, meta, options, tag, text); break;

			// SCALE DICE //////////////////////////////////////////////////////////////////////////////////////
			case "@scaledice":
			case "@scaledamage": {
				const fauxEntry = Renderer.parseScaleDice(tag, text);
				this._recursiveRender(fauxEntry, textStack, meta);
				break;
			}

			// LINKS ///////////////////////////////////////////////////////////////////////////////////////////
			case "@filter": {
				// format: {@filter Warlock Spells|spells|level=1;2|class=Warlock}
				const [displayText, page, ...filters] = Renderer.splitTagByPipe(text);

				const filterSubhashMeta = Renderer.getFilterSubhashes(filters);

				const fauxEntry = {
					type: "link",
					text: displayText,
					href: {
						type: "internal",
						path: `${page}.html`,
						hash: HASH_BLANK,
						hashPreEncoded: true,
						subhashes: filterSubhashMeta.subhashes,
					},
				};

				if (filterSubhashMeta.customHash) fauxEntry.href.hash = filterSubhashMeta.customHash;

				this._recursiveRender(fauxEntry, textStack, meta);

				break;
			}
			case "@link": {
				const [displayText, url] = Renderer.splitTagByPipe(text);
				let outUrl = url == null ? displayText : url;

				// If a URL is prefixed with e.g. `https://` or `mailto:`, leave it as-is
				// Otherwise, assume `http` (avoid HTTPS, as the D&D homepage doesn't support it)
				if (!/^[a-zA-Z]+:/.test(outUrl)) outUrl = `http://${outUrl}`;

				const fauxEntry = {
					type: "link",
					href: {
						type: "external",
						url: outUrl,
					},
					text: displayText,
				};
				this._recursiveRender(fauxEntry, textStack, meta);

				break;
			}
			case "@5etools": {
				const [displayText, page, hash] = Renderer.splitTagByPipe(text);
				const fauxEntry = {
					type: "link",
					href: {
						type: "internal",
						path: page,
					},
					text: displayText,
				};
				if (hash) {
					fauxEntry.hash = hash;
					fauxEntry.hashPreEncoded = true;
				}
				this._recursiveRender(fauxEntry, textStack, meta);

				break;
			}
			case "@5etoolsImg": {
				const [displayText, page] = Renderer.splitTagByPipe(text);
				const fauxEntry = {
					type: "link",
					href: {
						type: "external",
						url: UrlUtil.link(this.getMediaUrl("img", page)),
					},
					text: displayText,
				};
				this._recursiveRender(fauxEntry, textStack, meta);

				break;
			}

			// OTHER HOVERABLES ////////////////////////////////////////////////////////////////////////////////
			case "@footnote": {
				const [displayText, footnoteText, optTitle] = Renderer.splitTagByPipe(text);
				const hoverMeta = Renderer.hover.getInlineHover({
					type: "entries",
					name: optTitle ? optTitle.toTitleCase() : "Footnote",
					entries: [footnoteText, optTitle ? `{@note ${optTitle}}` : ""].filter(Boolean),
				});
				textStack[0] += `<span class="help" ${hoverMeta.html}>`;
				this._recursiveRender(displayText, textStack, meta);
				textStack[0] += `</span>`;

				break;
			}
			case "@homebrew": {
				const [newText, oldText] = Renderer.splitTagByPipe(text);
				const tooltipEntries = [];
				if (newText && oldText) {
					tooltipEntries.push("{@b This is a homebrew addition, replacing the following:}");
				} else if (newText) {
					tooltipEntries.push("{@b This is a homebrew addition.}");
				} else if (oldText) {
					tooltipEntries.push("{@b The following text has been removed with this homebrew:}");
				}
				if (oldText) {
					tooltipEntries.push(oldText);
				}
				const hoverMeta = Renderer.hover.getInlineHover({
					type: "entries",
					name: "Homebrew Modifications",
					entries: tooltipEntries,
				});
				textStack[0] += `<span class="rd-homebrew__disp-inline" ${hoverMeta.html}>`;
				this._recursiveRender(newText || "[...]", textStack, meta);
				textStack[0] += `</span>`;

				break;
			}
			case "@area": {
				const tagInfo = Renderer.tag.TAG_LOOKUP.area;

				const {areaId, displayText} = tagInfo.getMeta(tag, text);

				if (!globalThis.BookUtil) { // for the roll20 script
					textStack[0] += displayText;
					break;
				}

				const area = globalThis.BookUtil.curRender.headerMap[areaId];
				if (!area) {
					textStack[0] += displayText;
					break;
				}

				const hoverMeta = Renderer.hover.getInlineHover(area.entry, {isLargeBookContent: true, depth: area.depth});
				textStack[0] += `<a href="${tagInfo.getHref(globalThis.BookUtil.curRender, area)}" ${hoverMeta.html}>${displayText}</a>`;

				break;
			}

			// HOMEBREW LOADING ////////////////////////////////////////////////////////////////////////////////
			case "@loader": {
				const {name, path, mode} = this._renderString_getLoaderTagMeta(text);

				const brewUtilName = mode === "homebrew" ? "BrewUtil2" : mode === "prerelease" ? "PrereleaseUtil" : null;
				const brewUtil = globalThis[brewUtilName];

				if (!brewUtil) {
					textStack[0] += `<span class="text-danger" title="Unknown loader mode &quot;${mode.qq()}&quot;!">${name}<span class="glyphicon glyphicon-alert rd__loadbrew-icon rd__loadbrew-icon"></span></span>`;

					break;
				}

				textStack[0] += `<span onclick="${brewUtilName}.pAddBrewFromLoaderTag(this)" data-rd-loader-path="${path.escapeQuotes()}" data-rd-loader-name="${name.escapeQuotes()}" class="rd__wrp-loadbrew--ready" title="Click to install ${brewUtil.DISPLAY_NAME}">${name}<span class="glyphicon glyphicon-download-alt rd__loadbrew-icon rd__loadbrew-icon"></span></span>`;
				break;
			}

			// CONTENT TAGS ////////////////////////////////////////////////////////////////////////////////////
			case "@book":
			case "@adventure": {
				// format: {@tag Display Text|DMG< |chapter< |section >< |number > >}
				const page = tag === "@book" ? "book.html" : "adventure.html";
				const [displayText, book, chapter, section, rawNumber] = Renderer.splitTagByPipe(text);
				const number = rawNumber || 0;
				const hash = `${book?.toLowerCase()}${chapter ? `${HASH_PART_SEP}${chapter}${section ? `${HASH_PART_SEP}${UrlUtil.encodeForHash(section)}${number != null ? `${HASH_PART_SEP}${UrlUtil.encodeForHash(number)}` : ""}` : ""}` : ""}`;
				const fauxEntry = {
					type: "link",
					href: {
						type: "internal",
						path: page,
						hash,
						hashPreEncoded: true,
					},
					text: displayText,
				};
				this._recursiveRender(fauxEntry, textStack, meta);

				break;
			}

			default: {
				const {name, source, displayText, others, page, hash, hashPreEncoded, pageHover, sourceHover, hashHover, hashPreEncodedHover, preloadId, linkText, subhashes, subhashesHover, isFauxPage, isAllowRedirect} = Renderer.utils.getTagMeta(tag, text);

				const fauxEntry = {
					type: "link",
					href: {
						type: "internal",
						path: page,
						hash,
						hover: {
							page,
							isFauxPage,
							source,
						},
					},
					text: (displayText || name),
				};

				if (hashPreEncoded != null) fauxEntry.href.hashPreEncoded = hashPreEncoded;
				if (pageHover != null) fauxEntry.href.hover.page = pageHover;
				if (sourceHover != null) fauxEntry.href.hover.source = sourceHover;
				if (hashHover != null) fauxEntry.href.hover.hash = hashHover;
				if (hashPreEncodedHover != null) fauxEntry.href.hover.hashPreEncoded = hashPreEncodedHover;
				if (preloadId != null) fauxEntry.href.hover.preloadId = preloadId;
				if (linkText) fauxEntry.text = linkText;
				if (subhashes) fauxEntry.href.subhashes = subhashes;
				if (subhashesHover) fauxEntry.href.hover.subhashes = subhashesHover;
				if (isAllowRedirect) fauxEntry.href.hover.isAllowRedirect = isAllowRedirect;

				this._recursiveRender(fauxEntry, textStack, meta);

				break;
			}
		}
	};

	this._renderString_renderTag_getBrewColorPart = function (color) {
		if (!color) return "";
		const scrubbedColor = BrewUtilShared.getValidColor(color, {isExtended: true});
		return scrubbedColor.startsWith("--") ? `var(${scrubbedColor})` : `#${scrubbedColor}`;
	};

	this._renderString_renderTag_hitYourSpellAttack = function (textStack, meta, options, tag, text) {
		const [displayText] = Renderer.splitTagByPipe(text);

		const fauxEntry = {
			type: "dice",
			rollable: true,
			subType: "d20",
			displayText: displayText || "your spell attack modifier",
			toRoll: `1d20 + #$prompt_number:title=Enter your Spell Attack Modifier$#`,
		};
		return this._recursiveRender(fauxEntry, textStack, meta);
	};

	this._renderString_getLoaderTagMeta = function (text, {isDefaultUrl = false} = {}) {
		const [name, file, mode = "homebrew"] = Renderer.splitTagByPipe(text);

		if (!isDefaultUrl) return {name, path: file, mode};

		const path = /^.*?:\/\//.test(file) ? file : `${VeCt.URL_ROOT_BREW}${file}`;
		return {name, path, mode};
	};

	this._renderPrimitive = function (entry, textStack, meta, options) { textStack[0] += entry; };

	this._renderLink = function (entry, textStack, meta, options) {
		let href = this._renderLink_getHref(entry);

		// overwrite href if there's an available Roll20 handout/character
		if (entry.href.hover && this._roll20Ids) {
			const procHash = UrlUtil.encodeForHash(entry.href.hash);
			const id = this._roll20Ids[procHash];
			if (id) {
				href = `http://journal.roll20.net/${id.type}/${id.roll20Id}`;
			}
		}

		const pluginData = this._applyPlugins_getAll("link", {textStack, meta, options}, {input: entry});
		const isDisableEvents = pluginData.some(it => it.isDisableEvents);
		const additionalAttributes = pluginData.map(it => it.attributes).filter(Boolean);

		if (this._isInternalLinksDisabled && entry.href.type === "internal") {
			textStack[0] += `<span class="bold" ${isDisableEvents ? "" : this._renderLink_getHoverString(entry)} ${additionalAttributes.join(" ")}>${this.render(entry.text)}</span>`;
		} else if (entry.href.hover?.isFauxPage) {
			textStack[0] += `<span class="help help--hover" ${isDisableEvents ? "" : this._renderLink_getHoverString(entry)} ${additionalAttributes.join(" ")}>${this.render(entry.text)}</span>`;
		} else {
			textStack[0] += `<a href="${href.qq()}" ${entry.href.type === "internal" ? "" : `target="_blank" rel="noopener noreferrer"`} ${isDisableEvents ? "" : this._renderLink_getHoverString(entry)} ${additionalAttributes.join(" ")}>${this.render(entry.text)}</a>`;
		}
	};

	this._renderLink_getHref = function (entry) {
		if (entry.href.type === "internal") {
			// baseURL is blank by default
			const ptBase = `${this.baseUrl}${entry.href.path}`;
			let ptHash = "";
			if (entry.href.hash != null) {
				ptHash += entry.href.hashPreEncoded ? entry.href.hash : UrlUtil.encodeForHash(entry.href.hash);
			}
			if (entry.href.subhashes != null) {
				ptHash += Renderer.utils.getLinkSubhashString(entry.href.subhashes);
			}
			if (!ptHash) return ptBase;
			return `${ptBase}#${ptHash}`;
		}
		if (entry.href.type === "external") {
			return entry.href.url;
		}
		return "";
	};

	this._renderLink_getHoverString = function (entry) {
		if (!entry.href.hover || !this._isAddHandlers) return "";

		let procHash = entry.href.hover.hash
			? entry.href.hover.hashPreEncoded ? entry.href.hover.hash : UrlUtil.encodeForHash(entry.href.hover.hash)
			: entry.href.hashPreEncoded ? entry.href.hash : UrlUtil.encodeForHash(entry.href.hash);

		if (this._tagExportDict) {
			this._tagExportDict[procHash] = {
				page: entry.href.hover.page,
				source: entry.href.hover.source,
				hash: procHash,
			};
		}

		if (entry.href.hover.subhashes) {
			procHash += Renderer.utils.getLinkSubhashString(entry.href.hover.subhashes);
		}

		const pluginData = this._applyPlugins_getAll("link_attributesHover", null, {input: {entry, procHash}});
		const replacementAttributes = pluginData.map(it => it.attributesHoverReplace).filter(Boolean);
		if (replacementAttributes.length) return replacementAttributes.join(" ");

		return Renderer.hover.getHoverElementAttributes({
			page: entry.href.hover.page,
			source: entry.href.hover.source,
			hash: procHash,
			preloadId: entry.href.hover.preloadId,
			isFauxPage: entry.href.hover.isFauxPage,
			isAllowRedirect: entry.href.hover.isAllowRedirect,
		});
	};

	/**
	 * Helper function to render an entity using this renderer
	 * @param entry
	 * @param depth
	 * @returns {string}
	 */
	this.render = function (entry, depth = 0) {
		const tempStack = [];
		this.recursiveRender(entry, tempStack, {depth});
		return tempStack.join("");
	};
};

// Unless otherwise specified, these use `"name"` as their name title prop
Renderer.ENTRIES_WITH_ENUMERATED_TITLES = [
	{type: "section", key: "entries", depth: -1},
	{type: "entries", key: "entries", depthIncrement: 1},
	{type: "options", key: "entries"},
	{type: "inset", key: "entries", depth: 2},
	{type: "insetReadaloud", key: "entries", depth: 2},
	{type: "variant", key: "entries", depth: 2},
	{type: "variantInner", key: "entries", depth: 2},
	{type: "actions", key: "entries", depth: 2},
	{type: "flowBlock", key: "entries", depth: 2},
	{type: "optfeature", key: "entries", depthIncrement: 1},
	{type: "patron", key: "entries"},
];

Renderer.ENTRIES_WITH_ENUMERATED_TITLES_LOOKUP = Renderer.ENTRIES_WITH_ENUMERATED_TITLES.mergeMap(it => ({[it.type]: it}));

Renderer.ENTRIES_WITH_CHILDREN = [
	...Renderer.ENTRIES_WITH_ENUMERATED_TITLES,
	{type: "list", key: "items"},
	{type: "table", key: "rows"},
];

Renderer._INLINE_HEADER_TERMINATORS = new Set([".", ",", "!", "?", ";", ":", `"`]);

Renderer._STYLE_TAG_ID_TO_STYLE = {
	"small-caps": "small-caps",
	"small": "ve-small",
	"large": "ve-large",
	"capitalize": "capitalize",
	"dnd-font": "dnd-font",
	"muted": "ve-muted",
};

Renderer.get = () => {
	if (!Renderer.defaultRenderer) Renderer.defaultRenderer = new Renderer();
	return Renderer.defaultRenderer;
};

/**
 * Note that a tag (`{@tag ...}`) is not valid inside a property injector (`{=prop ...}`),
 *   but a property injector *is* valid inside a tag.
 */
Renderer.applyProperties = function (entry, object) {
	const propSplit = Renderer.splitByTags(entry);
	const len = propSplit.length;

	let textStack = "";

	for (let i = 0; i < len; ++i) {
		const s = propSplit[i];
		if (!s) continue;

		if (s.startsWith("{@")) {
			const [tag, text] = Renderer.splitFirstSpace(s.slice(1, -1));
			textStack += `{${tag} ${Renderer.applyProperties(text, object)}}`;
			continue;
		}

		if (!s.startsWith("{=")) {
			textStack += s;
			continue;
		}

		if (s.startsWith("{=")) {
			const [path, modifiers] = s.slice(2, -1).split("/");
			let fromProp = object[path];

			if (!modifiers) {
				textStack += fromProp;
				continue;
			}

			if (fromProp == null) throw new Error(`Could not apply property in "${s}"; "${path}" value was null!`);

			modifiers
				.split("")
				.sort((a, b) => Renderer.applyProperties._OP_ORDER.indexOf(a) - Renderer.applyProperties._OP_ORDER.indexOf(b));

			for (const modifier of modifiers) {
				switch (modifier) {
					case "a": // render "a"/"an" depending on prop value
						fromProp = Renderer.applyProperties._LEADING_AN.has(fromProp[0].toLowerCase()) ? "an" : "a";
						break;

					case "l": fromProp = fromProp.toLowerCase(); break; // convert text to lower case
					case "t": fromProp = fromProp.toTitleCase(); break; // title-case text
					case "u": fromProp = fromProp.toUpperCase(); break; // uppercase text
					case "v": fromProp = Parser.numberToVulgar(fromProp); break; // vulgarize number
					case "x": fromProp = Parser.numberToText(fromProp); break; // convert number to text
					case "r": fromProp = Math.round(fromProp); break; // round number
					case "f": fromProp = Math.floor(fromProp); break; // floor number
					case "c": fromProp = Math.ceil(fromProp); break; // ceiling number

					default: throw new Error(`Unhandled property modifier "${modifier}"`);
				}
			}

			textStack += fromProp;
		}
	}

	return textStack;
};
Renderer.applyProperties._LEADING_AN = new Set(["a", "e", "i", "o", "u"]);
Renderer.applyProperties._OP_ORDER = [
	"r", "f", "c", // operate on value first
	"v", "x", // cast to desired type
	"l", "t", "u", "a", // operate on value representation
];

Renderer.applyAllProperties = function (entries, object = null) {
	let lastObj = null;
	const handlers = {
		object: (obj) => {
			lastObj = obj;
			return obj;
		},
		string: (str) => Renderer.applyProperties(str, object || lastObj),
	};
	return MiscUtil.getWalker().walk(entries, handlers);
};

Renderer.attackTagToFull = function (tagStr, {isRoll = false} = {}) {
	function renderTag (tags) {
		const ptType = tags.includes("m") ? "Melee " : tags.includes("r") ? "Ranged " : tags.includes("g") ? "Magical " : tags.includes("a") ? "Area " : "";
		const ptMethod = tags.includes("w") ? "Weapon " : tags.includes("s") ? "Spell " : tags.includes("p") ? "Power " : "";
		return `${ptType}${ptMethod}`;
	}

	const tagGroups = tagStr.toLowerCase().split(",").map(it => it.trim()).filter(it => it).map(it => it.split(""));
	if (tagGroups.length > 1) {
		const seen = new Set(tagGroups.last());
		for (let i = tagGroups.length - 2; i >= 0; --i) {
			tagGroups[i] = tagGroups[i].filter(it => {
				const out = !seen.has(it);
				seen.add(it);
				return out;
			});
		}
	}
	return `${tagGroups.map(it => renderTag(it)).join(" or ")}Attack${isRoll ? " Roll" : ""}:`;
};

Renderer.splitFirstSpace = function (string) {
	const firstIndex = string.indexOf(" ");
	return firstIndex === -1 ? [string, ""] : [string.substr(0, firstIndex), string.substr(firstIndex + 1)];
};

Renderer._SPLIT_BY_TAG_LEADING_CHARS = new Set(["@", "="]);

Renderer.splitByTags = function (string) {
	let tagDepth = 0;
	let char, char2;
	const out = [];
	let curStr = "";
	let isPrevCharOpenBrace = false;

	const pushOutput = () => {
		if (!curStr) return;
		out.push(curStr);
	};

	const len = string.length;
	for (let i = 0; i < len; ++i) {
		char = string[i];
		char2 = string[i + 1];

		switch (char) {
			case "{":
				if (!Renderer._SPLIT_BY_TAG_LEADING_CHARS.has(char2)) {
					isPrevCharOpenBrace = false;
					curStr += "{";
					break;
				}

				isPrevCharOpenBrace = true;

				if (tagDepth++ > 0) {
					curStr += "{";
				} else {
					pushOutput();
					curStr = `{${char2}`;
					++i;
				}

				break;

			case "}":
				isPrevCharOpenBrace = false;
				curStr += "}";
				if (tagDepth !== 0 && --tagDepth === 0) {
					pushOutput();
					curStr = "";
				}
				break;

			case "@":
			case "=": {
				curStr += char;
				break;
			}

			default: isPrevCharOpenBrace = false; curStr += char; break;
		}
	}

	pushOutput();

	return out;
};

Renderer._splitByPipeBase = function (leadingCharacter) {
	return function (string) {
		let tagDepth = 0;
		let char0, char, char2;
		const out = [];
		let curStr = "";

		const len = string.length;
		for (let i = 0; i < len; ++i) {
			char0 = string[i - 1];
			char = string[i];
			char2 = string[i + 1];

			switch (char) {
				case "{":
					if (char2 === leadingCharacter) tagDepth++;
					curStr += "{";

					break;

				case "}":
					if (tagDepth) tagDepth--;
					curStr += "}";

					break;

				case "|": {
					if (char0 === "\\") {
						curStr += char;
						break;
					}
					if (tagDepth) curStr += "|";
					else {
						out.push(curStr);
						curStr = "";
					}
					break;
				}

				default: {
					curStr += char;
					break;
				}
			}
		}

		if (curStr) out.push(curStr);
		return out;
	};
};

Renderer.splitTagByPipe = Renderer._splitByPipeBase("@");

Renderer.getRollableEntryDice = function (
	entry,
	name,
	toDisplay,
	{
		isAddHandlers = true,
		pluginResults = null,
	} = {},
) {
	const toPack = MiscUtil.copyFast(entry);
	if (typeof toPack.toRoll !== "string") {
		// handle legacy format
		toPack.toRoll = Renderer.legacyDiceToString(toPack.toRoll);
	}

	const handlerPart = isAddHandlers ? `onmousedown="event.preventDefault()" data-packed-dice='${JSON.stringify(toPack).qq()}'` : "";

	const rollableTitlePart = isAddHandlers ? Renderer.getEntryDiceTitle(toPack.subType) : null;
	const titlePart = isAddHandlers
		? `title="${[name, rollableTitlePart].filter(Boolean).join(". ").qq()}" ${name ? `data-roll-name="${name}"` : ""}`
		: name ? `title="${name.qq()}" data-roll-name="${name.qq()}"` : "";

	const additionalDataPart = (pluginResults || [])
		.filter(it => it.additionalData)
		.map(it => {
			return Object.entries(it.additionalData)
				.map(([dataKey, val]) => `${dataKey}='${typeof val === "object" ? JSON.stringify(val).qq() : `${val}`.qq()}'`)
				.join(" ");
		})
		.join(" ");

	toDisplay = (pluginResults || []).filter(it => it.toDisplay)[0]?.toDisplay ?? toDisplay;

	const ptRoll = Renderer.getRollableEntryDice._getPtRoll(toPack);

	return `<span class="roller render-roller" ${titlePart} ${handlerPart} ${additionalDataPart}>${toDisplay}</span>${ptRoll}`;
};

Renderer.getRollableEntryDice._getPtRoll = (toPack) => {
	if (!toPack.autoRoll) return "";

	const r = Renderer.dice.parseRandomise2(toPack.toRoll);
	return ` (<span data-rd-is-autodice-result="true">${r}</span>)`;
};

Renderer.getEntryDiceTitle = function (subType) {
	return `Click to roll. ${subType === "damage" ? "SHIFT to roll a critical hit, CTRL to half damage (rounding down)." : subType === "d20" ? "SHIFT to roll with advantage, CTRL to roll with disadvantage." : "SHIFT/CTRL to roll twice."}`;
};

Renderer.legacyDiceToString = function (array) {
	let stack = "";
	array.forEach(r => {
		stack += `${r.neg ? "-" : stack === "" ? "" : "+"}${r.number || 1}d${r.faces}${r.mod ? r.mod > 0 ? `+${r.mod}` : r.mod : ""}`;
	});
	return stack;
};

Renderer.getEntryDiceDisplayText = function (entry) {
	if (entry.displayText) return entry.displayText;
	return Renderer._getEntryDiceDisplayText_getDiceAsStr(entry);
};

Renderer._getEntryDiceDisplayText_getDiceAsStr = function (entry) {
	if (entry.successThresh != null) return `${entry.successThresh} percent`;
	if (typeof entry.toRoll === "string") return entry.toRoll;
	// handle legacy format
	return Renderer.legacyDiceToString(entry.toRoll);
};

Renderer.parseScaleDice = function (tag, text) {
	// format: {@scaledice 2d6;3d6|2-8,9|1d6|psi|display text} (or @scaledamage)
	const [baseRoll, progression, addPerProgress, renderMode, displayText] = Renderer.splitTagByPipe(text);
	const progressionParse = MiscUtil.parseNumberRange(progression, 1, 9);
	const baseLevel = Math.min(...progressionParse);
	const options = {};
	const isMultableDice = /^(\d+)d(\d+)$/i.exec(addPerProgress);

	const getSpacing = () => {
		let diff = null;
		const sorted = [...progressionParse].sort(SortUtil.ascSort);
		for (let i = 1; i < sorted.length; ++i) {
			const prev = sorted[i - 1];
			const curr = sorted[i];
			if (diff == null) diff = curr - prev;
			else if (curr - prev !== diff) return null;
		}
		return diff;
	};

	const spacing = getSpacing();
	progressionParse.forEach(k => {
		const offset = k - baseLevel;
		if (isMultableDice && spacing != null) {
			options[k] = offset ? `${Number(isMultableDice[1]) * (offset / spacing)}d${isMultableDice[2]}` : "";
		} else {
			options[k] = offset ? [...new Array(Math.floor(offset / spacing))].map(_ => addPerProgress).join("+") : "";
		}
	});

	const out = {
		type: "dice",
		rollable: true,
		toRoll: baseRoll,
		displayText: displayText || addPerProgress,
		prompt: {
			entry: renderMode === "psi" ? "Spend Psi Points..." : "Cast at...",
			mode: renderMode,
			options,
		},
	};
	if (tag === "@scaledamage") out.subType = "damage";

	return out;
};

Renderer.getAbilityData = function (abArr, {isOnlyShort, isCurrentLineage = false, isBackgroundShortForm = false} = {}) {
	if (isOnlyShort && isCurrentLineage) return new Renderer._AbilityData({asTextShort: "Lineage"});
	if (isOnlyShort && isBackgroundShortForm) {
		if (abArr.length === 2 && abArr[0].choose?.weighted?.from?.length === 3) return new Renderer._AbilityData({asTextShort: `Origin (${abArr[0].choose?.weighted?.from.map(it => it.uppercaseFirst()).join("/")})`});
		if (abArr.length === 2 && abArr[0].choose?.weighted?.from?.length === 6) return new Renderer._AbilityData({asTextShort: `Origin (Any)`});
	}

	const outerStack = (abArr || [null]).map(it => Renderer.getAbilityData._doRenderOuter(it));
	if (outerStack.length <= 1) return outerStack[0];
	return new Renderer._AbilityData({
		asText: `Choose one of: ${outerStack.map((it, i) => `(${Parser.ALPHABET[i].toLowerCase()}) ${it.asText}`).join(" ")}`,
		asTextShort: `${outerStack.map((it, i) => `(${Parser.ALPHABET[i].toLowerCase()}) ${it.asTextShort}`).join(" ")}`,
		asCollection: [...new Set(outerStack.map(it => it.asCollection).flat())],
		areNegative: [...new Set(outerStack.map(it => it.areNegative).flat())],
	});
};

Renderer.getAbilityData._doRenderOuter = function (abObj) {
	const mainAbs = [];
	const asCollection = [];
	const areNegative = [];
	const toConvertToText = [];
	const toConvertToShortText = [];

	if (abObj != null) {
		handleAllAbilities(abObj);
		handleAbilitiesChooseWeighted();
		handleAbilitiesChooseFrom();
		return new Renderer._AbilityData({
			asText: toConvertToText.join("; "),
			asTextShort: toConvertToShortText.join("; "),
			asCollection: asCollection,
			areNegative: areNegative,
		});
	}

	return new Renderer._AbilityData();

	function handleAllAbilities (abObj) {
		MiscUtil.copyFast(Parser.ABIL_ABVS)
			.sort((a, b) => SortUtil.ascSort(abObj[b] || 0, abObj[a] || 0))
			.forEach(shortLabel => handleAbility(abObj, shortLabel));
	}

	function handleAbility (abObj, abv) {
		if (abObj[abv] == null) return;

		const bonus = UiUtil.intToBonus(abObj[abv], {isPretty: true});

		toConvertToText.push(`${Parser.attAbvToFull(abv)} ${bonus}`);
		toConvertToShortText.push(`${abv.uppercaseFirst()} ${bonus}`);

		mainAbs.push(abv.uppercaseFirst());
		asCollection.push(abv);
		if (abObj[abv] < 0) areNegative.push(abv);
	}

	function handleAbilitiesChooseWeighted () {
		if (abObj.choose?.weighted == null) return;

		const {weighted: w} = abObj.choose;

		const isAny = w.from.length === 6;
		const isAllEqual = w.weights.unique().length === 1;
		let cntProcessed = 0;

		const weightsIncrease = w.weights.filter(it => it >= 0).sort(SortUtil.ascSort).reverse();
		const weightsReduce = w.weights.filter(it => it < 0).sort(SortUtil.ascSort).reverse();

		const areIncreaseShort = [];
		const areIncrease = isAny && isAllEqual && w.weights.length > 1 && w.weights[0] >= 0
			? (() => {
				weightsIncrease.forEach(it => areIncreaseShort.push(UiUtil.intToBonus(it, {isPretty: true})));
				return [`${cntProcessed ? "choose " : ""}${Parser.numberToText(w.weights.length)} different ${UiUtil.intToBonus(weightsIncrease[0], {isPretty: true})}`];
			})()
			: weightsIncrease.map(it => {
				areIncreaseShort.push(UiUtil.intToBonus(it, {isPretty: true}));
				if (isAny) return `${cntProcessed ? "choose " : ""}any ${cntProcessed++ ? `other ` : ""}${UiUtil.intToBonus(it, {isPretty: true})}`;
				return `one ${cntProcessed++ ? `other ` : ""}ability to increase by ${it}`;
			});

		const areReduceShort = [];
		const areReduce = isAny && isAllEqual && w.weights.length > 1 && w.weights[0] < 0
			? (() => {
				weightsReduce.forEach(it => areReduceShort.push(UiUtil.intToBonus(it, {isPretty: true})));
				return [`${cntProcessed ? "choose " : ""}${Parser.numberToText(w.weights.length)} different ${UiUtil.intToBonus(weightsReduce[0], {isPretty: true})}`];
			})()
			: weightsReduce.map(it => {
				areReduceShort.push(UiUtil.intToBonus(it, {isPretty: true}));
				if (isAny) return `${cntProcessed ? "choose " : ""}any ${cntProcessed++ ? `other ` : ""}${UiUtil.intToBonus(it, {isPretty: true})}`;
				return `one ${cntProcessed++ ? `other ` : ""}ability to decrease by ${Math.abs(it)}`;
			});

		const startText = isAny
			? `Choose `
			: `From ${w.from.map(it => Parser.attAbvToFull(it)).joinConjunct(", ", " and ")} choose `;

		const ptAreaIncrease = isAny
			? areIncrease.concat(areReduce).join("; ")
			: areIncrease.concat(areReduce).joinConjunct(", ", isAny ? "; " : " and ");

		toConvertToText.push(`${startText}${ptAreaIncrease}`);
		toConvertToShortText.push(`${isAny ? "Any combination " : ""}${areIncreaseShort.concat(areReduceShort).join("/")}${isAny ? "" : ` from ${w.from.map(it => it.uppercaseFirst()).join("/")}`}`);
	}

	function handleAbilitiesChooseFrom () {
		if (abObj.choose?.from == null) return;

		const {choose: ch} = abObj;

		const ptsLong = [];
		const ptsShort = [];

		const allAbilities = ch.from.length === 6;
		const allAbilitiesWithParent = isAllAbilitiesWithParent(ch);

		const amount = UiUtil.intToBonus(ch.amount ?? 1, {isPretty: true});

		if (allAbilities) {
			ptsLong.push("any");
			ptsShort.push("Any");
		} else if (allAbilitiesWithParent) {
			ptsLong.push("any other");
			ptsShort.push("Any other");
		}

		if (ch.count != null && ch.count > 1) {
			ptsLong.push(Parser.numberToText(ch.count));
			ptsShort.push(ch.count);
		}

		if (allAbilities || allAbilitiesWithParent) {
			ptsLong.push(`${ch.count > 1 ? "unique " : ""}${amount}`);
			ptsShort.push(amount);
		} else {
			const ptAbilsLong = ch.from
				.map(abv => Parser.attAbvToFull(abv))
				.joinConjunct(", ", " or ");
			const ptAbilsShort = ch.from
				.map(abv => abv.uppercaseFirst())
				.join("/");
			ptsLong.push(`${ptAbilsLong} ${amount}`);
			ptsShort.push(`${ptAbilsShort} ${amount}`);
		}

		if (ptsLong.length) toConvertToText.push(`Choose ${ptsLong.join(" ")}`);
		if (ptsShort.length) toConvertToShortText.push(ptsShort.join(" "));
	}

	function isAllAbilitiesWithParent (chooseAbs) {
		const tempAbilities = [];
		for (let i = 0; i < mainAbs.length; ++i) {
			tempAbilities.push(mainAbs[i].toLowerCase());
		}
		for (let i = 0; i < chooseAbs.from.length; ++i) {
			const ab = chooseAbs.from[i].toLowerCase();
			if (!tempAbilities.includes(ab)) tempAbilities.push(ab);
			if (!asCollection.includes(ab.toLowerCase)) asCollection.push(ab.toLowerCase());
		}
		return tempAbilities.length === 6;
	}
};

Renderer._AbilityData = function ({asText, asTextShort, asCollection, areNegative} = {}) {
	this.asText = asText || "";
	this.asTextShort = asTextShort || "";
	this.asCollection = asCollection || [];
	this.areNegative = areNegative || [];
};

/**
 * @param filters String of the form `"level=1;2|class=Warlock"`
 * @param namespace Filter namespace to use
 */
Renderer.getFilterSubhashes = function (filters, namespace = null) {
	let customHash = null;

	const subhashes = filters.map(f => {
		const [fName, fVals, fMeta, fOpts] = f.split("=").map(s => s.trim());
		const isBoxData = fName.startsWith("fb");
		const key = isBoxData ? `${fName}${namespace ? `.${namespace}` : ""}` : `flst${namespace ? `.${namespace}` : ""}${UrlUtil.encodeForHash(fName)}`;

		if (isBoxData) {
			return {
				key,
				value: fVals,
				preEncoded: true,
			};
		}

		// region Special cases for keywords
		if (fName === "search") {
			// "search" as a filter name is hackily converted to a box meta option
			return {
				key: VeCt.FILTER_BOX_SUB_HASH_SEARCH_PREFIX,
				value: UrlUtil.encodeForHash(fVals),
				preEncoded: true,
			};
		}

		if (fName === "hash") {
			customHash = fVals;
			return null;
		}

		if (fName === "preserve") {
			return {
				key: VeCt.FILTER_BOX_SUB_HASH_FLAG_IS_PRESERVE_EXISTING,
				value: true,
			};
		}
		// endregion

		let value;
		if (fVals.startsWith("[") && fVals.endsWith("]")) { // range
			const [min, max] = fVals.substring(1, fVals.length - 1).split(";").map(it => it.trim());
			if (max == null) { // shorthand version, with only one value, becomes min _and_ max
				value = [
					`min=${min}`,
					`max=${min}`,
				].join(HASH_SUB_LIST_SEP);
			} else {
				value = [
					min ? `min=${min}` : "",
					max ? `max=${max}` : "",
				].filter(Boolean).join(HASH_SUB_LIST_SEP);
			}
		} else if (fVals.startsWith("::") && fVals.endsWith("::")) { // options
			value = fVals.substring(2, fVals.length - 2).split(";")
				.map(it => it.trim())
				.map(it => {
					if (it.startsWith("!")) return `${UrlUtil.encodeForHash(it.slice(1))}=${UrlUtil.mini.compress(false)}`;
					return `${UrlUtil.encodeForHash(it)}=${UrlUtil.mini.compress(true)}`;
				})
				.join(HASH_SUB_LIST_SEP);
		} else {
			value = fVals.split(";")
				.map(s => s.trim())
				.filter(Boolean)
				.map(s => {
					if (s.startsWith("!")) return `${UrlUtil.encodeForHash(s.slice(1))}=2`;
					return `${UrlUtil.encodeForHash(s)}=1`;
				})
				.join(HASH_SUB_LIST_SEP);
		}

		const out = [{
			key,
			value,
			preEncoded: true,
		}];

		if (fMeta) {
			out.push({
				key: `flmt${UrlUtil.encodeForHash(fName)}`,
				value: fMeta,
				preEncoded: true,
			});
		}

		if (fOpts) {
			out.push({
				key: `flop${UrlUtil.encodeForHash(fName)}`,
				value: fOpts,
				preEncoded: true,
			});
		}

		return out;
	}).flat().filter(Boolean);

	return {
		customHash,
		subhashes,
	};
};

Renderer._cache = {
	inlineStatblock: {},

	async pRunFromEle (ele) {
		const cached = Renderer._cache[ele.dataset.rdCache][ele.dataset.rdCacheId];
		await cached.pFn(ele);
	},
};

Renderer.utils = class {
	static getBorderTr (optText = null) {
		return `<tr><th class="ve-tbl-border" colspan="6">${optText || ""}</th></tr>`;
	}

	static getDividerTr () {
		return `<tr><td colspan="6" class="py-0"><div class="ve-tbl-divider"></div></td></tr>`;
	}

	static getSourceSubText (it) {
		return it.sourceSub ? ` \u2014 ${it.sourceSub}` : "";
	}

	/**
	 * @param ent Entity to render the name row for.
	 * @param [opts] Options object.
	 * @param [opts.prefix] Prefix to display before the name.
	 * @param [opts.suffix] Suffix to display after the name.
	 * @param [opts.controlRhs] Additional control(s) to display after the name.
	 * @param [opts.extraThClasses] Additional TH classes to include.
	 * @param [opts.isInlinedToken] If this entity has a token displayed inline.
	 * @param [opts.page] The hover page for this entity.
	 * @param [opts.asJquery] If the element should be returned as a jQuery object.
	 * @param [opts.extensionData] Additional data to pass to listening extensions when the send button is clicked.
	 * @param [opts.isEmbeddedEntity] True if this is an embedded entity, i.e. one from a `"dataX"` entry.
	 */
	static getNameTr (ent, opts) {
		opts = opts || {};

		const name = ent._displayName || ent.name;
		const pageLinkPart = SourceUtil.getAdventureBookSourceHref(ent.source, ent.page);

		let dataPart = `data-name="${name.qq()}"`;
		if (opts.page) {
			const hash = UrlUtil.URL_TO_HASH_BUILDER[opts.page](ent);
			dataPart += ` data-page="${opts.page}" data-source="${ent.source.escapeQuotes()}" data-hash="${hash.escapeQuotes()}" ${opts.extensionData != null ? `data-extension='${JSON.stringify(opts.extensionData).escapeQuotes()}'` : ""}`;

			// Enable Rivet import for entities embedded in entries
			if (opts.isEmbeddedEntity) ExtensionUtil.addEmbeddedToCache(opts.page, ent.source, hash, ent);
		}

		const tagPartSourceStart = `<${pageLinkPart ? `a href="${Renderer.get().baseUrl}${pageLinkPart}"` : "span"}`;
		const tagPartSourceEnd = `</${pageLinkPart ? "a" : "span"}>`;

		const ptBrewSourceLink = Renderer.utils._getNameTr_getPtPrereleaseBrewSourceLink({ent: ent, brewUtil: PrereleaseUtil})
			|| Renderer.utils._getNameTr_getPtPrereleaseBrewSourceLink({ent: ent, brewUtil: BrewUtil2});

		// Add data-page/source/hash attributes for external script use (e.g. Rivet)
		const $ele = $$`<tr>
			<th class="stats__th-name ve-text-left pb-0 ${opts.extraThClasses ? opts.extraThClasses.join(" ") : ""}" colspan="6" ${dataPart}>
				<div class="split-v-end">
					<div class="ve-flex-v-center">
						<h1 class="stats__h-name copyable m-0" onmousedown="event.preventDefault()" onclick="Renderer.utils._pHandleNameClick(this)">${opts.prefix || ""}${name}${opts.suffix || ""}</h1>
						${opts.controlRhs || ""}
						${!globalThis.IS_VTT && ExtensionUtil.ACTIVE && opts.page ? Renderer.utils.getBtnSendToFoundryHtml() : ""}
					</div>
					<div class="stats__wrp-h-source ${opts.isInlinedToken ? `stats__wrp-h-source--token` : ""} ve-flex-v-baseline">
						${tagPartSourceStart} class="help-subtle stats__h-source-abbreviation ${ent.source ? `${Parser.sourceJsonToSourceClassname(ent.source)}" title="${Parser.sourceJsonToFull(ent.source)}${Renderer.utils.getSourceSubText(ent)}` : ""}">${ent.source ? Parser.sourceJsonToAbv(ent.source) : ""}${tagPartSourceEnd}

						${ent.source ? Parser.sourceJsonToMarkerHtml(ent.source, {isStatsName: true}) : ""}

						${Renderer.utils.isDisplayPage(ent.page) ? ` ${tagPartSourceStart} class="rd__stats-name-page ml-1 lst-is-exporting-image__no-wrap" title="Page ${ent.page}">p${ent.page}${tagPartSourceEnd}` : ""}

						${ptBrewSourceLink}
					</div>
				</div>
			</th>
		</tr>`;

		if (opts.asJquery) return $ele;
		else return $ele[0].outerHTML;
	}

	static _getNameTr_getPtPrereleaseBrewSourceLink ({ent, brewUtil}) {
		if (!brewUtil.hasSourceJson(ent.source) || !brewUtil.sourceJsonToSource(ent.source)?.url) return "";

		return `<a href="${brewUtil.sourceJsonToSource(ent.source).url}" title="View ${brewUtil.DISPLAY_NAME.toTitleCase()} Source" class="ve-self-flex-center ml-2 ve-muted rd__stats-name-brew-link" target="_blank" rel="noopener noreferrer"><span class="	glyphicon glyphicon-share"></span></a>`;
	}

	static getBtnSendToFoundryHtml ({isMb = true} = {}) {
		return `<button title="Send to Foundry (SHIFT for Temporary Import)" class="no-print ve-btn ve-btn-xs ve-btn-default stats__btn-stats-name mx-2 ${isMb ? "mb-2" : ""} ve-self-flex-end lst-is-exporting-image__hidden" onclick="ExtensionUtil.pDoSendStats(event, this)" draggable="true" ondragstart="ExtensionUtil.doDragStart(event, this)"><span class="glyphicon glyphicon-send"></span></button>`;
	}

	static isDisplayPage (page) { return page != null && ((!isNaN(page) && page > 0) || isNaN(page)); }

	static getExcludedTr ({entity, dataProp, page, isExcluded}) {
		const excludedHtml = Renderer.utils.getExcludedHtml({entity, dataProp, page, isExcluded});
		if (!excludedHtml) return "";
		return `<tr><td colspan="6" class="pt-3">${excludedHtml}</td></tr>`;
	}

	static getExcludedHtml ({entity, dataProp, page, isExcluded}) {
		if (isExcluded != null && !isExcluded) return "";
		if (isExcluded == null) {
			if (!ExcludeUtil.isInitialised) return "";
			if (page && !UrlUtil.URL_TO_HASH_BUILDER[page]) return "";
			const hash = page ? UrlUtil.URL_TO_HASH_BUILDER[page](entity) : UrlUtil.autoEncodeHash(entity);
			isExcluded = isExcluded
				|| dataProp === "item" ? Renderer.item.isExcluded(entity, {hash}) : ExcludeUtil.isExcluded(hash, dataProp, entity.source);
		}
		return isExcluded ? `<div class="ve-text-center text-danger"><b><i>Warning: This content has been <a href="blocklist.html">blocklisted</a>.</i></b></div>` : "";
	}

	static getSourceAndPageTrHtml (it) {
		const html = Renderer.utils.getSourceAndPageHtml(it);
		return html ? `<b>Source:</b> ${html}` : "";
	}

	static _getAltSourceHtmlOrText (it, prop, introText, isText) {
		if (!it[prop] || !it[prop].length) return "";

		return `${introText} ${it[prop].map(as => {
			if (as.entry) return (isText ? Renderer.stripTags : Renderer.get().render)(as.entry);
			return `${isText ? "" : `<i class="help-subtle" title="${Parser.sourceJsonToFull(as.source).qq()}">`}${Parser.sourceJsonToAbv(as.source)}${isText ? "" : `</i>`}${Renderer.utils.isDisplayPage(as.page) ? `, page ${as.page}` : ""}`;
		}).join("; ")}`;
	}

	static getReprintedAsHtml (it) { return Renderer.utils._getReprintedAsHtmlOrText(it); }

	static _getReprintedAsHtmlOrText (ent, {isText} = {}) {
		if (!ent.reprintedAs) return "";

		const tag = Parser.getPropTag(ent.__prop);

		const ptReprinted = ent.reprintedAs
			.map(it => {
				const uid = it.uid ?? it;
				const tag_ = it.tag ?? tag;

				const unpacked = DataUtil.proxy.unpackUid(ent.__prop, uid, tag_);
				const {name, source, displayText} = unpacked;

				if (isText) {
					return `${Renderer.stripTags(displayText || name)} in ${Parser.sourceJsonToAbv(source)}`;
				}

				const asTag = `{@${tag_} ${uid}}`;

				return `${Renderer.get().render(asTag)} in <i class="help-subtle" title="${Parser.sourceJsonToFull(source).qq()}">${Parser.sourceJsonToAbv(source)}</i>`;
			})
			.join("; ");

		return `Reprinted as ${ptReprinted}`;
	}

	static getSourceAndPageHtml (it) { return this._getSourceAndPageHtmlOrText(it); }
	static getSourceAndPageText (it) { return this._getSourceAndPageHtmlOrText(it, {isText: true}); }

	static _getSourceAndPageHtmlOrText (it, {isText} = {}) {
		const sourceSub = Renderer.utils.getSourceSubText(it);
		const baseText = `${isText ? `` : `<i title="${Parser.sourceJsonToFull(it.source)}${sourceSub}">`}${Parser.sourceJsonToAbv(it.source)}${sourceSub}${isText ? "" : `</i>`}${Renderer.utils.isDisplayPage(it.page) ? `, page ${it.page}` : ""}`;
		const reprintedAsText = Renderer.utils._getReprintedAsHtmlOrText(it, {isText});
		const addSourceText = Renderer.utils._getAltSourceHtmlOrText(it, "additionalSources", "Additional information from", isText);
		const otherSourceText = Renderer.utils._getAltSourceHtmlOrText(it, "otherSources", "Also found in", isText);
		const externalSourceText = Renderer.utils._getAltSourceHtmlOrText(it, "externalSources", "External sources:", isText);

		const srdText = it.srd52
			? `${isText ? "" : `the <span title="Systems Reference Document (5.2)">`}SRD 5.2.1${isText ? "" : `</span>`}${typeof it.srd === "string" ? ` (as &quot;${it.srd}&quot;)` : ""}`
			: it.srd
				? `${isText ? "" : `the <span title="Systems Reference Document (5.1)">`}SRD 5.1${isText ? "" : `</span>`}${typeof it.srd === "string" ? ` (as &quot;${it.srd}&quot;)` : ""}`
				: "";
		const basicRulesText = it.basicRules2024
			? `the Basic Rules (2024)${typeof it.basicRules2024 === "string" ? ` (as &quot;${it.basicRules2024}&quot;)` : ""}`
			: it.basicRules
				? `the Basic Rules (2014)${typeof it.basicRules === "string" ? ` (as &quot;${it.basicRules}&quot;)` : ""}`
				: "";
		const srdAndBasicRulesText = (srdText || basicRulesText) ? `Available in ${[srdText, basicRulesText].filter(it => it).join(" and ")}` : "";

		return `${[baseText, addSourceText, reprintedAsText, otherSourceText, srdAndBasicRulesText, externalSourceText].filter(it => it).join(". ")}${baseText && (addSourceText || otherSourceText || srdAndBasicRulesText || externalSourceText) ? "." : ""}`;
	}

	static async _pHandleNameClick (ele) {
		await MiscUtil.pCopyTextToClipboard($(ele).text());
		JqueryUtil.showCopiedEffect($(ele));
	}

	static getPageTr (it) {
		return `<tr><td colspan="6" class="pt-3">${Renderer.utils.getSourceAndPageTrHtml(it)}</td></tr>`;
	}

	static getAbilityRollerEntry (statblock, ability, {isDisplayAsBonus} = {}) {
		if (statblock[ability] == null) return "\u2014";
		return `{@ability ${ability} ${statblock[ability]}${isDisplayAsBonus ? `|${Parser.getAbilityModifier(statblock[ability])}` : ""}}`;
	}

	static getAbilityRoller (statblock, ability, {isDisplayAsBonus = false} = {}) {
		return Renderer.get().render(Renderer.utils.getAbilityRollerEntry(statblock, ability, {isDisplayAsBonus}));
	}

	static getEmbeddedDataHeader (
		name,
		style,
		{
			isCollapsed = false,
			isStatic = false,
			isStats = false,

			htmlNameCollapsed = null,
			htmlNameExpanded = null,
		} = {},
	) {
		return `<table class="rd__b-special rd__b-data ${style ? `rd__b-data--${style}` : ""} ${isStats ? `rd__b-data--stats` : ""}">
		<thead>
			<tr>
				<th class="rd__data-embed-header ve-text-left" colspan="6" data-rd-data-embed-header="true">
					<div class="w-100 split-v-center">
						<div class="ve-flex-v-center w-100 min-w-0">
							<span class="rd__data-embed-name ${!isStatic && isCollapsed ? "" : `ve-hidden`}">${htmlNameCollapsed || name}</span>
							<span class="rd__data-embed-name-expanded ve-text-right pr-2 w-100 ${!isStatic && isCollapsed ? `ve-hidden` : ""}">${htmlNameExpanded || ""}</span>
						</div>
						${isStatic ? `<span></span>` : `<span class="rd__data-embed-toggle">[${isCollapsed ? "+" : "\u2013"}]</span>`}
					</div>
				</th>
			</tr>
		</thead><tbody class="${!isStatic && isCollapsed ? `ve-hidden` : ""}" data-rd-embedded-data-render-target="true">`;
	}

	static getEmbeddedDataFooter () {
		return `</tbody></table>`;
	}

	static getTokenMetadataAttributes (ent, {displayName = null} = {}) {
		const tokenName = displayName || ent.name;

		const ptTitle = [
			ent.tokenCredit ? `Credit: ${ent.tokenCredit.qq()}` : "",
			ent.tokenCustom ? `This is a custom/unofficial token.` : "",
		]
			.filter(Boolean)
			.join(". ");

		return [
			`alt="Token Image${tokenName ? `: ${tokenName.qq()}` : ""}"`,
			ptTitle ? `title="${ptTitle}"` : "",
		]
			.filter(Boolean)
			.join(" ");
	}

	static TabButton = function ({label, fnChange, fnPopulate, isVisible}) {
		this.label = label;
		this.fnChange = fnChange;
		this.fnPopulate = fnPopulate;
		this.isVisible = isVisible;
	};

	static _tabs = {};
	static _curTab = null;
	static _tabsPreferredLabel = null;
	static bindTabButtons ({tabButtons, tabLabelReference, $wrpTabs, wrpTabs, $pgContent, pgContent}) {
		if ($wrpTabs && wrpTabs) throw new Error(`Only one of "$wrpTabs" and "wrpTabs" may be provided!`);
		if ($pgContent && pgContent) throw new Error(`Only one of "$pgContent" and "pgContent" may be provided!`);

		if (wrpTabs) $wrpTabs = $(wrpTabs);
		if (pgContent) $pgContent = $(pgContent);

		Renderer.utils._tabs = {};
		Renderer.utils._curTab = null;

		$wrpTabs.find(`.stat-tab-gen`).remove();

		tabButtons.forEach((tb, i) => {
			tb.ix = i;

			tb.$t = $(`<button class="ui-tab__btn-tab-head ve-btn ve-btn-default stat-tab-gen pt-2p px-4p pb-0">${tb.label}</button>`)
				.click(() => tb.fnActivateTab({isUserInput: true}));

			tb.fnActivateTab = ({isUserInput = false} = {}) => {
				const curTab = Renderer.utils._curTab;
				const tabs = Renderer.utils._tabs;

				if (!curTab || curTab.label !== tb.label) {
					if (curTab) curTab.$t.removeClass(`ui-tab__btn-tab-head--active`);
					Renderer.utils._curTab = tb;
					tb.$t.addClass(`ui-tab__btn-tab-head--active`);
					if (curTab) tabs[curTab.label].$content = $pgContent.children().detach();

					tabs[tb.label] = tb;
					if (!tabs[tb.label].$content && tb.fnPopulate) tb.fnPopulate();
					else $pgContent.append(tabs[tb.label].$content);
					if (tb.fnChange) tb.fnChange();
				}

				// If the user clicked a tab, save it as their chosen tab
				if (isUserInput) Renderer.utils._tabsPreferredLabel = tb.label;
			};
		});

		// Avoid displaying a tab button for single tabs
		if (tabButtons.length !== 1) tabButtons.slice().reverse().forEach(tb => $wrpTabs.prepend(tb.$t));

		// If there was no previous selection, select the first tab
		if (!Renderer.utils._tabsPreferredLabel) return tabButtons[0].fnActivateTab();

		// If the exact tab exist, select it
		const tabButton = tabButtons.find(tb => tb.label === Renderer.utils._tabsPreferredLabel);
		if (tabButton) return tabButton.fnActivateTab();

		// If the user's preferred tab is not present, find the closest tab, and activate it instead.
		// Always prefer later tabs.
		const ixDesired = tabLabelReference.indexOf(Renderer.utils._tabsPreferredLabel);
		if (!~ixDesired) return tabButtons[0].fnActivateTab(); // Should never occur

		const ixsAvailableMetas = tabButtons
			.map(tb => {
				const ixMapped = tabLabelReference.indexOf(tb.label);
				if (!~ixMapped) return null;
				return {
					ixMapped,
					label: tb.label,
				};
			})
			.filter(Boolean);
		if (!ixsAvailableMetas.length) return tabButtons[0].fnActivateTab(); // Should never occur

		// Find a later tab and activate it, if possible
		const ixMetaHigher = ixsAvailableMetas.find(({ixMapped}) => ixMapped > ixDesired);
		if (ixMetaHigher != null) return (tabButtons.find(it => it.label === ixMetaHigher.label) || tabButtons[0]).fnActivateTab();

		// Otherwise, click the highest tab
		const ixMetaMax = ixsAvailableMetas.last();
		(tabButtons.find(it => it.label === ixMetaMax.label) || tabButtons[0]).fnActivateTab();
	}

	static _pronounceButtonsBound = false;
	static bindPronounceButtons () {
		if (Renderer.utils._pronounceButtonsBound) return;
		Renderer.utils._pronounceButtonsBound = true;
		$(`body`).on("click", ".stats__btn-name-pronounce", function () {
			const audio = $(this).find(`[data-name="aud-pronounce"]`)[0];
			audio.currentTime = 0;
			audio.play();
		});
	}

	static getAltArtDisplayName (meta) { return meta.displayName || meta.name || meta.token?.name; }
	static getAltArtSource (meta) { return meta.source || meta.token?.source; }

	static getRenderedAltArtEntry (meta, {isPlainText = false} = {}) {
		const displayName = Renderer.utils.getAltArtDisplayName(meta);
		const source = Renderer.utils.getAltArtSource(meta);

		if (!displayName || !source) return "";

		return `${isPlainText ? "" : `<div>`}${displayName}; ${isPlainText ? "" : `<span title="${Parser.sourceJsonToFull(source)}">`}${Parser.sourceJsonToAbv(source)}${Renderer.utils.isDisplayPage(meta.page) ? ` p${meta.page}` : ""}${isPlainText ? "" : `</span></div>`}`;
	}

	static async pHasFluffText (entity, prop) {
		return entity.hasFluff || ((await Renderer.utils.pGetPredefinedFluff(entity, prop))?.entries?.length || 0) > 0;
	}

	static async pHasFluffImages (entity, prop) {
		return entity.hasFluffImages || (((await Renderer.utils.pGetPredefinedFluff(entity, prop))?.images?.length || 0) > 0);
	}

	/**
	 * @param entry Data entry to search for fluff on, e.g. a monster
	 * @param fluffProp The fluff index reference prop, e.g. `"monsterFluff"`
	 */
	static async pGetPredefinedFluff (entry, fluffProp, {lockToken2 = null} = {}) {
		if (!entry.fluff) return null;

		const mappedProp = `_${fluffProp}`;
		const mappedPropAppend = `_append${fluffProp.uppercaseFirst()}`;
		const fluff = {};

		const assignPropsIfExist = (fromObj, ...props) => {
			props.forEach(prop => {
				if (fromObj[prop]) fluff[prop] = fromObj[prop];
			});
		};

		assignPropsIfExist(entry.fluff, "name", "type", "entries", "images");

		if (entry.fluff[mappedProp]) {
			const fromList = await DataLoader.pCacheAndGet(
				fluffProp,
				SourceUtil.getEntitySource(entry),
				UrlUtil.URL_TO_HASH_BUILDER[fluffProp](entry.fluff[mappedProp]),
				{
					lockToken2,
					isCopy: true,
				},
			);
			if (fromList) {
				assignPropsIfExist(fromList, "name", "type", "entries", "images");
			}
		}

		if (entry.fluff[mappedPropAppend]) {
			const fromList = await DataLoader.pCacheAndGet(
				fluffProp,
				SourceUtil.getEntitySource(entry),
				UrlUtil.URL_TO_HASH_BUILDER[fluffProp](entry.fluff[mappedPropAppend]),
				{
					lockToken2,
				},
			);
			if (fromList) {
				if (fromList.entries) {
					fluff.entries = MiscUtil.copyFast(fluff.entries || []);
					fluff.entries.push(...MiscUtil.copyFast(fromList.entries));
				}
				if (fromList.images) {
					fluff.images = MiscUtil.copyFast(fluff.images || []);
					fluff.images.push(...MiscUtil.copyFast(fromList.images));
				}
			}
		}

		if (fluff.entries?.length || fluff.images?.length) {
			fluff.name = entry.name;
			fluff.source = SourceUtil.getEntitySource(entry);
		}

		return fluff;
	}

	static async _pGetImplicitFluff ({entity, fluffProp, lockToken2} = {}) {
		if (
			!entity.hasFluff
			&& !entity.hasFluffImages
			&& (!entity._versionBase_isVersion || (!entity._versionBase_hasFluff && !entity._versionBase_hasFluffImages))
		) return null;

		const fluffEntity = await DataLoader.pCacheAndGet(fluffProp, SourceUtil.getEntitySource(entity), UrlUtil.URL_TO_HASH_BUILDER[fluffProp](entity), {lockToken2});
		if (fluffEntity) return fluffEntity;

		if (entity._versionBase_isVersion && (entity._versionBase_hasFluff || entity._versionBase_hasFluffImages)) {
			return DataLoader.pCacheAndGet(
				fluffProp,
				SourceUtil.getEntitySource(entity),
				entity._versionBase_hash,
				{
					lockToken2,
				},
			);
		}

		return null;
	}

	static async pGetProxyFluff ({entity, prop = null}) {
		prop ||= entity?.__prop;
		switch (prop) {
			case "monster":
				return Renderer.monster.pGetFluff(entity);
			case "item":
			case "magivariant":
			case "baseitem":
				return Renderer.item.pGetFluff(entity);
			default: return Renderer.utils.pGetFluff({entity, fluffProp: `${prop}Fluff`});
		}
	}

	// TODO(Future) move into `DataLoader`; cleanup `lockToken2` usage
	static async pGetFluff ({entity, pFnPostProcess, fluffProp, lockToken2 = null} = {}) {
		const predefinedFluff = await Renderer.utils.pGetPredefinedFluff(entity, fluffProp, {lockToken2});
		if (predefinedFluff) {
			if (pFnPostProcess) return pFnPostProcess(predefinedFluff);
			return predefinedFluff;
		}

		const fluff = await Renderer.utils._pGetImplicitFluff({entity, fluffProp, lockToken2});
		if (!fluff) return null;

		if (pFnPostProcess) return pFnPostProcess(fluff);
		return fluff;
	}
	/**
	 * @param isImageTab True if this is the "Images" tab, false otherwise
	 * @param $content The statblock wrapper
	 * @param content The statblock wrapper
	 * @param entity Entity to build tab for (e.g. a monster; an item)
	 * @param pFnGetFluff Function which gets the entity's fluff.
	 * @param $headerControls
	 * @param wrpHeaderControls
	 * @param page
	 */
	static async pBuildFluffTab ({isImageTab, $content, wrpContent, entity, $headerControls, wrpHeaderControls, pFnGetFluff, page} = {}) {
		if ($content && wrpContent) throw new Error(`Only one of "$content" and "wrpContent" may be specified!`);
		if ($headerControls && wrpHeaderControls) throw new Error(`Only one of "$headerControls" and "wrpHeaderControls" may be specified!`);

		if (wrpContent) $content = $(wrpContent);
		if (wrpHeaderControls) $headerControls = $(wrpHeaderControls);

		$content.append(Renderer.utils.getBorderTr());
		$content.append(Renderer.utils.getNameTr(entity, {controlRhs: $headerControls, asJquery: true, page}));
		const $td = $(`<td colspan="6" class="pb-3"></td>`);
		$$`<tr>${$td}</tr>`.appendTo($content);
		$content.append(Renderer.utils.getBorderTr());

		const fluff = MiscUtil.copyFast((await pFnGetFluff(entity)) || {});
		fluff.entries = fluff.entries || [Renderer.utils.HTML_NO_INFO];
		fluff.images = fluff.images || [Renderer.utils.HTML_NO_IMAGES];

		$td.fastSetHtml(Renderer.utils.getFluffTabContent({entity, fluff, isImageTab}));
	}

	static HTML_NO_INFO = "<i>No information available.</i>";
	static HTML_NO_IMAGES = "<i>No images available.</i>";

	/* ----- */

	static _TITLE_SKIP_TYPES = new Set(["entries", "section"]);

	static _getFluffTabContent_getSkippableEntryName (name) {
		return name
			.toLowerCase()
			.trim()
			.split(/\s+/g)
			.filter(Boolean)
			.map(tk => tk.toSingle())
			.join(" ");
	}

	/**
	 * If the first entry has a name, and it matches the name of the statblock, remove it to avoid
	 *   having two of the same title stacked on top of each other.
	 */
	static _getFluffTabContent_isSkipEntryName (
		{
			entity,
			fluff,
			ix,
			fluffEntry,
		},
	) {
		if (fluff.preserveName) return false;

		if (ix) return false;
		if (!entity.name || !fluffEntry.name) return false;
		if (!Renderer.utils._TITLE_SKIP_TYPES.has(fluffEntry.type)) return false;

		const fluffEntrySkippableName = Renderer.utils._getFluffTabContent_getSkippableEntryName(fluffEntry.name);
		const entitySkippableName = Renderer.utils._getFluffTabContent_getSkippableEntryName(entity.name);

		return fluffEntrySkippableName.includes(entitySkippableName) || entitySkippableName.includes(fluffEntrySkippableName);
	}

	static getFluffTabContent ({entity, fluff, isImageTab = false}) {
		Renderer.get().setFirstSection(true);

		return (fluff[isImageTab ? "images" : "entries"] || [])
			.map((fluffEntry, ix) => {
				if (isImageTab) return Renderer.get().render(fluffEntry);

				if (
					Renderer.utils._getFluffTabContent_isSkipEntryName({
						entity,
						fluff,
						ix,
						fluffEntry,
					})
				) {
					const cpy = MiscUtil.copyFast(fluffEntry);
					delete cpy.name;
					return Renderer.get().render(cpy);
				}

				if (typeof fluffEntry === "string") return `<p>${Renderer.get().render(fluffEntry)}</p>`;
				else return Renderer.get().render(fluffEntry);
			})
			.join("");
	}

	/* ----- */

	static prerequisite = class {
		static _WEIGHTS = [
			"level",
			"pact",
			"patron",
			"spell",
			"race",
			"alignment",
			"ability",
			"proficiency",
			"expertise",
			"spellcasting",
			"spellcasting2020",
			"spellcastingFeature",
			"spellcastingPrepared",
			"spellcastingFocus",
			"psionics",
			"feature",
			"feat",
			"featCategory",
			"optionalfeature",
			"background",
			"item",
			"itemType",
			"itemProperty",
			"campaign",
			"culture",
			"group",
			"other",
			"otherSummary",
			"exclusiveFeatCategory",
			undefined,
		]
			.mergeMap((k, i) => ({[k]: i}));

		static _getShortClassName (className) {
			// remove all the vowels except the first
			const ixFirstVowel = /[aeiou]/.exec(className).index;
			const start = className.slice(0, ixFirstVowel + 1);
			let end = className.slice(ixFirstVowel + 1);
			end = end.replace(/[aeiou]/g, "");
			return `${start}${end}`.toTitleCase();
		}

		/**
		 * @param prerequisites
		 * @param isListMode
		 * @param {?Set} blocklistKeys
		 * @param {?object} keyOptions
		 * @param isTextOnly
		 * @param isSkipPrefix
		 * @param {"classic" | null} styleHint
		 * @return {string}
		 */
		static getHtml (
			prerequisites,
			{
				isListMode = false,
				blocklistKeys = null,
				keyOptions = null,
				isTextOnly = false,
				isSkipPrefix = false,
				styleHint = null,
			} = {},
		) {
			if (!prerequisites?.length) return isListMode ? "\u2014" : "";

			styleHint ||= VetoolsConfig.get("styleSwitcher", "style");

			const prereqsShared = prerequisites.length === 1
				? {}
				: Object.entries(
					prerequisites
						.slice(1)
						.reduce((a, b) => CollectionUtil.objectIntersect(a, b), prerequisites[0]),
				)
					.filter(([k, v]) => prerequisites.every(pre => CollectionUtil.deepEquals(pre[k], v)))
					.mergeMap(([k, v]) => ({[k]: v}));

			const shared = Object.keys(prereqsShared).length
				? this.getHtml([prereqsShared], {isListMode, blocklistKeys, isTextOnly, isSkipPrefix: true})
				: null;

			let cntPrerequisites = 0;
			let hasNote = false;
			const listOfChoices = prerequisites
				.map(pr => {
					// Never include notes in list mode
					const ptNote = !isListMode && pr.note ? Renderer.get().render(pr.note) : null;
					if (ptNote) {
						hasNote = true;
					}

					const prereqsToJoin = Object.entries(pr)
						.filter(([k]) => !prereqsShared[k])
						.sort(([kA], [kB]) => this._WEIGHTS[kA] - this._WEIGHTS[kB])
						.map(([k, v]) => {
							if (k === "note" || blocklistKeys?.has(k)) return false;

							cntPrerequisites += 1;

							switch (k) {
								case "level": return this._getHtml_level({v, isListMode, keyOptions, isTextOnly, styleHint});
								case "pact": return this._getHtml_pact({v, isListMode, keyOptions, isTextOnly, styleHint});
								case "patron": return this._getHtml_patron({v, isListMode, keyOptions, isTextOnly, styleHint});
								case "spell": return this._getHtml_spell({v, isListMode, keyOptions, isTextOnly, styleHint});
								case "feat": return this._getHtml_feat({v, isListMode, keyOptions, isTextOnly, styleHint});
								case "featCategory": return this._getHtml_featCategory({v, isListMode, keyOptions, isTextOnly, styleHint});
								case "exclusiveFeatCategory": return this._getHtml_exclusiveFeatCategory({v, isListMode, keyOptions, isTextOnly, styleHint});
								case "optionalfeature": return this._getHtml_optionalfeature({v, isListMode, keyOptions, isTextOnly, styleHint});
								case "feature": return this._getHtml_feature({v, isListMode, keyOptions, isTextOnly, styleHint});
								case "item": return this._getHtml_item({v, isListMode, keyOptions, isTextOnly, styleHint});
								case "itemType": return this._getHtml_itemType({v, isListMode, keyOptions, isTextOnly, styleHint});
								case "itemProperty": return this._getHtml_itemProperty({v, isListMode, keyOptions, isTextOnly, styleHint});
								case "otherSummary": return this._getHtml_otherSummary({v, isListMode, keyOptions, isTextOnly, styleHint});
								case "other": return this._getHtml_other({v, isListMode, keyOptions, isTextOnly, styleHint});
								case "race": return this._getHtml_race({v, isListMode, keyOptions, isTextOnly, styleHint});
								case "background": return this._getHtml_background({v, isListMode, keyOptions, isTextOnly, styleHint});
								case "ability": return this._getHtml_ability({v, isListMode, keyOptions, isTextOnly, styleHint});
								case "proficiency": return this._getHtml_proficiency({v, isListMode, keyOptions, isTextOnly, styleHint});
								case "expertise": return this._getHtml_expertise({v, isListMode, keyOptions, isTextOnly, styleHint});
								case "spellcasting": return this._getHtml_spellcasting({v, isListMode, keyOptions, isTextOnly, styleHint});
								case "spellcasting2020": return this._getHtml_spellcasting2020({v, isListMode, keyOptions, isTextOnly, styleHint});
								case "spellcastingFeature": return this._getHtml_spellcastingFeature({v, isListMode, keyOptions, isTextOnly, styleHint});
								case "spellcastingPrepared": return this._getHtml_spellcastingPrepared({v, isListMode, keyOptions, isTextOnly, styleHint});
								case "spellcastingFocus": return this._getHtml_spellcastingFocus({v, isListMode, keyOptions, isTextOnly, styleHint});
								case "psionics": return this._getHtml_psionics({v, isListMode, keyOptions, isTextOnly, styleHint});
								case "alignment": return this._getHtml_alignment({v, isListMode, keyOptions, isTextOnly, styleHint});
								case "campaign": return this._getHtml_campaign({v, isListMode, keyOptions, isTextOnly, styleHint});
								case "culture": return this._getHtml_culture({v, isListMode, keyOptions, isTextOnly, styleHint});
								case "membership": return this._getHtml_membership({v, isListMode, keyOptions, isTextOnly, styleHint});
								case "group": return this._getHtml_group({v, isListMode, keyOptions, isTextOnly, styleHint});
								default: throw new Error(`Unhandled key: ${k}`);
							}
						})
						.filter(Boolean);

					const ptPrereqs = prereqsToJoin
						.join(prereqsToJoin.some(it => / or /.test(it)) ? "; " : ", ");

					return [ptPrereqs, ptNote]
						.filter(Boolean)
						.join(". ");
				})
				.filter(Boolean);

			if (!listOfChoices.length && !shared) return isListMode ? "\u2014" : "";
			if (isListMode) return [shared, listOfChoices.join("/")].filter(Boolean).join(" + ");

			const sharedSuffix = MiscUtil.findCommonSuffix(listOfChoices, {isRespectWordBoundaries: true});
			const listOfChoicesTrimmed = sharedSuffix
				? listOfChoices.map(it => it.slice(0, -sharedSuffix.length))
				: listOfChoices;

			const joinedChoices = (
				hasNote
					? listOfChoicesTrimmed.join(" Or, ")
					: listOfChoicesTrimmed.joinConjunct(listOfChoicesTrimmed.some(it => / or /.test(it)) ? "; " : ", ", " or ")
			) + sharedSuffix;

			const ptPrefix = isSkipPrefix ? "" : `Prerequisite${cntPrerequisites === 1 ? "" : "s"}: `;
			const ptsSharedOther = [shared, joinedChoices].filter(Boolean);
			if (ptsSharedOther.length < 2) return `${ptPrefix}${ptsSharedOther.join(", ")}`;

			const ptsSharedOtherJoiner = ptsSharedOther.some(pt => pt.includes(","))
				? ptsSharedOther.some(pt => pt.includes(";")) ? "; plus " : "; "
				: ", ";
			return `${ptPrefix}${[shared, joinedChoices].filter(Boolean).join(ptsSharedOtherJoiner)}`;
		}

		static _getHtml_level ({v, isListMode, keyOptions, isTextOnly, styleHint}) {
			// a generic level requirement
			if (typeof v === "number") {
				if (keyOptions?.level?.isNameOnly) return "";

				if (isListMode) return `Lvl ${v}`;

				if (styleHint === "classic") return `${Parser.getOrdinalForm(v)} level`;
				return `Level ${v}+`;
			}

			if (!v.class && !v.subclass) {
				if (keyOptions?.level?.isNameOnly) return "";

				if (isListMode) return `Lvl ${v.level}`;

				if (styleHint === "classic") return `${Parser.getOrdinalForm(v.level)} level`;
				return `Level ${v.level}+`;
			}

			const isLevelVisible = v.level !== 1 // Hide the "implicit" 1st level.
				&& !keyOptions?.level?.isNameOnly;
			const isSubclassVisible = v.subclass?.visible
				|| (!isListMode && v.subclass?.visibleStats)
				|| (isListMode && v.subclass?.visibleList);
			const isClassVisible = v.class
				&& (
					v.class.visible
					|| isSubclassVisible // force the class name to be displayed if there's a subclass being displayed
					|| (!isListMode && v.class?.visibleStats)
					|| (isListMode && v.class?.visibleList)
				);
			if (isListMode) {
				const shortNameRaw = isClassVisible ? this._getShortClassName(v.class.name) : null;
				return `${isClassVisible ? `${shortNameRaw.slice(0, 4)}${isSubclassVisible ? "*" : "."}` : ""}${isLevelVisible ? ` Lvl ${v.level}` : ""}`;
			}

			let classPart = "";
			if (isClassVisible && isSubclassVisible) classPart = ` ${v.class.name} (${v.subclass.name})`;
			else if (isClassVisible) classPart = ` ${v.class.name}`;
			else if (isSubclassVisible) classPart = ` &lt;remember to insert class name here&gt; (${v.subclass.name})`; // :^)

			const ptLevel = !isLevelVisible
				? ""
				: styleHint === "classic"
					? `${Parser.getOrdinalForm(v.level)} level`
					: `Level ${v.level}+`;

			return [ptLevel, classPart].filter(Boolean).join(" ");
		}

		static _getHtml_pact ({v, isListMode}) {
			return Parser.prereqPactToFull(v);
		}

		static _getHtml_patron ({v, isListMode}) {
			return isListMode ? `${Parser.prereqPatronToShort(v)} patron` : `${v} patron`;
		}

		static _getHtml_spell ({v, isListMode, keyOptions, isTextOnly}) {
			return isListMode
				? v.map(sp => {
					if (typeof sp === "string") return sp.split("#")[0].split("|")[0].toTitleCase();
					return sp.entrySummary || sp.entry;
				})
					.join("/")
				: v.map(sp => {
					if (typeof sp === "string") return Parser.prereqSpellToFull(sp, {isTextOnly});
					return isTextOnly ? Renderer.stripTags(sp.entry) : Renderer.get().render(`{@filter ${sp.entry}|spells|${sp.choose}}`);
				})
					.joinConjunct(", ", " or ");
		}

		static _getHtml_feat ({v, isListMode, keyOptions, isTextOnly, styleHint}) {
			return this._getHtml_uidTag({v, isListMode, keyOptions, isTextOnly, styleHint, tag: "feat"});
		}

		static _getHtml_featCategory ({v, isListMode, keyOptions, isTextOnly, styleHint}) {
			if (isListMode) {
				const ptTypes = v.map(featCategory => Parser.featCategoryToFull(featCategory))
					.join("/");
				return `Any ${ptTypes}`;
			}

			const ptTypes = v.map(featCategory => Parser.featCategoryToFull(featCategory))
				.joinConjunct(", ", " or ");
			return `Any ${ptTypes} Feat`;
		}

		static _getHtml_exclusiveFeatCategory ({v, isListMode, keyOptions, isTextOnly, styleHint}) {
			if (isListMode) {
				const ptTypes = v.map(featCategory => Parser.featCategoryToFull(featCategory))
					.join("/");
				return `Only ${ptTypes}`;
			}

			const ptTypes = v.map(featCategory => Parser.featCategoryToFull(featCategory))
				.joinConjunct(", ", " or ");
			return `Can't Have Another ${ptTypes} Feat`;
		}

		static _getHtml_optionalfeature ({v, isListMode, keyOptions, isTextOnly, styleHint}) {
			return this._getHtml_uidTag({v, isListMode, keyOptions, isTextOnly, styleHint, tag: "optfeature"});
		}

		static _getHtml_uidTag ({v, isListMode, keyOptions, isTextOnly, styleHint, tag}) {
			if (isListMode) return v.map(x => x.split("|")[0].toTitleCase()).join("/");

			return v
				.map(uid => {
					uid = styleHint === "classic" ? uid : uid.split("|").map((pt, i) => i === 0 ? pt.toTitleCase() : pt).join("|");
					const asTag = `{@${tag} ${uid}}`;
					return isTextOnly ? Renderer.stripTags(asTag) : Renderer.get().render(asTag);
				})
				.joinConjunct(", ", " or ");
		}

		static _getHtml_feature ({v, isListMode, keyOptions, isTextOnly, styleHint}) {
			if (isListMode) return v.map(x => Renderer.stripTags(x).toTitleCase()).join("/");

			const ptNames = v.map(it => isTextOnly ? Renderer.stripTags(it) : Renderer.get().render(it)).joinConjunct(", ", " or ");

			if (styleHint === "classic") return ptNames;
			return `${ptNames} Feature${v.length === 1 ? "" : "s"}`;
		}

		static _getHtml_item ({v, isListMode}) {
			return isListMode ? v.map(x => x.toTitleCase()).join("/") : v.joinConjunct(", ", " or ");
		}

		static _getHtml_itemType ({v, isListMode}) {
			return isListMode
				? v
					.map(it => Renderer.item.getType(it, {isIgnoreMissing: true}))
					.filter(Boolean)
					.map(it => it.abbreviation)
					.join("+")
				: v
					.map(it => Renderer.item.getType(it, {isIgnoreMissing: true}))
					.filter(Boolean)
					.map(it => it.name?.toTitleCase())
					.joinConjunct(", ", " and ");
		}

		static _getHtml_itemProperty ({v, isListMode}) {
			if (v == null) return isListMode ? "No Prop." : "No Other Properties";

			return isListMode
				? v
					.map(it => Renderer.item.getProperty(it, {isIgnoreMissing: true}))
					.filter(Boolean)
					.map(it => it.abbreviation)
					.join("+")
				: (
					`${v
						.map(it => Renderer.item.getProperty(it, {isIgnoreMissing: true}))
						.filter(Boolean)
						.map(it => it.name?.toTitleCase())
						.joinConjunct(", ", " and ")
					} Property`
				);
		}

		static _getHtml_otherSummary ({v, isListMode, keyOptions, isTextOnly}) {
			return isListMode
				? (v.entrySummary || Renderer.stripTags(v.entry))
				: (isTextOnly ? Renderer.stripTags(v.entry) : Renderer.get().render(v.entry));
		}

		static _getHtml_other ({v, isListMode, keyOptions, isTextOnly}) {
			return isListMode ? "Special" : (isTextOnly ? Renderer.stripTags(v) : Renderer.get().render(v));
		}

		static _getHtml_race ({v, isListMode, keyOptions, isTextOnly, styleHint}) {
			const parts = v.map((it, i) => {
				if (isListMode) {
					return `${it.name.toTitleCase()}${it.subrace != null ? ` (${it.subrace})` : ""}`;
				} else {
					const raceName = it.displayEntry ? (isTextOnly ? Renderer.stripTags(it.displayEntry) : Renderer.get().render(it.displayEntry)) : (i === 0 || styleHint !== "classic") ? it.name.toTitleCase() : it.name;
					return `${raceName}${it.subrace != null ? ` (${it.subrace})` : ""}`;
				}
			});
			return isListMode ? parts.join("/") : parts.joinConjunct(", ", " or ");
		}

		static _getHtml_background ({v, isListMode, keyOptions, isTextOnly}) {
			const parts = v.map((it, i) => {
				if (isListMode) {
					return `${it.name.toTitleCase()}`;
				} else {
					return it.displayEntry ? (isTextOnly ? Renderer.stripTags(it.displayEntry) : Renderer.get().render(it.displayEntry)) : (i === 0 || styleHint !== "classic") ? it.name.toTitleCase() : it.name;
				}
			});
			return isListMode ? parts.join("/") : parts.joinConjunct(", ", " or ");
		}

		static _getHtml_ability ({v, isListMode, keyOptions, isTextOnly, styleHint}) {
			// `v` is an array or objects with str/dex/... properties; array is "OR"'d together, object is "AND"'d together

			let hadMultipleInner = false;
			let hadMultiMultipleInner = false;
			let allValuesEqual = null;

			outer: for (const abMeta of v) {
				for (const req of Object.values(abMeta)) {
					if (allValuesEqual == null) allValuesEqual = req;
					else {
						if (req !== allValuesEqual) {
							allValuesEqual = null;
							break outer;
						}
					}
				}
			}

			const abilityOptions = v.map(abMeta => {
				if (allValuesEqual) {
					const abList = Object.keys(abMeta);
					hadMultipleInner = hadMultipleInner || abList.length > 1;
					return isListMode ? abList.map(ab => ab.uppercaseFirst()).join(", ") : abList.map(ab => Parser.attAbvToFull(ab)).joinConjunct(", ", " and ");
				} else {
					const groups = {};

					Object.entries(abMeta).forEach(([ab, req]) => {
						(groups[req] = groups[req] || []).push(ab);
					});

					let isMulti = false;
					const byScore = Object.entries(groups)
						.sort(([reqA], [reqB]) => SortUtil.ascSort(Number(reqB), Number(reqA)))
						.map(([req, abs]) => {
							hadMultipleInner = hadMultipleInner || abs.length > 1;
							if (abs.length > 1) hadMultiMultipleInner = isMulti = true;

							abs = abs.sort(SortUtil.ascSortAtts);

							if (isListMode) return `${abs.map(ab => ab.uppercaseFirst()).join(", ")} ${req}+`;

							const ptHigher = styleHint === "classic" ? " or higher" : "+";
							return `${abs.map(ab => Parser.attAbvToFull(ab)).joinConjunct(", ", " and ")} ${req}${ptHigher}`;
						});

					return isListMode
						? `${isMulti || byScore.length > 1 ? "(" : ""}${byScore.join(" & ")}${isMulti || byScore.length > 1 ? ")" : ""}`
						: isMulti ? byScore.joinConjunct("; ", " and ") : byScore.joinConjunct(", ", " and ");
				}
			});

			// if all values were equal, add the "X+" text at the end, as the options render doesn't include it
			if (isListMode) {
				return `${abilityOptions.join("/")}${allValuesEqual != null ? ` ${allValuesEqual}+` : ""}`;
			}

			const isComplex = hadMultiMultipleInner || hadMultipleInner || allValuesEqual == null;
			const joined = abilityOptions.joinConjunct(
				hadMultiMultipleInner ? " - " : hadMultipleInner ? "; " : ", ",
				isComplex ? (isTextOnly ? ` /or/ ` : ` <i>or</i> `) : " or ",
			);
			const ptHigher = styleHint === "classic" ? " or higher" : "+";
			return `${joined}${allValuesEqual != null ? ` ${allValuesEqual}${ptHigher}` : ""}`;
		}

		static _getHtml_proficiency ({v, isListMode, keyOptions, isTextOnly, styleHint}) {
			const parts = v.map(obj => {
				return Object.entries(obj).map(([profType, prof]) => {
					switch (profType) {
						case "armor": {
							if (prof === "shield") {
								if (isListMode) return styleHint === "classic" ? `Prof ${prof}` : `${prof.toTitleCase()} Trai.`;
								return styleHint === "classic" ? `Proficiency with ${prof}s` : `${prof.toTitleCase()} Training`;
							}

							if (isListMode) return styleHint === "classic" ? `Prof ${Parser.armorFullToAbv(prof)} armor` : `${Parser.armorFullToAbv(prof).toTitleCase()} Armor Trai.`;
							return styleHint === "classic" ? `Proficiency with ${prof} armor` : `${prof.toTitleCase()} Armor Training`;
						}
						case "weapon": {
							return isListMode ? `Prof ${Parser.weaponFullToAbv(prof)} weapon` : `Proficiency with a ${prof} weapon`;
						}
						case "weaponGroup": {
							return isListMode ? `Prof ${Parser.weaponFullToAbv(prof)} weapons` : `${prof.toTitleCase()} Weapon Proficiency`;
						}
						default: throw new Error(`Unhandled proficiency type: "${profType}"`);
					}
				});
			});
			return isListMode ? parts.join("/") : parts.joinConjunct(", ", " or ");
		}

		static _getHtml_expertise ({v, isListMode, keyOptions, isTextOnly, styleHint}) {
			const parts = v.map(obj => {
				return Object.entries(obj).map(([profType, prof]) => {
					switch (profType) {
						case "skill": {
							if (prof === true) return isListMode ? `Skill Expertise` : `Expertise in a skill`;
							// TODO(Future) speculative; consider revising
							return isListMode ? `${prof.toTitleCase()} Expertise` : `Expertise in ${prof.toTitleCase()}`;
						}
						default: throw new Error(`Unhandled expertise type: "${profType}"`);
					}
				});
			});
			return isListMode ? parts.join("/") : parts.joinConjunct(", ", " or ");
		}

		static _getHtml_spellcasting ({v, isListMode}) {
			return isListMode ? "Spellcasting" : "The ability to cast at least one spell";
		}

		static _getHtml_spellcasting2020 ({v, isListMode, keyOptions, isTextOnly, styleHint}) {
			if (isListMode) return "Spellcasting";
			return styleHint === "classic" ? "Spellcasting or Pact Magic feature" : "Spellcasting or Pact Magic Feature";
		}

		static _getHtml_spellcastingFeature ({v, isListMode}) {
			return isListMode ? "Spellcasting" : "Spellcasting Feature";
		}

		static _getHtml_spellcastingPrepared ({v, isListMode}) {
			return isListMode ? "Spellcasting" : "Spellcasting feature from a class that prepares spells";
		}

		static _SCF_TYPE_TO_NAME = {
			"arcane": "Arcane Focus",
			"druid": "Druidic Focus",
			"holy": "Holy Symbol",
			"artisansTool": "Artisan’s Tools",
		};
		static _getHtml_spellcastingFocus ({v, isListMode, keyOptions, isTextOnly, styleHint}) {
			if (isListMode) {
				if (v === true) return `Spellcasting Focus`;
				return v.map(n => this._SCF_TYPE_TO_NAME[n] || `Spellcasting ${n.toTitleCase()}`).join("/");
			}

			const ptScfSuffix = styleHint === "classic" ? "spellcasting focus" : "{@variantrule Spellcasting Focus|XPHB}";
			if (v === true) {
				const ent = `Ability to use a ${ptScfSuffix}`;
				return isTextOnly ? Renderer.stripTags(ent) : Renderer.get().render(ent);
			}

			const ptScf = v
				.map((scf, i) => {
					if (!i) {
						const a = Parser.getArticle(this._SCF_TYPE_TO_NAME[scf] || scf);
						if (!this._SCF_TYPE_TO_NAME[scf]) return `${a} ${scf}`;
						return `${a} {@item ${this._SCF_TYPE_TO_NAME[scf]}${styleHint === "classic" ? "" : "|XPHB"}}`;
					}

					if (!this._SCF_TYPE_TO_NAME[scf]) return scf;
					return `{@item ${this._SCF_TYPE_TO_NAME[scf]}${styleHint === "classic" ? "" : "|XPHB"}}`;
				})
				.joinConjunct(", ", " or ");

			const ent = `Ability to use ${ptScf} as a ${ptScfSuffix}`;

			return (isTextOnly ? Renderer.stripTags : Renderer.get().render.bind(Renderer.get()))(ent);
		}

		static _getHtml_psionics ({v, isListMode, keyOptions, isTextOnly}) {
			return isListMode
				? "Psionics"
				: (isTextOnly ? Renderer.stripTags : Renderer.get().render.bind(Renderer.get()))("Psionic Talent feature or Wild Talent feat");
		}

		static _getHtml_alignment ({v, isListMode}) {
			return isListMode
				? Parser.alignmentListToFull(v)
					.replace(/\bany\b/gi, "").trim()
					.replace(/\balignment\b/gi, "align").trim()
					.toTitleCase()
				: Parser.alignmentListToFull(v);
		}

		static _getHtml_campaign ({v, isListMode}) {
			return isListMode
				? v.join("/")
				: `${v.joinConjunct(", ", " or ")} Campaign`;
		}

		static _getHtml_culture ({v, isListMode}) {
			return isListMode
				? v.join("/")
				: `${v.joinConjunct(", ", " or ")} Culture`;
		}

		static _getHtml_membership ({v, isListMode}) {
			return isListMode
				? v.join("/")
				: `Membership in the ${v.joinConjunct(", ", " or ")}`;
		}

		static _getHtml_group ({v, isListMode}) {
			return isListMode
				? v.map(it => it.toTitleCase()).join("/")
				: `${v.map(it => it.toTitleCase()).joinConjunct(", ", " or ")} Group`;
		}
	};

	static getRepeatableEntry (ent) {
		if (!ent.repeatable) return null;
		return `{@b Repeatable:} ${ent.repeatableNote || (ent.repeatable ? "Yes" : "No")}`;
	}

	static getRepeatableHtml (ent, {isListMode = false} = {}) {
		if (ent.repeatableHidden) return "";
		const entryRepeatable = Renderer.utils.getRepeatableEntry(ent);
		if (entryRepeatable == null) return isListMode ? "\u2014" : "";
		return Renderer.get().render(entryRepeatable);
	}

	static getRenderedSize (size) {
		return [...(size ? [size].flat() : [])]
			.sort(SortUtil.ascSortSize)
			.map(sz => Parser.sizeAbvToFull(sz))
			.joinConjunct(", ", " or ");
	}

	static _FN_TAG_SENSES = null;
	static _SENSE_TAG_METAS = null;
	static getSensesEntry (senses, {isTitleCase = false} = {}) {
		if (typeof senses === "string") senses = [senses]; // handle legacy format

		if (!Renderer.utils._FN_TAG_SENSES) {
			Renderer.utils._SENSE_TAG_METAS = [
				...MiscUtil.copyFast(Parser.getSenses()),
				...(PrereleaseUtil.getBrewProcessedFromCache("sense") || []),
				...(BrewUtil2.getBrewProcessedFromCache("sense") || []),
			];
			const seenNames = new Set();
			Renderer.utils._SENSE_TAG_METAS
				.filter(it => {
					if (seenNames.has(it.name.toLowerCase())) return false;
					seenNames.add(it.name.toLowerCase());
					return true;
				})
				.forEach(it => it._re = new RegExp(`\\b(?<sense>${it.name.escapeRegexp()})\\b`, "gi"));
			Renderer.utils._FN_TAG_SENSES = str => {
				Renderer.utils._SENSE_TAG_METAS
					.forEach(({name, source, _re}) => str = str.replace(_re, (...m) => `{@sense ${m.last().sense[isTitleCase ? "toTitleCase" : "toString"]()}|${source}}`));
				return str;
			};
		}

		return senses
			.map(str => {
				const tagSplit = Renderer.splitByTags(str);
				str = "";
				const len = tagSplit.length;
				for (let i = 0; i < len; ++i) {
					const s = tagSplit[i];

					if (!s) continue;

					if (s.startsWith("{@")) {
						str += s;
						continue;
					}

					str += Renderer.utils._FN_TAG_SENSES(s);
				}
				return str;
			})
			.join(", ")
			.replace(/(^| |\()(blind|blinded)(\)| |$)/gi, (...m) => `${m[1]}{@condition ${isTitleCase ? "Blinded" : "blinded"}||${m[2]}}${m[3]}`);
	}

	static getRenderedSenses (senses, {isPlainText = false, isTitleCase = false} = {}) {
		const sensesEntry = Renderer.utils.getSensesEntry(senses, {isTitleCase});
		if (isPlainText) return Renderer.stripTags(sensesEntry);
		return Renderer.get().render(sensesEntry);
	}

	static getEntryMediaUrl (entry, prop, mediaDir, {isUrlEncode = false} = {}) {
		if (!entry[prop]) return "";

		let href = "";
		if (entry[prop].type === "internal") {
			href = UrlUtil.link(Renderer.get().getMediaUrl(mediaDir, isUrlEncode ? encodeURI(entry[prop].path) : entry[prop].path));
		} else if (entry[prop].type === "external") {
			const isPreEncoded = decodeURI(entry[prop].url) !== entry[prop].url;
			href = (isPreEncoded || !isUrlEncode)
				? entry[prop].url
				: encodeURI(entry[prop].url);
		}
		return href;
	}

	static getTagEntry (tag, text) {
		switch (tag) {
			case "@dice":
			case "@autodice":
			case "@damage":
			case "@hit":
			case "@initiative":
			case "@d20":
			case "@chance":
			case "@recharge": {
				const fauxEntry = {
					type: "dice",
					rollable: true,
				};
				const [rollText, displayText, name, ...others] = Renderer.splitTagByPipe(text);
				if (displayText) fauxEntry.displayText = displayText;

				if ((!fauxEntry.displayText && (rollText || "").includes("summonSpellLevel")) || (fauxEntry.displayText && fauxEntry.displayText.includes("summonSpellLevel"))) fauxEntry.displayText = (fauxEntry.displayText || rollText || "").replace(/summonSpellLevel/g, "the spell's level");

				if ((!fauxEntry.displayText && (rollText || "").includes("summonClassLevel")) || (fauxEntry.displayText && fauxEntry.displayText.includes("summonClassLevel"))) fauxEntry.displayText = (fauxEntry.displayText || rollText || "").replace(/summonClassLevel/g, "your class level");

				if (name) fauxEntry.name = name;

				switch (tag) {
					case "@dice":
					case "@autodice":
					case "@damage": {
						// format: {@dice 1d2 + 3 + 4d5 - 6}
						fauxEntry.toRoll = rollText;

						if (!fauxEntry.displayText && (rollText || "").includes(";")) fauxEntry.displayText = rollText.replace(/;/g, "/");
						if ((!fauxEntry.displayText && (rollText || "").includes("#$")) || (fauxEntry.displayText && fauxEntry.displayText.includes("#$"))) fauxEntry.displayText = (fauxEntry.displayText || rollText).replace(/#\$prompt_number[^$]*\$#/g, "(𝑛)");
						fauxEntry.displayText = fauxEntry.displayText || fauxEntry.toRoll;

						if (tag === "@damage") {
							fauxEntry.subType = "damage";
							const [damageType] = others;
							if (damageType) fauxEntry.damageType = damageType;
						}

						if (tag === "@autodice") fauxEntry.autoRoll = true;

						return fauxEntry;
					}
					case "@d20":
					case "@hit": // format: {@hit +1} or {@hit -2}
					case "@initiative": {
						let mod;
						if (!isNaN(rollText)) {
							const n = Number(rollText);
							mod = `${n >= 0 ? "+" : ""}${n}`;
						} else mod = /^\s+[-+]/.test(rollText) ? rollText : `+${rollText}`;
						fauxEntry.displayText = fauxEntry.displayText || mod;
						fauxEntry.toRoll = `1d20${mod}`;
						fauxEntry.subType = "d20";
						fauxEntry.d20mod = mod;
						if (tag === "@hit") fauxEntry.context = {type: "hit"};
						if (tag === "@initiative") {
							fauxEntry.name = "Initiative";
							fauxEntry.context = {type: "initiative"};
						}
						return fauxEntry;
					}
					case "@chance": {
						// format: {@chance 25|display text|rollbox rollee name|success text|failure text}
						const [textSuccess, textFailure] = others;
						fauxEntry.toRoll = `1d100`;
						fauxEntry.successThresh = Number(rollText);
						fauxEntry.chanceSuccessText = textSuccess;
						fauxEntry.chanceFailureText = textFailure;
						return fauxEntry;
					}
					case "@recharge": {
						// format: {@recharge 4|flags}
						const flags = displayText ? displayText.split("") : null; // "m" for "minimal" = no brackets
						fauxEntry.toRoll = "1d6";
						const asNum = Number(rollText || 6);
						fauxEntry.successThresh = 7 - asNum;
						fauxEntry.successMax = 6;
						fauxEntry.displayText = `${asNum}${asNum < 6 ? `\u20136` : ""}`;
						fauxEntry.chanceSuccessText = "Recharged!";
						fauxEntry.chanceFailureText = "Did not recharge";
						fauxEntry.isColorSuccessFail = true;
						return fauxEntry;
					}
				}

				return fauxEntry;
			}

			case "@ability": // format: {@ability str 20} or {@ability str 20|Display Text} or {@ability str 20|Display Text|Roll Name Text}
			case "@savingThrow": { // format: {@savingThrow str 5} or {@savingThrow str 5|Display Text} or {@savingThrow str 5|Display Text|Roll Name Text}
				const fauxEntry = {
					type: "dice",
					rollable: true,
					subType: "d20",
					context: {type: tag === "@ability" ? "abilityCheck" : "savingThrow"},
				};

				const [abilAndScoreOrScore, displayText, name, ...others] = Renderer.splitTagByPipe(text);

				let [abil, ...rawScoreOrModParts] = abilAndScoreOrScore.split(" ").map(it => it.trim()).filter(Boolean);
				abil = abil.toLowerCase();

				fauxEntry.context.ability = abil;

				if (name) fauxEntry.name = name;
				else {
					if (tag === "@ability") fauxEntry.name = Parser.attAbvToFull(abil);
					else if (tag === "@savingThrow") fauxEntry.name = `${Parser.attAbvToFull(abil)} save`;
				}

				const rawScoreOrMod = rawScoreOrModParts.join(" ");
				// Saving throws can have e.g. `+ PB`
				if (isNaN(rawScoreOrMod) && tag === "@savingThrow") {
					if (displayText) fauxEntry.displayText = displayText;
					else fauxEntry.displayText = rawScoreOrMod;

					fauxEntry.toRoll = `1d20${rawScoreOrMod}`;
					fauxEntry.d20mod = rawScoreOrMod;
				} else {
					const scoreOrMod = Number(rawScoreOrMod) || 0;
					const mod = (tag === "@ability" ? Parser.getAbilityModifier : UiUtil.intToBonus)(scoreOrMod);

					if (displayText) fauxEntry.displayText = displayText;
					else {
						if (tag === "@ability") fauxEntry.displayText = `${scoreOrMod}\u00A0(${mod})`;
						else fauxEntry.displayText = mod;
					}

					fauxEntry.toRoll = `1d20${mod}`;
					fauxEntry.d20mod = mod;
				}

				return fauxEntry;
			}

			// format: {@skillCheck animal_handling 5} or {@skillCheck animal_handling 5|Display Text}
			//   or {@skillCheck animal_handling 5|Display Text|Roll Name Text}
			case "@skillCheck": {
				const fauxEntry = {
					type: "dice",
					rollable: true,
					subType: "d20",
					context: {type: "skillCheck"},
				};

				const [skillAndMod, displayText, name, ...others] = Renderer.splitTagByPipe(text);

				const parts = skillAndMod.split(" ").map(it => it.trim()).filter(Boolean);
				const namePart = parts.shift();
				const bonusPart = parts.join(" ");
				const skill = namePart.replace(/_/g, " ");

				let mod = bonusPart;
				if (!isNaN(bonusPart)) mod = UiUtil.intToBonus(Number(bonusPart) || 0);
				else if (bonusPart.startsWith("#$")) mod = `+${bonusPart}`;

				fauxEntry.context.skill = skill;
				fauxEntry.displayText = displayText || mod;

				if (name) fauxEntry.name = name;
				else fauxEntry.name = skill.toTitleCase();

				fauxEntry.toRoll = `1d20${mod}`;
				fauxEntry.d20mod = mod;

				return fauxEntry;
			}

			// format: {@coinflip} or {@coinflip display text|rollbox rollee name|success text|failure text}
			case "@coinflip": {
				const [displayText, name, textSuccess, textFailure] = Renderer.splitTagByPipe(text);

				const fauxEntry = {
					type: "dice",
					toRoll: "1d2",
					successThresh: 1,
					successMax: 2,
					displayText: displayText || "flip a coin",
					chanceSuccessText: textSuccess || `Heads`,
					chanceFailureText: textFailure || `Tails`,
					isColorSuccessFail: !textSuccess && !textFailure,
					rollable: true,
				};

				return fauxEntry;
			}

			default: throw new Error(`Unhandled tag "${tag}"`);
		}
	}

	static getTagMeta (tag, text) {
		switch (tag) {
			case "@deity": {
				let [name, pantheon, source, displayText, ...others] = Renderer.splitTagByPipe(text);
				pantheon = pantheon || "forgotten realms";
				source = source || Parser.getTagSource(tag, source);
				const hash = UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_DEITIES]({name, pantheon, source});

				return {
					name,
					displayText,
					others,

					page: UrlUtil.PG_DEITIES,
					source,
					hash,

					hashPreEncoded: true,
				};
			}

			case "@card": {
				const unpacked = DataUtil.deck.unpackUidCard(text);
				const {name, set, source, displayText} = unpacked;
				const hash = UrlUtil.URL_TO_HASH_BUILDER["card"]({name, set, source});

				return {
					name,
					displayText,

					isFauxPage: true,
					page: "card",
					source,
					hash,
					hashPreEncoded: true,
				};
			}

			case "@subclass": {
				const unpacked = DataUtil.subclass.unpackUid(text);

				const classPageHash = `${UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_CLASSES]({name: unpacked.className, source: unpacked.classSource})}${HASH_PART_SEP}${UrlUtil.getClassesPageStatePart({subclass: unpacked})}`;

				return {
					name: unpacked.name,
					displayText: unpacked.displayText,

					page: UrlUtil.PG_CLASSES,
					source: unpacked.source,
					hash: classPageHash,
					hashPreEncoded: true,
				};
			}

			case "@classFeature": {
				const unpacked = DataUtil.class.unpackUidClassFeature(text);

				const classPageHash = `${UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_CLASSES]({name: unpacked.className, source: unpacked.classSource})}${HASH_PART_SEP}${UrlUtil.getClassesPageStatePart({feature: {ixLevel: unpacked.level - 1, ixFeature: 0}})}`;

				return {
					name: unpacked.name,
					displayText: unpacked.displayText,

					page: UrlUtil.PG_CLASSES,
					source: unpacked.source,
					hash: classPageHash,
					hashPreEncoded: true,

					pageHover: "classfeature",
					hashHover: UrlUtil.URL_TO_HASH_BUILDER["classFeature"](unpacked),
					hashPreEncodedHover: true,
				};
			}

			case "@subclassFeature": {
				const unpacked = DataUtil.class.unpackUidSubclassFeature(text);

				const classPageHash = `${UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_CLASSES]({name: unpacked.className, source: unpacked.classSource})}${HASH_PART_SEP}${UrlUtil.getClassesPageStatePart({feature: {ixLevel: unpacked.level - 1, ixFeature: 0}, subclass: {shortName: unpacked.subclassShortName, source: unpacked.subclassSource}})}`;

				return {
					name: unpacked.name,
					displayText: unpacked.displayText,

					page: UrlUtil.PG_CLASSES,
					source: unpacked.source,
					hash: classPageHash,
					hashPreEncoded: true,

					pageHover: "subclassfeature",
					hashHover: UrlUtil.URL_TO_HASH_BUILDER["subclassFeature"](unpacked),
					hashPreEncodedHover: true,
				};
			}

			case "@quickref": {
				const unpacked = DataUtil.quickreference.unpackUid(text);

				const hash = UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_QUICKREF](unpacked);

				return {
					name: unpacked.name,
					displayText: unpacked.displayText,

					page: UrlUtil.PG_QUICKREF,
					source: unpacked.source,
					hash,
					hashPreEncoded: true,
				};
			}

			default: return Renderer.utils._getTagMeta_generic(tag, text);
		}
	}

	static _getTagMeta_generic (tag, text) {
		const {name, source, displayText, others, isAllowRedirect} = DataUtil.generic.unpackUid(text, tag);
		const hash = UrlUtil.encodeForHash([name, source]);

		const out = {
			name,
			displayText,
			others,

			page: null,
			source,
			hash,

			preloadId: null,
			subhashes: null,
			linkText: null,

			hashPreEncoded: true,

			isAllowRedirect,
		};

		switch (tag) {
			case "@spell": out.page = UrlUtil.PG_SPELLS; break;
			case "@item": out.page = UrlUtil.PG_ITEMS; break;
			case "@condition":
			case "@disease":
			case "@status": out.page = UrlUtil.PG_CONDITIONS_DISEASES; break;
			case "@background": out.page = UrlUtil.PG_BACKGROUNDS; break;
			case "@race": out.page = UrlUtil.PG_RACES; break;
			case "@optfeature": out.page = UrlUtil.PG_OPT_FEATURES; break;
			case "@reward": out.page = UrlUtil.PG_REWARDS; break;
			case "@feat": out.page = UrlUtil.PG_FEATS; break;
			case "@psionic": out.page = UrlUtil.PG_PSIONICS; break;
			case "@object": out.page = UrlUtil.PG_OBJECTS; break;
			case "@boon":
			case "@cult": out.page = UrlUtil.PG_CULTS_BOONS; break;
			case "@trap":
			case "@hazard": out.page = UrlUtil.PG_TRAPS_HAZARDS; break;
			case "@variantrule": out.page = UrlUtil.PG_VARIANTRULES; break;
			case "@table": out.page = UrlUtil.PG_TABLES; break;
			case "@vehicle":
			case "@vehupgrade": out.page = UrlUtil.PG_VEHICLES; break;
			case "@action": out.page = UrlUtil.PG_ACTIONS; break;
			case "@language": out.page = UrlUtil.PG_LANGUAGES; break;
			case "@charoption": out.page = UrlUtil.PG_CHAR_CREATION_OPTIONS; break;
			case "@recipe": out.page = UrlUtil.PG_RECIPES; break;
			case "@deck": out.page = UrlUtil.PG_DECKS; break;
			case "@facility": out.page = UrlUtil.PG_BASTIONS; break;

			case "@legroup": {
				out.page = "legendaryGroup";
				out.isFauxPage = true;
				break;
			}

			case "@creature": {
				out.page = UrlUtil.PG_BESTIARY;

				// "...|scaled=scaledCr}" or "...|scaledsummon=scaledSummonLevel}"
				if (others.length) {
					const [type, value] = others[0].split("=").map(it => it.trim().toLowerCase()).filter(Boolean);
					if (type && value) {
						switch (type) {
							case VeCt.HASH_SCALED: {
								const targetCrNum = Parser.crToNumber(value);
								out.preloadId = Renderer.monster.getCustomHashId({name, source, _isScaledCr: true, _scaledCr: targetCrNum});
								out.subhashes = [
									{key: VeCt.HASH_SCALED, value: targetCrNum},
								];
								out.linkText = displayText || `${name} (CR ${value})`;
								break;
							}

							case VeCt.HASH_SCALED_SPELL_SUMMON: {
								const scaledSpellNum = Number(value);
								out.preloadId = Renderer.monster.getCustomHashId({name, source, _isScaledSpellSummon: true, _scaledSpellSummonLevel: scaledSpellNum});
								out.subhashes = [
									{key: VeCt.HASH_SCALED_SPELL_SUMMON, value: scaledSpellNum},
								];
								out.linkText = displayText || `${name} (Spell Level ${value})`;
								break;
							}

							case VeCt.HASH_SCALED_CLASS_SUMMON: {
								const scaledClassNum = Number(value);
								out.preloadId = Renderer.monster.getCustomHashId({name, source, _isScaledClassSummon: true, _scaledClassSummonLevel: scaledClassNum});
								out.subhashes = [
									{key: VeCt.HASH_SCALED_CLASS_SUMMON, value: scaledClassNum},
								];
								out.linkText = displayText || `${name} (Class Level ${value})`;
								break;
							}
						}
					}
				}

				break;
			}

			case "@class": {
				out.page = UrlUtil.PG_CLASSES;

				if (others.length) {
					const [subclassShortName, subclassSource, featurePart] = others;

					const classStateOpts = {
						subclass: {
							shortName: subclassShortName.trim(),
							source: subclassSource
								? subclassSource.trim()
								: out.source,
						},
					};

					out.sourceHover = classStateOpts.subclass.source;

					// Don't include the feature part for hovers, as it is unsupported
					const hoverSubhashObj = UrlUtil.unpackSubHash(UrlUtil.getClassesPageStatePart(classStateOpts));
					out.subhashesHover = [{key: "state", value: hoverSubhashObj.state, preEncoded: true}];

					if (featurePart) {
						const featureParts = featurePart.trim().split("-");
						classStateOpts.feature = {
							ixLevel: featureParts[0] || "0",
							ixFeature: featureParts[1] || "0",
						};
					}

					const subhashObj = UrlUtil.unpackSubHash(UrlUtil.getClassesPageStatePart(classStateOpts));

					out.subhashes = [
						{key: "state", value: subhashObj.state.join(HASH_SUB_LIST_SEP), preEncoded: true},
						{key: "fltsource", value: "clear"},
						{key: "flstmiscellaneous", value: "clear"},
					];
				}

				break;
			}

			case "@skill": { out.isFauxPage = true; out.page = "skill"; break; }
			case "@sense": { out.isFauxPage = true; out.page = "sense"; break; }
			case "@itemProperty": { out.isFauxPage = true; out.page = "itemProperty"; break; }
			case "@itemMastery": { out.isFauxPage = true; out.page = "itemMastery"; break; }
			case "@cite": { out.isFauxPage = true; out.page = "citation"; break; }

			// TODO(Future) revise/expand
			case "@creatureFluff": { out.isFauxPage = true; out.page = "monsterFluff"; break; }
			case "@raceFluff": { out.isFauxPage = true; out.page = "raceFluff"; break; }

			default: throw new Error(`Unhandled tag "${tag}"`);
		}

		return out;
	}

	// region Templating
	static applyTemplate (ent, templateString, {fnPreApply, mapCustom, mapCustomFns} = {}) {
		return templateString.replace(/{{([^}]+)}}/g, (fullMatch, strArgs) => {
			if (fnPreApply) fnPreApply(fullMatch, strArgs);

			if (mapCustom?.[strArgs]) return mapCustom[strArgs];
			if (mapCustomFns?.[strArgs]) return mapCustomFns[strArgs]();

			const args = strArgs.split(" ").map(arg => arg.trim()).filter(Boolean);

			// Args can either be a static property, or a function and a static property

			if (args.length === 1) {
				return Renderer.utils._applyTemplate_getValue(ent, args[0]);
			} else if (args.length === 2) {
				const val = Renderer.utils._applyTemplate_getValue(ent, args[1]);
				switch (args[0]) {
					case "getFullImmRes": return Parser.getFullImmRes(val, {isTitleCase: VetoolsConfig.get("styleSwitcher", "style") === "one"});
					default: throw new Error(`Unknown template function "${args[0]}"`);
				}
			} else throw new Error(`Unhandled number of arguments ${args.length}`);
		});
	}

	static _applyTemplate_getValue (ent, prop) {
		const spl = prop.split(".");
		switch (spl[0]) {
			case "item": {
				const path = spl.slice(1);
				if (!path.length) return `{@i missing key path}`;
				return MiscUtil.get(ent, ...path);
			}
			default: return `{@i unknown template root: "${spl[0]}"}`;
		}
	}
	// endregion

	/**
	 * Convert a nested entry structure into a flat list of entry metadata with depth info.
	 **/
	static getFlatEntries (entry) {
		const out = [];
		const depthStack = [];

		const recurse = ({obj}) => {
			let isPopDepth = false;

			Renderer.ENTRIES_WITH_ENUMERATED_TITLES
				.forEach(meta => {
					if (obj.type !== meta.type) return;

					const kName = "name"; // Note: allow this to be specified on the `meta` if needed in future
					if (obj[kName] == null) return;

					isPopDepth = true;

					const curDepth = depthStack.length ? depthStack.last() : 0;
					const nxtDepth = meta.depth ? meta.depth : meta.depthIncrement ? curDepth + meta.depthIncrement : curDepth;

					depthStack.push(
						Math.min(
							nxtDepth,
							2,
						),
					);

					const cpyObj = MiscUtil.copyFast(obj);

					out.push({
						depth: curDepth,
						entry: cpyObj,
						key: meta.key,
						ix: out.length,
						name: cpyObj.name,
					});

					cpyObj[meta.key] = cpyObj[meta.key].map(child => {
						if (!child.type) return child;
						const childMeta = Renderer.ENTRIES_WITH_ENUMERATED_TITLES_LOOKUP[child.type];
						if (!childMeta) return child;

						const kNameChild = "name"; // Note: allow this to be specified on the `meta` if needed in future
						if (child[kName] == null) return child;

						// Predict what index the child will have in the output array
						const ixNextRef = out.length;

						// Allow the child to add its entries to the output array
						recurse({obj: child});

						// Return a reference pointing forwards to the child's flat data
						return {IX_FLAT_REF: ixNextRef};
					});
				});

			if (isPopDepth) depthStack.pop();
		};

		recurse({obj: entry});

		return out;
	}

	static getLinkSubhashString (subhashes) {
		let out = "";
		const len = subhashes.length;
		for (let i = 0; i < len; ++i) {
			const subHash = subhashes[i];
			if (subHash.preEncoded) out += `${HASH_PART_SEP}${subHash.key}${HASH_SUB_KV_SEP}`;
			else out += `${HASH_PART_SEP}${UrlUtil.encodeForHash(subHash.key)}${HASH_SUB_KV_SEP}`;
			if (subHash.value != null) {
				if (subHash.preEncoded) out += subHash.value;
				else out += UrlUtil.encodeForHash(subHash.value);
			} else {
				// TODO allow list of values
				out += subHash.values.map(v => UrlUtil.encodeForHash(v)).join(HASH_SUB_LIST_SEP);
			}
		}
		return out;
	}

	static initFullEntries_ (ent, {propEntries = "entries", propFullEntries = "_fullEntries"} = {}) {
		ent[propFullEntries] = ent[propFullEntries] || (ent[propEntries] ? MiscUtil.copyFast(ent[propEntries]) : []);
	}

	static lazy = {
		_getIntersectionConfig () {
			return {
				rootMargin: "150px 0px", // if the element gets within 150px of the viewport
				threshold: 0.01,
			};
		},

		_OBSERVERS: {},
		getCreateObserver ({observerId, fnOnObserve}) {
			if (!Renderer.utils.lazy._OBSERVERS[observerId]) {
				const observer = Renderer.utils.lazy._OBSERVERS[observerId] = new IntersectionObserver(
					Renderer.utils.lazy.getFnOnIntersect({
						observerId,
						fnOnObserve,
					}),
					Renderer.utils.lazy._getIntersectionConfig(),
				);

				observer._TRACKED = new Set();

				observer.track = it => {
					observer._TRACKED.add(it);
					return observer.observe(it);
				};

				observer.untrack = it => {
					observer._TRACKED.delete(it);
					return observer.unobserve(it);
				};

				// If we try to print a page with e.g. un-loaded images, attempt to load them all first
				observer.getPrintPromises = () => {
					if (!observer._TRACKED.size) return [];

					return [...observer._TRACKED]
						.map(it => {
							observer.untrack(it);
							return fnOnObserve({
								observer,
								entry: {
									target: it,
								},
							});
						});
				};
			}

			Renderer.utils.lazy._initPrintListener();

			return Renderer.utils.lazy._OBSERVERS[observerId];
		},

		destroyObserver ({observerId}) {
			const observer = Renderer.utils.lazy._OBSERVERS[observerId];
			if (!observer) return;

			observer.disconnect();
			delete Renderer.utils.lazy._OBSERVERS[observerId];
		},

		getFnOnIntersect ({observerId, fnOnObserve}) {
			return obsEntries => {
				const observer = Renderer.utils.lazy._OBSERVERS[observerId];

				obsEntries.forEach(entry => {
					// filter observed entries for those that intersect
					if (entry.intersectionRatio <= 0) return;

					observer.untrack(entry.target);
					fnOnObserve({
						observer,
						entry,
					});
				});
			};
		},

		/* -------------------------------------------- */

		_printListener: null,

		_initPrintListener () {
			if (Renderer.utils.lazy._printListener) return;

			Renderer.utils.lazy._printListener = () => {
				const promises = Object.values(Renderer.utils.lazy._OBSERVERS)
					.flatMap(observer => observer.getPrintPromises());

				if (!promises.length) return;

				// region Sadly we cannot cancel or delay the print event, so, show a blocking alert
				alert(`All content must be loaded prior to printing. Please cancel the print and wait a few moments for loading to complete!`);

				Promise.all(promises)
					.then(() => {
						JqueryUtil.doToast("Content loading complete!");
					});
				// endregion
			};

			window.addEventListener("beforeprint", Renderer.utils.lazy._printListener);
		},

		/* -------------------------------------------- */

		ATTR_IMG_FINAL_SRC: "data-src",
		COLOR_PLACEHOLDER: "#ccc3",

		mutFinalizeEle (ele) {
			const srcFinal = ele.getAttribute(Renderer.utils.lazy.ATTR_IMG_FINAL_SRC);
			if (!srcFinal) return;

			if (ele.tagName === "IMG") {
				ele.removeAttribute(Renderer.utils.lazy.ATTR_IMG_FINAL_SRC);
				ele.setAttribute("src", srcFinal);
				return;
			}

			if (ele.tagName === "CANVAS") {
				const ctx = ele.getContext("2d");

				const image = new Image();
				const pLoad = new Promise((resolve, reject) => {
					image.onload = () => resolve(image);
					image.onerror = err => reject(err);
				});
				image.src = ele.getAttribute(Renderer.utils.lazy.ATTR_IMG_FINAL_SRC);

				pLoad
					.then(() => ctx.drawImage(image, 0, 0, ele.width, ele.height));

				return;
			}

			throw new Error(`Unhandled element type "${ele.tagName}"!`);
		},

		/* -------------------------------------------- */

		handleLoad_imgMinimizeLayoutShift (ele) {
			Renderer.utils.lazy.mutFinalizeEle(ele);
		},
	};
};

Renderer.tag = class {
	static _TagBase = class {
		tagName;
		defaultSource = null;
		page = null;
		isStandalone = false;

		get tag () { return `@${this.tagName}`; }

		getStripped (tag, text) {
			text = DataUtil.generic.variableResolver.getHumanReadableString(text); // replace any variables
			return this._getStripped(tag, text);
		}

		/** @abstract */
		_getStripped (tag, text) { throw new Error("Unimplemented!"); }

		getMeta (tag, text) { return this._getMeta(tag, text); }
		_getMeta (tag, text) { throw new Error("Unimplemented!"); }
	};

	static _TagBaseAt = class extends this._TagBase {
		get tag () { return `@${this.tagName}`; }
	};

	static _TagBaseHash = class extends this._TagBase {
		get tag () { return `#${this.tagName}`; }
	};

	static _TagTextStyle = class extends this._TagBaseAt {
		_getStripped (tag, text) { return Renderer.splitTagByPipe(text)[0] || ""; }
	};

	static TagBoldShort = class extends this._TagTextStyle {
		tagName = "b";
	};

	static TagBoldLong = class extends this._TagTextStyle {
		tagName = "bold";
	};

	static TagItalicShort = class extends this._TagTextStyle {
		tagName = "i";
	};

	static TagItalicLong = class extends this._TagTextStyle {
		tagName = "italic";
	};

	static TagStrikethroughShort = class extends this._TagTextStyle {
		tagName = "s";
	};

	static TagStrikethroughLong = class extends this._TagTextStyle {
		tagName = "strike";
	};

	static TagStrikethroughDoubleShort = class extends this._TagTextStyle {
		tagName = "s2";
	};

	static TagStrikethroughDoubleLong = class extends this._TagTextStyle {
		tagName = "strikeDouble";
	};

	static TagUnderlineShort = class extends this._TagTextStyle {
		tagName = "u";
	};

	static TagUnderlineLong = class extends this._TagTextStyle {
		tagName = "underline";
	};

	static TagUnderlineDoubleShort = class extends this._TagTextStyle {
		tagName = "u2";
	};

	static TagUnderlineDoubleLong = class extends this._TagTextStyle {
		tagName = "underlineDouble";
	};

	static TagSup = class extends this._TagTextStyle {
		tagName = "sup";
	};

	static TagSub = class extends this._TagTextStyle {
		tagName = "sub";
	};

	static TagKbd = class extends this._TagTextStyle {
		tagName = "kbd";
	};

	static TagCode = class extends this._TagTextStyle {
		tagName = "code";
	};

	static TagStyle = class extends this._TagTextStyle {
		tagName = "style";
	};

	static TagFont = class extends this._TagTextStyle {
		tagName = "font";

		static getFontInfo (fontDecl) {
			if (!fontDecl) {
				return {
					fontId: null,
					fontUrl: null,
				};
			}

			const spl = fontDecl.split("/");

			if (spl.length === 1) {
				return {
					fontId: spl[0],
					fontUrl: null,
				};
			}

			const ptName = spl.at(-1);
			const fontIdFaux = ptName.split(".")[0];

			const fontUrl = /^https?:\/\//.test(fontDecl)
				? fontDecl
				: Renderer.get().getMediaUrl("fonts", fontDecl);

			return {
				fontId: fontIdFaux,
				fontUrl,
			};
		}
	};

	static TagComic = class extends this._TagTextStyle {
		tagName = "comic";
	};

	static TagComicH1 = class extends this._TagTextStyle {
		tagName = "comicH1";
	};

	static TagComicH2 = class extends this._TagTextStyle {
		tagName = "comicH2";
	};

	static TagComicH3 = class extends this._TagTextStyle {
		tagName = "comicH3";
	};

	static TagComicH4 = class extends this._TagTextStyle {
		tagName = "comicH4";
	};

	static TagComicNote = class extends this._TagTextStyle {
		tagName = "comicNote";
	};

	static TagNote = class extends this._TagTextStyle {
		tagName = "note";
	};

	static TagTip = class extends this._TagTextStyle {
		tagName = "tip";
	};

	static TagUnit = class extends this._TagBaseAt {
		tagName = "unit";

		_getStripped (tag, text) {
			const [amount, unitSingle, unitPlural] = Renderer.splitTagByPipe(text);
			return isNaN(amount) ? unitSingle : Number(amount) > 1 ? (unitPlural || unitSingle.toPlural()) : unitSingle;
		}
	};

	static TagActSave = class extends this._TagBaseAt {
		tagName = "actSave";

		_getStripped (tag, text) { return `${Parser.attAbvToFull(text)} Saving Throw:`; }
	};

	static TagActSaveSuccess = class extends this._TagBaseAt {
		tagName = "actSaveSuccess";
		isStandalone = true;

		_getStripped (tag, text) { return "Success:"; }
	};

	static TagActSaveFailure = class extends this._TagBaseAt {
		tagName = "actSaveFail";
		isStandalone = true;

		_getStripped (tag, text) {
			const [ordinal] = Renderer.splitTagByPipe(text);
			if (ordinal) return `${Parser.numberToText(ordinal, {isOrdinalForm: true}).toTitleCase()} Failure:`;
			return "Failure:";
		}
	};

	static TagActSaveFailureBy = class extends this._TagBaseAt {
		tagName = "actSaveFailBy";

		_getStripped (tag, text) {
			const [amount] = Renderer.splitTagByPipe(text);
			return `Failure by ${amount} or More:`;
		}
	};

	static TagActSaveSuccessOrFailure = class extends this._TagBaseAt {
		tagName = "actSaveSuccessOrFail";
		isStandalone = true;

		_getStripped (tag, text) { return "Failure or Success:"; }
	};

	static TagActTrigger = class extends this._TagBaseAt {
		tagName = "actTrigger";
		isStandalone = true;

		_getStripped (tag, text) { return "Trigger:"; }
	};

	static TagActResponse = class extends this._TagBaseAt {
		tagName = "actResponse";
		isStandalone = true;

		_getStripped (tag, text) { return `Response${text.includes("d") ? "\u2014" : ":"}`; }
	};

	static TagHitText = class extends this._TagBaseAt {
		tagName = "h";
		isStandalone = true;

		_getStripped (tag, text) { return "Hit: "; }
	};

	static TagMissText = class extends this._TagBaseAt {
		tagName = "m";
		isStandalone = true;

		_getStripped (tag, text) { return "Miss: "; }
	};

	static TagHitOrMissText = class extends this._TagBaseAt {
		tagName = "hom";
		isStandalone = true;

		_getStripped (tag, text) { return "Hit or Miss: "; } // I guess they never miss
	};

	static TagAtk = class extends this._TagBaseAt {
		tagName = "atk";

		_getStripped (tag, text) { return Renderer.attackTagToFull(text); }
	};

	static TagAtkr = class extends this._TagBaseAt {
		tagName = "atkr";

		_getStripped (tag, text) { return Renderer.attackTagToFull(text, {isRoll: true}); }
	};

	static TagHitYourSpellAttack = class extends this._TagBaseAt {
		tagName = "hitYourSpellAttack";
		isStandalone = true;

		_getStripped (tag, text) {
			const [displayText] = Renderer.splitTagByPipe(text);
			return displayText || "your spell attack modifier";
		}
	};

	static TagDc = class extends this._TagBaseAt {
		tagName = "dc";

		_getStripped (tag, text) {
			const [dcText, displayText] = Renderer.splitTagByPipe(text);
			return `DC ${displayText || dcText}`;
		}
	};

	static TagDcYourSpellSave = class extends this._TagBaseAt {
		tagName = "dcYourSpellSave";
		isStandalone = true;

		_getStripped (tag, text) {
			const [displayText] = Renderer.splitTagByPipe(text);
			return displayText || "your spell save DC";
		}
	};

	static _TagDiceFlavor = class extends this._TagBaseAt {
		_getStripped (tag, text) {
			const [rollText, displayText] = Renderer.splitTagByPipe(text);
			switch (tag) {
				case "@damage":
				case "@dice":
				case "@autodice": {
					return displayText || rollText.replace(/;/g, "/");
				}
				case "@d20":
				case "@hit":
				case "@initiative": {
					return displayText || (() => {
						const n = Number(rollText);
						if (!isNaN(n)) return `${n >= 0 ? "+" : ""}${n}`;
						return rollText;
					})();
				}
				case "@recharge": {
					const asNum = Number(rollText || 6);
					if (isNaN(asNum)) {
						throw new Error(`Could not parse "${rollText}" as a number!`);
					}
					return `(Recharge ${asNum}${asNum < 6 ? `\u20136` : ""})`;
				}
				case "@chance": {
					return displayText || `${rollText} percent`;
				}
				case "@ability": {
					const [, rawScore] = rollText.split(" ").map(it => it.trim().toLowerCase()).filter(Boolean);
					const score = Number(rawScore) || 0;
					return displayText || `${score} (${Parser.getAbilityModifier(score)})`;
				}
				case "@savingThrow":
				case "@skillCheck": {
					return displayText || rollText;
				}
			}
			throw new Error(`Unhandled tag: ${tag}`);
		}
	};

	static TagChance = class extends this._TagDiceFlavor {
		tagName = "chance";
	};

	static TagD20 = class extends this._TagDiceFlavor {
		tagName = "d20";
	};

	static TagDamage = class extends this._TagDiceFlavor {
		tagName = "damage";
	};

	static TagDice = class extends this._TagDiceFlavor {
		tagName = "dice";
	};

	static TagAutodice = class extends this._TagDiceFlavor {
		tagName = "autodice";
	};

	static TagHit = class extends this._TagDiceFlavor {
		tagName = "hit";
	};

	static TagInitiative = class extends this._TagDiceFlavor {
		tagName = "initiative";
	};

	static TagRecharge = class extends this._TagDiceFlavor {
		tagName = "recharge";
		isStandalone = true;
	};

	static TagAbility = class extends this._TagDiceFlavor {
		tagName = "ability";
	};

	static TagSavingThrow = class extends this._TagDiceFlavor {
		tagName = "savingThrow";
	};

	static TagSkillCheck = class extends this._TagDiceFlavor {
		tagName = "skillCheck";
	};

	static _TagDiceFlavorScaling = class extends this._TagBaseAt {
		_getStripped (tag, text) {
			const [, , addPerProgress, , displayText] = Renderer.splitTagByPipe(text);
			return displayText || addPerProgress;
		}
	};

	static TagScaledice = class extends this._TagDiceFlavorScaling {
		tagName = "scaledice";
	};

	static TagScaledamage = class extends this._TagDiceFlavorScaling {
		tagName = "scaledamage";
	};

	static TagCoinflip = class extends this._TagBaseAt {
		tagName = "coinflip";
		isStandalone = true;

		_getStripped (tag, text) {
			const [displayText] = Renderer.splitTagByPipe(text);
			return displayText || "flip a coin";
		}
	};

	static _TagPipedNoDisplayText = class extends this._TagBaseAt {
		_getStripped (tag, text) {
			const parts = Renderer.splitTagByPipe(text);
			return parts[0];
		}
	};

	static Tag5etools = class extends this._TagPipedNoDisplayText {
		tagName = "5etools";
	};

	static Tag5etoolsImg = class extends this._TagPipedNoDisplayText {
		tagName = "5etoolsImg";
	};

	static TagAdventure = class extends this._TagPipedNoDisplayText {
		tagName = "adventure";
	};

	static TagBook = class extends this._TagPipedNoDisplayText {
		tagName = "book";
	};

	static TagFilter = class extends this._TagPipedNoDisplayText {
		tagName = "filter";
	};

	static TagFootnote = class extends this._TagPipedNoDisplayText {
		tagName = "footnote";
	};

	static TagLink = class extends this._TagPipedNoDisplayText {
		tagName = "link";
	};

	static TagLoader = class extends this._TagPipedNoDisplayText {
		tagName = "loader";
	};

	static TagColor = class extends this._TagPipedNoDisplayText {
		tagName = "color";
	};

	static TagHighlight = class extends this._TagPipedNoDisplayText {
		tagName = "highlight";
	};

	static TagHelp = class extends this._TagPipedNoDisplayText {
		tagName = "help";
	};

	static _TagPipedDisplayTextThird = class extends this._TagBaseAt {
		_getStripped (tag, text) {
			const parts = Renderer.splitTagByPipe(text);
			return parts.length >= 3 ? parts[2] : parts[0];
		}
	};

	static TagAction = class extends this._TagPipedDisplayTextThird {
		tagName = "action";
		defaultSource = Parser.SRC_PHB;
		page = UrlUtil.PG_ACTIONS;
	};

	static TagBackground = class extends this._TagPipedDisplayTextThird {
		tagName = "background";
		defaultSource = Parser.SRC_PHB;
		page = UrlUtil.PG_BACKGROUNDS;
	};

	static TagBoon = class extends this._TagPipedDisplayTextThird {
		tagName = "boon";
		defaultSource = Parser.SRC_MTF;
		page = UrlUtil.PG_CULTS_BOONS;
	};

	static TagCharoption = class extends this._TagPipedDisplayTextThird {
		tagName = "charoption";
		defaultSource = Parser.SRC_MOT;
		page = UrlUtil.PG_CHAR_CREATION_OPTIONS;
	};

	static TagClass = class extends this._TagPipedDisplayTextThird {
		tagName = "class";
		defaultSource = Parser.SRC_PHB;
		page = UrlUtil.PG_CLASSES;
	};

	static TagCondition = class extends this._TagPipedDisplayTextThird {
		tagName = "condition";
		defaultSource = Parser.SRC_PHB;
		page = UrlUtil.PG_CONDITIONS_DISEASES;
	};

	static TagCreature = class extends this._TagPipedDisplayTextThird {
		tagName = "creature";
		defaultSource = Parser.SRC_MM;
		page = UrlUtil.PG_BESTIARY;
	};

	static TagCreatureFluff = class extends this._TagPipedDisplayTextThird {
		tagName = "creatureFluff";
		defaultSource = Parser.SRC_MM;
		page = "monsterFluff";
	};

	static TagCult = class extends this._TagPipedDisplayTextThird {
		tagName = "cult";
		defaultSource = Parser.SRC_MTF;
		page = UrlUtil.PG_CULTS_BOONS;
	};

	static TagDeck = class extends this._TagPipedDisplayTextThird {
		tagName = "deck";
		defaultSource = Parser.SRC_DMG;
		page = UrlUtil.PG_DECKS;
	};

	static TagDisease = class extends this._TagPipedDisplayTextThird {
		tagName = "disease";
		defaultSource = Parser.SRC_DMG;
		page = UrlUtil.PG_CONDITIONS_DISEASES;
	};

	static TagFacility = class extends this._TagPipedDisplayTextThird {
		tagName = "facility";
		defaultSource = Parser.SRC_XDMG;
		page = UrlUtil.PG_BASTIONS;
	};

	static TagFeat = class extends this._TagPipedDisplayTextThird {
		tagName = "feat";
		defaultSource = Parser.SRC_PHB;
		page = UrlUtil.PG_FEATS;
	};

	static TagHazard = class extends this._TagPipedDisplayTextThird {
		tagName = "hazard";
		defaultSource = Parser.SRC_DMG;
		page = UrlUtil.PG_TRAPS_HAZARDS;
	};

	static TagItem = class extends this._TagPipedDisplayTextThird {
		tagName = "item";
		defaultSource = Parser.SRC_DMG;
		page = UrlUtil.PG_ITEMS;
	};

	static TagItemProperty = class extends this._TagPipedDisplayTextThird {
		tagName = "itemProperty";
		defaultSource = Parser.SRC_PHB;
		page = "itemProperty";
	};

	static TagItemMastery = class extends this._TagPipedDisplayTextThird {
		tagName = "itemMastery";
		defaultSource = Parser.SRC_XPHB;
		page = "itemMastery";
	};

	static TagLanguage = class extends this._TagPipedDisplayTextThird {
		tagName = "language";
		defaultSource = Parser.SRC_PHB;
		page = UrlUtil.PG_LANGUAGES;
	};

	static TagLegroup = class extends this._TagPipedDisplayTextThird {
		tagName = "legroup";
		defaultSource = Parser.SRC_MM;
		page = "legendaryGroup";
	};

	static TagObject = class extends this._TagPipedDisplayTextThird {
		tagName = "object";
		defaultSource = Parser.SRC_DMG;
		page = UrlUtil.PG_OBJECTS;
	};

	static TagOptfeature = class extends this._TagPipedDisplayTextThird {
		tagName = "optfeature";
		defaultSource = Parser.SRC_PHB;
		page = UrlUtil.PG_OPT_FEATURES;
	};

	static TagPsionic = class extends this._TagPipedDisplayTextThird {
		tagName = "psionic";
		defaultSource = Parser.SRC_UATMC;
		page = UrlUtil.PG_PSIONICS;
	};

	static TagRace = class extends this._TagPipedDisplayTextThird {
		tagName = "race";
		defaultSource = Parser.SRC_PHB;
		page = UrlUtil.PG_RACES;
	};

	static TagRaceFluff = class extends this._TagPipedDisplayTextThird {
		tagName = "raceFluff";
		defaultSource = Parser.SRC_PHB;
		page = "raceFluff";
	};

	static TagRecipe = class extends this._TagPipedDisplayTextThird {
		tagName = "recipe";
		defaultSource = Parser.SRC_HF;
		page = UrlUtil.PG_RECIPES;
	};

	static TagReward = class extends this._TagPipedDisplayTextThird {
		tagName = "reward";
		defaultSource = Parser.SRC_DMG;
		page = UrlUtil.PG_REWARDS;
	};

	static TagVehicle = class extends this._TagPipedDisplayTextThird {
		tagName = "vehicle";
		defaultSource = Parser.SRC_GoS;
		page = UrlUtil.PG_VEHICLES;
	};

	static TagVehupgrade = class extends this._TagPipedDisplayTextThird {
		tagName = "vehupgrade";
		defaultSource = Parser.SRC_GoS;
		page = UrlUtil.PG_VEHICLES;
	};

	static TagSense = class extends this._TagPipedDisplayTextThird {
		tagName = "sense";
		defaultSource = Parser.SRC_PHB;
		page = "sense";
	};

	static TagSkill = class extends this._TagPipedDisplayTextThird {
		tagName = "skill";
		defaultSource = Parser.SRC_PHB;
		page = "skill";
	};

	static TagSpell = class extends this._TagPipedDisplayTextThird {
		tagName = "spell";
		defaultSource = Parser.SRC_PHB;
		page = UrlUtil.PG_SPELLS;
	};

	static TagStatus = class extends this._TagPipedDisplayTextThird {
		tagName = "status";
		defaultSource = Parser.SRC_PHB;
		page = UrlUtil.PG_CONDITIONS_DISEASES;
	};

	static TagTable = class extends this._TagPipedDisplayTextThird {
		tagName = "table";
		defaultSource = Parser.SRC_DMG;
		page = UrlUtil.PG_TABLES;
	};

	static TagTrap = class extends this._TagPipedDisplayTextThird {
		tagName = "trap";
		defaultSource = Parser.SRC_DMG;
		page = UrlUtil.PG_TRAPS_HAZARDS;
	};

	static TagVariantrule = class extends this._TagPipedDisplayTextThird {
		tagName = "variantrule";
		defaultSource = Parser.SRC_DMG;
		page = UrlUtil.PG_VARIANTRULES;
	};

	static TagCite = class extends this._TagPipedDisplayTextThird {
		tagName = "cite";
		defaultSource = Parser.SRC_PHB;
		page = "citation";
	};

	static _TagPipedDisplayTextFourth = class extends this._TagBaseAt {
		_getStripped (tag, text) {
			const parts = Renderer.splitTagByPipe(text);
			return parts.length >= 4 ? parts[3] : parts[0];
		}
	};

	static TagCard = class extends this._TagPipedDisplayTextFourth {
		tagName = "card";
		defaultSource = Parser.SRC_DMG;
		page = "card";
	};

	static TagDeity = class extends this._TagPipedDisplayTextFourth {
		tagName = "deity";
		defaultSource = Parser.SRC_PHB;
		page = UrlUtil.PG_DEITIES;
	};

	static _TagPipedDisplayTextFifth = class extends this._TagBaseAt {
		_getStripped (tag, text) {
			const parts = Renderer.splitTagByPipe(text);
			return parts.length >= 5 ? parts[4] : parts[0];
		}
	};

	static TagSubclass = class extends this._TagPipedDisplayTextFifth {
		tagName = "subclass";
		defaultSource = Parser.SRC_PHB;
		page = UrlUtil.PG_CLASSES;
	};

	static _TagPipedDisplayTextSixth = class extends this._TagBaseAt {
		_getStripped (tag, text) {
			const parts = Renderer.splitTagByPipe(text);
			return parts.length >= 6 ? parts[5] : parts[0];
		}
	};

	static TagClassFeature = class extends this._TagPipedDisplayTextSixth {
		tagName = "classFeature";
		defaultSource = Parser.SRC_PHB;
		page = UrlUtil.PG_CLASSES;
	};

	static _TagPipedDisplayTextEight = class extends this._TagBaseAt {
		_getStripped (tag, text) {
			const parts = Renderer.splitTagByPipe(text);
			return parts.length >= 8 ? parts[7] : parts[0];
		}
	};

	static TagSubclassFeature = class extends this._TagPipedDisplayTextEight {
		tagName = "subclassFeature";
		defaultSource = Parser.SRC_PHB;
		page = UrlUtil.PG_CLASSES;
	};

	static TagQuickref = class extends this._TagBaseAt {
		tagName = "quickref";
		defaultSource = Parser.SRC_PHB;
		page = UrlUtil.PG_QUICKREF;

		_getStripped (tag, text) {
			const {name, displayText} = DataUtil.quickreference.unpackUid(text);
			return displayText || name;
		}
	};

	static TagArea = class extends this._TagBaseAt {
		tagName = "area";

		_getStripped (tag, text) {
			const [compactText, , flags] = Renderer.splitTagByPipe(text);

			return flags && flags.includes("x")
				? compactText
				: `${flags && flags.includes("u") ? "A" : "a"}rea ${compactText}`;
		}

		_getMeta (tag, text) {
			const [compactText, areaId, flags] = Renderer.splitTagByPipe(text);

			const displayText = flags && flags.includes("x")
				? compactText
				: `${flags && flags.includes("u") ? "A" : "a"}rea ${compactText}`;

			return {
				areaId,
				displayText,
			};
		}

		getHref (bookRender, area) {
			if (!area) return `javascript:void(0)`;
			return `#${bookRender.curBookId},${area.chapter},${UrlUtil.encodeForHash(area.entry.name)},0`;
		}
	};

	static TagHomebrew = class extends this._TagBaseAt {
		tagName = "homebrew";

		_getStripped (tag, text) {
			const [newText, oldText] = Renderer.splitTagByPipe(text);
			if (newText && oldText) {
				return `${newText} [this is a homebrew addition, replacing the following: "${oldText}"]`;
			} else if (newText) {
				return `${newText} [this is a homebrew addition]`;
			} else if (oldText) {
				return `[the following text has been removed due to homebrew: ${oldText}]`;
			} else throw new Error(`Homebrew tag had neither old nor new text!`);
		}
	};

	static TagItemEntry = class extends this._TagBaseHash {
		tagName = "itemEntry";
		defaultSource = Parser.SRC_DMG;
	};

	/* -------------------------------------------- */

	static TAGS = [
		new this.TagBoldShort(),
		new this.TagBoldLong(),
		new this.TagItalicShort(),
		new this.TagItalicLong(),
		new this.TagStrikethroughShort(),
		new this.TagStrikethroughLong(),
		new this.TagStrikethroughDoubleShort(),
		new this.TagStrikethroughDoubleLong(),
		new this.TagUnderlineShort(),
		new this.TagUnderlineLong(),
		new this.TagUnderlineDoubleShort(),
		new this.TagUnderlineDoubleLong(),
		new this.TagSup(),
		new this.TagSub(),
		new this.TagKbd(),
		new this.TagCode(),
		new this.TagStyle(),
		new this.TagFont(),

		new this.TagComic(),
		new this.TagComicH1(),
		new this.TagComicH2(),
		new this.TagComicH3(),
		new this.TagComicH4(),
		new this.TagComicNote(),

		new this.TagNote(),
		new this.TagTip(),

		new this.TagUnit(),

		new this.TagActSave(),
		new this.TagActSaveSuccess(),
		new this.TagActSaveFailure(),
		new this.TagActSaveFailureBy(),
		new this.TagActSaveSuccessOrFailure(),
		new this.TagActTrigger(),
		new this.TagActResponse(),

		new this.TagHitText(),
		new this.TagMissText(),
		new this.TagHitOrMissText(),

		new this.TagAtk(),
		new this.TagAtkr(),

		new this.TagHitYourSpellAttack(),

		new this.TagDc(),

		new this.TagDcYourSpellSave(),

		new this.TagChance(),
		new this.TagD20(),
		new this.TagDamage(),
		new this.TagDice(),
		new this.TagAutodice(),
		new this.TagHit(),
		new this.TagInitiative(),
		new this.TagRecharge(),
		new this.TagAbility(),
		new this.TagSavingThrow(),
		new this.TagSkillCheck(),

		new this.TagScaledice(),
		new this.TagScaledamage(),

		new this.TagCoinflip(),

		new this.Tag5etools(),
		new this.Tag5etoolsImg(),
		new this.TagAdventure(),
		new this.TagBook(),
		new this.TagFilter(),
		new this.TagFootnote(),
		new this.TagLink(),
		new this.TagLoader(),
		new this.TagColor(),
		new this.TagHighlight(),
		new this.TagHelp(),

		new this.TagQuickref(),

		new this.TagArea(),

		new this.TagAction(),
		new this.TagBackground(),
		new this.TagBoon(),
		new this.TagCharoption(),
		new this.TagClass(),
		new this.TagCondition(),
		new this.TagCreature(),
		new this.TagCreatureFluff(),
		new this.TagCult(),
		new this.TagDeck(),
		new this.TagDisease(),
		new this.TagFacility(),
		new this.TagFeat(),
		new this.TagHazard(),
		new this.TagItem(),
		new this.TagItemProperty(),
		new this.TagItemMastery(),
		new this.TagLanguage(),
		new this.TagLegroup(),
		new this.TagObject(),
		new this.TagOptfeature(),
		new this.TagPsionic(),
		new this.TagRace(),
		new this.TagRaceFluff(),
		new this.TagRecipe(),
		new this.TagReward(),
		new this.TagVehicle(),
		new this.TagVehupgrade(),
		new this.TagSense(),
		new this.TagSkill(),
		new this.TagSpell(),
		new this.TagStatus(),
		new this.TagTable(),
		new this.TagTrap(),
		new this.TagVariantrule(),
		new this.TagCite(),

		new this.TagCard(),
		new this.TagDeity(),

		new this.TagSubclass(),

		new this.TagClassFeature(),

		new this.TagSubclassFeature(),

		new this.TagHomebrew(),

		/* ----------------------------------------- */

		new this.TagItemEntry(),
	];

	static TAG_LOOKUP = {};

	static _init () {
		this.TAGS.forEach(tag => {
			this.TAG_LOOKUP[tag.tag] = tag;
			this.TAG_LOOKUP[tag.tagName] = tag;
		});

		return null;
	}

	static _ = this._init();

	/* ----------------------------------------- */

	static getPage (tag) {
		const tagInfo = this.TAG_LOOKUP[tag];
		return tagInfo?.page;
	}
};

Renderer.events = class {
	static handleClick_copyCode (evt, ele) {
		const $e = $(ele).parent().next("pre");
		MiscUtil.pCopyTextToClipboard($e.text());
		JqueryUtil.showCopiedEffect($e);
	}

	static handleClick_toggleCodeWrap (evt, ele) {
		const nxt = !StorageUtil.syncGet("rendererCodeWrap");
		StorageUtil.syncSet("rendererCodeWrap", nxt);
		const $btn = $(ele).toggleClass("active", nxt);
		const $e = $btn.parent().next("pre");
		$e.toggleClass("rd__pre-wrap", nxt);
	}

	static bindGeneric ({element = document.body} = {}) {
		const $ele = $(element)
			.on("click", `[data-rd-data-embed-header]`, evt => {
				Renderer.events.handleClick_dataEmbedHeader(evt, evt.currentTarget);
			});

		Renderer.events._HEADER_TOGGLE_CLICK_SELECTORS
			.forEach(selector => {
				$ele
					.on("click", selector, evt => {
						Renderer.events.handleClick_headerToggleButton(evt, evt.currentTarget, {selector});
					});
			})
		;
	}

	static handleClick_dataEmbedHeader (evt, ele) {
		if (evt.target.closest("a")) return;

		evt.stopPropagation();
		evt.preventDefault();

		const $ele = $(ele);
		const $eleToggle = $ele.find(".rd__data-embed-toggle");
		const isHidden = $eleToggle.text().includes("+");
		$ele.find(".rd__data-embed-name").toggleVe(!isHidden);
		$ele.find(".rd__data-embed-name-expanded").toggleVe(isHidden);
		$eleToggle.text(isHidden ? "[\u2013]" : "[+]");
		$ele.closest("table").find("tbody").toggleVe();
	}

	static _HEADER_TOGGLE_CLICK_SELECTORS = [
		`[data-rd-h-toggle-button]`,
		`[data-rd-h-special-toggle-button]`,
	];

	static handleClick_headerToggleButton (evt, ele, {selector = false} = {}) {
		evt.stopPropagation();
		evt.preventDefault();

		const isShow = this._handleClick_headerToggleButton_doToggleEle(ele, {selector});

		if (!EventUtil.isCtrlMetaKey(evt)) return;

		Renderer.events._HEADER_TOGGLE_CLICK_SELECTORS
			.forEach(selector => {
				[...document.querySelectorAll(selector)]
					.filter(eleOther => eleOther !== ele)
					.forEach(eleOther => {
						Renderer.events._handleClick_headerToggleButton_doToggleEle(eleOther, {selector, force: isShow});
					});
			})
		;
	}

	static _handleClick_headerToggleButton_doToggleEle (ele, {selector = false, force = null} = {}) {
		const isShow = force != null ? force : ele.innerHTML.includes("+");

		let eleNxt = ele.closest(".rd__h").nextElementSibling;

		while (eleNxt) {
			// For special sections, always collapse the whole thing.
			if (selector !== `[data-rd-h-special-toggle-button]`) {
				const eleToCheck = Renderer.events._handleClick_headerToggleButton_getEleToCheck(eleNxt);
				if (
					eleToCheck.classList.contains("rd__b-special")
					|| (eleToCheck.classList.contains("rd__h") && !eleToCheck.classList.contains("rd__h--3"))
				) break;

				if (
					!eleToCheck.classList.contains("rd__b")
					|| eleToCheck.classList.contains("rd__b--3")
				) {
					eleNxt.classList.toggle("rd__ele-toggled-hidden", !isShow);
					eleNxt = eleNxt.nextElementSibling;
					continue;
				}

				// For blocks, even if the block is a higher-level entry, it may not contain a higher-level header (i.e., it's just a wrapper)
				//   Break only if the block has a higher-level header
				if (
					[...eleToCheck.querySelectorAll(".rd__h")]
						.some(eleSub => eleSub.classList.contains("rd__h--0") || eleSub.classList.contains("rd__h--1") || eleSub.classList.contains("rd__h--2"))
				) break;
			}

			eleNxt.classList.toggle("rd__ele-toggled-hidden", !isShow);
			eleNxt = eleNxt.nextElementSibling;
		}

		ele.innerHTML = isShow ? "[\u2013]" : "[+]";

		return isShow;
	}

	static _handleClick_headerToggleButton_getEleToCheck (eleNxt) {
		if (eleNxt.type === 3) return eleNxt; // Text nodes

		// If the element is a block with only one child which is itself a block, treat it as a "wrapper" block, and dig
		if (!eleNxt.classList.contains("rd__b") || eleNxt.classList.contains("rd__b--3")) return eleNxt;
		const childNodes = [...eleNxt.childNodes].filter(it => (it.type === 3 && (it.textContent || "").trim()) || it.type !== 3);
		if (childNodes.length !== 1) return eleNxt;
		if (childNodes[0].classList.contains("rd__b")) return Renderer.events._handleClick_headerToggleButton_getEleToCheck(childNodes[0]);
		return eleNxt;
	}

	static handleLoad_inlineStatblock (ele) {
		const observer = Renderer.utils.lazy.getCreateObserver({
			observerId: "inlineStatblock",
			fnOnObserve: Renderer.events._handleLoad_inlineStatblock_fnOnObserve.bind(Renderer.events),
		});

		observer.track(ele.parentNode);
	}

	static _handleLoad_inlineStatblock_getHtmlNames ({tag, uid, displayName}) {
		if (!tag) return {};

		const tagMeta = Renderer.utils.getTagMeta(`@${tag}`, `${uid}${displayName ? `|${displayName}` : ""}`);

		const {name, displayText, page, hash, hashPreEncoded} = tagMeta;

		const fauxEntryBase = {
			type: "link",
			href: {
				type: "internal",
				path: page,
				hash,
			},
		};
		if (hashPreEncoded != null) fauxEntryBase.href.hashPreEncoded = hashPreEncoded;

		return {
			htmlNameCollapsed: Renderer.get().render({
				...fauxEntryBase,
				text: displayText || name,
			}),
			htmlNameExpanded: Renderer.get().render({
				...fauxEntryBase,
				text: `<button class="ve-btn ve-btn-default ve-btn-xxs" title="Go to Page">
					<span class="glyphicon glyphicon-modal-window"></span>
				</button>`,
			}),
		};
	}

	static _handleLoad_inlineStatblock_fnOnObserve ({entry}) {
		const ele = entry.target;

		const tag = ele.dataset.rdTag.uq();
		const uid = (ele.getAttribute("data-rd-uid") || "").uq();
		const page = ele.dataset.rdPage.uq();
		const source = ele.dataset.rdSource.uq();
		const name = ele.dataset.rdName.uq();
		const displayName = ele.dataset.rdDisplayName.uq();
		const hash = ele.dataset.rdHash.uq();
		const style = ele.dataset.rdStyle.uq();
		const entryData = JSON.parse((ele.getAttribute("data-rd-entry-data") || "").uq() || `{}`);

		return DataLoader.pCacheAndGet(page, Parser.getTagSource(tag, source), hash)
			.then(toRender => {
				const tr = ele.closest("tr");

				if (!toRender) {
					tr.innerHTML = `<td colspan="6"><i class="text-danger">Failed to load ${tag ? Renderer.get().render(`{@${tag} ${name}|${source}${displayName ? `|${displayName}` : ""}}`) : displayName || name}!</i></td>`;
					throw new Error(`Could not find tag: "${tag}" (page/prop: "${page}") hash: "${hash}"`);
				}

				const headerName = displayName
					|| (name ?? toRender.name ?? (toRender.entries?.length ? toRender.entries?.[0]?.name : "(Unknown)"));

				const {htmlNameCollapsed, htmlNameExpanded} = Renderer.events._handleLoad_inlineStatblock_getHtmlNames({
					tag, uid, displayName,
				});

				const fnRender = Renderer.hover.getFnRenderCompact(page);
				const tbl = tr.closest("table");
				const nxt = e_({
					outer: Renderer.utils.getEmbeddedDataHeader(
						headerName,
						style,
						{
							isStats: !toRender.__prop?.endsWith("Fluff"),
							htmlNameCollapsed,
							htmlNameExpanded,
						},
					)
						+ fnRender(toRender, {...(entryData?.renderCompact || {}), isEmbeddedEntity: true})
						+ Renderer.utils.getEmbeddedDataFooter(),
				});
				tbl.parentNode.replaceChild(
					nxt,
					tbl,
				);

				const nxtTgt = nxt.querySelector(`[data-rd-embedded-data-render-target="true"]`);

				const fnBind = Renderer.hover.getFnBindListenersCompact(page);
				if (fnBind) fnBind(toRender, nxtTgt);
			});
	}
};

/** @abstract */
class _RenderCompactImplBase {
	_style;
	_page;
	_dataProp;

	/**
	 * @param {object} ent
	 * @param [opts]
	 * @param [opts.isEmbeddedEntity]
	 * @param [opts.isSkipNameRow]
	 *
	 * @return {string}
	 */
	getCompactRenderedString (ent, opts) {
		opts ||= {};
		const renderer = Renderer.get().setFirstSection(true);

		return this._getCompactRenderedString({ent, renderer, opts});
	}

	/**
	 * @abstract
	 *
	 * @param {object} ent
	 * @param {Renderer} renderer
	 * @param [opts]
	 * @param [opts.isEmbeddedEntity]
	 * @param [opts.isSkipNameRow]
	 *
	 * @return {string}
	 */
	_getCompactRenderedString ({ent, renderer, opts}) {
		throw new Error("Unimplemented!");
	}

	/* -------------------------------------------- */

	_getCommonHtmlParts (
		{
			ent,
			renderer,
			opts,
		},
	) {
		return {
			htmlPtIsExcluded: this._getCommonHtmlParts_isExcluded({ent, opts}),
			htmlPtName: this._getCommonHtmlParts_name({ent, opts}),

			htmlPtPrerequisites: this._getCommonHtmlParts_prerequisites({ent, opts}),
		};
	}

	/* ----- */

	_getCommonHtmlParts_isExcluded ({ent, opts}) {
		return Renderer.utils.getExcludedTr({entity: ent, dataProp: this._dataProp, page: this._page});
	}

	_getCommonHtmlParts_name ({ent, opts}) {
		if (opts.isSkipNameRow) return "";
		return Renderer.utils.getNameTr(ent, {page: this._page, isEmbeddedEntity: opts.isEmbeddedEntity});
	}

	/* ----- */

	_getCommonHtmlParts_prerequisites ({ent}) {
		const pt = Renderer.utils.prerequisite.getHtml(ent.prerequisite, {styleHint: this._style});
		return pt ? `<div><i>${pt}</i></div>` : "";
	}
}

/** @abstract */
class _RenderCompactFeatsImplBase extends _RenderCompactImplBase {
	_page = UrlUtil.PG_FEATS;
	_dataProp = "feat";

	/* -------------------------------------------- */

	_getCommonHtmlParts (
		{
			ent,
			renderer,
			opts,
		},
	) {
		return {
			...super._getCommonHtmlParts({ent, renderer, opts}),

			htmlPtEntries: this._getCommonHtmlParts_entries({ent, renderer}),
		};
	}

	/* ----- */

	_getCommonHtmlParts_prerequisites ({ent}) {
		const ptCategoryPrerequisite = Renderer.feat.getJoinedCategoryPrerequisites(
			ent.category,
			Renderer.utils.prerequisite.getHtml(ent.prerequisite, {styleHint: this._style}),
		);
		return ptCategoryPrerequisite ? `<div><i>${ptCategoryPrerequisite}</i></div>` : "";
	}

	/* ----- */

	_getCommonHtmlParts_entries ({ent, renderer}) {
		const stack = [];
		renderer.recursiveRender(Renderer.feat.getFeatRendereableEntriesMeta(ent)?.entryMain, stack, {depth: 1});
		return stack.join("");
	}
}

class _RenderCompactFeatsImplClassic extends _RenderCompactFeatsImplBase {
	_style = "classic";

	/* -------------------------------------------- */

	_getHtmlParts (
		{
			ent,
			renderer,
		},
	) {
		return {
			htmlPtRepeatable: this._getHtmlParts_repeatable({ent}),
		};
	}

	/* ----- */

	_getHtmlParts_repeatable ({ent}) {
		const ptRepeatable = Renderer.utils.getRepeatableHtml(ent);
		return ptRepeatable ? `<div>${ptRepeatable}</div>` : "";
	}

	/* -------------------------------------------- */

	_getCompactRenderedString ({ent, renderer, opts}) {
		const {
			htmlPtIsExcluded,
			htmlPtName,

			htmlPtPrerequisites,

			htmlPtEntries,
		} = this._getCommonHtmlParts({
			ent,
			renderer,
			opts,
		});
		const {
			htmlPtRepeatable,
		} = this._getHtmlParts({
			ent,
			renderer,
		});

		const ptHeader = htmlPtPrerequisites || htmlPtRepeatable ? `<tr><td colspan="6" class="pb-2 pt-0">
			${htmlPtPrerequisites}
			${htmlPtRepeatable}
		</td></tr>` : "";

		return `
			${htmlPtIsExcluded}
			${htmlPtName}
			${ptHeader}
			<tr><td colspan="6" class="pb-2 ${ptHeader ? "" : "pt-0"}">${htmlPtEntries}</td></tr>
		`;
	}
}

class _RenderCompactFeatsImplOne extends _RenderCompactFeatsImplBase {
	_style = "one";

	/* -------------------------------------------- */

	_getCompactRenderedString ({ent, renderer, opts}) {
		const {
			htmlPtIsExcluded,
			htmlPtName,

			htmlPtPrerequisites,

			htmlPtEntries,
		} = this._getCommonHtmlParts({
			ent,
			renderer,
			opts,
		});

		return `
			${htmlPtIsExcluded}
			${htmlPtName}
			${htmlPtPrerequisites ? `<tr><td colspan="6" class="pb-2 pt-0">${htmlPtPrerequisites}</td></tr>` : ""}
			<tr><td colspan="6" class="pb-2 ${htmlPtPrerequisites ? "" : "pt-0"}">${htmlPtEntries}</td></tr>
		`;
	}
}

Renderer.feat = class {
	static _mergeAbilityIncrease_getListItemText (abilityObj) {
		return Renderer.feat._mergeAbilityIncrease_getText(abilityObj);
	}

	static _mergeAbilityIncrease_getListItemItem (abilityObj) {
		return {
			type: "item",
			name: "Ability Score Increase.",
			entry: Renderer.feat._mergeAbilityIncrease_getText(abilityObj),
		};
	}

	static _mergeAbilityIncrease_getText (abilityObj) {
		const maxScore = abilityObj.max ?? 20;

		if (!abilityObj.choose) {
			return Object.keys(abilityObj)
				.filter(k => k !== "max")
				.map(ab => `Increase your ${Parser.attAbvToFull(ab)} score by ${abilityObj[ab]}, to a maximum of ${maxScore}.`)
				.join(" ");
		}

		if (abilityObj.choose.weighted) {
			const ptsWeight = abilityObj.choose.weighted.weights
				.map((adj, i) => `${i === 0 ? "an" : "another"} ability score to ${adj > 0 ? "increase" : "decrease"} by ${Math.abs(adj)}`)
				.joinConjunct(", ", " and ");

			if (abilityObj.choose.weighted.from.length === 6) {
				return `Choose ${ptsWeight}.`;
			}

			const ptAbils = abilityObj.choose.weighted.from.map(abv => Parser.attAbvToFull(abv)).joinConjunct(", ", " and ");
			return `Choose ${ptsWeight} from among ${ptAbils}.`;
		}

		if (abilityObj.choose.from.length === 6) {
			return abilityObj.choose.entry
				? Renderer.get().render(abilityObj.choose.entry) // only used in "Resilient"
				: `Increase one ability score of your choice by ${abilityObj.choose.amount ?? 1}, to a maximum of ${maxScore}.`;
		}

		const abbChoicesText = abilityObj.choose.from.map(it => Parser.attAbvToFull(it)).joinConjunct(", ", " or ");
		return `Increase your ${abbChoicesText} by ${abilityObj.choose.amount ?? 1}, to a maximum of ${maxScore}.`;
	}

	static initFullEntries (feat) {
		if (!feat.ability || feat._fullEntries || !feat.ability.length) return;

		const abilsToDisplay = feat.ability.filter(it => !it.hidden);
		if (!abilsToDisplay.length) return;

		Renderer.utils.initFullEntries_(feat);

		const targetList = feat._fullEntries.find(ent => ent.type === "list");

		// FTD+ style
		if (targetList && targetList.items.every(ent => ent.type === "item")) {
			abilsToDisplay.forEach(abilObj => targetList.items.unshift(Renderer.feat._mergeAbilityIncrease_getListItemItem(abilObj)));
			return;
		}

		if (targetList) {
			abilsToDisplay.forEach(abilObj => targetList.items.unshift(Renderer.feat._mergeAbilityIncrease_getListItemText(abilObj)));
			return;
		}

		const ixFirstEntry = feat._fullEntries.findIndex(ent => ent.type === "entries");
		if (~ixFirstEntry) {
			feat._fullEntries.splice(ixFirstEntry, 0, {
				"type": "entries",
				"name": "Ability Score Increase",
				"entries": abilsToDisplay.map(abilObj => Renderer.feat._mergeAbilityIncrease_getListItemText(abilObj)),
			});
			return;
		}

		// this should never happen, but display sane output anyway, and throw an out-of-order exception
		abilsToDisplay.forEach(abilObj => feat._fullEntries.unshift(Renderer.feat._mergeAbilityIncrease_getListItemText(abilObj)));

		setTimeout(() => {
			throw new Error(`Could not find object of type "list" in "entries" for feat "${feat.name}" from source "${feat.source}" when merging ability scores! Reformat the feat to include a "list"-type entry.`);
		}, 1);
	}

	static getFeatRendereableEntriesMeta (ent) {
		Renderer.feat.initFullEntries(ent);
		return {
			entryMain: {entries: ent._fullEntries || ent.entries},
		};
	}

	static getJoinedCategoryPrerequisites (category, rdPrereqs) {
		const ptCategory = category ? `${Parser.featCategoryToFull(category)}${["FS:P", "FS:R"].includes(category) ? "" : ` Feat`}` : "";

		return ptCategory && rdPrereqs
			? `${ptCategory} (${rdPrereqs})`
			: (ptCategory || rdPrereqs);
	}

	/* -------------------------------------------- */

	static _RENDER_CLASSIC = new _RenderCompactFeatsImplClassic();
	static _RENDER_ONE = new _RenderCompactFeatsImplOne();

	/**
	 * @param ent
	 * @param [opts]
	 * @param [opts.isEmbeddedEntity]
	 * @param [opts.isSkipNameRow]
	 */
	static getCompactRenderedString (ent, opts) {
		const styleHint = VetoolsConfig.get("styleSwitcher", "style");
		switch (styleHint) {
			case "classic": return this._RENDER_CLASSIC.getCompactRenderedString(ent, opts);
			case "one": return this._RENDER_ONE.getCompactRenderedString(ent, opts);
			default: throw new Error(`Unhandled style "${styleHint}"!`);
		}
	}

	/* -------------------------------------------- */

	static pGetFluff (feat) {
		return Renderer.utils.pGetFluff({
			entity: feat,
			fluffProp: "featFluff",
		});
	}
};

/** @abstract */
class _RenderCompactClassesImplBase extends _RenderCompactImplBase {
	_page = UrlUtil.PG_CLASSES;
	_dataProp = "class";

	/* -------------------------------------------- */

	_getCommonHtmlParts (
		{
			ent,
			renderer,
			opts,
		},
	) {
		return {
			...super._getCommonHtmlParts({ent, renderer, opts}),

			htmlPtEntries: this._getCommonHtmlParts_entries({ent, renderer}),
		};
	}

	/* ----- */

	_getCommonHtmlParts_entries ({ent, renderer}) {
		const cpyEntries = MiscUtil.copyFast(ent.classFeatures || [])
			.flat()
			.map(ent => Renderer.class.getDisplayNamedClassFeatureEntry(ent, this._style));

		const fauxEnt = {
			type: "section",
			entries: cpyEntries,
		};

		return `
			<tr><td colspan="6" class="pb-2">
			${renderer.render(fauxEnt)}
			</td></tr>
		`;
	}
}

class _RenderCompactClassesImplClassic extends _RenderCompactClassesImplBase {
	_style = "classic";

	/* -------------------------------------------- */

	_getCompactRenderedString ({ent, renderer, opts}) {
		const {
			htmlPtIsExcluded,
			htmlPtName,

			htmlPtEntries,
		} = this._getCommonHtmlParts({
			ent,
			renderer,
			opts,
		});

		return `
			${htmlPtIsExcluded}
			${htmlPtName}
			<tr><td colspan="6" class="pb-2 pt-0">${htmlPtEntries}</td></tr>
		`;
	}
}

class _RenderCompactClassesImplOne extends _RenderCompactClassesImplBase {
	_style = "one";

	/* -------------------------------------------- */

	_getHtmlParts (
		{
			ent,
			renderer,
		},
	) {
		return {
			htmlPtCoreTraits: this._getHtmlParts_coreTraits({ent}),
		};
	}

	/* ----- */

	_getHtmlParts_coreTraits ({ent, renderer}) {
		const pts = [
			Renderer.class.getHtmlPtPrimaryAbility(ent, {renderer, styleHint: this._style}),
			Renderer.class.getHtmlPtHitPoints(ent, {renderer, styleHint: this._style}),
			Renderer.class.getHtmlPtSavingThrows(ent, {renderer, styleHint: this._style}),
			Renderer.class.getHtmlPtSkills(ent, {renderer, styleHint: this._style}),
			Renderer.class.getHtmlPtWeaponProficiencies(ent, {renderer, styleHint: this._style}),
			Renderer.class.getHtmlPtToolProficiencies(ent, {renderer, styleHint: this._style}),
			Renderer.class.getHtmlPtArmorProficiencies(ent, {renderer, styleHint: this._style}),
			Renderer.class.getHtmlPtStartingEquipment(ent, {renderer, styleHint: this._style}),
		]
			.filter(Boolean)
			.join(`<div class="py-1 w-100"></div>`);

		return `<tr><td colspan="6" class="pb-2 pt-0">
			${pts}
		</td></tr>`;
	}

	/* -------------------------------------------- */

	_getCompactRenderedString ({ent, renderer, opts}) {
		const {
			htmlPtIsExcluded,
			htmlPtName,

			htmlPtEntries,
		} = this._getCommonHtmlParts({
			ent,
			renderer,
			opts,
		});
		const {
			htmlPtCoreTraits,
		} = this._getHtmlParts({
			ent,
			renderer,
		});

		return `
			${htmlPtIsExcluded}
			${htmlPtName}
			${htmlPtCoreTraits}
			<tr><td colspan="6" class="py-0"><hr class="hr-2"></td></tr>
			<tr><td colspan="6" class="pb-2 pt-0">${htmlPtEntries}</td></tr>
		`;
	}
}

Renderer.class = class {
	static _RENDER_CLASSIC = new _RenderCompactClassesImplClassic();
	static _RENDER_ONE = new _RenderCompactClassesImplOne();

	/**
	 * @param ent
	 * @param [opts]
	 * @param [opts.isEmbeddedEntity]
	 * @param [opts.isSkipNameRow]
	 */
	static getCompactRenderedString (ent, opts) {
		if (ent.__prop === "subclass") return Renderer.subclass.getCompactRenderedString(ent);

		const styleHint = VetoolsConfig.get("styleSwitcher", "style");
		switch (styleHint) {
			case "classic": return this._RENDER_CLASSIC.getCompactRenderedString(ent, opts);
			case "one": return this._RENDER_ONE.getCompactRenderedString(ent, opts);
			default: throw new Error(`Unhandled style "${styleHint}"!`);
		}
	}

	/* -------------------------------------------- */

	/**
	 * @param clsHd
	 * @param {"classic" | null} styleHint
	 */
	static getHitDiceEntry (clsHd, {styleHint = null} = {}) {
		if (!clsHd) return null;

		styleHint ||= VetoolsConfig.get("styleSwitcher", "style");

		return styleHint === "classic"
			? `{@dice ${clsHd.number}d${clsHd.faces}||Hit die}`
			: `{@dice ${clsHd.number}d${clsHd.faces}|${clsHd.number === 1 ? "" : clsHd.number}D${clsHd.faces}|Hit die}`;
	}

	/**
	 * @param clsHd
	 * @param {"classic" | null} styleHint
	 */
	static getHitPointsAtFirstLevel (clsHd, {styleHint = null} = {}) {
		if (!clsHd) return null;

		styleHint ||= VetoolsConfig.get("styleSwitcher", "style");

		return styleHint === "classic"
			? `${clsHd.number * clsHd.faces} + your Constitution modifier`
			: `${clsHd.number * clsHd.faces} + Con. modifier`;
	}

	/**
	 * @param className
	 * @param clsHd
	 * @param {"classic" | null} styleHint
	 */
	static getHitPointsAtHigherLevels (className, clsHd, {styleHint = null} = {}) {
		if (!className || !clsHd) return null;

		styleHint ||= VetoolsConfig.get("styleSwitcher", "style");

		return styleHint === "classic"
			? `${Renderer.get().render(Renderer.class.getHitDiceEntry(clsHd, {styleHint}))} (or ${((clsHd.number * clsHd.faces) / 2 + 1)}) + your Constitution modifier per ${className} level after 1st`
			: `${Renderer.get().render(Renderer.class.getHitDiceEntry(clsHd, {styleHint}))} + your Con. modifier, or, ${((clsHd.number * clsHd.faces) / 2 + 1)} + your Con. modifier`;
	}

	/* -------------------------------------------- */

	/**
	 * @param armorProfs
	 * @param {"classic" | null} styleHint
	 */
	static getRenderedArmorProfs (armorProfs, {styleHint = null} = {}) {
		styleHint ||= VetoolsConfig.get("styleSwitcher", "style");

		const [profsArmor, profsOther] = armorProfs
			.segregate(it => ["light", "medium", "heavy"].includes(it));

		const ptsArmor = profsArmor
			.map((a, i, arr) => Renderer.get().render(`{@filter ${styleHint === "classic" ? a : a.toTitleCase()}${styleHint === "classic" || i === arr.length - 1 ? " armor" : ""}|items|type=${a} armor}`));

		const ptsOther = profsOther
			.map(a => {
				if (a.full) return Renderer.get().render(a.full);
				if (a === "shield") {
					if (styleHint === "classic") Renderer.get().render(`{@item shield|PHB|shields}`);
					return Renderer.get().render(`{@item shield|XPHB|Shields}`);
				}
				return Renderer.get().render(a);
			});

		if (styleHint === "classic") {
			return [
				...ptsArmor,
				...ptsOther,
			]
				.join(", ");
		}

		return [
			ptsArmor.joinConjunct(", ", " and "),
			...ptsOther,
		]
			.filter(Boolean)
			.joinConjunct(", ", " and ");
	}

	/**
	 * @param weaponProfs
	 * @param {"classic" | null} styleHint
	 */
	static getRenderedWeaponProfs (weaponProfs, {styleHint = null} = {}) {
		styleHint ||= VetoolsConfig.get("styleSwitcher", "style");

		const [profsSimpleMartial, profsOther] = weaponProfs
			.segregate(it => ["simple", "martial"].includes(it));

		const ptsSimpleMartial = profsSimpleMartial
			.map((w, i, arr) => Renderer.get().render(`{@filter ${styleHint === "classic" ? w : w.toTitleCase()}${styleHint === "classic" || i === arr.length - 1 ? " weapons" : ""}|items|type=${w} weapon}`));

		const ptsOther = profsOther
			.map(w => {
				if (w.optional) return `<span class="help help--hover" title="Optional Proficiency">${Renderer.get().render(w.proficiency)}</span>`;
				return Renderer.get().render(w);
			});

		const pts = [
			...ptsSimpleMartial,
			...ptsOther,
		];

		return styleHint === "classic" ? pts.join(", ") : pts.joinConjunct(", ", " and ");
	}

	/**
	 * @param toolProfs
	 * @param {"classic" | null} styleHint
	 */
	static getRenderedToolProfs (toolProfs, {styleHint = null} = {}) {
		const pts = toolProfs.map(it => Renderer.get().render(it));
		return styleHint === "classic" ? pts.join(", ") : pts.joinConjunct(", ", " and ");
	}

	/**
	 * @param skills
	 * @param {"classic" | null} styleHint
	 */
	static getRenderedSkillProfs (skills, {styleHint = null} = {}) {
		styleHint ||= VetoolsConfig.get("styleSwitcher", "style");

		return `${Parser.skillProficienciesToFull(skills, {styleHint}).uppercaseFirst()}.`;
	}

	/* -------------------------------------------- */

	static getHtmlPtPrimaryAbility (cls) {
		if (!cls.primaryAbility) return "";

		const pts = cls.primaryAbility
			.map(abilObj => {
				return Object.entries(abilObj)
					.filter(([, v]) => v)
					.map(([k]) => Parser.attAbvToFull(k))
					.joinConjunct(", ", " and ");
			})
			.joinConjunct(", ", " or ");

		return `<div><b>Primary Ability:</b> <span>${pts}</span></div>`;
	}

	static getHtmlPtHitPoints (cls, {renderer = null, styleHint = null}) {
		if (!cls.hd) return "";

		renderer ||= Renderer.get();
		styleHint ||= VetoolsConfig.get("styleSwitcher", "style");

		return `<div><strong>Hit Point Die:</strong> ${renderer.render(Renderer.class.getHitDiceEntry(cls.hd, {styleHint}))} per ${cls.name} level</div>
		<div><strong>Hit Points at Level 1:</strong> ${Renderer.class.getHitPointsAtFirstLevel(cls.hd, {styleHint})}</div>
		<div><strong>Hit Points per additional ${cls.name} Level:</strong> ${Renderer.class.getHitPointsAtHigherLevels(cls.name, cls.hd, {styleHint})}</div>`;
	}

	static getHtmlPtSavingThrows (cls) {
		if (!cls.proficiency) return "";

		return `<div><b>Saving Throw Proficiencies:</b> <span>${cls.proficiency.map(p => Parser.attAbvToFull(p)).join(", ")}</span></div>`;
	}

	static getHtmlPtSkills (cls, {styleHint = null}) {
		if (!cls.startingProficiencies?.skills) return "";

		styleHint ||= VetoolsConfig.get("styleSwitcher", "style");

		return `<div><b>Skill Proficiencies:</b> <span>${Renderer.class.getRenderedSkillProfs(cls.startingProficiencies.skills, {styleHint})}</span></div>`;
	}

	static getHtmlPtWeaponProficiencies (cls, {styleHint = null}) {
		if (!cls.startingProficiencies?.weapons) return "";

		styleHint ||= VetoolsConfig.get("styleSwitcher", "style");

		return `<div><b>Weapon Proficiencies:</b> <span>${Renderer.class.getRenderedWeaponProfs(cls.startingProficiencies.weapons, {styleHint})}</span></div>`;
	}

	static getHtmlPtToolProficiencies (cls, {styleHint = null}) {
		if (!cls.startingProficiencies?.tools) return "";

		styleHint ||= VetoolsConfig.get("styleSwitcher", "style");

		return `<div><b>Tool Proficiencies:</b> <span>${Renderer.class.getRenderedToolProfs(cls.startingProficiencies.tools, {styleHint})}</span></div>`;
	}

	static getHtmlPtArmorProficiencies (cls, {styleHint = null}) {
		if (!cls.startingProficiencies?.armor) return "";

		styleHint ||= VetoolsConfig.get("styleSwitcher", "style");

		return `<div><b>Armor Training:</b> <span>${Renderer.class.getRenderedArmorProfs(cls.startingProficiencies.armor, {styleHint})}</span></div>`;
	}

	static getHtmlPtStartingEquipment (cls, {renderer = null, styleHint = null}) {
		if (!cls.startingEquipment) return null;

		renderer ||= Renderer.get();
		styleHint ||= VetoolsConfig.get("styleSwitcher", "style");

		const {startingEquipment: equip} = cls;

		if (equip.additionalFromBackground && equip.default) return this._getHtmlPtStartingEquipment_default({equip, renderer});
		return this._getHtmlPtStartingEquipment_entries({equip, renderer, styleHint});
	}

	static _getHtmlPtStartingEquipment_default ({equip, renderer}) {
		return [
			equip.additionalFromBackground ? "<p>You start with the following items, plus anything provided by your background.</p>" : "",
			equip.default && equip.default.length ? `<ul class="pl-4"><li>${equip.default.map(it => renderer.render(it)).join("</li><li>")}</ul>` : "",
			equip.goldAlternative != null ? `<p>Alternatively, you may start with ${renderer.render(equip.goldAlternative)} gp to buy your own equipment.</p>` : "",
		]
			.filter(Boolean)
			.join("");
	}

	static _getHtmlPtStartingEquipment_entries ({equip, renderer, styleHint}) {
		if (styleHint === "classic" || !equip.entries?.length || typeof equip.entries[0] !== "string") {
			return renderer.render({
				type: "entries",
				entries: equip.entries || [],
			});
		}

		const [firstEntry, ...otherEntries] = equip.entries;

		return renderer.render({
			type: "entries",
			entries: [
				`{@b Starting Equipment:} ${firstEntry}`,
				...otherEntries,
			],
		});
	}

	/* -------------------------------------------- */

	static getDisplayNamedClassFeatureEntry (ent, {styleHint = null} = {}) {
		styleHint ||= VetoolsConfig.get("styleSwitcher", "style");

		if (styleHint === "classic" || !ent.level || !ent.name) return ent;
		return {_displayName: `Level ${ent.level}: ${ent._displayName || ent.name}`, ...ent};
	}

	static getDisplayNamedSubclassFeatureEntry (ent, {styleHint = null, isEditionMismatch = false} = {}) {
		styleHint ||= VetoolsConfig.get("styleSwitcher", "style");

		// N.b.: enabled for "classic" style to support viewing "one" classes in "classic" view...
		if (/* styleHint === "classic" || */!ent.level || !ent.entries?.length) return ent;
		// ...unless edition mismatch, as this suggests (a) existing text, and (b), features which may have
		//   their levels otherwise mis-labelled.
		if (isEditionMismatch) return ent;

		const cpy = MiscUtil.copyFast(ent);
		cpy.entries = cpy.entries
			.map(ent => {
				if (ent.type !== "entries" || !ent.name) return ent;
				if (!ent.level) return ent;
				return {_displayName: `Level ${ent.level}: ${ent._displayName || ent.name}`, ...ent};
			});
		return cpy;
	}

	/* -------------------------------------------- */

	static getWalkerFilterDereferencedFeatures () {
		return MiscUtil.getWalker({
			keyBlocklist: MiscUtil.GENERIC_WALKER_ENTRIES_KEY_BLOCKLIST,
			isAllowDeleteObjects: true,
			isDepthFirst: true,
		});
	}

	static mutFilterDereferencedClassFeatures (
		{
			walker,
			cpyCls,
			pageFilter,
			filterValues,
			isUseSubclassSources = false,
		},
	) {
		walker = walker || Renderer.class.getWalkerFilterDereferencedFeatures();

		cpyCls.classFeatures = cpyCls.classFeatures.map((lvlFeatures, ixLvl) => {
			return walker.walk(
				lvlFeatures,
				{
					object: (obj) => {
						if (!obj.source) return obj;
						const fText = obj.isClassFeatureVariant ? {isClassFeatureVariant: true} : null;

						const isDisplay = [obj.source, ...(obj.otherSources || [])
							.map(it => it.source)]
							.some(src => pageFilter.filterBox.toDisplayByFilters(
								filterValues,
								...[
									{
										filter: pageFilter.sourceFilter,
										value: isUseSubclassSources && src === cpyCls.source
											? pageFilter.getActiveSource(filterValues)
											: src,
									},
									pageFilter.levelFilter
										? {
											filter: pageFilter.levelFilter,
											value: ixLvl + 1,
										}
										: null,
									{
										filter: pageFilter.optionsFilter,
										value: fText,
									},
								].filter(Boolean),
							));

						return isDisplay ? obj : null;
					},
					array: (arr) => {
						return arr.filter(it => it != null);
					},
				},
			);
		});
	}

	static mutFilterDereferencedSubclassFeatures (
		{
			walker,
			cpySc,
			pageFilter,
			filterValues,
		},
	) {
		walker = walker || Renderer.class.getWalkerFilterDereferencedFeatures();

		cpySc.subclassFeatures = cpySc.subclassFeatures.map(lvlFeatures => {
			const level = CollectionUtil.bfs(lvlFeatures, {prop: "level"});

			return walker.walk(
				lvlFeatures,
				{
					object: (obj) => {
						if (obj.entries && !obj.entries.length) return null;
						if (!obj.source) return obj;
						const fText = obj.isClassFeatureVariant ? {isClassFeatureVariant: true} : null;

						const isDisplay = [obj.source, ...(obj.otherSources || [])
							.map(it => it.source)]
							.some(src => pageFilter.filterBox.toDisplayByFilters(
								filterValues,
								...[
									{
										filter: pageFilter.sourceFilter,
										value: src,
									},
									pageFilter.levelFilter
										? {
											filter: pageFilter.levelFilter,
											value: level,
										}
										: null,
									{
										filter: pageFilter.optionsFilter,
										value: fText,
									},
								].filter(Boolean),
							));

						return isDisplay ? obj : null;
					},
					array: (arr) => {
						return arr.filter(it => it != null);
					},
				},
			);
		});
	}

	static pGetFluff (cls) {
		// Handle legacy/deprecated class fluff
		// TODO(Future) remove this after ~July 2024
		if (cls.fluff instanceof Array) {
			cls = {...cls};
			cls.fluff = {entries: cls.fluff};
		}

		return Renderer.utils.pGetFluff({
			entity: cls,
			fluffProp: "classFluff",
		});
	}
};

/** @abstract */
class _RenderCompactSubclassesImplBase extends _RenderCompactImplBase {
	_page = UrlUtil.PG_CLASSES;
	_dataProp = "subclass";

	/* -------------------------------------------- */

	_getCommonHtmlParts (
		{
			ent,
			renderer,
			opts,
		},
	) {
		return {
			...super._getCommonHtmlParts({ent, renderer, opts}),

			htmlPtEntries: this._getCommonHtmlParts_entries({ent, renderer}),
		};
	}

	/* ----- */

	_getCommonHtmlParts_entries ({ent, renderer}) {
		const cpyEntries = MiscUtil.copyFast((ent.subclassFeatures || []).flat())
			.flat()
			.map(ent => Renderer.class.getDisplayNamedSubclassFeatureEntry(ent, {styleHint: this._style}));

		if (cpyEntries[0]?.name === ent.name) delete cpyEntries[0].name;

		const fauxEnt = {
			type: "section",
			entries: cpyEntries,
		};

		return `
			<tr><td colspan="6" class="pb-2">
			${renderer.render(fauxEnt)}
			</td></tr>
		`;
	}

	/* -------------------------------------------- */

	_getCompactRenderedString ({ent, renderer, opts}) {
		const {
			htmlPtIsExcluded,
			htmlPtName,

			htmlPtEntries,
		} = this._getCommonHtmlParts({
			ent,
			renderer,
			opts,
		});

		return `
			${htmlPtIsExcluded}
			${htmlPtName}
			<tr><td colspan="6" class="pb-2 pt-0">${htmlPtEntries}</td></tr>
		`;
	}
}

class _RenderCompactSubclassesImplClassic extends _RenderCompactSubclassesImplBase {
	_style = "classic";
}

class _RenderCompactSubclassesImplOne extends _RenderCompactSubclassesImplBase {
	_style = "one";
}

Renderer.subclass = class {
	static _RENDER_CLASSIC = new _RenderCompactSubclassesImplClassic();
	static _RENDER_ONE = new _RenderCompactSubclassesImplOne();

	/**
	 * @param ent
	 * @param [opts]
	 * @param [opts.isEmbeddedEntity]
	 * @param [opts.isSkipNameRow]
	 */
	static getCompactRenderedString (ent, opts) {
		const styleHint = VetoolsConfig.get("styleSwitcher", "style");
		switch (styleHint) {
			case "classic": return this._RENDER_CLASSIC.getCompactRenderedString(ent, opts);
			case "one": return this._RENDER_ONE.getCompactRenderedString(ent, opts);
			default: throw new Error(`Unhandled style "${styleHint}"!`);
		}
	}

	static pGetFluff (sc) {
		return Renderer.utils.pGetFluff({
			entity: sc,
			fluffProp: "subclassFluff",
		});
	}
};

Renderer.classSubclass = class {
	static pGetFluff (clsOrSc) {
		if (clsOrSc.__prop === "subclass") return Renderer.subclass.pGetFluff(clsOrSc);
		return Renderer.class.pGetFluff(clsOrSc);
	}
};

/** @abstract */
class _RenderCompactSpellsImplBase extends _RenderCompactImplBase {
	_page = UrlUtil.PG_SPELLS;
	_dataProp = "spell";

	/**
	 * @param {object} ent
	 * @param {Renderer} renderer
	 * @param [opts]
	 * @param [opts.isEmbeddedEntity]
	 *
	 * @return {string}
	 */
	_getCompactRenderedString ({ent, renderer, opts}) {
		const {
			htmlPtIsExcluded,
			htmlPtName,

			htmlPtLevelSchoolRitual,

			htmlPtCastingTime,
			htmlPtRange,
			htmlPtComponents,
			htmlPtDuration,

			htmlPtEntriesFrom,
		} = this._getCommonHtmlParts({
			ent,
			renderer,
			opts,
		});

		return `
			${htmlPtIsExcluded}
			${htmlPtName}
			<tr><td colspan="6" class="pb-2">
				<div class="pb-2">${htmlPtLevelSchoolRitual}</div>
				<div class="ve-flex pb-2 w100">
					<div class="ve-flex-col ve-grow min-w-25 pr-2">
						<div>${htmlPtCastingTime}</div>
						<div>${htmlPtComponents}</div>
					</div>
					<div class="ve-flex-col ve-grow min-w-25">
						<div>${htmlPtRange}</div>
						<div>${htmlPtDuration}</div>
					</div>
				</div>
				${htmlPtEntriesFrom}
			</td></tr>
		`;
	}

	/* -------------------------------------------- */

	_getCommonHtmlParts (
		{
			ent,
			renderer,
			opts,
		},
	) {
		return {
			...super._getCommonHtmlParts({ent, renderer, opts}),

			htmlPtLevelSchoolRitual: this._getHtmlParts_levelSchoolRitual({ent}),

			htmlPtCastingTime: this._getHtmlParts_castingTime({ent}),
			htmlPtRange: this._getHtmlParts_range({ent}),
			htmlPtComponents: this._getHtmlParts_components({ent}),
			htmlPtDuration: this._getHtmlParts_duration({ent}),

			htmlPtEntriesFrom: this._getCommonHtmlParts_entriesFrom({ent, renderer}),
		};
	}

	/* ----- */

	_getHtmlParts_levelSchoolRitual ({ent}) {
		return Renderer.spell.getHtmlPtLevelSchoolRitual(ent, {styleHint: this._style});
	}

	/* ----- */

	_getHtmlParts_castingTime ({ent}) {
		return Renderer.spell.getHtmlPtCastingTime(ent, {styleHint: this._style});
	}

	_getHtmlParts_range ({ent}) {
		return Renderer.spell.getHtmlPtRange(ent, {styleHint: this._style, isDisplaySelfArea: SourceUtil.isClassicSource(ent.source)});
	}

	_getHtmlParts_components ({ent}) {
		return Renderer.spell.getHtmlPtComponents(ent);
	}

	_getHtmlParts_duration ({ent}) {
		return Renderer.spell.getHtmlPtDuration(ent, {styleHint: this._style});
	}

	/* ----- */

	_getCommonHtmlParts_entriesFrom ({ent, renderer}) {
		const stack = [];

		const entryList = {type: "entries", entries: ent.entries};
		renderer.recursiveRender(entryList, stack, {depth: 1});
		if (ent.entriesHigherLevel) {
			const higherLevelsEntryList = {type: "entries", entries: ent.entriesHigherLevel};
			renderer.recursiveRender(higherLevelsEntryList, stack, {depth: 2});
		}

		const fromClassList = Renderer.spell.getCombinedClasses(ent, "fromClassList");
		if (fromClassList.length) {
			const [current] = Parser.spClassesToCurrentAndLegacy(fromClassList);
			stack.push(`<div><span class="bold">Classes: </span>${Parser.spMainClassesToFull(current)}</div>`);
		}

		const fromClassListVariant = Renderer.spell.getCombinedClasses(ent, "fromClassListVariant");
		if (fromClassListVariant.length) {
			const [current, legacy] = Parser.spVariantClassesToCurrentAndLegacy(fromClassListVariant);
			stack.push(`<div><span class="bold" title="&quot;Optional&quot; spells may be added to a campaign by the DM. &quot;Variant&quot; spells are generally available, but may be made available to a class by the DM.">Optional/Variant Classes: </span>${Parser.spMainClassesToFull(current)}</div>`);
		}

		return stack.join("");
	}
}

class _RenderCompactSpellsImplClassic extends _RenderCompactSpellsImplBase {
	_style = "classic";
}

class _RenderCompactSpellsImplOne extends _RenderCompactSpellsImplBase {
	_style = "one";
}

Renderer.spell = class {
	static _RENDER_CLASSIC = new _RenderCompactSpellsImplClassic();
	static _RENDER_ONE = new _RenderCompactSpellsImplOne();

	/**
	 * @param ent
	 * @param [opts]
	 * @param [opts.isEmbeddedEntity]
	 */
	static getCompactRenderedString (ent, opts) {
		const styleHint = VetoolsConfig.get("styleSwitcher", "style");
		switch (styleHint) {
			case "classic": return this._RENDER_CLASSIC.getCompactRenderedString(ent, opts);
			case "one": return this._RENDER_ONE.getCompactRenderedString(ent, opts);
			default: throw new Error(`Unhandled style "${styleHint}"!`);
		}
	}

	/* -------------------------------------------- */

	static getHtmlPtLevelSchoolRitual (spell, {styleHint = null} = {}) {
		styleHint ||= VetoolsConfig.get("styleSwitcher", "style");
		return `<i>${Parser.spLevelSchoolMetaToFull(spell.level, spell.school, spell.meta, spell.subschools, {styleHint})}</i>`;
	}

	static getHtmlPtCastingTime (spell, {styleHint = null} = {}) {
		styleHint ||= VetoolsConfig.get("styleSwitcher", "style");
		return `<b>Casting Time:</b> ${Parser.spTimeListToFull(spell.time, spell.meta, {styleHint})}`;
	}

	static getHtmlPtRange (spell, {styleHint = null, isDisplaySelfArea = false} = {}) { return `<b>Range:</b> ${Parser.spRangeToFull(spell.range, {styleHint, isDisplaySelfArea})}`; }
	static getHtmlPtComponents (spell) { return `<b>Components:</b> ${Parser.spComponentsToFull(spell.components, spell.level)}`; }
	static getHtmlPtDuration (spell, {styleHint = null} = {}) { return `<b>Duration:</b> ${Parser.spDurationToFull(spell.duration, {styleHint})}`; }

	/* -------------------------------------------- */

	static _SpellSourceManager = class {
		_cache = null;

		populate ({brew, isForce = false}) {
			if (this._cache && !isForce) return;

			this._cache = {
				classes: {},

				groups: {},

				// region Unused
				races: {},
				backgrounds: {},
				feats: {},
				optionalfeatures: {},
				// endregion
			};

			// region Load homebrew class spell list addons
			// Two formats are available: a string UID, or "class" object (object with a `className`, etc.).
			(brew.class || [])
				.forEach(c => {
					c.source = c.source || Parser.SRC_PHB;

					(c.classSpells || [])
						.forEach(itm => {
							this._populate_fromClass_classSubclass({
								itm,
								className: c.name,
								classSource: c.source,
							});

							this._populate_fromClass_group({
								itm,
								className: c.name,
								classSource: c.source,
							});
						});
				});

			(brew.subclass || [])
				.forEach(sc => {
					sc.classSource = sc.classSource || Parser.SRC_PHB;
					sc.shortName = sc.shortName || sc.name;
					sc.source = sc.source || sc.classSource;

					(sc.subclassSpells || [])
						.forEach(itm => {
							this._populate_fromClass_classSubclass({
								itm,
								className: sc.className,
								classSource: sc.classSource,
								subclassShortName: sc.shortName,
								subclassName: sc.name,
								subclassSource: sc.source,
							});

							this._populate_fromClass_group({
								itm,
								className: sc.className,
								classSource: sc.classSource,
								subclassShortName: sc.shortName,
								subclassName: sc.name,
								subclassSource: sc.source,
							});
						});

					Object.entries(sc.subSubclassSpells || {})
						.forEach(([subSubclassName, arr]) => {
							arr
								.forEach(itm => {
									this._populate_fromClass_classSubclass({
										itm,
										className: sc.className,
										classSource: sc.classSource,
										subclassShortName: sc.shortName,
										subclassName: sc.name,
										subclassSource: sc.source,
										subSubclassName,
									});

									this._populate_fromClass_group({
										itm,
										className: sc.className,
										classSource: sc.classSource,
										subclassShortName: sc.shortName,
										subclassName: sc.name,
										subclassSource: sc.source,
										subSubclassName,
									});
								});
						});
				});
			// endregion

			(brew.spellList || [])
				.forEach(spellList => this._populate_fromGroup_group({spellList}));
		}

		_populate_fromClass_classSubclass (
			{
				itm,
				className,
				classSource,
				subclassShortName = null,
				subclassName = null,
				subclassSource = null,
				subSubclassName = null,
			},
		) {
			if (itm.groupName) return;

			// region Duplicate the spell list of another class/subclass/sub-subclass
			if (itm.className) {
				return this._populate_fromClass_doAdd({
					tgt: MiscUtil.getOrSet(
						this._cache.classes,
						"class",
						(itm.classSource || Parser.SRC_PHB).toLowerCase(),
						itm.className.toLowerCase(),
						{},
					),
					className,
					classSource,
					subclassShortName,
					subclassName,
					subclassSource,
					subSubclassName,
				});
			}
			// endregion

			// region Individual spell
			let [name, source] = `${itm}`.toLowerCase().split("|");
			source = source || Parser.SRC_PHB.toLowerCase();

			this._populate_fromClass_doAdd({
				tgt: MiscUtil.getOrSet(
					this._cache.classes,
					"spell",
					source,
					name,
					{fromClassList: [], fromSubclass: []},
				),
				className,
				classSource,
				subclassShortName,
				subclassName,
				subclassSource,
				subSubclassName,
			});
			// endregion
		}

		_populate_fromClass_doAdd (
			{
				tgt,
				className,
				classSource,
				subclassShortName,
				subclassName,
				subclassSource,
				subSubclassName,
				schools = null,
			},
		) {
			if (subclassShortName) {
				const toAdd = {
					class: {name: className, source: classSource},
					subclass: {name: subclassName || subclassShortName, shortName: subclassShortName, source: subclassSource},
				};
				if (subSubclassName) toAdd.subclass.subSubclass = subSubclassName;
				if (schools) toAdd.schools = schools;

				tgt.fromSubclass ||= [];
				tgt.fromSubclass.push(toAdd);
				return;
			}

			const toAdd = {name: className, source: classSource};
			if (schools) toAdd.schools = schools;

			tgt.fromClassList ||= [];
			tgt.fromClassList.push(toAdd);
		}

		_populate_fromClass_group (
			{
				itm,
				className,
				classSource,
				subclassShortName = null,
				subclassName = null,
				subclassSource = null,
				subSubclassName = null,
			},
		) {
			if (!itm.groupName) return;

			return this._populate_fromClass_doAdd({
				tgt: MiscUtil.getOrSet(
					this._cache.classes,
					"group",
					(itm.groupSource || Parser.SRC_PHB).toLowerCase(),
					itm.groupName.toLowerCase(),
					{},
				),
				className,
				classSource,
				subclassShortName,
				subclassName,
				subclassSource,
				subSubclassName,
				schools: itm.spellSchools,
			});
		}

		_populate_fromGroup_group (
			{
				spellList,
			},
		) {
			const spellListSourceLower = (spellList.source || "").toLowerCase();
			const spellListNameLower = (spellList.name || "").toLowerCase();

			spellList.spells
				.forEach(spell => {
					if (typeof spell === "string") {
						const {name, source} = DataUtil.proxy.unpackUid("spell", spell, "spell", {isLower: true});
						return MiscUtil.set(this._cache.groups, "spell", source, name, spellListSourceLower, spellListNameLower, {name: spellList.name, source: spellList.source});
					}

					// TODO(Future) implement "copy existing list"
					throw new Error(`Grouping spells based on other spell lists is not yet supported!`);
				});
		}

		/* -------------------------------------------- */

		mutateSpell ({spell: sp, lowName, lowSource}) {
			lowName = lowName || sp.name.toLowerCase();
			lowSource = lowSource || sp.source.toLowerCase();

			this._mutateSpell_brewGeneric({sp, lowName, lowSource, propSpell: "races", prop: "race"});
			this._mutateSpell_brewGeneric({sp, lowName, lowSource, propSpell: "backgrounds", prop: "background"});
			this._mutateSpell_brewGeneric({sp, lowName, lowSource, propSpell: "feats", prop: "feat"});
			this._mutateSpell_brewGeneric({sp, lowName, lowSource, propSpell: "optionalfeatures", prop: "optionalfeature"});
			this._mutateSpell_brewGroup({sp, lowName, lowSource});
			this._mutateSpell_brewClassesSubclasses({sp, lowName, lowSource});
		}

		_mutateSpell_brewClassesSubclasses ({sp, lowName, lowSource}) {
			if (!this._cache?.classes) return;

			if (this._cache.classes.spell?.[lowSource]?.[lowName]?.fromClassList?.length) {
				sp._tmpClasses.fromClassList ||= [];
				sp._tmpClasses.fromClassList.push(...this._cache.classes.spell[lowSource][lowName].fromClassList);
			}

			if (this._cache.classes.spell?.[lowSource]?.[lowName]?.fromSubclass?.length) {
				sp._tmpClasses.fromSubclass ||= [];
				sp._tmpClasses.fromSubclass.push(...this._cache.classes.spell[lowSource][lowName].fromSubclass);
			}

			if (this._cache.classes.class && sp.classes?.fromClassList) {
				(sp._tmpClasses ||= {}).fromClassList ||= [];

				// speed over safety
				for (const srcLower in this._cache.classes.class) {
					const searchForClasses = this._cache.classes.class[srcLower];

					for (const clsLowName in searchForClasses) {
						const spellHasClass = sp.classes?.fromClassList?.some(cls => (cls.source || "").toLowerCase() === srcLower && cls.name.toLowerCase() === clsLowName);
						if (!spellHasClass) continue;

						const fromDetails = searchForClasses[clsLowName];

						if (fromDetails.fromClassList) {
							sp._tmpClasses.fromClassList.push(...this._mutateSpell_getListFilteredBySchool({sp, arr: fromDetails.fromClassList}));
						}

						if (fromDetails.fromSubclass) {
							sp._tmpClasses.fromSubclass ||= [];
							sp._tmpClasses.fromSubclass.push(...this._mutateSpell_getListFilteredBySchool({sp, arr: fromDetails.fromSubclass}));
						}
					}
				}
			}

			if (this._cache.classes.group && (sp.groups?.length || sp._tmpGroups?.length)) {
				const groups = Renderer.spell.getCombinedGeneric(sp, {propSpell: "groups"});

				(sp._tmpClasses ||= {}).fromClassList ||= [];

				// speed over safety
				for (const srcLower in this._cache.classes.group) {
					const searchForGroups = this._cache.classes.group[srcLower];

					for (const groupLowName in searchForGroups) {
						const spellHasGroup = groups?.some(grp => (grp.source || "").toLowerCase() === srcLower && grp.name.toLowerCase() === groupLowName);
						if (!spellHasGroup) continue;

						const fromDetails = searchForGroups[groupLowName];

						if (fromDetails.fromClassList) {
							sp._tmpClasses.fromClassList.push(...this._mutateSpell_getListFilteredBySchool({sp, arr: fromDetails.fromClassList}));
						}

						if (fromDetails.fromSubclass) {
							sp._tmpClasses.fromSubclass ||= [];
							sp._tmpClasses.fromSubclass.push(...this._mutateSpell_getListFilteredBySchool({sp, arr: fromDetails.fromSubclass}));
						}
					}
				}
			}
		}

		_mutateSpell_getListFilteredBySchool ({arr, sp}) {
			return arr
				.filter(it => {
					if (!it.schools) return true;
					return it.schools.includes(sp.school);
				})
				.map(it => {
					if (!it.schools) return it;
					const out = MiscUtil.copyFast(it);
					delete it.schools;
					return it;
				});
		}

		_mutateSpell_brewGeneric ({sp, lowName, lowSource, propSpell, prop}) {
			if (!this._cache?.[propSpell]) return;

			const propTmp = `_tmp${propSpell.uppercaseFirst()}`;

			// If a precise spell has been specified
			if (this._cache[propSpell]?.spell?.[lowSource]?.[lowName]?.length) {
				(sp[propTmp] ||= [])
					.push(...this._cache[propSpell].spell[lowSource][lowName]);
			}

			// If we have a copy of an existing entity's spells
			if (this._cache?.[propSpell]?.[prop] && sp[propSpell]) {
				sp[propTmp] ||= [];

				// speed over safety
				outer: for (const srcLower in this._cache[propSpell][prop]) {
					const searchForExisting = this._cache[propSpell][prop][srcLower];

					for (const lowName in searchForExisting) {
						const spellHasEnt = sp[propSpell].some(it => (it.source || "").toLowerCase() === srcLower && it.name.toLowerCase() === lowName);
						if (!spellHasEnt) continue;

						const fromDetails = searchForExisting[lowName];

						sp[propTmp].push(...fromDetails);

						// Only add it once regardless of how many entities match
						break outer;
					}
				}
			}
		}

		_mutateSpell_brewGroup ({sp, lowName, lowSource}) {
			if (!this._cache?.groups) return;

			if (this._cache.groups.spell?.[lowSource]?.[lowName]) {
				Object.values(this._cache.groups.spell[lowSource][lowName])
					.forEach(bySource => {
						Object.values(bySource)
							.forEach(byName => {
								sp._tmpGroups.push(byName);
							});
					});
			}

			// TODO(Future) implement "copy existing list"
		}
	};

	static populatePrereleaseLookup (brew, {isForce = false} = {}) {
		Renderer.spell._spellSourceManagerPrerelease.populate({brew, isForce});
	}

	static populateBrewLookup (brew, {isForce = false} = {}) {
		Renderer.spell._spellSourceManagerBrew.populate({brew, isForce});
	}

	static prePopulateHover (data) {
		(data.spell || []).forEach(sp => Renderer.spell.initBrewSources(sp));
	}

	static prePopulateHoverPrerelease (data) {
		Renderer.spell.populatePrereleaseLookup(data);
	}

	static prePopulateHoverBrew (data) {
		Renderer.spell.populateBrewLookup(data);
	}

	/* -------------------------------------------- */

	static _BREW_SOURCES_TMP_PROPS = [
		"_tmpSourcesInit",
		"_tmpClasses",
		"_tmpRaces",
		"_tmpBackgrounds",
		"_tmpFeats",
		"_tmpOptionalfeatures",
		"_tmpGroups",
	];
	static uninitBrewSources (sp) {
		Renderer.spell._BREW_SOURCES_TMP_PROPS.forEach(prop => delete sp[prop]);
	}

	static initBrewSources (sp) {
		if (sp._tmpSourcesInit) return;
		sp._tmpSourcesInit = true;

		sp._tmpClasses = {};
		sp._tmpRaces = [];
		sp._tmpBackgrounds = [];
		sp._tmpFeats = [];
		sp._tmpOptionalfeatures = [];
		sp._tmpGroups = [];

		const lowName = sp.name.toLowerCase();
		const lowSource = sp.source.toLowerCase();

		for (const manager of [Renderer.spell._spellSourceManagerPrerelease, Renderer.spell._spellSourceManagerBrew]) {
			manager.mutateSpell({spell: sp, lowName, lowSource});
		}
	}

	static getCombinedClasses (sp, prop) {
		return [
			...((sp.classes || {})[prop] || []),
			...((sp._tmpClasses || {})[prop] || []),
		]
			.filter(it => {
				if (!ExcludeUtil.isInitialised) return true;

				switch (prop) {
					case "fromClassList":
					case "fromClassListVariant": {
						const hash = UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_CLASSES](it);
						if (ExcludeUtil.isExcluded(hash, "class", it.source, {isNoCount: true})) return false;

						if (prop !== "fromClassListVariant") return true;
						if (it.definedInSource) return !ExcludeUtil.isExcluded("*", "classFeature", it.definedInSource, {isNoCount: true});

						return true;
					}
					case "fromSubclass":
					case "fromSubclassVariant": {
						const hash = UrlUtil.URL_TO_HASH_BUILDER["subclass"]({
							name: it.subclass.name,
							shortName: it.subclass.shortName,
							source: it.subclass.source,
							className: it.class.name,
							classSource: it.class.source,
						});

						if (prop !== "fromSubclassVariant") return !ExcludeUtil.isExcluded(hash, "subclass", it.subclass.source, {isNoCount: true});
						if (it.class.definedInSource) return !Renderer.spell.isExcludedSubclassVariantSource({classDefinedInSource: it.class.definedInSource});

						return true;
					}
					default: throw new Error(`Unhandled prop "${prop}"`);
				}
			});
	}

	static isExcludedSubclassVariantSource ({classDefinedInSource, subclassDefinedInSource}) {
		return (classDefinedInSource != null && ExcludeUtil.isExcluded("*", "classFeature", classDefinedInSource, {isNoCount: true}))
			|| (subclassDefinedInSource != null && ExcludeUtil.isExcluded("*", "subclassFeature", subclassDefinedInSource, {isNoCount: true}));
	}

	static getCombinedGeneric (sp, {propSpell, prop = null}) {
		const propSpellTmp = `_tmp${propSpell.uppercaseFirst()}`;
		return [
			...(sp[propSpell] || []),
			...(sp[propSpellTmp] || []),
		]
			.filter(it => {
				if (!ExcludeUtil.isInitialised || !prop) return true;
				const hash = UrlUtil.URL_TO_HASH_BUILDER[prop](it);
				return !ExcludeUtil.isExcluded(hash, prop, it.source, {isNoCount: true});
			})
			.sort(SortUtil.ascSortGenericEntity.bind(SortUtil));
	}

	/* -------------------------------------------- */

	static pGetFluff (sp) {
		return Renderer.utils.pGetFluff({
			entity: sp,
			fluffProp: "spellFluff",
		});
	}
};

Renderer.spell._spellSourceManagerPrerelease = new Renderer.spell._SpellSourceManager();
Renderer.spell._spellSourceManagerBrew = new Renderer.spell._SpellSourceManager();

Renderer.condition = class {
	static getCompactRenderedString (ent) { return Renderer.conditionDisease.getCompactRenderedString(ent); }
	static pGetFluff (ent) { return Renderer.conditionDisease.pGetFluff(ent); }
};

Renderer.disease = class {
	static getCompactRenderedString (ent) { return Renderer.conditionDisease.getCompactRenderedString(ent); }
	static pGetFluff (ent) { return Renderer.conditionDisease.pGetFluff(ent); }
};

Renderer.status = class {
	static getCompactRenderedString (ent) { return Renderer.conditionDisease.getCompactRenderedString(ent); }
	static pGetFluff (ent) { return Renderer.conditionDisease.pGetFluff(ent); }
};

Renderer.conditionDisease = class {
	static getCompactRenderedString (ent) {
		const renderer = Renderer.get();

		const ptType = ent.type ? `<tr><td colspan="6" class="pb-2 pt-0">${renderer.render(`{@i ${ent.type}}`)}</td></tr>` : "";

		return `${Renderer.utils.getExcludedTr({entity: ent, dataProp: ent.__prop || ent._type, page: UrlUtil.PG_CONDITIONS_DISEASES})}
		${Renderer.utils.getNameTr(ent, {page: UrlUtil.PG_CONDITIONS_DISEASES})}
		${ptType}
		<tr><td colspan="6" class="pb-2">${renderer.render({entries: ent.entries})}</td></tr>`;
	}

	static pGetFluff (ent) {
		return Renderer.utils.pGetFluff({
			entity: ent,
			fluffProp: `${ent.__prop}Fluff`,
		});
	}
};

Renderer.background = class {
	static getCompactRenderedString (bg) {
		return Renderer.generic.getCompactRenderedString(
			bg,
			{
				dataProp: "background",
				page: UrlUtil.PG_BACKGROUNDS,
				isSkipPageRow: true,
			},
		);
	}

	static pGetFluff (bg) {
		return Renderer.utils.pGetFluff({
			entity: bg,
			fluffProp: "backgroundFluff",
		});
	}
};

Renderer.backgroundFeature = class {
	static getCompactRenderedString (ent) {
		return Renderer.generic.getCompactRenderedString(ent, {isSkipPageRow: true});
	}
};

/** @abstract */
class _RenderCompactOptionalfeaturesImplBase extends _RenderCompactImplBase {
	_page = UrlUtil.PG_OPT_FEATURES;
	_dataProp = "optionalfeature";

	/* -------------------------------------------- */

	_getCommonHtmlParts (
		{
			ent,
			renderer,
			opts,
		},
	) {
		return {
			...super._getCommonHtmlParts({ent, renderer, opts}),

			htmlPtCost: this._getCommonHtmlParts_cost({ent}),

			htmlPtEntries: this._getCommonHtmlParts_entries({ent, renderer}),

			htmlPtPreviouslyPrinted: this._getCommonHtmlParts_previouslyPrinted({ent}),

			htmlPtFeatureType: this._getCommonHtmlParts_featureType({ent, renderer}),
		};
	}

	/* ----- */

	_getCommonHtmlParts_cost ({ent}) {
		const ptCost = Renderer.optionalfeature.getCostHtml(ent);
		return ptCost ? `<div>${ptCost}</div>` : "";
	}

	/* ----- */

	_getCommonHtmlParts_entries ({ent, renderer}) {
		return renderer.render({entries: ent.entries}, 1);
	}

	/* ----- */

	_getCommonHtmlParts_previouslyPrinted ({ent}) {
		return Renderer.optionalfeature.getPreviouslyPrintedText(ent);
	}

	/* ----- */

	_getCommonHtmlParts_featureType ({ent, renderer}) {
		return `<tr><td colspan="6" class="pb-2">${renderer.render(Renderer.optionalfeature.getTypeEntry(ent))}</td></tr>`;
	}

	/* -------------------------------------------- */

	_getCompactRenderedString ({ent, renderer, opts}) {
		const {
			htmlPtIsExcluded,
			htmlPtName,

			htmlPtPrerequisites,

			htmlPtCost,

			htmlPtEntries,

			htmlPtPreviouslyPrinted,

			htmlPtFeatureType,
		} = this._getCommonHtmlParts({
			ent,
			renderer,
			opts,
		});

		const ptHeader = htmlPtPrerequisites || htmlPtCost ? `<tr><td colspan="6" class="pb-2 pt-0">
			${htmlPtPrerequisites}
			${htmlPtCost}
		</td></tr>` : "";

		return `
			${htmlPtIsExcluded}
			${htmlPtName}
			${ptHeader}
			<tr><td colspan="6" class="pb-2 ${ptHeader ? "" : "pt-0"}">
				${htmlPtEntries}
			</td></tr>
			${htmlPtPreviouslyPrinted}
			${htmlPtFeatureType}
		`;
	}
}

class _RenderCompactOptionalfeaturesImplClassic extends _RenderCompactOptionalfeaturesImplBase {
	_style = "classic";
}

class _RenderCompactOptionalfeaturesImplOne extends _RenderCompactOptionalfeaturesImplBase {
	_style = "one";
}

Renderer.optionalfeature = class {
	static getListPrerequisiteLevelText (prerequisites) {
		if (!prerequisites || !prerequisites.some(it => it.level)) return "\u2014";
		const levelPart = prerequisites.find(it => it.level).level;
		return levelPart.level || levelPart;
	}

	/* -------------------------------------------- */

	static getPreviouslyPrintedEntry (ent) {
		if (!ent.previousVersion) return null;
		return `{@i An earlier version of this ${ent.featureType.map(t => Parser.optFeatureTypeToFull(t)).join("/")} is available in }${Parser.sourceJsonToFull(ent.previousVersion.source)} {@i as {@optfeature ${ent.previousVersion.name}|${ent.previousVersion.source}}.}`;
	}

	static getTypeEntry (ent) {
		return `{@note Type: ${Renderer.optionalfeature.getTypeText(ent)}}`;
	}

	static getCostEntry (ent) {
		if (!ent.consumes?.name) return null;

		const ptPrefix = "Cost: ";
		const tksUnit = ent.consumes.name
			.split(" ")
			.map(it => it.trim())
			.filter(Boolean);
		const amtMax = ent.consumes.amountMax ?? ent.consumes.amount;
		tksUnit.last(tksUnit.last()[amtMax != null && amtMax !== 1 ? "toPlural" : "toString"]());
		const ptUnit = ` ${tksUnit.join(" ")}`;

		if (ent.consumes?.amountMin != null && ent.consumes?.amountMax != null) return `{@i ${ptPrefix}${ent.consumes.amountMin}\u2013${ent.consumes.amountMax}${ptUnit}}`;
		return `{@i ${ptPrefix}${ent.consumes.amount ?? 1}${ptUnit}}`;
	}

	/* -------------------------------------------- */

	static getPreviouslyPrintedText (ent) {
		const entry = Renderer.optionalfeature.getPreviouslyPrintedEntry(ent);
		if (!entry) return "";
		return `<tr><td colspan="6"><p class="mt-2">${Renderer.get().render(entry)}</p></td></tr>`;
	}

	static getTypeText (ent) {
		const commonPrefix = ent.featureType.length > 1 ? MiscUtil.findCommonPrefix(ent.featureType.map(fs => Parser.optFeatureTypeToFull(fs)), {isRespectWordBoundaries: true}) : "";

		return [
			commonPrefix.trim() || null,
			ent.featureType.map(ft => Parser.optFeatureTypeToFull(ft).substring(commonPrefix.length)).join("/"),
		]
			.filter(Boolean).join(" ");
	}

	static getCostHtml (ent) {
		const entry = Renderer.optionalfeature.getCostEntry(ent);
		if (!entry) return "";

		return Renderer.get().render(entry);
	}

	/* -------------------------------------------- */

	static _RENDER_CLASSIC = new _RenderCompactOptionalfeaturesImplClassic();
	static _RENDER_ONE = new _RenderCompactOptionalfeaturesImplOne();

	/**
	 * @param ent
	 * @param [opts]
	 * @param [opts.isEmbeddedEntity]
	 * @param [opts.isSkipNameRow]
	 */
	static getCompactRenderedString (ent, opts) {
		const styleHint = VetoolsConfig.get("styleSwitcher", "style");
		switch (styleHint) {
			case "classic": return this._RENDER_CLASSIC.getCompactRenderedString(ent, opts);
			case "one": return this._RENDER_ONE.getCompactRenderedString(ent, opts);
			default: throw new Error(`Unhandled style "${styleHint}"!`);
		}
	}

	/* -------------------------------------------- */

	static pGetFluff (ent) {
		return Renderer.utils.pGetFluff({
			entity: ent,
			fluffProp: "optionalfeatureFluff",
		});
	}
};

Renderer.reward = class {
	static getRewardRenderableEntriesMeta (ent) {
		const ptSubtitle = [
			(ent.type || "").toTitleCase(),
			ent.rarity ? ent.rarity.toTitleCase() : "",
		]
			.filter(Boolean)
			.join(", ");

		return {
			entriesContent: [
				ptSubtitle ? `{@i ${ptSubtitle}}` : "",
				...ent.entries,
			]
				.filter(Boolean),
		};
	}

	static getRenderedString (ent) {
		const entriesMeta = Renderer.reward.getRewardRenderableEntriesMeta(ent);
		return `<tr><td colspan="6" class="pb-2">${Renderer.get().setFirstSection(true).render({entries: entriesMeta.entriesContent}, 1)}</td></tr>`;
	}

	static getCompactRenderedString (ent) {
		return `
			${Renderer.utils.getExcludedTr({entity: ent, dataProp: "reward", page: UrlUtil.PG_REWARDS})}
			${Renderer.utils.getNameTr(ent, {page: UrlUtil.PG_REWARDS})}
			${Renderer.reward.getRenderedString(ent)}
		`;
	}

	static pGetFluff (ent) {
		return Renderer.utils.pGetFluff({
			entity: ent,
			fluffProp: "rewardFluff",
		});
	}
};

Renderer.race = class {
	static getRaceRenderableEntriesMeta (ent, {styleHint = null} = {}) {
		styleHint ||= VetoolsConfig.get("styleSwitcher", "style");

		const entsAttributes = [
			ent.abilityEntry || (ent.ability ? {type: "item", name: "Ability Scores:", entry: Renderer.getAbilityData(ent.ability).asText} : null),
			ent.creatureTypesEntry || (this._getRaceRenderableEntriesMeta_creatureType({ent, styleHint})),
			ent.sizeEntry || (ent.size ? {type: "item", name: "Size:", entry: Renderer.utils.getRenderedSize(ent.size || [Parser.SZ_VARIES])} : null),
			ent.speedEntry || (ent.speed != null ? {type: "item", name: "Speed:", entry: Parser.getSpeedString(ent, {isLongForm: true})} : null),
		]
			.filter(Boolean);

		return {
			entryAttributes: entsAttributes.length
				? {type: "list", style: "list-hang-notitle", items: entsAttributes}
				: null,
			entryMain: ent._isBaseRace
				? {type: "entries", entries: ent._baseRaceEntries}
				: {type: "entries", entries: ent.entries},
		};
	}

	static _getRaceRenderableEntriesMeta_creatureType ({ent, styleHint}) {
		const types = ent.creatureTypes || [Parser.TP_HUMANOID];

		if (styleHint !== "classic") return {type: "item", name: "Creature Type:", entry: Parser.raceCreatureTypesToFull(types)};

		const typesFilt = (ent.creatureTypes || []).filter(it => `${it}`.toLowerCase() !== Parser.TP_HUMANOID);
		if (!typesFilt.length) return null;
		return {type: "item", name: "Creature Type:", entry: Parser.raceCreatureTypesToFull(typesFilt)};
	}

	/* -------------------------------------------- */

	static getCompactRenderedString (ent, {isStatic = false} = {}) {
		const styleHint = VetoolsConfig.get("styleSwitcher", "style");

		const renderer = Renderer.get().setFirstSection(true);
		const renderStack = [];

		const entriesMeta = Renderer.race.getRaceRenderableEntriesMeta(ent, {styleHint});

		renderStack.push(`
			${Renderer.utils.getExcludedTr({entity: ent, dataProp: "race", page: UrlUtil.PG_RACES})}
			${Renderer.utils.getNameTr(ent, {page: UrlUtil.PG_RACES})}
			<tr><td colspan="6" class="pb-2 pt-0">
		`);
		if (entriesMeta.entryAttributes) renderer.recursiveRender(entriesMeta.entryAttributes, renderStack, {depth: 1});
		renderer.recursiveRender(entriesMeta.entryMain, renderStack, {depth: 1});

		const ptHeightWeight = Renderer.race.getHeightAndWeightPart(ent, {isStatic});
		if (ptHeightWeight) renderStack.push(`<hr class="rd__hr">${ptHeightWeight}`);
		renderStack.push("</td></tr>");

		return renderStack.join("");
	}

	/* -------------------------------------------- */

	static getRenderedSize (race) {
		return (race.size || [Parser.SZ_VARIES]).map(sz => Parser.sizeAbvToFull(sz)).join("/");
	}

	static getHeightAndWeightPart (race, {isStatic = false} = {}) {
		if (!race.heightAndWeight) return null;
		if (race._isBaseRace) return null;
		return Renderer.get().render({entries: Renderer.race.getHeightAndWeightEntries(race, {isStatic})});
	}

	static getHeightAndWeightEntries (race, {isStatic = false} = {}) {
		const colLabels = ["Base Height", "Base Weight", "Height Modifier", "Weight Modifier"];
		const colStyles = ["col-2-3 text-center", "col-2-3 text-center", "col-2-3 text-center", "col-2 text-center"];

		const cellHeightMod = !isStatic
			? `+<span data-race-heightmod="true">${race.heightAndWeight.heightMod}</span>`
			: `+${race.heightAndWeight.heightMod}`;
		const cellWeightMod = !isStatic
			? `× <span data-race-weightmod="true">${race.heightAndWeight.weightMod || "1"}</span> lb.`
			: `× ${race.heightAndWeight.weightMod || "1"} lb.`;

		const row = [
			Renderer.race.getRenderedHeight(race.heightAndWeight.baseHeight),
			`${race.heightAndWeight.baseWeight} lb.`,
			cellHeightMod,
			cellWeightMod,
		];

		if (!isStatic) {
			colLabels.push("");
			colStyles.push("ve-col-3-1 text-center");
			row.push(`<div class="ve-flex-vh-center">
				<div class="ve-hidden race__disp-result-height-weight ve-flex-v-baseline">
					<div class="mr-1">=</div>
					<div class="race__disp-result-height"></div>
					<div class="mr-2">; </div>
					<div class="race__disp-result-weight mr-1"></div>
					<div class="small">lb.</div>
				</div>
				<button class="ve-btn ve-btn-default ve-btn-xs my-1 race__btn-roll-height-weight">Roll</button>
			</div>`);
		}

		return [
			"You may roll for your character's height and weight on the Random Height and Weight table. The roll in the Height Modifier column adds a number (in inches) to the character's base height. To get a weight, multiply the number you rolled for height by the roll in the Weight Modifier column and add the result (in pounds) to the base weight.",
			{
				type: "table",
				caption: "Random Height and Weight",
				colLabels,
				colStyles,
				rows: [row],
			},
		];
	}

	static getRenderedHeight (height) {
		const heightFeet = Number(Math.floor(height / 12).toFixed(3));
		const heightInches = Number((height % 12).toFixed(3));
		return `${heightFeet ? `${heightFeet}'` : ""}${heightInches ? `${heightInches}"` : ""}`;
	}

	/**
	 * @param races
	 * @param [opts] Options object.
	 * @param [opts.isAddBaseRaces] If an entity should be created for each base race.
	 */
	static mergeSubraces (races, opts) {
		opts = opts || {};

		const out = [];
		races.forEach(race => {
			// FIXME(Deprecated) Backwards compatibility for old race data; remove at some point
			if (race.size && typeof race.size === "string") race.size = [race.size];

			if (
				race.lineage
				// Ignore `"lineage": true`, as it is only used for filters
				&& race.lineage !== true
				// Only generate ability/language data on legacy entries
				&& (race.edition === "classic" || race.edition == null)
			) {
				race = MiscUtil.copyFast(race);

				if (race.lineage === "VRGR") {
					race.ability = race.ability || [
						{
							choose: {
								weighted: {
									from: [...Parser.ABIL_ABVS],
									weights: [2, 1],
								},
							},
						},
						{
							choose: {
								weighted: {
									from: [...Parser.ABIL_ABVS],
									weights: [1, 1, 1],
								},
							},
						},
					];
				} else if (race.lineage === "UA1") {
					race.ability = race.ability || [
						{
							choose: {
								weighted: {
									from: [...Parser.ABIL_ABVS],
									weights: [2, 1],
								},
							},
						},
					];
				}

				race.entries = race.entries || [];
				race.entries.push({
					type: "entries",
					name: "Languages",
					entries: ["You can speak, read, and write Common and one other language that you and your DM agree is appropriate for your character."],
				});

				race.languageProficiencies = race.languageProficiencies || [{"common": true, "anyStandard": 1}];
			}

			if (race.subraces && !race.subraces.length) delete race.subraces;

			if (race.subraces) {
				race.subraces.forEach(sr => {
					sr.source = sr.source || race.source;
					sr._isSubRace = true;
				});

				race.subraces.sort((a, b) => SortUtil.ascSortLower(a.name || "_", b.name || "_") || SortUtil.ascSortLower(Parser.sourceJsonToAbv(a.source), Parser.sourceJsonToAbv(b.source)));
			}

			if (opts.isAddBaseRaces && race.subraces) {
				const baseRace = MiscUtil.copyFast(race);

				baseRace._isBaseRace = true;

				const isAnyNoName = race.subraces.some(it => !it.name);
				if (isAnyNoName) {
					baseRace._rawName = baseRace.name;
					baseRace.name = `${baseRace.name} (Base)`;
				}

				const nameCounts = {};
				race.subraces.filter(sr => sr.name).forEach(sr => nameCounts[sr.name.toLowerCase()] = (nameCounts[sr.name.toLowerCase()] || 0) + 1);
				nameCounts._ = race.subraces.filter(sr => !sr.name).length;

				const lst = {
					type: "list",
					items: race.subraces.map(sr => {
						const count = nameCounts[(sr.name || "_").toLowerCase()];
						const idName = Renderer.race.getSubraceName(race.name, sr.name);
						return `{@race ${idName}|${sr.source}${count > 1 ? `|${idName} (<span title="${Parser.sourceJsonToFull(sr.source).escapeQuotes()}">${Parser.sourceJsonToAbv(sr.source)}</span>)` : ""}}`;
					}),
				};

				Renderer.race._mutBaseRaceEntries(baseRace, lst);
				baseRace._subraces = race.subraces.map(sr => ({name: Renderer.race.getSubraceName(race.name, sr.name), source: sr.source}));

				delete baseRace.subraces;

				out.push(baseRace);
			}

			out.push(...Renderer.race._mergeSubraces(race));
		});

		return out;
	}

	static _mutMakeBaseRace (baseRace) {
		if (baseRace._isBaseRace) return;

		baseRace._isBaseRace = true;

		Renderer.race._mutBaseRaceEntries(baseRace, {type: "list", items: []});
	}

	static _mutBaseRaceEntries (baseRace, lst) {
		baseRace._baseRaceEntries = [
			{
				type: "section",
				entries: [
					"This race has multiple subraces, as listed below:",
					lst,
				],
			},
			...baseRace.entries
				? [
					{
						type: "section",
						entries: [
							{
								type: "entries",
								entries: [
									{
										type: "entries",
										name: "Traits",
										entries: [
											...MiscUtil.copyFast(baseRace.entries),
										],
									},
								],
							},
						],
					},
				]
				: [],
		];
	}

	static getSubraceName (raceName, subraceName) {
		if (!subraceName) return raceName;

		const mBrackets = /^(.*?)(\(.*?\))$/i.exec(raceName || "");
		if (!mBrackets) return `${raceName} (${subraceName})`;

		const bracketPart = mBrackets[2].substring(1, mBrackets[2].length - 1);
		return `${mBrackets[1]}(${[bracketPart, subraceName].join("; ")})`;
	}

	static _mergeSubraces (race) {
		if (!race.subraces) return [race];
		return MiscUtil.copyFast(race.subraces).map(s => Renderer.race._getMergedSubrace(race, s));
	}

	static _getMergedSubrace (race, cpySr) {
		const cpy = MiscUtil.copyFast(race);
		cpy._baseName = cpy.name;
		cpy._baseSource = cpy.source;
		cpy._baseSrd = cpy.srd;
		cpy._baseSrd52 = cpy.srd52;
		cpy._baseBasicRules = cpy.basicRules;
		cpy._baseFreeRules2024 = cpy.basicRules2024;
		delete cpy.subraces;
		delete cpy.srd;
		delete cpy.srd52;
		delete cpy.basicRules;
		delete cpy.basicRules2024;
		delete cpy._versions;
		delete cpy.hasFluff;
		delete cpy.hasFluffImages;
		delete cpy.reprintedAs;
		delete cpySr.__prop;

		// merge names, abilities, entries, tags
		if (cpySr.name) {
			cpy._subraceName = cpySr.name;

			cpy.name = Renderer.race.getSubraceName(cpy.name, cpySr.name);
			delete cpySr.name;
		}
		if (cpySr.ability) {
			// If the base race doesn't have any ability scores, make a set of empty records
			if ((cpySr.overwrite && cpySr.overwrite.ability) || !cpy.ability) cpy.ability = cpySr.ability.map(() => ({}));

			if (cpy.ability.length !== cpySr.ability.length) throw new Error(`"race" and "subrace" ability array lengths did not match!`);
			cpySr.ability.forEach((obj, i) => Object.assign(cpy.ability[i], obj));
			delete cpySr.ability;
		}
		if (cpySr.entries) {
			cpySr.entries.forEach(ent => {
				if (!ent.data?.overwrite) return cpy.entries.push(ent);

				const toOverwrite = cpy.entries.findIndex(it => it.name?.toLowerCase()?.trim() === ent.data.overwrite.toLowerCase().trim());
				if (~toOverwrite) cpy.entries[toOverwrite] = ent;
				else cpy.entries.push(ent);
			});
			delete cpySr.entries;
		}

		if (cpySr.traitTags) {
			if (cpySr.overwrite && cpySr.overwrite.traitTags) cpy.traitTags = cpySr.traitTags;
			else cpy.traitTags = (cpy.traitTags || []).concat(cpySr.traitTags);
			delete cpySr.traitTags;
		}

		if (cpySr.languageProficiencies) {
			if (cpySr.overwrite && cpySr.overwrite.languageProficiencies) cpy.languageProficiencies = cpySr.languageProficiencies;
			else cpy.languageProficiencies = cpy.languageProficiencies = (cpy.languageProficiencies || []).concat(cpySr.languageProficiencies);
			delete cpySr.languageProficiencies;
		}

		// TODO make a generalised merge system? Probably have one of those lying around somewhere [bestiary schema?]
		if (cpySr.skillProficiencies) {
			// Overwrite if possible
			if (!cpy.skillProficiencies || (cpySr.overwrite && cpySr.overwrite["skillProficiencies"])) cpy.skillProficiencies = cpySr.skillProficiencies;
			else {
				if (!cpySr.skillProficiencies.length || !cpy.skillProficiencies.length) throw new Error(`No items!`);
				if (cpySr.skillProficiencies.length > 1 || cpy.skillProficiencies.length > 1) throw new Error(`Merging "subrace" does not handle choices!`); // Implement if required

				// Otherwise, merge
				if (cpySr.skillProficiencies.choose) {
					if (cpy.skillProficiencies.choose) throw new Error(`Merging "subrace" choose is not supported!!`); // Implement if required
					cpy.skillProficiencies.choose = cpySr.skillProficiencies.choose;
					delete cpySr.skillProficiencies.choose;
				}
				Object.assign(cpy.skillProficiencies[0], cpySr.skillProficiencies[0]);
			}

			delete cpySr.skillProficiencies;
		}

		// overwrite everything else
		Object.assign(cpy, cpySr);

		// For any null'd out fields on the subrace, delete the field
		Object.entries(cpy)
			.forEach(([k, v]) => {
				if (v != null) return;
				delete cpy[k];
			});

		return cpy;
	}

	static adoptSubraces (allRaces, subraces) {
		const nxtData = [];

		subraces.forEach(sr => {
			if (!sr.raceName || !sr.raceSource) throw new Error(`Adopted "subrace" was missing parent "raceName" and/or "raceSource"!`);

			const _baseRace = allRaces.find(r => r.name === sr.raceName && r.source === sr.raceSource);
			if (!_baseRace) throw new Error(`Could not find parent race for subrace "${sr.name}" (${sr.source})!`);

			// Avoid adding duplicates, by tracking already-seen subraces
			if ((_baseRace._seenSubraces || []).some(it => it.name === sr.name && it.source === sr.source)) return;
			(_baseRace._seenSubraces = _baseRace._seenSubraces || []).push({name: sr.name, source: sr.source});

			// If this is a prerelease/homebrew "base race" which is not marked as such, upgrade it to a base race
			if (
				!_baseRace._isBaseRace
				&& (PrereleaseUtil.hasSourceJson(_baseRace.source) || BrewUtil2.hasSourceJson(_baseRace.source))
			) {
				Renderer.race._mutMakeBaseRace(_baseRace);
			}

			// If the base race is a _real_ base race, add our new subrace to its list of subraces
			if (_baseRace._isBaseRace) {
				const subraceListEntry = ((_baseRace._baseRaceEntries[0] || {}).entries || []).find(it => it.type === "list");
				subraceListEntry.items.push(`{@race ${_baseRace._rawName || _baseRace.name} (${sr.name})|${sr.source || _baseRace.source}}`);
			}

			// Attempt to graft multiple subraces from the same data set onto the same base race copy
			let baseRace = nxtData.find(r => r.name === sr.raceName && r.source === sr.raceSource);
			if (!baseRace) {
				// copy and remove base-race-specific data
				baseRace = MiscUtil.copyFast(_baseRace);
				if (baseRace._rawName) {
					baseRace.name = baseRace._rawName;
					delete baseRace._rawName;
				}
				delete baseRace._isBaseRace;
				delete baseRace._baseRaceEntries;

				nxtData.push(baseRace);
			}

			baseRace.subraces = baseRace.subraces || [];
			baseRace.subraces.push(sr);
		});

		return nxtData;
	}

	static bindListenersHeightAndWeight (race, ele) {
		if (!race.heightAndWeight) return;
		if (race._isBaseRace) return;

		const $render = $(ele);

		const $dispResult = $render.find(`.race__disp-result-height-weight`);
		const $dispHeight = $render.find(`.race__disp-result-height`);
		const $dispWeight = $render.find(`.race__disp-result-weight`);

		const lock = new VeLock();
		let hasRolled = false;
		let resultHeight;
		let resultWeightMod;

		const $btnRollHeight = $render
			.find(`[data-race-heightmod="true"]`)
			.html(race.heightAndWeight.heightMod)
			.addClass("roller")
			.mousedown(evt => evt.preventDefault())
			.click(async () => {
				try {
					await lock.pLock();

					if (!hasRolled) return pDoFullRoll(true);
					await pRollHeight();
					updateDisplay();
				} finally {
					lock.unlock();
				}
			});

		const isWeightRoller = race.heightAndWeight.weightMod && isNaN(race.heightAndWeight.weightMod);
		const $btnRollWeight = $render
			.find(`[data-race-weightmod="true"]`)
			.html(isWeightRoller ? `(<span class="roller">${race.heightAndWeight.weightMod}</span>)` : race.heightAndWeight.weightMod || "1")
			.click(async () => {
				try {
					await lock.pLock();

					if (!hasRolled) return pDoFullRoll(true);
					await pRollWeight();
					updateDisplay();
				} finally {
					lock.unlock();
				}
			});
		if (isWeightRoller) $btnRollWeight.mousedown(evt => evt.preventDefault());

		const $btnRoll = $render
			.find(`button.race__btn-roll-height-weight`)
			.click(async () => pDoFullRoll());

		const pRollHeight = async () => {
			const mResultHeight = await Renderer.dice.pRoll2(race.heightAndWeight.heightMod, {
				isUser: false,
				label: "Height Modifier",
				name: race.name,
			});
			if (mResultHeight == null) return;
			resultHeight = mResultHeight;
		};

		const pRollWeight = async () => {
			const weightModRaw = race.heightAndWeight.weightMod || "1";
			const mResultWeightMod = isNaN(weightModRaw) ? await Renderer.dice.pRoll2(weightModRaw, {
				isUser: false,
				label: "Weight Modifier",
				name: race.name,
			}) : Number(weightModRaw);
			if (mResultWeightMod == null) return;
			resultWeightMod = mResultWeightMod;
		};

		const updateDisplay = () => {
			const renderedHeight = Renderer.race.getRenderedHeight(race.heightAndWeight.baseHeight + resultHeight);
			const totalWeight = race.heightAndWeight.baseWeight + (resultWeightMod * resultHeight);
			$dispHeight.text(renderedHeight);
			$dispWeight.text(Number(totalWeight.toFixed(3)));
		};

		const pDoFullRoll = async isPreLocked => {
			try {
				if (!isPreLocked) await lock.pLock();

				$btnRoll.parent().removeClass(`ve-flex-vh-center`).addClass(`split-v-center`);
				await pRollHeight();
				await pRollWeight();
				$dispResult.removeClass(`ve-hidden`);
				updateDisplay();

				hasRolled = true;
			} finally {
				if (!isPreLocked) lock.unlock();
			}
		};
	}

	static bindListenersCompact (race, ele) {
		Renderer.race.bindListenersHeightAndWeight(race, ele);
	}

	static pGetFluff (race) {
		return Renderer.utils.pGetFluff({
			entity: race,
			fluffProp: "raceFluff",
		});
	}
};

Renderer.raceFeature = class {
	static getCompactRenderedString (ent) {
		return Renderer.generic.getCompactRenderedString(ent, {isSkipPageRow: true});
	}
};

Renderer.deity = class {
	static _BASE_PART_TRANSLATORS = {
		"alignment": {
			name: "Alignment",
			displayFn: (it) => it.map(a => Parser.alignmentAbvToFull(a)).join(" ").toTitleCase(),
		},
		"pantheon": {
			name: "Pantheon",
		},
		"category": {
			name: "Category",
			displayFn: it => typeof it === "string" ? it : it.join(", "),
		},
		"domains": {
			name: "Domains",
			displayFn: (it) => it.join(", "),
		},
		"province": {
			name: "Province",
		},
		"dogma": {
			name: "Dogma",
		},
		"altNames": {
			name: "Alternate Names",
			displayFn: (it) => it.join(", "),
		},
		"plane": {
			name: "Home Plane",
		},
		"worshipers": {
			name: "Typical Worshipers",
		},
		"symbol": {
			name: "Symbol",
		},
		"favoredWeapons": {
			name: "Favored Weapons",
		},
	};

	static getDeityRenderableEntriesMeta (ent) {
		return {
			entriesAttributes: [
				...Object.entries(Renderer.deity._BASE_PART_TRANSLATORS)
					.map(([prop, {name, displayFn}]) => {
						if (ent[prop] == null) return null;

						const displayVal = displayFn ? displayFn(ent[prop]) : ent[prop];
						return {
							name,
							entry: `{@b ${name}:} ${displayVal}`,
						};
					})
					.filter(Boolean),
				...Object.entries(ent.customProperties || {})
					.map(([name, val]) => ({
						name,
						entry: `{@b ${name}:} ${val}`,
					})),
			]
				.sort(({name: nameA}, {name: nameB}) => SortUtil.ascSortLower(nameA, nameB))
				.map(({entry}) => entry),
		};
	}

	static getCompactRenderedString (ent) {
		const renderer = Renderer.get();
		const entriesMeta = Renderer.deity.getDeityRenderableEntriesMeta(ent);
		return `
			${Renderer.utils.getExcludedTr({entity: ent, dataProp: "deity", page: UrlUtil.PG_DEITIES})}
			${Renderer.utils.getNameTr(ent, {suffix: ent.title ? `, ${ent.title.toTitleCase()}` : "", page: UrlUtil.PG_DEITIES})}
			<tr><td colspan="6">
				${entriesMeta.entriesAttributes.map(entry => `<div class="my-1p">${Renderer.get().render(entry)}</div>`).join("")}
			</td>
			${ent.entries ? `<tr><td colspan="6"><div class="ve-tbl-border ve-tbl-border--small"></div></td></tr><tr><td colspan="6">${renderer.render({entries: ent.entries}, 1)}</td></tr>` : ""}
		`;
	}
};

Renderer.object = class {
	static CHILD_PROPS = ["actionEntries"];

	/* -------------------------------------------- */

	static RENDERABLE_ENTRIES_PROP_ORDER__ATTRIBUTES = [
		"entryCreatureCapacity",
		"entryCargoCapacity",
		"entryArmorClass",
		"entryHitPoints",
		"entrySpeed",
		"entryAbilityScores",
		"entryDamageImmunities",
		"entryDamageResistances",
		"entryDamageVulnerabilities",
		"entryConditionImmunities",
		"entrySenses",
	];

	static getObjectRenderableEntriesMeta (ent) {
		return {
			entrySize: `{@i ${ent.objectType !== "GEN" ? `${Renderer.utils.getRenderedSize(ent.size)} ${ent.creatureType ? Parser.monTypeToFullObj(ent.creatureType).asText : "object"}` : `Variable size object`}}`,

			entryCreatureCapacity: ent.capCrew != null || ent.capPassenger != null
				? `{@b Creature Capacity:} ${Renderer.vehicle.getShipCreatureCapacity(ent)}`
				: null,
			entryCargoCapacity: ent.capCargo != null
				? `{@b Cargo Capacity:} ${Renderer.vehicle.getShipCargoCapacity(ent)}`
				: null,
			entryArmorClass: ent.ac != null
				? `{@b Armor Class:} ${ent.ac.special ?? ent.ac}`
				: null,
			entryHitPoints: ent.hp != null
				? `{@b Hit Points:} ${ent.hp.special ?? ent.hp}`
				: null,
			entrySpeed: ent.speed != null
				? `{@b Speed:} ${Parser.getSpeedString(ent)}`
				: null,
			entryAbilityScores: Parser.ABIL_ABVS.some(ab => ent[ab] != null)
				? `{@b Ability Scores:} ${Parser.ABIL_ABVS.filter(ab => ent[ab] != null).map(ab => `${ab.toUpperCase()}\u00A0${Renderer.utils.getAbilityRollerEntry(ent, ab)}`).join(", ")}`
				: null,
			entryDamageImmunities: ent.immune != null
				? `{@b Damage Immunities:} ${Parser.getFullImmRes(ent.immune)}`
				: null,
			entryDamageResistances: ent.resist
				? `{@b Damage Resistances:} ${Parser.getFullImmRes(ent.resist)}`
				: null,
			entryDamageVulnerabilities: ent.vulnerable
				? `{@b Damage Vulnerabilities:} ${Parser.getFullImmRes(ent.vulnerable)}`
				: null,
			entryConditionImmunities: ent.conditionImmune
				? `{@b Condition Immunities:} ${Parser.getFullCondImm(ent.conditionImmune, {isEntry: true})}`
				: null,
			entrySenses: ent.senses
				? `{@b Senses:} ${Renderer.utils.getSensesEntry(ent.senses)}`
				: null,
		};
	}

	/* -------------------------------------------- */

	static getCompactRenderedString (obj, opts) {
		return Renderer.object.getRenderedString(obj, opts);
	}

	static getRenderedString (ent, opts) {
		opts = opts || {};

		const renderer = Renderer.get().setFirstSection(true);

		const isInlinedToken = !opts.isCompact && Renderer.object.hasToken(ent);

		const entriesMeta = Renderer.object.getObjectRenderableEntriesMeta(ent);

		const ptAttribs = Renderer.object.RENDERABLE_ENTRIES_PROP_ORDER__ATTRIBUTES
			.filter(prop => entriesMeta[prop])
			.map((prop, i) => {
				return `<div ${i < 3 && !opts.isCompact ? `class="stats__wrp-avoid-token"` : ""}>${Renderer.get().render(entriesMeta[prop])}</div>`;
			})
			.join("");

		return `
			${Renderer.utils.getExcludedTr({entity: ent, dataProp: "object", page: opts.page || UrlUtil.PG_OBJECTS})}
			${Renderer.utils.getNameTr(ent, {page: opts.page || UrlUtil.PG_OBJECTS, isInlinedToken, isEmbeddedEntity: opts.isEmbeddedEntity})}
			<tr><td colspan="6" class="pb-2">${Renderer.get().render(entriesMeta.entrySize)}</td></tr>
			<tr><td colspan="6" class="pb-2">${ptAttribs}</td></tr>
			<tr><td colspan="6"${opts.isCompact ? ` class="pb-2"` : ""}>
			${ent.entries ? renderer.render({entries: ent.entries}, 2) : ""}
			${ent.actionEntries ? renderer.render({entries: ent.actionEntries}, 2) : ""}
			</td></tr>
		`;
	}

	static hasToken (obj, opts) {
		return Renderer.generic.hasToken(obj, opts);
	}

	static getTokenUrl (obj, opts) {
		return Renderer.generic.getTokenUrl(obj, "objects/tokens", opts);
	}

	static pGetFluff (obj) {
		return Renderer.utils.pGetFluff({
			entity: obj,
			fluffProp: "objectFluff",
		});
	}
};

Renderer.trap = class {
	static CHILD_PROPS = ["trigger", "effect", "eActive", "eDynamic", "eConstant", "countermeasures"];

	static TRAP_TYPES_CLASSIC = ["MECH", "MAG", "TRP", "HAUNT"];

	static getTrapRenderableEntriesMeta (ent, {styleHint = null} = {}) {
		styleHint ||= VetoolsConfig.get("styleSwitcher", "style");

		if (Renderer.trap.TRAP_TYPES_CLASSIC.includes(ent.trapHazType)) {
			const listItems = [
				ent.trigger ? {
					type: "item",
					name: "Trigger:",
					entries: ent.trigger,
				} : null,
				ent.duration ? {
					type: "item",
					name: "Duration:",
					entries: [
						Renderer.generic.getRenderableDurationEntriesMeta(ent.duration, {styleHint}).entryDuration,
					],
				} : null,
				ent.hauntBonus ? {
					type: "item",
					name: "Haunt Bonus:",
					entry: ent.hauntBonus,
				} : null,
				ent.hauntBonus && !isNaN(ent.hauntBonus) ? {
					type: "item",
					name: "Detection:",
					entry: `passive Wisdom ({@skill Perception}) score equals or exceeds ${10 + Number(ent.hauntBonus)}`,
				} : null,
			]
				.filter(Boolean);

			if (!listItems.length) return {};
			return {
				entriesHeader: [
					{
						type: "list",
						style: "list-hang-notitle",
						items: listItems,
					},
				],
			};
		}

		return {
			entriesAttributes: [
				// region Shared between simple/complex
				ent.trigger ? {
					type: "entries",
					name: "Trigger",
					entries: ent.trigger,
				} : null,
				// endregion

				// region Simple traps
				ent.effect ? {
					type: "entries",
					name: "Effect",
					entries: ent.effect,
				} : null,
				// endregion

				// region Complex traps
				ent.initiative ? {
					type: "entries",
					name: "Initiative",
					entries: Renderer.trap.getTrapInitiativeEntries(ent),
				} : null,
				ent.eActive ? {
					type: "entries",
					name: "Active Elements",
					entries: ent.eActive,
				} : null,
				ent.eDynamic ? {
					type: "entries",
					name: "Dynamic Elements",
					entries: ent.eDynamic,
				} : null,
				ent.eConstant ? {
					type: "entries",
					name: "Constant Elements",
					entries: ent.eConstant,
				} : null,
				// endregion

				// region Shared between simple/complex
				ent.countermeasures ? {
					type: "entries",
					name: "Countermeasures",
					entries: ent.countermeasures,
				} : null,
				// endregion
			]
				.filter(Boolean),
		};
	}

	static getTrapInitiativeEntries (ent) { return [`The trap acts on ${Parser.trapInitToFull(ent.initiative)}${ent.initiativeNote ? ` (${ent.initiativeNote})` : ""}.`]; }

	static _getRenderedTrapPart (renderer, ent, {styleHint = null} = {}) {
		const entriesMeta = Renderer.trap.getTrapRenderableEntriesMeta(ent, {styleHint});
		if (entriesMeta.entriesHeader?.length) return renderer.render({entries: entriesMeta.entriesHeader});
		if (entriesMeta.entriesAttributes?.length) return renderer.render({entries: entriesMeta.entriesAttributes}, 1);
		return "";
	}

	static getRenderedTrapBody (renderer, ent, {styleHint = null} = {}) {
		const ptEntries = renderer.render({entries: ent.entries}, 1);
		const ptTrap = Renderer.trap._getRenderedTrapPart(Renderer.get(), ent, {styleHint});

		const isPrefixTrapPart = Renderer.trap.TRAP_TYPES_CLASSIC.includes(ent.trapHazType);

		return (
			isPrefixTrapPart
				? [ptTrap, ptEntries]
				: [ptEntries, ptTrap]
		)
			.filter(Boolean)
			.join("");
	}

	static getCompactRenderedString (ent, opts) {
		return Renderer.traphazard.getCompactRenderedString(ent, opts);
	}

	static pGetFluff (ent) { return Renderer.traphazard.pGetFluff(ent); }
};

Renderer.hazard = class {
	static getCompactRenderedString (ent, opts) {
		return Renderer.traphazard.getCompactRenderedString(ent, opts);
	}

	static getRenderedHazardBody (renderer, ent, {styleHint = null} = {}) {
		return renderer.render({entries: ent.entries}, 1);
	}

	static pGetFluff (ent) { return Renderer.traphazard.pGetFluff(ent); }
};

Renderer.traphazard = class {
	static getSubtitle (ent, {styleHint} = {}) {
		const type = ent.trapHazType || "HAZ";
		if (type === "GEN") return null;

		styleHint ||= VetoolsConfig.get("styleSwitcher", "style");

		const ptType = Parser.trapHazTypeToFull(type);
		if (!ent.rating?.length) return ptType;

		return ent.rating
			.map(rating => {
				const ptThreat = rating.threat ? rating.threat.toTitleCase() : "";

				const ptThreatType = [ptThreat, ptType]
					.filter(Boolean)
					.join(" ");

				const ptLevelTier = Renderer.traphazard.getRenderedTrapHazardRatingPart(rating, {styleHint});

				return [
					ptThreatType,
					ptLevelTier ? `(${ptLevelTier})` : "",
				]
					.filter(Boolean)
					.join(" ");
			})
			.filter(Boolean)
			.joinConjunct(", ", " or ");
	}

	static getRenderedTrapHazardRatingPart (rating, {styleHint} = {}) {
		styleHint ||= VetoolsConfig.get("styleSwitcher", "style");

		if (rating.tier) return Parser.tierToFullLevel(rating.tier, {styleHint});

		if (rating.level?.min == null || rating.level?.max == null) return "";

		const ptLevelLabel = styleHint === "classic" ? "level" : "Levels";
		return `${ptLevelLabel} ${rating.level.min}${rating.level.min !== rating.level.max ? `\u2013${rating.level.max}` : ""}`;
	}

	static getCompactRenderedString (ent, opts) {
		opts = opts || {};

		const styleHint = VetoolsConfig.get("styleSwitcher", "style");

		const renderer = Renderer.get();
		const subtitle = Renderer.traphazard.getSubtitle(ent, {styleHint});
		const ptBody = ent.__prop === "trap"
			? Renderer.trap.getRenderedTrapBody(renderer, ent, {styleHint})
			: Renderer.hazard.getRenderedHazardBody(renderer, ent, {styleHint});
		return `
			${Renderer.utils.getExcludedTr({entity: ent, dataProp: ent.__prop, page: UrlUtil.PG_TRAPS_HAZARDS})}
			${Renderer.utils.getNameTr(ent, {page: UrlUtil.PG_TRAPS_HAZARDS, isEmbeddedEntity: opts.isEmbeddedEntity})}
			${subtitle ? `<tr><td colspan="6" class="pb-2"><i>${subtitle}</i></td></tr>` : ""}
			<tr><td colspan="6" class="pb-2">
			${ptBody}
			</td></tr>
		`;
	}

	static pGetFluff (ent) {
		return Renderer.utils.pGetFluff({
			entity: ent,
			fluffProp: ent.__prop === "trap" ? "trapFluff" : "hazardFluff",
		});
	}
};

Renderer.cultboon = class {
	static getCultRenderableEntriesMeta (ent) {
		if (!ent.goal && !ent.cultists && !ent.signatureSpells) return null;

		const fauxList = {
			type: "list",
			style: "list-hang-notitle",
			items: [],
		};

		if (ent.goal) {
			fauxList.items.push({
				type: "item",
				name: "Goals:",
				entry: ent.goal.entry,
			});
		}

		if (ent.cultists) {
			fauxList.items.push({
				type: "item",
				name: "Typical Cultists:",
				entry: ent.cultists.entry,
			});
		}
		if (ent.signatureSpells) {
			fauxList.items.push({
				type: "item",
				name: "Signature Spells:",
				entry: ent.signatureSpells.entry,
			});
		}

		return {listGoalsCultistsSpells: fauxList};
	}

	static doRenderCultParts (ent, renderer, renderStack) {
		const cultEntriesMeta = Renderer.cultboon.getCultRenderableEntriesMeta(ent);
		if (!cultEntriesMeta) return;
		renderer.recursiveRender(cultEntriesMeta.listGoalsCultistsSpells, renderStack, {depth: 2});
	}

	/* -------------------------------------------- */

	static getBoonRenderableEntriesMeta (ent) {
		if (!ent.ability && !ent.signatureSpells) return null;

		const benefits = {type: "list", style: "list-hang-notitle", items: []};

		if (ent.ability) {
			benefits.items.push({
				type: "item",
				name: "Ability Score Adjustment:",
				entry: ent.ability ? ent.ability.entry : "None",
			});
		}

		if (ent.signatureSpells) {
			benefits.items.push({
				type: "item",
				name: "Signature Spells:",
				entry: ent.signatureSpells ? ent.signatureSpells.entry : "None",
			});
		}

		return {listBenefits: benefits};
	}

	static doRenderBoonParts (ent, renderer, renderStack) {
		const boonEntriesMeta = Renderer.cultboon.getBoonRenderableEntriesMeta(ent);
		if (!boonEntriesMeta) return;
		renderer.recursiveRender(boonEntriesMeta.listBenefits, renderStack, {depth: 1});
	}

	/* -------------------------------------------- */

	static _getCompactRenderedString_cult ({ent, renderer}) {
		const renderStack = [];

		Renderer.cultboon.doRenderCultParts(ent, renderer, renderStack);
		renderer.recursiveRender({entries: ent.entries}, renderStack, {depth: 2});

		return `${Renderer.utils.getExcludedTr({entity: ent, dataProp: "cult", page: UrlUtil.PG_CULTS_BOONS})}
		${Renderer.utils.getNameTr(ent, {page: UrlUtil.PG_CULTS_BOONS})}
		<tr><td colspan="6" class="py-0"><div class="ve-tbl-divider"></div></td></tr>
		<tr><td colspan="6" class="pb-2">${renderStack.join("")}</td></tr>`;
	}

	static _getCompactRenderedString_boon ({ent, renderer}) {
		const renderStack = [];

		Renderer.cultboon.doRenderBoonParts(ent, renderer, renderStack);
		renderer.recursiveRender({entries: ent.entries}, renderStack, {depth: 1});
		ent._displayName = ent._displayName || ent.name;

		return `${Renderer.utils.getExcludedTr({entity: ent, dataProp: "boon", page: UrlUtil.PG_CULTS_BOONS})}
		${Renderer.utils.getNameTr(ent, {page: UrlUtil.PG_CULTS_BOONS})}
		<tr><td colspan="6" class="pb-2">${renderStack.join("")}</td></tr>`;
	}

	static getCompactRenderedString (ent) {
		const renderer = Renderer.get();
		switch (ent.__prop) {
			case "cult": return Renderer.cultboon._getCompactRenderedString_cult({ent, renderer});
			case "boon": return Renderer.cultboon._getCompactRenderedString_boon({ent, renderer});
			default: throw new Error(`Unhandled prop "${ent.__prop}"`);
		}
	}
};

/** @abstract */
class _RenderCompactBestiaryImplBase {
	_style;

	/**
	 * @param {object} mon
	 * @param [opts]
	 * @param [opts.isCompact]
	 * @param [opts.isEmbeddedEntity]
	 * @param [opts.isShowScalers]
	 * @param [opts.isScaledCr]
	 * @param [opts.isScaledSpellSummon]
	 * @param [opts.isScaledClassSummon]
	 *
	 * @return {string}
	 */
	getCompactRenderedString (mon, opts) {
		opts ||= {};
		if (opts.isCompact === undefined) opts.isCompact = true;

		const renderer = Renderer.get();

		return Renderer.monster.getRenderWithPlugins({
			renderer,
			mon,
			fn: () => this._getCompactRenderedString({mon, renderer, opts}),
		});
	}

	/**
	 * @abstract
	 *
	 * @param {object} mon
	 * @param {Renderer} renderer
	 * @param [opts]
	 * @param [opts.isCompact]
	 * @param [opts.isEmbeddedEntity]
	 * @param [opts.isShowScalers]
	 * @param [opts.isScaledCr]
	 * @param [opts.isScaledSpellSummon]
	 * @param [opts.isScaledClassSummon]
	 *
	 * @return {string}
	 */
	_getCompactRenderedString ({mon, renderer, opts}) {
		throw new Error("Unimplemented!");
	}

	/* -------------------------------------------- */

	_getFlags ({mon, opts}) {
		const isInlinedToken = !opts.isCompact && Renderer.monster.hasToken(mon);

		const isShowCrScaler = ScaleCreature.isCrInScaleRange(mon);
		const isShowSpellLevelScaler = opts.isShowScalers && !isShowCrScaler && mon.summonedBySpellLevel != null;
		const isShowClassLevelScaler = opts.isShowScalers && !isShowSpellLevelScaler && (mon.summonedByClass != null || mon.summonedScaleByPlayerLevel);
		const classLevelScalerClass = isShowClassLevelScaler ? mon.summonedByClass : null;

		return {
			isInlinedToken,

			isShowCrScaler,
			isShowSpellLevelScaler,
			isShowClassLevelScaler,
			classLevelScalerClass,
		};
	}

	/* -------------------------------------------- */

	_getCommonHtmlParts (
		{
			mon,
			renderer,
			opts,

			isInlinedToken,

			isShowCrScaler,
			isShowSpellLevelScaler,
			isShowClassLevelScaler,
			classLevelScalerClass,

			entsAction,
			entsBonusAction,
			entsReaction,
			entsLegendaryAction,
			entsMythicAction,
			legGroup,
		},
	) {
		return {
			htmlPtIsExcluded: this._getCommonHtmlParts_isExcluded({mon, opts}),
			htmlPtName: this._getCommonHtmlParts_name({mon, opts, isInlinedToken}),
			htmlPtSizeTypeAlignment: this._getCommonHtmlParts_sizeTypeAlignment({mon}),

			htmlPtAttributeHeaders: this._getCommonHtmlParts_attributeHeaders({mon, isInlinedToken, isShowSpellLevelScaler, isShowClassLevelScaler, classLevelScalerClass}),
			htmlPtAttributeValues: this._getCommonHtmlParts_attributeValues({mon, opts, isInlinedToken, isShowCrScaler, isShowSpellLevelScaler, isShowClassLevelScaler}),

			htmlPtsResources: this._getCommonHtmlParts_resources({mon}),

			htmlPtAbilityScores: this._getHtmlParts_abilityScores({mon, renderer}),

			htmlPtSkills: this._getCommonHtmlParts_skills({mon, renderer}),
			htmlPtTools: this._getCommonHtmlParts_tools({mon, renderer}),
			htmlPtVulnerabilities: this._getCommonHtmlParts_vulnerabilities({mon}),
			htmlPtResistances: this._getCommonHtmlParts_resistances({mon}),
			htmlPtSenses: this._getCommonHtmlParts_senses({mon, opts}),
			htmlPtLanguages: this._getCommonHtmlParts_languages({mon, opts}),

			htmlPtActions: this._getCommonHtmlParts_actions({mon, renderer, entsAction}),
			htmlPtBonusActions: this._getCommonHtmlParts_bonusActions({mon, renderer, entsBonusAction}),
			htmlPtReactions: this._getCommonHtmlParts_reactions({mon, renderer, entsReaction}),
			htmlPtLegendaryActions: this._getCommonHtmlParts_legendaryActions({mon, renderer, entsLegendaryAction}),
			htmlPtMythicActions: this._getCommonHtmlParts_mythicActions({mon, renderer, entsMythicAction}),

			htmlPtLairActions: this._getCommonHtmlParts_lairActions({renderer, legGroup}),
			htmlPtRegionalEffects: this._getCommonHtmlParts_regionalEffects({renderer, legGroup}),

			htmlPtVariants: this._getCommonHtmlParts_variants({mon, renderer}),
		};
	}

	/* ----- */

	_getCommonHtmlParts_isExcluded ({mon, opts}) {
		return Renderer.utils.getExcludedTr({entity: mon, dataProp: "monster", page: opts.page || UrlUtil.PG_BESTIARY});
	}

	_getCommonHtmlParts_name ({mon, opts, isInlinedToken}) {
		return Renderer.utils.getNameTr(
			mon, {
				page: opts.page || UrlUtil.PG_BESTIARY,
				extensionData: {
					_scaledCr: mon._scaledCr,
					_scaledSpellSummonLevel: mon._scaledSpellSummonLevel,
					_scaledClassSummonLevel: mon._scaledClassSummonLevel,
				},
				isInlinedToken,
				isEmbeddedEntity: opts.isEmbeddedEntity,
			},
		);
	}

	_getCommonHtmlParts_sizeTypeAlignment ({mon}) {
		return `<tr><td colspan="6"><i>${Renderer.monster.getTypeAlignmentPart(mon)}</i></td></tr>`;
	}

	/* ----- */

	_getCommonHtmlParts_attributeHeaders ({mon, isInlinedToken, isShowSpellLevelScaler, isShowClassLevelScaler, classLevelScalerClass}) {
		const labelAc = this._style !== "classic" ? "AC" : "Armor Class";
		const titleAc = this._style !== "classic" ? `title="Armor Class"` : "";

		const labelHp = this._style !== "classic" ? "HP" : "Hit Points";
		const titleHp = this._style !== "classic" ? `title="Hit Points"` : "";

		const labelCr = isShowSpellLevelScaler ? "Spell Level" : isShowClassLevelScaler ? (classLevelScalerClass ? "Class Level" : "Level") : (this._style !== "classic" ? "CR" : "Challenge");
		const titleCr = isShowSpellLevelScaler ? "" : isShowClassLevelScaler ? "" : (this._style !== "classic" ? `title="Challenge Rating"` : "");

		const ptInitiative = this._style !== "classic" ? Renderer.monster.getInitiativePart(mon) : "";
		const ptPb = this._style === "classic" ? Renderer.monster.getPbPart(mon) : "";

		return `<tr>
			<th class="ve-text-left" colspan="${this._style === "classic" ? "2" : "1"}" ${titleAc}>${labelAc}</th>
			${ptInitiative ? `<th class="ve-text-left" colspan="1" title="Initiative">Init.</th>` : ""}
			<th class="ve-text-left" colspan="2" ${titleHp}>${labelHp}</th>
			<th class="ve-text-left" colspan="2">Speed</th>
			<th class="ve-text-left" colspan="2" ${titleCr}>${labelCr}</th>
			${ptPb ? `<th class="ve-text-left" colspan="1" title="Proficiency Bonus">PB</th>` : ""}
			${isInlinedToken ? `<th colspan="1"></th>` : ""}
		</tr>`;
	}

	_getCommonHtmlParts_crSpellLevel ({mon, opts, isShowCrScaler, isShowSpellLevelScaler, isShowClassLevelScaler}) {
		if (isShowSpellLevelScaler || isShowClassLevelScaler) {
			// Note that `outerHTML` ignores the value of the select, so we cannot e.g. select the correct option
			//   here and expect to return it in the HTML.
			const selHtml = isShowSpellLevelScaler ? Renderer.monster.getSelSummonSpellLevel(mon)?.outerHTML : Renderer.monster.getSelSummonClassLevel(mon)?.outerHTML;
			return `<td colspan="2">${selHtml || ""}</td>`;
		}

		if (isShowCrScaler) {
			return `<td colspan="2">
				${Renderer.monster.getChallengeRatingPart(mon, {style: this._style})}
				${opts.isShowScalers && !opts.isScaledCr && Parser.isValidCr(mon.cr ? (mon.cr.cr || mon.cr) : null) ? `
				<button title="Scale Creature By CR (Highly Experimental)" class="mon__btn-scale-cr ve-btn ve-btn-xs ve-btn-default no-print">
					<span class="glyphicon glyphicon-signal"></span>
				</button>
				` : ""}
				${opts.isScaledCr ? `
				<button title="Reset CR Scaling" class="mon__btn-reset-cr ve-btn ve-btn-xs ve-btn-default no-print">
					<span class="glyphicon glyphicon-refresh"></span>
				</button>
				` : ""}
			</td>`;
		}

		return `<td colspan="2">\u2014</td>`;
	}

	_getCommonHtmlParts_attributeValues ({mon, opts, isInlinedToken, isShowCrScaler, isShowSpellLevelScaler, isShowClassLevelScaler}) {
		const ptInitiative = this._style !== "classic" ? Renderer.monster.getInitiativePart(mon) : "";
		const ptPb = this._style === "classic" ? Renderer.monster.getPbPart(mon) : "";

		const ptCrSpellLevel = this._getCommonHtmlParts_crSpellLevel({mon, opts, isShowCrScaler, isShowSpellLevelScaler, isShowClassLevelScaler});

		return `<tr>
			<td colspan="${this._style === "classic" ? "2" : "1"}">${mon.ac == null ? "\u2014" : Parser.acToFull(mon.ac, {isHideFrom: this._style !== "classic"})}</td>
			${ptInitiative ? `<td colspan="1">${ptInitiative}</td>` : ""}
			<td colspan="2">${mon.hp == null ? "\u2014" : Renderer.monster.getRenderedHp(mon.hp)}</td>
			<td colspan="2">${Parser.getSpeedString(mon)}</td>
			${ptCrSpellLevel}
			${ptPb ? `<td colspan="1">${ptPb}</td>` : ""}
			${isInlinedToken ? `<td colspan="1"></td>` : ""}
		</tr>`;
	}

	/* ----- */

	_getHtmlParts_abilityScores ({mon, renderer}) {
		return Renderer.monster.getRenderedAbilityScores(mon, {style: this._style, renderer});
	}

	/* ----- */

	_getCommonHtmlParts_resources ({mon}) {
		return (mon.resource || []).map(res => `<p><b>${res.name}</b> ${Renderer.monster.getRenderedResource(res)}</p>`);
	}

	_getCommonHtmlParts_skills ({mon, renderer}) {
		return mon.skill ? `<p><b>Skills</b> ${Renderer.monster.getSkillsString(renderer, mon)}</p>` : "";
	}

	_getCommonHtmlParts_tools ({mon, renderer}) {
		return mon.tool ? `<p><b>Tools</b> ${Renderer.monster.getToolsString(renderer, mon, {styleHint: this._style})}</p>` : "";
	}

	_getCommonHtmlParts_vulnerabilities ({mon}) {
		const label = this._style === "classic" ? "Damage Vuln." : "Vuln.";
		const ptTitle = this._style === "classic" ? "Damage Vulnerabilities" : "Vulnerabilities";
		return mon.vulnerable ? `<p><b ${ptTitle}>${label}</b> ${Parser.getFullImmRes(mon.vulnerable, {isTitleCase: this._style !== "classic"})}</p>` : "";
	}

	_getCommonHtmlParts_resistances ({mon}) {
		const label = this._style === "classic" ? "Damage Res." : "Res.";
		const ptTitle = this._style === "classic" ? "Damage Resistances" : "Resistances";
		return mon.resist ? `<p><b ${ptTitle}>${label}</b> ${Parser.getFullImmRes(mon.resist, {isTitleCase: this._style !== "classic"})}</p>` : "";
	}

	_getCommonHtmlParts_senses ({mon, opts}) {
		if (opts.isHideSenses) return "";
		const pt = Renderer.monster.getSensesPart(mon, {isTitleCase: this._style !== "classic"});
		return pt ? `<p><b>Senses</b> ${pt}</p>` : "";
	}

	_getCommonHtmlParts_languages ({mon, opts}) {
		return opts.isHideLanguages ? "" : `<p><b>Languages</b> ${Renderer.monster.getRenderedLanguages(mon.languages)}</p>`;
	}

	/* ----- */

	_getCommonHtmlParts_actions ({mon, renderer, entsAction}) {
		return Renderer.monster.getCompactRenderedStringSection({
			ent: {...mon, action: entsAction},
			renderer,
			title: "Actions",
			key: "action",
			depth: 2,
			styleHint: this._style,
		});
	}

	_getCommonHtmlParts_bonusActions ({mon, renderer, entsBonusAction}) {
		return Renderer.monster.getCompactRenderedStringSection({
			ent: {...mon, bonus: entsBonusAction},
			renderer,
			title: "Bonus Actions",
			key: "bonus",
			depth: 2,
			styleHint: this._style,
		});
	}

	_getCommonHtmlParts_reactions ({mon, renderer, entsReaction}) {
		return Renderer.monster.getCompactRenderedStringSection({
			ent: {...mon, reaction: entsReaction},
			renderer,
			title: "Reactions",
			key: "reaction",
			depth: 2,
			styleHint: this._style,
		});
	}

	_getCommonHtmlParts_legendaryActions ({mon, renderer, entsLegendaryAction}) {
		return Renderer.monster.getCompactRenderedStringSection({
			ent: {...mon, legendary: entsLegendaryAction},
			renderer,
			title: "Legendary Actions",
			key: "legendary",
			depth: 2,
			styleHint: this._style,
			isHangingList: true,
		});
	}

	_getCommonHtmlParts_mythicActions ({mon, renderer, entsMythicAction}) {
		return Renderer.monster.getCompactRenderedStringSection({
			ent: {...mon, mythic: entsMythicAction},
			renderer,
			title: "Mythic Actions",
			key: "mythic",
			depth: 2,
			styleHint: this._style,
			isHangingList: true,
		});
	}

	/* ----- */

	_getCommonHtmlParts_lairActions ({renderer, legGroup}) {
		if (!legGroup?.lairActions) return "";
		return Renderer.monster.getCompactRenderedStringSection({
			ent: legGroup,
			renderer,
			title: "Lair Actions",
			key: "lairActions",
			depth: 1,
			styleHint: this._style,
		});
	}

	_getCommonHtmlParts_regionalEffects ({renderer, legGroup}) {
		if (!legGroup?.regionalEffects) return "";
		return Renderer.monster.getCompactRenderedStringSection({
			ent: legGroup,
			renderer,
			title: "Regional Effects",
			key: "regionalEffects",
			depth: 1,
			styleHint: this._style,
		});
	}

	/* ----- */

	_getCommonHtmlParts_variants ({mon, renderer}) {
		if (!mon.variant && (!mon.dragonCastingColor || mon.spellcasting) && !mon.summonedBySpell) return "";

		return `<tr><td colspan="6" class="pb-2">
		${mon.variant ? mon.variant.map(it => it.rendered || renderer.render(it)).join("") : ""}
		${mon.dragonCastingColor ? Renderer.monster.dragonCasterVariant.getHtml(mon, {renderer}) : ""}
		${mon.footer ? renderer.render({entries: mon.footer}) : ""}
		${mon.summonedBySpell ? `<div><b>Summoned By:</b> ${renderer.render(`{@spell ${mon.summonedBySpell}}`)}<div>` : ""}
		</td></tr>`;
	}
}

class _RenderCompactBestiaryImplClassic extends _RenderCompactBestiaryImplBase {
	_style = "classic";

	/* -------------------------------------------- */

	_getHtmlParts (
		{
			mon,
			renderer,

			entsTrait,
		},
	) {
		return {
			htmlPtSavingThrows: this._getHtmlParts_savingThrows({mon}),
			htmlPtInitiative: this._getHtmlParts_initiative({mon, renderer}),
			htmlPtDamageImmunities: this._getHtmlParts_damageImmunities({mon}),
			htmlPtConditionImmunities: this._getHtmlParts_conditionImmunities({mon}),

			htmlPtTraits: this._getHtmlParts_traits({mon, renderer, entsTrait}),
		};
	}

	/* ----- */

	_getHtmlParts_savingThrows ({mon}) {
		return mon.save ? `<p><b>Saving Throws</b> ${Renderer.monster.getSavesPart(mon)}</p>` : "";
	}

	_getHtmlParts_initiative ({mon, renderer}) {
		return mon.initiative ? `<p><b>Initiative</b> ${Renderer.monster.getInitiativePart(mon, {renderer})}</p>` : "";
	}

	_getHtmlParts_damageImmunities ({mon}) {
		return mon.immune ? `<p><b>Damage Imm.</b> ${Parser.getFullImmRes(mon.immune)}</p>` : "";
	}

	_getHtmlParts_conditionImmunities ({mon}) {
		return mon.conditionImmune ? `<p><b>Condition Imm.</b> ${Parser.getFullCondImm(mon.conditionImmune)}</p>` : "";
	}

	/* ----- */

	_getHtmlParts_traits ({mon, renderer, entsTrait}) {
		if (!entsTrait) return "";

		return `<tr><td colspan="6"><div class="ve-tbl-border ve-tbl-border--small"></div></td></tr>
		<tr><td colspan="6" class="pt-2">
		${entsTrait.map(it => it.rendered || renderer.render(it, 2)).join("")}
		</td></tr>`;
	}

	/* -------------------------------------------- */

	_getCompactRenderedString ({mon, renderer, opts}) {
		const {
			isInlinedToken,

			isShowCrScaler,
			isShowSpellLevelScaler,
			isShowClassLevelScaler,
			classLevelScalerClass,
		} = this._getFlags({mon, opts});

		const {
			entsTrait,
			entsAction,
			entsBonusAction,
			entsReaction,
			entsLegendaryAction,
			entsMythicAction,
			legGroup,
		} = Renderer.monster.getSubEntries(mon, {renderer});

		const {
			htmlPtIsExcluded,
			htmlPtName,
			htmlPtSizeTypeAlignment,

			htmlPtAttributeHeaders,
			htmlPtAttributeValues,

			htmlPtAbilityScores,

			htmlPtsResources,
			htmlPtSkills,
			htmlPtTools,
			htmlPtVulnerabilities,
			htmlPtResistances,
			htmlPtSenses,
			htmlPtLanguages,

			htmlPtActions,
			htmlPtBonusActions,
			htmlPtReactions,
			htmlPtLegendaryActions,
			htmlPtMythicActions,

			htmlPtLairActions,
			htmlPtRegionalEffects,

			htmlPtVariants,
		} = this._getCommonHtmlParts({
			mon,
			renderer,
			opts,

			isInlinedToken,

			isShowCrScaler,
			isShowSpellLevelScaler,
			isShowClassLevelScaler,
			classLevelScalerClass,

			entsTrait,
			entsAction,
			entsBonusAction,
			entsReaction,
			entsLegendaryAction,
			entsMythicAction,
			legGroup,
		});

		const {
			htmlPtSavingThrows,
			htmlPtInitiative,
			htmlPtDamageImmunities,
			htmlPtConditionImmunities,

			htmlPtTraits,
		} = this._getHtmlParts({
			mon,
			renderer,

			isInlinedToken,

			entsTrait,
		});

		return `
			${htmlPtIsExcluded}
			${htmlPtName}
			${htmlPtSizeTypeAlignment}
			<tr><td colspan="6"><div class="ve-tbl-border ve-tbl-border--small"></div></td></tr>
			<tr><td colspan="6">
				<table class="w-100 summary-noback relative table-layout-fixed my-1">
					${htmlPtAttributeHeaders}
					${htmlPtAttributeValues}
				</table>
			</td></tr>
			<tr><td colspan="6"><div class="ve-tbl-border ve-tbl-border--small mb-1"></div></td></tr>
			${htmlPtAbilityScores}
			<tr><td colspan="6"><div class="ve-tbl-border ve-tbl-border--small mt-1"></div></td></tr>
			<tr><td colspan="6">
				<div class="rd__compact-stat mt-2">
					${htmlPtsResources.join("")}
					${htmlPtSavingThrows}
					${htmlPtSkills}
					${htmlPtInitiative}
					${htmlPtTools}
					${htmlPtVulnerabilities}
					${htmlPtResistances}
					${htmlPtDamageImmunities}
					${htmlPtConditionImmunities}
					${htmlPtSenses}
					${htmlPtLanguages}
				</div>
			</td></tr>
			${htmlPtTraits}
			${htmlPtActions}
			${htmlPtBonusActions}
			${htmlPtReactions}
			${htmlPtLegendaryActions}
			${htmlPtMythicActions}
			${htmlPtLairActions}
			${htmlPtRegionalEffects}
			${htmlPtVariants}
		`;
	}
}

class _RenderCompactBestiaryImplOne extends _RenderCompactBestiaryImplBase {
	_style = "one";

	/* -------------------------------------------- */

	_getHtmlParts (
		{
			mon,
			renderer,

			entsTrait,
		},
	) {
		return {
			htmlPtSavingThrows: this._getHtmlParts_savingThrows({mon, renderer}),

			htmlPtImmunities: this._getHtmlParts_immunities({mon}),
			htmlPtGear: this._getHtmlParts_gear({mon}),

			htmlPtTraits: this._getHtmlParts_traits({mon, renderer, entsTrait}),
		};
	}

	/* ----- */

	_getHtmlParts_savingThrows ({mon, renderer}) {
		if (!mon.save?.special) return "";
		return `<p><b>Saving Throws</b> ${Renderer.monster.getSave(renderer, "special", mon.save.special)}</p>`;
	}

	_getHtmlParts_immunities ({mon}) {
		const pt = Renderer.monster.getImmunitiesCombinedPart(mon);
		if (!pt) return "";
		return `<p><b title="Immunities">Imm.</b> ${pt}</p>`;
	}

	_getHtmlParts_gear ({mon}) {
		const pt = Renderer.monster.getGearPart(mon);
		if (!pt) return "";
		return `<p><b>Gear</b> ${pt}</p>`;
	}

	/* ----- */

	_getHtmlParts_traits ({mon, renderer, entsTrait}) {
		return Renderer.monster.getCompactRenderedStringSection({
			ent: {...mon, trait: entsTrait},
			renderer,
			title: "Traits",
			key: "trait",
			depth: 2,
			styleHint: this._style,
		});
	}

	/* -------------------------------------------- */

	_getCompactRenderedString ({mon, renderer, opts}) {
		const {
			isInlinedToken,

			isShowCrScaler,
			isShowSpellLevelScaler,
			isShowClassLevelScaler,
			classLevelScalerClass,
		} = this._getFlags({mon, opts});

		const {
			entsTrait,
			entsAction,
			entsBonusAction,
			entsReaction,
			entsLegendaryAction,
			entsMythicAction,
			legGroup,
		} = Renderer.monster.getSubEntries(mon, {renderer});

		const {
			htmlPtIsExcluded,
			htmlPtName,
			htmlPtSizeTypeAlignment,

			htmlPtAttributeHeaders,
			htmlPtAttributeValues,

			htmlPtAbilityScores,

			htmlPtsResources,
			htmlPtSkills,
			htmlPtTools,
			htmlPtVulnerabilities,
			htmlPtResistances,
			htmlPtSenses,
			htmlPtLanguages,

			htmlPtActions,
			htmlPtBonusActions,
			htmlPtReactions,
			htmlPtLegendaryActions,
			htmlPtMythicActions,

			htmlPtLairActions,
			htmlPtRegionalEffects,

			htmlPtVariants,
		} = this._getCommonHtmlParts({
			mon,
			renderer,
			opts,

			isInlinedToken,

			isShowCrScaler,
			isShowSpellLevelScaler,
			isShowClassLevelScaler,
			classLevelScalerClass,

			entsTrait,
			entsAction,
			entsBonusAction,
			entsReaction,
			entsLegendaryAction,
			entsMythicAction,
			legGroup,
		});

		const {
			htmlPtSavingThrows,

			htmlPtImmunities,
			htmlPtGear,

			htmlPtTraits,
		} = this._getHtmlParts({
			mon,
			renderer,

			isInlinedToken,

			entsTrait,
		});

		return `
			${htmlPtIsExcluded}
			${htmlPtName}
			<tr><td colspan="6" class="pt-0 pb-1"><div class="ve-tbl-border ve-tbl-border--small"></div></td></tr>
			${htmlPtSizeTypeAlignment}
			<tr><td colspan="6">
				<table class="w-100 summary-noback relative table-layout-fixed my-1">
					${htmlPtAttributeHeaders}
					${htmlPtAttributeValues}
				</table>
			</td></tr>
			${htmlPtAbilityScores}
			<tr><td colspan="6">
				<div class="rd__compact-stat mt-2">
					${htmlPtsResources.join("")}
					${htmlPtSavingThrows}
					${htmlPtSkills}
					${htmlPtTools}
					${htmlPtVulnerabilities}
					${htmlPtResistances}
					${htmlPtImmunities}
					${htmlPtGear}
					${htmlPtSenses}
					${htmlPtLanguages}
				</div>
			</td></tr>
			${htmlPtTraits}
			${htmlPtActions}
			${htmlPtBonusActions}
			${htmlPtReactions}
			${htmlPtLegendaryActions}
			${htmlPtMythicActions}
			${htmlPtLairActions}
			${htmlPtRegionalEffects}
			${htmlPtVariants}
		`;
	}
}

Renderer.monster = class {
	static CHILD_PROPS = ["action", "bonus", "reaction", "trait", "legendary", "mythic", "variant", "spellcasting"];
	static CHILD_PROPS__SPELLCASTING_DISPLAY_AS = ["trait", "action", "bonus", "reaction", "legendary", "mythic"];

	/* -------------------------------------------- */

	static getShortName (mon, {isTitleCase = false, isSentenceCase = false, isUseDisplayName = false} = {}) {
		const name = isUseDisplayName ? (mon._displayName ?? mon.name) : mon.name;
		const shortName = isUseDisplayName ? (mon._displayShortName ?? mon.shortName) : mon.shortName;

		const prefix = mon.isNamedCreature ? "" : isTitleCase || isSentenceCase ? "The " : "the ";
		if (shortName === true) return `${prefix}${name}`;
		else if (shortName) return `${prefix}${!prefix && isTitleCase ? shortName.toTitleCase() : shortName.toLowerCase()}`;

		const out = Renderer.monster.getShortNameFromName(name, {isNamedCreature: mon.isNamedCreature});
		return `${prefix}${out}`;
	}

	static getShortNameFromName (name, {isNamedCreature = false} = {}) {
		const base = name.split(",")[0];
		let out = base
			.replace(/(?:adult|ancient|young) \w+ (dragon|dracolich)/gi, "$1");
		out = isNamedCreature ? out.split(" ")[0] : out.toLowerCase();
		return out;
	}

	/* -------------------------------------------- */

	static getPronounSubject (mon) { return mon.isNamedCreature ? "they" : "it"; }
	static getPronounObject (mon) { return mon.isNamedCreature ? "them" : "its"; }
	static getPronounPossessive (mon) { return mon.isNamedCreature ? "their" : "its"; }

	/* -------------------------------------------- */

	static getLegendaryActionIntro (mon, {renderer = Renderer.get(), isUseDisplayName = false, styleHint = null} = {}) {
		return renderer.render(Renderer.monster.getLegendaryActionIntroEntry(mon, {isUseDisplayName}));
	}

	static getLegendaryActionIntroEntry (mon, {isUseDisplayName = false, styleHint = null} = {}) {
		if (mon.legendaryHeader) {
			return {entries: mon.legendaryHeader};
		}

		styleHint ||= VetoolsConfig.get("styleSwitcher", "style");

		const legendaryActions = mon.legendaryActions || 3;
		const legendaryActionsLair = mon.legendaryActionsLair || legendaryActions;
		const legendaryNameTitle = Renderer.monster.getShortName(mon, {isTitleCase: true, isUseDisplayName});
		const proPossessive = Renderer.monster.getPronounPossessive(mon);

		if (styleHint === "classic") {
			return {
				entries: [
					`${legendaryNameTitle} can take ${legendaryActions} legendary action${legendaryActions > 1 ? "s" : ""}${legendaryActionsLair !== legendaryActions ? ` (or ${legendaryActionsLair} when in ${proPossessive} lair)` : ""}, choosing from the options below. Only one legendary action can be used at a time and only at the end of another creature's turn. ${legendaryNameTitle} regains spent legendary actions at the start of ${proPossessive} turn.`,
				],
			};
		}

		const legendaryNameSentence = Renderer.monster.getShortName(mon, {isSentenceCase: true, isUseDisplayName});
		return {
			entries: [
				`{@note Legendary Action Uses: ${legendaryActions}${legendaryActionsLair !== legendaryActions ? ` (${legendaryActionsLair} in Lair)` : ""}. Immediately after another creature's turn, ${legendaryNameSentence} can expend a use to take one of the following actions. ${legendaryNameTitle} regains all expended uses at the start of each of ${proPossessive} turns.}`,
			],
		};
	}

	static getSectionIntro (mon, {renderer = Renderer.get(), prop}) {
		const headerProp = `${prop}Header`;
		if (mon[headerProp]) return renderer.render({entries: mon[headerProp]});
		return "";
	}

	static getSave (renderer, attr, mod) {
		if (attr === "special") return renderer.render(mod);
		return renderer.render(`<span>${attr.uppercaseFirst()} {@savingThrow ${attr} ${mod}}</span>`);
	}

	static dragonCasterVariant = class {
		// Community-created (legacy)
		static _LVL_TO_COLOR_TO_SPELLS__UNOFFICIAL = {
			2: {
				black: ["darkness", "Melf's acid arrow", "fog cloud", "scorching ray"],
				green: ["ray of sickness", "charm person", "detect thoughts", "invisibility", "suggestion"],
				white: ["ice knife|XGE", "Snilloc's snowball swarm|XGE"],
				brass: ["see invisibility", "magic mouth", "blindness/deafness", "sleep", "detect thoughts"],
				bronze: ["gust of wind", "misty step", "locate object", "blur", "witch bolt", "thunderwave", "shield"],
				copper: ["knock", "sleep", "detect thoughts", "blindness/deafness", "tasha's hideous laughter"],
			},
			3: {
				blue: ["wall of sand|XGE", "thunder step|XGE", "lightning bolt", "blink", "magic missile", "slow"],
				red: ["fireball", "scorching ray", "haste", "erupting earth|XGE", "Aganazzar's scorcher|XGE"],
				gold: ["slow", "fireball", "dispel magic", "counterspell", "Aganazzar's scorcher|XGE", "shield"],
				silver: ["sleet storm", "protection from energy", "catnap|XGE", "locate object", "identify", "Leomund's tiny hut"],
			},
			4: {
				black: ["vitriolic sphere|XGE", "sickening radiance|XGE", "Evard's black tentacles", "blight", "hunger of Hadar"],
				white: ["fire shield", "ice storm", "sleet storm"],
				brass: ["charm monster|XGE", "sending", "wall of sand|XGE", "hypnotic pattern", "tongues"],
				copper: ["polymorph", "greater invisibility", "confusion", "stinking cloud", "major image", "charm monster|XGE"],
			},
			5: {
				blue: ["telekinesis", "hold monster", "dimension door", "wall of stone", "wall of force"],
				green: ["cloudkill", "charm monster|XGE", "modify memory", "mislead", "hallucinatory terrain", "dimension door"],
				bronze: ["steel wind strike|XGE", "control winds|XGE", "watery sphere|XGE", "storm sphere|XGE", "tidal wave|XGE"],
				gold: ["hold monster", "immolation|XGE", "wall of fire", "greater invisibility", "dimension door"],
				silver: ["cone of cold", "ice storm", "teleportation circle", "skill empowerment|XGE", "creation", "Mordenkainen's private sanctum"],
			},
			6: {
				white: ["cone of cold", "wall of ice"],
				brass: ["scrying", "Rary's telepathic bond", "Otto's irresistible dance", "legend lore", "hold monster", "dream"],
			},
			7: {
				black: ["power word pain|XGE", "finger of death", "disintegrate", "hold monster"],
				blue: ["chain lightning", "forcecage", "teleport", "etherealness"],
				green: ["project image", "mirage arcane", "prismatic spray", "teleport"],
				bronze: ["whirlwind|XGE", "chain lightning", "scatter|XGE", "teleport", "disintegrate", "lightning bolt"],
				copper: ["symbol", "simulacrum", "reverse gravity", "project image", "Bigby's hand", "mental prison|XGE", "seeming"],
				silver: ["Otiluke's freezing sphere", "prismatic spray", "wall of ice", "contingency", "arcane gate"],
			},
			8: {
				gold: ["sunburst", "delayed blast fireball", "antimagic field", "teleport", "globe of invulnerability", "maze"],
			},
		};
		// From Fizban's Treasury of Dragons
		static _LVL_TO_COLOR_TO_SPELLS__FTD = {
			1: {
				deep: ["command", "dissonant whispers", "faerie fire"],
			},
			2: {
				black: ["blindness/deafness", "create or destroy water"],
				green: ["invisibility", "speak with animals"],
				white: ["gust of wind"],
				brass: ["create or destroy water", "speak with animals"],
				bronze: ["beast sense", "detect thoughts", "speak with animals"],
				copper: ["lesser restoration", "phantasmal force"],
			},
			3: {
				blue: ["create or destroy water", "major image"],
				red: ["bane", "heat metal", "hypnotic pattern", "suggestion"],
				gold: ["bless", "cure wounds", "slow", "suggestion", "zone of truth"],
				silver: ["beacon of hope", "calm emotions", "hold person", "zone of truth"],
				deep: ["command", "dissonant whispers", "faerie fire", "water breathing"],
			},
			4: {
				black: ["blindness/deafness", "create or destroy water", "plant growth"],
				white: ["gust of wind"],
				brass: ["create or destroy water", "speak with animals", "suggestion"],
				copper: ["lesser restoration", "phantasmal force", "stone shape"],
			},
			5: {
				blue: ["arcane eye", "create or destroy water", "major image"],
				red: ["bane", "dominate person", "heat metal", "hypnotic pattern", "suggestion"],
				green: ["invisibility", "plant growth", "speak with animals"],
				bronze: ["beast sense", "control water", "detect thoughts", "speak with animals"],
				gold: ["bless", "commune", "cure wounds", "geas", "slow", "suggestion", "zone of truth"],
				silver: ["beacon of hope", "calm emotions", "hold person", "polymorph", "zone of truth"],
			},
			6: {
				white: ["gust of wind", "ice storm"],
				brass: ["create or destroy water", "locate creature", "speak with animals", "suggestion"],
				deep: ["command", "dissonant whispers", "faerie fire", "passwall", "water breathing"],
			},
			7: {
				black: ["blindness/deafness", "create or destroy water", "insect plague", "plant growth"],
				blue: ["arcane eye", "create or destroy water", "major image", "project image"],
				red: ["bane", "dominate person", "heat metal", "hypnotic pattern", "power word stun", "suggestion"],
				green: ["invisibility", "mass suggestion", "plant growth", "speak with animals"],
				bronze: ["beast sense", "control water", "detect thoughts", "heroes' feast", "speak with animals"],
				copper: ["lesser restoration", "move earth", "phantasmal force", "stone shape"],
				silver: ["beacon of hope", "calm emotions", "hold person", "polymorph", "teleport", "zone of truth"],
			},
			8: {
				gold: ["bless", "commune", "cure wounds", "geas", "plane shift", "slow", "suggestion", "word of recall", "zone of truth"],
			},
		};

		static getAvailableColors () {
			const out = new Set();

			const add = (lookup) => Object.values(lookup).forEach(obj => Object.keys(obj).forEach(k => out.add(k)));
			add(Renderer.monster.dragonCasterVariant._LVL_TO_COLOR_TO_SPELLS__UNOFFICIAL);
			add(Renderer.monster.dragonCasterVariant._LVL_TO_COLOR_TO_SPELLS__FTD);

			return [...out].sort(SortUtil.ascSortLower);
		}

		static hasCastingColorVariant (dragon) {
			// if the dragon already has a spellcasting trait specified, don't add a note about adding a spellcasting trait
			return dragon.dragonCastingColor && !dragon.spellcasting;
		}

		static getMeta (dragon) {
			const chaMod = Parser.getAbilityModNumber(dragon.cha);
			const pb = Parser.crToPb(dragon.cr);
			const maxSpellLevel = Math.floor(Parser.crToNumber(dragon.cr) / 3);

			return {
				chaMod,
				pb,
				maxSpellLevel,
				spellSaveDc: pb + chaMod + 8,
				spellToHit: pb + chaMod,
				exampleSpellsUnofficial: Renderer.monster.dragonCasterVariant._getMeta_getExampleSpells({
					dragon,
					maxSpellLevel,
					spellLookup: Renderer.monster.dragonCasterVariant._LVL_TO_COLOR_TO_SPELLS__UNOFFICIAL,
				}),
				exampleSpellsFtd: Renderer.monster.dragonCasterVariant._getMeta_getExampleSpells({
					dragon,
					maxSpellLevel,
					spellLookup: Renderer.monster.dragonCasterVariant._LVL_TO_COLOR_TO_SPELLS__FTD,
				}),
			};
		}

		static _getMeta_getExampleSpells ({dragon, maxSpellLevel, spellLookup}) {
			if (spellLookup[maxSpellLevel]?.[dragon.dragonCastingColor]) return spellLookup[maxSpellLevel][dragon.dragonCastingColor];

			// If there's no exact match, try to find the next lowest
			const flatKeys = Object.entries(spellLookup)
				.map(([lvl, group]) => {
					return Object.keys(group)
						.map(color => `${lvl}${color}`);
				})
				.flat()
				.mergeMap(it => ({[it]: true}));

			while (--maxSpellLevel > -1) {
				const lookupKey = `${maxSpellLevel}${dragon.dragonCastingColor}`;
				if (flatKeys[lookupKey]) return spellLookup[maxSpellLevel][dragon.dragonCastingColor];
			}
			return [];
		}

		static getSpellcasterDetailsPart ({chaMod, maxSpellLevel, spellSaveDc, spellToHit, isSeeSpellsPageNote = false}) {
			const levelString = maxSpellLevel === 0 ? `${chaMod === 1 ? "This" : "These"} spells are Cantrips.` : `${chaMod === 1 ? "The" : "Each"} spell's level can be no higher than ${Parser.spLevelToFull(maxSpellLevel)}.`;

			return `This dragon can innately cast ${Parser.numberToText(chaMod)} spell${chaMod === 1 ? "" : "s"}, once per day${chaMod === 1 ? "" : " each"}, requiring no material components. ${levelString} The dragon's spell save DC is {@dc ${spellSaveDc}}, and it has {@hit ${spellToHit}} to hit with spell attacks.${isSeeSpellsPageNote ? ` See the {@filter spell page|spells|level=${[...new Array(maxSpellLevel + 1)].map((it, i) => i).join(";")}} for a list of spells the dragon is capable of casting.` : ""}`;
		}

		static getVariantEntries (dragon) {
			if (!Renderer.monster.dragonCasterVariant.hasCastingColorVariant(dragon)) return [];

			const meta = Renderer.monster.dragonCasterVariant.getMeta(dragon);
			const {exampleSpellsUnofficial, exampleSpellsFtd} = meta;

			const vFtd = exampleSpellsFtd?.length ? {
				type: "variant",
				name: "Dragons as Innate Spellcasters",
				source: Parser.SRC_FTD,
				entries: [
					`${Renderer.monster.dragonCasterVariant.getSpellcasterDetailsPart(meta)}`,
					`A suggested spell list is shown below, but you can also choose spells to reflect the dragon's character. A dragon who innately casts {@filter druid|spells|class=druid} spells feels different from one who casts {@filter warlock|spells|class=warlock} spells. You can also give a dragon spells of a higher level than this rule allows, but such a tweak might increase the dragon's challenge rating\u2014especially if those spells deal damage or impose conditions on targets.`,
					{
						type: "list",
						items: exampleSpellsFtd.map(it => `{@spell ${it}}`),
					},
				],
			} : null;

			const vBasic = {
				type: "variant",
				name: "Dragons as Innate Spellcasters",
				entries: [
					"Dragons are innately magical creatures that can master a few spells as they age, using this variant.",
					`A young or older dragon can innately cast a number of spells equal to its Charisma modifier. Each spell can be cast once per day, requiring no material components, and the spell's level can be no higher than one-third the dragon's challenge rating (rounded down). The dragon's bonus to hit with spell attacks is equal to its proficiency bonus + its Charisma bonus. The dragon's spell save DC equals 8 + its proficiency bonus + its Charisma modifier.`,
					`{@note ${Renderer.monster.dragonCasterVariant.getSpellcasterDetailsPart({...meta, isSeeSpellsPageNote: true})}${exampleSpellsUnofficial?.length ? ` A selection of examples are shown below:` : ""}}`,
				],
			};
			if (dragon.source !== Parser.SRC_MM) {
				vBasic.source = Parser.SRC_MM;
				vBasic.page = 86;
			}
			if (exampleSpellsUnofficial) {
				const ls = {
					type: "list",
					style: "list-italic",
					items: exampleSpellsUnofficial.map(it => `{@spell ${it}}`),
				};
				vBasic.entries.push(ls);
			}

			return [vFtd, vBasic].filter(Boolean);
		}

		static getHtml (dragon, {renderer = null} = {}) {
			const variantEntries = Renderer.monster.dragonCasterVariant.getVariantEntries(dragon);
			if (!variantEntries.length) return null;
			return variantEntries.map(it => renderer.render(it)).join("");
		}
	};

	static getCrScaleTarget (
		{
			win,
			btnScale,
			$btnScale,
			initialCr,
			cbRender,
			isCompact,
		},
	) {
		if (btnScale && $btnScale) throw new Error(`Only one of "$btnScale" and "btnScale" may be provided!`);

		$btnScale ||= $(btnScale);

		const evtName = "click.cr-scaler";

		let slider;

		const $body = $(win.document.body);
		function cleanSliders () {
			$body.find(`.mon__cr-slider-wrp`).remove();
			$btnScale.off(evtName);
			if (slider) slider.destroy();
		}

		cleanSliders();

		const $wrp = $(`<div class="mon__cr-slider-wrp ${isCompact ? "mon__cr-slider-wrp--compact" : ""}"></div>`);

		const cur = Parser.CRS.indexOf(initialCr);
		if (cur === -1) throw new Error(`Initial CR ${initialCr} was not valid!`);

		const comp = BaseComponent.fromObject({
			min: 0,
			max: Parser.CRS.length - 1,
			cur,
		});
		slider = new ComponentUiUtil.RangeSlider({
			comp,
			propMin: "min",
			propMax: "max",
			propCurMin: "cur",
			fnDisplay: ix => Parser.CRS[ix],
		});
		slider.$get().appendTo($wrp);

		$btnScale.off(evtName).on(evtName, (evt) => evt.stopPropagation());
		$wrp.on(evtName, (evt) => evt.stopPropagation());
		$body.off(evtName).on(evtName, cleanSliders);

		comp._addHookBase("cur", () => {
			cbRender(Parser.crToNumber(Parser.CRS[comp._state.cur]));
			$body.off(evtName);
			cleanSliders();
		});

		$btnScale.after($wrp);
	}

	static getSelSummonSpellLevel (mon) {
		if (mon.summonedBySpellLevel == null) return;

		return e_({
			tag: "select",
			clazz: "input-xs form-control form-control--minimal w-initial ve-inline-block ve-popwindow__hidden no-print",
			name: "mon__sel-summon-spell-level",
			children: [
				e_({tag: "option", val: "-1", text: "\u2014"}),
				...[...new Array(VeCt.SPELL_LEVEL_MAX + 1 - mon.summonedBySpellLevel)].map((_, i) => e_({
					tag: "option",
					val: i + mon.summonedBySpellLevel,
					text: i + mon.summonedBySpellLevel,
				})),
			],
		});
	}

	static getSelSummonClassLevel (mon) {
		if (mon.summonedByClass == null && !mon.summonedScaleByPlayerLevel) return;

		return e_({
			tag: "select",
			clazz: "input-xs form-control form-control--minimal w-initial ve-inline-block ve-popwindow__hidden no-print",
			name: "mon__sel-summon-class-level",
			children: [
				e_({tag: "option", val: "-1", text: "\u2014"}),
				...[...new Array(VeCt.LEVEL_MAX)].map((_, i) => e_({
					tag: "option",
					val: i + 1,
					text: i + 1,
				})),
			],
		});
	}

	/* -------------------------------------------- */

	static getCompactRenderedStringSection (
		{
			ent,
			renderer,
			title,
			key,
			depth,
			styleHint,
			isHangingList = false,
		},
	) {
		if (!ent[key]) return "";

		styleHint ||= VetoolsConfig.get("styleSwitcher", "style");

		const noteKey = `${key}Note`;

		const entriesArr = key === "lairActions" || key === "regionalEffects"
			? [{type: "entries", entries: ent[key]}]
			: ent[key];

		const content = Renderer.monster._getCompactRenderedStringSection_getRenderedContent({
			renderer,
			depth,
			isHangingList,
			entriesArr,
		});

		const ptHeader = ent[key] ? Renderer.monster.getSectionIntro(ent, {prop: key}) : "";
		const isNonStatblock = key === "lairActions" || key === "regionalEffects";

		return `<tr><td colspan="6"><h3 class="stats__sect-header-inner ${isNonStatblock ? "stats__sect-header-inner--non-statblock" : ""}">${title}${ent[noteKey] ? ` (<span class="ve-small">${ent[noteKey]}</span>)` : ""}</h3></td></tr>
		<tr><td colspan="6" class="pt-2 pb-2">
		${key === "legendary" && Renderer.monster.hasLegendaryActions(ent) ? Renderer.monster.getLegendaryActionIntro(ent, {styleHint}) : ""}
		${ptHeader ? `<p>${ptHeader}</p>` : ""}
		${content}
		</td></tr>`;
	}

	static _getCompactRenderedStringSection_getRenderedContent (
		{
			renderer,
			depth,
			isHangingList,
			entriesArr,
		},
	) {
		if (isHangingList) {
			const toRender = {
				type: "list",
				style: "list-hang-notitle",
				items: MiscUtil.copy(entriesArr)
					.map(entSub => {
						if (entSub.rendered) return {type: "wrappedHtml", html: entSub.rendered};

						if (entSub.name && entSub.entries) entSub.type ||= "item";
						return entSub;
					}),
			};

			return renderer.render(toRender, depth);
		}

		return entriesArr.map(entSub => entSub.rendered || renderer.render(entSub, depth)).join("");
	}

	/* -------------------------------------------- */

	static getTypeAlignmentPart (mon) {
		const typeObj = Parser.monTypeToFullObj(mon.type);

		return `${mon.level != null ? `${Parser.getOrdinalForm(mon.level)}-level ` : ""}${typeObj.asTextSidekick ? `${typeObj.asTextSidekick}; ` : ""}${Renderer.utils.getRenderedSize(mon.size)}${mon.sizeNote ? ` ${mon.sizeNote}` : ""} ${typeObj.asText}${mon.alignment ? `, ${mon.alignmentPrefix ? Renderer.get().render(mon.alignmentPrefix) : ""}${Parser.alignmentListToFull(mon.alignment).toTitleCase()}` : ""}`;
	}

	static _getInitiativePart_passive ({mon, initPassive}) {
		if (!mon.initiative?.advantageMode) return initPassive;
		const ptTitle = `This creature has ${mon.initiative?.advantageMode === "adv" ? "Advantage" : "Disadvantage"} on Initiative.`;
		return `<span title="${ptTitle.qq()}" class="help-subtle">${initPassive}</span>`;
	}

	static getInitiativePart (mon, {isPlainText = false, renderer = null} = {}) {
		const initBonus = this.getInitiativeBonusNumber({mon});
		const initPassive = this._getInitiativePassive({mon, initBonus});
		if (initBonus == null || initPassive == null) return "\u2014";
		const entry = `{@initiative ${initBonus}} (${this._getInitiativePart_passive({mon, initPassive})})`;
		return isPlainText ? Renderer.stripTags(entry) : (renderer || Renderer.get()).render(entry);
	}

	static getInitiativeBonusNumber ({mon}) {
		if (mon.initiative == null && (mon.dex == null || mon.dex.special)) return null;
		if (mon.initiative == null) return Parser.getAbilityModNumber(mon.dex);
		if (typeof mon.initiative === "number") return mon.initiative;
		if (typeof mon.initiative !== "object") return null;
		if (typeof mon.initiative.initiative === "number") return mon.initiative.initiative;
		if (mon.dex == null) return;
		const profBonus = mon.initiative.proficiency && Parser.crToNumber(mon.cr) < VeCt.CR_CUSTOM
			? mon.initiative.proficiency * Parser.crToPb(mon.cr)
			: 0;
		return Parser.getAbilityModNumber(mon.dex) + profBonus;
	}

	static _getInitiativePassive ({mon, initBonus}) {
		if (initBonus == null) return null;
		if (mon.initiative == null || typeof mon.initiative !== "object") return 10 + initBonus;
		const advDisMod = mon.initiative.advantageMode === "adv" ? 5 : mon.initiative.advantageMode === "dis" ? -5 : 0;
		return 10 + initBonus + advDisMod;
	}

	static getSavesPart (mon) { return `${Object.keys(mon.save || {}).sort(SortUtil.ascSortAtts).map(s => Renderer.monster.getSave(Renderer.get(), s, mon.save[s])).join(", ")}`; }

	static getSensesPart (mon, {isTitleCase = false, isForcePassive = false} = {}) {
		const passive = mon.passive ?? (typeof mon.wis === "number" ? (10 + Parser.getAbilityModNumber(mon.wis)) : null);

		const pts = [
			mon.senses ? Renderer.utils.getRenderedSenses(mon.senses, {isTitleCase}) : "",
			passive != null
				? `${isTitleCase ? "Passive" : "passive"} Perception ${passive}`
				: (isForcePassive || mon.senses) ? "\u2014" : "",
		]
			.filter(Boolean);
		return pts.join(", ");
	}

	static getPbPart (mon, {isPlainText = false} = {}) {
		if (!mon.pbNote && Parser.crToNumber(mon.cr) >= VeCt.CR_CUSTOM) return "";
		return mon.pbNote ?? UiUtil.intToBonus(Parser.crToPb(mon.cr), {isPretty: true});
	}

	/* -------------------------------------------- */

	/**
	 * @param {object} mon
	 * @param {"classic" | "one" | null} styleHint
	 * @param {boolean} isPlainText
	 * @return {string}
	 */
	static getChallengeRatingPart (mon, {styleHint = null, isPlainText = false} = {}) {
		styleHint ||= VetoolsConfig.get("styleSwitcher", "style");

		switch (styleHint) {
			case "classic": return this._getChallengeRatingPart_classic({mon, isPlainText});
			case "one": return this._getChallengeRatingPart_one({mon, isPlainText});
			default: throw new Error(`Unhandled style "${styleHint}"!`);
		}
	}

	static _getChallengeRatingPart_classic_getBasicCrRender ({cr = null, xp = null, isMythic = false} = {}) {
		if (cr == null && xp == null) return null;

		xp ??= Parser.crToNumber(cr) < VeCt.CR_CUSTOM
			? Parser.crToXpNumber(cr)
			: null;
		const xpMythic = xp != null && isMythic
			? Parser.crToXpNumber(cr) != null ? (Parser.crToXpNumber(cr) * 2) : null
			: null;

		const ptXp = xp != null ? xp.toLocaleStringVe() : null;
		const ptXpMythic = xpMythic != null ? xpMythic.toLocaleStringVe() : null;

		const ptXps = [
			ptXp != null ? `${ptXp} XP` : null,
			ptXpMythic != null ? `${ptXpMythic} XP as a mythic encounter` : null,
		]
			.filter(Boolean)
			.joinConjunct(", ", ", or ", true);

		if (cr == null && !ptXps) return null;

		if (cr == null) return `(${ptXps})`;

		if (Parser.crToNumber(cr) >= VeCt.CR_CUSTOM) return `${cr}${ptXps ? ` (${ptXps})` : ""}`;

		return `${cr} (${ptXps})`;
	}

	static _getChallengeRatingPart_classic ({mon, isPlainText = false} = {}) {
		if (mon.cr == null) return "\u2014";

		if (typeof mon.cr === "string") return this._getChallengeRatingPart_classic_getBasicCrRender({cr: mon.cr, isMythic: Renderer.monster.hasMythicActions(mon)});

		const stack = [this._getChallengeRatingPart_classic_getBasicCrRender({cr: mon.cr.cr, xp: mon.cr.xp, isMythic: Renderer.monster.hasMythicActions(mon)})];
		if (mon.cr.lair || mon.cr.xpLair) stack.push(`${this._getChallengeRatingPart_classic_getBasicCrRender({cr: mon.cr.lair, xp: mon.cr.xpLair})} when encountered in lair`);
		if (mon.cr.coven || mon.cr.xpCoven) stack.push(`${this._getChallengeRatingPart_classic_getBasicCrRender({cr: mon.cr.coven, xp: mon.cr.xpCoven})} when part of a coven`);
		return stack
			.filter(Boolean)
			.joinConjunct(", ", " or ");
	}

	static _getChallengeRatingPart_one ({mon, isPlainText = false} = {}) {
		const crBase = mon.cr?.cr ?? mon.cr;
		const xpBase = mon.cr?.xp ?? (Parser.crToNumber(crBase) < VeCt.CR_CUSTOM ? Parser.crToXpNumber(crBase) : 0);

		const ptsXp = Parser.crToNumber(mon.cr) >= VeCt.CR_CUSTOM
			? [
				xpBase,
			]
			// TODO(ODND) speculative text; revise
			: [
				xpBase ? xpBase.toLocaleStringVe() : null,
				Renderer.monster.hasMythicActions(mon) ? `${(xpBase * 2).toLocaleStringVe()} as a mythic encounter` : null,
			]
				.filter(Boolean);

		if (mon.cr != null && typeof mon.cr !== "string") {
			if (mon.cr.lair || mon.cr.xpLair) ptsXp.push(`${(mon.cr.xpLair ? mon.cr.xpLair.toLocaleStringVe() : null) || Parser.crToXp(mon.cr.lair)} in lair`);
			if (mon.cr.coven || mon.cr.xpCoven) ptsXp.push(`${(mon.cr.xpCoven ? mon.cr.xpCoven.toLocaleStringVe() : null) || Parser.crToXp(mon.cr.coven)} when part of a coven`);
		}

		const ptPbVal = Renderer.monster.getPbPart(mon, {isPlainText});

		const ptParens = [
			ptsXp.length ? `XP ${ptsXp.joinConjunct(", ", ", or ", true)}` : "",
			ptPbVal ? `${isPlainText ? "PB" : `<span title="Proficiency Bonus">PB</span>`} ${ptPbVal}` : "",
		]
			.filter(Boolean)
			.join("; ");

		return `${crBase || "None"}${ptParens ? ` (${ptParens})` : ""}`;
	}

	/* -------------------------------------------- */

	static getImmunitiesCombinedPart (mon, {isPlainText = false} = {}) {
		if (!mon.immune && !mon.conditionImmune) return "";

		const ptImmune = mon.immune ? Parser.getFullImmRes(mon.immune, {isTitleCase: true, isPlainText}) : "";
		const ptConditionImmune = mon.conditionImmune ? Parser.getFullCondImm(mon.conditionImmune, {isTitleCase: true, isPlainText}) : "";

		const hasSemi = ptImmune && ptConditionImmune && (ptImmune.includes(";") || ptConditionImmune.includes(";"));
		const joiner = !hasSemi || !isPlainText ? "; " : `<span class="italic">;</span> `;

		return [ptImmune, ptConditionImmune].filter(Boolean).join(joiner);
	}

	/* -------------------------------------------- */

	static getGearPart (mon, {renderer = null} = {}) {
		if (!mon.gear?.length && !mon.attachedItems?.length) return "";

		renderer ||= Renderer.get();
		return (mon.gear || mon.attachedItems)
			.map(ref => {
				const uid = ref.item || ref;
				const quantity = ref.quantity || 1;

				const unpacked = DataUtil.proxy.unpackUid("item", uid, "item");
				unpacked.name = unpacked.name.toTitleCase();
				const uidTitle = DataUtil.proxy.getUid("item", unpacked, {isMaintainCase: true});

				if (quantity === 1) return renderer.render(`{@item ${uidTitle}}`);

				const displayName = unpacked.name.toPlural();
				return renderer.render(`${Parser.numberToText(quantity)} {@item ${uidTitle}|${displayName}}`);
			})
			.join(", ");
	}

	/* -------------------------------------------- */

	static getRenderWithPlugins ({renderer, mon, fn}) {
		return renderer.withPlugin({
			pluginTypes: [
				"dice",
			],
			fnPlugin: () => {
				if (mon.summonedBySpellLevel == null && mon._summonedByClass_level == null) return null;
				if (mon._summonedByClass_level) {
					return {
						additionalData: {
							"data-summoned-by-class-level": mon._summonedByClass_level,
						},
					};
				}
				return {
					additionalData: {
						"data-summoned-by-spell-level": mon._summonedBySpell_level ?? mon.summonedBySpellLevel,
					},
				};
			},
			fn,
		});
	}

	static _RENDER_CLASSIC = new _RenderCompactBestiaryImplClassic();
	static _RENDER_ONE = new _RenderCompactBestiaryImplOne();

	/**
	 * @param ent
	 * @param [opts]
	 * @param [opts.isCompact]
	 * @param [opts.isEmbeddedEntity]
	 * @param [opts.isShowScalers]
	 * @param [opts.isScaledCr]
	 * @param [opts.isScaledSpellSummon]
	 * @param [opts.isScaledClassSummon]
	 */
	static getCompactRenderedString (ent, opts) {
		const styleHint = VetoolsConfig.get("styleSwitcher", "style");
		switch (styleHint) {
			case "classic": return this._RENDER_CLASSIC.getCompactRenderedString(ent, opts);
			case "one": return this._RENDER_ONE.getCompactRenderedString(ent, opts);
			default: throw new Error(`Unhandled style "${styleHint}"!`);
		}
	}

	static _getFormulaMax (formula) {
		return Renderer.dice.parseRandomise2(`dmax(${formula})`);
	}

	static getRenderedHp (hp, {isPlainText = false} = {}) {
		if (hp.special != null) return isPlainText ? Renderer.stripTags(hp.special) : Renderer.get().render(hp.special);

		if (/^\d+d1$/.exec(hp.formula)) {
			return hp.average;
		}

		if (isPlainText) return `${hp.average} (${hp.formula})`;

		const maxVal = Renderer.monster._getFormulaMax(hp.formula);
		const maxStr = maxVal ? `Maximum: ${maxVal}` : "";
		return `${maxStr ? `<span title="${maxStr}" class="help-subtle">` : ""}${hp.average}${maxStr ? "</span>" : ""} ${Renderer.get().render(`({@dice ${hp.formula}|${hp.formula}|Hit Points})`)}`;
	}

	static getRenderedResource (res, isPlainText) {
		if (!res.formula) return `${res.value}`;

		if (isPlainText) return `${res.value} (${res.formula})`;

		const maxVal = Renderer.monster._getFormulaMax(res.formula);
		const maxStr = maxVal ? `Maximum: ${maxVal}` : "";
		return `${maxStr ? `<span title="${maxStr}" class="help-subtle">` : ""}${res.value}${maxStr ? "</span>" : ""} ${Renderer.get().render(`({@dice ${res.formula}|${res.formula}|${res.name}})`)}`;
	}

	/**
	 * @param {object} mon
	 * @param {string} abil
	 * @param {?number} defaultScore
	 */
	static getSafeAbilityScore (mon, abil, {defaultScore = 0} = {}) {
		if (!mon || abil == null) return defaultScore;
		if (mon[abil] == null) return defaultScore;
		return typeof mon[abil] === "number" ? mon[abil] : (defaultScore);
	}

	/* -------------------------------------------- */

	/**
	 * @param {object} mon
	 * @param {?Renderer} renderer
	 * @param {?Function} fnGetSpellTraits
	 */
	static getSubEntries (mon, {renderer = null, fnGetSpellTraits = null} = {}) {
		renderer ||= Renderer.get();

		fnGetSpellTraits ||= Renderer.monster.getSpellcastingRenderedTraits.bind(Renderer.monster, renderer);
		const entsTrait = Renderer.monster.getOrderedTraits(mon, {fnGetSpellTraits});
		const entsAction = Renderer.monster.getOrderedActions(mon, {fnGetSpellTraits});
		const entsBonusAction = Renderer.monster.getOrderedBonusActions(mon, {fnGetSpellTraits});
		const entsReaction = Renderer.monster.getOrderedReactions(mon, {fnGetSpellTraits});
		const entsLegendaryAction = Renderer.monster.getOrderedLegendaryActions(mon, {fnGetSpellTraits});
		const entsMythicAction = Renderer.monster.getOrderedMythicActions(mon, {fnGetSpellTraits});
		const legGroup = DataUtil.monster.getLegendaryGroup(mon);

		return {
			entsTrait,
			entsAction,
			entsBonusAction,
			entsReaction,
			entsLegendaryAction,
			entsMythicAction,
			legGroup,
		};
	}

	/* -------------------------------------------- */

	static _getRenderedAbilityScores_isSpecial ({mon, abv}) {
		return mon[abv] != null && typeof mon[abv] !== "number";
	}

	static _getRenderedAbilityScores_getSpecialMeta ({mon}) {
		const specialByAbil = {};
		const specialByValue = {};

		Parser.ABIL_ABVS
			.forEach(abv => {
				if (!this._getRenderedAbilityScores_isSpecial({mon, abv})) return;

				const specialMeta = {abil: abv, value: mon[abv].special};
				specialByAbil[abv] = specialMeta;
				specialMeta.family = (specialByValue[specialMeta.value] = specialByValue[specialMeta.value] || []);
				specialMeta.family.push(specialMeta);
			});

		const specialSeenAbs = new Set();
		const ptsSpecial = Parser.ABIL_ABVS
			.map(abv => {
				if (!specialByAbil[abv]) return null;
				if (specialSeenAbs.has(specialByAbil[abv].abil)) return null;
				specialByAbil[abv].family.forEach(meta => specialSeenAbs.add(meta.abil));
				return `<b>${specialByAbil[abv].family.map(meta => meta.abil.toUpperCase()).join(", ")}</b> ${specialByAbil[abv].value}`;
			})
			.filter(Boolean);

		const abvsRemaining = Parser.ABIL_ABVS.filter(ab => !specialSeenAbs.has(ab));

		return {
			abvsRemaining,
			ptsSpecial,
		};
	}

	static _getRenderedAbilityScores_classic ({mon}) {
		const {abvsRemaining, ptsSpecial} = this._getRenderedAbilityScores_getSpecialMeta({mon});
		const ptSpecial = ptsSpecial.map(pt => `<tr><td colspan="6">${pt}</td></tr>`).join("");

		if (Parser.ABIL_ABVS.every(abv => this._getRenderedAbilityScores_isSpecial({mon, abv}))) return ptSpecial;

		return `${ptSpecial}
		<tr>${abvsRemaining.map(ab => `<th class="ve-col-2 ve-text-center bold">${ab.toUpperCase()}</th>`).join("")}</tr>
		<tr>${abvsRemaining.map(ab => `<td class="ve-text-center">${Renderer.utils.getAbilityRoller(mon, ab)}</td>`).join("")}</tr>`;
	}

	static _getRenderedAbilityScores_one ({mon, renderer}) {
		renderer ||= Renderer.get();

		const {abvsRemaining, ptsSpecial} = this._getRenderedAbilityScores_getSpecialMeta({mon});
		const ptSpecial = ptsSpecial.map(pt => `<tr><td colspan="6">${pt}</td></tr>`).join("");

		const ptHeaders = Array.from(
			{length: 14},
			(_, i) => {
				const colClass = i % 5 === 0
					? "stats-tbl-ability-scores__lbl-abv"
					: i % 5 === 4 ? "stats-tbl-ability-scores__lbl-spacer" : "stats-tbl-ability-scores__lbl-score";
				return `<td class="${colClass}"><div class="ve-muted ve-text-center small-caps no-wrap">${i % 5 === 2 ? "mod" : i % 5 === 3 ? "save" : ""}</div></td>`;
			},
		)
			.join("");

		Object.keys(mon.save || {})
			.map(s => Renderer.monster.getSave(Renderer.get(), s, mon.save[s]));

		const ptsCells = Parser.ABIL_ABVS
			.flatMap((abv, i) => {
				const styleName = i < 3 ? "physical" : "mental";

				const numScore = abvsRemaining.includes(abv) ? mon[abv] : null;
				const ptScore = numScore != null ? `${mon[abv]}` : `\u2013`;
				const ptBonus = numScore != null ? Renderer.utils.getAbilityRoller(mon, abv, {isDisplayAsBonus: true}) : `\u2013`;
				const ptSave = mon.save?.[abv] == null
					? numScore == null ? "\u2013" : renderer.render(`{@savingThrow ${abv} ${Parser.getAbilityModNumber(ptScore)}}`)
					: renderer.render(`{@savingThrow ${abv} ${mon.save[abv]}}`);

				return [
					`<td class="stats-tbl-ability-scores__lbl-abv stats__disp-as-score--${styleName} stats__disp-as-score--label"><div class="bold small-caps ve-text-right">${abv.toTitleCase()}</div></td>`,
					`<td class="stats-tbl-ability-scores__lbl-score stats__disp-as-score--${styleName}"><div class="ve-text-center">${ptScore}</div></td>`,
					`<td class="stats-tbl-ability-scores__lbl-score stats__disp-as-bonus--${styleName}"><div class="ve-text-center">${ptBonus}</div></td>`,
					`<td class="stats-tbl-ability-scores__lbl-score stats__disp-as-bonus--${styleName}"><div class="ve-text-center">${ptSave}</div></td>`,
					i % 3 !== 2 ? `<td class="stats-tbl-ability-scores__lbl-spacer"><div></div></td>` : "",
				];
			});

		const ptsCellsPhysical = ptsCells.slice(0, 14);
		const ptsCellsMental = ptsCells.slice(14);

		return `
		<tr><td colspan="6" class="pt-0 pb-3">
			<table class="w-100">
				<tbody>
					<tr>${ptHeaders}</tr>
					<tr>${ptsCellsPhysical.join("")}</tr>
					<tr>${ptsCellsMental.join("")}</tr>
				</tbody>
			</table>
		</td></tr>

		${ptSpecial}`;
	}

	/**
	 * @param {object}} mon
	 * @param {"classic" | "one" | null} styleHint
	 * @param {?Renderer} renderer
	 */
	static getRenderedAbilityScores (mon, {styleHint = null, renderer = null} = {}) {
		styleHint ||= VetoolsConfig.get("styleSwitcher", "style");

		switch (styleHint) {
			case "classic": return Renderer.monster._getRenderedAbilityScores_classic({mon, renderer});
			case "one": return Renderer.monster._getRenderedAbilityScores_one({mon, renderer});
			default: throw new Error(`Unhandled style "${styleHint}"!`);
		}
	}

	/* -------------------------------------------- */

	static getSpellcastingRenderedTraits (renderer, mon, {displayAsProp = "trait"} = {}) {
		return (mon.spellcasting || [])
			.filter(entry => (entry.displayAs || "trait") === displayAsProp)
			.map(entry => {
				const isLegendaryMythic = ["legendary", "mythic"].includes(displayAsProp);

				// For legendary/mythic, assume list-item format
				if (isLegendaryMythic) {
					if (!entry.headerEntries?.length) return null;
					return {type: "item", name: entry.name, entries: entry.headerEntries};
				}

				entry.type ||= "spellcasting";
				const rendered = renderer.render(entry, 2);
				if (!rendered.length) return null;

				return {name: entry.name, rendered};
			})
			.filter(Boolean);
	}

	static getOrderedTraits (mon, {fnGetSpellTraits} = {}) {
		let traits = mon.trait ? MiscUtil.copyFast(mon.trait) : null;

		if (fnGetSpellTraits) {
			const spellTraits = fnGetSpellTraits(mon, {displayAsProp: "trait"});
			if (spellTraits.length) traits = traits ? traits.concat(spellTraits) : spellTraits;
		}

		if (traits?.length) return traits.sort((a, b) => SortUtil.monTraitSort(a, b));
		return null;
	}

	static getOrderedActions (mon, {fnGetSpellTraits} = {}) { return Renderer.monster._getOrderedActionsBonusActions({mon, fnGetSpellTraits, prop: "action"}); }
	static getOrderedBonusActions (mon, {fnGetSpellTraits} = {}) { return Renderer.monster._getOrderedActionsBonusActions({mon, fnGetSpellTraits, prop: "bonus"}); }
	static getOrderedReactions (mon, {fnGetSpellTraits} = {}) { return Renderer.monster._getOrderedActionsBonusActions({mon, fnGetSpellTraits, prop: "reaction"}); }
	static getOrderedLegendaryActions (mon, {fnGetSpellTraits} = {}) { return Renderer.monster._getOrderedActionsBonusActions({mon, fnGetSpellTraits, prop: "legendary"}); }
	static getOrderedMythicActions (mon, {fnGetSpellTraits} = {}) { return Renderer.monster._getOrderedActionsBonusActions({mon, fnGetSpellTraits, prop: "mythic"}); }

	static _getOrderedActionsBonusActions ({mon, fnGetSpellTraits, prop} = {}) {
		let actions = mon[prop] ? MiscUtil.copyFast(mon[prop]) : null;

		let spellActions;
		if (fnGetSpellTraits) {
			spellActions = fnGetSpellTraits(mon, {displayAsProp: prop});
		}

		if (!spellActions?.length && !actions?.length) return null;
		if (!actions?.length) return spellActions;
		if (!spellActions?.length) return actions;

		// Actions are generally ordered as:
		//  - "Multiattack"
		//  - Attack actions
		//  - Other actions (alphabetical)
		// Insert our spellcasting section into the "Other actions" part, in an alphabetically-appropriate place.

		const ixLastAttack = actions.findLastIndex(it => it.entries && it.entries.length && typeof it.entries[0] === "string" && /\{@atkr? /.test(it.entries[0]));

		const actionsAttack = ~ixLastAttack ? actions.slice(0, ixLastAttack) : [];
		const actionsOther = ~ixLastAttack ? actions.slice(ixLastAttack) : actions;

		// Weave spellcasting actions into the "other" actions block.
		// This attempts to minimize re-ordering, which would otherwise occur if we were to use e.g. `sort`.
		spellActions
			.forEach(ent => {
				if (!ent.name) return actionsOther.push(ent);

				const ixInsert = actionsOther.findIndex((entAction, ix) => entAction.name && SortUtil.ascSortLower(entAction.name, ent.name) >= 0);
				if (~ixInsert) actionsOther.splice(ixInsert, 0, ent);
				else actionsOther.push(ent);
			});

		return [...actionsAttack, ...actionsOther];
	}

	static getSkillsString (renderer, mon) {
		if (!mon.skill) return "";

		function doSortMapJoinSkillKeys (obj, keys, joinWithOr) {
			const toJoin = keys.sort(SortUtil.ascSort).map(s => `<span data-mon-skill="${s.toTitleCase()}|${obj[s]}">${renderer.render(`{@skill ${s.toTitleCase()}}`)} ${Renderer.get().render(`{@skillCheck ${s.replace(/ /g, "_")} ${obj[s]}}`)}</span>`);
			return joinWithOr ? toJoin.joinConjunct(", ", " or ") : toJoin.join(", ");
		}

		const skills = doSortMapJoinSkillKeys(mon.skill, Object.keys(mon.skill).filter(k => k !== "other" && k !== "special"));
		if (mon.skill.other || mon.skill.special) {
			const others = mon.skill.other && mon.skill.other.map(it => {
				if (it.oneOf) {
					return `plus one of the following: ${doSortMapJoinSkillKeys(it.oneOf, Object.keys(it.oneOf), true)}`;
				}
				throw new Error(`Unhandled monster "other" skill properties!`);
			});
			const special = mon.skill.special && Renderer.get().render(mon.skill.special);
			return [skills, others, special].filter(Boolean).join(", ");
		}
		return skills;
	}

	static _TOOL_PROF_TO_SOURCE__CLASSIC = {
		"vehicles": false,
		"vehicles (air)": false,
		"vehicles (land)": false,
		"vehicles (water)": false,
		"vehicles (space)": false,
	};

	static _TOOL_PROF_TO_SOURCE__ONE = {
		"playing card set": {name: "Playing Cards"},
	};

	static getToolsString (renderer, mon, {styleHint = null} = {}) {
		if (!mon.tool) return "";

		styleHint ||= VetoolsConfig.get("styleSwitcher", "style");

		return Object.entries(mon.tool)
			.map(([uid, bonus]) => {
				if (uid.includes("|")) {
					const {name, source} = DataUtil.proxy.unpackUid("item", uid, "item");
					return `${renderer.render(`{@item ${name.toTitleCase()}|${source}} {@d20 ${bonus}||${name.toTitleCase()}}`)}`;
				}

				const mapping = Renderer.monster._TOOL_PROF_TO_SOURCE__CLASSIC[uid] ?? Renderer.monster._TOOL_PROF_TO_SOURCE__ONE[uid];
				if (mapping === false) return `${uid.toTitleCase()} ${renderer.render(`{@d20 ${bonus}||${uid.toTitleCase()}}`)}`;

				const itemFaux = {name: uid.toTitleCase(), source: styleHint === "one" ? Parser.SRC_XPHB : Parser.SRC_PHB, ...(mapping || {})};

				return `${renderer.render(`{@item ${itemFaux.name.toTitleCase()}|${itemFaux.source}} {@d20 ${bonus}||${itemFaux.name.toTitleCase()}}`)}`;
			})
			.join(", ");
	}

	static hasToken (mon, opts) {
		return Renderer.generic.hasToken(mon, opts);
	}

	static getTokenUrl (mon, opts) {
		return Renderer.generic.getTokenUrl(mon, "bestiary/tokens", opts);
	}

	static postProcessFluff (mon, fluff) {
		const thisGroup = DataUtil.monster.getLegendaryGroup(mon);
		if (!thisGroup) return fluff;

		const cpy = MiscUtil.copyFast(fluff);
		cpy.entries ||= [];

		const walker = MiscUtil.getWalker({isNoModification: true});

		// TODO is this good enough? Should additionally check for lair blocks which are not the last, and tag them with
		//   "data": {"lairRegionals": true}, and insert the lair/regional text there if available (do the current "append" otherwise)
		const entsLair = [];
		walker.walk(cpy.entries, {object: obj => {
			if (!["entries", "section"].includes(obj.type)) return;
			if (!obj.name || !obj.entries) return;
			if (!/\bLairs?\b/i.test(obj.name)) return;
			entsLair.push(obj);
		}});

		const tgtLair = entsLair.length === 1 ? entsLair[0].entries : cpy.entries;
		const isAddName = thisGroup.mythicEncounter
			|| [thisGroup.lairActions, thisGroup.regionalEffects].filter(Boolean).length !== 1;

		const handleGroupProp = (tgt, prop, name) => {
			if (!thisGroup[prop]) return;

			if (isAddName) {
				return tgt.push({
					type: "entries",
					entries: [
						{
							type: "entries",
							name,
							entries: MiscUtil.copyFast(thisGroup[prop]),
						},
					],
				});
			}

			tgt.push(...MiscUtil.copyFast(thisGroup[prop]));
		};

		handleGroupProp(tgtLair, "lairActions", "Lair Actions");
		handleGroupProp(tgtLair, "regionalEffects", "Regional Effects");
		handleGroupProp(cpy.entries, "mythicEncounter", `${mon.name} as a Mythic Encounter`);

		return cpy;
	}

	static getRenderedLanguages (languages, {styleHint = null} = {}) {
		styleHint ||= VetoolsConfig.get("styleSwitcher", "style");

		if (typeof languages === "string") languages = [languages]; // handle legacy format
		if (!languages?.length) return "\u2014";

		const out = languages.map(it => Renderer.get().render(it)).join(", ");
		if (styleHint === "classic") return out;
		return out.uppercaseFirst();
	}

	static initParsed (mon) {
		mon._pTypes = mon._pTypes || Parser.monTypeToFullObj(mon.type); // store the parsed type
		if (!mon._pCr) {
			if (Parser.crToNumber(mon.cr) === VeCt.CR_CUSTOM) mon._pCr = "Special";
			else if (Parser.crToNumber(mon.cr) === VeCt.CR_UNKNOWN) mon._pCr = "Unknown";
			else mon._pCr = mon.cr == null ? "\u2014" : (mon.cr.cr || mon.cr);
		}
		if (!mon._fCr) {
			mon._fCr = [mon._pCr];
			if (mon.cr) {
				if (mon.cr.lair) mon._fCr.push(mon.cr.lair);
				if (mon.cr.coven) mon._fCr.push(mon.cr.coven);
			}
		}
	}

	static updateParsed (mon) {
		delete mon._pTypes;
		delete mon._pCr;
		delete mon._fCr;
		Renderer.monster.initParsed(mon);
	}

	static getRenderedVariants (mon, {renderer = null} = {}) {
		renderer = renderer || Renderer.get();
		const dragonVariant = Renderer.monster.dragonCasterVariant.getHtml(mon, {renderer});
		const variants = mon.variant;
		if (!variants && !dragonVariant) return "";

		const rStack = [];
		(variants || []).forEach(v => renderer.recursiveRender(v, rStack));
		if (dragonVariant) rStack.push(dragonVariant);
		return rStack.join("");
	}

	static getRenderedEnvironment (envs) {
		if (!envs?.length) return "";

		const ptEntry = envs
			.map(env => `{@filter ${Parser.getEnvironmentDisplayName(env)}|bestiary|environment=${env}|preserve}`)
			.sort(SortUtil.ascSortLower)
			.join(", ");

		return Renderer.get().render(ptEntry);
	}

	static getRenderedTreasure (treasure) {
		if (!treasure?.length) return "";

		const ptEntry = treasure
			.map(treasure => Parser.getTreasureTypeEntry(treasure))
			.sort(SortUtil.ascSortLower)
			.join(", ");

		return Renderer.get().render(ptEntry);
	}

	/* -------------------------------------------- */

	static hasReactions (mon) { return !!(mon.reaction?.length || mon.spellcasting?.some(ent => ent.displayAs === "reaction")); }
	static hasBonusActions (mon) { return !!(mon.bonus?.length || mon.spellcasting?.some(ent => ent.displayAs === "bonus")); }
	static hasLegendaryActions (mon) { return !!(mon.legendary?.length || mon.spellcasting?.some(ent => ent.displayAs === "legendary")); }
	static hasMythicActions (mon) { return !!(mon.mythic?.length || mon.spellcasting?.some(ent => ent.displayAs === "mythic")); }

	/* -------------------------------------------- */

	static pGetFluff (mon) {
		return Renderer.utils.pGetFluff({
			entity: mon,
			pFnPostProcess: Renderer.monster.postProcessFluff.bind(Renderer.monster, mon),
			fluffProp: "monsterFluff",
		});
	}

	/* -------------------------------------------- */

	// region Custom hash ID packing/unpacking
	static getCustomHashId (mon) {
		if (!mon._isScaledCr && !mon._isScaledSpellSummon && !mon._scaledClassSummonLevel) return null;

		const {
			name,
			source,
			_scaledCr: scaledCr,
			_scaledSpellSummonLevel: scaledSpellSummonLevel,
			_scaledClassSummonLevel: scaledClassSummonLevel,
		} = mon;

		return [
			name,
			source,
			scaledCr ?? "",
			scaledSpellSummonLevel ?? "",
			scaledClassSummonLevel ?? "",
		].join("__").toLowerCase();
	}

	static getUnpackedCustomHashId (customHashId) {
		if (!customHashId) return null;

		const [, , scaledCr, scaledSpellSummonLevel, scaledClassSummonLevel] = customHashId.split("__").map(it => it.trim());

		if (!scaledCr && !scaledSpellSummonLevel && !scaledClassSummonLevel) return null;

		return {
			_scaledCr: scaledCr ? Number(scaledCr) : null,
			_scaledSpellSummonLevel: scaledSpellSummonLevel ? Number(scaledSpellSummonLevel) : null,
			_scaledClassSummonLevel: scaledClassSummonLevel ? Number(scaledClassSummonLevel) : null,
			customHashId,
		};
	}
	// endregion

	static async pGetModifiedCreature (monRaw, customHashId) {
		if (!customHashId) return monRaw;
		const {_scaledCr, _scaledSpellSummonLevel, _scaledClassSummonLevel} = Renderer.monster.getUnpackedCustomHashId(customHashId);
		if (_scaledCr) return ScaleCreature.scale(monRaw, _scaledCr);
		if (_scaledSpellSummonLevel) return ScaleSpellSummonedCreature.scale(monRaw, _scaledSpellSummonLevel);
		if (_scaledClassSummonLevel) return ScaleClassSummonedCreature.scale(monRaw, _scaledClassSummonLevel);
		throw new Error(`Unhandled custom hash ID "${customHashId}"`);
	}

	static _bindListenersScale (mon, ele) {
		const page = UrlUtil.PG_BESTIARY;
		const source = mon.source;
		const hash = UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_BESTIARY](mon);

		const fnRender = Renderer.hover.getFnRenderCompact(page);

		const $content = $(ele);

		$content
			.find(".mon__btn-scale-cr")
			.click(evt => {
				evt.stopPropagation();
				const win = (evt.view || {}).window;

				const $btn = $(evt.target).closest("button");
				const initialCr = mon._originalCr != null ? mon._originalCr : mon.cr.cr || mon.cr;
				const lastCr = mon.cr.cr || mon.cr;

				Renderer.monster.getCrScaleTarget({
					win,
					$btnScale: $btn,
					initialCr: lastCr,
					isCompact: true,
					cbRender: async (targetCr) => {
						const original = await DataLoader.pCacheAndGet(page, source, hash);
						const toRender = Parser.numberToCr(targetCr) === initialCr
							? original
							: await ScaleCreature.scale(original, targetCr);

						$content.empty().append(fnRender(toRender));

						Renderer.monster._bindListenersScale(toRender, ele);
					},
				});
			});

		$content
			.find(".mon__btn-reset-cr")
			.click(async () => {
				const toRender = await DataLoader.pCacheAndGet(page, source, hash);
				$content.empty().append(fnRender(toRender));

				Renderer.monster._bindListenersScale(toRender, ele);
			});

		const $selSummonSpellLevel = $content
			.find(`[name="mon__sel-summon-spell-level"]`)
			.change(async () => {
				const original = await DataLoader.pCacheAndGet(page, source, hash);
				const spellLevel = Number($selSummonSpellLevel.val());

				const toRender = ~spellLevel
					? await ScaleSpellSummonedCreature.scale(original, spellLevel)
					: original;

				$content.empty().append(fnRender(toRender));

				Renderer.monster._bindListenersScale(toRender, ele);
			})
			.val(mon._summonedBySpell_level != null ? `${mon._summonedBySpell_level}` : "-1");

		const $selSummonClassLevel = $content
			.find(`[name="mon__sel-summon-class-level"]`)
			.change(async () => {
				const original = await DataLoader.pCacheAndGet(page, source, hash);
				const classLevel = Number($selSummonClassLevel.val());

				const toRender = ~classLevel
					? await ScaleClassSummonedCreature.scale(original, classLevel)
					: original;

				$content.empty().append(fnRender(toRender));

				Renderer.monster._bindListenersScale(toRender, ele);
			})
			.val(mon._summonedByClass_level != null ? `${mon._summonedByClass_level}` : "-1");
	}

	static bindListenersCompact (mon, ele) {
		Renderer.monster._bindListenersScale(mon, ele);
	}

	static hover = class {
		static bindFluffImageMouseover ({mon, ele, $ele}) {
			if ($ele && ele) throw new Error(`Only one of "ele" and "$ele" may be provided!`);
			if (ele) $ele = $(ele);
			$ele
				.on("mouseover", evt => this._pOnFluffImageMouseover({evt, mon, $ele}));
		}

		static async _pOnFluffImageMouseover ({evt, mon, $ele}) {
			// We'll rebuild the mouseover handler with whatever we load
			$ele.off("mouseover");

			const fluff = mon ? await Renderer.monster.pGetFluff(mon) : null;

			if (fluff?.images?.length) return this._pOnFluffImageMouseover_hasImage({mon, $ele, fluff});
			return this._pOnFluffImageMouseover_noImage({mon, $ele});
		}

		static _pOnFluffImageMouseover_noImage ({mon, $ele}) {
			const hoverMeta = this.getMakePredefinedFluffImageHoverNoImage({name: mon?.name});
			$ele
				.on("mouseover", evt => hoverMeta.mouseOver(evt, $ele[0]))
				.on("mousemove", evt => hoverMeta.mouseMove(evt, $ele[0]))
				.on("mouseleave", evt => hoverMeta.mouseLeave(evt, $ele[0]))
				.trigger("mouseover");
		}

		static _pOnFluffImageMouseover_hasImage ({mon, $ele, fluff}) {
			const hoverMeta = this.getMakePredefinedFluffImageHoverHasImage({imageHref: fluff.images[0].href, name: mon.name});
			$ele
				.on("mouseover", evt => hoverMeta.mouseOver(evt, $ele[0]))
				.on("mousemove", evt => hoverMeta.mouseMove(evt, $ele[0]))
				.on("mouseleave", evt => hoverMeta.mouseLeave(evt, $ele[0]))
				.trigger("mouseover");
		}

		static getMakePredefinedFluffImageHoverNoImage ({name}) {
			return Renderer.hover.getMakePredefinedHover(
				{
					type: "entries",
					entries: [
						Renderer.utils.HTML_NO_IMAGES,
					],
					data: {
						hoverTitle: name ? `Image \u2014 ${name}` : "Image",
					},
				},
				{isBookContent: true},
			);
		}

		static getMakePredefinedFluffImageHoverHasImage ({imageHref, name}) {
			return Renderer.hover.getMakePredefinedHover(
				{
					type: "image",
					href: imageHref,
					data: {
						hoverTitle: name ? `Image \u2014 ${name}` : "Image",
					},
				},
				{isBookContent: true},
			);
		}
	};
};
Renderer.monster.CHILD_PROPS_EXTENDED = [...Renderer.monster.CHILD_PROPS, "lairActions", "regionalEffects"];

Renderer.monster.CHILD_PROPS_EXTENDED.forEach(prop => {
	const propFull = `monster${prop.uppercaseFirst()}`;
	Renderer[propFull] = {
		getCompactRenderedString (ent) {
			return Renderer.generic.getCompactRenderedString(ent, {isSkipPageRow: true});
		},
	};
});

Renderer.monsterAction.getWeaponLookupName = act => {
	return (act.name || "")
		.replace(/\(.*\)$/, "") // remove parenthetical text (e.g. "(Humanoid or Hybrid Form Only)" off the end
		.trim()
		.toLowerCase()
	;
};

Renderer.legendaryGroup = class {
	static getCompactRenderedString (legGroup, opts) {
		opts = opts || {};

		const ent = Renderer.legendaryGroup.getSummaryEntry(legGroup);
		if (!ent) return "";

		return `
		${Renderer.utils.getNameTr(legGroup, {isEmbeddedEntity: opts.isEmbeddedEntity})}
		<tr><td colspan="6" class="pb-2">
		${Renderer.get().setFirstSection(true).render(ent)}
		</td></tr>
		${Renderer.utils.getPageTr(legGroup)}`;
	}

	static getSummaryEntry (legGroup) {
		if (!legGroup || (!legGroup.lairActions && !legGroup.regionalEffects && !legGroup.mythicEncounter)) return null;

		return {
			type: "section",
			entries: [
				legGroup.lairActions ? {name: "Lair Actions", type: "entries", entries: legGroup.lairActions} : null,
				legGroup.regionalEffects ? {name: "Regional Effects", type: "entries", entries: legGroup.regionalEffects} : null,
				legGroup.mythicEncounter ? {name: "As a Mythic Encounter", type: "entries", entries: legGroup.mythicEncounter} : null,
			].filter(Boolean),
		};
	}
};

Renderer.item = class {
	static _sortProperties (a, b) {
		const uidA = a.uid || a;
		const uidB = b.uid || b;
		return SortUtil.ascSort(Renderer.item.getProperty(uidA, {isIgnoreMissing: true})?.name || "", Renderer.item.getProperty(uidB, {isIgnoreMissing: true})?.name || "");
	}

	static _getPropertyText ({item, property, valsUsed, renderer}) {
		const pFull = Renderer.item.getProperty(property?.uid || property);
		if (!pFull) return "";

		const ptNote = property.note ? ` (${property.note})` : "";

		if (!pFull.template) return `${pFull.name}${ptNote}`;

		const toRender = Renderer.utils.applyTemplate(
			item,
			pFull.template,
			{
				fnPreApply: (fullMatch, variablePath) => {
					if (variablePath === "item.dmg2") valsUsed.dmg2 = true;
					if (variablePath === "item.range") valsUsed.range = true;
				},
				mapCustom: {
					"prop_name": pFull.name.replace(/-/g, "\u2011"),
					"prop_name_lower": pFull.name.replace(/-/g, "\u2011").toLowerCase(),
				},
				mapCustomFns: {
					"item.dmg1": () => Renderer.item._getTaggedDamage(item.dmg1, {renderer}),
					"item.dmg2": () => Renderer.item._getTaggedDamage(item.dmg2, {renderer}),

					"item.ammoType": () => {
						if (!item.ammoType) return "";
						return `{@item ${item.ammoType.toTitleCase()}}`;
					},
				},
			},
		);

		return `${renderer.render(toRender)}${ptNote}`;
	}

	static _getPropertiesText (item, {renderer = null} = {}) {
		renderer = renderer || Renderer.get();

		if (!item.property) return Renderer.item._getPropertiesText_noProperties({item, renderer});

		const valsUsed = {
			dmg2: false,
			range: false,
		};

		const renderedProperties = item.property
			.sort(Renderer.item._sortProperties)
			.map(property => Renderer.item._getPropertyText({item, property, valsUsed, renderer}))
			.filter(Boolean);

		if (!valsUsed.dmg2 && item.dmg2) renderedProperties.unshift(Renderer.item._getPropertiesText_unusedDmg2({item, renderer}));
		if (!valsUsed.range && item.range) renderedProperties.push(Renderer.item._getPropertiesText_unusedRange({item, renderer}));

		return renderedProperties.join(", ");
	}

	static _getPropertiesText_unusedDmg2 ({item, renderer}) { return `alt. ${Renderer.item._renderDamage(item.dmg2, {renderer})}`; }
	static _getPropertiesText_unusedRange ({item, renderer}) { return `range ${item.range} ft.`; }

	static _getPropertiesText_noProperties ({item, renderer}) {
		const parts = [];
		if (item.dmg2) parts.push(Renderer.item._getPropertiesText_unusedDmg2({item, renderer}));
		if (item.range) parts.push(Renderer.item._getPropertiesText_unusedRange({item, renderer}));
		return parts.join(", ");
	}

	static _getTaggedDamage (dmg, {renderer = null} = {}) {
		if (!dmg) return "";

		renderer = renderer || Renderer.get();

		Renderer.stripTags(dmg.trim());

		return renderer.render(`{@damage ${dmg}}`);
	}

	static _renderDamage (dmg, {renderer = null} = {}) {
		renderer = renderer || Renderer.get();
		return renderer.render(Renderer.item._getTaggedDamage(dmg, {renderer}));
	}

	static getRenderedDamageAndProperties (item, {renderer = null} = {}) {
		renderer = renderer || Renderer.get();

		const damageParts = [];

		const itemType = item.bardingType || item.type;
		const itemTypeAbv = itemType ? DataUtil.itemType.unpackUid(itemType).abbreviation : null;

		// armor
		if (item.ac != null) {
			const dexterityMax = (itemTypeAbv === Parser.ITM_TYP_ABV__MEDIUM_ARMOR && item.dexterityMax === undefined)
				? 2
				: item.dexterityMax;
			const isAddDex = item.dexterityMax !== undefined || ![Parser.ITM_TYP_ABV__HEAVY_ARMOR, Parser.ITM_TYP_ABV__SHIELD].includes(itemTypeAbv);

			const prefix = itemTypeAbv === Parser.ITM_TYP_ABV__SHIELD ? "+" : "";
			const suffix = isAddDex ? ` + Dex${dexterityMax ? ` (max ${dexterityMax})` : ""}` : "";

			damageParts.push(`AC ${prefix}${item.ac}${suffix}`);
		}
		if (item.acSpecial != null) damageParts.push(item.ac != null ? item.acSpecial : `AC ${item.acSpecial}`);

		// damage
		if (item.dmg1) {
			damageParts.push(
				[
					Renderer.item._renderDamage(item.dmg1, {renderer}),
					item.dmgType ? Parser.dmgTypeToFull(item.dmgType) : "",
				]
					.filter(Boolean)
					.join(" "),
			);
		}

		// mounts
		if (item.speed != null) damageParts.push(`Speed: ${item.speed}`);
		if (item.carryingCapacity) damageParts.push(`Carrying Capacity: ${item.carryingCapacity} lb.`);

		// vehicles
		if (item.vehSpeed || item.capCargo || item.capPassenger || item.crew || item.crewMin || item.crewMax || item.vehAc || item.vehHp || item.vehDmgThresh || item.travelCost || item.shippingCost) {
			const vehPartUpper = item.vehSpeed ? `Speed: ${Parser.numberToVulgar(item.vehSpeed)} mph` : null;

			const vehPartMiddle = item.capCargo || item.capPassenger ? `Carrying Capacity: ${[item.capCargo ? `${Parser.numberToFractional(item.capCargo)} ton${item.capCargo === 0 || item.capCargo > 1 ? "s" : ""} cargo` : null, item.capPassenger ? `${item.capPassenger} passenger${item.capPassenger === 1 ? "" : "s"}` : null].filter(Boolean).join(", ")}` : null;

			const {travelCostFull, shippingCostFull} = Parser.itemVehicleCostsToFull(item);

			// These may not be present in homebrew
			const vehPartLower = [
				item.crew ? `Crew ${item.crew}` : null,
				item.crewMin && item.crewMax ? `Crew ${item.crewMin}-${item.crewMax}` : null,
				item.vehAc ? `AC ${item.vehAc}` : null,
				item.vehHp ? `HP ${item.vehHp}${item.vehDmgThresh ? `, Damage Threshold ${item.vehDmgThresh}` : ""}` : null,
			].filter(Boolean).join(", ");

			damageParts.push([
				vehPartUpper,
				vehPartMiddle,

				// region ~~Dammit Mercer~~ Additional fields present in EGW
				travelCostFull ? `Personal Travel Cost: ${travelCostFull} per mile per passenger` : null,
				shippingCostFull ? `Shipping Cost: ${shippingCostFull} per 100 pounds per mile` : null,
				// endregion

				vehPartLower,
			].filter(Boolean).join(renderer.getLineBreak()));
		}

		// bars
		if (item.barDimensions) {
			damageParts.push(
				[
					item.barDimensions.l ? `${Parser.getInchesToFull(item.barDimensions.l, {isShort: true})} long` : "",
					item.barDimensions.w ? `${Parser.getInchesToFull(item.barDimensions.w, {isShort: true})} wide` : "",
					item.barDimensions.h ? `${Parser.getInchesToFull(item.barDimensions.h, {isShort: true})} thick` : "",
				]
					.filter(Boolean)
					.join(" × "),
			);
		}

		const ptDamage = damageParts.join(", ");
		const ptProperties = Renderer.item._getPropertiesText(item, {renderer});

		return [ptDamage, ptProperties];
	}

	static getRenderedMastery (item, {isSkipPrefix = false, renderer = null} = {}) {
		renderer = renderer || Renderer.get();

		if (!item.mastery) return "";

		return [
			isSkipPrefix ? "" : "Mastery: ",
			item.mastery
				.map(info => {
					if (!info.uid) return renderer.render(`{@itemMastery ${info}}`);
					return renderer.render(`{@itemMastery ${info.uid}} {@style (${info.note})|small}`);
				})
				.join(", "),
		]
			.filter(Boolean)
			.join(" ");
	}

	static getTransformedTypeEntriesMeta ({item, styleHint = null} = {}) {
		styleHint ||= VetoolsConfig.get("styleSwitcher", "style");

		const fnTransform = styleHint === "classic" ? "uppercaseFirst" : "toTitleCase";

		const entryType = (item._entryType || "")[fnTransform]();
		const entrySubtype = (item._entrySubType || "")[fnTransform]();

		const typeRarity = [
			item._entryType === "other" ? "" : entryType,
			(item.rarity && Renderer.item.doRenderRarity(item.rarity) ? (item.rarity)[fnTransform]() : ""),
		]
			.filter(Boolean)
			.join(", ");

		const ptAttunement = item.reqAttune ? (item._attunement || "")[fnTransform]() : "";

		return {
			entryType,
			entryTypeRarity: [typeRarity, ptAttunement].filter(Boolean).join(" "),
			entrySubtype,
			entryTier: item.tier
				? `${item.tier} tier`[fnTransform]()
				: "",
		};
	}

	static getTypeRarityAndAttunementHtmlParts (item, {styleHint = null} = {}) {
		styleHint ||= VetoolsConfig.get("styleSwitcher", "style");

		const {
			entryTypeRarity,
			entrySubtype,
			entryTier,
		} = Renderer.item.getTransformedTypeEntriesMeta({item, styleHint});

		return {
			typeRarityHtml: Renderer.get().render(entryTypeRarity),
			subTypeHtml: Renderer.get().render(entrySubtype),
			tierHtml: Renderer.get().render(entryTier),
		};
	}

	static getAttunementAndAttunementCatText (item, prop = "reqAttune") {
		let attunement = null;
		let attunementCat = VeCt.STR_NO_ATTUNEMENT;
		if (item[prop] != null && item[prop] !== false) {
			if (item[prop] === true) {
				attunementCat = "Requires Attunement";
				attunement = "(requires attunement)";
			} else if (item[prop] === "optional") {
				attunementCat = "Attunement Optional";
				attunement = "(attunement optional)";
			} else if (item[prop].toLowerCase().startsWith("by")) {
				attunementCat = "Requires Attunement By...";
				attunement = `(requires attunement ${Renderer.get().render(item[prop])})`;
			} else {
				attunementCat = "Requires Attunement"; // throw any weird ones in the "Yes" category (e.g. "outdoors at night")
				attunement = `(requires attunement ${Renderer.get().render(item[prop])})`;
			}
		}
		return [attunement, attunementCat];
	}

	static getRenderableTypeEntriesMeta (item, {styleHint = null} = {}) {
		styleHint ||= VetoolsConfig.get("styleSwitcher", "style");

		const textTypes = [];
		const ptsEntryType = [];
		const ptsEntrySubType = [];

		const itemTypeAbv = item.type ? DataUtil.itemType.unpackUid(item.type).abbreviation : null;
		const itemTypeAltAbv = item.typeAlt ? DataUtil.itemType.unpackUid(item.typeAlt).abbreviation : null;

		let showingBase = false;
		if (item.wondrous) {
			ptsEntryType.push(`wondrous item${item.tattoo ? ` (tattoo)` : ""}`);
			textTypes.push("wondrous item");
		}
		if (item.tattoo) {
			textTypes.push("tattoo");
		}
		if (item.staff) {
			ptsEntryType.push("staff");
			textTypes.push("staff");
		}
		if (item.ammo) {
			ptsEntryType.push(`ammunition`);
			textTypes.push("ammunition");
		}
		if (item.age) {
			ptsEntrySubType.push(item.age);
			textTypes.push(item.age);
		}
		if (item.weaponCategory) {
			ptsEntryType.push(`weapon${item.baseItem ? ` ({@item ${styleHint === "classic" ? item.baseItem : item.baseItem.toTitleCase()}})` : ""}`);
			ptsEntrySubType.push(`${item.weaponCategory} weapon`);
			textTypes.push(`${item.weaponCategory} weapon`);
			showingBase = true;
		}
		if (item.staff && (itemTypeAbv !== Parser.ITM_TYP_ABV__MELEE_WEAPON && itemTypeAltAbv !== Parser.ITM_TYP_ABV__MELEE_WEAPON)) { // DMG p140: "Unless a staff's description says otherwise, a staff can be used as a quarterstaff."
			ptsEntrySubType.push("melee weapon");
			textTypes.push("melee weapon");
		}
		if (item.type) Renderer.item._getHtmlAndTextTypes_type({type: item.type, typeAbv: itemTypeAbv, ptsEntryType, textTypes, ptsEntrySubType, showingBase, item});
		if (item.typeAlt) Renderer.item._getHtmlAndTextTypes_type({type: item.typeAlt, typeAbv: itemTypeAltAbv, ptsEntryType, textTypes, ptsEntrySubType, showingBase, item});
		if (item.firearm) {
			ptsEntrySubType.push("firearm");
			textTypes.push("firearm");
		}
		if (item.poison) {
			ptsEntryType.push(`poison${item.poisonTypes ? ` (${item.poisonTypes.joinConjunct(", ", " or ")})` : ""}`);
			textTypes.push("poison");
		}
		return {
			textTypes: textTypes,
			entryType: ptsEntryType.join(", "),
			entrySubType: ptsEntrySubType.join(", "),
		};
	}

	static _getHtmlAndTextTypes_type ({type, typeAbv, ptsEntryType, textTypes, ptsEntrySubType, showingBase, item}) {
		const fullType = Renderer.item.getItemTypeName(type);

		const isSub = (textTypes.some(it => it.includes("weapon")) && fullType.includes("weapon"))
			|| (textTypes.some(it => it.includes("armor")) && fullType.includes("armor"));

		if (!showingBase && !!item.baseItem) (isSub ? ptsEntrySubType : ptsEntryType).push(`${fullType} ({@item ${item.baseItem}})`);
		else if (typeAbv === Parser.ITM_TYP_ABV__SHIELD) (isSub ? ptsEntrySubType : ptsEntryType).push(`armor ({@item shield|phb})`);
		else (isSub ? ptsEntrySubType : ptsEntryType).push(fullType);

		textTypes.push(fullType);
	}

	static _GET_RENDERED_ENTRIES_WALKER = null;

	/**
	 * @param item
	 * @param isCompact
	 * @param wrappedTypeAllowlist An optional set of: `"note", "type", "property", "variant"`
	 */
	static getRenderedEntries (item, {isCompact = false, wrappedTypeAllowlist = null} = {}) {
		const renderer = Renderer.get();

		Renderer.item._GET_RENDERED_ENTRIES_WALKER = Renderer.item._GET_RENDERED_ENTRIES_WALKER || MiscUtil.getWalker({
			keyBlocklist: new Set([
				...MiscUtil.GENERIC_WALKER_ENTRIES_KEY_BLOCKLIST,
				"data",
			]),
		});

		const handlersName = {
			string: (str) => Renderer.item._getRenderedEntries_handlerConvertNamesToItalics.bind(Renderer.item, item, item.name)(str),
		};

		const handlersVariantName = item._variantName == null ? null : {
			string: (str) => Renderer.item._getRenderedEntries_handlerConvertNamesToItalics.bind(Renderer.item, item, item._variantName)(str),
		};

		const renderStack = [];
		if (item._fullEntries || item.entries?.length) {
			const entry = MiscUtil.copyFast({type: "entries", entries: item._fullEntries || item.entries});
			let procEntry = Renderer.item._GET_RENDERED_ENTRIES_WALKER.walk(entry, handlersName);
			if (handlersVariantName) procEntry = Renderer.item._GET_RENDERED_ENTRIES_WALKER.walk(entry, handlersVariantName);
			if (wrappedTypeAllowlist) procEntry.entries = procEntry.entries.filter(it => !it?.data?.[VeCt.ENTDATA_ITEM_MERGED_ENTRY_TAG] || wrappedTypeAllowlist.has(it?.data?.[VeCt.ENTDATA_ITEM_MERGED_ENTRY_TAG]));
			renderer.recursiveRender(procEntry, renderStack, {depth: 1});
		}

		if (item._fullAdditionalEntries || item.additionalEntries) {
			const additionEntries = MiscUtil.copyFast({type: "entries", entries: item._fullAdditionalEntries || item.additionalEntries});
			let procAdditionEntries = Renderer.item._GET_RENDERED_ENTRIES_WALKER.walk(additionEntries, handlersName);
			if (handlersVariantName) procAdditionEntries = Renderer.item._GET_RENDERED_ENTRIES_WALKER.walk(additionEntries, handlersVariantName);
			if (wrappedTypeAllowlist) procAdditionEntries.entries = procAdditionEntries.entries.filter(it => !it?.data?.[VeCt.ENTDATA_ITEM_MERGED_ENTRY_TAG] || wrappedTypeAllowlist.has(it?.data?.[VeCt.ENTDATA_ITEM_MERGED_ENTRY_TAG]));
			renderer.recursiveRender(procAdditionEntries, renderStack, {depth: 1});
		}

		if (!isCompact && item.lootTables) {
			renderStack.push(`<div><span class="bold">Found On: </span>${item.lootTables.sort(SortUtil.ascSortLower).map(tbl => renderer.render(`{@table ${tbl}}`)).join(", ")}</div>`);
		}

		return renderStack.join("").trim();
	}

	static _getRenderedEntries_handlerConvertNamesToItalics (item, baseName, str) {
		if (Renderer.item.isMundane(item)) return str;

		const stack = [];
		let depth = 0;

		const tgtLen = baseName.length;
		// Only accept title-case names for sentient items (e.g. Wave)
		const tgtName = item.sentient ? baseName : baseName.toLowerCase();

		const tgtNamePlural = tgtName.toPlural();
		const tgtLenPlural = tgtNamePlural.length;

		// e.g. "Orb of Shielding (Fernian Basalt)" -> "Orb of Shielding"
		const tgtNameNoBraces = tgtName.replace(/ \(.*$/, "");
		const tgtLenNoBraces = tgtNameNoBraces.length;

		const reWordBreak = /\W/;

		const len = str.length;
		for (let i = 0; i < len; ++i) {
			const c = str[i];

			switch (c) {
				case "{": {
					if (str[i + 1] === "@") depth++;
					stack.push(c);
					break;
				}
				case "}": {
					if (depth) depth--;
					stack.push(c);
					break;
				}
				default: stack.push(c); break;
			}

			if (depth) continue;

			if (!(str[i + 1] == null || reWordBreak.test(str[i + 1]))) continue;

			if (stack.slice(-tgtLen).join("")[item.sentient ? "toString" : "toLowerCase"]() === tgtName) {
				stack.splice(stack.length - tgtLen, tgtLen, `{@i ${stack.slice(-tgtLen).join("")}}`);
			} else if (stack.slice(-tgtLenPlural).join("")[item.sentient ? "toString" : "toLowerCase"]() === tgtNamePlural) {
				stack.splice(stack.length - tgtLenPlural, tgtLenPlural, `{@i ${stack.slice(-tgtLenPlural).join("")}}`);
			} else if (stack.slice(-tgtLenNoBraces).join("")[item.sentient ? "toString" : "toLowerCase"]() === tgtNameNoBraces) {
				stack.splice(stack.length - tgtLenNoBraces, tgtLenNoBraces, `{@i ${stack.slice(-tgtLenNoBraces).join("")}}`);
			}
		}

		return stack.join("");
	}

	static getCompactRenderedString (item, opts) {
		opts = opts || {};

		const styleHint = VetoolsConfig.get("styleSwitcher", "style");

		const [ptDamage, ptProperties] = Renderer.item.getRenderedDamageAndProperties(item);
		const ptMastery = Renderer.item.getRenderedMastery(item);
		const {typeRarityHtml, subTypeHtml, tierHtml} = Renderer.item.getTypeRarityAndAttunementHtmlParts(item);

		const textRight = [
			ptDamage,
			ptProperties,
			ptMastery,
		]
			.filter(Boolean)
			.map(pt => `<div class="ve-text-wrap-balance ve-text-right">${pt.uppercaseFirst()}</div>`)
			.join("");

		return `
		${Renderer.utils.getExcludedTr({entity: item, dataProp: "item", page: UrlUtil.PG_ITEMS})}
		${Renderer.utils.getNameTr(item, {page: UrlUtil.PG_ITEMS, isEmbeddedEntity: opts.isEmbeddedEntity})}
		<tr><td class="rd-item__type-rarity-attunement" colspan="6">${Renderer.item.getTypeRarityAndAttunementHtml({typeRarityHtml, subTypeHtml, tierHtml}, {styleHint})}</td></tr>
		<tr>
			<td colspan="2">${[Parser.itemValueToFullMultiCurrency(item, {styleHint}), Parser.itemWeightToFull(item)].filter(Boolean).join(", ").uppercaseFirst()}</td>
			<td colspan="4">
				${textRight}
			</td>
		</tr>
		${Renderer.item.hasEntries(item) ? `${Renderer.utils.getDividerTr()}<tr><td colspan="6" class="pb-2">${Renderer.item.getRenderedEntries(item, {isCompact: true})}</td></tr>` : `<tr><td colspan="6" class="pb-2"></td></tr>`}`;
	}

	static hasEntries (item) {
		return item._fullAdditionalEntries?.length || item._fullEntries?.length || item.entries?.length;
	}

	static getTypeRarityAndAttunementHtml ({typeRarityHtml = "", subTypeHtml = "", tierHtml = ""}, {styleHint = null} = {}) {
		styleHint ||= VetoolsConfig.get("styleSwitcher", "style");

		return `<div class="ve-flex-col">
			${typeRarityHtml || tierHtml ? `<div class="split ${subTypeHtml ? "mb-1" : ""}">
				<div class="italic">${typeRarityHtml || ""}</div>
				<div class="no-wrap ${tierHtml ? `ml-2` : ""}">${tierHtml || ""}</div>
			</div>` : ""}
			${subTypeHtml ? `<div class="italic ve-muted">${subTypeHtml}</div>` : ""}
		</div>`;
	}

	static _hiddenRarity = new Set(["none", "unknown", "unknown (magic)", "varies"]);
	static doRenderRarity (rarity) {
		return !Renderer.item._hiddenRarity.has(rarity);
	}

	/* -------------------------------------------- */

	static getPropertyName (ent) {
		return ent.name || (ent.entries || ent.entriesTemplate)[0]?.name || "Unknown";
	}

	static _propertyMap = {};
	static _addProperty (ent) {
		const abvLookup = (ent.abbreviation || "UNK").toLowerCase();
		const sourceLookup = (ent.source || Parser.SRC_PHB).toLowerCase();

		if (this._propertyMap?.[sourceLookup]?.[abvLookup]) return;

		const cpy = MiscUtil.copyFast(ent);
		cpy.name = Renderer.item.getPropertyName(ent);

		MiscUtil.set(this._propertyMap, sourceLookup, abvLookup, cpy);

		// TODO(Future; 2025-Q2) remove once all prerelease/homebrew migrated
		// Make a default-source alias for the property, for old data with un-migrated properties
		const sourceLookupFallback = Parser.SRC_PHB.toLowerCase();
		if (sourceLookup === sourceLookupFallback) return;
		if (this._propertyMap?.[sourceLookupFallback]?.[abvLookup]) return;
		MiscUtil.set(this._propertyMap, sourceLookupFallback, abvLookup, cpy);
	}

	static _ERRORS_LOGGED_MISSING_PROPERTY = {};
	static getProperty (uid, {isIgnoreMissing = false} = {}) {
		const {abbreviation, source} = DataUtil.itemProperty.unpackUid(uid || "", {isLower: true});

		const out = this._propertyMap?.[source]?.[abbreviation]
			// TODO(Future; 2025-Q2) remove once all prerelease/homebrew migrated
			// Fall back on sourceless tag
			|| this._propertyMap?.[Parser.SRC_PHB.toLowerCase()]?.[abbreviation];

		if (!isIgnoreMissing && !out) {
			if (!this._ERRORS_LOGGED_MISSING_PROPERTY[uid]) {
				this._ERRORS_LOGGED_MISSING_PROPERTY[uid] = true;
				const msg = `Item property "${uid}" not found!`;
				JqueryUtil.doToast({type: "danger", content: msg});
				setTimeout(() => { throw new Error(msg); });
			}
		}
		return out;
	}

	// ---

	static _typeMap = {};
	static _addType (ent) {
		const abvLookup = (ent.abbreviation || "UNK").toLowerCase();
		const sourceLookup = (ent.source || Parser.SRC_PHB).toLowerCase();

		const existing = this._typeMap?.[sourceLookup]?.[abvLookup];
		if (existing?.entries || existing?.entriesTemplate) return;

		const cpy = existing || MiscUtil.copyFast(ent);
		cpy.name = cpy.name || (cpy.entries || cpy.entriesTemplate)[0]?.name || "Unknown";

		// Merge in data from existing version, if it exists
		if (existing) {
			Object.entries(ent)
				.forEach(([k, v]) => cpy[k] ??= MiscUtil.copyFast(v));
		}

		MiscUtil.set(this._typeMap, sourceLookup, abvLookup, cpy);

		// TODO(Future; 2025-Q2) remove once all prerelease/homebrew migrated
		// Make a default-source alias for the type, for old data with un-migrated types
		const sourceLookupFallback = Parser.SRC_PHB.toLowerCase();
		if (sourceLookup === sourceLookupFallback) return;
		if (this._typeMap?.[sourceLookupFallback]?.[abvLookup]) return;
		MiscUtil.set(this._typeMap, sourceLookupFallback, abvLookup, cpy);
	}

	static _ERRORS_LOGGED_MISSING_TYPE = {};
	static getType (uid, {isIgnoreMissing = false} = {}) {
		const {abbreviation, source} = DataUtil.itemType.unpackUid(uid || "", {isLower: true});

		const out = this._typeMap?.[source]?.[abbreviation]
			// TODO(Future; 2025-Q2) remove once all prerelease/homebrew migrated
			// Fall back on sourceless tag
			|| this._typeMap?.[Parser.SRC_PHB.toLowerCase()]?.[abbreviation];
		if (!isIgnoreMissing && !out) {
			if (!this._ERRORS_LOGGED_MISSING_TYPE[uid]) {
				this._ERRORS_LOGGED_MISSING_TYPE[uid] = true;
				const msg = `Item type "${uid}" not found!`;
				JqueryUtil.doToast({type: "danger", content: msg});
				setTimeout(() => { throw new Error(msg); });
			}
		}
		return out;
	}

	// ---

	static entryMap = {};
	static _addEntry (ent) {
		if (Renderer.item.entryMap[ent.source]?.[ent.name]) return;
		MiscUtil.set(Renderer.item.entryMap, ent.source, ent.name, ent);
	}

	// ---

	static _additionalTypeEntriesMap = {};
	static _addAdditionalTypeEntries (ent) {
		const {abbreviation, source} = DataUtil.itemType.unpackUid(ent.appliesTo, {isLower: true});
		const appliesToUid = DataUtil.itemType.getUid({abbreviation, source}, {isRetainDefault: true});
		if (this._additionalTypeEntriesMap[appliesToUid]) return;
		this._additionalTypeEntriesMap[appliesToUid] = MiscUtil.copyFast(ent.entries);
	}

	static getAdditionalTypeEntries (itemType) {
		if (!itemType) return null;
		const {abbreviation, source} = DataUtil.itemType.unpackUid(itemType, {isLower: true});
		const itemTypeUid = DataUtil.itemType.getUid({abbreviation, source}, {isRetainDefault: true});
		return this._additionalTypeEntriesMap[itemTypeUid];
	}

	// ---

	static _masteryMap = {};
	static _addMastery (ent) {
		const lookupSource = ent.source.toLowerCase();
		const lookupName = ent.name.toLowerCase();
		if (Renderer.item._masteryMap[lookupSource]?.[lookupName]) return;
		MiscUtil.set(Renderer.item._masteryMap, lookupSource, lookupName, ent);
	}

	static _getMastery (uid) {
		const {name, source} = DataUtil.proxy.unpackUid("itemMastery", uid, "itemMastery", {isLower: true});
		const out = MiscUtil.get(Renderer.item._masteryMap, source, name);
		if (!out) throw new Error(`Item mastry ${uid} not found. You probably meant to load the mastery reference first.`);
		return out;
	}

	// ---

	static async _pAddPrereleaseBrewPropertiesAndTypes () {
		if (typeof PrereleaseUtil !== "undefined") Renderer.item.addPrereleaseBrewPropertiesAndTypesFrom({data: await PrereleaseUtil.pGetBrewProcessed()});
		if (typeof BrewUtil2 !== "undefined") Renderer.item.addPrereleaseBrewPropertiesAndTypesFrom({data: await BrewUtil2.pGetBrewProcessed()});
	}

	static addPrereleaseBrewPropertiesAndTypesFrom ({data}) {
		if (data == null) return;
		(data.itemProperty || [])
			.forEach(it => Renderer.item._addProperty(it));
		(data.itemType || [])
			.forEach(it => Renderer.item._addType(it));
		(data.itemEntry || [])
			.forEach(it => Renderer.item._addEntry(it));
		(data.itemTypeAdditionalEntries || [])
			.forEach(it => Renderer.item._addAdditionalTypeEntries(it));
		(data.itemMastery || [])
			.forEach(it => Renderer.item._addMastery(it));
	}

	static _addBasePropertiesAndTypes (baseItemData) {
		// Convert the property and type list JSONs into look-ups, i.e. use the abbreviation as a JSON property name
		(baseItemData.itemProperty || []).forEach(it => Renderer.item._addProperty(it));
		(baseItemData.itemType || []).forEach(it => Renderer.item._addType(it));
		(baseItemData.itemEntry || []).forEach(it => Renderer.item._addEntry(it));
		(baseItemData.itemTypeAdditionalEntries || []).forEach(it => Renderer.item._addAdditionalTypeEntries(it));
		(baseItemData.itemMastery || []).forEach(it => Renderer.item._addMastery(it));

		baseItemData.baseitem.forEach(it => it._isBaseItem = true);
	}

	/* -------------------------------------------- */

	static async _pGetSiteUnresolvedRefItems_pLoadItems () {
		const itemData = await DataUtil.loadJSON(`${Renderer.get().baseUrl}data/items.json`);
		const items = itemData.item;
		itemData.itemGroup.forEach(it => it._isItemGroup = true);
		return [...items, ...itemData.itemGroup];
	}

	static async pGetSiteUnresolvedRefItems () {
		const itemList = await Renderer.item._pGetSiteUnresolvedRefItems_pLoadItems();
		const baseItemsJson = await DataUtil.loadJSON(`${Renderer.get().baseUrl}data/items-base.json`);
		const baseItems = await Renderer.item._pGetAndProcBaseItems(baseItemsJson);
		const {genericVariants, linkedLootTables} = await Renderer.item._pGetCacheSiteGenericVariants();
		const specificVariants = Renderer.item._createSpecificVariants(baseItems, genericVariants, {linkedLootTables});
		const allItems = [...itemList, ...baseItems, ...genericVariants, ...specificVariants];
		Renderer.item._enhanceItems(allItems);

		return {
			item: allItems,
			itemEntry: baseItemsJson.itemEntry,
		};
	}

	static _pGettingSiteGenericVariants = null;
	static async _pGetCacheSiteGenericVariants () {
		Renderer.item._pGettingSiteGenericVariants = Renderer.item._pGettingSiteGenericVariants || (async () => {
			const [genericVariants, linkedLootTables] = Renderer.item._getAndProcGenericVariants(await DataUtil.loadJSON(`${Renderer.get().baseUrl}data/magicvariants.json`));
			return {genericVariants, linkedLootTables};
		})();
		return Renderer.item._pGettingSiteGenericVariants;
	}

	static async pBuildList () {
		return DataLoader.pCacheAndGetAllSite(UrlUtil.PG_ITEMS);
	}

	static async _pGetAndProcBaseItems (baseItemData) {
		Renderer.item._addBasePropertiesAndTypes(baseItemData);
		await Renderer.item._pAddPrereleaseBrewPropertiesAndTypes();
		return baseItemData.baseitem;
	}

	static _getAndProcGenericVariants (variantData) {
		variantData.magicvariant.forEach(Renderer.item._genericVariants_addInheritedPropertiesToSelf);
		return [variantData.magicvariant, variantData.linkedLootTables];
	}

	static _initFullEntries (item) {
		Renderer.utils.initFullEntries_(item);
	}

	static _initFullAdditionalEntries (item) {
		Renderer.utils.initFullEntries_(item, {propEntries: "additionalEntries", propFullEntries: "_fullAdditionalEntries"});
	}

	/**
	 * @param baseItems
	 * @param genericVariants
	 * @param [opts]
	 * @param [opts.linkedLootTables]
	 */
	static _createSpecificVariants (baseItems, genericVariants, opts) {
		opts = opts || {};

		const styleHint = VetoolsConfig.get("styleSwitcher", "style");

		const genericAndSpecificVariants = [];
		baseItems.forEach((curBaseItem) => {
			curBaseItem._category = "Basic";
			if (curBaseItem.entries == null) curBaseItem.entries = [];

			if (curBaseItem.packContents) return; // e.g. "Arrows (20)"

			genericVariants.forEach((curGenericVariant) => {
				if (!Renderer.item._createSpecificVariants_isEditionMatch({curBaseItem, curGenericVariant, styleHint})) return;

				if (!Renderer.item._createSpecificVariants_hasRequiredProperty(curBaseItem, curGenericVariant)) return;
				if (Renderer.item._createSpecificVariants_hasExcludedProperty(curBaseItem, curGenericVariant)) return;

				genericAndSpecificVariants.push(Renderer.item._createSpecificVariants_createSpecificVariant(curBaseItem, curGenericVariant, opts));
			});
		});
		return genericAndSpecificVariants;
	}

	/**
	 * When creating specific variants, the application of "classic" and "one" editions
	 *  goes by the following logic:
	 *
	 * |  B. Item | Gen. Var | Apply | Example
	 * |----------|----------|-------|----------------------------------------
	 * |     null |     null |     X | "Fool's Blade|BMT" -> "Pitchfork|ToB3-Lairs"
	 * |  classic |     null |       | "Fool's Blade|BMT" -> "Longsword|PHB"
	 * |      one |     null |     X | "Fool's Blade|BMT" -> "Longsword|XPHB"
	 * |     null |  classic |     X | "+1 Weapon|DMG" -> "Pitchfork|ToB3-Lairs" -- TODO(Future): consider cutting this, with a homebrew tag migration
	 * |  classic |  classic |     X | "+1 Weapon|DMG" -> "Longsword|PHB"
	 * |      one |  classic |       | "+1 Weapon|DMG" -> "Longsword|XPHB"
	 * |     null |      one |     X | "+1 Weapon|XDMG" -> "Pitchfork|ToB3-Lairs"
	 * |  classic |      one |       | "+1 Weapon|XDMG" -> "Longsword|PHB"
	 * |      one |      one |     X | "+1 Weapon|XDMG" -> "Longsword|XPHB"
	 *
	 * This aims to minimize spamming near-duplicates, while preserving as many '14 items as possible.
	 */
	static _createSpecificVariants_isEditionMatch ({curBaseItem, curGenericVariant, styleHint}) {
		if (MiscUtil.isNearStrictlyEqual(curBaseItem.edition, curGenericVariant.edition)) return true;

		// For e.g. Plutonium use, at the user's preference, invert the filter and prefer "classic" edition
		if (globalThis.IS_VTT && styleHint === "classic") {
			if (curBaseItem.edition === "one") return false;
			if (curBaseItem.edition == null) return true;
			if (curBaseItem.edition === "classic") return curGenericVariant.edition !== "one";
		}

		if (curBaseItem.edition === "classic") return false;
		if (curBaseItem.edition == null) return true;
		if (curBaseItem.edition === "one") return curGenericVariant.edition !== "classic";
		throw new Error(`Unhandled edition combination "${curBaseItem.edition}"/"${curGenericVariant.edition}" for base item "${curBaseItem.name}" and generic variant "${curGenericVariant.name}"!`);
	}

	static _createSpecificVariants_hasRequiredProperty (baseItem, genericVariant) {
		return genericVariant.requires.some(req => Renderer.item._createSpecificVariants_isRequiresExcludesMatch(baseItem, req, "every"));
	}

	static _createSpecificVariants_hasExcludedProperty (baseItem, genericVariant) {
		const curExcludes = genericVariant.excludes || {};
		return Renderer.item._createSpecificVariants_isRequiresExcludesMatch(baseItem, genericVariant.excludes, "some");
	}

	static _createSpecificVariants_isRequiresExcludesMatch (candidate, requirements, method) {
		if (candidate == null || requirements == null) return false;

		return Object.entries(requirements)[method](([reqKey, reqVal]) => {
			if (reqVal instanceof Array) {
				return candidate[reqKey] instanceof Array
					? candidate[reqKey].some(it => reqVal.includes(it))
					: reqVal.includes(candidate[reqKey]);
			}

			// Recurse for e.g. `"customProperties": { ... }`
			if (reqVal != null && typeof reqVal === "object") {
				return Renderer.item._createSpecificVariants_isRequiresExcludesMatch(candidate[reqKey], reqVal, method);
			}

			return candidate[reqKey] instanceof Array
				? candidate[reqKey].some(it => reqVal === it)
				: reqVal === candidate[reqKey];
		});
	}

	/**
	 * @param baseItem
	 * @param genericVariant
	 * @param [opts]
	 * @param [opts.linkedLootTables]
	 */
	static _createSpecificVariants_createSpecificVariant (baseItem, genericVariant, opts) {
		const inherits = genericVariant.inherits;
		const specificVariant = MiscUtil.copyFast(baseItem);

		// Update prop
		specificVariant.__prop = "item";

		// Remove "base item" flag
		delete specificVariant._isBaseItem;

		// Reset enhancements/entry cache
		specificVariant._isEnhanced = false;
		delete specificVariant._fullEntries;

		specificVariant._baseName = baseItem.name;
		specificVariant._baseSrd = baseItem.srd;
		specificVariant._baseSrd52 = baseItem.srd52;
		specificVariant._baseBasicRules = baseItem.basicRules;
		specificVariant._baseFreeRules2024 = baseItem.basicRules2024;
		if (baseItem.source !== inherits.source) specificVariant._baseSource = baseItem.source;

		specificVariant._variantName = genericVariant.name;

		// Magic items do not inherit the value of the non-magical item
		specificVariant._baseValue = baseItem.value;
		delete specificVariant.value;

		// Magic variants apply their own SRD info; page info
		delete specificVariant.srd;
		delete specificVariant.srd52;
		delete specificVariant.basicRules;
		delete specificVariant.basicRules2024;
		delete specificVariant.page;
		delete specificVariant.reprintedAs;

		// Remove fluff specifiers
		delete specificVariant.hasFluff;
		delete specificVariant.hasFluffImages;

		specificVariant._category = "Specific Variant";
		specificVariant.baseItem = DataUtil.proxy.getUid("item", baseItem);
		Object.entries(inherits)
			// Always apply "remove"s first
			// This allows for e.g.
			//   - base item: "Very Rare Reagent"
			//   - variant: "Poisonous Reagent"
			//     `{"nameRemove": "Reagent", "nameSuffix": "Poisonous Reagent"}`
			//   -> `"Very Rare Poisonous Reagent"`
			.sort(([kA], [kB]) => kB.includes("Remove") - kA.includes("Remove"))
			.forEach(([inheritedProperty, val]) => {
				switch (inheritedProperty) {
					case "namePrefix": specificVariant.name = `${val}${specificVariant.name}`; break;
					case "nameSuffix": specificVariant.name = `${specificVariant.name}${val}`; break;
					case "entries": {
						Renderer.item._initFullEntries(specificVariant);

						const appliedPropertyEntries = Renderer.applyAllProperties(val, Renderer.item._getInjectableProps(baseItem, inherits));
						appliedPropertyEntries.forEach((ent, i) => specificVariant._fullEntries.splice(i, 0, ent));
						break;
					}
					case "vulnerable":
					case "resist":
					case "immune": {
						// Handled below
						break;
					}
					case "conditionImmune": {
						specificVariant[inheritedProperty] = [...specificVariant[inheritedProperty] || [], ...val].unique();
						break;
					}
					case "nameRemove": {
						specificVariant.name = specificVariant.name.replace(new RegExp(val.escapeRegexp(), "g"), "");

						break;
					}
					case "weightExpression":
					case "valueExpression": {
						const exp = Renderer.item._createSpecificVariants_evaluateExpression(baseItem, specificVariant, inherits, inheritedProperty);

						const result = Renderer.dice.parseRandomise2(exp);
						if (result != null) {
							switch (inheritedProperty) {
								case "weightExpression": specificVariant.weight = result; break;
								case "valueExpression": specificVariant.value = result; break;
							}
						}

						break;
					}
					case "barding": {
						specificVariant.bardingType = baseItem.type;
						break;
					}
					case "propertyAdd": {
						specificVariant.property = [
							...(specificVariant.property || []),
							...val.filter(it => !specificVariant.property || !specificVariant.property.some(property => (property?.uid || property) === (it?.uid || it))),
						];
						break;
					}
					case "propertyRemove": {
						if (specificVariant.property) {
							specificVariant.property = specificVariant.property.filter(it => !val.includes(it?.uid || it));
							if (!specificVariant.property.length) delete specificVariant.property;
						}
						break;
					}
					default: specificVariant[inheritedProperty] = val;
				}
			});

		Renderer.item._createSpecificVariants_mergeVulnerableResistImmune({specificVariant, inherits});

		// Inherit fluff
		if (genericVariant.hasFluff) specificVariant.hasFluff = genericVariant.hasFluff;
		if (genericVariant.hasFluffImages) specificVariant.hasFluffImages = genericVariant.hasFluffImages;

		// track the specific variant on the parent generic, to later render as part of the stats
		genericVariant.variants = genericVariant.variants || [];
		if (!genericVariant.variants.some(it => it.base?.name === baseItem.name && it.base?.source === baseItem.source)) genericVariant.variants.push({base: baseItem, specificVariant});

		// add reverse link to get generic from specific--primarily used for indexing
		specificVariant.genericVariant = {
			name: genericVariant.name,
			source: genericVariant.source,
		};

		// add linked loot tables
		if (opts.linkedLootTables && opts.linkedLootTables[specificVariant.source] && opts.linkedLootTables[specificVariant.source][specificVariant.name]) {
			(specificVariant.lootTables = specificVariant.lootTables || []).push(...opts.linkedLootTables[specificVariant.source][specificVariant.name]);
		}

		if (
			baseItem.source !== Parser.SRC_PHB
			&& baseItem.source !== Parser.SRC_XPHB
			&& baseItem.source !== Parser.SRC_DMG
			&& baseItem.source !== Parser.SRC_XDMG
		) {
			Renderer.item._initFullEntries(specificVariant);
			specificVariant._fullEntries.unshift({
				type: "wrapper",
				wrapped: `{@note The {@item ${baseItem.name}|${baseItem.source}|base item} can be found in ${Parser.sourceJsonToFull(baseItem.source)}${baseItem.page ? `, page ${baseItem.page}` : ""}.}`,
				data: {
					[VeCt.ENTDATA_ITEM_MERGED_ENTRY_TAG]: "note",
				},
			});
		}

		return specificVariant;
	}

	static _createSpecificVariants_evaluateExpression (baseItem, specificVariant, inherits, inheritedProperty) {
		return inherits[inheritedProperty].replace(/\[\[([^\]]+)]]/g, (...m) => {
			const propPath = m[1].split(".");
			return propPath[0] === "item"
				? MiscUtil.get(specificVariant, ...propPath.slice(1))
				: propPath[0] === "baseItem"
					? MiscUtil.get(baseItem, ...propPath.slice(1))
					: MiscUtil.get(specificVariant, ...propPath);
		});
	}

	static _PROPS_VULN_RES_IMMUNE = [
		"vulnerable",
		"resist",
		"immune",
	];
	static _createSpecificVariants_mergeVulnerableResistImmune ({specificVariant, inherits}) {
		const fromBase = {};
		Renderer.item._PROPS_VULN_RES_IMMUNE
			.filter(prop => specificVariant[prop])
			.forEach(prop => fromBase[prop] = [...specificVariant[prop]]);

		// For each `inherits` prop, remove matching values from non-matching props in base item (i.e., a value should be
		//   unique across all three arrays).
		Renderer.item._PROPS_VULN_RES_IMMUNE
			.forEach(prop => {
				const val = inherits[prop];

				// Retain existing from base item
				if (val === undefined) return;

				// Delete from base item
				if (val == null) return delete fromBase[prop];

				const valSet = new Set();
				val.forEach(it => {
					if (typeof it === "string") valSet.add(it);
					if (!it?.[prop]?.length) return;
					it?.[prop].forEach(itSub => {
						if (typeof itSub === "string") valSet.add(itSub);
					});
				});

				Renderer.item._PROPS_VULN_RES_IMMUNE
					.filter(it => it !== prop)
					.forEach(propOther => {
						if (!fromBase[propOther]) return;

						fromBase[propOther] = fromBase[propOther]
							.filter(it => {
								if (typeof it === "string") return !valSet.has(it);

								if (it?.[propOther]?.length) {
									it[propOther] = it[propOther].filter(itSub => {
										if (typeof itSub === "string") return !valSet.has(itSub);
										return true;
									});
								}

								return true;
							});

						if (!fromBase[propOther].length) delete fromBase[propOther];
					});
			});

		Renderer.item._PROPS_VULN_RES_IMMUNE
			.forEach(prop => {
				if (fromBase[prop] || inherits[prop]) specificVariant[prop] = [...(fromBase[prop] || []), ...(inherits[prop] || [])].unique();
				else delete specificVariant[prop];
			});
	}

	static _enhanceItems (allItems) {
		allItems.forEach((item) => Renderer.item.enhanceItem(item));
		return allItems;
	}

	/**
	 * @param genericVariants
	 * @param opts
	 * @param [opts.additionalBaseItems]
	 * @param [opts.baseItems]
	 * @param [opts.isSpecificVariantsOnly]
	 */
	static async pGetGenericAndSpecificVariants (genericVariants, opts) {
		opts = opts || {};

		let baseItems;
		if (opts.baseItems) {
			baseItems = opts.baseItems;
		} else {
			const baseItemData = await DataUtil.loadJSON(`${Renderer.get().baseUrl}data/items-base.json`);
			Renderer.item._addBasePropertiesAndTypes(baseItemData);
			baseItems = [...baseItemData.baseitem, ...(opts.additionalBaseItems || [])];
		}

		await Renderer.item._pAddPrereleaseBrewPropertiesAndTypes();
		genericVariants.forEach(Renderer.item._genericVariants_addInheritedPropertiesToSelf);
		const specificVariants = Renderer.item._createSpecificVariants(baseItems, genericVariants);
		const outSpecificVariants = Renderer.item._enhanceItems(specificVariants);

		if (opts.isSpecificVariantsOnly) return outSpecificVariants;

		const outGenericVariants = Renderer.item._enhanceItems(genericVariants);
		return [...outGenericVariants, ...outSpecificVariants];
	}

	static _getInjectableProps (baseItem, inherits) {
		return {
			baseName: baseItem.name,
			dmgType: baseItem.dmgType ? Parser.dmgTypeToFull(baseItem.dmgType) : null,
			bonusAc: inherits.bonusAc,
			bonusWeapon: inherits.bonusWeapon,
			bonusWeaponAttack: inherits.bonusWeaponAttack,
			bonusWeaponDamage: inherits.bonusWeaponDamage,
			bonusWeaponCritDamage: inherits.bonusWeaponCritDamage,
			bonusSpellAttack: inherits.bonusSpellAttack,
			bonusSpellSaveDc: inherits.bonusSpellSaveDc,
			bonusSavingThrow: inherits.bonusSavingThrow,
		};
	}

	static _INHERITED_PROPS_BLOCKLIST = new Set([
		// region Specific merge strategy
		"entries",

		"propertyAdd",
		// endregion

		// region Meaningless on merged item
		"namePrefix",
		"nameSuffix",

		"propertyRemove",
		// endregion
	]);
	static _genericVariants_addInheritedPropertiesToSelf (genericVariant) {
		if (genericVariant._isInherited) return;
		genericVariant._isInherited = true;

		for (const prop in genericVariant.inherits) {
			if (Renderer.item._INHERITED_PROPS_BLOCKLIST.has(prop)) continue;

			const val = genericVariant.inherits[prop];

			if (val == null) delete genericVariant[prop];
			else if (genericVariant[prop]) {
				if (genericVariant[prop] instanceof Array && val instanceof Array) genericVariant[prop] = MiscUtil.copyFast(genericVariant[prop]).concat(val);
				else genericVariant[prop] = val;
			} else genericVariant[prop] = genericVariant.inherits[prop];
		}

		if (!genericVariant.entries && genericVariant.inherits.entries) {
			genericVariant.entries = MiscUtil.copyFast(Renderer.applyAllProperties(genericVariant.inherits.entries, genericVariant.inherits));
		}

		// Add blanket-added properties, to enable filter
		if (genericVariant.inherits.propertyAdd) genericVariant.property = [...(genericVariant.property || []), ...genericVariant.inherits.propertyAdd];

		if (genericVariant.requires.armor) genericVariant.armor = genericVariant.requires.armor;
	}

	static getItemTypeName (t) {
		return Renderer.item.getType(t)?.name?.toLowerCase() || t;
	}

	static enhanceItem (item, {styleHint = null} = {}) {
		if (item._isEnhanced) return;
		item._isEnhanced = true;

		styleHint ||= VetoolsConfig.get("styleSwitcher", "style");

		const itemTypeAbv = item.type ? DataUtil.itemType.unpackUid(item.type).abbreviation : null;

		if (item.noDisplay) return;
		if (itemTypeAbv === Parser.ITM_TYP_ABV__GENERIC_VARIANT) item._category = "Generic Variant";
		if (item._category == null) item._category = "Other";
		if (item.entries == null) item.entries = [];
		if (item.type && (Renderer.item.getType(item.type)?.entries || Renderer.item.getType(item.type)?.entriesTemplate)) {
			Renderer.item._initFullEntries(item);

			const propertyEntries = Renderer.item._enhanceItem_getItemPropertyTypeEntries({item, ent: Renderer.item.getType(item.type)});
			propertyEntries.forEach(e => item._fullEntries.push({type: "wrapper", wrapped: e, data: {[VeCt.ENTDATA_ITEM_MERGED_ENTRY_TAG]: "type"}}));
		}
		if (item.property) {
			item.property.forEach(p => {
				const entProperty = Renderer.item.getProperty(p?.uid || p);
				if (!entProperty?.entries && !entProperty?.entriesTemplate) return;

				Renderer.item._initFullEntries(item);

				const propertyEntries = Renderer.item._enhanceItem_getItemPropertyTypeEntries({item, ent: entProperty});
				propertyEntries.forEach(e => item._fullEntries.push({type: "wrapper", wrapped: e, data: {[VeCt.ENTDATA_ITEM_MERGED_ENTRY_TAG]: "property"}}));
			});
		}
		// The following could be encoded in JSON, but they depend on more than one JSON property; maybe fix if really bored later
		if (itemTypeAbv === Parser.ITM_TYP_ABV__LIGHT_ARMOR || itemTypeAbv === Parser.ITM_TYP_ABV__MEDIUM_ARMOR || itemTypeAbv === Parser.ITM_TYP_ABV__HEAVY_ARMOR) {
			if (item.stealth) {
				Renderer.item._initFullEntries(item);
				const wrapped = styleHint === "classic"
					? "The wearer has disadvantage on Dexterity ({@skill Stealth}) checks."
					: "The wearer has {@variantrule Disadvantage|XPHB} on Dexterity ({@skill Stealth|XPHB}) checks.";
				item._fullEntries.push({type: "wrapper", wrapped, data: {[VeCt.ENTDATA_ITEM_MERGED_ENTRY_TAG]: "type"}});
			}
			if (itemTypeAbv === Parser.ITM_TYP_ABV__HEAVY_ARMOR && item.strength) {
				Renderer.item._initFullEntries(item);
				item._fullEntries.push({type: "wrapper", wrapped: `If the wearer has a Strength score lower than ${item.strength}, their speed is reduced by 10 feet.`, data: {[VeCt.ENTDATA_ITEM_MERGED_ENTRY_TAG]: "type"}});
			}
		}
		if (itemTypeAbv === Parser.ITM_TYP_ABV__SPELLCASTING_FOCUS) {
			if (item._isItemGroup) {
				if (item.scfType === "arcane" && item.source !== Parser.SRC_ERLW) {
					Renderer.item._initFullEntries(item);
					const wrapped = styleHint === "classic"
						? "An arcane focus is a special item\u2014an orb, a crystal, a rod, a specially constructed staff, a wand-like length of wood, or some similar item\u2014designed to channel the power of arcane spells. A {@class sorcerer}, {@class warlock}, or {@class wizard} can use such an item as a spellcasting focus."
						: "An Arcane Focus takes a specific form and is bejeweled or carved to channel arcane magic. A {@class Sorcerer|XPHB}, {@class Warlock|XPHB}, or {@class Wizard|XPHB} can use such an item as a {@variantrule Spellcasting Focus|XPHB}.";
					item._fullEntries.push({type: "wrapper", wrapped, data: {[VeCt.ENTDATA_ITEM_MERGED_ENTRY_TAG]: "type.SCF"}});
				}
				if (item.scfType === "druid") {
					Renderer.item._initFullEntries(item);
					const wrapped = styleHint === "classic"
						? "A druidic focus might be a sprig of mistletoe or holly, a wand or scepter made of yew or another special wood, a staff drawn whole out of a living tree, or a totem object incorporating feathers, fur, bones, and teeth from sacred animals. A {@class druid} can use such an object as a spellcasting focus."
						: "A Druidic Focus takes a specific form and is carved, tied with ribbon, or painted to channel primal magic. A {@class Druid|XPHB} or {@class Ranger|XPHB} can use such an object as a {@variantrule Spellcasting Focus|XPHB}.";
					item._fullEntries.push({type: "wrapper", wrapped, data: {[VeCt.ENTDATA_ITEM_MERGED_ENTRY_TAG]: "type.SCF"}});
				}
				if (item.scfType === "holy") {
					Renderer.item._initFullEntries(item);
					const wrapped = styleHint === "classic"
						? "A holy symbol is a representation of a god or pantheon. It might be an amulet depicting a symbol representing a deity, the same symbol carefully engraved or inlaid as an emblem on a shield, or a tiny box holding a fragment of a sacred relic. A cleric or paladin can use a holy symbol as a spellcasting focus. To use the symbol in this way, the caster must hold it in hand, wear it visibly, or bear it on a shield."
						: "A Holy Symbol takes a specific form and is bejeweled or painted to channel divine magic. A {@class Cleric|XPHB} or {@class Paladin|XPHB} can use a Holy Symbol as a {@variantrule Spellcasting Focus|XPHB}.";
					item._fullEntries.push({type: "wrapper", wrapped, data: {[VeCt.ENTDATA_ITEM_MERGED_ENTRY_TAG]: "type.SCF"}});
				}
			} else {
				if (item.scfType === "arcane") {
					Renderer.item._initFullEntries(item);
					const wrapped = styleHint === "classic"
						? "An arcane focus is a special item designed to channel the power of arcane spells. A {@class sorcerer}, {@class warlock}, or {@class wizard} can use such an item as a spellcasting focus."
						: "An Arcane Focus takes a specific form and is bejeweled or carved to channel arcane magic. A {@class Sorcerer|XPHB}, {@class Warlock|XPHB}, or {@class Wizard|XPHB} can use such an item as a {@variantrule Spellcasting Focus|XPHB}.";
					item._fullEntries.push({type: "wrapper", wrapped, data: {[VeCt.ENTDATA_ITEM_MERGED_ENTRY_TAG]: "type.SCF"}});
				}
				if (item.scfType === "druid") {
					Renderer.item._initFullEntries(item);
					const wrapped = styleHint === "classic"
						? "A {@class druid} can use this object as a spellcasting focus."
						: "A Druidic Focus takes a specific form and is carved, tied with ribbon, or painted to channel primal magic. A {@class Druid|XPHB} or {@class Ranger|XPHB} can use such an object as a {@variantrule Spellcasting Focus|XPHB}.";
					item._fullEntries.push({type: "wrapper", wrapped, data: {[VeCt.ENTDATA_ITEM_MERGED_ENTRY_TAG]: "type.SCF"}});
				}
				if (item.scfType === "holy") {
					Renderer.item._initFullEntries(item);
					const wrapped = styleHint === "classic"
						? "A holy symbol is a representation of a god or pantheon. A {@class cleric} or {@class paladin} can use a holy symbol as a spellcasting focus. To use the symbol in this way, the caster must hold it in hand, wear it visibly, or bear it on a shield."
						: "A Holy Symbol takes a specific form and is bejeweled or painted to channel divine magic. A {@class Cleric|XPHB} or {@class Paladin|XPHB} can use a Holy Symbol as a {@variantrule Spellcasting Focus|XPHB}.";
					item._fullEntries.push({type: "wrapper", wrapped, data: {[VeCt.ENTDATA_ITEM_MERGED_ENTRY_TAG]: "type.SCF"}});
				}
			}
		}

		(item.mastery || [])
			.forEach(info => {
				const mastery = Renderer.item._getMastery(info.uid || info);

				if (!mastery.entries && !mastery.entriesTemplate) return;

				Renderer.item._initFullEntries(item);

				item._fullEntries.push({
					type: "wrapper",
					wrapped: {
						type: "entries",
						name: `Mastery: ${mastery.name}`,
						source: mastery.source,
						page: mastery.page,
						entries: Renderer.item._enhanceItem_getItemPropertyTypeEntries({item, ent: mastery}),
					},
					data: {
						[VeCt.ENTDATA_ITEM_MERGED_ENTRY_TAG]: "mastery",
					},
				});
			});

		// add additional entries based on type (e.g. XGE variants)
		if (item.type === Parser.ITM_TYP__TOOL || item.type === Parser.ITM_TYP__ARTISAN_TOOL || item.type === Parser.ITM_TYP__INSTRUMENT || item.type === Parser.ITM_TYP__GAMING_SET) { // tools, artisan's tools, instruments, gaming sets
			Renderer.item._initFullAdditionalEntries(item);
			item._fullAdditionalEntries.push({type: "wrapper", wrapped: {type: "hr"}, data: {[VeCt.ENTDATA_ITEM_MERGED_ENTRY_TAG]: "type"}});
			item._fullAdditionalEntries.push({type: "wrapper", wrapped: `{@note See the {@variantrule Tool Proficiencies|XGE} entry for more information.}`, data: {[VeCt.ENTDATA_ITEM_MERGED_ENTRY_TAG]: "type"}});
		}

		// Add additional sources for all instruments and gaming sets
		if (item.type === Parser.ITM_TYP__INSTRUMENT || item.type === Parser.ITM_TYP__GAMING_SET) item.additionalSources = item.additionalSources || [];
		if (item.type === Parser.ITM_TYP__INSTRUMENT) {
			if (!item.additionalSources.find(it => it.source === "XGE" && it.page === 83)) item.additionalSources.push({"source": "XGE", "page": 83});
		} else if (item.type === Parser.ITM_TYP__GAMING_SET) {
			if (!item.additionalSources.find(it => it.source === "XGE" && it.page === 81)) item.additionalSources.push({"source": "XGE", "page": 81});
		}

		const additionalEntriesFromType = Renderer.item.getAdditionalTypeEntries(item.type);
		if (additionalEntriesFromType) {
			Renderer.item._initFullAdditionalEntries(item);
			item._fullAdditionalEntries.push({type: "wrapper", wrapped: {type: "entries", entries: MiscUtil.copyFast(additionalEntriesFromType)}, data: {[VeCt.ENTDATA_ITEM_MERGED_ENTRY_TAG]: "type"}});
		}

		// bake in types
		({textTypes: item._textTypes, entryType: item._entryType, entrySubType: item._entrySubType} = Renderer.item.getRenderableTypeEntriesMeta(item, {styleHint}));

		// bake in attunement
		const [attune, attuneCat] = Renderer.item.getAttunementAndAttunementCatText(item);
		item._attunement = attune;
		item._attunementCategory = attuneCat;

		if (item.reqAttuneAlt) {
			const [attuneAlt, attuneCatAlt] = Renderer.item.getAttunementAndAttunementCatText(item, "reqAttuneAlt");
			item._attunementCategory = [attuneCat, attuneCatAlt];
		}

		// bake in rarity-based value
		Renderer.item._enhanceItem_mutItemRarityValue({item, styleHint});

		// handle item groups
		if (item._isItemGroup && item.items?.length && !item.itemsHidden) {
			Renderer.item._initFullEntries(item);
			item._fullEntries.push({type: "wrapper", wrapped: "Multiple variations of this item exist, as listed below:", data: {[VeCt.ENTDATA_ITEM_MERGED_ENTRY_TAG]: "magicvariant"}});
			item._fullEntries.push({
				type: "wrapper",
				wrapped: {
					type: "list",
					items: item.items.map(it => typeof it === "string" ? `{@item ${it}}` : `{@item ${it.name}|${it.source}}`),
				},
				data: {[VeCt.ENTDATA_ITEM_MERGED_ENTRY_TAG]: "magicvariant"},
			});
		}

		// region Add base items list
		// item.variants was added during generic variant creation
		if (item.variants && item.variants.length) {
			item.variants.sort((a, b) => SortUtil.ascSortLower(a.base.name, b.base.name) || SortUtil.ascSortLower(a.base.source, b.base.source));

			Renderer.item._initFullEntries(item);
			item._fullEntries.push({
				type: "wrapper",
				wrapped: {
					type: "entries",
					name: "Base items",
					entries: [
						"This item variant can be applied to the following base items:",
						{
							type: "list",
							items: item.variants.map(({base, specificVariant}) => {
								return `{@item ${base.name}|${base.source}} ({@item ${specificVariant.name}|${specificVariant.source}})`;
							}),
						},
					],
				},
				data: {[VeCt.ENTDATA_ITEM_MERGED_ENTRY_TAG]: "magicvariant"},
			});
		}
		// endregion
	}

	static _enhanceItem_getItemPropertyTypeEntries ({item, ent}) {
		if (!ent.entriesTemplate) return MiscUtil.copyFast(ent.entries);
		return MiscUtil
			.getWalker({
				keyBlocklist: MiscUtil.GENERIC_WALKER_ENTRIES_KEY_BLOCKLIST,
			})
			.walk(
				MiscUtil.copyFast(ent.entriesTemplate),
				{
					string: (str) => {
						return Renderer.utils.applyTemplate(
							item,
							str,
						);
					},
				},
			);
	}

	// See: XDMG, p217
	static _RARITY_TO_VALUE = {
		"common": 100_00,
		"uncommon": 400_00,
		"rare": 4000_00,
		"very rare": 40_000_00,
		"legendary": 200_000_00,
		"artifact": null,
	};

	static _enhanceItem_mutItemRarityValue ({item, styleHint}) {
		if (styleHint === "classic") return;

		const valueFromRarity = this._RARITY_TO_VALUE[item.valueRarity || item.rarity];
		if (!valueFromRarity) return;

		item._valueFromRarity = valueFromRarity;
	}

	static unenhanceItem (item) {
		if (!item._isEnhanced) return;
		delete item._isEnhanced;
		delete item._fullEntries;
	}

	static async pGetSiteUnresolvedRefItemsFromPrereleaseBrew ({brewUtil, brew = null}) {
		if (brewUtil == null && brew == null) return [];

		brew = brew || await brewUtil.pGetBrewProcessed();

		(brew.itemProperty || []).forEach(p => Renderer.item._addProperty(p));
		(brew.itemType || []).forEach(t => Renderer.item._addType(t));
		(brew.itemEntry || []).forEach(it => Renderer.item._addEntry(it));
		(brew.itemTypeAdditionalEntries || []).forEach(it => Renderer.item._addAdditionalTypeEntries(it));
		(brew.itemMastery || []).forEach(it => Renderer.item._addMastery(it));

		let items = [...(brew.baseitem || []), ...(brew.item || [])];

		if (brew.itemGroup) {
			const itemGroups = MiscUtil.copyFast(brew.itemGroup);
			itemGroups.forEach(it => it._isItemGroup = true);
			items = [...items, ...itemGroups];
		}

		Renderer.item._enhanceItems(items);

		let isReEnhanceVariants = false;

		// Get specific variants for brew base items, using official generic variants
		if (brew.baseitem && brew.baseitem.length) {
			isReEnhanceVariants = true;

			const {genericVariants} = await Renderer.item._pGetCacheSiteGenericVariants();

			const variants = await Renderer.item.pGetGenericAndSpecificVariants(
				genericVariants,
				{baseItems: brew.baseitem || [], isSpecificVariantsOnly: true},
			);
			items = [...items, ...variants];
		}

		// Get specific and generic variants for official and brew base items, using brew generic variants
		if (brew.magicvariant && brew.magicvariant.length) {
			isReEnhanceVariants = true;

			const variants = await Renderer.item.pGetGenericAndSpecificVariants(
				brew.magicvariant,
				{additionalBaseItems: brew.baseitem || []},
			);
			items = [...items, ...variants];
		}

		// Regenerate the full entries for the generic variants, as there may be more specific variants to add to their
		//   specific variant lists.
		if (isReEnhanceVariants) {
			const {genericVariants} = await Renderer.item._pGetCacheSiteGenericVariants();
			genericVariants.forEach(item => {
				Renderer.item.unenhanceItem(item);
				Renderer.item.enhanceItem(item);
			});
		}

		return items;
	}

	static async pGetItemsFromPrerelease () {
		return DataLoader.pCacheAndGetAllPrerelease(UrlUtil.PG_ITEMS);
	}

	static async pGetItemsFromBrew () {
		return DataLoader.pCacheAndGetAllBrew(UrlUtil.PG_ITEMS);
	}

	static _pPopulatePropertyAndTypeReference = null;
	static pPopulatePropertyAndTypeReference () {
		Renderer.item._pPopulatePropertyAndTypeReference ||= (async () => {
			const data = await DataUtil.loadJSON(`${Renderer.get().baseUrl}data/items-base.json`);

			data.itemProperty.forEach(p => Renderer.item._addProperty(p));
			data.itemType.forEach(t => Renderer.item._addType(t));
			data.itemEntry.forEach(it => Renderer.item._addEntry(it));
			data.itemTypeAdditionalEntries.forEach(e => Renderer.item._addAdditionalTypeEntries(e));
			(data.itemMastery || []).forEach(it => Renderer.item._addMastery(it));

			await Renderer.item._pAddPrereleaseBrewPropertiesAndTypes();
		})();

		return Renderer.item._pPopulatePropertyAndTypeReference;
	}

	// fetch every possible indexable item from official data
	static async getAllIndexableItems (rawVariants, rawBaseItems) {
		const basicItems = await Renderer.item._pGetAndProcBaseItems(rawBaseItems);
		const [genericVariants, linkedLootTables] = await Renderer.item._getAndProcGenericVariants(rawVariants);
		const specificVariants = Renderer.item._createSpecificVariants(basicItems, genericVariants, {linkedLootTables});

		[...genericVariants, ...specificVariants].forEach(item => {
			if (item.variants) delete item.variants; // prevent circular references
		});

		return specificVariants;
	}

	static isMundane (item) { return item.rarity === "none" || item.rarity === "unknown" || item._category === "Basic"; }

	static isExcluded (item, {hash = null} = {}) {
		const name = item.name;
		const source = item.source || item.inherits?.source;

		hash = hash || UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_ITEMS]({name, source});

		if (ExcludeUtil.isExcluded(hash, "item", source)) return true;

		if (item._isBaseItem) return ExcludeUtil.isExcluded(hash, "baseitem", source);
		if (item._isItemGroup) return ExcludeUtil.isExcluded(hash, "itemGroup", source);
		if (item._variantName) {
			if (ExcludeUtil.isExcluded(hash, "_specificVariant", source)) return true;

			const baseHash = UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_ITEMS]({name: item._baseName, source: item._baseSource || source});
			if (ExcludeUtil.isExcluded(baseHash, "baseitem", item._baseSource || source)) return true;

			const variantHash = UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_ITEMS]({name: item._variantName, source: source});
			return ExcludeUtil.isExcluded(variantHash, "magicvariant", source);
		}
		if (item.type && DataUtil.itemType.unpackUid(item.type).abbreviation === Parser.ITM_TYP_ABV__GENERIC_VARIANT) return ExcludeUtil.isExcluded(hash, "magicvariant", source);

		return false;
	}

	/* -------------------------------------------- */

	static getFlatAttachedSpells (item) {
		if (!item.attachedSpells) return null;
		if (item.attachedSpells instanceof Array) return item.attachedSpells;
		const out = [];
		Object.entries(item.attachedSpells)
			.forEach(([useType, v]) => {
				switch (useType) {
					case "will":
					case "ritual":
					case "other": {
						v.forEach(uid => {
							if (!out.includes(uid)) out.push(uid);
						});
						break;
					}

					case "rest":
					case "daily":
					case "limited":
					case "charges":
					case "resource": {
						Object.values(v)
							.forEach(arr => {
								arr.forEach(uid => {
									if (!out.includes(uid)) out.push(uid);
								});
							});
						break;
					}

					case "ability": break;
					case "resourceName": break;

					default: throw new Error(`Unhandled "attachedSpells" key "${useType}"!`);
				}
			});
		return out;
	}

	/* -------------------------------------------- */

	static async pGetFluff (item) {
		const fluffItem = await Renderer.utils.pGetFluff({
			entity: item,
			fluffProp: "itemFluff",
		});
		if (fluffItem) return fluffItem;

		if (!item._variantName) return null;

		// Inherit generic variant fluff
		return Renderer.utils.pGetFluff({
			entity: {
				name: item._variantName,
				source: item.source,
				hasFluff: item.hasFluff,
				hasFluffImages: item.hasFluffImages,
			},
			fluffProp: "itemFluff",
		});
	}
};

Renderer.psionic = class {
	static enhanceMode (mode) {
		if (mode._isEnhanced) return;

		mode.name = [mode.name, Renderer.psionic._enhanceMode_getModeTitleBracketPart({mode: mode})].filter(Boolean).join(" ");

		if (mode.submodes) {
			mode.submodes.forEach(sm => {
				sm.name = [sm.name, Renderer.psionic._enhanceMode_getModeTitleBracketPart({mode: sm})].filter(Boolean).join(" ");
			});
		}

		mode._isEnhanced = true;
	}

	static _enhanceMode_getModeTitleBracketPart ({mode}) {
		const modeTitleBracketArray = [];

		if (mode.cost) modeTitleBracketArray.push(Renderer.psionic._enhanceMode_getModeTitleCost({mode}));
		if (mode.concentration) modeTitleBracketArray.push(Renderer.psionic._enhanceMode_getModeTitleConcentration({mode}));

		if (modeTitleBracketArray.length === 0) return null;
		return `(${modeTitleBracketArray.join("; ")})`;
	}

	static _enhanceMode_getModeTitleCost ({mode}) {
		const costMin = mode.cost.min;
		const costMax = mode.cost.max;
		const costString = costMin === costMax ? costMin : `${costMin}-${costMax}`;
		return `${costString} psi`;
	}

	static _enhanceMode_getModeTitleConcentration ({mode}) {
		return `conc., ${mode.concentration.duration} ${mode.concentration.unit}.`;
	}

	/* -------------------------------------------- */

	static getPsionicRenderableEntriesMeta (ent) {
		const entriesContent = [];

		return {
			entryTypeOrder: `{@i ${Renderer.psionic.getTypeOrderString(ent)}}`,
			entryContent: ent.entries ? {entries: ent.entries, type: "entries"} : null,
			entryFocus: ent.focus ? `{@b {@i Psychic Focus.}} ${ent.focus}` : null,
			entriesModes: ent.modes
				? ent.modes
					.flatMap(mode => Renderer.psionic._getModeEntries(mode))
				: null,
		};
	}

	static _getModeEntries (mode, renderer) {
		Renderer.psionic.enhanceMode(mode);

		return [
			{
				type: mode.type || "entries",
				name: mode.name,
				entries: mode.entries,
			},
			mode.submodes ? Renderer.psionic._getSubModesEntry(mode.submodes) : null,
		]
			.filter(Boolean);
	}

	static _getSubModesEntry (subModes) {
		return {
			type: "list",
			style: "list-hang-notitle",
			items: subModes
				.map(sm => ({
					type: "item",
					name: sm.name,
					entries: sm.entries,
				})),
		};
	}

	static getTypeOrderString (psi) {
		const typeMeta = Parser.psiTypeToMeta(psi.type);
		// if "isAltDisplay" is true, render as e.g. "Greater Discipline (Awakened)" rather than "Awakened Greater Discipline"
		return typeMeta.hasOrder
			? typeMeta.isAltDisplay ? `${typeMeta.full} (${psi.order})` : `${psi.order} ${typeMeta.full}`
			: typeMeta.full;
	}

	static getBodyHtml (ent, {renderer = null, entriesMeta = null} = {}) {
		renderer ||= Renderer.get().setFirstSection(true);
		entriesMeta ||= Renderer.psionic.getPsionicRenderableEntriesMeta(ent);

		return `${entriesMeta.entryContent ? renderer.render(entriesMeta.entryContent) : ""}
		${entriesMeta.entryFocus ? `<p>${renderer.render(entriesMeta.entryFocus)}</p>` : ""}
		${entriesMeta.entriesModes ? entriesMeta.entriesModes.map(entry => renderer.render(entry, 2)).join("") : ""}`;
	}

	static getCompactRenderedString (ent) {
		const renderer = Renderer.get().setFirstSection(true);
		const entriesMeta = Renderer.psionic.getPsionicRenderableEntriesMeta(ent);

		return `
			${Renderer.utils.getExcludedTr({entity: ent, dataProp: "psionic", page: UrlUtil.PG_PSIONICS})}
			${Renderer.utils.getNameTr(ent, {page: UrlUtil.PG_PSIONICS})}
			<tr><td colspan="6" class="pb-2">
			<p>${renderer.render(entriesMeta.entryTypeOrder)}</p>
			${Renderer.psionic.getBodyHtml(ent, {renderer, entriesMeta})}
			</td></tr>
		`;
	}
};

Renderer.rule = class {
	static getCompactRenderedString (rule) {
		return `
			<tr><td colspan="6">
			${Renderer.get().setFirstSection(true).render(rule)}
			</td></tr>
		`;
	}
};

Renderer.variantrule = class {
	static getCompactRenderedString (rule) {
		const cpy = MiscUtil.copyFast(rule);
		delete cpy.name;
		if (cpy.entries && cpy.ruleType) cpy.entries.unshift(`{@i ${Parser.ruleTypeToFull(cpy.ruleType)} Rule}`);
		return `
			${Renderer.utils.getExcludedTr({entity: rule, dataProp: "variantrule", page: UrlUtil.PG_VARIANTRULES})}
			${Renderer.utils.getNameTr(rule, {page: UrlUtil.PG_VARIANTRULES})}
			<tr><td colspan="6">
			${Renderer.get().setFirstSection(true).render(cpy)}
			</td></tr>
		`;
	}
};

Renderer.table = class {
	static getCompactRenderedString (it) {
		it.type = it.type || "table";
		const cpy = MiscUtil.copyFast(it);
		delete cpy.name;
		return `
			${Renderer.utils.getExcludedTr({entity: it, dataProp: "table", page: UrlUtil.PG_TABLES})}
			${Renderer.utils.getNameTr(it, {page: UrlUtil.PG_TABLES})}
			<tr><td colspan="6">
			${Renderer.get().setFirstSection(true).render(it)}
			</td></tr>
		`;
	}

	static getConvertedEncounterOrNamesTable ({group, tableRaw, fnGetNameCaption, colLabel1}) {
		const getPadded = (number) => {
			if (tableRaw.diceExpression === "d100") return String(number).padStart(2, "0");
			return String(number);
		};

		const nameCaption = fnGetNameCaption(group, tableRaw);
		return {
			name: nameCaption,
			type: "table",
			source: group?.source,
			page: group?.page,
			caption: nameCaption,
			colLabels: [
				`{@dice ${tableRaw.diceExpression}}`,
				colLabel1,
				tableRaw.rollAttitude ? `Attitude` : null,
			].filter(Boolean),
			colStyles: [
				"col-2 text-center",
				tableRaw.rollAttitude ? "col-8" : "col-10",
				tableRaw.rollAttitude ? `col-2 text-center` : null,
			].filter(Boolean),
			rows: tableRaw.table.map(it => [
				`${getPadded(it.min)}${it.max != null && it.max !== it.min ? `-${getPadded(it.max)}` : ""}`,
				it.result,
				tableRaw.rollAttitude ? it.resultAttitude || "\u2014" : null,
			].filter(Boolean)),
			footnotes: tableRaw.footnotes,
		};
	}

	static getConvertedEncounterTableName (group, tableRaw) {
		const baseName = tableRaw.caption
			? tableRaw.caption
			: [
				tableRaw.captionPrefix,
				group.name,
				tableRaw.captionSuffix,
				/\bencounters?\b/i.test(group.name) ? "" : "Encounters",
			]
				.filter(Boolean)
				.join(" ");

		return `${baseName}${tableRaw.minlvl && tableRaw.maxlvl ? ` (Levels ${tableRaw.minlvl}\u2014${tableRaw.maxlvl})` : ""}`;
	}

	static getConvertedNameTableName (group, tableRaw) {
		return `${group.name} Names \u2013 ${tableRaw.option}`;
	}

	static getHeaderRowMetas (ent) {
		if (!ent.colLabels?.length && !ent.colLabelRows?.length) return null;

		if (ent.colLabels?.length) return [ent.colLabels];

		const lenPer = ent.colLabelRows
			.map(row => Renderer.table.getHeaderRowSpanWidth(row));
		const lenMax = Math.max(...lenPer);
		if (lenPer.every(len => len === lenMax)) return ent.colLabelRows;

		const cpy = MiscUtil.copyFast(ent.colLabelRows);
		cpy
			.forEach((row, i) => {
				const len = lenPer[i];
				for (let j = len; j < lenMax; ++j) row.push("");
			});
		return cpy;
	}

	static getHeaderRowSpanWidth (colLabelRow) {
		return colLabelRow.reduce((a, b) => a + (b.type === "cellHeader" ? b.width || 1 : 1), 0);
	}

	static _RE_TABLE_ROW_DASHED_NUMBERS = /^\d+([-\u2012-\u2014\u2212]\d+)?/;
	static getAutoConvertedRollMode (table, {headerRowMetas} = {}) {
		if (headerRowMetas === undefined) headerRowMetas = Renderer.table.getHeaderRowMetas(table);

		if (!headerRowMetas) return RollerUtil.ROLL_COL_NONE;

		const headerRowMetaBottom = headerRowMetas.at(-1);
		if (headerRowMetaBottom.length < 2) return RollerUtil.ROLL_COL_NONE;

		const [cellFirst] = headerRowMetaBottom;

		const rollColMode = RollerUtil.getColRollType(cellFirst);
		if (!rollColMode) return RollerUtil.ROLL_COL_NONE;

		if (!Renderer.table.isEveryRowRollable(table.rows)) return RollerUtil.ROLL_COL_NONE;

		return rollColMode;
	}

	static isEveryRowRollable (rows) {
		// scan the first column to ensure all rollable
		return rows
			.every(row => {
				if (!row) return false;
				const [cell] = row;
				return Renderer.table.isRollableCell(cell);
			});
	}

	static isRollableCell (cell) {
		if (cell == null) return false;
		if (cell?.roll) return true;

		if (typeof cell === "number") return Number.isInteger(cell);

		// u2012 = figure dash; u2013 = en-dash
		return typeof cell === "string" && Renderer.table._RE_TABLE_ROW_DASHED_NUMBERS.test(cell);
	}
};

Renderer.vehicle = class {
	static CHILD_PROPS = ["movement", "weapon", "station", "other", "action", "trait", "reaction", "control", "actionStation"];

	static getVehicleRenderableEntriesMeta (ent) {
		return {
			entryDamageVulnerabilities: ent.vulnerable
				? `{@b Damage Vulnerabilities} ${Parser.getFullImmRes(ent.vulnerable)}`
				: null,
			entryDamageResistances: ent.resist
				? `{@b Damage Resistances} ${Parser.getFullImmRes(ent.resist)}`
				: null,
			entryDamageImmunities: ent.immune
				? `{@b Damage Immunities} ${Parser.getFullImmRes(ent.immune)}`
				: null,
			entryConditionImmunities: ent.conditionImmune
				? `{@b Condition Immunities} ${Parser.getFullCondImm(ent.conditionImmune, {isEntry: true})}`
				: null,
		};
	}

	static getCompactRenderedString (veh, opts) {
		return Renderer.vehicle.getRenderedString(veh, {...opts, isCompact: true});
	}

	static getRenderedString (ent, opts) {
		opts = opts || {};
		opts.styleHint ||= VetoolsConfig.get("styleSwitcher", "style");

		if (ent.upgradeType) return Renderer.vehicleUpgrade.getCompactRenderedString(ent, opts);

		ent.vehicleType ||= "SHIP";
		switch (ent.vehicleType) {
			case "SHIP": return Renderer.vehicle._getRenderedString_ship(ent, opts);
			case "SPELLJAMMER": return Renderer.vehicle._getRenderedString_spelljammer(ent, opts);
			case "ELEMENTAL_AIRSHIP": return Renderer.vehicle._getRenderedString_elementalAirship(ent, opts);
			case "INFWAR": return Renderer.vehicle._getRenderedString_infwar(ent, opts);
			case "CREATURE": return Renderer.monster.getCompactRenderedString(ent, {...opts, isHideLanguages: true, isHideSenses: true, isCompact: opts.isCompact ?? false, page: UrlUtil.PG_VEHICLES});
			case "OBJECT": return Renderer.object.getCompactRenderedString(ent, {...opts, isCompact: opts.isCompact ?? false, page: UrlUtil.PG_VEHICLES});
			default: throw new Error(`Unhandled vehicle type "${ent.vehicleType}"`);
		}
	}

	static ship = class {
		static PROPS_RENDERABLE_ENTRIES_ATTRIBUTES = [
			"entryCreatureCapacity",
			"entryCargoCapacity",
			"entryTravelPace",
			"entryTravelPaceNote",
		];

		static getVehicleShipRenderableEntriesMeta (ent) {
			// Render UA ship actions at the top, to match later printed layout
			const entriesOtherActions = (ent.other || []).filter(it => it.name === "Actions");
			const entriesOtherOthers = (ent.other || []).filter(it => it.name !== "Actions");

			return {
				entrySizeDimensions: `{@i ${Parser.sizeAbvToFull(ent.size)} vehicle${ent.dimensions ? ` (${ent.dimensions.join(" by ")})` : ""}}`,
				entryCreatureCapacity: ent.capCrew != null || ent.capPassenger != null
					? `{@b Creature Capacity} ${Renderer.vehicle.getShipCreatureCapacity(ent)}`
					: null,
				entryCargoCapacity: ent.capCargo != null
					? `{@b Cargo Capacity} ${Renderer.vehicle.getShipCargoCapacity(ent)}`
					: null,
				entryTravelPace: ent.pace != null
					? `{@b Travel Pace} ${ent.pace} miles per hour (${ent.pace * 24} miles per day)`
					: null,
				entryTravelPaceNote: ent.pace != null
					? `[{@b Speed} ${ent.pace * 10} ft.]`
					: null,
				entryTravelPaceNoteTitle: ent.pace != null
					? VetoolsConfig.get("styleSwitcher", "style") === "classic"
						? `Based on "Special Travel Pace," ${Parser.sourceJsonToAbv(Parser.SRC_DMG)} p242`
						: `Based on "Travel Pace," ${Parser.sourceJsonToAbv(Parser.SRC_XDMG)} p39`
					: null,

				entriesOtherActions: entriesOtherActions.length ? entriesOtherActions : null,
				entriesOtherOthers: entriesOtherOthers.length ? entriesOtherOthers : null,
			};
		}

		static getLocomotionEntries (loc) {
			return {
				type: "list",
				style: "list-hang-notitle",
				items: [
					{
						type: "item",
						name: `Locomotion (${loc.mode})`,
						entries: loc.entries,
					},
				],
			};
		}

		static getSpeedEntries (spd) {
			return {
				type: "list",
				style: "list-hang-notitle",
				items: [
					{
						type: "item",
						name: `Speed (${spd.mode})`,
						entries: spd.entries,
					},
				],
			};
		}

		static getActionPart_ (renderer, veh) {
			return renderer.render({entries: veh.action});
		}

		static getSectionTitle_ (title) {
			return `<tr><td colspan="6"><h3 class="stats__sect-header-inner">${title}</h3></td></tr>`;
		}

		static getSectionHpEntriesMeta_ ({entry, isEach = false}) {
			return {
				entryArmorClass: entry.ac
					? `{@b Armor Class} ${entry.ac}`
					: null,
				entryHitPoints: entry.hp
					? `{@b Hit Points} ${entry.hp}${isEach ? ` each` : ""}${entry.dt ? ` (damage threshold ${entry.dt})` : ""}${entry.hpNote ? `; ${entry.hpNote}` : ""}`
					: null,
			};
		}

		static getSectionHpPart_ (renderer, entry, isEach) {
			const entriesMetaSection = Renderer.vehicle.ship.getSectionHpEntriesMeta_({entry, isEach});

			const props = [
				"entryArmorClass",
				"entryHitPoints",
			];

			if (!props.some(prop => entriesMetaSection[prop])) return "";

			return props
				.map(prop => `<div>${renderer.render(entriesMetaSection[prop])}</div>`)
				.join("");
		}

		static getControlSection_ (renderer, control) {
			if (!control) return "";
			return `
				<tr><td colspan="6"><h3 class="stats__sect-header-inner">Control: ${control.name}</h3></td></tr>
				<tr><td colspan="6" class="stats__sect-row-inner">
				${Renderer.vehicle.ship.getSectionHpPart_(renderer, control)}
				<div class="rd__b--1">${renderer.render({entries: control.entries})}</div>
				</td></tr>
			`;
		}

		static _getMovementSection_getLocomotionSection ({renderer, entry}) {
			const asList = Renderer.vehicle.ship.getLocomotionEntries(entry);
			return `<div class="rd__b--1">${renderer.render(asList)}</div>`;
		}

		static _getMovementSection_getSpeedSection ({renderer, entry}) {
			const asList = Renderer.vehicle.ship.getSpeedEntries(entry);
			return `<div class="rd__b--1">${renderer.render(asList)}</div>`;
		}

		static getMovementSection_ (renderer, move) {
			if (!move) return "";

			return `
				<tr><td colspan="6"><h3 class="stats__sect-header-inner">${move.isControl ? `Control and ` : ""}Movement: ${move.name}</h3></td></tr>
				<tr><td colspan="6" class="stats__sect-row-inner">
				${Renderer.vehicle.ship.getSectionHpPart_(renderer, move)}
				${(move.locomotion || []).map(entry => Renderer.vehicle.ship._getMovementSection_getLocomotionSection({renderer, entry})).join("")}
				${(move.speed || []).map(entry => Renderer.vehicle.ship._getMovementSection_getSpeedSection({renderer, entry})).join("")}
				</td></tr>
			`;
		}

		static getWeaponSection_ (renderer, weap) {
			return `
				<tr><td colspan="6"><h3 class="stats__sect-header-inner">Weapons: ${weap.name}${weap.count ? ` (${weap.count})` : ""}</h3></td></tr>
				<tr><td colspan="6" class="stats__sect-row-inner">
				${Renderer.vehicle.ship.getSectionHpPart_(renderer, weap, !!weap.count)}
				${renderer.render({entries: weap.entries})}
				</td></tr>
			`;
		}

		static getOtherSection_ (renderer, oth) {
			return `
				<tr><td colspan="6"><h3 class="stats__sect-header-inner">${oth.name}</h3></td></tr>
				<tr><td colspan="6" class="stats__sect-row-inner">
				${Renderer.vehicle.ship.getSectionHpPart_(renderer, oth)}
				${renderer.render({entries: oth.entries})}
				</td></tr>
			`;
		}

		static getCrewCargoPaceSection_ (ent, {entriesMetaShip = null} = {}) {
			entriesMetaShip ||= Renderer.vehicle.ship.getVehicleShipRenderableEntriesMeta(ent);
			if (!Renderer.vehicle.ship.PROPS_RENDERABLE_ENTRIES_ATTRIBUTES.some(prop => entriesMetaShip[prop])) return "";

			return `<tr><td colspan="6" class="pb-2">
				${entriesMetaShip.entryCreatureCapacity ? `<div>${Renderer.get().render(entriesMetaShip.entryCreatureCapacity)}</div>` : ""}
				${entriesMetaShip.entryCargoCapacity ? `<div>${Renderer.get().render(entriesMetaShip.entryCargoCapacity)}</div>` : ""}
				${entriesMetaShip.entryTravelPace ? `<div>${Renderer.get().render(entriesMetaShip.entryTravelPace)}</div>` : ""}
				${entriesMetaShip.entryTravelPaceNote ? `<div class="ve-muted ve-small help-subtle ml-2" ${entriesMetaShip.entryTravelPaceNoteTitle ? `title="${Renderer.stripTags(entriesMetaShip.entryTravelPaceNote).qq()}"` : ""}>${Renderer.get().render(entriesMetaShip.entryTravelPaceNote)}</div>` : ""}
			</td></tr>`;
		}
	};

	static spelljammerElementalAirship = class {
		static _getRenderableEntriesMeta_getPtPace (ent) {
			if (!ent.pace) return "";

			const isMulti = Object.keys(ent.pace).length > 1;

			return Parser.SPEED_MODES
				.map(mode => {
					const pace = ent.pace[mode];
					if (!pace) return null;

					const asNum = Parser.vulgarToNumber(pace);
					return `{@tip ${isMulti && mode !== "walk" ? `${mode} ` : ""}${pace} mph|${asNum * 24} miles per day}`;
				})
				.filter(Boolean)
				.join(", ");
		}

		static getRenderableEntriesMeta (ent) {
			const ptAc = ent.hull?.ac
				? `${ent.hull.ac}${ent.hull.acFrom ? ` (${ent.hull.acFrom.join(", ")})` : ""}`
				: "\u2014";

			return {
				entryAc: `{@b Armor Class:} ${ptAc}`,
				entryCargo: `{@b Cargo:} ${ent.capCargo ? `${ent.capCargo} ton${ent.capCargo === 1 ? "" : "s"}` : "\u2014"}`,
				entryHitPoints: `{@b Hit Points:} ${ent.hull?.hp ?? "\u2014"}`,
				entryCrew: `{@b Crew:} ${ent.capCrew ?? "\u2014"}${ent.capCrewNote ? ` ${ent.capCrewNote}` : ""}`,
				entryDamageThreshold: `{@b Damage Threshold:} ${ent.hull?.dt ?? "\u2014"}`,
				entryCost: `{@b Cost:} ${ent.cost != null ? Parser.vehicleCostToFull(ent) : "\u2014"}`,
				entryPacePt: this._getRenderableEntriesMeta_getPtPace(ent),
			};
		}

		/* -------------------------------------------- */

		static getStationEntriesMeta (entry) {
			const ptSize = entry.size ? Renderer.utils.getRenderedSize(entry.size) : null;

			const ptCosts = entry.costs?.length
				? entry.costs.map(cost => {
					return `${Parser.vehicleCostToFull(cost) || "\u2014"}${cost.note ? ` (${cost.note})` : ""}`;
				}).join(", ")
				: "\u2014";

			return {
				entrySize: ptSize ? `{@i ${ptSize} Object}` : null,
				entryArmorClass: `{@b Armor Class:} ${entry.ac == null ? "\u2014" : entry.ac}`,
				entryHitPoints: `{@b Hit Points:} ${entry.hp == null ? "\u2014" : entry.hp}`,
				entryCost: `{@b Cost:} ${ptCosts}`,
			};
		}

		static getStationSection_ ({entriesMetaParent, renderer, entry, isDisplayEmptyCost = false} = {}) {
			const entriesMeta = Renderer.vehicle.spelljammerElementalAirship.getStationEntriesMeta(entry);

			const ptAction = entry.action?.length
				? entry.action.map(act => `<div class="mt-1">${renderer.render(act, 2)}</div>`).join("")
				: "";
			return `
				<tr><td colspan="6"><h3 class="stats__sect-header-inner">${entriesMetaParent.entryName}</h3></td></tr>
				<tr><td colspan="6" class="stats__sect-row-inner">
				${entriesMeta.entrySize ? `<div class="mb-2">${renderer.render(entriesMeta.entrySize)}</div>` : ""}
				<div>${renderer.render(entriesMeta.entryArmorClass)}</div>
				<div>${renderer.render(entriesMeta.entryHitPoints)}</div>
				${isDisplayEmptyCost || entry.costs?.length ? `<div>${renderer.render(entriesMeta.entryCost)}</div>` : ""}
				${entry.entries?.length ? `<div class="mt-2">${renderer.render({entries: entry.entries})}</div>` : ""}
				${ptAction}
				</td></tr>
			`;
		}
	};

	static spelljammer = class {
		static getRenderableEntriesMeta (ent) {
			const {
				entryAc,
				entryCargo,
				entryHitPoints,
				entryCrew,
				entryDamageThreshold,
				entryCost,
				entryPacePt,
			} = Renderer.vehicle.spelljammerElementalAirship.getRenderableEntriesMeta(ent);

			const ptSpeed = ent.speed != null
				? Parser.getSpeedString(ent, {isSkipZeroWalk: true})
				: "";

			const ptSpeedPace = [ptSpeed, ptSpeed ? `(${entryPacePt})` : entryPacePt].filter(Boolean).join(" ");

			return {
				entryTableSummary: {
					type: "table",
					style: "summary",
					colStyles: ["col-6", "col-6"],
					rows: [
						[
							entryAc,
							entryCargo,
						],
						[
							entryHitPoints,
							entryCrew,
						],
						[
							entryDamageThreshold,
							`{@b Keel/Beam:} ${(ent.dimensions || ["\u2014"]).join("/")}`,
						],
						[
							`{@b Speed:} ${ptSpeedPace}`,
							entryCost,
						],
					],
				},
			};
		}

		static getSummarySection_ (renderer, ent) {
			const entriesMeta = Renderer.vehicle.spelljammer.getRenderableEntriesMeta(ent);

			return `<tr><td colspan="6">${renderer.render(entriesMeta.entryTableSummary)}</td></tr>`;
		}

		/* -------------------------------------------- */

		static getStationEntriesMeta (entry) {
			const isMultiple = entry.count != null && entry.count > 1;

			return {
				entryName: `${isMultiple ? `${entry.count} ` : ""}${entry.name}${entry.crew ? ` (Crew: ${entry.crew}${isMultiple ? " each" : ""})` : ""}`,
			};
		}

		static getStationSection_ ({entry, renderer}) {
			const entriesMeta = Renderer.vehicle.spelljammer.getStationEntriesMeta(entry);
			return Renderer.vehicle.spelljammerElementalAirship.getStationSection_({entriesMetaParent: entriesMeta, entry, renderer, isDisplayEmptyCost: true});
		}
	};

	static elementalAirship = class {
		static getRenderableEntriesMeta (ent) {
			const {
				entryAc,
				entryCargo,
				entryHitPoints,
				entryCrew,
				entryDamageThreshold,
				entryCost,
				entryPacePt,
			} = Renderer.vehicle.spelljammerElementalAirship.getRenderableEntriesMeta(ent);

			const ptSpeed = ent.speed != null
				? Parser.getSpeedString(ent, {isSkipZeroWalk: true})
				: "";

			const ptPaceSpeed = [entryPacePt, ptSpeed ? `(${ptSpeed})` : null].filter(Boolean).join(" ");

			return {
				entryTableSummary: {
					type: "table",
					style: "summary",
					colStyles: ["col-6", "col-6"],
					rows: [
						[
							entryAc,
							entryCrew,
						],
						[
							entryHitPoints,
							`{@b Passengers:} ${ent.capPassenger ? ent.capPassenger : "\u2014"}`,
						],
						[
							entryDamageThreshold,
							entryCargo,
						],
						[
							`{@b Speed:} ${ptPaceSpeed}`,
							entryCost,
						],
					],
				},
			};
		}

		static getSummarySection_ (renderer, ent) {
			const entriesMeta = Renderer.vehicle.elementalAirship.getRenderableEntriesMeta(ent);

			return `<tr><td colspan="6">${renderer.render(entriesMeta.entryTableSummary)}</td></tr>`;
		}

		/* -------------------------------------------- */

		static getStationEntriesMeta (entry) {
			const isMultiple = entry.count != null && entry.count > 1;

			return {
				entryName: `${entry.name}${isMultiple ? ` (${entry.count})` : ""}`,
			};
		}

		static getStationSection_ ({entry, renderer}) {
			const entriesMeta = Renderer.vehicle.elementalAirship.getStationEntriesMeta(entry);
			return Renderer.vehicle.spelljammerElementalAirship.getStationSection_({entriesMetaParent: entriesMeta, entry, renderer});
		}
	};

	static _getAbilitySection (veh) {
		return Parser.ABIL_ABVS.some(it => veh[it] != null) ? `<tr><td colspan="6">
			<table class="w-100 summary stripe-even-table">
				<tr>
					<th class="ve-col-2 ve-text-center">STR</th>
					<th class="ve-col-2 ve-text-center">DEX</th>
					<th class="ve-col-2 ve-text-center">CON</th>
					<th class="ve-col-2 ve-text-center">INT</th>
					<th class="ve-col-2 ve-text-center">WIS</th>
					<th class="ve-col-2 ve-text-center">CHA</th>
				</tr>
				<tr>
					<td class="ve-text-center">${Renderer.utils.getAbilityRoller(veh, "str")}</td>
					<td class="ve-text-center">${Renderer.utils.getAbilityRoller(veh, "dex")}</td>
					<td class="ve-text-center">${Renderer.utils.getAbilityRoller(veh, "con")}</td>
					<td class="ve-text-center">${Renderer.utils.getAbilityRoller(veh, "int")}</td>
					<td class="ve-text-center">${Renderer.utils.getAbilityRoller(veh, "wis")}</td>
					<td class="ve-text-center">${Renderer.utils.getAbilityRoller(veh, "cha")}</td>
				</tr>
			</table>
		</td></tr>` : "";
	}

	static _getResImmVulnSection (ent, {entriesMeta = null} = {}) {
		entriesMeta ||= Renderer.vehicle.getVehicleRenderableEntriesMeta(ent);

		const props = [
			"entryDamageVulnerabilities",
			"entryDamageResistances",
			"entryDamageImmunities",
			"entryConditionImmunities",
		];

		if (!props.some(prop => entriesMeta[prop])) return "";

		return `<tr><td colspan="6" class="pb-2">
			${props.filter(prop => entriesMeta[prop]).map(prop => `<div>${Renderer.get().render(entriesMeta[prop])}</div>`).join("")}
		</td></tr>`;
	}

	static _getTraitSection (renderer, veh) {
		return veh.trait ? `<tr><td colspan="6"><h3 class="stats__sect-header-inner">Traits</h3></td></tr>
		<tr><td colspan="6" class="pt-2 pb-2">
		${Renderer.monster.getOrderedTraits(veh, renderer).map(it => it.rendered || renderer.render(it, 2)).join("")}
		</td></tr>` : "";
	}

	static _getRenderedString_ship (ent, opts) {
		const renderer = Renderer.get();
		const entriesMeta = Renderer.vehicle.getVehicleRenderableEntriesMeta(ent);
		const entriesMetaShip = Renderer.vehicle.ship.getVehicleShipRenderableEntriesMeta(ent);

		const isInlinedToken = !opts.isCompact && Renderer.vehicle.hasToken(ent);

		return `
			${Renderer.utils.getExcludedTr({entity: ent, dataProp: "vehicle", page: UrlUtil.PG_VEHICLES})}
			${Renderer.utils.getNameTr(ent, {isInlinedToken, page: UrlUtil.PG_VEHICLES})}
			<tr><td colspan="6"${opts.isCompact ? ` class="pb-2"` : ""}>${Renderer.get().render(entriesMetaShip.entrySizeDimensions)}</td></tr>
			${Renderer.vehicle.ship.getCrewCargoPaceSection_(ent, {entriesMetaShip})}
			${Renderer.vehicle._getAbilitySection(ent)}
			${Renderer.vehicle._getResImmVulnSection(ent, {entriesMeta})}
			${ent.action ? Renderer.vehicle.ship.getSectionTitle_("Actions") : ""}
			${ent.action ? `<tr><td colspan="6" class="stats__sect-row-inner">${Renderer.vehicle.ship.getActionPart_(renderer, ent)}</td></tr>` : ""}
			${(entriesMetaShip.entriesOtherActions || []).map(Renderer.vehicle.ship.getOtherSection_.bind(this, renderer)).join("")}
			${ent.hull ? `${Renderer.vehicle.ship.getSectionTitle_("Hull")}
			<tr><td colspan="6" class="stats__sect-row-inner">
			${Renderer.vehicle.ship.getSectionHpPart_(renderer, ent.hull)}
			</td></tr>` : ""}
			${Renderer.vehicle._getTraitSection(renderer, ent)}
			${(ent.control || []).map(Renderer.vehicle.ship.getControlSection_.bind(this, renderer)).join("")}
			${(ent.movement || []).map(Renderer.vehicle.ship.getMovementSection_.bind(this, renderer)).join("")}
			${(ent.weapon || []).map(Renderer.vehicle.ship.getWeaponSection_.bind(this, renderer)).join("")}
			${(entriesMetaShip.entriesOtherOthers || []).map(Renderer.vehicle.ship.getOtherSection_.bind(this, renderer)).join("")}
		`;
	}

	static getShipCreatureCapacity (veh) {
		return [
			veh.capCrew ? `${veh.capCrew} crew` : null,
			veh.capPassenger ? `${veh.capPassenger} passenger${veh.capPassenger === 1 ? "" : "s"}` : null,
		].filter(Boolean).join(", ");
	}

	static getShipCargoCapacity (veh) {
		return typeof veh.capCargo === "string" ? veh.capCargo : `${veh.capCargo} ton${veh.capCargo === 1 ? "" : "s"}`;
	}

	static _getRenderedString_spelljammer (veh, opts) {
		const renderer = Renderer.get();

		const isInlinedToken = !opts.isCompact && Renderer.vehicle.hasToken(veh);

		return `
			${Renderer.utils.getExcludedTr({entity: veh, dataProp: "vehicle", page: UrlUtil.PG_VEHICLES})}
			${Renderer.utils.getNameTr(veh, {isInlinedToken, page: UrlUtil.PG_VEHICLES})}
			${Renderer.vehicle.spelljammer.getSummarySection_(renderer, veh)}
			${(veh.weapon || []).map(entry => Renderer.vehicle.spelljammer.getStationSection_({entry, renderer})).join("")}
		`;
	}

	static _getRenderedString_elementalAirship (veh, opts) {
		const renderer = Renderer.get();

		const isInlinedToken = !opts.isCompact && Renderer.vehicle.hasToken(veh);

		return `
			${Renderer.utils.getExcludedTr({entity: veh, dataProp: "vehicle", page: UrlUtil.PG_VEHICLES})}
			${Renderer.utils.getNameTr(veh, {isInlinedToken, page: UrlUtil.PG_VEHICLES})}
			${Renderer.vehicle.elementalAirship.getSummarySection_(renderer, veh)}
			${(veh.weapon || []).map(entry => Renderer.vehicle.elementalAirship.getStationSection_({entry, renderer})).join("")}
			${(veh.station || []).map(entry => Renderer.vehicle.elementalAirship.getStationSection_({entry, renderer})).join("")}
		`;
	}

	static infwar = class {
		static PROPS_RENDERABLE_ENTRIES_ATTRIBUTES = [
			"entryCreatureCapacity",
			"entryCargoCapacity",
			"entryArmorClass",
			"entryHitPoints",
			"entrySpeed",
		];

		static getVehicleInfwarRenderableEntriesMeta (ent) {
			const dexMod = Parser.getAbilityModNumber(ent.dex);

			const ptDtMt = [
				ent.hp.dt != null ? `damage threshold ${ent.hp.dt}` : null,
				ent.hp.mt != null ? `mishap threshold ${ent.hp.mt}` : null,
			]
				.filter(Boolean)
				.join(", ");

			const ptAc = ent.ac ?? dexMod === 0 ? `19` : `${19 + dexMod} (19 while motionless)`;

			return {
				entrySizeWeight: `{@i ${Parser.sizeAbvToFull(ent.size)} vehicle (${ent.weight.toLocaleStringVe()} lb.)}`,
				entryCreatureCapacity: `{@b Creature Capacity} ${Renderer.vehicle.getInfwarCreatureCapacity(ent)}`,
				entryCargoCapacity: `{@b Cargo Capacity} ${Parser.weightToFull(ent.capCargo)}`,
				entryArmorClass: `{@b Armor Class} ${ptAc}`,
				entryHitPoints: `{@b Hit Points} ${ent.hp.hp}${ptDtMt ? ` (${ptDtMt})` : ""}`,
				entrySpeed: `{@b Speed} ${ent.speed} ft.`,
				entrySpeedNote: `[{@b Travel Pace} ${Math.floor(ent.speed / 10)} miles per hour (${Math.floor(ent.speed * 24 / 10)} miles per day)]`,
				entrySpeedNoteTitle: VetoolsConfig.get("styleSwitcher", "style") === "classic"
					? `Based on "Special Travel Pace," ${Parser.sourceJsonToAbv(Parser.SRC_DMG)} p242`
					: `Based on "Travel Pace," ${Parser.sourceJsonToAbv(Parser.SRC_XDMG)} p39`,
			};
		}
	};

	static _getRenderedString_infwar (ent, opts) {
		const renderer = Renderer.get();
		const entriesMeta = Renderer.vehicle.getVehicleRenderableEntriesMeta(ent);
		const entriesMetaInfwar = Renderer.vehicle.infwar.getVehicleInfwarRenderableEntriesMeta(ent);

		const isInlinedToken = !opts.isCompact && Renderer.vehicle.hasToken(ent);

		const ptActionStation = Renderer.monster.getCompactRenderedStringSection({
			ent,
			renderer,
			title: "Action Stations",
			key: "actionStation",
			depth: 2,
			styleHint: opts.styleHint,
		});
		const ptReaction = Renderer.monster.getCompactRenderedStringSection({
			ent,
			renderer,
			title: "Reactions",
			key: "reaction",
			depth: 2,
			styleHint: opts.styleHint,
		});

		return `
			${Renderer.utils.getExcludedTr({entity: ent, datProp: "vehicle", page: UrlUtil.PG_VEHICLES})}
			${Renderer.utils.getNameTr(ent, {isInlinedToken, page: UrlUtil.PG_VEHICLES})}
			<tr><td colspan="6" class="pb-2">${renderer.render(entriesMetaInfwar.entrySizeWeight)}</td></tr>
			<tr><td colspan="6" class="pb-2">
				${Renderer.vehicle.infwar.PROPS_RENDERABLE_ENTRIES_ATTRIBUTES.map(prop => `<div>${renderer.render(entriesMetaInfwar[prop])}</div>`).join("")}
				<div class="ve-muted ve-small help-subtle ml-2" title="${Renderer.stripTags(entriesMetaInfwar.entrySpeedNoteTitle).qq()}">${renderer.render(entriesMetaInfwar.entrySpeedNote)}</div>
			</td></tr>
			${Renderer.vehicle._getAbilitySection(ent)}
			${Renderer.vehicle._getResImmVulnSection(ent, {entriesMeta})}
			${Renderer.vehicle._getTraitSection(renderer, ent)}
			${ptActionStation}
			${ptReaction}
		`;
	}

	static getInfwarCreatureCapacity (veh) {
		return `${veh.capCreature} Medium creatures`;
	}

	static pGetFluff (veh) {
		return Renderer.utils.pGetFluff({
			entity: veh,
			fluffProp: "vehicleFluff",
		});
	}

	static hasToken (veh, opts) {
		return Renderer.generic.hasToken(veh, opts);
	}

	static getTokenUrl (veh, opts) {
		return Renderer.generic.getTokenUrl(veh, "vehicles/tokens", opts);
	}
};

Renderer.vehicleUpgrade = class {
	static getUpgradeSummary (ent, {styleHint = null} = {}) {
		styleHint ||= VetoolsConfig.get("styleSwitcher", "style");

		return [
			ent.upgradeType ? ent.upgradeType.map(t => Parser.vehicleTypeToFull(t)) : null,
			ent.prerequisite ? Renderer.utils.prerequisite.getHtml(ent.prerequisite, {styleHint}) : null,
		]
			.filter(Boolean)
			.join(", ");
	}

	static getCompactRenderedString (ent, opts) {
		const styleHint = VetoolsConfig.get("styleSwitcher", "style");

		return `${Renderer.utils.getExcludedTr({entity: ent, dataProp: "vehicleUpgrade", page: UrlUtil.PG_VEHICLES})}
		${Renderer.utils.getNameTr(ent, {page: UrlUtil.PG_VEHICLES})}
		<tr><td colspan="6"><i>${Renderer.vehicleUpgrade.getUpgradeSummary(ent, {styleHint})}</i></td></tr>
		<tr><td colspan="6" class="py-0"><div class="ve-tbl-divider"></div></td></tr>
		<tr><td colspan="6">${Renderer.get().render({entries: ent.entries}, 1)}</td></tr>`;
	}
};

Renderer.action = class {
	static getCompactRenderedString (it) {
		const cpy = MiscUtil.copyFast(it);
		delete cpy.name;
		return `${Renderer.utils.getExcludedTr({entity: it, dataProp: "action", page: UrlUtil.PG_ACTIONS})}
		${Renderer.utils.getNameTr(it, {page: UrlUtil.PG_ACTIONS})}
		<tr><td colspan="6">${Renderer.get().setFirstSection(true).render(cpy)}</td></tr>`;
	}
};

Renderer.language = class {
	static getLanguageRenderableEntriesMeta (ent) {
		const hasMeta = ent.typicalSpeakers || ent.script || ent.origin;

		const entriesContent = [];

		if (ent.entries) entriesContent.push(...ent.entries);
		if (ent.dialects) {
			entriesContent.push(`This language is a family which includes the following dialects: ${ent.dialects.sort(SortUtil.ascSortLower).join(", ")}. Creatures that speak different dialects of the same language can communicate with one another.`);
		}

		if (!entriesContent.length && !hasMeta) entriesContent.push("{@i No information available.}");

		return {
			entryType: ent.type ? `{@i ${ent.type.toTitleCase()} language}` : null,
			entryTypicalSpeakers: ent.typicalSpeakers ? `{@b Typical Speakers:} ${ent.typicalSpeakers.join(", ")}` : null,
			entryOrigin: ent.origin ? `{@b Origin:} ${ent.origin}` : null,
			entryScript: ent.script ? `{@b Script:} ${ent.script}` : null,
			entriesContent: entriesContent.length ? entriesContent : null,
		};
	}

	static getCompactRenderedString (ent) {
		return Renderer.language.getRenderedString(ent, {isCompact: true});
	}

	static getRenderedString (ent, {isSkipNameRow = false, isCompact = false} = {}) {
		const entriesMeta = Renderer.language.getLanguageRenderableEntriesMeta(ent);

		const ptText = [
			entriesMeta.entryType ? Renderer.get().render(entriesMeta.entryType) : "",
			[entriesMeta.entryTypicalSpeakers, entriesMeta.entryOrigin, entriesMeta.entryScript]
				.filter(Boolean)
				.map(it => `<div>${Renderer.get().render(it)}</div>`)
				.join(""),
			entriesMeta.entriesContent ? Renderer.get().setFirstSection(true).render({entries: entriesMeta.entriesContent}) : "",
		]
			.filter(Boolean)
			.map((pt, i, arr) => `<div ${i === arr.length - 1 ? "" : `class="pb-2"`}>${pt}</div>`)
			.join("");

		return `
		${Renderer.utils.getExcludedTr({entity: ent, dataProp: "language", page: UrlUtil.PG_LANGUAGES})}
		${isSkipNameRow ? "" : Renderer.utils.getNameTr(ent, {page: UrlUtil.PG_LANGUAGES})}
		${ptText ? `<tr><td colspan="6" class="pt-0 ${isCompact ? "pb-2" : ""}">${ptText}</td></tr>` : ""}`;
	}

	static pGetFluff (it) {
		return Renderer.utils.pGetFluff({
			entity: it,
			fluffProp: "languageFluff",
		});
	}
};

Renderer.adventureBook = class {
	static getEntryIdLookup (bookData, doThrowError = true) {
		const out = {};
		const titlesRel = {};
		const titlesRelChapter = {};

		let chapIx;
		const depthStack = [];
		const handlers = {
			object: (obj) => {
				Renderer.ENTRIES_WITH_ENUMERATED_TITLES
					.forEach(meta => {
						if (obj.type !== meta.type) return;

						const curDepth = depthStack.length ? depthStack.last() : 0;
						const nxtDepth = meta.depth ? meta.depth : meta.depthIncrement ? curDepth + meta.depthIncrement : curDepth;

						depthStack.push(
							Math.min(
								nxtDepth,
								2,
							),
						);
					});

				if (!obj.id) return obj;

				if (out[obj.id]) {
					(out.__BAD = out.__BAD || []).push(obj.id);
					return obj;
				}

				out[obj.id] = {
					chapter: chapIx,
					entry: obj,
					depth: depthStack.last(),
				};

				if (obj.name) {
					out[obj.id].name = obj.name;

					const cleanName = obj.name.toLowerCase();
					out[obj.id].nameClean = cleanName;

					// Relative title index for full-book mode
					titlesRel[cleanName] = titlesRel[cleanName] || 0;
					out[obj.id].ixTitleRel = titlesRel[cleanName]++;

					// Relative title index per-chapter
					MiscUtil.getOrSet(titlesRelChapter, chapIx, cleanName, -1);
					out[obj.id].ixTitleRelChapter = ++titlesRelChapter[chapIx][cleanName];
				}

				return obj;
			},
			postObject: (obj) => {
				Renderer.ENTRIES_WITH_ENUMERATED_TITLES
					.forEach(meta => {
						if (obj.type !== meta.type) return;

						depthStack.pop();
					});
			},
		};

		bookData.forEach((chap, _chapIx) => {
			chapIx = _chapIx;
			MiscUtil.getWalker({
				isNoModification: true,
				keyBlocklist: new Set(["mapParent"]),
			})
				.walk(chap, handlers);
		});

		if (doThrowError) if (out.__BAD) throw new Error(`IDs were already in storage: ${out.__BAD.map(it => `"${it}"`).join(", ")}`);

		return out;
	}

	static _isAltMissingCoverUsed = false;
	static getCoverUrl (contents) {
		if (contents.cover) {
			return UrlUtil.link(Renderer.utils.getEntryMediaUrl(contents, "cover", "img"));
		}

		// TODO(Future) remove as deprecated; remove from schema; remove from proporder
		if (contents.coverUrl) {
			if (/^https?:\/\//.test(contents.coverUrl)) return contents.coverUrl;
			return UrlUtil.link(Renderer.get().getMediaUrl("img", contents.coverUrl.replace(/^img\//, "")));
		}

		return UrlUtil.link(Renderer.get().getMediaUrl("img", `covers/blank${Math.random() <= 0.05 && !Renderer.adventureBook._isAltMissingCoverUsed && (Renderer.adventureBook._isAltMissingCoverUsed = true) ? "-alt" : ""}.webp`));
	}
};

Renderer.charoption = class {
	static getCompactRenderedString (ent) {
		const styleHint = VetoolsConfig.get("styleSwitcher", "style");

		const prerequisite = Renderer.utils.prerequisite.getHtml(ent.prerequisite, {styleHint});
		const preText = Renderer.charoption.getOptionTypePreText(ent);
		return `
		${Renderer.utils.getExcludedTr({entity: ent, dataProp: "charoption", page: UrlUtil.PG_CHAR_CREATION_OPTIONS})}
		${Renderer.utils.getNameTr(ent, {page: UrlUtil.PG_CHAR_CREATION_OPTIONS})}
		<tr><td colspan="6" class="pb-2">
		${prerequisite ? `<p>${prerequisite}</p>` : ""}
		${preText || ""}${Renderer.get().setFirstSection(true).render({type: "entries", entries: ent.entries})}
		</td></tr>
		`;
	}

	/* -------------------------------------------- */

	static getCharoptionRenderableEntriesMeta (ent) {
		const optsMapped = ent.optionType
			.map(it => Renderer.charoption._OPTION_TYPE_ENTRIES[it])
			.filter(Boolean);
		if (!optsMapped.length) return null;

		return {
			entryOptionType: {type: "entries", entries: optsMapped},
		};
	}

	static _OPTION_TYPE_ENTRIES = {
		"RF:B": `{@note You may replace the standard feature of your background with this feature.}`,
		"CS": `{@note See the {@adventure Character Secrets|IDRotF|0|character secrets} section for more information.}`,
	};

	static getOptionTypePreText (ent) {
		const meta = Renderer.charoption.getCharoptionRenderableEntriesMeta(ent);
		if (!meta) return "";
		return Renderer.get().render(meta.entryOptionType);
	}

	/* -------------------------------------------- */

	static pGetFluff (it) {
		return Renderer.utils.pGetFluff({
			entity: it,
			fluffProp: "charoptionFluff",
		});
	}
};

Renderer.recipe = class {
	static _getEntryMetasTime (ent) {
		if (!Object.keys(ent.time || {}).length) return null;

		return [
			"total",
			"preparation",
			"cooking",
			...Object.keys(ent.time),
		]
			.unique()
			.filter(prop => ent.time[prop])
			.map((prop, i, arr) => {
				const val = ent.time[prop];

				const ptsTime = (
					val.min != null && val.max != null
						? [
							Parser.getMinutesToFull(val.min),
							Parser.getMinutesToFull(val.max),
						]
						: [Parser.getMinutesToFull(val)]
				);

				const suffix = MiscUtil.findCommonSuffix(ptsTime, {isRespectWordBoundaries: true});
				const ptTime = ptsTime
					.map(it => !suffix.length ? it : it.slice(0, -suffix.length))
					.join(" to ");

				return {
					entryName: `{@b {@style ${prop.toTitleCase()} Time:|small-caps}}`,
					entryContent: `${ptTime}${suffix}`,
				};
			});
	}

	static getRecipeRenderableEntriesMeta (ent) {
		return {
			entryMakes: ent.makes
				? `{@b {@style Makes|small-caps}} ${ent._scaleFactor ? `${ent._scaleFactor}× ` : ""}${ent.makes}`
				: null,
			entryServes: ent.serves
				? `{@b {@style Serves|small-caps}} ${ent.serves.min ?? ent.serves.exact}${ent.serves.min != null ? " to " : ""}${ent.serves.max ?? ""}${ent.serves.note ? ` ${ent.serves.note}` : ""}`
				: null,
			entryMetasTime: Renderer.recipe._getEntryMetasTime(ent),
			entryIngredients: {entries: ent._fullIngredients},
			entryEquipment: ent._fullEquipment?.length
				? {entries: ent._fullEquipment}
				: null,
			entryCooksNotes: ent.noteCook
				? {entries: ent.noteCook}
				: null,
			entryInstructions: {entries: ent.instructions},
		};
	}

	static getCompactRenderedString (ent) {
		return `${Renderer.utils.getExcludedTr({entity: ent, dataProp: "recipe", page: UrlUtil.PG_RECIPES})}
		${Renderer.utils.getNameTr(ent, {page: UrlUtil.PG_RECIPES})}
		<tr><td colspan="6">
		${Renderer.recipe.getBodyHtml(ent)}
		</td></tr>`;
	}

	static getBodyHtml (ent) {
		const entriesMeta = Renderer.recipe.getRecipeRenderableEntriesMeta(ent);

		const ptTime = Renderer.recipe.getTimeHtml(ent, {entriesMeta});
		const {ptMakes, ptServes} = Renderer.recipe.getMakesServesHtml(ent, {entriesMeta});

		return `<div class="ve-flex w-100 rd-recipes__wrp-recipe">
			<div class="ve-flex-1 ve-flex-col br-1p pr-2">
				${ptTime || ""}

				${ptMakes || ""}
				${ptServes || ""}

				<div class="rd-recipes__wrp-ingredients ${ptMakes || ptServes ? "mt-1" : ""}">${Renderer.get().render(entriesMeta.entryIngredients, 0)}</div>

				${entriesMeta.entryEquipment ? `<div class="rd-recipes__wrp-ingredients mt-4"><div class="ve-flex-vh-center bold mb-1 small-caps">Equipment</div><div>${Renderer.get().render(entriesMeta.entryEquipment)}</div></div>` : ""}

				${entriesMeta.entryCooksNotes ? `<div class="w-100 ve-flex-col mt-4"><div class="ve-flex-vh-center bold mb-1 small-caps">Cook's Notes</div><div class="italic">${Renderer.get().render(entriesMeta.entryCooksNotes)}</div></div>` : ""}
			</div>

			<div class="pl-2 ve-flex-2 rd-recipes__wrp-instructions ve-overflow-x-auto">
				${Renderer.get().setFirstSection(true).render(entriesMeta.entryInstructions, 2)}
			</div>
		</div>`;
	}

	static getMakesServesHtml (ent, {entriesMeta = null} = {}) {
		entriesMeta ||= Renderer.recipe.getRecipeRenderableEntriesMeta(ent);
		const ptMakes = entriesMeta.entryMakes ? `<div class="mb-2">${Renderer.get().render(entriesMeta.entryMakes)}</div>` : null;
		const ptServes = entriesMeta.entryServes ? `<div class="mb-2">${Renderer.get().render(entriesMeta.entryServes)}</div>` : null;
		return {ptMakes, ptServes};
	}

	static getTimeHtml (ent, {entriesMeta = null} = {}) {
		entriesMeta ||= Renderer.recipe.getRecipeRenderableEntriesMeta(ent);
		if (!entriesMeta.entryMetasTime) return "";

		return entriesMeta.entryMetasTime
			.map(({entryName, entryContent}, i, arr) => {
				return `<div class="split-v-center ${i === arr.length - 1 ? "mb-2" : "mb-1p"}">
					${Renderer.get().render(entryName)}
					<span>${Renderer.get().render(entryContent)}</span>
				</div>`;
			})
			.join("");
	}

	static pGetFluff (it) {
		return Renderer.utils.pGetFluff({
			entity: it,
			fluffProp: "recipeFluff",
		});
	}

	static populateFullIngredients (r) {
		r._fullIngredients = Renderer.applyAllProperties(MiscUtil.copyFast(r.ingredients));
		if (r.equipment) r._fullEquipment = Renderer.applyAllProperties(MiscUtil.copyFast(r.equipment));
	}

	static _RE_AMOUNT = /(?<tagAmount>{=amount\d+(?:\/[^}]+)?})/g;
	static _SCALED_PRECISION_LIMIT = 10 ** 6;
	static getScaledRecipe (r, scaleFactor) {
		const cpyR = MiscUtil.copyFast(r);

		["ingredients", "equipment"]
			.forEach(prop => {
				if (!cpyR[prop]) return;

				MiscUtil.getWalker({keyBlocklist: MiscUtil.GENERIC_WALKER_ENTRIES_KEY_BLOCKLIST}).walk(
					cpyR[prop],
					{
						object: (obj) => {
							if (obj.type !== "ingredient") return obj;

							const objOriginal = MiscUtil.copyFast(obj);

							Object.keys(obj)
								.filter(k => /^amount\d+/.test(k))
								.forEach(k => {
									let base = obj[k];

									if (Math.round(base) !== base && base < 20) {
										const divOneSixth = obj[k] / 0.166;
										if (Math.abs(divOneSixth - Math.round(divOneSixth)) < 0.05) base = (1 / 6) * Math.round(divOneSixth);
									}

									let scaled = base * scaleFactor;
									obj[k] = Math.round(base * scaleFactor * Renderer.recipe._SCALED_PRECISION_LIMIT) / Renderer.recipe._SCALED_PRECISION_LIMIT;
								});

							// region Attempt to singularize/pluralize units
							const amountsOriginal = Object.keys(objOriginal).filter(k => /^amount\d+$/.test(k)).map(k => objOriginal[k]);
							const amountsScaled = Object.keys(obj).filter(k => /^amount\d+$/.test(k)).map(k => obj[k]);

							const entryParts = obj.entry.split(Renderer.recipe._RE_AMOUNT).filter(Boolean);
							const entryPartsOut = entryParts.slice(0, entryParts.findIndex(it => Renderer.recipe._RE_AMOUNT.test(it)) + 1);
							let ixAmount = 0;
							for (let i = entryPartsOut.length; i < entryParts.length; ++i) {
								let pt = entryParts[i];

								if (Renderer.recipe._RE_AMOUNT.test(pt)) {
									ixAmount++;
									entryPartsOut.push(pt);
									continue;
								}

								if (amountsOriginal[ixAmount] == null || amountsScaled[ixAmount] == null) {
									entryPartsOut.push(pt);
									continue;
								}

								const isSingleToPlural = amountsOriginal[ixAmount] <= 1 && amountsScaled[ixAmount] > 1;
								const isPluralToSingle = amountsOriginal[ixAmount] > 1 && amountsScaled[ixAmount] <= 1;

								if (!isSingleToPlural && !isPluralToSingle) {
									entryPartsOut.push(pt);
									continue;
								}

								if (isSingleToPlural) pt = Renderer.recipe._getPluralizedUnits(pt);
								else if (isPluralToSingle) pt = Renderer.recipe._getSingularizedUnits(pt);
								entryPartsOut.push(pt);
							}

							obj.entry = entryPartsOut.join("");
							// endregion

							Renderer.recipe._mutWrapOriginalAmounts({obj, objOriginal});

							return obj;
						},
					},
				);
			});

		Renderer.recipe.populateFullIngredients(cpyR);

		if (cpyR.serves) {
			if (cpyR.serves.min) cpyR.serves.min *= scaleFactor;
			if (cpyR.serves.max) cpyR.serves.max *= scaleFactor;
			if (cpyR.serves.exact) cpyR.serves.exact *= scaleFactor;
		}

		cpyR._displayName = `${cpyR.name} (×${scaleFactor})`;
		cpyR._scaleFactor = scaleFactor;

		return cpyR;
	}

	static _UNITS_SINGLE_TO_PLURAL_S = [
		"bag",
		"bundle",
		"can",
		"cube",
		"cup",
		"fist",
		"handful",
		"ounce",
		"packet",
		"piece",
		"pod",
		"pound",
		"sheet",
		"slice",
		"sprig",
		"square",
		"stick",
		"strip",
		"tablespoon",
		"teaspoon",
		"wedge",
	];
	static _UNITS_SINGLE_TO_PLURAL_ES = [
		"dash",
		"glass",
		"inch",
	];
	static _FNS_SINGLE_TO_PLURAL = [];
	static _FNS_PLURAL_TO_SINGLE = [];

	static _getSingularizedUnits (str) {
		if (!Renderer.recipe._FNS_PLURAL_TO_SINGLE.length) {
			Renderer.recipe._FNS_PLURAL_TO_SINGLE = [
				...Renderer.recipe._UNITS_SINGLE_TO_PLURAL_S.map(word => str => str.replace(new RegExp(`\\b${word.escapeRegexp()}s\\b`, "gi"), (...m) => m[0].slice(0, -1))),
				...Renderer.recipe._UNITS_SINGLE_TO_PLURAL_ES.map(word => str => str.replace(new RegExp(`\\b${word.escapeRegexp()}es\\b`, "gi"), (...m) => m[0].slice(0, -2))),
			];
		}

		Renderer.recipe._FNS_PLURAL_TO_SINGLE.forEach(fn => str = fn(str));

		return str;
	}

	static _getPluralizedUnits (str) {
		if (!Renderer.recipe._FNS_SINGLE_TO_PLURAL.length) {
			Renderer.recipe._FNS_SINGLE_TO_PLURAL = [
				...Renderer.recipe._UNITS_SINGLE_TO_PLURAL_S.map(word => str => str.replace(new RegExp(`\\b${word.escapeRegexp()}\\b`, "gi"), (...m) => `${m[0]}s`)),
				...Renderer.recipe._UNITS_SINGLE_TO_PLURAL_ES.map(word => str => str.replace(new RegExp(`\\b${word.escapeRegexp()}\\b`, "gi"), (...m) => `${m[0]}es`)),
			];
		}

		Renderer.recipe._FNS_SINGLE_TO_PLURAL.forEach(fn => str = fn(str));

		return str;
	}

	/** Only apply the `@help` note to standalone amounts, i.e. those not in other tags. */
	static _mutWrapOriginalAmounts ({obj, objOriginal}) {
		const parts = [];
		let stack = "";
		let depth = 0;
		for (let i = 0; i < obj.entry.length; ++i) {
			const c = obj.entry[i];
			switch (c) {
				case "{": {
					if (!depth && stack) {
						parts.push(stack);
						stack = "";
					}
					depth++;
					stack += c;
					break;
				}
				case "}": {
					depth--;
					stack += c;
					if (!depth && stack) {
						parts.push(stack);
						stack = "";
					}
					break;
				}
				default: stack += c;
			}
		}
		if (stack) parts.push(stack);
		obj.entry = parts
			.map(pt => pt.replace(Renderer.recipe._RE_AMOUNT, (...m) => {
				const ixStart = m.slice(-3, -2)[0];
				if (ixStart !== 0 || m[0].length !== pt.length) return m[0];

				const originalValue = Renderer.applyProperties(m.last().tagAmount, objOriginal);
				return `{@help ${m.last().tagAmount}|In the original recipe: ${originalValue}}`;
			}))
			.join("");
	}

	// region Custom hash ID packing/unpacking
	static getCustomHashId (it) {
		if (!it._scaleFactor) return null;

		const {
			name,
			source,
			_scaleFactor: scaleFactor,
		} = it;

		return [
			name,
			source,
			scaleFactor ?? "",
		].join("__").toLowerCase();
	}

	static getUnpackedCustomHashId (customHashId) {
		if (!customHashId) return null;

		const [, , scaleFactor] = customHashId.split("__").map(it => it.trim());

		if (!scaleFactor) return null;

		return {
			_scaleFactor: scaleFactor ? Number(scaleFactor) : null,
			customHashId,
		};
	}
	// endregion

	static async pGetModifiedRecipe (ent, customHashId) {
		if (!customHashId) return ent;
		const {_scaleFactor} = Renderer.recipe.getUnpackedCustomHashId(customHashId);
		if (_scaleFactor == null) return ent;
		return Renderer.recipe.getScaledRecipe(ent, _scaleFactor);
	}
};

Renderer.card = class {
	static getFullEntries (ent, {backCredit = null} = {}) {
		const entries = [...ent.entries || []];
		if (ent.suit && (ent.valueName || ent.value)) {
			const suitAndValue = `${((ent.valueName || "") || Parser.numberToText(ent.value)).toTitleCase()} of ${ent.suit.toTitleCase()}`;
			if (suitAndValue.toLowerCase() !== ent.name.toLowerCase()) entries.unshift(`{@i ${suitAndValue}}`);
		}

		const ptCredits = [
			ent.face?.credit ? `art credit: ${ent.face?.credit}` : null,
			(backCredit || ent.back?.credit) ? `art credit (reverse): ${backCredit || ent.back?.credit}` : null,
		]
			.filter(Boolean)
			.join(", ")
			.uppercaseFirst();
		if (ptCredits) entries.push(`{@note {@style ${ptCredits}|small}}`);

		return entries;
	}

	static getCompactRenderedString (ent) {
		const fullEntries = Renderer.card.getFullEntries(ent);
		return `
			${Renderer.utils.getNameTr(ent)}
			<tr><td colspan="6" class="pb-2">
			${Renderer.get().setFirstSection(true).render({...ent.face, maxHeight: 40, maxHeightUnits: "vh"})}
			${fullEntries?.length ? `<hr class="hr-3">
			${Renderer.get().setFirstSection(true).render({type: "entries", entries: fullEntries}, 1)}` : ""}
			</td></tr>
		`;
	}
};

Renderer.deck = class {
	static getCompactRenderedString (ent) {
		const lstCards = {
			name: "Cards",
			entries: [
				{
					type: "list",
					columns: 3,
					items: ent.cards.map(card => `{@card ${card.name}|${card.set}|${card.source}}`),
				},
			],
		};

		return `
			${Renderer.utils.getNameTr(ent)}
			<tr><td colspan="6" class="pb-2">
			${Renderer.get().setFirstSection(true).render({type: "entries", entries: ent.entries}, 1)}
			<hr class="hr-3">
			${Renderer.get().setFirstSection(true).render(lstCards, 1)}
			</td></tr>
		`;
	}
};

Renderer.facility = class {
	static _getFacilityRenderableEntriesMeta_space ({ent}) {
		if (!ent.space) return null;
		return ent.space.map(spc => Renderer.facility._getSpaceEntry(spc, {isIncludeCostTime: ent.facilityType === "basic"})).joinConjunct(", ", " or ");
	}

	static _getFacilityRenderableEntriesMeta_hirelings ({ent}) {
		if (!ent.hirelings) return null;

		const out = ent.hirelings
			.map(hire => {
				const ptSpace = hire.space ? ` {@style (${hire.space.toTitleCase()})|muted}` : "";

				if (hire.exact != null) return `${hire.exact}${ptSpace}`;
				if (hire.min != null && hire.max != null) return `${hire.min}\u2013${hire.max}${ptSpace}`;
				if (hire.min != null) return `${hire.min}+ (see below${ptSpace ? ";" : ""}${ptSpace})`;

				return null;
			})
			.filter(Boolean)
			.joinConjunct(", ", " or ");

		if (out) return out;
		return null;
	}

	static _getFacilityRenderableEntriesMeta_orders ({ent}) {
		if (!ent.orders) return null;
		return ent.orders.map(it => it.toTitleCase()).joinConjunct(", ", " or ");
	}

	static getFacilityRenderableEntriesMeta (ent) {
		const entsList = [];

		if (ent.prerequisite) {
			// FIXME(Future) split prerequisite rendering into to-entries and to-html steps; use the "to entries" step here
			const entRendered = {
				type: "wrappedHtml",
				html: Renderer.utils.prerequisite.getHtml(ent.prerequisite, {styleHint: "one", isSkipPrefix: true}),
			};
			entsList.push({type: "item", name: `Prerequisite:`, entry: entRendered});
		} else if (ent.facilityType !== "basic") {
			entsList.push({type: "item", name: `Prerequisite:`, entry: "None"});
		}

		const entrySpace = this._getFacilityRenderableEntriesMeta_space({ent});
		if (entrySpace) entsList.push({type: "item", name: `Space:`, entry: entrySpace});

		const entryHirelings = this._getFacilityRenderableEntriesMeta_hirelings({ent});
		if (entryHirelings) entsList.push({type: "item", name: `Hirelings:`, entry: entryHirelings});

		const entryOrders = this._getFacilityRenderableEntriesMeta_orders({ent});
		if (entryOrders) entsList.push({type: "item", name: `Order${ent.orders.length !== 1 ? "s" : ""}:`, entry: entryOrders});

		return {
			entryLevel: ent.level ? `{@i Level ${ent.level} Bastion Facility}` : null,
			entriesDescription: [
				entsList.length
					? {
						type: "list",
						style: "list-hang-notitle",
						items: entsList,
					}
					: null,
				...(ent.entries || []),
			]
				.filter(Boolean),
			entrySpace,
			entryHirelings,
			entryOrders,
		};
	}

	static _SPACE_PROGRESSION = ["cramped", "roomy", "vast"];

	static _SPACE_TO_SQUARES = {
		"cramped": 4,
		"roomy": 16,
		"vast": 36,
	};

	static _SPACE_TO_COST_TIME_BASIC = {
		"cramped": {cost: 500, time: 20},
		"roomy": {cost: 1000, time: 45},
		"vast": {cost: 3000, time: 125},
	};

	static _getSpaceEntry (spc, {isIncludeCostTime = false} = {}) {
		const sq = Renderer.facility._SPACE_TO_SQUARES[spc];

		const ptAdditional = [
			sq ? `{@tip ${sq} sq|${sq} squares}` : null,
			Renderer.facility._getSpaceEntry_getPriceTimeEntry({spc, isIncludeCostTime}),
		]
			.filter(Boolean)
			.join("; ");
		const ptSuffix = ptAdditional ? ` {@style [${ptAdditional}]|muted;small}` : "";

		return [spc.toTitleCase(), ptSuffix].filter(Boolean).join(" ");
	}

	static _getSpaceEntry_getPriceTimeEntry ({spc, isIncludeCostTime}) {
		if (!isIncludeCostTime) return null;
		const costTimeInfo = Renderer.facility._SPACE_TO_COST_TIME_BASIC[spc];
		if (costTimeInfo == null) return null;

		const {cost, time} = costTimeInfo;

		const ptTxt = `${cost} GP, ${time} days`;
		const ptTipBasic = `${cost} GP and ${time} days to add`;

		const spcPrev = Renderer.facility._SPACE_PROGRESSION[Renderer.facility._SPACE_PROGRESSION.indexOf(spc) - 1];
		const costTimeInfoPrev = Renderer.facility._SPACE_TO_COST_TIME_BASIC[spcPrev];
		if (!spcPrev || !costTimeInfoPrev) return `{@tip ${ptTxt}|${ptTipBasic}}`;

		const {cost: costPrev, time: timePrev} = costTimeInfoPrev;

		return `{@tip ${ptTxt}|${ptTipBasic}, or, ${cost - costPrev} GP and ${time - timePrev} days to expand from a ${spcPrev.toTitleCase()} facility}`;
	}

	/* -------------------------------------------- */

	static getCompactRenderedString (ent) {
		const entriesMeta = Renderer.facility.getFacilityRenderableEntriesMeta(ent);

		const ptLevel = entriesMeta.entryLevel ? `<tr><td colspan="6" class="pb-2 pt-0">${Renderer.get().render(entriesMeta.entryLevel, 2)}</td></tr>` : "";
		const ptEntries = entriesMeta.entriesDescription.map(entry => `<div class="my-1p">${Renderer.get().render(entry, 2)}</div>`).join("");

		return `
			${Renderer.utils.getNameTr(ent)}
			${ptLevel}
			${ptEntries ? `<tr><td colspan="6" class="pb-2">${ptEntries}</td></tr>` : ""}
		`;
	}

	/* -------------------------------------------- */

	static pGetFluff (ent) {
		return Renderer.utils.pGetFluff({
			entity: ent,
			fluffProp: "facilityFluff",
		});
	}
};

Renderer.bastion = class {
	static getCompactRenderedString (ent) {
		switch (ent.__prop) {
			case "facility": return Renderer.facility.getCompactRenderedString(ent);
			default: throw new Error(`Unhandled prop "${ent.__prop}"`);
		}
	}

	/* -------------------------------------------- */

	static pGetFluff (ent) {
		switch (ent.__prop) {
			case "facility": return Renderer.facility.pGetFluff(ent);
			default: throw new Error(`Unhandled prop "${ent.__prop}"`);
		}
	}
};

Renderer.skill = class {
	static getCompactRenderedString (ent) {
		return `
			${Renderer.utils.getNameTr(ent)}
			<tr><td colspan="6" class="pb-2">
			${ent.ability ? `<p><i>Ability: ${Parser.attAbvToFull(ent.ability)}</i></p>` : ""}
			${Renderer.get().setFirstSection(true).render({type: "entries", entries: ent.entries})}
			</td></tr>
			${Renderer.utils.getPageTr(ent)}
		`;
	}
};

Renderer.sense = class {
	static getCompactRenderedString (ent) {
		return Renderer.generic.getCompactRenderedString(ent, {isSkipPageRow: true});
	}
};

Renderer.itemProperty = class {
	static getCompactRenderedString (ent) {
		const faux = {
			name: ent.name || (ent.entries || ent.entriesTemplate)[0]?.name || "Unknown",
			source: ent.source,
		};

		const cpy = MiscUtil.copyFast(ent);

		if (cpy.entries) {
			if (cpy.entries.length === 1 && cpy.entries[0].name === faux.name && cpy.entries[0].entries) faux.entries = cpy.entries[0].entries;
			else faux.entries = cpy.entries;
		} else if (cpy.entriesTemplate) {
			const entries = cpy.entriesTemplate.length === 1 && cpy.entriesTemplate[0].name === faux.name && cpy.entriesTemplate[0].entries
				? cpy.entriesTemplate[0].entries
				: cpy.entriesTemplate;

			let ixAlpha = Parser.ALPHABET.indexOf("N") - 1;
			const getNextLetter = () => {
				if (++ixAlpha >= Parser.ALPHABET.length) ixAlpha = 0;
				return Parser.ALPHABET[ixAlpha].toLowerCase();
			};

			faux.entries = JSON.parse(
				JSON.stringify(entries)
					.replace(/{{[^}]+}}/g, `{@i (${getNextLetter()})}`),
			);
		} else faux.entries = [];

		return Renderer.generic.getCompactRenderedString(faux, {isSkipPageRow: true});
	}
};

Renderer.itemMastery = class {
	static getCompactRenderedString (ent) {
		return Renderer.generic.getCompactRenderedString(ent, {isSkipPageRow: true});
	}
};

Renderer.generic = class {
	/**
	 * @param ent
	 * @param [opts]
	 * @param [opts.isSkipNameRow]
	 * @param [opts.isSkipPageRow]
	 * @param [opts.dataProp]
	 * @param [opts.page]
	 */
	static getCompactRenderedString (ent, opts) {
		opts = opts || {};

		const styleHint = VetoolsConfig.get("styleSwitcher", "style");

		const prerequisite = Renderer.utils.prerequisite.getHtml(ent.prerequisite, {styleHint});

		return `
		${opts.dataProp && opts.page ? Renderer.utils.getExcludedTr({entity: ent, dataProp: opts.dataProp, page: opts.page}) : ""}
		${opts.isSkipNameRow ? "" : Renderer.utils.getNameTr(ent, {page: opts.page})}
		<tr><td colspan="6" class="pb-2">
		${prerequisite ? `<p>${prerequisite}</p>` : ""}
		${Renderer.get().setFirstSection(true).render({entries: ent.entries})}
		</td></tr>
		${opts.isSkipPageRow ? "" : Renderer.utils.getPageTr(ent)}`;
	}

	/* -------------------------------------------- */

	// region Mirror the schema
	static FEATURE__SKILLS_ALL = Object.keys(Parser.SKILL_TO_ATB_ABV).sort(SortUtil.ascSortLower);

	static FEATURE__TOOLS_ARTISANS = [
		"alchemist's supplies",
		"brewer's supplies",
		"calligrapher's supplies",
		"carpenter's tools",
		"cartographer's tools",
		"cobbler's tools",
		"cook's utensils",
		"glassblower's tools",
		"jeweler's tools",
		"leatherworker's tools",
		"mason's tools",
		"painter's supplies",
		"potter's tools",
		"smith's tools",
		"tinker's tools",
		"weaver's tools",
		"woodcarver's tools",
	];
	static FEATURE__TOOLS_MUSICAL_INSTRUMENTS = [
		"bagpipes",
		"drum",
		"dulcimer",
		"flute",
		"horn",
		"lute",
		"lyre",
		"pan flute",
		"shawm",
		"viol",
	];
	static FEATURE__TOOLS_GAMING_SETS = [
		"dragonchess set",
		"dice set",
		"playing card set",
		"three-dragon ante set",
	];
	static _FEATURE__TOOL_GROUPS = new Set([
		"artisan's tools",
		"gaming set",
		"musical instrument",
	]);
	static FEATURE__TOOLS_ALL = [
		"artisan's tools",
		...this.FEATURE__TOOLS_ARTISANS,

		"disguise kit",
		"forgery kit",

		"gaming set",
		...this.FEATURE__TOOLS_GAMING_SETS,

		"herbalism kit",

		"musical instrument",
		...this.FEATURE__TOOLS_MUSICAL_INSTRUMENTS,

		"navigator's tools",
		"thieves' tools",
		"poisoner's kit",
		"vehicles (land)",
		"vehicles (water)",
		"vehicles (air)",
		"vehicles (space)",
	];

	static _FEATURE__LANGUAGES_ALL = Parser.LANGUAGES_ALL.map(it => it.toLowerCase());
	static _FEATURE__LANGUAGES_STANDARD__CHOICE_OBJ = {
		from: [
			...Parser.LANGUAGES_STANDARD
				.map(it => ({
					name: it.toLowerCase(),
					prop: "languageProficiencies",
					group: "languagesStandard",
				})),
			...Parser.LANGUAGES_EXOTIC
				.map(it => ({
					name: it.toLowerCase(),
					prop: "languageProficiencies",
					group: "languagesExotic",
				})),
			...Parser.LANGUAGES_SECRET
				.map(it => ({
					name: it.toLowerCase(),
					prop: "languageProficiencies",
					group: "languagesSecret",
				})),
		],
		groups: {
			languagesStandard: {
				name: "Standard Languages",
			},
			languagesExotic: {
				name: "Exotic Languages",
				hint: "With your DM's permission, you can choose an exotic language.",
			},
			languagesSecret: {
				name: "Secret Languages",
				hint: "With your DM's permission, you can choose a secret language.",
			},
		},
	};

	static FEATURE__SAVING_THROWS_ALL = [...Parser.ABIL_ABVS];
	// endregion

	/* -------------------------------------------- */

	// region Should mirror the schema
	static _SKILL_TOOL_LANGUAGE_KEYS__SKILL_ANY = new Set(["anySkill"]);
	static _SKILL_TOOL_LANGUAGE_KEYS__TOOL_ANY = new Set(["anyTool", "anyArtisansTool"]);
	static _SKILL_TOOL_LANGUAGE_KEYS__LANGAUGE_ANY = new Set(["anyLanguage", "anyStandardLanguage", "anyExoticLanguage", "anyRareLanguage"]);
	// endregion

	static getSkillSummary ({skillProfs, skillToolLanguageProfs, isShort = false}) {
		return this._summariseProfs({
			profGroupArr: skillProfs,
			skillToolLanguageProfs,
			setValid: new Set(this.FEATURE__SKILLS_ALL),
			setValidAny: this._SKILL_TOOL_LANGUAGE_KEYS__SKILL_ANY,
			anyAlt: "anySkill",
			isShort,
			hoverTag: "skill",
		});
	}

	static getToolSummary ({toolProfs, skillToolLanguageProfs, isShort = false}) {
		return this._summariseProfs({
			profGroupArr: toolProfs,
			skillToolLanguageProfs,
			setValid: new Set(this.FEATURE__TOOLS_ALL),
			setValidAny: this._SKILL_TOOL_LANGUAGE_KEYS__TOOL_ANY,
			anyAlt: "anyTool",
			isShort,
		});
	}

	static getLanguageSummary ({languageProfs, skillToolLanguageProfs, isShort = false}) {
		return this._summariseProfs({
			profGroupArr: languageProfs,
			skillToolLanguageProfs,
			setValid: new Set(this._FEATURE__LANGUAGES_ALL),
			setValidAny: this._SKILL_TOOL_LANGUAGE_KEYS__LANGAUGE_ANY,
			anyAlt: "anyLanguage",
			isShort,
		});
	}

	static _summariseProfs ({profGroupArr, skillToolLanguageProfs, setValid, setValidAny, anyAlt, isShort, hoverTag}) {
		if (!profGroupArr?.length && !skillToolLanguageProfs?.length) return {summary: "", collection: []};

		const collectionSet = new Set();

		const handleProfGroup = (profGroup, {isValidate = true} = {}) => {
			let sep = ", ";

			const toJoin = Object.entries(profGroup)
				.sort(([kA], [kB]) => this._summariseProfs_sortKeys(kA, kB))
				.filter(([k, v]) => v && (!isValidate || setValid.has(k) || setValidAny.has(k)))
				.map(([k, v], i) => {
					const vMapped = this.getMappedAnyProficiency({keyAny: k, countRaw: v}) ?? v;

					if (k === "choose") {
						sep = "; ";

						const chooseProfs = vMapped.from
							.filter(s => !isValidate || setValid.has(s))
							.map(s => {
								collectionSet.add(this._summariseProfs_getCollectionKey(s, anyAlt));
								return this._summariseProfs_getEntry({str: s, isShort, hoverTag});
							});
						return `${isShort ? `${i === 0 ? "C" : "c"}hoose ` : ""}${v.count || 1} ${isShort ? `of` : `from`} ${chooseProfs.joinConjunct(", ", " or ")}`;
					}

					collectionSet.add(this._summariseProfs_getCollectionKey(k, anyAlt));
					return this._summariseProfs_getEntry({str: k, isShort, hoverTag});
				});

			return toJoin.join(sep);
		};

		const summary = [
			...(profGroupArr || [])
				// Skip validation (i.e. allow homebrew/etc.) for the specific proficiency array
				.map(profGroup => handleProfGroup(profGroup, {isValidate: false})),
			...(skillToolLanguageProfs || [])
				.map(profGroup => handleProfGroup(profGroup)),
		]
			.filter(Boolean)
			.join(` <i>or</i> `);

		return {summary, collection: [...collectionSet].sort(SortUtil.ascSortLower)};
	}

	static _summariseProfs_getCollectionKey (k, anyAlt) {
		return k === anyAlt ? "any" : k;
	}

	static _summariseProfs_sortKeys (a, b, {setValidAny = null} = {}) {
		if (a === b) return 0;
		if (a === "choose") return 2;
		if (b === "choose") return -2;
		if (setValidAny) {
			if (setValidAny.has(a)) return 1;
			if (setValidAny.has(b)) return -1;
		}
		return SortUtil.ascSort(a, b);
	}

	static _summariseProfs_getEntry ({str, isShort, hoverTag}) {
		if (!isShort && hoverTag) return `{@${hoverTag} ${str.toTitleCase()}}`;
		const [name, , displayName] = str.split("|");
		return (displayName || name).toTitleCase();
	}

	/* -------------------------------------------- */

	/**
	 * @param keyAny
	 * @param countRaw
	 * @param {?object} mappedAnyObjects
	 */
	static getMappedAnyProficiency ({keyAny, countRaw, mappedAnyObjects = null}) {
		const mappedCount = !isNaN(countRaw) ? Number(countRaw) : 1;
		if (mappedCount <= 0) return null;

		switch (keyAny) {
			case "anySkill": return {
				name: mappedCount === 1 ? `Any Skill` : `Any ${mappedCount} Skills`,
				from: this.FEATURE__SKILLS_ALL
					.map(it => ({name: it, prop: "skillProficiencies"})),
				count: mappedCount,
			};
			case "anyTool": return {
				name: mappedCount === 1 ? `Any Tool` : `Any ${mappedCount} Tools`,
				from: this.FEATURE__TOOLS_ALL
					// "anyTool" should map to "any specific tool", not "any group of tools"
					.filter(it => !this._FEATURE__TOOL_GROUPS.has(it))
					.map(it => ({name: it, prop: "toolProficiencies"})),
				count: mappedCount,
			};
			case "anyArtisansTool": return {
				name: mappedCount === 1 ? `Any Artisan's Tool` : `Any ${mappedCount} Artisan's Tools`,
				from: this.FEATURE__TOOLS_ARTISANS
					.map(it => ({name: it, prop: "toolProficiencies"})),
				count: mappedCount,
			};
			case "anyMusicalInstrument": return {
				name: mappedCount === 1 ? `Any Musical Instrument` : `Any ${mappedCount} Musical Instruments`,
				from: this.FEATURE__TOOLS_MUSICAL_INSTRUMENTS
					.map(it => ({name: it, prop: "toolProficiencies"})),
				count: mappedCount,
			};
			case "anyGamingSet": return {
				name: mappedCount === 1 ? `Any Gaming Set` : `Any ${mappedCount} Gaming Sets`,
				from: this.FEATURE__TOOLS_GAMING_SETS
					.map(it => ({name: it, prop: "toolProficiencies"})),
				count: mappedCount,
			};
			case "anyLanguage": return {
				name: mappedCount === 1 ? `Any Language` : `Any ${mappedCount} Languages`,
				...(
					mappedAnyObjects?.[keyAny]
					|| {
						from: this._FEATURE__LANGUAGES_ALL
							.map(it => ({name: it, prop: "languageProficiencies"})),
					}
				),
				count: mappedCount,
			};
			case "anyStandardLanguage": return {
				name: mappedCount === 1 ? `Any Standard Language` : `Any ${mappedCount} Standard Languages`,
				...(
					mappedAnyObjects?.[keyAny]
					|| {
						...MiscUtil.copyFast(this._FEATURE__LANGUAGES_STANDARD__CHOICE_OBJ), // Use a generic choice object, as rules state DM can allow choosing any
					}
				),
				count: mappedCount,
			};
			case "anyExoticLanguage": return {
				name: mappedCount === 1 ? `Any Exotic Language` : `Any ${mappedCount} Exotic Languages`,
				...(
					mappedAnyObjects?.[keyAny]
					|| {
						...MiscUtil.copyFast(this._FEATURE__LANGUAGES_STANDARD__CHOICE_OBJ), // Use a generic choice object, as rules state DM can allow choosing any
					}
				),
				count: mappedCount,
			};
			case "anyRareLanguage": return {
				name: mappedCount === 1 ? `Any Rare Language` : `Any ${mappedCount} Rare Languages`,
				...(
					mappedAnyObjects?.[keyAny]
					|| {
						...MiscUtil.copyFast(this._FEATURE__LANGUAGES_STANDARD__CHOICE_OBJ), // Emulate the 2014 choice rulings
					}
				),
				count: mappedCount,
			};
			case "anySavingThrow": return {
				name: mappedCount === 1 ? `Any Saving Throw` : `Any ${mappedCount} Saving Throws`,
				from: this.FEATURE__SAVING_THROWS_ALL
					.map(it => ({name: it, prop: "savingThrowProficiencies"})),
				count: mappedCount,
			};

			case "anyWeapon": throw new Error(`Property handling for "anyWeapon" is unimplemented!`);
			case "anyArmor": throw new Error(`Property handling for "anyArmor" is unimplemented!`);

			default: return null;
		}
	}

	/* -------------------------------------------- */

	static getRenderableDurationEntriesMeta (durations, {styleHint} = {}) {
		styleHint ||= VetoolsConfig.get("styleSwitcher", "style");

		const ptSrcStatus = styleHint === "classic" ? "" : `|${Parser.SRC_XPHB}`;

		let hasSubOr = false;

		const outParts = durations
			.map(duration => {
				const ptCondition = duration.condition ? ` (${duration.condition})` : "";

				switch (duration.type) {
					case "special":
						if (duration.concentration) return `{@status Concentration${ptSrcStatus}}`;
						return `Special${ptCondition}`;
					case "instant":
						return `Instantaneous${ptCondition}`;
					case "timed":
						return `${duration.concentration ? `{@status Concentration${ptSrcStatus}}, ` : ""}${duration.concentration ? "u" : duration.duration.upTo ? "U" : ""}${duration.concentration || duration.duration.upTo ? "p to " : ""}${duration.duration.amount} ${duration.duration.amount === 1 ? duration.duration.type : `${duration.duration.type}s`}${ptCondition}`;
					case "permanent": {
						if (!duration.ends) return `Permanent${ptCondition}`;

						const endsToJoin = duration.ends.map(m => Parser.spEndTypeToFull(m));
						hasSubOr = hasSubOr || endsToJoin.length > 1;
						return `Until ${endsToJoin.joinConjunct(", ", " or ")}${ptCondition}`;
					}
				}
			});

		return {
			entryDuration: `${outParts.joinConjunct(hasSubOr ? "; " : ", ", " or ")}${durations.length > 1 ? " (see below)" : ""}`,
		};
	}

	/* -------------------------------------------- */

	static hasToken (ent, {isIgnoreImplicit = false} = {}) {
		const fromEntity = ent.tokenUrl // TODO(Future) legacy; remove
			|| ent.token // An explicit token
			|| ent.tokenHref // An explicit token URL (local or external)
		;
		if (fromEntity || isIgnoreImplicit) return !!fromEntity;
		return ent.hasToken; // An implicit token
	}

	static getTokenUrl (ent, mediaDir, {isIgnoreImplicit = false, isUrlEncode = false} = {}) {
		if (ent.tokenUrl) return ent.tokenUrl; // TODO(Future) legacy; remove
		if (ent.token) return Renderer.get().getMediaUrl("img", `${mediaDir}/${ent.token.source}/${Parser.nameToTokenName(ent.token.name, {isUrlEncode})}.webp`);
		if (ent.tokenHref) return Renderer.utils.getEntryMediaUrl(ent, "tokenHref", "img", {isUrlEncode});
		if (isIgnoreImplicit) return null;
		return Renderer.get().getMediaUrl("img", `${mediaDir}/${ent.source}/${Parser.nameToTokenName(ent.name, {isUrlEncode})}.webp`);
	}
};

Renderer.redirect = class {
	static _VERSION_REDIRECT_LOOKUP = null;

	static async pGetRedirectByHash (page, hash) {
		const redirectLookup = await (
			this._VERSION_REDIRECT_LOOKUP ||= DataUtil.loadJSON(`${Renderer.get().baseUrl}data/generated/gendata-tag-redirects.json`)
		);

		const fromLookup = MiscUtil.get(redirectLookup, page, hash);
		if (!fromLookup) return null;

		const hashNxt = fromLookup.hash || fromLookup;
		const pageNxt = fromLookup.page || page;
		const decodedNxt = await UrlUtil.pAutoDecodeHash(hashNxt, {page: pageNxt});

		const pagePropsNxt = UrlUtil.PAGE_TO_PROPS[pageNxt] || [pageNxt];
		if (pagePropsNxt.some(prop => ExcludeUtil.isExcluded(hashNxt, prop, decodedNxt.source, {isNoCount: true}))) return null;

		return {page: pageNxt, hash: hashNxt, source: decodedNxt.source, name: decodedNxt.name};
	}

	static async pGetRedirectByUid (prop, uid) {
		const page = UrlUtil.PROP_TO_PAGE[prop];
		if (!page) throw new Error(`Unhandled prop "${prop}"`);

		const tag = Parser.getPropTag(prop);
		const unpacked = DataUtil.proxy.unpackUid(prop, uid, tag, {isLower: true});
		const hash = UrlUtil.URL_TO_HASH_BUILDER[prop](unpacked);

		return this.pGetRedirectByHash(page, hash);
	}
};

Renderer.hover = class {
	static LinkMeta = class {
		constructor () {
			this.isHovered = false;
			this.isLoading = false;
			this.isPermanent = false;
			this.windowMeta = null;
		}
	};

	static _BAR_HEIGHT = 16;

	static _linkCache = {};
	static _eleCache = new Map();
	static _entryCache = {};
	static _isInit = false;
	static _dmScreen = null;
	static _lastId = 0;
	static _contextMenu = null;
	static _contextMenuLastClicked = null;

	static bindDmScreen (screen) { this._dmScreen = screen; }

	static _getNextId () { return ++Renderer.hover._lastId; }

	static _doInit () {
		if (Renderer.hover._isInit) return;
		Renderer.hover._isInit = true;

		document.body.addEventListener("click", () => {
			Renderer.hover.cleanTempWindows();
		});

		Renderer.hover._contextMenu = ContextUtil.getMenu([
			new ContextUtil.Action(
				"Maximize All",
				() => {
					const $permWindows = $(`.hoverborder[data-perm="true"]`);
					$permWindows.attr("data-display-title", "false");
				},
			),
			new ContextUtil.Action(
				"Minimize All",
				() => {
					const $permWindows = $(`.hoverborder[data-perm="true"]`);
					$permWindows.attr("data-display-title", "true");
				},
			),
			null,
			new ContextUtil.Action(
				"Close Others",
				() => {
					const hoverId = Renderer.hover._contextMenuLastClicked?.hoverId;
					Renderer.hover._doCloseAllWindows({hoverIdBlocklist: new Set([hoverId])});
				},
			),
			new ContextUtil.Action(
				"Close All",
				() => Renderer.hover._doCloseAllWindows(),
			),
		]);
	}

	static cleanTempWindows () {
		for (const [key, meta] of Renderer.hover._eleCache.entries()) {
			// If this is an element-less "permanent" show (i.e. a "predefined" window) which has been closed
			if (!meta.isPermanent && meta.windowMeta && typeof key === "number") {
				meta.windowMeta.doClose();
				Renderer.hover._eleCache.delete(key);
				continue;
			}

			if (!meta.isPermanent && meta.windowMeta && !document.body.contains(key)) {
				meta.windowMeta.doClose();
				continue;
			}

			if (!meta.isPermanent && meta.isHovered && meta.windowMeta) {
				// Check if any elements have failed to clear their hovering status on mouse move
				const bounds = key.getBoundingClientRect();
				if (EventUtil._mouseX < bounds.x
					|| EventUtil._mouseY < bounds.y
					|| EventUtil._mouseX > bounds.x + bounds.width
					|| EventUtil._mouseY > bounds.y + bounds.height) {
					meta.windowMeta.doClose();
				}
			}
		}
	}

	static _doCloseAllWindows ({hoverIdBlocklist = null} = {}) {
		Object.entries(Renderer.hover._WINDOW_METAS)
			.filter(([hoverId, meta]) => hoverIdBlocklist == null || !hoverIdBlocklist.has(Number(hoverId)))
			.forEach(([, meta]) => meta.doClose());
	}

	static _getSetMeta (key) {
		if (!Renderer.hover._eleCache.has(key)) Renderer.hover._eleCache.set(key, new Renderer.hover.LinkMeta());
		return Renderer.hover._eleCache.get(key);
	}

	static _handleGenericMouseOverStart ({evt, ele, opts}) {
		// Don't open on small screens unless forced
		if (Renderer.hover.isSmallScreen(evt) && !evt.shiftKey && !opts?.isForceOpenPermanent) return;

		Renderer.hover.cleanTempWindows();

		const meta = Renderer.hover._getSetMeta(ele);
		if (meta.isHovered || meta.isLoading) return; // Another hover is already in progress

		// Set the cursor to a waiting spinner
		ele.style.cursor = "progress";

		meta.isHovered = true;
		meta.isLoading = true;
		meta.isPermanent = evt.shiftKey || opts?.isForceOpenPermanent || false;

		return meta;
	}

	static _doPredefinedShowStart ({entryId}) {
		Renderer.hover.cleanTempWindows();

		const meta = Renderer.hover._getSetMeta(entryId);

		meta.isPermanent = true;

		return meta;
	}

	static getHoverElementAttributes (
		{
			page,
			source,
			hash,
			preloadId = null,
			isFauxPage = false,
			isAllowRedirect = false,
		},
	) {
		return [
			`onmouseover="Renderer.hover.pHandleLinkMouseOver(event, this)"`,
			`onmouseleave="Renderer.hover.handleLinkMouseLeave(event, this)"`,
			`onmousemove="Renderer.hover.handleLinkMouseMove(event, this)"`,
			`onclick="Renderer.hover.handleLinkClick(event, this${isFauxPage ? `, {isForceOpenPermanent: true}` : ``})"`,
			`onwheel="Renderer.hover.handleLinkWheel(event, this)"`,
			`ondragstart="Renderer.hover.handleLinkDragStart(event, this)"`,
			`data-vet-page="${page.qq()}"`,
			`data-vet-source="${source.qq()}"`,
			`data-vet-hash="${hash.qq()}"`,
			preloadId != null ? `data-vet-preload-id="${`${preloadId}`.qq()}"` : "",
			isFauxPage ? `data-vet-is-faux-page="true"` : "",
			isAllowRedirect ? `data-vet-is-allow-redirect="true"` : "",
			Renderer.hover.getPreventTouchString(),
		]
			.filter(Boolean)
			.join(" ");
	}

	static getLinkElementData (ele) {
		return {
			page: ele.getAttribute("data-vet-page"),
			source: ele.getAttribute("data-vet-source"),
			hash: ele.getAttribute("data-vet-hash"),
			preloadId: ele.getAttribute("data-vet-preload-id"),
			isFauxPage: ele.getAttribute("data-vet-is-faux-page") === "true",
			isAllowRedirect: ele.getAttribute("data-vet-is-allow-redirect") === "true",
		};
	}

	// (Baked into render strings)
	static async pHandleLinkMouseOver (evt, ele, opts) {
		Renderer.hover._doInit();

		const linkData = Renderer.hover._pHandleLinkMouseOver_getLinkData({ele, opts});
		let {page, source, hash} = linkData;
		const {preloadId, customHashId, isFauxPage, isAllowRedirect} = linkData;

		const redirectMeta = await this._pHandleLinkMouseOver_pGetVersionRedirectMeta({page, source, hash, preloadId, customHashId, isAllowRedirect});
		if (redirectMeta != null) ({page, source, hash} = redirectMeta);

		let meta = Renderer.hover._handleGenericMouseOverStart({evt, ele, opts});
		if (meta == null) return;

		if (EventUtil.isCtrlMetaKey(evt)) meta.isFluff = true;

		let toRender;
		if (preloadId != null) { // FIXME(Future) remove in favor of `customHashId`
			switch (page) {
				case UrlUtil.PG_BESTIARY: {
					const {_scaledCr: scaledCr, _scaledSpellSummonLevel: scaledSpellSummonLevel, _scaledClassSummonLevel: scaledClassSummonLevel} = Renderer.monster.getUnpackedCustomHashId(preloadId);

					const baseMon = await DataLoader.pCacheAndGet(page, source, hash);
					if (scaledCr != null) {
						toRender = await ScaleCreature.scale(baseMon, scaledCr);
					} else if (scaledSpellSummonLevel != null) {
						toRender = await ScaleSpellSummonedCreature.scale(baseMon, scaledSpellSummonLevel);
					} else if (scaledClassSummonLevel != null) {
						toRender = await ScaleClassSummonedCreature.scale(baseMon, scaledClassSummonLevel);
					}
					break;
				}
			}
			this._pHandleLinkMouseOver_doVerifyToRender({toRender, page, source, hash, preloadId, customHashId, isFluff: meta.isFluff});
		} else if (customHashId) {
			toRender = await DataLoader.pCacheAndGet(page, source, hash);
			toRender = await Renderer.hover.pApplyCustomHashId(page, toRender, customHashId);
			this._pHandleLinkMouseOver_doVerifyToRender({toRender, page, source, hash, preloadId, customHashId, isFluff: meta.isFluff});
		} else if (meta.isFluff) {
			const entity = await DataLoader.pCacheAndGet(page, source, hash);
			if (entity) toRender = await Renderer.utils.pGetProxyFluff({entity});
		} else {
			toRender = await DataLoader.pCacheAndGet(page, source, hash);
			this._pHandleLinkMouseOver_doVerifyToRender({toRender, page, source, hash, preloadId, customHashId, isFluff: meta.isFluff});
		}

		meta.isLoading = false;

		if (opts?.isDelay) {
			meta.isDelayed = true;
			ele.style.cursor = "help";
			await MiscUtil.pDelay(1100);
			meta.isDelayed = false;
		}

		// Reset cursor
		ele.style.cursor = "";

		// Check if we're still hovering the entity
		if (!meta || (!meta.isHovered && !meta.isPermanent)) return;

		const tmpEvt = meta._tmpEvt;
		delete meta._tmpEvt;

		// TODO(Future) avoid rendering e.g. creature scaling controls if `win?._IS_POPOUT`
		const win = (evt.view || {}).window;

		const $content = meta.isFluff
			? Renderer.hover.$getHoverContent_fluff(page, toRender)
			: Renderer.hover.$getHoverContent_stats(page, toRender);

		// FIXME(Future) replace this with something maintainable
		const compactReferenceData = {
			page,
			source,
			hash,
		};

		if (meta.windowMeta && !meta.isPermanent) {
			meta.windowMeta.doClose();
			meta.windowMeta = null;
		}

		meta.windowMeta = Renderer.hover.getShowWindow(
			$content,
			Renderer.hover.getWindowPositionFromEvent(tmpEvt || evt, {isPreventFlicker: !meta.isPermanent}),
			{
				title: toRender?.name || "",
				isPermanent: meta.isPermanent,
				pageUrl: isFauxPage ? null : `${Renderer.get().baseUrl}${page}#${hash}`,
				cbClose: () => meta.isHovered = meta.isPermanent = meta.isLoading = meta.isFluff = false,
				isBookContent: page === UrlUtil.PG_RECIPES,
				compactReferenceData,
				sourceData: toRender,
			},
		);

		if (!meta.isFluff && !win?._IS_POPOUT) {
			const fnBind = Renderer.hover.getFnBindListenersCompact(page);
			if (fnBind && toRender) fnBind(toRender, $content);
		}
	}

	static _pHandleLinkMouseOver_getLinkData ({ele, opts}) {
		if (opts?.isSpecifiedLinkData) {
			return {
				page: opts.page,
				source: opts.source,
				hash: opts.hash,
				preloadId: opts.preloadId,
				customHashId: opts.customHashId,
				isFauxPage: !!opts.isFauxPage,
				isAllowRedirect: !!opts.isAllowRedirect,
			};
		}

		return Renderer.hover.getLinkElementData(ele);
	}

	static async _pHandleLinkMouseOver_pGetVersionRedirectMeta ({page, source, hash, preloadId, customHashId, isAllowRedirect}) {
		if (!isAllowRedirect || preloadId || customHashId) return null;
		if (VetoolsConfig.get("styleSwitcher", "style") === "classic") return null;

		return Renderer.redirect.pGetRedirectByHash(page, hash);
	}

	static _pHandleLinkMouseOver_doVerifyToRender ({toRender, page, source, hash, preloadId, customHashId, isFluff}) {
		if (toRender) return;
		throw new Error(`Failed to load renderable content for: page="${page}" source="${source}" hash="${hash}" preloadId="${preloadId}" customHashId="${customHashId}" isFluff="${isFluff}"`);
	}

	// (Baked into render strings)
	static handleInlineMouseOver (evt, ele, entry, opts) {
		Renderer.hover._doInit();

		entry = entry || JSON.parse(ele.getAttribute("data-vet-entry"));

		let meta = Renderer.hover._handleGenericMouseOverStart({evt, ele});
		if (meta == null) return;

		meta.isLoading = false;

		// Reset cursor
		ele.style.cursor = "";

		// Check if we're still hovering the entity
		if (!meta || (!meta.isHovered && !meta.isPermanent)) return;

		const tmpEvt = meta._tmpEvt;
		delete meta._tmpEvt;

		const win = (evt.view || {}).window;

		const $content = Renderer.hover.$getHoverContent_generic(entry, opts);

		if (meta.windowMeta && !meta.isPermanent) {
			meta.windowMeta.doClose();
			meta.windowMeta = null;
		}

		meta.windowMeta = Renderer.hover.getShowWindow(
			$content,
			Renderer.hover.getWindowPositionFromEvent(tmpEvt || evt, {isPreventFlicker: !meta.isPermanent}),
			{
				title: entry?.name || "",
				isPermanent: meta.isPermanent,
				pageUrl: null,
				cbClose: () => meta.isHovered = meta.isPermanent = meta.isLoading = false,
				isBookContent: true,
				sourceData: entry,
			},
		);
	}

	// (Baked into render strings)
	static handleLinkMouseLeave (evt, ele) {
		const meta = Renderer.hover._eleCache.get(ele);
		ele.style.cursor = "";

		if (!meta || meta.isPermanent) return;

		if (evt.shiftKey) {
			meta.isPermanent = true;
			meta.windowMeta.setIsPermanent(true);
			return;
		}

		meta.isHovered = false;
		if (meta.windowMeta) {
			meta.windowMeta.doClose();
			meta.windowMeta = null;
		}
	}

	// (Baked into render strings)
	static handleLinkMouseMove (evt, ele) {
		const meta = Renderer.hover._eleCache.get(ele);
		if (!meta || meta.isPermanent) return;

		// If loading has finished, but we're not displaying the element yet (e.g. because it has been delayed)
		if (meta.isDelayed) {
			meta._tmpEvt = evt;
			return;
		}

		if (!meta.windowMeta) return;

		meta.windowMeta.setPosition(Renderer.hover.getWindowPositionFromEvent(evt, {isPreventFlicker: !evt.shiftKey && !meta.isPermanent}));

		if (evt.shiftKey && !meta.isPermanent) {
			meta.isPermanent = true;
			meta.windowMeta.setIsPermanent(true);
		}
	}

	/**
	 * (Baked into render strings)
	 * @param evt
	 * @param ele
	 * @param entryId
	 * @param [opts]
	 * @param [opts.isBookContent]
	 * @param [opts.isLargeBookContent]
	 */
	static handlePredefinedMouseOver (evt, ele, entryId, opts) {
		opts = opts || {};

		const meta = Renderer.hover._handleGenericMouseOverStart({evt, ele});
		if (meta == null) return;

		Renderer.hover.cleanTempWindows();

		const toRender = Renderer.hover._entryCache[entryId];

		meta.isLoading = false;
		// Check if we're still hovering the entity
		if (!meta.isHovered && !meta.isPermanent) return;

		const $content = Renderer.hover.$getHoverContent_generic(toRender, opts);
		meta.windowMeta = Renderer.hover.getShowWindow(
			$content,
			Renderer.hover.getWindowPositionFromEvent(evt, {isPreventFlicker: !meta.isPermanent}),
			{
				title: toRender.data && toRender.data.hoverTitle != null ? toRender.data.hoverTitle : toRender.name,
				isPermanent: meta.isPermanent,
				cbClose: () => meta.isHovered = meta.isPermanent = meta.isLoading = false,
				sourceData: toRender,
			},
		);

		// Reset cursor
		ele.style.cursor = "";
	}

	static handleLinkClick (evt, ele, {isForceOpenPermanent = false} = {}) {
		// Open faux pages as permanent hover windows
		if (isForceOpenPermanent) {
			Renderer.hover.pHandleLinkMouseOver(evt, ele, {isForceOpenPermanent});
		}

		// Close the window (if not permanent)
		// Note that this prevents orphan windows when e.g. clicking a specific variant on an Items page magicvariant
		Renderer.hover.handleLinkMouseLeave(evt, ele);
	}

	static handleLinkWheel (evt, ele) {
		if (!evt.altKey) return;

		const meta = Renderer.hover._eleCache.get(ele);
		if (!meta || meta.isPermanent) return;

		if (!meta.windowMeta) return;

		evt.stopPropagation();
		evt.preventDefault();

		const {deltaPixelsX, deltaPixelsY} = EventUtil.getDeltaPixels(evt);

		meta.windowMeta.mutScroll({deltaPixelsX, deltaPixelsY});
	}

	// (Baked into render strings)
	static handleLinkDragStart (evt, ele) {
		// Close the window
		Renderer.hover.handleLinkMouseLeave(evt, ele);

		const {page, source, hash} = Renderer.hover.getLinkElementData(ele);
		const meta = {
			type: VeCt.DRAG_TYPE_IMPORT,
			page,
			source,
			hash,
		};
		evt.dataTransfer.setData("application/json", JSON.stringify(meta));
	}

	static doPredefinedShow (entryId, opts) {
		opts = opts || {};

		const meta = Renderer.hover._doPredefinedShowStart({entryId});
		if (meta == null) return;

		Renderer.hover.cleanTempWindows();

		const toRender = Renderer.hover._entryCache[entryId];

		const $content = Renderer.hover.$getHoverContent_generic(toRender, opts);
		meta.windowMeta = Renderer.hover.getShowWindow(
			$content,
			Renderer.hover.getWindowPositionExact((window.innerWidth / 2) - (Renderer.hover._DEFAULT_WIDTH_PX / 2), 100),
			{
				title: toRender.data && toRender.data.hoverTitle != null ? toRender.data.hoverTitle : toRender.name,
				isPermanent: meta.isPermanent,
				cbClose: () => meta.isHovered = meta.isPermanent = meta.isLoading = false,
				sourceData: toRender,
			},
		);
	}

	// (Baked into render strings)
	static handlePredefinedMouseLeave (evt, ele) { return Renderer.hover.handleLinkMouseLeave(evt, ele); }

	// (Baked into render strings)
	static handlePredefinedMouseMove (evt, ele) { return Renderer.hover.handleLinkMouseMove(evt, ele); }

	static _WINDOW_POSITION_PROPS_FROM_EVENT = [
		"isFromBottom",
		"isFromRight",
		"clientX",
		"window",
		"isPreventFlicker",
		"bcr",
	];

	static getWindowPositionFromEvent (evt, {isPreventFlicker = false} = {}) {
		const ele = evt.target;
		const win = evt?.view?.window || window;

		const bcr = ele.getBoundingClientRect().toJSON();

		const isFromBottom = bcr.top > win.innerHeight / 2;
		const isFromRight = bcr.left > win.innerWidth / 2;

		return {
			mode: "autoFromElement",
			isFromBottom,
			isFromRight,
			clientX: EventUtil.getClientX(evt),
			window: win,
			isPreventFlicker,
			bcr,
		};
	}

	static getWindowPositionExact (x, y, evt = null) {
		return {
			window: evt?.view?.window || window,
			mode: "exact",
			x,
			y,
		};
	}

	static getWindowPositionExactVisibleBottom (x, y, evt = null) {
		return {
			...Renderer.hover.getWindowPositionExact(x, y, evt),
			mode: "exactVisibleBottom",
		};
	}

	static _WINDOW_METAS = {};
	static MIN_Z_INDEX = 200;
	static _MAX_Z_INDEX = 300;
	static _DEFAULT_WIDTH_PX = 600;
	static _BODY_SCROLLER_WIDTH_PX = 15;

	static _getZIndex () {
		const zIndices = Object.values(Renderer.hover._WINDOW_METAS).map(it => it.zIndex);
		if (!zIndices.length) return Renderer.hover.MIN_Z_INDEX;
		return Math.max(...zIndices);
	}

	static _getNextZIndex (hoverId) {
		const cur = Renderer.hover._getZIndex();
		// If we're already the highest index, continue to use this index
		if (hoverId != null && Renderer.hover._WINDOW_METAS[hoverId].zIndex === cur) return cur;
		// otherwise, go one higher
		const out = cur + 1;

		// If we've broken through the max z-index, try to free up some z-indices
		if (out > Renderer.hover._MAX_Z_INDEX) {
			const sortedWindowMetas = Object.entries(Renderer.hover._WINDOW_METAS)
				.sort(([kA, vA], [kB, vB]) => SortUtil.ascSort(vA.zIndex, vB.zIndex));

			if (sortedWindowMetas.length >= (Renderer.hover._MAX_Z_INDEX - Renderer.hover.MIN_Z_INDEX)) {
				// If we have too many window open, collapse them into one z-index
				sortedWindowMetas.forEach(([k, v]) => {
					v.setZIndex(Renderer.hover.MIN_Z_INDEX);
				});
			} else {
				// Otherwise, ensure one consistent run from min to max z-index
				sortedWindowMetas.forEach(([k, v], i) => {
					v.setZIndex(Renderer.hover.MIN_Z_INDEX + i);
				});
			}

			return Renderer.hover._getNextZIndex(hoverId);
		} else return out;
	}

	static _isIntersectRect (r1, r2) {
		return r1.left <= r2.right
			&& r2.left <= r1.right
			&& r1.top <= r2.bottom
			&& r2.top <= r1.bottom;
	}

	/* -------------------------------------------- */

	static async pDoShowBrowserWindow ($content, opts) {
		const dimensions = opts.fnGetPopoutSize ? opts.fnGetPopoutSize() : {width: 600, height: $content.height()};
		const win = window.open(
			"",
			opts.title || "",
			`width=${dimensions.width},height=${dimensions.height}location=0,menubar=0,status=0,titlebar=0,toolbar=0`,
		);

		// If this is a new window, bootstrap general page elements/variables.
		// Otherwise, we can skip straight to using the window.
		if (!win._IS_POPOUT) {
			win._IS_POPOUT = true;
			win.document.write(`
				<!DOCTYPE html>
				<html lang="en" class="ve-popwindow ${typeof styleSwitcher !== "undefined" ? styleSwitcher.getClassNamesStyleTheme() : ""}"><head>
					<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
					<title>${opts.title}</title>
					${[...document.querySelectorAll(`link[rel="stylesheet"][href]`)].map(ele => ele.outerHTML).join("\n")}
					<!-- Favicons -->
					<link rel="icon" type="image/svg+xml" href="favicon.svg">
					<link rel="icon" type="image/png" sizes="256x256" href="favicon-256x256.png">
					<link rel="icon" type="image/png" sizes="144x144" href="favicon-144x144.png">
					<link rel="icon" type="image/png" sizes="128x128" href="favicon-128x128.png">
					<link rel="icon" type="image/png" sizes="64x64" href="favicon-64x64.png">
					<link rel="icon" type="image/png" sizes="48x48" href="favicon-48x48.png">
					<link rel="icon" type="image/png" sizes="32x32" href="favicon-32x32.png">
					<link rel="icon" type="image/png" sizes="16x16" href="favicon-16x16.png">

					<!-- Chrome Web App Icons -->
					<link rel="manifest" href="manifest.webmanifest">
					<meta name="application-name" content="5etools">
					<meta name="theme-color" content="#006bc4">

					<!-- Windows Start Menu tiles -->
					<meta name="msapplication-config" content="browserconfig.xml"/>
					<meta name="msapplication-TileColor" content="#006bc4">

					<!-- Apple Touch Icons -->
					<link rel="apple-touch-icon" sizes="180x180" href="apple-touch-icon-180x180.png">
					<link rel="apple-touch-icon" sizes="360x360" href="apple-touch-icon-360x360.png">
					<link rel="apple-touch-icon" sizes="167x167" href="apple-touch-icon-167x167.png">
					<link rel="apple-touch-icon" sizes="152x152" href="apple-touch-icon-152x152.png">
					<link rel="apple-touch-icon" sizes="120x120" href="apple-touch-icon-120x120.png">
					<meta name="apple-mobile-web-app-title" content="5etools">

					<!-- macOS Safari Pinned Tab and Touch Bar -->
					<link rel="mask-icon" href="safari-pinned-tab.svg" color="#006bc4">

					${PrereleaseUtil.getPopoutStyleElementHtml()}
					${BrewUtil2.getPopoutStyleElementHtml()}

					<style>
						html, body { width: 100%; height: 100%; }
						body { overflow-y: scroll; }
						.hwin--popout { max-width: 100%; max-height: 100%; box-shadow: initial; width: 100%; overflow-y: auto; }
					</style>
				</head><body class="rd__body-popout">
				<div class="hwin hoverbox--popout hwin--popout"></div>
				<script type="text/javascript" defer src="js/parser.js"></script>
				<script type="text/javascript" defer src="js/utils.js"></script>
				<script type="text/javascript" defer src="lib/jquery.js"></script>
				</body></html>
			`);

			win.Renderer = Renderer;

			win.document.close();

			win._wrpHoverContent = $(win.document).find(`.hoverbox--popout`);
		}

		let $cpyContent;
		if (opts.$pFnGetPopoutContent) {
			$cpyContent = await opts.$pFnGetPopoutContent();
		} else {
			$cpyContent = $content.clone(true, true);
		}

		win._wrpHoverContent.innerHTML = "";
		$cpyContent.appendTo(win._wrpHoverContent);

		return win;
	}

	/* -------------------------------------------- */

	/**
	 * @param $content Content to append to the window.
	 * @param position The position of the window. Can be specified in various formats.
	 * @param [opts] Options object.
	 * @param [opts.isPermanent] If the window should have the expanded toolbar of a "permanent" window.
	 * @param [opts.title] The window title.
	 * @param [opts.isBookContent] If the hover window contains book content. Affects the styling of borders.
	 * @param [opts.pageUrl] A page URL which is navigable via a button in the window header
	 * @param [opts.cbClose] Callback to run on window close.
	 * @param [opts.width] An initial width for the window.
	 * @param [opts.height] An initial height fot the window.
	 * @param [opts.$pFnGetPopoutContent] A function which loads content for this window when it is popped out.
	 * @param [opts.fnGetPopoutSize] A function which gets a `{width: ..., height: ...}` object with dimensions for a
	 * popout window.
	 * @param [opts.isPopout] If the window should be immediately popped out.
	 * @param [opts.compactReferenceData] Reference (e.g. page/source/hash/others) which can be used to load the contents into the DM screen.
	 * @param [opts.sourceData] Source JSON (as raw as possible) used to construct this popout.
	 * @param [opts.isResizeOnlyWidth]
	 * @param [opts.isHideBottomBorder]
	 */
	static getShowWindow ($content, position, opts) {
		// eslint-disable-next-line vet-jquery/jquery
		$content = $($content);

		opts = opts || {};
		const {isHideBottomBorder, isResizeOnlyWidth} = opts;

		if (isHideBottomBorder && !isResizeOnlyWidth) throw new Error(`"isHideBottomBorder" option requires "isResizeOnlyWidth"!`);

		Renderer.hover._doInit();

		const initialWidth = opts.width == null ? Renderer.hover._DEFAULT_WIDTH_PX : opts.width;
		const initialZIndex = Renderer.hover._getNextZIndex();

		const $body = $(position.window.document.body);
		const $hov = $(`<div class="hwin"></div>`)
			.css({
				"right": -initialWidth,
				"width": initialWidth,
				"zIndex": initialZIndex,
			});
		const $wrpContent = $(`<div class="hwin__wrp-table"></div>`);
		if (opts.height != null) $wrpContent.css("height", opts.height);
		const hovTitle = ee`<span class="window-title min-w-0 ve-overflow-ellipsis" title="${`${opts.title || ""}`.qq()}">${opts.title || ""}</span>`;

		const hoverWindow = {};
		const hoverId = Renderer.hover._getNextId();
		Renderer.hover._WINDOW_METAS[hoverId] = hoverWindow;
		const mouseUpId = `mouseup.${hoverId} touchend.${hoverId}`;
		const mouseMoveId = `mousemove.${hoverId} touchmove.${hoverId}`;
		const resizeId = `resize.${hoverId}`;
		const drag = {};
		const eventChannel = new EventTarget();

		const brdrTopRightResize = ee`<div class="hoverborder__resize-ne ve-touch-action-none"></div>`
			.onn("mousedown", (evt) => Renderer.hover._getShowWindow_handleDragMousedown({hoverWindow, hoverId, $hov, drag, $wrpContent}, {evt, type: 1, isResizeOnlyWidth}))
			.onn("touchstart", (evt) => Renderer.hover._getShowWindow_handleDragMousedown({hoverWindow, hoverId, $hov, drag, $wrpContent}, {evt, type: 1, isResizeOnlyWidth}));
		if (isResizeOnlyWidth) brdrTopRightResize.hideVe();

		const brdrRightResize = ee`<div class="hoverborder__resize-e ve-touch-action-none"></div>`
			.onn("mousedown", (evt) => Renderer.hover._getShowWindow_handleDragMousedown({hoverWindow, hoverId, $hov, drag, $wrpContent}, {evt, type: 2, isResizeOnlyWidth}))
			.onn("touchstart", (evt) => Renderer.hover._getShowWindow_handleDragMousedown({hoverWindow, hoverId, $hov, drag, $wrpContent}, {evt, type: 2, isResizeOnlyWidth}));

		const brdrBottomRightResize = ee`<div class="hoverborder__resize-se ve-touch-action-none"></div>`
			.onn("mousedown", (evt) => Renderer.hover._getShowWindow_handleDragMousedown({hoverWindow, hoverId, $hov, drag, $wrpContent}, {evt, type: 3, isResizeOnlyWidth}))
			.onn("touchstart", (evt) => Renderer.hover._getShowWindow_handleDragMousedown({hoverWindow, hoverId, $hov, drag, $wrpContent}, {evt, type: 3, isResizeOnlyWidth}));
		if (isResizeOnlyWidth) brdrBottomRightResize.hideVe();

		const brdrBtmResize = ee`<div class="hoverborder__resize-s ve-touch-action-none"></div>`
			.onn("mousedown", (evt) => Renderer.hover._getShowWindow_handleDragMousedown({hoverWindow, hoverId, $hov, drag, $wrpContent}, {evt, type: 4, isResizeOnlyWidth}))
			.onn("touchstart", (evt) => Renderer.hover._getShowWindow_handleDragMousedown({hoverWindow, hoverId, $hov, drag, $wrpContent}, {evt, type: 4, isResizeOnlyWidth}));
		if (isResizeOnlyWidth) brdrBtmResize.hideVe();

		const brdrBtm = ee`<div class="hoverborder hoverborder--btm ${opts.isBookContent ? "hoverborder-book" : ""} ve-touch-action-none">${brdrBtmResize}</div>`;
		if (isHideBottomBorder) brdrBtm.hideVe();

		const brdrBtmLeftResize = ee`<div class="hoverborder__resize-sw ve-touch-action-none"></div>`
			.onn("mousedown", (evt) => Renderer.hover._getShowWindow_handleDragMousedown({hoverWindow, hoverId, $hov, drag, $wrpContent}, {evt, type: 5, isResizeOnlyWidth}))
			.onn("touchstart", (evt) => Renderer.hover._getShowWindow_handleDragMousedown({hoverWindow, hoverId, $hov, drag, $wrpContent}, {evt, type: 5, isResizeOnlyWidth}));
		if (isResizeOnlyWidth) brdrBtmLeftResize.hideVe();

		const brdrLeftResize = ee`<div class="hoverborder__resize-w ve-touch-action-none"></div>`
			.onn("mousedown", (evt) => Renderer.hover._getShowWindow_handleDragMousedown({hoverWindow, hoverId, $hov, drag, $wrpContent}, {evt, type: 6, isResizeOnlyWidth}))
			.onn("touchstart", (evt) => Renderer.hover._getShowWindow_handleDragMousedown({hoverWindow, hoverId, $hov, drag, $wrpContent}, {evt, type: 6, isResizeOnlyWidth}));

		const brdrTopLeftResize = ee`<div class="hoverborder__resize-nw ve-touch-action-none"></div>`
			.onn("mousedown", (evt) => Renderer.hover._getShowWindow_handleDragMousedown({hoverWindow, hoverId, $hov, drag, $wrpContent}, {evt, type: 7, isResizeOnlyWidth}))
			.onn("touchstart", (evt) => Renderer.hover._getShowWindow_handleDragMousedown({hoverWindow, hoverId, $hov, drag, $wrpContent}, {evt, type: 7, isResizeOnlyWidth}));
		if (isResizeOnlyWidth) brdrTopLeftResize.hideVe();

		const brdrTopResize = ee`<div class="hoverborder__resize-n ve-touch-action-none"></div>`
			.onn("mousedown", (evt) => Renderer.hover._getShowWindow_handleDragMousedown({hoverWindow, hoverId, $hov, drag, $wrpContent}, {evt, type: 8, isResizeOnlyWidth}))
			.onn("touchstart", (evt) => Renderer.hover._getShowWindow_handleDragMousedown({hoverWindow, hoverId, $hov, drag, $wrpContent}, {evt, type: 8, isResizeOnlyWidth}));
		if (isResizeOnlyWidth) brdrTopResize.hideVe();

		const brdrTop = ee`<div class="hoverborder hoverborder--top ${opts.isBookContent ? "hoverborder-book" : ""} ve-touch-action-none" ${opts.isPermanent ? `data-perm="true"` : ""}></div>`
			.onn("mousedown", (evt) => Renderer.hover._getShowWindow_handleDragMousedown({hoverWindow, hoverId, $hov, drag, $wrpContent}, {evt, type: 9, isResizeOnlyWidth}))
			.onn("touchstart", (evt) => Renderer.hover._getShowWindow_handleDragMousedown({hoverWindow, hoverId, $hov, drag, $wrpContent}, {evt, type: 9, isResizeOnlyWidth}))
			.onn("contextmenu", (evt) => {
				Renderer.hover._contextMenuLastClicked = {
					hoverId,
				};
				ContextUtil.pOpenMenu(evt, Renderer.hover._contextMenu);
			});

		$(position.window.document)
			.on(mouseUpId, (evt) => {
				if (drag.type) {
					if (drag.type < 9) {
						$wrpContent.css("max-height", "");
						$hov.css("max-width", "");
					}
					Renderer.hover._getShowWindow_adjustPosition({$hov, $wrpContent, position, eventChannel});

					if (drag.type === 9) {
						// handle mobile button touches
						if (EventUtil.isUsingTouch() && evt.target.classList.contains("hwin__top-border-icon")) {
							evt.preventDefault();
							drag.type = 0;
							$(evt.target).click();
							return;
						}

						// handle DM screen integration
						if (this._dmScreen && opts.compactReferenceData) {
							const panel = this._dmScreen.getPanelPx(EventUtil.getClientX(evt), EventUtil.getClientY(evt));
							if (!panel) return;
							this._dmScreen.setHoveringPanel(panel);
							const target = panel.getAddButtonPos();

							if (Renderer.hover._getShowWindow_isOverHoverTarget({evt, target})) {
								panel.doPopulate_Stats(opts.compactReferenceData.page, opts.compactReferenceData.source, opts.compactReferenceData.hash);
								Renderer.hover._getShowWindow_doClose({$hov, position, mouseUpId, mouseMoveId, resizeId, hoverId, opts, hoverWindow});
							}
							this._dmScreen.resetHoveringButton();
						}
					}
					drag.type = 0;
				}
			})
			.on(mouseMoveId, (evt) => {
				const args = {$wrpContent, $hov, drag, evt};
				switch (drag.type) {
					case 1: Renderer.hover._getShowWindow_handleNorthDrag(args); Renderer.hover._getShowWindow_handleEastDrag(args); break;
					case 2: Renderer.hover._getShowWindow_handleEastDrag(args); break;
					case 3: Renderer.hover._getShowWindow_handleSouthDrag(args); Renderer.hover._getShowWindow_handleEastDrag(args); break;
					case 4: Renderer.hover._getShowWindow_handleSouthDrag(args); break;
					case 5: Renderer.hover._getShowWindow_handleSouthDrag(args); Renderer.hover._getShowWindow_handleWestDrag(args); break;
					case 6: Renderer.hover._getShowWindow_handleWestDrag(args); break;
					case 7: Renderer.hover._getShowWindow_handleNorthDrag(args); Renderer.hover._getShowWindow_handleWestDrag(args); break;
					case 8: Renderer.hover._getShowWindow_handleNorthDrag(args); break;
					case 9: {
						const diffX = drag.startX - EventUtil.getClientX(evt);
						const diffY = drag.startY - EventUtil.getClientY(evt);
						$hov.css("left", drag.baseLeft - diffX)
							.css("top", drag.baseTop - diffY);
						drag.startX = EventUtil.getClientX(evt);
						drag.startY = EventUtil.getClientY(evt);
						drag.baseTop = parseFloat($hov.css("top"));
						drag.baseLeft = parseFloat($hov.css("left"));

						// handle DM screen integration
						if (this._dmScreen) {
							const panel = this._dmScreen.getPanelPx(EventUtil.getClientX(evt), EventUtil.getClientY(evt));
							if (!panel) return;
							this._dmScreen.setHoveringPanel(panel);
							const target = panel.getAddButtonPos();

							if (Renderer.hover._getShowWindow_isOverHoverTarget({evt, target})) this._dmScreen.setHoveringButton(panel);
							else this._dmScreen.resetHoveringButton();
						}
						break;
					}
				}
			});
		$(position.window).on(resizeId, () => Renderer.hover._getShowWindow_adjustPosition({$hov, $wrpContent, position, eventChannel}));

		brdrTop.attr("data-display-title", false);
		brdrTop.onn("dblclick", () => Renderer.hover._getShowWindow_doToggleMinimizedMaximized({$brdrTop: brdrTop, $hov}));
		brdrTop.appends(hovTitle);
		const $brdTopRhs = $(`<div class="ve-flex ml-auto no-shrink"></div>`).appendTo(brdrTop);

		if (opts.pageUrl && !position.window._IS_POPOUT && !Renderer.get().isInternalLinksDisabled()) {
			const $btnGotoPage = $(`<a class="hwin__top-border-icon glyphicon glyphicon-modal-window" title="Go to Page" href="${opts.pageUrl}"></a>`)
				.appendTo($brdTopRhs);
		}

		if (!position.window._IS_POPOUT && !opts.isPopout) {
			const $btnPopout = $(`<span class="hwin__top-border-icon glyphicon glyphicon-new-window hvr__popout" title="Open as Popup Window"></span>`)
				.on("click", evt => {
					evt.stopPropagation();
					return Renderer.hover._getShowWindow_pDoPopout({$hov, position, mouseUpId, mouseMoveId, resizeId, hoverId, opts, hoverWindow, $content}, {evt});
				})
				.appendTo($brdTopRhs);
		}

		if (opts.sourceData) {
			const btnPopout = e_({
				tag: "span",
				clazz: `hwin__top-border-icon hwin__top-border-icon--text`,
				title: "Show Source Data",
				text: "{}",
				click: evt => {
					evt.stopPropagation();
					evt.preventDefault();

					const $content = Renderer.hover.$getHoverContent_statsCode(opts.sourceData);
					Renderer.hover.getShowWindow(
						$content,
						Renderer.hover.getWindowPositionFromEvent(evt),
						{
							title: [opts.sourceData._displayName || opts.sourceData.name, "Source Data"].filter(Boolean).join(" \u2014 "),
							isPermanent: true,
							isBookContent: true,
						},
					);
				},
			});
			$brdTopRhs.append(btnPopout);
		}

		const $btnClose = $(`<span class="hwin__top-border-icon glyphicon glyphicon-remove" title="Close (CTRL to Close All)"></span>`)
			.on("click", (evt) => {
				evt.stopPropagation();

				if (EventUtil.isCtrlMetaKey(evt)) {
					Renderer.hover._doCloseAllWindows();
					return;
				}

				Renderer.hover._getShowWindow_doClose({$hov, position, mouseUpId, mouseMoveId, resizeId, hoverId, opts, hoverWindow});
			}).appendTo($brdTopRhs);

		$wrpContent.append($content);

		$hov.append(brdrTopResize).append(brdrTopRightResize).append(brdrRightResize).append(brdrBottomRightResize)
			.append(brdrBtmLeftResize).append(brdrLeftResize).append(brdrTopLeftResize)

			.append(brdrTop)
			.append($wrpContent)
			.append(brdrBtm);

		$body.append($hov);

		Renderer.hover._getShowWindow_setPosition({$hov, $wrpContent, position, eventChannel}, position);

		hoverWindow.zIndex = initialZIndex;
		hoverWindow.setZIndex = Renderer.hover._getNextZIndex.bind(this, {$hov, hoverWindow});

		hoverWindow.setPosition = Renderer.hover._getShowWindow_setPosition.bind(this, {$hov, $wrpContent, position, eventChannel});
		hoverWindow.mutScroll = Renderer.hover._getShowWindow_mutScroll.bind(this, {$hov, $wrpContent, position});
		hoverWindow.setIsPermanent = Renderer.hover._getShowWindow_setIsPermanent.bind(this, {opts, $brdrTop: brdrTop});
		hoverWindow.doClose = Renderer.hover._getShowWindow_doClose.bind(this, {$hov, position, mouseUpId, mouseMoveId, resizeId, hoverId, opts, hoverWindow});
		hoverWindow.doMaximize = Renderer.hover._getShowWindow_doMaximize.bind(this, {$brdrTop: brdrTop, $hov});
		hoverWindow.doZIndexToFront = Renderer.hover._getShowWindow_doZIndexToFront.bind(this, {$hov, hoverWindow, hoverId});

		hoverWindow.getPosition = Renderer.hover._getShowWindow_getPosition.bind(this, {$hov, hoverWindow, $wrpContent, position});

		hoverWindow.$setContent = ($contentNxt) => $wrpContent.empty().append($contentNxt);
		hoverWindow.setContent = (contentNxt) => $wrpContent.empty().append(contentNxt);

		hoverWindow.eventChannel = eventChannel;

		if (opts.isPopout) Renderer.hover._getShowWindow_pDoPopout({$hov, position, mouseUpId, mouseMoveId, resizeId, hoverId, opts, hoverWindow, $content});

		return hoverWindow;
	}

	static _getShowWindow_doClose ({$hov, position, mouseUpId, mouseMoveId, resizeId, hoverId, opts, hoverWindow}) {
		$hov.remove();
		$(position.window.document).off(mouseUpId);
		$(position.window.document).off(mouseMoveId);
		$(position.window).off(resizeId);

		delete Renderer.hover._WINDOW_METAS[hoverId];

		if (opts.cbClose) opts.cbClose(hoverWindow);
	}

	static _getShowWindow_handleDragMousedown ({hoverWindow, hoverId, $hov, drag, $wrpContent}, {evt, type, isResizeOnlyWidth}) {
		if (evt.button === 0) evt.preventDefault();

		hoverWindow.zIndex = Renderer.hover._getNextZIndex(hoverId);
		$hov.css({
			"z-index": hoverWindow.zIndex,
			"animation": "initial",
		});
		drag.type = type;
		drag.startX = EventUtil.getClientX(evt);
		drag.startY = EventUtil.getClientY(evt);
		drag.baseTop = parseFloat($hov.css("top"));
		drag.baseLeft = parseFloat($hov.css("left"));
		if (!isResizeOnlyWidth) drag.baseHeight = $wrpContent.height();
		drag.baseWidth = parseFloat($hov.css("width"));
		if (type < 9) {
			$wrpContent.css({
				...(isResizeOnlyWidth ? {} : {"height": drag.baseHeight}),
				"max-height": "initial",
			});
			$hov.css("max-width", "initial");
		}
	}

	static _getShowWindow_isOverHoverTarget ({evt, target}) {
		return EventUtil.getClientX(evt) >= target.left
			&& EventUtil.getClientX(evt) <= target.left + target.width
			&& EventUtil.getClientY(evt) >= target.top
			&& EventUtil.getClientY(evt) <= target.top + target.height;
	}

	static _getShowWindow_handleNorthDrag ({$wrpContent, $hov, drag, evt}) {
		const diffY = Math.max(drag.startY - EventUtil.getClientY(evt), 80 - drag.baseHeight); // prevent <80 height, as this will cause the box to move downwards
		$wrpContent.css("height", drag.baseHeight + diffY);
		$hov.css("top", drag.baseTop - diffY);
		drag.startY = EventUtil.getClientY(evt);
		drag.baseHeight = $wrpContent.height();
		drag.baseTop = parseFloat($hov.css("top"));
	}

	static _getShowWindow_handleEastDrag ({$wrpContent, $hov, drag, evt}) {
		const diffX = drag.startX - EventUtil.getClientX(evt);
		$hov.css("width", drag.baseWidth - diffX);
		drag.startX = EventUtil.getClientX(evt);
		drag.baseWidth = parseFloat($hov.css("width"));
	}

	static _getShowWindow_handleSouthDrag ({$wrpContent, $hov, drag, evt}) {
		const diffY = drag.startY - EventUtil.getClientY(evt);
		$wrpContent.css("height", drag.baseHeight - diffY);
		drag.startY = EventUtil.getClientY(evt);
		drag.baseHeight = $wrpContent.height();
	}

	static _getShowWindow_handleWestDrag ({$wrpContent, $hov, drag, evt}) {
		const diffX = Math.max(drag.startX - EventUtil.getClientX(evt), 150 - drag.baseWidth);
		$hov.css("width", drag.baseWidth + diffX)
			.css("left", drag.baseLeft - diffX);
		drag.startX = EventUtil.getClientX(evt);
		drag.baseWidth = parseFloat($hov.css("width"));
		drag.baseLeft = parseFloat($hov.css("left"));
	}

	static _getShowWindow_doToggleMinimizedMaximized ({$brdrTop, $hov}) {
		const curState = $brdrTop.attr("data-display-title");
		const isNextMinified = curState === "false";
		$brdrTop.attr("data-display-title", isNextMinified);
		$brdrTop.attr("data-perm", true);
		$hov.toggleClass("hwin--minified", isNextMinified);
	}

	static _getShowWindow_doMaximize ({$brdrTop, $hov}) {
		$brdrTop.attr("data-display-title", false);
		$hov.toggleClass("hwin--minified", false);
	}

	static async _getShowWindow_pDoPopout ({$hov, position, mouseUpId, mouseMoveId, resizeId, hoverId, opts, hoverWindow, $content}, {evt} = {}) {
		const winPopup = await Renderer.hover.pDoShowBrowserWindow($content, opts);
		Renderer.hover._getShowWindow_doClose({$hov, position, mouseUpId, mouseMoveId, resizeId, hoverId, opts, hoverWindow});
		hoverWindow._winPopup = winPopup;
	}

	static _getShowWindow_setPosition ({$hov, $wrpContent, position, eventChannel}, positionNxt) {
		switch (positionNxt.mode) {
			case "autoFromElement": {
				const bcr = $hov[0].getBoundingClientRect();

				if (positionNxt.isFromBottom) $hov.css("top", positionNxt.bcr.top - (bcr.height + 10));
				else $hov.css("top", positionNxt.bcr.top + positionNxt.bcr.height + 10);

				if (positionNxt.isFromRight) $hov.css("left", (positionNxt.clientX || positionNxt.bcr.left) - (bcr.width + 10));
				else $hov.css("left", (positionNxt.clientX || (positionNxt.bcr.left + positionNxt.bcr.width)) + 10);

				// region Sync position info when updating
				if (position !== positionNxt) {
					Renderer.hover._WINDOW_POSITION_PROPS_FROM_EVENT
						.forEach(prop => {
							position[prop] = positionNxt[prop];
						});
				}
				// endregion

				break;
			}
			case "exact": {
				$hov.css({
					"left": positionNxt.x,
					"top": positionNxt.y,
				});
				break;
			}
			case "exactVisibleBottom": {
				$hov.css({
					"left": positionNxt.x,
					"top": positionNxt.y,
					"animation": "initial", // Briefly remove the animation so we can calculate the height
				});

				let yPos = positionNxt.y;

				const {bottom: posBottom, height: winHeight} = $hov[0].getBoundingClientRect();
				const height = position.window.innerHeight;
				if (posBottom > height) {
					yPos = position.window.innerHeight - winHeight;
					$hov.css({
						"top": yPos,
						"animation": "",
					});
				}

				break;
			}
			default: throw new Error(`Positioning mode unimplemented: "${positionNxt.mode}"`);
		}

		Renderer.hover._getShowWindow_adjustPosition({$hov, $wrpContent, position, eventChannel});
	}

	static _getShowWindow_mutScroll ({$hov, $wrpContent, position}, {deltaPixelsX, deltaPixelsY}) {
		if (!deltaPixelsX && !deltaPixelsY) return;
		$wrpContent[0].scrollBy(deltaPixelsX, deltaPixelsY);
	}

	static _getShowWindow_adjustPosition ({$hov, $wrpContent, position, eventChannel}) {
		const eleHov = $hov[0];
		const wrpContent = $wrpContent[0];

		const bcr = eleHov.getBoundingClientRect().toJSON();
		const screenHeight = position.window.innerHeight;
		const screenWidth = position.window.innerWidth;

		// readjust position...
		// ...if vertically clipping off screen
		if (bcr.top < 0) {
			bcr.top = 0;
			bcr.bottom = bcr.top + bcr.height;
			eleHov.style.top = `${bcr.top}px`;
		} else if (bcr.top >= screenHeight - Renderer.hover._BAR_HEIGHT) {
			bcr.top = screenHeight - Renderer.hover._BAR_HEIGHT;
			bcr.bottom = bcr.top + bcr.height;
			eleHov.style.top = `${bcr.top}px`;
		}

		// ...if horizontally clipping off screen
		if (bcr.left < 0) {
			bcr.left = 0;
			bcr.right = bcr.left + bcr.width;
			eleHov.style.left = `${bcr.left}px`;
		} else if (bcr.left + bcr.width + Renderer.hover._BODY_SCROLLER_WIDTH_PX > screenWidth) {
			bcr.left = Math.max(screenWidth - bcr.width - Renderer.hover._BODY_SCROLLER_WIDTH_PX, 0);
			bcr.right = bcr.left + bcr.width;
			eleHov.style.left = `${bcr.left}px`;
		}

		// Prevent window "flickering" when hovering a link
		if (
			position.isPreventFlicker
			&& Renderer.hover._isIntersectRect(bcr, position.bcr)
		) {
			if (position.isFromBottom) {
				bcr.height = position.bcr.top - 5;
				wrpContent.style.height = `${bcr.height}px`;
			} else {
				bcr.height = screenHeight - position.bcr.bottom - 5;
				wrpContent.style.height = `${bcr.height}px`;
			}
		}

		eventChannel.dispatchEvent(new Event("resize"));
	}

	static _getShowWindow_getPosition ({$hov, hoverWindow, $wrpContent}) {
		if (hoverWindow._winPopup && !hoverWindow._winPopup.closed) {
			return {
				wWrpContent: $(hoverWindow._winPopup.document.body).width(),
				hWrapContent: $(hoverWindow._winPopup.document.body).height(),
			};
		}

		return {
			wWrpContent: $wrpContent.width(),
			hWrapContent: $wrpContent.height(),
		};
	}

	static _getShowWindow_setIsPermanent ({opts, $brdrTop}, isPermanent) {
		opts.isPermanent = isPermanent;
		$brdrTop.attr("data-perm", isPermanent);
	}

	static _getShowWindow_setZIndex ({$hov, hoverWindow}, zIndex) {
		$hov.css("z-index", zIndex);
		hoverWindow.zIndex = zIndex;
	}

	static _getShowWindow_doZIndexToFront ({$hov, hoverWindow, hoverId}) {
		const nxtZIndex = Renderer.hover._getNextZIndex(hoverId);
		Renderer.hover._getShowWindow_setZIndex({$hov, hoverWindow}, nxtZIndex);
	}

	/**
	 * @param entry
	 * @param [opts]
	 * @param [opts.isBookContent]
	 * @param [opts.isLargeBookContent]
	 * @param [opts.depth]
	 * @param [opts.id]
	 */
	static getMakePredefinedHover (entry, opts) {
		opts = opts || {};

		const id = opts.id ?? Renderer.hover._getNextId();
		Renderer.hover._entryCache[id] = entry;
		return {
			id,
			html: `onmouseover="Renderer.hover.handlePredefinedMouseOver(event, this, ${id}, ${JSON.stringify(opts).escapeQuotes()})" onmousemove="Renderer.hover.handlePredefinedMouseMove(event, this)" onmouseleave="Renderer.hover.handlePredefinedMouseLeave(event, this)" ${Renderer.hover.getPreventTouchString()}`,
			mouseOver: (evt, ele) => Renderer.hover.handlePredefinedMouseOver(evt, ele, id, opts),
			mouseMove: (evt, ele) => Renderer.hover.handlePredefinedMouseMove(evt, ele),
			mouseLeave: (evt, ele) => Renderer.hover.handlePredefinedMouseLeave(evt, ele),
			touchStart: (evt, ele) => Renderer.hover.handleTouchStart(evt, ele),
			show: () => Renderer.hover.doPredefinedShow(id, opts),
		};
	}

	static updatePredefinedHover (id, entry) {
		Renderer.hover._entryCache[id] = entry;
	}

	static getInlineHover (entry, opts) {
		return {
			// Re-use link handlers, as the inline version is a simplified version
			html: [
				`onmouseover="Renderer.hover.handleInlineMouseOver(event, this)"`,
				`onmouseleave="Renderer.hover.handleLinkMouseLeave(event, this)"`,
				`onmousemove="Renderer.hover.handleLinkMouseMove(event, this)"`,
				`onclick="Renderer.hover.handleLinkClick(event, this)"`,
				`onwheel="Renderer.hover.handleLinkWheel(event, this)"`,
				`data-vet-entry="${JSON.stringify(entry).qq()}"`,
				`${opts ? `data-vet-opts="${JSON.stringify(opts).qq()}"` : ""}`,
				`${Renderer.hover.getPreventTouchString()}`,
			]
				.filter(Boolean)
				.join(" "),
		};
	}

	static getPreventTouchString () {
		return `ontouchstart="Renderer.hover.handleTouchStart(event, this)"`;
	}

	static handleTouchStart (evt, ele) {
		// on large touchscreen devices only (e.g. iPads)
		if (!Renderer.hover.isSmallScreen(evt)) {
			// cache the link location and redirect it to void
			$(ele).data("href", $(ele).data("href") || $(ele).attr("href"));
			$(ele).attr("href", "javascript:void(0)");
			// restore the location after 100ms; if the user long-presses the link will be restored by the time they
			//   e.g. attempt to open a new tab
			setTimeout(() => {
				const data = $(ele).data("href");
				if (data) {
					$(ele).attr("href", data);
					$(ele).data("href", null);
				}
			}, 100);
		}
	}

	// region entry fetching
	static getEntityLink (
		ent,
		{
			displayText = null,
			prop = null,
			isLowerCase = false,
			isTitleCase = false,
		} = {},
	) {
		if (isLowerCase && isTitleCase) throw new Error(`"isLowerCase" and "isTitleCase" are mutually exclusive!`);

		const name = isLowerCase ? ent.name.toLowerCase() : isTitleCase ? ent.name.toTitleCase() : ent.name;

		let parts = [
			name,
			ent.source,
			displayText || "",
		];

		switch (prop || ent.__prop) {
			case "monster": {
				if (ent._isScaledCr) {
					parts.push(`${VeCt.HASH_SCALED}=${Parser.numberToCr(ent._scaledCr)}`);
				}

				if (ent._isScaledSpellSummon) {
					parts.push(`${VeCt.HASH_SCALED_SPELL_SUMMON}=${ent._scaledSpellSummonLevel}`);
				}

				if (ent._isScaledClassSummon) {
					parts.push(`${VeCt.HASH_SCALED_CLASS_SUMMON}=${ent._scaledClassSummonLevel}`);
				}

				break;
			}

			// TODO recipe?

			case "deity": {
				parts.splice(1, 0, ent.pantheon);
				break;
			}
		}

		while (parts.length && !parts.last()?.length) parts.pop();

		return Renderer.get().render(`{@${Parser.getPropTag(prop || ent.__prop)} ${parts.join("|")}}`);
	}

	static getRefMetaFromTag (str) {
		// convert e.g. `"{#itemEntry Ring of Resistance|DMG}"`
		//   to `{type: "refItemEntry", "itemEntry": "Ring of Resistance|DMG"}`
		str = str.slice(2, -1);
		const [tag, ...refParts] = str.split(" ");
		const ref = refParts.join(" ");
		const type = `ref${tag.uppercaseFirst()}`;
		return {type, [tag]: ref};
	}
	// endregion

	// region Apply custom hash IDs
	static async pApplyCustomHashId (page, ent, customHashId) {
		switch (page) {
			case UrlUtil.PG_BESTIARY: {
				const out = await Renderer.monster.pGetModifiedCreature(ent, customHashId);
				Renderer.monster.updateParsed(out);
				return out;
			}

			case UrlUtil.PG_RECIPES: return Renderer.recipe.pGetModifiedRecipe(ent, customHashId);

			default: return ent;
		}
	}
	// endregion

	static getGenericCompactRenderedString (entry, {depth = null} = {}) {
		if (entry.header != null) depth = Math.max(0, entry.header - 1);
		if (depth == null) depth = 0;

		return `
			<tr><td colspan="6" class="pb-2">
			${Renderer.get().setFirstSection(true).render(entry, depth)}
			</td></tr>
		`;
	}

	static getCompactRenderedFluffString (entry, {isSkipRootName = false} = {}) {
		if (!entry.entries) return "";

		if (!isSkipRootName) {
			Renderer.get().setFirstSection(true);
			return `<tr><td colspan="6" class="pb-2">
			${entry.entries.map(ent => Renderer.get().render(ent)).join("")}
			</td></tr>`;
		}

		const toRender = MiscUtil.copyFast(entry.entries);
		delete toRender[0]?.name;

		return `<tr><td colspan="6" class="pb-2">
		${Renderer.get().setFirstSection(true).render({type: "entries", entries: toRender})}
		</td></tr>`;
	}

	static getFnRenderCompact (page, {isStatic = false} = {}) {
		switch (page) {
			case "generic":
			case "hover": return Renderer.hover.getGenericCompactRenderedString.bind(Renderer.hover);
			case UrlUtil.PG_QUICKREF: return Renderer.hover.getGenericCompactRenderedString.bind(Renderer.hover);
			case UrlUtil.PG_CLASSES: return Renderer.class.getCompactRenderedString.bind(Renderer.class);
			case UrlUtil.PG_SPELLS: return Renderer.spell.getCompactRenderedString.bind(Renderer.spell);
			case UrlUtil.PG_ITEMS: return Renderer.item.getCompactRenderedString.bind(Renderer.item);
			case UrlUtil.PG_BESTIARY: return it => Renderer.monster.getCompactRenderedString(it, {isShowScalers: !isStatic, isScaledCr: it._originalCr != null, isScaledSpellSummon: it._isScaledSpellSummon, isScaledClassSummon: it._isScaledClassSummon});
			case UrlUtil.PG_CONDITIONS_DISEASES: return Renderer.conditionDisease.getCompactRenderedString.bind(Renderer.conditionDisease);
			case UrlUtil.PG_BACKGROUNDS: return Renderer.background.getCompactRenderedString.bind(Renderer.background);
			case UrlUtil.PG_FEATS: return Renderer.feat.getCompactRenderedString.bind(Renderer.feat);
			case UrlUtil.PG_OPT_FEATURES: return Renderer.optionalfeature.getCompactRenderedString.bind(Renderer.optionalfeature);
			case UrlUtil.PG_PSIONICS: return Renderer.psionic.getCompactRenderedString.bind(Renderer.psionic);
			case UrlUtil.PG_REWARDS: return Renderer.reward.getCompactRenderedString.bind(Renderer.reward);
			case UrlUtil.PG_RACES: return it => Renderer.race.getCompactRenderedString(it, {isStatic});
			case UrlUtil.PG_DEITIES: return Renderer.deity.getCompactRenderedString.bind(Renderer.deity);
			case UrlUtil.PG_OBJECTS: return Renderer.object.getCompactRenderedString.bind(Renderer.object);
			case UrlUtil.PG_TRAPS_HAZARDS: return Renderer.traphazard.getCompactRenderedString.bind(Renderer.traphazard);
			case UrlUtil.PG_VARIANTRULES: return Renderer.variantrule.getCompactRenderedString.bind(Renderer.variantrule);
			case UrlUtil.PG_CULTS_BOONS: return Renderer.cultboon.getCompactRenderedString.bind(Renderer.cultboon);
			case UrlUtil.PG_TABLES: return Renderer.table.getCompactRenderedString.bind(Renderer.table);
			case UrlUtil.PG_VEHICLES: return Renderer.vehicle.getCompactRenderedString.bind(Renderer.vehicle);
			case UrlUtil.PG_ACTIONS: return Renderer.action.getCompactRenderedString.bind(Renderer.action);
			case UrlUtil.PG_LANGUAGES: return Renderer.language.getCompactRenderedString.bind(Renderer.language);
			case UrlUtil.PG_CHAR_CREATION_OPTIONS: return Renderer.charoption.getCompactRenderedString.bind(Renderer.charoption);
			case UrlUtil.PG_RECIPES: return Renderer.recipe.getCompactRenderedString.bind(Renderer.recipe);
			case UrlUtil.PG_CLASS_SUBCLASS_FEATURES: return Renderer.hover.getGenericCompactRenderedString.bind(Renderer.hover);
			case UrlUtil.PG_CREATURE_FEATURES: return Renderer.hover.getGenericCompactRenderedString.bind(Renderer.hover);
			case UrlUtil.PG_DECKS: return Renderer.deck.getCompactRenderedString.bind(Renderer.deck);
			case UrlUtil.PG_BASTIONS: return Renderer.bastion.getCompactRenderedString.bind(Renderer.bastion);
			// region props
			case "classfeature":
			case "classFeature":
				return Renderer.hover.getGenericCompactRenderedString.bind(Renderer.hover);
			case "subclassfeature":
			case "subclassFeature":
				return Renderer.hover.getGenericCompactRenderedString.bind(Renderer.hover);
			case "citation": return Renderer.hover.getGenericCompactRenderedString.bind(Renderer.hover);
			// endregion
			default:
				if (Renderer[page]?.getCompactRenderedString) return Renderer[page].getCompactRenderedString.bind(Renderer[page]);
				if (page?.endsWith("Fluff")) return Renderer.hover.getCompactRenderedFluffString.bind(Renderer.hover);
				return null;
		}
	}

	static getFnBindListenersCompact (page, {overrides = {}} = {}) {
		if (overrides[page]) return overrides[page];

		switch (page) {
			case UrlUtil.PG_BESTIARY: return Renderer.monster.bindListenersCompact.bind(Renderer.monster);
			case UrlUtil.PG_RACES: return Renderer.race.bindListenersCompact.bind(Renderer.race);
			default: return null;
		}
	}

	static isSmallScreen (evt) {
		if (typeof window === "undefined") return false;

		evt = evt || {};
		const win = (evt.view || {}).window || window;
		return win.innerWidth <= 768;
	}

	/**
	 * @param page
	 * @param toRender
	 * @param [opts]
	 * @param [opts.isBookContent]
	 * @param [opts.isStatic] If this content is to be "static," i.e. display only, containing minimal interactive UI.
	 * @param [opts.fnRender]
	 * @param [renderFnOpts]
	 */
	static $getHoverContent_stats (page, toRender, opts, renderFnOpts) {
		opts = opts || {};
		if (page === UrlUtil.PG_RECIPES) opts = {...MiscUtil.copyFast(opts), isBookContent: true};

		const name = toRender._displayName || toRender.name;
		const fnRender = opts.fnRender || Renderer.hover.getFnRenderCompact(page, {isStatic: opts.isStatic});
		const $out = $$`<table class="w-100 stats ${opts.isBookContent ? `stats--book` : ""}" ${name ? `data-roll-name-ancestor-roller="${Renderer.stripTags(name).qq()}"` : ""}>${fnRender(toRender, renderFnOpts)}</table>`;

		if (!opts.isStatic) {
			const fnBind = Renderer.hover.getFnBindListenersCompact(page);
			if (fnBind) fnBind(toRender, $out[0]);
		}

		return $out;
	}

	/**
	 * @param page
	 * @param toRender
	 * @param [opts]
	 * @param [opts.isBookContent]
	 * @param [renderFnOpts]
	 */
	static getHoverContent_fluff (page, toRender, opts, renderFnOpts) {
		opts = opts || {};
		if (page === UrlUtil.PG_RECIPES) opts = {...MiscUtil.copyFast(opts), isBookContent: true};

		if (!toRender) {
			return ee`<table class="w-100 stats ${opts.isBookContent ? `stats--book` : ""}"><tr><td colspan="6" class="p-2 ve-text-center">${Renderer.utils.HTML_NO_INFO}</td></tr></table>`;
		}

		toRender = MiscUtil.copyFast(toRender);

		if (toRender.images && toRender.images.length) {
			const cachedImages = MiscUtil.copyFast(toRender.images);
			delete toRender.images;

			toRender.entries = toRender.entries || [];
			const hasText = toRender.entries.length > 0;
			// Add the first image at the top
			if (hasText) toRender.entries.unshift({type: "hr"});
			cachedImages[0].maxHeight = 33;
			cachedImages[0].maxHeightUnits = "vh";
			toRender.entries.unshift(cachedImages[0]);

			// Add any other images at the bottom
			if (cachedImages.length > 1) {
				if (hasText) toRender.entries.push({type: "hr"});
				toRender.entries.push(...cachedImages.slice(1));
			}
		}

		const name = toRender._displayName || toRender.name;
		return ee`<table class="w-100 stats ${opts.isBookContent ? `stats--book` : ""}" ${name ? `data-roll-name-ancestor-roller="${Renderer.stripTags(name).qq()}"` : ""}>${Renderer.generic.getCompactRenderedString(toRender, renderFnOpts)}</table>`;
	}

	/**
	 * @param page
	 * @param toRender
	 * @param [opts]
	 * @param [opts.isBookContent]
	 * @param [renderFnOpts]
	 */
	static $getHoverContent_fluff (page, toRender, opts, renderFnOpts) {
		return $(this.getHoverContent_fluff(page, toRender, opts, renderFnOpts));
	}

	static $getHoverContent_statsCode (toRender, {isSkipClean = false, title = null} = {}) {
		const cleanCopy = isSkipClean ? toRender : DataUtil.cleanJson(MiscUtil.copyFast(toRender));
		return Renderer.hover.$getHoverContent_miscCode(
			title || [cleanCopy.name, "Source Data"].filter(Boolean).join(" \u2014 "),
			JSON.stringify(cleanCopy, null, "\t"),
		);
	}

	static $getHoverContent_miscCode (name, code) {
		const toRenderCode = {
			type: "code",
			name,
			preformatted: code,
		};
		return $$`<table class="w-100 stats stats--book">${Renderer.get().render(toRenderCode)}</table>`;
	}

	/**
	 * @param toRender
	 * @param [opts]
	 * @param [opts.isBookContent]
	 * @param [opts.isLargeBookContent]
	 * @param [opts.depth]
	 */
	static $getHoverContent_generic (toRender, opts) {
		opts = opts || {};

		const name = toRender._displayName || toRender.name;
		return $$`<table class="w-100 stats ${opts.isBookContent || opts.isLargeBookContent ? "stats--book" : ""} ${opts.isLargeBookContent ? "stats--book-large" : ""}" ${name ? `data-roll-name-ancestor-roller="${Renderer.stripTags(name).qq()}"` : ""}>${Renderer.hover.getGenericCompactRenderedString(toRender, {depth: opts.depth || 0})}</table>`;
	}

	/**
	 * @param evt
	 * @param entity
	 */
	static doPopoutCurPage (evt, entity) {
		const page = UrlUtil.getCurrentPage();
		const $content = Renderer.hover.$getHoverContent_stats(page, entity);
		Renderer.hover.getShowWindow(
			$content,
			Renderer.hover.getWindowPositionFromEvent(evt),
			{
				pageUrl: `#${UrlUtil.autoEncodeHash(entity)}`,
				title: entity._displayName || entity.name,
				isPermanent: true,
				isBookContent: page === UrlUtil.PG_RECIPES,
				sourceData: entity,
			},
		);
	}

	/**
	 * @param evt
	 * @param entity
	 */
	static async pDoBrowserPopoutCurPage (evt, entity) {
		const page = UrlUtil.getCurrentPage();
		const $content = Renderer.hover.$getHoverContent_stats(page, entity);

		await Renderer.hover.pDoShowBrowserWindow(
			$content,
			{
				title: entity._displayName || entity.name,
			},
		);
	}
};

/**
 * Recursively find all the names of entries, useful for indexing
 * @param nameStack an array to append the names to
 * @param entry the base entry
 * @param [opts] Options object.
 * @param [opts.maxDepth] Maximum depth to search for
 * @param [opts.depth] Start depth (used internally when recursing)
 * @param [opts.typeBlocklist] A set of entry types to avoid.
 */
Renderer.getNames = function (nameStack, entry, opts) {
	opts = opts || {};
	if (opts.maxDepth == null) opts.maxDepth = false;
	if (opts.depth == null) opts.depth = 0;

	if (opts.typeBlocklist && entry.type && opts.typeBlocklist.has(entry.type)) return;

	if (opts.maxDepth !== false && opts.depth > opts.maxDepth) return;
	if (entry.name) nameStack.push(Renderer.stripTags(entry.name));
	if (entry.entries) {
		let nextDepth = entry.type === "section" ? -1 : entry.type === "entries" ? opts.depth + 1 : opts.depth;
		for (const eX of entry.entries) {
			const nxtOpts = {...opts};
			nxtOpts.depth = nextDepth;
			Renderer.getNames(nameStack, eX, nxtOpts);
		}
	} else if (entry.items) {
		for (const eX of entry.items) {
			Renderer.getNames(nameStack, eX, opts);
		}
	}
};

Renderer.getNumberedNames = function (entry) {
	const renderer = new Renderer().setTrackTitles(true);
	renderer.render(entry);
	const titles = renderer.getTrackedTitles();
	const out = {};
	Object.entries(titles).forEach(([k, v]) => {
		v = Renderer.stripTags(v);
		out[v] = Number(k);
	});
	return out;
};

// dig down until we find a name, as feature names can be nested
Renderer.findName = function (entry) { return CollectionUtil.dfs(entry, {prop: "name"}); };
Renderer.findSource = function (entry) { return CollectionUtil.dfs(entry, {prop: "source"}); };
Renderer.findEntry = function (entry) { return CollectionUtil.dfs(entry, {fnMatch: obj => obj.name && obj?.entries?.length}); };

/**
 * @param {string} str
 * @param {?Set<string>} allowlistTags
 * @param {?Set<string>} blocklistTags
 */
Renderer.stripTags = function (str, {allowlistTags = null, blocklistTags = null} = {}) {
	if (!str) return str;

	const ptrAccum = {_: ""};
	Renderer._stripTags_textRender({str, ptrAccum, allowlistTags, blocklistTags});
	return ptrAccum._;
};

Renderer._stripTags_textRender = function ({str, ptrAccum, allowlistTags = null, blocklistTags = null} = {}) {
	const tagSplit = Renderer.splitByTags(str);
	const len = tagSplit.length;
	for (let i = 0; i < len; ++i) {
		const s = tagSplit[i];
		if (!s) continue;

		if (!s.startsWith("{@")) {
			ptrAccum._ += s;
			continue;
		}

		const [tag, text] = Renderer.splitFirstSpace(s.slice(1, -1));

		if (
			(allowlistTags != null && allowlistTags.has(tag))
			|| (blocklistTags != null && !blocklistTags.has(tag))
		) {
			ptrAccum._ += s;
			continue;
		}

		const tagInfo = Renderer.tag.TAG_LOOKUP[tag];
		if (!tagInfo) throw new Error(`Unhandled tag: "${tag}"`);
		const stripped = tagInfo.getStripped(tag, text);

		Renderer._stripTags_textRender({str: stripped, ptrAccum, allowlistTags, blocklistTags});
	}
};

/**
 * This assumes validation has been done in advance.
 * @param row
 * @param [opts]
 * @param [opts.cbErr]
 * @param [opts.isForceInfiniteResults]
 * @param [opts.isFirstRow] Used it `isForceInfiniteResults` is specified.
 * @param [opts.isLastRow] Used it `isForceInfiniteResults` is specified.
 */
Renderer.getRollableRow = function (row, opts) {
	opts = opts || {};

	if (
		row[0]?.type === "cell"
		&& (
			row[0]?.roll?.exact != null
			|| (row[0]?.roll?.min != null && row[0]?.roll?.max != null)
		)
	) return row;

	row = MiscUtil.copyFast(row);
	try {
		const cleanRow = String(row[0]).trim();

		// format: "20 or lower"; "99 or higher"
		const mLowHigh = /^(\d+) or (lower|higher)$/i.exec(cleanRow);
		if (mLowHigh) {
			row[0] = {type: "cell", entry: cleanRow}; // Preserve the original text

			if (mLowHigh[2].toLowerCase() === "lower") {
				row[0].roll = {
					min: -Renderer.dice.POS_INFINITE,
					max: Number(mLowHigh[1]),
				};
			} else {
				row[0].roll = {
					min: Number(mLowHigh[1]),
					max: Renderer.dice.POS_INFINITE,
				};
			}

			return row;
		}

		// format: "95-00" or "12"
		// u2012 = figure dash; u2013 = en-dash; u2014 = em dash; u2212 = minus sign
		const m = /^(\d+)([-\u2013-\u2014\u2212](\d+))?$/.exec(cleanRow);
		if (m) {
			if (m[1] && !m[2]) {
				row[0] = {
					type: "cell",
					roll: {
						exact: Number(m[1]),
					},
				};
				if (m[1][0] === "0") row[0].roll.pad = true;
				Renderer.getRollableRow._handleInfiniteOpts(row, opts);
			} else {
				row[0] = {
					type: "cell",
					roll: {
						min: Number(m[1]),
						max: Number(m[3]),
					},
				};
				if (m[1][0] === "0" || m[3][0] === "0") row[0].roll.pad = true;
				Renderer.getRollableRow._handleInfiniteOpts(row, opts);
			}
		} else {
			// format: "12+"
			const m = /^(\d+)\+$/.exec(row[0]);
			row[0] = {
				type: "cell",
				roll: {
					min: Number(m[1]),
					max: Renderer.dice.POS_INFINITE,
				},
			};
		}
	} catch (e) {
		if (opts.cbErr) opts.cbErr(row[0], e);
	}
	return row;
};
Renderer.getRollableRow._handleInfiniteOpts = function (row, opts) {
	if (!opts.isForceInfiniteResults) return;

	const isExact = row[0].roll.exact != null;

	if (opts.isFirstRow) {
		if (!isExact) row[0].roll.displayMin = row[0].roll.min;
		row[0].roll.min = -Renderer.dice.POS_INFINITE;
	}

	if (opts.isLastRow) {
		if (!isExact) row[0].roll.displayMax = row[0].roll.max;
		row[0].roll.max = Renderer.dice.POS_INFINITE;
	}
};

Renderer.initLazyImageLoaders = function () {
	const images = document.querySelectorAll(`img[${Renderer.utils.lazy.ATTR_IMG_FINAL_SRC}], canvas[${Renderer.utils.lazy.ATTR_IMG_FINAL_SRC}]`);

	Renderer.utils.lazy.destroyObserver({observerId: "images"});

	const observer = Renderer.utils.lazy.getCreateObserver({
		observerId: "images",
		fnOnObserve: ({entry}) => {
			Renderer.utils.lazy.mutFinalizeEle(entry.target);
		},
	});

	images.forEach(ele => observer.track(ele));
};

Renderer.HEAD_NEG_1 = "rd__b--0";
Renderer.HEAD_0 = "rd__b--1";
Renderer.HEAD_1 = "rd__b--2";
Renderer.HEAD_2 = "rd__b--3";
Renderer.HEAD_2_SUB_VARIANT = "rd__b--4";
Renderer.DATA_NONE = "data-none";
