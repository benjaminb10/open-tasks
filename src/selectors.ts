import type { Project, Task } from './types'
import { ALL } from './types'
import { STARRED, type Filter } from './ui'

export function matchTask(t: Task, filter: Filter, search: string): boolean {
  if (filter === STARRED) {
    if (!t.starred) return false
  } else if (filter !== ALL) {
    if (t.projectId !== filter) return false
  }
  if (search.trim()) {
    const q = search.toLowerCase()
    if (!t.title.toLowerCase().includes(q) && !(t.notes ?? '').toLowerCase().includes(q))
      return false
  }
  return true
}

/** Visible, ordered tasks for the flat list. Completed pushed to bottom. */
export function visibleTasks(
  tasks: Task[],
  filter: Filter,
  search: string,
  showCompleted: boolean,
  starredOnly = false,
): Task[] {
  return tasks
    .filter((t) => matchTask(t, filter, search))
    .filter((t) => !starredOnly || t.starred)
    .filter((t) => showCompleted || !t.done)
    .sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1
      return a.order - b.order
    })
}

export function projectById(projects: Project[]): Map<string, Project> {
  return new Map(projects.map((p) => [p.id, p]))
}

export function openCount(tasks: Task[], projectId: string): number {
  return tasks.filter((t) => t.projectId === projectId && !t.done).length
}
