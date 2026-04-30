import app from "./app";
import { logger } from "./lib/logger";
import { getDiscordClient, shutdownDiscordClient } from "./lib/discord";
import { startCronJobs, stopCronJobs } from "./lib/cron";
import { getSupabase } from "./lib/supabase";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const server = app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");

  // Boot side-services after HTTP is up so a slow Discord login can't
  // delay the listen callback.
  const discord = getDiscordClient();
  if (discord) {
    discord.catch((e) => logger.error({ err: e }, "Discord init failed"));
  }
  startCronJobs();

  // One-time check that the leaderboard table exists. We just probe; if it
  // 404s the user needs to run scripts/supabase-leaderboard.sql once.
  const sb = getSupabase();
  if (sb) {
    sb.from("leaderboard")
      .select("user_id", { count: "exact", head: true })
      .then(({ error }) => {
        if (error) {
          logger.error(
            { err: error },
            'Supabase "leaderboard" table not reachable. Run artifacts/api-server/scripts/supabase-leaderboard.sql in the Supabase SQL editor.',
          );
        } else {
          logger.info("Supabase leaderboard table reachable");
        }
      });
  }
});

// Graceful shutdown — close the HTTP server, stop the cron, destroy the
// Discord client. Ensures no zombie WebSocket session on process restart.
let shuttingDown = false;
async function shutdown(signal: string) {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info({ signal }, "Shutdown initiated");
  stopCronJobs();
  await shutdownDiscordClient().catch(() => {});
  server.close(() => {
    logger.info("HTTP server closed");
    process.exit(0);
  });
  // Hard timeout in case server.close hangs on a long-poll connection.
  setTimeout(() => process.exit(0), 5000).unref();
}
process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
