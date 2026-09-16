import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ColorKey, Project, Task } from './types'
import { COLOR_KEYS } from './colors'
import type { ImportedList } from './importGoogle'

/** UUIDs so ids are portable to Supabase (uuid columns). */
const nanoid = (_?: number) =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0
        return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
      })

interface Data {
  projects: Project[]
  tasks: Task[]
  showCompleted: boolean
  /** True while the store still holds only the initial demo seed (never
   *  uploaded to the cloud; a fresh device pulls instead). Cleared on any
   *  real user action (add / import / cloud hydrate). */
  demo: boolean
}

interface Actions {
  addTask: (title: string, projectId: string) => string
  updateTask: (id: string, patch: Partial<Task>) => void
  toggleTask: (id: string) => void
  starTask: (id: string) => void
  deleteTask: (id: string) => void
  moveTaskToProject: (id: string, projectId: string) => void
  reorderTask: (id: string, targetId: string, place: 'before' | 'after') => void
  clearCompleted: (projectId?: string) => void

  addProject: (name: string, color?: ColorKey) => string
  updateProject: (id: string, patch: Partial<Project>) => void
  deleteProject: (id: string) => void
  reorderProject: (id: string, targetId: string, place: 'before' | 'after') => void

  importLists: (lists: ImportedList[], clearExisting: boolean) => void

  /** Replace all data (used by cloud sync pull). */
  hydrate: (projects: Project[], tasks: Task[]) => void

  toggleShowCompleted: () => void
}

const SEED_PROJECTS: [string, ColorKey][] = [
  ['Inbox', 'slate'],
  ['Content', 'rose'],
  ['Newsletter', 'blue'],
  ['Marketing', 'orange'],
  ['Product', 'amber'],
  ['Design', 'violet'],
  ['Personal', 'green'],
  ['Ideas', 'purple'],
]

// Curated demo so a fresh install (and the screenshots) look alive.
interface Seed {
  title: string
  project: string
  star?: boolean
  done?: boolean
  note?: string
}
const SEED_TASKS: Seed[] = [
  { title: 'Ship the v1.2 release notes', project: 'Product', star: true },
  { title: 'Reply to the 3 support tickets from yesterday', project: 'Inbox', star: true },
  { title: 'Record a 60s demo for the landing page', project: 'Content' },
  { title: 'Draft this week’s newsletter', project: 'Newsletter', star: true },
  {
    title: 'Newsletter idea: how we made the app feel instant',
    project: 'Newsletter',
    note: 'Angle: local-first, no spinners, keyboard-first.',
  },
  { title: 'Set up UTM tracking on the pricing page', project: 'Marketing' },
  { title: 'Comment on 5 posts in the community', project: 'Marketing' },
  { title: 'A/B test the hero headline', project: 'Marketing', star: true },
  { title: 'Fix the dark-mode contrast on chips', project: 'Design' },
  { title: 'Design the empty state for new projects', project: 'Design' },
  { title: 'Add drag & drop to reorder tasks', project: 'Product', done: true },
  { title: 'Make search filter by project too', project: 'Product' },
  { title: 'Read: Building a local-first app', project: 'Ideas', note: 'https://localfirstweb.dev' },
  { title: 'Try Tauri 2 push notifications', project: 'Ideas' },
  { title: 'Sketch a weekly review workflow', project: 'Ideas', star: true },
  { title: 'Book the dentist', project: 'Personal' },
  { title: 'Plan the weekend trip', project: 'Personal', star: true },
  { title: 'Renew the domain before it expires', project: 'Personal', done: true },
  { title: 'Outline the onboarding checklist', project: 'Product' },
  { title: 'Batch-schedule 5 short clips', project: 'Content', star: true },
  { title: 'Repurpose the podcast into 3 threads', project: 'Content' },
  { title: 'Add a “#project” hint to the quick-add', project: 'Product', done: true },
  { title: 'Email the 2 founders who replied', project: 'Inbox' },
  { title: 'Update the changelog', project: 'Product' },
]

function seed(): Data {
  const projects: Project[] = SEED_PROJECTS.map(([name, color], i) => ({
    id: nanoid(8),
    name,
    color,
    order: i,
  }))
  const pid = (name: string) => projects.find((p) => p.name === name)!.id
  const now = Date.now()
  const tasks: Task[] = SEED_TASKS.map((t, i) => ({
    id: nanoid(8),
    title: t.title,
    notes: t.note,
    projectId: pid(t.project),
    done: !!t.done,
    starred: !!t.star,
    order: i,
    createdAt: now - i * 1000,
    completedAt: t.done ? now - i * 1000 : undefined,
  }))
  return { projects, tasks, showCompleted: false, demo: true }
}

let colorCursor = 0
function nextColor(existing: Project[]): ColorKey {
  const used = new Set(existing.map((p) => p.color))
  for (let i = 0; i < COLOR_KEYS.length; i++) {
    const c = COLOR_KEYS[(colorCursor + i) % COLOR_KEYS.length]
    if (!used.has(c)) {
      colorCursor = (colorCursor + i + 1) % COLOR_KEYS.length
      return c
    }
  }
  return COLOR_KEYS[colorCursor++ % COLOR_KEYS.length]
}

export const useStore = create<Data & Actions>()(
  persist(
    (set, get) => ({
      ...seed(),

      addTask: (title, projectId) => {
        const id = nanoid(8)
        const minOrder = Math.min(0, ...get().tasks.map((t) => t.order))
        set((s) => ({
          demo: false,
          tasks: [
            {
              id,
              title: title.trim(),
              projectId,
              done: false,
              starred: false,
              order: minOrder - 1,
              createdAt: Date.now(),
            },
            ...s.tasks,
          ],
        }))
        return id
      },

      updateTask: (id, patch) =>
        set((s) => ({
          tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
        })),

      toggleTask: (id) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id
              ? { ...t, done: !t.done, completedAt: !t.done ? Date.now() : undefined }
              : t,
          ),
        })),

      starTask: (id) =>
        set((s) => ({
          tasks: s.tasks.map((t) => (t.id === id ? { ...t, starred: !t.starred } : t)),
        })),

      deleteTask: (id) => set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),

      moveTaskToProject: (id, projectId) =>
        set((s) => ({
          tasks: s.tasks.map((t) => (t.id === id ? { ...t, projectId } : t)),
        })),

      reorderTask: (id, targetId, place) =>
        set((s) => {
          if (id === targetId) return {}
          // Fractional ordering: only the moved task's `order` changes, so a
          // reorder in any view is a single row write to the cloud.
          const sorted = [...s.tasks].sort((a, b) => a.order - b.order)
          const ti = sorted.findIndex((t) => t.id === targetId)
          if (ti < 0) return {}
          const target = sorted[ti]
          // neighbours around the insertion slot (excluding the moved task)
          const prev = place === 'before' ? sorted[ti - 1] : target
          const next = place === 'before' ? target : sorted[ti + 1]
          const before = prev && prev.id !== id ? prev.order : undefined
          const after = next && next.id !== id ? next.order : undefined
          let newOrder: number
          if (before === undefined && after === undefined) return {}
          else if (before === undefined) newOrder = (after as number) - 1
          else if (after === undefined) newOrder = (before as number) + 1
          else newOrder = (before + after) / 2
          return {
            tasks: s.tasks.map((t) => (t.id === id ? { ...t, order: newOrder } : t)),
          }
        }),

      clearCompleted: (projectId) =>
        set((s) => ({
          tasks: s.tasks.filter(
            (t) => !t.done || (projectId ? t.projectId !== projectId : false),
          ),
        })),

      addProject: (name, color) => {
        const id = nanoid(8)
        set((s) => ({
          projects: [
            ...s.projects,
            {
              id,
              name: name.trim() || 'Nouveau projet',
              color: color ?? nextColor(s.projects),
              order: Math.max(-1, ...s.projects.map((p) => p.order)) + 1,
            },
          ],
        }))
        return id
      },

      updateProject: (id, patch) =>
        set((s) => ({
          projects: s.projects.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        })),

      deleteProject: (id) =>
        set((s) => ({
          projects: s.projects.filter((p) => p.id !== id),
          tasks: s.tasks.filter((t) => t.projectId !== id),
        })),

      reorderProject: (id, targetId, place) =>
        set((s) => {
          const projects = [...s.projects].sort((a, b) => a.order - b.order)
          const from = projects.findIndex((p) => p.id === id)
          if (from < 0) return {}
          const [moved] = projects.splice(from, 1)
          let to = projects.findIndex((p) => p.id === targetId)
          if (to < 0) return {}
          if (place === 'after') to += 1
          projects.splice(to, 0, moved)
          return { projects: projects.map((p, i) => ({ ...p, order: i })) }
        }),

      importLists: (lists, clearExisting) =>
        set((s) => {
          const projects: Project[] = clearExisting ? [] : [...s.projects]
          const tasks: Task[] = clearExisting ? [] : [...s.tasks]
          let pOrder = projects.length
          let tOrder = tasks.length
          const now = Date.now()
          for (const l of lists) {
            let proj = projects.find(
              (p) => p.name.toLowerCase() === l.name.toLowerCase(),
            )
            if (!proj) {
              proj = {
                id: nanoid(8),
                name: l.name,
                color: nextColor(projects),
                order: pOrder++,
              }
              projects.push(proj)
            }
            for (const t of l.tasks) {
              tasks.push({
                id: nanoid(8),
                title: t.title,
                notes: t.notes,
                projectId: proj.id,
                done: t.done,
                starred: false,
                order: tOrder++,
                createdAt: t.createdAt ?? now,
                completedAt: t.completedAt,
              })
            }
          }
          return { projects, tasks, demo: false }
        }),

      hydrate: (projects, tasks) => set({ projects, tasks, demo: false }),

      toggleShowCompleted: () => set((s) => ({ showCompleted: !s.showCompleted })),
    }),
    {
      name: 'tasks-app-v1',
      partialize: (s) => ({
        projects: s.projects,
        tasks: s.tasks,
        showCompleted: s.showCompleted,
        demo: s.demo,
      }),
    },
  ),
)
