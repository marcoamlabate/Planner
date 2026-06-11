ADHD Planner v47 direct / clean Today + Sync polish

Replace these files in the GitHub repository root:

index.html
app.js
sw.js

Open after upload:
https://marcoamlabate.github.io/Planner/?v=47

Changes:
- Updated APP_VERSION to v47 and changed the service worker cache name.
- Removed the big backup/export/sync card from the Today tab.
- Removed the Now / Next card from the Today tab.
- Removed the Today task and Today event lists from the Today tab.
- Today is now a cleaner landing page with date, Meds status, Sync status, and simple buttons to open Tasks/Calendar.
- Kept all backup/import/full Apple sync/pending Apple sync tools inside the Sync tab.
- App version is shown in the Sync tab instead of the Today tab.
- Made the side/floating action button yellow while the Sync tab is active.

Still preserved:
- v45/v46 pending Apple sync behavior.
- Planner Import Shortcut name and launch flow.
- Tasks > Today and General tasks.
- Calendar, Meds, Notes, backups, and Apple export behavior.
- Hidden task/event action buttons from v45.

Recommended quick tests:
1. Open https://marcoamlabate.github.io/Planner/?v=47.
2. Confirm Today no longer shows Now / Next, task lists, event lists, or the backup card.
3. Confirm backup/import and Apple sync controls are in the Sync tab.
4. Confirm the floating/side action button is yellow on Sync and blue elsewhere.
5. Create/edit/delete a task or event and confirm pending changes still appear in Sync.
