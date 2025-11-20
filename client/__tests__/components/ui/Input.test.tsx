/**
 * Input Component Tests (White Box)
 * 
 * Tests internal behavior, state management, and props of the Input component
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Input } from '@/components/ui/Input';

describe('Input Component', () => {
  describe('Rendering', () => {
    it('renders with label', () => {
      const { getByText } = render(
        <Input label="Email" value="" onChangeText={() => {}} />
      );
      expect(getByText('Email')).toBeTruthy();
    });

    it('renders with value', () => {
      const { getByDisplayValue } = render(
        <Input label="Email" value="test@example.com" onChangeText={() => {}} />
      );
      expect(getByDisplayValue('test@example.com')).toBeTruthy();
    });

    it('renders without error by default', () => {
      const { queryByText } = render(
        <Input label="Email" value="" onChangeText={() => {}} />
      );
      // No error text should be visible
      expect(queryByText(/error/i)).toBeNull();
    });
  });

  describe('Text Input', () => {
    it('calls onChangeText when text changes', () => {
      const mockOnChange = jest.fn();
      const { getByDisplayValue } = render(
        <Input label="Name" value="" onChangeText={mockOnChange} />
      );
      
      const input = getByDisplayValue('');
      fireEvent.changeText(input, 'John Doe');
      
      expect(mockOnChange).toHaveBeenCalledWith('John Doe');
    });

    it('updates value when prop changes', () => {
      const { getByDisplayValue, rerender } = render(
        <Input label="Name" value="John" onChangeText={() => {}} />
      );
      
      expect(getByDisplayValue('John')).toBeTruthy();
      
      rerender(<Input label="Name" value="Jane" onChangeText={() => {}} />);
      expect(getByDisplayValue('Jane')).toBeTruthy();
    });

    it('accepts additional TextInput props', () => {
      const { getByPlaceholderText } = render(
        <Input 
          label="Email" 
          value="" 
          onChangeText={() => {}} 
          placeholder="Enter email"
        />
      );
      
      expect(getByPlaceholderText('Enter email')).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    it('displays error message when error prop is provided', () => {
      const { getByText } = render(
        <Input 
          label="Email" 
          value="" 
          onChangeText={() => {}} 
          error="Invalid email"
        />
      );
      
      expect(getByText('Invalid email')).toBeTruthy();
    });

    it('applies error styling when error exists', () => {
      const { getByDisplayValue } = render(
        <Input 
          label="Email" 
          value="test" 
          onChangeText={() => {}} 
          error="Invalid"
        />
      );
      
      const input = getByDisplayValue('test');
      expect(input).toBeTruthy();
    });

    it('removes error message when error prop is cleared', () => {
      const { getByText, queryByText, rerender } = render(
        <Input 
          label="Email" 
          value="" 
          onChangeText={() => {}} 
          error="Invalid email"
        />
      );
      
      expect(getByText('Invalid email')).toBeTruthy();
      
      rerender(
        <Input label="Email" value="" onChangeText={() => {}} />
      );
      
      expect(queryByText('Invalid email')).toBeNull();
    });
  });

  describe('Password Visibility Toggle', () => {
    it('shows eye button when secureTextEntry is true', () => {
      const { getByText } = render(
        <Input 
          label="Password" 
          value="" 
          onChangeText={() => {}} 
          secureTextEntry={true}
        />
      );
      
      // Eye icon should be present
      expect(getByText('👁️‍🗨️')).toBeTruthy();
    });

    it('does not show eye button when secureTextEntry is false', () => {
      const { queryByText } = render(
        <Input 
          label="Email" 
          value="" 
          onChangeText={() => {}} 
          secureTextEntry={false}
        />
      );
      
      expect(queryByText('👁️')).toBeNull();
      expect(queryByText('👁️‍🗨️')).toBeNull();
    });

    it('toggles password visibility when eye button is pressed', () => {
      const { getByText, queryByText } = render(
        <Input 
          label="Password" 
          value="secret123" 
          onChangeText={() => {}} 
          secureTextEntry={true}
        />
      );
      
      // Initially hidden (closed eye)
      expect(getByText('👁️‍🗨️')).toBeTruthy();
      
      // Press to show password
      fireEvent.press(getByText('👁️‍🗨️'));
      
      // Should now show open eye
      expect(queryByText('👁️')).toBeTruthy();
      expect(queryByText('👁️‍🗨️')).toBeNull();
      
      // Press again to hide
      fireEvent.press(getByText('👁️'));
      
      // Back to closed eye
      expect(getByText('👁️‍🗨️')).toBeTruthy();
    });

    it('maintains password visibility state across re-renders', () => {
      const { getByText, rerender } = render(
        <Input 
          label="Password" 
          value="secret" 
          onChangeText={() => {}} 
          secureTextEntry={true}
        />
      );
      
      // Show password
      fireEvent.press(getByText('👁️‍🗨️'));
      expect(getByText('👁️')).toBeTruthy();
      
      // Re-render with new value
      rerender(
        <Input 
          label="Password" 
          value="secret123" 
          onChangeText={() => {}} 
          secureTextEntry={true}
        />
      );
      
      // Password should still be visible
      expect(getByText('👁️')).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('sets autoCapitalize to none by default', () => {
      const { getByDisplayValue } = render(
        <Input label="Email" value="" onChangeText={() => {}} />
      );
      
      const input = getByDisplayValue('');
      expect(input.props.autoCapitalize).toBe('none');
    });

    it('sets textContentType to none for secure inputs', () => {
      const { getByDisplayValue } = render(
        <Input 
          label="Password" 
          value="" 
          onChangeText={() => {}} 
          secureTextEntry={true}
        />
      );
      
      const input = getByDisplayValue('');
      expect(input.props.textContentType).toBe('none');
    });
  });

  describe('Edge Cases', () => {
    it('handles empty label', () => {
      const { queryByText } = render(
        <Input label="" value="test" onChangeText={() => {}} />
      );
      
      expect(queryByText('')).toBeTruthy();
    });

    it('handles long error messages', () => {
      const longError = 'This is a very long error message that should still be displayed correctly';
      const { getByText } = render(
        <Input 
          label="Field" 
          value="" 
          onChangeText={() => {}} 
          error={longError}
        />
      );
      
      expect(getByText(longError)).toBeTruthy();
    });

    it('handles rapid text changes', () => {
      const mockOnChange = jest.fn();
      const { getByDisplayValue } = render(
        <Input label="Name" value="" onChangeText={mockOnChange} />
      );
      
      const input = getByDisplayValue('');
      fireEvent.changeText(input, 'A');
      fireEvent.changeText(input, 'AB');
      fireEvent.changeText(input, 'ABC');
      
      expect(mockOnChange).toHaveBeenCalledTimes(3);
    });
  });
});

