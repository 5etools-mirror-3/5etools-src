"use strict";

class NavBar {
	static _DROP_TIME = 250;
	static _MIN_MOVE_PX = 3;
	static _CAT_RULES = "Rules";
	static _CAT_BOOKS = "Books";
	static _CAT_PLAYER = "Player";
	static _CAT_DUNGEON_MASTER = "Dungeon Master";
	static _CAT_ADVENTURES = "Adventures";
	static _CAT_REFERENCES = "References";
	static _CAT_UTILITIES = "Utilities";
	static _CAT_SETTINGS = "Settings";
	static _CAT_CACHE = "Preload Data";

	static _navbar = null;

	static _tree = {};

	static _timerId = 1;
	static _timersOpen = {};
	static _timersClose = {};
	static _timerMousePos = {};
	static _cachedInstallEvent = null;

	static init () {
		this._initInstallPrompt();
		// render the visible elements ASAP
		window.addEventListener("DOMContentLoaded", NavBar._onDomContentLoaded);
		window.addEventListener("load", NavBar._onLoad);
	}

	static _onDomContentLoaded () {
		NavBar._initElements();
		NavBar.highlightCurrentPage();
	}

	static _onLoad () {
		NavBar._dropdowns = [...NavBar._navbar.querySelectorAll(`li.dropdown--navbar`)];
		document.addEventListener("click", () => NavBar._closeAllDropdowns());

		NavBar._clearAllTimers();

		NavBar._initAdventureBookElements().then(null);
	}

	static _initInstallPrompt () {
		NavBar._cachedInstallEvent = null;
		window.addEventListener("beforeinstallprompt", e => NavBar._cachedInstallEvent = e);
	}

	static _initElements () {
		NavBar._navbar = document.getElementById("navbar");
		NavBar._tree = new NavBar.Node({
			body: NavBar._navbar,
		});

		// create mobile "Menu" button
		const btnShowHide = document.createElement("button");
		btnShowHide.className = "ve-btn ve-btn-default page__btn-toggle-nav";
		btnShowHide.innerHTML = "Menu";
		btnShowHide.onclick = () => {
			btnShowHide.classList.toggle("active");
			em(`.page__nav-hidden-mobile`).forEach(ele => ele.toggleClass("block", btnShowHide.classList.contains("active")));
		};
		document.getElementById("navigation").prepend(btnShowHide);

		this._addElement_li({page: "index.html", aText: "Home"});

		this._addElement_dropdown({category: NavBar._CAT_RULES});
		this._addElement_li({keyPath: [NavBar._CAT_RULES], page: "variantrules.html", aText: "Rules Glossary"});
		this._addElement_li({keyPath: [NavBar._CAT_RULES], page: "tables.html", aText: "Tables"});
		this._addElement_divider({keyPath: [NavBar._CAT_RULES]});
		this._addElement_dropdown({keyPath: [NavBar._CAT_RULES], category: NavBar._CAT_BOOKS, isSide: true, page: "books.html"});
		this._addElement_li({keyPath: [NavBar._CAT_RULES, NavBar._CAT_BOOKS], page: "books.html", aText: "View All/Homebrew"});
		this._addElement_divider({keyPath: [NavBar._CAT_RULES]});
		this._addElement_li({keyPath: [NavBar._CAT_RULES], page: "quickreference.html", aText: "Quick Reference (2014)"});

		this._addElement_dropdown({category: NavBar._CAT_PLAYER});
		this._addElement_li({keyPath: [NavBar._CAT_PLAYER], page: "classes.html", aText: "Classes"});
		this._addElement_li({keyPath: [NavBar._CAT_PLAYER], page: "backgrounds.html", aText: "Backgrounds"});
		this._addElement_li({keyPath: [NavBar._CAT_PLAYER], page: "feats.html", aText: "Feats"});
		this._addElement_li({keyPath: [NavBar._CAT_PLAYER], page: "races.html", aText: "Species"});
		this._addElement_li({keyPath: [NavBar._CAT_PLAYER], page: "charcreationoptions.html", aText: "Other Character Creation Options"});
		this._addElement_li({keyPath: [NavBar._CAT_PLAYER], page: "optionalfeatures.html", aText: "Other Options & Features"});
		this._addElement_divider({keyPath: [NavBar._CAT_PLAYER]});
		this._addElement_li({keyPath: [NavBar._CAT_PLAYER], page: "statgen.html", aText: "Stat Generator"});
		this._addElement_divider({keyPath: [NavBar._CAT_PLAYER]});
		this._addElement_li({keyPath: [NavBar._CAT_PLAYER], page: "lifegen.html", aText: "This Is Your Life"});
		this._addElement_li({keyPath: [NavBar._CAT_PLAYER], page: "names.html", aText: "Names"});

		this._addElement_dropdown({category: NavBar._CAT_DUNGEON_MASTER});
		this._addElement_li({keyPath: [NavBar._CAT_DUNGEON_MASTER], page: "dmscreen.html", aText: "DM Screen"});
		this._addElement_divider({keyPath: [NavBar._CAT_DUNGEON_MASTER]});
		this._addElement_dropdown({keyPath: [NavBar._CAT_DUNGEON_MASTER], category: NavBar._CAT_ADVENTURES, isSide: true, page: "adventures.html"});
		this._addElement_li({keyPath: [NavBar._CAT_DUNGEON_MASTER, NavBar._CAT_ADVENTURES], page: "adventures.html", aText: "View All/Homebrew"});
		this._addElement_li({keyPath: [NavBar._CAT_DUNGEON_MASTER], page: "cultsboons.html", aText: "Cults & Supernatural Boons"});
		this._addElement_li({keyPath: [NavBar._CAT_DUNGEON_MASTER], page: "objects.html", aText: "Objects"});
		this._addElement_li({keyPath: [NavBar._CAT_DUNGEON_MASTER], page: "trapshazards.html", aText: "Traps & Hazards"});
		this._addElement_divider({keyPath: [NavBar._CAT_DUNGEON_MASTER]});
		this._addElement_li({keyPath: [NavBar._CAT_DUNGEON_MASTER], page: "crcalculator.html", aText: "CR Calculator (2014)"});
		this._addElement_li({keyPath: [NavBar._CAT_DUNGEON_MASTER], page: "encountergen.html", aText: "Encounter Generator"});
		this._addElement_li({keyPath: [NavBar._CAT_DUNGEON_MASTER], page: "lootgen.html", aText: "Loot Generator"});
		this._addElement_divider({keyPath: [NavBar._CAT_DUNGEON_MASTER]});
		this._addElement_li({keyPath: [NavBar._CAT_DUNGEON_MASTER], page: "maps.html", aText: "Maps"});

		this._addElement_dropdown({category: NavBar._CAT_REFERENCES});
		this._addElement_li({keyPath: [NavBar._CAT_REFERENCES], page: "actions.html", aText: "Actions"});
		this._addElement_li({keyPath: [NavBar._CAT_REFERENCES], page: "bastions.html", aText: "Bastions"});
		this._addElement_li({keyPath: [NavBar._CAT_REFERENCES], page: "bestiary.html", aText: "Bestiary"});
		this._addElement_li({keyPath: [NavBar._CAT_REFERENCES], page: "conditionsdiseases.html", aText: "Conditions & Diseases"});
		this._addElement_li({keyPath: [NavBar._CAT_REFERENCES], page: "decks.html", aText: "Decks"});
		this._addElement_li({keyPath: [NavBar._CAT_REFERENCES], page: "deities.html", aText: "Deities"});
		this._addElement_li({keyPath: [NavBar._CAT_REFERENCES], page: "items.html", aText: "Items"});
		this._addElement_li({keyPath: [NavBar._CAT_REFERENCES], page: "languages.html", aText: "Languages"});
		this._addElement_li({keyPath: [NavBar._CAT_REFERENCES], page: "rewards.html", aText: "Supernatural Gifts & Rewards"});
		this._addElement_li({keyPath: [NavBar._CAT_REFERENCES], page: "psionics.html", aText: "Psionics"});
		this._addElement_li({keyPath: [NavBar._CAT_REFERENCES], page: "spells.html", aText: "Spells"});
		this._addElement_li({keyPath: [NavBar._CAT_REFERENCES], page: "vehicles.html", aText: "Vehicles"});
		this._addElement_divider({keyPath: [NavBar._CAT_REFERENCES]});
		this._addElement_li({keyPath: [NavBar._CAT_REFERENCES], page: "recipes.html", aText: "Recipes"});

		this._addElement_dropdown({category: NavBar._CAT_UTILITIES});
		this._addElement_li({keyPath: [NavBar._CAT_UTILITIES], page: "search.html", aText: "Search"});
		this._addElement_divider({keyPath: [NavBar._CAT_UTILITIES]});
		this._addElement_li({keyPath: [NavBar._CAT_UTILITIES], page: "blocklist.html", aText: "Content Blocklist"});
		this._addElement_li({keyPath: [NavBar._CAT_UTILITIES], page: "manageprerelease.html", aText: "Prerelease Content Manager"});
		this._addElement_li({keyPath: [NavBar._CAT_UTILITIES], page: "managebrew.html", aText: "Homebrew Manager"});
		this._addElement_buttonSplit(
			{
				keyPath: [NavBar._CAT_UTILITIES],
				metas: [
					{
						html: "Load All Partnered Content",
						click: async evt => {
							evt.stopPropagation();
							evt.preventDefault();
							const {ManageBrewUi} = await import("./utils-brew/utils-brew-ui-manage.js");
							await ManageBrewUi.pOnClickBtnLoadAllPartnered();
						},
					},
					{
						html: `<span class="glyphicon glyphicon-link"></span>`,
						title: `Export Prerelease Content/Homebrew List as URL`,
						click: async evt => {
							evt.stopPropagation();
							evt.preventDefault();
							const ele = evt.currentTarget;
							const {ManageBrewUi} = await import("./utils-brew/utils-brew-ui-manage.js");
							await ManageBrewUi.pOnClickBtnExportListAsUrl({ele});
						},
					},
				],
			},
		);
		this._addElement_divider({keyPath: [NavBar._CAT_UTILITIES]});
		this._addElement_li({keyPath: [NavBar._CAT_UTILITIES], page: "inittrackerplayerview.html", aText: "Initiative Tracker Player View"});
		this._addElement_divider({keyPath: [NavBar._CAT_UTILITIES]});
		this._addElement_li({keyPath: [NavBar._CAT_UTILITIES], page: "renderdemo.html", aText: "Renderer Demo"});
		this._addElement_li({keyPath: [NavBar._CAT_UTILITIES], page: "makebrew.html", aText: "Homebrew Builder"});
		this._addElement_li({keyPath: [NavBar._CAT_UTILITIES], page: "makecards.html", aText: "RPG Cards JSON Builder"});
		this._addElement_li({keyPath: [NavBar._CAT_UTILITIES], page: "converter.html", aText: "Text Converter"});
		this._addElement_divider({keyPath: [NavBar._CAT_UTILITIES]});
		this._addElement_li({keyPath: [NavBar._CAT_UTILITIES], page: "plutonium.html", aText: "Plutonium (Foundry Module) Features"});
		this._addElement_divider({keyPath: [NavBar._CAT_UTILITIES]});
		this._addElement_li({keyPath: [NavBar._CAT_UTILITIES], page: "https://wiki.tercept.net/en/betteR20", aText: "Roll20 Script Help", isExternal: true, isExternalMark: true});
		this._addElement_divider({keyPath: [NavBar._CAT_UTILITIES]});
		this._addElement_li({keyPath: [NavBar._CAT_UTILITIES], page: "changelog.html", aText: "Changelog"});
		this._addElement_li({keyPath: [NavBar._CAT_UTILITIES], page: NavBar._getCurrentWikiHelpPage(), aText: "Page Help", isExternal: true, isExternalMark: true});
		this._addElement_divider({keyPath: [NavBar._CAT_UTILITIES]});
		this._addElement_li({keyPath: [NavBar._CAT_UTILITIES], page: "privacy-policy.html", aText: "Privacy Policy"});

		this._addElement_dropdown({category: NavBar._CAT_SETTINGS});
		this._addElement_button(
			{
				keyPath: [NavBar._CAT_SETTINGS],
				html: "Preferences",
				click: () => {
					ConfigUi.show();
					NavBar._closeAllDropdowns();
				},
			},
		);
		this._addElement_divider({keyPath: [NavBar._CAT_SETTINGS]});
		this._addElement_button(
			{
				keyPath: [NavBar._CAT_SETTINGS],
				html: "Save State to File",
				click: async (evt) => NavBar.InteractionManager._pOnClick_button_saveStateFile(evt),
				title: "Save any locally-stored data (loaded homebrew, active blocklists, DM Screen configuration,...) to a file.",
			},
		);
		this._addElement_button(
			{
				keyPath: [NavBar._CAT_SETTINGS],
				html: "Load State from File",
				click: async (evt) => NavBar.InteractionManager._pOnClick_button_loadStateFile(evt),
				title: "Load previously-saved data (loaded homebrew, active blocklists, DM Screen configuration,...) from a file.",
			},
		);
		this._addElement_divider({keyPath: [NavBar._CAT_SETTINGS]});
		this._addElement_button(
			{
				keyPath: [NavBar._CAT_SETTINGS],
				html: "Add as App",
				click: async (evt) => NavBar.InteractionManager._pOnClick_button_addApp(evt),
				title: "Add the site to your home screen. When used in conjunction with the Preload Offline Data option, this can create a functional offline copy of the site.",
			},
		);
		this._addElement_dropdown({keyPath: [NavBar._CAT_SETTINGS], category: NavBar._CAT_CACHE, isSide: true});
		this._addElement_label({keyPath: [NavBar._CAT_SETTINGS, NavBar._CAT_CACHE], html: `<p>Preload data for offline use.</p><p>Note that visiting a page will automatically preload data for that page.</p><p>Note that data which is already preloaded will not be overwritten, unless it is out of date.</p>`});
		this._addElement_button(
			{
				keyPath: [NavBar._CAT_SETTINGS, NavBar._CAT_CACHE],
				html: "Preload Adventure Text <small>(50MB+)</small>",
				click: (evt) => NavBar.InteractionManager._pOnClick_button_preloadOffline(evt, {route: /data\/adventure/}),
				title: "Preload adventure text for offline use.",
			},
		);
		this._addElement_button(
			{
				keyPath: [NavBar._CAT_SETTINGS, NavBar._CAT_CACHE],
				html: "Preload Book Images <small>(1GB+)</small>",
				click: (evt) => NavBar.InteractionManager._pOnClick_button_preloadOffline(evt, {route: /img\/book/, isRequireImages: true}),
				title: "Preload book images offline use. Note that book text is preloaded automatically.",
			},
		);
		this._addElement_button(
			{
				keyPath: [NavBar._CAT_SETTINGS, NavBar._CAT_CACHE],
				html: "Preload Adventure Text and Images <small>(2GB+)</small>",
				click: (evt) => NavBar.InteractionManager._pOnClick_button_preloadOffline(evt, {route: /(?:data|img)\/adventure/, isRequireImages: true}),
				title: "Preload adventure text and images for offline use.",
			},
		);
		this._addElement_button(
			{
				keyPath: [NavBar._CAT_SETTINGS, NavBar._CAT_CACHE],
				html: "Preload All Images <small>(4GB+)</small>",
				click: (evt) => NavBar.InteractionManager._pOnClick_button_preloadOffline(evt, {route: /img/, isRequireImages: true}),
				title: "Preload all images for offline use.",
			},
		);
		this._addElement_button(
			{
				keyPath: [NavBar._CAT_SETTINGS, NavBar._CAT_CACHE],
				html: "Preload All <small>(5GB+)</small>",
				click: (evt) => NavBar.InteractionManager._pOnClick_button_preloadOffline(evt, {route: /./, isRequireImages: true}),
				title: "Preload everything for offline use.",
			},
		);
		this._addElement_divider({keyPath: [NavBar._CAT_SETTINGS, NavBar._CAT_CACHE]});
		this._addElement_button(
			{
				keyPath: [NavBar._CAT_SETTINGS, NavBar._CAT_CACHE],
				html: "Reset Preloaded Data",
				click: (evt) => NavBar.InteractionManager._pOnClick_button_clearOffline(evt),
				title: "Remove all preloaded data, and clear away any caches.",
			},
		);

		this._addElement_li({page: "https://wiki.tercept.net/en/5eTools", aText: "Help", isExternal: true});
	}

	/**
	 * Adventure/book elements are added as a second, asynchronous, step, as they require loading of:
	 * - An index JSON file.
	 * - The user's Blocklist.
	 */
	static async _initAdventureBookElements () {
		await Promise.all([
			PrereleaseUtil.pInit(),
			BrewUtil2.pInit(),
		]);
		const [adventureBookIndex] = await Promise.all([
			DataUtil.loadJSON(`${Renderer.get().baseUrl}data/generated/gendata-nav-adventure-book-index.json`),
			ExcludeUtil.pInitialise(),
		]);
		const [prerelease, brew] = await Promise.all([
			PrereleaseUtil.pGetBrewProcessed(),
			BrewUtil2.pGetBrewProcessed(),
		]);

		[
			{
				prop: "book",
				parentCategoryPath: [NavBar._CAT_RULES, NavBar._CAT_BOOKS],
				page: "book.html",
				fnSort: SortUtil.ascSortBook.bind(SortUtil),
			},
			{
				prop: "adventure",
				page: "adventure.html",
				parentCategoryPath: [NavBar._CAT_DUNGEON_MASTER, NavBar._CAT_ADVENTURES],
				fnSort: SortUtil.ascSortAdventure.bind(SortUtil),
			},
		].forEach(({prop, parentCategoryPath, page, fnSort}) => {
			const fromPrerelease = MiscUtil.copyFast(prerelease?.[prop] || []);
			const fromBrew = MiscUtil.copyFast(brew?.[prop] || []);

			const mutParentName = (it) => {
				if (it.parentSource) it.parentName = Parser.sourceJsonToFull(it.parentSource);
			};

			fromPrerelease.forEach(mutParentName);
			fromBrew.forEach(mutParentName);

			const metas = [...adventureBookIndex[prop], ...fromPrerelease, ...fromBrew]
				.filter(it => !ExcludeUtil.isExcluded(UrlUtil.encodeForHash(it.id), prop, it.source, {isNoCount: true}));

			if (!metas.length) return;

			SourceUtil.ADV_BOOK_GROUPS
				.forEach(({group, displayName}) => {
					const inGroup = metas.filter(it => (it.group || "other") === group);
					if (!inGroup.length) return;

					this._addElement_divider({keyPath: parentCategoryPath});
					this._addElement_label({keyPath: parentCategoryPath, html: displayName, isAddDateSpacer: true});

					const seenYears = new Set();

					inGroup
						.sort(fnSort)
						.forEach(indexMeta => {
							const year = indexMeta.published ? (new Date(indexMeta.published).getFullYear()) : null;
							const isNewYear = year != null && !seenYears.has(year);
							if (year != null) seenYears.add(year);

							if (indexMeta.parentSource) {
								if (!this._tree.getNode({keyPath: [...parentCategoryPath, indexMeta.parentName], isAllowNull: true})) {
									this._addElement_accordion(
										{
											keyPath: parentCategoryPath,
											category: indexMeta.parentName,
											date: isNewYear ? year : null,
											source: indexMeta.parentSource,
											isAddDateSpacer: !isNewYear,
										},
									);
								}

								let cleanName = indexMeta.name.startsWith(indexMeta.parentName)
									? indexMeta.name.slice(indexMeta.parentName.length).replace(/^:\s+/, "")
									: indexMeta.name;
								this._addElement_li(
									{
										keyPath: [...parentCategoryPath, indexMeta.parentName],
										page,
										aText: cleanName,
										aHash: indexMeta.id,
										isAddDateSpacer: true,
										isSide: true,
										isInAccordion: true,
									},
								);

								return;
							}

							this._addElement_li(
								{
									keyPath: parentCategoryPath,
									page,
									aText: indexMeta.name,
									aHash: indexMeta.id,
									date: isNewYear ? year : null,
									isAddDateSpacer: !isNewYear,
									source: indexMeta.source,
									isSide: true,
								},
							);
						});
				});
		});

		NavBar.highlightCurrentPage();
	}

	/**
	 * Adds a new item to the navigation bar. Can be used either in root, or in a different UL.
	 * @param {?Array<string>} keyPath - Element path to append this link to.
	 * @param page - Where does this link to.
	 * @param aText - What text does this link have.
	 * @param [isSide] - True if this item is part of a side menu.
	 * @param [aHash] - Optional hash to be appended to the base href
	 * @param [isExternal] - If the item is an external link.
	 * @param [isExternalMark] - If an "external link" icon should be shown.
	 * @param [date] - A date to prefix the list item with.
	 * @param [title] - Title for this nav item.
	 * @param [isAddDateSpacer] - True if this item has no date, but is in a list of items with dates.
	 * @param [source] - A source associated with this item, which should be displayed as a colored marker.
	 * @param [isInAccordion] - True if this item is inside an accordion.
	 *        FIXME(Future) this is a bodge; refactor the navbar CSS to avoid using Bootstrap.
	 */
	static _addElement_li (
		{
			keyPath = null,
			page,
			aText,
			isSide,
			aHash,
			isExternal,
			isExternalMark,
			date,
			title,
			isAddDateSpacer,
			source,
			isInAccordion,
		},
	) {
		const parentNode = this._tree.getNode({keyPath});

		const hashPart = aHash ? `#${aHash}`.toLowerCase() : "";
		const href = `${page}${hashPart}`;

		const li = document.createElement("li");
		li.setAttribute("role", "presentation");
		li.setAttribute("data-page", href);
		if (keyPath == null) {
			li.classList.add("page__nav-hidden-mobile");
			li.classList.add("page__btn-nav-root");
		}
		if (isSide) {
			li.onmouseenter = function () { NavBar._handleSideItemMouseEnter(this); };
		} else {
			li.onmouseenter = function () { NavBar._handleItemMouseEnter(this); };
			li.onclick = function () { NavBar._dropdowns.forEach(ele => NavBar._closeDropdownElement(ele)); };
		}
		if (title) li.setAttribute("title", title);

		const a = document.createElement("a");
		a.href = href;
		a.innerHTML = `${this._addElement_getDatePrefix({date: date, isAddDateSpacer: isAddDateSpacer})}${this._addElement_getSourcePrefix({source: source})}${aText}${this._addElement_getSourceSuffix({source: source})}`;
		a.classList.add("nav__link");
		if (isInAccordion) a.classList.add(`nav2-accord__lnk-item`, `ve-inline-block`, `w-100`);

		if (isExternal) {
			a.setAttribute("target", "_blank");
			a.setAttribute("rel", "noopener noreferrer");
		}
		if (isExternalMark) {
			a.classList.add("inline-split-v-center");
			a.classList.add("w-100");
			a.innerHTML = `<span>${aText}</span><span class="glyphicon glyphicon-new-window"></span>`;
		}

		li.appendChild(a);
		parentNode.getBodyElement().appendChild(li);

		parentNode.addNode({
			key: href,
			isLeaf: true,
			node: new NavBar.NodeLink({
				parent: parentNode,
				head: li,
				isInAccordion: isInAccordion,
				lnk: a,
			}),
		});
	}

	static _addElement_accordion (
		{
			keyPath,
			category,
			date = null,
			isAddDateSpacer = false,
			source = null,
		} = {},
	) {
		const parentNode = this._tree.getNode({keyPath});

		const li = document.createElement("li");
		li.className = "nav2-accord__wrp";
		li.onmouseenter = function () { NavBar._handleItemMouseEnter(this); };

		// region Header button
		const wrpHead = document.createElement("div");
		wrpHead.className = "nav2-accord__head split-v-center clickable";
		wrpHead.onclick = evt => {
			evt.stopPropagation();
			evt.preventDefault();
			node.isExpanded = !node.isExpanded;
		};

		const dispText = document.createElement("div");
		dispText.innerHTML = `${this._addElement_getDatePrefix({date, isAddDateSpacer})}${this._addElement_getSourcePrefix({source})}${category}`;

		const dispToggle = document.createElement("div");
		dispToggle.textContent = NavBar.NodeAccordion.getDispToggleDisplayHtml(false);

		wrpHead.appendChild(dispText);
		wrpHead.appendChild(dispToggle);
		// endregion

		// region Body list
		const wrpBody = document.createElement("div");
		wrpBody.className = `nav2-accord__body ve-hidden`;
		wrpBody.onclick = function (event) { event.stopPropagation(); };
		// endregion

		li.appendChild(wrpHead);
		li.appendChild(wrpBody);
		parentNode.getBodyElement().appendChild(li);

		const node = new NavBar.NodeAccordion({
			parent: parentNode,
			head: wrpHead,
			body: wrpBody,
			dispToggle,
		});

		parentNode.addNode({
			key: category,
			node,
		});
	}

	static _addElement_getDatePrefix ({date, isAddDateSpacer}) { return `${(date != null || isAddDateSpacer) ? `<div class="ve-small mr-2 page__nav-date ve-inline-block ve-text-right inline-block" aria-hidden="true">${date || ""}</div>` : ""}`; }
	static _addElement_getSourcePrefix ({source}) { return `${source != null ? `<div class="nav2-list__disp-source ${Parser.sourceJsonToSourceClassname(source)}"></div>` : ""}`; }

	static _addElement_getSourceSuffix ({source}) {
		if (source == null) return "";
		return Parser.sourceJsonToMarkerHtml(source, {isAddBrackets: true, additionalStyles: "ml-1 nav2-list__disp-legacy-marker"});
	}

	static _addElement_divider ({keyPath}) {
		const parentNode = this._tree.getNode({keyPath});

		const li = document.createElement("li");
		li.setAttribute("role", "presentation");
		li.className = "ve-dropdown-divider";

		parentNode.getBodyElement().appendChild(li);
	}

	static _addElement_label ({keyPath, html, date = null, isAddDateSpacer = false} = {}) {
		const parentNode = this._tree.getNode({keyPath});

		const li = document.createElement("li");
		li.setAttribute("role", "presentation");
		li.className = "italic ve-muted ve-small nav2-list__label";
		li.innerHTML = `${this._addElement_getDatePrefix({date, isAddDateSpacer})}${html}`;

		parentNode.getBodyElement().appendChild(li);
	}

	/**
	 * Adds a new dropdown starting list to the navigation bar
	 * @param {?Array<string>} keyPath - Element path to append this link to.
	 * @param {string} category - Element category to create.
	 * @param {boolean} [isSide=false] - If this is a sideways dropdown.
	 * @param {string} [page=null] - The page this dropdown is associated with.
	 */
	static _addElement_dropdown ({keyPath = null, category, isSide = false, page = null} = {}) {
		const parentNode = this._tree.getNode({keyPath});

		const li = document.createElement("li");
		li.setAttribute("role", "presentation");
		li.className = `dropdown dropdown--navbar page__nav-hidden-mobile ${isSide ? "" : "page__btn-nav-root"}`;
		if (isSide) {
			li.onmouseenter = function () { NavBar._handleSideItemMouseEnter(this); };
		} else {
			li.onmouseenter = function () { NavBar._handleItemMouseEnter(this); };
		}

		const a = document.createElement("a");
		a.className = "ve-dropdown-toggle";
		a.href = "#";
		a.setAttribute("role", "button");
		a.setAttribute("aria-haspopup", "true");
		a.onclick = function (event) { NavBar._handleDropdownClick(this, event, isSide); };
		if (isSide) {
			a.onmouseenter = function () { NavBar._handleSideDropdownMouseEnter(this); };
			a.onmouseleave = function () { NavBar._handleSideDropdownMouseLeave(this); };
			a
				.addEventListener("keydown", evt => {
					if (evt.key !== "Enter") return;

					if (NavBar._isDropdownOpen(a)) NavBar._closeDropdown(a);
					else NavBar._openDropdown(a);
				});

			a.setAttribute("aria-haspopup", "true");
		}
		a.innerHTML = `${category} <span class="caret ${isSide ? "caret--right" : ""}"></span>`;

		const ul = document.createElement("ul");
		ul.setAttribute("role", "menu");
		ul.className = `ve-dropdown-menu ${isSide ? "ve-dropdown-menu--side" : "ve-dropdown-menu--top"}`;
		ul.onclick = function (event) { event.stopPropagation(); };

		li.appendChild(a);
		li.appendChild(ul);
		parentNode.getBodyElement().appendChild(li);

		parentNode.addNode({
			key: category,
			node: new NavBar.Node({
				parent: parentNode,
				head: li,
				body: ul,
			}),
		});
	}

	/**
	 * Special LI for button
	 * @param {?Array<string>} keyPath - Element path to append this link to.
	 * @param html Button text.
	 * @param click Button click handler.
	 * @param [context] Button context menu handler.
	 * @param title Button title.
	 * @param className Additional button classes.
	 */
	static _addElement_button (
		{
			keyPath = null,
			html,
			click,
			context = null,
			title,
			className,
		},
	) {
		const parentNode = this._tree.getNode({keyPath});

		const li = document.createElement("li");
		li.setAttribute("role", "presentation");

		const eleSpan = document.createElement("span");
		if (className) eleSpan.className = className;
		eleSpan.onclick = click;
		eleSpan.innerHTML = html;

		if (context) eleSpan.oncontextmenu = context;

		if (title) li.setAttribute("title", title);

		li.appendChild(eleSpan);
		parentNode.getBodyElement().appendChild(li);
	}

	/**
	 * Special LI for button
	 * @param {?Array<string>} keyPath - Element path to append this link to.
	 * @param metas
	 */
	static _addElement_buttonSplit (
		{
			keyPath = null,
			metas,
		},
	) {
		const parentNode = this._tree.getNode({keyPath});

		const li = document.createElement("li");
		li.setAttribute("role", "presentation");
		li.className = "ve-flex-v-center";

		metas
			.forEach(({className, click, html, title}, i) => {
				const eleSpan = document.createElement("span");

				eleSpan.className = [
					className,
					"ve-inline-block",
					i ? null : "w-100 min-w-0",
				]
					.filter(Boolean)
					.join(" ");

				eleSpan.onclick = click;
				eleSpan.innerHTML = html;

				if (title) eleSpan.setAttribute("title", title);

				li.appendChild(eleSpan);
			});

		parentNode.getBodyElement().appendChild(li);
	}

	static _getCurrentPage () {
		let currentPage = window.location.pathname;
		currentPage = currentPage.substr(currentPage.lastIndexOf("/") + 1);

		if (!currentPage) currentPage = "index.html";
		return currentPage.trim();
	}

	static _getCurrentWikiHelpPage () {
		const slug = NavBar._getCurrentPage().replace(/.html$/i, "");
		return `https://wiki.tercept.net/en/5eTools/HelpPages/${slug === "index" ? "" : slug}`;
	}

	static highlightCurrentPage () {
		let currentPage = NavBar._getCurrentPage();
		let hash = "";

		if (typeof _SEO_PAGE !== "undefined") currentPage = `${_SEO_PAGE}.html`;
		else if (currentPage.toLowerCase() === "book.html" || currentPage.toLowerCase() === "adventure.html") {
			hash = window.location.hash.split(",")[0].toLowerCase();
		}

		const href = `${currentPage}${hash}`;

		NavBar._tree.doRemoveAllPageHighlights();
		const node = this._tree.getLeafNode({key: href, isAllowNull: true});
		if (!node) return;

		node.isActive = true;
	}

	static _handleDropdownClick (ele, event, isSide) {
		event.preventDefault();
		event.stopPropagation();
		if (isSide) return;
		const isOpen = this._isDropdownOpen(ele);
		if (isOpen) NavBar._dropdowns.forEach(ele => NavBar._closeDropdownElement(ele));
		else NavBar._openDropdown(ele);
	}

	/* -------------------------------------------- */

	static _isDropdownOpen (ele) {
		return ele.parentNode.classList.contains("open");
	}

	/* -------------------------------------------- */

	static _closeDropdown (ele) {
		this._closeDropdownElement(ele.parentNode);
	}

	static _closeDropdownElement (ele) {
		ele.classList.remove("open");
		ele.firstChild.setAttribute("aria-expanded", "false");
	}

	static _closeAllDropdowns () {
		NavBar._dropdowns.forEach(ele => NavBar._closeDropdownElement(ele));
	}

	/* -------------------------------------------- */

	static _openDropdown (ele) {
		const lisOpen = [];

		let parent = ele.parentNode;
		NavBar._openDropdownElement(parent);
		lisOpen.push(parent);

		do {
			parent = parent.parentNode;
			if (parent.nodeName === "LI") {
				NavBar._openDropdownElement(parent);
				lisOpen.push(parent);
			}
		} while (parent.nodeName !== "NAV");

		NavBar._dropdowns.filter(ele => !lisOpen.includes(ele)).forEach(ele => NavBar._closeDropdownElement(ele));

		this._openDropdown_mutAlignment({liNavbar: lisOpen.slice(-1)[0]});
	}

	static _openDropdownElement (ele) {
		ele.classList.add("open");
		ele.firstChild.setAttribute("aria-expanded", "true");
	}

	/**
	 * If a dropdown
	 * @param liNavbar
	 * @private
	 */
	static _openDropdown_mutAlignment ({liNavbar}) {
		const uls = [...liNavbar.querySelectorAll("ul.ve-dropdown-menu")];
		const widthRequired = window.innerWidth < 1200
			? Math.max(...uls.map(ul => ul.getBoundingClientRect().width))
			: uls.map(ul => ul.getBoundingClientRect().width).reduce((a, b) => a + b, 0);

		const isForceRightAlign = liNavbar.getBoundingClientRect().left >= (window.innerWidth - widthRequired);

		uls.forEach(ul => {
			ul.style.left = isForceRightAlign ? `${-Math.round(ul.getBoundingClientRect().width) + ul.parentNode.getBoundingClientRect().width}px` : "";
		});
	}

	/* -------------------------------------------- */

	static _handleItemMouseEnter (ele) {
		ele = e_(ele);
		const timerIds = ele.siblings("[data-timer-id]").map(eleSib => ({ele: e_(eleSib), timerId: e_(eleSib).attr("data-timer-id")}));
		timerIds.forEach(({ele, timerId}) => {
			if (NavBar._timersOpen[timerId]) {
				clearTimeout(NavBar._timersOpen[timerId]);
				delete NavBar._timersOpen[timerId];
			}

			if (!NavBar._timersClose[timerId] && ele.hasClass("open")) {
				const getTimeoutFn = () => {
					if (NavBar._timerMousePos[timerId]) {
						const [xStart] = NavBar._timerMousePos[timerId];
						// for generalised use, this should be made check against the bounding box for the side menu
						// and possibly also check Y pos; e.g.
						// || EventUtil._mouseY > yStart + NavBar._MIN_MOVE_PX
						if (EventUtil._mouseX > xStart + NavBar._MIN_MOVE_PX) {
							NavBar._timerMousePos[timerId] = [EventUtil._mouseX, EventUtil._mouseY];
							NavBar._timersClose[timerId] = setTimeout(() => getTimeoutFn(), NavBar._DROP_TIME / 2);
						} else {
							NavBar._closeDropdownElement(ele);
							delete NavBar._timersClose[timerId];
						}
					} else {
						NavBar._closeDropdownElement(ele);
						delete NavBar._timersClose[timerId];
					}
				};

				NavBar._timersClose[timerId] = setTimeout(() => getTimeoutFn(), NavBar._DROP_TIME);
			}
		});
	}

	static _handleSideItemMouseEnter (ele) {
		const timerId = e_(ele).closest(`li.dropdown`).attr("data-timer-id");
		if (NavBar._timersClose[timerId]) {
			clearTimeout(NavBar._timersClose[timerId]);
			delete NavBar._timersClose[timerId];
			delete NavBar._timerMousePos[timerId];
		}
	}

	static _handleSideDropdownMouseEnter (ele) {
		ele = e_(ele);
		const timerId = ele.parente().attr("data-timer-id") || NavBar._timerId++;
		ele.parente().attr("data-timer-id", timerId);

		if (NavBar._timersClose[timerId]) {
			clearTimeout(NavBar._timersClose[timerId]);
			delete NavBar._timersClose[timerId];
		}

		if (!NavBar._timersOpen[timerId]) {
			NavBar._timersOpen[timerId] = setTimeout(() => {
				NavBar._openDropdown(ele);
				delete NavBar._timersOpen[timerId];
				NavBar._timerMousePos[timerId] = [EventUtil._mouseX, EventUtil._mouseY];
			}, NavBar._DROP_TIME);
		}
	}

	static _handleSideDropdownMouseLeave (ele) {
		ele = e_(ele);
		if (!ele.parente().attr("data-timer-id")) return;
		const timerId = ele.parente().attr("data-timer-id");
		clearTimeout(NavBar._timersOpen[timerId]);
		delete NavBar._timersOpen[timerId];
	}

	static _clearAllTimers () {
		Object.entries(NavBar._timersOpen).forEach(([k, v]) => {
			clearTimeout(v);
			delete NavBar._timersOpen[k];
		});
	}
}

NavBar.InteractionManager = class {
	static async _pOnClick_button_saveStateFile (evt) {
		evt.preventDefault();
		const sync = StorageUtil.syncGetDump();
		const async = await StorageUtil.pGetDump();
		const syncStyle = globalThis.styleSwitcher.constructor.syncGetStorageDump();
		const dump = {sync, async, syncStyle};
		DataUtil.userDownload("5etools", dump, {fileType: "5etools"});
	}

	static async _pOnClick_button_loadStateFile (evt) {
		evt.preventDefault();
		const {jsons, errors} = await InputUiUtil.pGetUserUploadJson({expectedFileTypes: ["5etools"]});

		DataUtil.doHandleFileLoadErrorsGeneric(errors);

		if (!jsons?.length) return;
		const dump = jsons[0];

		try {
			StorageUtil.syncSetFromDump(dump.sync);
			await StorageUtil.pSetFromDump(dump.async);
			globalThis.styleSwitcher.constructor.syncSetFromStorageDump(dump.syncStyle);
			location.reload();
		} catch (e) {
			JqueryUtil.doToast({type: "danger", content: `Failed to load state! ${VeCt.STR_SEE_CONSOLE}`});
			throw e;
		}
	}

	static async _pOnClick_button_addApp (evt) {
		evt.preventDefault();

		// Unavailable on Firefox
		// See:
		//  - https://developer.mozilla.org/en-US/docs/Web/API/BeforeInstallPromptEvent
		//  - https://developer.mozilla.org/en-US/docs/Web/API/Window/beforeinstallprompt_event
		if (!NavBar._cachedInstallEvent) {
			JqueryUtil.doToast({type: "warning", content: `Could not install app! Your browser may not support this feature.`});
			return;
		}

		try {
			NavBar._cachedInstallEvent.prompt();
		} catch (e) {
			// Ignore errors
		}
	}

	static async _pOnClick_button_preloadOffline (evt, {route, isRequireImages = false}) {
		evt.preventDefault();

		if (globalThis.swCacheRoutes === undefined) {
			JqueryUtil.doToast(`The loader was not yet available! Reload the page and try again. If this problem persists, your browser may not support preloading.`);
			return;
		}

		if (isRequireImages && globalThis.DEPLOYED_IMG_ROOT) {
			JqueryUtil.doToast({
				type: "danger",
				content: `The "${evt.currentTarget.innerText.split("(")[0].trim()}" option is not currently supported on this site version. Try again some other time!`,
			});
			return;
		}

		globalThis.swCacheRoutes(route);
	}

	static async _pOnClick_button_clearOffline (evt) {
		evt.preventDefault();

		if (globalThis.swResetAll === undefined) {
			JqueryUtil.doToast(`The loader was not yet available! Reload the page and try again. If this problem persists, your browser may not support preloading.`);
			return;
		}

		globalThis.swResetAll();
	}
};

NavBar.Node = class {
	constructor ({parent, head, body}) {
		this._root = parent?._root || this;
		this._parent = parent;
		this._head = head;
		this._body = body;
		this._children = {};

		this._leafLookup = {};

		this._isActive = false;
	}

	getBodyElement () {
		return this._body;
	}

	addNode (
		{
			key,
			isLeaf = false,
			node,
		},
	) {
		this._children[key] = node;
		if (!isLeaf) return;
		this._root._leafLookup[key] = node;
	}

	getNode ({keyPath, isAllowNull = false}) {
		if (!keyPath?.length) return this;
		const [key, ...nextKeys] = keyPath;
		const node = this._children[key];
		if (!node) {
			if (isAllowNull) return null;
			throw new Error(`Node for key path "${keyPath.join(".")}" did not exist!`);
		}
		return node.getNode({keyPath: [...nextKeys], isAllowNull});
	}

	getLeafNode ({key, isAllowNull}) {
		if (!key) throw new Error(`A "key" argument must be provided!`);
		const node = this._root._leafLookup[key];
		if (!node) {
			if (isAllowNull) return null;
			throw new Error(`Node for leaf key "${key}" did not exist!`);
		}
		return node;
	}

	doRemoveAllPageHighlights () {
		this.isActive = false;
		Object.values(this._children)
			.forEach(node => node.doRemoveAllPageHighlights());
	}

	set isActive (val) {
		this._isActive = !!val;
		this?._head?.classList?.toggle("active", this._isActive);
		if (this._parent) this._parent.isActive = this._isActive;
	}

	get isActive () {
		return this._isActive;
	}
};

NavBar.NodeLink = class extends NavBar.Node {
	constructor ({isInAccordion, lnk, ...rest}) {
		super(rest);
		this._isInAccordion = !!isInAccordion;
		this._lnk = lnk;
	}

	set isActive (val) {
		if (!this._isInAccordion) {
			super.isActive = val;
			return;
		}

		this._isActive = !!val;
		this._lnk.classList.toggle("nav2-accord__lnk-item--active", this._isActive);
		if (this._parent) this._parent.isActive = this._isActive;
	}

	get isActive () { // Overriding the setter clobbers the getter, so, re-make it
		return super.isActive;
	}
};

NavBar.NodeAccordion = class extends NavBar.Node {
	static getDispToggleDisplayHtml (val) { return val ? `[\u2212]` : `[+]`; }

	constructor ({dispToggle, ...rest}) {
		super(rest);
		this._dispToggle = dispToggle;
		this._isExpanded = false;
	}

	set isActive (val) {
		this._isActive = !!val;
		this?._head?.classList?.toggle("nav2-accord__head--active", this._isActive);
		if (val && !this._isExpanded) this.isExpanded = true;
		if (this._parent) this._parent.isActive = this._isActive;
	}

	get isActive () { // Overriding the setter clobbers the getter, so, re-make it
		return super.isActive;
	}

	set isExpanded (val) {
		this._isExpanded = val;
		this?._body?.classList?.toggle("ve-hidden", !val);
		this._dispToggle.textContent = NavBar.NodeAccordion.getDispToggleDisplayHtml(val);
	}

	get isExpanded () {
		return this._isExpanded;
	}
};

NavBar.init();
