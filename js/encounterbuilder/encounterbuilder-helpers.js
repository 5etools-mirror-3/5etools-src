export class EncounterBuilderHelpers {
	static getCrCutoff (creatureMetas, partyMeta) {
		creatureMetas = creatureMetas
			.filter(creatureMeta => creatureMeta.getCrNumber() != null)
			.sort((a, b) => SortUtil.ascSort(b.getCrNumber(), a.getCrNumber()));
		if (!creatureMetas.length) return 0;

		// no cutoff for CR 0-2
		if (creatureMetas[0].getCrNumber() <= 2) return 0;

		// ===============================================================================================================
		// "When making this calculation, don't count any monsters whose challenge rating is significantly below the average
		// challenge rating of the other monsters in the group unless you think the weak monsters significantly contribute
		// to the difficulty of the encounter." -- DMG, p. 82
		// ===============================================================================================================

		// "unless you think the weak monsters significantly contribute to the difficulty of the encounter"
		// For player levels <5, always include every monster. We assume that levels 5> will have strong
		//   AoE/multiattack, allowing trash to be quickly cleared.
		if (!partyMeta.isPartyLevelFivePlus()) return 0;

		// Spread the CRs into a single array
		const crValues = [];
		creatureMetas.forEach(creatureMeta => {
			const cr = creatureMeta.getCrNumber();
			for (let i = 0; i < creatureMeta.count; ++i) crValues.push(cr);
		});

		// TODO(Future) allow this to be controlled by the user
		let CR_THRESH_MODE = "statisticallySignificant";

		switch (CR_THRESH_MODE) {
			// "Statistically significant" method--note that this produces very passive filtering; the threshold is below
			//   the minimum CR in the vast majority of cases.
			case "statisticallySignificant": {
				const cpy = MiscUtil.copy(crValues)
					.sort(SortUtil.ascSort);

				const avg = cpy.mean();
				const deviation = cpy.meanAbsoluteDeviation();

				return avg - (deviation * 2);
			}

			case "5etools": {
				// The ideal interpretation of this:
				//   "don't count any monsters whose challenge rating is significantly below the average
				//   challenge rating of the other monsters in the group"
				// Is:
				//   Arrange the creatures in CR order, lowest to highest. Remove the lowest CR creature (or one of them, if there
				//   are ties). Calculate the average CR without this removed creature. If the removed creature's CR is
				//   "significantly below" this average, repeat the process with the next lowest CR creature.
				// However, this can produce a stair-step pattern where our average CR keeps climbing as we remove more and more
				//   creatures. Therefore, only do this "remove creature -> calculate average CR" step _once_, and use the
				//   resulting average CR to calculate a cutoff.

				const crMetas = [];

				// If there's precisely one CR value, use it
				if (crValues.length === 1) {
					crMetas.push({
						mean: crValues[0],
						deviation: 0,
					});
				} else {
					// Get an average CR for every possible encounter without one of the creatures in the encounter
					for (let i = 0; i < crValues.length; ++i) {
						const crValueFilt = crValues.filter((_, j) => i !== j);
						const crMean = crValueFilt.mean();
						const crStdDev = Math.sqrt((1 / crValueFilt.length) * crValueFilt.map(it => (it - crMean) ** 2).reduce((a, b) => a + b, 0));
						crMetas.push({mean: crMean, deviation: crStdDev});
					}
				}

				// Sort by descending average CR -> ascending deviation
				crMetas.sort((a, b) => SortUtil.ascSort(b.mean, a.mean) || SortUtil.ascSort(a.deviation, b.deviation));

				// "significantly below the average" -> cutoff at half the average
				return crMetas[0].mean / 2;
			}

			default: return 0;
		}
	}
}
