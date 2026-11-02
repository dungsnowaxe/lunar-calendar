import { MoonPhase } from "~/components/moon-phase";
import { Button } from "~/components/ui/button";
import { COPY } from "~/lib/copy";
import { cn } from "~/lib/utils";

export function EmptyMemorials({
  variant,
  onAdd,
  className,
}: {
  variant: "page" | "mini";
  onAdd?: () => void;
  className?: string;
}) {
  if (variant === "mini") {
    return (
      <div className={cn("px-1 py-2 text-center", className)}>
        <MoonPhase lunarDay={15} size={48} face className="mx-auto mb-2" />
        <p className="text-[14px] font-medium text-[var(--ink)]">{COPY.emptyTitle}</p>
        <p className="mt-1 text-[13px] text-[var(--ink-muted)]">{COPY.emptyBodyMini}</p>
      </div>
    );
  }

  return (
    <div className={cn("paper-card mx-auto max-w-md border-dashed p-10 text-center", className)}>
      <MoonPhase lunarDay={8} size={72} face className="mx-auto mb-4" />
      <h2 className="font-heading text-xl font-semibold">{COPY.emptyTitle}</h2>
      <p className="mt-2 text-[14px] leading-relaxed text-[var(--ink-muted)]">{COPY.emptyBody}</p>
      {onAdd && (
        <Button className="mt-5 min-h-11 rounded-full" onClick={onAdd}>
          {COPY.emptyCta}
        </Button>
      )}
    </div>
  );
}
