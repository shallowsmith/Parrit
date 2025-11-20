import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { CustomModal } from '@/components/ui/Modal';
import { EditProfileForm } from './EditProfileForm';
import { Button } from '@/components/ui/Button';
import { Profile } from '@/types/auth.types';

interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
  profile: Profile | null;
  onSave: (updatedProfile: Partial<Profile>) => Promise<void>;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  visible,
  onClose,
  profile,
  onSave,
}) => {
  const [firstName, setFirstName] = useState(profile?.firstName || '');
  const [lastName, setLastName] = useState(profile?.lastName || '');
  const [phoneNumber, setPhoneNumber] = useState(profile?.phoneNumber || '');
  const [loading, setLoading] = useState(false);

  // Update form when profile changes
  useEffect(() => {
    if (profile) {
      setFirstName(profile.firstName || '');
      setLastName(profile.lastName || '');
      setPhoneNumber(profile.phoneNumber || '');
    }
  }, [profile]);

  const handleSave = async () => {
    // Validation
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Error', 'First name and last name are required.');
      return;
    }

    setLoading(true);
    try {
      await onSave({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phoneNumber: phoneNumber.trim(),
      });
      Alert.alert('Success', 'Profile updated successfully!');
      onClose();
    } catch (error) {
      console.error('Failed to update profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <CustomModal visible={visible} onClose={onClose} title="Edit Profile">
      <ScrollView showsVerticalScrollIndicator={false}>
        <EditProfileForm
          firstName={firstName}
          lastName={lastName}
          phoneNumber={phoneNumber}
          onFirstNameChange={setFirstName}
          onLastNameChange={setLastName}
          onPhoneNumberChange={setPhoneNumber}
        />
        
        <View style={styles.buttonContainer}>
          <Button
            title="Save Changes"
            onPress={handleSave}
            loading={loading}
            variant="primary"
          />
          <Button
            title="Cancel"
            onPress={onClose}
            variant="secondary"
            disabled={loading}
          />
        </View>
      </ScrollView>
    </CustomModal>
  );
};

const styles = StyleSheet.create({
  buttonContainer: {
    gap: 12,
    marginTop: 24,
  },
});

