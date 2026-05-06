ADHD Planner - Simple PWA Version

This is the easiest no-Replit version.
It is a static PWA: index.html + manifest.webmanifest + sw.js + icon.png.

What it does:
- Opens like a normal website the first time.
- Can be added to iPhone Home Screen from Safari.
- Saves your planner data locally on that device using localStorage.
- After the first successful load, it should open offline because the service worker caches the app.

Important:
- First install/load needs internet.
- If you delete Safari website data or remove the Home Screen app, local planner data can be lost.
- Phone and iPad will not sync automatically in this version.

Simplest upload path:
1. Create a GitHub account if you do not have one.
2. Create a new repository, for example: adhd-planner.
3. Upload these four files to the repository root:
   - index.html
   - manifest.webmanifest
   - sw.js
   - icon.png
4. In GitHub, go to Settings > Pages.
5. Under Build and deployment, choose:
   Source: Deploy from a branch
   Branch: main
   Folder: /root
6. Save.
7. GitHub gives you a website link after it deploys.
8. Open that link on your iPhone in Safari.
9. Tap Share > Add to Home Screen.
10. Open the new app icon once while online.
11. Then test Airplane Mode.
