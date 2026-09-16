import { useMemo, useState } from 'react'
import { useStore } from './store'
import { useUI } from './ui'
import { ALL } from './types'
import { parseTakeout, statsOf, type ImportedList } from './importGoogle'

export default function ImportModal() {
  const open = useUI((s) => s.importOpen)
  const setOpen = useUI((s) => s.setImportOpen)
  const setFilter = useUI((s) => s.setFilter)
  const importLists = useStore((s) => s.importLists)

  const [raw, setRaw] = useState('')
  const [error, setError] = useState('')
  const [clear, setClear] = useState(true)
  const [drag, setDrag] = useState(false)

  const lists = useMemo<ImportedList[] | null>(() => {
    if (!raw.trim()) return null
    try {
      const parsed = parseTakeout(JSON.parse(raw))
      return parsed
    } catch {
      return null
    }
  }, [raw])

  const stats = lists ? statsOf(lists) : null

  function loadFile(file: File) {
    setError('')
    const reader = new FileReader()
    reader.onload = () => {
      const text = String(reader.result ?? '')
      setRaw(text)
      try {
        const parsed = parseTakeout(JSON.parse(text))
        if (parsed.length === 0)
          setError('Aucune liste trouvée — est-ce bien le fichier Tasks.json de Takeout ?')
      } catch {
        setError('Fichier illisible : ce n’est pas du JSON valide.')
      }
    }
    reader.readAsText(file)
  }

  function doImport() {
    if (!lists || lists.length === 0) return
    importLists(lists, clear)
    setOpen(false)
    setRaw('')
    setFilter(ALL)
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/35 pt-[10vh]"
      onClick={() => setOpen(false)}
    >
      <div
        className="animate-in flex max-h-[80vh] w-[560px] max-w-[92vw] flex-col rounded-2xl border border-[var(--color-line)] bg-[var(--color-panel)] p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-[16px] font-semibold tracking-tight">
          Importer depuis Google Tasks
        </div>

        <ol className="mt-3 space-y-1 text-[13px] leading-relaxed text-[var(--color-muted)]">
          <li>
            1. Va sur{' '}
            <span className="rounded bg-[var(--color-line)] px-1.5 py-0.5 font-mono text-[12px] text-[var(--color-ink)]">
              takeout.google.com
            </span>{' '}
            → décoche tout → coche seulement <b>Tasks</b>.
          </li>
          <li>2. Exporte, télécharge l’archive et décompresse-la.</li>
          <li>
            3. Dépose le fichier <b>Tasks.json</b> ci-dessous (ou colle son contenu).
          </li>
        </ol>

        <label
          onDragOver={(e) => {
            e.preventDefault()
            setDrag(true)
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDrag(false)
            const f = e.dataTransfer.files?.[0]
            if (f) loadFile(f)
          }}
          className={`mt-4 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors ${
            drag
              ? 'border-[var(--color-accent)] bg-[color-mix(in_srgb,var(--color-accent)_8%,transparent)]'
              : 'border-[var(--color-line)] hover:border-[var(--color-faint)]'
          }`}
        >
          <span className="text-[13px] font-medium">
            Glisse ton fichier <b>Tasks.json</b> ici
          </span>
          <span className="mt-0.5 text-[12px] text-[var(--color-faint)]">
            ou clique pour le sélectionner
          </span>
          <input
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) loadFile(f)
            }}
          />
        </label>

        <details className="mt-3">
          <summary className="cursor-pointer text-[12px] text-[var(--color-muted)]">
            …ou coller le JSON manuellement
          </summary>
          <textarea
            value={raw}
            onChange={(e) => {
              setRaw(e.target.value)
              setError('')
            }}
            placeholder='{ "items": [ … ] }'
            className="mt-2 h-24 w-full resize-none rounded-lg border border-[var(--color-line)] bg-[var(--color-app)] p-2 font-mono text-[12px] outline-none focus:border-[color-mix(in_srgb,var(--color-accent)_45%,var(--color-line))]"
          />
        </details>

        {error && <div className="mt-3 text-[13px] text-red-500">{error}</div>}

        {stats && stats.lists > 0 && (
          <div className="mt-4 rounded-lg bg-[var(--color-app)] px-3 py-2.5 text-[13px]">
            Détecté :{' '}
            <b>
              {stats.lists} liste{stats.lists > 1 ? 's' : ''}
            </b>
            ,{' '}
            <b>
              {stats.tasks} tâche{stats.tasks > 1 ? 's' : ''}
            </b>{' '}
            <span className="text-[var(--color-faint)]">({stats.done} terminées)</span>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {lists!.slice(0, 40).map((l, i) => (
                <span
                  key={i}
                  className="rounded-full bg-[var(--color-line)] px-2 py-0.5 text-[11.5px] text-[var(--color-muted)]"
                >
                  {l.name} · {l.tasks.length}
                </span>
              ))}
            </div>
          </div>
        )}

        <label className="mt-4 flex select-none items-center gap-2 text-[13px] text-[var(--color-muted)]">
          <input
            type="checkbox"
            checked={clear}
            onChange={(e) => setClear(e.target.checked)}
            className="h-4 w-4 accent-[var(--color-accent)]"
          />
          Remplacer les projets et tâches actuels (recommandé pour la première fois)
        </label>

        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={() => setOpen(false)}
            className="rounded-lg px-4 py-2 text-[13px] text-[var(--color-muted)] hover:bg-[var(--color-line)]"
          >
            Annuler
          </button>
          <button
            onClick={doImport}
            disabled={!stats || stats.lists === 0}
            className="rounded-lg bg-[var(--color-accent)] px-4 py-2 text-[13px] font-medium text-white disabled:opacity-40"
          >
            Importer{stats && stats.tasks ? ` ${stats.tasks} tâches` : ''}
          </button>
        </div>
      </div>
    </div>
  )
}
