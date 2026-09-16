import { useEffect, useRef, useState } from 'react'
import type { Project, Task } from './types'
import { useStore } from './store'
import { useUI } from './ui'
import { DOT, chipBg, chipText } from './colors'
import { Circle, CheckCircle, Star, StarOutline, Trash } from './Icons'
import { Linkify } from './linkify'

export default function TaskRow({
  task,
  project,
  showTag,
  selected,
}: {
  task: Task
  project?: Project
  showTag: boolean
  selected: boolean
}) {
  const { toggleTask, starTask, deleteTask, updateTask, reorderTask, moveTaskToProject } =
    useStore.getState()
  const allProjects = useStore((s) => s.projects)
  const [projOpen, setProjOpen] = useState(false)
  const editingId = useUI((s) => s.editingId)
  const { select, edit, hover, setDragging, setDrop } = useUI()
  const isDragging = useUI((s) => s.draggingId === task.id)
  const dropHere = useUI((s) => (s.dropId === task.id && s.draggingId ? s.dropPlace : null))
  const editing = editingId === task.id
  const rowRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (selected) rowRef.current?.scrollIntoView({ block: 'nearest' })
  }, [selected])

  return (
    <div
      ref={rowRef}
      draggable={!editing}
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move'
        e.dataTransfer.setData('text/plain', task.id)
        setDragging(task.id)
        hover(null) // avoid a stale grey hover highlight during/after the drag
      }}
      onDragOver={(e) => {
        e.preventDefault()
        const r = e.currentTarget.getBoundingClientRect()
        const place = e.clientY < r.top + r.height / 2 ? 'before' : 'after'
        const cur = useUI.getState()
        if (cur.dropId !== task.id || cur.dropPlace !== place) setDrop(task.id, place)
      }}
      onDrop={(e) => {
        e.preventDefault()
        const dragging = useUI.getState().draggingId
        const place = useUI.getState().dropPlace
        if (dragging && dragging !== task.id) {
          reorderTask(dragging, task.id, place)
          select(dragging) // keep focus on the task we just moved
          hover(null) // clear any stale hover highlight
        }
        setDragging(null)
        setDrop(null)
      }}
      onDragEnd={() => {
        setDragging(null)
        setDrop(null)
      }}
      onClick={() => {
        select(task.id)
        edit(task.id)
      }}
      onMouseEnter={() => hover(task.id)}
      onMouseLeave={() => hover(null)}
      className={`group relative flex cursor-pointer items-start gap-3 rounded-lg px-3 py-2 transition-colors ${
        isDragging ? 'opacity-40' : ''
      } ${
        selected
          ? 'bg-[color-mix(in_srgb,var(--color-accent)_10%,transparent)] ring-1 ring-[color-mix(in_srgb,var(--color-accent)_35%,transparent)]'
          : 'hover:bg-[color-mix(in_srgb,var(--color-ink)_9%,transparent)]'
      }`}
    >
      {dropHere && (
        <div
          className={`pointer-events-none absolute left-2 right-2 h-0.5 rounded-full bg-[var(--color-accent)] ${
            dropHere === 'before' ? '-top-px' : '-bottom-px'
          }`}
        />
      )}
      <button
        onClick={(e) => {
          e.stopPropagation()
          toggleTask(task.id)
        }}
        className={`mt-[1px] shrink-0 transition-colors ${
          task.done
            ? 'text-[var(--color-accent)]'
            : 'text-[var(--color-faint)] hover:text-[var(--color-accent)]'
        }`}
        title="Cocher (x)"
      >
        {task.done ? (
          <CheckCircle className="h-[19px] w-[19px]" />
        ) : (
          <Circle className="h-[19px] w-[19px]" />
        )}
      </button>

      <div className="min-w-0 flex-1">
        {editing ? (
          <EditField
            initial={task.title}
            onCommit={(v) => {
              const t = v.trim()
              if (t) updateTask(task.id, { title: t })
              edit(null)
            }}
            onCancel={() => edit(null)}
          />
        ) : (
          <div
            className={`text-[14px] leading-snug ${
              task.done ? 'text-[var(--color-faint)] line-through' : 'text-[var(--color-ink)]'
            }`}
          >
            <Linkify text={task.title} />
          </div>
        )}
        {task.notes && !editing && (
          <div className="mt-0.5 truncate text-[12px] text-[var(--color-faint)]">
            <Linkify text={task.notes} />
          </div>
        )}
      </div>

      {showTag && project && (
        <div className="relative mt-[1px] shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation()
              setProjOpen((o) => !o)
            }}
            title="Changer de projet"
            className="flex items-center gap-1.5 rounded-full px-2 py-[3px] text-[11.5px] font-medium transition-transform hover:scale-[1.03]"
            style={{ background: chipBg(project.color), color: chipText(project.color) }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: DOT[project.color] }} />
            {project.name}
          </button>
          {projOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={(e) => {
                  e.stopPropagation()
                  setProjOpen(false)
                }}
              />
              <div
                className="animate-in absolute right-0 top-full z-40 mt-1 max-h-64 w-56 overflow-y-auto rounded-xl border border-[var(--color-line)] bg-[var(--color-panel)] p-1 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                {[...allProjects]
                  .sort((a, b) => a.order - b.order)
                  .map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        moveTaskToProject(task.id, p.id)
                        setProjOpen(false)
                      }}
                      className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-[13px] ${
                        p.id === project.id
                          ? 'bg-[color-mix(in_srgb,var(--color-accent)_12%,transparent)]'
                          : 'hover:bg-[var(--color-line)]'
                      }`}
                    >
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ background: DOT[p.color] }}
                      />
                      <span className="flex-1 truncate">{p.name}</span>
                      {p.id === project.id && (
                        <span className="text-[var(--color-accent)]">✓</span>
                      )}
                    </button>
                  ))}
              </div>
            </>
          )}
        </div>
      )}

      <div className="flex shrink-0 items-center gap-0.5">
        <button
          onClick={(e) => {
            e.stopPropagation()
            starTask(task.id)
          }}
          className={`grid h-6 w-6 place-items-center rounded-md transition ${
            task.starred
              ? 'text-amber-400'
              : 'text-[var(--color-faint)] opacity-100 hover:bg-[var(--color-app)] md:opacity-0 md:group-hover:opacity-100'
          }`}
          title="Suivre (s)"
        >
          {task.starred ? (
            <Star className="h-[15px] w-[15px]" />
          ) : (
            <StarOutline className="h-[15px] w-[15px]" />
          )}
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation()
            deleteTask(task.id)
          }}
          className="grid h-6 w-6 place-items-center rounded-md text-[var(--color-faint)] opacity-100 transition hover:bg-[var(--color-app)] hover:text-red-500 md:opacity-0 md:group-hover:opacity-100"
          title="Supprimer (⌫)"
        >
          <Trash className="h-[15px] w-[15px]" />
        </button>
      </div>
    </div>
  )
}

function EditField({
  initial,
  onCommit,
  onCancel,
}: {
  initial: string
  onCommit: (v: string) => void
  onCancel: () => void
}) {
  const [v, setV] = useState(initial)
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => {
    const el = ref.current
    if (el) {
      el.focus()
      const n = el.value.length
      el.setSelectionRange(n, n)
    }
  }, [])
  return (
    <input
      ref={ref}
      value={v}
      onChange={(e) => setV(e.target.value)}
      onClick={(e) => e.stopPropagation()}
      onBlur={() => onCommit(v)}
      onKeyDown={(e) => {
        e.stopPropagation()
        if (e.key === 'Enter') onCommit(v)
        else if (e.key === 'Escape') onCancel()
      }}
      className="w-full bg-transparent text-[14px] leading-snug outline-none"
    />
  )
}
