export interface ImportedTask {
  title: string
  notes?: string
  done: boolean
  completedAt?: number
  createdAt?: number
}

export interface ImportedList {
  name: string
  tasks: ImportedTask[]
}

/* eslint-disable @typescript-eslint/no-explicit-any */

function num(d: unknown): number | undefined {
  if (typeof d !== 'string') return undefined
  const t = Date.parse(d)
  return Number.isNaN(t) ? undefined : t
}

function parseTask(t: any): ImportedTask | null {
  const title = (t?.title ?? '').toString().trim()
  if (!title) return null
  return {
    title: (t.parent ? '↳ ' : '') + title,
    notes: t.notes ? String(t.notes).trim() || undefined : undefined,
    done: t.status === 'completed' || t.completed != null,
    completedAt: num(t.completed),
    createdAt: num(t.updated) ?? num(t.created),
  }
}

/**
 * Parse a Google Takeout "Tasks.json" export (tolerant of a few shapes):
 *  - { items: [ { title, items: [...tasks] } ] }
 *  - [ { title, items: [...] }, ... ]
 *  - a single list object { title, items: [...] }
 */
export function parseTakeout(raw: any): ImportedList[] {
  let lists: any[] = []
  if (Array.isArray(raw)) lists = raw
  else if (raw && Array.isArray(raw.items) && raw.items.some((x: any) => x?.items || x?.tasks))
    lists = raw.items
  else if (raw && Array.isArray(raw.items)) lists = [raw] // flat single list
  else if (raw && raw.title) lists = [raw]

  return lists
    .map((l): ImportedList => {
      const rawTasks: any[] = l.items ?? l.tasks ?? []
      const sorted = [...rawTasks].sort((a, b) =>
        String(a?.position ?? '').localeCompare(String(b?.position ?? '')),
      )
      const tasks = sorted
        .map(parseTask)
        .filter((t): t is ImportedTask => t !== null)
      return { name: String(l.title ?? 'Sans titre').trim() || 'Sans titre', tasks }
    })
    .filter((l) => l.name)
}

export interface ImportStats {
  lists: number
  tasks: number
  done: number
}

export function statsOf(lists: ImportedList[]): ImportStats {
  const tasks = lists.reduce((n, l) => n + l.tasks.length, 0)
  const done = lists.reduce((n, l) => n + l.tasks.filter((t) => t.done).length, 0)
  return { lists: lists.length, tasks, done }
}
