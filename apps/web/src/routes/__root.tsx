/// <reference types="vite/client" />
import { HeadContent, Link, Outlet, Scripts, createRootRoute } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import * as React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Moon02Icon } from "@hugeicons/core-free-icons";
import { DefaultCatchBoundary } from "../components/DefaultCatchBoundary";
import { NotFound } from "../components/NotFound";
import { ThemeSwitch } from "~/components/theme-switch";
import { Toaster } from "../components/ui/sonner";
import appCss from "../styles/app.css?url";
import { seo } from "../utils/seo";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      ...seo({
        title: "Lịch Âm | Nhớ ngày giỗ, không bỏ lỡ",
        description:
          "Xem lịch âm Việt Nam, lưu ngày giỗ theo âm lịch và nhận nhắc dịp giỗ sắp tới mỗi năm.",
      }),
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  errorComponent: (props) => {
    return (
      <RootDocument>
        <DefaultCatchBoundary {...props} />
      </RootDocument>
    );
  },
  notFoundComponent: () => <NotFound />,
  component: RootComponent,
});

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  );
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        {/* Apply the stored theme (or the OS scheme) before first paint.
            Must mirror applyTheme() in theme-switch.tsx. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var t=localStorage.theme;if(t==='dark'||(t!=='light'&&matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark')}catch(e){}",
          }}
        />
        <div className="flex min-h-svh flex-col">
          <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
            <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 lg:px-6">
              <Link
                to="/"
                className="flex items-center gap-2 font-heading text-base font-semibold tracking-tight"
              >
                <HugeiconsIcon icon={Moon02Icon} className="size-5 text-primary" strokeWidth={2} />
                Lịch Âm
              </Link>
              <div className="flex items-center gap-2">
                <nav className="flex items-center gap-1">
                  <NavLink to="/">Lịch</NavLink>
                  <NavLink to="/su-kien">Sự kiện</NavLink>
                </nav>
                <ThemeSwitch />
              </div>
            </div>
          </header>
          {children}
        </div>
        <Toaster position="top-center" richColors />
        <TanStackRouterDevtools position="bottom-right" />
        <Scripts />
      </body>
    </html>
  );
}

function NavLink({ to, children }: { to: "/" | "/su-kien"; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      activeProps={{ className: "bg-muted text-foreground" }}
      activeOptions={{ exact: to === "/" }}
      className="rounded-4xl px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      {children}
    </Link>
  );
}
