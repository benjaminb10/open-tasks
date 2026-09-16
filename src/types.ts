export type ColorKey =
  | 'slate'
  | 'red'
  | 'orange'
  | 'amber'
  | 'yellow'
  | 'lime'
  | 'green'
  | 'emerald'
  | 'teal'
  | 'cyan'
  | 'sky'
  | 'blue'
  | 'indigo'
  | 'violet'
  | 'purple'
  | 'fuchsia'
  | 'pink'
  | 'rose'

export interface Project {
  id: string
  name: string
  color: ColorKey
  order: number
}

export interface Task {
  id: string
  title: string
  notes?: string
  projectId: string
  done: boolean
  starred: boolean
  order: number
  createdAt: number
  completedAt?: number
}

/** The pseudo-project id for the global "all tasks" view. */
export const ALL = '__all__'
