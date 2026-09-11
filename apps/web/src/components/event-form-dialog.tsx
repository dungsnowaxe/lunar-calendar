import { useState } from 'react'
import { toast } from 'sonner'
import { formatSolar, nextOccurrences, solarToday } from '@lunar/core'
import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { Textarea } from '~/components/ui/textarea'
import { createEventFn, updateEventFn } from '~/server/events'

interface EventFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** When present the dialog edits this event instead of creating one. */
  event?: {
    id: string
    title: string
    lunarDay: number
    lunarMonth: number
    notes: string | null
  }
  onSaved: () => void | Promise<void>
}

const DAYS = Array.from({ length: 30 }, (_, i) => String(i + 1))
const MONTHS = Array.from({ length: 12 }, (_, i) => String(i + 1))

const dayItems: Record<string, string> = Object.fromEntries(
  DAYS.map((day) => [day, `Ngày ${day}`]),
)
const monthItems: Record<string, string> = Object.fromEntries(
  MONTHS.map((month) => [month, `Tháng ${month}`]),
)

export function EventFormDialog({
  open,
  onOpenChange,
  event,
  onSaved,
}: EventFormDialogProps) {
  const [title, setTitle] = useState(event?.title ?? '')
  const [lunarDay, setLunarDay] = useState(String(event?.lunarDay ?? 10))
  const [lunarMonth, setLunarMonth] = useState(String(event?.lunarMonth ?? 1))
  const [notes, setNotes] = useState(event?.notes ?? '')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const nextOccurrence = nextOccurrences(
    { lunarDay: Number(lunarDay), lunarMonth: Number(lunarMonth) },
    solarToday(),
    1,
  )[0]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setPending(true)
    setError(null)
    const payload = {
      title,
      lunarDay: Number(lunarDay),
      lunarMonth: Number(lunarMonth),
      notes: notes || null,
    }
    let result: { error?: string }
    try {
      result = event
        ? await updateEventFn({ data: { ...payload, id: event.id } })
        : await createEventFn({ data: payload })
    } catch {
      setPending(false)
      setError('Không thể kết nối máy chủ. Vui lòng thử lại.')
      return
    }
    setPending(false)
    if (result.error) {
      setError(result.error)
      return
    }
    toast.success(event ? 'Đã cập nhật sự kiện' : 'Đã thêm sự kiện')
    onOpenChange(false)
    await onSaved()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{event ? 'Sửa sự kiện' : 'Thêm sự kiện giỗ'}</DialogTitle>
          <DialogDescription>
            Nhập ngày âm lịch, ngày giỗ sẽ lặp lại đúng ngày đó mỗi năm.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="event-title">Tên sự kiện</Label>
            <Input
              id="event-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Giỗ tổ, giỗ ông nội, giỗ bà ngoại…"
              required
              maxLength={120}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="event-day">Ngày âm lịch</Label>
              <Select
                items={dayItems}
                value={lunarDay}
                onValueChange={(value) => {
                  if (value != null) setLunarDay(String(value))
                }}
              >
                <SelectTrigger id="event-day" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAYS.map((day) => (
                    <SelectItem key={day} value={day}>
                      {dayItems[day]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="event-month">Tháng âm lịch</Label>
              <Select
                items={monthItems}
                value={lunarMonth}
                onValueChange={(value) => {
                  if (value != null) setLunarMonth(String(value))
                }}
              >
                <SelectTrigger id="event-month" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((month) => (
                    <SelectItem key={month} value={month}>
                      {monthItems[month]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="event-notes">Ghi chú</Label>
            <Textarea
              id="event-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="VD: Cúng vào buổi trưa, dâng hương ở nhà thờ…"
              maxLength={500}
            />
          </div>
          {nextOccurrence && (
            <p className="text-sm text-muted-foreground">
              Lần tới vào:{' '}
              <span className="font-medium text-foreground">
                {formatSolar(nextOccurrence)}
              </span>
            </p>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? 'Đang lưu…' : event ? 'Lưu thay đổi' : 'Thêm sự kiện'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
