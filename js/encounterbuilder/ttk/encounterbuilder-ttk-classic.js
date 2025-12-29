import {EncounterBuilderTtkBase} from "./encounterbuilder-ttk-base.js";

/**
 * - 2014 rules
 */

/**
 * Build:
 *   1 | Fighter; Variant Human - Great Weapon Master feat; Great Weapon Fighting style
 *   3 | Champion subclass
 *   4 | Polearm Master feat
 *   6 | ASI Strength
 *   8 | ASI Strength
 *
 * Turn:
 *   Halberd attacks with GWM + PAM
 */
const _APPROX_OUTPUT_FIGHTER_CHAMPION = [
	{hit: 0, dmg: 19.61}, {hit: 0, dmg: 19.61}, {hit: 0, dmg: 19.93}, {hit: 0, dmg: 35.68}, {hit: 1, dmg: 55.61}, {hit: 2, dmg: 58.61}, {hit: 2, dmg: 58.61}, {hit: 3, dmg: 61.61}, {hit: 4, dmg: 61.61}, {hit: 4, dmg: 61.61}, {hit: 4, dmg: 83.54}, {hit: 4, dmg: 83.54}, {hit: 5, dmg: 83.54}, {hit: 5, dmg: 83.54}, {hit: 5, dmg: 84.61}, {hit: 5, dmg: 84.61}, {hit: 6, dmg: 84.61}, {hit: 6, dmg: 84.61}, {hit: 6, dmg: 84.61}, {hit: 6, dmg: 106.86},
];

/**
 * Build:
 *   1 | Rogue
 *   3 | Arcane Trickster subclass; Green Flame Blade + Find Familiar
 *   4 | ASI Dexterity
 *   8 | ASI Dexterity
 *
 * Turn:
 *   Familiar uses Help action with for advantage; attack with Green Flame Blade
 */
const _APPROX_OUTPUT_ROGUE_TRICKSTER = [
	{hit: 5, dmg: 11.4}, {hit: 5, dmg: 11.4}, {hit: 10, dmg: 15.07}, {hit: 11, dmg: 16.07}, {hit: 12, dmg: 24.02}, {hit: 12, dmg: 24.02}, {hit: 12, dmg: 27.7}, {hit: 13, dmg: 28.7}, {hit: 14, dmg: 32.38}, {hit: 14, dmg: 32.38}, {hit: 14, dmg: 40.33}, {hit: 14, dmg: 40.33}, {hit: 15, dmg: 44}, {hit: 15, dmg: 44}, {hit: 15, dmg: 47.67}, {hit: 15, dmg: 47.67}, {hit: 16, dmg: 55.63}, {hit: 16, dmg: 55.63}, {hit: 16, dmg: 59.3}, {hit: 16, dmg: 59.3},
];

/**
 * Build:
 *   1 | Wizard
 *   4 | ASI Intelligence
 *   8 | ASI Intelligence
 *
 * Turn:
 *   Cast:
 *   1 | Chromatic Orb
 *   2 | Scorching Ray
 *   5 | Fireball
 *   7 | Blight
 *   9 | Animate Objects
 *   11 | Disintegrate
 *   17 | Meteor Swarm
 */
const _APPROX_OUTPUT_WIZARD = [
	{hit: 5, dmg: 14.18}, {hit: 5, dmg: 14.18}, {hit: 5, dmg: 22.05}, {hit: 6, dmg: 22.05}, {hit: 3, dmg: 28}, {hit: 3, dmg: 28}, {hit: 3, dmg: 36}, {hit: 4, dmg: 36}, {hit: 6, dmg: 67.25}, {hit: 6, dmg: 67.25}, {hit: 5, dmg: 75}, {hit: 5, dmg: 75}, {hit: 6, dmg: 85.5}, {hit: 6, dmg: 85.5}, {hit: 6, dmg: 96}, {hit: 6, dmg: 96}, {hit: 7, dmg: 140}, {hit: 7, dmg: 140}, {hit: 7, dmg: 140}, {hit: 7, dmg: 140},
];

/**
 * Build:
 *   1 | Cleric
 *   4 | ASI Wisdom
 *   8 | ASI Wisdom
 *
 * Turn:
 *   Upcast Inflict Wounds
 */
const _APPROX_OUTPUT_CLERIC = [
	{hit: 5, dmg: 17.32}, {hit: 5, dmg: 17.32}, {hit: 5, dmg: 23.1}, {hit: 6, dmg: 23.1}, {hit: 7, dmg: 28.88}, {hit: 7, dmg: 28.88}, {hit: 7, dmg: 34.65}, {hit: 8, dmg: 34.65}, {hit: 9, dmg: 40.42}, {hit: 9, dmg: 40.42}, {hit: 9, dmg: 46.2}, {hit: 9, dmg: 46.2}, {hit: 10, dmg: 51.98}, {hit: 10, dmg: 51.98}, {hit: 11, dmg: 57.75}, {hit: 11, dmg: 57.75}, {hit: 11, dmg: 63.52}, {hit: 11, dmg: 63.52}, {hit: 11, dmg: 63.52}, {hit: 11, dmg: 63.52},
];

const _APPROX_OUTPUTS = [
	_APPROX_OUTPUT_FIGHTER_CHAMPION,
	_APPROX_OUTPUT_ROGUE_TRICKSTER,
	_APPROX_OUTPUT_WIZARD,
	_APPROX_OUTPUT_CLERIC,
];

export class EncounterBuilderTtkClassic extends EncounterBuilderTtkBase {
	_approxOutputs = _APPROX_OUTPUTS;
}
