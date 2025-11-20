/**
 * EditProfileForm Component Tests (White Box)
 *
 * Tests form rendering, input handling, avatar display, and user interactions
 */

import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { EditProfileForm } from '@/components/profile/EditProfileForm';

// Mock Alert
jest.spyOn(Alert, 'alert').mockImplementation(() => {});

describe('EditProfileForm', () => {
  const mockProps = {
    firstName: 'John',
    lastName: 'Doe',
    phoneNumber: '+1234567890',
    onFirstNameChange: jest.fn(),
    onLastNameChange: jest.fn(),
    onPhoneNumberChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all form inputs with correct labels and values', () => {
    render(<EditProfileForm {...mockProps} />);

    expect(screen.getByText('First Name')).toBeTruthy();
    expect(screen.getByText('Last Name')).toBeTruthy();
    expect(screen.getByText('Phone Number')).toBeTruthy();

    // Check that inputs have correct values
    const firstNameInput = screen.getByDisplayValue('John');
    const lastNameInput = screen.getByDisplayValue('Doe');
    const phoneInput = screen.getByDisplayValue('+1234567890');

    expect(firstNameInput).toBeTruthy();
    expect(lastNameInput).toBeTruthy();
    expect(phoneInput).toBeTruthy();
  });

  it('renders avatar with correct initials', () => {
    render(<EditProfileForm {...mockProps} />);

    // Should show 'J' for John
    expect(screen.getByText('J')).toBeTruthy();
  });

  it('renders avatar with fallback initial when firstName is empty', () => {
    const propsWithEmptyFirstName = {
      ...mockProps,
      firstName: '',
    };

    render(<EditProfileForm {...propsWithEmptyFirstName} />);

    // Should show 'U' for User fallback
    expect(screen.getByText('U')).toBeTruthy();
  });

  it('renders change photo button', () => {
    render(<EditProfileForm {...mockProps} />);

    const changePhotoButton = screen.getByText('Change Photo');
    expect(changePhotoButton).toBeTruthy();
  });

  it('calls Alert.alert when change photo button is pressed', () => {
    render(<EditProfileForm {...mockProps} />);

    const changePhotoButton = screen.getByText('Change Photo');
    fireEvent.press(changePhotoButton);

    expect(Alert.alert).toHaveBeenCalledWith(
      'Change Photo',
      'Photo upload feature coming soon!'
    );
  });

  it('calls onFirstNameChange when first name input changes', () => {
    render(<EditProfileForm {...mockProps} />);

    const firstNameInput = screen.getByDisplayValue('John');
    fireEvent.changeText(firstNameInput, 'Jane');

    expect(mockProps.onFirstNameChange).toHaveBeenCalledWith('Jane');
  });

  it('calls onLastNameChange when last name input changes', () => {
    render(<EditProfileForm {...mockProps} />);

    const lastNameInput = screen.getByDisplayValue('Doe');
    fireEvent.changeText(lastNameInput, 'Smith');

    expect(mockProps.onLastNameChange).toHaveBeenCalledWith('Smith');
  });

  it('calls onPhoneNumberChange when phone number input changes', () => {
    render(<EditProfileForm {...mockProps} />);

    const phoneInput = screen.getByDisplayValue('+1234567890');
    fireEvent.changeText(phoneInput, '+1987654321');

    expect(mockProps.onPhoneNumberChange).toHaveBeenCalledWith('+1987654321');
  });

  it('renders with empty initial values', () => {
    const emptyProps = {
      firstName: '',
      lastName: '',
      phoneNumber: '',
      onFirstNameChange: jest.fn(),
      onLastNameChange: jest.fn(),
      onPhoneNumberChange: jest.fn(),
    };

    render(<EditProfileForm {...emptyProps} />);

    const inputs = screen.getAllByDisplayValue('');
    expect(inputs.length).toBe(3); // firstName, lastName, phoneNumber
    expect(screen.getByText('U')).toBeTruthy(); // Fallback initial
  });

  it('renders with partial data', () => {
    const partialProps = {
      firstName: 'John',
      lastName: '',
      phoneNumber: '+1234567890',
      onFirstNameChange: jest.fn(),
      onLastNameChange: jest.fn(),
      onPhoneNumberChange: jest.fn(),
    };

    render(<EditProfileForm {...partialProps} />);

    expect(screen.getByDisplayValue('John')).toBeTruthy();
    expect(screen.getByDisplayValue('')).toBeTruthy(); // Last name empty
    expect(screen.getByDisplayValue('+1234567890')).toBeTruthy();
    expect(screen.getByText('J')).toBeTruthy(); // Initial from first name
  });
});
