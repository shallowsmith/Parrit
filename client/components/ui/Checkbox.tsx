/**
 * Checkbox Component
 *
 * Custom checkbox component for terms of service agreement.
 */

import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { AppColors } from '@/constants/theme';

interface CheckboxProps {
  checked: boolean;
  onPress: () => void;
  label: string;
}

export function Checkbox({ checked, onPress, label }: CheckboxProps) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.checkbox, checked && styles.checked]}>
        {checked && <Text style={styles.checkmark}>✓</Text>}
      </View>
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: AppColors.primary,
    borderRadius: 4,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checked: {
    backgroundColor: AppColors.primary,
  },
  checkmark: {
    color: AppColors.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  label: {
    color: AppColors.text,
    fontSize: 14,
    flex: 1,
  },
});
