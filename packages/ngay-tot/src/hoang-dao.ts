import { gioOf, trucNhatOf, type Gio, type SolarDate, type TrucNhatName } from "@lunar/core";

/**
 * The six favourable day-deities, out of the twelve.
 *
 * This set originally lived in `@lunar/core` as a `hoangDao` boolean on the
 * deity and on each giờ. It was moved here because calling six deities
 * favourable is a traditional judgment, not a computed one: nothing about Thanh
 * Long being auspicious follows from astronomy. Core still computes *which*
 * deity presides over a day and each of its giờ; this module decides what that
 * means. See ADR-0002.
 *
 * Typed against core's `TrucNhatName` union, so a misspelled deity — "Kim Quy"
 * for "Kim Quỹ", say — is a build failure rather than a set member that silently
 * never matches. Verified to reproduce the reference canon's hoàng đạo flags on
 * all 579 harvested days and all 6,948 of their giờ.
 */
export const HOANG_DAO: ReadonlySet<TrucNhatName> = new Set<TrucNhatName>([
  "Thanh Long",
  "Minh Đường",
  "Kim Quỹ",
  "Bảo Quang",
  "Ngọc Đường",
  "Tư Mệnh",
]);

/** True when a deity makes its day or giờ hoàng đạo rather than hắc đạo. */
export function isHoangDao(than: TrucNhatName): boolean {
  return HOANG_DAO.has(than);
}

/** True when the day as a whole is a ngày hoàng đạo. */
export function isNgayHoangDao(s: SolarDate): boolean {
  return isHoangDao(trucNhatOf(s));
}

/** The hour at which the daytime window opens, inclusive. */
export const KHUNG_GIO_BAT_DAU = 7;

/** The hour at which the daytime window closes, exclusive. */
export const KHUNG_GIO_KET_THUC = 19;

/**
 * The day's hoàng đạo giờ that fall inside 07h–19h.
 *
 * Derived from the day's Chi alone: no clock reading, no time-of-day input, and
 * no claim about which day the 23h–01h giờ belongs to.
 *
 * The count this returns is structurally constrained. Exactly six of the twelve
 * giờ are always hoàng đạo, and the window always spans exactly six giờ, so over
 * all twelve possible day Chi the count takes only the values 2, 3 and 4. That
 * is asserted exhaustively in the tests rather than assumed here — and it is why
 * the giờ layer can never contribute the `−4` or `+8` that the canon's
 * methodology page advertises for an unreachable domain.
 */
export function gioHoangDaoTrongKhung(s: SolarDate): readonly Gio[] {
  return gioOf(s).filter(
    (g) =>
      isHoangDao(g.than) && g.startHour >= KHUNG_GIO_BAT_DAU && g.startHour < KHUNG_GIO_KET_THUC,
  );
}
