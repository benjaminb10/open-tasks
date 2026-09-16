import { useEffect, useRef, useState } from 'react'
import { useStore } from './store'
import { useUI, STARRED } from './ui'
import { ALL } from './types'
import { DOT } from './colors'
import { visibleTasks, projectById } from './selectors'
import TaskRow from './TaskRow'
import { Plus, Search, Star } from './Icons'

interface Page {
  id: string // ALL | STARRED | projectId
  name: string
  color?: string
}

export default function MobilePager() {
  const projects = [...useStore((s) => s.projects)].sort((a, b) => a.order - b.order)
  const tasks = useStore((s) => s.tasks)
  const showCompleted = useStore((s) => s.showCompleted)
  const search = useUI((s) => s.search)
  const setSearch = useUI((s) => s.setSearch)

  const pages: Page[] = [
    { id: ALL, name: 'Toutes' },
    { id: STARRED, name: 'Suivies' },
    ...projects.map((p) => ({ id: p.id, name: p.name, color: DOT[p.color] })),
  ]

  const [active, setActive] = useState(0)
  const [searchOpen, setSearchOpen] = useState(false)
  const scrollerRef = useRef<HTMLDivElement>(null)
  const tabsRef = useRef<HTMLDivElement>(null)
  const byId = projectById(projects)

  // Sync active page from scroll position
  function onScroll() {
    const el = scrollerRef.current
    if (!el) return
    const idx = Math.round(el.scrollLeft / el.clientWidth)
    if (idx !== active) setActive(idx)
  }

  function goTo(i: number) {
    const el = scrollerRef.current
    if (!el) return
    el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' })
    setActive(i)
  }

  // Keep the active tab visible in the tab strip
  useEffect(() => {
    const strip = tabsRef.current
    const tab = strip?.children[active] as HTMLElement | undefined
    tab?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' })
  }, [active])

  return (
    <div className="flex h-full w-full flex-col bg-[var(--color-app)]">
      {/* Header: title + search + tab strip */}
      <div className="shrink-0 border-b border-[var(--color-line)] bg-[var(--color-panel)] pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="flex items-center gap-2 px-4 pb-2">
          <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[var(--color-accent)] text-white">
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
              <path d="M5 12.5l4 4 10-10.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          {searchOpen ? (
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onBlur={() => !search && setSearchOpen(false)}
              placeholder="Rechercher…"
              className="min-w-0 flex-1 rounded-lg bg-[var(--color-app)] px-3 py-1.5 text-[15px] outline-none"
            />
          ) : (
            <span className="flex-1 text-[16px] font-semibold tracking-tight">Tasks</span>
          )}
          <button
            onClick={() => {
              if (searchOpen) { setSearch(''); setSearchOpen(false) }
              else setSearchOpen(true)
            }}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[var(--color-muted)] active:bg-[var(--color-line)]"
          >
            <Search className="h-[18px] w-[18px]" />
          </button>
        </div>

        {/* Tab strip */}
        <div ref={tabsRef} className="flex gap-1 overflow-x-auto px-2 pb-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {pages.map((pg, i) => {
            const open = tasks.filter((t) =>
              pg.id === ALL ? !t.done : pg.id === STARRED ? t.starred && !t.done : t.projectId === pg.id && !t.done,
            ).length
            return (
              <button
                key={pg.id}
                onClick={() => goTo(i)}
                className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-[13px] transition-colors ${
                  active === i
                    ? 'bg-[var(--color-accent)] font-medium text-white'
                    : 'bg-[var(--color-app)] text-[var(--color-muted)]'
                }`}
              >
                {pg.id === STARRED && <Star className="h-3.5 w-3.5" />}
                {pg.color && <span className="h-2 w-2 rounded-full" style={{ background: pg.color }} />}
                {pg.name}
                {open > 0 && <span className="tabular-nums opacity-70">{open}</span>}
              </button>
            )
          })}
        </div>
      </div>

      {/* Horizontal swipeable pages */}
      <div
        ref={scrollerRef}
        onScroll={onScroll}
        className="flex min-h-0 flex-1 snap-x snap-mandatory overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ scrollBehavior: 'auto' }}
      >
        {pages.map((pg) => {
          const list = visibleTasks(tasks, pg.id, search, showCompleted, false)
          const open = list.filter((t) => !t.done)
          const done = list.filter((t) => t.done)
          const showTag = pg.id === ALL || pg.id === STARRED
          return (
            <div key={pg.id} className="w-full shrink-0 snap-center overflow-y-auto">
              <MobileQuickAdd pageId={pg.id} />
              <div className="px-2 pb-28">
                {open.map((t) => (
                  <TaskRow key={t.id} task={t} project={byId.get(t.projectId)} showTag={showTag} selected={false} />
                ))}
                {done.length > 0 && (
                  <>
                    <div className="mt-4 mb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-faint)]">
                      Terminées · {done.length}
                    </div>
                    <div className="opacity-80">
                      {done.map((t) => (
                        <TaskRow key={t.id} task={t} project={byId.get(t.projectId)} showTag={showTag} selected={false} />
                      ))}
                    </div>
                  </>
                )}
                {list.length === 0 && (
                  <div className="grid place-items-center py-20 text-center text-[13px] text-[var(--color-faint)]">
                    Aucune tâche ici.
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function MobileQuickAdd({ pageId }: { pageId: string }) {
  const projects = [...useStore((s) => s.projects)].sort((a, b) => a.order - b.order)
  const addTask = useStore((s) => s.addTask)
  const [text, setText] = useState('')
  const targetId =
    pageId !== ALL && pageId !== STARRED
      ? pageId
      : (projects.find((p) => p.name === 'Mes tâches') ?? projects[0])?.id

  function commit() {
    if (!text.trim() || !targetId) return
    addTask(text, targetId)
    setText('')
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        commit()
      }}
      className="sticky top-0 z-10 bg-[var(--color-app)]/95 px-3 pb-2 pt-2 backdrop-blur"
    >
      <div className="flex items-center gap-2 rounded-xl border border-[var(--color-line)] bg-[var(--color-panel)] px-3 py-2.5">
        <button
          type="submit"
          aria-label="Ajouter"
          className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-[var(--color-accent)] active:bg-[var(--color-line)]"
        >
          <Plus className="h-[18px] w-[18px]" />
        </button>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              commit()
            }
          }}
          enterKeyHint="done"
          placeholder="Ajouter une tâche…"
          className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-[var(--color-faint)]"
        />
      </div>
    </form>
  )
}
