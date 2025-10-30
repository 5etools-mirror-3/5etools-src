export class UtilConditions {
	static getDefaultState ({name, color, turns}) {
		return {
			id: CryptUtil.uid(),
			entity: {
				name,
				color,
				turns: turns ? Number(turns) : null,
			},
		};
	}
}

const WOUND_LEVEL_HEALTHY = 0;
const WOUND_LEVEL_INJURED = 1;
const WOUND_LEVEL_BLOODY = 2;
const WOUND_LEVEL_DEFEATED = 3;
const WOUND_LEVEL_UNKNOWN = -1;

export class RenderableCollectionConditions extends RenderableCollectionGenericRows {
	constructor (
		{
			comp,
			wrpRows,
			isReadOnly = false,
			barWidth = null,
			barHeight = null,
		},
	) {
		super(comp, "conditions", wrpRows);
		this._isReadOnly = isReadOnly;
		this._barWidth = barWidth;
		this._barHeight = barHeight;
	}

	_getWrpRow () {
		const ptStyle = [
			this._barWidth != null ? `width: ${this._barWidth}px;` : null,
			this._barHeight != null ? `height: ${this._barHeight}px;` : null,
		]
			.filter(Boolean)
			.join(" ");

		return ee`<div class="init__cond relative" ${ptStyle ? `style="${ptStyle}"` : ""}></div>`;
	}

	/* -------------------------------------------- */

	_populateRow ({comp, wrpRow, entity}) {
		this._populateRow_bindHookTooltip({comp, wrpRow, entity});
		this._populateRow_bindHookBars({comp, wrpRow, entity});
		this._populateRow_bindHookConditionHover({comp, wrpRow, entity});

		wrpRow
			.onn("contextmenu", evt => {
				if (this._isReadOnly) return;
				evt.preventDefault();
				this._doTickDown({comp, entity, isFromClick: true});
			})
			.onn("click", evt => {
				if (this._isReadOnly) return;
				if (EventUtil.isCtrlMetaKey(evt)) return this._utils.doDelete({entity});
				this._doTickUp({comp, entity, isFromClick: true});
			});
	}

	_populateRow_bindHookTooltip ({comp, wrpRow, entity}) {
		const hkTooltip = () => {
			const turnsText = `${comp._state.turns} turn${comp._state.turns > 1 ? "s" : ""} remaining${this._isReadOnly ? "" : `; CTRL-click to Clear`}`;
			wrpRow.tooltip(
				comp._state.name && comp._state.turns
					? `${comp._state.name.escapeQuotes()} (${turnsText})`
					: comp._state.name
						? comp._state.name.escapeQuotes()
						: comp._state.turns
							? turnsText
							: "",
			);
		};
		comp._addHookBase("turns", hkTooltip);
		comp._addHookBase("name", hkTooltip);
		hkTooltip();
	}

	_populateRow_bindHookBars ({comp, wrpRow, entity}) {
		comp._addHookBase("turns", () => {
			const htmlBars = comp._state.turns
				? [...new Array(Math.min(comp._state.turns, 3))]
					.map(() => this._populateRow_getHtmlBar({comp, wrpRow, entity}))
					.join("")
				: this._populateRow_getHtmlBar({comp, wrpRow, entity});

			wrpRow
				.empty()
				.html(htmlBars);
		})();
	}

	_populateRow_bindHookConditionHover ({comp, wrpRow, entity}) {
		comp._addHookBase("name", () => {
			wrpRow
				.off("mouseover")
				.off("mousemove")
				.off("mouseleave");

			const cond = InitiativeTrackerUtil.CONDITIONS.find(it => it.condName !== null && it.name.toLowerCase() === comp._state.name.toLowerCase().trim());
			if (!cond) return;

			wrpRow.onn("mouseover", (evt) => {
				if (!evt.shiftKey) return;

				evt.shiftKey = false;
				const hash = UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_CONDITIONS_DISEASES]({name: cond.condName || cond.name, source: Parser.SRC_PHB});
				Renderer.hover.pHandleLinkMouseOver(evt, wrpRow, {isSpecifiedLinkData: true, page: UrlUtil.PG_CONDITIONS_DISEASES, source: Parser.SRC_PHB, hash}).then(null);
			});
			wrpRow.onn("mousemove", (evt) => Renderer.hover.handleLinkMouseMove(evt, wrpRow));
			wrpRow.onn("mouseleave", (evt) => Renderer.hover.handleLinkMouseLeave(evt, wrpRow));
		})();
	}

	_populateRow_getHtmlBar ({comp, wrpRow, entity}) {
		const styleStack = [
			comp._state.turns == null || comp._state.turns > 3
				? `background-image: linear-gradient(135deg, ${comp._state.color} 41.67%, transparent 41.67%, transparent 50%, ${comp._state.color} 50%, ${comp._state.color} 91.67%, transparent 91.67%, transparent 100%); background-size: 8.49px 8.49px;`
				: `background: ${comp._state.color};`,
		];
		if (this._barWidth != null) styleStack.push(`width: ${this._barWidth}px;`);
		return `<div class="init__cond_bar" style="${styleStack.join(" ")}"></div>`;
	}

	/* -------------------------------------------- */

	_doTickDown ({comp, entity, isFromClick = false}) {
		if (isFromClick && comp._state.turns == null) return this._utils.doDelete({entity}); // remove permanent conditions

		if (comp._state.turns != null && (--comp._state.turns <= 0)) this._utils.doDelete({entity});
	}

	_doTickUp ({comp, entity, isFromClick = false}) {
		if (isFromClick && comp._state.turns == null) return comp._state.turns = 1; // convert permanent condition

		if (comp._state.turns != null) comp._state.turns++;
	}
}

export class InitiativeTrackerUtil {
	static getWoundLevel (pctHp) {
		pctHp = Math.round(Math.max(Math.min(pctHp, 100), 0));
		if (pctHp === 100) return WOUND_LEVEL_HEALTHY;
		if (pctHp > 50) return WOUND_LEVEL_INJURED;
		if (pctHp > 0) return WOUND_LEVEL_BLOODY;
		if (pctHp === 0) return WOUND_LEVEL_DEFEATED;
		return WOUND_LEVEL_UNKNOWN;
	}

	static getWoundMeta (woundLevel) { return InitiativeTrackerUtil._WOUND_META[woundLevel] || InitiativeTrackerUtil._WOUND_META[WOUND_LEVEL_UNKNOWN]; }

	static _WOUND_META = {
		[WOUND_LEVEL_UNKNOWN]: {
			text: "Unknown",
			color: "#a5a5a5",
		},
		[WOUND_LEVEL_HEALTHY]: {
			text: "Healthy",
			color: MiscUtil.COLOR_HEALTHY,
		},
		[WOUND_LEVEL_INJURED]: {
			text: "Hurt",
			color: MiscUtil.COLOR_HURT,
		},
		[WOUND_LEVEL_BLOODY]: {
			text: "Bloodied",
			color: MiscUtil.COLOR_BLOODIED,
		},
		[WOUND_LEVEL_DEFEATED]: {
			text: "Defeated",
			color: MiscUtil.COLOR_DEFEATED,
		},
	};

	static CONDITIONS = [
		...Object.keys(Parser.CONDITION_TO_COLOR).map(k => ({
			name: k,
			color: Parser.CONDITION_TO_COLOR[k],
		})),
		{
			name: "Drunk",
			color: "#ffcc00",
			condName: null,
		},
		{
			name: "!!On Fire!!",
			color: "#ff6800",
			condName: null,
		},
	].sort((a, b) => SortUtil.ascSortLower(a.name.replace(/\W+/g, ""), b.name.replace(/\W+/g, "")));

	/* -------------------------------------------- */

	static getImageOrTokenHref ({imageHref, tokenUrl}) {
		return imageHref || {type: "external", url: tokenUrl};
	}
}
