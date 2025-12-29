import {TOOLTIP_NOTHING} from "./lootgen-const.js";
import {LootGenUtils} from "./lootgen-utils.js";
import {LootGenRender} from "./lootgen-render.js";

export class LootGenOutput {
	static _TIERS = ["other", "minor", "major"];

	constructor (
		{
			type,
			name,
			coins,
			gems,
			artObjects,
			magicItemsByTable,
			dragonMundaneItems,
		},
	) {
		this._type = type;
		this._name = name;
		this._coins = coins;
		this._gems = gems;
		this._artObjects = artObjects;
		this._magicItemsByTable = magicItemsByTable;
		this._dragonMundaneItems = dragonMundaneItems;

		this._datetimeGenerated = Date.now();
	}

	_getEleTitleSplit () {
		const btnRivet = !globalThis.IS_VTT && ExtensionUtil.ACTIVE
			? ee`<button title="Send to Foundry (SHIFT for Temporary Import)" class="no-print ve-btn ve-btn-xs ve-btn-default"><span class="glyphicon glyphicon-send"></span></button>`
				.onn("click", evt => this._pDoSendToFoundry({isTemp: !!evt.shiftKey}))
			: null;

		const btnDownload = ee`<button title="Download JSON" class="ve-btn ve-btn-xs ve-btn-default"><span class="glyphicon glyphicon-download glyphicon--top-2p"></span></button>`
			.onn("click", () => this._pDoSaveAsJson());

		return ee`<div class="ve-btn-group">
			${btnRivet}
			${btnDownload}
		</div>`;
	}

	render (eleParent) {
		const eleTitleSplit = this._getEleTitleSplit();

		const dispTitle = ee`<h4 class="mt-1 mb-2 split-v-center ve-draggable">
			<div>${LootGenRender.er(this._name)}</div>
			${eleTitleSplit}
		</h4>`;

		const elesParts = [
			this._render_getPtValueSummary(),
			this._render_getPtCoins(),
			...this._render_getPtGemsArtObjects({loot: this._gems, name: "gemstones"}),
			...this._render_getPtGemsArtObjects({loot: this._artObjects, name: "art objects"}),
			this._render_getPtDragonMundaneItems(),
			...this._render_getPtMagicItems(),
		]
			.filter(Boolean)
			.flat();

		this._wrp = ee`<div class="ve-flex-col lootg__wrp-output py-3 px-2 my-2 mr-1">
			${dispTitle}
			${elesParts.length ? ee`<ul>${elesParts}</ul>` : null}
			${!elesParts.length ? `<div class="ve-muted help-subtle italic" title="${TOOLTIP_NOTHING.qq()}">(No loot!)</div>` : null}
		</div>`
			.prependTo(eleParent);

		(globalThis.IS_VTT ? this._wrp : dispTitle)
			.attr("draggable", true)
			.onn("dragstart", evt => {
				const meta = {
					type: VeCt.DRAG_TYPE_LOOT,
					data: dropData,
				};
				evt.dataTransfer.setData("application/json", JSON.stringify(meta));
			});

		// Preload the drop data in the background, to lessen the chance that the user drops the card before it has time
		//   to load.
		let dropData;
		this._pGetFoundryForm().then(it => dropData = it);
	}

	async _pDoSendToFoundry ({isTemp} = {}) {
		const toSend = await this._pGetFoundryForm();
		if (isTemp) toSend.isTemp = isTemp;
		if (toSend.currency || toSend.entityInfos) return ExtensionUtil.pDoSend({type: "5etools.lootgen.loot", data: toSend});
		JqueryUtil.doToast({content: `Nothing to send!`, type: "warning"});
	}

	async _pDoSaveAsJson () {
		const serialized = await this._pGetFoundryForm();
		await DataUtil.userDownload("loot", serialized);
	}

	async _pGetFoundryForm () {
		const toSend = {name: this._name, type: this._type, dateTimeGenerated: this._datetimeGenerated};

		if (this._coins) toSend.currency = this._coins;

		const entityInfos = [];
		if (this._gems?.length) entityInfos.push(...await this._pDoSendToFoundry_getGemsArtObjectsMetas({loot: this._gems}));
		if (this._artObjects?.length) entityInfos.push(...await this._pDoSendToFoundry_getGemsArtObjectsMetas({loot: this._artObjects}));

		if (this._magicItemsByTable?.length) {
			for (const magicItemsByTable of this._magicItemsByTable) {
				for (const lootItem of magicItemsByTable.breakdown) {
					const exportMeta = lootItem.getExtensionExportMeta();
					if (!exportMeta) continue;
					const {page, entity, options} = exportMeta;
					entityInfos.push({
						page,
						entity,
						options,
					});
				}
			}
		}

		if (this._dragonMundaneItems?.breakdown?.length) {
			for (const str of this._dragonMundaneItems.breakdown) {
				entityInfos.push({
					page: UrlUtil.PG_ITEMS,
					entity: {
						name: Renderer.stripTags(str).uppercaseFirst(),
						source: Parser.SRC_FTD,
						type: Parser.ITM_TYP__OTHER,
						rarity: "unknown",
					},
				});
			}
		}

		if (entityInfos.length) toSend.entityInfos = entityInfos;

		return toSend;
	}

	async _pDoSendToFoundry_getGemsArtObjectsMetas ({loot}) {
		const uidToCount = {};
		const specialItemMetas = {}; // For any rows which don't actually map to an item

		loot.forEach(lt => {
			Object.entries(lt.breakdown)
				.forEach(([entry, count]) => {
					let cntFound = 0;
					entry.replace(/{@item ([^}]+)}/g, (...m) => {
						cntFound++;
						const [name, source] = m[1].toLowerCase().split("|").map(it => it.trim()).filter(Boolean);
						const uid = `${name}|${source || Parser.SRC_DMG}`.toLowerCase();
						uidToCount[uid] = (uidToCount[uid] || 0) + count;
						return "";
					});

					if (cntFound) return;

					// If we couldn't find any real items in this row, prepare a dummy item
					const uidFaux = entry.toLowerCase().trim();

					specialItemMetas[uidFaux] = specialItemMetas[uidFaux] || {
						count: 0,
						item: {
							name: Renderer.stripTags(entry).uppercaseFirst(),
							source: Parser.SRC_DMG,
							type: Parser.ITM_TYP__OTHER,
							rarity: "unknown",
						},
					};

					specialItemMetas[uidFaux].count += count;
				});
		});

		const out = [];
		for (const [uid, count] of Object.entries(uidToCount)) {
			const [name, source] = uid.split("|");
			const item = await DataLoader.pCacheAndGet(UrlUtil.PG_ITEMS, source, UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_ITEMS]({name, source}));
			out.push({
				page: UrlUtil.PG_ITEMS,
				entity: item,
				options: {
					quantity: count,
				},
			});
		}

		for (const {count, item} of Object.values(specialItemMetas)) {
			out.push({
				page: UrlUtil.PG_ITEMS,
				entity: item,
				options: {
					quantity: count,
				},
			});
		}

		return out;
	}

	_render_getPtValueSummary () {
		if ([this._coins, this._gems, this._artObjects].filter(Boolean).length <= 1) return null;

		const totalValue = [
			this._coins ? CurrencyUtil.getAsCopper(this._coins) : 0,
			this._gems?.length ? this._gems.map(it => it.type * it.count * 100).sum() : 0,
			this._artObjects?.length ? this._artObjects.map(it => it.type * it.count * 100).sum() : 0,
		].sum();

		return ee`<li class="italic ve-muted">A total of ${(totalValue / 100).toLocaleStringVe()} ${LootGenUtils.getCoinageLabel("gp")} worth of coins, art objects, and/or gems, as follows:</li>`;
	}

	_render_getPtCoins () {
		if (!this._coins) return null;

		const total = CurrencyUtil.getAsCopper(this._coins);
		const breakdown = [...Parser.COIN_ABVS]
			.reverse()
			.filter(it => this._coins[it])
			.map(it => `${this._coins[it].toLocaleStringVe()} ${LootGenUtils.getCoinageLabel(it)}`);

		return ee`
			<li>${(total / 100).toLocaleStringVe()} ${LootGenUtils.getCoinageLabel("gp")} in coinage:</li>
			<ul>
				${breakdown.map(it => `<li>${it}</li>`).join("")}
			</ul>
		`;
	}

	_render_getPtDragonMundaneItems () {
		if (!this._dragonMundaneItems) return null;

		return ee`
			<li>${this._dragonMundaneItems.count} mundane item${this._dragonMundaneItems.count !== 1 ? "s" : ""}:</li>
			<ul>
				${this._dragonMundaneItems.breakdown.map(it => `<li>${it}</li>`).join("")}
			</ul>
		`;
	}

	_render_getPtGemsArtObjects ({loot, name}) {
		if (!loot?.length) return [];

		return loot.map(lt => {
			const typeNum = isNaN(lt.type);
			return ee`
			<li>${(lt.type).toLocaleStringVe()} ${LootGenUtils.getCoinageLabel("gp")} ${name} (×${lt.count}; worth ${((lt.type * lt.count)).toLocaleStringVe()} ${LootGenUtils.getCoinageLabel("gp")} total):</li>
			<ul>
				${Object.entries(lt.breakdown).map(([result, count]) => `<li>${LootGenRender.er(result)}${count > 1 ? `, ×${count}` : ""}</li>`).join("")}
			</ul>
		`;
		});
	}

	_render_getPtMagicItems () {
		if (!this._magicItemsByTable?.length) return [];

		return [...this._magicItemsByTable]
			.sort(({tier: tierA, type: typeA}, {tier: tierB, type: typeB}) => this.constructor._ascSortTier(tierB, tierA) || SortUtil.ascSortLower(typeA || "", typeB || ""))
			.map(magicItems => {
				// If we're in "tier" mode, sort the items into groups by rarity
				if (magicItems.tier) {
					const byRarity = {};

					magicItems.breakdown
						.forEach(lootItem => {
							if (!lootItem.item) return;

							const tgt = MiscUtil.getOrSet(byRarity, lootItem.item.rarity, []);
							tgt.push(lootItem);
						});

					const ulsByRarity = Object.entries(byRarity)
						.sort(([rarityA], [rarityB]) => SortUtil.ascSortItemRarity(rarityB, rarityA))
						.map(([rarity, lootItems]) => {
							return ee`
								<li>${rarity.toTitleCase()} items (×${lootItems.length}):</li>
								<ul>${lootItems.map(it => it.getRender())}</ul>
							`;
						})
						.flat();

					if (!ulsByRarity.length) return null;

					return ee`
						<li>${magicItems.tier.toTitleCase()} items:</li>
						<ul>
							${ulsByRarity}
						</ul>
					`;
				}

				return ee`
					<li>Magic Items${magicItems.tag ? ` (${LootGenRender.er(magicItems.tag)})` : ""}${(magicItems.count || 0) > 1 ? ` (×${magicItems.count})` : ""}</li>
					<ul>${magicItems.breakdown.map(it => it.getRender())}</ul>
				`;
			});
	}

	doRemove () {
		if (this._wrp) this._wrp.remove();
	}

	static _ascSortTier (a, b) { return LootGenOutput._TIERS.indexOf(a) - LootGenOutput._TIERS.indexOf(b); }
}

export class LootGenOutputGemsArtObjects {
	constructor (
		{
			type,
			typeRoll,
			typeTable,
			count,
			breakdown,
		},
	) {
		this.type = type;
		this.count = count;
		// region Unused--potential for wiring up rerolls from `LootGenOutput` UI, if required
		this.typeRoll = typeRoll;
		this.typeTable = typeTable;
		// endregion
		this.breakdown = breakdown;
	}
}

export class LootGenOutputDragonMundaneItems {
	constructor (
		{
			count,
			breakdown,
		},
	) {
		this.count = count;
		this.breakdown = breakdown;
	}
}

export class LootGenOutputMagicItems {
	constructor (
		{
			type,
			count,
			tag,
			typeRoll,
			typeTable,
			breakdown,
			tier,
		},
	) {
		this.type = type;
		this.count = count;
		this.tag = tag;
		// region Unused--potential for wiring up rerolls from `LootGenOutput` UI, if required
		this.typeRoll = typeRoll;
		this.typeTable = typeTable;
		// endregion
		this.breakdown = breakdown;
		this.tier = tier;
	}
}
