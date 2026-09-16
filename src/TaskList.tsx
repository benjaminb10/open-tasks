import { useStore } from './store'
import { useUI, STARRED } from './ui'
import { ALL } from './types'
import { visibleTasks, projectById } from './selectors'
import TaskRow from './TaskRow'

export default function TaskList() {
  const tasks = useStore((s) => s.tasks)
  const projects = useStore((s) => s.projects)
  const showCompleted = useStore((s) => s.showCompleted)
  const { filter, search, selectedId, starredOnly } = useUI()

  const list = visibleTasks(tasks, filter, search, showCompleted, starredOnly)
  const byId = projectById(projects)
  const showTag = filter === ALL || filter === STARRED

  const openTasks = list.filter((t) => !t.done)
  const doneTasks = list.filter((t) => t.done)

  if (list.length === 0) {
    return (
      <div className="grid h-full place-items-center text-center">
        <div className="text-[var(--color-faint)]">
          <div className="text-[15px] font-medium">Rien ici pour l’instant</div>
          <div className="mt-1 text-[13px]">
            Ajoute une tâche ci-dessus{search ? ' ou change ta recherche' : ''}.
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 pb-24 pt-3">
      <div className="flex flex-col">
        {openTasks.map((t) => (
          <TaskRow
            key={t.id}
            task={t}
            project={byId.get(t.projectId)}
            showTag={showTag}
            selected={selectedId === t.id}
          />
        ))}
      </div>

      {doneTasks.length > 0 && (
        <>
          <div className="mt-5 mb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-faint)]">
            Terminées · {doneTasks.length}
          </div>
          <div className="flex flex-col opacity-80">
            {doneTasks.map((t) => (
              <TaskRow
                key={t.id}
                task={t}
                project={byId.get(t.projectId)}
                showTag={showTag}
                selected={selectedId === t.id}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
