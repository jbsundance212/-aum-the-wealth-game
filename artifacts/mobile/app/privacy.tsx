import { useRouter } from "expo-router";
import React from "react";
import {
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { BrandMark } from "@/src/components/BrandMark";
import { FONT } from "@/src/theme/typography";

const GOLD = "#C8A96E";
const INK_DEEP = "#1a1a1a";
const INK_BODY = "#444444";
const INK_DIM = "#888888";
const RULE = "#E5E5E5";
const PAGE_BG = "#FFFFFF";
const CONTACT_EMAIL = "j.bernard@matinwealth.com";
const COMPANY_SITE = "https://matinwealth.com";

function openMail() {
  const url = `mailto:${CONTACT_EMAIL}`;
  if (Platform.OS === "web" && typeof window !== "undefined") {
    window.location.href = url;
  } else {
    void Linking.openURL(url);
  }
}

function openSite() {
  const url = COMPANY_SITE;
  if (Platform.OS === "web" && typeof window !== "undefined") {
    window.open(url, "_blank", "noopener,noreferrer");
  } else {
    void Linking.openURL(url);
  }
}

type SectionProps = { title: string; children: React.ReactNode };
function Section({ title, children }: SectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.h2}>{title}</Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <Text style={styles.body}>{children}</Text>;
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.bulletRow}>
      <Text style={styles.bulletDot}>•</Text>
      <Text style={[styles.body, styles.bulletText]}>{children}</Text>
    </View>
  );
}

export default function Privacy() {
  const router = useRouter();

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={styles.pageContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerRow}>
        <View style={styles.logoBox}>
          <BrandMark height={36} />
        </View>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.dismiss}>×</Text>
        </Pressable>
      </View>

      <View style={styles.titleBlock}>
        <Text style={styles.eyebrow}>MATIN WEALTH ADVISORY</Text>
        <Text style={styles.title}>Privacy Policy</Text>
        <Text style={styles.subtitle}>AUM — The Wealth Game</Text>
        <View style={styles.goldRule} />
        <Text style={styles.lastUpdated}>LAST UPDATED · MAY 2026</Text>
      </View>

      <View style={styles.intro}>
        <P>
          This Privacy Policy describes how Matin Wealth Advisory
          (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;)
          collects, uses and protects information when you use{" "}
          <Text style={styles.bodyEm}>AUM — The Wealth Game</Text>{" "}
          (the &ldquo;App&rdquo;). By installing or using the App, you
          agree to the practices described below.
        </P>
      </View>

      <Section title="1 · Who We Are">
        <P>
          The App is operated by Matin Wealth Advisory. You can
          contact us at any time:
        </P>
        <View style={styles.contactBox}>
          <View style={styles.contactRow}>
            <Text style={styles.contactLabel}>EMAIL</Text>
            <Pressable onPress={openMail} hitSlop={6}>
              <Text style={styles.contactValueLink}>{CONTACT_EMAIL}</Text>
            </Pressable>
          </View>
          <View style={styles.contactRow}>
            <Text style={styles.contactLabel}>WEB</Text>
            <Pressable onPress={openSite} hitSlop={6}>
              <Text style={styles.contactValueLink}>matinwealth.com</Text>
            </Pressable>
          </View>
        </View>
      </Section>

      <Section title="2 · Information We Collect">
        <P>
          To run the game and operate the public leaderboard, we
          collect the following information:
        </P>
        <Bullet>
          Your <Text style={styles.bodyEm}>display name</Text> (chosen
          during onboarding).
        </Bullet>
        <Bullet>
          Your <Text style={styles.bodyEm}>email address</Text>, when
          you make an in-app purchase (collected directly by Stripe at
          checkout).
        </Bullet>
        <Bullet>
          Your <Text style={styles.bodyEm}>game progress</Text> —
          which days you have completed, which stations you have
          finished, your current AUM (assets under management).
        </Bullet>
        <Bullet>
          Your <Text style={styles.bodyEm}>Bourse scores</Text> from
          the in-app trading simulator.
        </Bullet>
        <Bullet>
          Your <Text style={styles.bodyEm}>leaderboard position</Text>{" "}
          and the data needed to calculate it.
        </Bullet>
        <P>
          We do <Text style={styles.bodyEm}>not</Text> collect your
          location, contacts, photos, microphone or camera input.
        </P>
      </Section>

      <Section title="3 · How We Use Your Information">
        <P>We use the information we collect to:</P>
        <Bullet>Run the game and save your progress between sessions.</Bullet>
        <Bullet>
          Display the public cohort leaderboard so players can compare
          their performance.
        </Bullet>
        <Bullet>
          Send you game-related notifications (such as Victor Crane&rsquo;s
          daily taunt and progress reminders).
        </Bullet>
        <Bullet>
          Process your one-time in-app purchase to unlock Day 2 and
          beyond.
        </Bullet>
      </Section>

      <Section title="4 · Third-Party Services">
        <P>
          We use a small number of trusted third-party services to
          operate the App. These services receive only the data
          required for them to function:
        </P>
        <Bullet>
          <Text style={styles.bodyEm}>Supabase</Text> — stores your
          display name, game progress and leaderboard data.
        </Bullet>
        <Bullet>
          <Text style={styles.bodyEm}>Cloudinary</Text> — hosts the
          App&rsquo;s audio briefings and image media (no personal data
          is sent).
        </Bullet>
        <Bullet>
          <Text style={styles.bodyEm}>Stripe</Text> — processes the
          one-time in-app purchase. Stripe collects your email and
          payment-card details directly; we never see or store your
          card information.
        </Bullet>
        <Bullet>
          <Text style={styles.bodyEm}>Discord</Text> — powers the
          optional community channel. We only post your display name
          and Bourse results when you choose to join.
        </Bullet>
        <P>
          Each provider has its own privacy policy governing how it
          handles the limited data it receives.
        </P>
      </Section>

      <Section title="5 · Data Sharing">
        <Text style={[styles.body, styles.callout]}>
          We do not sell, rent or trade your personal information to
          third parties for marketing or any other purpose.
        </Text>
        <P>
          The only sharing that occurs is with the service providers
          listed above, strictly to operate the App.
        </P>
      </Section>

      <Section title="6 · Data Retention">
        <P>
          Your player data is retained for as long as your account is
          active. If you stop using the App, your data remains so that
          you can resume your progress later. You may request deletion
          at any time (see Section 7).
        </P>
      </Section>

      <Section title="7 · Your Rights">
        <P>
          You may request access to, correction of, or deletion of your
          personal information at any time by emailing us:
        </P>
        <Pressable onPress={openMail} hitSlop={6} style={styles.emailButton}>
          <Text style={styles.emailButtonText}>{CONTACT_EMAIL}</Text>
        </Pressable>
        <P>
          We will respond to verified requests within a reasonable
          timeframe and confirm in writing once your data has been
          removed.
        </P>
      </Section>

      <Section title="8 · Children">
        <P>
          The App is intended for adults interested in wealth-management
          education. It is not directed at children under the age of
          13, and we do not knowingly collect personal information from
          children.
        </P>
      </Section>

      <Section title="9 · Security">
        <P>
          We use industry-standard safeguards — encrypted connections
          (HTTPS) and access-controlled databases — to protect your
          information. No system is perfectly secure, but we work
          continuously to keep your data safe.
        </P>
      </Section>

      <Section title="10 · Changes to This Policy">
        <P>
          We may update this Privacy Policy from time to time. The
          &ldquo;Last Updated&rdquo; date at the top of this page will
          always reflect the most recent revision. Material changes
          will be communicated within the App.
        </P>
      </Section>

      <Section title="11 · Governing Law">
        <P>
          This Privacy Policy and any disputes arising from your use of
          the App are governed by the laws of the United Arab Emirates.
        </P>
      </Section>

      <View style={styles.footer}>
        <View style={styles.goldRule} />
        <Text style={styles.footerLine}>MATIN WEALTH ADVISORY</Text>
        <Text style={styles.footerSub}>
          AUM — The Wealth Game · © 2026 · All rights reserved
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: PAGE_BG,
  },
  pageContent: {
    paddingHorizontal: 28,
    paddingTop: 28,
    paddingBottom: 80,
    maxWidth: 760,
    width: "100%",
    alignSelf: "center",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 36,
  },
  logoBox: {
    flexDirection: "row",
    alignItems: "center",
  },
  dismiss: {
    fontFamily: FONT.body,
    fontSize: 28,
    color: INK_DIM,
    lineHeight: 28,
  },
  titleBlock: {
    marginBottom: 28,
  },
  eyebrow: {
    fontFamily: FONT.mono,
    fontSize: 11,
    color: INK_DIM,
    letterSpacing: 2,
    marginBottom: 14,
  },
  title: {
    fontFamily: FONT.serifSemiBold,
    fontSize: 44,
    color: INK_DEEP,
    lineHeight: 50,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: FONT.serifItalic,
    fontSize: 20,
    color: INK_BODY,
    marginTop: 6,
  },
  goldRule: {
    height: 1,
    backgroundColor: GOLD,
    width: 64,
    marginTop: 18,
    marginBottom: 14,
  },
  lastUpdated: {
    fontFamily: FONT.mono,
    fontSize: 10,
    color: GOLD,
    letterSpacing: 2,
  },
  intro: {
    marginBottom: 32,
  },
  section: {
    marginBottom: 28,
  },
  sectionBody: {
    marginTop: 4,
  },
  h2: {
    fontFamily: FONT.serifSemiBold,
    fontSize: 22,
    color: INK_DEEP,
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  body: {
    fontFamily: FONT.mono,
    fontSize: 13,
    lineHeight: 22,
    color: INK_BODY,
    marginBottom: 12,
  },
  bodyEm: {
    color: INK_DEEP,
    fontFamily: FONT.monoBold,
  },
  bulletRow: {
    flexDirection: "row",
    marginBottom: 8,
    paddingRight: 8,
  },
  bulletDot: {
    fontFamily: FONT.mono,
    fontSize: 13,
    lineHeight: 22,
    color: GOLD,
    width: 18,
  },
  bulletText: {
    flex: 1,
    marginBottom: 0,
  },
  callout: {
    borderLeftWidth: 2,
    borderLeftColor: GOLD,
    paddingLeft: 14,
    paddingVertical: 4,
    color: INK_DEEP,
  },
  contactBox: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: RULE,
    paddingVertical: 14,
    marginTop: 4,
    marginBottom: 8,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
  },
  contactLabel: {
    fontFamily: FONT.mono,
    fontSize: 10,
    color: INK_DIM,
    letterSpacing: 2,
    width: 70,
  },
  contactValueLink: {
    fontFamily: FONT.mono,
    fontSize: 13,
    color: INK_DEEP,
    textDecorationLine: "underline",
    textDecorationColor: GOLD,
  },
  emailButton: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: GOLD,
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginVertical: 8,
  },
  emailButtonText: {
    fontFamily: FONT.monoBold,
    fontSize: 12,
    color: GOLD,
    letterSpacing: 1,
  },
  footer: {
    marginTop: 40,
    alignItems: "flex-start",
  },
  footerLine: {
    fontFamily: FONT.mono,
    fontSize: 11,
    color: INK_DEEP,
    letterSpacing: 2,
    marginTop: 4,
  },
  footerSub: {
    fontFamily: FONT.mono,
    fontSize: 10,
    color: INK_DIM,
    marginTop: 6,
    letterSpacing: 1,
  },
});
