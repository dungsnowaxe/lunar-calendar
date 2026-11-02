import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { Check, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "~/components/ui/drawer";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Textarea } from "~/components/ui/textarea";
import { useIsMd } from "~/hooks/use-min-width";
import { COPY } from "~/lib/copy";
import {
  MEMORIAL_COLORS,
  memorialColorCss,
  nextUnusedMemorialColor,
  type MemorialColorId,
} from "~/lib/memorial-colors";
import { cn } from "~/lib/utils";
import { createEventsFn, updateEventFn } from "~/server/events";

interface EventFormOverlayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event?: {
    id: string;
    title: string;
    lunarDay: number;
    lunarMonth: number;
    notes: string | null;
    colorId: MemorialColorId;
  };
  usedColors: MemorialColorId[];
  onSaved: () => void | Promise<void>;
}

type DateRow = { key: string; lunarDay: string; lunarMonth: string };

const DAYS = Array.from({ length: 30 }, (_, i) => String(i + 1));
const MONTHS = Array.from({ length: 12 }, (_, i) => String(i + 1));
const MAX_DATES = 10;
const DEFAULT_DAY = "10";
const DEFAULT_MONTH = "1";
const dayItems: Record<string, string> = Object.fromEntries(DAYS.map((day) => [day, day]));
const monthItems: Record<string, string> = Object.fromEntries(
  MONTHS.map((month) => [month, month]),
);

let rowKey = 0;
function newDateRow(day = DEFAULT_DAY, month = DEFAULT_MONTH): DateRow {
  rowKey += 1;
  return { key: String(rowKey), lunarDay: day, lunarMonth: month };
}

export function EventFormOverlay({
  open,
  onOpenChange,
  event,
  usedColors,
  onSaved,
}: EventFormOverlayProps) {
  const isMd = useIsMd();
  const formId = useId();
  const isEdit = event != null;

  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [colorId, setColorId] = useState<MemorialColorId>(
    () => event?.colorId ?? nextUnusedMemorialColor(usedColors),
  );
  const [dates, setDates] = useState<DateRow[]>(() => [newDateRow()]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pendingRef = useRef(false);
  const saveIdRef = useRef(0);

  function setSavePending(next: boolean) {
    pendingRef.current = next;
    setPending(next);
  }

  function resetForm() {
    saveIdRef.current += 1;
    setTitle("");
    setNotes("");
    setColorId(nextUnusedMemorialColor(usedColors));
    setDates([newDateRow()]);
    setSavePending(false);
    setError(null);
  }

  useEffect(() => {
    if (!open) return;
    saveIdRef.current += 1;
    // Re-seed the draft each time the dialog opens.
    // oxlint-disable-next-line react/set-state-in-effect
    setTitle(event?.title ?? "");
    setNotes(event?.notes ?? "");
    setColorId(
      event?.colorId ??
        nextUnusedMemorialColor(
          event ? usedColors.filter((id) => id !== event.colorId) : usedColors,
        ),
    );
    setDates(
      event ? [newDateRow(String(event.lunarDay), String(event.lunarMonth))] : [newDateRow()],
    );
    setSavePending(false);
    setError(null);
  }, [open, event, usedColors]);

  function handleOpenChange(next: boolean, eventDetails?: { cancel: () => void }) {
    if (!next && pendingRef.current) {
      eventDetails?.cancel();
      return;
    }
    if (!next) resetForm();
    onOpenChange(next);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const saveId = ++saveIdRef.current;
    setSavePending(true);
    setError(null);

    const used: MemorialColorId[] = [...usedColors];
    const payloads = dates.map((row, index) => {
      const assigned = index === 0 ? colorId : nextUnusedMemorialColor(used);
      used.push(assigned);
      return {
        title,
        lunarDay: Number(row.lunarDay),
        lunarMonth: Number(row.lunarMonth),
        notes: notes || null,
        colorId: assigned,
      };
    });

    let result:
      | Awaited<ReturnType<typeof updateEventFn>>
      | Awaited<ReturnType<typeof createEventsFn>>;
    try {
      result = isEdit
        ? await updateEventFn({
            data: { ...payloads[0]!, id: event.id },
          })
        : await createEventsFn({ data: payloads });
    } catch {
      if (saveId !== saveIdRef.current) return;
      setSavePending(false);
      setError("Không thể kết nối máy chủ. Vui lòng thử lại.");
      return;
    }
    if (saveId !== saveIdRef.current) return;
    setSavePending(false);
    if ("error" in result && result.error) {
      setError(result.error);
      return;
    }
    const count = dates.length;
    toast.success(
      isEdit ? "Đã cập nhật sự kiện" : count > 1 ? `Đã thêm ${count} sự kiện` : "Đã thêm sự kiện",
    );
    handleOpenChange(false);
    await onSaved();
  }

  const saveLabel = pending ? "Đang lưu…" : isEdit ? COPY.saveEdit : COPY.saveAdd;

  const heading = isEdit ? COPY.formEditTitle : COPY.formAddTitle;
  const fields = (
    <FormFields
      formId={formId}
      isEdit={isEdit}
      pending={pending}
      title={title}
      notes={notes}
      colorId={colorId}
      dates={dates}
      onTitle={setTitle}
      onNotes={setNotes}
      onColor={setColorId}
      onDates={setDates}
    />
  );
  const actions = (
    <>
      <Button
        type="button"
        variant="outline"
        className="min-h-11 rounded-full"
        onClick={() => handleOpenChange(false)}
        disabled={pending}
      >
        {COPY.cancel}
      </Button>
      <Button
        type="submit"
        form={formId}
        className="min-h-11 rounded-full"
        disabled={pending || !title.trim()}
      >
        {saveLabel}
      </Button>
    </>
  );

  if (isMd) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange} disablePointerDismissal={pending}>
        <DialogContent
          className="max-h-[85vh] max-w-lg overflow-y-auto rounded-[28px] bg-[var(--cream-elevated)] sm:max-w-lg"
          showCloseButton={!pending}
        >
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">{heading}</DialogTitle>
            <DialogDescription>{COPY.formHelp}</DialogDescription>
          </DialogHeader>
          <form id={formId} onSubmit={handleSubmit} className="flex flex-col gap-4">
            {fields}
            {error && <p className="text-sm text-destructive">{error}</p>}
            <DialogFooter>{actions}</DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={handleOpenChange} disablePointerDismissal={pending}>
      <DrawerContent className="flex max-h-[90dvh] flex-col gap-0" showCloseButton={!pending}>
        <DrawerHeader className="shrink-0 pr-12">
          <DrawerTitle>{heading}</DrawerTitle>
          <DrawerDescription>{COPY.formHelp}</DrawerDescription>
        </DrawerHeader>
        <form id={formId} onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-2">{fields}</div>
          {error && <p className="shrink-0 px-5 pb-2 text-sm text-destructive">{error}</p>}
          <DrawerFooter className="shrink-0 sm:flex-row sm:justify-end">{actions}</DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  );
}

function FormFields({
  formId,
  isEdit,
  pending,
  title,
  notes,
  colorId,
  dates,
  onTitle,
  onNotes,
  onColor,
  onDates,
}: {
  formId: string;
  isEdit: boolean;
  pending: boolean;
  title: string;
  notes: string;
  colorId: MemorialColorId;
  dates: DateRow[];
  onTitle: (value: string) => void;
  onNotes: (value: string) => void;
  onColor: (value: MemorialColorId) => void;
  onDates: (value: DateRow[]) => void;
}) {
  const titleId = `${formId}-title`;
  const notesId = `${formId}-notes`;
  const colorLabelId = `${formId}-mau`;
  const canAdd = !isEdit && dates.length < MAX_DATES;

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor={titleId} className="mb-1.5">
          {COPY.nameLabel}
        </Label>
        <Input
          id={titleId}
          value={title}
          onChange={(e) => onTitle(e.target.value)}
          placeholder={COPY.namePlaceholder}
          required
          maxLength={120}
          disabled={pending}
          className="h-11 rounded-full"
        />
      </div>

      <div>
        <p id={colorLabelId} className="mb-1.5 text-[13px] font-medium text-[var(--ink)]">
          {COPY.colorLabel}
        </p>
        <div role="radiogroup" aria-labelledby={colorLabelId} className="flex flex-wrap gap-1">
          {MEMORIAL_COLORS.map((color) => {
            const selected = colorId === color.id;
            return (
              <button
                key={color.id}
                type="button"
                // Color swatches are a radiogroup of round chips, not native radios.
                // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role
                role="radio"
                aria-checked={selected}
                aria-label={color.label}
                title={color.label}
                disabled={pending}
                onClick={() => onColor(color.id)}
                className={cn(
                  "relative flex size-11 items-center justify-center rounded-full transition-transform duration-150",
                  "focus-visible:ring-2 focus-visible:ring-[var(--lacquer)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--cream-elevated)] focus-visible:outline-none",
                  selected && "scale-105",
                )}
              >
                <span
                  className="h-7 w-7 rounded-full shadow-sm"
                  style={{
                    background: memorialColorCss(color.id),
                    boxShadow: selected
                      ? `0 0 0 2px var(--cream-elevated), 0 0 0 3.5px ${memorialColorCss(color.id)}`
                      : undefined,
                  }}
                />
                {selected && (
                  <Check
                    className="absolute size-3.5 text-white drop-shadow"
                    strokeWidth={3}
                    aria-hidden
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {dates.map((row, index) => (
        <div
          key={row.key}
          className="space-y-3 rounded-[20px] border border-[var(--border-warm)] p-3"
        >
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-medium">
              {COPY.lunarBlock}
              {dates.length > 1 ? ` #${index + 1}` : ""}
            </p>
            {dates.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-11"
                aria-label="Xóa ngày"
                disabled={pending}
                onClick={() => onDates(dates.filter((item) => item.key !== row.key))}
              >
                <Trash2 className="size-4" />
              </Button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <Label htmlFor={`${formId}-day-${row.key}`}>{COPY.dayLabel}</Label>
              <Select
                items={dayItems}
                value={row.lunarDay}
                onValueChange={(value) => {
                  if (value == null) return;
                  onDates(
                    dates.map((item) =>
                      item.key === row.key ? { ...item, lunarDay: String(value) } : item,
                    ),
                  );
                }}
                disabled={pending}
              >
                <SelectTrigger id={`${formId}-day-${row.key}`} className="h-11 w-full rounded-full">
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
            <div className="flex flex-col gap-1">
              <Label htmlFor={`${formId}-month-${row.key}`}>{COPY.monthLabel}</Label>
              <Select
                items={monthItems}
                value={row.lunarMonth}
                onValueChange={(value) => {
                  if (value == null) return;
                  onDates(
                    dates.map((item) =>
                      item.key === row.key ? { ...item, lunarMonth: String(value) } : item,
                    ),
                  );
                }}
                disabled={pending}
              >
                <SelectTrigger
                  id={`${formId}-month-${row.key}`}
                  className="h-11 w-full rounded-full"
                >
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
          <p className="text-[12px] text-[var(--ink-muted)]">{COPY.autoNextHint}</p>
        </div>
      ))}

      {canAdd && (
        <Button
          type="button"
          variant="outline"
          className="min-h-11 w-full rounded-full"
          disabled={pending}
          onClick={() => onDates([...dates, newDateRow()])}
        >
          <Plus className="size-4" /> {COPY.addDateLabel}
        </Button>
      )}

      <div>
        <Label htmlFor={notesId} className="mb-1.5">
          {COPY.noteLabel}
        </Label>
        <Textarea
          id={notesId}
          value={notes}
          onChange={(e) => onNotes(e.target.value)}
          placeholder={COPY.notePlaceholder}
          maxLength={500}
          disabled={pending}
          className="rounded-[20px]"
        />
      </div>
    </div>
  );
}
