import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { AppColors } from '@/constants/theme';

interface SettingItem {
  label: string;
  onPress?: () => void;
}

interface SettingsSectionProps {
  onNotificationsPress?: () => void;
  onPrivacyPress?: () => void;
}

export const SettingsSection: React.FC<SettingsSectionProps> = ({
  onNotificationsPress,
  onPrivacyPress,
}) => {
  const settings: SettingItem[] = [
    { label: 'Notifications', onPress: onNotificationsPress },
    { label: 'Privacy & Security', onPress: onPrivacyPress },
  ];

  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>Settings</Text>
      
      {settings.map((setting, index) => (
        <React.Fragment key={setting.label}>
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={setting.onPress}
          >
            <Text style={styles.settingText}>{setting.label}</Text>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
          {index < settings.length - 1 && <View style={styles.settingDivider} />}
        </React.Fragment>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: AppColors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.text,
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingText: {
    fontSize: 15,
    color: AppColors.text,
  },
  settingArrow: {
    fontSize: 24,
    color: AppColors.textSecondary,
  },
  settingDivider: {
    height: 1,
    backgroundColor: AppColors.inputBorder,
  },
});

