export class ListRowRendererItems {
	static _TEMPLATE_ELE_MUNDANE = null;
	static _TEMPLATE_ELE_MAGIC = null;

	static _getTemplateEleMundane () {
		if (!this._TEMPLATE_ELE_MUNDANE) {
			this._TEMPLATE_ELE_MUNDANE = veT`<div class="ve-lst__row ve-flex-col">
				<a class="ve-lst__row-border ve-lst__row-inner">
					<span class="ve-col-3-5 ve-pl-0 ve-pr-1 ve-bold"></span>
					<span class="ve-col-4-5 ve-px-1"></span>
					<span class="ve-col-1-5 ve-px-1 ve-text-center"></span>
					<span class="ve-col-1-5 ve-px-1 ve-text-center"></span>
					<span class="ve-col-1 ve-text-center ve-pl-1 ve-pr-0"></span>
				</a>
			</div>`;
		}
		return this._TEMPLATE_ELE_MUNDANE.cloneNode(true);
	}

	static _getTemplateEleMagic () {
		if (!this._TEMPLATE_ELE_MAGIC) {
			this._TEMPLATE_ELE_MAGIC = veT`<div class="ve-lst__row ve-flex-col">
				<a class="ve-lst__row-border ve-lst__row-inner">
					<span class="ve-col-3-5 ve-pl-0 ve-bold"></span>
					<span class="ve-col-4"></span>
					<span class="ve-col-1-5 ve-text-center"></span>
					<span class="ve-col-0-6 ve-text-center"></span>
					<span class="ve-col-1-4 ve-text-center"></span>
					<span class="ve-col-1 ve-text-center ve-pr-0"></span>
				</a>
			</div>`;
		}
		return this._TEMPLATE_ELE_MAGIC.cloneNode(true);
	}

	static _mutEleShared ({item, source, hash, isExcluded, ele, fnClick, fnContextmenu, eleSource}) {
		if (isExcluded) ele.classList.add("ve-lst__row--blocklisted");

		ele.firstElementChild.setAttribute("href", `#${hash}`);

		ele.addEventListener("click", fnClick);
		ele.addEventListener("contextmenu", fnContextmenu);

		eleSource.className += ` ${Parser.sourceJsonToSourceClassname(item.source)}`;
		eleSource.title = `${Parser.sourceJsonToFull(item.source)}${Renderer.utils.getSourceSubText(item)}`;
		eleSource.textContent = source;
	}

	static getEleMundane ({item, type, source, hash, isExcluded, fnClick, fnContextmenu}) {
		const ele = this._getTemplateEleMundane();

		const [eleName, eleType, eleValue, eleWeight, eleSource] = ele.firstElementChild.children;

		this._mutEleShared({item, source, hash, isExcluded, fnClick, fnContextmenu, ele, eleSource});

		eleName.textContent = item.name;
		eleType.textContent = type.toTitleCase();
		eleValue.textContent = item._l_value;
		eleWeight.textContent = item._l_weight;

		return ele;
	}

	static getEleMagic ({item, type, source, hash, isExcluded, fnClick, fnContextmenu}) {
		const ele = this._getTemplateEleMagic();

		const [eleName, eleType, eleWeight, eleAttunement, eleRarity, eleSource] = ele.firstElementChild.children;

		this._mutEleShared({item, source, hash, isExcluded, fnClick, fnContextmenu, ele, eleSource});

		eleName.textContent = item.name;
		eleType.textContent = type.toTitleCase();
		eleWeight.textContent = item._l_weight;
		eleAttunement.textContent = item._attunementCategory !== VeCt.STR_NO_ATTUNEMENT ? "×" : "";
		if (item.rarity) eleRarity.className += ` ve-itm__rarity-${item.rarity}`;
		eleRarity.title = (item.rarity || "").toTitleCase();
		eleRarity.textContent = Parser.itemRarityToShort(item.rarity) || "";

		return ele;
	}
}
