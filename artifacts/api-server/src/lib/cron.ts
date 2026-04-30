import cron, { type ScheduledTask } from "node-cron";
import { logger } from "./logger";
import { postToVictorChannel } from "./discord";
import { tauntForToday } from "./victorTaunts";

let started = false;
let task: ScheduledTask | null = null;

// Every day at 08:00 local time, in the Asia/Dubai (UTC+4, no DST) timezone.
// We schedule against the IANA zone directly so the runtime always interprets
// "08:00" correctly regardless of host clock or DST behavior elsewhere.
const VICTOR_CRON = "0 8 * * *";
const VICTOR_TZ = "Asia/Dubai";

export function startCronJobs(): void {
  if (started) return;
  started = true;

  if (!process.env["DISCORD_BOT_TOKEN"]) {
    logger.warn("Skipping Victor Crane cron — DISCORD_BOT_TOKEN missing.");
    return;
  }

  task = cron.schedule(
    VICTOR_CRON,
    async () => {
      const taunt = tauntForToday();
      const ok = await postToVictorChannel(`**Victor Crane:** ${taunt}`);
      logger.info({ ok, taunt }, "Daily Victor taunt dispatched");
    },
    { timezone: VICTOR_TZ },
  );

  logger.info(
    { schedule: VICTOR_CRON, tz: VICTOR_TZ },
    "Victor Crane daily taunt cron registered (08:00 Asia/Dubai)",
  );
}

export function stopCronJobs(): void {
  if (task) {
    task.stop();
    task = null;
  }
  started = false;
}
