import { useStore } from './store'
import type { Project, Task } from './types'

interface Snap {
  projects: Project[]
  tasks: Task[]
}

const past: Snap[] = []
const future: Snap[] = []
let applying = false
const LIMIT = 100
let started = false

function snap(s: { projects: Project[]; tasks: Task[] }): Snap {
  return { projects: s.projects, tasks: s.tasks }
}

/** Attach the history recorder once. Records the PREVIOUS data state before
 *  each change to projects/tasks (edits, toggles, reorders, imports…). */
export function initHistory() {
  if (started) return
  started = true
  useStore.subscribe((state, prev) => {
    if (applying) return
    if (state.projects === prev.projects && state.tasks === prev.tasks) return
    past.push(snap(prev))
    if (past.length > LIMIT) past.shift()
    future.length = 0
  })
}

export function undo() {
  const prev = past.pop()
  if (!prev) return
  future.push(snap(useStore.getState()))
  applying = true
  useStore.setState({ projects: prev.projects, tasks: prev.tasks })
  applying = false
}

export function redo() {
  const next = future.pop()
  if (!next) return
  past.push(snap(useStore.getState()))
  applying = true
  useStore.setState({ projects: next.projects, tasks: next.tasks })
  applying = false
}
