import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { occurrenceInLunarYear, solarToJdn, solarToday, type SolarDate } from "@lunar/core";

import { DayDetail, TodayBloc } from "~/components/today-bloc";
import { MonthCalendar } from "~/components/month-calendar";
import { UpcomingEvents } from "~/components/upcoming-events";
import { BlurFade } from "~/components/magic/blur-fade";
import { Drawer, DrawerContent } from "~/components/ui/drawer";
import { useColoredMemorials } from "~/hooks/use-colored-memorials";
import { useIsDesktop } from "~/hooks/use-min-width";
import { COPY } from "~/lib/copy";
import { listEventsFn } from "~/server/events";

export const Route = createFileRoute("/")({
  loader: () => listEventsFn(),
  component: HomePage,
});

function HomePage() {
  const isDesktop = useIsDesktop();
  const rawEvents = Route.useLoaderData();
  const events = useColoredMemorials(rawEvents);
  const today = useMemo(() => solarToday(), []);
  const [cursor, setCursor] = useState({ year: today.year, month: today.month });
  const [selected, setSelected] = useState<SolarDate>(today);
  const [sheetOpen, setSheetOpen] = useState(false);

  const selectedMemorials = useMemo(() => {
    const jdn = solarToJdn(selected);
    return events.filter((event) => {
      for (let lunarYear = selected.year - 1; lunarYear <= selected.year + 1; lunarYear++) {
        const occurrence = occurrenceInLunarYear(
          { lunarDay: event.lunarDay, lunarMonth: event.lunarMonth },
          lunarYear,
        );
        if (occurrence && solarToJdn(occurrence) === jdn) return true;
      }
      return false;
    });
  }, [events, selected]);

  function selectDay(date: SolarDate) {
    setSelected(date);
    if (date.month !== cursor.month || date.year !== cursor.year) {
      setCursor({ year: date.year, month: date.month });
    }
    if (!isDesktop) setSheetOpen(true);
  }

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:px-6 md:py-8">
      <div className="grid items-start gap-6 lg:grid-cols-[1fr_340px] lg:gap-8">
        <BlurFade>
          <MonthCalendar
            events={events}
            cursor={cursor}
            selected={selected}
            onCursorChange={setCursor}
            onSelect={selectDay}
          />
        </BlurFade>

        <aside className="hidden flex-col gap-4 lg:flex">
          <BlurFade delay={0.05}>
            <DayDetail date={selected} memorials={selectedMemorials} />
          </BlurFade>
          <BlurFade delay={0.1}>
            <UpcomingEvents events={events} layout="desktop" />
          </BlurFade>
        </aside>
      </div>

      <div className="mt-5 space-y-4 lg:hidden">
        <BlurFade delay={0.05}>
          <TodayBloc date={today} compact />
        </BlurFade>
        <BlurFade delay={0.1}>
          <UpcomingEvents events={events} layout="mobile" />
        </BlurFade>
      </div>

      <Drawer open={sheetOpen} onOpenChange={setSheetOpen}>
        <DrawerContent showCloseButton>
          <span className="sr-only">{COPY.daySelected}</span>
          <div className="pr-10">
            <DayDetail date={selected} memorials={selectedMemorials} bare />
          </div>
        </DrawerContent>
      </Drawer>
    </main>
  );
}
