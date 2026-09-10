import { r as Route } from "./router-8IzMn_pU.js";
import { C as compareSolar, D as solarToJdn, E as solarDayOfWeek, O as solarToday, S as addDays, T as formatSolar, _ as occurrenceInLunarYear, a as CardHeader, b as canChiYear, c as CALENDAR_HEADERS, d as eventRuleLabel, f as lunarLongLabel, g as nextOccurrences, h as weekdayLong, l as daysBetween, m as monthTitle, n as CardAction, o as CardTitle, p as lunarShortLabel, r as CardContent, s as Button, t as Card, v as canChiDay, w as daysInSolarMonth, x as solarToLunar, y as canChiMonth } from "./card-D6B8JYSP.js";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { jsx, jsxs } from "react/jsx-runtime";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon, ArrowRight01Icon, CakeIcon, PlusSignIcon } from "@hugeicons/core-free-icons";
import { cva } from "class-variance-authority";
import { cn, cn as cn$1 } from "cn";
import { motion, useInView, useMotionValue, useSpring } from "motion/react";
import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
//#region src/lib/calendar-grid.ts
/**
* All days of a Monday-first month grid, padded with the neighbouring days of
* adjacent months so the grid always contains whole weeks.
*/
function monthGrid(year, month) {
	const lead = (new Date(Date.UTC(year, month - 1, 1)).getUTCDay() + 6) % 7;
	const total = Math.ceil((lead + daysInSolarMonth(year, month)) / 7) * 7;
	const first = {
		day: 1,
		month,
		year
	};
	return Array.from({ length: total }, (_, i) => {
		const date = addDays(first, i - lead);
		return {
			date,
			inMonth: date.month === month && date.year === year
		};
	});
}
function shiftMonth(year, month, delta) {
	const zero = year * 12 + (month - 1) + delta;
	return {
		year: Math.floor(zero / 12),
		month: zero % 12 + 1
	};
}
//#endregion
//#region src/components/month-calendar.tsx
function MonthCalendar({ events }) {
	const today = useMemo(() => solarToday(), []);
	const [cursor, setCursor] = useState({
		year: today.year,
		month: today.month
	});
	const [selected, setSelected] = useState(today);
	const cells = useMemo(() => monthGrid(cursor.year, cursor.month), [cursor]);
	const lunarByJdn = useMemo(() => {
		const map = /* @__PURE__ */ new Map();
		for (const cell of cells) map.set(solarToJdn(cell.date), solarToLunar(cell.date));
		return map;
	}, [cells]);
	const eventJdns = useMemo(() => {
		const set = /* @__PURE__ */ new Set();
		for (const event of events) {
			const rule = {
				lunarDay: event.lunarDay,
				lunarMonth: event.lunarMonth
			};
			for (let lunarYear = cursor.year - 1; lunarYear <= cursor.year + 1; lunarYear++) {
				const occurrence = occurrenceInLunarYear(rule, lunarYear);
				if (occurrence) set.add(solarToJdn(occurrence));
			}
		}
		return set;
	}, [events, cursor]);
	const selectedLunar = solarToLunar(selected);
	const selectedEvents = events.filter((event) => {
		const rule = {
			lunarDay: event.lunarDay,
			lunarMonth: event.lunarMonth
		};
		for (let lunarYear = selected.year - 1; lunarYear <= selected.year + 1; lunarYear++) {
			const occurrence = occurrenceInLunarYear(rule, lunarYear);
			if (occurrence && compareSolar(occurrence, selected) === 0) return true;
		}
		return false;
	});
	return /* @__PURE__ */ jsxs(Card, { children: [/* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsxs("div", {
		className: "flex flex-wrap items-center justify-between gap-3",
		children: [/* @__PURE__ */ jsx(CardTitle, {
			className: "text-lg",
			children: monthTitle(cursor.year, cursor.month)
		}), /* @__PURE__ */ jsxs("div", {
			className: "flex items-center gap-1",
			children: [
				/* @__PURE__ */ jsx(Button, {
					variant: "ghost",
					size: "icon-sm",
					"aria-label": "Tháng trước",
					onClick: () => setCursor((c) => shiftMonth(c.year, c.month, -1)),
					children: /* @__PURE__ */ jsx(HugeiconsIcon, {
						icon: ArrowLeft01Icon,
						strokeWidth: 2
					})
				}),
				/* @__PURE__ */ jsx(Button, {
					variant: "outline",
					size: "sm",
					onClick: () => {
						setCursor({
							year: today.year,
							month: today.month
						});
						setSelected(today);
					},
					children: "Hôm nay"
				}),
				/* @__PURE__ */ jsx(Button, {
					variant: "ghost",
					size: "icon-sm",
					"aria-label": "Tháng sau",
					onClick: () => setCursor((c) => shiftMonth(c.year, c.month, 1)),
					children: /* @__PURE__ */ jsx(HugeiconsIcon, {
						icon: ArrowRight01Icon,
						strokeWidth: 2
					})
				})
			]
		})]
	}) }), /* @__PURE__ */ jsxs(CardContent, {
		className: "flex flex-col gap-4",
		children: [
			/* @__PURE__ */ jsx("div", {
				className: "grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground",
				children: CALENDAR_HEADERS.map((header) => /* @__PURE__ */ jsx("div", {
					className: "py-1",
					children: header
				}, header))
			}),
			/* @__PURE__ */ jsx("div", {
				className: "grid grid-cols-7 gap-1",
				children: cells.map((cell) => /* @__PURE__ */ jsx(CalendarCellButton, {
					cell,
					lunar: lunarByJdn.get(solarToJdn(cell.date)),
					isToday: compareSolar(cell.date, today) === 0,
					isSelected: compareSolar(cell.date, selected) === 0,
					hasEvent: eventJdns.has(solarToJdn(cell.date)),
					onSelect: () => setSelected(cell.date)
				}, solarToJdn(cell.date)))
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "rounded-xl bg-muted/50 px-4 py-3 text-sm",
				children: [
					/* @__PURE__ */ jsxs("p", {
						className: "font-medium",
						children: [
							weekdayLong(solarDayOfWeek(selected)),
							", ",
							formatSolar(selected)
						]
					}),
					/* @__PURE__ */ jsxs("p", {
						className: "text-muted-foreground",
						children: [
							"Âm lịch: ",
							lunarLongLabel(selectedLunar),
							" — ngày ",
							canChiDay(selected),
							selectedLunar.isLeapMonth ? "" : `, tháng ${canChiMonth(selectedLunar)}`
						]
					}),
					selectedEvents.length > 0 && /* @__PURE__ */ jsx("ul", {
						className: "mt-2 flex flex-col gap-1",
						children: selectedEvents.map((event) => /* @__PURE__ */ jsxs("li", {
							className: "flex items-center gap-1.5 text-foreground",
							children: [/* @__PURE__ */ jsx(HugeiconsIcon, {
								icon: CakeIcon,
								className: "size-4 text-primary",
								strokeWidth: 2
							}), event.title]
						}, event.id))
					})
				]
			})
		]
	})] });
}
function CalendarCellButton({ cell, lunar, isToday, isSelected, hasEvent, onSelect }) {
	const dayOfWeek = solarDayOfWeek(cell.date);
	const isFullMoon = lunar.day === 15;
	const isNewMoon = lunar.day === 1;
	return /* @__PURE__ */ jsxs("button", {
		type: "button",
		onClick: onSelect,
		"aria-pressed": isSelected,
		className: cn$1("relative flex aspect-square flex-col items-center justify-center gap-0.5 rounded-xl px-1 text-sm transition-colors", "hover:bg-muted", !cell.inMonth && "text-muted-foreground/50", dayOfWeek === 0 && cell.inMonth && "text-red-600 dark:text-red-400", isSelected && "bg-primary text-primary-foreground hover:bg-primary/90", isToday && !isSelected && "ring-2 ring-primary ring-inset"),
		children: [
			/* @__PURE__ */ jsx("span", {
				className: cn$1("font-medium", (isNewMoon || isFullMoon) && cell.inMonth && !isSelected && "text-primary"),
				children: cell.date.day
			}),
			/* @__PURE__ */ jsx("span", {
				className: cn$1("text-[10px] leading-none", isSelected ? "text-primary-foreground/80" : "text-muted-foreground"),
				children: lunar.day === 1 ? lunarShortLabel(lunar) : lunar.day
			}),
			hasEvent && /* @__PURE__ */ jsx("span", { className: cn$1("absolute bottom-1 size-1.5 rounded-full", isSelected ? "bg-primary-foreground" : "bg-primary") })
		]
	});
}
//#endregion
//#region src/components/ui/border-beam.tsx
var BorderBeam = ({ className, size = 50, delay = 0, duration = 6, colorFrom = "#ffaa40", colorTo = "#9c40ff", transition, style, reverse = false, initialOffset = 0, borderWidth = 1 }) => {
	return /* @__PURE__ */ jsx("div", {
		className: "pointer-events-none absolute inset-0 rounded-[inherit] border-(length:--border-beam-width) border-transparent mask-[linear-gradient(transparent,transparent),linear-gradient(#000,#000)] mask-intersect [mask-clip:padding-box,border-box]",
		style: { "--border-beam-width": `${borderWidth}px` },
		children: /* @__PURE__ */ jsx(motion.div, {
			className: cn$1("absolute aspect-square", "bg-linear-to-l from-(--color-from) via-(--color-to) to-transparent", className),
			style: {
				width: size,
				offsetPath: `rect(0 auto auto 0 round ${size}px)`,
				"--color-from": colorFrom,
				"--color-to": colorTo,
				...style
			},
			initial: { offsetDistance: `${initialOffset}%` },
			animate: { offsetDistance: reverse ? [`${100 - initialOffset}%`, `${-initialOffset}%`] : [`${initialOffset}%`, `${100 + initialOffset}%`] },
			transition: {
				repeat: Infinity,
				ease: "linear",
				duration,
				delay: -delay,
				...transition
			}
		})
	});
};
//#endregion
//#region src/components/today-card.tsx
function TodayCard() {
	const today = solarToday();
	const lunar = solarToLunar(today);
	return /* @__PURE__ */ jsxs(Card, {
		className: "relative",
		children: [/* @__PURE__ */ jsxs(CardContent, {
			className: "flex flex-col gap-1",
			children: [
				/* @__PURE__ */ jsx("p", {
					className: "text-xs font-medium tracking-wide text-muted-foreground uppercase",
					children: "Hôm nay"
				}),
				/* @__PURE__ */ jsxs("p", {
					className: "font-heading text-2xl font-semibold",
					children: [
						weekdayLong(solarDayOfWeek(today)),
						", ",
						formatSolar(today)
					]
				}),
				/* @__PURE__ */ jsxs("p", {
					className: "text-sm text-muted-foreground",
					children: [
						"Âm lịch: ",
						lunar.day,
						" tháng ",
						lunar.month,
						lunar.isLeapMonth ? " (nhuận)" : "",
						" năm ",
						canChiYear(lunar.year)
					]
				}),
				/* @__PURE__ */ jsxs("p", {
					className: "text-sm text-muted-foreground",
					children: [
						"Ngày ",
						canChiDay(today),
						" — tháng ",
						canChiMonth(lunar)
					]
				})
			]
		}), /* @__PURE__ */ jsx(BorderBeam, {
			size: 60,
			duration: 8
		})]
	});
}
//#endregion
//#region src/components/ui/number-ticker.tsx
function NumberTicker({ value, startValue = 0, direction = "up", delay = 0, className, decimalPlaces = 0, ...props }) {
	const ref = useRef(null);
	const motionValue = useMotionValue(direction === "down" ? value : startValue);
	const springValue = useSpring(motionValue, {
		damping: 60,
		stiffness: 100
	});
	const isInView = useInView(ref, {
		once: true,
		margin: "0px"
	});
	useEffect(() => {
		let timer = null;
		if (isInView) timer = setTimeout(() => {
			motionValue.set(direction === "down" ? startValue : value);
		}, delay * 1e3);
		return () => {
			if (timer !== null) clearTimeout(timer);
		};
	}, [
		motionValue,
		isInView,
		delay,
		value,
		direction,
		startValue
	]);
	useEffect(() => springValue.on("change", (latest) => {
		if (ref.current) ref.current.textContent = Intl.NumberFormat("en-US", {
			minimumFractionDigits: decimalPlaces,
			maximumFractionDigits: decimalPlaces
		}).format(Number(latest.toFixed(decimalPlaces)));
	}), [springValue, decimalPlaces]);
	return /* @__PURE__ */ jsx("span", {
		ref,
		className: cn$1("inline-block tracking-wider text-black tabular-nums dark:text-white", className),
		...props,
		children: startValue
	});
}
//#endregion
//#region src/components/ui/badge.tsx
var badgeVariants = cva("group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-4xl border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3!", {
	variants: { variant: {
		default: "bg-primary text-primary-foreground [a]:hover:bg-primary/80",
		secondary: "bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80",
		destructive: "bg-destructive/10 text-destructive focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:focus-visible:ring-destructive/40 [a]:hover:bg-destructive/20",
		outline: "border-border bg-input/30 text-foreground [a]:hover:bg-muted [a]:hover:text-muted-foreground",
		ghost: "hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50",
		link: "text-primary underline-offset-4 hover:underline"
	} },
	defaultVariants: { variant: "default" }
});
function Badge({ className, variant = "default", render, ...props }) {
	return useRender({
		defaultTagName: "span",
		props: mergeProps({ className: cn(badgeVariants({ variant }), className) }, props),
		render,
		state: {
			slot: "badge",
			variant
		}
	});
}
//#endregion
//#region src/components/upcoming-events.tsx
function UpcomingEvents({ events, count = 5 }) {
	const today = solarToday();
	const upcoming = events.map((event) => {
		const [next] = nextOccurrences({
			lunarDay: event.lunarDay,
			lunarMonth: event.lunarMonth
		}, today, 1);
		return next ? {
			event,
			date: next
		} : null;
	}).filter((item) => item !== null).sort((a, b) => solarToJdn(a.date) - solarToJdn(b.date)).slice(0, count);
	return /* @__PURE__ */ jsxs(Card, { children: [/* @__PURE__ */ jsxs(CardHeader, { children: [/* @__PURE__ */ jsx(CardTitle, { children: "Sắp tới" }), /* @__PURE__ */ jsx(CardAction, { children: /* @__PURE__ */ jsxs(Button, {
		render: /* @__PURE__ */ jsx(Link, { to: "/su-kien" }),
		size: "sm",
		variant: "ghost",
		children: [/* @__PURE__ */ jsx(HugeiconsIcon, {
			icon: PlusSignIcon,
			strokeWidth: 2,
			"data-icon": "inline-start"
		}), "Thêm"]
	}) })] }), /* @__PURE__ */ jsxs(CardContent, {
		className: "flex flex-col gap-3",
		children: [upcoming.length === 0 && /* @__PURE__ */ jsx("p", {
			className: "text-sm text-muted-foreground",
			children: "Chưa có sự kiện nào. Hãy thêm ngày giỗ đầu tiên của gia đình bạn."
		}), upcoming.map(({ event, date }) => {
			const days = daysBetween(today, date);
			return /* @__PURE__ */ jsxs("div", {
				className: "flex items-start justify-between gap-3",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "flex min-w-0 flex-col",
					children: [/* @__PURE__ */ jsxs("span", {
						className: "flex items-center gap-1.5 truncate text-sm font-medium",
						children: [/* @__PURE__ */ jsx(HugeiconsIcon, {
							icon: CakeIcon,
							className: "size-4 shrink-0 text-primary",
							strokeWidth: 2
						}), event.title]
					}), /* @__PURE__ */ jsxs("span", {
						className: "text-xs text-muted-foreground",
						children: [
							eventRuleLabel(event),
							" — ",
							formatSolar(date)
						]
					})]
				}), days === 0 ? /* @__PURE__ */ jsx(Badge, { children: "Hôm nay" }) : /* @__PURE__ */ jsxs("span", {
					className: "flex shrink-0 items-baseline gap-1 text-xs text-muted-foreground",
					children: [
						"Còn",
						/* @__PURE__ */ jsx(NumberTicker, {
							value: days,
							className: "text-sm font-semibold text-foreground tabular-nums"
						}),
						"ngày"
					]
				})]
			}, event.id);
		})]
	})] });
}
//#endregion
//#region src/routes/index.tsx?tsr-split=component
function HomePage() {
	const events = Route.useLoaderData();
	return /* @__PURE__ */ jsx("main", {
		className: "mx-auto w-full max-w-6xl flex-1 px-4 py-6 lg:px-6",
		children: /* @__PURE__ */ jsxs("div", {
			className: "grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]",
			children: [/* @__PURE__ */ jsx(MonthCalendar, { events }), /* @__PURE__ */ jsxs("aside", {
				className: "flex flex-col gap-6",
				children: [/* @__PURE__ */ jsx(TodayCard, {}), /* @__PURE__ */ jsx(UpcomingEvents, { events })]
			})]
		})
	});
}
//#endregion
export { HomePage as component };
