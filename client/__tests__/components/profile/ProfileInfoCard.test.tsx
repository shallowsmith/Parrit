/**
 * ProfileInfoCard Component Tests (White Box)
 *
 * Tests profile information display, avatar initials, and edit functionality
 */

import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { ProfileInfoCard } from '@/components/profile/ProfileInfoCard';
import { formatPhoneNumber } from '@/utils/phoneFormatter';

// Mock the phone formatter
jest.mock('@/utils/phoneFormatter', () => ({
  formatPhoneNumber: jest.fn(),
}));

describe('ProfileInfoCard', () => {
  const mockProps = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    phoneNumber: '+1234567890',
    onEditPress: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (formatPhoneNumber as jest.Mock).mockImplementation((phone) => phone);
  });

  it('renders full name correctly', () => {
    render(<ProfileInfoCard {...mockProps} />);

    expect(screen.getByText('John Doe')).toBeTruthy();
  });

  it('renders email correctly', () => {
    render(<ProfileInfoCard {...mockProps} />);

    expect(screen.getByText('john@example.com')).toBeTruthy();
  });

  it('renders formatted phone number', () => {
    (formatPhoneNumber as jest.Mock).mockReturnValue('(123) 456-7890');

    render(<ProfileInfoCard {...mockProps} />);

    expect(formatPhoneNumber).toHaveBeenCalledWith('+1234567890');
    expect(screen.getByText('(123) 456-7890')).toBeTruthy();
  });

  it('renders avatar with first name initial', () => {
    render(<ProfileInfoCard {...mockProps} />);

    expect(screen.getByText('J')).toBeTruthy();
  });

  it('renders edit profile button', () => {
    render(<ProfileInfoCard {...mockProps} />);

    const editButton = screen.getByText('Edit Profile');
    expect(editButton).toBeTruthy();
  });

  it('calls onEditPress when edit button is pressed', () => {
    render(<ProfileInfoCard {...mockProps} />);

    const editButton = screen.getByText('Edit Profile');
    fireEvent.press(editButton);

    expect(mockProps.onEditPress).toHaveBeenCalled();
  });

  it('renders fallback name when first and last name are missing', () => {
    const props = {
      firstName: undefined,
      lastName: undefined,
      email: 'john@example.com',
      onEditPress: jest.fn(),
    };

    render(<ProfileInfoCard {...props} />);

    expect(screen.getByText('User')).toBeTruthy();
  });

  it('renders fallback name when last name is missing', () => {
    const props = {
      ...mockProps,
      lastName: undefined,
    };

    render(<ProfileInfoCard {...props} />);

    expect(screen.getByText('User')).toBeTruthy();
    expect(screen.queryByText('John Doe')).toBeNull();
  });

  it('renders fallback name when first name is missing', () => {
    const props = {
      ...mockProps,
      firstName: undefined,
      lastName: 'Doe',
    };

    render(<ProfileInfoCard {...props} />);

    expect(screen.getByText('User')).toBeTruthy();
  });

  it('renders avatar with email initial when firstName is missing', () => {
    const props = {
      ...mockProps,
      firstName: undefined,
    };

    render(<ProfileInfoCard {...props} />);

    expect(screen.getByText('J')).toBeTruthy(); // J from john@example.com
  });

  it('renders avatar with fallback initial when firstName and email are missing', () => {
    const props = {
      firstName: undefined,
      lastName: 'Doe',
      email: undefined,
      onEditPress: jest.fn(),
    };

    render(<ProfileInfoCard {...props} />);

    expect(screen.getByText('U')).toBeTruthy(); // Fallback initial
  });

  it('renders "No email" when email is not provided', () => {
    const props = {
      ...mockProps,
      email: undefined,
    };

    render(<ProfileInfoCard {...props} />);

    expect(screen.getByText('No email')).toBeTruthy();
  });

  it('does not render phone number section when phoneNumber is not provided', () => {
    const props = {
      ...mockProps,
      phoneNumber: undefined,
    };

    render(<ProfileInfoCard {...props} />);

    expect(formatPhoneNumber).not.toHaveBeenCalled();
    // Should not have phone number text
    expect(screen.queryByText(/\+/)).toBeNull();
  });

  it('handles empty strings gracefully', () => {
    const props = {
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      onEditPress: jest.fn(),
    };

    render(<ProfileInfoCard {...props} />);

    expect(screen.getByText('User')).toBeTruthy();
    expect(screen.getByText('U')).toBeTruthy(); // Fallback initial
  });

  it('renders with partial data', () => {
    const props = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      onEditPress: jest.fn(),
      // phoneNumber is undefined
    };

    render(<ProfileInfoCard {...props} />);

    expect(screen.getByText('John Doe')).toBeTruthy();
    expect(screen.getByText('john@example.com')).toBeTruthy();
    expect(screen.getByText('J')).toBeTruthy();
    expect(screen.queryByText(/\+/)).toBeNull(); // No phone number
  });
});
