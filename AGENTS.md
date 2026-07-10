# AGENTS.md â€” Planner App

## Mission

Maintain the Planner app as a reliable, mobile-first, local-first iPhone PWA. Make surgical changes without losing data or features.

## Read first

Before editing:

1. Read `CODEX_HANDOFF.md`.
2. Read `TODO.md`.
3. Inspect the latest `index.html`, `app.js`, `sw.js`, `manifest.webmanifest`, and related assets.
4. Treat current repository code as source of truth.
5. Do not patch from old versioned files or memory.

## Architecture constraints

- Static GitHub Pages app.
- No backend by default.
- No npm/build pipeline by default.
- React and ReactDOM are loaded from CDN.
- `app.js` uses plain JavaScript and `React.createElement`, not JSX.
- Data is stored locally, primarily in `localStorage`.
- Keep `adhd3_` storage keys unless a deliberate migration is required.
- Do not introduce a framework migration, loader, bundler, TypeScript, database, server, analytics, or external dependency without explicit approval.
- Never hardcode secrets.

## Coding conventions

- Match the existing plain-JavaScript style.
- Prefer small pure helpers and localized edits.
- Avoid broad rewrites of the monolithic `app.js`.
- Use defensive parsing and safe defaults.
- Preserve existing object fields and IDs.
- Maintain backward compatibility with old backups.
- Do not trigger edit/sync/export side effects during backup import.
- Stop event propagation for nested buttons and checkboxes when card taps have behavior.
- Keep mobile tap targets large.
- Respect iPhone safe areas and dynamic viewport units.
- Keep UI calm, dark, and restrained.
- Preserve meaningful colors for urgency, priority, sync state, destructive actions, and user-selected colors.
- Keep Apple-export notes human-readable; put metadata in structured JSON fields.

## Required validation

There is no verified build step, lint script, or automated test suite.

Run before every delivery:

```bash
node --check app.js
git diff --check
```

For local smoke testing:

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000/`.

Manual smoke test:

- App loads without blank screen.
- Today, Tasks, Calendar, Meds, and Notes open.
- Search opens and closes.
- Floating add control behaves correctly.
- Touched feature works.
- No unrelated feature disappeared.
- Mobile scrolling and taps work.
- PWA safe-area/background looks correct.
- Backup export/import works when persistence changed.
- Apple task/event export works when payloads changed.

## Version and cache rule

For every actual patch:

- Increment `APP_VERSION` in `app.js`.
- Change `CACHE_NAME` in `sw.js` to a unique matching value.
- Use a matching cache-busting production URL.

Never deliver a patch with stale version/cache identifiers.

## Things Codex must not change without explicit approval

- GitHub Pages hosting model.
- Local-first storage model.
- Core navigation or major feature set.
- Separation between main Today dashboard and `Tasks > Today`.
- Apple Shortcuts bridge.
- Existing storage keys/data shapes without migration.
- Backup compatibility.
- PWA manifest/icon identity.
- React major version or CDN strategy.
- No-build deployment workflow.
- Functional urgency/priority colors.
- User-created categories, folders, colors, medication data, notes, tasks, events, or IDs.

## Delivery format

Report:

- What changed.
- Files changed.
- Validation performed.
- Anything not tested.
- Exact replacement/deployment steps.
- Cache-busting production URL.

## Google Drive patch archive

After every published app version:

- Create a versioned ZIP named `Planner_v<version>_patch.zip`.
- Include the repository files changed by that version and a short `PATCH_NOTES.md`.
- Upload the ZIP to Google Drive under `App Projects/Planner/Patches`.
- Verify the uploaded Drive file before reporting the release as complete.
- Include the Google Drive file link in the final release report.

Be explicit about uncertainty. Do not invent missing information.

