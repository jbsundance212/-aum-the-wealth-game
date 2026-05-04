import {
  CormorantGaramond_400Regular,
  CormorantGaramond_400Regular_Italic,
  CormorantGaramond_600SemiBold,
} from "@expo-google-fonts/cormorant-garamond";
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_700Bold,
} from "@expo-google-fonts/jetbrains-mono";
import {
  PublicSans_400Regular,
  PublicSans_500Medium,
  PublicSans_600SemiBold,
  PublicSans_700Bold,
  useFonts,
} from "@expo-google-fonts/public-sans";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { C } from "@/constants/colors";
import { SplashOverlay } from "@/src/components/SplashOverlay";
import { TransactionToast } from "@/src/components/TransactionToast";
import { StoreProvider } from "@/src/data/store";

SplashScreen.preventAutoHideAsync().catch(() => {});

const queryClient = new QueryClient();

function RootStack() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: C.bg },
        animation: "fade",
        animationDuration: 220,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="day/[id]/index" />
      <Stack.Screen name="day/[id]/briefing" />
      <Stack.Screen name="day/[id]/masterclass" />
      <Stack.Screen name="day/[id]/titan" />
      <Stack.Screen name="day/[id]/stress" />
      <Stack.Screen name="day/[id]/diagnostic" />
      <Stack.Screen name="day/[id]/momentum" />
      <Stack.Screen name="day/[id]/sterling" />
      <Stack.Screen name="day/[id]/bourse" />
      <Stack.Screen name="end" />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    PublicSans_400Regular,
    PublicSans_500Medium,
    PublicSans_600SemiBold,
    PublicSans_700Bold,
    JetBrainsMono_400Regular,
    JetBrainsMono_700Bold,
    CormorantGaramond_400Regular,
    CormorantGaramond_400Regular_Italic,
    CormorantGaramond_600SemiBold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  const ready = fontsLoaded || !!fontError;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView style={styles.flex}>
            <KeyboardProvider>
              <StoreProvider>
                <View style={styles.flex}>
                  <StatusBar style="dark" backgroundColor={C.bg} />
                  <RootStack />
                  <TransactionToast />
                  <SplashOverlay ready={ready} />
                </View>
              </StoreProvider>
            </KeyboardProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: C.bg },
});
