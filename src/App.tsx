import { useRef } from 'react'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import QuickAdd from './QuickAdd'
import TaskList from './TaskList'
import BoardView from './BoardView'
import CommandPalette from './CommandPalette'
import ProjectEditor from './ProjectEditor'
import ImportModal from './ImportModal'
import { useUI } from './ui'
import { useKeyboard } from './useKeyboard'
import { useIsMobile } from './useIsMobile'
import MobilePager from './MobilePager'

export default function App() {
  const view = useUI((s) => s.view)
  const quickAdd = useRef<HTMLInputElement>(null)
  const search = useRef<HTMLInputElement>(null)
  useKeyboard({ quickAdd, search })
  const isMobile = useIsMobile()

  // Phone: Google-Tasks-style horizontally swipeable lists.
  if (isMobile) {
    return (
      <>
        <MobilePager />
        <CommandPalette />
        <ProjectEditor />
        <ImportModal />
      </>
    )
  }

  const sidebarOpen = useUI((s) => s.sidebarOpen)
  const setSidebarOpen = useUI((s) => s.setSidebarOpen)

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* Sidebar: static on desktop, slide-over drawer on mobile */}
      <div
        className={`fixed inset-y-0 left-0 z-40 transition-transform duration-200 md:static md:z-auto md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar />
      </div>
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <main className="flex min-w-0 flex-1 flex-col">
        <Topbar searchRef={search} />
        {view === 'list' ? (
          <>
            <div className="px-4 pt-3">
              <div className="mx-auto max-w-3xl">
                <QuickAdd ref={quickAdd} />
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <TaskList />
            </div>
          </>
        ) : (
          <div className="min-h-0 flex-1">
            <BoardView />
          </div>
        )}
        <Footer />
      </main>
      <CommandPalette />
      <ProjectEditor />
      <ImportModal />
    </div>
  )
}

function Footer() {
  return (
    <div className="hidden items-center gap-3 border-t border-[var(--color-line)] px-6 py-1.5 text-[11px] text-[var(--color-faint)] md:flex">
      <Kbd>⌘K</Kbd> commandes
      <Kbd>n</Kbd> ajouter
      <Kbd>j</Kbd>
      <Kbd>k</Kbd> naviguer
      <Kbd>x</Kbd> cocher
      <Kbd>e</Kbd> éditer
      <Kbd>s</Kbd> suivre
      <Kbd>f</Kbd> suivies
      <Kbd>1-9</Kbd> projet
      <Kbd>b</Kbd> vue
      <Kbd>⌘Z</Kbd> annuler
    </div>
  )
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded bg-[var(--color-line)] px-1.5 py-0.5 font-sans text-[10.5px] text-[var(--color-muted)]">
      {children}
    </kbd>
  )
}
