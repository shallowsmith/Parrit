/**
 * Phone Formatter Utility Tests (White Box)
 * 
 * Tests phone number formatting logic and edge cases
 */

import { formatPhoneNumber } from '@/utils/phoneFormatter';

describe('formatPhoneNumber', () => {
  describe('10-digit phone numbers', () => {
    it('formats 10-digit number with no formatting', () => {
      const result = formatPhoneNumber('1234567890');
      expect(result).toBe('+1 (123) 456-7890');
    });

    it('formats 10-digit number with spaces', () => {
      const result = formatPhoneNumber('123 456 7890');
      expect(result).toBe('+1 (123) 456-7890');
    });

    it('formats 10-digit number with dashes', () => {
      const result = formatPhoneNumber('123-456-7890');
      expect(result).toBe('+1 (123) 456-7890');
    });

    it('formats 10-digit number with parentheses', () => {
      const result = formatPhoneNumber('(123) 456-7890');
      expect(result).toBe('+1 (123) 456-7890');
    });

    it('formats 10-digit number with dots', () => {
      const result = formatPhoneNumber('123.456.7890');
      expect(result).toBe('+1 (123) 456-7890');
    });

    it('formats 10-digit number with mixed formatting', () => {
      const result = formatPhoneNumber('(123)-456.7890');
      expect(result).toBe('+1 (123) 456-7890');
    });
  });

  describe('11-digit phone numbers with country code', () => {
    it('formats 11-digit number starting with 1', () => {
      const result = formatPhoneNumber('11234567890');
      expect(result).toBe('+1 (123) 456-7890');
    });

    it('formats 11-digit number with +1 prefix', () => {
      const result = formatPhoneNumber('+11234567890');
      expect(result).toBe('+1 (123) 456-7890');
    });

    it('formats 11-digit number with spaces and country code', () => {
      const result = formatPhoneNumber('1 123 456 7890');
      expect(result).toBe('+1 (123) 456-7890');
    });

    it('formats 11-digit number with dashes and country code', () => {
      const result = formatPhoneNumber('1-123-456-7890');
      expect(result).toBe('+1 (123) 456-7890');
    });

    it('formats 11-digit number with full formatting', () => {
      const result = formatPhoneNumber('+1 (123) 456-7890');
      expect(result).toBe('+1 (123) 456-7890');
    });
  });

  describe('Invalid or non-standard formats', () => {
    it('returns original for numbers with less than 10 digits', () => {
      const result = formatPhoneNumber('123456789');
      expect(result).toBe('123456789');
    });

    it('returns original for numbers with more than 11 digits', () => {
      const result = formatPhoneNumber('123456789012');
      expect(result).toBe('123456789012');
    });

    it('returns original for 11-digit number not starting with 1', () => {
      const result = formatPhoneNumber('21234567890');
      expect(result).toBe('21234567890');
    });

    it('returns original for empty string', () => {
      const result = formatPhoneNumber('');
      expect(result).toBe('');
    });

    it('returns original for non-numeric input', () => {
      const result = formatPhoneNumber('abc');
      expect(result).toBe('abc');
    });

    it('returns original for partial phone number', () => {
      const result = formatPhoneNumber('123');
      expect(result).toBe('123');
    });
  });

  describe('Special characters handling', () => {
    it('removes all non-digit characters except for formatting', () => {
      const result = formatPhoneNumber('(123)!@#456$%^7890');
      expect(result).toBe('+1 (123) 456-7890');
    });

    it('handles multiple spaces', () => {
      const result = formatPhoneNumber('123   456   7890');
      expect(result).toBe('+1 (123) 456-7890');
    });

    it('handles leading and trailing spaces', () => {
      const result = formatPhoneNumber('  1234567890  ');
      expect(result).toBe('+1 (123) 456-7890');
    });

    it('handles mixed special characters', () => {
      const result = formatPhoneNumber('+1-(123).456-7890');
      expect(result).toBe('+1 (123) 456-7890');
    });
  });

  describe('Real-world examples', () => {
    it('formats typical user input: (555) 123-4567', () => {
      const result = formatPhoneNumber('(555) 123-4567');
      expect(result).toBe('+1 (555) 123-4567');
    });

    it('formats typical user input: 555-123-4567', () => {
      const result = formatPhoneNumber('555-123-4567');
      expect(result).toBe('+1 (555) 123-4567');
    });

    it('formats typical user input: 555.123.4567', () => {
      const result = formatPhoneNumber('555.123.4567');
      expect(result).toBe('+1 (555) 123-4567');
    });

    it('formats typical user input: +1 555 123 4567', () => {
      const result = formatPhoneNumber('+1 555 123 4567');
      expect(result).toBe('+1 (555) 123-4567');
    });

    it('handles copy-pasted formatted number', () => {
      const result = formatPhoneNumber('+1 (555) 123-4567');
      expect(result).toBe('+1 (555) 123-4567');
    });
  });

  describe('Edge cases', () => {
    it('handles all zeros', () => {
      const result = formatPhoneNumber('0000000000');
      expect(result).toBe('+1 (000) 000-0000');
    });

    it('handles all nines', () => {
      const result = formatPhoneNumber('9999999999');
      expect(result).toBe('+1 (999) 999-9999');
    });

    it('handles repeated digits', () => {
      const result = formatPhoneNumber('1111111111');
      expect(result).toBe('+1 (111) 111-1111');
    });

    it('is idempotent - formatting twice gives same result', () => {
      const firstFormat = formatPhoneNumber('1234567890');
      const secondFormat = formatPhoneNumber(firstFormat);
      expect(firstFormat).toBe(secondFormat);
      expect(secondFormat).toBe('+1 (123) 456-7890');
    });
  });

  describe('Type safety', () => {
    it('handles string input correctly', () => {
      const result = formatPhoneNumber('1234567890');
      expect(typeof result).toBe('string');
    });

    it('always returns a string', () => {
      const inputs = ['1234567890', '', 'abc', '123', '12345678901234'];
      inputs.forEach(input => {
        const result = formatPhoneNumber(input);
        expect(typeof result).toBe('string');
      });
    });
  });

  describe('Performance', () => {
    it('handles large number of calls efficiently', () => {
      const startTime = Date.now();
      
      for (let i = 0; i < 1000; i++) {
        formatPhoneNumber('1234567890');
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete 1000 calls in less than 100ms
      expect(duration).toBeLessThan(100);
    });
  });
});

