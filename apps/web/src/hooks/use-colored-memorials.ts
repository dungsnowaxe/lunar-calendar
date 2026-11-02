import { useEffect, useMemo, useRef } from "react";

import {
  readStoredMemorialColors,
  resolveMemorialColors,
  writeStoredMemorialColors,
  type ColoredMemorial,
} from "~/lib/memorial-colors";
import { persistEventColorsFn } from "~/server/events";
import type { MemorialEvent } from "~/server/events";

export function useColoredMemorials(events: MemorialEvent[]): ColoredMemorial[] {
  const stored = useMemo(() => {
    if (typeof window === "undefined") return {};
    return readStoredMemorialColors();
  }, []);

  const resolved = useMemo(() => resolveMemorialColors(events, stored), [events, stored]);

  const persistKey = resolved.persist.map((item) => `${item.id}:${item.colorId}`).join("|");
  const persistRef = useRef("");

  useEffect(() => {
    writeStoredMemorialColors(resolved.store);
    if (resolved.persist.length === 0) return;
    if (persistRef.current === persistKey) return;
    persistRef.current = persistKey;
    void persistEventColorsFn({ data: resolved.persist });
  }, [resolved.persist, resolved.store, persistKey]);

  return resolved.events;
}
