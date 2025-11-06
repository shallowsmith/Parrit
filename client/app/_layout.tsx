import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        {/* 👇 Your main tab navigation */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

        {/* 👇 Existing modal route */}
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />

        {/* 👇 Add this new screen for transaction confirmation */}
        <Stack.Screen
          name="TransactionConfirm"
          options={{
            title: 'Confirm Transaction',
            headerStyle: { backgroundColor: '#0E0E0E' },
            headerTintColor: '#fff',
          }}
        />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
