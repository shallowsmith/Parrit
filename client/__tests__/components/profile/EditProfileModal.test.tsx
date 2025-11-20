/**
 * EditProfileModal Component Tests (White Box)
 *
 * Tests modal functionality, form validation, state management, and save operations
 */

import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { EditProfileModal } from '@/components/profile/EditProfileModal';
import { Profile } from '@/types/auth.types';

// Mock Alert
jest.spyOn(Alert, 'alert').mockImplementation(() => {});

// Mock the components used by EditProfileModal
jest.mock('@/components/ui/Modal', () => ({
  CustomModal: ({ children, visible, onClose, title }: any) => (
    visible ? (
      <div testID="custom-modal">
        <div testID="modal-title">{title}</div>
        {children}
        <button testID="modal-close" onPress={onClose}>Close</button>
      </div>
    ) : null
  ),
}));

jest.mock('@/components/ui/Button', () => ({
  Button: ({ title, onPress, loading, variant, disabled }: any) => (
    <button
      testID={`button-${title.toLowerCase().replace(/\s+/g, '-')}`}
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityState={{ disabled: disabled || loading }}
    >
      {title}
    </button>
  ),
}));


describe('EditProfileModal', () => {
  const mockProfile: Profile = {
    id: 'profile-123',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    phoneNumber: '+1234567890',
    birthday: '01/15',
    firebaseUid: 'firebase-123',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
  };

  const mockProps = {
    visible: true,
    onClose: jest.fn(),
    profile: mockProfile,
    onSave: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders modal when visible is true', () => {
    render(<EditProfileModal {...mockProps} />);

    expect(screen.getByTestId('custom-modal')).toBeTruthy();
    expect(screen.getByTestId('modal-title')).toHaveTextContent('Edit Profile');
  });

  it('does not render modal when visible is false', () => {
    const props = { ...mockProps, visible: false };
    render(<EditProfileModal {...props} />);

    expect(screen.queryByTestId('custom-modal')).toBeNull();
  });

  it('initializes form with profile data', () => {
    render(<EditProfileModal {...mockProps} />);

    expect(screen.getByDisplayValue('John')).toBeTruthy();
    expect(screen.getByDisplayValue('Doe')).toBeTruthy();
    expect(screen.getByDisplayValue('+1234567890')).toBeTruthy();
  });

  it('updates form when profile prop changes', () => {
    const { rerender } = render(<EditProfileModal {...mockProps} />);

    const newProfile = { ...mockProfile, firstName: 'Jane', lastName: 'Smith' };
    rerender(<EditProfileModal {...mockProps} profile={newProfile} />);

    expect(screen.getByDisplayValue('Jane')).toBeTruthy();
    expect(screen.getByDisplayValue('Smith')).toBeTruthy();
  });

  it('handles null profile gracefully', () => {
    const props = { ...mockProps, profile: null };
    render(<EditProfileModal {...props} />);

    // Should render with empty values
    expect(screen.getAllByDisplayValue('')).toBeTruthy();
  });

  it('validates required fields on save', async () => {
    const props = {
      ...mockProps,
      profile: { ...mockProfile, firstName: '', lastName: '' },
    };

    render(<EditProfileModal {...props} />);

    const saveButton = screen.getByTestId('button-save-changes');
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'First name and last name are required.');
    });

    expect(mockProps.onSave).not.toHaveBeenCalled();
    expect(mockProps.onClose).not.toHaveBeenCalled();
  });

  it('validates empty first name', async () => {
    const props = {
      ...mockProps,
      profile: { ...mockProfile, firstName: '', lastName: 'Doe' },
    };

    render(<EditProfileModal {...props} />);

    const saveButton = screen.getByTestId('button-save-changes');
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'First name and last name are required.');
    });
  });

  it('validates empty last name', async () => {
    const props = {
      ...mockProps,
      profile: { ...mockProfile, firstName: 'John', lastName: '' },
    };

    render(<EditProfileModal {...props} />);

    const saveButton = screen.getByTestId('button-save-changes');
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'First name and last name are required.');
    });
  });

  it('saves profile successfully', async () => {
    mockProps.onSave.mockResolvedValue(undefined);

    render(<EditProfileModal {...mockProps} />);

    const saveButton = screen.getByTestId('button-save-changes');
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(mockProps.onSave).toHaveBeenCalledWith({
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: '+1234567890',
      });
    });

    expect(Alert.alert).toHaveBeenCalledWith('Success', 'Profile updated successfully!');
    expect(mockProps.onClose).toHaveBeenCalled();
  });

  it('handles save errors gracefully', async () => {
    const error = new Error('Save failed');
    mockProps.onSave.mockRejectedValue(error);

    render(<EditProfileModal {...mockProps} />);

    const saveButton = screen.getByTestId('button-save-changes');
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to update profile. Please try again.');
    });

    expect(mockProps.onClose).not.toHaveBeenCalled();
  });

  it('handles async save operation', async () => {
    mockProps.onSave.mockResolvedValue(undefined);

    render(<EditProfileModal {...mockProps} />);

    const saveButton = screen.getByTestId('button-save-changes');
    fireEvent.press(saveButton);

    // Wait for save to complete
    await waitFor(() => {
      expect(mockProps.onSave).toHaveBeenCalled();
    });
  });

  it('trims whitespace from form values before saving', async () => {
    const { rerender } = render(<EditProfileModal {...mockProps} />);

    // Update form with whitespace
    const firstNameInput = screen.getByDisplayValue('John');
    const lastNameInput = screen.getByDisplayValue('Doe');
    const phoneInput = screen.getByDisplayValue('+1234567890');

    fireEvent.changeText(firstNameInput, '  Jane  ');
    fireEvent.changeText(lastNameInput, '  Smith  ');
    fireEvent.changeText(phoneInput, '  +1987654321  ');

    const saveButton = screen.getByTestId('button-save-changes');
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(mockProps.onSave).toHaveBeenCalledWith({
        firstName: 'Jane',
        lastName: 'Smith',
        phoneNumber: '+1987654321',
      });
    });
  });

  it('calls onClose when cancel button is pressed', () => {
    render(<EditProfileModal {...mockProps} />);

    const cancelButton = screen.getByTestId('button-cancel');
    fireEvent.press(cancelButton);

    expect(mockProps.onClose).toHaveBeenCalled();
  });

  it('calls onClose when modal close button is pressed', () => {
    render(<EditProfileModal {...mockProps} />);

    const closeButton = screen.getByTestId('modal-close');
    fireEvent.press(closeButton);

    expect(mockProps.onClose).toHaveBeenCalled();
  });
});
