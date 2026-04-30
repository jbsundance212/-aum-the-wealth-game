# AUM — The Wealth Game

A 49-day Expo mobile app for institutional-grade wealth management
education with a gamified portfolio simulator. Built around the fictional
Vane-Buckley Trust, narrated by executor Arthur Sterling, with a rival
beneficiary (Victor Crane) who advances $50,000 per completed day.

## Visual identity — UBS Swiss White Standard

- Background `#FAFAFA` (off-white)
- Text `#3C4858` (charcoal)
- Accent `#A35252` (crimson)
- Hairline dividers `#E5E5E5`
- Border radius: **0** everywhere
- Body type: Public Sans (400 / 500 / 600 / 700)
- Numerals: JetBrains Mono (400 / 700) — used for every $ amount and
  ticker

These tokens live in `artifacts/mobile/constants/colors.ts` and
`artifacts/mobile/src/theme/typography.ts`.

## Architecture

Single artifact: `artifacts/mobile` (Expo SDK 54 + expo-router 6).

### Data pipeline (pre-build)

The Excel workbook
`attached_assets/AUM_Replit_DRAFT_v1_25_1777548236625.xlsx`
is parsed at build time by
`artifacts/mobile/scripts/build-day-data.cjs` into
`artifacts/mobile/src/data/dayData.json` (~1MB, 49 days).

To refresh after an Excel edit:
```
cd artifacts/mobile && node scripts/build-day-data.cjs
```

The script understands two question formats (early days use
`CORRECT: A` / `STERLING_CORRECT:` markers; later days use inline
`[CORRECT — …]` / `[WRONG — …]` markers) and parses the JSON in the
`Bourse_Params` cell. Days 28-49 have narrative-only Momentum signals
(no quiz) — flagged with `hasQuiz: false` so the Momentum screen
renders the narrative variant.

### Brand mark

The AUM mark (4 ascending bars climbing grey → `#CC0000`, then bold
"AUM" in Times serif `#CC0000`) lives as a React Native SVG component
at `artifacts/mobile/src/components/BrandMark.tsx`. The same artwork
is mirrored as a static SVG at `artifacts/mobile/assets/aum_logo.svg`
and rendered to a 1200×1200 PNG splash asset at
`artifacts/mobile/assets/images/splash.png` via
`artifacts/mobile/scripts/render-splash.sh` (uses ImageMagick `magick`).

The mark appears in three places:
- Native splash — `app.json` → `expo.splash.image`
- JS splash overlay — `src/components/SplashOverlay.tsx`, mounted from
  `app/_layout.tsx`; holds for 700 ms then fades out (320 ms) once
  fonts are loaded so the hand-off from native splash to first route
  is seamless.
- Login (`app/login.tsx`) and the global Header (`src/components/Header.tsx`).

To regenerate the splash PNG after editing the SVG:
```
cd artifacts/mobile && ./scripts/render-splash.sh
```

### Routes (file-based)

```
app/
  _layout.tsx            providers, fonts, transaction toast overlay
  index.tsx              boot router (login → onboarding → tabs)
  login.tsx              beneficiary acknowledgement
  onboarding.tsx         3-chapter intro (Barnaby, Sterling, Victor)
  (tabs)/
    _layout.tsx          4-tab bar
    index.tsx            Today (KPI row + Day card + recent ledger)
    curriculum.tsx       49-day grid grouped by pillar
    ledger.tsx           NAV, credits / penalties, transaction log
    leaderboard.tsx      duel header + cohort standings
  day/[id]/
    index.tsx            Day Hub — 8 stations + completion bonus
    briefing.tsx         3-slide read (+$10,000)
    masterclass.tsx      YouTube player with browser fallback (+$20,000)
    titan.tsx            Bio + lesson + playbook (+$15,000)
    stress.tsx           Quiz ±$50,000 / $25,000
    diagnostic.tsx       Quiz ±$30,000 / $15,000
    momentum.tsx         Quiz or narrative ±$40,000 / $20,000
    sterling.tsx         Daily memorandum (+$5,000)
    bourse.tsx           4-phase live trading game
```

### State

Single `StoreProvider` (`artifacts/mobile/src/data/store.tsx`) holds
profile, NAV, Victor's NAV, current day, transactions, completion
map, and days completed. Persists to AsyncStorage. All ledger writes
also fire a top-of-screen `TransactionToast`.

Day completion logic: when all 8 stations are recorded the Day Hub
auto-fires `finalizeDay` — posts a +$25,000 bonus, advances
`currentDay`, and credits Victor with $50,000.

### The Bourse

`artifacts/mobile/app/day/[id]/bourse.tsx` implements a 30-second
mark-to-market simulator:

1. **Intro** — environment label + description + win condition
2. **Allocate** — sliders 0-100% per asset, must total 100%
3. **Running** — 50 ticks @ 600ms; each tick:
   `price *= 1 + drift/50 + (vol/√50) * gauss()` with a 5%
   bankruptcy floor. Live tape, countdown, animated PnL.
4. **Complete** — verdict card + Sterling's win/loss memo, then
   credits the closeout proceeds back to the ledger.

The $100,000 stake is debited at launch and the proceeds are credited
on close, so the ledger always reflects real cash flows.

## Workflows

- `artifacts/mobile: expo` — runs `pnpm dev` (Expo Go web preview)
- `artifacts/api-server: API Server` — scaffold backend (unused by
  the mobile app today)
- `artifacts/mockup-sandbox: Component Preview Server` — design sandbox

## Notes

- `react-native-web-webview` is installed as a peer of
  `react-native-youtube-iframe` so the YouTube player bundles for web.
- Some Expo version warnings (`expo-asset`, `expo-file-system`,
  `react-native-webview`, `@react-native-community/slider`) are visible
  in the Expo CLI startup. They are non-fatal — bundle compiles and
  runs both on web and via Expo Go.
