import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { AppColors } from '@/constants/theme';
import { formatPhoneNumber } from '@/utils/phoneFormatter';

interface ProfileInfoCardProps {
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  onEditPress?: () => void;
}

export const ProfileInfoCard: React.FC<ProfileInfoCardProps> = ({
  firstName,
  lastName,
  email,
  phoneNumber,
  onEditPress,
}) => {
  const getInitials = () => {
    if (firstName) {
      return firstName[0].toUpperCase();
    }
    if (email) {
      return email[0].toUpperCase();
    }
    return 'U';
  };

  const getFullName = () => {
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    }
    return 'User';
  };

  return (
    <View style={styles.card}>
      <View style={styles.avatarContainer}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{getInitials()}</Text>
        </View>
      </View>
      
      <Text style={styles.userName}>{getFullName()}</Text>
      <Text style={styles.userEmail}>{email || 'No email'}</Text>
      {phoneNumber && (
        <Text style={styles.userPhone}>{formatPhoneNumber(phoneNumber)}</Text>
      )}
      
      <TouchableOpacity style={styles.editProfileButton} onPress={onEditPress}>
        <Text style={styles.editProfileText}>Edit Profile</Text>
      </TouchableOpacity>
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
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: AppColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: AppColors.text,
  },
  userName: {
    fontSize: 24,
    fontWeight: '600',
    color: AppColors.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: AppColors.textSecondary,
    textAlign: 'center',
    marginBottom: 4,
  },
  userPhone: {
    fontSize: 14,
    color: AppColors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  editProfileButton: {
    backgroundColor: AppColors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginTop: 4,
  },
  editProfileText: {
    fontSize: 15,
    fontWeight: '600',
    color: AppColors.text,
  },
});

