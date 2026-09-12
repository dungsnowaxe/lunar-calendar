import { useEffect, useId, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { formatSolar, nextOccurrences, solarToday } from '@lunar/core'
import { HugeiconsIcon } from '@hugeicons/react'
import { Delete02Icon, PlusSignIcon } from '@hugeicons/core-free-icons'
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '~/components/ui/sheet'
import { Textarea } from '~/components/ui/textarea'
import { useIsDesktop } from '~/hooks/use-min-width'
import { createEventsFn, updateEventFn } from '~/server/events'

interface EventFormOverlayProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** When present the overlay edits this event instead of creating one. */
  event?: {
    id: string
    title: string
    lunarDay: number
    lunarMonth: number
    notes: string | null
  }
  onSaved: () => void | Promise<void>
}

interface EventDraft {
  key: string
  title: string
  lunarDay: string
  lunarMonth: string
  notes: string
}

const DAYS = Array.from({ length: 30 }, (_, i) => String(i + 1))
const MONTHS = Array.from({ length: 12 }, (_, i) => String(i + 1))
const MAX_ENTRIES = 10
const DEFAULT_DAY = '10'
const DEFAULT_MONTH = '1'

const dayItems: Record<string, string> = Object.fromEntries(
  DAYS.map((day) => [day, day]),
)
const monthItems: Record<string, string> = Object.fromEntries(
  MONTHS.map((month) => [month, month]),
)

let draftKey = 0

function emptyDraft(): EventDraft {
  draftKey += 1
  return {
    key: String(draftKey),
    title: '',
    lunarDay: DEFAULT_DAY,
    lunarMonth: DEFAULT_MONTH,
    notes: '',
  }
}

function draftFromEvent(event: NonNullable<EventFormOverlayProps['event']>): EventDraft {
  draftKey += 1
  return {
    key: String(draftKey),
    title: event.title,
    lunarDay: String(event.lunarDay),
    lunarMonth: String(event.lunarMonth),
    notes: event.notes ?? '',
  }
}

function toPayload(draft: EventDraft) {
  return {
    title: draft.title,
    lunarDay: Number(draft.lunarDay),
    lunarMonth: Number(draft.lunarMonth),
    notes: draft.notes || null,
  }
}

export function EventFormOverlay({
  open,
  onOpenChange,
  event,
  onSaved,
}: EventFormOverlayProps) {
  const isDesktop = useIsDesktop()
  const formId = useId()
  const [entries, setEntries] = useState<EventDraft[]>(() => [emptyDraft()])
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isEdit = event != null

  function resetForm() {
    setEntries([emptyDraft()])
    setPending(false)
    setError(null)
  }

  useEffect(() => {
    if (!open) return
    setEntries(event ? [draftFromEvent(event)] : [emptyDraft()])
    setPending(false)
    setError(null)
  }, [open, event])

  function handleOpenChange(next: boolean) {
    if (!next) resetForm()
    onOpenChange(next)
  }

  function updateEntry(key: string, patch: Partial<EventDraft>) {
    setEntries((current) =>
      current.map((entry) => (entry.key === key ? { ...entry, ...patch } : entry)),
    )
  }

  function addEntry() {
    setEntries((current) =>
      current.length >= MAX_ENTRIES ? current : [...current, emptyDraft()],
    )
  }

  function removeEntry(key: string) {
    setEntries((current) =>
      current.length <= 1 ? current : current.filter((entry) => entry.key !== key),
    )
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setPending(true)
    setError(null)
    let result: { error?: string }
    try {
      result = isEdit
        ? await updateEventFn({
            data: { ...toPayload(entries[0]!), id: event.id },
          })
        : await createEventsFn({ data: entries.map(toPayload) })
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
    const count = entries.length
    toast.success(
      isEdit
        ? 'Đã cập nhật sự kiện'
        : count > 1
          ? `Đã thêm ${count} sự kiện`
          : 'Đã thêm sự kiện',
    )
    handleOpenChange(false)
    await onSaved()
  }

  const saveLabel = pending
    ? 'Đang lưu…'
    : isEdit
      ? 'Lưu thay đổi'
      : entries.length > 1
        ? `Thêm ${entries.length} sự kiện`
        : 'Thêm sự kiện'

  const title = isEdit ? 'Sửa sự kiện' : 'Thêm sự kiện giỗ'
  const description =
    'Nhập ngày âm lịch, ngày giỗ sẽ lặp lại đúng ngày đó mỗi năm.'

  const fields = (
    <EntryList
      formId={formId}
      entries={entries}
      isEdit={isEdit}
      pending={pending}
      onUpdate={updateEntry}
      onRemove={removeEntry}
      onAdd={addEntry}
    />
  )

  const actions = (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => handleOpenChange(false)}
        disabled={pending}
      >
        Hủy
      </Button>
      <Button type="submit" form={formId} disabled={pending}>
        {saveLabel}
      </Button>
    </>
  )

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <form id={formId} onSubmit={handleSubmit} className="flex flex-col gap-4">
            {fields}
            {error && <p className="text-sm text-destructive">{error}</p>}
            <DialogFooter>{actions}</DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="bottom"
        className="flex max-h-[90dvh] flex-col gap-0 p-0"
      >
        <SheetHeader className="shrink-0 pr-12">
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>
        <form
          id={formId}
          onSubmit={handleSubmit}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-2">
            {fields}
          </div>
          {error && (
            <p className="shrink-0 px-6 pb-2 text-sm text-destructive">{error}</p>
          )}
          <SheetFooter className="shrink-0 sm:flex-row sm:justify-end pb-[max(1.5rem,env(safe-area-inset-bottom))]">
            {actions}
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}

function EntryList({
  formId,
  entries,
  isEdit,
  pending,
  onUpdate,
  onRemove,
  onAdd,
}: {
  formId: string
  entries: EventDraft[]
  isEdit: boolean
  pending: boolean
  onUpdate: (key: string, patch: Partial<EventDraft>) => void
  onRemove: (key: string) => void
  onAdd: () => void
}) {
  const canRemove = !isEdit && entries.length > 1
  const canAdd = !isEdit && entries.length < MAX_ENTRIES

  return (
    <div className="flex flex-col gap-4">
      {entries.map((entry, index) => (
        <EntryCard
          key={entry.key}
          formId={formId}
          index={index}
          entry={entry}
          showIndex={!isEdit && entries.length > 1}
          canRemove={canRemove}
          pending={pending}
          onUpdate={onUpdate}
          onRemove={onRemove}
        />
      ))}
      {canAdd && (
        <Button
          type="button"
          variant="outline"
          onClick={onAdd}
          disabled={pending}
          className="self-start"
        >
          <HugeiconsIcon
            icon={PlusSignIcon}
            strokeWidth={2}
            data-icon="inline-start"
          />
          Thêm ngày
        </Button>
      )}
    </div>
  )
}

function EntryCard({
  formId,
  index,
  entry,
  showIndex,
  canRemove,
  pending,
  onUpdate,
  onRemove,
}: {
  formId: string
  index: number
  entry: EventDraft
  showIndex: boolean
  canRemove: boolean
  pending: boolean
  onUpdate: (key: string, patch: Partial<EventDraft>) => void
  onRemove: (key: string) => void
}) {
  const titleId = `${formId}-title-${entry.key}`
  const dayId = `${formId}-day-${entry.key}`
  const monthId = `${formId}-month-${entry.key}`
  const notesId = `${formId}-notes-${entry.key}`
  const nextOccurrence = nextOccurrences(
    { lunarDay: Number(entry.lunarDay), lunarMonth: Number(entry.lunarMonth) },
    solarToday(),
    1,
  )[0]

  return (
    <div className="flex flex-col gap-4 rounded-2xl ring-1 ring-foreground/10 p-4">
      {(showIndex || canRemove) && (
        <div className="flex items-center justify-between gap-2">
          {showIndex ? (
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Ngày giỗ {index + 1}
            </p>
          ) : (
            <span />
          )}
          {canRemove && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`Xóa ngày giỗ ${index + 1}`}
              onClick={() => onRemove(entry.key)}
              disabled={pending}
            >
              <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
            </Button>
          )}
        </div>
      )}
      <div className="flex flex-col gap-2">
        <Label htmlFor={titleId}>Tên sự kiện</Label>
        <Input
          id={titleId}
          value={entry.title}
          onChange={(e) => onUpdate(entry.key, { title: e.target.value })}
          placeholder="VD: Giỗ tổ, giỗ ông nội, giỗ bà ngoại…"
          required
          maxLength={120}
          disabled={pending}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor={dayId}>Ngày</Label>
          <Select
            items={dayItems}
            value={entry.lunarDay}
            onValueChange={(value) => {
              if (value != null) onUpdate(entry.key, { lunarDay: String(value) })
            }}
            disabled={pending}
          >
            <SelectTrigger id={dayId} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DAYS.map((day) => (
                <SelectItem key={day} value={day}>
                  {day}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor={monthId}>Tháng</Label>
          <Select
            items={monthItems}
            value={entry.lunarMonth}
            onValueChange={(value) => {
              if (value != null) onUpdate(entry.key, { lunarMonth: String(value) })
            }}
            disabled={pending}
          >
            <SelectTrigger id={monthId} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((month) => (
                <SelectItem key={month} value={month}>
                  {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor={notesId}>Ghi chú</Label>
        <Textarea
          id={notesId}
          value={entry.notes}
          onChange={(e) => onUpdate(entry.key, { notes: e.target.value })}
          placeholder="VD: Cúng vào buổi trưa, dâng hương ở nhà thờ…"
          maxLength={500}
          disabled={pending}
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
    </div>
  )
}
