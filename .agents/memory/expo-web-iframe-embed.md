---
name: Expo Web inline iframe embeds
description: How to embed third-party players (YouTube etc.) inline on Expo Web vs native.
---

On Expo Web you can render a raw DOM `<iframe>` directly in a `.tsx` screen — react-native-web uses ReactDOM, so intrinsic DOM elements render, and the mobile tsconfig (extends `expo/tsconfig.base`) typechecks `<iframe>` JSX fine.

**Rule:** gate the `<iframe>` behind `Platform.OS === "web"` and keep the native player (`react-native-youtube-iframe`) in the `else` branch. The iframe JSX compiles for native too, but is never reached at runtime there, so the native renderer never sees an unimplemented `iframe` host component.

**Why:** the Masterclass station previously gated `react-native-youtube-iframe` to native only, so web users got a static placeholder + an external-link button instead of a real player. A web `<iframe>` plays inline with no app-switching.

**How to apply:** build the embed URL from data (e.g. `https://www.youtube.com/embed/${id}`), not a hardcoded id, when a screen serves many records. Use the YouTube `/embed/<id>` form, not `watch?v=` (the watch form deep-links to the YouTube app).
