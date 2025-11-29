import { StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { AppColors } from '@/constants/theme';

export default function HelpScreen() {
  return (
    <ParallaxScrollView headerBackgroundColor={{ light: '#D0D0D0', dark: '#353636' }}>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Need Help?</ThemedText>
      </ThemedView>
      
      <ThemedView style={styles.sectionContainer}>
        <ThemedText>
          Parrit makes it easy to track your expenses. Here is how you can get started:
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <IconSymbol name="camera.fill" size={24} color={AppColors.primary} />
          <ThemedText type="subtitle" style={styles.sectionTitle}>Scan a Receipt</ThemedText>
        </View>
        <ThemedText style={styles.stepText}>1. Tap the <ThemedText type="defaultSemiBold">Scan</ThemedText> tab at the bottom.</ThemedText>
        <ThemedText style={styles.stepText}>2. Take a clear photo of your receipt.</ThemedText>
        <ThemedText style={styles.stepText}>3. Let Parrit analyze the items and prices for you.</ThemedText>
      </ThemedView>

      <ThemedView style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="mic" size={24} color={AppColors.primary} />
          <ThemedText type="subtitle" style={styles.sectionTitle}>Log by Voice</ThemedText>
        </View>
        <ThemedText style={styles.stepText}>1. Tap the big microphone button in the center.</ThemedText>
        <ThemedText style={styles.stepText}>2. Say your expense clearly (e.g., &quot;I spent $15 on lunch&quot;).</ThemedText>
        <ThemedText style={styles.stepText}>3. Parrit will log the transaction instantly.</ThemedText>
      </ThemedView>

      <ThemedView style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <IconSymbol name="house.fill" size={24} color={AppColors.primary} />
          <ThemedText type="subtitle" style={styles.sectionTitle}>Track Your Budget</ThemedText>
        </View>
        <ThemedText style={styles.stepText}>
          Check the <ThemedText type="defaultSemiBold">Home</ThemedText> tab to see your budget overview and recent transactions. 
          You can also visit <ThemedText type="defaultSemiBold">Profile</ThemedText> to manage your settings.
        </ThemedText>
      </ThemedView>
      
      <ThemedView style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="receipt" size={24} color={AppColors.primary} />
          <ThemedText type="subtitle" style={styles.sectionTitle}>View Scanned Receipts</ThemedText>
        </View>
        <ThemedText style={styles.stepText}>
          1. Go to the <ThemedText type="defaultSemiBold">Profile</ThemedText> tab.
        </ThemedText>
        <ThemedText style={styles.stepText}>
          2. Tap the <ThemedText type="defaultSemiBold">View All Scanned Receipts</ThemedText> button.
        </ThemedText>
        <ThemedText style={styles.stepText}>
          3. Browse all your scanned receipts organized by date.
        </ThemedText>
        <ThemedText style={styles.stepText}>
          4. Tap any receipt to view its details and transaction information.
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="table-chart" size={24} color={AppColors.primary} />
          <ThemedText type="subtitle" style={styles.sectionTitle}>Export to Google Sheets</ThemedText>
        </View>
        <ThemedText style={styles.stepText}>
          1. Go to the <ThemedText type="defaultSemiBold">Profile</ThemedText> tab.
        </ThemedText>
        <ThemedText style={styles.stepText}>
          2. Tap the <ThemedText type="defaultSemiBold">Export to Google Sheets</ThemedText> button.
        </ThemedText>
        <ThemedText style={styles.stepText}>
          3. Authorize Parrit to access your Google account (first time only).
        </ThemedText>
        <ThemedText style={styles.stepText}>
          4. Your transactions will be automatically exported to a new Google Sheet.
        </ThemedText>
        <ThemedText style={styles.stepText}>
          5. You can open the sheet directly from the app or access it later in Google Drive.
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.bottomSpacer} />

    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    paddingHorizontal: 20,
    marginTop: 80,
  },
  sectionContainer: {
    marginBottom: 24,
    paddingHorizontal: 20,
    gap: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 10,
  },
  sectionTitle: {
    // marginBottom: 4,
  },
  stepText: {
    marginLeft: 34, // Indent to align with text start of header if icon is 24 width + 10 gap
    marginBottom: 4,
  },
  bottomSpacer: {
    height: 40,
  },
});
