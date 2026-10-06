import { isCanChi, type CanChi, type ChuSu } from "@lunar/ngay-tot";

/**
 * A chủ sự as stored: the kernel's `{ ten, tuoi }` plus a stable identity.
 *
 * The identity is separate from `ten` because two chủ sự may legitimately share
 * a name ("Bà" twice, say) and renaming one must not silently re-point the
 * selection at another.
 */
export interface ChuSuDaLuu extends ChuSu {
  readonly id: string;
}

export interface ChuSuState {
  readonly nguoi: readonly ChuSuDaLuu[];
  /** The id of the selected chủ sự, or null when none is selected. */
  readonly chon: string | null;
}

/**
 * Bare and unnamespaced, matching the existing `"theme"` key.
 *
 * This is the only place a chủ sự is ever persisted. Nothing here reaches
 * Supabase or any other network destination: birth-year data stays on the
 * device, which is what the `day-quality` spec requires.
 */
export const CHU_SU_KEY = "chu-su";

/** A family, not a registry — enough for everyone whose tuổi matters. */
export const CHU_SU_TOI_DA = 10;

/** Long enough for a name and a relationship, short enough to render on one line. */
export const TEN_TOI_DA = 40;

export const CHU_SU_RONG: ChuSuState = { nguoi: [], chon: null };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/**
 * Parse and validate what is in `localStorage`.
 *
 * That storage is untrusted text: a user can edit it, an older version of the
 * app may have written a different shape, and another tab may have written
 * something partial. Rather than throwing, this drops whatever it cannot vouch
 * for and returns a state that is always safe to render and to score with. In
 * particular every surviving `tuoi` is one of the sixty Can–Chi, so a corrupt
 * entry can never reach `scoreDay`.
 */
export function parseChuSu(raw: string | null): ChuSuState {
  if (raw === null) return CHU_SU_RONG;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return CHU_SU_RONG;
  }
  if (!isRecord(parsed)) return CHU_SU_RONG;

  const nguoi: ChuSuDaLuu[] = [];
  const seen = new Set<string>();
  if (Array.isArray(parsed["nguoi"])) {
    for (const entry of parsed["nguoi"]) {
      if (nguoi.length >= CHU_SU_TOI_DA) break;
      if (!isRecord(entry)) continue;
      const { id, ten, tuoi } = entry;
      if (typeof id !== "string" || id === "" || seen.has(id)) continue;
      if (typeof tuoi !== "string" || !isCanChi(tuoi)) continue;
      const name = typeof ten === "string" ? ten.trim().slice(0, TEN_TOI_DA) : "";
      if (name === "") continue;
      seen.add(id);
      nguoi.push({ id, ten: name, tuoi });
    }
  }

  // A selection pointing at an entry that did not survive validation is not a
  // selection — fall back to none rather than to an arbitrary person.
  const chon = parsed["chon"];
  const valid = typeof chon === "string" && seen.has(chon) ? chon : null;

  return { nguoi, chon: valid };
}

export function serializeChuSu(state: ChuSuState): string {
  return JSON.stringify({ nguoi: state.nguoi, chon: state.chon });
}

/**
 * The selected chủ sự, in the shape the kernel wants, or null.
 *
 * Null is a normal state, not an error: the day's quality is shown unchanged
 * when nobody has been entered, and nothing prompts for one.
 */
export function chuSuDuocChon(state: ChuSuState): ChuSu | null {
  if (state.chon === null) return null;
  const found = state.nguoi.find((n) => n.id === state.chon);
  return found === undefined ? null : { ten: found.ten, tuoi: found.tuoi };
}

/**
 * Add a chủ sự. Returns the state unchanged when the name is blank, the tuổi is
 * not one of the sixty, or the list is already full — the caller surfaces that
 * rather than this throwing.
 */
export function themChuSu(state: ChuSuState, input: { ten: string; tuoi: CanChi }): ChuSuState {
  const ten = input.ten.trim().slice(0, TEN_TOI_DA);
  if (ten === "" || !isCanChi(input.tuoi)) return state;
  if (state.nguoi.length >= CHU_SU_TOI_DA) return state;
  const nguoi: ChuSuDaLuu = { id: crypto.randomUUID(), ten, tuoi: input.tuoi };
  return { nguoi: [...state.nguoi, nguoi], chon: nguoi.id };
}

/**
 * Edit a chủ sự. A patch that would blank the tên or set an impossible tuổi is
 * ignored for that field rather than applied, so an in-progress edit can never
 * leave the list holding an entry that `parseChuSu` would then reject.
 */
export function suaChuSu(
  state: ChuSuState,
  id: string,
  patch: { ten?: string; tuoi?: CanChi },
): ChuSuState {
  return {
    ...state,
    nguoi: state.nguoi.map((n) => {
      if (n.id !== id) return n;
      const ten = patch.ten === undefined ? n.ten : patch.ten.trim().slice(0, TEN_TOI_DA);
      const tuoi = patch.tuoi === undefined || !isCanChi(patch.tuoi) ? n.tuoi : patch.tuoi;
      return { ...n, ten: ten === "" ? n.ten : ten, tuoi };
    }),
  };
}

/** Remove a chủ sự, clearing the selection if it was the one selected. */
export function xoaChuSu(state: ChuSuState, id: string): ChuSuState {
  return {
    nguoi: state.nguoi.filter((n) => n.id !== id),
    chon: state.chon === id ? null : state.chon,
  };
}

export function chonChuSu(state: ChuSuState, id: string | null): ChuSuState {
  if (id !== null && !state.nguoi.some((n) => n.id === id)) return state;
  return { ...state, chon: id };
}
