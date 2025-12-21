import {RenderMap} from "./render-map.js";
import {OmnisearchUtilsUi} from "./omnisearch/omnisearch-utils-ui.js";

export class BookUtil {
	static getHeaderText (header) {
		return header.header || header;
	}

	static _scrollClick (ixChapter, headerText, headerNumber) {
		headerText = headerText.toLowerCase().trim();

		// When handling a non-full-book header in full-book mode, map the header to the appropriate position
		if (!~BookUtil.curRender.chapter && ~ixChapter) {
			const minHeaderIx = BookUtil.curRender.allViewFirstTitleIndexes[ixChapter];
			const maxHeaderIx = BookUtil.curRender.allViewFirstTitleIndexes[ixChapter + 1] == null ? Number.MAX_SAFE_INTEGER : BookUtil.curRender.allViewFirstTitleIndexes[ixChapter + 1];

			// Loop through the list of tracked titles, starting at our chapter's first tracked title, until we hit
			const trackedTitles = BookUtil._renderer.getTrackedTitles();
			const trackedTitleIndexes = Object.keys(trackedTitles).map(it => Number(it)).sort(SortUtil.ascSort);

			// Search for a matching header between the current chapter's header start and end
			let curHeaderNumber = 0;
			const ixTitleUpper = Math.min(trackedTitleIndexes.length, maxHeaderIx) + 1; // +1 since it's 1-indexed
			for (let ixTitle = minHeaderIx; ixTitle < ixTitleUpper; ++ixTitle) {
				let titleName = trackedTitles[ixTitle];
				if (!titleName) return; // Should never occur

				titleName = titleName.toLowerCase().trim();
				if (titleName === headerText) {
					if (curHeaderNumber < headerNumber) {
						curHeaderNumber++;
						continue;
					}

					es(`[data-title-index="${ixTitle}"]`).scrollIntoView();
					break;
				}
			}

			return;
		}

		const trackedTitlesInverse = BookUtil._renderer.getTrackedTitlesInverted({isStripTags: true});

		const ixTitle = (trackedTitlesInverse[headerText] || [])[headerNumber || 0];
		if (ixTitle != null) es(`[data-title-index="${ixTitle}"]`).scrollIntoView();
	}

	static _scrollPageTop (ixChapter) {
		// In full-book view, find the Xth section
		if (ixChapter != null && !~BookUtil.curRender.chapter) {
			const ixTitle = BookUtil.curRender.allViewFirstTitleIndexes[ixChapter];
			if (ixTitle != null) es(`[data-title-index="${ixTitle}"]`).scrollIntoView();
			return;
		}

		document.getElementById(`pagecontent`).scrollIntoView();
	}

	static _sectToggle (evt, btnToggleExpand, headersBlock) {
		if (evt) {
			evt.stopPropagation();
			evt.preventDefault();
		}

		btnToggleExpand.txt(btnToggleExpand.txt() === `[+]` ? `[\u2212]` : `[+]`);
		headersBlock.toggleVe();
	}

	static _showBookContent (data, fromIndex, bookId, hashParts) {
		const ixChapterPrev = BookUtil.curRender.chapter;
		const bookIdPrev = BookUtil.curRender.curBookId;

		let ixChapter = 0;
		let scrollToHeaderText;
		let scrollToHeaderNumber;
		let isForceScroll = false;

		if (hashParts && hashParts.length > 0) ixChapter = Number(hashParts[0]);

		const isRenderingNewChapterOrNewBook = BookUtil.curRender.chapter !== ixChapter
			|| UrlUtil.encodeForHash(bookIdPrev.toLowerCase()) !== UrlUtil.encodeForHash(bookId);

		if (hashParts && hashParts.length > 1) {
			scrollToHeaderText = decodeURIComponent(hashParts[1]);

			isForceScroll = true;
			if (hashParts[2]) {
				scrollToHeaderNumber = Number(hashParts[2]);
			}

			if (BookUtil.referenceId && !isRenderingNewChapterOrNewBook) {
				const isHandledScroll = this._showBookContent_handleQuickReferenceShow({sectionHeader: scrollToHeaderText});
				if (isHandledScroll) {
					isForceScroll = false;
					scrollToHeaderText = null;
				}
			}
		} else if (BookUtil.referenceId) {
			this._showBookContent_handleQuickReferenceShowAll();
		}

		BookUtil.curRender.data = data;
		BookUtil.curRender.fromIndex = fromIndex;
		BookUtil.curRender.headerMap = Renderer.adventureBook.getEntryIdLookup(data);

		// If it's a new chapter or a new book
		if (isRenderingNewChapterOrNewBook) {
			BookUtil.curRender.curBookId = bookId;
			BookUtil.curRender.chapter = ixChapter;
			BookUtil.dispBook.html("");

			const chapterTitle = (fromIndex.contents[ixChapter] || {}).name;
			document.title = `${chapterTitle ? `${chapterTitle} - ` : ""}${fromIndex.name} - 5etools`;

			BookUtil.curRender.controls = {};
			BookUtil.dispBook.appends(Renderer.utils.getBorderTr());
			this._showBookContent_renderNavButtons({isTop: true, ixChapter, bookId, data});
			const textStack = [];
			BookUtil._renderer
				.setFirstSection(true)
				.setLazyImages(true)
				.resetHeaderIndex()
				.setHeaderIndexTableCaptions(true)
				.setHeaderIndexImageTitles(true);
			if (ixChapter === -1) {
				BookUtil.curRender.allViewFirstTitleIndexes = [];
				data.forEach(d => {
					BookUtil.curRender.allViewFirstTitleIndexes.push(BookUtil._renderer.getHeaderIndex());
					BookUtil._renderer.recursiveRender(d, textStack);
				});
			} else BookUtil._renderer.recursiveRender(data[ixChapter], textStack);
			// If there is no source, we're probably in the Quick Reference, so avoid adding the "Excluded" text, as this is a composite source.
			BookUtil.dispBook.appends(`<tr><td colspan="6" class="py-2 px-5">${fromIndex.source ? Renderer.utils.getExcludedHtml({entity: fromIndex, dataProp: BookUtil.contentType, page: UrlUtil.getCurrentPage()}) : ""}${textStack.join("")}</td></tr>`);
			Renderer.initLazyImageLoaders();
			BookUtil._renderer
				.setLazyImages(false)
				.setHeaderIndexTableCaptions(false)
				.setHeaderIndexImageTitles(false);
			this._showBookContent_renderNavButtons({ixChapter, bookId, data});

			BookUtil.dispBook.appends(Renderer.utils.getBorderTr());

			if (scrollToHeaderText) {
				let handled = false;
				if (BookUtil.referenceId) handled = this._showBookContent_handleQuickReferenceShow({sectionHeader: scrollToHeaderText});
				if (!handled) {
					AnimationUtil.pRecomputeStyles()
						.then(() => BookUtil._scrollClick(ixChapter, scrollToHeaderText, scrollToHeaderNumber));
				}
			} else {
				BookUtil._scrollPageTop();
			}
		} else {
			// It's the same chapter/same book
			if (hashParts.length <= 1) {
				if (~ixChapter) {
					if (BookUtil.referenceId) MiscUtil.scrollPageTop();
					else BookUtil._scrollPageTop();
				} else {
					if (hashParts.length === 1 && BookUtil._LAST_CLICKED_LINK) {
						const lastLink = e_({ele: BookUtil._LAST_CLICKED_LINK});
						const lastHref = lastLink.attr("href");
						const mLink = new RegExp(`^${UrlUtil.PG_ADVENTURE}#${BookUtil.curRender.curBookId},(\\d+)$`, "i").exec(lastHref.trim());
						if (mLink) {
							const linkChapterIx = Number(mLink[1]);
							const ele = es(`#pagecontent tr.text td`).childrene(`.${Renderer.HEAD_NEG_1}`)[linkChapterIx];
							if (ele) ele.scrollIntoView();
							else setTimeout(() => { throw new Error(`Failed to find header scroll target with index "${linkChapterIx}"`); });
							return;
						}
					}
				}
			} else if (isForceScroll) {
				AnimationUtil.pRecomputeStyles()
					.then(() => BookUtil._scrollClick(ixChapter, scrollToHeaderText, scrollToHeaderNumber));
			} else if (scrollToHeaderText) {
				AnimationUtil.pRecomputeStyles()
					.then(() => BookUtil._scrollClick(ixChapter, scrollToHeaderText, scrollToHeaderNumber));
			}
		}

		this._showBookContent_updateSidebar({ixChapter, ixChapterPrev, bookIdPrev, bookId});

		this._showBookContent_updateControls({ixChapter, data});

		this._removeLoadingOverlay();

		if (BookUtil._pendingPageFromHash) {
			const pageTerm = BookUtil._pendingPageFromHash;
			BookUtil._pendingPageFromHash = null;
			BookUtil._handlePageFromHash(pageTerm);
		}
	}

	static _removeLoadingOverlay () {
		es(`.bk__overlay-loading`)?.remove();
	}

	static _showBookContent_handleQuickReferenceShowAll () {
		em(`.${Renderer.HEAD_NEG_1}`)
			.forEach(ele => ele.showVe());
		em(`.rd__hr--section`)
			.forEach(ele => ele.showVe());
	}

	/**
	 * @param sectionHeader Section header to scroll to.
	 * @return {boolean} True if the scroll happened, false otherwise.
	 */
	static _showBookContent_handleQuickReferenceShow ({sectionHeader}) {
		this._showBookContent_handleQuickReferenceShowAll();

		if (sectionHeader && ~BookUtil.curRender.chapter) {
			const allSects = em(`.${Renderer.HEAD_NEG_1}`);
			const cleanSectionHead = sectionHeader.trim().toLowerCase();

			const toShow = allSects
				.filter(ele => {
					const matches = ele
						.findAll(`.rd__h .entry-title-inner`)
						.filter(eleSub => eleSub.txt().trim().toLowerCase() === cleanSectionHead);
					return !!matches.length;
				});

			if (toShow.length) {
				BookUtil.curRender.lastRefHeader = sectionHeader.toLowerCase();
				allSects
					.forEach(ele => ele.hideVe());
				em(`hr.rd__hr--section`)
					.forEach(ele => ele.hideVe());
				toShow
					.forEach(ele => ele.showVe());
				MiscUtil.scrollPageTop();
			} else BookUtil.curRender.lastRefHeader = null;

			return !!toShow.length;
		}
	}

	static _showBookContent_goToPage ({mod, isGetHref, bookId, ixChapter}) {
		const getHashPart = () => {
			const newHashParts = [bookId, ixChapter + mod];
			return newHashParts.join(HASH_PART_SEP);
		};

		const changeChapter = () => {
			window.location.hash = getHashPart();
			MiscUtil.scrollPageTop();
		};

		if (isGetHref) return getHashPart();

		if (BookUtil.referenceId && BookUtil.curRender.lastRefHeader) {
			const chap = BookUtil.curRender.fromIndex.contents[ixChapter];
			const ix = chap.headers.findIndex(it => BookUtil.getHeaderText(it).toLowerCase() === BookUtil.curRender.lastRefHeader);
			if (~ix) {
				if (chap.headers[ix + mod]) {
					const newHashParts = [bookId, ixChapter, BookUtil.getHeaderText(chap.headers[ix + mod]).toLowerCase()];
					window.location.hash = newHashParts.join(HASH_PART_SEP);
				} else {
					changeChapter();
					const nxtHeaders = BookUtil.curRender.fromIndex.contents[ixChapter + mod].headers;
					const nxtIx = mod > 0 ? 0 : nxtHeaders.length - 1;
					const newHashParts = [bookId, ixChapter + mod, nxtHeaders[nxtIx].toLowerCase()];
					window.location.hash = newHashParts.join(HASH_PART_SEP);
				}
			} else changeChapter();
		} else changeChapter();
	}

	static _showBookContent_renderNavButtons ({isTop, ixChapter, bookId, data}) {
		const tdStyle = `padding-${isTop ? "top" : "bottom"}: 6px; padding-left: 9px; padding-right: 9px;`;
		const wrpControls = ee`<div class="split"></div>`;

		ee`<tr><td colspan="6" style="${tdStyle}">${wrpControls}</td></tr>`.appendTo(BookUtil.dispBook);

		const showPrev = ~ixChapter && ixChapter > 0;
		BookUtil.curRender.controls.btnsPrv = BookUtil.curRender.controls.btnsPrv || [];
		let btnPrev;
		if (BookUtil.referenceId) {
			btnPrev = ee`<button class="ve-btn ve-btn-xs ve-btn-default bk__nav-head-foot-item no-print"><span class="glyphicon glyphicon-chevron-left"></span>Previous</button>`
				.onn("click", () => this._showBookContent_goToPage({mod: -1, bookId, ixChapter}));
		} else {
			btnPrev = ee`<a href="#${this._showBookContent_goToPage({mod: -1, isGetHref: true, bookId, ixChapter})}" class="ve-btn ve-btn-xs ve-btn-default bk__nav-head-foot-item no-print"><span class="glyphicon glyphicon-chevron-left"></span>Previous</a>`
				.onn("click", () => MiscUtil.scrollPageTop());
		}
		btnPrev
			.toggleVe(showPrev)
			.appendTo(wrpControls);
		BookUtil.curRender.controls.btnsPrv.push(btnPrev);

		(BookUtil.curRender.controls.divsPrv = BookUtil.curRender.controls.divsPrv || [])
			.push(ee`<div class="bk__nav-head-foot-item no-print"></div>`
				.toggleVe(!showPrev)
				.appendTo(wrpControls));

		if (isTop) this._showBookContent_renderNavButtons_top({bookId, wrpControls});
		else this._showBookContent_renderNavButtons_bottom({bookId, wrpControls});

		const showNxt = ~ixChapter && ixChapter < data.length - 1;
		BookUtil.curRender.controls.btnsNxt = BookUtil.curRender.controls.btnsNxt || [];
		let btnNext;
		if (BookUtil.referenceId) {
			btnNext = ee`<button class="ve-btn ve-btn-xs ve-btn-default bk__nav-head-foot-item no-print">Next<span class="glyphicon glyphicon-chevron-right"></span></button>`
				.onn("click", () => this._showBookContent_goToPage({mod: 1, bookId, ixChapter}));
		} else {
			btnNext = ee`<a href="#${this._showBookContent_goToPage({mod: 1, isGetHref: true, bookId, ixChapter})}" class="ve-btn ve-btn-xs ve-btn-default bk__nav-head-foot-item no-print">Next<span class="glyphicon glyphicon-chevron-right"></span></a>`
				.onn("click", () => MiscUtil.scrollPageTop());
		}
		btnNext
			.toggleVe(showNxt)
			.appendTo(wrpControls);
		BookUtil.curRender.controls.btnsNxt.push(btnNext);

		(BookUtil.curRender.controls.divsNxt = BookUtil.curRender.controls.divsNxt || [])
			.push(ee`<div class="bk__nav-head-foot-item no-print"></div>`
				.toggleVe(!showNxt)
				.appendTo(wrpControls));

		if (isTop) {
			BookUtil.wrpFloatControls.empty();

			let btnPrev;
			if (BookUtil.referenceId) {
				btnPrev = ee`<button class="ve-btn ve-btn-xxs ve-btn-default"><span class="glyphicon glyphicon-chevron-left"></span></button>`
					.onn("click", () => this._showBookContent_goToPage({mod: -1, bookId, ixChapter}));
			} else {
				btnPrev = ee`<a href="#${this._showBookContent_goToPage({mod: -1, isGetHref: true, bookId, ixChapter})}" class="ve-btn ve-btn-xxs ve-btn-default"><span class="glyphicon glyphicon-chevron-left"></span></a>`
					.onn("click", () => MiscUtil.scrollPageTop());
			}
			btnPrev
				.toggleVe(showPrev)
				.appendTo(BookUtil.wrpFloatControls)
				.tooltip("Previous Chapter");
			BookUtil.curRender.controls.btnsPrv.push(btnPrev);

			let btnNext;
			if (BookUtil.referenceId) {
				btnNext = ee`<button class="ve-btn ve-btn-xxs ve-btn-default"><span class="glyphicon glyphicon-chevron-right"></span></button>`
					.onn("click", () => this._showBookContent_goToPage({mod: 1, bookId, ixChapter}));
			} else {
				btnNext = ee`<a href="#${this._showBookContent_goToPage({mod: 1, isGetHref: true, bookId, ixChapter})}" class="ve-btn ve-btn-xxs ve-btn-default"><span class="glyphicon glyphicon-chevron-right"></span></a>`
					.onn("click", () => MiscUtil.scrollPageTop());
			}
			btnNext
				.toggleVe(showNxt)
				.appendTo(BookUtil.wrpFloatControls)
				.tooltip("Next Chapter");
			BookUtil.curRender.controls.btnsNxt.push(btnNext);

			BookUtil.wrpFloatControls.toggleClass("ve-btn-group", showPrev && showNxt);
			BookUtil.wrpFloatControls.toggleVe(!!~ixChapter);
		}
	}

	static _TOP_MENU = null;

	static _showBookContent_renderNavButtons_top ({bookId, wrpControls}) {
		const href = ~this.curRender.chapter
			? this._getHrefShowAll(bookId)
			: `#${UrlUtil.encodeForHash(bookId)}`;
		const btnEntireBook = ee`<a href="${href}" class="ve-btn ve-btn-xs ve-btn-default no-print ${~this.curRender.chapter ? "" : "active"}" title="Warning: Slow">View Entire ${this.contentType.uppercaseFirst()}</a>`;

		if (this._isNarrow == null) {
			const saved = StorageUtil.syncGetForPage("narrowMode");
			if (saved != null) this._isNarrow = saved;
			else this._isNarrow = false;
		}

		const hdlNarrowUpdate = () => {
			btnToggleNarrow.toggleClass("active", this._isNarrow);
			es(`#pagecontent`).toggleClass(`bk__stats--narrow`, this._isNarrow);
		};
		const btnToggleNarrow = ee`<button class="ve-btn ve-btn-xs ve-btn-default" title="Toggle Narrow Reading Width"><span class="glyphicon glyphicon-resize-small"></span></button>`
			.onn("click", () => {
				this._isNarrow = !this._isNarrow;
				hdlNarrowUpdate();
				StorageUtil.syncSetForPage("narrowMode", this._isNarrow);
			});
		hdlNarrowUpdate();

		if (!this._TOP_MENU) {
			const doDownloadFullText = () => {
				DataUtil.userDownloadText(
					`${this.curRender.fromIndex.name}.md`,
					this.curRender.data
						.map(chapter => RendererMarkdown.get().render(chapter))
						.join("\n\n------\n\n"),
				);
			};

			this._TOP_MENU = ContextUtil.getMenu([
				new ContextUtil.Action(
					"Download Chapter as Markdown",
					() => {
						if (!~BookUtil.curRender.chapter) return doDownloadFullText();

						const contentsInfo = this.curRender.fromIndex.contents[this.curRender.chapter];
						DataUtil.userDownloadText(
							`${this.curRender.fromIndex.name} - ${Parser.bookOrdinalToAbv(contentsInfo.ordinal, {isPlainText: true}).replace(/:/g, "")}${contentsInfo.name}.md`,
							RendererMarkdown.get().render(this.curRender.data[this.curRender.chapter]),
						);
					},
				),
				new ContextUtil.Action(
					`Download ${this.typeTitle} as Markdown`,
					() => {
						doDownloadFullText();
					},
				),
			]);
		}

		const btnMenu = ee`<button class="ve-btn ve-btn-xs ve-btn-default" title="Other Options"><span class="glyphicon glyphicon-option-vertical"></span></button>`
			.onn("click", evt => ContextUtil.pOpenMenu(evt, this._TOP_MENU));

		ee`<div class="no-print ve-flex-v-center ve-btn-group">${btnEntireBook}${btnToggleNarrow}${btnMenu}</div>`.appendTo(wrpControls);
	}

	static _showBookContent_renderNavButtons_bottom ({bookId, wrpControls}) {
		ee`<button class="ve-btn ve-btn-xs ve-btn-default no-print">Back to Top</button>`
			.onn("click", () => MiscUtil.scrollPageTop())
			.appendTo(wrpControls);
	}

	static _showBookContent_updateSidebar ({ixChapter, ixChapterPrev, bookIdPrev, bookId}) {
		if (ixChapter === ixChapterPrev && bookIdPrev === bookId) return;

		// region Add highlight to current section
		if (!~ixChapter) {
			// In full-book mode, remove all highlights
			BookUtil.curRender.lnksChapter.forEach(lnk => lnk.removeClass("bk__head-chapter--active"));
			Object.values(BookUtil.curRender.lnksHeader).forEach(lnks => {
				lnks.forEach(lnk => lnk.removeClass("bk__head-section--active"));
			});
		} else {
			// In regular chapter mode, add highlights to the appropriate section
			if (ixChapterPrev != null && ~ixChapterPrev) {
				if (BookUtil.curRender.lnksChapter[ixChapterPrev]) {
					BookUtil.curRender.lnksChapter[ixChapterPrev].removeClass("bk__head-chapter--active");
					(BookUtil.curRender.lnksHeader[ixChapterPrev] || []).forEach(lnk => lnk.removeClass("bk__head-section--active"));
				}
			}

			BookUtil.curRender.lnksChapter[ixChapter].addClass("bk__head-chapter--active");
			(BookUtil.curRender.lnksHeader[ixChapter] || []).forEach(lnk => lnk.addClass("bk__head-section--active"));
		}
		// endregion

		// region Toggle section expanded/not expanded
		// In full-book mode, expand all the sections
		if (!~ixChapter) {
			// If we're in "show all mode," collapse all first, then show all. Otherwise, show all.
			if (BookUtil.curRender.btnToggleExpandAll.txt() === "[\u2212]") BookUtil.curRender.btnToggleExpandAll.trigger("click");
			BookUtil.curRender.btnToggleExpandAll.trigger("click");
			return;
		}

		if (BookUtil.curRender.btnsToggleExpand[ixChapter] && BookUtil.curRender.btnsToggleExpand[ixChapter].txt() === "[+]") BookUtil.curRender.btnsToggleExpand[ixChapter].trigger("click");
		// endregion
	}

	/**
	 * Update the Previous/Next/To Top buttons at the top/bottom of the page
	 */
	static _showBookContent_updateControls ({ixChapter, data}) {
		if (BookUtil.referenceId) {
			const cnt = BookUtil.curRender.controls;

			if (~ixChapter) {
				const chap = BookUtil.curRender.fromIndex.contents[ixChapter];
				const headerIx = chap.headers.findIndex(it => BookUtil.getHeaderText(it).toLowerCase() === BookUtil.curRender.lastRefHeader);
				const renderPrev = ixChapter > 0 || (~headerIx && headerIx > 0);
				const renderNxt = ixChapter < data.length - 1 || (~headerIx && headerIx < chap.headers.length - 1);
				cnt.btnsPrv.forEach(ele => ele.toggleVe(!!renderPrev));
				cnt.btnsNxt.forEach(ele => ele.toggleVe(!!renderNxt));
				cnt.divsPrv.forEach(ele => ele.toggleVe(!renderPrev));
				cnt.divsNxt.forEach(ele => ele.toggleVe(!renderNxt));
			} else {
				cnt.btnsPrv.forEach(ele => ele.toggleVe(false));
				cnt.btnsNxt.forEach(ele => ele.toggleVe(false));
				cnt.divsPrv.forEach(ele => ele.toggleVe(true));
				cnt.divsNxt.forEach(ele => ele.toggleVe(true));
			}
		}
	}

	/* -------------------------------------------- */

	static async pInit () {
		this._initLinkGrabbers();
		this._initScrollTopFloat();
		this._initLinkReNav();
		await this._pInitLibraries();
	}

	static _initLinkGrabbers () {
		const body = e_({ele: document.body});
		body
			.onn(`mousedown`, (evt) => {
				if (!evt.target.classList.contains(`entry-title-inner`)) return;
				evt.preventDefault();
			});

		body
			.onn(`click`, async (evt) => {
				if (!evt.target.classList.contains(`entry-title-inner`)) return;

				const ele = e_({ele: evt.target});
				const text = ele.txt().trim().replace(/\.$/, "");

				if (evt.shiftKey) {
					await MiscUtil.pCopyTextToClipboard(text);
					JqueryUtil.showCopiedEffect(ele);
				} else {
					const hashParts = [BookUtil.curRender.chapter, text, ele.parente().attr("data-title-relative-index")].map(it => UrlUtil.encodeForHash(it));
					const toCopy = [`${window.location.href.split("#")[0]}#${BookUtil.curRender.curBookId}`, ...hashParts];
					await MiscUtil.pCopyTextToClipboard(toCopy.join(HASH_PART_SEP));
					JqueryUtil.showCopiedEffect(ele, {text: "Copied link!"});
				}
			},
			);
	}

	static _initScrollTopFloat () {
		const wrpScrollTop = OmnisearchUtilsUi.addScrollTopFloat();
		BookUtil.wrpFloatControls = ee`<div class="ve-flex-vh-center w-100 mb-2 ve-btn-group"></div>`.prependTo(wrpScrollTop);
	}

	static _initLinkReNav () {
		e_({ele: document.body})
			.onn("click", evt => {
				if (evt.target.tagName !== "A") return;
				BookUtil._handleCheckReNav(e_({ele: evt.target}));
			});
	}

	static async _pInitLibraries () {
		const {polylabel} = await import("../lib/polylabel.js");
		globalThis.polylabel = polylabel;
	}

	/* -------------------------------------------- */

	// custom loading to serve multiple sources
	static async booksHashChange () {
		const wrpContents = es("#lst-contents");

		const [bookIdRaw, ...hashParts] = Hist.util.getHashParts(window.location.hash, {isReturnEncoded: true});
		const bookId = decodeURIComponent(bookIdRaw);

		if (!bookId) {
			this._booksHashChange_noContent({wrpContents});
			return;
		}

		const isNewBook = BookUtil.curRender.curBookId !== bookId;

		// Handle "page:" parts
		if (hashParts.some(it => it.toLowerCase().startsWith("page:"))) {
			let term = "";

			// Remove the "page" parts, and save the first one found
			for (let i = 0; i < hashParts.length; ++i) {
				const hashPart = hashParts[i];
				if (hashPart.toLowerCase().startsWith("page:")) {
					if (!term) term = hashPart.toLowerCase().split(":")[1];
					hashParts.splice(i, 1);
					i--;
				}
			}

			// Stash the page for later use
			BookUtil._pendingPageFromHash = term;

			// Re-start the hashchange with our clean hash
			Hist.replaceHistoryHash([bookIdRaw, ...hashParts].join(HASH_PART_SEP));
			return BookUtil.booksHashChange();
		}

		// if current chapter is -1 (full book mode), and a chapter is specified, override + stay in full-book mode
		if (
			BookUtil.curRender.chapter === -1
			&& hashParts.length && hashParts[0] !== "-1"
			&& UrlUtil.encodeForHash(BookUtil.curRender.curBookId) === UrlUtil.encodeForHash(bookId)
		) {
			// Offset any unspecified header indices (i.e. those likely originating from sidebar header clicks) to match
			//   their chapter.
			const [headerName, headerIndex] = hashParts.slice(1);
			if (headerName && !headerIndex) {
				const headerNameClean = decodeURIComponent(headerName).trim().toLowerCase();
				const chapterNum = Number(hashParts[0]);
				const headerMetas = Object.values(BookUtil.curRender.headerMap)
					.filter(it => it.chapter === chapterNum && it.nameClean === headerNameClean);
				// Offset by the lowest relative title index in the chapter
				const offset = Math.min(...headerMetas.map(it => it.ixTitleRel));
				if (isFinite(offset)) hashParts[2] = `${offset}`;
			}

			Hist.replaceHistoryHash([bookIdRaw, -1, ...hashParts.slice(1)].join(HASH_PART_SEP));
			return BookUtil.booksHashChange();
		}

		const fromIndex = BookUtil.bookIndex.find(bk => UrlUtil.encodeForHash(bk.id) === UrlUtil.encodeForHash(bookId));
		if (fromIndex) {
			return this._booksHashChange_pHandleFound({fromIndex, bookId, hashParts, wrpContents, isNewBook});
		}

		// if it's prerelease/homebrew
		if (await this._booksHashChange_pDoLoadPrerelease({bookId, wrpContents, hashParts, isNewBook})) return;
		if (await this._booksHashChange_pDoLoadBrew({bookId, wrpContents, hashParts, isNewBook})) return;

		// if it's prerelease/homebrew but hasn't been loaded
		if (await this._booksHashChange_pDoFetchPrereleaseBrew({bookId, wrpContents, hashParts, isNewBook})) return;

		return this._booksHashChange_handleNotFound({wrpContents, bookId});
	}

	static async _booksHashChange_pDoLoadPrerelease ({bookId, wrpContents, hashParts, isNewBook}) {
		return this._booksHashChange_pDoLoadPrereleaseBrew({bookId, wrpContents, hashParts, isNewBook, brewUtil: PrereleaseUtil, propIndex: "bookIndexPrerelease"});
	}

	static async _booksHashChange_pDoLoadBrew ({bookId, wrpContents, hashParts, isNewBook}) {
		return this._booksHashChange_pDoLoadPrereleaseBrew({bookId, wrpContents, hashParts, isNewBook, brewUtil: BrewUtil2, propIndex: "bookIndexBrew"});
	}

	static async _booksHashChange_pDoLoadPrereleaseBrew ({bookId, wrpContents, hashParts, isNewBook, brewUtil, propIndex}) {
		const fromIndexBrew = BookUtil[propIndex].find(bk => UrlUtil.encodeForHash(bk.id) === UrlUtil.encodeForHash(bookId));
		if (!fromIndexBrew) return false;

		const brew = await brewUtil.pGetBrewProcessed();
		if (!brew[BookUtil.propHomebrewData]) return false;

		const bookData = (brew[BookUtil.propHomebrewData] || [])
			.find(bk => UrlUtil.encodeForHash(bk.id) === UrlUtil.encodeForHash(bookId));

		if (!bookData) {
			this._booksHashChange_handleNotFound({wrpContents, bookId});
			return true; // We found the book, just not its data
		}

		await this._booksHashChange_pHandleFound({fromIndex: fromIndexBrew, homebrewData: bookData, bookId, hashParts, wrpContents, isNewBook});
		return true;
	}

	static async _booksHashChange_pDoFetchPrereleaseBrew ({bookId, wrpContents, hashParts, isNewBook}) {
		const {source} = await UrlUtil.pAutoDecodeHash(bookId);

		const loaded = await DataLoader.pCacheAndGetHash(UrlUtil.getCurrentPage(), bookId, {isSilent: true});
		if (!loaded) return false;

		return [
			PrereleaseUtil,
			BrewUtil2,
		]
			.some(brewUtil => {
				if (
					brewUtil.hasSourceJson(source)
					&& brewUtil.isReloadRequired()
				) {
					brewUtil.doLocationReload({isRetainHash: true});
					return true;
				}
			});
	}

	static _booksHashChange_getCleanName (fromIndex) {
		if (fromIndex.parentSource) {
			const fullParentSource = Parser.sourceJsonToFull(fromIndex.parentSource);
			return fromIndex.name.replace(new RegExp(`^${fullParentSource.escapeRegexp()}: `, "i"), `<span title="${Parser.sourceJsonToFull(fromIndex.parentSource).qq()}">${Parser.sourceJsonToAbv(fromIndex.parentSource).qq()}</span>: `);
		}
		return fromIndex.name;
	}

	static async _booksHashChange_pHandleFound ({fromIndex, homebrewData, bookId, hashParts, wrpContents, isNewBook}) {
		document.title = `${fromIndex.name} - 5etools`;
		es(`#page__title`).html(this._booksHashChange_getCleanName(fromIndex));
		es(`#page__subtitle`).html("Browse content. Press F to find, and G to go to page.");
		await this._pLoadChapter(fromIndex, bookId, hashParts, homebrewData, wrpContents);
		NavBar.highlightCurrentPage();
		if (isNewBook) MiscUtil.scrollPageTop();
	}

	static _booksHashChange_noContent ({wrpContents}) {
		this._doPopulateContents({wrpContents});

		BookUtil.dispBook.empty().html(`<tr><th class="ve-tbl-border" colspan="6"></th></tr>
			<tr><td colspan="6" class="initial-message initial-message--med book-loading-message">Please select ${Parser.getArticle(BookUtil.contentType)} ${BookUtil.contentType} to view!</td></tr><tr><th class="ve-tbl-border" colspan="6"></th></tr>`);

		this._removeLoadingOverlay();
	}

	static _booksHashChange_handleNotFound ({wrpContents, bookId}) {
		if (!window.location.hash) return window.history.back();

		wrpContents.empty();
		BookUtil.dispBook.empty().html(`<tr><th class="ve-tbl-border" colspan="6"></th></tr>
			<tr><td colspan="6" class="initial-message initial-message--med book-loading-message">Loading failed\u2014could not find ${Parser.getArticle(BookUtil.contentType)} ${BookUtil.contentType} with ID "${bookId}". You may need to add it as homebrew first.</td></tr><tr><th class="ve-tbl-border" colspan="6"></th></tr>`);

		this._removeLoadingOverlay();

		throw new Error(`No book with ID: ${bookId}`);
	}

	static _handlePageFromHash (pageTerm) {
		// Find the first result, and jump to it if it exists
		const found = BookUtil.Search.doSearch(pageTerm, true);
		if (found.length) {
			const firstFound = found[0];
			const nxtHash = BookUtil.Search.getResultHash(BookUtil.curRender.curBookId, firstFound);
			Hist.replaceHistoryHash(nxtHash);
			return BookUtil.booksHashChange();
		} else {
			JqueryUtil.doToast({type: "warning", content: `Could not find page ${pageTerm}!`});
		}
	}

	static async _pLoadChapter (fromIndex, bookId, hashParts, homebrewData, wrpContents) {
		const data = homebrewData || (await DataUtil.loadJSON(`${BookUtil.baseDataUrl}${bookId.toLowerCase()}.json`));

		const isInitialLoad = BookUtil.curRender.curBookId !== bookId;

		if (isInitialLoad) this._doPopulateContents({wrpContents, book: fromIndex});

		BookUtil._showBookContent(BookUtil.referenceId ? data.data[BookUtil.referenceId] : data.data, fromIndex, bookId, hashParts);

		if (isInitialLoad) BookUtil._addSearch(fromIndex, bookId);
	}

	static _doPopulateContents ({wrpContents, book}) {
		wrpContents.html(BookUtil.allPageUrl ? `<div><a href="${BookUtil.allPageUrl}" class="lst__row-border lst__row-inner"><span class="bold">\u21FD ${this._getAllTitle()}</span></a></div>` : "");

		if (book) BookUtil._getRenderedContents({book}).appendTo(wrpContents);
	}

	static _getAllTitle () {
		switch (BookUtil.contentType) {
			case "adventure": return "All Adventures";
			case "book": return "All Books";
			default: throw new Error(`Unhandled book content type: "${BookUtil.contentType}"`);
		}
	}

	static _handleReNav (lnk) {
		const hash = window.location.hash.slice(1).toLowerCase();
		const linkHash = (lnk.attr("href").split("#")[1] || "").toLowerCase();
		if (hash !== linkHash) return;
		BookUtil.booksHashChange().then(null);
	}

	static _addSearch (indexData, bookId) {
		e_({ele: document.body})
			.onn("click", () => {
				if (BookUtil._findAll) BookUtil._findAll.remove();
			});

		e_({ele: document.body})
			.onn("keypress", (evt) => {
				const key = EventUtil.getKeyIgnoreCapsLock(evt);
				if ((key !== "f" && key !== "g") || !EventUtil.noModifierKeys(evt)) return;
				if (EventUtil.isInInput(evt)) return;
				evt.preventDefault();
				BookUtil._showSearchBox(indexData, bookId, key === "g");
			});

		// region Mobile only "open find bar" buttons
		const btnToTop = ee`<button class="ve-btn ve-btn-default ve-btn-sm no-print bbl-0" title="To Top"><span class="glyphicon glyphicon-arrow-up"></span></button>`
			.onn("click", evt => {
				evt.stopPropagation();
				MiscUtil.scrollPageTop();
			});

		const btnOpenFind = ee`<button class="ve-btn ve-btn-default ve-btn-sm no-print" title="Find"><kbd>F</kbd></button>`
			.onn("click", evt => {
				evt.stopPropagation();
				BookUtil._showSearchBox(indexData, bookId, false);
			});

		const btnOpenGoto = ee`<button class="ve-btn ve-btn-default ve-btn-sm no-print bbr-0" title="Go to Page"><kbd>G</kbd></button>`
			.onn("click", evt => {
				evt.stopPropagation();
				BookUtil._showSearchBox(indexData, bookId, true);
			});

		em(`.bk__wrp-btns-open-find`)
			.forEach(ele => ele.remove());
		ee`<div class="mobile-sm__visible bk__wrp-btns-open-find ve-btn-group">
			${btnToTop}${btnOpenFind}${btnOpenGoto}
		</div>`.appendTo(document.body);
	}

	static _showSearchBox (indexData, bookId, isPageMode) {
		em(`span.temp`)
			.forEach(ele => {
				const eleParent = ele.parente();
				while (ele.firstChild) eleParent.insertBefore(ele.firstChild, ele);
				ele.remove();
			});
		BookUtil._lastHighlight = null;
		if (BookUtil._findAll) BookUtil._findAll.remove();
		BookUtil._findAll = ee`<div class="f-all-wrapper"></div>`
			.onn("click", (evt) => {
				evt.stopPropagation();
			});

		const wrpResults = ee`<div class="f-all-out"></div>`
			.hideVe();

		const iptSearch = ee`<input class="form-control" placeholder="${isPageMode ? "Go to page number..." : "Find text..."}">`
			.onn("keydown", (evt) => {
				evt.stopPropagation();

				if (evt.key === "Escape" && EventUtil.noModifierKeys(evt)) {
					BookUtil._findAll.remove();
					return;
				}

				if (evt.key !== "Enter" || !EventUtil.noModifierKeys(evt)) return;

				const term = iptSearch.val();
				if (isPageMode) {
					if (!/^\d+$/.exec(term.trim())) {
						return JqueryUtil.doToast({
							content: `Please enter a valid page number.`,
							type: "danger",
						});
					}
				}

				wrpResults.html("");

				const foundEntryInfos = BookUtil.Search.doSearch(term, isPageMode);

				if (!foundEntryInfos.length) {
					wrpResults.hideVe();
					return;
				}

				wrpResults.showVe();
				foundEntryInfos
					.forEach(foundEntryInfo => {
						const row = ee`<p class="f-result"></p>`;
						const ptLink = ee`<span></span>`;
						const isLitTitle = foundEntryInfo.headerMatches && !foundEntryInfo.page;
						const link = ee`<a href="#${BookUtil.Search.getResultHash(bookId, foundEntryInfo)}">
								<i>${Parser.bookOrdinalToAbv(indexData.contents[foundEntryInfo.ch].ordinal)} ${indexData.contents[foundEntryInfo.ch].name}${foundEntryInfo.header ? ` \u2013 ${isLitTitle ? `<span class="ve-highlight">` : ""}${foundEntryInfo.header}${isLitTitle ? `</span>` : ""}` : ""}</i>
							</a>`
							.onn("click", () => BookUtil._handleCheckReNav(link));
						ptLink.appends(link);
						row.appends(ptLink);

						if (!isPageMode && foundEntryInfo.previews) {
							const lnkPreview = ee`<a href="#${BookUtil.Search.getResultHash(bookId, foundEntryInfo)}"></a>`
								.appendTo(row);

							const re = new RegExp(foundEntryInfo.term.escapeRegexp(), "gi");

							lnkPreview.onn("click", () => {
								BookUtil._handleCheckReNav(lnkPreview);

								setTimeout(() => {
									if (BookUtil._lastHighlight === null || BookUtil._lastHighlight !== foundEntryInfo.term.toLowerCase()) {
										BookUtil._lastHighlight = foundEntryInfo.term;
										const searchTerm = foundEntryInfo.term.toLowerCase().trim();
										es(`#pagecontent`)
											.findAll(`p, li, td, a`)
											.filter(ele => {
												const matchingNodes = Array.from(ele.childNodes)
													.filter(eleChild => eleChild.nodeType === Node.TEXT_NODE)
													.filter(eleChild => eleChild.nodeValue.toLowerCase().trim().includes(`${searchTerm}`));
												return !!matchingNodes.length;
											})
											.forEach(ele => {
												ele.html(
													ele.html().replace(re, "<span class='temp ve-highlight'>$&</span>"),
												);
											});
									}
								}, 15);
							});

							lnkPreview.html(
								foundEntryInfo.previews
									.map(ptPreview => `<span>${ptPreview}</span>`)
									.join(" ... "),
							);

							link.onn("click", () => lnkPreview.trigger("click"));
						} else {
							if (foundEntryInfo.page) {
								const ptPage = ee`<span>Page ${foundEntryInfo.page}</span>`;
								row.appends(ptPage);
							}
						}

						wrpResults.appends(row);
					});
			});
		BookUtil._findAll.appends(iptSearch).appends(wrpResults);

		e_({ele: document.body}).appends(BookUtil._findAll);

		iptSearch.focuse();
	}

	static _getRenderedContents (options) {
		const book = options.book;

		BookUtil.curRender.btnsToggleExpand = [];
		BookUtil.curRender.lnksChapter = [];
		BookUtil.curRender.lnksHeader = {};

		BookUtil.curRender.btnToggleExpandAll = ee`<span title="Expand All" class="px-2 bold py-1p no-select clickable no-select">${BookUtil.isDefaultExpandedContents ? `[\u2212]` : `[+]`}</span>`
			.onn("click", () => {
				const isExpanded = BookUtil.curRender.btnToggleExpandAll.txt() !== `[+]`;
				BookUtil.curRender.btnToggleExpandAll.txt(isExpanded ? `[+]` : `[\u2212]`).tooltip(isExpanded ? `Collapse All` : `Expand All`);

				BookUtil.curRender.btnsToggleExpand.forEach(btn => {
					if (!btn) return;
					if (btn.txt() !== BookUtil.curRender.btnToggleExpandAll.txt()) btn.trigger("click");
				});
			});

		const eles = [];
		options.book.contents.map((chapter, ixChapter) => {
			const btnToggleExpand = !chapter.headers ? null : ee`<span class="px-2 bold">[\u2212]</span>`
				.onn("click", evt => {
					BookUtil._sectToggle(evt, btnToggleExpand, chapterBlock);
				});
			BookUtil.curRender.btnsToggleExpand.push(btnToggleExpand);

			const lnk = ee`<a href="${options.isAddPrefix || ""}#${UrlUtil.encodeForHash(options.book.id)},${ixChapter}" class="lst__row-border lst__row-inner lst__row lst__wrp-cells bold">
					<span class="w-100">${Parser.bookOrdinalToAbv(chapter.ordinal)}${chapter.name}</span>
					${btnToggleExpand}
			</a>`
				.onn("click", () => BookUtil._scrollPageTop(ixChapter));
			BookUtil.curRender.lnksChapter.push(lnk);

			const header = ee`<div class="ve-flex-col">${lnk}</div>`;
			eles.push(header);

			const chapterBlock = BookUtil._getContentsChapterBlock({bookId: options.book.id, ixChapter, chapter, isAddPrefix: options.isAddPrefix});
			eles.push(chapterBlock);

			if (!BookUtil.isDefaultExpandedContents && btnToggleExpand) BookUtil._sectToggle(null, btnToggleExpand, chapterBlock);
		});

		return ee`<div class="contents-item" data-bookid="${UrlUtil.encodeForHash(book.id)}">
			<div class="bk__contents-header">
				<a href="#${UrlUtil.encodeForHash(book.id)}" class="bk__contents_header_link lst__wrp-cells lst__row-inner bold" title="${book.name}">
					<span class="name">${book.name}</span>
				</a>
				<div class="ve-flex-v-center">
					<a href="${this._getHrefShowAll(book.id)}" class="bk__contents_show_all px-2 py-1p ve-flex-v-center lst__wrp-cells lst__row-inner" title="View Entire ${BookUtil.contentType.uppercaseFirst()} (Warning: Slow)">
						<span class="glyphicon glyphicon glyphicon-book" style="top: 0;"></span>
					</a>
					${BookUtil.curRender.btnToggleExpandAll}
				</div>
			</div>
			<div class="bk-contents pl-4 ml-2">
				${eles}
			</div>
		</div>`;
	}

	static _getContentsSectionHeader (header) {
		// handle entries with depth
		if (header.depth) return `<span class="bk-contents__sub_spacer--1">\u2013</span>${header.header}`;
		if (header.header) return header.header;
		return header;
	}

	static _getContentsChapterBlock ({bookId, ixChapter, chapter, isAddPrefix = false}) {
		const headerCounts = {};

		const eles = [];

		chapter.headers && chapter.headers.forEach(h => {
			const headerText = BookUtil.getHeaderText(h);

			const headerTextClean = headerText.toLowerCase().trim();
			const headerPos = headerCounts[headerTextClean] || 0;
			headerCounts[headerTextClean] = (headerCounts[headerTextClean] || 0) + 1;

			// (Prefer the user-specified `h.index` over the auto-calculated headerPos)
			const headerIndex = h.index ?? headerPos;

			const displayText = this._getContentsSectionHeader(h);

			const lnk = ee`<a href="${isAddPrefix || ""}#${UrlUtil.encodeForHash(bookId)},${ixChapter},${UrlUtil.encodeForHash(headerText)}${headerIndex > 0 ? `,${headerIndex}` : ""}" data-book="${bookId}" data-chapter="${ixChapter}" data-header="${headerText.escapeQuotes()}" class="lst__row lst__row-border lst__row-inner lst__wrp-cells">${displayText}</a>`
				.onn("click", () => {
					BookUtil._scrollClick(ixChapter, headerText, headerIndex);
				});

			const lnkEle = ee`<div class="ve-flex-col">
				${lnk}
			</div>`;
			eles.push(lnkEle);

			(this.curRender.lnksHeader[ixChapter] ||= []).push(lnk);
		});

		return ee`<div class="ve-flex-col pl-4 ml-2">
			${eles}
		</div>`;
	}

	static _handleCheckReNav (lnk) {
		BookUtil._LAST_CLICKED_LINK = lnk;

		if (`#${lnk.getAttribute("href").split("#")[1] || ""}` === window.location.hash) BookUtil._handleReNav(lnk);
	}

	static _getHrefShowAll (bookId) { return `#${UrlUtil.encodeForHash(bookId)},-1`; }
}
// region Last render/etc
BookUtil.curRender = {
	curBookId: "NONE",
	chapter: null, // -1 represents "entire book"
	data: {},
	fromIndex: {},
	lastRefHeader: null,
	controls: {},
	headerMap: {},
	allViewFirstTitleIndexes: [], // A list of "data-title-index"s for the first rendered title in each rendered chapter
	btnToggleExpandAll: null,
	btnsToggleExpand: [],

	lnksChapter: [],
	lnksHeader: {},
};
BookUtil._LAST_CLICKED_LINK = null;
BookUtil._isNarrow = null;
// endregion

// region Hashchange
BookUtil.baseDataUrl = "";
BookUtil.allPageUrl = "";
BookUtil.bookIndex = [];
BookUtil.bookIndexPrerelease = [];
BookUtil.bookIndexBrew = [];
BookUtil.propHomebrewData = null;
BookUtil.typeTitle = null;
BookUtil.dispBook = null;
BookUtil.referenceId = false;
BookUtil.contentType = null; // one of "book" "adventure" or "document"
BookUtil.wrpFloatControls = null;
BookUtil.isDefaultExpandedContents = false;
// endregion

BookUtil._pendingPageFromHash = null;

BookUtil._renderer = new Renderer().setEnumerateTitlesRel(true).setTrackTitles(true);

BookUtil._findAll = null;
BookUtil._headerCounts = null;
BookUtil._lastHighlight = null;

BookUtil.Search = class {
	static _EXTRA_WORDS = 2;

	static getResultHash (bookId, found) {
		return `${UrlUtil.encodeForHash(bookId)}${HASH_PART_SEP}${~BookUtil.curRender.chapter ? found.ch : -1}${found.header ? `${HASH_PART_SEP}${UrlUtil.encodeForHash(found.header)}${HASH_PART_SEP}${found.headerIndex}` : ""}`;
	}

	static doSearch (term, isPageMode) {
		if (term == null) return;
		term = term.trim();

		if (isPageMode) {
			if (isNaN(term)) return [];
			else term = Number(term);
		} else {
			if (!term) return [];
		}

		const out = [];

		const toSearch = BookUtil.curRender.data;
		toSearch.forEach((section, i) => {
			BookUtil._headerCounts = {};
			BookUtil.Search._searchEntriesFor(i, out, term, section, isPageMode);
		});

		// If we're in page mode, try hard to identify _something_ to display
		if (isPageMode && !out.length) {
			const [closestPrevPage, closestNextPage] = BookUtil.Search._getClosestPages(toSearch, term);

			toSearch.forEach((section, i) => {
				BookUtil.Search._searchEntriesFor(i, out, closestPrevPage, section, true);
				if (closestNextPage !== closestPrevPage) BookUtil.Search._searchEntriesFor(i, out, closestNextPage, section, true);
			});
		}

		return out;
	}

	static _searchEntriesFor (chapterIndex, appendTo, term, obj, isPageMode) {
		BookUtil._headerCounts = {};

		const cleanTerm = isPageMode ? term : term.toLowerCase();

		BookUtil.Search._searchEntriesForRecursive(chapterIndex, "", appendTo, term, cleanTerm, obj, isPageMode);
	}

	static _searchEntriesForRecursive (chapterIndex, prevLastName, appendTo, term, cleanTerm, obj, isPageMode) {
		if (BookUtil.Search._isNamedEntry(obj)) {
			const cleanName = Renderer.stripTags(obj.name);
			if (BookUtil._headerCounts[cleanName] === undefined) BookUtil._headerCounts[cleanName] = 0;
			else BookUtil._headerCounts[cleanName]++;
		}

		let lastName;
		if (BookUtil.Search._isNamedEntry(obj)) {
			lastName = Renderer.stripTags(obj.name);
			const matches = isPageMode ? obj.page === cleanTerm : lastName.toLowerCase().includes(cleanTerm);
			if (matches) {
				appendTo.push({
					ch: chapterIndex,
					header: lastName,
					headerIndex: BookUtil._headerCounts[lastName],
					term,
					headerMatches: true,
					page: obj.page,
				});
			}
		} else {
			lastName = prevLastName;
		}

		if (obj.entries) {
			obj.entries.forEach(e => BookUtil.Search._searchEntriesForRecursive(chapterIndex, lastName, appendTo, term, cleanTerm, e, isPageMode));
		} else if (obj.items) {
			obj.items.forEach(e => BookUtil.Search._searchEntriesForRecursive(chapterIndex, lastName, appendTo, term, cleanTerm, e, isPageMode));
		} else if (obj.rows) {
			obj.rows.forEach(r => {
				const toSearch = r.row ? r.row : r;
				toSearch.forEach(c => BookUtil.Search._searchEntriesForRecursive(chapterIndex, lastName, appendTo, term, cleanTerm, c, isPageMode));
			});
		} else if (obj.tables) {
			obj.tables.forEach(t => BookUtil.Search._searchEntriesForRecursive(chapterIndex, lastName, appendTo, term, cleanTerm, t, isPageMode));
		} else if (obj.entry) {
			BookUtil.Search._searchEntriesForRecursive(chapterIndex, lastName, appendTo, term, cleanTerm, obj.entry, isPageMode);
		} else if (typeof obj === "string" || typeof obj === "number") {
			if (isPageMode) return;

			const renderStack = [];
			BookUtil._renderer.recursiveRender(obj, renderStack);
			const rendered = ee`<div>${renderStack.join("")}</div>`.txt();

			const toCheck = typeof obj === "number" ? String(rendered) : rendered.toLowerCase();
			if (toCheck.includes(cleanTerm)) {
				if (!appendTo.length || (!(appendTo[appendTo.length - 1].header === lastName && appendTo[appendTo.length - 1].headerIndex === BookUtil._headerCounts[lastName] && appendTo[appendTo.length - 1].previews))) {
					const first = toCheck.indexOf(cleanTerm);
					const last = toCheck.lastIndexOf(cleanTerm);

					const slices = [];
					if (first === last) {
						slices.push(getSubstring(rendered, first, first));
					} else {
						slices.push(getSubstring(rendered, first, first + `${cleanTerm}`.length));
						slices.push(getSubstring(rendered, last, last + `${cleanTerm}`.length));
					}
					appendTo.push({
						ch: chapterIndex,
						header: lastName,
						headerIndex: BookUtil._headerCounts[lastName],
						previews: slices.map(s => s.preview),
						term: term,
						matches: slices.map(s => s.match),
						headerMatches: lastName.toLowerCase().includes(cleanTerm),
					});
				} else {
					const last = toCheck.lastIndexOf(cleanTerm);
					const slice = getSubstring(rendered, last, last + `${cleanTerm}`.length);
					const lastItem = appendTo[appendTo.length - 1];
					lastItem.previews[1] = slice.preview;
					lastItem.matches[1] = slice.match;
				}
			}
		}

		function getSubstring (rendered, first, last) {
			let spaceCount = 0;
			let braceCount = 0;
			let pre = "";
			let i = first - 1;
			for (; i >= 0; --i) {
				pre = rendered.charAt(i) + pre;
				if (rendered.charAt(i) === " " && braceCount === 0) {
					spaceCount++;
				}
				if (spaceCount > BookUtil.Search._EXTRA_WORDS) {
					break;
				}
			}
			pre = pre.trimStart();
			const preDots = i > 0;

			spaceCount = 0;
			let post = "";
			const start = first === last ? last + `${cleanTerm}`.length : last;
			i = Math.min(start, rendered.length);
			for (; i < rendered.length; ++i) {
				post += rendered.charAt(i);
				if (rendered.charAt(i) === " " && braceCount === 0) {
					spaceCount++;
				}
				if (spaceCount > BookUtil.Search._EXTRA_WORDS) {
					break;
				}
			}
			post = post.trimEnd();
			const postDots = i < rendered.length;

			const originalTerm = rendered.substr(first, `${term}`.length);

			return {
				preview: `${preDots ? "..." : ""}${pre}<span class="ve-highlight">${originalTerm}</span>${post}${postDots ? "..." : ""}`,
				match: `${pre}${term}${post}`,
			};
		}
	}

	static _isNamedEntry (obj) {
		return obj.name && (obj.type === "entries" || obj.type === "inset" || obj.type === "section");
	}

	static _getClosestPages (toSearch, targetPage) {
		let closestBelow = Number.MIN_SAFE_INTEGER;
		let closestAbove = Number.MAX_SAFE_INTEGER;

		const walker = MiscUtil.getWalker({keyBlocklist: MiscUtil.GENERIC_WALKER_ENTRIES_KEY_BLOCKLIST});
		walker.walk(
			toSearch,
			{
				object: (obj) => {
					if (obj.page) {
						if (obj.page <= targetPage) closestBelow = Math.max(closestBelow, obj.page);
						if (obj.page >= targetPage) closestAbove = Math.min(closestAbove, obj.page);
					}
					return obj;
				},
			},
		);

		return [closestBelow, closestAbove];
	}
};

RenderMap.BookUtil = BookUtil;

globalThis.BookUtil = BookUtil;
