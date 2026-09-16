import { useEffect, useRef, useState } from 'react'
import { useStore } from './store'
import { useUI } from './ui'
import { ALL } from './types'
import { COLOR_KEYS, DOT } from './colors'
import { Trash } from './Icons'

export default function ProjectEditor() {
  const open = useUI((s) => s.projectEditorOpen)
  const setOpen = useUI((s) => s.setProjectEditorOpen)
  const filter = useUI((s) => s.filter)
  const setFilter = useUI((s) => s.setFilter)
  const project = useStore((s) => s.projects.find((p) => p.id === filter))
  const updateProject = useStore((s) => s.updateProject)
  const deleteProject = useStore((s) => s.deleteProject)
  const taskCount = useStore((s) => s.tasks.filter((t) => t.projectId === filter).length)
  const [name, setName] = useState('')
  const [confirmDel, setConfirmDel] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open && project) {
      setName(project.name)
      setConfirmDel(false)
      setTimeout(() => {
        inputRef.current?.focus()
        inputRef.current?.select()
      }, 0)
    }
  }, [open, project])

  if (!open || !project) return null

  function save() {
    if (name.trim()) updateProject(project!.id, { name: name.trim() })
    setOpen(false)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 pt-[18vh]"
      onClick={save}
    >
      <div
        className="animate-in w-[420px] max-w-[92vw] rounded-2xl border border-[var(--color-line)] bg-[var(--color-panel)] p-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 text-[13px] font-semibold text-[var(--color-muted)]">
          Modifier le projet
        </div>
        <input
          ref={inputRef}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') save()
            else if (e.key === 'Escape') setOpen(false)
          }}
          className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-app)] px-3 py-2 text-[15px] outline-none focus:border-[color-mix(in_srgb,var(--color-accent)_45%,var(--color-line))]"
        />

        <div className="mt-4 flex flex-wrap gap-2">
          {COLOR_KEYS.map((c) => (
            <button
              key={c}
              onClick={() => updateProject(project.id, { color: c })}
              className={`h-6 w-6 rounded-full transition ${
                project.color === c
                  ? 'ring-2 ring-[var(--color-ink)] ring-offset-2 ring-offset-[var(--color-panel)]'
                  : 'hover:scale-110'
              }`}
              style={{ background: DOT[c] }}
            />
          ))}
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-[var(--color-line)] pt-3">
          {confirmDel ? (
            <button
              onClick={() => {
                deleteProject(project.id)
                setFilter(ALL)
                setOpen(false)
              }}
              className="flex items-center gap-1.5 rounded-lg bg-red-500 px-3 py-1.5 text-[13px] font-medium text-white"
            >
              <Trash className="h-4 w-4" />
              Supprimer {taskCount > 0 ? `(${taskCount} tâches)` : ''} — confirmer
            </button>
          ) : (
            <button
              onClick={() => setConfirmDel(true)}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] text-red-500 hover:bg-[color-mix(in_srgb,red_10%,transparent)]"
            >
              <Trash className="h-4 w-4" />
              Supprimer
            </button>
          )}
          <button
            onClick={save}
            className="rounded-lg bg-[var(--color-accent)] px-4 py-1.5 text-[13px] font-medium text-white"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  )
}
