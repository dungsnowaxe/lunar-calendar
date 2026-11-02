import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

import { cn } from "~/lib/utils";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export function BlurFade({
  children,
  className,
  delay = 0,
  yOffset = 8,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  yOffset?: number;
}) {
  const reduce = useReducedMotion();
  if (reduce) {
    return (
      <div className={className} style={{ animationDuration: "120ms" }}>
        {children}
      </div>
    );
  }
  return (
    <motion.div
      className={cn(className)}
      initial={{ opacity: 0, filter: "blur(6px)", y: yOffset }}
      animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
      transition={{ duration: 0.35, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}
