class TablePageSublistManager extends SublistManager {
	static _getRowTemplate () {
		return [
			new SublistCellTemplate({
				name: "Name",
				css: "ve-bold ve-col-12 ve-px-0",
				colStyle: "",
			}),
		];
	}

	pGetSublistItem (ent, hash) {
		const displayName = this._listPage._getDisplayName(ent);
		const cellsText = [displayName];

		const ele = veT`<div class="ve-lst__row ve-lst__row--sublist ve-flex-col">
			<a href="#${hash}" class="ve-lst__row-border ve-lst__row-inner" title="${displayName.qq()}">
				${this.constructor._getRowCellsHtml({values: cellsText})}
			</a>
		</div>`
			.vee.onn("contextmenu", evt => this._handleSublistItemContextMenu(evt, listItem))
			.vee.onn("click", evt => this._listSub.doSelect(listItem, evt));

		const listItem = new ListItem(
			hash,
			ele,
			displayName,
			{
				sortName: displayName,
			},
			{
				hash,
				entity: ent,
				mdRow: [...cellsText],
			},
		);
		return listItem;
	}
}

class _GroupHeaderManager {
	constructor ({ent, wrpList, groupHeaderManagers}) {
		this._wrpList = wrpList;
		this._isVisible = true;

		this._dispShowHide = veT`<div class="ve-lst__tgl-item-group ve-relative ve-top-n1p">[\u2212]</div>`;

		this._btnHeader = veT`<div class="ve-lst__item-group-header ve-mt-3 ve-split-v-center ve-py-1 ve-no-select ve-clickable" title="SHIFT to Toggle All">
			<div class="ve-split-v-center ve-w-100 ve-min-w-0 ve-mr-2">
				<div class="ve-bold">${ent.name}</div>
				<div class="${Parser.sourceJsonToSourceClassname(ent.source)}" title="${Parser.sourceJsonToFull(ent.source).qq()}">${Parser.sourceJsonToAbv(ent.source)}</div>
			</div>
			${this._dispShowHide}
		</div>`
			.vee.onn("click", evt => {
				this.toggle();
				if (!evt.shiftKey) return;
				groupHeaderManagers.forEach(it => it.toggle(this._isVisible));
			});

		groupHeaderManagers.push(this);
	}

	get btnHeader () { return this._btnHeader; }

	toggle (isVisible) {
		if (isVisible === undefined) isVisible = !this._isVisible;

		this._wrpList.vee.toggle(isVisible);
		this._dispShowHide.vee.html(isVisible ? `[\u2212]` : `[+]`);

		this._isVisible = isVisible;
	}

	onListUpdate ({list}) {
		this._btnHeader.vee.toggle(!!list.visibleItems.length);
	}
}

export class TableListPage extends ListPage {
	constructor (opts = {}) {
		super({
			...opts,
			bookViewOptions: opts.bookViewOptions ?? {
				nameSingular: "table",
				namePlural: "tables",
				pageTitle: "Tables Book View",
			},
		});

		this._listMetas = {};
		this.sublistManager = new TablePageSublistManager();
	}

	_getHeaderId (ent) { throw new Error(`Unimplemented!`); }
	_getRenderedTable (ent) { throw new Error(`Unimplemented!`); }

	get primaryLists () {
		return Object.values(this._listMetas).map(it => it.list);
	}

	static _FN_SORT (a, b, o) {
		if (o.sortBy === "name") SortUtil.ascSortLower(a.name, b.name) || SortUtil.ascSortLower(a.source, b.source);
		if (o.sortBy === "source") return SortUtil.ascSortLower(a.source, b.source) || SortUtil.ascSortLower(a.name, b.name);
		return 0;
	}

	_getListItemData (ent, i) { return {}; }

	_addData (data) {
		const groups = data[this._dataProps[0]];
		this._dataList = groups
			.map(group => {
				return group.tables
					.map(tbl => {
						const out = MiscUtil.copyFast(group);
						delete out.tables;
						Object.assign(out, MiscUtil.copyFast(tbl));
						return out;
					});
			})
			.flat()
			.sort((a, b) => this.constructor._FN_SORT(a, b, {sortBy: "source"}));

		const wrpLists = veEs(`#list`);
		const groupHeaderManagers = [];

		for (let i = 0; i < this._dataList.length; i++) {
			const ent = this._dataList[i];

			const headerId = this._getHeaderId(ent);
			if (!this._listMetas[headerId]) {
				const wrpList = veT`<div class="ve-flex-col ve-w-100 list"></div>`;

				const isFirst = !Object.keys(this._listMetas).length;
				const list = this._initList({
					iptSearch: veEs("#lst__search"),
					wrpList,
					btnReset: veEs("#reset"),
					btnClear: veEs(`#lst__search-glass`),
					dispPageTagline: isFirst ? document.getElementById(`page__subtitle`) : null,
					isBindFindHotkey: isFirst,
					optsList: {
						fnSort: this.constructor._FN_SORT,
					},
				});

				const groupHeader = new _GroupHeaderManager({ent, wrpList, groupHeaderManagers});
				list.on("updated", () => groupHeader.onListUpdate({list}));

				veT`<div class="ve-flex-col">
					${groupHeader.btnHeader}
					${wrpList}
				</div>`.vee.appendTo(wrpLists);

				this._listMetas[headerId] = {
					list,
				};
			}

			const displayName = this._getDisplayName(ent);
			const hash = UrlUtil.autoEncodeHash(ent);

			const ele = veT`<div class="ve-lst__row ve-flex-col">
				<a href="#${hash}" class="ve-lst__row-border ve-lst__row-inner">${displayName}</a>
			</div>`
				.vee.onn("contextmenu", evt => this._openContextMenu(evt, this._listMetas[headerId].list, listItem))
				.vee.onn("click", evt => this._listMetas[headerId].list.doSelect(listItem, evt));

			const listItem = new ListItem(
				i,
				ele,
				displayName,
				{},
				{
					hash,
					...this._getListItemData(ent, i),
				},
			);

			this._listMetas[headerId].list.addItem(listItem);
		}
	}

	handleFilterChange () { /* No-op */ }
	async _pOnLoad_pInitPrimaryLists () { /* No-op */ }
	_pOnLoad_initVisibleItemsDisplay () { /* No-op */ }
	_pOnLoad_bindMiscButtons () { /* No-op */ }

	_pDoLoadHash ({id, lockToken}) {
		Renderer.get().setFirstSection(true);

		const ent = this._dataList[id];

		const elePageContent = veEs("#pagecontent")
			.vee.empty()
			.vee.appends(this._getRenderedTable(ent));

		const btnRoll = veT`<span class="ve-roller" data-name="btn-roll">${ent.diceExpression}</span>`
			.vee.onn("click", async () => {
				await this._pRoll(ent);
			})
			.vee.onn("mousedown", evt => {
				evt.preventDefault();
			});

		elePageContent
			.vee.findAll(`[data-rd-isroller="true"]`)[0]
			.vee.attr(`data-rd-isroller`, null)
			.vee.empty()
			.vee.appends(btnRoll);

		this._updateSelected();
	}

	async _pRoll (ent) {
		const rollTable = ent.table;

		const roll = await Renderer.dice.parseRandomise2(ent.diceExpression);

		const row = rollTable.find(row => roll >= row.min && roll <= (row.max === 0 ? 100 : row.max));

		if (!row) {
			return Renderer.dice.addRoll({
				rolledBy: {
					name: this._getDisplayName(ent),
				},
				ele: Renderer.dice.getEleUnknownTableRoll(roll),
			});
		}

		const ptResult = Renderer.get().render(row.result.replace(/{@dice /g, "{@autodice "));
		const ptAttitude = this._roll_getPtAttitude(row);

		const ele = veT`<span><strong>${roll}</strong> ${ptResult}${ptAttitude}</span>`;

		Renderer.dice.addRoll({
			rolledBy: {
				name: this._getDisplayName(ent),
			},
			ele,
		});
	}

	_roll_getPtAttitude (row) {
		if (!row.resultAttitude?.length) return null;

		const diceTagMetas = [];

		const doRoll = rollText => Renderer.dice.parseRandomise2(rollText);

		const getAttitudeDisplay = res => `${res} = ${this.constructor._roll_getAttitude(res)}`;

		const entry = row.resultAttitude
			.replace(/{@dice (?<text>[^}]+)}/g, (...m) => {
				const [rollText, displayText] = Renderer.splitTagByPipe(m.last().text);
				diceTagMetas.push({rollText, displayText});

				const res = doRoll(rollText);

				return `<span data-tablepage-roller="${diceTagMetas.length - 1}"></span> (<span data-tablepage-is-attitude-result="true">${getAttitudeDisplay(res)}</span>)`;
			});
		const rendered = Renderer.get().render(entry);

		const out = veT`<span> | Attitude ${rendered}</span>`;

		out
			.vee.findAll(`[data-tablepage-roller]`)
			.forEach((ele, i) => {
				const {rollText, displayText} = diceTagMetas[i];

				const eleRoller = veT`<span class="ve-roller render-roller">${displayText || rollText}</span>`
					.vee.onn("click", () => {
						const res = doRoll(rollText);
						eleRoller.vee.next(`[data-tablepage-is-attitude-result="true"]`)
							.vee.txt(getAttitudeDisplay(res));
					})
					.vee.onn("mousedown", evt => {
						evt.preventDefault();
					});

				ele.replaceWith(eleRoller);
			});

		return out;
	}

	static _roll_getAttitude (total) {
		if (total <= 4) return "Hostile";
		if (total <= 8) return "Indifferent";
		return "Friendly";
	}
}
