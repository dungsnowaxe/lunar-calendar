import { test } from 'node:test'
import assert from 'node:assert/strict'

import {
  createMemorialEvents,
  type EventRow,
  type MemorialEventInsert,
  type MemorialEventsWriter,
} from './memorial-events.ts'

const VALID_ONG = {
  title: 'Giỗ ông',
  lunarDay: 10,
  lunarMonth: 1,
  notes: 'Thắp hương',
}

const VALID_BA = {
  title: 'Giỗ bà',
  lunarDay: 15,
  lunarMonth: 8,
  notes: null,
}

function mockWriter(options?: {
  error?: string
  rows?: EventRow[]
}): { supabase: MemorialEventsWriter; inserts: MemorialEventInsert[][] } {
  const inserts: MemorialEventInsert[][] = []
  const supabase: MemorialEventsWriter = {
    from(table: string) {
      return {
        insert(values: MemorialEventInsert[]) {
          return {
            async select(_columns: string) {
              if (table !== 'memorial_events') {
                return {
                  data: null,
                  error: { message: `unexpected table ${table}` },
                }
              }
              inserts.push(values)
              if (options?.error) {
                return { data: null, error: { message: options.error } }
              }
              const data =
                options?.rows ??
                values.map((row, index) => ({
                  id: `id-${String(index + 1)}`,
                  title: row.title,
                  lunar_day: row.lunar_day,
                  lunar_month: row.lunar_month,
                  notes: row.notes,
                  created_at: '2026-09-13T00:00:00.000Z',
                }))
              return { data, error: null }
            },
          }
        },
      }
    },
  }
  return { supabase, inserts }
}

test('a valid batch creates every row in one insert', async () => {
  const { supabase, inserts } = mockWriter()
  const result = await createMemorialEvents([VALID_ONG, VALID_BA], supabase)

  assert.deepEqual(inserts, [
    [
      {
        title: 'Giỗ ông',
        lunar_day: 10,
        lunar_month: 1,
        notes: 'Thắp hương',
      },
      {
        title: 'Giỗ bà',
        lunar_day: 15,
        lunar_month: 8,
        notes: null,
      },
    ],
  ])
  assert.deepEqual(result, {
    events: [
      {
        id: 'id-1',
        title: 'Giỗ ông',
        lunarDay: 10,
        lunarMonth: 1,
        notes: 'Thắp hương',
        createdAt: '2026-09-13T00:00:00.000Z',
      },
      {
        id: 'id-2',
        title: 'Giỗ bà',
        lunarDay: 15,
        lunarMonth: 8,
        notes: null,
        createdAt: '2026-09-13T00:00:00.000Z',
      },
    ],
  })
})

test('one invalid entry creates none of the batch', async () => {
  const { supabase, inserts } = mockWriter()
  const result = await createMemorialEvents(
    [VALID_ONG, { ...VALID_BA, title: '   ' }],
    supabase,
  )

  assert.deepEqual(inserts, [])
  assert.deepEqual(result, { error: 'Vui lòng nhập tên sự kiện' })
})
