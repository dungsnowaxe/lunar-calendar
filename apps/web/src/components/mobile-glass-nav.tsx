import { Link, useRouterState } from "@tanstack/react-router";

import {
  GlassMaskIcon,
  ICON_CALENDAR_DAYS,
  ICON_HEART,
  ICON_PLUS,
  ICON_SCISSORS,
  type GlassIconNode,
} from "~/components/glass-mask-icon";
import { GlassNavBubble } from "~/components/glass-nav-bubble";
import { FAB_OBSTRUCT_SELECTOR, useFabScrollVisibility } from "~/hooks/use-fab-scroll-visibility";
import { COPY } from "~/lib/copy";
import { cn } from "~/lib/utils";

const ITEMS: {
  to: "/" | "/su-kien" | "/ngay-tot-cat-toc";
  label: string;
  icon: readonly GlassIconNode[];
  exact: boolean;
}[] = [
  { to: "/", label: COPY.navLich, icon: ICON_CALENDAR_DAYS, exact: true },
  { to: "/su-kien", label: COPY.navSuKien, icon: ICON_HEART, exact: false },
  { to: "/ngay-tot-cat-toc", label: COPY.navNgayTot, icon: ICON_SCISSORS, exact: false },
];

function navIndex(pathname: string): number {
  const index = ITEMS.findIndex((item) =>
    item.exact ? pathname === item.to : pathname === item.to || pathname.startsWith(`${item.to}/`),
  );
  return index < 0 ? 0 : index;
}

function showsAddFab(pathname: string): boolean {
  return pathname === "/" || pathname === "/su-kien" || pathname.startsWith("/su-kien/");
}

export function MobileGlassNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const activeIndex = navIndex(pathname);
  const fabVisible = useFabScrollVisibility();
  const showFab = showsAddFab(pathname);

  return (
    <nav
      aria-label="Điều hướng di động"
      data-fab-obstruct-selector={FAB_OBSTRUCT_SELECTOR}
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[max(12px,env(safe-area-inset-bottom))] md:hidden"
    >
      <div className="relative w-full max-w-sm">
        {showFab ? (
          <div className="glass-fab-slot md:hidden" data-fab-slot>
            <Link
              to="/su-kien"
              search={{ add: "1" }}
              aria-label={COPY.addMemorial}
              aria-hidden={!fabVisible}
              tabIndex={fabVisible ? 0 : -1}
              data-fab-visible={fabVisible ? "1" : "0"}
              className={cn(
                "glass-fab flex size-[56px] min-h-[56px] min-w-[56px] items-center justify-center rounded-full",
                !fabVisible && "is-fab-hidden",
              )}
            >
              <span aria-hidden className="glass-refract-rim" />
              <GlassMaskIcon nodes={ICON_PLUS} className="h-6 w-6" strokeWidth={2.6} />
            </Link>
          </div>
        ) : null}
        <div className="glass-pill glass-pill-nav-mobile pointer-events-auto relative grid w-full grid-cols-3 gap-0.5 rounded-full p-1.5">
          <span aria-hidden className="glass-refract-rim" />
          <GlassNavBubble activeIndex={activeIndex} insetPx={6} />
          {ITEMS.map((item, index) => {
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
                <GlassMaskIcon
                  nodes={item.icon}
                  className="h-5 w-5"
                  strokeWidth={isActive ? 2.25 : 2}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
