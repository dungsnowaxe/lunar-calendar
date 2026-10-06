import { useSyncExternalStore } from "react";

import type { CanChi } from "@lunar/ngay-tot";

import {
  CHU_SU_KEY,
  CHU_SU_RONG,
  chonChuSu,
  parseChuSu,
  serializeChuSu,
  suaChuSu,
  themChuSu,
  xoaChuSu,
  type ChuSuState,
} from "~/lib/chu-su";

/*
 * The chủ sự store. Client-only by design: a birth year never reaches the
 * database, so there is no server round-trip, no loader, and no mutation — just
 * `localStorage` and a subscription.
 *
 * `useSyncExternalStore` with a server snapshot is the pattern this app already
 * uses for browser-only state (see `use-min-width.ts`), and it is what keeps the
 * render SSR-safe: the server renders the empty state and the browser fills it in
 * after hydration, with `suppressHydrationWarning` already on `<html>`.
 */

/**
 * Cached so the snapshot is referentially stable. `useSyncExternalStore` compares
 * snapshots with `Object.is`; parsing on every call would return a fresh object
 * each time and loop forever.
 */
let cache: ChuSuState | null = null;

const listeners = new Set<() => void>();

function snapshot(): ChuSuState {
  if (cache === null) cache = parseChuSu(localStorage.getItem(CHU_SU_KEY));
  return cache;
}

/** Commit a new state: cache it, persist it, and tell every subscriber. */
function ghi(next: ChuSuState): void {
  cache = next;
  localStorage.setItem(CHU_SU_KEY, serializeChuSu(next));
  for (const listener of listeners) listener();
}

/** Another tab may add or select a chủ sự; follow it rather than going stale. */
function onStorage(event: StorageEvent): void {
  if (event.key !== CHU_SU_KEY) return;
  cache = parseChuSu(event.newValue);
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  if (listeners.size === 1) window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener("storage", onStorage);
  };
}

export interface ChuSuStore {
  /**
   * The whole stored state. Referentially stable between writes, so it is safe
   * as a `useMemo` dependency.
   *
   * Callers that need the kernel's `{ ten, tuoi }` shape should derive it with
   * `chuSuDuocChon(state)` at the point of use rather than reading a precomputed
   * field off this object — a fresh object identity on every render would defeat
   * exactly the memoisation that makes scoring thirty-one days cheap.
   */
  readonly state: ChuSuState;
  them(ten: string, tuoi: CanChi): void;
  sua(id: string, patch: { ten?: string; tuoi?: CanChi }): void;
  xoa(id: string): void;
  chon(id: string | null): void;
}

/**
 * Read and edit the device's chủ sự list.
 *
 * Returns the empty state during server render, so every surface must already
 * cope with no chủ sự — which it has to anyway, since the verdict is shown
 * unchanged when nobody has been entered.
 */
export function useChuSu(): ChuSuStore {
  const state = useSyncExternalStore(subscribe, snapshot, () => CHU_SU_RONG);
  return {
    state,
    them: (ten, tuoi) => ghi(themChuSu(state, { ten, tuoi })),
    sua: (id, patch) => ghi(suaChuSu(state, id, patch)),
    xoa: (id) => ghi(xoaChuSu(state, id)),
    chon: (id) => ghi(chonChuSu(state, id)),
  };
}
