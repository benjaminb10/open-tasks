import { useEffect, useMemo, useRef, useState } from 'react'
import { useStore } from './store'
import { useUI, STARRED } from './ui'
import { ALL } from './types'
import { DOT } from './colors'

interface Cmd {
  id: string
  label: string
  hint?: string
  dot?: string
  run: () => void
}

export default function CommandPalette() {
  const open = useUI((s) => s.commandOpen)
  const setOpen = useUI((s) => s.setCommandOpen)
  const projects = [...useStore((s) => s.projects)].sort((a, b) => a.order - b.order)
  const selectedId = useUI((s) => s.selectedId)
  const [q, setQ] = useState('')
  const [i, setI] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const selectedTask = useStore((s) => s.tasks.find((t) => t.id === selectedId))

  const commands = useMemo<Cmd[]>(() => {
    const ui = useUI.getState()
    const store = useStore.getState()
    const list: Cmd[] = [
      {
        id: 'v-all',
        label: 'Aller à : Toutes les tâches',
        run: () => ui.setFilter(ALL),
      },
      { id: 'v-star', label: 'Aller à : Suivies', run: () => ui.setFilter(STARRED) },
      ...projects.map((p) => ({
        id: 'go-' + p.id,
        label: 'Aller à : ' + p.name,
        dot: DOT[p.color],
        run: () => ui.setFilter(p.id),
      })),
      {
        id: 'toggle-view',
        label: 'Basculer vue liste / tableau',
        hint: 'b',
        run: () => ui.toggleView(),
      },
      {
        id: 'toggle-done',
        label: 'Afficher / masquer les terminées',
        run: () => store.toggleShowCompleted(),
      },
      {
        id: 'toggle-starred',
        label: 'Afficher uniquement les suivies (dans la vue courante)',
        hint: 'f',
        run: () => ui.toggleStarredOnly(),
      },
      {
        id: 'new-project',
        label: 'Nouveau projet',
        run: () => {
          const id = store.addProject('Nouveau projet')
          ui.setFilter(id)
          ui.setProjectEditorOpen(true)
        },
      },
      {
        id: 'import',
        label: 'Importer depuis Google Tasks',
        run: () => ui.setImportOpen(true),
      },
    ]
    const cur = projects.find((p) => p.id === ui.filter)
    if (cur) {
      list.push({
        id: 'edit-project',
        label: `Renommer / supprimer « ${cur.name} »`,
        dot: DOT[cur.color],
        run: () => ui.setProjectEditorOpen(true),
      })
    }
    if (selectedTask) {
      for (const p of projects) {
        if (p.id === selectedTask.projectId) continue
        list.push({
          id: 'move-' + p.id,
          label: `Déplacer « ${trunc(selectedTask.title)} » vers ${p.name}`,
          dot: DOT[p.color],
          run: () => store.moveTaskToProject(selectedTask.id, p.id),
        })
      }
    }
    return list
  }, [projects, selectedTask])

  const filtered = useMemo(() => {
    const s = q.toLowerCase().trim()
    if (!s) return commands
    return commands.filter((c) => c.label.toLowerCase().includes(s))
  }, [q, commands])

  useEffect(() => {
    if (open) {
      setQ('')
      setI(0)
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [open])

  useEffect(() => setI(0), [q])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 pt-[15vh]"
      onClick={() => setOpen(false)}
    >
      <div
        className="animate-in w-[560px] max-w-[92vw] overflow-hidden rounded-2xl border border-[var(--color-line)] bg-[var(--color-panel)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault()
              setI((n) => Math.min(n + 1, filtered.length - 1))
            } else if (e.key === 'ArrowUp') {
              e.preventDefault()
              setI((n) => Math.max(n - 1, 0))
            } else if (e.key === 'Enter') {
              e.preventDefault()
              filtered[i]?.run()
              setOpen(false)
            } else if (e.key === 'Escape') {
              setOpen(false)
            }
          }}
          placeholder="Tape une commande…"
          className="w-full border-b border-[var(--color-line)] bg-transparent px-4 py-3.5 text-[15px] outline-none placeholder:text-[var(--color-faint)]"
        />
        <div className="max-h-[320px] overflow-y-auto p-1.5">
          {filtered.length === 0 && (
            <div className="px-3 py-6 text-center text-[13px] text-[var(--color-faint)]">
              Aucune commande
            </div>
          )}
          {filtered.map((c, idx) => (
            <button
              key={c.id}
              onMouseMove={() => setI(idx)}
              onClick={() => {
                c.run()
                setOpen(false)
              }}
              className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13.5px] ${
                idx === i ? 'bg-[color-mix(in_srgb,var(--color-accent)_14%,transparent)]' : ''
              }`}
            >
              {c.dot ? (
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: c.dot }} />
              ) : (
                <span className="h-2.5 w-2.5 shrink-0" />
              )}
              <span className="flex-1 truncate">{c.label}</span>
              {c.hint && (
                <kbd className="rounded bg-[var(--color-line)] px-1.5 py-0.5 text-[11px] text-[var(--color-faint)]">
                  {c.hint}
                </kbd>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function trunc(s: string, n = 32) {
  return s.length > n ? s.slice(0, n) + '…' : s
}
