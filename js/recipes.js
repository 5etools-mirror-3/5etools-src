"use strict";

class RecipesSublistManager extends SublistManager {
	_getCustomHashId ({entity}) {
		return Renderer.recipe.getCustomHashId(entity);
	}

	static _getRowTemplate () {
		return [
			new SublistCellTemplate({
				name: "Name",
				css: "bold ve-col-9 pl-0 pr-1",
				colStyle: "",
			}),
			new SublistCellTemplate({
				name: "Type",
				css: "ve-col-3 ve-text-center pl-1 pr-0",
				colStyle: "text-center",
			}),
		];
	}

	async pGetSublistItem (itRaw, hash, {customHashId = null} = {}) {
		const it = await Renderer.hover.pApplyCustomHashId(UrlUtil.getCurrentPage(), itRaw, customHashId);
		const name = it._displayName || it.name;
		const cellsText = [name, it.type || "\u2014"];

		const $ele = $(`<div class="lst__row lst__row--sublist ve-flex-col">
			<a href="#${hash}" class="lst__row-border lst__row-inner">
				${this.constructor._getRowCellsHtml({values: cellsText})}
			</a>
		</div>`)
			.contextmenu(evt => this._handleSublistItemContextMenu(evt, listItem))
			.click(evt => this._listSub.doSelect(listItem, evt));

		const listItem = new ListItem(
			hash,
			$ele,
			name,
			{
				hash,
				page: it.page,
				type: it.type,
			},
			{
				entity: it,
				mdRow: [...cellsText],
				customHashId,
			},
		);
		return listItem;
	}
}

class RecipesPage extends ListPage {
	constructor () {
		const pageFilter = new PageFilterRecipes();
		const pFnGetFluff = Renderer.recipe.pGetFluff.bind(Renderer.recipe);

		super({
			dataSource: DataUtil.recipe.loadJSON.bind(DataUtil.recipe),
			prereleaseDataSource: DataUtil.recipe.loadPrerelease.bind(DataUtil.recipe),
			brewDataSource: DataUtil.recipe.loadBrew.bind(DataUtil.recipe),

			pFnGetFluff,

			pageFilter,

			dataProps: ["recipe"],

			listSyntax: new ListSyntaxRecipes({fnGetDataList: () => this._dataList, pFnGetFluff}),
		});
	}

	getListItem (ent, rpI, isExcluded) {
		this._pageFilter.mutateAndAddToFilters(ent, isExcluded);

		const eleLi = document.createElement("div");
		eleLi.className = `lst__row ve-flex-col ${isExcluded ? "lst__row--blocklisted" : ""}`;

		const source = Parser.sourceJsonToAbv(ent.source);
		const hash = UrlUtil.autoEncodeHash(ent);

		eleLi.innerHTML = `<a href="#${hash}" class="lst__row-border lst__row-inner">
			<span class="ve-col-6 bold pl-0 pr-1">${ent.name}</span>
			<span class="ve-col-4 px-1 ve-text-center">${ent.type || "\u2014"}</span>
			<span class="ve-col-2 ve-text-center ${Parser.sourceJsonToSourceClassname(ent.source)} pl-1 pr-0" title="${Parser.sourceJsonToFull(ent.source)}" ${Parser.sourceJsonToStyle(ent.source)}>${source}</span>
		</a>`;

		const listItem = new ListItem(
			rpI,
			eleLi,
			ent.name,
			{
				hash,
				source,
				page: ent.page,
				type: ent.type,
				alias: PageFilterRecipes.getListAliases(ent),
			},
			{
				isExcluded,
			},
		);

		eleLi.addEventListener("click", (evt) => this._list.doSelect(listItem, evt));
		eleLi.addEventListener("contextmenu", (evt) => this._openContextMenu(evt, this._list, listItem));

		return listItem;
	}

	_tabTitleStats = "Recipe";

	_renderStats_doBuildStatsTab ({ent, scaleFactor = null}) {
		if (scaleFactor != null) ent = Renderer.recipe.getScaledRecipe(ent, scaleFactor);

		const $selScaleFactor = $(`
			<select title="Scale Recipe" class="form-control input-xs form-control--minimal ve-popwindow__hidden">
				${[0.5, 1, 2, 3, 4].map(it => `<option value="${it}" ${(scaleFactor || 1) === it ? "selected" : ""}>×${it}</option>`)}
			</select>`)
			.change(() => {
				const scaleFactor = Number($selScaleFactor.val());

				if (scaleFactor !== this._lastRender?._scaleFactor) {
					if (scaleFactor === 1) Hist.setSubhash(VeCt.HASH_SCALED, null);
					else Hist.setSubhash(VeCt.HASH_SCALED, scaleFactor);
				}
			});
		$selScaleFactor.val(`${scaleFactor || 1}`);

		this._$pgContent.empty().append(RenderRecipes.$getRenderedRecipe(ent, {$selScaleFactor}));
		Renderer.initLazyImageLoaders();
		this._lastRender = {entity: ent};
	}

	async _pDoLoadSubHash ({sub, lockToken}) {
		sub = await super._pDoLoadSubHash({sub, lockToken});

		const scaledHash = sub.find(it => it.startsWith(RecipesPage._HASH_START_SCALED));
		if (scaledHash) {
			const scaleFactor = Number(UrlUtil.unpackSubHash(scaledHash)[VeCt.HASH_SCALED][0]);
			const r = this._dataList[Hist.lastLoadedId];
			this._renderStats_doBuildStatsTab({ent: r, scaleFactor});
		}
	}
}
RecipesPage._HASH_START_SCALED = `${VeCt.HASH_SCALED}${HASH_SUB_KV_SEP}`;

const recipesPage = new RecipesPage();
recipesPage.sublistManager = new RecipesSublistManager();

window.addEventListener("load", () => recipesPage.pOnLoad());
