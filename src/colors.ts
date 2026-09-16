import type { ColorKey } from './types'

/** Solid dot / accent color per project color key. */
export const DOT: Record<ColorKey, string> = {
  slate: '#64748b',
  red: '#ef4444',
  orange: '#f97316',
  amber: '#f59e0b',
  yellow: '#eab308',
  lime: '#84cc16',
  green: '#22c55e',
  emerald: '#10b981',
  teal: '#14b8a6',
  cyan: '#06b6d4',
  sky: '#0ea5e9',
  blue: '#3b82f6',
  indigo: '#6366f1',
  violet: '#8b5cf6',
  purple: '#a855f7',
  fuchsia: '#d946ef',
  pink: '#ec4899',
  rose: '#f43f5e',
}

export const COLOR_KEYS = Object.keys(DOT) as ColorKey[]

/** Chip background (translucent) — works over light or dark panels. */
export function chipBg(c: ColorKey): string {
  return `color-mix(in srgb, ${DOT[c]} 15%, transparent)`
}

/** Readable chip text tint. */
export function chipText(c: ColorKey): string {
  return `color-mix(in srgb, ${DOT[c]} 78%, var(--color-ink))`
}
