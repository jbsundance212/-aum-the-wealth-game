type AppRouter = ReturnType<typeof import("expo-router").useRouter>;

// Return to the day hub after a station finishes. router.back() is a no-op
// (and logs a GO_BACK error) when the screen was loaded with no navigation
// history — e.g. a browser refresh directly on a station route. Fall back to
// an explicit hub navigation in that case so the action button never appears
// dead.
export function exitToHub(router: AppRouter, day: number): void {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace(`/day/${day}` as never);
  }
}

// Generic guarded back for screens without a known parent route (e.g. the
// shared Header). Same no-history protection as exitToHub: fall back to the
// boot route so the BACK control is never a dead end on a direct load.
export function safeBack(router: AppRouter, fallback = "/"): void {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace(fallback as never);
  }
}
