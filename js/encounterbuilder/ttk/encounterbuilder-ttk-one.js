import {EncounterBuilderTtkBase} from "./encounterbuilder-ttk-base.js";

/**
 * - 2024 rules
 */

/**
 * Build:
 *   1 | Fighter; Great Weapon Fighting feat
 *   3 | Psi Warrior subclass
 *   4 | Great Weapon Master feat
 *   6 | ASI Strength
 *   8 | ASI Strength
 *
 * Turn:
 *   Greatsword attacks with GWM
 */
const _APPROX_OUTPUT_FIGHTER_PSI_WARRIOR = [
	{hit: 5, dmg: 14.4}, {hit: 5, dmg: 14.4}, {hit: 5, dmg: 18.65}, {hit: 5, dmg: 20.65}, {hit: 6, dmg: 42.5}, {hit: 7, dmg: 45.5}, {hit: 7, dmg: 45.5}, {hit: 8, dmg: 48.5}, {hit: 9, dmg: 50.5}, {hit: 9, dmg: 50.5}, {hit: 9, dmg: 76.55}, {hit: 9, dmg: 76.55}, {hit: 10, dmg: 79.55}, {hit: 10, dmg: 79.55}, {hit: 10, dmg: 81.58}, {hit: 10, dmg: 81.58}, {hit: 11, dmg: 84.58}, {hit: 11, dmg: 88.03}, {hit: 11, dmg: 88.03}, {hit: 11, dmg: 115.7},
];

/**
 * Build:
 *   1 | Rogue; Eladrin species (proficiency with Heavy Crossbow)
 *   4 | Great Weapon Master feat
 *   8 | ASI Dexterity
 *   10 | ASI Dexterity
 *
 * Turn:
 *   Heavy Crossbow attacks with Steady Aim and GWM
 */
const _APPROX_OUTPUT_ROGUE = [
	{hit: 5, dmg: 12.45}, {hit: 5, dmg: 12.45}, {hit: 10, dmg: 16.13}, {hit: 10, dmg: 18.13}, {hit: 11, dmg: 22.8}, {hit: 11, dmg: 22.8}, {hit: 11, dmg: 26.48}, {hit: 12, dmg: 27.48}, {hit: 13, dmg: 32.15}, {hit: 14, dmg: 30.15}, {hit: 14, dmg: 36.83}, {hit: 14, dmg: 36.83}, {hit: 15, dmg: 41.5}, {hit: 15, dmg: 41.5}, {hit: 15, dmg: 45.17}, {hit: 15, dmg: 45.17}, {hit: 16, dmg: 49.85}, {hit: 16, dmg: 49.85}, {hit: 16, dmg: 53.52}, {hit: 16, dmg: 53.52},
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
 *   3 | Scorching Ray
 *   5 | Fireball
 *   7 | Blight
 *   9 | Animate Objects
 *   11 | Disintegrate
 *   17 | Meteor Swarm
 */
const _APPROX_OUTPUT_WIZARD = [
	{hit: 5, dmg: 14.18}, {hit: 5, dmg: 14.18}, {hit: 5, dmg: 22.05}, {hit: 6, dmg: 22.05}, {hit: 3, dmg: 28}, {hit: 3, dmg: 28}, {hit: 3, dmg: 36}, {hit: 4, dmg: 36}, {hit: 9, dmg: 53.13}, {hit: 9, dmg: 53.13}, {hit: 5, dmg: 75}, {hit: 5, dmg: 75}, {hit: 6, dmg: 85.5}, {hit: 6, dmg: 85.5}, {hit: 6, dmg: 96}, {hit: 6, dmg: 96}, {hit: 7, dmg: 140}, {hit: 7, dmg: 140}, {hit: 7, dmg: 140}, {hit: 7, dmg: 140},
];

/**
 * Build:
 *   1 | Cleric
 *   4 | ASI Wisdom
 *   8 | ASI Wisdom
 *
 * Turn:
 *   Cast:
 *   1 | Guiding Bolt
 *   3 | Scorching Ray
 *   5 | Fireball
 *   11 | Harm
 *   17 | Conjure Celestial
 */
const _APPROX_OUTPUT_CLERIC_LIGHT = [
	{hit: 5, dmg: 14.7}, {hit: 5, dmg: 14.7}, {hit: 5, dmg: 22.05}, {hit: 6, dmg: 22.05}, {hit: 3, dmg: 28}, {hit: 3, dmg: 28}, {hit: 3, dmg: 31.5}, {hit: 4, dmg: 31.5}, {hit: 5, dmg: 35}, {hit: 5, dmg: 35}, {hit: 5, dmg: 49}, {hit: 5, dmg: 49}, {hit: 6, dmg: 49}, {hit: 6, dmg: 49}, {hit: 6, dmg: 49}, {hit: 6, dmg: 49}, {hit: 7, dmg: 52}, {hit: 7, dmg: 52}, {hit: 7, dmg: 52}, {hit: 7, dmg: 52},
];

const _APPROX_OUTPUTS = [
	_APPROX_OUTPUT_FIGHTER_PSI_WARRIOR,
	_APPROX_OUTPUT_ROGUE,
	_APPROX_OUTPUT_WIZARD,
	_APPROX_OUTPUT_CLERIC_LIGHT,
];

export class EncounterbuilderTtkOne extends EncounterBuilderTtkBase {
	_approxOutputs = _APPROX_OUTPUTS;
}
