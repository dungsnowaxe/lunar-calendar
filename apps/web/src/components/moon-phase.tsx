import { useId } from "react";

import { cn } from "~/lib/utils";

/**
 * Luminous pale moon. Phase from lunar day (1≈new → 15≈full → 30≈new).
 * `face`: tiny closed-eye smile (empty states only).
 */
export function MoonPhase({
  lunarDay,
  size = 56,
  face = false,
  className,
}: {
  lunarDay: number;
  size?: number;
  face?: boolean;
  className?: string;
}) {
  const t = ((((lunarDay - 1) % 30) + 30) % 30) / 30;
  const illum = t <= 0.5 ? t * 2 : (1 - t) * 2;
  const isWaxing = t <= 0.5;

  const reactId = useId().replace(/:/g, "");
  const id = `m${reactId}`;
  const cx = 32;
  const cy = 32;
  const r = 25;
  const offset = illum * 2 * r;
  const shadowCx = isWaxing ? cx - offset : cx + offset;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={cn("shrink-0", className)}
      aria-hidden
      style={{ overflow: "visible" }}
    >
      <defs>
        <radialGradient id={`${id}-lit`} cx="34%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#fff8e8" />
          <stop offset="40%" stopColor="#f5e6c8" />
          <stop offset="100%" stopColor="#e8d4a8" />
        </radialGradient>
        <radialGradient id={`${id}-glow`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="oklch(0.95 0.06 90 / 0.5)" />
          <stop offset="100%" stopColor="oklch(0.9 0.05 85 / 0)" />
        </radialGradient>
        <clipPath id={`${id}-disk`}>
          <circle cx={cx} cy={cy} r={r} />
        </clipPath>
      </defs>

      <circle cx={cx} cy={cy} r={r + 6} fill={`url(#${id}-glow)`} />
      <circle cx={cx} cy={cy} r={r} fill={`url(#${id}-lit)`} />
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="oklch(0.72 0.04 80 / 0.35)"
        strokeWidth="0.75"
      />

      {illum < 0.995 && (
        <g clipPath={`url(#${id}-disk)`}>
          <circle cx={shadowCx} cy={cy} r={r + 0.2} fill="#5c534c" />
          <circle
            cx={shadowCx}
            cy={cy}
            r={r}
            fill="none"
            stroke="#6e655c"
            strokeWidth="2.5"
            opacity="0.4"
          />
        </g>
      )}

      <g clipPath={`url(#${id}-disk)`} opacity="0.5">
        <circle cx="23" cy="24" r="3" fill="none" stroke="#c4b08a" strokeWidth="1.1" />
        <circle cx="39" cy="33" r="2.1" fill="none" stroke="#c4b08a" strokeWidth="0.9" />
        <circle cx="29" cy="40" r="1.5" fill="none" stroke="#c4b08a" strokeWidth="0.8" />
        <circle cx="37" cy="22" r="1.2" fill="#d9c9a5" opacity="0.5" />
      </g>

      {illum > 0.15 && (
        <ellipse
          cx={isWaxing ? cx + r * 0.45 : cx - r * 0.45}
          cy={cy - r * 0.35}
          rx="4"
          ry="2.5"
          fill="white"
          opacity="0.55"
          clipPath={`url(#${id}-disk)`}
        />
      )}

      {face && (
        <g opacity="0.8">
          <path
            d="M22 29.5c1.6-2.2 5-2.2 6.6 0"
            fill="none"
            stroke="#5a4e42"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M35.5 29.5c1.6-2.2 5-2.2 6.6 0"
            fill="none"
            stroke="#5a4e42"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M28 37c2 2.4 6 2.4 8 0"
            fill="none"
            stroke="#5a4e42"
            strokeWidth="1.35"
            strokeLinecap="round"
          />
        </g>
      )}
    </svg>
  );
}
