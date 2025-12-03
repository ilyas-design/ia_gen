// Security utilities - validation, sanitization, and security helpers

const validator = require('validator');

/**
 * Validate email format
 */
function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email is required and must be a string' };
  }
  
  const trimmedEmail = email.trim().toLowerCase();
  
  if (!validator.isEmail(trimmedEmail)) {
    return { valid: false, error: 'Invalid email format' };
  }
  
  if (trimmedEmail.length > 254) {
    return { valid: false, error: 'Email is too long (max 254 characters)' };
  }
  
  return { valid: true, email: trimmedEmail };
}

/**
 * Validate password strength
 * Requirements: min 8 chars, at least one letter and one number
 */
function validatePassword(password) {
  if (!password || typeof password !== 'string') {
    return { valid: false, error: 'Password is required and must be a string' };
  }
  
  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters long' };
  }
  
  if (password.length > 128) {
    return { valid: false, error: 'Password is too long (max 128 characters)' };
  }
  
  // Check for at least one letter and one number
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  
  if (!hasLetter) {
    return { valid: false, error: 'Password must contain at least one letter' };
  }
  
  if (!hasNumber) {
    return { valid: false, error: 'Password must contain at least one number' };
  }
  
  return { valid: true };
}

/**
 * Sanitize string input - remove potentially dangerous characters
 */
function sanitizeString(input, maxLength = 1000) {
  if (typeof input !== 'string') {
    return '';
  }
  
  // Trim and limit length
  let sanitized = input.trim();
  
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  // Remove null bytes and control characters (except newlines and tabs for comments)
  sanitized = sanitized.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');
  
  return sanitized;
}

/**
 * Sanitize HTML content - basic XSS prevention
 */
function sanitizeHTML(input) {
  if (typeof input !== 'string') {
    return '';
  }
  
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Validate and sanitize name field
 */
function validateName(name) {
  if (!name || name.trim().length === 0) {
    return { valid: true, name: null }; // Name is optional
  }
  
  const sanitized = sanitizeString(name, 100);
  
  if (sanitized.length < 2) {
    return { valid: false, error: 'Name must be at least 2 characters long' };
  }
  
  if (sanitized.length > 100) {
    return { valid: false, error: 'Name is too long (max 100 characters)' };
  }
  
  // Allow letters, spaces, hyphens, apostrophes
  if (!/^[a-zA-Z\s\-']+$/.test(sanitized)) {
    return { valid: false, error: 'Name can only contain letters, spaces, hyphens, and apostrophes' };
  }
  
  return { valid: true, name: sanitized };
}

/**
 * Validate numeric input
 */
function validateNumber(value, min = null, max = null) {
  if (value === null || value === undefined) {
    return { valid: false, error: 'Value is required' };
  }
  
  const num = Number(value);
  
  if (isNaN(num) || !isFinite(num)) {
    return { valid: false, error: 'Value must be a valid number' };
  }
  
  if (min !== null && num < min) {
    return { valid: false, error: `Value must be at least ${min}` };
  }
  
  if (max !== null && num > max) {
    return { valid: false, error: `Value must be at most ${max}` };
  }
  
  return { valid: true, value: num };
}

/**
 * Validate UUID format
 */
function validateUUID(uuid) {
  if (!uuid || typeof uuid !== 'string') {
    return { valid: false, error: 'Invalid ID format' };
  }
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  
  if (!uuidRegex.test(uuid)) {
    return { valid: false, error: 'Invalid ID format' };
  }
  
  return { valid: true };
}

module.exports = {
  validateEmail,
  validatePassword,
  sanitizeString,
  sanitizeHTML,
  validateName,
  validateNumber,
  validateUUID
};

