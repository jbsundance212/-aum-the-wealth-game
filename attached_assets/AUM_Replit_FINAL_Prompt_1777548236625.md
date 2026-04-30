# AUM — THE WEALTH GAME
## Replit Agent Master Build Prompt — COMPLETE & FINAL
### Matin Wealth Advisory LLC · April 2026 · Confidential

---

## WHAT YOU ARE BUILDING

Build a complete **React Native (Expo)** mobile application called **AUM — THE WEALTH GAME** for Android APK export (Samsung Galaxy Store + Huawei AppGallery). This is a 49-day institutional wealth management education app with gamification. It must look and feel like a private banking interface — NOT a game, NOT a fintech startup, NOT a trading app.

---

## STACK & PROJECT SETUP

```
Framework:     React Native with Expo (SDK 51+)
Language:      JavaScript (not TypeScript)
Navigation:    React Navigation v6 (Stack + Bottom Tab)
Data:          Local asset — AUM_MASTER.xlsx parsed with xlsx library
Storage:       AsyncStorage (progress, trust balance, completed days)
Video:         react-native-youtube-iframe
Audio:         expo-av
Fonts:         expo-google-fonts — Public Sans + JetBrains Mono
Target:        Android APK (Samsung + Huawei compatible)
```

### Install these packages:
```bash
expo install expo-av expo-haptics expo-font \
  @expo-google-fonts/public-sans \
  @expo-google-fonts/jetbrains-mono \
  @react-navigation/native \
  @react-navigation/stack \
  @react-navigation/bottom-tabs \
  react-native-screens \
  react-native-safe-area-context \
  xlsx \
  react-native-youtube-iframe \
  @react-native-async-storage/async-storage \
  react-native-reanimated \
  react-native-slider
```

---

## FILE STRUCTURE

```
/assets
  /fonts
  /sounds
    click.mp3
    thud.mp3
  AUM_MASTER.xlsx        ← UPLOAD THIS FILE

/src
  /data
    parseExcel.js        ← Excel parser
    dayData.js           ← exports parsed day objects

  /theme
    colors.js            ← design tokens
    typography.js        ← font styles

  /components
    SterlingMessage.js   ← Arthur Sterling correspondence card
    TrustBalance.js      ← balance display JetBrains Mono
    StepCard.js          ← step progress card
    TransactionToast.js  ← credit/debit notification toast
    TitanCard.js         ← institutional investor profile
    BuckleyQuote.js      ← Uncle Barnaby wisdom card

  /screens
    LoginScreen.js
    OnboardingScreen1.js
    OnboardingScreen2.js
    OnboardingScreen3.js
    HomeScreen.js
    DayScreen.js
    BriefingScreen.js
    MasterclassScreen.js
    TitanScreen.js
    StressTestScreen.js
    DiagnosticScreen.js
    MomentumScreen.js
    SterlingMemoScreen.js
    BourseScreen.js      ← BUILD THIS WITH MOST CARE
    LedgerScreen.js
    LeaderboardScreen.js
    CurriculumScreen.js

App.js
app.json
```

---

## DESIGN SYSTEM — THE "UBS SWISS WHITE STANDARD"

### CRITICAL: This app must look like a private banking interface.

```javascript
// /src/theme/colors.js
export const colors = {
  background:   '#FAFAFA',   // Swiss White
  charcoal:     '#3C4858',   // Primary text
  crimson:      '#A35252',   // Accent
  teal:         '#4A8C8C',   // Credits, Victor Crane
  mist:         '#E8EBF0',   // Borders, dividers
  cream:        '#FAF7F2',   // Letter/document backgrounds
  mutedGray:    '#8A94A6',   // Captions, secondary
  white:        '#FFFFFF',
};
```

```javascript
// /src/theme/typography.js
export const typography = {
  body:         { fontFamily: 'PublicSans_400Regular', fontSize: 14 },
  bodyMed:      { fontFamily: 'PublicSans_500Medium',  fontSize: 14 },
  label:        { fontFamily: 'PublicSans_400Regular', fontSize: 11,
                  textTransform: 'uppercase', letterSpacing: 1.2 },
  heading:      { fontFamily: 'PublicSans_600SemiBold', fontSize: 20 },
  mono:         { fontFamily: 'JetBrainsMono_400Regular', fontSize: 14 },
  monoLarge:    { fontFamily: 'JetBrainsMono_400Regular', fontSize: 28 },
  caption:      { fontFamily: 'PublicSans_400Regular', fontSize: 10 },
};
```

### Design Rules — NO EXCEPTIONS
- ❌ Zero border radius on ALL containers and buttons (sharp corners only)
- ❌ No gradients, no shadows, no glow effects
- ❌ No rounded buttons — rectangular only
- ❌ No bright colors outside the palette above
- ✅ Ultra-thin 0.5px / StyleSheet.hairlineWidth borders in mist color
- ✅ Single crimson accent line (2px height) as separator
- ✅ Generous white space — never crowded
- ✅ Screen transitions: fade/cross-dissolve only — NO slide animations
- ✅ ALL money/numbers displayed in JetBrains Mono
- ✅ Status bar: dark text on white background

---

## EXCEL PARSER — parseExcel.js

```javascript
import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';
import * as XLSX from 'xlsx';

export async function loadDayData() {
  const asset = Asset.fromModule(require('../../assets/AUM_MASTER.xlsx'));
  await asset.downloadAsync();
  const base64 = await FileSystem.readAsStringAsync(asset.localUri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const workbook = XLSX.read(base64, { type: 'base64' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  const days = [];
  for (let col = 1; col < raw[0].length; col++) {
    const get = (rowIndex) => raw[rowIndex]?.[col] ?? '';
    days.push({
      dayNumber:        get(0),
      topic:            get(1),
      briefingS1:       get(2),
      briefingS2:       get(3),
      briefingS3:       get(4),
      masterclassUrl:   get(5),
      masterclassKey:   get(6),
      titanName:        get(7),
      titanTitle:       get(8),
      titanBio:         get(9),
      titanPlaybook:    get(10),
      stressQuestion:   get(11),
      stressOptA:       get(12),
      stressOptB:       get(13),
      stressOptC:       get(14),
      stressCorrect:    get(15),  // 'A', 'B', or 'C'
      stressSterling:   get(16),
      diagScenario:     get(17),
      diagOptA:         get(18),
      diagOptB:         get(19),
      diagOptC:         get(20),
      diagCorrect:      get(21),
      diagSterling:     get(22),
      momentumLogic:    get(23),
      momentumOptA:     get(24),
      momentumOptB:     get(25),
      momentumOptC:     get(26),
      momentumCorrect:  get(27),
      momentumSterling: get(28),
      sterlingMemo:     get(29),
      bourseParams:     JSON.parse(get(30) || '{}'),
      sterlingWin:      get(31),
      sterlingLoss:     get(32),
    });
  }
  return days;
}
```

---

## THE NARRATIVE

### The Vane-Buckley Trust

Your great-uncle Barnaby Buckley was many things. A contrarian. A whisky enthusiast. A man who once shorted the pound sterling from a payphone in Geneva and made enough to buy a small island — which he then chose not to buy, because, as he put it, *"islands are illiquid and impossible to rebalance."*

He was also, apparently, quietly brilliant.

Barnaby died leaving behind three things: a Trust worth **$1,000,000**, a 49-day wealth management curriculum he wrote himself, and a legally binding condition attached to both.

You inherit the Trust only if you complete the course.

**Arthur Sterling** — Barnaby's executor, solicitor, and the most punctiliously dressed man you have ever seen — will guide you through every step. He has managed this Trust for thirty years and considers it a personal insult when the balance falls.

There is, however, a complication.

**Victor Crane** — former proprietary trader, current nemesis, and the only person Barnaby ever described as *"technically brilliant and morally flexible"* — is also playing. He received an identical Trust. He has already started. He is already ahead.

---

## SCREENS — BUILD IN THIS ORDER

---

### SCREEN 1 — LOGIN (LoginScreen.js)

White background #FAFAFA.

Layout (centered, full screen):
- AUM logo: "AUM" in 28px SemiBold charcoal, below it "THE WEALTH GAME" in 9px crimson uppercase, letterSpacing 3
- Thin crimson line (2px height, full width) as separator
- Email TextInput — 0.5px mist border, 14px Public Sans, charcoal
- Password TextInput with show/hide eye toggle
- "ENTER THE TRUST" button — full width, charcoal background, white text, 0 borderRadius
- "Create Account" text link in crimson below

Auth: store credentials in AsyncStorage. On success → check onboarding_done. If false → OnboardingScreen1. If true → HomeScreen.

No social login. No biometrics. No "Forgot Password" in v1.

---

### SCREEN 2 — ONBOARDING 1: THE LETTER (OnboardingScreen1.js)

Background: cream #FAF7F2. Scrollable ScrollView.

Top right: Small "AUM" text logo (10px crimson).

Letter card (cream background, 0.5px mist border):
```
PRIVATE & CONFIDENTIAL

Sterling, Reuter & Associates
Solicitors — Geneva & London

Dear Beneficiary,

Your great-uncle Barnaby Buckley passed away on the 14th of
this month, leaving behind a considerable estate, an impressive
whisky collection, and one condition attached to both.

The Vane-Buckley Trust — valued at $1,000,000 — is yours.

Conditionally.

Barnaby believed that inherited wealth without financial
education is merely a countdown to zero. He therefore
designed a 49-day curriculum in wealth management.
You must complete it.

I will be your guide throughout. My name is Arthur Sterling.
I have managed this Trust for thirty years and I intend
to see it managed properly for thirty more.

There is one further matter I am obliged to disclose.
A competing beneficiary exists. His name is Victor Crane.
He is already playing. He is already ahead.

I suggest you begin immediately.

Yours faithfully,
Arthur Sterling
Senior Partner, Sterling Reuter & Associates
```

Bottom: crimson "Continue →" button. Progress dots 1/3.

---

### SCREEN 3 — ONBOARDING 2: THE CHARACTERS (OnboardingScreen2.js)

Three character cards stacked vertically. Each card:
- Circular photo from Cloudinary (72x72px, r_max crop)
- Name: 15px SemiBold charcoal
- Title: 9px crimson uppercase
- Description: 12px mutedGray

**Barnaby Buckley** | YOUR GREAT-UNCLE · DECEASED · ARCHITECT
"Contrarian investor. Whisky enthusiast. Believed inherited wealth without education is merely a countdown to zero. He wrote the curriculum. He is watching."

**Arthur Sterling** | YOUR TRUSTEE · SOLICITOR · GUIDE
"Senior Partner at Sterling, Reuter & Associates. Has managed this Trust for thirty years. Considers it a personal insult when the balance falls. He will write you letters."

**Victor Crane** | YOUR NEMESIS · RANKED #1 · INSUFFERABLE
"Former proprietary trader. Received an identical Trust. Already ahead of you. Considers this competition a formality. He is wrong — but he doesn't know that yet."

Cloudinary URL format:
```javascript
const CLOUD = 'https://res.cloudinary.com/YOUR_CLOUD_NAME/image/upload';
const photo = (id) => `${CLOUD}/w_200,h_200,c_fill,g_face,r_max/${id}`;
```
Store CLOUD_NAME in .env. Never hardcode.

Bottom: crimson "Continue →". Progress dots 2/3.

---

### SCREEN 4 — ONBOARDING 3: THE RULES (OnboardingScreen3.js)

Title: "THE RESIDENCY" 16px SemiBold charcoal.
Subtitle: "YOUR 49-DAY MANDATE" 9px crimson uppercase.
Crimson separator line.

Four rule cards (0.5px mist border each):

**01 — THE TRUST**
"You begin with $1,000,000. Every correct answer, completed lesson, and winning Bourse simulation credits your Trust. Every wrong answer costs you. Barnaby is not sentimental about this."

**02 — THE CURRICULUM**
"49 days. 8 steps per day. Macro foundations, investment instruments, portfolio construction. Complete each step to unlock the next. No skipping. Barnaby was very clear on this."

**03 — THE BOURSE**
"Each day ends with a 30-second live trading simulation. Deploy your $100,000 stake across 6 asset classes. Get it right: +$100,000 to the Trust. Get it wrong: Arthur Sterling will write you a letter."

**04 — VICTOR CRANE**
"He is ranked above you on the leaderboard. He will comment on this regularly. The only response is performance."

Bottom: Full-width charcoal "BEGIN THE RESIDENCY →" button.
On tap: AsyncStorage.setItem('onboarding_done', 'true') → navigate to HomeScreen.
Progress dots 3/3. Never show onboarding again.

---

### SCREEN 5 — HOME SCREEN (HomeScreen.js)

```
VANE-BUCKLEY TRUST              [9px crimson label, uppercase]
$1,000,000                      [28px JetBrains Mono charcoal]
──────────────────────────────  [2px crimson line]
DAY 1 OF 49  ·  STEP 0/8       [10px mutedGray]
```

Victor Crane strip (just below balance):
```
VICTOR CRANE   $1,089,234      [teal JetBrains Mono]
YOU            $1,000,000      [charcoal JetBrains Mono]
```
Victor's balance = `Math.round(trustBalance * 1.10 * (1 + (Math.random() * 0.04 - 0.02)))`
Updated once per day (store in AsyncStorage with date key).

Victor rotating daily quotes (index = dayNumber % quotes.length):
```javascript
const VICTOR_QUOTES = [
  "Still climbing, I see. Adorable.",
  "The Bourse waits for no one. Especially not you.",
  "Barnaby always did have a soft spot for underdogs.",
  "Your allocation yesterday was… creative. I'll leave it at that.",
  "I've seen better Bourse scores. From interns. First week.",
  "Sterling tells me you're improving. I remain unconvinced.",
  "The gap is closing. Slowly. Very slowly.",
  "I made $47,000 before breakfast. Just thought you should know.",
  "Interesting strategy. Wrong, but interesting.",
  "You do know this is a competition? Just checking.",
];
```

Day grid: 7 columns × 7 rows = 49 cells.
- Completed days: charcoal fill, white number
- Current day: crimson fill, white number
- Locked days: mist fill, mutedGray number

Bottom tab navigation (4 tabs): Home · Curriculum · Ledger · Leaderboard

---

### SCREEN 6 — DAY SCREEN (DayScreen.js)

Header: "DAY [N]" charcoal, topic title in crimson below.

8 step rows, each:
```
[crimson circle with step number]  [Step name]  [status]
```

Step types in order:
1. BRIEFING
2. MASTERCLASS
3. THE TITAN
4. STRESS TEST
5. DIAGNOSTIC
6. MOMENTUM
7. STERLING'S MEMO
8. THE BOURSE

Completed = teal checkmark. Active = crimson circle. Locked = mist circle + "Pending fiduciary clearance."

Steps gate sequentially — cannot tap a step until the previous is complete. Exception: Step 1 is always unlocked for the current day.

---

### SCREEN 7 — BRIEFING (BriefingScreen.js)

3-slide PageView. Each slide:
- Slide number (9px crimson: "01 OF 03")
- Content: day.briefingS1 / briefingS2 / briefingS3
- 14px Public Sans, 1.8 line height, charcoal
- Crimson separator line

Navigation: swipe or Next button.
On slide 3 completion: +$50,000 to Trust, TransactionToast fires, mark step complete.

---

### SCREEN 8 — MASTERCLASS (MasterclassScreen.js)

YouTube embed using react-native-youtube-iframe.
Video ID parsed from day.masterclassUrl.

Below video: "KEY CONCEPTS" label, then day.masterclassKey displayed as bullet points.

On video watch >80%: +$75,000 to Trust, TransactionToast, mark step complete.
Track watch progress with onChangeState handler.

---

### SCREEN 9 — TITAN (TitanScreen.js)

Header: "THE TITAN" label.

Card layout:
- Circular photo from Cloudinary (day.titanName used as photo ID lookup)
- Name: day.titanName, 18px SemiBold charcoal
- Title: day.titanTitle, 9px crimson uppercase
- Crimson separator
- Bio: day.titanBio, 13px Public Sans, 1.7 line height
- "PLAYBOOK" label in crimson uppercase
- Playbook: day.titanPlaybook

On scroll to bottom / "Noted" button: mark step complete. No Trust change.

---

### SCREEN 10 — STRESS TEST (StressTestScreen.js)

Label: "STRESS TEST" in crimson uppercase.
Question: day.stressQuestion, 16px SemiBold charcoal.
Crimson separator line.

Three options (A, B, C) as tappable cards (0.5px mist border, no radius).
On tap:
- Correct (matches day.stressCorrect): card turns teal, +$25,000 Trust, show day.stressSterling
- Wrong: card turns crimson, -$25,000 Trust, show day.stressSterling

Show SterlingMessage component with response text.
"Continue →" button after answer revealed. Mark step complete.

---

### SCREEN 11 — DIAGNOSTIC (DiagnosticScreen.js)

Label: "DIAGNOSTIC" crimson uppercase.
Scenario: day.diagScenario — present as a styled scenario card on cream background.
Three options A/B/C.

Correct (day.diagCorrect): +$25,000. Wrong: -$15,000.
Show day.diagSterling. Mark step complete.

---

### SCREEN 12 — MOMENTUM (MomentumScreen.js)

Label: "MOMENTUM" crimson uppercase.
Logic prompt: day.momentumLogic.
Three options A/B/C.

Correct (day.momentumCorrect): +$25,000. Wrong: -$10,000.
Show day.momentumSterling. Mark step complete.

---

### SCREEN 13 — STERLING'S MEMO (SterlingMemoScreen.js)

Full-screen cream background.
Styled as a formal memo card.
Header: "CORRESPONDENCE" in 9px crimson uppercase.
Content: day.sterlingMemo — 14px Public Sans, 1.8 line height.
Signature block: "Arthur Sterling / Senior Partner".

"Acknowledged →" button at bottom. No Trust change. Mark step complete.

---

### SCREEN 14 — THE BOURSE (BourseScreen.js) ★ MOST IMPORTANT

This is the centrepiece game. **ALL parameters come from day.bourseParams JSON. ZERO hardcoded logic.**

#### 14.1 — BOURSE_PARAMS JSON STRUCTURE

Each day's bourseParams field contains:
```json
{
  "env": "High_Inflation",
  "description": "Central banks are behind the curve. CPI running at 8%. Real rates deeply negative. Hard assets and commodities outperform.",
  "assets": [
    { "name": "Equities",     "drift": -0.002, "volatility": 0.008 },
    { "name": "Bonds",        "drift": -0.004, "volatility": 0.005 },
    { "name": "Gold",         "drift":  0.005, "volatility": 0.006 },
    { "name": "Commodities",  "drift":  0.006, "volatility": 0.007 },
    { "name": "Cash",         "drift": -0.003, "volatility": 0.002 },
    { "name": "Real Estate",  "drift":  0.001, "volatility": 0.005 }
  ],
  "optimalAllocation": {
    "Equities": 15, "Bonds": 5, "Gold": 30,
    "Commodities": 35, "Cash": 5, "Real Estate": 10
  },
  "winThreshold": 0
}
```

#### 14.2 — PRICE SIMULATION ENGINE

```javascript
// Initialize prices at 100 for all assets
const [prices, setPrices] = useState(
  Object.fromEntries(bourseParams.assets.map(a => [a.name, 100]))
);

// Update prices every 600ms while timer running
useEffect(() => {
  if (gameState !== 'RUNNING') return;
  const interval = setInterval(() => {
    setPrices(prev => {
      const next = { ...prev };
      bourseParams.assets.forEach(asset => {
        const change = asset.drift + asset.volatility * (Math.random() * 2 - 1);
        next[asset.name] = Math.max(0.01, prev[asset.name] * (1 + change));
      });
      return next;
    });
  }, 600);
  return () => clearInterval(interval);
}, [gameState]);
```

#### 14.3 — P&L CALCULATION

```javascript
// Calculate live P&L
const BOURSE_STAKE = 100000;

const calculatePnL = (allocation, currentPrices, initialPrices) => {
  let pnl = 0;
  Object.entries(allocation).forEach(([asset, pct]) => {
    if (pct > 0) {
      const assetValue = (pct / 100) * BOURSE_STAKE;
      const priceReturn = (currentPrices[asset] - initialPrices[asset]) / initialPrices[asset];
      pnl += assetValue * priceReturn;
    }
  });
  return Math.round(pnl);
};
```

#### 14.4 — GAME STATES

```javascript
// Three states:
// 'PRE_GAME'  — sliders active, DEPLOY button disabled until total === 100
// 'RUNNING'   — sliders locked, prices moving, timer counting down
// 'FINISHED'  — result card shown

const [gameState, setGameState] = useState('PRE_GAME');
const [timeLeft, setTimeLeft] = useState(30);
const [allocation, setAllocation] = useState(
  Object.fromEntries(bourseParams.assets.map(a => [a.name, 0]))
);
const [initialPrices] = useState({ ...prices });
const [finalPnL, setFinalPnL] = useState(0);
```

#### 14.5 — TIMER

```javascript
useEffect(() => {
  if (gameState !== 'RUNNING') return;
  if (timeLeft === 0) {
    const pnl = calculatePnL(allocation, prices, initialPrices);
    setFinalPnL(pnl);
    setGameState('FINISHED');
    return;
  }
  const t = setTimeout(() => setTimeLeft(t => t - 1), 1000);
  return () => clearTimeout(t);
}, [gameState, timeLeft]);
```

#### 14.6 — SLIDER COMPONENT

```javascript
// For each asset — render a slider row:
<View key={asset.name} style={styles.sliderRow}>
  <View style={styles.sliderHeader}>
    <Text style={typography.body}>{asset.name}</Text>
    <Text style={[typography.mono, { color: colors.charcoal }]}>
      {allocation[asset.name]}%
    </Text>
  </View>
  <Slider
    minimumValue={0}
    maximumValue={100}
    step={5}
    value={allocation[asset.name]}
    disabled={gameState !== 'PRE_GAME'}
    onValueChange={(val) => {
      setAllocation(prev => ({ ...prev, [asset.name]: val }));
    }}
    minimumTrackTintColor={colors.charcoal}
    maximumTrackTintColor={colors.mist}
    thumbTintColor={colors.charcoal}
  />
</View>

// Total allocation display
const totalAllocation = Object.values(allocation).reduce((s, v) => s + v, 0);
// Show: "TOTAL: 87% — 13% REMAINING" in JetBrains Mono
// DEPLOY button: disabled if totalAllocation !== 100
```

#### 14.7 — RESULT CARD

```javascript
// After FINISHED state:
const won = finalPnL > bourseParams.winThreshold;
const trustChange = won ? 100000 : -50000;

// Update AsyncStorage trust balance
// Fire TransactionToast

// Show result card:
// WIN: teal 2px left border, "TRUST CREDIT", "+$100,000", day.sterlingWin text
// LOSS: crimson 2px left border, "TRUST DEBIT", "-$50,000", day.sterlingLoss text

// Below result: show optimalAllocation for reference
// "Continue →" button → mark step complete → navigate to DayScreen or HomeScreen
```

#### 14.8 — FULL SCREEN LAYOUT

```
[HEADER: "THE BOURSE" charcoal | "DAY N" crimson]
[ENVIRONMENT CARD: cream bg, env name in crimson, description text]
[TIMER: "00:24" — 32px JetBrains Mono crimson — centered]
[Crimson separator line]
[6 ASSET SLIDERS — see 14.6]
[TOTAL DISPLAY: "TOTAL: 80% — 20% REMAINING" JetBrains Mono mutedGray]
[P&L DISPLAY: "+$12,450" or "-$3,200" — 20px JetBrains Mono teal/crimson]
[DEPLOY button — charcoal, disabled until total = 100]
```

---

### SCREEN 15 — LEDGER (LedgerScreen.js)

Cream background #FAF7F2.

Header:
```
VANE-BUCKLEY TRUST LEDGER
Account No. VBT-2026-XXXX
Sterling, Reuter & Associates
```

Read all transactions from AsyncStorage. Display as table:
```
DATE     DESCRIPTION              DEBIT      CREDIT     BALANCE
Apr 30   Day 1 Briefing           —         +$50,000   $1,050,000
Apr 30   Day 1 Stress Test        —         +$25,000   $1,075,000
Apr 30   Day 1 Bourse — WIN       —        +$100,000   $1,175,000
May 01   Day 2 Diagnostic   -$15,000           —       $1,160,000
```

Credits in teal. Debits in crimson. Running balance in JetBrains Mono.
Bottom total: current Trust Balance in 22px JetBrains Mono charcoal.

---

### SCREEN 16 — LEADERBOARD (LeaderboardScreen.js)

Title: "THE RESIDENCY STANDINGS"

Victor Crane row — always #1:
- Teal background tint
- Circular photo, "Victor Crane", balance in teal JetBrains Mono
- Daily rotating quote in 10px italic mutedGray below his row

Player row — always #2:
- Crimson background tint
- "You", balance in charcoal JetBrains Mono

(Future: add real users. For v1, just Victor + player.)

---

### SCREEN 17 — CURRICULUM (CurriculumScreen.js)

Title: "THE CURRICULUM — 49 DAYS"

7×7 grid of day tiles. Each tile shows:
- Day number
- 2-word topic abbreviation
- Status dot (crimson = complete, empty = locked)

Tap any completed day → navigate to DayScreen for that day.

---

## TRANSACTION TOAST COMPONENT (TransactionToast.js)

Slides up from bottom, auto-dismisses after 3.5 seconds.

```
┌─────────────────────────────────┐
│ TRUST CREDIT          [teal]    │
│ +$50,000              [mono]    │
│ Trustee Knowledge — D1 [muted]  │
└─────────────────────────────────┘
```

- Left border: 2px teal (credit) or 2px crimson (debit)
- White background, 0.5px mist border
- 0 border radius
- Position: absolute, bottom: 32, left: 16, right: 16
- Animate: translateY from 100 to 0 (Animated.spring)

---

## ARTHUR STERLING LANGUAGE RULES

Sterling never uses casual language. All default UI text follows this table:

| Default            | Sterling equivalent                                |
|--------------------|----------------------------------------------------|
| "Well done!"       | "The Trust acknowledges your diligence."           |
| "Wrong answer."    | "A lapse in judgment carries a fiduciary cost."    |
| "Next level"       | "Advancing to the next phase of the Residency."    |
| "Score"            | "Trust Balance"                                    |
| "Points"           | "Capital"                                          |
| "Notifications"    | "Correspondence"                                   |
| "Complete"         | "The mandate has been satisfied."                  |
| "Locked"           | "Pending fiduciary clearance."                     |

---

## TRUST CREDIT/DEBIT TABLE

| Action                         | Trust Change  |
|--------------------------------|---------------|
| Briefing completed             | +$50,000      |
| Masterclass watched >80%       | +$75,000      |
| Stress Test — correct          | +$25,000      |
| Stress Test — wrong            | -$25,000      |
| Diagnostic — correct           | +$25,000      |
| Diagnostic — wrong             | -$15,000      |
| Momentum — correct             | +$25,000      |
| Momentum — wrong               | -$10,000      |
| Bourse — WIN                   | +$100,000     |
| Bourse — LOSS                  | -$50,000      |

---

## ASYNCSTORAGE SCHEMA

```javascript
'trust_balance'      → integer (default: 1000000)
'current_day'        → integer (default: 1)
'onboarding_done'    → 'true' | null
'day_[N]_step_[S]'   → 'complete' | null
'transactions'       → JSON array of transaction objects
'victor_balance_[D]' → integer (Victor's balance for day D)
```

---

## AUDIO & HAPTICS

```javascript
// Step completion (credit):
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
// Play: /assets/sounds/click.mp3

// Penalty (debit):
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
// Play: /assets/sounds/thud.mp3

// Screen transitions: fade only
// Stack navigator: { animation: 'fade' }
```

---

## APP.JSON

```json
{
  "expo": {
    "name": "AUM",
    "slug": "aum-wealth-game",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "splash": { "backgroundColor": "#FFFFFF" },
    "android": {
      "adaptiveIcon": { "backgroundColor": "#FFFFFF" },
      "package": "com.matinwealth.aum"
    },
    "platforms": ["android"]
  }
}
```

---

## BUILD ORDER — FOLLOW EXACTLY

1. Project setup + all package installs
2. `/src/theme/colors.js` and `typography.js`
3. `App.js` — navigation shell with all screens as placeholders
4. `parseExcel.js` — Excel parser, verify all 49 days parse correctly
5. `LoginScreen.js`
6. `OnboardingScreen1.js`, `OnboardingScreen2.js`, `OnboardingScreen3.js`
7. `HomeScreen.js` — static data first, then wire AsyncStorage
8. `DayScreen.js` — 8-step list with gating logic
9. `BriefingScreen.js`
10. `MasterclassScreen.js`
11. `TitanScreen.js`
12. `StressTestScreen.js`
13. `DiagnosticScreen.js`
14. `MomentumScreen.js`
15. `SterlingMemoScreen.js`
16. **`BourseScreen.js`** — build with full JSON-driven engine spec above
17. `LedgerScreen.js`
18. `LeaderboardScreen.js`
19. `CurriculumScreen.js`
20. `TransactionToast.js` — wire throughout all screens
21. Wire all AsyncStorage state end-to-end
22. Add haptics and audio throughout
23. Full test: Login → Onboarding → Day 1 → all 8 steps → Bourse → Ledger
24. APK export: `eas build --platform android`

---

## FIRST MESSAGE TO REPLIT AGENT

Paste this prompt in full, then add:

> "Build the complete app following this specification exactly. Upload AUM_MASTER.xlsx to /assets/ before starting. Start with the Excel parser — verify all 49 days parse correctly before building any screen. Build the Bourse screen last and follow Section 14 precisely — the bourseParams JSON in the Excel drives ALL game logic. Do not hardcode any environment behaviour. The design must match the UBS Swiss White Standard throughout — white background, charcoal text, crimson accents, zero border radius, JetBrains Mono for all numbers."

---

*Matin Wealth Advisory LLC · AUM — The Wealth Game · Confidential · April 2026*
