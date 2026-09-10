import { createFileRoute } from '@tanstack/react-router'
import { listEventsFn } from '~/server/events'
import { MonthCalendar } from '~/components/month-calendar'
import { TodayCard } from '~/components/today-card'
import { UpcomingEvents } from '~/components/upcoming-events'

export const Route = createFileRoute('/')({
  loader: () => listEventsFn(),
  component: HomePage,
})

function HomePage() {
  const events = Route.useLoaderData()

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 lg:px-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <MonthCalendar events={events} />
        <aside className="flex flex-col gap-6">
          <TodayCard />
          <UpcomingEvents events={events} />
        </aside>
      </div>
    </main>
  )
}
