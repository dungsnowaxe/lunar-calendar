import { useState } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { listEventsFn } from "~/server/events";
import { EventFormOverlay } from "~/components/event-form-overlay";
import { MonthCalendar } from "~/components/month-calendar";
import { TodayCard } from "~/components/today-card";
import { UpcomingEvents } from "~/components/upcoming-events";

export const Route = createFileRoute("/")({
  loader: () => listEventsFn(),
  component: HomePage,
});

function HomePage() {
  const router = useRouter();
  const events = Route.useLoaderData();
  const [formOpen, setFormOpen] = useState(false);

  return (
    <main className="mx-auto w-full almanac-home max-w-7xl flex-1 px-4 py-6 lg:px-8 lg:py-10">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-10">
        <MonthCalendar events={events} />
        <aside className="almanac-aside flex flex-col gap-6">
          <TodayCard />
          <UpcomingEvents events={events} onAdd={() => setFormOpen(true)} />
        </aside>
      </div>
      <EventFormOverlay
        open={formOpen}
        onOpenChange={setFormOpen}
        onSaved={() => router.invalidate()}
      />
    </main>
  );
}
