import { useState } from 'react'
import { useStore } from './store'
import { useUI, STARRED } from './ui'
import type { Project } from './types'
import { DOT } from './colors'
import { visibleTasks } from './selectors'
import TaskRow from './TaskRow'
import { Plus } from './Icons'

export default function BoardView() {
  const projects = [...useStore((s) => s.projects)].sort((a, b) => a.order - b.order)
  return (
    <div className="flex h-full gap-3 overflow-x-auto px-4 pb-4 pt-3">
      {projects.map((p) => (
        <Column key={p.id} project={p} />
      ))}
    </div>
  )
}

function Column({ project }: { project: Project }) {
  const tasks = useStore((s) => s.tasks)
  const addTask = useStore((s) => s.addTask)
  const showCompleted = useStore((s) => s.showCompleted)
  const search = useUI((s) => s.search)
  const starredOnly = useUI((s) => s.starredOnly)
  const filter = useUI((s) => s.filter)
  const selectedId = useUI((s) => s.selectedId)
  const [text, setText] = useState('')

  // The board respects the "Followed" view (filter) as well as the star toggle.
  const starredView = starredOnly || filter === STARRED
  const list = visibleTasks(tasks, project.id, search, showCompleted, starredView)
  const open = tasks.filter(
    (t) => t.projectId === project.id && !t.done && (!starredView || t.starred),
  ).length

  return (
    <div className="flex max-h-full w-72 shrink-0 flex-col rounded-2xl border border-[var(--color-line)] bg-[var(--color-panel)]">
      <div className="flex items-center gap-2 px-4 pt-3.5 pb-2">
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: DOT[project.color] }} />
        <span className="truncate text-[13.5px] font-semibold">{project.name}</span>
        <span className="ml-auto text-[12px] tabular-nums text-[var(--color-faint)]">{open || ''}</span>
      </div>

      <div className="px-2">
        <div className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-[var(--color-faint)] focus-within:bg-[var(--color-line)]">
          <Plus className="h-4 w-4 text-[var(--color-accent)]" />
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && text.trim()) {
                addTask(text, project.id)
                setText('')
              } else if (e.key === 'Escape') {
                setText('')
                ;(e.target as HTMLInputElement).blur()
              }
            }}
            placeholder="Add…"
            className="w-full bg-transparent text-[13px] text-[var(--color-ink)] outline-none placeholder:text-[var(--color-faint)]"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-1.5 pb-2 pt-1">
        {list.map((t) => (
          <TaskRow
            key={t.id}
            task={t}
            showTag={false}
            selected={selectedId === t.id}
          />
        ))}
        {list.length === 0 && (
          <div className="px-3 py-6 text-center text-[12px] text-[var(--color-faint)]">
            Empty
          </div>
        )}
      </div>
    </div>
  )
}
