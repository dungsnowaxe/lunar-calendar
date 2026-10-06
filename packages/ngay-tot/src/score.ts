import { canChiDay, trucNhatOf, trucOf, tuOf, type SolarDate } from "@lunar/core";
import {
  CANON_CITATION,
  DIVERGENCE_CITATION,
  NGAY_KY_JUSTIFICATION,
  XUNG_TUOI_JUSTIFICATION,
} from "./canon.ts";
import { laXungTuoi, tuoiXungCuaNgay } from "./chu-su.ts";
import {
  KHUNG_GIO_BAT_DAU,
  KHUNG_GIO_KET_THUC,
  gioHoangDaoTrongKhung,
  isNgayHoangDao,
} from "./hoang-dao.ts";
import { rulesTrongNgay } from "./rules.ts";
import { VIEC_LABEL, type ChuSu, type Contribution, type DayQuality, type Viec } from "./types.ts";
import {
  DIEM_CAO_NHAT,
  DIEM_CO_SO,
  DIEM_THAP_NHAT,
  QUY_TAC_DIEM_CO_SO,
  WEIGHT_TABLES,
  danhGiaOf,
} from "./weights.ts";

/** How a weight reads in prose, so no layer has to hardcode a verdict. */
function moTa(delta: number, label: string): string {
  if (delta > 0) return `thuận cho việc ${label}`;
  if (delta < 0) return `kỵ việc ${label}`;
  return `trung tính với việc ${label}`;
}

/**
 * Score a date for a việc, optionally for a chosen chủ sự.
 *
 * The kernel is the same for every việc: it looks the việc up in `WEIGHT_TABLES`
 * and applies the six canonical layers plus our recorded divergences. There is
 * no `if` over việc names anywhere in this function, which is what makes adding
 * an activity a data change.
 *
 * Layers are applied in the order the reference canon lists them, so a breakdown
 * reads the same way its source does: trực nhật, thập nhị trực, nhị thập bát tú,
 * sao tháng, ngày kỵ cố định, giờ hoàng đạo. Our divergences come last and are
 * flagged, never interleaved with canonical rows.
 *
 * The baseline is emitted as a contribution rather than folded into the sum. The
 * spec requires that a reader be able to sum the visible deltas and reach the
 * displayed score, and that a clamped day still show all of its reasoning — both
 * of which need the starting 50 to be a visible line.
 */
export function scoreDay(date: SolarDate, viec: Viec, chuSu: ChuSu | null = null): DayQuality {
  const weights = WEIGHT_TABLES[viec];
  const label = VIEC_LABEL[viec];
  const out: Contribution[] = [];

  const them = (c: Contribution): void => {
    // A neutral layer contributes nothing and shows no line, so a reader is
    // never asked to interpret a "+0 Trực Bình".
    if (c.delta !== 0) out.push(c);
  };

  them({
    rule: QUY_TAC_DIEM_CO_SO,
    delta: DIEM_CO_SO,
    explanation: "Mọi ngày khởi điểm ở mức trung hoà, trước khi xét bất kỳ quy tắc nào.",
    citation: CANON_CITATION,
    divergence: false,
  });

  // 1. Trực nhật — hoàng đạo hay hắc đạo.
  const than = trucNhatOf(date);
  const hoangDao = isNgayHoangDao(date);
  them({
    rule: hoangDao ? "Ngày hoàng đạo" : "Ngày hắc đạo",
    delta: hoangDao ? weights.hoangDao : weights.hacDao,
    explanation: `${than} trực nhật, là ngày ${hoangDao ? "hoàng đạo" : "hắc đạo"}.`,
    citation: CANON_CITATION,
    divergence: false,
  });

  // 2. Thập nhị trực.
  const truc = trucOf(date);
  them({
    rule: `Trực ${truc}`,
    delta: weights.truc[truc],
    explanation: `Trực ${truc} ${moTa(weights.truc[truc], label)}.`,
    citation: CANON_CITATION,
    divergence: false,
  });

  // 3. Nhị thập bát tú.
  const tu = tuOf(date);
  them({
    rule: `Sao ${tu.name}`,
    delta: weights.tu[tu.name],
    explanation: `Sao ${tu.name} (${tu.hanh}) ${moTa(weights.tu[tu.name], label)}.`,
    citation: CANON_CITATION,
    divergence: false,
  });

  const hits = rulesTrongNgay(date);

  // 4 + 5. Sao tháng và ngày kỵ cố định — the canonical rows only.
  for (const hit of hits) {
    if (hit.divergence) continue;
    them({
      rule: hit.rule,
      delta: weights.rule[hit.rule],
      explanation: `${hit.explanation}.`,
      citation: CANON_CITATION,
      divergence: false,
    });
  }

  // 6. Giờ hoàng đạo inside the daytime window. Date-derived only: no clock, no
  // time-of-day input, and no claim about which day the 23h–01h giờ belongs to.
  const gio = gioHoangDaoTrongKhung(date);
  them({
    rule: "Giờ hoàng đạo",
    delta: weights.gioMoiGio * (gio.length - weights.gioTrungHoa),
    explanation:
      `Có ${gio.length} giờ hoàng đạo trong khung ${KHUNG_GIO_BAT_DAU}h–${KHUNG_GIO_KET_THUC}h` +
      (gio.length > 0 ? `: ${gio.map((g) => g.chi).join(", ")}` : "") +
      ".",
    citation: CANON_CITATION,
    divergence: false,
  });

  // 7. Our divergences, after every canonical layer.
  for (const hit of hits) {
    if (!hit.divergence) continue;
    them({
      rule: hit.rule,
      delta: weights.rule[hit.rule],
      explanation: `${hit.explanation}. ${NGAY_KY_JUSTIFICATION}`,
      citation: DIVERGENCE_CITATION,
      divergence: true,
    });
  }

  // 8. Xung tuổi, only when a chủ sự is selected. A modifier, never a veto — the
  // day keeps its place in any listing and keeps its full breakdown.
  if (chuSu !== null && laXungTuoi(date, chuSu.tuoi)) {
    them({
      rule: "Xung tuổi",
      delta: weights.rule["Xung tuổi"],
      explanation:
        `Tuổi ${chuSu.tuoi} của ${chuSu.ten} xung với ngày ${canChiDay(date)} ` +
        `(ngày này xung ${tuoiXungCuaNgay(date).join(" và ")}). ` +
        XUNG_TUOI_JUSTIFICATION,
      citation: DIVERGENCE_CITATION,
      divergence: true,
    });
  }

  const rawScore = out.reduce((sum, c) => sum + c.delta, 0);
  const score = Math.max(DIEM_THAP_NHAT, Math.min(DIEM_CAO_NHAT, rawScore));

  return {
    viec,
    date,
    score,
    danhGia: danhGiaOf(score),
    contributions: out,
    rawScore,
    clamped: rawScore !== score,
  };
}

/**
 * Score a run of consecutive dates, for month views and for calibrating tiers
 * against a real distribution.
 */
export function scoreDays(
  dates: readonly SolarDate[],
  viec: Viec,
  chuSu: ChuSu | null = null,
): readonly DayQuality[] {
  return dates.map((date) => scoreDay(date, viec, chuSu));
}
