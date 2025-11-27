/**
 * Login Screen
 *
 * User authentication screen with email/password login.
 * Based on PDF page 3 design.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/contexts/AuthContext';
import { AppColors } from '@/constants/theme';
import type { LoginFormData } from '@/types/auth.types';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    try {
      await login(data.email, data.password);
      // Navigation handled by AuthContext + root _layout.tsx
    } catch (error: any) {
      let message = 'Login failed. Please try again.';

      if (error.code === 'auth/invalid-credential') {
        message = 'Invalid email or password';
      } else if (error.code === 'auth/user-not-found') {
        message = 'No account found with this email';
      } else if (error.code === 'auth/wrong-password') {
        message = 'Incorrect password';
      } else if (error.code === 'auth/too-many-requests') {
        message = 'Too many failed attempts. Please try again later.';
      }

      Alert.alert('Login Error', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={true}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Finance Tracker</Text>
      </View>

      <View style={styles.form}>
          <Controller
            control={control}
            name="email"
            rules={{
              required: 'Email is required',
              pattern: {
                value: /^\S+@\S+$/i,
                message: 'Invalid email format',
              },
            }}
            render={({ field: { onChange, value } }) => (
              <Input
                label="Email"
                value={value}
                onChangeText={onChange}
                placeholder="Email"
                keyboardType="email-address"
                autoCapitalize="none"
                error={errors.email?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            rules={{
              required: 'Password is required',
            }}
            render={({ field: { onChange, value } }) => (
              <Input
                label="Password"
                value={value}
                onChangeText={onChange}
                placeholder="Password"
                secureTextEntry
                error={errors.password?.message}
              />
            )}
          />

          <Button title="Log In" onPress={handleSubmit(onSubmit)} loading={loading} />

          <TouchableOpacity
            onPress={() => router.push('/register')}
            style={styles.signupLink}
          >
            <Text style={styles.signupText}>
              Don't have an account? <Text style={styles.signupTextBold}>Sign Up</Text>
            </Text>
          </TouchableOpacity>
        </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  content: {
    padding: 24,
    paddingTop: 60,
    paddingBottom: 100, // Extra padding for scrolling
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    position: 'relative',
  },
  title: {
    color: AppColors.text,
    fontSize: 28,
    fontWeight: 'bold',
  },
  form: {
    gap: 16,
  },
  signupLink: {
    marginTop: 32,
    alignSelf: 'center',
  },
  signupText: {
    color: AppColors.textSecondary,
    fontSize: 14,
  },
  signupTextBold: {
    color: AppColors.text,
    fontWeight: 'bold',
  },
});
