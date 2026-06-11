ADHD Planner v48 — visual polish pass

Replace these files in the root of the GitHub Pages repo:

index.html
app.js
sw.js
icon.png

Then open:

https://marcoamlabate.github.io/Planner/?v=48

What changed:
- Updated the app version to v48.
- Updated the service worker cache name so the new shell/icon can refresh.
- Added the new modern glassy app icon as icon.png.
- Polished the visual system with a deeper navy/glassy palette.
- Added softer card surfaces, stronger spacing, shadows, and glass-style panels.
- Improved phone navigation, search button, progress bar, focus card, tabs, task cards, event cards, and floating action button.
- Kept existing v47 behavior and data logic intact.

Suggested test:
- Open the app on iPhone with ?v=48.
- Check Today, Tasks, Calendar, Meds, Notes, and Sync.
- Tap task/event cards to confirm action mode still opens.
- Confirm the Sync floating button is still yellow on the Sync tab.
