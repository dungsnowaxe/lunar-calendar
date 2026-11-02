import { cn } from "~/lib/utils";

type IconAttrs = { readonly [key: string]: string | number };
export type GlassIconNode = readonly [string, IconAttrs];

const ATTR_NAMES: Record<string, string> = {
  strokeWidth: "stroke-width",
  strokeLinecap: "stroke-linecap",
  strokeLinejoin: "stroke-linejoin",
  strokeDasharray: "stroke-dasharray",
  strokeDashoffset: "stroke-dashoffset",
  strokeMiterlimit: "stroke-miterlimit",
};

function attrName(key: string): string {
  return ATTR_NAMES[key] ?? key;
}

function nodesToSvg(nodes: readonly GlassIconNode[], strokeWidth: number): string {
  const body = nodes
    .map(([tag, attrs]) => {
      const parts: string[] = [];
      for (const [key, value] of Object.entries(attrs)) {
        if (key === "key" || key === "stroke" || key === "strokeWidth") continue;
        parts.push(`${attrName(key)}="${String(value)}"`);
      }
      return `<${tag} ${parts.join(" ")}/>`;
    })
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
}

export function glassMaskImage(nodes: readonly GlassIconNode[], strokeWidth = 2): string {
  return `url("data:image/svg+xml,${encodeURIComponent(nodesToSvg(nodes, strokeWidth))}")`;
}

/** CSS-mask icon. No <svg> in the DOM — Chromium skips backdrop snapshots for SVG descendants. */
export function GlassMaskIcon({
  nodes,
  className,
  strokeWidth = 2,
}: {
  nodes: readonly GlassIconNode[];
  className?: string;
  strokeWidth?: number;
}) {
  const mask = glassMaskImage(nodes, strokeWidth);
  return (
    <span
      aria-hidden
      className={cn("glass-mask-icon", className)}
      style={{ WebkitMaskImage: mask, maskImage: mask }}
    />
  );
}

export const ICON_CALENDAR_DAYS: readonly GlassIconNode[] = [
  ["path", { d: "M8 2v3" }],
  ["path", { d: "M16 2v3" }],
  ["rect", { x: "3", y: "3", width: "18", height: "18", rx: "2" }],
  ["path", { d: "M3 9h18" }],
  ["path", { d: "M8 13h.01" }],
  ["path", { d: "M12 13h.01" }],
  ["path", { d: "M16 13h.01" }],
  ["path", { d: "M8 17h.01" }],
  ["path", { d: "M12 17h.01" }],
  ["path", { d: "M16 17h.01" }],
];

export const ICON_HEART: readonly GlassIconNode[] = [
  [
    "path",
    {
      d: "M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5",
    },
  ],
];

export const ICON_SCISSORS: readonly GlassIconNode[] = [
  ["circle", { cx: "6", cy: "6", r: "3" }],
  ["path", { d: "M8.12 8.12 12 12" }],
  ["path", { d: "M20 4 8.12 15.88" }],
  ["circle", { cx: "6", cy: "18", r: "3" }],
  ["path", { d: "M14.8 14.8 20 20" }],
];

export const ICON_PLUS: readonly GlassIconNode[] = [
  ["path", { d: "M5 12h14" }],
  ["path", { d: "M12 5v14" }],
];
