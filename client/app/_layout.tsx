/**
 * Root Layout
 *
 * Handles:
 * - Firebase authentication state
 * - Conditional routing (auth ↔ tabs)
 * - Loading indicator during auth check
 */

import { DarkTheme, ThemeProvider } from "@react-navigation/native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import "react-native-reanimated";

import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

function RootLayoutNav() {
  const { isAuthenticated, loading } = useAuth();
  const segments = useSegments() as unknown as string[];
  const router = useRouter();

  useEffect(() => {
    // 🔸 Don't do anything until router + segments are ready
    if (!segments || segments.length === 0) {
      console.log("[RootLayout] Waiting for route segments...");
      return;
    }

    if (loading) {
      console.log("[RootLayout] Still checking authentication...");
      return;
    }

    // ✅ Safely cast segments to string[]
    const seg = segments as string[];
    const currentGroup = seg[0];
    const inAuthGroup = currentGroup === "(auth)";

    console.log("[RootLayout] Route group:", currentGroup, "| Authenticated:", isAuthenticated);

    // ✅ Redirect based on authentication state
    if (!isAuthenticated && !inAuthGroup) {
      console.log("[RootLayout] Not authenticated → Redirecting to login...");
      router.replace("/login");
    } else if (isAuthenticated && inAuthGroup) {
      console.log("[RootLayout] Authenticated user in auth route → Redirecting to tabs...");
      router.replace("/(tabs)");
    } else {
      console.log("[RootLayout] Auth state & route OK → No redirect needed.");
    }
  }, [isAuthenticated, loading, segments, router]);

  // Show a spinner while checking auth
  if (loading) {
    console.log("[RootLayout] Rendering loading spinner...");
    return <LoadingSpinner />;
  }

  // Normal navigation stack
  console.log("[RootLayout] Rendering main stack navigation...");
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: AppColors.background } }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="modal" options={{ presentation: "modal", title: "Modal" }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <ThemeProvider value={DarkTheme}>
        {/* Ensure the app root background is black so no white margins show */}
        <View style={{ flex: 1, backgroundColor: AppColors.background }}>
            <RootLayoutNav />
            {/* Mount the voice recorder at the app root so it can be used from any tab via the global event */}
            <VoiceRecorder />
          <StatusBar style="light" />
        </View>
      </ThemeProvider>
    </AuthProvider>
  );
}