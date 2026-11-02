import { Link, useRouterState } from "@tanstack/react-router";
import { CalendarDays, Heart, Scissors, type LucideIcon } from "lucide-react";

import { COPY } from "~/lib/copy";
import { cn } from "~/lib/utils";

const ITEMS: {
  to: "/" | "/su-kien" | "/ngay-tot-cat-toc";
  label: string;
  icon: LucideIcon;
  exact: boolean;
}[] = [
  { to: "/", label: COPY.navLich, icon: CalendarDays, exact: true },
  { to: "/su-kien", label: COPY.navSuKien, icon: Heart, exact: false },
  { to: "/ngay-tot-cat-toc", label: COPY.navNgayTot, icon: Scissors, exact: false },
];

function navIndex(pathname: string): number {
  const index = ITEMS.findIndex((item) =>
    item.exact ? pathname === item.to : pathname === item.to || pathname.startsWith(`${item.to}/`),
  );
  return index < 0 ? 0 : index;
}

export function MobileGlassNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const activeIndex = navIndex(pathname);

  return (
    <nav
      aria-label="Điều hướng di động"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[max(12px,env(safe-area-inset-bottom))] md:hidden"
    >
      <div className="glass-pill glass-pill-nav-mobile pointer-events-auto relative grid w-full max-w-sm grid-cols-3 gap-0.5 rounded-full p-1.5">
        <span
          aria-hidden
          className="glass-nav-bubble pointer-events-none absolute top-1.5 bottom-1.5 z-0 rounded-full"
          style={{
            left: 6,
            width: "calc((100% - 12px - 4px) / 3)",
            transform: `translateX(calc(${activeIndex} * (100% + 2px)))`,
          }}
        />
        {ITEMS.map((item, index) => {
          const Icon = item.icon;
          const isActive = index === activeIndex;
          return (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.exact }}
              activeProps={{ "aria-current": "page" }}
              className={cn(
                "glass-nav-item relative z-10 inline-flex h-12 min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5 rounded-full text-[11px] font-semibold",
                "focus-visible:ring-2 focus-visible:ring-[var(--lacquer)] focus-visible:outline-none",
                isActive && "is-active",
              )}
            >
              <Icon
                className={cn("h-5 w-5", isActive && "stroke-[2.25px]")}
                strokeWidth={isActive ? 2.25 : 2}
                aria-hidden
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
