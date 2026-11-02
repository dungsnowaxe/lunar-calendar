import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { memorialColorIdSchema, migrateMemorialColors } from "~/lib/memorial-colors";
import { getSupabaseServerClient } from "~/utils/supabase";
import {
  createMemorialEvents,
  EVENT_SELECT_BASE,
  EVENT_SELECT_WITH_COLOR,
  eventInputSchema,
  firstIssue,
  mapRow,
  type EventRow,
  type MemorialEvent,
} from "./memorial-events";

export type { MemorialEvent };

export const eventIdSchema = z.string().uuid("Sự kiện không hợp lệ");

const eventInputSchemaWithId = eventInputSchema.extend({ id: eventIdSchema });

const persistColorsSchema = z.array(
  z.object({
    id: eventIdSchema,
    colorId: memorialColorIdSchema,
  }),
);

async function fetchEventRows(): Promise<{ rows: EventRow[]; hasColorColumn: boolean }> {
  const supabase = getSupabaseServerClient();
  const withColor = await supabase
    .from("memorial_events")
    .select(EVENT_SELECT_WITH_COLOR)
    .order("created_at", { ascending: true });
  if (!withColor.error) {
    return { rows: (withColor.data ?? []) as EventRow[], hasColorColumn: true };
  }
  const without = await supabase
    .from("memorial_events")
    .select(EVENT_SELECT_BASE)
    .order("created_at", { ascending: true });
  if (without.error) {
    throw new Error(`Không thể tải sự kiện: ${without.error.message}`);
  }
  return { rows: (without.data ?? []) as EventRow[], hasColorColumn: false };
}

async function persistMissingColors(events: MemorialEvent[]): Promise<void> {
  const missing = events.filter((event) => event.colorId != null);
  if (missing.length === 0) return;
  const supabase = getSupabaseServerClient();
  await Promise.all(
    missing.map((event) =>
      supabase.from("memorial_events").update({ color_id: event.colorId }).eq("id", event.id),
    ),
  );
}

export const listEventsFn = createServerFn({ method: "GET" }).handler(async () => {
  const { rows, hasColorColumn } = await fetchEventRows();
  const mapped = rows.map(mapRow);
  if (!hasColorColumn) {
    return mapped;
  }
  const migrated = migrateMemorialColors(mapped);
  const toWrite = migrated.filter((event, index) => mapped[index]?.colorId !== event.colorId);
  if (toWrite.length > 0) {
    await persistMissingColors(toWrite);
  }
  return migrated;
});

export const persistEventColorsFn = createServerFn({ method: "POST" })
  .validator((d: unknown) => persistColorsSchema.safeParse(d))
  .handler(async ({ data }) => {
    if (!data.success) {
      return { error: firstIssue(data.error) };
    }
    const supabase = getSupabaseServerClient();
    const results = await Promise.all(
      data.data.map((item) =>
        supabase.from("memorial_events").update({ color_id: item.colorId }).eq("id", item.id),
      ),
    );
    if (results.some((result) => result.error)) {
      return { ok: false as const };
    }
    return { ok: true as const };
  });

export const createEventsFn = createServerFn({ method: "POST" })
  .validator((d: unknown) => d)
  .handler(async ({ data }) => {
    return createMemorialEvents(data, getSupabaseServerClient());
  });

export const updateEventFn = createServerFn({ method: "POST" })
  .validator((d: unknown) => d)
  .handler(async ({ data }) => {
    const parsed = eventInputSchemaWithId.safeParse(data);
    if (!parsed.success) {
      return { error: firstIssue(parsed.error) };
    }
    const supabase = getSupabaseServerClient();
    const patch = {
      title: parsed.data.title,
      lunar_day: parsed.data.lunarDay,
      lunar_month: parsed.data.lunarMonth,
      notes: parsed.data.notes,
      color_id: parsed.data.colorId,
    };
    const withColor = await supabase
      .from("memorial_events")
      .update(patch)
      .eq("id", parsed.data.id)
      .select(EVENT_SELECT_WITH_COLOR)
      .single();
    if (!withColor.error) {
      return { event: mapRow(withColor.data as EventRow) };
    }
    const { color_id: _colorId, ...withoutColorPatch } = patch;
    const without = await supabase
      .from("memorial_events")
      .update(withoutColorPatch)
      .eq("id", parsed.data.id)
      .select(EVENT_SELECT_BASE)
      .single();
    if (without.error) {
      return { error: `Không thể cập nhật sự kiện: ${without.error.message}` };
    }
    return { event: mapRow(without.data as EventRow) };
  });

export const deleteEventFn = createServerFn({ method: "POST" })
  .validator((d: unknown) => eventIdSchema.safeParse(d))
  .handler(async ({ data }) => {
    if (!data.success) {
      return { error: firstIssue(data.error) };
    }
    const supabase = getSupabaseServerClient();
    const { error } = await supabase.from("memorial_events").delete().eq("id", data.data);
    if (error) {
      return { error: `Không thể xóa sự kiện: ${error.message}` };
    }
    return { ok: true as const };
  });
