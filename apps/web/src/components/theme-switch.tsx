import { useEffect, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { MonitorIcon, Moon02Icon, Sun03Icon } from "@hugeicons/core-free-icons";
import { cn } from "~/lib/utils";

type Theme = "light" | "dark" | "system";

const OPTIONS: { value: Theme; label: string; icon: typeof Sun03Icon }[] = [
  { value: "light", label: "Sáng", icon: Sun03Icon },
  { value: "dark", label: "Tối", icon: Moon02Icon },
  { value: "system", label: "Theo hệ thống", icon: MonitorIcon },
];

/** Mirrors the pre-paint script in __root.tsx. */
function applyTheme(theme: Theme) {
  const dark =
    theme === "dark" ||
    (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
}

export function ThemeSwitch() {
  const [theme, setTheme] = useState<Theme>("system");

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    // Read after mount: localStorage is unavailable during SSR, so a lazy
    // state initializer would crash the server render.
    // oxlint-disable-next-line react/set-state-in-effect
    setTheme(stored === "light" || stored === "dark" ? stored : "system");
  }, []);

  // Keep following the OS while in system mode.
  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme]);

  return (
    <div
      // role="group" is the correct ARIA for a button segmented control;
      // <fieldset> would add form semantics and default browser styles.
      // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role
      role="group"
      aria-label="Chế độ giao diện"
      className="flex items-center gap-0.5 rounded-4xl bg-muted p-0.5"
    >
      {OPTIONS.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          aria-label={label}
          title={label}
          aria-pressed={theme === value}
          onClick={() => {
            setTheme(value);
            localStorage.setItem("theme", value);
            applyTheme(value);
          }}
          className={cn(
            "flex size-7 items-center justify-center rounded-4xl text-muted-foreground transition-colors hover:text-foreground",
            theme === value && "bg-background text-foreground shadow-sm",
          )}
        >
          <HugeiconsIcon icon={Icon} className="size-4" strokeWidth={2} />
        </button>
      ))}
    </div>
  );
}
