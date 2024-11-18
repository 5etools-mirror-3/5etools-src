import {TOOLTIP_NOTHING} from "./lootgen-const.js";
import {VetoolsConfig} from "../utils-config/utils-config-config.js";
import {SITE_STYLE__ONE} from "../consts.js";

export class LootGenMagicItem extends BaseComponent {
	static async pGetMagicItemRoll (
		{
			lootGenMagicItems,
			spells,
			magicItemTable,
			itemsAltChoose,
			itemsAltChooseDisplayText,
			isItemsAltChooseRoll = false,
			fnGetIsPreferAltChoose = null,
			rowRoll = null,
		},
	) {
		isItemsAltChooseRoll = isItemsAltChooseRoll && !!itemsAltChoose;
		if (isItemsAltChooseRoll) {
			const item = RollerUtil.rollOnArray(itemsAltChoose);

			return this._pGetMagicItemRoll_singleItem({
				item,
				lootGenMagicItems,
				spells,
				magicItemTable,
				itemsAltChoose,
				itemsAltChooseDisplayText,
				isItemsAltChooseRoll,
				fnGetIsPreferAltChoose,
			});
		}

		if (!magicItemTable?.table) {
			return new LootGenMagicItemNull({
				lootGenMagicItems,
				spells,
				magicItemTable,
				itemsAltChoose,
				itemsAltChooseDisplayText,
				isItemsAltChooseRoll,
				fnGetIsPreferAltChoose,
			});
		}

		rowRoll ??= RollerUtil.randomise(magicItemTable.diceType ?? 100);
		const row = magicItemTable.table.find(it => rowRoll >= it.min && rowRoll <= (it.max ?? it.min));

		if (row.spellLevel != null) {
			return new LootGenMagicItemSpellScroll({
				lootGenMagicItems,
				spells,
				magicItemTable,
				itemsAltChoose,
				itemsAltChooseDisplayText,
				isItemsAltChooseRoll,
				fnGetIsPreferAltChoose,
				baseEntry: row.item,
				item: await this._pGetMagicItemRoll_pGetItem({nameOrUid: row.item}),
				roll: rowRoll,
				spellLevel: row.spellLevel,
				spell: RollerUtil.rollOnArray(spells.filter(it => it.level === row.spellLevel)),
			});
		}

		if (row.choose?.fromGeneric) {
			const subItems = await this._pGetMagicItemRoll_pGetSubItems({
				itemsRoot: await row.choose.fromGeneric.pMap(nameOrUid => this._pGetMagicItemRoll_pGetItem({nameOrUid})),
			});

			return new LootGenMagicItemSubItems({
				lootGenMagicItems,
				spells,
				magicItemTable,
				itemsAltChoose,
				itemsAltChooseDisplayText,
				isItemsAltChooseRoll,
				fnGetIsPreferAltChoose,
				baseEntry: row.item ?? `{@item ${row.choose.fromGeneric[0]}}`,
				item: RollerUtil.rollOnArray(subItems),
				roll: rowRoll,
				subItems,
			});
		}

		if (row.choose?.fromGroup) {
			const subItems = await this._pGetMagicItemRoll_pGetSubItems({
				itemsRoot: await row.choose.fromGroup.pMap(nameOrUid => this._pGetMagicItemRoll_pGetItem({nameOrUid})),
			});

			return new LootGenMagicItemSubItems({
				lootGenMagicItems,
				spells,
				magicItemTable,
				itemsAltChoose,
				itemsAltChooseDisplayText,
				isItemsAltChooseRoll,
				fnGetIsPreferAltChoose,
				baseEntry: row.item ?? `{@item ${row.choose.fromGroup[0]}}`,
				item: RollerUtil.rollOnArray(subItems),
				roll: rowRoll,
				subItems,
			});
		}

		if (row.choose?.fromItems) {
			const subItems = await this._pGetMagicItemRoll_pGetSubItems({
				itemsRoot: await row.choose?.fromItems.pMap(nameOrUid => this._pGetMagicItemRoll_pGetItem({nameOrUid})),
			});

			return new LootGenMagicItemSubItems({
				lootGenMagicItems,
				spells,
				magicItemTable,
				itemsAltChoose,
				itemsAltChooseDisplayText,
				isItemsAltChooseRoll,
				fnGetIsPreferAltChoose,
				baseEntry: row.item,
				item: RollerUtil.rollOnArray(subItems),
				roll: rowRoll,
				subItems,
			});
		}

		if (row.table) {
			const min = Math.min(...row.table.map(it => it.min));
			const max = Math.max(...row.table.map(it => it.max ?? min));

			const {subRowRoll, subRow, subItem} = await LootGenMagicItemTable.pGetSubRollMeta({
				min,
				max,
				subTable: row.table,
			});

			return new LootGenMagicItemTable({
				lootGenMagicItems,
				spells,
				magicItemTable,
				itemsAltChoose,
				itemsAltChooseDisplayText,
				isItemsAltChooseRoll,
				fnGetIsPreferAltChoose,
				baseEntry: row.item,
				item: subItem,
				roll: rowRoll,
				table: row.table,
				tableMinRoll: min,
				tableMaxRoll: max,
				tableEntry: subRow.item,
				tableRoll: subRowRoll,
			});
		}

		const item = await this._pGetMagicItemRoll_pGetItem({nameOrUid: row.item});
		if (!item) throw new Error(`Could not load item for "${row.item}"`);

		return this._pGetMagicItemRoll_singleItem({
			item,
			lootGenMagicItems,
			spells,
			magicItemTable,
			itemsAltChoose,
			itemsAltChooseDisplayText,
			isItemsAltChooseRoll,
			fnGetIsPreferAltChoose,
			baseEntry: row.item,
			roll: rowRoll,
		});
	}

	static async _pGetMagicItemRoll_singleItem (
		{
			item,
			lootGenMagicItems,
			spells,
			magicItemTable,
			itemsAltChoose,
			itemsAltChooseDisplayText,
			isItemsAltChooseRoll = false,
			fnGetIsPreferAltChoose = null,
			baseEntry,
			roll,
		},
	) {
		baseEntry = baseEntry || item
			? `{@item ${item.name}|${item.source}}`
			: `<span class="help-subtle" title="${TOOLTIP_NOTHING.qq()}">(no item)</span>`;

		if (item?.spellScrollLevel != null) {
			return new LootGenMagicItemSpellScroll({
				lootGenMagicItems,
				spells,
				magicItemTable,
				itemsAltChoose,
				itemsAltChooseDisplayText,
				isItemsAltChooseRoll,
				fnGetIsPreferAltChoose,
				baseEntry,
				item,
				spellLevel: item.spellScrollLevel,
				spell: RollerUtil.rollOnArray(spells.filter(it => it.level === item.spellScrollLevel)),
				roll,
			});
		}

		if (item?.variants?.length) {
			const subItems = item.variants.map(({specificVariant}) => specificVariant);

			return new LootGenMagicItemSubItems({
				lootGenMagicItems,
				spells,
				magicItemTable,
				itemsAltChoose,
				itemsAltChooseDisplayText,
				isItemsAltChooseRoll,
				fnGetIsPreferAltChoose,
				baseEntry: baseEntry,
				item: RollerUtil.rollOnArray(subItems),
				roll,
				subItems,
			});
		}

		return new LootGenMagicItem({
			lootGenMagicItems,
			spells,
			magicItemTable,
			itemsAltChoose,
			itemsAltChooseDisplayText,
			isItemsAltChooseRoll,
			fnGetIsPreferAltChoose,
			baseEntry,
			item,
			roll,
		});
	}

	/**
	 * When generating e.g. a specific single item, we may redirect to a generic variant or group of items
	 *   (or any combination thereof). Gracefully handle all possible cases.
	 */
	static async _pGetMagicItemRoll_pGetSubItems ({itemsRoot}) {
		return (
			await itemsRoot
				.pMap(item => {
					// Generic variant
					if (item.variants) return item.variants.map(({specificVariant}) => specificVariant);

					// Item group
					if (item.items) return item.items.pMap(x => this._pGetMagicItemRoll_pGetItem({nameOrUid: x}));

					// Single item
					return [item];
				})
		)
			.flat();
	}

	static async _pGetMagicItemRoll_pGetItem ({nameOrUid}) {
		nameOrUid = nameOrUid.replace(/{@item ([^}]+)}/g, (...m) => m[1]);
		const uid = (nameOrUid.includes("|") ? nameOrUid : `${nameOrUid}|${Parser.SRC_DMG}`).toLowerCase();
		const [name, source] = uid.split("|");
		const hash = UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_ITEMS]({name, source});

		if (VetoolsConfig.get("styleSwitcher", "style") === SITE_STYLE__ONE) {
			const redirectMeta = await Renderer.redirect.pGetRedirectByHash(UrlUtil.PG_ITEMS, hash);
			if (redirectMeta) {
				return DataLoader.pCacheAndGet(UrlUtil.PG_ITEMS, redirectMeta.source, redirectMeta.hash);
			}
		}

		return DataLoader.pCacheAndGet(UrlUtil.PG_ITEMS, source, hash);
	}

	/**
	 * @param lootGenMagicItems The parent array in which this item is stored.
	 * @param spells Spell data list.
	 * @param magicItemTable The table this result was rolled form.
	 * @param itemsAltChoose Item list from which alternate rolls can be made.
	 * @param itemsAltChooseDisplayText Summary display text for the alternate roll options.
	 * @param isItemsAltChooseRoll If this item was rolled by an alt-choose roll.
	 * @param fnGetIsPreferAltChoose Function to call when checking if this should default to the "alt choose" item set.
	 * @param baseEntry The text, which may be an item itself, supplied by the `"item"` property in the row.
	 * @param item The rolled item.
	 * @param roll The roll result used to get this row.
	 */
	constructor (
		{
			lootGenMagicItems,
			spells,
			magicItemTable,
			itemsAltChoose,
			itemsAltChooseDisplayText,
			isItemsAltChooseRoll,
			fnGetIsPreferAltChoose,
			baseEntry,
			item,
			roll,
		},
	) {
		super();
		this._lootGenMagicItems = lootGenMagicItems;
		this._spells = spells;
		this._magicItemTable = magicItemTable;
		this._itemsAltChoose = itemsAltChoose;
		this._itemsAltChooseDisplayText = itemsAltChooseDisplayText;
		this._fnGetIsPreferAltChoose = fnGetIsPreferAltChoose;

		this._state.baseEntry = baseEntry;
		this._state.item = item;
		this._state.roll = roll;
		this._state.isItemsAltChooseRoll = isItemsAltChooseRoll;

		this._$render = null;
	}

	get item () { return this._state.item; }

	getExtensionExportMeta () {
		return {
			page: UrlUtil.PG_ITEMS,
			entity: this._state.item,
		};
	}

	async _pDoReroll ({isAltRoll = false} = {}) {
		const nxt = await this.constructor.pGetMagicItemRoll({
			lootGenMagicItems: this._lootGenMagicItems,
			spells: this._spells,
			magicItemTable: this._magicItemTable,
			itemsAltChoose: this._itemsAltChoose,
			itemsAltChooseDisplayText: this._itemsAltChooseDisplayText,
			isItemsAltChooseRoll: isAltRoll,
			fnGetIsPreferAltChoose: this._fnGetIsPreferAltChoose,
		});

		this._lootGenMagicItems.splice(this._lootGenMagicItems.indexOf(this), 1, nxt);

		if (!this._$render) return;
		this._$render.replaceWith(nxt.$getRender());
	}

	_$getBtnReroll () {
		if (!this._magicItemTable && !this._itemsAltChoose) return null;

		const isAltModeDefault = this._fnGetIsPreferAltChoose && this._fnGetIsPreferAltChoose();
		const title = this._itemsAltChoose
			? isAltModeDefault ? `SHIFT to roll on Magic Item Table ${this._magicItemTable.type}` : `SHIFT to roll ${Parser.getArticle(this._itemsAltChooseDisplayText)} ${this._itemsAltChooseDisplayText} item`
			: null;
		return $(`<span class="roller render-roller" ${title ? `title="${title}"` : ""}>[reroll]</span>`)
			.mousedown(evt => evt.preventDefault())
			.click(evt => this._pDoReroll({isAltRoll: isAltModeDefault ? !evt.shiftKey : evt.shiftKey}));
	}

	$getRender () {
		if (this._$render) return this._$render;
		return this._$render = this._$getRender();
	}

	_$getRender () {
		const $dispBaseEntry = this._$getRender_$getDispBaseEntry();
		const $dispRoll = this._$getRender_$getDispRoll();

		const $btnReroll = this._$getBtnReroll();

		return $$`<li class="split-v-center">
			<div class="ve-flex-v-center ve-flex-wrap pr-3 min-w-0">
				${$dispBaseEntry}
				${$dispRoll}
			</div>
			${$btnReroll}
		</li>`;
	}

	_$getRender_$getDispBaseEntry ({prop = "baseEntry"} = {}) {
		const $dispBaseEntry = $(`<div class="mr-2"></div>`);
		const hkBaseEntry = () => $dispBaseEntry.html(Renderer.get().render(this._state.isItemsAltChooseRoll ? `{@i ${this._state[prop]}}` : this._state[prop]));
		this._addHookBase(prop, hkBaseEntry);
		hkBaseEntry();
		return $dispBaseEntry;
	}

	_$getRender_$getDispRoll ({prop = "roll"} = {}) {
		const $dispRoll = $(`<div class="ve-muted"></div>`);
		const hkRoll = () => $dispRoll.text(this._state.isItemsAltChooseRoll ? `(${this._itemsAltChooseDisplayText} item)` : `(Rolled ${this._state[prop]})`);
		this._addHookBase(prop, hkRoll);
		hkRoll();
		return $dispRoll;
	}

	_getDefaultState () {
		return {
			...super._getDefaultState(),
			baseEntry: null,
			item: null,
			roll: null,
			isItemsAltChooseRoll: false,
		};
	}
}

class LootGenMagicItemNull extends LootGenMagicItem {
	getExtensionExportMeta () { return null; }

	_$getRender () {
		return $$`<li class="split-v-center">
			<div class="ve-flex-v-center ve-flex-wrap ve-muted help-subtle" title="${TOOLTIP_NOTHING.qq()}">&mdash;</div>
		</li>`;
	}
}

class LootGenMagicItemSpellScroll extends LootGenMagicItem {
	constructor (
		{
			spellLevel,
			spell,
			...others
		},
	) {
		super(others);

		this._state.spellLevel = spellLevel;
		this._state.spell = spell;
	}

	getExtensionExportMeta () {
		if (this._state.spell == null) return null;

		return {
			page: UrlUtil.PG_SPELLS,
			entity: this._state.spell,
			options: {
				isSpellScroll: true,
			},
		};
	}

	_$getRender () {
		const $dispBaseEntry = this._$getRender_$getDispBaseEntry();
		const $dispRoll = this._$getRender_$getDispRoll();

		const $btnRerollSpell = $(`<span class="roller render-roller mr-2">[reroll]</span>`)
			.mousedown(evt => evt.preventDefault())
			.click(() => {
				this._state.spell = RollerUtil.rollOnArray(this._spells.filter(it => it.level === this._state.spellLevel));
			});

		const $dispSpell = $(`<div class="no-wrap"></div>`);
		const hkSpell = () => {
			if (!this._state.spell) return $dispSpell.html(`<span class="help-subtle" title="${TOOLTIP_NOTHING.qq()}">(no spell)</span>`);
			$dispSpell.html(Renderer.get().render(`{@spell ${this._state.spell.name}|${this._state.spell.source}}`));
		};
		this._addHookBase("spell", hkSpell);
		hkSpell();

		const $btnReroll = this._$getBtnReroll();

		return $$`<li class="split-v-center">
			<div class="ve-flex-v-center ve-flex-wrap pr-3 min-w-0">
				${$dispBaseEntry}
				<div class="ve-flex-v-center italic mr-2">
					<span>(</span>
					${$btnRerollSpell}
					${$dispSpell}
					<span class="ve-muted mx-2 no-wrap">-or-</span>
					<div class="no-wrap">${Renderer.get().render(`{@filter see all ${Parser.spLevelToFullLevelText(this._state.spellLevel, {isDash: true})} spells|spells|level=${this._state.spellLevel}}`)}</div>
					<span>)</span>
				</div>
				${$dispRoll}
			</div>
			${$btnReroll}
		</li>`;
	}

	_getDefaultState () {
		return {
			...super._getDefaultState(),
			spellLevel: null,
			spell: null,
		};
	}
}

class LootGenMagicItemSubItems extends LootGenMagicItem {
	constructor (
		{
			subItems,
			...others
		},
	) {
		super(others);
		this._subItems = subItems;
	}

	_$getRender () {
		const $dispBaseEntry = this._$getRender_$getDispBaseEntry();
		const $dispRoll = this._$getRender_$getDispRoll();

		const $btnRerollSubItem = $(`<span class="roller render-roller mr-2">[reroll]</span>`)
			.mousedown(evt => evt.preventDefault())
			.click(() => {
				this._state.item = RollerUtil.rollOnArray(this._subItems);
			});

		const $dispSubItem = $(`<div></div>`);
		const hkItem = () => $dispSubItem.html(Renderer.get().render(`{@item ${this._state.item.name}|${this._state.item.source}}`));
		this._addHookBase("item", hkItem);
		hkItem();

		const $btnReroll = this._$getBtnReroll();

		return $$`<li class="split-v-center">
			<div class="ve-flex-v-center ve-flex-wrap pr-3 min-w-0">
				${$dispBaseEntry}
				<div class="ve-flex-v-center italic mr-2">
					<span>(</span>
					${$btnRerollSubItem}
					${$dispSubItem}
					<span>)</span>
				</div>
				${$dispRoll}
			</div>
			${$btnReroll}
		</li>`;
	}
}

export class LootGenMagicItemTable extends LootGenMagicItem {
	static async pGetSubRollMeta ({min, max, subTable}) {
		const subRowRoll = RollerUtil.randomise(max, min);
		const subRow = subTable.find(it => subRowRoll >= it.min && subRowRoll <= (it.max ?? it.min));

		return {
			subRowRoll,
			subRow,
			subItem: await this._pGetMagicItemRoll_pGetItem({nameOrUid: subRow.item}),
		};
	}

	constructor (
		{
			table,
			tableMinRoll,
			tableMaxRoll,
			tableEntry,
			tableRoll,
			...others
		},
	) {
		super(others);
		this._table = table;
		this._tableMinRoll = tableMinRoll;
		this._tableMaxRoll = tableMaxRoll;
		this._state.tableEntry = tableEntry;
		this._state.tableRoll = tableRoll;
	}

	_$getRender () {
		const $dispBaseEntry = this._$getRender_$getDispBaseEntry();
		const $dispRoll = this._$getRender_$getDispRoll();

		const $dispTableEntry = this._$getRender_$getDispBaseEntry({prop: "tableEntry"});
		const $dispTableRoll = this._$getRender_$getDispRoll({prop: "tableRoll"});

		const $btnReroll = this._$getBtnReroll();

		const $btnRerollSub = $(`<span class="roller render-roller ve-small ve-self-flex-end">[reroll]</span>`)
			.mousedown(evt => evt.preventDefault())
			.click(async () => {
				const {subRowRoll, subRow, subItem} = await LootGenMagicItemTable.pGetSubRollMeta({
					min: this._tableMinRoll,
					max: this._tableMaxRoll,
					subTable: this._table,
				});

				this._state.item = subItem;
				this._state.tableEntry = subRow.item;
				this._state.tableRoll = subRowRoll;
			});

		return $$`<li class="ve-flex-col">
			<div class="split-v-center">
				<div class="ve-flex-v-center ve-flex-wrap pr-3 min-w-0">
					${$dispBaseEntry}
					${$dispRoll}
				</div>
				${$btnReroll}
			</div>
			<div class="split-v-center pl-2">
				<div class="ve-flex-v-center ve-flex-wrap pr-3 min-w-0">
					<span class="ml-1 mr-2">&rarr;</span>
					${$dispTableEntry}
					${$dispTableRoll}
				</div>
				${$btnRerollSub}
			</div>
		</li>`;
	}
}
