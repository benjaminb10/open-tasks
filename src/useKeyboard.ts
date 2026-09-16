import { useEffect } from 'react'
import { useStore } from './store'
import { useUI } from './ui'
import { ALL } from './types'
import { visibleTasks } from './selectors'
import { undo, redo, initHistory } from './history'

function isTyping(): boolean {
  const el = document.activeElement as HTMLElement | null
  if (!el) return false
  const tag = el.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || el.isContentEditable
}

export function useKeyboard(refs: {
  quickAdd: React.RefObject<HTMLInputElement | null>
  search: React.RefObject<HTMLInputElement | null>
}) {
  useEffect(() => {
    initHistory()

    function currentList() {
      const s = useStore.getState()
      const u = useUI.getState()
      return visibleTasks(s.tasks, u.filter, u.search, s.showCompleted, u.starredOnly)
    }

    function moveSel(dir: 1 | -1) {
      const list = currentList()
      if (list.length === 0) return
      const u = useUI.getState()
      const idx = list.findIndex((t) => t.id === u.selectedId)
      let next: number
      if (idx < 0) next = dir === 1 ? 0 : list.length - 1
      else next = Math.min(Math.max(idx + dir, 0), list.length - 1)
      u.select(list[next].id)
    }

    function onKey(e: KeyboardEvent) {
      const u = useUI.getState()
      const s = useStore.getState()

      // Command palette — works anywhere
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        u.setCommandOpen(!u.commandOpen)
        return
      }

      if (u.commandOpen || u.projectEditorOpen) return

      // Reorder selected — works even while list focused (not typing)
      if ((e.metaKey || e.ctrlKey) && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
        if (isTyping()) return
        const list = currentList()
        const idx = list.findIndex((t) => t.id === u.selectedId)
        if (idx < 0) return
        e.preventDefault()
        const target = e.key === 'ArrowUp' ? list[idx - 1] : list[idx + 1]
        if (target) s.reorderTask(u.selectedId!, target.id, e.key === 'ArrowUp' ? 'before' : 'after')
        return
      }

      if (isTyping()) return

      // Undo / redo — only outside text fields (inputs keep native undo)
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        if (e.shiftKey) redo()
        else undo()
        return
      }

      const projects = [...s.projects].sort((a, b) => a.order - b.order)
      // Row actions target the hovered row first, else the keyboard-selected one.
      const active = u.hoveredId ?? u.selectedId

      switch (e.key) {
        case '/':
          e.preventDefault()
          refs.search.current?.focus()
          return
        case 'n':
        case 'a':
          e.preventDefault()
          refs.quickAdd.current?.focus()
          return
        case 'b':
          e.preventDefault()
          u.toggleView()
          return
        case 'f':
          e.preventDefault()
          u.toggleStarredOnly()
          return
        case 'j':
        case 'ArrowDown':
          e.preventDefault()
          moveSel(1)
          return
        case 'k':
        case 'ArrowUp':
          e.preventDefault()
          moveSel(-1)
          return
        case 'x':
        case ' ':
          if (active) {
            e.preventDefault()
            s.toggleTask(active)
          }
          return
        case 's':
          if (active) {
            e.preventDefault()
            s.starTask(active)
          }
          return
        case 'e':
        case 'Enter':
          if (active) {
            e.preventDefault()
            u.edit(active)
          }
          return
        case 'Backspace':
        case 'Delete':
          if (active) {
            e.preventDefault()
            const list = currentList()
            const idx = list.findIndex((t) => t.id === active)
            s.deleteTask(active)
            if (active === u.selectedId) {
              const nextSel = list[idx + 1] ?? list[idx - 1]
              u.select(nextSel ? nextSel.id : null)
            }
          }
          return
        case 'Escape':
          u.select(null)
          return
        case '0':
          e.preventDefault()
          u.setFilter(ALL)
          return
      }

      // Digits 1-9 → jump to project
      if (/^[1-9]$/.test(e.key)) {
        const p = projects[Number(e.key) - 1]
        if (p) {
          e.preventDefault()
          u.setFilter(p.id)
        }
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [refs])
}
