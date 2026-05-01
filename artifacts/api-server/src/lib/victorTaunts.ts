// Victor Crane's rotating daily taunts.
// Sourced from the AUM master prompt (VICTOR_QUOTES).
export const VICTOR_TAUNTS: readonly string[] = [
  "Good morning. I reviewed yesterday's leaderboard. Most of you are improving. I remain unimpressed.",
  "The Bourse opens in one hour. I've already allocated. You're welcome to try.",
  "Barnaby left us identical Trusts. The gap between our balances is entirely your fault.",
  "Sterling tells me someone completed Day 7 yesterday. I completed Day 7 in 2019. Metaphorically speaking.",
  "A reminder: diversification is the last refuge of those who lack conviction. I have conviction. You have sliders.",
  "I made $47,000 before breakfast. I mention this not to boast but to educate.",
  "The leaderboard updated overnight. I am still first. This was never in doubt.",
  "Whoever allocated 40% to Cash & T-Bills yesterday — we need to talk. Actually, no we don't.",
  "Another day of the Mandate. Another opportunity to close the gap. You won't, but the opportunity exists.",
  "Barnaby would be proud of some of you. He would be concerned about most of you. He would have opinions about all of you.",
];

// Pick today's taunt deterministically based on UTC day-of-year so
// every run on the same day produces the same string (idempotency aid).
export function tauntForToday(now: Date = new Date()): string {
  const start = Date.UTC(now.getUTCFullYear(), 0, 0);
  const diff = now.getTime() - start;
  const dayOfYear = Math.floor(diff / 86_400_000);
  return VICTOR_TAUNTS[dayOfYear % VICTOR_TAUNTS.length]!;
}
