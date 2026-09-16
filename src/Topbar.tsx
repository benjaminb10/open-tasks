import { useStore } from './store'
import { useUI, STARRED } from './ui'
import { ALL } from './types'
import { DOT } from './colors'
import { Search, Board, List, Star, Menu } from './Icons'

export default function Topbar({
  searchRef,
}: {
  searchRef: React.RefObject<HTMLInputElement | null>
}) {
  const projects = useStore((s) => s.projects)
  const tasks = useStore((s) => s.tasks)
  const showCompleted = useStore((s) => s.showCompleted)
  const toggleShowCompleted = useStore((s) => s.toggleShowCompleted)
  const { filter, search, setSearch, view, toggleView, setProjectEditorOpen } = useUI()
  const starredOnly = useUI((s) => s.starredOnly)
  const toggleStarredOnly = useUI((s) => s.toggleStarredOnly)

  const project = projects.find((p) => p.id === filter)
  const title =
    filter === ALL ? 'Toutes les tâches' : filter === STARRED ? 'Suivies' : project?.name

  const scope = tasks.filter((t) =>
    filter === ALL ? true : filter === STARRED ? t.starred : t.projectId === filter,
  )
  const open = scope.filter((t) => !t.done).length
  const done = scope.filter((t) => t.done).length
  const starred = scope.filter((t) => t.starred && !t.done).length

  return (
    <div
      data-tauri-drag-region
      className="flex items-center gap-3 border-b border-[var(--color-line)] px-4 pb-3 pt-[max(1.25rem,env(safe-area-inset-top))] md:px-6 md:pt-8"
    >
      <button
        onClick={() => useUI.getState().setSidebarOpen(true)}
        className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[var(--color-muted)] hover:bg-[var(--color-line)] md:hidden"
        title="Menu"
      >
        <Menu className="h-5 w-5" />
      </button>
      <div className="flex min-w-0 items-center gap-2.5">
        {project && (
          <span
            className="h-3 w-3 shrink-0 rounded-full"
            style={{ background: DOT[project.color] }}
          />
        )}
        <button
          onClick={() => project && setProjectEditorOpen(true)}
          className="truncate text-[17px] font-semibold tracking-tight"
          title={project ? 'Modifier le projet' : undefined}
        >
          {title}
        </button>
        <span className="shrink-0 text-[13px] text-[var(--color-faint)]">
          {open} {open > 1 ? 'ouvertes' : 'ouverte'}
        </span>
      </div>

      <div className="flex-1" />

      <label className="flex items-center gap-2 rounded-lg bg-[var(--color-panel)] px-2.5 py-1.5 ring-1 ring-[var(--color-line)] focus-within:ring-[color-mix(in_srgb,var(--color-accent)_45%,var(--color-line))]">
        <Search className="h-4 w-4 text-[var(--color-faint)]" />
        <input
          ref={searchRef}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setSearch('')
              ;(e.target as HTMLInputElement).blur()
            }
          }}
          placeholder="Rechercher…"
          className="w-36 bg-transparent text-[13px] outline-none placeholder:text-[var(--color-faint)]"
        />
        <kbd className="rounded bg-[var(--color-line)] px-1 text-[10px] text-[var(--color-faint)]">
          /
        </kbd>
      </label>

      <button
        onClick={toggleStarredOnly}
        className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12.5px] font-medium transition-colors ${
          starredOnly
            ? 'bg-[color-mix(in_srgb,#f59e0b_16%,transparent)] text-amber-400'
            : 'text-[var(--color-muted)] hover:bg-[var(--color-line)]'
        }`}
        title="Afficher uniquement les suivies (f)"
      >
        <Star className="h-[14px] w-[14px]" />
        Suivies {starred > 0 && <span className="tabular-nums opacity-70">{starred}</span>}
      </button>

      <button
        onClick={toggleShowCompleted}
        className={`rounded-lg px-2.5 py-1.5 text-[12.5px] font-medium transition-colors ${
          showCompleted
            ? 'bg-[color-mix(in_srgb,var(--color-accent)_12%,transparent)] text-[var(--color-accent)]'
            : 'text-[var(--color-muted)] hover:bg-[var(--color-line)]'
        }`}
        title="Afficher les tâches terminées"
      >
        Terminées {done > 0 && <span className="tabular-nums opacity-70">{done}</span>}
      </button>

      <button
        onClick={toggleView}
        className="grid h-8 w-8 place-items-center rounded-lg text-[var(--color-muted)] transition-colors hover:bg-[var(--color-line)]"
        title={view === 'list' ? 'Vue tableau (b)' : 'Vue liste (b)'}
      >
        {view === 'list' ? <Board className="h-[18px] w-[18px]" /> : <List className="h-[18px] w-[18px]" />}
      </button>
    </div>
  )
}
