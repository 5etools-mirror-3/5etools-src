export const TIER_EASY = "easy";
export const TIER_STANDARD = "standard";
export const TIER_HARD = "hard";
export const TIER_EXTREME = "extreme";

export const TIERS = [TIER_EASY, TIER_STANDARD, TIER_HARD];
export const TIERS_EXTENDED = [...TIERS, TIER_EXTREME];

export const TIER_TO_LEVEL_CR = {
	[TIER_EASY]: [0, 0.125, 0.125, 0.25, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5],
	[TIER_STANDARD]: [0, 0.125, 0.25, 0.5, 0.75, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9],
	[TIER_HARD]: [0, 0.25, 0.5, 0.75, 1, 2.5, 3, 3.5, 4, 4.5, 6, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10],
};

export const LEVEL_CR_CAP = [1, 3, 4, 6, 8, 9, 10, 12, 13, 15, 16, 17, 19, 20, 22, 24, 25, 26, 28, 30];

export const TIER_TO_ENCOUNTER_POINTS = {
	[TIER_EASY]: 1,
	[TIER_STANDARD]: 2,
	[TIER_HARD]: 4,
	[TIER_EXTREME]: 8,
};
