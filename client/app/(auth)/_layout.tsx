/**
 * Auth Layout
 *
 * Stack navigator for authentication screens (login, register).
 */

import { Stack } from 'expo-router';
import { AppColors } from '@/constants/theme';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: AppColors.background },
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  );
}
