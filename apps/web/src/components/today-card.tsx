import {
  canChiDay,
  canChiMonth,
  canChiYear,
  solarDayOfWeek,
  solarToLunar,
  solarToday,
} from "@lunar/core";
import { formatSolar } from "@lunar/core";
import { scoreDay } from "@lunar/ngay-tot";
import { Link } from "@tanstack/react-router";
import { BorderBeam } from "~/components/ui/border-beam";
import { Card, CardContent } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { chuSuDuocChon } from "~/lib/chu-su";
import { useChuSu } from "~/hooks/use-chu-su";
import { weekdayLong } from "~/lib/labels";
import { DANH_GIA_LOAI, TIN_NGUONG_DAN_GIAN, lyDoChinh } from "~/lib/ngay-tot";

export function TodayCard() {
  const today = solarToday();
  const lunar = solarToLunar(today);
  const { state } = useChuSu();
  // Always for a việc. The card never says a day is good or bad outright — the
  // label names the activity it was judged for, and links to the full breakdown.
  const quality = scoreDay(today, "cat-toc", chuSuDuocChon(state));
  const reason = lyDoChinh(quality);

  return (
    <Card className="relative">
      <CardContent className="flex flex-col gap-1">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Hôm nay</p>
        <p className="font-heading text-2xl font-semibold">
          {weekdayLong(solarDayOfWeek(today))}, {formatSolar(today)}
        </p>
        <p className="text-sm text-muted-foreground">
          Âm lịch: {lunar.day} tháng {lunar.month}
          {lunar.isLeapMonth ? " (nhuận)" : ""} năm {canChiYear(lunar.year)}
        </p>
        <p className="text-sm text-muted-foreground">
          Ngày {canChiDay(today)}
          {canChiMonth(lunar) && <>, tháng {canChiMonth(lunar)}</>}
        </p>
        <Link
          to="/ngay-tot-cat-toc"
          className="mt-1.5 flex items-center gap-2 text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
        >
          <span>Cắt tóc:</span>
          <Badge className={DANH_GIA_LOAI[quality.danhGia]}>{quality.danhGia}</Badge>
          {reason && <span className="truncate">· {reason.rule}</span>}
        </Link>
        <p className="mt-1 text-xs text-muted-foreground">{TIN_NGUONG_DAN_GIAN}</p>
      </CardContent>
      <BorderBeam size={60} duration={8} />
    </Card>
  );
}
