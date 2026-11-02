import { AnimatePresence, motion } from "motion/react";
import { Link } from "@tanstack/react-router";
import {
  canChiDay,
  canChiMonth,
  canChiYear,
  compareSolar,
  formatSolar,
  solarDayOfWeek,
  solarToLunar,
  solarToday,
  type SolarDate,
} from "@lunar/core";
import { scoreDay } from "@lunar/ngay-tot";

import { MoonPhase } from "~/components/moon-phase";
import { Badge } from "~/components/ui/badge";
import { COPY } from "~/lib/copy";
import { chuSuDuocChon } from "~/lib/chu-su";
import { useChuSu } from "~/hooks/use-chu-su";
import { usePrefersLessMotion } from "~/hooks/use-prefers-less-motion";
import { weekdayLong } from "~/lib/labels";
import { memorialColorCss } from "~/lib/memorial-colors";
import { DANH_GIA_LOAI, lyDoChinh } from "~/lib/ngay-tot";
import { cn } from "~/lib/utils";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export interface DayMemorial {
  id: string;
  title: string;
}

export function TodayBloc({
  date,
  compact,
  bare,
  memorials = [],
  className,
}: {
  date?: SolarDate;
  compact?: boolean;
  bare?: boolean;
  memorials?: DayMemorial[];
  className?: string;
}) {
  const today = solarToday();
  const selected = date ?? today;
  const lunar = solarToLunar(selected);
  const { state } = useChuSu();
  const quality = scoreDay(selected, "cat-toc", chuSuDuocChon(state));
  const reason = lyDoChinh(quality);
  const reduce = usePrefersLessMotion();
  const isToday = compareSolar(selected, today) === 0;

  return (
    <div
      className={cn(
        "bloc-paper relative overflow-hidden",
        !bare && "rounded-[28px] border border-[var(--border-warm)] shadow-[var(--shadow-card)]",
        className,
      )}
    >
      <div className="relative flex h-6 items-center justify-center gap-10 bg-[var(--lacquer)]">
        {[0, 1].map((i) => (
          <span
            key={i}
            className="relative h-[9px] w-[9px] rounded-full"
            style={{
              background:
                "radial-gradient(circle at 35% 30%, oklch(0.78 0.02 80), oklch(0.55 0.02 70) 45%, oklch(0.38 0.02 55))",
              boxShadow: "inset 0 1px 1px oklch(1 0 0 / 0.45), 0 1px 1px oklch(0.2 0.02 40 / 0.45)",
            }}
            aria-hidden
          />
        ))}
      </div>
      <div className="relative -mt-px leading-none">
        <svg
          className="block h-3 w-full text-[var(--paper)]"
          viewBox="0 0 400 12"
          preserveAspectRatio="none"
          aria-hidden
        >
          <path
            fill="currentColor"
            d="M0 0 L0 3 L12 7 L22 2 L35 8 L48 3 L61 9 L78 2 L95 6 L110 1 L128 8 L145 3 L160 7 L178 2 L195 9 L212 4 L230 1 L248 8 L265 3 L282 7 L300 2 L318 8 L335 3 L352 6 L370 1 L385 7 L400 3 L400 0 Z"
          />
        </svg>
      </div>

      <div className={cn(bare ? "px-[20px] pb-5" : "px-5 pb-5", compact ? "pt-2" : "pt-3")}>
        <div className={cn("flex items-start justify-between gap-3", bare && "pr-[44px]")}>
          <div>
            <p className="text-[11px] font-semibold tracking-[0.14em] text-[var(--ink-muted)] uppercase">
              {isToday ? COPY.todayControl : COPY.daySelected}
            </p>
            <p className="mt-0.5 text-[14px] text-[var(--ink-muted)]">
              {weekdayLong(solarDayOfWeek(selected))}, {formatSolar(selected)}
            </p>
          </div>
          <MoonPhase lunarDay={lunar.day} size={compact ? 40 : 52} />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={`${selected.year}-${selected.month}-${selected.day}`}
            initial={reduce ? { opacity: 0 } : { rotateX: -70, opacity: 0.4, y: -8 }}
            animate={{ rotateX: 0, opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { rotateX: 40, opacity: 0, y: 12 }}
            transition={{ duration: reduce ? 0.12 : 0.4, ease: EASE }}
            style={{ transformOrigin: "top center", perspective: 800 }}
            className="mt-3 grid grid-cols-2 gap-3"
          >
            <div>
              <p className="text-[12px] text-[var(--ink-muted)]">Dương lịch</p>
              <p className="font-heading text-[72px] leading-none font-bold tracking-tight text-[var(--lacquer)]">
                {selected.day}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[12px] text-[var(--ink-muted)]">Âm lịch</p>
              <p className="font-heading text-[48px] leading-none font-semibold text-[var(--ink)]">
                {lunar.day}
              </p>
              <p className="mt-1 text-[14px] text-[var(--ink-muted)]">
                tháng {lunar.month}
                {lunar.isLeapMonth ? " (nhuận)" : ""}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="mt-4 space-y-1 text-[14px] text-[var(--ink)]">
          <p>
            Năm <span className="font-medium">{canChiYear(lunar.year)}</span>
            {canChiMonth(lunar) && (
              <>
                <span className="text-[var(--ink-muted)]"> · </span>
                Tháng <span className="font-medium">{canChiMonth(lunar)}</span>
              </>
            )}
          </p>
          <p>
            Ngày <span className="font-medium">{canChiDay(selected)}</span>
          </p>
        </div>

        <Link
          to="/ngay-tot-cat-toc"
          className="mt-4 flex flex-wrap items-center gap-2 text-[14px] text-[var(--ink-muted)] underline-offset-4 hover:underline"
        >
          <span>Cắt tóc:</span>
          <Badge className={DANH_GIA_LOAI[quality.danhGia]}>{quality.danhGia}</Badge>
          {reason && <span className="truncate">· {reason.rule}</span>}
        </Link>
        <MemorialsThatDay memorials={memorials} />
      </div>

      {!bare && (
        <>
          <div className="pointer-events-none absolute inset-x-3 -bottom-1.5 -z-10 h-2 rounded-b-[24px] border border-[var(--border-warm)] bg-[color-mix(in_oklch,var(--ink)_6%,var(--paper))]" />
          <div className="pointer-events-none absolute inset-x-5 -bottom-3 -z-20 h-2 rounded-b-[22px] border border-[var(--border-warm)] bg-[color-mix(in_oklch,var(--ink)_4%,var(--paper))] opacity-80" />
        </>
      )}
    </div>
  );
}

function MemorialsThatDay({ memorials }: { memorials: DayMemorial[] }) {
  if (memorials.length === 0) return null;
  return (
    <div className="mt-4 border-t border-[var(--border-warm)] pt-3">
      <p className="mb-2 text-[13px] font-medium">{COPY.memorialsThatDay}</p>
      <ul className="space-y-1.5">
        {memorials.map((memorial) => (
          <li key={memorial.id} className="flex items-center gap-2 text-[14px] text-[var(--ink)]">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ background: memorialColorCss(memorial.id) }}
              aria-hidden
            />
            <span>{memorial.title}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function DayDetail({
  date,
  memorials,
  bare = false,
}: {
  date: SolarDate;
  memorials: DayMemorial[];
  bare?: boolean;
}) {
  const today = solarToday();
  const { state } = useChuSu();
  if (compareSolar(date, today) === 0) {
    return <TodayBloc date={date} bare={bare} memorials={memorials} />;
  }

  const lunar = solarToLunar(date);
  const quality = scoreDay(date, "cat-toc", chuSuDuocChon(state));
  const reason = lyDoChinh(quality);

  const body = (
    <>
      <div className={cn("flex items-start justify-between", bare && "pr-[44px]")}>
        <div>
          <p className="text-[11px] font-semibold tracking-[0.14em] text-[var(--ink-muted)] uppercase">
            {COPY.daySelected}
          </p>
          <p className="mt-0.5 text-[14px] text-[var(--ink-muted)]">
            {weekdayLong(solarDayOfWeek(date))}, {formatSolar(date)}
          </p>
        </div>
        <MoonPhase lunarDay={lunar.day} size={44} />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div>
          <p className="text-[12px] text-[var(--ink-muted)]">Dương lịch</p>
          <p className="font-heading text-5xl leading-none font-bold text-[var(--lacquer)]">
            {date.day}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[12px] text-[var(--ink-muted)]">Âm lịch</p>
          <p className="font-heading text-4xl leading-none font-semibold">{lunar.day}</p>
          <p className="mt-1 text-[14px] text-[var(--ink-muted)]">
            tháng {lunar.month}
            {lunar.isLeapMonth ? " (nhuận)" : ""}
          </p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2 text-[14px]">
        <span className="text-[var(--ink-muted)]">Cắt tóc:</span>
        <Badge className={DANH_GIA_LOAI[quality.danhGia]}>{quality.danhGia}</Badge>
        {reason && <span className="text-[var(--ink-muted)]">· {reason.rule}</span>}
      </div>
      <MemorialsThatDay memorials={memorials} />
    </>
  );

  if (bare) return <div className="px-[20px] pb-6">{body}</div>;

  return <div className="paper-card p-5">{body}</div>;
}
