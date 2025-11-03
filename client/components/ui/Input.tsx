/**
 * Input Component
 *
 * Reusable text input component with label, error handling, and password visibility toggle.
 */

import React, { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity, StyleSheet, TextInputProps } from 'react-native';
import { AppColors } from '@/constants/theme';

interface InputProps extends TextInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  secureTextEntry?: boolean;
}

export function Input({
  label,
  value,
  onChangeText,
  error,
  secureTextEntry,
  ...props
}: InputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, error && styles.inputError]}
          value={value}
          onChangeText={onChangeText}
          placeholderTextColor={AppColors.textSecondary}
          secureTextEntry={secureTextEntry && !showPassword}
          autoCapitalize="none"
          autoComplete="off"
          textContentType={secureTextEntry ? 'none' : undefined}
          {...props}
        />
        {secureTextEntry && (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeButton}
          >
            <Text style={styles.eyeText}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    color: AppColors.text,
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  inputContainer: {
    position: 'relative',
  },
  input: {
    backgroundColor: AppColors.inputBg,
    borderWidth: 1,
    borderColor: AppColors.inputBorder,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    color: AppColors.text,
    minHeight: 56,
  },
  inputError: {
    borderColor: AppColors.error,
  },
  eyeButton: {
    position: 'absolute',
    right: 16,
    top: 16,
  },
  eyeText: {
    fontSize: 20,
  },
  errorText: {
    color: AppColors.error,
    fontSize: 12,
    marginTop: 4,
  },
});
