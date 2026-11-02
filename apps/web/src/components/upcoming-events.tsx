import { Plus } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";

import { EmptyMemorials } from "~/components/empty-memorials";
import { MemorialRow } from "~/components/memorial-ticket";
import { buttonVariants } from "~/components/ui/button";
import { COPY } from "~/lib/copy";
import type { ColoredMemorial } from "~/lib/memorial-colors";
import { sortByNextOccurrence } from "~/lib/memorial-sort";
import { solarToday } from "@lunar/core";
import { cn } from "~/lib/utils";

interface UpcomingEventsProps {
  events: ColoredMemorial[];
  count?: number;
  layout: "desktop" | "mobile";
}

export function UpcomingEvents({ events, count = 5, layout }: UpcomingEventsProps) {
  const today = solarToday();
  const upcoming = sortByNextOccurrence(events, today).slice(0, count);
  const navigate = useNavigate();

  if (layout === "desktop") {
    return (
      <section className="paper-card p-4 sm:p-5">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="font-heading text-lg font-semibold whitespace-nowrap">
            {COPY.upcomingTitle}
          </h3>
          <Link
            to="/su-kien"
            search={{ add: "1" }}
            aria-label={COPY.addMemorial}
            title={COPY.addMemorial}
            className={cn(
              buttonVariants({ size: "icon-lg" }),
              "size-[44px] min-h-[44px] min-w-[44px] shrink-0 rounded-full",
            )}
          >
            <Plus className="size-4" />
          </Link>
        </div>
        {upcoming.length === 0 ? (
          <EmptyMemorials variant="mini" />
        ) : (
          <ul className="flex flex-col gap-2">
            {upcoming.map((event) => (
              <li key={event.id}>
                <MemorialRow event={event} onClick={() => navigate({ to: "/su-kien" })} />
              </li>
            ))}
          </ul>
        )}
      </section>
    );
  }

  return (
    <section>
      <h3 className="mb-3 font-heading text-lg font-semibold">{COPY.upcomingTitle}</h3>
      {upcoming.length === 0 ? (
        <EmptyMemorials variant="mini" />
      ) : (
        <ul className="flex flex-col gap-2">
          {upcoming.map((event) => (
            <li key={event.id}>
              <MemorialRow event={event} onClick={() => navigate({ to: "/su-kien" })} />
            </li>
          ))}
        </ul>
      )}
      <Link
        to="/su-kien"
        search={{ add: "1" }}
        className={cn(buttonVariants(), "mt-4 flex min-h-[44px] w-full rounded-full")}
      >
        {COPY.addMemorialButton}
      </Link>
    </section>
  );
}
