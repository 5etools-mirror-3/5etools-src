import {ArrayKey, ObjectKey} from "./utils-proporder-models.js";
import {getGenericMetadataPropOrder} from "./utils-proporder-config-shared.js";

export class EntryPropOrder {
	static getObjectKey (key) {
		return new ObjectKey(
			key,
			{
				fnGetOrder: entry => this._getEntryOrder(entry),
				isRecursive: true,
			},
		);
	}

	static getArrayKey (key) {
		return new ArrayKey(
			key,
			{
				fnGetOrder: entry => this._getEntryOrder(entry),
				isRecursive: true,
			},
		);
	}

	static _getEntryOrder (entry) {
		return this._TYPE_TO_ORDER[entry.type] || Object.keys(entry);
	}

	/* -------------------------------------------- */

	/**
	 * @param {?Array<string|ArrayKey|ObjectKey>} propsPreNameAdditional
	 * @param {?Array<string|ArrayKey|ObjectKey>} propsPostNameAdditional
	 * @param {?Array<string|ArrayKey|ObjectKey>} propsContent
	 */
	static _getOrder (
		{
			propsPreNameAdditional = null,
			propsPostNameAdditional = null,
			propsContent = null,
		} = {},
	) {
		return [
			"type",

			...getGenericMetadataPropOrder({propsPreNameAdditional, propsPostNameAdditional}),

			"style",

			...(propsContent ?? []),

			"data",
		];
	}

	static _ORDER_GENERIC_ENTRIES = this._getOrder({
		propsContent: [this.getArrayKey("entries")],
	});

	static _ORDER_GENERIC_INSET = this._getOrder({
		propsContent: [
			this.getArrayKey("entries"),

			"token",

			"_version",
		],
	});

	static _ORDER_LIST_ITEM = this._getOrder({
		propsContent: [
			"nameDot",

			this.getObjectKey("entry"),
			this.getArrayKey("entries"),
		],
	});

	static _TYPE_TO_ORDER = {
		section: this._ORDER_GENERIC_ENTRIES,
		entries: this._ORDER_GENERIC_ENTRIES,
		actions: this._ORDER_GENERIC_ENTRIES,

		/* -------------------------------------------- */

		inset: this._ORDER_GENERIC_INSET,
		insetReadaloud: this._ORDER_GENERIC_INSET,
		variant: this._ORDER_GENERIC_INSET,
		variantInner: this._ORDER_GENERIC_INSET,
		variantSub: this._ORDER_GENERIC_INSET,

		/* -------------------------------------------- */

		options: this._getOrder({
			propsContent: [
				"count",

				this.getArrayKey("entries"),
			],
		}),

		/* -------------------------------------------- */

		quote: this._getOrder({
			propsContent: [
				"skipMarks",
				"skipItalics",

				this.getArrayKey("entries"),

				"by",
				"from",
			],
		}),

		/* -------------------------------------------- */

		inline: this._ORDER_GENERIC_ENTRIES,
		inlineBlock: this._ORDER_GENERIC_ENTRIES,

		wrapper: this._getOrder({
			propsContent: [
				this.getObjectKey("wrapped"),
				this.getArrayKey("wrappeds"),
			],
		}),

		/* -------------------------------------------- */

		list: this._getOrder({
			propsContent: [
				"start",

				"columns",

				this.getArrayKey("items"),
			],
		}),

		/* -------------------------------------------- */

		image: this._getOrder({
			propsContent: [
				"href",
				"hrefThumbnail",

				"width",
				"height",
				"maxWidth",
				"maxHeight",
				"maxWidthUnits",
				"maxHeightUnits",

				"imageType",
				"grid",

				"title",
				"altText",
				"mapName",

				"credit",

				"expectsLightBackground",
				"expectsDarkBackground",

				"mapParent",
				"mapRegions",
				"labelMapRegions",

				"foundrySceneRoot",
				"foundrySceneWalls",
				"foundrySceneLights",
				"foundrySceneFlags",
			],
		}),
		gallery: this._getOrder({
			propsContent: [this.getArrayKey("images")],
		}),

		/* -------------------------------------------- */

		row: this._getOrder({
			propsContent: [this.getArrayKey("row")],
		}),
		cellHeader: this._getOrder({
			propsContent: [
				"width",

				this.getObjectKey("entry"),
			],
		}),
		cell: this._getOrder({
			propsContent: [
				"width",
				"roll",

				this.getObjectKey("entry"),
			],
		}),

		table: this._getOrder({
			propsPostNameAdditional: [
				"caption",
			],
			propsContent: [
				"isNameGenerator",

				"isStriped",

				"chapter",

				this.getArrayKey("colLabels"),
				this.getArrayKey("colLabelRows"),
				"colStyles",

				this.getArrayKey("rowLabels"),
				"rowStyles",

				this.getArrayKey("intro"),

				this.getArrayKey("rows"),

				this.getArrayKey("outro"),
				this.getArrayKey("footnotes"),
			],
		}),

		tableGroup: this._getOrder({
			propsContent: [this.getArrayKey("tables")],
		}),

		/* -------------------------------------------- */

		item: this._ORDER_LIST_ITEM,
		itemSub: this._ORDER_LIST_ITEM,
		itemSpell: this._ORDER_LIST_ITEM,

		/* -------------------------------------------- */

		spellcasting: this._getOrder({
			propsContent: [
				"displayAs",

				this.getArrayKey("headerEntries"),
				this.getArrayKey("footerEntries"),

				"ability",

				"constant",

				"will",

				"recharge",

				"rest",
				"restLong",
				"ritual",
				"daily",
				"weekly",
				"monthly",
				"yearly",
				"legendary",

				"charges",
				"chargesItem",

				"spells",

				"hidden",
			],
		}),

		/* -------------------------------------------- */

		statblockInline: this._getOrder({
			propsContent: [
				"statblockType",

				"dependencies",

				"collapsed",

				"statblockData",
			],
		}),
		statblock: this._getOrder({
			propsPreNameAdditional: [
				"tag",
				"prop",
			],
			propsPostNameAdditional: [
				"abbreviation",

				"shortName",
				"displayName",

				"className",
				"classSource",

				"pantheon",

				"set",

				"hash",
			],
			propsContent: [
				"collapsed",

				"slotSize",
			],
		}),

		/* -------------------------------------------- */

		dice: this._getOrder({
			propsContent: [
				"toRoll",
				"rollable",
			],
		}),

		/* -------------------------------------------- */

		abilityDc: this._getOrder({propsContent: ["attributes"]}),
		abilityAttackMod: this._getOrder({propsContent: ["attributes"]}),
		abilityGeneric: this._getOrder({
			propsContent: [
				"attributes",

				this.getObjectKey("entry"),
			],
		}),

		/* -------------------------------------------- */

		bonus: this._getOrder({propsContent: ["value"]}),
		bonusSpeed: this._getOrder({propsContent: ["value"]}),

		/* -------------------------------------------- */

		link: this._getOrder({
			propsContent: [
				"href",

				this.getObjectKey("entry"),
			],
		}),

		/* -------------------------------------------- */

		attack: this._getOrder({
			propsContent: [
				"attackType",

				this.getArrayKey("attackEntries"),

				this.getArrayKey("hitEntries"),
			],
		}),

		/* -------------------------------------------- */

		flowchart: this._getOrder({propsContent: [this.getArrayKey("blocks")]}),
		flowBlock: this._ORDER_GENERIC_ENTRIES,

		/* -------------------------------------------- */

		ingredient: this._getOrder({
			propsContent: [
				this.getObjectKey("entry"),

				...Array.from({length: 20}, (_, ix) => `amount${ix + 1}`),
			],
		}),

		/* -------------------------------------------- */

		refClassFeature: this._getOrder({propsContent: ["classFeature", "preserve"]}),
		refSubclassFeature: this._getOrder({propsContent: ["subclassFeature", "preserve"]}),
		refOptionalfeature: this._getOrder({propsContent: ["optionalfeature", "preserve"]}),
		refFeat: this._getOrder({propsContent: ["feat", "preserve"]}),
	};
}
