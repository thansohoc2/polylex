export const FORM_VALIDATION_KEYS = {
  required: 'validation.required',
  email: 'validation.email',
  minLength: 'validation.minLength',
  passwordMatch: 'validation.passwordMatch',
} as const;

export type FormValidationKey = (typeof FORM_VALIDATION_KEYS)[keyof typeof FORM_VALIDATION_KEYS];
export type ValidationResult = FormValidationKey | null;

/** Treats trimmed strings, empty arrays, null, undefined, and `false` as missing. */
export function validateRequired(value: unknown): ValidationResult {
  if (value == null || value === false) return FORM_VALIDATION_KEYS.required;
  if (typeof value === 'string' && value.trim().length === 0) return FORM_VALIDATION_KEYS.required;
  if (Array.isArray(value) && value.length === 0) return FORM_VALIDATION_KEYS.required;
  return null;
}

/** Validates a non-empty email value; compose with `validateRequired` when mandatory. */
export function validateEmail(value: string): ValidationResult {
  const normalized = value.trim();
  if (!normalized) return null;

  const atIndex = normalized.indexOf('@');
  const domain = normalized.slice(atIndex + 1);
  const valid =
    atIndex > 0 &&
    atIndex === normalized.lastIndexOf('@') &&
    domain.includes('.') &&
    !normalized.includes(' ') &&
    !domain.startsWith('.') &&
    !domain.endsWith('.');

  return valid ? null : FORM_VALIDATION_KEYS.email;
}

/** Uses JavaScript string length and treats the boundary as valid. */
export function validateMinLength(value: string, minimum: number): ValidationResult {
  if (!Number.isInteger(minimum) || minimum < 0) {
    throw new RangeError('minimum must be a non-negative integer');
  }
  return value.length >= minimum ? null : FORM_VALIDATION_KEYS.minLength;
}

/** Compares password values exactly; required validation remains a separate concern. */
export function validatePasswordMatch(password: string, confirmation: string): ValidationResult {
  return password === confirmation ? null : FORM_VALIDATION_KEYS.passwordMatch;
}
