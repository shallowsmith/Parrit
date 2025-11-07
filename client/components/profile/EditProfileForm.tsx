import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Alert } from 'react-native';
import { Input } from '@/components/ui/Input';
import { AppColors } from '@/constants/theme';

interface EditProfileFormProps {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  onFirstNameChange: (value: string) => void;
  onLastNameChange: (value: string) => void;
  onPhoneNumberChange: (value: string) => void;
}

export const EditProfileForm: React.FC<EditProfileFormProps> = ({
  firstName,
  lastName,
  phoneNumber,
  onFirstNameChange,
  onLastNameChange,
  onPhoneNumberChange,
}) => {
  const handleChangePhoto = () => {
    Alert.alert('Change Photo', 'Photo upload feature coming soon!');
  };

  const getInitials = () => {
    const firstInitial = firstName?.[0]?.toUpperCase() || '';
    return firstInitial || 'U';
  };

  return (
    <View style={styles.container}>
      {/* Profile Picture Section */}
      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{getInitials()}</Text>
        </View>
        <TouchableOpacity style={styles.changePhotoButton} onPress={handleChangePhoto}>
          <Text style={styles.changePhotoText}>Change Photo</Text>
        </TouchableOpacity>
      </View>

      {/* Form Fields */}
      <Input
        label="First Name"
        value={firstName}
        onChangeText={onFirstNameChange}
        placeholder="Enter first name"
      />
      
      <Input
        label="Last Name"
        value={lastName}
        onChangeText={onLastNameChange}
        placeholder="Enter last name"
      />
      
      <Input
        label="Phone Number"
        value={phoneNumber}
        onChangeText={onPhoneNumberChange}
        placeholder="(555) 555-5555"
        keyboardType="phone-pad"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 8,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: AppColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: AppColors.text,
  },
  changePhotoButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  changePhotoText: {
    fontSize: 15,
    fontWeight: '600',
    color: AppColors.primary,
  },
});

