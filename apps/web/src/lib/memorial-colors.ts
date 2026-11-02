/** Memorial identity palette — 8 hues that sit with cream/lacquer. */

export const MEMORIAL_PALETTE = [
  "persimmon",
  "marigold",
  "olive",
  "jade",
  "indigo",
  "plum",
  "rose",
  "moss",
] as const;

export type MemorialColorId = (typeof MEMORIAL_PALETTE)[number];

/** FNV-1a 32-bit over the memorial id. */
function hashMemorialId(id: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < id.length; i++) {
    hash ^= id.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** Stable palette slot for a memorial id. Same id always maps to the same hue. */
export function memorialColor(id: string): MemorialColorId {
  return MEMORIAL_PALETTE[hashMemorialId(id) % MEMORIAL_PALETTE.length]!;
}

export function memorialColorCss(id: string): string {
  return `var(--color-mem-${memorialColor(id)})`;
}
