/**
 * AUM — Reusable AudioPlayer for daily briefings + character intros.
 *
 * Behavior contract:
 *  - Gold (#C8A96E) play/pause + progress bar; JetBrains Mono timing.
 *  - Auto-stops + unloads sound on unmount (so navigating away kills audio).
 *  - `autoPlay` prop attempts immediate playback (used by character intros);
 *    if the platform blocks it (mobile autoplay restriction, missing file)
 *    the player falls back to tap-to-play.
 *  - Fires `onComplete()` when the sound finishes; useful to gate "CONTINUE".
 *  - 404 / load failure shows "AUDIO UNAVAILABLE" instead of crashing.
 *  - Uses expo-av (already installed). expo-av is deprecated in SDK 54 but
 *    still functional; we'll migrate to expo-audio in a follow-up.
 */

import { Audio, type AVPlaybackStatus, type AVPlaybackStatusSuccess } from "expo-av";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from "react-native";

import { FONT } from "@/src/theme/typography";

const GOLD = "#C8A96E";
const PLAYER_BG = "#FDFCFA";
const PLAYER_BORDER = "#E8E0D0";
const TRACK_BG = "#EDE6D5";
const SUBTLE = "#7A6F5C";
const ERROR_INK = "#8B6B6B";

export type AudioPlayerProps = {
  /** Cloudinary URL for the audio file. Pass null to render an unavailable state. */
  uri: string | null;
  /** Try to start playback immediately on mount. Falls back to tap if blocked. */
  autoPlay?: boolean;
  /** Fires once when playback reaches the end of the file. */
  onComplete?: () => void;
  /** Fires when load fails or `uri` is null — lets callers unlock UI gates. */
  onError?: () => void;
  /** Compact variant for the briefing screen header reveal. */
  compact?: boolean;
  /** Outer wrapper style override. */
  style?: ViewStyle;
};

// Set the iOS silent-mode audio policy ONCE per app session — repeated calls
// hit the native bridge unnecessarily and can race against in-flight loads.
let audioModeConfigured = false;
async function ensureAudioMode(): Promise<void> {
  if (audioModeConfigured) return;
  audioModeConfigured = true;
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
    });
  } catch {
    // Re-arm so a transient failure doesn't permanently disable the policy.
    audioModeConfigured = false;
  }
}

function isSuccess(s: AVPlaybackStatus): s is AVPlaybackStatusSuccess {
  return (s as AVPlaybackStatusSuccess).isLoaded === true;
}

function fmt(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) ms = 0;
  const s = Math.floor(ms / 1000);
  const mm = Math.floor(s / 60);
  const ss = s % 60;
  return `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}

export function AudioPlayer({
  uri,
  autoPlay = false,
  onComplete,
  onError,
  compact = false,
  style,
}: AudioPlayerProps) {
  const soundRef = useRef<Audio.Sound | null>(null);
  const completedRef = useRef(false);
  const erroredRef = useRef(false);
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errored, setErrored] = useState(false);

  const fireError = useCallback(() => {
    if (erroredRef.current) return;
    erroredRef.current = true;
    setErrored(true);
    onErrorRef.current?.();
  }, []);

  const onStatus = useCallback(
    (status: AVPlaybackStatus) => {
      if (!isSuccess(status)) {
        if ("error" in status && status.error) fireError();
        return;
      }
      setIsPlaying(status.isPlaying);
      setPosition(status.positionMillis);
      if (status.durationMillis) setDuration(status.durationMillis);
      if (status.didJustFinish && !completedRef.current) {
        completedRef.current = true;
        onComplete?.();
      }
    },
    [onComplete, fireError],
  );

  const load = useCallback(
    async (shouldPlay: boolean) => {
      if (!uri) {
        fireError();
        return null;
      }
      setLoading(true);
      try {
        await ensureAudioMode();
        const { sound } = await Audio.Sound.createAsync(
          { uri },
          { shouldPlay, progressUpdateIntervalMillis: 250 },
          onStatus,
        );
        soundRef.current = sound;
        return sound;
      } catch (err) {
        console.warn("[AudioPlayer] load failed", err);
        fireError();
        return null;
      } finally {
        setLoading(false);
      }
    },
    [uri, onStatus, fireError],
  );

  // Auto-play on mount (if requested). Cleanup unloads no matter what.
  useEffect(() => {
    // Reset the error gate when the URI changes so a new file can re-attempt.
    erroredRef.current = false;
    setErrored(false);
    let cancelled = false;
    if (autoPlay) {
      if (!uri) {
        // No URL at all → unlock the gate immediately, no loading spinner.
        fireError();
      } else {
        void load(true).then((s) => {
          if (cancelled && s) {
            void s.unloadAsync().catch(() => undefined);
          }
        });
      }
    } else if (!uri) {
      // Render the unavailable state without firing onError (no gate to unlock).
      setErrored(true);
    }
    return () => {
      cancelled = true;
      const s = soundRef.current;
      soundRef.current = null;
      if (s) {
        void s.stopAsync().catch(() => undefined);
        void s.unloadAsync().catch(() => undefined);
      }
    };
    // Deliberately re-run only when uri changes — autoPlay is set-once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uri]);

  const toggle = useCallback(async () => {
    if (errored || !uri) return;
    let sound = soundRef.current;
    if (!sound) {
      sound = await load(true);
      return;
    }
    const status = await sound.getStatusAsync();
    if (!isSuccess(status)) return;
    if (status.didJustFinish || status.positionMillis >= (status.durationMillis ?? 0)) {
      // Completed previously — replay from start.
      completedRef.current = false;
      await sound.setPositionAsync(0);
      await sound.playAsync();
      return;
    }
    if (status.isPlaying) {
      await sound.pauseAsync();
    } else {
      await sound.playAsync();
    }
  }, [errored, uri, load]);

  const progressPct =
    duration > 0 ? Math.min(1, Math.max(0, position / duration)) : 0;

  if (errored || !uri) {
    return (
      <View style={[styles.wrap, compact && styles.wrapCompact, style]}>
        <Text style={styles.errorLabel}>AUDIO UNAVAILABLE</Text>
        <Text style={styles.errorHint}>
          The recording is not yet uploaded. Continue without audio.
        </Text>
      </View>
    );
  }

  const icon = loading ? "…" : isPlaying ? "❚❚" : "▶";

  return (
    <View style={[styles.wrap, compact && styles.wrapCompact, style]}>
      <View style={styles.row}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isPlaying ? "Pause briefing" : "Play briefing"}
          onPress={toggle}
          style={({ pressed }) => [
            styles.playBtn,
            compact && styles.playBtnCompact,
            pressed && { opacity: 0.6 },
          ]}
        >
          <Text style={[styles.playIcon, compact && styles.playIconCompact]}>
            {icon}
          </Text>
        </Pressable>
        <View style={styles.trackWrap}>
          <View style={styles.track}>
            <View
              style={[
                styles.trackFill,
                { width: `${Math.round(progressPct * 100)}%` },
              ]}
            />
          </View>
          <View style={styles.timeRow}>
            <Text style={styles.timeText}>{fmt(position)}</Text>
            <Text style={styles.timeText}>
              {duration > 0 ? fmt(duration) : "--:--"}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: PLAYER_BG,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: PLAYER_BORDER,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  wrapCompact: {
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  playBtn: {
    width: 44,
    height: 44,
    backgroundColor: GOLD,
    alignItems: "center",
    justifyContent: "center",
  },
  playBtnCompact: {
    width: 32,
    height: 32,
  },
  playIcon: {
    color: "#FFFFFF",
    fontFamily: FONT.bodyBold,
    fontSize: 16,
    letterSpacing: 1,
    marginLeft: 2,
  },
  playIconCompact: {
    fontSize: 12,
  },
  trackWrap: {
    flex: 1,
  },
  track: {
    height: 3,
    backgroundColor: TRACK_BG,
    overflow: "hidden",
  },
  trackFill: {
    height: 3,
    backgroundColor: GOLD,
  },
  timeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  timeText: {
    fontFamily: FONT.mono,
    fontSize: 11,
    color: SUBTLE,
    letterSpacing: 0.5,
  },
  errorLabel: {
    fontFamily: FONT.mono,
    fontSize: 9,
    color: ERROR_INK,
    letterSpacing: 3,
  },
  errorHint: {
    fontFamily: FONT.body,
    fontSize: 12,
    color: SUBTLE,
    marginTop: 4,
  },
});
