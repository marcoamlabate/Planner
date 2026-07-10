# Planner smoke test

Run this before a release:

```powershell
node tests/smoke-test.js
```

It verifies JavaScript syntax plus the release-critical version/cache pairing, existing storage-key contracts, backup confirmation UI, storage-safety UI, and PWA update wiring. It does not replace real iPhone testing.

