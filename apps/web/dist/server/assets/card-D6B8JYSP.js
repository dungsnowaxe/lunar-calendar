import "react";
import { jsx } from "react/jsx-runtime";
import { Button } from "@base-ui/react/button";
import { cva } from "class-variance-authority";
import { cn } from "cn";
//#region ../../packages/lunar/src/hnd.ts
var PI = Math.PI;
/** The Vietnamese calendar runs on Indochina Time (UTC+7). */
var TIMEZONE = 7;
/** Discard the fractional part of a number, e.g., INT(3.2) = 3 */
function INT(d) {
	return Math.floor(d);
}
/**
* Compute the (integral) Julian day number of day dd/mm/yyyy, i.e., the number
* of days between 1/1/4713 BC (Julian calendar) and dd/mm/yyyy.
* Formula from http://www.tondering.dk/claus/calendar.html
*/
function jdFromDate(dd, mm, yy) {
	let jd;
	const a = INT((14 - mm) / 12);
	const y = yy + 4800 - a;
	const m = mm + 12 * a - 3;
	jd = dd + INT((153 * m + 2) / 5) + 365 * y + INT(y / 4) - INT(y / 100) + INT(y / 400) - 32045;
	if (jd < 2299161) jd = dd + INT((153 * m + 2) / 5) + 365 * y + INT(y / 4) - 32083;
	return jd;
}
/** Convert a Julian day number to day/month/year. Parameter jd is an integer */
function jdToDate(jd) {
	let a;
	let b;
	let c;
	if (jd > 2299160) {
		a = jd + 32044;
		b = INT((4 * a + 3) / 146097);
		c = a - INT(b * 146097 / 4);
	} else {
		b = 0;
		c = jd + 32082;
	}
	const d = INT((4 * c + 3) / 1461);
	const e = c - INT(1461 * d / 4);
	const m = INT((5 * e + 2) / 153);
	return [
		e - INT((153 * m + 2) / 5) + 1,
		m + 3 - 12 * INT(m / 10),
		b * 100 + d - 4800 + INT(m / 10)
	];
}
/**
* Compute the time of the k-th new moon after the new moon of 1/1/1900 13:52 UCT
* (measured as the number of days since 1/1/4713 BC noon UCT, e.g., 2451545.125 is 1/1/2000 15:00 UTC).
* Returns a floating number, e.g., 2415079.9758617813 for k=2 or 2414961.935157746 for k=-2
* Algorithm from: "Astronomical Algorithms" by Jean Meeus, 1998
*/
function NewMoon(k) {
	const T = k / 1236.85;
	const T2 = T * T;
	const T3 = T2 * T;
	const dr = PI / 180;
	let Jd1 = 2415020.75933 + 29.53058868 * k + 1178e-7 * T2 - 155e-9 * T3;
	Jd1 = Jd1 + 33e-5 * Math.sin((166.56 + 132.87 * T - .009173 * T2) * dr);
	const M = 359.2242 + 29.10535608 * k - 333e-7 * T2 - 347e-8 * T3;
	const Mpr = 306.0253 + 385.81691806 * k + .0107306 * T2 + 1236e-8 * T3;
	const F = 21.2964 + 390.67050646 * k - .0016528 * T2 - 239e-8 * T3;
	let C1 = (.1734 - 393e-6 * T) * Math.sin(M * dr) + .0021 * Math.sin(2 * dr * M);
	C1 = C1 - .4068 * Math.sin(Mpr * dr) + .0161 * Math.sin(dr * 2 * Mpr);
	C1 = C1 - 4e-4 * Math.sin(dr * 3 * Mpr);
	C1 = C1 + .0104 * Math.sin(dr * 2 * F) - .0051 * Math.sin(dr * (M + Mpr));
	C1 = C1 - .0074 * Math.sin(dr * (M - Mpr)) + 4e-4 * Math.sin(dr * (2 * F + M));
	C1 = C1 - 4e-4 * Math.sin(dr * (2 * F - M)) - 6e-4 * Math.sin(dr * (2 * F + Mpr));
	C1 = C1 + .001 * Math.sin(dr * (2 * F - Mpr)) + 5e-4 * Math.sin(dr * (2 * Mpr + M));
	let deltat;
	if (T < -11) deltat = .001 + 839e-6 * T + 2261e-7 * T2 - 845e-8 * T3 - 81e-9 * T * T3;
	else deltat = -278e-6 + 265e-6 * T + 262e-6 * T2;
	return Jd1 + C1 - deltat;
}
/**
* Compute the longitude of the sun at any time.
* Parameter: floating number jdn, the number of days since 1/1/4713 BC noon
* Algorithm from: "Astronomical Algorithms" by Jean Meeus, 1998
*/
function SunLongitude(jdn) {
	const T = (jdn - 2451545) / 36525;
	const T2 = T * T;
	const dr = PI / 180;
	const M = 357.5291 + 35999.0503 * T - 1559e-7 * T2 - 48e-8 * T * T2;
	const L0 = 280.46645 + 36000.76983 * T + 3032e-7 * T2;
	let DL = (1.9146 - .004817 * T - 14e-6 * T2) * Math.sin(dr * M);
	DL = DL + (.019993 - 101e-6 * T) * Math.sin(dr * 2 * M) + 29e-5 * Math.sin(dr * 3 * M);
	let L = L0 + DL;
	L = L * dr;
	L = L - PI * 2 * INT(L / (PI * 2));
	return L;
}
/**
* Compute sun position at midnight of the day with the given Julian day number.
* The time zone is the time difference between local time and UTC: 7.0 for UTC+7:00.
* The function returns a number between 0 and 11.
* From the day after March equinox and the 1st major term after March equinox, 0 is returned.
* After that, return 1, 2, 3 ...
*/
function getSunLongitude(dayNumber) {
	return INT(SunLongitude(dayNumber - .5 - TIMEZONE / 24) / PI * 6);
}
/** Compute the day of the k-th new moon in the local (UTC+7) time zone. */
function getNewMoonDay(k) {
	return INT(NewMoon(k) + .5 + TIMEZONE / 24);
}
/** Find the day that starts the lunar month 11 of the given solar year. */
function getLunarMonth11(yy) {
	const k = INT((jdFromDate(31, 12, yy) - 2415021) / 29.530588853);
	let nm = getNewMoonDay(k);
	if (getSunLongitude(nm) >= 9) nm = getNewMoonDay(k - 1);
	return nm;
}
/** Find the index of the leap month after the month starting on the day a11. */
function getLeapMonthOffset(a11) {
	const k = INT((a11 - 2415021.076998695) / 29.530588853 + .5);
	let last = 0;
	let i = 1;
	let arc = getSunLongitude(getNewMoonDay(k + i));
	do {
		last = arc;
		i++;
		arc = getSunLongitude(getNewMoonDay(k + i));
	} while (arc !== last && i < 14);
	return i - 1;
}
/**
* Convert a Julian day number to the lunar day/month/year it starts, in the
* Vietnamese calendar. `lunarLeap` is 1 when the lunar month is a leap month.
*/
function jdToLunar(jd) {
	const k = INT((jd - 2415021.076998695) / 29.530588853);
	let monthStart = getNewMoonDay(k + 1);
	if (monthStart > jd) monthStart = getNewMoonDay(k);
	let a11 = getLunarMonth11(jdToDate(jd)[2]);
	let b11 = a11;
	let lunarYear;
	if (a11 >= monthStart) {
		lunarYear = jdToDate(jd)[2];
		a11 = getLunarMonth11(lunarYear - 1);
	} else {
		lunarYear = jdToDate(jd)[2] + 1;
		b11 = getLunarMonth11(lunarYear);
	}
	const lunarDay = jd - monthStart + 1;
	const diff = INT((monthStart - a11) / 29);
	let lunarLeap = 0;
	let lunarMonth = diff + 11;
	if (b11 - a11 > 365) {
		const leapMonthDiff = getLeapMonthOffset(a11);
		if (diff >= leapMonthDiff) {
			lunarMonth = diff + 10;
			if (diff === leapMonthDiff) lunarLeap = 1;
		}
	}
	if (lunarMonth > 12) lunarMonth = lunarMonth - 12;
	if (lunarMonth >= 11 && diff < 4) lunarYear -= 1;
	return {
		day: lunarDay,
		month: lunarMonth,
		year: lunarYear,
		leap: lunarLeap
	};
}
/**
* Convert a lunar date to the Julian day number of the solar day that starts it.
* Returns null when the requested lunar date does not exist (e.g. day 30 of a
* 29-day month, or a leap month the year does not have).
*/
function lunarToJd(lunarDay, lunarMonth, lunarYear, lunarLeap) {
	let a11;
	let b11;
	if (lunarMonth < 11) {
		a11 = getLunarMonth11(lunarYear - 1);
		b11 = getLunarMonth11(lunarYear);
	} else {
		a11 = getLunarMonth11(lunarYear);
		b11 = getLunarMonth11(lunarYear + 1);
	}
	const k = INT(.5 + (a11 - 2415021.076998695) / 29.530588853);
	let off = lunarMonth - 11;
	if (off < 0) off += 12;
	if (b11 - a11 > 365) {
		const leapOff = getLeapMonthOffset(a11);
		let leapMonth = leapOff - 2;
		if (leapMonth < 0) leapMonth += 12;
		if (lunarLeap !== 0 && lunarMonth !== leapMonth) return null;
		else if (lunarLeap !== 0 || off >= leapOff) off += 1;
	}
	return getNewMoonDay(k + off) + lunarDay - 1;
}
//#endregion
//#region ../../packages/lunar/src/solar.ts
/** Timezone constant for all user-facing date computation. */
var VIETNAM_TIMEZONE = "Asia/Ho_Chi_Minh";
function pad2(n) {
	return String(n).padStart(2, "0");
}
/** Today's date in Vietnam, regardless of the machine's timezone. */
function solarToday(now = /* @__PURE__ */ new Date()) {
	const parts = new Intl.DateTimeFormat("en-CA", {
		timeZone: VIETNAM_TIMEZONE,
		year: "numeric",
		month: "2-digit",
		day: "2-digit"
	}).formatToParts(now);
	const get = (type) => Number(parts.find((p) => p.type === type)?.value);
	return {
		year: get("year"),
		month: get("month"),
		day: get("day")
	};
}
function solarToJdn(s) {
	return jdFromDate(s.day, s.month, s.year);
}
function jdnToSolar(jdn) {
	const [day, month, year] = jdToDate(jdn);
	return {
		day,
		month,
		year
	};
}
function addDays(s, days) {
	return jdnToSolar(solarToJdn(s) + days);
}
/** Negative when a < b, 0 when equal, positive when a > b. */
function compareSolar(a, b) {
	return solarToJdn(a) - solarToJdn(b);
}
function daysInSolarMonth(year, month) {
	return new Date(Date.UTC(year, month, 0)).getUTCDate();
}
/** 0 = Chủ nhật, 1 = Thứ hai, … 6 = Thứ bảy (same numbering as Date#getDay). */
function solarDayOfWeek(s) {
	return (solarToJdn(s) + 1) % 7;
}
function formatSolar(s) {
	return `${pad2(s.day)}/${pad2(s.month)}/${s.year}`;
}
//#endregion
//#region ../../packages/lunar/src/lunar.ts
var CAN = [
	"Giáp",
	"Ất",
	"Bính",
	"Đinh",
	"Mậu",
	"Kỷ",
	"Canh",
	"Tân",
	"Nhâm",
	"Quý"
];
var CHI = [
	"Tý",
	"Sửu",
	"Dần",
	"Mão",
	"Thìn",
	"Tỵ",
	"Ngọ",
	"Mùi",
	"Thân",
	"Dậu",
	"Tuất",
	"Hợi"
];
/** Number of days (29 or 30) in a lunar month; 0 when the month does not exist. */
function lunarMonthLength(lunarYear, month, isLeapMonth) {
	const start = lunarToJd(1, month, lunarYear, isLeapMonth ? 1 : 0);
	if (start === null) return 0;
	const check = jdToLunar(start);
	if (check.month !== month || check.year !== lunarYear || check.leap === 1 !== isLeapMonth) return 0;
	return jdToLunar(start + 29).day === 1 ? 29 : 30;
}
function solarToLunar(s) {
	const l = jdToLunar(solarToJdn(s));
	return {
		day: l.day,
		month: l.month,
		year: l.year,
		isLeapMonth: l.leap === 1
	};
}
/** The solar date a lunar date falls on, or null when it does not exist. */
function lunarToSolar(l) {
	if (!Number.isInteger(l.day) || !Number.isInteger(l.month) || !Number.isInteger(l.year) || l.day < 1 || l.day > 30 || l.month < 1 || l.month > 12) return null;
	const jd = lunarToJd(l.day, l.month, l.year, l.isLeapMonth ? 1 : 0);
	if (jd === null) return null;
	const check = jdToLunar(jd);
	if (check.day !== l.day || check.month !== l.month || check.year !== l.year || check.leap === 1 !== l.isLeapMonth) return null;
	return jdnToSolar(jd);
}
/** Can chi (Giáp Tý…) of a lunar year, e.g. 2026 → "Bính Ngọ". */
function canChiYear(lunarYear) {
	return `${CAN[(lunarYear + 6) % 10]} ${CHI[(lunarYear + 8) % 12]}`;
}
/** Can chi of a solar day, e.g. 17/02/2026 → "Bính Dần". */
function canChiDay(s) {
	const jd = solarToJdn(s);
	return `${CAN[(jd + 9) % 10]} ${CHI[(jd + 1) % 12]}`;
}
/**
* Can chi of a lunar month. Leap months have no can chi in the Vietnamese
* tradition, so null is returned for them.
*/
function canChiMonth(l) {
	if (l.isLeapMonth) return null;
	const monthCan = (l.year + 6) % 10 * 2 + l.month + 1;
	const monthChi = (l.month + 1) % 12;
	return `${CAN[monthCan % 10]} ${CHI[monthChi]}`;
}
//#endregion
//#region ../../packages/lunar/src/occurrences.ts
/**
* The solar date the rule falls on in a given lunar year, or null when the
* month does not exist. Occurrences always follow the regular month
* (tháng thường) — the traditional convention for ngày giỗ — even in lunar
* years that also have a leap occurrence (tháng nhuận) of that month. A day 30
* in a 29-day month is observed on the last day of the month (quy ước: giỗ
* vào ngày cuối cùng của tháng thiếu).
*/
function occurrenceInLunarYear(rule, lunarYear) {
	const length = lunarMonthLength(lunarYear, rule.lunarMonth, false);
	if (length === 0) return null;
	return lunarToSolar({
		day: Math.min(rule.lunarDay, length),
		month: rule.lunarMonth,
		year: lunarYear,
		isLeapMonth: false
	});
}
/**
* The next `count` occurrences (today included) of the rule at or after `from`,
* in ascending order. Occurrences are generated per lunar year, so an event in
* lunar month 12 correctly lands in early solar year N+1.
*/
function nextOccurrences(rule, from, count) {
	const results = [];
	if (!Number.isInteger(count) || count < 1) return results;
	let lunarYear = solarToLunar(from).year;
	const lastLunarYear = from.year + 5;
	while (results.length < Math.min(count, 12) && lunarYear <= lastLunarYear) {
		const occurrence = occurrenceInLunarYear(rule, lunarYear);
		if (occurrence && compareSolar(occurrence, from) >= 0) results.push(occurrence);
		lunarYear++;
	}
	return results;
}
//#endregion
//#region src/lib/labels.ts
/** Monday-first calendar column headers. */
var CALENDAR_HEADERS = [
	"T2",
	"T3",
	"T4",
	"T5",
	"T6",
	"T7",
	"CN"
];
var WEEKDAY_LONG = [
	"Chủ nhật",
	"Thứ hai",
	"Thứ ba",
	"Thứ tư",
	"Thứ năm",
	"Thứ sáu",
	"Thứ bảy"
];
function weekdayLong(dayOfWeek) {
	return WEEKDAY_LONG[dayOfWeek] ?? "";
}
function monthTitle(year, month) {
	return `Tháng ${month} năm ${year}`;
}
/** Short lunar label for calendar cells, e.g. "1/7" or "1/7N" (nhuận). */
function lunarShortLabel(l) {
	return `${l.day}/${l.month}${l.isLeapMonth ? "N" : ""}`;
}
/** Long lunar label, e.g. "10 tháng 3 năm Bính Ngọ". */
function lunarLongLabel(l) {
	const leap = l.isLeapMonth ? " (nhuận)" : "";
	return `${l.day} tháng ${l.month}${leap} năm ${canChiYear(l.year)}`;
}
/** "Ngày 10 tháng 3 (âm lịch)" — the stored rule of an event. */
function eventRuleLabel(e) {
	return `Ngày ${e.lunarDay} tháng ${e.lunarMonth} (âm lịch)`;
}
function daysBetween(from, to) {
	return solarToJdn(to) - solarToJdn(from);
}
function daysUntilLabel(days) {
	if (days <= 0) return "Hôm nay";
	if (days === 1) return "Ngày mai";
	return `Còn ${days} ngày`;
}
//#endregion
//#region src/components/ui/button.tsx
var buttonVariants = cva("group/button inline-flex shrink-0 items-center justify-center rounded-4xl border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4", {
	variants: {
		variant: {
			default: "bg-primary text-primary-foreground hover:bg-primary/80",
			outline: "border-border bg-input/30 hover:bg-input/50 hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground",
			secondary: "bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)] aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
			ghost: "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",
			destructive: "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
			link: "text-primary underline-offset-4 hover:underline"
		},
		size: {
			default: "h-9 gap-1.5 px-3 has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5",
			xs: "h-6 gap-1 px-2.5 text-xs has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3",
			sm: "h-8 gap-1 px-3 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
			lg: "h-10 gap-1.5 px-4 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
			icon: "size-9",
			"icon-xs": "size-6 [&_svg:not([class*='size-'])]:size-3",
			"icon-sm": "size-8",
			"icon-lg": "size-10"
		}
	},
	defaultVariants: {
		variant: "default",
		size: "default"
	}
});
function Button$1({ className, variant = "default", size = "default", ...props }) {
	return /* @__PURE__ */ jsx(Button, {
		"data-slot": "button",
		className: cn(buttonVariants({
			variant,
			size,
			className
		})),
		...props
	});
}
//#endregion
//#region src/components/ui/card.tsx
function Card({ className, size = "default", ...props }) {
	return /* @__PURE__ */ jsx("div", {
		"data-slot": "card",
		"data-size": size,
		className: cn("group/card flex flex-col gap-(--card-spacing) overflow-hidden rounded-2xl bg-card py-(--card-spacing) text-sm text-card-foreground ring-1 ring-foreground/10 [--card-spacing:--spacing(6)] has-[>img:first-child]:pt-0 data-[size=sm]:[--card-spacing:--spacing(4)] *:[img:first-child]:rounded-t-xl *:[img:last-child]:rounded-b-xl", className),
		...props
	});
}
function CardHeader({ className, ...props }) {
	return /* @__PURE__ */ jsx("div", {
		"data-slot": "card-header",
		className: cn("group/card-header @container/card-header grid auto-rows-min items-start gap-2 rounded-t-xl px-(--card-spacing) has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto] [.border-b]:pb-(--card-spacing)", className),
		...props
	});
}
function CardTitle({ className, ...props }) {
	return /* @__PURE__ */ jsx("div", {
		"data-slot": "card-title",
		className: cn("font-heading text-base font-medium", className),
		...props
	});
}
function CardDescription({ className, ...props }) {
	return /* @__PURE__ */ jsx("div", {
		"data-slot": "card-description",
		className: cn("text-sm text-muted-foreground", className),
		...props
	});
}
function CardAction({ className, ...props }) {
	return /* @__PURE__ */ jsx("div", {
		"data-slot": "card-action",
		className: cn("col-start-2 row-span-2 row-start-1 self-start justify-self-end", className),
		...props
	});
}
function CardContent({ className, ...props }) {
	return /* @__PURE__ */ jsx("div", {
		"data-slot": "card-content",
		className: cn("px-(--card-spacing)", className),
		...props
	});
}
//#endregion
export { compareSolar as C, solarToJdn as D, solarDayOfWeek as E, solarToday as O, addDays as S, formatSolar as T, occurrenceInLunarYear as _, CardHeader as a, canChiYear as b, CALENDAR_HEADERS as c, eventRuleLabel as d, lunarLongLabel as f, nextOccurrences as g, weekdayLong as h, CardDescription as i, daysBetween as l, monthTitle as m, CardAction as n, CardTitle as o, lunarShortLabel as p, CardContent as r, Button$1 as s, Card as t, daysUntilLabel as u, canChiDay as v, daysInSolarMonth as w, solarToLunar as x, canChiMonth as y };
