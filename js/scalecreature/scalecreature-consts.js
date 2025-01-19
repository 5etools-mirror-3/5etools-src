export class ScaleCreatureConsts {
	// DMG p274
	static CR_DPR_RANGES = {
		"0": [0, 1],
		"0.125": [2, 3],
		"0.25": [4, 5],
		"0.5": [6, 8],
		"1": [9, 14],
		"2": [15, 20],
		"3": [21, 26],
		"4": [27, 32],
		"5": [33, 38],
		"6": [39, 44],
		"7": [45, 50],
		"8": [51, 56],
		"9": [57, 62],
		"10": [63, 68],
		"11": [69, 74],
		"12": [75, 80],
		"13": [81, 86],
		"14": [87, 92],
		"15": [93, 98],
		"16": [99, 104],
		"17": [105, 110],
		"18": [111, 116],
		"19": [117, 122],
		"20": [123, 140],
		"21": [141, 158],
		"22": [159, 176],
		"23": [177, 194],
		"24": [195, 212],
		"25": [213, 230],
		"26": [231, 248],
		"27": [249, 266],
		"28": [267, 284],
		"29": [285, 302],
		"30": [303, 320],
	};

	// DMG p274
	static CR_HP_RANGES = {
		"0": [1, 6],
		"0.125": [7, 35],
		"0.25": [36, 49],
		"0.5": [50, 70],
		"1": [71, 85],
		"2": [86, 100],
		"3": [101, 115],
		"4": [116, 130],
		"5": [131, 145],
		"6": [146, 160],
		"7": [161, 175],
		"8": [176, 190],
		"9": [191, 205],
		"10": [206, 220],
		"11": [221, 235],
		"12": [236, 250],
		"13": [251, 265],
		"14": [266, 280],
		"15": [281, 295],
		"16": [296, 310],
		"17": [311, 325],
		"18": [326, 340],
		"19": [341, 355],
		"20": [356, 400],
		"21": [401, 445],
		"22": [446, 490],
		"23": [491, 535],
		"24": [536, 580],
		"25": [581, 625],
		"26": [626, 670],
		"27": [671, 715],
		"28": [716, 760],
		"29": [761, 805],
		"30": [806, 850],
	};

	// Manual smoothing applied to ensure e.g. going down a CR doesn't increase the mod
	static CR_TO_ESTIMATED_DAMAGE_MOD = {
		"0": [-1, 2],
		"0.125": [0, 2],
		"0.25": [0, 3],
		"0.5": [0, 3],
		"1": [0, 3],
		"2": [1, 4],
		"3": [1, 4],
		"4": [2, 4],
		"5": [2, 5],
		"6": [2, 5],
		"7": [2, 5],
		"8": [2, 5],
		"9": [2, 6],
		"10": [3, 6],
		"11": [3, 6],
		"12": [3, 6],
		"13": [3, 7],
		"14": [3, 7],
		"15": [3, 7],
		"16": [4, 8],
		"17": [4, 8],
		"18": [4, 8],
		"19": [5, 8],
		"20": [6, 9],
		"21": [6, 9],
		"22": [6, 10],
		"23": [6, 10],
		"24": [6, 11],
		"25": [7, 11],
		"26": [7, 11],
		// region No creatures for these CRs; use 26 with modifications
		"27": [7, 11],
		"28": [8, 11],
		"29": [8, 11],
		// endregion
		"30": [9, 11],
	};
}