"use strict";

class _GroupHeaderManager {
	constructor ({ent, wrpList, groupHeaderManagers}) {
		this._wrpList = wrpList;
		this._isVisible = true;

		this._dispShowHide = ee`<div class="lst__tgl-item-group relative top-n1p">[\u2013]</div>`;

		this._btnHeader = ee`<div class="lst__item-group-header mt-3 split-v-center py-1 no-select clickable" title="SHIFT to Toggle All">
			<div class="split-v-center w-100 min-w-0 mr-2">
				<div class="bold">${ent.name}</div>
				<div class="${Parser.sourceJsonToSourceClassname(ent.source)}" title="${Parser.sourceJsonToFull(ent.source).qq()}">${Parser.sourceJsonToAbv(ent.source)}</div>
			</div>
			${this._dispShowHide}
		</div>`
			.onn("click", evt => {
				this.toggleVe();
				if (!evt.shiftKey) return;
				groupHeaderManagers.forEach(it => it.toggleVe(this._isVisible));
			});

		groupHeaderManagers.push(this);
	}

	get btnHeader () { return this._btnHeader; }

	toggleVe (isVisible) {
		if (isVisible === undefined) isVisible = !this._isVisible;

		this._wrpList.toggleVe(isVisible);
		this._dispShowHide.html(isVisible ? `[\u2013]` : `[+]`);

		this._isVisible = isVisible;
	}

	onListUpdate ({list}) {
		this._btnHeader.toggleVe(!!list.visibleItems.length);
	}
}

class TableListPage extends ListPage {
	constructor (...args) {
		super(...args);

		this._listMetas = {};
	}

	_getHash (ent) { throw new Error(`Unimplemented!`); }
	_getHeaderId (ent) { throw new Error(`Unimplemented!`); }

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

		const wrpLists = es(`[data-name="tablepage-wrp-list"]`);
		const groupHeaderManagers = [];

		for (let i = 0; i < this._dataList.length; i++) {
			const ent = this._dataList[i];

			const headerId = this._getHeaderId(ent);
			if (!this._listMetas[headerId]) {
				const wrpList = ee`<div class="ve-flex-col w-100 list"></div>`;

				const isFirst = !Object.keys(this._listMetas).length;
				const list = this._initList({
					iptSearch: es("#lst__search"),
					wrpList,
					btnReset: es("#reset"),
					btnClear: es(`#lst__search-glass`),
					dispPageTagline: isFirst ? document.getElementById(`page__subtitle`) : null,
					isBindFindHotkey: isFirst,
					optsList: {
						fnSort: this.constructor._FN_SORT,
					},
				});

				const groupHeader = new _GroupHeaderManager({ent, wrpList, groupHeaderManagers});
				list.on("updated", () => groupHeader.onListUpdate({list}));

				ee`<div class="flex-col">
					${groupHeader.btnHeader}
					${wrpList}
				</div>`.appendTo(wrpLists);

				this._listMetas[headerId] = {
					list,
				};
			}

			const displayName = this._getDisplayName(ent);
			const hash = this._getHash(ent);

			const ele = ee`<div class="lst__row ve-flex-col">
				<a href="#${hash}" class="lst__row-border lst__row-inner">${displayName}</a>
			</div>`;

			const listItem = new ListItem(
				i,
				ele,
				displayName,
				{
					hash,
				},
				{
					...this._getListItemData(ent, i),
				},
			);

			this._listMetas[headerId].list.addItem(listItem);
		}
	}

	handleFilterChange () { /* No-op */ }
	async _pOnLoad_pInitPrimaryLists () { /* No-op */ }
	_pOnLoad_initVisibleItemsDisplay () { /* No-op */ }
	async _pOnLoad_pLoadListState () { /* No-op */ }
	_pOnLoad_bindMiscButtons () { /* No-op */ }
	pDoLoadSubHash () { /* No-op */ }

	_pDoLoadHash ({id, lockToken}) {
		Renderer.get().setFirstSection(true);

		const ent = this._dataList[id];

		const entTable = Renderer.table.getConvertedEncounterOrNamesTable({
			group: ent,
			tableRaw: ent,
			fnGetNameCaption: this._getDisplayName.bind(this),
			colLabel1: this.constructor._COL_NAME_1,
		});

		const htmlTable = Renderer.get().render(entTable);

		const elePageContent = es("#pagecontent")
			.empty()
			.appends(htmlTable);

		const btnRoll = ee`<span class="roller" data-name="btn-roll">${ent.diceExpression}</span>`
			.onn("click", async () => {
				await this._pRoll(ent);
			})
			.onn("mousedown", evt => {
				evt.preventDefault();
			});

		elePageContent
			.findAll(`[data-rd-isroller="true"]`)[0]
			.attr(`data-rd-isroller`, null)
			.empty()
			.appends(btnRoll);
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

		const ele = ee`<span><strong>${roll}</strong> ${ptResult}${ptAttitude}</span>`;

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

		const eleOut = ee`<span> | Attitude ${rendered}</span>`;

		eleOut
			.findAll(`[data-tablepage-roller]`)
			.forEach((ele, i) => {
				const {rollText, displayText} = diceTagMetas[i];

				const eleRoller = ee`<span class="roller render-roller">${displayText || rollText}</span>`
					.onn("click", () => {
						const res = doRoll(rollText);
						eleRoller.next(`[data-tablepage-is-attitude-result="true"]`)
							.txt(getAttitudeDisplay(res));
					})
					.onn("mousedown", evt => {
						evt.preventDefault();
					});

				ele.replaceWith(eleRoller);
			});

		return eleOut;
	}

	static _roll_getAttitude (total) {
		if (total <= 4) return "Hostile";
		if (total <= 8) return "Indifferent";
		return "Friendly";
	}
}
