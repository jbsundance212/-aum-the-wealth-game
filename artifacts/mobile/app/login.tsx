import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { C } from "@/constants/colors";
import { BrandMark } from "@/src/components/BrandMark";
import { Button } from "@/src/components/Button";
import { useStore } from "@/src/data/store";
import { FONT } from "@/src/theme/typography";
import { characterFace } from "@/src/utils/cloudinary";

const STERLING_URI = characterFace("sterling", 130);

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signIn } = useStore();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = name.trim().length > 1 && /@/.test(email);

  const onSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    await signIn({
      fullName: name.trim(),
      email: email.trim().toLowerCase(),
      loggedInAt: Date.now(),
    });
    router.replace("/onboarding");
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.flex}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 36, paddingBottom: insets.bottom + 36 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.brand}>
          <BrandMark height={56} />
          <Text style={styles.brandTag}>THE WEALTH GAME</Text>
        </View>

        <View style={styles.crest}>
          <Image source={{ uri: STERLING_URI }} style={styles.portrait} contentFit="cover" />
          <Text style={styles.crestLabel}>VANE-BUCKLEY TRUST</Text>
          <Text style={styles.crestTag}>EST. 1923 · ZÜRICH</Text>
        </View>

        <View style={styles.divider} />

        <Text style={styles.h1}>The Residency</Text>
        <Text style={styles.copy}>
          Forty-nine days of disciplined instruction in the architecture of
          private capital. The late Barnaby Buckley's estate has selected you as
          a beneficiary, contingent upon completion of this curriculum under the
          supervision of his executor, Arthur Sterling.
        </Text>

        <View style={styles.form}>
          <Text style={styles.label}>FULL LEGAL NAME</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Lakhdar Bouchemal"
            placeholderTextColor={C.inkMuted}
            style={styles.input}
            autoComplete="name"
            autoCapitalize="words"
            returnKeyType="next"
          />
          <Text style={styles.label}>EMAIL ADDRESS</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="counsel@vane-buckley.ch"
            placeholderTextColor={C.inkMuted}
            style={styles.input}
            autoComplete="email"
            keyboardType="email-address"
            autoCapitalize="none"
            returnKeyType="done"
            onSubmitEditing={onSubmit}
          />
          <View style={{ height: 16 }} />
          <Button
            label="Sign Beneficiary Acknowledgement"
            onPress={onSubmit}
            disabled={!canSubmit}
            loading={submitting}
            variant="ink"
          />
          <Text style={styles.footnote}>
            By proceeding you acknowledge the terms of the Vane-Buckley
            beneficiary agreement and submit to the executor's discretion.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: C.bg },
  content: { paddingHorizontal: 22 },
  brand: { alignItems: "flex-start", gap: 6 },
  brandTag: {
    fontFamily: FONT.bodyMedium,
    fontSize: 10,
    letterSpacing: 2,
    color: C.inkMuted,
    marginLeft: 2,
  },
  crest: { alignItems: "center", marginTop: 36, gap: 10 },
  portrait: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: C.surfaceAlt,
  },
  crestLabel: {
    fontFamily: FONT.bodySemiBold,
    fontSize: 14,
    letterSpacing: 2.5,
    color: C.ink,
    marginTop: 4,
  },
  crestTag: {
    fontFamily: FONT.body,
    fontSize: 11,
    letterSpacing: 1.6,
    color: C.inkMuted,
  },
  divider: { height: 1, backgroundColor: C.divider, marginVertical: 28 },
  h1: {
    fontFamily: FONT.bodySemiBold,
    fontSize: 24,
    color: C.ink,
    letterSpacing: -0.3,
  },
  copy: {
    fontFamily: FONT.body,
    fontSize: 14,
    lineHeight: 22,
    color: C.inkSoft,
    marginTop: 10,
  },
  form: { marginTop: 28 },
  label: {
    fontFamily: FONT.bodyMedium,
    fontSize: 10,
    letterSpacing: 1.6,
    color: C.inkMuted,
    marginTop: 14,
    marginBottom: 6,
  },
  input: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.divider,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontFamily: FONT.mono,
    fontSize: 14,
    color: C.ink,
  },
  footnote: {
    fontFamily: FONT.body,
    fontSize: 11,
    color: C.inkMuted,
    lineHeight: 16,
    marginTop: 14,
    fontStyle: "italic",
  },
});
