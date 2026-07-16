import { describe, expect, it } from 'vitest';
import {
  FORM_VALIDATION_KEYS,
  validateEmail,
  validateMinLength,
  validatePasswordMatch,
  validateRequired,
} from './formValidation';

describe('validateRequired', () => {
  it.each([undefined, null, '', '   ', false, []])('rejects missing value %j', (value) => {
    expect(validateRequired(value)).toBe(FORM_VALIDATION_KEYS.required);
  });

  it.each(['value', 0, true, ['value']])('accepts present value %j', (value) => {
    expect(validateRequired(value)).toBeNull();
  });
});

describe('validateEmail', () => {
  it.each(['learner@example.com', 'learner+review@sub.example.co'])('accepts %s', (value) => {
    expect(validateEmail(value)).toBeNull();
  });

  it('allows an empty optional value', () => {
    expect(validateEmail('')).toBeNull();
  });

  it.each(['learner', '@example.com', 'learner@example', 'learner@@example.com', 'learner @example.com']) (
    'rejects %s',
    (value) => {
      expect(validateEmail(value)).toBe(FORM_VALIDATION_KEYS.email);
    },
  );
});

describe('validateMinLength', () => {
  it('accepts the exact boundary and values above it', () => {
    expect(validateMinLength('12345678', 8)).toBeNull();
    expect(validateMinLength('123456789', 8)).toBeNull();
  });

  it('rejects values below the boundary', () => {
    expect(validateMinLength('1234567', 8)).toBe(FORM_VALIDATION_KEYS.minLength);
  });

  it('rejects an invalid minimum', () => {
    expect(() => validateMinLength('value', -1)).toThrow(RangeError);
    expect(() => validateMinLength('value', 1.5)).toThrow(RangeError);
  });
});

describe('validatePasswordMatch', () => {
  it('accepts exact matches', () => {
    expect(validatePasswordMatch('secret-value', 'secret-value')).toBeNull();
  });

  it('rejects mismatches', () => {
    expect(validatePasswordMatch('secret-value', 'different-value')).toBe(
      FORM_VALIDATION_KEYS.passwordMatch,
    );
  });
});
