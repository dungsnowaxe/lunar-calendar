import {
  canChiDay,
  canChiMonth,
  canChiYear,
  formatSolar,
  solarDayOfWeek,
  solarToLunar,
  tietKhiOf,
  trucNhatOf,
  trucOf,
  tuOf,
} from "@lunar/core";
import { VIEC_LABEL, type DayQuality } from "@lunar/ngay-tot";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";
import { lunarLongLabel, weekdayLong } from "~/lib/labels";
import { DANH_GIA_LOAI, TIN_NGUONG_DAN_GIAN, deltaLabel } from "~/lib/ngay-tot";

/**
 * One day's full breakdown.
 *
 * The two sections are deliberately kept apart, because they are two different
 * kinds of claim:
 *
 * - **Ngày này** is computed — lunar date, Can–Chi, tiết khí, trực, tú, trực
 *   nhật. The app stands behind these as arithmetic and they are stated flatly,
 *   with no hedging and no favourability language. Which deity presides is a
 *   fact here; whether it is hoàng đạo is not, and that judgement appears only
 *   below as a weighted row.
 * - **Điểm cho việc…** is recorded tradition. It is always qualified by the việc,
 *   always shows every line that went into it, and remains clearly qualified
 *   as folk belief.
 *
 * Mixing the two would let a belief-derived label read as a computed fact, which
 * is the one thing the whole design is built to avoid.
 */
export function NgayChatLuong({ quality }: { quality: DayQuality }) {
  const { date } = quality;
  const lunar = solarToLunar(date);
  const tu = tuOf(date);
  const thangChi = canChiMonth(lunar);
  const viec = VIEC_LABEL[quality.viec];

  const computed: [string, string][] = [
    ["Âm lịch", lunarLongLabel(lunar)],
    ["Ngày Can–Chi", canChiDay(date)],
    ["Tháng Can–Chi", thangChi ?? "—"],
    ["Năm Can–Chi", canChiYear(lunar.year)],
    ["Tiết khí", tietKhiOf(date)],
    ["Trực", trucOf(date)],
    ["Nhị thập bát tú", `${tu.name} · ${tu.hanh}`],
    ["Trực nhật", trucNhatOf(date)],
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {weekdayLong(solarDayOfWeek(date))}, {formatSolar(date)}
        </CardTitle>
        <CardDescription>
          {lunar.day} tháng {lunar.month}
          {lunar.isLeapMonth ? " nhuận" : ""} âm lịch
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <section aria-label="Ngày này" className="flex flex-col gap-2">
          <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Ngày này
          </h3>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
            {computed.map(([term, value]) => (
              <div key={term} className="contents">
                <dt className="text-muted-foreground">{term}</dt>
                <dd className="text-right font-medium">{value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <Separator />

        <section aria-label={`Điểm cho việc ${viec}`} className="flex flex-col gap-3">
          <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Điểm cho việc {viec}
          </h3>

          <div className="flex items-center gap-3">
            <span className="font-heading text-3xl font-semibold tabular-nums">
              {quality.score}
            </span>
            <Badge className={DANH_GIA_LOAI[quality.danhGia]}>{quality.danhGia}</Badge>
          </div>

          {quality.clamped && (
            <p className="text-sm text-muted-foreground">
              Tổng các dòng là {quality.rawScore}, ngoài khoảng 0–100 nên điểm hiển thị được giới
              hạn lại.
            </p>
          )}

          <ul className="flex flex-col gap-3">
            {quality.contributions.map((c) => (
              <li
                key={c.rule}
                className={
                  c.divergence
                    ? "border-l-2 border-amber-500/60 pl-3"
                    : "border-l-2 border-transparent pl-3"
                }
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-sm font-medium">{c.rule}</span>
                  <span
                    className={`text-sm font-medium tabular-nums ${
                      c.delta > 0 ? "text-green-600 dark:text-green-400" : ""
                    } ${c.delta < 0 ? "text-red-600 dark:text-red-400" : ""}`}
                  >
                    {deltaLabel(c.delta)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{c.explanation}</p>
                {c.divergence && (
                  <Badge
                    variant="outline"
                    className="mt-1.5 border-amber-500/50 text-amber-700 dark:text-amber-400"
                  >
                    Khác với nguồn tham chiếu
                  </Badge>
                )}
              </li>
            ))}
          </ul>

          {/* Left visible on purpose: every line above, the baseline included,
              adds up to this number, and to the score when nothing is clamped. */}
          <div className="flex items-baseline justify-between gap-3 border-t border-border/60 pt-2 text-sm">
            <span className="text-muted-foreground">Tổng các dòng</span>
            <span className="font-medium tabular-nums">{quality.rawScore}</span>
          </div>

          <p className="text-sm text-muted-foreground">{TIN_NGUONG_DAN_GIAN}</p>
        </section>
      </CardContent>
    </Card>
  );
}
