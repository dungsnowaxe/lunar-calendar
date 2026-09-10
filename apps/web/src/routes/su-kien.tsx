import { useState } from 'react'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { toast } from 'sonner'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  CakeIcon,
  Delete02Icon,
  Edit02Icon,
  PlusSignIcon,
} from '@hugeicons/core-free-icons'
import { formatSolar, nextOccurrences, solarToday } from '@lunar/core'
import { deleteEventFn, listEventsFn, type MemorialEvent } from '~/server/events'
import { EventFormDialog } from '~/components/event-form-dialog'
import { daysBetween, daysUntilLabel, eventRuleLabel } from '~/lib/labels'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '~/components/ui/alert-dialog'
import { Button } from '~/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'

export const Route = createFileRoute('/su-kien')({
  loader: () => listEventsFn(),
  component: EventsPage,
})

function EventsPage() {
  const router = useRouter()
  const events = Route.useLoaderData()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<MemorialEvent | undefined>(undefined)

  function refresh() {
    return router.invalidate()
  }

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 lg:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-xl font-semibold">Sự kiện giỗ</h1>
          <p className="text-sm text-muted-foreground">
            Lưu theo ngày âm lịch — ngày dương lịch được tính tự động mỗi năm.
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <HugeiconsIcon
            icon={PlusSignIcon}
            strokeWidth={2}
            data-icon="inline-start"
          />
          Thêm sự kiện
        </Button>
      </div>

      {events.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <HugeiconsIcon
              icon={CakeIcon}
              className="size-8 text-muted-foreground"
              strokeWidth={1.5}
            />
            <p className="text-sm text-muted-foreground">
              Chưa có sự kiện nào. Thêm ngày giỗ đầu tiên của gia đình bạn.
            </p>
            <Button variant="outline" onClick={() => setFormOpen(true)}>
              <HugeiconsIcon
                icon={PlusSignIcon}
                strokeWidth={2}
                data-icon="inline-start"
              />
              Thêm sự kiện
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onEdit={() => {
                setEditing(event)
                setFormOpen(true)
              }}
            />
          ))}
        </div>
      )}

      <EventFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        event={editing}
        onSaved={refresh}
      />
    </main>
  )
}

function EventCard({
  event,
  onEdit,
}: {
  event: MemorialEvent
  onEdit: () => void
}) {
  const router = useRouter()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const today = solarToday()
  const upcoming = nextOccurrences(
    { lunarDay: event.lunarDay, lunarMonth: event.lunarMonth },
    today,
    3,
  )

  async function handleDelete() {
    let result: { error?: string }
    try {
      result = await deleteEventFn({ data: event.id })
    } catch {
      toast.error('Không thể kết nối máy chủ. Vui lòng thử lại.')
      return
    }
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success(`Đã xóa "${event.title}"`)
    setConfirmOpen(false)
    await router.invalidate()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HugeiconsIcon
            icon={CakeIcon}
            className="size-4 shrink-0 text-primary"
            strokeWidth={2}
          />
          <span className="truncate">{event.title}</span>
        </CardTitle>
        <CardDescription>{eventRuleLabel(event)}</CardDescription>
        <CardAction>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Sửa ${event.title}`}
              onClick={onEdit}
            >
              <HugeiconsIcon icon={Edit02Icon} strokeWidth={2} />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Xóa ${event.title}`}
              onClick={() => setConfirmOpen(true)}
            >
              <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
            </Button>
          </div>
        </CardAction>
      </CardHeader>
      <CardContent>
        <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Ba lần tới
        </p>
        <ul className="flex flex-wrap gap-2">
          {upcoming.map((date) => {
            const days = daysBetween(today, date)
            return (
              <li
                key={`${date.day}-${date.month}-${date.year}`}
                className="rounded-xl bg-muted/60 px-2.5 py-1 text-xs"
              >
                {formatSolar(date)}
                <span className="ml-1.5 text-muted-foreground">
                  ({daysUntilLabel(days)})
                </span>
              </li>
            )
          })}
        </ul>
        {event.notes && (
          <p className="mt-3 text-sm text-muted-foreground">{event.notes}</p>
        )}
      </CardContent>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa sự kiện?</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xóa "{event.title}"? Thao tác này không thể hoàn
              tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Giữ lại</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
