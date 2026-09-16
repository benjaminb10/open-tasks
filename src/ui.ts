import { create } from 'zustand'
import { ALL } from './types'

export const STARRED = '__starred__'

export type Filter = typeof ALL | typeof STARRED | string // string = projectId

interface UIState {
  filter: Filter
  starredOnly: boolean
  search: string
  selectedId: string | null
  hoveredId: string | null
  draggingId: string | null
  dropId: string | null
  dropPlace: 'before' | 'after'
  editingId: string | null
  view: 'list' | 'board'
  commandOpen: boolean
  projectEditorOpen: boolean
  importOpen: boolean
  sidebarOpen: boolean

  setFilter: (f: Filter) => void
  toggleStarredOnly: () => void
  setSearch: (q: string) => void
  select: (id: string | null) => void
  hover: (id: string | null) => void
  setDragging: (id: string | null) => void
  setDrop: (id: string | null, place?: 'before' | 'after') => void
  edit: (id: string | null) => void
  setView: (v: 'list' | 'board') => void
  toggleView: () => void
  setCommandOpen: (b: boolean) => void
  setProjectEditorOpen: (b: boolean) => void
  setImportOpen: (b: boolean) => void
  setSidebarOpen: (b: boolean) => void
}

export const useUI = create<UIState>((set) => ({
  filter: ALL,
  starredOnly: false,
  search: '',
  selectedId: null,
  hoveredId: null,
  draggingId: null,
  dropId: null,
  dropPlace: 'before',
  editingId: null,
  view: 'list',
  commandOpen: false,
  projectEditorOpen: false,
  importOpen: false,
  sidebarOpen: false,

  setFilter: (filter) => set({ filter, selectedId: null, sidebarOpen: false }),
  toggleStarredOnly: () => set((s) => ({ starredOnly: !s.starredOnly })),
  setSearch: (search) => set({ search }),
  select: (selectedId) => set({ selectedId }),
  hover: (hoveredId) => set({ hoveredId }),
  setDragging: (draggingId) => set({ draggingId }),
  setDrop: (dropId, dropPlace = 'before') => set({ dropId, dropPlace }),
  edit: (editingId) => set({ editingId }),
  setView: (view) => set({ view }),
  toggleView: () => set((s) => ({ view: s.view === 'list' ? 'board' : 'list' })),
  setCommandOpen: (commandOpen) => set({ commandOpen }),
  setProjectEditorOpen: (projectEditorOpen) => set({ projectEditorOpen }),
  setImportOpen: (importOpen) => set({ importOpen }),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
}))
