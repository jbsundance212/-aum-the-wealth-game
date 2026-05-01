export type QuestionBlock = {
  question: string;
  scenario: string;
  options: { A: string; B: string; C: string; D: string };
  correct: "A" | "B" | "C" | "D" | null;
  sterlingCorrect: string;
  sterlingWrong: string;
  hasQuiz: boolean;
  rawText: string;
};

export type BourseAsset = {
  name: string;
  drift: number;
  volatility: number;
  label: string;
};

export type BourseParams = {
  env: string;
  label: string;
  description: string;
  assets: BourseAsset[];
  optimalAllocation: Record<string, number>;
  winThreshold: number;
  winCondition: string;
  sterlingWin: string;
  sterlingLoss: string;
};

export type DayData = {
  dayNumber: number;
  pillar: string;
  topic: string;
  briefing: [string, string, string];
  masterclassUrl: string;
  masterclassYouTubeId: string;
  titanName: string;
  titanTitle: string;
  titanBio: string;
  titanLesson: string;
  titanPlaybook: string;
  stress: QuestionBlock;
  diagnostic: QuestionBlock;
  momentum: QuestionBlock;
  sterlingMemo: string;
  bourseParams: BourseParams | null;
};

export type StepKey =
  | "briefing"
  | "masterclass"
  | "titan"
  | "stress"
  | "diagnostic"
  | "momentum"
  | "sterling"
  | "bourse";

export const STEP_ORDER: StepKey[] = [
  "briefing",
  "masterclass",
  "titan",
  "stress",
  "diagnostic",
  "momentum",
  "sterling",
  "bourse",
];

export const STEP_META: Record<
  StepKey,
  { label: string; reward: number; numeral: string }
> = {
  briefing: { label: "The Briefing", reward: 10000, numeral: "I" },
  masterclass: { label: "The Masterclass", reward: 20000, numeral: "II" },
  titan: { label: "The Titan", reward: 15000, numeral: "III" },
  stress: { label: "The Stress Test", reward: 50000, numeral: "IV" },
  diagnostic: { label: "The Diagnostic", reward: 30000, numeral: "V" },
  momentum: { label: "The Momentum Signal", reward: 40000, numeral: "VI" },
  sterling: { label: "The Sterling Memorandum", reward: 5000, numeral: "VII" },
  bourse: { label: "The Bourse", reward: 0, numeral: "VIII" },
};

// Step III's label is dynamic per-day, driven by the type of figure profiled:
//  - "Arthur Sterling"          -> the player's in-fiction Trustee
//  - any name starting with "The " -> a composite archetype, not a real person
//  - everything else            -> a real historical individual
// The card layout is identical across all three; only the eyebrow / row title
// changes. Match the title-cased default ("The Titan") so it slots in wherever
// `STEP_META.titan.label` was used previously; uppercase at the call site if
// the visual treatment requires all-caps (e.g. the Day Hub summary row).
export function titanLabel(titanName: string): string {
  if (titanName === "Arthur Sterling") return "Your Trustee";
  if (titanName.startsWith("The ")) return "The Specialist";
  return "The Titan";
}
