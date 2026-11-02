import { Link } from "@tanstack/react-router";
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

export function MobileGlassNav() {
  return (
    <nav
      aria-label="Điều hướng di động"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[max(12px,env(safe-area-inset-bottom))] md:hidden"
    >
      <div className="glass-pill glass-pill-nav-mobile pointer-events-auto flex w-full max-w-sm items-center gap-1 rounded-full p-1.5">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.exact }}
              activeProps={{
                className: "text-[var(--lacquer)] font-semibold",
                "aria-current": "page",
              }}
              className={cn(
                "relative flex min-h-[44px] min-w-[44px] flex-1 flex-col items-center justify-center gap-0.5 rounded-full pt-1 pb-2.5",
                "text-[11px] font-medium text-[var(--ink-muted)] transition-colors duration-200",
                "hover:text-[var(--ink)] focus-visible:ring-2 focus-visible:ring-[var(--lacquer)] focus-visible:outline-none",
              )}
            >
              <Icon className="size-5" strokeWidth={2} aria-hidden />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
