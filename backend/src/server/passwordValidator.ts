/**
 * HELYRA Password Policy & Strength Validator
 * 
 * Rules:
 * - Minimum 12 characters
 * - Reject common leaked / breached passwords
 * - Check character entropy (upper, lower, digit, symbol)
 * - Prohibit username / email inclusion
 */

// List of top common passwords and weak patterns
const COMMON_PASSWORDS = new Set([
  'password123456',
  '123456789012',
  '1234567890123',
  'qwertyuiopas',
  'admin12345678',
  'welcome123456',
  'iloveyou12345',
  'monkey1234567',
  'dragon1234567',
  'master1234567',
  'sunshine12345',
  'princess12345',
  'football12345',
  'charlie123456',
  'shadow1234567',
  'superman12345',
  'trustno112345',
  'password12345',
  'letmein123456',
  'passphrase123'
]);

export interface PasswordValidationResult {
  isValid: boolean;
  score: number; // 0 to 4
  feedback: string[];
}

export function validatePassword(password: string, userContext?: { email?: string; name?: string }): PasswordValidationResult {
  const feedback: string[] = [];
  let score = 0;

  if (!password || typeof password !== 'string') {
    return {
      isValid: false,
      score: 0,
      feedback: ['Password is required.']
    };
  }

  // Length check: minimum 12 characters
  if (password.length < 12) {
    feedback.push('Password must be at least 12 characters long.');
  } else {
    score += 1;
    if (password.length >= 16) score += 1; // Bonus for strong passphrase
  }

  // Common password check
  const lower = password.toLowerCase();
  if (COMMON_PASSWORDS.has(lower)) {
    feedback.push('This password is too common and easily guessed. Please use a stronger passphrase.');
  }

  // Check repetition (e.g. "aaaaaaaaaaaa")
  if (/^(.)\1+$/.test(password)) {
    feedback.push('Password cannot consist of a single repeated character.');
  }

  // Check user context (email / name matching)
  if (userContext?.email) {
    const emailPrefix = userContext.email.split('@')[0].toLowerCase();
    if (emailPrefix.length >= 4 && lower.includes(emailPrefix)) {
      feedback.push('Password cannot contain your email username.');
    }
  }
  if (userContext?.name) {
    const namePart = userContext.name.split(' ')[0].toLowerCase();
    if (namePart.length >= 3 && lower.includes(namePart)) {
      feedback.push('Password cannot contain your first name.');
    }
  }

  // Character variety checks
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);

  const diversityCount = [hasUpper, hasLower, hasDigit, hasSymbol].filter(Boolean).length;
  if (diversityCount >= 3) {
    score += 1;
  }
  if (diversityCount === 4 && password.length >= 14) {
    score += 1;
  }

  // Cap score at 4
  score = Math.min(4, Math.max(0, score));

  const isValid = feedback.length === 0 && password.length >= 12;

  return {
    isValid,
    score,
    feedback
  };
}
