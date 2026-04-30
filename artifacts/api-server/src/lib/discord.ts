import { Client, GatewayIntentBits, type TextChannel } from "discord.js";
import { logger } from "./logger";

// Hard-coded channel/guild IDs supplied by the project owner.
// (These are not secrets — they identify a specific Discord server / channels.)
const GUILD_ID = "1499442445195411616";
export const VICTOR_CHANNEL_ID = "1499443634431590701"; // #victor-crane
export const BOURSE_CHANNEL_ID = "1499443466944512010"; // #bourse-results

let client: Client | null = null;
let readyPromise: Promise<Client> | null = null;

export function getDiscordClient(): Promise<Client> | null {
  const token = process.env["DISCORD_BOT_TOKEN"];
  if (!token) {
    logger.warn(
      "DISCORD_BOT_TOKEN not set; Discord bot disabled. Channel posts will be skipped.",
    );
    return null;
  }
  if (readyPromise) return readyPromise;

  client = new Client({ intents: [GatewayIntentBits.Guilds] });

  readyPromise = new Promise<Client>((resolve, reject) => {
    // discord.js v15 will rename this to "clientReady"; stay on "ready" for v14.
    client!.once("clientReady", (c) => {
      logger.info({ tag: c.user.tag, guildId: GUILD_ID }, "Discord bot ready");
      resolve(c);
    });
    client!.once("error", (err) => {
      logger.error({ err }, "Discord client error before ready");
      reject(err);
    });
  });

  client.login(token).catch((err) => {
    logger.error({ err }, "Discord login failed");
    readyPromise = null; // allow retry
  });

  return readyPromise;
}

export async function shutdownDiscordClient(): Promise<void> {
  if (!client) return;
  try {
    await client.destroy();
    logger.info("Discord client destroyed");
  } catch (err) {
    logger.warn({ err }, "Discord client destroy threw");
  } finally {
    client = null;
    readyPromise = null;
  }
}

async function fetchTextChannel(channelId: string): Promise<TextChannel | null> {
  const c = await getDiscordClient();
  if (!c) return null;
  try {
    const ch = await c.channels.fetch(channelId);
    if (!ch || !ch.isTextBased() || ch.isDMBased()) return null;
    return ch as TextChannel;
  } catch (err) {
    logger.error({ err, channelId }, "Failed to fetch Discord channel");
    return null;
  }
}

export async function postToVictorChannel(content: string): Promise<boolean> {
  const ch = await fetchTextChannel(VICTOR_CHANNEL_ID);
  if (!ch) return false;
  try {
    await ch.send(content);
    return true;
  } catch (err) {
    logger.error({ err }, "Victor channel post failed");
    return false;
  }
}

export async function postToBourseChannel(content: string): Promise<boolean> {
  const ch = await fetchTextChannel(BOURSE_CHANNEL_ID);
  if (!ch) return false;
  try {
    await ch.send(content);
    return true;
  } catch (err) {
    logger.error({ err }, "Bourse channel post failed");
    return false;
  }
}
