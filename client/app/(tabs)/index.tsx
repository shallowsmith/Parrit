import React from 'react';
import { Image } from 'expo-image';
import { Platform, StyleSheet } from 'react-native';
import { Link } from 'expo-router';

import { HelloWave } from '@/components/hello-wave';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

import VoiceRecorder from '@/components/VoiceTransactionWidget';
import BudgetOverview from '@/components/BudgetOverview';

export default function HomeScreen() {
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={styles.reactLogo}
        />
      }
    >
      {/* Budget overview + transactions */}
      <ThemedView style={{ marginBottom: 12 }}>
        <BudgetOverview />
      </ThemedView>

      {/* Voice recorder for testing / quick entry */}
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Voice Recorder</ThemedText>
        <ThemedText>Use the voice recorder below to test audio recording and upload functionality.</ThemedText>
        <VoiceRecorder />
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepContainer: { gap: 8, marginBottom: 8 },
  reactLogo: { height: 178, width: 290, bottom: 0, left: 0, position: 'absolute' },
});
