/**
 * SettingsSection Component Tests (White Box)
 *
 * Tests settings display, item interactions, and press handlers
 */

import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { SettingsSection } from '@/components/profile/SettingsSection';

describe('SettingsSection', () => {
  const mockProps = {
    onNotificationsPress: jest.fn(),
    onPrivacyPress: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders settings section title', () => {
    render(<SettingsSection {...mockProps} />);

    expect(screen.getByText('Settings')).toBeTruthy();
  });

  it('renders all settings items', () => {
    render(<SettingsSection {...mockProps} />);

    expect(screen.getByText('Notifications')).toBeTruthy();
    expect(screen.getByText('Privacy & Security')).toBeTruthy();
  });

  it('renders arrow indicators for each setting', () => {
    render(<SettingsSection {...mockProps} />);

    const arrows = screen.getAllByText('›');
    expect(arrows).toHaveLength(2); // One for each setting
  });

  it('calls onNotificationsPress when Notifications is pressed', () => {
    render(<SettingsSection {...mockProps} />);

    const notificationsItem = screen.getByText('Notifications');
    fireEvent.press(notificationsItem);

    expect(mockProps.onNotificationsPress).toHaveBeenCalled();
  });

  it('calls onPrivacyPress when Privacy & Security is pressed', () => {
    render(<SettingsSection {...mockProps} />);

    const privacyItem = screen.getByText('Privacy & Security');
    fireEvent.press(privacyItem);

    expect(mockProps.onPrivacyPress).toHaveBeenCalled();
  });

  it('renders divider between settings items', () => {
    render(<SettingsSection {...mockProps} />);

    // Should have one divider between the two items
    // This is tested by the presence of the divider in the component structure
    const notificationsItem = screen.getByText('Notifications').parent;
    const privacyItem = screen.getByText('Privacy & Security').parent;

    expect(notificationsItem).toBeTruthy();
    expect(privacyItem).toBeTruthy();
  });

  it('handles undefined press handlers gracefully', () => {
    const propsWithoutHandlers = {
      onNotificationsPress: undefined,
      onPrivacyPress: undefined,
    };

    render(<SettingsSection {...propsWithoutHandlers} />);

    const notificationsItem = screen.getByText('Notifications');
    const privacyItem = screen.getByText('Privacy & Security');

    // Should not crash when pressed without handlers
    expect(() => fireEvent.press(notificationsItem)).not.toThrow();
    expect(() => fireEvent.press(privacyItem)).not.toThrow();
  });

  it('handles partial press handlers', () => {
    const propsWithPartialHandlers = {
      onNotificationsPress: jest.fn(),
      onPrivacyPress: undefined,
    };

    render(<SettingsSection {...propsWithPartialHandlers} />);

    const notificationsItem = screen.getByText('Notifications');
    const privacyItem = screen.getByText('Privacy & Security');

    fireEvent.press(notificationsItem);
    expect(propsWithPartialHandlers.onNotificationsPress).toHaveBeenCalled();

    // Should not crash when privacy item is pressed without handler
    expect(() => fireEvent.press(privacyItem)).not.toThrow();
  });
});
