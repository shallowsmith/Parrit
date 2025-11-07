/**
 * Register Screen
 *
 * User registration screen that combines Firebase signup AND profile creation in one flow.
 * Based on PDF page 2 design (Create Account).
 *
 * Fields: Full Name, Email, Password, Confirm Password, Birthday, Phone Number, Terms checkbox
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
import { Checkbox } from '@/components/ui/Checkbox';
import { useAuth } from '@/contexts/AuthContext';
import { AppColors } from '@/constants/theme';
import type { RegisterFormData } from '@/types/auth.types';

export default function RegisterScreen() {
  const router = useRouter();
  const { register: registerUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterFormData>({
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      birthday: '',
      phoneNumber: '',
    },
  });

  const password = watch('password');

  const onSubmit = async (data: RegisterFormData) => {
    console.log('[RegisterScreen] Form submitted');
    console.log('[RegisterScreen] Form data:', { ...data, password: '***', confirmPassword: '***' });

    // Validate terms checkbox
    if (!agreedToTerms) {
      console.log('[RegisterScreen] Terms not agreed');
      Alert.alert('Error', 'Please agree to the Terms of Service');
      return;
    }

    // Split full name into first and last name
    const nameParts = data.fullName.trim().split(' ');
    if (nameParts.length < 2) {
      console.log('[RegisterScreen] Invalid full name format');
      Alert.alert('Error', 'Please enter both first and last name');
      return;
    }

    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ');
    console.log('[RegisterScreen] Parsed name - First:', firstName, 'Last:', lastName);

    const profileData = {
      firstName,
      lastName,
      birthday: data.birthday,
      email: data.email,
      phoneNumber: data.phoneNumber,
    };
    console.log('[RegisterScreen] Profile data:', profileData);

    setLoading(true);
    try {
      console.log('[RegisterScreen] Calling registerUser function...');
      await registerUser(data.email, data.password, profileData);
      console.log('[RegisterScreen] Registration completed successfully!');
      // Navigation handled by AuthContext + root _layout.tsx
    } catch (error: any) {
      console.error('[RegisterScreen] Registration failed!');
      console.error('[RegisterScreen] Error:', error);
      console.error('[RegisterScreen] Error code:', error.code);
      console.error('[RegisterScreen] Error message:', error.message);
      console.error('[RegisterScreen] Error response:', error.response);

      let message = 'Registration failed. Please try again.';

      if (error.code === 'auth/email-already-in-use') {
        message = 'Email is already registered. Please login instead.';
      } else if (error.code === 'auth/invalid-email') {
        message = 'Invalid email format';
      } else if (error.code === 'auth/weak-password') {
        message = 'Password is too weak. Use at least 6 characters.';
      } else if (error.response?.status === 409) {
        message = 'Email is already registered in our system.';
      }

      Alert.alert('Registration Error', message);
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
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Text style={styles.backArrow}>←</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Create Account</Text>

      <View style={styles.form}>
          <Controller
            control={control}
            name="fullName"
            rules={{
              required: 'Full name is required',
              validate: (value) => {
                const parts = value.trim().split(' ');
                return parts.length >= 2 || 'Please enter both first and last name';
              },
            }}
            render={({ field: { onChange, value } }) => (
              <Input
                label="Full Name"
                value={value}
                onChangeText={onChange}
                placeholder="Enter your full name"
                error={errors.fullName?.message}
              />
            )}
          />

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
                placeholder="Enter your email"
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
              minLength: {
                value: 6,
                message: 'Password must be at least 6 characters',
              },
            }}
            render={({ field: { onChange, value } }) => (
              <Input
                label="Password"
                value={value}
                onChangeText={onChange}
                placeholder="Create a password"
                secureTextEntry
                error={errors.password?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="confirmPassword"
            rules={{
              required: 'Please confirm your password',
              validate: (value) => value === password || 'Passwords do not match',
            }}
            render={({ field: { onChange, value } }) => (
              <Input
                label="Confirm Password"
                value={value}
                onChangeText={onChange}
                placeholder="Confirm your password"
                secureTextEntry
                error={errors.confirmPassword?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="birthday"
            rules={{
              required: 'Birthday is required',
              pattern: {
                value: /^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])$/,
                message: 'Birthday must be in MM/DD format (e.g., 01/15)',
              },
            }}
            render={({ field: { onChange, value } }) => (
              <Input
                label="Birthday"
                value={value}
                onChangeText={onChange}
                placeholder="MM/DD (e.g., 01/15)"
                keyboardType="numeric"
                error={errors.birthday?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="phoneNumber"
            rules={{
              required: 'Phone number is required',
            }}
            render={({ field: { onChange, value } }) => (
              <Input
                label="Phone Number"
                value={value}
                onChangeText={onChange}
                placeholder="+1234567890"
                keyboardType="phone-pad"
                error={errors.phoneNumber?.message}
              />
            )}
          />

          <Checkbox
            checked={agreedToTerms}
            onPress={() => setAgreedToTerms(!agreedToTerms)}
            label="I agree to the Terms of Service"
          />

          <Button title="Create Account" onPress={handleSubmit(onSubmit)} loading={loading} />
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
    paddingBottom: 120, // Increased for better scrolling
  },
  backButton: {
    marginBottom: 20,
  },
  backArrow: {
    color: AppColors.text,
    fontSize: 28,
  },
  title: {
    color: AppColors.text,
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 32,
  },
  form: {
    gap: 16,
  },
});
