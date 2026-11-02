import { useState } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { z } from "zod";
import { solarToday } from "@lunar/core";

import { EmptyMemorials } from "~/components/empty-memorials";
import { EventFormOverlay } from "~/components/event-form-overlay";
import { MemorialTicket } from "~/components/memorial-ticket";
import { BlurFade } from "~/components/magic/blur-fade";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import { Button } from "~/components/ui/button";
import { COPY, deleteBody } from "~/lib/copy";
import { useColoredMemorials } from "~/hooks/use-colored-memorials";
import { sortByNextOccurrence } from "~/lib/memorial-sort";
import { deleteEventFn, listEventsFn } from "~/server/events";
import type { ColoredMemorial } from "~/lib/memorial-colors";

export const Route = createFileRoute("/su-kien")({
  validateSearch: z.object({
    add: z.string().optional(),
  }),
  loader: () => listEventsFn(),
  component: EventsPage,
});

function EventsPage() {
  const router = useRouter();
  const { add } = Route.useSearch();
  const navigate = Route.useNavigate();
  const rawEvents = Route.useLoaderData();
  const events = useColoredMemorials(rawEvents);
  const sorted = sortByNextOccurrence(events, solarToday());
  const [formOpen, setFormOpen] = useState(add === "1");
  const [editing, setEditing] = useState<ColoredMemorial | undefined>(undefined);
  const [deleting, setDeleting] = useState<ColoredMemorial | undefined>(undefined);

  function refresh() {
    return router.invalidate();
  }

  function openCreate() {
    setEditing(undefined);
    setFormOpen(true);
  }

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 md:px-6 md:py-8">
      <BlurFade>
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-heading text-3xl font-semibold text-[var(--ink)] sm:text-4xl">
              {COPY.eventsTitle}
            </h1>
            <p className="mt-1.5 max-w-md text-[14px] text-[var(--ink-muted)]">
              {COPY.eventsSubtitle}
            </p>
          </div>
          <Button className="min-h-[44px] rounded-full" onClick={openCreate}>
            <Plus className="size-4" /> {COPY.addEventLabel}
          </Button>
        </div>
      </BlurFade>

      {sorted.length === 0 ? (
        <BlurFade delay={0.05}>
          <EmptyMemorials variant="page" onAdd={openCreate} />
        </BlurFade>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {sorted.map((event, index) => (
            <BlurFade key={event.id} delay={0.04 * Math.min(index, 6)}>
              <MemorialTicket
                event={event}
                onEdit={() => {
                  setEditing(event);
                  setFormOpen(true);
                }}
                onDelete={() => setDeleting(event)}
              />
            </BlurFade>
          ))}
        </div>
      )}

      <EventFormOverlay
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) {
            setEditing(undefined);
            if (add === "1") void navigate({ search: {}, replace: true });
          }
        }}
        event={editing}
        usedColors={events.map((event) => event.colorId)}
        onSaved={refresh}
      />

      <DeleteConfirm event={deleting} onClose={() => setDeleting(undefined)} onDeleted={refresh} />
    </main>
  );
}

function DeleteConfirm({
  event,
  onClose,
  onDeleted,
}: {
  event: ColoredMemorial | undefined;
  onClose: () => void;
  onDeleted: () => void | Promise<void>;
}) {
  async function handleDelete() {
    if (!event) return;
    let result: { error?: string };
    try {
      result = await deleteEventFn({ data: event.id });
    } catch {
      toast.error("Không thể kết nối máy chủ. Vui lòng thử lại.");
      return;
    }
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(`Đã xóa "${event.title}"`);
    onClose();
    await onDeleted();
  }

  return (
    <AlertDialog open={!!event} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className="rounded-[28px] bg-[var(--cream-elevated)]">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-heading">{COPY.deleteTitle}</AlertDialogTitle>
          <AlertDialogDescription>{event ? deleteBody(event.title) : ""}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="min-h-[44px] rounded-full">
            {COPY.deleteCancel}
          </AlertDialogCancel>
          <AlertDialogAction className="min-h-[44px] rounded-full" onClick={handleDelete}>
            {COPY.deleteConfirm}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
