import { CAN, CHI, canChiDay, type SolarDate } from "@lunar/core";
import type { CanChi } from "./types.ts";

function canChiAt(i: number): CanChi {
  const can = CAN[i % 10];
  const chi = CHI[i % 12];
  if (can === undefined || chi === undefined) {
    throw new RangeError(`no Can–Chi at index ${i}`);
  }
  return `${can} ${chi}`;
}

/**
 * The sixty Can–Chi, in cycle order, from Giáp Tý to Quý Hợi.
 *
 * Computed rather than listed: the sixty are exactly the same-parity pairings of
 * the ten Can and twelve Chi, so a written-out list would be sixty chances to
 * mis-pair them and one more thing to keep in step with `@lunar/core`'s spelling.
 */
export const CAN_CHI: readonly CanChi[] = Array.from({ length: 60 }, (_, i) => canChiAt(i));

/**
 * True when `value` is one of the sixty Can–Chi.
 *
 * `CanChi` is aliased to `string` for ergonomics, so validity is a runtime
 * property rather than a type-level one. This is what makes reading a chủ sự back
 * from `localStorage` safe — that storage is untrusted text a user can edit.
 */
export function isCanChi(value: string): boolean {
  return CAN_CHI.includes(value);
}

/** The day's Can and Chi as cycle indices, taken from the core's own output. */
function dayCanChiIndex(s: SolarDate): readonly [number, number] {
  const [can, chi] = canChiDay(s).split(" ");
  const canIndex = CAN.findIndex((c) => c === can);
  const chiIndex = CHI.findIndex((c) => c === chi);
  if (canIndex < 0 || chiIndex < 0) {
    throw new RangeError(`"${canChiDay(s)}" is not a Can–Chi of this calendar`);
  }
  return [canIndex, chiIndex];
}

/**
 * The two tuổi that are xung with a given day.
 *
 * Derived from the canon's own `tuoi_xung` list across all sixty day Can–Chi in
 * the harvested window, and reproducing all sixty exactly. The rule is uniform:
 *
 * - the year's Chi is always the day Chi's **opposite** (`+6` mod 12);
 * - the year's Can is either the day Can **+4** or **+6** (mod 10).
 *
 * `+6` is the direct thiên-can xung; `+4` is the Can whose element the day's
 * element overcomes. Both are even offsets, which is why the two results are
 * always genuine members of the sixty-cycle rather than the odd pairings that do
 * not exist in it.
 *
 * This is why tuổi must be a Can–Chi and not an animal. Five of the twelve Chi
 * have five possible years, and the canon names only two of them as xung: for
 * ngày Nhâm Tý it lists Bính Ngọ and Mậu Ngọ, and says nothing about Giáp Ngọ,
 * Canh Ngọ or Nhâm Ngọ. A twelve-animal selector would flag all five.
 */
export function tuoiXungCuaNgay(s: SolarDate): readonly CanChi[] {
  const [can, chi] = dayCanChiIndex(s);
  const chiXung = (chi + 6) % 12;
  const xungChi = CHI[chiXung];
  const canBon = CAN[(can + 4) % 10];
  const canSau = CAN[(can + 6) % 10];
  if (xungChi === undefined || canBon === undefined || canSau === undefined) {
    throw new RangeError(`cannot derive tuổi xung for ${canChiDay(s)}`);
  }
  return [`${canBon} ${xungChi}`, `${canSau} ${xungChi}`];
}

/** True when a chủ sự's tuổi is xung with the day. */
export function laXungTuoi(s: SolarDate, tuoi: CanChi): boolean {
  return tuoiXungCuaNgay(s).includes(tuoi);
}
