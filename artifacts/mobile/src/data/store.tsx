import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Platform } from "react-native";

import dayDataJson from "./dayData.json";
import { recordAudioListened, syncLeaderboard } from "./leaderboardApi";
import { DayData, STEP_ORDER, StepKey } from "./types";

export type IntroAudioKey = "barnaby" | "sterling" | "crane";

export const DAYS = dayDataJson as unknown as DayData[];
export const STARTING_BALANCE = 1_000_000;
export const VICTOR_DAILY_GAIN = 50_000;

export type Transaction = {
  id: string;
  ts: number;
  amount: number;
  description: string;
  day: number;
  step: StepKey | "system";
};

export type Profile = {
  fullName: string;
  email: string;
  loggedInAt: number;
};

type StepCompletion = {
  // Map of "day-step" -> { correct?: boolean }
  [key: string]: { correct?: boolean; ts: number };
};

type Persisted = {
  profile: Profile | null;
  onboardingDone: boolean;
  trustBalance: number;
  victorBalance: number;
  currentDay: number;
  transactions: Transaction[];
  completion: StepCompletion;
  daysCompleted: number[];
  // New: stable per-device identity for the leaderboard.
  userId: string;
  displayName: string;
  // Audio briefings the player has finished listening to in full.
  audioListened: number[];
  introsListened: IntroAudioKey[];
};

const KEYS = {
  profile: "@aum/profile",
  onboarding: "@aum/onboarding_done",
  balance: "@aum/trust_balance",
  victor: "@aum/victor_balance",
  currentDay: "@aum/current_day",
  transactions: "@aum/transactions",
  completion: "@aum/completion",
  daysCompleted: "@aum/days_completed",
  userId: "@aum/user_id",
  displayName: "@aum/display_name",
  audioListened: "@aum/audio_listened",
  introsListened: "@aum/intros_listened",
};

// RFC 4122 v4, Math.random based (sufficient as per-device identifier).
function uuidv4(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

async function loadPersisted(): Promise<Persisted> {
  const [
    profile,
    onb,
    bal,
    vic,
    day,
    txs,
    comp,
    done,
    uid,
    name,
    audio,
    intros,
  ] = await Promise.all([
    AsyncStorage.getItem(KEYS.profile),
    AsyncStorage.getItem(KEYS.onboarding),
    AsyncStorage.getItem(KEYS.balance),
    AsyncStorage.getItem(KEYS.victor),
    AsyncStorage.getItem(KEYS.currentDay),
    AsyncStorage.getItem(KEYS.transactions),
    AsyncStorage.getItem(KEYS.completion),
    AsyncStorage.getItem(KEYS.daysCompleted),
    AsyncStorage.getItem(KEYS.userId),
    AsyncStorage.getItem(KEYS.displayName),
    AsyncStorage.getItem(KEYS.audioListened),
    AsyncStorage.getItem(KEYS.introsListened),
  ]);
  let userId = uid ?? "";
  if (!userId) {
    userId = uuidv4();
    await AsyncStorage.setItem(KEYS.userId, userId);
  }
  return {
    profile: profile ? JSON.parse(profile) : null,
    onboardingDone: onb === "true",
    trustBalance: bal ? Number(bal) : STARTING_BALANCE,
    victorBalance: vic ? Number(vic) : 0,
    currentDay: day ? Number(day) : 1,
    transactions: txs ? JSON.parse(txs) : [],
    completion: comp ? JSON.parse(comp) : {},
    daysCompleted: done ? JSON.parse(done) : [],
    userId,
    displayName: name ?? "",
    audioListened: audio ? JSON.parse(audio) : [],
    introsListened: intros ? JSON.parse(intros) : [],
  };
}

type Store = Persisted & {
  loaded: boolean;
  toast: { amount: number; description: string; id: string } | null;
  days: DayData[];
  // Mutations
  signIn: (profile: Profile) => Promise<void>;
  signOut: () => Promise<void>;
  setDisplayName: (name: string) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  recordStep: (
    day: number,
    step: StepKey,
    payload: { correct?: boolean; reward: number; description: string },
  ) => Promise<void>;
  applyDelta: (
    amount: number,
    description: string,
    day: number,
    step: StepKey | "system",
  ) => Promise<void>;
  finalizeDay: (day: number) => Promise<void>;
  resetAll: () => Promise<void>;
  isStepDone: (day: number, step: StepKey) => boolean;
  stepResult: (day: number, step: StepKey) => { correct?: boolean } | null;
  isDayComplete: (day: number) => boolean;
  dismissToast: () => void;
  // Audio briefings
  hasListenedDay: (day: number) => boolean;
  hasListenedIntro: (who: IntroAudioKey) => boolean;
  markAudioListened: (day: number) => Promise<void>;
  markIntroListened: (who: IntroAudioKey) => Promise<void>;
};

const StoreContext = createContext<Store | null>(null);

const NAMES = [
  "Lakhdar Bouchemal",
  "Anya Petrova",
  "Hiroshi Tanaka",
  "Marcus Holstein",
  "Elena Castellanos",
  "Wei Chen",
  "Fatima Al-Sayed",
];

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<Persisted & { loaded: boolean }>({
    loaded: false,
    profile: null,
    onboardingDone: false,
    trustBalance: STARTING_BALANCE,
    victorBalance: 0,
    currentDay: 1,
    transactions: [],
    completion: {},
    daysCompleted: [],
    userId: "",
    displayName: "",
    audioListened: [],
    introsListened: [],
  });
  const [toast, setToast] = useState<Store["toast"]>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced leaderboard sync (collapse rapid balance changes into one POST).
  // Always reads the LATEST persisted snapshot at fire time via latestRef so
  // concurrent applyDelta/recordStep/finalizeDay calls can't stamp out-of-order
  // payloads — we only ever POST the freshest known state.
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestRef = useRef<Persisted | null>(null);
  const queueSync = useCallback((next: Persisted) => {
    latestRef.current = next;
    if (!next.userId || !next.displayName.trim()) return; // need identity
    if (syncTimer.current) clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(() => {
      const latest = latestRef.current;
      if (!latest || !latest.userId || !latest.displayName.trim()) return;
      void syncLeaderboard({
        user_id: latest.userId,
        display_name: latest.displayName,
        trust_balance: latest.trustBalance,
        days_completed: latest.daysCompleted.length,
      });
    }, 800);
  }, []);

  useEffect(() => {
    let mounted = true;
    loadPersisted().then((p) => {
      if (!mounted) return;
      setState({ ...p, loaded: true });
      // Initial sync if identity already exists from a prior session.
      queueSync(p);
    });
    return () => {
      mounted = false;
      if (syncTimer.current) clearTimeout(syncTimer.current);
    };
  }, [queueSync]);

  const persist = useCallback(async (next: Persisted) => {
    await Promise.all([
      AsyncStorage.setItem(KEYS.profile, JSON.stringify(next.profile)),
      AsyncStorage.setItem(KEYS.onboarding, String(next.onboardingDone)),
      AsyncStorage.setItem(KEYS.balance, String(next.trustBalance)),
      AsyncStorage.setItem(KEYS.victor, String(next.victorBalance)),
      AsyncStorage.setItem(KEYS.currentDay, String(next.currentDay)),
      AsyncStorage.setItem(
        KEYS.transactions,
        JSON.stringify(next.transactions.slice(-200)),
      ),
      AsyncStorage.setItem(KEYS.completion, JSON.stringify(next.completion)),
      AsyncStorage.setItem(
        KEYS.daysCompleted,
        JSON.stringify(next.daysCompleted),
      ),
      AsyncStorage.setItem(KEYS.userId, next.userId),
      AsyncStorage.setItem(KEYS.displayName, next.displayName),
      AsyncStorage.setItem(
        KEYS.audioListened,
        JSON.stringify(next.audioListened),
      ),
      AsyncStorage.setItem(
        KEYS.introsListened,
        JSON.stringify(next.introsListened),
      ),
    ]);
  }, []);

  const showToast = useCallback((amount: number, description: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({
      id: Math.random().toString(36).slice(2),
      amount,
      description,
    });
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  }, []);

  const dismissToast = useCallback(() => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(null);
  }, []);

  const signIn = useCallback(
    async (profile: Profile) => {
      let snapshot: Persisted | null = null;
      setState((s) => {
        const next: Persisted = {
          profile,
          onboardingDone: s.onboardingDone,
          trustBalance: s.trustBalance,
          victorBalance: s.victorBalance,
          currentDay: s.currentDay,
          transactions: s.transactions,
          completion: s.completion,
          daysCompleted: s.daysCompleted,
          userId: s.userId,
          displayName: s.displayName,
          audioListened: s.audioListened,
          introsListened: s.introsListened,
        };
        snapshot = next;
        return { ...next, loaded: true };
      });
      if (snapshot) await persist(snapshot);
    },
    [persist],
  );

  const signOut = useCallback(async () => {
    // Generate a fresh userId on sign-out so a new player isn't conflated.
    const fresh: Persisted = {
      profile: null,
      onboardingDone: false,
      trustBalance: STARTING_BALANCE,
      victorBalance: 0,
      currentDay: 1,
      transactions: [],
      completion: {},
      daysCompleted: [],
      userId: uuidv4(),
      displayName: "",
      audioListened: [],
      introsListened: [],
    };
    setState({ ...fresh, loaded: true });
    await persist(fresh);
  }, [persist]);

  const setDisplayName = useCallback(
    async (name: string) => {
      const trimmed = name.trim().slice(0, 60);
      let snapshot: Persisted | null = null;
      setState((s) => {
        const next: Persisted = { ...s, displayName: trimmed };
        snapshot = next;
        return { ...next, loaded: true };
      });
      if (snapshot) {
        await persist(snapshot);
        queueSync(snapshot);
      }
    },
    [persist, queueSync],
  );

  const completeOnboarding = useCallback(async () => {
    let snapshot: Persisted | null = null;
    setState((s) => {
      const next = { ...s, onboardingDone: true };
      snapshot = next;
      return next;
    });
    await AsyncStorage.setItem(KEYS.onboarding, "true");
    if (snapshot) queueSync(snapshot);
  }, [queueSync]);

  const applyDelta = useCallback(
    async (
      amount: number,
      description: string,
      day: number,
      step: StepKey | "system",
    ) => {
      let snapshot: Persisted | null = null;
      setState((s) => {
        const tx: Transaction = {
          id: Math.random().toString(36).slice(2),
          ts: Date.now(),
          amount,
          description,
          day,
          step,
        };
        const next: Persisted = {
          profile: s.profile,
          onboardingDone: s.onboardingDone,
          trustBalance: s.trustBalance + amount,
          victorBalance: s.victorBalance,
          currentDay: s.currentDay,
          transactions: [tx, ...s.transactions].slice(0, 300),
          completion: s.completion,
          daysCompleted: s.daysCompleted,
          userId: s.userId,
          displayName: s.displayName,
          audioListened: s.audioListened,
          introsListened: s.introsListened,
        };
        snapshot = next;
        return { ...next, loaded: true };
      });
      if (amount !== 0) showToast(amount, description);
      if (snapshot) {
        await persist(snapshot);
        queueSync(snapshot);
      }
    },
    [persist, showToast, queueSync],
  );

  const recordStep = useCallback(
    async (
      day: number,
      step: StepKey,
      payload: { correct?: boolean; reward: number; description: string },
    ) => {
      const key = day + "-" + step;
      let snapshot: Persisted | null = null;
      setState((s) => {
        const tx: Transaction = {
          id: Math.random().toString(36).slice(2),
          ts: Date.now(),
          amount: payload.reward,
          description: payload.description,
          day,
          step,
        };
        const next: Persisted = {
          profile: s.profile,
          onboardingDone: s.onboardingDone,
          trustBalance: s.trustBalance + payload.reward,
          victorBalance: s.victorBalance,
          currentDay: s.currentDay,
          transactions: [tx, ...s.transactions].slice(0, 300),
          completion: {
            ...s.completion,
            [key]: { correct: payload.correct, ts: Date.now() },
          },
          daysCompleted: s.daysCompleted,
          userId: s.userId,
          displayName: s.displayName,
          audioListened: s.audioListened,
          introsListened: s.introsListened,
        };
        snapshot = next;
        return { ...next, loaded: true };
      });
      if (payload.reward !== 0) showToast(payload.reward, payload.description);
      if (snapshot) {
        await persist(snapshot);
        queueSync(snapshot);
      }
    },
    [persist, showToast, queueSync],
  );

  const finalizeDay = useCallback(
    async (day: number) => {
      let snapshot: Persisted | null = null;
      let bonusGiven = false;
      setState((s) => {
        if (s.daysCompleted.includes(day)) return s;
        bonusGiven = true;
        const bonus = 25_000;
        const tx: Transaction = {
          id: Math.random().toString(36).slice(2),
          ts: Date.now(),
          amount: bonus,
          description: "Day " + day + " — Mandate Day Complete (+bonus)",
          day,
          step: "system",
        };
        const newCurrent = Math.min(49, Math.max(s.currentDay, day + 1));
        const next: Persisted = {
          profile: s.profile,
          onboardingDone: s.onboardingDone,
          trustBalance: s.trustBalance + bonus,
          victorBalance: s.victorBalance + VICTOR_DAILY_GAIN,
          currentDay: newCurrent,
          transactions: [tx, ...s.transactions].slice(0, 300),
          completion: s.completion,
          daysCompleted: [...s.daysCompleted, day],
          userId: s.userId,
          displayName: s.displayName,
          audioListened: s.audioListened,
          introsListened: s.introsListened,
        };
        snapshot = next;
        return { ...next, loaded: true };
      });
      if (bonusGiven) {
        showToast(25_000, "Day " + day + " — Mandate complete");
        if (snapshot) {
          await persist(snapshot);
          queueSync(snapshot);
        }
      }
    },
    [persist, showToast, queueSync],
  );

  const resetAll = useCallback(async () => {
    await signOut();
  }, [signOut]);

  const isStepDone = useCallback(
    (day: number, step: StepKey) => !!state.completion[day + "-" + step],
    [state.completion],
  );

  const stepResult = useCallback(
    (day: number, step: StepKey) =>
      state.completion[day + "-" + step] || null,
    [state.completion],
  );

  const isDayComplete = useCallback(
    (day: number) => STEP_ORDER.every((s) => !!state.completion[day + "-" + s]),
    [state.completion],
  );

  const hasListenedDay = useCallback(
    (day: number) => state.audioListened.includes(day),
    [state.audioListened],
  );

  const hasListenedIntro = useCallback(
    (who: IntroAudioKey) => state.introsListened.includes(who),
    [state.introsListened],
  );

  const markAudioListened = useCallback(
    async (day: number) => {
      let snapshot: Persisted | null = null;
      let userIdAtFire = "";
      setState((s) => {
        if (s.audioListened.includes(day)) return s;
        const next: Persisted = {
          ...s,
          audioListened: [...s.audioListened, day].sort((a, b) => a - b),
        };
        snapshot = next;
        userIdAtFire = s.userId;
        return { ...next, loaded: true };
      });
      if (snapshot) {
        await persist(snapshot);
        // Fire-and-forget Supabase write (skipped silently if endpoint unwired).
        if (userIdAtFire) {
          void recordAudioListened({
            user_id: userIdAtFire,
            kind: "day",
            day_number: day,
          });
        }
      }
    },
    [persist],
  );

  const markIntroListened = useCallback(
    async (who: IntroAudioKey) => {
      let snapshot: Persisted | null = null;
      let userIdAtFire = "";
      setState((s) => {
        if (s.introsListened.includes(who)) return s;
        const next: Persisted = {
          ...s,
          introsListened: [...s.introsListened, who],
        };
        snapshot = next;
        userIdAtFire = s.userId;
        return { ...next, loaded: true };
      });
      if (snapshot) {
        await persist(snapshot);
        if (userIdAtFire) {
          void recordAudioListened({
            user_id: userIdAtFire,
            kind: "intro",
            intro_key: who,
          });
        }
      }
    },
    [persist],
  );

  const value = useMemo<Store>(
    () => ({
      ...state,
      toast,
      days: DAYS,
      signIn,
      signOut,
      setDisplayName,
      completeOnboarding,
      recordStep,
      applyDelta,
      finalizeDay,
      resetAll,
      isStepDone,
      stepResult,
      isDayComplete,
      dismissToast,
      hasListenedDay,
      hasListenedIntro,
      markAudioListened,
      markIntroListened,
    }),
    [
      state,
      toast,
      signIn,
      signOut,
      setDisplayName,
      completeOnboarding,
      recordStep,
      applyDelta,
      finalizeDay,
      resetAll,
      isStepDone,
      stepResult,
      isDayComplete,
      dismissToast,
      hasListenedDay,
      hasListenedIntro,
      markAudioListened,
      markIntroListened,
    ],
  );

  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
}

export function useStore(): Store {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}

export function fmtMoney(n: number, opts?: { sign?: boolean }): string {
  const sign = opts?.sign && n > 0 ? "+" : "";
  if (n < 0) {
    return "−$" + Math.abs(n).toLocaleString("en-US");
  }
  return sign + "$" + Math.round(n).toLocaleString("en-US");
}

export function leaderboard(state: {
  profile: Profile | null;
  trustBalance: number;
  victorBalance: number;
}) {
  const entries = NAMES.map((name, i) => ({
    name,
    balance: STARTING_BALANCE + (i + 1) * 35_000 + ((i * 13) % 7) * 8_000,
    isYou: false,
    isVictor: false,
  }));
  entries.push({
    name: "Victor Crane",
    balance: STARTING_BALANCE + state.victorBalance,
    isYou: false,
    isVictor: true,
  });
  entries.push({
    name: state.profile?.fullName || "You",
    balance: state.trustBalance,
    isYou: true,
    isVictor: false,
  });
  return entries.sort((a, b) => b.balance - a.balance);
}

// Allow Platform.OS to be referenced for code paths that diverge
export const IS_WEB = Platform.OS === "web";
