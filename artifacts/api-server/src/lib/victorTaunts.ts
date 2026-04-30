// Victor Crane's rotating daily taunts.
// Sourced from the AUM master prompt (VICTOR_QUOTES).
export const VICTOR_TAUNTS: readonly string[] = [
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

// Pick today's taunt deterministically based on UTC day-of-year so
// every run on the same day produces the same string (idempotency aid).
export function tauntForToday(now: Date = new Date()): string {
  const start = Date.UTC(now.getUTCFullYear(), 0, 0);
  const diff = now.getTime() - start;
  const dayOfYear = Math.floor(diff / 86_400_000);
  return VICTOR_TAUNTS[dayOfYear % VICTOR_TAUNTS.length]!;
}
