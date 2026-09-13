import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { getSupabaseServerClient } from '~/utils/supabase'
import {
  createMemorialEvents,
  eventInputSchema,
  firstIssue,
  mapRow,
  type EventRow,
  type MemorialEvent,
} from './memorial-events'

export type { MemorialEvent }

export const eventIdSchema = z.string().uuid('Sự kiện không hợp lệ')

const eventInputSchemaWithId = eventInputSchema.extend({ id: eventIdSchema })

export const listEventsFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    const supabase = getSupabaseServerClient()
    const { data, error } = await supabase
      .from('memorial_events')
      .select('id, title, lunar_day, lunar_month, notes, created_at')
      .order('lunar_month', { ascending: true })
      .order('lunar_day', { ascending: true })
    if (error) {
      throw new Error(`Không thể tải sự kiện: ${error.message}`)
    }
    return (data as EventRow[]).map(mapRow)
  },
)

export const createEventsFn = createServerFn({ method: 'POST' })
  .validator((d: unknown) => d)
  .handler(async ({ data }) => {
    return createMemorialEvents(data, getSupabaseServerClient())
  })

export const updateEventFn = createServerFn({ method: 'POST' })
  .validator((d: unknown) => d)
  .handler(async ({ data }) => {
    const parsed = eventInputSchemaWithId.safeParse(data)
    if (!parsed.success) {
      return { error: firstIssue(parsed.error) }
    }
    const supabase = getSupabaseServerClient()
    const { data: row, error } = await supabase
      .from('memorial_events')
      .update({
        title: parsed.data.title,
        lunar_day: parsed.data.lunarDay,
        lunar_month: parsed.data.lunarMonth,
        notes: parsed.data.notes,
      })
      .eq('id', parsed.data.id)
      .select('id, title, lunar_day, lunar_month, notes, created_at')
      .single()
    if (error) {
      return { error: `Không thể cập nhật sự kiện: ${error.message}` }
    }
    return { event: mapRow(row as EventRow) }
  })

export const deleteEventFn = createServerFn({ method: 'POST' })
  .validator((d: unknown) => eventIdSchema.safeParse(d))
  .handler(async ({ data }) => {
    if (!data.success) {
      return { error: firstIssue(data.error) }
    }
    const supabase = getSupabaseServerClient()
    const { error } = await supabase
      .from('memorial_events')
      .delete()
      .eq('id', data.data)
    if (error) {
      return { error: `Không thể xóa sự kiện: ${error.message}` }
    }
    return { ok: true as const }
  })
