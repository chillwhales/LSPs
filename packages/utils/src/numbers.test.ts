/**
 * Numbers Utility Tests
 *
 * Tests for numeric validation utility functions.
 * Validates the isNumeric function for various input types and edge cases.
 */

import { describe, expect, it } from 'vitest';
import { isNumeric } from './numbers';

describe('isNumeric', () => {
  describe('valid numeric strings', () => {
    it('should return true for integer strings', () => {
      const validIntegers = [
        '0',
        '1',
        '42',
        '123',
        '999999999',
      ];

      for (const value of validIntegers) {
        expect(isNumeric(value)).toBe(true);
      }
    });

    it('should return true for negative integer strings', () => {
      const negativeIntegers = [
        '-1',
        '-42',
        '-123',
        '-999999999',
      ];

      for (const value of negativeIntegers) {
        expect(isNumeric(value)).toBe(true);
      }
    });

    it('should return true for positive integer strings with explicit + sign', () => {
      const positiveIntegers = [
        '+1',
        '+42',
        '+123',
        '+999999999',
      ];

      for (const value of positiveIntegers) {
        expect(isNumeric(value)).toBe(true);
      }
    });

    it('should return true for floating-point number strings', () => {
      const floatingPoints = [
        '0.0',
        '1.5',
        '3.14159',
        '99.99',
        '123.456789',
        '0.000001',
      ];

      for (const value of floatingPoints) {
        expect(isNumeric(value)).toBe(true);
      }
    });

    it('should return true for negative floating-point number strings', () => {
      const negativeFloats = [
        '-0.1',
        '-1.5',
        '-3.14159',
        '-99.99',
        '-123.456789',
      ];

      for (const value of negativeFloats) {
        expect(isNumeric(value)).toBe(true);
      }
    });

    it('should return true for positive floating-point numbers with explicit + sign', () => {
      const positiveFloats = [
        '+0.1',
        '+1.5',
        '+3.14159',
        '+99.99',
        '+123.456789',
      ];

      for (const value of positiveFloats) {
        expect(isNumeric(value)).toBe(true);
      }
    });

    it('should return true for scientific notation strings', () => {
      const scientificNotation = [
        '1e5',
        '1E5',
        '1.5e10',
        '1.5E10',
        '1e-5',
        '1E-5',
        '1.5e-10',
        '1.5E-10',
        '-1e5',
        '-1.5e-10',
        '+1e5',
        '+1.5e10',
        '+1e-5',
        '+1.5e-10',
      ];

      for (const value of scientificNotation) {
        expect(isNumeric(value)).toBe(true);
      }
    });

    it('should return true for decimal numbers with leading zero', () => {
      const leadingZeroDecimals = [
        '0.1',
        '0.01',
        '0.001',
        '0.123456',
      ];

      for (const value of leadingZeroDecimals) {
        expect(isNumeric(value)).toBe(true);
      }
    });

    it('should return true for whole numbers with decimal point', () => {
      const wholeNumberDecimals = [
        '1.0',
        '42.0',
        '100.0',
        '-1.0',
        '-42.0',
      ];

      for (const value of wholeNumberDecimals) {
        expect(isNumeric(value)).toBe(true);
      }
    });
  });

  describe('invalid numeric strings', () => {
    it('should return false for empty string', () => {
      expect(isNumeric('')).toBe(false);
    });

    it('should return false for whitespace-only strings', () => {
      const whitespaceStrings = [
        ' ',
        '  ',
        '\t',
        '\n',
        '\r',
        ' \t\n\r ',
      ];

      for (const value of whitespaceStrings) {
        expect(isNumeric(value)).toBe(false);
      }
    });

    it('should return false for strings with leading/trailing whitespace', () => {
      const whitespaceNumbers = [
        ' 123',
        '123 ',
        ' 123 ',
        '\t123',
        '123\n',
        ' 123.45 ',
      ];

      for (const value of whitespaceNumbers) {
        expect(isNumeric(value)).toBe(false);
      }
    });

    it('should return false for non-numeric strings', () => {
      const nonNumericStrings = [
        'abc',
        'hello',
        'world',
        'test123',
        '123test',
        'a1b2c3',
        'not a number',
      ];

      for (const value of nonNumericStrings) {
        expect(isNumeric(value)).toBe(false);
      }
    });

    it('should return false for partial numbers (numbers with trailing text)', () => {
      const partialNumbers = [
        '123abc',
        '45.67xyz',
        '1e5test',
        '-123hello',
        '+456world',
        '0.5extra',
      ];

      for (const value of partialNumbers) {
        expect(isNumeric(value)).toBe(false);
      }
    });

    it('should return false for strings with special characters', () => {
      const specialCharStrings = [
        '123!',
        '@123',
        '12#3',
        '1$2$3',
        '12%3',
        '1^23',
        '1&23',
        '1*23',
        '1(23)',
        '1[23]',
        '1{23}',
        '12|3',
        '12\\3',
        '12/3', // Note: this is division symbol, not part of number
        '12+3', // Note: this is addition, not positive sign
        '1=23',
        '12~3',
        '12`3',
        '12;3',
        '12:3',
        '12"3',
        "12'3",
        '12<3',
        '12>3',
        '12?3',
        '12,3', // Note: comma is not a valid decimal separator in this context
      ];

      for (const value of specialCharStrings) {
        expect(isNumeric(value)).toBe(false);
      }
    });

    it('should return false for multiple decimal points', () => {
      const multipleDecimals = [
        '1.2.3',
        '1..2',
        '1.2.3.4',
        '..123',
        '123..',
        '.1.2.',
      ];

      for (const value of multipleDecimals) {
        expect(isNumeric(value)).toBe(false);
      }
    });

    it('should return false for multiple or misplaced signs', () => {
      const invalidSigns = [
        '++123', // double plus
        '--123', // double minus
        '+-123', // mixed signs
        '-+123', // mixed signs
        '1-23',  // minus in middle
        '1+23',  // plus in middle
        '12-3',  // minus in middle
        '12+3',  // plus in middle
      ];

      for (const value of invalidSigns) {
        expect(isNumeric(value)).toBe(false);
      }
    });

    it('should return false for invalid scientific notation', () => {
      const invalidScientific = [
        '1ee5',
        '1e',
        'e5',
        '1e5e',
        '1e++5',
        '1e--5',
        '1e+-5',
        '1e-+5',
        '1e5.5',
        '1e5.0', // Actually, this might be valid depending on implementation
      ];

      for (const value of invalidScientific) {
        expect(isNumeric(value)).toBe(false);
      }
    });

    it('should return false for special JavaScript number strings', () => {
      const specialValues = [
        'NaN',
        'Infinity',
        '-Infinity',
        '+Infinity',
        'infinity', // lowercase
        'nan', // lowercase
      ];

      for (const value of specialValues) {
        expect(isNumeric(value)).toBe(false);
      }
    });
  });

  describe('type safety', () => {
    it('should return false for non-string types', () => {
      const nonStringValues = [
        null,
        undefined,
        123, // actual number
        123.45, // actual number
        0,
        -1,
        true,
        false,
        {},
        [],
        [123],
        { value: 123 },
        new Date(),
        new RegExp('123'),
        Symbol('123'),
        () => 123,
      ];

      for (const value of nonStringValues) {
        expect(isNumeric(value as any)).toBe(false);
      }
    });

    it('should handle edge case with number-like objects', () => {
      const numberLikeObjects = [
        new Number(123), // Number object
        new String('123'), // String object
      ];

      for (const value of numberLikeObjects) {
        expect(isNumeric(value as any)).toBe(false);
      }
    });
  });

  describe('edge cases and boundary conditions', () => {
    it('should handle very large numbers', () => {
      const largeNumbers = [
        '999999999999999999999999999999',
        '1e308', // Close to JavaScript's Number.MAX_VALUE
        '1.7976931348623157e+308', // Approximately Number.MAX_VALUE
      ];

      for (const value of largeNumbers) {
        expect(isNumeric(value)).toBe(true);
      }
    });

    it('should handle very small numbers', () => {
      const smallNumbers = [
        '1e-308', // Close to JavaScript's Number.MIN_VALUE
        '5e-324', // Approximately Number.MIN_VALUE
        '0.000000000000000000000000000001',
      ];

      for (const value of smallNumbers) {
        expect(isNumeric(value)).toBe(true);
      }
    });

    it('should handle zero variations', () => {
      const zeroVariations = [
        '0',
        '-0',
        '+0',
        '0.0',
        '-0.0',
        '+0.0',
        '0e0',
        '0E0',
        '0.0e0',
        '0.0E0',
      ];

      for (const value of zeroVariations) {
        expect(isNumeric(value)).toBe(true);
      }
    });

    it('should handle decimal-only strings', () => {
      const decimalOnly = [
        '.',
        '..',
        '...',
      ];

      for (const value of decimalOnly) {
        expect(isNumeric(value)).toBe(false);
      }
    });

    it('should handle sign-only strings', () => {
      const signOnly = [
        '+',
        '-',
        '+-',
        '-+',
        '++',
        '--',
      ];

      for (const value of signOnly) {
        expect(isNumeric(value)).toBe(false);
      }
    });
  });

  describe('real-world use cases', () => {
    it('should validate common user input scenarios', () => {
      // Test cases that might come from user input forms
      const userInputs = [
        { input: '42', expected: true, description: 'simple integer' },
        { input: '3.14', expected: true, description: 'decimal number' },
        { input: '-10', expected: true, description: 'negative number' },
        { input: '0', expected: true, description: 'zero' },
        { input: '', expected: false, description: 'empty input' },
        { input: 'abc', expected: false, description: 'text input' },
        { input: '12abc', expected: false, description: 'mixed input' },
        { input: '100.50', expected: true, description: 'currency-like input' },
      ];

      for (const testCase of userInputs) {
        expect(isNumeric(testCase.input)).toBe(testCase.expected);
      }
    });

    it('should handle potential price/currency validation', () => {
      const priceInputs = [
        '0.01', // 1 cent
        '9.99', // typical price
        '100.00', // whole dollar amount
        '1000000.00', // large amount
        '0.001', // fractional cent (might not be valid currency but is numeric)
      ];

      for (const price of priceInputs) {
        expect(isNumeric(price)).toBe(true);
      }
    });

    it('should handle scientific notation from APIs or calculations', () => {
      const apiNumbers = [
        '1.234567890123457e+21', // Large number from calculation
        '6.62607015e-34', // Planck constant
        '2.99792458e8', // Speed of light
        '1.602176634e-19', // Elementary charge
      ];

      for (const number of apiNumbers) {
        expect(isNumeric(number)).toBe(true);
      }
    });
  });
});