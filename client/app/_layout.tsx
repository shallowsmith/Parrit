/**
 * Root Layout
 *
 * Main app layout with authentication management.
 * - Wraps app with AuthProvider
 * - Handles conditional routing based on auth state
 * - Shows loading screen while checking auth status
 */

import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { View } from 'react-native';
import { AppColors } from '@/constants/theme';
import VoiceRecorder from '@/components/VoiceTransactionWidget';

function RootLayoutNav() {
  const { isAuthenticated, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    console.log('[RootLayout] Auth state:', { isAuthenticated, loading, segments });

    if (loading) {
      console.log('[RootLayout] Still loading, waiting...');
      return;
    }

    const inAuthGroup = segments[0] === '(auth)';
    console.log('[RootLayout] Current segment group:', segments[0], '| inAuthGroup:', inAuthGroup);

    if (!isAuthenticated && !inAuthGroup) {
      // Redirect to login if not authenticated
      console.log('[RootLayout] Not authenticated, redirecting to login...');
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      // Redirect to main app if authenticated
      console.log('[RootLayout] Authenticated in auth group, redirecting to tabs...');
      router.replace('/(tabs)');
    } else {
      console.log('[RootLayout] No navigation change needed');
    }
  }, [isAuthenticated, loading, segments]);

  if (loading) {
    console.log('[RootLayout] Rendering loading spinner...');
    return <LoadingSpinner />;
  }

  console.log('[RootLayout] Rendering main stack navigation');

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: AppColors.background } }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
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