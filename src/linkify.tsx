import { openUrl } from '@tauri-apps/plugin-opener'
import type { ReactNode } from 'react'

/** Open a URL in the system browser (Tauri), with a plain-web fallback. */
export async function openExternal(url: string) {
  try {
    await openUrl(url)
  } catch {
    window.open(url, '_blank', 'noopener,noreferrer')
  }
}

const URL_RE = /(https?:\/\/[^\s]+)/g
const TRAIL_RE = /[.,;:!?)\]}»"'…]+$/

/** Render text with clickable links. Link clicks don't bubble to the row. */
export function Linkify({ text }: { text: string }): ReactNode {
  const out: ReactNode[] = []
  let last = 0
  let key = 0
  let m: RegExpExecArray | null
  URL_RE.lastIndex = 0
  while ((m = URL_RE.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index))
    let url = m[0]
    let trail = ''
    const tm = url.match(TRAIL_RE)
    if (tm) {
      trail = tm[0]
      url = url.slice(0, -trail.length)
    }
    out.push(
      <a
        key={key++}
        href={url}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          openExternal(url)
        }}
        className="text-[var(--color-accent)] underline decoration-[color-mix(in_srgb,var(--color-accent)_45%,transparent)] underline-offset-2 hover:decoration-[var(--color-accent)]"
      >
        {url}
      </a>,
    )
    if (trail) out.push(trail)
    last = m.index + m[0].length
  }
  if (last < text.length) out.push(text.slice(last))
  return <>{out}</>
}
