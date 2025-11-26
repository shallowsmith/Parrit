import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import { Link, useLocalSearchParams } from 'expo-router';

import { HelloWave } from '@/components/hello-wave';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

import BudgetOverview from '@/components/BudgetOverview';

export default function HomeScreen() {
  const params = useLocalSearchParams();

  return (
    <ParallaxScrollView>
      {/* Budget overview + transactions */}
      <ThemedView style={{ marginBottom: 0 }}>
        <BudgetOverview editTransactionParam={params.editTransaction as string | undefined} />
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepContainer: { gap: 8, marginBottom: 8 },
  reactLogo: { height: 178, width: 290, bottom: 0, left: 0, position: 'absolute' },
});
