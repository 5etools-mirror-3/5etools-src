import {CreatureSlot, EncounterTemplateOptions} from "./encounterbuilder-templater-models.js";
import {EncounterBuilderTemplaterBase} from "./encounterbuilder-templater-base.js";

class _ResolvedEncounterShape {
	constructor ({name, source, groups}) {
		this.name = name;
		this.source = source;
		this.groups = groups;
	}
}

// TODO(Future) support "free" creatures?
export class EncounterbuilderTemplaterTemplated extends EncounterBuilderTemplaterBase {
	constructor ({encounterShape, ...rest}) {
		super({...rest});
		this._encounterShape = encounterShape;
	}

	getEncounterTemplateInfo () {
		if (this._creatureMetasLocked?.length) return new EncounterTemplateOptions({message: `Only the "Random" encounter type may be used with locked creatures! Unlock your creatures, or use the "Random" encounter type.`});

		const resolvedEncounterShapes = this._getResolvedEncounterShapes();
		if (!resolvedEncounterShapes.length) return new EncounterTemplateOptions({message: `Failed to generate encounter! You may need to add some players first.`});

		const creatureSlotBundles = resolvedEncounterShapes
			.flatMap(encounterShape => {
				const cntCreatures = encounterShape.groups
					.map(group => group.count)
					.sum();

				return this._getPossibleBudgets({cntCreatures})
					.map(budget => {
						let budgetRemaining = budget;

						const creatureSlots = encounterShape.groups
							.map(group => {
								const groupBudget = group.ratio
									? budget * group.ratio
									: budgetRemaining;

								const singleCreatureBudget = groupBudget / group.count;

								const availableSpendKeys = this._spendKeys
									// Don't allow "free" creatures
									// TODO(Future)
									.filter(Boolean)
									.filter(spendKey => spendKey <= singleCreatureBudget);

								if (!availableSpendKeys.length) return null;

								const spendAmount = Math.max(...availableSpendKeys);

								budgetRemaining -= group.count * spendAmount;

								return new CreatureSlot({
									spendAmount,
									count: group.count,
								});
							});

						if (creatureSlots.some(it => it == null)) return null;
						return creatureSlots;
					})
					.filter(Boolean);
			});

		if (!creatureSlotBundles.length) return new EncounterTemplateOptions();

		return new EncounterTemplateOptions({
			templateOptions: this._getTemplateOptions({
				categorizedCreatureSlotBundlesBase: this._getCategorizedCreatureSlotBundles({
					creatureSlotBundles: creatureSlotBundles,
				}),
			}),
			isUniqueKeys: true,
		});
	}

	/* -------------------------------------------- */

	_getNumericalTerm (val) {
		if (val.num != null && val.denom != null) return val.num / val.denom;
		return val;
	}

	_getValueInRange ({min, max, forceMinMax, isRound = false}) {
		if (forceMinMax === "min") return min;
		if (forceMinMax === "max") return max;

		if (max < min) max = min;
		let interp = Math.random() * (max - min);
		if (isRound) interp = Math.round(interp);
		return min + interp;
	}

	_getEvaluatedTerm ({term, forceMinMax = null, isRound = false}) {
		if (term.exact != null) {
			return this._getNumericalTerm(term.exact);
		}

		if (term.min != null && term.max != null) {
			return this._getValueInRange({
				min: this._getNumericalTerm(term.min),
				max: this._getNumericalTerm(term.max),
				forceMinMax,
				isRound,
			});
		}

		if (term.formulaMin != null && term.formulaMax) {
			let [min, max] = [
				term.formulaMin,
				term.formulaMax,
			]
				.map(formula => {
					const out = Renderer.dice.parseRandomise2(formula.replace(/\bplayers\b/g, this._partyMeta.cntPlayers));
					if (isNaN(out)) throw new Error(`Could not evaluate formula "${formula}"!`);
					return out;
				});
			return this._getValueInRange({min, max, forceMinMax, isRound});
		}

		throw new Error(`Unhandled term "${JSON.stringify(term, null, "\t")}"!`);
	}

	_getResolvedEncounterShapes () {
		return this._encounterShape.shapeTemplate
			.flatMap(shapeTemplate => {
				const cpyShapeTemplate = MiscUtil.copyFast(shapeTemplate);

				return this._getResolvedEncounterShapesFromShapeTemplate({
					name: this._encounterShape.name,
					source: this._encounterShape.source,
					shapeTemplate: cpyShapeTemplate,
				});
			})
			.filter(Boolean);
	}

	_getResolvedEncounterShapesFromShapeTemplate ({name, source, shapeTemplate}) {
		if (!this.constructor._isEncounterShapeShapeTemplateVariable({shapeTemplate})) {
			return [
				this._getResolvedEncounterShapeFromTemplate({name, source, shapeTemplate}),
			]
				.filter(Boolean);
		}

		return [
			this._getResolvedEncounterShapeFromTemplate({name, source, shapeTemplate, forceMinMax: "min"}),
			this._getResolvedEncounterShapeFromTemplate({name, source, shapeTemplate}),
			this._getResolvedEncounterShapeFromTemplate({name, source, shapeTemplate, forceMinMax: "max"}),
		]
			.filter(Boolean);
	}

	static _isEncounterShapeShapeTemplateVariable ({shapeTemplate}) {
		return shapeTemplate.groups
			.some(group => {
				return [
					"count",
					"ratio",
				]
					.some(prop => {
						if (group[prop] == null) return false;
						if (group[prop].exact != null) return false;
						return group[prop].min != null || group[prop].formulaMin != null;
					});
			});
	}

	/**
	 * @param name
	 * @param source
	 * @param shapeTemplate
	 * @param {"min" | "max" | null} forceMinMax
	 */
	_getResolvedEncounterShapeFromTemplate ({name, source, shapeTemplate, forceMinMax = null}) {
		const cpyShapeTemplate = MiscUtil.copyFast(shapeTemplate);

		cpyShapeTemplate.groups = cpyShapeTemplate.groups
			.map(group => {
				return {
					...group.count
						? {count: {exact: this._getEvaluatedTerm({term: group.count, forceMinMax, isRound: true})}}
						: {},
					...group.ratio
						? {ratio: {exact: this._getEvaluatedTerm({term: group.ratio, forceMinMax})}}
						: {},
				};
			})
			.filter(group => group.count?.exact);

		if (!cpyShapeTemplate.groups.length) return null;

		this._mutShapeTemplateAddRatios({shapeTemplate: cpyShapeTemplate});

		const resolvedGroups = cpyShapeTemplate.groups
			.map(group => {
				return {
					count: group.count ? this._getEvaluatedTerm({term: group.count, forceMinMax, isRound: true}) : null,
					ratio: group.ratio ? this._getEvaluatedTerm({term: group.ratio, forceMinMax}) : null,
				};
			})
			.filter(group => group.count);

		return new _ResolvedEncounterShape({
			name,
			source,
			groups: resolvedGroups,
		});
	}

	_mutShapeTemplateAddRatios ({shapeTemplate}) {
		const [nonRatioGroups, ratioGroups] = shapeTemplate.groups.segregate(group => group.ratio == null);
		if (!nonRatioGroups.length) return;

		const {usedMinRatio, usedMaxRatio} = ratioGroups
			.reduce((accum, group) => {
				if (group.ratio.exact != null) {
					accum.usedMinRatio += this._getNumericalTerm(group.ratio.exact);
					accum.usedMaxRatio += this._getNumericalTerm(group.ratio.exact);
					return accum;
				}

				if (group.ratio.min != null && group.ratio.max != null) {
					accum.usedMinRatio += this._getNumericalTerm(group.ratio.min);
					accum.usedMaxRatio += this._getNumericalTerm(group.ratio.max);
					return accum;
				}

				throw new Error(`Unhandled group ratio "${JSON.stringify(group.ratio, null, "\t")}"!`);
			}, {usedMinRatio: 0, usedMaxRatio: 0});

		const minRatioToDistribute = Math.max(1 - usedMinRatio, 0);
		const maxRatioToDistribute = Math.max(1 - usedMaxRatio, 0);

		nonRatioGroups
			.forEach(group => {
				if (minRatioToDistribute === maxRatioToDistribute) {
					group.ratio = {exact: minRatioToDistribute / nonRatioGroups.length};
					return;
				}
				group.ratio = {min: minRatioToDistribute / nonRatioGroups.length, max: maxRatioToDistribute / nonRatioGroups.len};
			});
	}

	/* -------------------------------------------- */

	_getPossibleBudgets ({cntCreatures}) {
		const spendMultiplier = this._partyMeta.getPlayerAdjustedSpendMultiplier(cntCreatures);

		return this._getPossibleBudgetsPreMultiplier()
			.map(budget => budget / spendMultiplier);
	}

	_getPossibleBudgetsPreMultiplier () {
		if (this._budgetMin === this._budgetMax) return [this._budgetMin];

		const deltaBudget = this._budgetMax - this._budgetMin;
		const cntInterpPoints = 4; // 20%, 40%, 60%, 80%
		const fudgeAmount = 1 / (cntInterpPoints + 1) / 2; // 10% fudge, applied as +/- 5%

		return [
			this._budgetMin, // 0%
			...Array.from({length: cntInterpPoints})
				.map((_, i) => {
					const fudgedMult = ((i + 1) / (cntInterpPoints + 1))
						- fudgeAmount
						+ (Math.random() * fudgeAmount);
					return this._budgetMin + (deltaBudget * fudgedMult);
				}),
			this._budgetMax, // 100%
		];
	}
}
