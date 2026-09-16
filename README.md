# Open Tasks

A fast, keyboard-first todo app. Think Google Tasks, but with a single global view of everything, colored project tags, and almost no clicking. One codebase runs on the web, on macOS (a real app in your Dock), and on iOS.

![Global list view with colored project tags](docs/screenshot-list.png)

## Why it exists

Google Tasks is clean but siloed: your tasks live inside separate lists and you can never see everything at once. Notion is powerful but heavy: every action is a click, pages take a moment to load, and it is overkill for a plain todo list.

Open Tasks keeps the calm look of Google Tasks and adds the one thing it is missing: a single global view where every task carries a colored tag for its project. You add, tag, star, reorder, and complete tasks almost entirely from the keyboard.

## Feels instant, and here is why

The speed does not come from Rust. It comes from being **local-first**.

- All your data lives in the browser (localStorage). Reads never touch the network, so there are no spinners and no loading states. Every keystroke, toggle, and reorder is applied to local state and painted on the next frame.
- The UI is a lightweight React + TypeScript app built with Vite and styled with Tailwind CSS v4. No heavy component framework, no data-fetching layer on the hot path.
- Cloud sync (optional, see below) runs in the background. A reorder writes a single row thanks to fractional ordering, so syncing never blocks the interface.
- The desktop and mobile apps are wrapped with [Tauri 2](https://tauri.app). Tauri gives a tiny native shell (the Rust part is about fifteen lines) around the exact same web frontend, so the app starts fast and stays small. Rust ships the app; it is not what makes typing feel instant.

So: local-first state for instant feel, React + Vite + Tailwind for a light UI, Tauri to package it everywhere.

## The `#project` quick-add syntax

The fastest way to file a task is to type its project inline. In the quick-add field, write a `#` followed by a project name and the task lands in that project automatically:

```
Draft the launch email #Marketing
Fix the dark-mode contrast #Design
Call the plumber #Personal
```

- The `#tag` is stripped from the title, so the saved task reads "Draft the launch email" and gets the Marketing tag.
- If the project does not exist yet, it is created on the fly with a fresh color.
- Prefer the mouse or want to pick from a list? Press `Tab` in the quick-add field to open the project picker instead.

You never have to open a project first, then add a task inside it. You just type.

## Feature tour

- **Global tagged view.** "Toutes les tâches" shows every open task with its colored project tag.
- **Board view.** Press `b` to switch to columns per project (Kanban style). It respects your filters, including the starred ("Suivies") view.
- **Stars / followed tasks.** Star anything and filter to just your followed tasks with one shortcut.
- **Drag and drop everywhere.** Reorder tasks in the list and in the board. The task you just moved keeps focus.
- **Move a task by its tag.** Click a task's colored project tag to pop a picker and move it to another project.
- **Clickable links.** URLs in titles and notes are detected and open in your browser.
- **One-click edit.** Click a task title to edit in place. No double-click, no modal.
- **Undo.** `Cmd/Ctrl + Z` reverts your last action (uncheck what you just checked, restore what you deleted, and so on).
- **Import from Google Tasks.** Bring your existing lists and tasks in from a Google Tasks export.

### Keyboard shortcuts

| Key | Action |
| --- | --- |
| `n` | New task |
| `j` / `k` | Move selection down / up |
| `x` | Toggle done |
| `e` | Edit the selected task |
| `s` | Star / follow |
| `f` | Filter to followed tasks |
| `1`..`9` | Jump to a project |
| `b` | Toggle list / board view |
| `Cmd/Ctrl + Z` | Undo |
| `/` | Focus search |
| `#name` | Quick-add straight into a project |
| `Tab` (in quick-add) | Open the project picker |

## How it compares

| | Google Tasks | Notion | Open Tasks |
| --- | --- | --- | --- |
| One global view of all tasks | No | Yes, with setup | Yes, out of the box |
| Colored project tags | No | Manual | Yes, automatic |
| Keyboard-first | Limited | Limited | Yes |
| Feels instant | Yes | No | Yes |
| Works offline / local-first | Partly | No | Yes, fully |
| Native Mac + iOS app | Web only | Heavy app | Yes, one codebase |
| Self-hostable / open source | No | No | Yes (MIT) |

## Run it locally (no account, no server)

Out of the box the app runs 100% locally: your tasks are stored in the browser, there is no login, and nothing leaves your machine.

```bash
npm install
npm run dev
```

Then open http://localhost:5173. A curated demo dataset is seeded on first run so the app looks alive; your first real action replaces it.

## Build the apps

One codebase, three targets.

- **Web:** `npm run build` produces a static bundle in `dist/` that you can host anywhere.
- **macOS app:** `npm run build:mac` builds a real `.app` you can drop in your Applications folder and Dock (Tauri).
- **iOS app:** `npm run tauri ios init` then `npm run tauri ios build`. You need Xcode and an Apple Developer account to sign and ship to TestFlight.

The mobile UI is included and open source too: on a small screen it switches to a Google-Tasks-style pager where you swipe horizontally between lists.

## Optional: cloud sync across devices

Sync is off by default. If you want your tasks to follow you across web, Mac, and iOS, point the app at a [Supabase](https://supabase.com) project. Sync turns on automatically when both environment variables are present, and stays off otherwise (the app keeps running fully locally).

Create a `.env` file at the project root:

```
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

Notes:

- Only the **anon / publishable** key belongs in the frontend. Never put a `service_role` key in the app or in the repo.
- Row Level Security is enabled so each user only ever sees their own rows. The SQL lives in `supabase/migrations/`.
- Auth supports email magic link, password, and a 6-digit code (handy inside the mobile webview).
- `.env` is gitignored. Keep it that way.

## Tech stack

- React 19 + TypeScript
- Vite (build + dev server)
- Tailwind CSS v4
- Zustand (+ persist to localStorage) for state
- Tauri 2 for the macOS and iOS shells
- Supabase (Postgres + Auth + Realtime) for optional sync

## License

[MIT](LICENSE). Do what you like with it.
