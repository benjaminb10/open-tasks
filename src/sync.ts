import { supabase } from './supabase'
import { useStore } from './store'
import type { Project, Task } from './types'

/* ---------- row mapping local <-> remote --------------------------------- */

interface RemoteProject {
  id: string
  user_id: string
  name: string
  color: string
  sort: number
  deleted_at: string | null
}
interface RemoteItem {
  id: string
  user_id: string
  project_id: string | null
  title: string
  notes: string | null
  done: boolean
  starred: boolean
  sort: number
  created_at: string
  completed_at: string | null
  deleted_at: string | null
}

const isUuid = (s: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)

function projectToRemote(p: Project, userId: string): Omit<RemoteProject, 'deleted_at'> {
  return { id: p.id, user_id: userId, name: p.name, color: p.color, sort: p.order }
}
function itemToRemote(t: Task, userId: string) {
  return {
    id: t.id,
    user_id: userId,
    project_id: t.projectId,
    title: t.title,
    notes: t.notes ?? null,
    done: t.done,
    starred: t.starred,
    sort: t.order,
    created_at: new Date(t.createdAt).toISOString(),
    completed_at: t.completedAt ? new Date(t.completedAt).toISOString() : null,
    deleted_at: null,
  }
}
function projectFromRemote(r: RemoteProject): Project {
  return { id: r.id, name: r.name, color: r.color as Project['color'], order: r.sort }
}
function itemFromRemote(r: RemoteItem): Task {
  return {
    id: r.id,
    title: r.title,
    notes: r.notes ?? undefined,
    projectId: r.project_id ?? '',
    done: r.done,
    starred: r.starred,
    order: r.sort,
    createdAt: r.created_at ? Date.parse(r.created_at) : Date.now(),
    completedAt: r.completed_at ? Date.parse(r.completed_at) : undefined,
  }
}

/* ---------- engine ------------------------------------------------------- */

let applyingRemote = false
let unsubStore: (() => void) | null = null
let channel: ReturnType<NonNullable<typeof supabase>['channel']> | null = null
let flushTimer: ReturnType<typeof setTimeout> | null = null

// last-known-synced signatures, to compute deltas on local change
const syncedProjects = new Map<string, string>()
const syncedItems = new Map<string, string>()
const pSig = (p: Project) => JSON.stringify([p.name, p.color, p.order])
const tSig = (t: Task) =>
  JSON.stringify([t.title, t.notes, t.projectId, t.done, t.starred, t.order, t.completedAt])

export async function startSync(userId: string) {
  if (!supabase) return
  stopSync()

  // 1. Pull remote (non-deleted)
  const [{ data: rp }, { data: ri }] = await Promise.all([
    supabase.from('tasks_projects').select('*').is('deleted_at', null),
    supabase.from('tasks_items').select('*').is('deleted_at', null),
  ])
  const remoteProjects = (rp ?? []) as RemoteProject[]
  const remoteItems = (ri ?? []) as RemoteItem[]

  const local = useStore.getState()
  const realLocal = (local.projects.length > 0 || local.tasks.length > 0) && !local.demo
  const firstSync = localStorage.getItem('tasks-synced-once') !== '1'

  if (firstSync && realLocal) {
    // First sync on THIS device with local data: MERGE (never lose local).
    // Local rows are uploaded; remote-only rows are added. No deletes here.
    await mergeUpload(userId, remoteProjects, remoteItems)
  } else {
    // Already synced before (or fresh device): remote is the shared truth.
    applyingRemote = true
    useStore
      .getState()
      .hydrate(remoteProjects.map(projectFromRemote), remoteItems.map(itemFromRemote))
    applyingRemote = false
    seedSignatures()
  }
  localStorage.setItem('tasks-synced-once', '1')

  // 4. Push local changes as they happen
  unsubStore = useStore.subscribe((state, prev) => {
    if (applyingRemote) return
    if (state.projects === prev.projects && state.tasks === prev.tasks) return
    scheduleFlush(userId)
  })

  // 5. Realtime: apply remote changes from other devices
  channel = supabase
    .channel('tasks-sync')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'tasks_projects', filter: `user_id=eq.${userId}` },
      (payload) => applyRemoteProject(payload),
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'tasks_items', filter: `user_id=eq.${userId}` },
      (payload) => applyRemoteItem(payload),
    )
    .subscribe()
}

export function stopSync() {
  unsubStore?.()
  unsubStore = null
  if (channel) {
    supabase?.removeChannel(channel)
    channel = null
  }
  syncedProjects.clear()
  syncedItems.clear()
}

function seedSignatures() {
  syncedProjects.clear()
  syncedItems.clear()
  const s = useStore.getState()
  s.projects.forEach((p) => syncedProjects.set(p.id, pSig(p)))
  s.tasks.forEach((t) => syncedItems.set(t.id, tSig(t)))
}

/**
 * Merge local data up to the cloud without losing anything:
 *  - local rows (with non-uuid ids remapped) are uploaded,
 *  - remote-only rows are added to local,
 *  - nothing is deleted.
 * Safe first-sync for a device that already holds real data.
 */
async function mergeUpload(
  userId: string,
  remoteProjects: RemoteProject[],
  remoteItems: RemoteItem[],
) {
  const s = useStore.getState()
  const map = new Map<string, string>()
  const remapId = (id: string) => {
    if (isUuid(id)) return id
    if (!map.has(id)) map.set(id, crypto.randomUUID())
    return map.get(id)!
  }
  const localProjects: Project[] = s.projects.map((p) => ({ ...p, id: remapId(p.id) }))
  const localTasks: Task[] = s.tasks.map((t) => ({
    ...t,
    id: remapId(t.id),
    projectId: t.projectId ? remapId(t.projectId) : t.projectId,
  }))

  // Upload local rows to the cloud.
  await supabase!.from('tasks_projects').upsert(localProjects.map((p) => projectToRemote(p, userId)))
  await supabase!.from('tasks_items').upsert(localTasks.map((t) => itemToRemote(t, userId)))

  // Union with remote-only rows (ids don't collide: remote is uuid, local remapped to uuid).
  const localProjIds = new Set(localProjects.map((p) => p.id))
  const localItemIds = new Set(localTasks.map((t) => t.id))
  const mergedProjects = [
    ...localProjects,
    ...remoteProjects.filter((r) => !localProjIds.has(r.id)).map(projectFromRemote),
  ]
  const mergedTasks = [
    ...localTasks,
    ...remoteItems.filter((r) => !localItemIds.has(r.id)).map(itemFromRemote),
  ]

  applyingRemote = true
  useStore.getState().hydrate(mergedProjects, mergedTasks)
  applyingRemote = false
  seedSignatures()
}

function scheduleFlush(userId: string) {
  if (flushTimer) clearTimeout(flushTimer)
  flushTimer = setTimeout(() => flush(userId), 400)
}

async function flush(userId: string) {
  if (!supabase) return
  const s = useStore.getState()

  const projUpserts = s.projects
    .filter((p) => syncedProjects.get(p.id) !== pSig(p))
    .map((p) => projectToRemote(p, userId))
  const projDeletes = [...syncedProjects.keys()].filter(
    (id) => !s.projects.some((p) => p.id === id),
  )

  const itemUpserts = s.tasks
    .filter((t) => syncedItems.get(t.id) !== tSig(t))
    .map((t) => itemToRemote(t, userId))
  const itemDeletes = [...syncedItems.keys()].filter((id) => !s.tasks.some((t) => t.id === id))

  if (projUpserts.length) await supabase.from('tasks_projects').upsert(projUpserts)
  if (itemUpserts.length) await supabase.from('tasks_items').upsert(itemUpserts)
  const nowIso = new Date().toISOString()
  if (projDeletes.length)
    await supabase.from('tasks_projects').update({ deleted_at: nowIso }).in('id', projDeletes)
  if (itemDeletes.length)
    await supabase.from('tasks_items').update({ deleted_at: nowIso }).in('id', itemDeletes)

  seedSignatures()
}

/* ---------- realtime handlers ------------------------------------------- */

function applyRemoteProject(payload: { eventType: string; new: unknown; old: unknown }) {
  const s = useStore.getState()
  applyingRemote = true
  if (payload.eventType === 'DELETE') {
    const old = payload.old as { id: string }
    s.hydrate(
      s.projects.filter((p) => p.id !== old.id),
      s.tasks,
    )
  } else {
    const r = payload.new as RemoteProject
    if (r.deleted_at) {
      s.hydrate(s.projects.filter((p) => p.id !== r.id), s.tasks)
    } else {
      const p = projectFromRemote(r)
      const exists = s.projects.some((x) => x.id === p.id)
      s.hydrate(
        exists ? s.projects.map((x) => (x.id === p.id ? p : x)) : [...s.projects, p],
        s.tasks,
      )
    }
  }
  applyingRemote = false
  seedSignatures()
}

function applyRemoteItem(payload: { eventType: string; new: unknown; old: unknown }) {
  const s = useStore.getState()
  applyingRemote = true
  if (payload.eventType === 'DELETE') {
    const old = payload.old as { id: string }
    s.hydrate(s.projects, s.tasks.filter((t) => t.id !== old.id))
  } else {
    const r = payload.new as RemoteItem
    if (r.deleted_at) {
      s.hydrate(s.projects, s.tasks.filter((t) => t.id !== r.id))
    } else {
      const t = itemFromRemote(r)
      const exists = s.tasks.some((x) => x.id === t.id)
      s.hydrate(
        s.projects,
        exists ? s.tasks.map((x) => (x.id === t.id ? t : x)) : [...s.tasks, t],
      )
    }
  }
  applyingRemote = false
  seedSignatures()
}
