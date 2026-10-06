import type { SolarDate } from "@lunar/core";
import type { Citation } from "./types.ts";

/**
 * The reference canon for day selection: `xemlichngaytotxau.com`.
 *
 * Chosen as the single authority because it is the Vietnamese almanac people
 * actually consult, because it publishes its own method rather than only its
 * verdicts, and because it exposes an open per-day JSON API — which is what made
 * every weight in this package derivable instead of guessed.
 */
export const CANON_NAME = "Xem Lịch Ngày Tốt Xấu";

export const CANON_METHOD_URL = "https://xemlichngaytotxau.com/phuong-phap";

/** Citation for any rule the canon states in its method or per-day output. */
export const CANON_CITATION: Citation = {
  source: `${CANON_NAME} — phương pháp chọn ngày`,
  url: CANON_METHOD_URL,
};

/**
 * The canon's own page for one day, e.g. `5-10-2026`.
 *
 * Unpadded, and without a `.json` suffix — the API path is the same shape as the
 * HTML path. Zero-padded dates and `.json` both 404.
 */
export function canonDayUrl(s: SolarDate): string {
  return `https://xemlichngaytotxau.com/ngay/${s.day}-${s.month}-${s.year}`;
}

/**
 * Citation for a rule we score that the canon describes in prose but does not
 * itself score. A divergence must never look like a canonical rule, so it
 * carries this citation instead of `CANON_CITATION`.
 */
export const DIVERGENCE_CITATION: Citation = {
  source: "Tín ngưỡng dân gian — điểm khác biệt với cách tính của nguồn tham chiếu",
  url: null,
};

/**
 * Why the two lunar-day divergences are scored at all, given the canon's own
 * model contains no lunar-day term.
 *
 * Stated once here so every surface renders the same justification rather than
 * each inventing its own wording.
 */
export const NGAY_KY_JUSTIFICATION =
  "Nguồn tham chiếu mô tả mùng 1 và ngày rằm là ngày kỵ cắt tóc nhưng không đưa chúng vào điểm số của chính họ. " +
  "Chúng tôi chấm −13, cùng mức với Tam Nương và Nguyệt Kỵ, và đánh dấu rõ đây là điểm khác biệt chứ không phải quy tắc của nguồn.";

/**
 * Why xung tuổi is scored at all, given the canon publishes `tuoi_xung` as
 * information only and its score contains no tuổi term.
 *
 * The magnitude is not invented: it borrows the −9 the canon already assigns to
 * comparable personal and ritual incompatibilities (Sát Chủ, Thọ Tử, Dương Công
 * Kỵ Nhật). It stays a modifier — a xung day is lowered, never disqualified or
 * hidden — because that is what the `day-quality` spec requires.
 */
export const XUNG_TUOI_JUSTIFICATION =
  "Nguồn tham chiếu liệt kê tuổi xung để tham khảo nhưng không trừ điểm vì tuổi. " +
  "Chúng tôi trừ −9, bằng mức nguồn dùng cho Sát Chủ, Thọ Tử và Dương Công Kỵ Nhật, " +
  "và ngày xung vẫn hiển thị bình thường chứ không bị loại.";
