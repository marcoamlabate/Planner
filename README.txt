ADHD Planner v46 direct / design cleanup + Sync tab

Replace these files in the GitHub repository root:

index.html
app.js
sw.js

Open after upload:
https://marcoamlabate.github.io/Planner/?v=46

Changes:
- Updated APP_VERSION to v46 and changed the service worker cache name.
- Added a new Sync tab for Apple sync and backup/maintenance tools.
- Added a Today “Now / Next” command-center card with a best-next-move task and quick buttons.
- Added a Today shortcut to Plan Today that opens Tasks > Today on the current date.
- Added a Today shortcut to the new Sync tab that shows the pending Apple change count.
- Sync tab shows pending Apple changes with type/operation/reason so it is easier to understand what will be sent to the Shortcut.
- The desktop and phone navigation now include Sync.
- The main floating/side action button now becomes a sync action while on the Sync tab.

Still preserved:
- v45 pending Apple sync logic.
- Planner Import Shortcut name and launch flow.
- Tasks > Today and General tasks.
- Calendar, Meds, Notes, backups, and Apple export behavior.
- Hidden task/event action buttons from v45.

Recommended quick tests:
1. Open https://marcoamlabate.github.io/Planner/?v=46.
2. Confirm the new Sync tab appears in the top nav.
3. Create or edit a General task and confirm the Sync tab shows it as pending.
4. Tap the Sync button on Today and confirm it opens the Sync tab.
5. Tap Plan Today and confirm it opens Tasks > Today.
6. Run Sync Pending Changes to Apple after confirming the pending list looks right.
