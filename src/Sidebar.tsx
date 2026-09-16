import { useState } from 'react'
import { useStore } from './store'
import { useUI, STARRED } from './ui'
import { ALL } from './types'
import { DOT } from './colors'
import { Layers, StarOutline, Plus, Download, More } from './Icons'
import { syncEnabled } from './supabase'
import { useAuth } from './auth'
import { openCount } from './selectors'

export default function Sidebar() {
  const projects = [...useStore((s) => s.projects)].sort((a, b) => a.order - b.order)
  const tasks = useStore((s) => s.tasks)
  const addProject = useStore((s) => s.addProject)
  const { filter, setFilter, edit } = useUI()

  const totalOpen = tasks.filter((t) => !t.done).length
  const starredOpen = tasks.filter((t) => t.starred && !t.done).length

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-[var(--color-line)] bg-[var(--color-panel)]">
      <div
        data-tauri-drag-region
        className="flex items-center gap-2 px-4 pb-3 pt-[max(2rem,env(safe-area-inset-top))]"
      >
        <div className="grid h-7 w-7 place-items-center rounded-lg bg-[var(--color-accent)] text-white">
          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
            <path
              d="M5 12.5l4 4 10-10.5"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <span className="text-[15px] font-semibold tracking-tight">Tasks</span>
      </div>

      <nav className="px-2">
        <Row
          active={filter === ALL}
          onClick={() => setFilter(ALL)}
          icon={<Layers className="h-[18px] w-[18px]" />}
          label="Toutes les tâches"
          count={totalOpen}
        />
        <Row
          active={filter === STARRED}
          onClick={() => setFilter(STARRED)}
          icon={<StarOutline className="h-[18px] w-[18px]" />}
          label="Suivies"
          count={starredOpen}
        />
      </nav>

      <div className="mt-4 px-4 pb-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-faint)]">
        Projets
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
        {projects.map((p, i) => {
          const active = filter === p.id
          return (
            <div
              key={p.id}
              onContextMenu={(e) => {
                e.preventDefault()
                setFilter(p.id)
                useUI.getState().setProjectEditorOpen(true)
              }}
              className={`group flex w-full items-center gap-2.5 rounded-lg py-[7px] pl-3 pr-2 text-[13px] transition-colors ${
                active
                  ? 'bg-[color-mix(in_srgb,var(--color-accent)_12%,transparent)] font-medium text-[var(--color-ink)]'
                  : 'text-[var(--color-muted)] hover:bg-[var(--color-line)]'
              }`}
            >
              <button
                onClick={() => setFilter(p.id)}
                onDoubleClick={() => {
                  setFilter(p.id)
                  useUI.getState().setProjectEditorOpen(true)
                }}
                className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
              >
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ background: DOT[p.color] }}
                />
                <span className="min-w-0 flex-1 truncate">{p.name}</span>
              </button>
              {i < 9 && (
                <kbd className="hidden rounded bg-[var(--color-line)] px-1 text-[10px] text-[var(--color-faint)] group-hover:inline">
                  {i + 1}
                </kbd>
              )}
              <span className="text-[12px] tabular-nums text-[var(--color-faint)] group-hover:hidden">
                {openCount(tasks, p.id) || ''}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setFilter(p.id)
                  useUI.getState().setProjectEditorOpen(true)
                }}
                title="Options du projet (renommer, couleur, supprimer)"
                className="hidden h-5 w-5 shrink-0 place-items-center rounded text-[var(--color-faint)] hover:bg-[var(--color-app)] hover:text-[var(--color-ink)] group-hover:grid"
              >
                <More className="h-4 w-4" />
              </button>
            </div>
          )
        })}
      </div>

      <div className="mx-2 mb-1 mt-1 border-t border-[var(--color-line)] pt-1">
        <button
          onClick={() => {
            const id = addProject('Nouveau projet')
            setFilter(id)
            useUI.getState().setProjectEditorOpen(true)
            edit(null)
          }}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[13px] text-[var(--color-muted)] transition-colors hover:bg-[var(--color-line)]"
        >
          <Plus className="h-4 w-4" />
          Nouveau projet
        </button>
        <button
          onClick={() => useUI.getState().setImportOpen(true)}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[13px] text-[var(--color-muted)] transition-colors hover:bg-[var(--color-line)]"
        >
          <Download className="h-4 w-4" />
          Importer Google Tasks
        </button>
        <AccountRow />
      </div>
    </aside>
  )
}

function AccountRow() {
  const session = useAuth((s) => s.session)
  const signOut = useAuth((s) => s.signOut)
  const setPassword = useAuth((s) => s.setPassword)
  const [open, setOpen] = useState(false)
  const [pw, setPw] = useState('')
  const [msg, setMsg] = useState('')
  if (!syncEnabled) return null
  const email = session?.user?.email
  if (!email) return null

  async function save() {
    if (pw.length < 6) {
      setMsg('6 caractères min.')
      return
    }
    const { error } = await setPassword(pw)
    setMsg(error ?? '✓ Mot de passe défini')
    if (!error) setPw('')
  }

  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        title="Compte"
        className="group flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[12px] text-[var(--color-faint)] transition-colors hover:bg-[var(--color-line)]"
      >
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-green-500" title="Synchronisé" />
        <span className="min-w-0 flex-1 truncate text-left">{email}</span>
      </button>
      {open && (
        <div className="mx-1 mb-1 rounded-lg bg-[var(--color-app)] p-2">
          <div className="mb-1.5 px-1 text-[11px] text-[var(--color-faint)]">
            Définir un mot de passe (pour l'app Mac) :
          </div>
          <div className="flex gap-1.5">
            <input
              value={pw}
              onChange={(e) => {
                setPw(e.target.value)
                setMsg('')
              }}
              onKeyDown={(e) => e.key === 'Enter' && save()}
              type="password"
              placeholder="mot de passe"
              className="min-w-0 flex-1 rounded-md border border-[var(--color-line)] bg-[var(--color-panel)] px-2 py-1 text-[12px] outline-none"
            />
            <button
              onClick={save}
              className="shrink-0 rounded-md bg-[var(--color-accent)] px-2.5 py-1 text-[12px] font-medium text-white"
            >
              OK
            </button>
          </div>
          {msg && <div className="mt-1 px-1 text-[11px] text-[var(--color-muted)]">{msg}</div>}
          <button
            onClick={() => signOut()}
            className="mt-2 w-full rounded-md px-2 py-1 text-left text-[12px] text-red-500 hover:bg-[color-mix(in_srgb,red_10%,transparent)]"
          >
            Se déconnecter
          </button>
        </div>
      )}
    </div>
  )
}

function Row({
  active,
  onClick,
  icon,
  label,
  count,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
  count: number
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-[7px] text-left text-[13px] transition-colors ${
        active
          ? 'bg-[color-mix(in_srgb,var(--color-accent)_12%,transparent)] font-medium text-[var(--color-accent)]'
          : 'text-[var(--color-muted)] hover:bg-[var(--color-line)]'
      }`}
    >
      <span className={active ? 'text-[var(--color-accent)]' : ''}>{icon}</span>
      <span className="flex-1">{label}</span>
      <span className="text-[12px] tabular-nums text-[var(--color-faint)]">
        {count || ''}
      </span>
    </button>
  )
}
