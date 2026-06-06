/** Form validation functions */

export const validators = {
  email: (v) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v?.trim()) ? null : 'Please enter a valid email address',

  password: (v) =>
    (v?.length >= 8) ? null : 'Password must be at least 8 characters',

  passwordStrong: (v) => {
    if (!v || v.length < 8) return 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(v)) return 'Include at least one uppercase letter';
    if (!/[0-9]/.test(v)) return 'Include at least one number';
    return null;
  },

  required: (v) =>
    (v?.toString().trim()) ? null : 'This field is required',

  minLength: (min) => (v) =>
    (v?.length >= min) ? null : `Minimum ${min} characters required`,

  maxLength: (max) => (v) =>
    (!v || v.length <= max) ? null : `Maximum ${max} characters allowed`,

  positiveNumber: (v) =>
    (!isNaN(v) && Number(v) > 0) ? null : 'Must be a positive number',

  dateInFuture: (v) => {
    if (!v) return 'Date is required';
    const d = new Date(v);
    if (isNaN(d.getTime())) return 'Invalid date';
    if (d <= new Date()) return 'Date must be in the future';
    return null;
  },

  confirmPassword: (password) => (v) =>
    (v === password) ? null : 'Passwords do not match',
};

/** Run multiple validators on a value, return first error or null */
export const validate = (value, ...rules) => {
  for (const rule of rules) {
    const error = rule(value);
    if (error) return error;
  }
  return null;
};

/** Validate an entire form object, returns errors object */
export const validateForm = (fields) => {
  const errors = {};
  for (const [key, { value, rules }] of Object.entries(fields)) {
    const error = validate(value, ...rules);
    if (error) errors[key] = error;
  }
  return errors;
};
