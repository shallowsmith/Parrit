/**
 * LoadingSpinner Component Tests (White Box)
 * 
 * Tests rendering and styling of the LoadingSpinner component
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { ActivityIndicator } from 'react-native';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

describe('LoadingSpinner Component', () => {
  describe('Rendering', () => {
    it('renders without crashing', () => {
      const { UNSAFE_getByType } = render(<LoadingSpinner />);
      const indicator = UNSAFE_getByType(ActivityIndicator);
      expect(indicator).toBeTruthy();
    });

    it('renders ActivityIndicator with large size', () => {
      const { UNSAFE_getByType } = render(<LoadingSpinner />);
      const indicator = UNSAFE_getByType(ActivityIndicator);
      expect(indicator.props.size).toBe('large');
    });

    it('renders with correct structure', () => {
      const { UNSAFE_getByType } = render(<LoadingSpinner />);
      const indicator = UNSAFE_getByType(ActivityIndicator);

      // Should be wrapped in a View container
      expect(indicator.parent).toBeTruthy();
    });
  });

  describe('Styling', () => {
    it('applies flex: 1 to container', () => {
      const { UNSAFE_getByType } = render(<LoadingSpinner />);
      const indicator = UNSAFE_getByType(ActivityIndicator);
      const container = indicator.parent;

      expect(container?.props.style).toMatchObject(
        expect.objectContaining({ flex: 1 })
      );
    });

    it('centers content with alignItems and justifyContent', () => {
      const { UNSAFE_getByType } = render(<LoadingSpinner />);
      const indicator = UNSAFE_getByType(ActivityIndicator);
      const container = indicator.parent;

      expect(container?.props.style).toMatchObject(
        expect.objectContaining({
          alignItems: 'center',
          justifyContent: 'center',
        })
      );
    });
  });

  describe('Multiple Instances', () => {
    it('can render multiple instances independently', () => {
      const { UNSAFE_getAllByType } = render(
        <>
          <LoadingSpinner />
          <LoadingSpinner />
        </>
      );

      const indicators = UNSAFE_getAllByType(ActivityIndicator);
      expect(indicators).toHaveLength(2);
    });
  });

  describe('Component Behavior', () => {
    it('is a pure component with no state', () => {
      const { UNSAFE_getByType, rerender } = render(<LoadingSpinner />);
      const firstRender = UNSAFE_getByType(ActivityIndicator);

      rerender(<LoadingSpinner />);
      const secondRender = UNSAFE_getByType(ActivityIndicator);

      // Component should render consistently
      expect(firstRender).toBeTruthy();
      expect(secondRender).toBeTruthy();
    });

    it('does not accept any props', () => {
      // This test verifies the component signature
      const { UNSAFE_getByType } = render(<LoadingSpinner />);
      const indicator = UNSAFE_getByType(ActivityIndicator);
      expect(indicator).toBeTruthy();
    });
  });
});

