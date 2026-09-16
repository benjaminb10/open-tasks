import { useEffect, useRef, useState } from 'react'
import { syncEnabled } from './supabase'
import { useAuth, initAuth } from './auth'
import { startSync, stopSync } from './sync'

/** Gates the app on auth when sync is configured. Local-only mode otherwise. */
export default function AuthGate({ children }: { children: React.ReactNode }) {
  const session = useAuth((s) => s.session)
  const ready = useAuth((s) => s.ready)
  const started = useRef(false)

  useEffect(() => {
    initAuth()
  }, [])

  // Start/stop cloud sync with the session.
  useEffect(() => {
    if (!syncEnabled) return
    const uid = session?.user?.id
    if (uid && !started.current) {
      started.current = true
      startSync(uid)
    } else if (!uid && started.current) {
      started.current = false
      stopSync()
    }
  }, [session])

  if (!syncEnabled) return <>{children}</>
  if (!ready) return null
  if (!session) return <SignIn />
  return <>{children}</>
}

function SignIn() {
  const { signInEmail, signInPassword, verifyCode, signInGoogle } = useAuth()
  const [mode, setMode] = useState<'magic' | 'password'>('magic')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [sent, setSent] = useState(false)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  async function magic() {
    if (!email.trim()) return
    setBusy(true)
    setErr('')
    const { error } = await signInEmail(email)
    setBusy(false)
    if (error) setErr(error)
    else setSent(true)
  }

  async function password_() {
    if (!email.trim() || !password) return
    setBusy(true)
    setErr('')
    const { error } = await signInPassword(email, password)
    setBusy(false)
    if (error) setErr(error)
  }

  async function verify() {
    const c = code.replace(/\s/g, '')
    if (!c) return
    setBusy(true)
    setErr('')
    const { error } = await verifyCode(email, c)
    setBusy(false)
    if (error) setErr('Invalid or expired code.')
  }

  return (
    <div
      data-tauri-drag-region
      className="flex h-full w-full items-center justify-center bg-[var(--color-app)] p-6"
    >
      <div
        style={{ width: 380, maxWidth: '100%' }}
        className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-panel)] p-7 shadow-xl"
      >
        <div className="mb-5 flex flex-col items-center text-center">
          <div className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-[var(--color-accent)] text-white shadow-sm">
            <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
              <path
                d="M5 12.5l4 4 10-10.5"
                stroke="currentColor"
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="text-[19px] font-semibold tracking-tight">Welcome to Tasks</div>
          <div className="mt-1 text-[13px] leading-relaxed text-[var(--color-muted)]">
            Sign in to sync your tasks
            <br />
            across all your devices.
          </div>
        </div>

        {sent ? (
          <div>
            <div className="mb-3 rounded-xl bg-[color-mix(in_srgb,var(--color-accent)_10%,transparent)] px-4 py-3 text-center text-[13px] leading-relaxed text-[var(--color-ink)]">
              📬 Email sent to <b>{email}</b>.
              <br />
              <span className="text-[12px] text-[var(--color-muted)]">
                Enter the <b>6-digit code</b> you received below.
              </span>
            </div>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 8))}
              onKeyDown={(e) => e.key === 'Enter' && verify()}
              inputMode="numeric"
              autoFocus
              placeholder="123456"
              className="mb-2.5 w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-app)] px-3.5 py-2.5 text-center text-[20px] font-semibold tracking-[0.3em] outline-none transition-colors focus:border-[color-mix(in_srgb,var(--color-accent)_55%,var(--color-line))]"
            />
            <button
              onClick={verify}
              disabled={busy || !code.trim()}
              className="w-full rounded-xl bg-[var(--color-accent)] py-2.5 text-[14px] font-medium text-white transition-opacity hover:opacity-95 disabled:opacity-40"
            >
              {busy ? '…' : 'Sign in'}
            </button>
            <div className="mt-3 flex items-center justify-center gap-3 text-[12px] text-[var(--color-muted)]">
              <button onClick={magic} className="hover:text-[var(--color-accent)]">
                Resend a code
              </button>
              <span className="text-[var(--color-faint)]">·</span>
              <button
                onClick={() => {
                  setSent(false)
                  setCode('')
                }}
                className="hover:text-[var(--color-accent)]"
              >
                Other address
              </button>
            </div>
          </div>
        ) : (
          <>
            <button
              onClick={signInGoogle}
              className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-[var(--color-line)] py-2.5 text-[14px] font-medium transition-colors hover:bg-[var(--color-line)]"
            >
              <GoogleGlyph />
              Continue with Google
            </button>
            <div className="my-4 flex items-center gap-3 text-[11px] uppercase tracking-wider text-[var(--color-faint)]">
              <div className="h-px flex-1 bg-[var(--color-line)]" />
              or
              <div className="h-px flex-1 bg-[var(--color-line)]" />
            </div>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (mode === 'magic' ? magic() : password_())}
              type="email"
              autoFocus
              placeholder="you@email.com"
              className="mb-2.5 w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-app)] px-3.5 py-2.5 text-[14px] outline-none transition-colors focus:border-[color-mix(in_srgb,var(--color-accent)_55%,var(--color-line))]"
            />
            {mode === 'password' && (
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && password_()}
                type="password"
                placeholder="password"
                className="mb-2.5 w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-app)] px-3.5 py-2.5 text-[14px] outline-none transition-colors focus:border-[color-mix(in_srgb,var(--color-accent)_55%,var(--color-line))]"
              />
            )}
            <button
              onClick={mode === 'magic' ? magic : password_}
              disabled={busy || !email.trim() || (mode === 'password' && !password)}
              className="w-full rounded-xl bg-[var(--color-accent)] py-2.5 text-[14px] font-medium text-white transition-opacity hover:opacity-95 disabled:opacity-40"
            >
              {busy
                ? '…'
                : mode === 'magic'
                  ? 'Get a code by email'
                  : 'Sign in'}
            </button>
            <button
              onClick={() => {
                setErr('')
                setMode((m) => (m === 'magic' ? 'password' : 'magic'))
              }}
              className="mt-3 w-full text-center text-[12px] text-[var(--color-muted)] hover:text-[var(--color-accent)]"
            >
              {mode === 'magic'
                ? 'Sign in with a password (Mac app)'
                : '← Get an email link instead'}
            </button>
          </>
        )}
        {err && (
          <div className="mt-3 rounded-lg bg-[color-mix(in_srgb,red_10%,transparent)] px-3 py-2 text-[12.5px] text-red-500">
            {err}
          </div>
        )}
      </div>
    </div>
  )
}

function GoogleGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" aria-hidden>
      <path
        fill="#4285F4"
        d="M23.5 12.3c0-.9-.1-1.7-.2-2.5H12v4.8h6.5c-.3 1.5-1.1 2.7-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.9z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.2-4 1.2-3.1 0-5.7-2.1-6.6-4.9H1.4v3.1C3.4 21.3 7.4 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.4 14.4c-.2-.7-.4-1.4-.4-2.4s.1-1.7.4-2.4V6.5H1.4C.5 8.2 0 10 0 12s.5 3.8 1.4 5.5l4-3.1z"
      />
      <path
        fill="#EA4335"
        d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4C17.9 1.2 15.2 0 12 0 7.4 0 3.4 2.7 1.4 6.5l4 3.1C6.3 6.8 8.9 4.8 12 4.8z"
      />
    </svg>
  )
}
