import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { AppColors } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import { ProfileInfoCard } from '@/components/profile/ProfileInfoCard';
import { SpendingHistoryChart } from '@/components/profile/SpendingHistoryChart';
import { SettingsSection } from '@/components/profile/SettingsSection';
import { EditProfileModal } from '@/components/profile/EditProfileModal';
import { Profile } from '@/types/auth.types';
import { useGoogleSheetsExport } from '@/hooks/useGoogleSheetsExport';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, profile, logout, updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const { exportToGoogleSheets, exporting } = useGoogleSheetsExport();

  const handleSaveProfile = async (updatedProfile: Partial<Profile>) => {
    await updateProfile(updatedProfile);
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await logout();
              // Navigation handled by AuthContext
            } catch {
              Alert.alert('Error', 'Failed to logout. Please try again.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleExportToGoogleSheets = () => {
    if (!profile?.id) {
      Alert.alert('Error', 'No profile found. Please log in again.');
      return;
    }
    exportToGoogleSheets(profile.id);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

      {/* Profile Info Card */}
      <ProfileInfoCard
        firstName={profile?.firstName}
        lastName={profile?.lastName}
        email={user?.email}
        phoneNumber={profile?.phoneNumber}
        onEditPress={() => setIsEditModalVisible(true)}
      />

      {/* Spending History Widget */}
      <SpendingHistoryChart />

      {/* View All Receipts Button */}
      <Button
        title="View All Scanned Receipts"
        onPress={() => router.push('/scanned-receipts')}
        variant="primary"
        style={styles.viewReceiptsButton}
        textStyle={styles.viewReceiptsButtonText}
      />

      {/* Export to Google Sheets Button */}
      <Button
        title="Export to Google Sheets"
        onPress={handleExportToGoogleSheets}
        variant="primary"
        loading={exporting}
        disabled={exporting}
        style={styles.exportButton}
        textStyle={styles.exportButtonText}
      />

      {/* Settings Options */}
      <SettingsSection
        onNotificationsPress={() => Alert.alert('Notifications', 'Coming soon!')}
        onPrivacyPress={() => Alert.alert('Privacy & Security', 'Coming soon!')}
      />

      {/* Logout Button */}
      <Button
        title="Logout"
        onPress={handleLogout}
        variant="secondary"
        loading={loading}
        style={styles.logoutButton}
      />

      <View style={styles.footer}>
        <Text style={styles.footerText}>Parrit v1.0.0</Text>
      </View>

      {/* Edit Profile Modal */}
      <EditProfileModal
        visible={isEditModalVisible}
        onClose={() => setIsEditModalVisible(false)}
        profile={profile}
        onSave={handleSaveProfile}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginTop: 40,
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: AppColors.text,
  },
  viewReceiptsButton: {
    marginBottom: 20,
    marginTop: 12,
    marginHorizontal: 50,
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 45,
  },
  viewReceiptsButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  exportButton: {
    marginBottom: 30,
    marginTop: 8,
    marginHorizontal: 50,
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 45,
  },
  exportButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  logoutButton: {
    marginTop: 8,
    marginBottom: 24,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  footerText: {
    fontSize: 12,
    color: AppColors.textSecondary,
  },
});
