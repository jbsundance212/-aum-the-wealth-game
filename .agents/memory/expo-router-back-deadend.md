---
name: expo-router router.back() dead-end on web
description: Why bare router.back() strands users on Expo Web and the guarded helpers to use instead
---

On Expo Web, `router.back()` is a silent no-op (and logs "The action 'GO_BACK'
was not handled by any navigator") whenever the screen was reached with no
navigation history — e.g. a browser refresh or a direct/deep link onto a deep
route. The screen stays put, so any button that only calls `router.back()`
appears completely dead even though its other side effects ran.

**Rule:** never call `router.back()` unconditionally on a route a user can land
on directly. Guard it: `router.canGoBack() ? router.back() : router.replace(<safe route>)`.

**How to apply (AUM mobile):** use the helpers in
`artifacts/mobile/src/utils/nav.ts` — `exitToHub(router, day)` for day-station
completion handlers (falls back to `/day/<day>`), and `safeBack(router, fallback="/")`
for the shared `Header` BACK control. All 8 day stations + Header route through
these. Reuse them for any new station-like or directly-loadable route.

**Why:** a user reported the briefing "Acknowledge" button did nothing after a
Safari refresh; root cause was this no-history `router.back()`, not the audio
(there is no audio gating on that button).
