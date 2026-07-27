import {PANEL_TYP_INITIATIVE_TRACKER} from "../dmscreen-consts.js";
import {DmScreenUtil} from "../dmscreen-util.js";
import {EncounterBuilderHelpers, ListUtilBestiary} from "../../utils-list-bestiary.js";
import {VetoolsConfig} from "../../utils-config/utils-config-config.js";
import {DmScreenPanelAppBase} from "./dmscreen-panelapp-base.js";

export class TimerTrackerMoonSpriteLoader {
	static _TIME_TRACKER_MOON_SPRITE = new Image();
	static _TIME_TRACKER_MOON_SPRITE_LOADER = null;
	static _hasError = false;

	static async pInit () {
		this._TIME_TRACKER_MOON_SPRITE_LOADER ||= new Promise(resolve => {
			this._TIME_TRACKER_MOON_SPRITE.onload = resolve;
			this._TIME_TRACKER_MOON_SPRITE.onerror = () => {
				this._hasError = true;
				resolve();
			};
		});

		this._TIME_TRACKER_MOON_SPRITE.src ||= Renderer.get().getMediaUrl("img", "dmscreen/moon.webp");

		await this._TIME_TRACKER_MOON_SPRITE_LOADER;
	}

	static hasError () { return this._hasError; }
	static getImage () { return this._TIME_TRACKER_MOON_SPRITE; }
}

export class TimeTracker extends DmScreenPanelAppBase {
	constructor (...args) {
		super(...args);

		this._comp = null;
	}

	_getPanelElement (board, state) {
		const wrpPanel = veT`<div class="ve-w-100 ve-h-100 dm-time__root dm__panel-bg"></div>`;
		this._comp = new TimeTrackerRoot(board, wrpPanel);
		state = TimeTrackerUtil.getMigratedState(state);
		this._comp.setStateFrom(state);
		this._comp.render(wrpPanel);
		return wrpPanel;
	}

	getState () {
		return this._comp.getSaveableState();
	}
}

class TimeTrackerUtil {
	static pGetUserWindBearing (def) {
		return InputUiUtil.pGetUserDirection({
			title: "Wind Bearing (Direction)",
			default: def,
			stepButtons: ["N", "NE", "E", "SE", "S", "SW", "W", "NW"],
		});
	}

	static revSlugToText (it) {
		return it.split("-").reverse().map(s => s.split("|").join("- ")).join(" ").toTitleCase();
	}

	static getMigratedState (state) {
		if (!state?.state) return state;

		// region Migrate legacy sub-objects
		["days", "months", "years", "eras", "moons", "seasons"]
			.forEach(prop => {
				if (!state.state[prop]) return;
				if (state.state[prop] instanceof Array) return;
				if (typeof state.state[prop] !== "object") return;

				state.state[prop] = Object.values(state.state[prop])
					.map(({id, ...rest}) => ({id, data: rest}));
			});
		// endregion

		return state;
	}
}

class TimeTrackerComponent extends BaseComponent {
	/**
	 * @param board DM Screen board.
	 * @param wrpPanel Panel wrapper element for us to populate.
	 * @param [opts] Options object.
	 * @param [opts.isTemporary] If this object should not save state to the board.
	 */
	constructor (board, wrpPanel, opts) {
		super();
		opts = opts || {};

		this._board = board;
		this._wrpPanel = wrpPanel;
		if (!opts.isTemporary) this._addHookAll("state", () => this._board.doSaveStateDebounced());
	}

	getPod () {
		const out = super.getPod();
		out.triggerMapUpdate = (prop) => this._triggerMapUpdate(prop);
		return out;
	}

	/**
	 * Trigger an update for a collection, auto-filtering deleted entries. The collection stored
	 * at the prop should be a map of `id:state`.
	 * @param prop The state property.
	 */
	_triggerMapUpdate (prop) {
		this._state[prop] = Object.values(this._state[prop])
			.filter(it => !it.isDeleted)
			.mergeMap(it => ({[it.id]: it}));
	}
}

class TimeTrackerBase extends TimeTrackerComponent {
	/**
	 * @param [opts] Options object.
	 * @param [opts.isBase] True to forcibly use base time, false to let the component decide.
	 * @returns {object}
	 */
	_getTimeInfo (opts) {
		opts = opts || {};

		let numSecs;
		// Discard millis
		if (opts.numSecs != null) numSecs = opts.numSecs;
		else if (!opts.isBase && this._state.isBrowseMode && this._state.browseTime != null) numSecs = Math.round(this._state.browseTime / 1000);
		else numSecs = Math.round(this._state.time / 1000);
		numSecs = Math.max(0, numSecs);

		const secsPerMinute = this._state.secondsPerMinute;
		const secsPerHour = secsPerMinute * this._state.minutesPerHour;
		const secsPerDay = secsPerHour * this._state.hoursPerDay;

		const numDays = Math.floor(numSecs / secsPerDay);
		numSecs = numSecs - (numDays * secsPerDay);

		const numHours = Math.floor(numSecs / secsPerHour);
		numSecs = numSecs - (numHours * secsPerHour);

		const numMinutes = Math.floor(numSecs / secsPerMinute);
		numSecs = numSecs - (numMinutes * secsPerMinute);

		const dayInfos = this._state.days
			.map(it => it.data);

		const monthInfos = this._state.months
			.map(it => it.data);

		const seasonInfos = this._state.seasons
			.map(it => it.data)
			.sort((a, b) => SortUtil.ascSort(a.startDay, b.startDay));

		const yearInfos = this._state.years
			.map(it => it.data)
			.sort((a, b) => SortUtil.ascSort(a.year, b.year));

		const eraInfos = this._state.eras
			.map(it => it.data)
			.sort((a, b) => SortUtil.ascSort(a.startYear, b.startYear));

		const secsPerYear = secsPerDay * monthInfos.map(it => it.days).reduce((a, b) => a + b, 0);
		const daysPerWeek = dayInfos.length;
		const secsPerWeek = secsPerDay * daysPerWeek;
		const dayOfWeek = numDays % daysPerWeek;
		const daysPerYear = monthInfos.map(it => it.days).reduce((a, b) => a + b, 0);
		const dayOfYear = numDays % daysPerYear;

		const out = {
			// handy stats
			secsPerMinute,
			minutesPerHour: this._state.minutesPerHour,
			hoursPerDay: this._state.hoursPerDay,
			secsPerHour,
			secsPerDay,
			secsPerWeek,
			secsPerYear,
			daysPerWeek,
			daysPerYear,
			monthsPerYear: monthInfos.length,

			// clock
			numSecs,
			numMinutes,
			numHours,
			numDays,
			timeOfDaySecs: numSecs + (numMinutes * secsPerMinute) + (numHours * secsPerHour),

			// calendar
			date: 0, // current day in month, i.e. 0-30 for a 31-day month
			month: 0, // current month in year, i.e. 0-11 for a 12-month year
			year: 0,
			dayOfWeek,
			dayOfYear,
			monthStartDay: 0, // day the current month starts on, i.e. 0-6 for a 7-day week; e.g. if the first day of the current month is a Wednesday, this will be set to 2
			monthInfo: {...monthInfos[0]},
			prevMonthInfo: {...monthInfos.last()},
			nextMonthInfo: {...(monthInfos[1] || monthInfos[0])},
			dayInfo: {...dayInfos[dayOfWeek]},
			monthStartDayOfYear: 0, // day in the current year that the current month starts on, e.g. "31" for the first day of February, or "58" for the first day of March
			weekOfYear: 0,
			seasonInfos: [],
			yearInfos: [],
			eraInfos: [],
		};

		let tmpDays = numDays;
		outer: while (tmpDays > 0) {
			for (let i = 0; i < monthInfos.length; ++i) {
				const m = monthInfos[i];
				for (let j = 0; j < m.days; ++j, --tmpDays) {
					if (tmpDays === 0) {
						out.date = j;
						out.month = i;
						out.monthInfo = {...m};

						if (i > 0) out.prevMonthInfo = monthInfos[i - 1];
						if (i < monthInfos.length - 1) out.nextMonthInfo = monthInfos[i + 1];
						else out.nextMonthInfo = monthInfos[0];

						break outer;
					}
				}
				out.monthStartDayOfYear += m.days;
			}
			out.year++;
			out.monthStartDayOfYear = out.monthStartDayOfYear % daysPerYear;
		}
		out.monthStartDay = (numDays - out.date) % daysPerWeek;
		if (seasonInfos.length) out.seasonInfos = seasonInfos.filter(it => dayOfYear >= it.startDay && dayOfYear <= it.endDay);

		// offsets
		out.year += this._state.offsetYears;
		out.monthStartDay += this._state.offsetMonthStartDay; out.monthStartDay %= daysPerWeek;
		out.dayInfo = dayInfos[(dayOfWeek + this._state.offsetMonthStartDay) % daysPerWeek];

		// track the current week of the year, compensated for offsets
		out.weekOfYear = (out.year * (daysPerYear % daysPerWeek)) % daysPerWeek;
		// collect year/era info after offsets, so the user doesn't have to do math
		if (yearInfos.length) out.yearInfos = yearInfos.filter(it => out.year === it.year);
		if (eraInfos.length) {
			out.eraInfos = eraInfos.filter(it => out.year >= it.startYear && out.year <= it.endYear)
				.map(it => {
					const cpy = MiscUtil.copy(it);
					cpy.dayOfEra = out.year - cpy.startYear;
					return cpy;
				});
		}

		if (opts.year != null || opts.dayOfYear != null) {
			const now = Math.round((this._state.isBrowseMode && this._state.browseTime != null ? this._state.browseTime : this._state.time) / 1000);

			const diffSecsYear = opts.year != null ? (out.year - opts.year) * secsPerYear : 0;
			const diffSecsDay = opts.dayOfYear != null ? (dayOfYear - opts.dayOfYear) * secsPerDay : 0;
			return this._getTimeInfo({numSecs: now - (diffSecsYear + diffSecsDay)});
		} else return out;
	}

	_getEvents (year, dayOfYear) { return this._getEncountersEvents("events", year, dayOfYear); }

	_getEncounters (year, dayOfYear) { return this._getEncountersEvents("encounters", year, dayOfYear); }

	_getEncountersEvents (prop, year, dayOfYear) {
		return Object.values(this._state[prop])
			.filter(it => !it.isDeleted)
			.filter(it => {
				if (it.when.year != null && it.when.day != null) {
					return it.when.year === year && it.when.day === dayOfYear;
				}

				// TODO consider expanding this in future
				//  - will also require changes to the event creation/management UI
				// else if (it.when.weekday != null) {...}
				// else if (it.when.fortnightDay != null) {...}
				// ... etc
			})
			.sort((a, b) => {
				if (a.hasTime && !b.hasTime) return 1;
				if (!a.hasTime && b.hasTime) return -1;
				if (a.hasTime && b.hasTime) return SortUtil.ascSort(a.timeOfDaySecs, b.timeOfDaySecs) || SortUtil.ascSort(a.pos, b.pos);
				return SortUtil.ascSort(a.pos, b.pos);
			});
	}

	_getMoonInfos (numDays) {
		const moons = this._state.moons
			.map(it => it.data)
			.sort((a, b) => SortUtil.ascSort(a.phaseOffset, b.phaseOffset) || SortUtil.ascSort(a.name, b.name));

		return moons.map(moon => {
			// this should be never occur
			if (moon.period <= 0) throw new Error(`Invalid moon period "${moon.period}", should be greater than zero!`);

			const offsetNumDays = numDays - moon.phaseOffset;
			let dayOfPeriod = offsetNumDays % moon.period;
			while (dayOfPeriod < 0) dayOfPeriod += moon.period;

			const ixPhase = Math.floor((dayOfPeriod / moon.period) * 8);
			const phaseNameSlug = TimeTrackerBase._MOON_PHASES[ixPhase === 8 ? 0 : ixPhase];
			const phaseFirstDay = (Math.floor(((dayOfPeriod - 1) / moon.period) * 8) === ixPhase - 1); // going back a day would take us to the previous phase

			return {
				color: moon.color,
				name: moon.name,
				period: moon.period,
				phaseName: phaseNameSlug.split("-").map(it => it.uppercaseFirst()).join(" "),
				phaseFirstDay: phaseFirstDay,
				phaseIndex: ixPhase,
				dayOfPeriod,
			};
		});
	}

	_getAllDayInfos () {
		return this._state.days
			.map(it => it.data);
	}

	/**
	 * @param deltaSecs Time modification, in seconds.
	 * @param [opts] Options object.
	 * @param [opts.isBase] True if the base time should be forcibly modified; false if the method should choose.
	 */
	_doModTime (deltaSecs, opts) {
		opts = opts || {};
		const prop = !opts.isBase && this._state.isBrowseMode && this._state.browseTime != null ? "browseTime" : "time";
		const oldTime = this._state[prop];
		this._state[prop] = Math.max(0, oldTime + Math.round(deltaSecs * 1000));
	}

	_getDefaultState () { return MiscUtil.copy(TimeTrackerBase._DEFAULT_STATE); }

	get _rendered () { return this.__rendered; }

	getPod () {
		const pod = super.getPod();
		pod.getTimeInfo = this._getTimeInfo.bind(this);
		pod.getEvents = this._getEvents.bind(this);
		pod.getEncounters = this._getEncounters.bind(this);
		pod.getMoonInfos = this._getMoonInfos.bind(this);
		pod.doModTime = this._doModTime.bind(this);
		pod.getAllDayInfos = this._getAllDayInfos.bind(this);
		return pod;
	}

	static getGenericDay (i) {
		return {
			id: CryptUtil.uid(),
			data: {
				...TimeTrackerBase._DEFAULT_STATE__DAY,
				name: `${Parser.numberToText(i + 1)}day`.uppercaseFirst(),
			},
		};
	}

	static getGenericMonth (i) {
		return {
			id: CryptUtil.uid(),
			data: {
				...TimeTrackerBase._DEFAULT_STATE__MONTH,
				name: `${Parser.numberToText(i + 1)}uary`.uppercaseFirst(),
				days: 30,
			},
		};
	}

	static getGenericEvent (pos, year, eventDay, timeOfDaySecs) {
		const out = {
			...MiscUtil.copy(TimeTrackerBase._DEFAULT_STATE__EVENT),
			id: CryptUtil.uid(),
			pos,
		};
		if (year != null) out.when.year = year;
		if (eventDay != null) out.when.day = eventDay;
		if (timeOfDaySecs != null) {
			out.timeOfDaySecs = timeOfDaySecs;
			out.hasTime = true;
		}
		return out;
	}

	static getGenericEncounter (pos, year, encounterDay, timeOfDaySecs) {
		const out = {
			...MiscUtil.copy(TimeTrackerBase._DEFAULT_STATE__ENCOUNTER),
			id: CryptUtil.uid(),
			pos,
		};
		if (year != null) out.when.year = year;
		if (encounterDay != null) out.when.day = encounterDay;
		if (timeOfDaySecs != null) {
			out.timeOfDaySecs = timeOfDaySecs;
			out.hasTime = true;
		}
		return out;
	}

	static getGenericSeason (i) {
		return {
			id: CryptUtil.uid(),
			data: {
				...TimeTrackerBase._DEFAULT_STATE__SEASON,
				name: `Season ${i + 1}`,
				startDay: i * 90,
				endDay: ((i + 1) * 90) - 1,
			},
		};
	}

	static getGenericYear (i) {
		return {
			id: CryptUtil.uid(),
			data: {
				...TimeTrackerBase._DEFAULT_STATE__YEAR,
				name: `Year of the ${Parser.numberToText(i + 1).uppercaseFirst()}s`,
				year: i,
			},
		};
	}

	static getGenericEra (i) {
		const symbol = Parser.ALPHABET[i % Parser.ALPHABET.length];
		return {
			id: CryptUtil.uid(),
			data: {
				...TimeTrackerBase._DEFAULT_STATE__ERA,
				name: `${Parser.getOrdinalForm(i + 1)} Era`,
				abbreviation: `${symbol}E`,
				startYear: i,
				endYear: i,
			},
		};
	}

	static getGenericMoon (i) {
		return {
			id: CryptUtil.uid(),
			data: {
				...TimeTrackerBase._DEFAULT_STATE__MOON,
				name: `Moon ${i + 1}`,
			},
		};
	}

	static formatDateInfo (dayInfo, date, monthInfo, seasonInfos) {
		return `${dayInfo.name || "[Nameless day]"} ${Parser.getOrdinalForm(date + 1)} ${monthInfo.name || "[Nameless month]"}${seasonInfos.length ? ` (${seasonInfos.map(it => it.name || "[Nameless season]").join("/")})` : ""}`;
	}

	static formatYearInfo (year, yearInfos, eraInfos, abbreviate) {
		return `Year ${year + 1}${yearInfos.length ? ` (<span class="ve-italic">${yearInfos.map(it => it.name.escapeQuotes()).join("/")}</span>)` : ""}${eraInfos.length ? `, ${eraInfos.map(it => `${it.dayOfEra + 1} <span ${abbreviate ? `title="${it.name.escapeQuotes()}"` : ``}>${(abbreviate ? it.abbreviation : it.name).escapeQuotes()}</span>${abbreviate ? "" : ` (${it.abbreviation.escapeQuotes()})`}`).join("/")}` : ""}`;
	}

	static getCvsMoon (moonInfo) {
		const cvs = veT`<canvas title="${moonInfo.name.escapeQuotes()}\u2014${moonInfo.phaseName}" class="dm-time__cvs-moon" width="${TimeTrackerBase._MOON_RENDER_RES}" height="${TimeTrackerBase._MOON_RENDER_RES}"></canvas>`;
		const ctx = cvs.getContext("2d");

		// draw image
		if (!TimerTrackerMoonSpriteLoader.hasError()) {
			ctx.drawImage(
				TimerTrackerMoonSpriteLoader.getImage(),
				moonInfo.phaseIndex * TimeTrackerBase._MOON_RENDER_RES, // source x
				0, // source y
				TimeTrackerBase._MOON_RENDER_RES, // source w
				TimeTrackerBase._MOON_RENDER_RES, // source h
				0, // dest x
				0, // dest y
				TimeTrackerBase._MOON_RENDER_RES, // dest w
				TimeTrackerBase._MOON_RENDER_RES, // dest h
			);
		}

		// overlay color
		ctx.globalCompositeOperation = "multiply";
		ctx.fillStyle = moonInfo.color;
		ctx.rect(0, 0, TimeTrackerBase._MOON_RENDER_RES, TimeTrackerBase._MOON_RENDER_RES);
		ctx.fill();
		ctx.closePath();
		ctx.globalCompositeOperation = "source-over";

		// draw border
		ctx.beginPath();
		ctx.arc(TimeTrackerBase._MOON_RENDER_RES / 2, TimeTrackerBase._MOON_RENDER_RES / 2, TimeTrackerBase._MOON_RENDER_RES / 2, 0, 2 * Math.PI);
		ctx.lineWidth = 6;
		ctx.stroke();
		ctx.closePath();

		return cvs;
	}

	static getClockInputs (timeInfo, vals, fnOnChange) {
		const getIptNum = (ipt) => {
			return Number(ipt.vee.val().trim().replace(/^0+/g, ""));
		};

		let lastTimeSecs = vals.timeOfDaySecs;
		const doUpdateTime = () => {
			const curTimeSecs = metas
				.map(it => getIptNum(it.ipt) * it.mult)
				.reduce((a, b) => a + b, 0);

			if (lastTimeSecs !== curTimeSecs) {
				lastTimeSecs = curTimeSecs;
				fnOnChange(curTimeSecs);
			}
		};

		const metas = [];

		const getIpt = (title, propMax, valProp, propMult) => {
			const ipt = veT`<input class="ve-form-control ve-input-xs form-control--minimal ve-text-center dm-time__ipt-event-time ve-code ve-mx-1" title="${title}">`
				.vee.onn("change", () => {
					const maxVal = timeInfo[propMax] - 1;
					const nxtRaw = getIptNum(ipt);
					const nxtVal = Math.max(0, Math.min(maxVal, nxtRaw));
					ipt.vee.val(TimeTrackerBase.getPaddedNum(nxtVal, timeInfo[propMax]));

					doUpdateTime();
				})
				.vee.onn("click", () => ipt.vee.select())
				.vee.val(TimeTrackerBase.getPaddedNum(vals[valProp], timeInfo[propMax]));
			return {ipt, propMax, mult: propMult ? timeInfo[propMult] : 1};
		};

		const metaHours = getIpt("Hours", "hoursPerDay", "hours", "secsPerHour");
		const metaMinutes = getIpt("Minutes", "minutesPerHour", "minutes", "secsPerMinute");
		const metaSeconds = getIpt("Seconds", "secsPerMinute", "seconds");
		metas.push(metaHours, metaMinutes, metaSeconds);
		const out = {iptHours: metaHours.ipt, iptMinutes: metaMinutes.ipt, iptSeconds: metaSeconds.ipt};
		doUpdateTime();
		return out;
	}

	static getHoursMinutesSecondsFromSeconds (secsPerHour, secsPerMinute, numSecs) {
		const numHours = Math.floor(numSecs / secsPerHour);
		numSecs = numSecs - (numHours * secsPerHour);

		const numMinutes = Math.floor(numSecs / secsPerMinute);
		numSecs = numSecs - (numMinutes * secsPerMinute);

		return {
			seconds: numSecs,
			minutes: numMinutes,
			hours: numHours,
		};
	}

	static getPaddedNum (num, max) {
		return `${num}`.padStart(`${max}`.length, "0");
	}
}
TimeTrackerBase._DEFAULT_STATE__DAY = {
	name: "Day",
};
TimeTrackerBase._DEFAULT_STATE__MONTH = {
	name: "Month",
	days: 30,
};
TimeTrackerBase._DEFAULT_STATE__EVENT = {
	name: "Event",
	entries: [],
	when: {
		year: 0,
		day: 0,
	},
	isDeleted: false,
	isHidden: false,
};
TimeTrackerBase._DEFAULT_STATE__ENCOUNTER = {
	name: "Encounter",
	when: {
		year: 0,
		day: 0,
	},
	isDeleted: false,
	countUses: 0,
};
TimeTrackerBase._DEFAULT_STATE__SEASON = {
	name: "Season",
	startDay: 0,
	endDay: 0,
	sunriseHour: 6,
	sunsetHour: 22,
};
TimeTrackerBase._DEFAULT_STATE__YEAR = {
	name: "Year",
	year: 0,
};
TimeTrackerBase._DEFAULT_STATE__ERA = {
	name: "Era",
	abbreviation: "E",
	startYear: 0,
	endYear: 0,
};
TimeTrackerBase._DEFAULT_STATE__MOON = {
	name: "Moon",
	color: "#ffffff",
	phaseOffset: 0,
	period: 24,
};
TimeTrackerBase._DEFAULT_STATE = {
	time: 0,

	// Store these in the base class, even though they are only effectively useful in the subclass
	browseTime: null,
	isBrowseMode: false,

	// clock
	hoursPerDay: 24,
	minutesPerHour: 60,
	secondsPerMinute: 60,

	// game mechanics
	hoursPerLongRest: 8,
	minutesPerShortRest: 60,
	secondsPerRound: 6,

	// offsets
	offsetYears: 0,
	offsetMonthStartDay: 0,

	// calendar
	days: [...new Array(7)]
		.map((_, i) => TimeTrackerBase.getGenericDay(i)),
	months: [...new Array(12)]
		.map((_, i) => TimeTrackerBase.getGenericMonth(i)),
	events: {},
	encounters: {},
	seasons: [...new Array(4)]
		.map((_, i) => TimeTrackerBase.getGenericSeason(i)),
	years: [],
	eras: [],
	moons: [...new Array(1)]
		.map((_, i) => TimeTrackerBase.getGenericMoon(i)),
};
TimeTrackerBase._MOON_PHASES = [
	"new-moon",
	"waxing-crescent",
	"first-quarter",
	"waxing-gibbous",
	"full-moon",
	"waning-gibbous",
	"last-quarter",
	"waning-crescent",
];
TimeTrackerBase._MOON_RENDER_RES = 32;
TimeTrackerBase._MIN_TIME = 1;
TimeTrackerBase._MAX_TIME = 9999;

class TimeTrackerRoot extends TimeTrackerBase {
	constructor (tracker, wrpPanel) {
		super(tracker, wrpPanel);

		// components
		this._compClock = new TimeTrackerRoot_Clock(tracker, wrpPanel);
		this._compCalendar = new TimeTrackerRoot_Calendar(tracker, wrpPanel);
		this._compSettings = new TimeTrackerRoot_Settings(tracker, wrpPanel);
	}

	getSaveableState () {
		return {
			...this.getBaseSaveableState(),
			compClockState: this._compClock.getSaveableState(),
			compCalendarState: this._compCalendar.getSaveableState(),
			compSettingsState: this._compSettings.getSaveableState(),
		};
	}

	setStateFrom (toLoad) {
		this.setBaseSaveableStateFrom(toLoad);
		if (toLoad.compClockState) this._compClock.setStateFrom(toLoad.compClockState);
		if (toLoad.compCalendarState) this._compCalendar.setStateFrom(toLoad.compCalendarState);
		if (toLoad.compSettingsState) this._compSettings.setStateFrom(toLoad.compSettingsState);
	}

	render (eleParent) {
		eleParent.vee.empty();

		const wrpClock = veT`<div class="ve-flex-col ve-w-100 ve-h-100 ve-overflow-y-auto">`;
		const wrpCalendar = veT`<div class="ve-flex-col ve-w-100 ve-h-100 ve-overflow-y-auto ve-flex-h-center">`;
		const wrpSettings = veT`<div class="ve-flex-col ve-w-100 ve-h-100 ve-overflow-y-auto">`;

		const pod = this.getPod();

		this._compClock.render(wrpClock, pod);
		this._compCalendar.render(wrpCalendar, pod);
		this._compSettings.render(wrpSettings, pod);

		const btnShowClock = veT`<button class="ve-btn ve-btn-xs ve-btn-default ve-mr-2" title="Clock"><span class="glyphicon glyphicon-time"></span></button>`
			.vee.onn("click", () => this._state.tab = 0);
		const btnShowCalendar = veT`<button class="ve-btn ve-btn-xs ve-btn-default ve-mr-3" title="Calendar"><span class="glyphicon glyphicon-calendar"></span></button>`
			.vee.onn("click", () => this._state.tab = 1);
		const btnShowSettings = veT`<button class="ve-btn ve-btn-xs ve-btn-default ve-mr-3" title="Settings"><span class="glyphicon glyphicon-cog"></span></button>`
			.vee.onn("click", () => this._state.tab = 2);
		const hookShowTab = () => {
			btnShowClock.vee.toggleClass("ve-active", this._state.tab === 0);
			btnShowCalendar.vee.toggleClass("ve-active", this._state.tab === 1);
			btnShowSettings.vee.toggleClass("ve-active", this._state.tab === 2);
			wrpClock.vee.toggle(this._state.tab === 0);
			wrpCalendar.vee.toggle(this._state.tab === 1);
			wrpSettings.vee.toggle(this._state.tab === 2);
		};
		this._addHookBase("tab", hookShowTab);
		hookShowTab();

		const btnReset = veT`<button class="ve-btn ve-btn-xs ve-btn-danger" title="Reset Clock/Calendar Time to First Day"><span class="glyphicon glyphicon-refresh"></span></button>`
			.vee.onn("click", async () => {
				if (!await InputUiUtil.pGetUserBoolean({title: "Reset", htmlDescription: "Are you sure?", textYes: "Yes", textNo: "Cancel"})) return;
				Object.assign(this._state, {time: 0, isBrowseMode: false, browseTime: null});
			});

		veT`<div class="ve-flex-col ve-h-100">
			<div class="ve-flex ve-p-1 ve-no-shrink">
				${btnShowClock}${btnShowCalendar}${btnShowSettings}${btnReset}
			</div>
			<hr class="ve-hr-0 ve-mb-2 ve-no-shrink">
			${wrpClock}
			${wrpCalendar}
			${wrpSettings}
		</div>`.vee.appendTo(eleParent);

		// Prevent events and encounters from being lost on month changes (i.e. reduced number of days in the year)
		const _hookSettingsMonths_handleProp = (daysPerYear, prop) => {
			let isMod = false;
			Object.values(this._state[prop]).forEach(it => {
				if (it.when.year != null && it.when.day != null) {
					if (it.when.day >= daysPerYear) {
						it.when.day = daysPerYear - 1;
						isMod = true;
					}
				}
			});
			if (isMod) this._triggerMapUpdate(prop);
		};
		const hookSettingsMonths = () => {
			const {daysPerYear} = this._getTimeInfo({isBase: true});
			_hookSettingsMonths_handleProp(daysPerYear, "events");
			_hookSettingsMonths_handleProp(daysPerYear, "encounters");
		};
		this._addHookBase("months", hookSettingsMonths);
		hookSettingsMonths();

		// Prevent event/encounter times from exceeding day bounds on clock setting changes
		const _hookSettingsClock_handleProp = (secsPerDay, prop) => {
			let isMod = false;
			Object.values(this._state[prop]).forEach(it => {
				if (it.timeOfDaySecs != null) {
					if (it.timeOfDaySecs >= secsPerDay) {
						it.timeOfDaySecs = secsPerDay - 1;
						isMod = true;
					}
				}
			});
			if (isMod) this._triggerMapUpdate(prop);
		};
		const hookSettingsClock = () => {
			const {secsPerDay} = this._getTimeInfo({isBase: true});
			_hookSettingsClock_handleProp(secsPerDay, "events");
			_hookSettingsClock_handleProp(secsPerDay, "encounters");
		};
		this._addHookBase("secondsPerMinute", hookSettingsClock);
		this._addHookBase("minutesPerHour", hookSettingsClock);
		this._addHookBase("hoursPerDay", hookSettingsClock);
		hookSettingsClock();
	}

	_getDefaultState () {
		return {
			...MiscUtil.copy(super._getDefaultState()),
			...MiscUtil.copy(TimeTrackerRoot._DEFAULT_STATE),
		};
	}
}
TimeTrackerRoot._DEFAULT_STATE = {
	tab: 0,

	isPaused: false,
	isAutoPaused: false,

	hasCalendarLabelsColumns: true,
	hasCalendarLabelsRows: false,

	unitsWindSpeed: "mph",

	isClockSectionHidden: false,
	isCalendarSectionHidden: false,
	isMechanicsSectionHidden: false,
	isOffsetsSectionHidden: false,
	isDaysSectionHidden: false,
	isMonthsSectionHidden: false,
	isSeasonsSectionHidden: false,
	isYearsSectionHidden: false,
	isErasSectionHidden: false,
	isMoonsSectionHidden: false,
};

class TimeTrackerRoot_Clock extends TimeTrackerComponent {
	constructor (board, wrpPanel) {
		super(board, wrpPanel);

		this._compWeather = new TimeTrackerRoot_Clock_Weather(board, wrpPanel);

		this._ivTimer = null;
	}

	getSaveableState () {
		return {
			...this.getBaseSaveableState(),
			compWeatherState: this._compWeather.getSaveableState(),
		};
	}

	setStateFrom (toLoad) {
		this.setBaseSaveableStateFrom(toLoad);
		if (toLoad.compWeatherState) this._compWeather.setStateFrom(toLoad.compWeatherState);
	}

	/* -------------------------------------------- */

	onDestroy () {
		clearInterval(this._ivTimer);
	}

	/* -------------------------------------------- */

	render (eleParent, parent) {
		eleParent.vee.empty();
		this._parent = parent;
		const {getTimeInfo, getMoonInfos, doModTime, getEvents, getEncounters} = parent;

		clearInterval(this._ivTimer);
		let time = Date.now();
		this._ivTimer = setInterval(() => {
			const timeNext = Date.now();
			const timeDelta = timeNext - time;
			time = timeNext;

			if (this._parent.get("isPaused") || this._parent.get("isAutoPaused")) return;

			this._parent.set("time", this._parent.get("time") + timeDelta);
		}, 1000);

		const dispReadableDate = veT`<div class="ve-small-caps"></div>`;
		const dispReadableYear = veT`<div class="ve-small-caps small ve-muted ve-mb-2"></div>`;
		const wrpMoons = veT`<div class="ve-flex ve-flex-wrap ve-w-100 ve-no-shrink ve-flex-vh-center ve-mb-3"></div>`;

		const wrpDayNight = veT`<div class="ve-flex ve-w-100 ve-no-shrink ve-flex-h-center ve-flex-v-baseline ve-mt-2"></div>`;

		const getSecsToNextDay = (timeInfo) => {
			const {
				secsPerMinute,
				secsPerHour,
				secsPerDay,
				numSecs,
				numMinutes,
				numHours,
			} = timeInfo;

			return secsPerDay - (
				numHours * secsPerHour
				+ numMinutes * secsPerMinute
				+ numSecs
			);
		};

		const btnNextSunrise = veT`<button class="ve-btn ve-btn-xs ve-btn-default" title="Skip time to the next sunrise. Skips to later today if it is currently night time, or to tomorrow otherwise.">Next Sunrise</button>`
			.vee.onn("click", () => {
				const timeInfo = getTimeInfo({isBase: true});
				const {
					seasonInfos,
					numHours,
					numMinutes,
					numSecs,
					secsPerHour,
					secsPerMinute,
				} = timeInfo;

				const sunriseHour = seasonInfos[0].sunriseHour;
				if (sunriseHour > this._parent.get("hoursPerDay")) {
					return JqueryUtil.doToast({content: "Could not skip to next sunrise\u2014sunrise time is greater than the number of hours in a day!", type: "warning"});
				}

				if (numHours < sunriseHour) {
					// skip to sunrise later today
					const targetSecs = sunriseHour * secsPerHour;
					const currentSecs = (secsPerHour * numHours) + (secsPerMinute * numMinutes) + numSecs;
					const toAdvance = targetSecs - currentSecs;
					doModTime(toAdvance, {isBase: true});
				} else {
					// skip to sunrise the next day
					const toNextDay = getSecsToNextDay(timeInfo);
					const toAdvance = toNextDay + (secsPerHour * sunriseHour);
					doModTime(toAdvance, {isBase: true});
				}
			});

		const btnNextDay = veT`<button class="ve-btn ve-btn-xs ve-btn-default" title="Skip time to next midnight.">Next Day</button>`
			.vee.onn("click", () => doModTime(getSecsToNextDay(getTimeInfo({isBase: true})), {isBase: true}));

		const getIpt = (propMax, timeProp, multProp) => {
			const ipt = veT`<input class="ve-form-control form-control--minimal ve-text-center dm-time__ipt-time ve-code ve-mx-1">`
				.vee.onn("change", () => {
					const timeInfo = getTimeInfo({isBase: true});
					const multiplier = (multProp ? timeInfo[multProp] : 1);
					const curSecs = timeInfo[timeProp] * multiplier;

					const nxtRaw = Number(ipt.vee.val().trim().replace(/^0+/g, ""));
					const nxtSecs = (isNaN(nxtRaw) ? 0 : nxtRaw) * multiplier;

					doModTime(nxtSecs - curSecs, {isBase: true});
				})
				.vee.onn("click", () => ipt.select())
				.vee.onn("focus", () => this._parent.set("isAutoPaused", true))
				.vee.onn("blur", () => this._parent.set("isAutoPaused", false));
			const hookDisplay = () => {
				const maxDigits = `${this._parent.get(propMax)}`.length;
				ipt.vee.css("width", `${20 * maxDigits}px`);
			};
			this._parent.addHook(propMax, hookDisplay);
			hookDisplay();
			return ipt;
		};

		const doUpdateIpt = (ipt, propMax, num) => {
			if (ipt.vee.is(":focus")) return; // freeze selected inputs
			ipt.vee.val(TimeTrackerBase.getPaddedNum(num, this._parent.get(propMax)));
		};

		const iptHours = getIpt("hoursPerDay", "numHours", "secsPerHour");
		const iptMinutes = getIpt("minutesPerHour", "numMinutes", "secsPerMinute");
		const iptSeconds = getIpt("secondsPerMinute", "numSecs");

		const wrpDays = veT`<div class="ve-small-caps ve-text-center ve-mb-1"></div>`;
		const wrpHours = veT`<div class="ve-flex ve-flex-vh-center">${iptHours}</div>`;
		const wrpMinutes = veT`<div class="ve-flex ve-flex-vh-center">${iptMinutes}</div>`;
		const wrpSeconds = veT`<div class="ve-flex ve-flex-vh-center">${iptSeconds}</div>`;

		const wrpEventsEncounters = veT`<div class="ve-flex-vh-center ve-relative ve-flex-wrap dm-time__wrp-clock-events"></div>`;
		const hrEventsEncounters = veT`<hr class="ve-hr-2">`;

		// cache rendering
		let lastReadableDate = null;
		let lastReadableYearHtml = null;
		let lastDay = null;
		let lastMoonInfo = null;
		let lastDayNightHtml = null;
		let lastEvents = null;
		let lastEncounters = null;
		const hookClock = () => {
			const {
				numDays,
				numHours,
				numMinutes,
				numSecs,
				dayInfo,
				date,
				monthInfo,
				seasonInfos,
				year,
				yearInfos,
				eraInfos,
				dayOfYear,
				secsPerHour,
				secsPerMinute,
				minutesPerHour,
				hoursPerDay,
			} = getTimeInfo({isBase: true});

			const todayMoonInfos = getMoonInfos(numDays);
			if (!CollectionUtil.deepEquals(lastMoonInfo, todayMoonInfos)) {
				lastMoonInfo = todayMoonInfos;
				wrpMoons.vee.empty();
				if (!todayMoonInfos.length) {
					wrpMoons.vee.hide();
				} else {
					wrpMoons.vee.show();
					todayMoonInfos.forEach(moon => {
						veT`<div class="ve-flex-v-center ve-mr-2 ve-ui-tip__parent">
							${TimeTrackerBase.getCvsMoon(moon).vee.addClass("ve-mr-2").vee.addClass("dm-time__clock-moon-phase").vee.tooltip(null)}
							<div class="ve-flex-col ve-ui-tip__child">
								<div class="ve-flex">${moon.name}</div>
								<div class="ve-flex small"><i class="ve-mr-1 ve-no-wrap">${moon.phaseName}</i><span class="ve-muted ve-no-wrap">(Day ${moon.dayOfPeriod + 1}/${moon.period})</span></div>
							</div>
						</div>`.vee.appendTo(wrpMoons);
					});
				}
			}

			const readableDate = TimeTrackerBase.formatDateInfo(dayInfo, date, monthInfo, seasonInfos);
			if (readableDate !== lastReadableDate) {
				lastReadableDate = readableDate;
				dispReadableDate.vee.txt(readableDate);
			}
			const readableYear = TimeTrackerBase.formatYearInfo(year, yearInfos, eraInfos, true);
			if (readableYear !== lastReadableYearHtml) {
				lastReadableYearHtml = readableYear;
				dispReadableYear.vee.html(readableYear);
			}
			if (lastDay !== numDays) {
				lastDay = numDays;
				wrpDays.vee.txt(`Day ${numDays + 1}`);
			}

			doUpdateIpt(iptHours, "hoursPerDay", numHours);
			doUpdateIpt(iptMinutes, "minutesPerHour", numMinutes);
			doUpdateIpt(iptSeconds, "secondsPerMinute", numSecs);

			if (seasonInfos.length) {
				wrpDayNight.vee.show();
				const dayNightHtml = seasonInfos.map(it => {
					const isDay = numHours >= it.sunriseHour && numHours < it.sunsetHour;
					const hoursToDayNight = isDay ? it.sunsetHour - numHours
						: numHours < it.sunriseHour ? it.sunriseHour - numHours : (this._parent.get("hoursPerDay") + it.sunriseHour) - numHours;
					return `<b class="ve-mr-2">${isDay ? "Day" : "Night"}</b> <span class="small ve-muted">(${hoursToDayNight === 1 ? `Less than 1 hour` : `More than ${hoursToDayNight - 1} hour${hoursToDayNight === 2 ? "" : "s"}`} to sun${isDay ? "set" : "rise"})</span>`;
				}).join("/");

				if (dayNightHtml !== lastDayNightHtml) {
					wrpDayNight.vee.html(dayNightHtml);
					lastDayNightHtml = dayNightHtml;
				}

				btnNextSunrise.vee.show();
			} else {
				wrpDayNight.vee.hide();
				btnNextSunrise.vee.hide();
			}

			const todayEvents = MiscUtil.copy(getEvents(year, dayOfYear));
			const todayEncounters = MiscUtil.copy(getEncounters(year, dayOfYear));
			if (!CollectionUtil.deepEquals(lastEvents, todayEvents) || !CollectionUtil.deepEquals(lastEncounters, todayEncounters)) {
				lastEvents = todayEvents;
				lastEncounters = todayEncounters;

				wrpEventsEncounters.vee.empty();
				if (!lastEvents.length && !lastEncounters.length) {
					hrEventsEncounters.vee.hide();
					wrpEventsEncounters.vee.hide();
				} else {
					hrEventsEncounters.vee.show();
					wrpEventsEncounters.vee.show();

					todayEvents.forEach(event => {
						const hoverMeta = Renderer.hover.getMakePredefinedHover({type: "entries", entries: []}, {isBookContent: true});
						const doUpdateMeta = () => {
							let name = event.name;
							if (event.hasTime) {
								const {hours, minutes, seconds} = TimeTrackerBase.getHoursMinutesSecondsFromSeconds(secsPerHour, secsPerMinute, event.timeOfDaySecs);
								name = `${name} at ${TimeTrackerBase.getPaddedNum(hours, hoursPerDay)}:${TimeTrackerBase.getPaddedNum(minutes, minutesPerHour)}:${TimeTrackerBase.getPaddedNum(seconds, secsPerMinute)}`;
							}
							const toShow = {
								name,
								type: "entries",
								entries: event.entries,
								data: {hoverTitle: name},
							};
							Renderer.hover.updatePredefinedHover(hoverMeta.id, toShow);
						};

						const dispEvent = veT`<div class="dm-time__disp-clock-entry dm-time__disp-clock-entry--event">*</div>`
							.vee.onn("mouseover", evt => {
								doUpdateMeta();
								hoverMeta.mouseOver(evt, dispEvent);
							})
							.vee.onn("mousemove", evt => hoverMeta.mouseMove(evt, dispEvent))
							.vee.onn("mouseleave", evt => hoverMeta.mouseLeave(evt, dispEvent))
							.vee.onn("click", () => {
								const comp = TimeTrackerRoot_Settings_Event.getInstance(this._board, this._wrpPanel, this._parent, event);
								comp.doOpenEditModal(null);
							})
							.vee.appendTo(wrpEventsEncounters);
					});

					todayEncounters.forEach(encounter => {
						const hoverMeta = Renderer.hover.getMakePredefinedHover({type: "entries", entries: []}, {isBookContent: true});

						const pDoUpdateMeta = async () => {
							let name = encounter.displayName != null ? encounter.displayName : (encounter.name || "(Unnamed Encounter)");
							if (encounter.hasTime) {
								const {hours, minutes, seconds} = TimeTrackerBase.getHoursMinutesSecondsFromSeconds(secsPerHour, secsPerMinute, encounter.timeOfDaySecs);
								name = `${name} at ${TimeTrackerBase.getPaddedNum(hours, hoursPerDay)}:${TimeTrackerBase.getPaddedNum(minutes, minutesPerHour)}:${TimeTrackerBase.getPaddedNum(seconds, secsPerMinute)}`;
							}

							const entityInfos = await ListUtil.pGetSublistEntities_fromHover({
								exportedSublist: encounter.data,
								page: UrlUtil.PG_BESTIARY,
							});

							const toShow = {
								name,
								type: "entries",
								entries: [
									{
										type: "list",
										items: entityInfos.map(it => {
											return `${it.count || 1}× ${Renderer.hover.getEntityLink(it.entity)}`;
										}),
									},
								],
								data: {hoverTitle: name},
							};
							Renderer.hover.updatePredefinedHover(hoverMeta.id, toShow);
						};

						const dispEncounter = veT`<div class="dm-time__disp-clock-entry dm-time__disp-clock-entry--encounter ${encounter.countUses ? "dm-time__disp-clock-entry--used-encounter" : ""}" title="${encounter.countUses ? "(Encounter has been used)" : "Run Encounter (Add to Initiative Tracker)"}">*</div>`
							.vee.onn("mouseover", async evt => {
								await pDoUpdateMeta();
								hoverMeta.mouseOver(evt, dispEncounter);
							})
							.vee.onn("mousemove", evt => hoverMeta.mouseMove(evt, dispEncounter))
							.vee.onn("mouseleave", evt => hoverMeta.mouseLeave(evt, dispEncounter))
							.vee.onn("click", async () => {
								const liveEncounter = this._parent.get("encounters")[encounter.id];
								if (encounter.countUses) {
									liveEncounter.countUses = 0;
									this._parent.triggerMapUpdate("encounters");
								} else {
									await TimeTrackerRoot_Calendar.pDoRunEncounter(this._parent, liveEncounter);
								}
							})
							.vee.appendTo(wrpEventsEncounters);
					});
				}
			}
		};
		this._parent.addHook("time", hookClock);
		// clock settings
		this._parent.addHook("offsetYears", hookClock);
		this._parent.addHook("offsetMonthStartDay", hookClock);
		this._parent.addHook("hoursPerDay", hookClock);
		this._parent.addHook("minutesPerHour", hookClock);
		this._parent.addHook("secondsPerMinute", hookClock);
		// calendar periods
		this._parent.addHook("days", hookClock);
		this._parent.addHook("months", hookClock);
		this._parent.addHook("seasons", hookClock);
		// special
		this._parent.addHook("events", hookClock);
		this._parent.addHook("encounters", hookClock);
		this._parent.addHook("moons", hookClock);
		hookClock();

		const btnSubDay = veT`<button class="ve-btn ve-btn-xxs ve-btn-default dm-time__btn-day"  title="Subtract Day (SHIFT for 5)">-</button>`
			.vee.onn("click", evt => doModTime(-1 * this._parent.get("hoursPerDay") * this._parent.get("minutesPerHour") * this._parent.get("secondsPerMinute") * (evt.shiftKey ? 5 : 1), {isBase: true}));
		const btnAddDay = veT`<button class="ve-btn ve-btn-xxs ve-btn-default dm-time__btn-day" title="Add Day (SHIFT for 5)">+</button>`
			.vee.onn("click", evt => doModTime(this._parent.get("hoursPerDay") * this._parent.get("minutesPerHour") * this._parent.get("secondsPerMinute") * (evt.shiftKey ? 5 : 1), {isBase: true}));

		const btnAddHour = veT`<button class="ve-btn ve-btn-xs ve-btn-default dm-time__btn-time dm-time__btn-time--top" title="Add Hour (SHIFT for 5, CTRL for 12)">+</button>`
			.vee.onn("click", evt => doModTime(this._parent.get("minutesPerHour") * this._parent.get("secondsPerMinute") * (evt.shiftKey ? 5 : (EventUtil.isCtrlMetaKey(evt) ? 12 : 1)), {isBase: true}));
		const btnSubHour = veT`<button class="ve-btn ve-btn-xs ve-btn-default dm-time__btn-time dm-time__btn-time--bottom" title="Subtract Hour (SHIFT for 5, CTRL for 12)">-</button>`
			.vee.onn("click", evt => doModTime(-1 * this._parent.get("minutesPerHour") * this._parent.get("secondsPerMinute") * (evt.shiftKey ? 5 : (EventUtil.isCtrlMetaKey(evt) ? 12 : 1)), {isBase: true}));

		const btnAddMinute = veT`<button class="ve-btn ve-btn-xs ve-btn-default dm-time__btn-time dm-time__btn-time--top" title="Add Minute (SHIFT for 5, CTRL for 15, Both for 30)">+</button>`
			.vee.onn("click", evt => doModTime(this._parent.get("secondsPerMinute") * (evt.shiftKey && (EventUtil.isCtrlMetaKey(evt)) ? 30 : (EventUtil.isCtrlMetaKey(evt) ? 15 : (evt.shiftKey ? 5 : 1))), {isBase: true}));
		const btnSubMinute = veT`<button class="ve-btn ve-btn-xs ve-btn-default dm-time__btn-time dm-time__btn-time--bottom" title="Subtract Minute (SHIFT for 5, CTRL for 15, Both for 30)">-</button>`
			.vee.onn("click", evt => doModTime(-1 * this._parent.get("secondsPerMinute") * (evt.shiftKey && (EventUtil.isCtrlMetaKey(evt)) ? 30 : (EventUtil.isCtrlMetaKey(evt) ? 15 : (evt.shiftKey ? 5 : 1))), {isBase: true}));

		const btnAddSecond = veT`<button class="ve-btn ve-btn-xs ve-btn-default dm-time__btn-time dm-time__btn-time--top" title="Add Second (SHIFT for 5, CTRL for 15, Both for 30)">+</button>`
			.vee.onn("click", evt => doModTime((evt.shiftKey && (EventUtil.isCtrlMetaKey(evt)) ? 30 : (EventUtil.isCtrlMetaKey(evt) ? 15 : (evt.shiftKey ? 5 : 1))), {isBase: true}));
		const btnSubSecond = veT`<button class="ve-btn ve-btn-xs ve-btn-default dm-time__btn-time dm-time__btn-time--bottom" title="Subtract Second (SHIFT for 5, CTRL for 15, Both for 30)">-</button>`
			.vee.onn("click", evt => doModTime(-1 * (evt.shiftKey && (EventUtil.isCtrlMetaKey(evt)) ? 30 : (EventUtil.isCtrlMetaKey(evt) ? 15 : (evt.shiftKey ? 5 : 1))), {isBase: true}));

		const btnIsPaused = veT`<button class="ve-btn ve-btn-default"><span class="glyphicon glyphicon-pause"></span></button>`
			.vee.onn("click", () => this._parent.set("isPaused", !this._parent.get("isPaused")));
		const hookPaused = () => btnIsPaused.vee.toggleClass("ve-active", this._parent.get("isPaused") || this._parent.get("isAutoPaused"));
		this._parent.addHook("isPaused", hookPaused);
		this._parent.addHook("isAutoPaused", hookPaused);
		hookPaused();

		const btnAddLongRest = veT`<button class="ve-btn ve-btn-xs ve-btn-default" title="Add Long Rest (SHIFT for Subtract)">Long Rest</button>`
			.vee.onn("click", evt => doModTime((evt.shiftKey ? -1 : 1) * this._parent.get("hoursPerLongRest") * this._parent.get("minutesPerHour") * this._parent.get("secondsPerMinute"), {isBase: true}));
		const btnAddShortRest = veT`<button class="ve-btn ve-btn-xs ve-btn-default ve-mr-2" title="Add Short Rest (SHIFT for Subtract)">Short Rest</button>`
			.vee.onn("click", evt => doModTime((evt.shiftKey ? -1 : 1) * this._parent.get("minutesPerShortRest") * this._parent.get("secondsPerMinute"), {isBase: true}));
		const btnAddTurn = veT`<button class="ve-btn ve-btn-xs ve-btn-default" title="Add Round (6 seconds) (SHIFT for Subtract)">Add Round</button>`
			.vee.onn("click", evt => doModTime((evt.shiftKey ? -1 : 1) * this._parent.get("secondsPerRound"), {isBase: true}));

		const wrpWeather = veT`<div class="ve-flex dm-time__wrp-weather">`;
		this._compWeather.render(wrpWeather, this._parent);

		veT`<div class="ve-flex ve-h-100">
			<div class="ve-flex-col ve-flex-vh-center ve-w-100">
				${dispReadableDate}
				${dispReadableYear}
				${wrpMoons}
				<div class="ve-flex ve-flex-v-center ve-relative">
					<div class="ve-flex-col">
						<div class="ve-flex-vh-center">${btnAddHour}</div>
						${wrpHours}
						<div class="ve-flex-vh-center">${btnSubHour}</div>
					</div>
					<div class="dm-time__sep-time">:</div>
					<div class="ve-flex-col">
						<div class="ve-flex-vh-center">${btnAddMinute}</div>
						${wrpMinutes}
						<div class="ve-flex-vh-center">${btnSubMinute}</div>
					</div>
					<div class="dm-time__sep-time">:</div>
					<div class="ve-flex-col">
						<div class="ve-flex-vh-center">${btnAddSecond}</div>
						${wrpSeconds}
						<div class="ve-flex-vh-center">${btnSubSecond}</div>
					</div>
					<div class="ve-flex-col ve-ml-2">${btnIsPaused}</div>
				</div>
				${wrpDayNight}
				<hr class="ve-hr-3">
				<div class="ve-flex-col">
					<div class="ve-flex-v-center ve-mb-2">
						<div class="ve-flex-v-center ve-btn-group">
							${btnAddLongRest}${btnAddShortRest}
						</div>
						${btnAddTurn}
					</div>
					<div class="ve-flex-v-center ve-btn-group">
						${btnNextSunrise}
						${btnNextDay}
					</div>
				</div>
			</div>

			<div class="dm-time__bar-clock"></div>

			<div class="ve-flex-col ve-no-shrink ve-pr-1 ve-flex-h-center">
				${wrpDays}
				<div class="small ve-flex-vh-center ve-btn-group">
					${btnSubDay}${btnAddDay}
				</div>
				<hr class="ve-hr-2">

				${wrpEventsEncounters}
				${hrEventsEncounters}

				${wrpWeather}
			</div>
		</div>`.vee.appendTo(eleParent);
	}
}

class TimeTrackerRoot_Clock_Weather extends TimeTrackerComponent {
	render (eleParent, parent) {
		eleParent.vee.empty();
		this._parent = parent;
		const {getTimeInfo} = parent;

		const btnRandomise = veT`<button class="ve-btn ve-btn-xxs ve-btn-default dm-time__btn-random-weather" title="Roll Weather (SHIFT to Reroll Using Previous Settings)"><span class="fal fa-dice"></span></button>`
			.vee.onn("click", async evt => {
				const randomState = await TimeTrackerRoot_Clock_RandomWeather.pGetUserInput(
					{
						temperature: this._state.temperature,
						precipitation: this._state.precipitation,
						windDirection: this._state.windDirection,
						windSpeed: this._state.windSpeed,
					},
					{
						unitsWindSpeed: this._parent.get("unitsWindSpeed"),
						isReroll: evt.shiftKey,
					},
				);
				if (randomState == null) return;
				Object.assign(this._state, randomState);
			});

		const btnTemperature = veT`<button class="ve-btn ve-btn-default ve-btn-sm dm-time__btn-weather ve-mr-2"></button>`
			.vee.onn("click", async () => {
				let ixCur = TimeTrackerRoot_Clock_Weather._TEMPERATURES.indexOf(this._state.temperature);
				if (!~ixCur) ixCur = 2;

				const ix = await InputUiUtil.pGetUserIcon({
					values: TimeTrackerRoot_Clock_Weather._TEMPERATURES.map((it, i) => {
						const meta = TimeTrackerRoot_Clock_Weather._TEMPERATURE_META[i];
						return {
							name: it.uppercaseFirst(),
							buttonClassesActive: meta.class ? [meta.class, "ve-active"] : null,
							iconClass: `fal ${meta.icon}`,
						};
					}),
					title: "Temperature",
					default: ixCur,
				});

				if (ix != null) this._state.temperature = TimeTrackerRoot_Clock_Weather._TEMPERATURES[ix];
			});
		const hookTemperature = () => {
			TimeTrackerRoot_Clock_Weather._TEMPERATURE_META.forEach(it => btnTemperature.vee.removeClass(it.class));
			let ix = TimeTrackerRoot_Clock_Weather._TEMPERATURES.indexOf(this._state.temperature);
			if (!~ix) ix = 0;
			const meta = TimeTrackerRoot_Clock_Weather._TEMPERATURE_META[ix];
			btnTemperature.vee.addClass(meta.class);
			btnTemperature.vee.tooltip(this._state.temperature.uppercaseFirst()).vee.html(`<div class="fal ${meta.icon}"></div>`);
		};
		this._addHookBase("temperature", hookTemperature);
		hookTemperature();

		const btnPrecipitation = veT`<button class="ve-btn ve-btn-default ve-btn-sm dm-time__btn-weather ve-mr-2"></button>`
			.vee.onn("click", async () => {
				const {
					numHours,
					seasonInfos,
				} = getTimeInfo({isBase: true});
				const useNightIcon = seasonInfos.length && !(numHours >= seasonInfos[0].sunriseHour && numHours < seasonInfos[0].sunsetHour);

				let ixCur = TimeTrackerRoot_Clock_Weather._PRECIPICATION.indexOf(this._state.precipitation);
				if (!~ixCur) ixCur = 0;

				const ix = await InputUiUtil.pGetUserIcon({
					values: TimeTrackerRoot_Clock_Weather._PRECIPICATION.map((it, i) => {
						const meta = TimeTrackerRoot_Clock_Weather._PRECIPICATION_META[i];
						return {
							name: TimeTrackerUtil.revSlugToText(it),
							iconClass: `fal ${useNightIcon && meta.iconNight ? meta.iconNight : meta.icon}`,
							buttonClass: `ve-btn-default`,
						};
					}),
					title: "Weather",
					default: ixCur,
				});

				if (ix != null) this._state.precipitation = TimeTrackerRoot_Clock_Weather._PRECIPICATION[ix];
			});
		let lastPrecipitationTimeInfo = null;
		const hookPrecipitation = (prop) => {
			const {
				numHours,
				seasonInfos,
			} = getTimeInfo({isBase: true});

			const precipitationTimeInfo = {numHours, seasonInfos};

			if (prop === "time" && CollectionUtil.deepEquals(lastPrecipitationTimeInfo, precipitationTimeInfo)) return;
			lastPrecipitationTimeInfo = precipitationTimeInfo;
			const useNightIcon = seasonInfos.length && !(numHours >= seasonInfos[0].sunriseHour && numHours < seasonInfos[0].sunsetHour);

			let ix = TimeTrackerRoot_Clock_Weather._PRECIPICATION.indexOf(this._state.precipitation);
			if (!~ix) ix = 0;
			const meta = TimeTrackerRoot_Clock_Weather._PRECIPICATION_META[ix];
			btnPrecipitation.vee.tooltip(TimeTrackerUtil.revSlugToText(this._state.precipitation)).vee.html(`<div class="fal ${useNightIcon && meta.iconNight ? meta.iconNight : meta.icon}"></div>`);
		};
		this._addHookBase("precipitation", hookPrecipitation);
		this._parent.addHook("time", hookPrecipitation);
		hookPrecipitation();

		const btnWindDirection = veT`<button class="ve-btn ve-btn-default ve-btn-sm dm-time__btn-weather"></button>`
			.vee.onn("click", async () => {
				const bearing = await TimeTrackerUtil.pGetUserWindBearing(this._state.windDirection);
				if (bearing != null) this._state.windDirection = bearing;
			});
		const hookWindDirection = () => {
			let ixCur = TimeTrackerRoot_Clock_Weather._WIND_SPEEDS.indexOf(this._state.windSpeed);
			if (!~ixCur) ixCur = 0;

			if (ixCur) {
				const speedClass = ixCur >= 5 ? "fas" : ixCur >= 3 ? "far" : "fal";
				btnWindDirection.vee.html(`<div class="${speedClass} fa-arrow-up" style="transform: rotate(${this._state.windDirection}deg);"></div>`);
			} else btnWindDirection.vee.html(`<div class="fal fa-ellipsis"></div>`);
		};
		this._addHookBase("windDirection", hookWindDirection);
		this._addHookBase("windSpeed", hookWindDirection);
		hookWindDirection();

		const btnWindSpeed = veT`<button class="ve-btn ve-btn-default ve-btn-xs"></button>`
			.vee.onn("click", async () => {
				let ixCur = TimeTrackerRoot_Clock_Weather._WIND_SPEEDS.indexOf(this._state.windSpeed);
				if (!~ixCur) ixCur = 0;

				const ix = await InputUiUtil.pGetUserIcon({
					values: TimeTrackerRoot_Clock_Weather._WIND_SPEEDS.map((it, i) => {
						const meta = TimeTrackerRoot_Clock_Weather._WIND_SPEEDS_META[i];
						return {
							name: TimeTrackerUtil.revSlugToText(it),
							buttonClass: `ve-btn-default`,
							iconContent: `<div class="ve-mb-1 ve-whitespace-normal dm-time__wind-speed">${this._parent.get("unitsWindSpeed") === "mph" ? `${meta.mph} mph` : `${meta.kmph} km/h`}</div>`,
						};
					}),
					title: "Wind Speed",
					default: ixCur,
				});

				if (ix != null) this._state.windSpeed = TimeTrackerRoot_Clock_Weather._WIND_SPEEDS[ix];
			});
		const hookWindSpeed = () => {
			let ix = TimeTrackerRoot_Clock_Weather._WIND_SPEEDS.indexOf(this._state.windSpeed);
			if (!~ix) ix = 0;
			const meta = TimeTrackerRoot_Clock_Weather._WIND_SPEEDS_META[ix];
			btnWindSpeed.vee.txt(TimeTrackerUtil.revSlugToText(this._state.windSpeed)).vee.tooltip(this._parent.get("unitsWindSpeed") === "mph" ? `${meta.mph} mph` : `${meta.kmph} km/h`);
		};
		this._addHookBase("windSpeed", hookWindSpeed);
		this._parent.addHook("unitsWindSpeed", hookWindSpeed);
		hookWindSpeed();

		const hovEnvEffects = veT`<div><span class="glyphicon glyphicon-info-sign"></span></div>`;
		const wrpEnvEffects = veT`<div class="ve-mt-2">${hovEnvEffects}</div>`;
		let hoverMetaEnvEffects = null;
		const hookEnvEffects = () => {
			hovEnvEffects.vee.off("mouseover").vee.off("mousemove").vee.off("mouseleave");
			const hashes = [];
			const fnGetHash = UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_TRAPS_HAZARDS];

			const styleHint = VetoolsConfig.get("styleSwitcher", "style");
			const srcHazards = styleHint === "classic" ? Parser.SRC_DMG : Parser.SRC_XDMG;

			if (this._state.temperature === TimeTrackerRoot_Clock_Weather._TEMPERATURES[0]) {
				hashes.push(fnGetHash(({name: "Extreme Cold", source: srcHazards})));
			}

			if (this._state.temperature === TimeTrackerRoot_Clock_Weather._TEMPERATURES.last()) {
				hashes.push(fnGetHash(({name: "Extreme Heat", source: srcHazards})));
			}

			if (["rain-heavy", "thunderstorm", "snow"].includes(this._state.precipitation)) {
				hashes.push(fnGetHash(({name: "Heavy Precipitation", source: srcHazards})));
			}

			if (TimeTrackerRoot_Clock_Weather._WIND_SPEEDS.indexOf(this._state.windSpeed) >= 3) {
				hashes.push(fnGetHash(({name: "Strong Wind", source: srcHazards})));
			}

			hovEnvEffects.vee.show();
			if (hashes.length === 1) {
				const ele = hovEnvEffects;
				hovEnvEffects.vee.onn("mouseover", evt => Renderer.hover.pHandleLinkMouseOver(evt, ele, {isSpecifiedLinkData: true, page: UrlUtil.PG_TRAPS_HAZARDS, source: srcHazards, hash: hashes[0]}));
				hovEnvEffects.vee.onn("mouseleave", evt => Renderer.hover.handleLinkMouseLeave(evt, ele));
				hovEnvEffects.vee.onn("mousemove", evt => Renderer.hover.handleLinkMouseMove(evt, ele));
			} else if (hashes.length) {
				if (hoverMetaEnvEffects == null) hoverMetaEnvEffects = Renderer.hover.getMakePredefinedHover({type: "entries", entries: []});

				hovEnvEffects
					.vee.onn("mouseover", async evt => {
						// load the first on its own, to avoid racing to fill the cache
						const first = await DataLoader.pCacheAndGet(UrlUtil.PG_TRAPS_HAZARDS, srcHazards, hashes[0]);
						const others = await Promise.all(hashes.slice(1).map(hash => DataLoader.pCacheAndGet(UrlUtil.PG_TRAPS_HAZARDS, srcHazards, hash)));
						const allEntries = [first, ...others].map(it => ({type: "statblockInline", dataType: "hazard", data: MiscUtil.copy(it)}));
						const toShow = {
							type: "entries",
							entries: allEntries,
							data: {hoverTitle: `Weather Effects`},
						};
						Renderer.hover.updatePredefinedHover(hoverMetaEnvEffects.id, toShow);
						hoverMetaEnvEffects.mouseOver(evt, hovEnvEffects);
					})
					.vee.onn("mousemove", evt => hoverMetaEnvEffects.mouseMove(evt, hovEnvEffects))
					.vee.onn("mouseleave", evt => hoverMetaEnvEffects.mouseLeave(evt, hovEnvEffects));
			} else hovEnvEffects.vee.hide();
		};
		this._addHookBase("temperature", hookEnvEffects);
		this._addHookBase("precipitation", hookEnvEffects);
		this._addHookBase("windSpeed", hookEnvEffects);
		hookEnvEffects();

		veT`<div class="ve-flex-col ve-w-100 ve-flex-vh-center">
			<div class="ve-flex-vh-center small ve-mb-1"><span class="ve-small-caps ve-mr-2">Weather</span>${btnRandomise}</div>
			<div class="ve-mb-2">${btnTemperature}${btnPrecipitation}</div>

			<div class="ve-flex-col ve-flex-vh-center">
				<div class="small ve-small-caps">Wind</div>
				<div class="ve-mb-1">${btnWindDirection}</div>
				<div>${btnWindSpeed}</div>
			</div>

			${wrpEnvEffects}
		</div>`.vee.appendTo(eleParent);
	}

	_getDefaultState () { return MiscUtil.copy(TimeTrackerRoot_Clock_Weather._DEFAULT_STATE); }
}
TimeTrackerRoot_Clock_Weather._TEMPERATURES = [
	"freezing",
	"cold",
	"mild",
	"hot",
	"scorching",
];
TimeTrackerRoot_Clock_Weather._PRECIPICATION = [
	"sunny",
	"cloudy",
	"foggy",
	"rain-light",
	"rain-heavy",
	"thunderstorm",
	"hail",
	"snow",
];
TimeTrackerRoot_Clock_Weather._WIND_SPEEDS = [
	"calm",
	"breeze-light",
	"breeze-moderate",
	"breeze-strong",
	"gale-near",
	"gale",
	"gale-severe",
	"storm",
	"hurricane",
];
TimeTrackerRoot_Clock_Weather._DEFAULT_STATE = {
	temperature: TimeTrackerRoot_Clock_Weather._TEMPERATURES[2],
	precipitation: TimeTrackerRoot_Clock_Weather._PRECIPICATION[0],
	windDirection: 0,
	windSpeed: TimeTrackerRoot_Clock_Weather._WIND_SPEEDS[0],
};
TimeTrackerRoot_Clock_Weather._TEMPERATURE_META = [
	{icon: "fa-temperature-snow", class: "ve-btn-primary"},
	{icon: "fa-temperature-quarter", class: "ve-btn-info"},
	{icon: "fa-temperature-half"},
	{icon: "fa-temperature-three-quarters", class: "ve-btn-warning"},
	{icon: "fa-temperature-sun", class: "ve-btn-danger"},
];
TimeTrackerRoot_Clock_Weather._PRECIPICATION_META = [
	{icon: "fa-sun", iconNight: "fa-moon"},
	{icon: "fa-clouds-sun", iconNight: "fa-clouds-moon"},
	{icon: "fa-cloud-fog"},
	{icon: "fa-cloud-drizzle"},
	{icon: "fa-cloud-showers-heavy"},
	{icon: "fa-cloud-bolt"},
	{icon: "fa-cloud-hail"},
	{icon: "fa-cloud-snow"},
];
TimeTrackerRoot_Clock_Weather._WIND_SPEEDS_META = [ // (Beaufort scale equivalent)
	{mph: "<1", kmph: "<2"}, // 0-2
	{mph: "1-7", kmph: "2-11"}, // 1-2
	{mph: "8-18", kmph: "12-28"}, // 3-4
	{mph: "19-31", kmph: "29-49"}, // 5-6
	{mph: "32-38", kmph: "50-61"}, // 7
	{mph: "39-46", kmph: "62-74"}, // 8
	{mph: "47-54", kmph: "75-88"}, // 9
	{mph: "55-72", kmph: "89-117"}, // 10-11
	{mph: "≥73", kmph: "≥118"}, // 12
];

class TimeTrackerRoot_Clock_RandomWeather extends BaseComponent {
	constructor (opts) {
		super();

		this._unitsWindSpeed = opts.unitsWindSpeed;
	}

	render (eleModalInner, doClose) {
		eleModalInner.vee.empty();

		const btnsTemperature = TimeTrackerRoot_Clock_Weather._TEMPERATURES
			.map((it, i) => {
				const meta = TimeTrackerRoot_Clock_Weather._TEMPERATURE_META[i];
				return {
					temperature: it,
					name: it.uppercaseFirst(),
					buttonClass: meta.class,
					iconClass: `fal ${meta.icon}`,
				};
			})
			.map(v => {
				const btn = veT`<div class="ve-m-2 ve-btn ve-btn-default ve-ui__btn-xxl-square ve-flex-col ve-flex-h-center ve-flex-v-center">
						<div class="ve-ui-icn__wrp-icon ${v.iconClass} ve-mb-1"></div>
						<div class="ve-whitespace-normal ve-w-100">${v.name}</div>
					</div>`
					.vee.onn("click", () => {
						if (this._state.allowedTemperatures.includes(v.temperature)) this._state.allowedTemperatures = this._state.allowedTemperatures.filter(it => it !== v.temperature);
						else this._state.allowedTemperatures = [...this._state.allowedTemperatures, v.temperature];
					});

				const hookTemperature = () => {
					const isActive = this._state.allowedTemperatures.includes(v.temperature);
					if (v.buttonClass) {
						btn.vee.toggleClass("ve-btn-default", !isActive);
						btn.vee.toggleClass(v.buttonClass, isActive);
					}
					btn.vee.toggleClass("ve-active", isActive);
				};
				this._addHookBase("allowedTemperatures", hookTemperature);
				hookTemperature();

				return btn;
			});

		const btnsPrecipitation = TimeTrackerRoot_Clock_Weather._PRECIPICATION
			.map((it, i) => {
				const meta = TimeTrackerRoot_Clock_Weather._PRECIPICATION_META[i];
				return {
					precipitation: it,
					name: TimeTrackerUtil.revSlugToText(it),
					iconClass: `fal ${meta.icon}`,
				};
			})
			.map(v => {
				const btn = veT`<div class="ve-m-2 ve-btn ve-btn-default ve-ui__btn-xxl-square ve-flex-col ve-flex-h-center ve-flex-v-center">
						<div class="ve-ui-icn__wrp-icon ${v.iconClass} ve-mb-1"></div>
						<div class="ve-whitespace-normal ve-w-100">${v.name}</div>
					</div>`
					.vee.onn("click", () => {
						if (this._state.allowedPrecipitations.includes(v.precipitation)) this._state.allowedPrecipitations = this._state.allowedPrecipitations.filter(it => it !== v.precipitation);
						else this._state.allowedPrecipitations = [...this._state.allowedPrecipitations, v.precipitation];
					});

				const hookPrecipitation = () => btn.vee.toggleClass("ve-active", this._state.allowedPrecipitations.includes(v.precipitation));
				this._addHookBase("allowedPrecipitations", hookPrecipitation);
				hookPrecipitation();

				return btn;
			});

		const btnWindDirection = veT`<button class="ve-btn ve-btn-default ve-btn-sm dm-time__btn-weather"></button>`
			.vee.onn("click", async () => {
				const bearing = await TimeTrackerUtil.pGetUserWindBearing(this._state.prevailingWindDirection);
				if (bearing != null) this._state.prevailingWindDirection = bearing;
			});
		const hookWindDirection = () => {
			btnWindDirection.vee.html(`<div class="far fa-arrow-up" style="transform: rotate(${this._state.prevailingWindDirection}deg);"></div>`);
		};
		this._addHookBase("prevailingWindDirection", hookWindDirection);
		hookWindDirection();

		const btnsWindSpeed = TimeTrackerRoot_Clock_Weather._WIND_SPEEDS
			.map((it, i) => {
				const meta = TimeTrackerRoot_Clock_Weather._WIND_SPEEDS_META[i];
				return {
					speed: it,
					name: TimeTrackerUtil.revSlugToText(it),
					iconContent: `<div class="ve-mb-1 ve-whitespace-normal dm-time__wind-speed">${this._unitsWindSpeed === "mph" ? `${meta.mph} mph` : `${meta.kmph} km/h`}</div>`,
				};
			})
			.map(v => {
				const btn = veT`<div class="ve-m-2 ve-btn ve-btn-default ve-ui__btn-xxl-square ve-flex-col ve-flex-h-center">
						${v.iconContent}
						<div class="ve-whitespace-normal ve-w-100">${v.name}</div>
					</div>`
					.vee.onn("click", () => {
						if (this._state.allowedWindSpeeds.includes(v.speed)) this._state.allowedWindSpeeds = this._state.allowedWindSpeeds.filter(it => it !== v.speed);
						else this._state.allowedWindSpeeds = [...this._state.allowedWindSpeeds, v.speed];
					});

				const hookSpeed = () => btn.vee.toggleClass("ve-active", this._state.allowedWindSpeeds.includes(v.speed));
				this._addHookBase("allowedWindSpeeds", hookSpeed);
				hookSpeed();

				return btn;
			});

		const btnOk = veT`<button class="ve-btn ve-btn-default">Confirm and Roll Weather</button>`
			.vee.onn("click", () => {
				if (!this._state.allowedTemperatures.length || !this._state.allowedPrecipitations.length || !this._state.allowedWindSpeeds.length) {
					JqueryUtil.doToast({content: `Please select allowed values for all sections!`, type: "warning"});
				} else doClose(true);
			});

		veT`<div class="ve-flex-col ve-w-100 ve-h-100">
			<div class="ve-flex-col">
				<h5>Allowed Temperatures</h5>
				<div class="ve-flex">${btnsTemperature}</div>
			</div>
			<div class="ve-flex-col">
				<h5>Allowed Precipitation Types</h5>
				<div class="ve-flex">${btnsPrecipitation}</div>
			</div>
			<div class="ve-flex-v-center ve-mt-2">
				<h5 class="ve-mr-2">Prevailing Wind Direction</h5>${btnWindDirection}
			</div>
			<div class="ve-flex-col">
				<h5>Allowed Wind Speeds</h5>
				<div class="ve-flex">${btnsWindSpeed}</div>
			</div>
			<div class="ve-flex-vh-center">${btnOk}</div>
		</div>`.vee.appendTo(eleModalInner);
	}

	_getDefaultState () { return MiscUtil.copy(TimeTrackerRoot_Clock_RandomWeather._DEFAULT_STATE); }

	/**
	 * @param curWeather The current weather state.
	 * @param opts Options object.
	 * @param opts.unitsWindSpeed Wind speed units.
	 * @param [opts.isReroll] If the weather is being quick-rerolled.
	 */
	static async pGetUserInput (curWeather, opts) {
		opts = opts || {};

		const comp = new TimeTrackerRoot_Clock_RandomWeather(opts);

		const prevState = await StorageUtil.pGetForPage(TimeTrackerRoot_Clock_RandomWeather._STORAGE_KEY);
		if (prevState) comp.setStateFrom(prevState);

		const getWeather = () => {
			StorageUtil.pSetForPage(TimeTrackerRoot_Clock_RandomWeather._STORAGE_KEY, comp.getSaveableState());

			const inputs = comp.toObject();

			// 66% chance of temperature change
			const isNewTemp = RollerUtil.randomise(3) > 1;
			// 80% chance of precipitation change
			const isNewPrecipitation = RollerUtil.randomise(5) > 1;

			// 40% chance of prevailing wind; 20% chance of current wind; 40% chance of random wind
			const rollWindDirection = RollerUtil.randomise(5);
			let windDirection;
			if (rollWindDirection === 1) windDirection = curWeather.windDirection;
			else if (rollWindDirection <= 3) windDirection = inputs.prevailingWindDirection;
			else windDirection = RollerUtil.randomise(360) - 1;
			windDirection += TimeTrackerRoot_Clock_RandomWeather._getBearingFudge();

			// 2/7 chance wind speed stays the same; 1/7 chance each of it increasing/decreasing by 1/2/3 steps
			const rollWindSpeed = RollerUtil.randomise(7);
			let windSpeed;
			const ixCurWindSpeed = TimeTrackerRoot_Clock_Weather._WIND_SPEEDS.indexOf(curWeather.windSpeed);
			let windSpeedOffset = 0;
			if (rollWindSpeed <= 3) windSpeedOffset = -rollWindSpeed;
			else if (rollWindSpeed >= 5) windSpeedOffset = rollWindSpeed - 4;
			if (windSpeedOffset < 0) {
				windSpeed = TimeTrackerRoot_Clock_Weather._WIND_SPEEDS[ixCurWindSpeed + windSpeedOffset];

				let i = -1;
				while (!inputs.allowedWindSpeeds.includes(windSpeed)) {
					windSpeed = TimeTrackerRoot_Clock_Weather._WIND_SPEEDS[ixCurWindSpeed + windSpeedOffset + i];

					// If we run out of possibilities, scan the opposite direction
					if (--i < 0) {
						windSpeed = TimeTrackerRoot_Clock_Weather._WIND_SPEEDS.find(it => inputs.allowedWindSpeeds.includes(it));
					}
				}
			} else if (windSpeedOffset > 0) {
				windSpeed = TimeTrackerRoot_Clock_Weather._WIND_SPEEDS[ixCurWindSpeed + windSpeedOffset];

				let i = 1;
				while (!inputs.allowedWindSpeeds.includes(windSpeed)) {
					windSpeed = TimeTrackerRoot_Clock_Weather._WIND_SPEEDS[ixCurWindSpeed + windSpeedOffset + i];

					// If we run out of possibilities, scan the opposite direction
					if (++i >= TimeTrackerRoot_Clock_Weather._WIND_SPEEDS.length) {
						windSpeed = [...TimeTrackerRoot_Clock_Weather._WIND_SPEEDS]
							.reverse()
							.find(it => inputs.allowedWindSpeeds.includes(it));
					}
				}
			} else windSpeed = curWeather.windSpeed;

			return {
				temperature: isNewTemp ? RollerUtil.rollOnArray(inputs.allowedTemperatures) : curWeather.temperature,
				precipitation: isNewPrecipitation ? RollerUtil.rollOnArray(inputs.allowedPrecipitations) : curWeather.precipitation,
				windDirection,
				windSpeed,
			};
		};

		if (opts.isReroll) return getWeather();

		return new Promise(resolve => {
			const {eleModalInner, doClose} = UiUtil.getShowModal({
				title: "Random Weather Configuration",
				isUncappedHeight: true,
				cbClose: (isDataEntered) => {
					if (!isDataEntered) resolve(null);
					else resolve(getWeather());
				},
			});

			comp.render(eleModalInner, doClose);
		});
	}

	static _getBearingFudge () {
		return Math.round(RollerUtil.randomise(20, 0)) * (RollerUtil.randomise(2) === 2 ? 1 : -1);
	}
}
TimeTrackerRoot_Clock_RandomWeather._DEFAULT_STATE = {
	allowedTemperatures: [...TimeTrackerRoot_Clock_Weather._TEMPERATURES],
	allowedPrecipitations: [...TimeTrackerRoot_Clock_Weather._PRECIPICATION],
	prevailingWindDirection: 0,
	allowedWindSpeeds: [...TimeTrackerRoot_Clock_Weather._WIND_SPEEDS],
};
TimeTrackerRoot_Clock_RandomWeather._STORAGE_KEY = "TimeTracker_RandomWeatherModal";

class TimeTrackerRoot_Calendar extends TimeTrackerComponent {
	constructor (tracker, wrpPanel) {
		super(tracker, wrpPanel);

		// temp components
		this._tmpComps = [];
	}

	render (eleParent, parent) {
		eleParent.vee.empty();
		this._parent = parent;
		const {getTimeInfo, doModTime} = parent;

		// cache info to avoid re-rendering the calendar every second
		let lastRenderMeta = null;

		const dispDayReadableDate = veT`<div class="ve-small-caps"></div>`;
		const dispYear = veT`<div class="ve-small-caps ve-muted small"></div>`;
		const {wrpDateControls, iptYear, iptMonth, iptDay} = TimeTrackerRoot_Calendar.getDateControls(this._parent);

		const btnBrowseMode = ComponentUiUtil.getBtnBool(
			this._parent.component,
			"isBrowseMode",
			{
				ele: veT`<button class="ve-btn ve-btn-xs ve-btn-default" title="When enabled, the current calendar view will be saved. You can then freely browse. When you're done, disable Browse mode to return to your original view.">Browse</button>`,
				fnHookPost: val => {
					if (val) this._parent.set("browseTime", this._parent.get("time"));
					else this._parent.set("browseTime", null);
				},
			},
		);

		const wrpCalendar = veT`<div class="ve-overflow-y-auto ve-smooth-scroll"></div>`;

		const hookCalendar = (prop) => {
			const timeInfo = getTimeInfo();

			const {
				date,
				month,
				year,
				monthInfo,
				monthStartDay,
				daysPerWeek,
				dayInfo,
				monthStartDayOfYear,
				seasonInfos,
				numDays,
				yearInfos,
				eraInfos,
				secsPerDay,
			} = timeInfo;

			const renderMeta = {
				date,
				month,
				year,
				monthInfo,
				monthStartDay,
				daysPerWeek,
				dayInfo,
				monthStartDayOfYear,
				seasonInfos,
				numDays,
				yearInfos,
				eraInfos,
				secsPerDay,
			};
			if (prop === "time" && CollectionUtil.deepEquals(lastRenderMeta, renderMeta)) return;
			lastRenderMeta = renderMeta;

			dispDayReadableDate.vee.txt(TimeTrackerBase.formatDateInfo(dayInfo, date, monthInfo, seasonInfos));
			dispYear.vee.html(TimeTrackerBase.formatYearInfo(year, yearInfos, eraInfos));

			iptYear.vee.val(year + 1);
			iptMonth.vee.val(month + 1);
			iptDay.vee.val(date + 1);

			TimeTrackerRoot_Calendar.renderCalendar(
				this._parent,
				wrpCalendar,
				timeInfo,
				(evt, eventYear, eventDay, moonDay) => {
					if (evt.shiftKey) this._render_doJumpToDay(eventYear, eventDay);
					else this._render_openDayModal(eventYear, eventDay, moonDay);
				},
				{
					hasColumnLabels: this._parent.get("hasCalendarLabelsColumns"),
					hasRowLabels: this._parent.get("hasCalendarLabelsRows"),
				},
			);
		};
		this._parent.addHook("time", hookCalendar);
		this._parent.addHook("browseTime", hookCalendar);
		this._parent.addHook("hasCalendarLabelsColumns", hookCalendar);
		this._parent.addHook("hasCalendarLabelsRows", hookCalendar);
		this._parent.addHook("months", hookCalendar);
		this._parent.addHook("events", hookCalendar);
		this._parent.addHook("encounters", hookCalendar);
		this._parent.addHook("moons", hookCalendar);
		hookCalendar();

		veT`<div class="ve-flex-col ve-h-100 ve-flex-h-center">
			${dispDayReadableDate}
			<div class="ve-split ve-mb-2 ve-flex-v-top">
				${dispYear}
				${btnBrowseMode}
			</div>
			${wrpDateControls}
			<hr class="ve-hr-2 ve-no-shrink">
			${wrpCalendar}
		</div>`.vee.appendTo(eleParent);
	}

	/**
	 *
	 * @param parent Parent pod.
	 * @param [opts] Options object.
	 * @param [opts.isHideDays] True if the day controls should be hidden.
	 * @param [opts.isHideWeeks] True if the week controls should be hidden.
	 * @returns {object}
	 */
	static getDateControls (parent, opts) {
		opts = opts || {};
		const {doModTime, getTimeInfo} = parent;

		const btnSubDay = opts.isHideDays ? null : veT`<button class="ve-btn ve-btn-xs ve-btn-default dm-time__btn-date-adjust"  title="Subtract Day (SHIFT for 5)">\u2212D</button>`
			.vee.onn("click", evt => doModTime(-1 * getTimeInfo().secsPerDay * (evt.shiftKey ? 5 : 1)));
		const btnAddDay = opts.isHideDays ? null : veT`<button class="ve-btn ve-btn-xs ve-btn-default dm-time__btn-date-adjust" title="Add Day (SHIFT for 5)">D+</button>`
			.vee.onn("click", evt => doModTime(getTimeInfo().secsPerDay * (evt.shiftKey ? 5 : 1)));

		const btnSubWeek = opts.isHideWeeks ? null : veT`<button class="ve-btn ve-btn-xs ve-btn-default dm-time__btn-date-adjust"  title="Subtract Week (SHIFT for 5)">\u2212W</button>`
			.vee.onn("click", evt => doModTime(-1 * getTimeInfo().secsPerWeek * (evt.shiftKey ? 5 : 1)));
		const btnAddWeek = opts.isHideWeeks ? null : veT`<button class="ve-btn ve-btn-xs ve-btn-default dm-time__btn-date-adjust" title="Add Week (SHIFT for 5)">W+</button>`
			.vee.onn("click", evt => doModTime(getTimeInfo().secsPerWeek * (evt.shiftKey ? 5 : 1)));

		const doModMonths = (numMonths) => {
			const doAddMonth = () => {
				const {
					secsPerDay,
					monthInfo,
					nextMonthInfo,
					date,
				} = getTimeInfo();

				const dateNextMonth = date > nextMonthInfo.days ? nextMonthInfo.days - 1 : date;
				const daysDiff = (monthInfo.days - date) + dateNextMonth;

				doModTime(daysDiff * secsPerDay);
			};

			const doSubMonth = () => {
				const {
					secsPerDay,
					prevMonthInfo,
					date,
				} = getTimeInfo();

				const datePrevMonth = date > prevMonthInfo.days ? prevMonthInfo.days - 1 : date;
				const daysDiff = -date - (prevMonthInfo.days - datePrevMonth);

				doModTime(daysDiff * secsPerDay);
			};

			if (numMonths === 1) doAddMonth();
			else if (numMonths === -1) doSubMonth();
			else {
				if (numMonths === 0) return;

				const timeInfoBefore = getTimeInfo();
				if (numMonths > 1) {
					[...new Array(numMonths)].forEach(() => doAddMonth());
				} else {
					[...new Array(Math.abs(numMonths))].forEach(() => doSubMonth());
				}
				const timeInfoAfter = getTimeInfo();
				if (timeInfoBefore.date !== timeInfoAfter.date && timeInfoBefore.date < timeInfoAfter.monthInfo.days) {
					const daysDiff = timeInfoBefore.date - timeInfoAfter.date;
					doModTime(daysDiff * timeInfoAfter.secsPerDay);
				}
			}
		};

		const btnSubMonth = veT`<button class="ve-btn ve-btn-xs ve-btn-default dm-time__btn-date-adjust"  title="Subtract Month (SHIFT for 5)">\u2212M</button>`
			.vee.onn("click", evt => doModMonths(evt.shiftKey ? -5 : -1));
		const btnAddMonth = veT`<button class="ve-btn ve-btn-xs ve-btn-default dm-time__btn-date-adjust" title="Add Month (SHIFT for 5)">M+</button>`
			.vee.onn("click", evt => doModMonths(evt.shiftKey ? 5 : 1));

		const btnSubYear = veT`<button class="ve-btn ve-btn-xs ve-btn-default dm-time__btn-date-adjust"  title="Subtract Year (SHIFT for 5)">\u2212Y</button>`
			.vee.onn("click", evt => doModTime(-1 * getTimeInfo().secsPerYear * (evt.shiftKey ? 5 : 1)));
		const btnAddYear = veT`<button class="ve-btn ve-btn-xs ve-btn-default dm-time__btn-date-adjust" title="Add Year (SHIFT for 5)">Y+</button>`
			.vee.onn("click", evt => doModTime(getTimeInfo().secsPerYear * (evt.shiftKey ? 5 : 1)));

		const iptYear = veT`<input class="ve-form-control form-control--minimal ve-text-center ve-input-xs dm-time__calendar-ipt-date dm-time__calendar-ipt-date--slashed-right" title="Year">`
			.vee.onn("change", () => {
				const {
					secsPerYear,
					year,
				} = getTimeInfo();
				const nxt = UiUtil.strToInt(iptYear.vee.val(), 1) - 1;
				iptYear.vee.val(nxt + 1);
				const diffYears = nxt - year;
				doModTime(diffYears * secsPerYear);
			});
		const iptMonth = veT`<input class="ve-form-control form-control--minimal ve-text-center ve-input-xs dm-time__calendar-ipt-date dm-time__calendar-ipt-date--slashed-left ${opts.isHideDays ? "" : "dm-time__calendar-ipt-date--slashed-right"}" title="Month">`
			.vee.onn("change", () => {
				const {
					month,
					monthsPerYear,
				} = getTimeInfo();
				const nxtRaw = UiUtil.strToInt(iptMonth.vee.val(), 1) - 1;
				const nxt = Math.max(0, Math.min(monthsPerYear - 1, nxtRaw));
				iptMonth.vee.val(nxt + 1);
				const diffMonths = nxt - month;
				doModMonths(diffMonths);
			});
		const iptDay = opts.isHideDays ? null : veT`<input class="ve-form-control form-control--minimal ve-text-center ve-input-xs dm-time__calendar-ipt-date dm-time__calendar-ipt-date--slashed-left" title="Day">`
			.vee.onn("change", () => {
				const {
					secsPerDay,
					date,
					monthInfo,
				} = getTimeInfo();
				const nxtRaw = UiUtil.strToInt(iptDay.vee.val(), 1) - 1;
				const nxt = Math.max(0, Math.min(monthInfo.days - 1, nxtRaw));
				iptDay.vee.val(nxt + 1);
				const diffDays = nxt - date;
				doModTime(diffDays * secsPerDay);
			});

		const wrpDateControls = veT`<div class="ve-flex ve-flex-vh-center">
			<div class="ve-flex ve-btn-group ve-mr-2">
				${btnSubYear}
				${btnSubMonth}
				${btnSubWeek}
				${btnSubDay}
			</div>
			<div class="ve-mr-2 ve-flex-v-center">
				${iptYear}
				<div class="ve-no-shrink dm-time__calendar-date-sep">/</div>
				${iptMonth}
				${iptDay ? `<div class="ve-no-shrink dm-time__calendar-date-sep">/</div>` : ""}
				${iptDay}
			</div>
			<div class="ve-flex-h-right ve-btn-group">
				${btnAddDay}
				${btnAddWeek}
				${btnAddMonth}
				${btnAddYear}
			</div>
		</div>`;

		return {wrpDateControls, iptYear, iptMonth, iptDay};
	}

	/**
	 * @param parent Parent pod.
	 * @param wrpCalendar Wrapper element.
	 * @param timeInfo Time info to render.
	 * @param fnClickDay Function run with args `year, eventDay, moonDay` when a day is clicked.
	 * @param [opts] Options object.
	 * @param [opts.isHideDay] True if the day should not be highlighted.
	 * @param [opts.hasColumnLabels] True if the columns should be labelled with the day of the week.
	 * @param [opts.hasRowLabels] True if the rows should be labelled with the week of the year.
	 */
	static renderCalendar (parent, wrpCalendar, timeInfo, fnClickDay, opts) {
		opts = opts || {};
		const {getEvents, getEncounters, getMoonInfos} = parent;

		const {
			date,
			year,
			monthInfo,
			monthStartDay,
			daysPerWeek,
			monthStartDayOfYear,
			numDays,
		} = timeInfo;

		wrpCalendar.vee.empty().vee.css({display: "grid"});

		const gridOffsetX = opts.hasRowLabels ? 1 : 0;
		const gridOffsetY = opts.hasColumnLabels ? 1 : 0;

		if (opts.hasColumnLabels) {
			const days = parent.getAllDayInfos();
			days.forEach((it, i) => {
				veT`<div class="small ve-muted ve-small-caps ve-text-center" title="${it.name.escapeQuotes()}">${it.name.slice(0, 2)}</div>`
					.vee.css({
						"grid-column-start": `${i + gridOffsetX + 1}`,
						"grid-column-end": `${i + gridOffsetX + 2}`,
						"grid-row-start": `1`,
						"grid-row-end": `2`,
					})
					.vee.appendTo(wrpCalendar);
			});
		}

		const daysInMonth = monthInfo.days;
		const loopBound = daysInMonth + (daysPerWeek - 1 - monthStartDay);
		for (let i = (-monthStartDay); i < loopBound; ++i) {
			const xPos = Math.floor((i + monthStartDay) % daysPerWeek);
			const yPos = Math.floor((i + monthStartDay) / daysPerWeek);

			if (xPos === 0 && opts.hasRowLabels && i < daysInMonth) {
				const weekNum = Math.floor(monthStartDayOfYear / daysPerWeek) + yPos;
				veT`<div class="small ve-muted ve-small-caps ve-flex-vh-center" title="Week ${weekNum}">${weekNum}</div>`
					.vee.css({
						"grid-column-start": `${xPos + 1}`,
						"grid-column-end": `${xPos + 2}`,
						"grid-row-start": `${yPos + gridOffsetY + 1}`,
						"grid-row-end": `${yPos + gridOffsetY + 2}`,
					})
					.vee.appendTo(wrpCalendar);
			}

			let ele;
			if (i < 0 || i >= daysInMonth) {
				ele = veT`<div class="ve-m-1"></div>`;
			} else {
				const eventDay = monthStartDayOfYear + i;
				const moonDay = numDays - (date - i);

				const moonInfos = getMoonInfos(moonDay);
				const events = getEvents(year, eventDay);
				const encounters = getEncounters(year, eventDay);

				const activeMoons = moonInfos.filter(it => it.phaseFirstDay);
				let moonPart;
				if (activeMoons.length) {
					const elesRenderedMoons = activeMoons.map((m, i) => {
						if (i === 0 || activeMoons.length < 3) {
							return TimeTrackerBase.getCvsMoon(m).vee.addClass("dm-time__calendar-moon-phase");
						} else if (i === 1) {
							const otherMoons = activeMoons.length - 1;
							return `<div class="dm-time__calendar-moon-phase ve-muted" title="${otherMoons} additional moon${otherMoons === 1 ? "" : "s"} not shown"><span class="glyphicon glyphicon-plus"></span></div>`;
						}
					});

					moonPart = veT`<div class="dm-time__disp-day-moon ve-flex-col">${elesRenderedMoons}</div>`;
				} else moonPart = "";

				ele = veT`<div class="dm-time__disp-calendar-day ve-btn-xxs ve-m-1 ve-relative ${i === date && !opts.isHideDay ? "dm-time__disp-calendar-day--active" : ""}">
					${i + 1}
					${events.length ? `<div class="dm-time__disp-day-entry dm-time__disp-day-entry--event" title="Has Events">*</div>` : ""}
					${encounters.length ? `<div class="dm-time__disp-day-entry dm-time__disp-day-entry--encounter" title="Has Encounters">*</div>` : ""}
					${moonPart}
				</div>`.vee.onn("click", (evt) => fnClickDay(evt, year, eventDay, moonDay));
			}
			ele.vee.css({
				"grid-column-start": `${xPos + gridOffsetX + 1}`,
				"grid-column-end": `${xPos + gridOffsetX + 2}`,
				"grid-row-start": `${yPos + gridOffsetY + 1}`,
				"grid-row-end": `${yPos + gridOffsetY + 2}`,
			});
			wrpCalendar.vee.appends(ele);
		}
	}

	_render_doJumpToDay (eventYear, eventDay) {
		const {getTimeInfo, doModTime} = this._parent;

		// Calculate difference vs base time, and exit browse mode if we're in it
		const {
			year,
			dayOfYear,
			secsPerYear,
			secsPerDay,
		} = getTimeInfo({isBase: true});

		const daySecs = (eventYear * secsPerYear) + (eventDay * secsPerDay);
		const currentSecs = (year * secsPerYear) + (dayOfYear * secsPerDay);
		const offset = daySecs - currentSecs;
		doModTime(offset, {isBase: true});
		this._parent.set("isBrowseMode", false);
	}

	_render_openDayModal (eventYear, eventDay, moonDay) {
		const {getTimeInfo, getEvents, getEncounters, getMoonInfos} = this._parent;

		const btnJumpToDay = veT`<button class="ve-btn ve-btn-xs ve-btn-default" title="Set the current date to this day. This will end Browse Mode, if it is currently active.">Go to Day</button>`
			.vee.onn("click", () => {
				this._render_doJumpToDay(eventYear, eventDay);
				doClose();
			});

		const btnAddEvent = veT`<button class="ve-btn ve-btn-xs ve-btn-primary"><span class="glyphicon glyphicon-plus"></span> Add Event</button>`
			.vee.onn("click", () => {
				const nxtPos = Object.keys(this._parent.get("events")).length;
				const nuEvent = TimeTrackerBase.getGenericEvent(nxtPos, year, eventDay);
				this._eventToEdit = nuEvent.id;
				this._parent.set("events", {...this._parent.get("events"), [nuEvent.id]: nuEvent});
			});

		const btnAddEventAtTime = veT`<button class="ve-btn ve-btn-xs ve-btn-primary" title="SHIFT to Add at Current Time">At Time...</button>`
			.vee.onn("click", async evt => {
				const chosenTimeInfo = await this._render_pGetEventTimeOfDay(eventYear, eventDay, evt.shiftKey);
				if (chosenTimeInfo == null) return;

				const nxtPos = Object.keys(this._parent.get("events")).length;
				const nuEvent = TimeTrackerBase.getGenericEvent(nxtPos, chosenTimeInfo.year, chosenTimeInfo.eventDay, chosenTimeInfo.timeOfDay);
				this._eventToEdit = nuEvent.id;
				this._parent.set("events", {...this._parent.get("events"), [nuEvent.id]: nuEvent});
			});

		const {year, dayInfo, date, monthInfo, seasonInfos, yearInfos, eraInfos} = getTimeInfo({year: eventYear, dayOfYear: eventDay});

		const pMutAddEncounter = async ({exportedSublist, nuEncounter}) => {
			exportedSublist = MiscUtil.copy(exportedSublist);
			exportedSublist.name = exportedSublist.name
				|| await InputUiUtil.pGetUserString({
					title: "Enter Encounter Name",
					default: await EncounterBuilderHelpers.pGetEncounterName(exportedSublist),
				})
				|| "(Unnamed encounter)";

			nuEncounter.name = exportedSublist.name;
			nuEncounter.data = exportedSublist;

			this._parent.set(
				"encounters",
				[...Object.values(this._parent.get("encounters")), nuEncounter]
					.mergeMap(it => ({[it.id]: it})),
			);
		};

		const menuEncounter = ContextUtil.getMenu([
			...ListUtilBestiary.getContextOptionsLoadSublist({
				pFnOnSelect: async ({exportedSublist}) => {
					const nxtPos = Object.keys(this._parent.get("encounters")).length;
					const nuEncounter = TimeTrackerBase.getGenericEncounter(nxtPos, year, eventDay);

					return pMutAddEncounter({exportedSublist, nuEncounter});
				},

				optsSaveManager: {
					isReferencable: true,
				},
			}),
		]);

		const menuEncounterAtTime = ContextUtil.getMenu([
			...ListUtilBestiary.getContextOptionsLoadSublist({
				pFnOnSelect: async ({exportedSublist, isShiftKey}) => {
					const chosenTimeInfo = await this._render_pGetEventTimeOfDay(eventYear, eventDay, isShiftKey);
					if (chosenTimeInfo == null) return;

					const nxtPos = Object.keys(this._parent.get("encounters")).length;
					const nuEncounter = TimeTrackerBase.getGenericEncounter(nxtPos, chosenTimeInfo.year, chosenTimeInfo.eventDay, chosenTimeInfo.timeOfDay);

					return pMutAddEncounter({exportedSublist, nuEncounter});
				},

				optsSaveManager: {
					isReferencable: true,
				},

				optsFromCurrent: {title: "SHIFT to Add at Current Time"},
				optsFromSaved: {title: "SHIFT to Add at Current Time"},
				optsFromFile: {title: "SHIFT to Add at Current Time"},
			}),
		]);

		const btnAddEncounter = veT`<button class="ve-btn ve-btn-xs ve-btn-success"><span class="glyphicon glyphicon-plus"></span> Add Encounter</button>`
			.vee.onn("click", evt => ContextUtil.pOpenMenu(evt, menuEncounter));

		const btnAddEncounterAtTime = veT`<button class="ve-btn ve-btn-xs ve-btn-success">At Time...</button>`
			.vee.onn("click", evt => ContextUtil.pOpenMenu(evt, menuEncounterAtTime));

		const {eleModalInner, doClose} = UiUtil.getShowModal({
			title: `${TimeTrackerBase.formatDateInfo(dayInfo, date, monthInfo, seasonInfos)}\u2014${TimeTrackerBase.formatYearInfo(year, yearInfos, eraInfos)}`,
			cbClose: () => {
				this._parent.removeHook("events", hookEvents);
				ContextUtil.deleteMenu(menuEncounter);
			},
			zIndex: VeCt.Z_INDEX_BENEATH_HOVER,
			isUncappedHeight: true,
			isHeight100: true,
			eleTitleSplit: btnJumpToDay,
		});

		const hrMoons = veT`<hr class="ve-hr-2 ve-no-shrink">`;
		const wrpMoons = veT`<div class="ve-flex ve-flex-wrap ve-w-100 ve-no-shrink ve-flex-v-center"></div>`;
		const hookMoons = () => {
			const todayMoonInfos = getMoonInfos(moonDay);
			wrpMoons.vee.empty();
			todayMoonInfos.forEach(moon => {
				veT`<div class="ve-flex-v-center ve-mr-2">
					${TimeTrackerBase.getCvsMoon(moon).vee.addClass("ve-mr-2")}
					<div class="ve-flex-col">
						<div class="ve-flex">${moon.name}</div>
						<div class="ve-flex small"><i class="ve-mr-1">${moon.phaseName}</i><span class="ve-muted">(Day ${moon.dayOfPeriod + 1}/${moon.period})</span></div>
					</div>
				</div>`.vee.appendTo(wrpMoons);
			});
			hrMoons.vee.toggle(!!todayMoonInfos.length);
		};
		this._parent.addHook("moons", hookMoons);
		hookMoons();

		const wrpEvents = veT`<div class="ve-flex-col ve-w-100 ve-overflow-y-auto dm-time__day-entry-wrapper"></div>`;
		const hookEvents = () => {
			const todayEvents = getEvents(year, eventDay);
			wrpEvents.vee.empty();
			this._tmpComps = [];
			const fnOpenCalendarPicker = this._render_openDayModal_openCalendarPicker.bind(this);
			todayEvents.forEach(event => {
				const comp = TimeTrackerRoot_Settings_Event.getInstance(this._board, this._wrpPanel, this._parent, event);
				this._tmpComps.push(comp);
				comp.render(wrpEvents, this._parent, fnOpenCalendarPicker);
			});
			if (!todayEvents.length) wrpEvents.vee.appends(`<div class="ve-flex-vh-center ve-italic">(No events)</div>`);
			if (this._eventToEdit) {
				const toEdit = this._tmpComps.find(it => it._state.id === this._eventToEdit);
				this._eventToEdit = null;
				if (toEdit) toEdit.doOpenEditModal();
			}
		};
		this._parent.addHook("events", hookEvents);
		hookEvents();

		const wrpEncounters = veT`<div class="ve-flex-col ve-w-100 ve-overflow-y-auto dm-time__day-entry-wrapper"></div>`;
		const hookEncounters = async () => {
			await this._pLock("encounters");

			const todayEncounters = getEncounters(year, eventDay);
			wrpEncounters.vee.empty();

			// update reference names
			await Promise.all(todayEncounters.map(async encounter => {
				const fromStorage = await TimeTrackerRoot_Calendar._pGetDereferencedEncounter(encounter);
				if (fromStorage != null) encounter.name = fromStorage.name;
			}));

			todayEncounters.forEach(encounter => {
				const iptName = veT`<input class="ve-form-control ve-input-xs form-control--minimal ve-mr-2 ve-w-100 ${encounter.countUses > 0 ? "ve-muted" : ""}">`
					.vee.onn("change", () => {
						encounter.displayName = iptName.vee.val().trim();
						this._parent.triggerMapUpdate("encounters");
					})
					.vee.val(encounter.displayName == null ? encounter.name : encounter.displayName);

				const btnRunEncounter = veT`<button class="ve-btn ve-btn-xs ve-btn-default ve-mr-2 ${encounter.countUses > 0 ? "disabled" : ""}" title="${encounter.countUses > 0 ? "(Encounter has been used)" : "Run Encounter (Add to Initiative Tracker)"}"><span class="glyphicon glyphicon-play"></span></button>`
					.vee.onn("click", () => TimeTrackerRoot_Calendar.pDoRunEncounter(this._parent, encounter));

				const btnResetUse = veT`<button class="ve-btn ve-btn-xs ve-btn-default ve-mr-2 ${encounter.countUses === 0 ? "disabled" : ""}" title="Reset Usage"><span class="glyphicon glyphicon-refresh"></span></button>`
					.vee.onn("click", () => {
						if (encounter.countUses === 0) return;

						encounter.countUses = 0;
						this._parent.triggerMapUpdate("encounters");
					});

				const btnSendToFoundry = veT`<button title="Send to Foundry" class="no-print ve-btn ve-btn-default ve-btn-xs ve-mr-2"><span class="glyphicon glyphicon-send"></span></button>`
					.vee.onn("click", async () => {
						const encounterActorName = await InputUiUtil.pGetUserString({title: "Encounter Actor Name", isSkippable: true});

						const toLoad = await TimeTrackerRoot_Calendar._pGetDereferencedEncounter(encounter);

						if (!toLoad) return JqueryUtil.doToast({content: "Could not find encounter data! Has the encounter been deleted?", type: "warning"});

						const {entityInfos} = await ListUtilBestiary.pGetLoadableSublist({exportedSublist: toLoad.data});

						await ExtensionUtil.pDoSend({
							type: "5etools.encounterbuilder.encounter",
							data: {
								encounterActorName,
								creatureMetasSerial: entityInfos
									.map(({count, entity}) => ({
										count,
										creature: entity,
									})),
							},
						});
					});

				const btnSaveToFile = veT`<button class="ve-btn ve-btn-xs ve-btn-default ve-mr-3" title="Download Encounter File"><span class="glyphicon glyphicon-download"></span></button>`
					.vee.onn("click", async () => {
						const toSave = await TimeTrackerRoot_Calendar._pGetDereferencedEncounter(encounter);

						if (!toSave) return JqueryUtil.doToast({content: "Could not find encounter data! Has the encounter been deleted?", type: "warning"});

						DataUtil.userDownload("encounter", toSave.data, {fileType: "encounter"});
					});

				const cbHasTime = veT`<input type="checkbox">`
					.vee.prop("checked", !!encounter.hasTime)
					.vee.onn("change", () => {
						const nxtHasTime = cbHasTime.vee.prop("checked");
						if (nxtHasTime) {
							const {secsPerDay} = getTimeInfo({isBase: true});
							if (encounter.timeOfDaySecs == null) encounter.timeOfDaySecs = Math.floor(secsPerDay / 2); // Default to noon
							encounter.hasTime = true;
						} else encounter.hasTime = false;
						this._parent.triggerMapUpdate("encounters");
					});

				let timeInputs;
				if (encounter.hasTime) {
					const timeInfo = getTimeInfo({isBase: true});
					const encounterCurTime = {hours: 0, minutes: 0, seconds: 0, timeOfDaySecs: encounter.timeOfDaySecs};

					if (encounter.timeOfDaySecs != null) {
						Object.assign(encounterCurTime, TimeTrackerBase.getHoursMinutesSecondsFromSeconds(timeInfo.secsPerHour, timeInfo.secsPerMinute, encounter.timeOfDaySecs));
					}

					timeInputs = TimeTrackerBase.getClockInputs(
						timeInfo,
						encounterCurTime,
						(nxtTimeSecs) => {
							encounter.timeOfDaySecs = nxtTimeSecs;
							this._parent.triggerMapUpdate("encounters");
						},
					);
				}

				const btnMove = veT`<button class="ve-btn ve-btn-xs ve-btn-default ve-mr-2 ve-no-shrink"><span class="glyphicon glyphicon-move" title="Move Encounter"></span></button>`
					.vee.onn("click", () => {
						this._render_openDayModal_openCalendarPicker({
							title: "Choose Encounter Day",
							fnClick: (evt, eventYear, eventDay) => {
								encounter.when = {
									day: eventDay,
									year: eventYear,
								};
								this._parent.triggerMapUpdate("encounters");
							},
							prop: "encounters",
						});
					});

				const btnDelete = veT`<button class="ve-btn ve-btn-xs ve-btn-danger" title="Delete Encounter"><span class="glyphicon glyphicon-trash"></span></button>`
					.vee.onn("click", () => {
						encounter.isDeleted = true;
						this._parent.triggerMapUpdate("encounters");
					});

				veT`<div class="ve-flex-v-center ve-w-100 ve-py-1 ve-px-2 stripe-even">
					${iptName}
					${btnRunEncounter}
					${btnResetUse}
					${btnSendToFoundry}
					${btnSaveToFile}
					<label class="ve-flex-v-center ${timeInputs ? "ve-mr-2" : "ve-mr-3"}">
						<div class="ve-mr-1 ve-no-wrap">Has Time?</div>
						${cbHasTime}
					</label>
					${timeInputs ? veT`<div class="ve-flex-v-center ve-mr-3">
						${timeInputs.iptHours}
						<div>:</div>
						${timeInputs.iptMinutes}
						<div>:</div>
						${timeInputs.iptSeconds}
					</div>` : ""}
					${btnMove}
					${btnDelete}
				</div>`.vee.appendTo(wrpEncounters);
			});
			if (!todayEncounters.length) wrpEncounters.vee.appends(`<div class="ve-flex-vh-center ve-italic">(No encounters)</div>`);

			this._unlock("encounters");
		};
		this._parent.addHook("encounters", hookEncounters);
		hookEncounters();

		veT`<div class="ve-flex-col ve-w-100 ve-h-100 ve-px-2">
			${wrpMoons}
			${hrMoons}
			<div class="ve-split ve-flex-v-center ve-mb-1 ve-no-shrink">
				<div class="ve-underline dm-time__day-entry-header">Events</div>
				<div class="ve-btn-group ve-flex">${btnAddEvent}${btnAddEventAtTime}</div>
			</div>
			${wrpEvents}
			<hr class="ve-hr-2 ve-no-shrink">
			<div class="ve-split ve-flex-v-center ve-mb-1 ve-no-shrink">
				<div class="ve-underline dm-time__day-entry-header">Encounters</div>
				<div class="ve-btn-group ve-flex">${btnAddEncounter}${btnAddEncounterAtTime}</div>
			</div>
			${wrpEncounters}
		</div>`.vee.appendTo(eleModalInner);
	}

	_render_getUserEventTime () {
		const {getTimeInfo} = this._parent;
		const {
			hoursPerDay,
			minutesPerHour,
			secsPerMinute,
			secsPerHour,
		} = getTimeInfo();
		const padLengthHours = `${hoursPerDay}`.length;
		const padLengthMinutes = `${minutesPerHour}`.length;
		const padLengthSecs = `${secsPerMinute}`.length;

		return new Promise(resolve => {
			class EventTimeModal extends BaseComponent {
				render (eleParent) {
					const selMode = ComponentUiUtil.getSelEnum(this, "mode", {values: ["Exact Time", "Time from Now"]}).vee.addClass("ve-mb-2");

					const iptExHour = ComponentUiUtil.getIptInt(
						this,
						"exactHour",
						0,
						{
							ele: veT`<input class="ve-form-control ve-input-xs form-control--minimal ve-text-center ve-mr-1">`,
							padLength: padLengthHours,
							min: 0,
							max: hoursPerDay - 1,
						},
					);
					const iptExMinutes = ComponentUiUtil.getIptInt(
						this,
						"exactMinute",
						0,
						{
							ele: veT`<input class="ve-form-control ve-input-xs form-control--minimal ve-text-center ve-mr-1">`,
							padLength: padLengthMinutes,
							min: 0,
							max: minutesPerHour - 1,
						},
					);
					const iptExSecs = ComponentUiUtil.getIptInt(
						this,
						"exactSec",
						0,
						{
							ele: veT`<input class="ve-form-control ve-input-xs form-control--minimal ve-text-center">`,
							padLength: padLengthSecs,
							min: 0,
							max: secsPerMinute - 1,
						},
					);

					const wrpExact = veT`<div class="ve-flex-vh-center">
						${iptExHour}
						<div class="ve-mr-1">:</div>
						${iptExMinutes}
						<div class="ve-mr-1">:</div>
						${iptExSecs}
					</div>`;

					const iptOffsetHour = ComponentUiUtil.getIptInt(
						this,
						"offsetHour",
						0,
						{
							ele: veT`<input class="ve-form-control ve-input-xs form-control--minimal ve-text-center ve-mr-1">`,
							min: -TimeTrackerBase._MAX_TIME,
							max: TimeTrackerBase._MAX_TIME,
						},
					);
					const iptOffsetMinutes = ComponentUiUtil.getIptInt(
						this,
						"offsetMinute",
						0,
						{
							ele: veT`<input class="ve-form-control ve-input-xs form-control--minimal ve-text-center ve-mr-1">`,
							min: -TimeTrackerBase._MAX_TIME,
							max: TimeTrackerBase._MAX_TIME,
						},
					);
					const iptOffsetSecs = ComponentUiUtil.getIptInt(
						this,
						"offsetSec",
						0,
						{
							ele: veT`<input class="ve-form-control ve-input-xs form-control--minimal ve-text-center ve-mr-1">`,
							min: -TimeTrackerBase._MAX_TIME,
							max: TimeTrackerBase._MAX_TIME,
						},
					);

					const wrpOffset = veT`<div class="ve-flex-vh-center">
						${iptOffsetHour}
						<div class="ve-mr-2 ve-no-wrap">hours,</div>
						${iptOffsetMinutes}
						<div class="ve-mr-2 ve-no-wrap">minutes, and</div>
						${iptOffsetSecs}
						<div class="ve-mr-2 ve-no-wrap">seconds from now</div>
					</div>`;

					const hookMode = () => {
						wrpExact.vee.toggle(this._state.mode === "Exact Time");
						wrpOffset.vee.toggle(this._state.mode !== "Exact Time");
					};
					this._addHookBase("mode", hookMode);
					hookMode();

					const btnOk = veT`<button class="ve-btn ve-btn-default">Enter</button>`
						.vee.onn("click", () => doClose(true));

					veT`<div class="ve-flex-col ve-h-100">
						<div class="ve-flex-vh-center ve-flex-col ve-w-100 ve-h-100">
							${selMode}
							${wrpExact}
							${wrpOffset}
						</div>
						${btnOk}
					</div>`.vee.appendTo(eleParent);
				}

				_getDefaultState () {
					return {
						mode: "Exact Time",
						exactHour: 0,
						exactMinute: 0,
						exactSec: 0,
						offsetHour: 0,
						offsetMinute: 0,
						offsetSec: 0,
					};
				}
			}

			const md = new EventTimeModal();

			const {eleModalInner, doClose} = UiUtil.getShowModal({
				title: "Enter a Time",
				cbClose: (isDataEntered) => {
					if (!isDataEntered) return resolve(null);

					const obj = md.toObject();
					if (obj.mode === "Exact Time") {
						resolve({mode: "timeExact", timeOfDaySecs: (obj.exactHour * secsPerHour) + (obj.exactMinute * secsPerMinute) + obj.exactSec});
					} else {
						resolve({mode: "timeOffset", secsOffset: (obj.offsetHour * secsPerHour) + (obj.offsetMinute * secsPerMinute) + obj.offsetSec});
					}
				},
			});

			md.render(eleModalInner);
		});
	}

	async _render_pGetEventTimeOfDay (eventYear, eventDay, isShiftDown) {
		const {getTimeInfo} = this._parent;

		let timeOfDay = null;
		if (isShiftDown) {
			const {timeOfDaySecs} = getTimeInfo();
			timeOfDay = timeOfDaySecs;
		} else {
			const userInput = await this._render_getUserEventTime();

			if (userInput == null) return null;

			if (userInput.mode === "timeExact") timeOfDay = userInput.timeOfDaySecs;
			else {
				const {timeOfDaySecs, secsPerYear, secsPerDay} = getTimeInfo();
				while (Math.abs(userInput.secsOffset) >= secsPerYear) {
					if (userInput.secsOffset < 0) {
						userInput.secsOffset += secsPerYear;
						eventYear -= 1;
					} else {
						userInput.secsOffset -= secsPerYear;
						eventYear += 1;
					}
				}
				eventYear = Math.max(0, eventYear);
				while (Math.abs(userInput.secsOffset) >= secsPerDay || userInput.secsOffset < 0) {
					if (userInput.secsOffset < 0) {
						userInput.secsOffset += secsPerDay;
						eventDay -= 1;
					} else {
						userInput.secsOffset -= secsPerDay;
						eventDay += 1;
					}
				}
				eventDay = Math.max(0, eventDay);
				timeOfDay = timeOfDaySecs + userInput.secsOffset;
			}
		}

		return {eventYear, eventDay, timeOfDay};
	}

	/**
	 * @param opts Options object.
	 * @param opts.title Modal title.
	 * @param opts.fnClick Click handler.
	 * @param opts.prop Component state property.
	 */
	_render_openDayModal_openCalendarPicker (opts) {
		opts = opts || {};

		const {eleModalInner, doClose} = UiUtil.getShowModal({
			title: opts.title,
			zIndex: VeCt.Z_INDEX_BENEATH_HOVER,
		});

		// Create a copy of the current state, as a temp component
		const temp = new TimeTrackerBase(null, null, {isTemporary: true});
		// Copy state
		Object.assign(temp.__state, this._parent.component.__state);
		const tempPod = temp.getPod();

		const {wrpDateControls, iptYear, iptMonth} = TimeTrackerRoot_Calendar.getDateControls(tempPod, {isHideWeeks: true, isHideDays: true});
		wrpDateControls.vee.addClass("ve-mb-2").vee.appendTo(eleModalInner);
		const wrpCalendar = veT`<div></div>`.vee.appendTo(eleModalInner);

		const hookCalendar = () => {
			const timeInfo = tempPod.getTimeInfo();

			TimeTrackerRoot_Calendar.renderCalendar(
				tempPod,
				wrpCalendar,
				timeInfo,
				(evt, eventYear, eventDay) => {
					opts.fnClick(evt, eventYear, eventDay);
					doClose();
				},
				{
					isHideDay: true,
					hasColumnLabels: this._parent.get("hasCalendarLabelsColumns"),
					hasRowLabels: this._parent.get("hasCalendarLabelsRows"),
				},
			);

			iptYear.vee.val(timeInfo.year + 1);
			iptMonth.vee.val(timeInfo.month + 1);
		};
		tempPod.addHook("time", hookCalendar);
		tempPod.addHook(opts.prop, hookCalendar);
		hookCalendar();

		const hookComp = () => this._parent.set(opts.prop, tempPod.get(opts.prop));
		tempPod.addHook(opts.prop, hookComp);
		// (Don't run hook immediately, as we won't make any changes)
	}

	static async _pGetDereferencedEncounter (encounter) {
		const saveManager = new SaveManager({
			isReadOnlyUi: true,
			page: UrlUtil.PG_BESTIARY,
			isReferencable: true,
		});
		await saveManager.pMutStateFromStorage();

		encounter = MiscUtil.copy(encounter);

		if (
			encounter.data.managerClient_isReferencable
			&& !encounter.data.managerClient_isLoadAsCopy
			&& encounter.data.saveId
		) {
			encounter = MiscUtil.copy(encounter);

			const nxtData = await saveManager.pGetSaveBySaveId({saveId: encounter.data.saveId});
			if (!nxtData) return null;

			encounter.data = nxtData;
		}
		return encounter;
	}

	static async pDoRunEncounter (parent, encounter) {
		if (encounter.countUses > 0) return;

		const panelApps = DmScreenUtil.getPanelApps({board: parent.component._board, type: PANEL_TYP_INITIATIVE_TRACKER});

		if (panelApps.length) {
			let panelApp;
			if (panelApps.length === 1) {
				panelApp = panelApps[0];
			} else {
				const ix = await InputUiUtil.pGetUserEnum({
					default: 0,
					title: "Choose a Tracker",
					placeholder: "Select tracker",
				});
				if (ix != null && ~ix) {
					panelApp = panelApps[ix];
				}
			}

			if (panelApp) {
				const toLoad = await TimeTrackerRoot_Calendar._pGetDereferencedEncounter(encounter);

				if (!toLoad) return JqueryUtil.doToast({content: "Could not find encounter data! Has the encounter been deleted?", type: "warning"});

				const {entityInfos, encounterInfo} = await ListUtilBestiary.pGetLoadableSublist({exportedSublist: toLoad.data});

				try {
					await panelApp.pDoLoadEncounter({entityInfos, encounterInfo});
				} catch (e) {
					JqueryUtil.doToast({type: "error", content: `Failed to add encounter! ${VeCt.STR_SEE_CONSOLE}`});
					throw e;
				}
				JqueryUtil.doToast({type: "success", content: "Encounter added to Initiative Tracker."});
				encounter.countUses += 1;
				parent.triggerMapUpdate("encounters");
			}
		} else {
			encounter.countUses += 1;
			parent.triggerMapUpdate("encounters");
		}
	}
}

class TimeTrackerRoot_Settings extends TimeTrackerComponent {
	static getTimeNum (str, isAllowNegative) {
		return UiUtil.strToInt(
			str,
			isAllowNegative ? 0 : TimeTrackerBase._MIN_TIME,
			{
				min: isAllowNegative ? -TimeTrackerBase._MAX_TIME : TimeTrackerBase._MIN_TIME,
				max: TimeTrackerBase._MAX_TIME,
				fallbackOnNaN: isAllowNegative ? 0 : TimeTrackerBase._MIN_TIME,
			},
		);
	}

	constructor (tracker, wrpPanel) {
		super(tracker, wrpPanel);

		// temp components
		this._tmpComps = {};
	}

	render (eleParent, parent) {
		eleParent.vee.empty();
		this._parent = parent;

		const getIptTime = (prop, opts) => {
			opts = opts || {};
			const ipt = veT`<input class="ve-form-control ve-input-xs form-control--minimal ve-w-30 ve-no-shrink ve-text-right">`
				.vee.onn("change", () => this._parent.set(prop, TimeTrackerRoot_Settings.getTimeNum(ipt.vee.val(), opts.isAllowNegative)));
			const hook = () => ipt.vee.val(this._parent.get(prop));
			this._parent.addHook(prop, hook);
			hook();
			return ipt;
		};

		const btnHideHooks = [];
		const getBtnHide = (prop, ele, ...eles) => {
			const btn = veT`<button class="ve-btn ve-btn-xs ve-btn-default" title="Hide Section"><span class="glyphicon glyphicon-eye-close"></span></button>`
				.vee.onn("click", () => this._parent.set(prop, !this._parent.get(prop)));
			const hook = () => {
				const isHidden = this._parent.get(prop);
				ele.vee.toggle(!isHidden);
				btn.vee.toggleClass("ve-active", isHidden);
				if (eles) eles.forEach(ele => ele.vee.toggle(!isHidden));
			};
			this._parent.addHook(prop, hook);
			btnHideHooks.push(hook);
			return btn;
		};

		const getBtnReset = (...props) => {
			return veT`<button class="ve-btn ve-btn-xs ve-btn-default ve-mr-2">Reset Section</button>`
				.vee.onn("click", async () => {
					if (!await InputUiUtil.pGetUserBoolean({title: "Reset", htmlDescription: "Are you sure?", textYes: "Yes", textNo: "Cancel"})) return;
					props.forEach(prop => this._parent.set(prop, TimeTrackerBase._DEFAULT_STATE[prop]));
				});
		};

		const selWindUnits = veT`<select class="ve-form-control ve-input-xs">
				<option value="mph">Miles per Hour</option>
				<option value="kmph">Kilometres per Hour</option>
			</select>`
			.vee.onn("change", () => this._parent.set("unitsWindSpeed", selWindUnits.vee.val()));
		const hookWindUnits = () => selWindUnits.vee.val(this._parent.get("unitsWindSpeed"));
		this._parent.addHook("unitsWindSpeed", hookWindUnits);
		hookWindUnits();

		const metaDays = this._render_getChildMeta_2({
			prop: "days",
			Cls: TimeTrackerRoot_Settings_Day,
			name: "Day",
			fnGetGeneric: TimeTrackerRoot.getGenericDay,
		});

		const metaMonths = this._render_getChildMeta_2({
			prop: "months",
			Cls: TimeTrackerRoot_Settings_Month,
			name: "Month",
			fnGetGeneric: TimeTrackerRoot.getGenericMonth,
		});

		const metaSeasons = this._render_getChildMeta_2({
			prop: "seasons",
			Cls: TimeTrackerRoot_Settings_Season,
			name: "Season",
			dispEmpty: veT`<div class="ve-flex-vh-center ve-my-1 ve-italic ve-w-100">(No seasons)</div>`,
			fnGetGeneric: TimeTrackerRoot.getGenericSeason,
		});

		const metaYears = this._render_getChildMeta_2({
			prop: "years",
			Cls: TimeTrackerRoot_Settings_Year,
			name: "Year",
			dispEmpty: veT`<div class="ve-flex-vh-center ve-my-1 ve-italic ve-w-100">(No named years)</div>`,
			fnGetGeneric: TimeTrackerRoot.getGenericYear,
		});

		const metaEras = this._render_getChildMeta_2({
			prop: "eras",
			Cls: TimeTrackerRoot_Settings_Era,
			name: "Era",
			dispEmpty: veT`<div class="ve-flex-vh-center ve-my-1 ve-italic ve-w-100">(No eras)</div>`,
			fnGetGeneric: TimeTrackerRoot.getGenericEra,
		});

		const metaMoons = this._render_getChildMeta_2({
			prop: "moons",
			Cls: TimeTrackerRoot_Settings_Moon,
			name: "Moon",
			dispEmpty: veT`<div class="ve-flex-vh-center ve-my-1 ve-italic ve-w-100">(No moons)</div>`,
			fnGetGeneric: TimeTrackerRoot.getGenericMoon,
		});

		const sectClock = veT`<div class="ve-no-shrink ve-w-100 ve-mb-2">
			<div class="ve-split-v-center ve-mb-2"><div class="ve-w-100">Hours per Day</div>${getIptTime("hoursPerDay")}</div>
			<div class="ve-split-v-center ve-mb-2"><div class="ve-w-100">Minutes per Hour</div>${getIptTime("minutesPerHour")}</div>
			<div class="ve-split-v-center"><div class="ve-w-100">Seconds per Minute</div>${getIptTime("secondsPerMinute")}</div>
		</div>`;
		const btnResetClock = getBtnReset("hoursPerDay", "minutesPerHour", "secondsPerMinute");
		const btnHideSectClock = getBtnHide("isClockSectionHidden", sectClock, btnResetClock);
		const headClock = veT`<div class="ve-split-v-center ve-mb-2"><div class="ve-bold">Clock</div><div>${btnResetClock}${btnHideSectClock}</div></div>`;

		const sectCalendar = veT`<div class="ve-no-shrink ve-w-100 ve-mb-2">
			<label class="ve-split-v-center ve-mb-2"><div class="ve-w-100">Show Calendar Column Labels</div>${ComponentUiUtil.getCbBool(this._parent.component, "hasCalendarLabelsColumns")}</label>
			<label class="ve-split-v-center ve-mb-2"><div class="ve-w-100">Show Calendar Row Labels</div>${ComponentUiUtil.getCbBool(this._parent.component, "hasCalendarLabelsRows")}</label>
		</div>`;
		const btnResetCalendar = getBtnReset("hoursPerDay", "minutesPerHour", "secondsPerMinute");
		const btnHideSectCalendar = getBtnHide("isCalendarSectionHidden", sectCalendar, btnResetCalendar);
		const headCalendar = veT`<div class="ve-split-v-center ve-mb-2"><div class="ve-bold">Calendar</div><div>${btnResetCalendar}${btnHideSectCalendar}</div></div>`;

		const sectMechanics = veT`<div class="ve-no-shrink ve-w-100 ve-mb-2">
			<div class="ve-split-v-center ve-mb-2"><div class="ve-w-100">Hours per Long rest</div>${getIptTime("hoursPerLongRest")}</div>
			<div class="ve-split-v-center ve-mb-2"><div class="ve-w-100">Minutes per Short Rest</div>${getIptTime("minutesPerShortRest")}</div>
			<div class="ve-split-v-center"><div class="ve-w-100">Seconds per Round</div>${getIptTime("secondsPerRound")}</div>
		</div>`;
		const btnResetMechanics = getBtnReset("hoursPerLongRest", "minutesPerShortRest", "secondsPerRound");
		const btnHideSectMechanics = getBtnHide("isMechanicsSectionHidden", sectMechanics, btnResetMechanics);
		const headMechanics = veT`<div class="ve-split-v-center ve-mb-2"><div class="ve-bold">Game Mechanics</div><div>${btnResetMechanics}${btnHideSectMechanics}</div></div>`;

		const sectOffsets = veT`<div class="ve-no-shrink ve-w-100 ve-mb-2">
			<div class="ve-split-v-center ve-mb-2"><div class="ve-w-100 ve-help" title="For example, to have the starting year be &quot;Year 900,&quot; enter &quot;899&quot;.">Year Offset</div>${getIptTime("offsetYears", {isAllowNegative: true})}</div>
			<div class="ve-split-v-center"><div class="ve-w-100 ve-help" title="For example, to have the first year start on the third day of the week, enter &quot;2&quot;.">Year Start Weekday Offset</div>${getIptTime("offsetMonthStartDay")}</div>
		</div>`;
		const btnResetOffsets = getBtnReset("offsetYears", "offsetMonthStartDay");
		const btnHideSectOffsetsHide = getBtnHide("isOffsetsSectionHidden", sectOffsets, btnResetOffsets);
		const headOffsets = veT`<div class="ve-split-v-center ve-mb-2"><div class="ve-bold">Offsets</div><div>${btnResetOffsets}${btnHideSectOffsetsHide}</div></div>`;

		const sectDays = veT`<div class="ve-no-shrink ve-w-100">
			<div class="ve-split-v-center ve-w-100 ve-mb-1 ve-mt-1">
				<div>Name</div>
				${metaDays.btnAdd}
			</div>
			${metaDays.wrpRows}
		</div>`;
		const btnHideSectDays = getBtnHide("isDaysSectionHidden", sectDays);
		const headDays = veT`<div class="ve-split-v-center ve-mb-1"><div class="ve-bold">Days</div>${btnHideSectDays}</div>`;

		const sectMonths = veT`<div class="ve-no-shrink ve-w-100">
			<div class="ve-flex ve-w-100 ve-mb-1 ve-mt-1">
				<div class="ve-w-100 ve-flex-v-center">Name</div>
				<div class="ve-w-25 ve-no-shrink ve-text-center ve-mr-2">Days</div>
				<div class="dm-time__spc-drag-header ve-no-shrink ve-mr-2"></div>
				${metaMonths.btnAdd.vee.addClass("ve-no-shrink")}
			</div>
			${metaMonths.wrpRows}
		</div>`;
		const btnHideSectMonths = getBtnHide("isMonthsSectionHidden", sectMonths);
		const headMonths = veT`<div class="ve-split-v-center ve-mb-1"><div class="ve-bold">Months</div>${btnHideSectMonths}</div>`;

		const sectSeasons = veT`<div class="ve-no-shrink ve-w-100">
			<div class="ve-flex ve-w-100 ve-mb-1 ve-mt-1">
				<div class="ve-w-100 ve-flex-v-center">Name</div>
				<div class="ve-w-15 ve-no-shrink ve-text-center ve-mr-2 ve-help-subtle" title="In hours. For example, to have the sun rise at 05:00, enter &quot;5&quot;.">Sunrise</div>
				<div class="ve-w-15 ve-no-shrink ve-text-center ve-mr-2 ve-help-subtle" title="In hours. For example, to have the sun set at 22:00, enter &quot;22&quot;.">Sunset</div>
				<div class="ve-w-15 ve-no-shrink ve-text-center ve-mr-2 ve-help-subtle" title="For example, to have a season start on the 1st day of the year, enter &quot;1&quot;.">Start</div>
				<div class="ve-w-15 ve-no-shrink ve-text-center ve-mr-2 ve-help-subtle" title="For example, to have a season end on the 90th day of the year, enter &quot;90&quot;.">End</div>
				${metaSeasons.btnAdd.vee.addClass("ve-no-shrink")}
			</div>
			${metaSeasons.wrpRows}
		</div>`;
		const btnHideSectSeasons = getBtnHide("isSeasonsSectionHidden", sectSeasons);
		const headSeasons = veT`<div class="ve-split-v-center ve-mb-1"><div class="ve-bold">Seasons</div>${btnHideSectSeasons}</div>`;

		const sectYears = veT`<div class="ve-no-shrink ve-w-100">
			<div class="ve-flex ve-w-100 ve-mb-1 ve-mt-1">
				<div class="ve-w-100 ve-flex-v-center">Name</div>
				<div class="ve-w-25 ve-no-shrink ve-text-center ve-mr-2">Year</div>
				${metaYears.btnAdd.vee.addClass("ve-no-shrink")}
			</div>
			${metaYears.wrpRows}
		</div>`;
		const btnHideSectYears = getBtnHide("isYearsSectionHidden", sectYears);
		const headYears = veT`<div class="ve-split-v-center ve-mb-1"><div class="ve-bold">Named Years</div>${btnHideSectYears}</div>`;

		const sectEras = veT`<div class="ve-no-shrink ve-w-100">
			<div class="ve-flex ve-w-100 ve-mb-1 ve-mt-1">
				<div class="ve-w-100 ve-flex-v-center">Name</div>
				<div class="ve-w-15 ve-no-shrink ve-text-center ve-mr-2">Abbv.</div>
				<div class="ve-w-15 ve-no-shrink ve-text-center ve-mr-2">Start</div>
				<div class="ve-w-15 ve-no-shrink ve-text-center ve-mr-2">End</div>
				${metaEras.btnAdd.vee.addClass("ve-no-shrink")}
			</div>
			${metaEras.wrpRows}
		</div>`;
		const btnHideSectEras = getBtnHide("isErasSectionHidden", sectEras);
		const headEras = veT`<div class="ve-split-v-center ve-mb-1"><div class="ve-bold">Eras</div>${btnHideSectEras}</div>`;

		const sectMoons = veT`<div class="ve-no-shrink ve-w-100">
			<div class="ve-flex ve-w-100 ve-mb-1 ve-mt-1">
				<div class="ve-w-100 ve-flex-v-center">Moon</div>
				<div class="ve-w-25 ve-no-shrink ve-text-center ve-mr-2 ve-help-subtle" title="For example, to have a new moon appear on the third day of the first year, enter &quot;3&quot;.">Offset</div>
				<div class="ve-w-25 ve-no-shrink ve-text-center ve-mr-2 ve-help-subtle" title="Measured in days. Multiples of eight are recommended, as there are eight distinct moon phases.">Period</div>
				${metaMoons.btnAdd.vee.addClass("ve-no-shrink")}
			</div>
			${metaMoons.wrpRows}
		</div>`;
		const btnHideSectMoons = getBtnHide("isMoonsSectionHidden", sectMoons);
		const headMoons = veT`<div class="ve-split-v-center ve-mb-1"><div class="ve-bold">Moons</div>${btnHideSectMoons}</div>`;

		btnHideHooks.forEach(fn => fn());

		veT`<div class="ve-flex-col ve-pl-2 ve-pr-3">
			${headClock}
			${sectClock}
			<hr class="ve-hr-0 ve-mb-2">
			${headCalendar}
			${sectCalendar}
			<hr class="ve-hr-0 ve-mb-2">
			${headMechanics}
			${sectMechanics}
			<hr class="ve-hr-0 ve-mb-2">
			${headOffsets}
			${sectOffsets}
			<hr class="ve-hr-0 ve-mb-2">
			<div class="ve-split-v-center"><div class="ve-w-100">Wind Speed Units</div>${selWindUnits}</div>
			<hr class="ve-hr-2">
			${headDays}
			${sectDays}
			<hr class="ve-hr-0 ve-mt-1 ve-mb-2">
			${headMonths}
			${sectMonths}
			<hr class="ve-hr-0 ve-mt-1 ve-mb-2">
			${headSeasons}
			${sectSeasons}
			<hr class="ve-hr-0 ve-mt-1 ve-mb-2">
			${headYears}
			${sectYears}
			<hr class="ve-hr-0 ve-mt-1 ve-mb-2">
			${headEras}
			${sectEras}
			<hr class="ve-hr-0 ve-mt-1 ve-mb-2">
			${headMoons}
			${sectMoons}
		</div>`.vee.appendTo(eleParent);
	}

	_render_getChildMeta_2 ({prop, Cls, name, dispEmpty = null, fnGetGeneric}) {
		const wrpRows = this._render_getWrpChildren();
		if (dispEmpty) wrpRows.vee.appends(dispEmpty);

		const btnAdd = this._render_getBtnAddChild({
			prop: prop,
			name,
			fnGetGeneric,
		});

		const dragMeta = {
			swapRowPositions: (ixA, ixB) => {
				const a = this._parent.component._state[prop][ixA];
				this._parent.component._state[prop][ixA] = this._parent.component._state[prop][ixB];
				this._parent.component._state[prop][ixB] = a;
				this._parent.component._triggerCollectionUpdate(prop);

				this._parent.component._state[prop]
					.map(it => this._parent.component._rendered[prop][it.id].wrpRow)
					.forEach(ele => wrpRows.vee.appends(ele));
			},
			getElesChildren: () => {
				return this._parent.component._state[prop]
					.map(it => this._parent.component._rendered[prop][it.id].wrpRow);
			},
			eleParent: wrpRows,
		};

		const renderableCollection = new Cls(
			this._parent.component,
			prop,
			wrpRows,
			dragMeta,
		);
		const hk = () => {
			renderableCollection.render();
			if (dispEmpty) dispEmpty.vee.toggle(!this._parent.get(prop)?.length);
		};
		this._parent.component._addHookBase(prop, hk);
		hk();

		return {btnAdd, wrpRows};
	}

	_render_getWrpChildren () {
		return veT`<div class="ve-flex-col ve-w-100 ve-relative"></div>`;
	}

	_render_getBtnAddChild ({prop, name, fnGetGeneric}) {
		return veT`<button class="ve-btn ve-btn-xs ve-btn-primary" title="Add ${name}"><span class="glyphicon glyphicon-plus"></span></button>`
			.vee.onn("click", () => {
				const nxt = fnGetGeneric(this._parent.get(prop).length);
				this._parent.set(prop, [...this._parent.get(prop), nxt]);
			});
	}
}

class RenderableCollectionTimeTracker extends RenderableCollectionBase {
	constructor (comp, prop, wrpRows, dragMeta) {
		super(comp, prop);
		this._wrpRows = wrpRows;
		this._dragMeta = dragMeta;
	}
}

class TimeTrackerRoot_Settings_Day extends RenderableCollectionTimeTracker {
	getNewRender (entity, i) {
		const comp = BaseComponent.fromObject(entity.data, "*");
		comp._addHookAll("state", () => {
			entity.data = comp.toObject("*");
			this._comp._triggerCollectionUpdate("days");
		});

		const iptName = ComponentUiUtil.getIptStr(comp, "name", {ele: veT`<input class="ve-form-control ve-input-xs form-control--minimal ve-mr-2">`});

		const padDrag = DragReorderUiUtil.getDragPadOpts(() => wrpRow, this._dragMeta);

		const btnRemove = veT`<button class="ve-btn ve-btn-xs ve-btn-danger ve-no-shrink" title="Delete Day"><span class="glyphicon glyphicon-trash"></span></button>`
			.vee.onn("click", () => this._comp._state.days = this._comp._state.days.filter(it => it !== entity));

		const wrpRow = veT`<div class="ve-flex ve-py-1 dm-time__row-delete">
			${iptName}
			${padDrag}
			${btnRemove}
			<div class="dm-time__spc-button"></div>
		</div>`.vee.appendTo(this._wrpRows);

		return {
			comp,
			wrpRow,
		};
	}

	doUpdateExistingRender (renderedMeta, entity, i) {
		renderedMeta.comp._proxyAssignSimple("state", entity.data, true);
		if (!renderedMeta.wrpRow.vee.parent().vee.is(this._wrpRows)) renderedMeta.wrpRow.vee.appendTo(this._wrpRows);
	}
}

class TimeTrackerRoot_Settings_Month extends RenderableCollectionTimeTracker {
	getNewRender (entity, i) {
		const comp = BaseComponent.fromObject(entity.data, "*");
		comp._addHookAll("state", () => {
			entity.data = comp.toObject("*");
			this._comp._triggerCollectionUpdate("months");
		});

		const iptName = ComponentUiUtil.getIptStr(comp, "name", {ele: veT`<input class="ve-form-control ve-input-xs form-control--minimal ve-mr-2">`});
		const iptDays = ComponentUiUtil.getIptInt(comp, "days", 1, {ele: veT`<input class="ve-form-control ve-input-xs form-control--minimal ve-text-right ve-mr-2 ve-w-25 ve-no-shrink">`, min: TimeTrackerBase._MIN_TIME, max: TimeTrackerBase._MAX_TIME});

		const padDrag = DragReorderUiUtil.getDragPadOpts(() => wrpRow, this._dragMeta);

		const btnRemove = veT`<button class="ve-btn ve-btn-xs ve-btn-danger ve-no-shrink" title="Delete Month"><span class="glyphicon glyphicon-trash"></span></button>`
			.vee.onn("click", () => this._comp._state.months = this._comp._state.months.filter(it => it !== entity));

		const wrpRow = veT`<div class="ve-flex ve-py-1 dm-time__row-delete">
			${iptName}
			${iptDays}
			${padDrag}
			${btnRemove}
			<div class="dm-time__spc-button"></div>
		</div>`.vee.appendTo(this._wrpRows);

		return {
			comp,
			wrpRow,
		};
	}

	doUpdateExistingRender (renderedMeta, entity, i) {
		renderedMeta.comp._proxyAssignSimple("state", entity.data, true);
		if (!renderedMeta.wrpRow.vee.parent().vee.is(this._wrpRows)) renderedMeta.wrpRow.vee.appendTo(this._wrpRows);
	}
}

class TimeTrackerRoot_Settings_Event extends TimeTrackerComponent {
	render (eleParent, parent, fnOpenCalendarPicker) {
		const {getTimeInfo} = parent;

		const doShowHideEntries = () => {
			const isShown = this._state.entries.length && !this._state.isHidden;
			wrpEntries.vee.toggleClass("hidden", !isShown);
		};

		const dispEntries = veT`<div class="ve-stats ve-stats--book dm-time__wrp-event-entries"></div>`;
		const hookEntries = () => {
			dispEntries.vee.html(Renderer.get().render({entries: MiscUtil.copy(this._state.entries)}));
			doShowHideEntries();
		};
		this._addHookBase("entries", hookEntries);

		const wrpEntries = veT`<div class="ve-flex">
			<div class="ve-no-shrink dm-time__bar-entry"></div>
			${dispEntries}
		</div>`;

		const iptName = veT`<input class="ve-form-control ve-input-xs form-control--minimal ve-mr-2 ve-w-100">`
			.vee.onn("change", () => this._state.name = iptName.vee.val().trim() || "(Unnamed event)");
		const hookName = () => iptName.vee.val(this._state.name || "(Unnamed event)");
		this._addHookBase("name", hookName);

		const btnShowHide = veT`<button class="ve-btn ve-btn-xs ve-btn-default ve-mr-2 ve-no-shrink"><span class="glyphicon glyphicon-eye-close"></span></button>`
			.vee.onn("click", () => this._state.isHidden = !this._state.isHidden);
		const hookShowHide = () => {
			btnShowHide.vee.toggleClass("ve-active", !!this._state.isHidden);
			doShowHideEntries();
		};
		this._addHookBase("isHidden", hookShowHide);

		const btnEdit = veT`<button class="ve-btn ve-btn-xs ve-btn-default ve-mr-2 ve-no-shrink"><span class="glyphicon glyphicon-pencil" title="Edit Event"></span></button>`
			.vee.onn("click", () => this.doOpenEditModal());

		const cbHasTime = veT`<input type="checkbox">`
			.vee.prop("checked", !!this._state.hasTime)
			.vee.onn("change", () => {
				const nxtHasTime = cbHasTime.vee.prop("checked");
				if (nxtHasTime) {
					const {secsPerDay} = getTimeInfo({isBase: true});
					// Modify the base state to avoid double-updating the collection
					if (this.__state.timeOfDaySecs == null) this.__state.timeOfDaySecs = Math.floor(secsPerDay / 2); // Default to noon
					this._state.hasTime = true;
				} else this._state.hasTime = false;
			});

		let timeInputs;
		if (this._state.hasTime) {
			const timeInfo = getTimeInfo({isBase: true});
			const eventCurTime = {hours: 0, minutes: 0, seconds: 0, timeOfDaySecs: this._state.timeOfDaySecs};

			if (this._state.timeOfDaySecs != null) {
				Object.assign(eventCurTime, TimeTrackerBase.getHoursMinutesSecondsFromSeconds(timeInfo.secsPerHour, timeInfo.secsPerMinute, this._state.timeOfDaySecs));
			}

			timeInputs = TimeTrackerBase.getClockInputs(
				timeInfo,
				eventCurTime,
				(nxtTimeSecs) => {
					this._state.timeOfDaySecs = nxtTimeSecs;
				},
			);
		}

		const btnMove = veT`<button class="ve-btn ve-btn-xs ve-btn-default ve-mr-2 ve-no-shrink"><span class="glyphicon glyphicon-move" title="Move Event"></span></button>`
			.vee.onn("click", () => {
				fnOpenCalendarPicker({
					title: "Choose Event Day",
					fnClick: (evt, eventYear, eventDay) => {
						this._state.when = {
							day: eventDay,
							year: eventYear,
						};
					},
					prop: "events",
				});
			});

		const btnRemove = veT`<button class="ve-btn ve-btn-xs ve-btn-danger ve-no-shrink" title="Delete Event"><span class="glyphicon glyphicon-trash"></span></button>`
			.vee.onn("click", () => this._state.isDeleted = true);

		hookEntries();
		hookName();
		hookShowHide();

		veT`<div class="ve-flex-col ve-py-1 ve-px-2 stripe-even">
			<div class="ve-flex ve-w-100">
				${iptName}
				${btnShowHide}
				${btnEdit}
				<label class="ve-flex-v-center ${timeInputs ? "ve-mr-2" : "ve-mr-3"}">
					<div class="ve-mr-1 ve-no-wrap">Has Time?</div>
					${cbHasTime}
				</label>
				${timeInputs ? veT`<div class="ve-flex-v-center ve-mr-3">
					${timeInputs.iptHours}
					<div>:</div>
					${timeInputs.iptMinutes}
					<div>:</div>
					${timeInputs.iptSeconds}
				</div>` : ""}
				${btnMove}
				${btnRemove}
			</div>
			${wrpEntries}
		</div>`.vee.appendTo(eleParent);
	}

	doOpenEditModal (overlayColor = "transparent") {
		// Edit against a fake component, so we don't modify the original until we save
		const fauxComponent = new BaseComponent();
		fauxComponent._state.name = this._state.name;
		fauxComponent._state.entries = MiscUtil.copy(this._state.entries);

		const {eleModalInner, doClose} = UiUtil.getShowModal({
			title: "Edit Event",
			overlayColor: overlayColor,
			cbClose: (isDataEntered) => {
				if (!isDataEntered) return;
				this._state.name = fauxComponent._state.name;
				this._state.entries = MiscUtil.copy(fauxComponent._state.entries);
			},
		});

		const iptName = ComponentUiUtil.getIptStr(fauxComponent, "name", {ele: veT`<input class="ve-form-control ve-input-xs form-control--minimal ve-mb-2 ve-no-shrink">`});
		const iptEntries = ComponentUiUtil.getIptEntries(fauxComponent, "entries", {ele: veT`<textarea class="ve-form-control ve-input-xs form-control--minimal ve-resize-none ve-mb-2 ve-h-100"></textarea>`});

		const btnOk = veT`<button class="ve-btn ve-btn-default">Save</button>`
			.vee.onn("click", () => doClose(true));

		veT`<div class="ve-flex-col ve-h-100">
			${iptName}
			${iptEntries}
			<div class="ve-flex-h-right ve-no-shrink">${btnOk}</div>
		</div>`.vee.appendTo(eleModalInner);
	}

	getState () { return MiscUtil.copy(this._state); }

	_getDefaultState () { return MiscUtil.copy(TimeTrackerBase._DEFAULT_STATE__EVENT); }

	static getInstance (board, wrpPanel, parent, event) {
		const comp = new TimeTrackerRoot_Settings_Event(board, wrpPanel);
		comp.setStateFrom({state: event});
		comp._addHookAll("state", () => {
			const otherEvents = Object.values(parent.get("events"))
				.filter(it => !(it.isDeleted || it.id === comp.getState().id));

			parent.set("events", [...otherEvents, comp.getState()].mergeMap(it => ({[it.id]: it})));
		});
		return comp;
	}
}

class TimeTrackerRoot_Settings_Season extends RenderableCollectionTimeTracker {
	getNewRender (entity, i) {
		const comp = BaseComponent.fromObject(entity.data, "*");
		comp._addHookAll("state", () => {
			entity.data = comp.toObject("*");
			this._comp._triggerCollectionUpdate("seasons");
		});

		const iptName = ComponentUiUtil.getIptStr(comp, "name", {ele: veT`<input class="ve-form-control ve-input-xs form-control--minimal ve-mr-2">`});

		const getIptHours = (prop) => ComponentUiUtil.getIptInt(comp, prop, 0, {ele: veT`<input class="ve-form-control ve-input-xs form-control--minimal ve-text-right ve-mr-2 ve-w-15 ve-no-shrink">`, min: 0});

		const getIptDays = (prop) => ComponentUiUtil.getIptInt(comp, prop, 1, {ele: veT`<input class="ve-form-control ve-input-xs form-control--minimal ve-text-right ve-mr-2 ve-w-15 ve-no-shrink">`, offset: 1, min: 1});

		const iptSunrise = getIptHours("sunriseHour");
		const iptSunset = getIptHours("sunsetHour");

		const iptDaysStart = getIptDays("startDay");
		const iptDaysEnd = getIptDays("endDay");

		const btnRemove = veT`<button class="ve-btn ve-btn-xs ve-btn-danger ve-no-shrink" title="Delete Season"><span class="glyphicon glyphicon-trash"></span></button>`
			.vee.onn("click", () => this._comp._state.seasons = this._comp._state.seasons.filter(it => it !== entity));

		const wrpRow = veT`<div class="ve-flex ve-my-1">
			${iptName}
			${iptSunrise}
			${iptSunset}
			${iptDaysStart}
			${iptDaysEnd}
			${btnRemove}
		</div>`.vee.appendTo(this._wrpRows);

		return {
			comp,
			wrpRow,
		};
	}

	doUpdateExistingRender (renderedMeta, entity, i) {
		renderedMeta.comp._proxyAssignSimple("state", entity.data, true);
		if (!renderedMeta.wrpRow.vee.parent().vee.is(this._wrpRows)) renderedMeta.wrpRow.vee.appendTo(this._wrpRows);
	}
}

class TimeTrackerRoot_Settings_Year extends RenderableCollectionTimeTracker {
	getNewRender (entity, i) {
		const comp = BaseComponent.fromObject(entity.data, "*");
		comp._addHookAll("state", () => {
			entity.data = comp.toObject("*");
			this._comp._triggerCollectionUpdate("years");
		});

		const iptName = ComponentUiUtil.getIptStr(comp, "name", {ele: veT`<input class="ve-form-control ve-input-xs form-control--minimal ve-mr-2">`});

		const iptYear = ComponentUiUtil.getIptInt(comp, "year", 1, {ele: veT`<input class="ve-form-control ve-input-xs form-control--minimal ve-text-right ve-mr-2 ve-w-25 ve-no-shrink">`, offset: 1, min: 1});

		const btnRemove = veT`<button class="ve-btn ve-btn-xs ve-btn-danger ve-no-shrink" title="Delete Year"><span class="glyphicon glyphicon-trash"></span></button>`
			.vee.onn("click", () => this._comp._state.years = this._comp._state.years.filter(it => it !== entity));

		const wrpRow = veT`<div class="ve-flex ve-my-1">
			${iptName}
			${iptYear}
			${btnRemove}
		</div>`.vee.appendTo(this._wrpRows);

		return {
			comp,
			wrpRow,
		};
	}

	doUpdateExistingRender (renderedMeta, entity, i) {
		renderedMeta.comp._proxyAssignSimple("state", entity.data, true);
		if (!renderedMeta.wrpRow.vee.parent().vee.is(this._wrpRows)) renderedMeta.wrpRow.vee.appendTo(this._wrpRows);
	}
}

class TimeTrackerRoot_Settings_Era extends RenderableCollectionTimeTracker {
	getNewRender (entity, i) {
		const comp = BaseComponent.fromObject(entity.data, "*");
		comp._addHookAll("state", () => {
			entity.data = comp.toObject("*");
			this._comp._triggerCollectionUpdate("eras");
		});

		const getIptYears = (prop) => ComponentUiUtil.getIptInt(comp, prop, 1, {ele: veT`<input class="ve-form-control ve-input-xs form-control--minimal ve-text-right ve-mr-2 ve-w-15 ve-no-shrink">`, offset: 1, min: 1});

		const iptName = ComponentUiUtil.getIptStr(comp, "name", {ele: veT`<input class="ve-form-control ve-input-xs form-control--minimal ve-mr-2">`});
		const iptAbbreviation = ComponentUiUtil.getIptStr(comp, "abbreviation", {ele: veT`<input class="ve-form-control ve-input-xs form-control--minimal ve-mr-2 ve-w-15 ve-no-shrink">`});
		const iptYearsStart = getIptYears("startYear");
		const iptYearsEnd = getIptYears("endYear");

		const btnRemove = veT`<button class="ve-btn ve-btn-xs ve-btn-danger ve-no-shrink" title="Delete Year"><span class="glyphicon glyphicon-trash"></span></button>`
			.vee.onn("click", () => this._comp._state.eras = this._comp._state.eras.filter(it => it !== entity));

		const wrpRow = veT`<div class="ve-flex ve-my-1">
			${iptName}
			${iptAbbreviation}
			${iptYearsStart}
			${iptYearsEnd}
			${btnRemove}
		</div>`.vee.appendTo(this._wrpRows);

		return {
			comp,
			wrpRow,
		};
	}

	doUpdateExistingRender (renderedMeta, entity, i) {
		renderedMeta.comp._proxyAssignSimple("state", entity.data, true);
		if (!renderedMeta.wrpRow.vee.parent().vee.is(this._wrpRows)) renderedMeta.wrpRow.vee.appendTo(this._wrpRows);
	}
}

class TimeTrackerRoot_Settings_Moon extends RenderableCollectionTimeTracker {
	getNewRender (entity, i) {
		const comp = BaseComponent.fromObject(entity.data, "*");
		comp._addHookAll("state", () => {
			entity.data = comp.toObject("*");
			this._comp._triggerCollectionUpdate("moons");
		});

		const iptName = ComponentUiUtil.getIptStr(comp, "name", {ele: veT`<input class="ve-form-control ve-input-xs form-control--minimal ve-mr-2">`});
		const iptColor = ComponentUiUtil.getIptColor(comp, "color", {ele: veT`<input class="ve-form-control ve-input-xs form-control--minimal ve-mr-2 ve-no-shrink dm-time__ipt-color-moon" type="color" title="Moon Color">`});
		const iptPhaseOffset = ComponentUiUtil.getIptInt(comp, "phaseOffset", 0, {ele: veT`<input class="ve-form-control ve-input-xs form-control--minimal ve-text-right ve-mr-2 ve-w-25 ve-no-shrink">`});
		const iptPeriod = ComponentUiUtil.getIptInt(comp, "period", 1, {ele: veT`<input class="ve-form-control ve-input-xs form-control--minimal ve-text-right ve-mr-2 ve-w-25 ve-no-shrink">`, min: TimeTrackerBase._MIN_TIME, max: TimeTrackerBase._MAX_TIME});

		const btnRemove = veT`<button class="ve-btn ve-btn-xs ve-btn-danger ve-no-shrink" title="Delete Moon"><span class="glyphicon glyphicon-trash"></span></button>`
			.vee.onn("click", () => this._comp._state.moons = this._comp._state.moons.filter(it => it !== entity));

		const wrpRow = veT`<div class="ve-flex ve-my-1">
			${iptName}
			${iptColor}
			${iptPhaseOffset}
			${iptPeriod}
			${btnRemove}
		</div>`.vee.appendTo(this._wrpRows);

		return {
			comp,
			wrpRow,
		};
	}

	doUpdateExistingRender (renderedMeta, entity, i) {
		renderedMeta.comp._proxyAssignSimple("state", entity.data, true);
		if (!renderedMeta.wrpRow.vee.parent().vee.is(this._wrpRows)) renderedMeta.wrpRow.vee.appendTo(this._wrpRows);
	}
}
