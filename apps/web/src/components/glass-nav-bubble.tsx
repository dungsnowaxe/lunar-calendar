/** Sliding active chip shared by the mobile nav and the theme pill. */
export function GlassNavBubble({
  activeIndex,
  insetPx,
  gapPx = 2,
  count = 3,
}: {
  activeIndex: number;
  insetPx: number;
  gapPx?: number;
  count?: number;
}) {
  const gaps = (count - 1) * gapPx;
  return (
    <span
      aria-hidden
      className="glass-nav-bubble pointer-events-none absolute z-[1] rounded-full"
      style={{
        top: insetPx,
        bottom: insetPx,
        left: insetPx,
        width: `calc((100% - ${insetPx * 2}px - ${gaps}px) / ${count})`,
        transform: `translateX(calc(${activeIndex} * (100% + ${gapPx}px)))`,
      }}
    />
  );
}
