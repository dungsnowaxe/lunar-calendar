import { z } from "zod";

/**
 * Memorial events (ngày giỗ) - one shared list for the whole family. The
 * lunar date below is the canonical, stored representation; occurrences
 * always follow the regular month (tháng thường) and solar dates are
 * computed with @lunar/core, never persisted.
 */
export interface MemorialEvent {
  id: string;
  title: string;
  lunarDay: number;
  lunarMonth: number;
  notes: string | null;
  createdAt: string;
}

export const eventInputSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập tên sự kiện")
    .max(120, "Tên sự kiện tối đa 120 ký tự"),
  lunarDay: z
    .number()
    .int("Ngày âm lịch không hợp lệ")
    .min(1, "Ngày âm lịch phải từ 1 đến 30")
    .max(30, "Ngày âm lịch phải từ 1 đến 30"),
  lunarMonth: z
    .number()
    .int("Tháng âm lịch không hợp lệ")
    .min(1, "Tháng âm lịch phải từ 1 đến 12")
    .max(12, "Tháng âm lịch phải từ 1 đến 12"),
  notes: z
    .string()
    .trim()
    .max(500, "Ghi chú tối đa 500 ký tự")
    .nullish()
    .transform((v) => v || null),
});

const eventsInputSchema = z
  .array(eventInputSchema)
  .min(1, "Vui lòng nhập ít nhất một sự kiện")
  .max(10, "Mỗi lần thêm tối đa 10 sự kiện");

export function firstIssue(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Dữ liệu không hợp lệ";
}

export interface EventRow {
  id: string;
  title: string;
  lunar_day: number;
  lunar_month: number;
  notes: string | null;
  created_at: string;
}

export function mapRow(row: EventRow): MemorialEvent {
  return {
    id: row.id,
    title: row.title,
    lunarDay: row.lunar_day,
    lunarMonth: row.lunar_month,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

export type MemorialEventInsert = {
  title: string;
  lunar_day: number;
  lunar_month: number;
  notes: string | null;
};

export type MemorialEventsWriter = {
  from: (table: string) => {
    insert: (values: MemorialEventInsert[]) => {
      select: (columns: string) => PromiseLike<{
        data: EventRow[] | null;
        error: { message: string } | null;
      }>;
    };
  };
};

export async function createMemorialEvents(
  data: unknown,
  supabase: MemorialEventsWriter,
): Promise<{ events: MemorialEvent[] } | { error: string }> {
  const parsed = eventsInputSchema.safeParse(data);
  if (!parsed.success) {
    return { error: firstIssue(parsed.error) };
  }
  const { data: rows, error } = await supabase
    .from("memorial_events")
    .insert(
      parsed.data.map((item) => ({
        title: item.title,
        lunar_day: item.lunarDay,
        lunar_month: item.lunarMonth,
        notes: item.notes,
      })),
    )
    .select("id, title, lunar_day, lunar_month, notes, created_at");
  if (error) {
    return { error: `Không thể tạo sự kiện: ${error.message}` };
  }
  return { events: (rows as EventRow[]).map(mapRow) };
}
