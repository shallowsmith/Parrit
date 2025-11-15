/**
 * Button Component Tests (White Box)
 * 
 * Tests internal behavior, props, and state of the Button component
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ActivityIndicator } from 'react-native';
import { Button } from '@/components/ui/Button';

describe('Button Component', () => {
  describe('Rendering', () => {
    it('renders with correct title', () => {
      const { getByText } = render(<Button title="Press Me" onPress={() => {}} />);
      expect(getByText('Press Me')).toBeTruthy();
    });

    it('renders primary variant by default', () => {
      const { getByText } = render(<Button title="Primary" onPress={() => {}} />);
      const button = getByText('Primary').parent?.parent;
      expect(button).toBeTruthy();
    });

    it('renders secondary variant when specified', () => {
      const { getByText } = render(
        <Button title="Secondary" onPress={() => {}} variant="secondary" />
      );
      expect(getByText('Secondary')).toBeTruthy();
    });
  });

  describe('User Interaction', () => {
    it('calls onPress when pressed', () => {
      const mockOnPress = jest.fn();
      const { getByText } = render(<Button title="Click Me" onPress={mockOnPress} />);
      
      fireEvent.press(getByText('Click Me'));
      expect(mockOnPress).toHaveBeenCalledTimes(1);
    });

    it('does not call onPress when disabled', () => {
      const mockOnPress = jest.fn();
      const { getByText } = render(
        <Button title="Disabled" onPress={mockOnPress} disabled={true} />
      );
      
      fireEvent.press(getByText('Disabled'));
      expect(mockOnPress).not.toHaveBeenCalled();
    });

    it('does not call onPress when loading', () => {
      const mockOnPress = jest.fn();
      const { UNSAFE_getByType } = render(
        <Button title="Loading" onPress={mockOnPress} loading={true} />
      );

      // When loading, ActivityIndicator is shown, button is disabled
      const activityIndicator = UNSAFE_getByType(ActivityIndicator);
      const button = activityIndicator.parent;
      fireEvent.press(button);
      expect(mockOnPress).not.toHaveBeenCalled();
    });
  });

  describe('Loading State', () => {
    it('shows ActivityIndicator when loading', () => {
      const { UNSAFE_getByType, queryByText } = render(
        <Button title="Submit" onPress={() => {}} loading={true} />
      );

      const activityIndicator = UNSAFE_getByType(ActivityIndicator);
      expect(activityIndicator).toBeTruthy();
      expect(queryByText('Submit')).toBeNull();
    });

    it('hides text when loading', () => {
      const { queryByText } = render(
        <Button title="Submit" onPress={() => {}} loading={true} />
      );

      expect(queryByText('Submit')).toBeNull();
    });

    it('shows text when not loading', () => {
      const { getByText, UNSAFE_queryByType } = render(
        <Button title="Submit" onPress={() => {}} loading={false} />
      );

      expect(getByText('Submit')).toBeTruthy();
      expect(UNSAFE_queryByType(ActivityIndicator)).toBeNull();
    });
  });

  describe('Disabled State', () => {
    it('applies disabled styling when disabled prop is true', () => {
      const { getByText } = render(
        <Button title="Disabled" onPress={() => {}} disabled={true} />
      );
      
      const button = getByText('Disabled').parent?.parent;
      expect(button?.props.accessibilityState?.disabled).toBe(true);
    });

    it('is disabled when loading is true', () => {
      const { UNSAFE_getByType } = render(
        <Button title="Loading" onPress={() => {}} loading={true} />
      );

      const activityIndicator = UNSAFE_getByType(ActivityIndicator);
      const button = activityIndicator.parent;
      expect(button?.props.accessibilityState?.disabled).toBe(true);
    });
  });

  describe('Props', () => {
    it('accepts custom style prop', () => {
      const customStyle = { backgroundColor: 'red' };
      const { getByText } = render(
        <Button title="Custom" onPress={() => {}} style={customStyle} />
      );
      
      expect(getByText('Custom')).toBeTruthy();
    });

    it('accepts custom textStyle prop', () => {
      const customTextStyle = { fontSize: 20 };
      const { getByText } = render(
        <Button title="Custom Text" onPress={() => {}} textStyle={customTextStyle} />
      );
      
      expect(getByText('Custom Text')).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty title', () => {
      const { queryByText } = render(<Button title="" onPress={() => {}} />);
      expect(queryByText('')).toBeTruthy();
    });

    it('handles multiple rapid presses', () => {
      const mockOnPress = jest.fn();
      const { getByText } = render(<Button title="Rapid" onPress={mockOnPress} />);
      
      const button = getByText('Rapid');
      fireEvent.press(button);
      fireEvent.press(button);
      fireEvent.press(button);
      
      expect(mockOnPress).toHaveBeenCalledTimes(3);
    });

    it('handles both disabled and loading states', () => {
      const mockOnPress = jest.fn();
      const { UNSAFE_getByType } = render(
        <Button title="Both" onPress={mockOnPress} disabled={true} loading={true} />
      );

      const activityIndicator = UNSAFE_getByType(ActivityIndicator);
      const button = activityIndicator.parent;
      fireEvent.press(button);
      expect(mockOnPress).not.toHaveBeenCalled();
    });
  });
});

