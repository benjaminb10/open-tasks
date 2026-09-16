import { forwardRef, useEffect, useMemo, useRef, useState } from 'react'
import { useStore } from './store'
import { useUI, STARRED } from './ui'
import { ALL, type Project } from './types'
import { DOT, chipBg, chipText } from './colors'
import { Plus } from './Icons'

/** Strip a `#tag` from the text and resolve it to a project id (if any). */
function resolve(
  raw: string,
  projects: Project[],
): { title: string; taggedId?: string } {
  const anyTag = raw.match(/#([\p{L}\p{N}][\p{L}\p{N}_/&.-]*)/u)
  if (!anyTag) return { title: raw }
  const tag = anyTag[1].toLowerCase()
  const title = raw.replace(anyTag[0], '').replace(/\s+/g, ' ').trim()
  const p =
    projects.find((p) => p.name.toLowerCase().replace(/\s/g, '').startsWith(tag)) ||
    projects.find((p) => p.name.toLowerCase().replace(/\s/g, '').includes(tag))
  return { title, taggedId: p?.id }
}

const QuickAdd = forwardRef<HTMLInputElement>((_, ref) => {
  const [text, setText] = useState('')
  const [picked, setPicked] = useState<string | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pQuery, setPQuery] = useState('')
  const [pIndex, setPIndex] = useState(0)
  const projects = [...useStore((s) => s.projects)].sort((a, b) => a.order - b.order)
  const addTask = useStore((s) => s.addTask)
  const { filter, select } = useUI()
  const pickerInputRef = useRef<HTMLInputElement>(null)
  const inputRef = ref as React.RefObject<HTMLInputElement>

  const fallbackId =
    filter !== ALL && filter !== STARRED
      ? filter
      : (projects.find((p) => p.name === 'Inbox') ?? projects[0])?.id

  // Reset the manual pick when the active filter changes.
  useEffect(() => setPicked(null), [filter])

  const { title, taggedId } = useMemo(() => resolve(text, projects), [text, projects])
  const targetId = picked ?? taggedId ?? fallbackId
  const project = projects.find((p) => p.id === targetId)

  const filtered = useMemo(() => {
    const q = pQuery.toLowerCase().trim()
    return q ? projects.filter((p) => p.name.toLowerCase().includes(q)) : projects
  }, [pQuery, projects])

  useEffect(() => setPIndex(0), [pQuery])

  function openPicker() {
    setPQuery('')
    setPickerOpen(true)
    setTimeout(() => pickerInputRef.current?.focus(), 0)
  }
  function choose(id: string) {
    setPicked(id)
    setPickerOpen(false)
    setTimeout(() => inputRef.current?.focus(), 0)
  }
  function commit() {
    if (!title.trim() || !project) return
    const id = addTask(title, project.id)
    select(id)
    setText('')
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-2 rounded-xl border border-[var(--color-line)] bg-[var(--color-panel)] px-3 py-2 shadow-sm focus-within:border-[color-mix(in_srgb,var(--color-accent)_45%,var(--color-line))]">
        <Plus className="h-[18px] w-[18px] shrink-0 text-[var(--color-accent)]" />
        <input
          ref={ref}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Tab' && !e.shiftKey) {
              e.preventDefault()
              openPicker()
            } else if (e.key === 'Enter') {
              e.preventDefault()
              commit()
            } else if (e.key === 'Escape') {
              setText('')
              ;(e.target as HTMLInputElement).blur()
            }
          }}
          placeholder="Add a task…  (#project or ⇥ to choose)"
          className="min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-[var(--color-faint)]"
        />
        {project && (
          <button
            type="button"
            onClick={openPicker}
            title="Change project (⇥)"
            className="flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium transition-transform hover:scale-[1.03]"
            style={{ background: chipBg(project.color), color: chipText(project.color) }}
          >
            <span className="h-2 w-2 rounded-full" style={{ background: DOT[project.color] }} />
            {project.name}
          </button>
        )}
        <kbd className="hidden shrink-0 rounded bg-[var(--color-line)] px-1.5 py-0.5 text-[11px] text-[var(--color-faint)] sm:inline">
          ⏎
        </kbd>
      </div>

      {pickerOpen && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => choose(targetId!)} />
          <div className="animate-in absolute right-0 top-full z-30 mt-1.5 w-64 overflow-hidden rounded-xl border border-[var(--color-line)] bg-[var(--color-panel)] shadow-2xl">
            <input
              ref={pickerInputRef}
              value={pQuery}
              onChange={(e) => setPQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown') {
                  e.preventDefault()
                  setPIndex((n) => Math.min(n + 1, filtered.length - 1))
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault()
                  setPIndex((n) => Math.max(n - 1, 0))
                } else if (e.key === 'Enter' || e.key === 'Tab') {
                  e.preventDefault()
                  const p = filtered[pIndex]
                  if (p) choose(p.id)
                } else if (e.key === 'Escape') {
                  e.preventDefault()
                  setPickerOpen(false)
                  setTimeout(() => inputRef.current?.focus(), 0)
                }
              }}
              placeholder="Project…"
              className="w-full border-b border-[var(--color-line)] bg-transparent px-3 py-2 text-[13px] outline-none placeholder:text-[var(--color-faint)]"
            />
            <div className="max-h-64 overflow-y-auto p-1">
              {filtered.length === 0 && (
                <div className="px-3 py-3 text-center text-[12px] text-[var(--color-faint)]">
                  No project
                </div>
              )}
              {filtered.map((p, i) => (
                <button
                  key={p.id}
                  type="button"
                  onMouseMove={() => setPIndex(i)}
                  onClick={() => choose(p.id)}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-[13px] ${
                    i === pIndex
                      ? 'bg-[color-mix(in_srgb,var(--color-accent)_14%,transparent)]'
                      : ''
                  }`}
                >
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: DOT[p.color] }} />
                  <span className="flex-1 truncate">{p.name}</span>
                  {p.id === targetId && <span className="text-[var(--color-accent)]">✓</span>}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
})

QuickAdd.displayName = 'QuickAdd'
export default QuickAdd
