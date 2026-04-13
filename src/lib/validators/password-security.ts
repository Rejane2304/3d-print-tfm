/**
 * Password Security Module
 * Blocks commonly used passwords and checks against Have I Been Pwned API
 */

// ============================================
// COMMON PASSWORD LIST
// ============================================

/**
 * Comprehensive list of commonly used passwords to block
 * Sources: Various data breaches and security reports
 */
const COMMON_PASSWORDS = new Set([
  // Original requirements
  'password',
  '123456',
  'qwerty',
  'admin',
  'letmein',
  'welcome',
  'password123',
  '12345678',
  'abc123',
  'monkey',
  'dragon',
  'master',
  'shadow',
  'sunshine',

  // Additional common passwords (top breached passwords)
  '123456789',
  '1234567890',
  '1234567',
  '12345',
  '1234',
  '123123',
  '111111',
  '000000',
  '654321',
  '987654321',

  // Keyboard patterns
  'qwertyuiop',
  'qwerty123',
  'qwerty1',
  'asdfgh',
  'asdfghjkl',
  'zxcvbn',
  'zxcvbnm',
  'qazwsx',
  'qweasd',
  '1qaz2wsx',
  'qazwsxedc',

  // Common words
  'iloveyou',
  'princess',
  'football',
  'baseball',
  'basketball',
  'soccer',
  'charlie',
  'michael',
  'jordan',
  'superman',
  'batman',
  'spiderman',
  'starwars',
  'trustno1',
  'whatever',
  'jesus',
  'naruto',
  'pokemon',

  // Numbers and dates
  '121212',
  '112233',
  '777777',
  '666666',
  '555555',
  '999999',
  '888888',
  '2020',
  '2021',
  '2022',
  '2023',
  '2024',
  '2025',

  // Spanish common passwords
  'contraseña',
  'contraseña123',
  'españa',
  'hola',
  'amor',
  'familia',
  'tequiero',
  'cumpleaños',
  'secreto',

  // Leetspeak variations
  'p@ssword',
  'p@ssw0rd',
  'passw0rd',
  'adr1an',
  'adm1n',
  'l3tme1n',
  'monk3y',
  'dr4g0n',

  // Common variations
  'password1',
  'password12',
  'password2',
  'password01',
  'pass123',
  'pass1234',
  'secret',
  'secret123',
  'login',
  'login123',
  'user',
  'user123',
  'test',
  'test123',
  'demo',
  'demo123',
  'guest',
  'guest123',
  'root',
  'root123',
  'admin123',
  'adminadmin',
  'administrator',
  'master123',
  'welcome1',
  'welcome123',
]);

// ============================================
// ERROR MESSAGES
// ============================================

export const PASSWORD_SECURITY_ERRORS = {
  COMMON_PASSWORD:
    'Esta contraseña es muy común. Por favor elige una más segura.',
  PWNED_PASSWORD:
    'Esta contraseña ha aparecido en brechas de seguridad. Por favor elige otra.',
  PWNED_API_ERROR:
    'No se pudo verificar la seguridad de la contraseña. Por favor intenta con otra.',
} as const;

// ============================================
// CORE FUNCTIONS
// ============================================

/**
 * Check if a password is in the common password list (case-insensitive)
 * @param password - The password to check
 * @returns true if password is in the common list
 */
export function isCommonPassword(password: string): boolean {
  if (!password || typeof password !== 'string') {
    return false;
  }

  const normalizedPassword = password.toLowerCase().trim();

  // Check exact match
  if (COMMON_PASSWORDS.has(normalizedPassword)) {
    return true;
  }

  // Check common variations (e.g., with numbers appended)
  const baseVariations = [
    normalizedPassword.replace(/\d+$/, ''), // Remove trailing numbers
    normalizedPassword.replace(/[!@#$%^&*]+$/, ''), // Remove trailing symbols
    normalizedPassword.replace(/[\d!@#$%^&*]+$/, ''), // Remove trailing numbers and symbols
  ];

  return baseVariations.some((variation) => COMMON_PASSWORDS.has(variation));
}

/**
 * Check password against Have I Been Pwned API
 * Uses k-Anonymity model - only sends first 5 characters of SHA-1 hash
 * @param password - The password to check
 * @returns Object with breached status and count
 */
export async function checkPwnedPassword(
  password: string,
): Promise<{ isBreached: boolean; breachCount: number; error?: string }> {
  try {
    // Generate SHA-1 hash of password
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hash = hashArray
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase();

    // Split hash for k-Anonymity API
    const prefix = hash.slice(0, 5);
    const suffix = hash.slice(5);

    // Call HIBP API
    const response = await fetch(
      `https://api.pwnedpasswords.com/range/${prefix}`,
      {
        method: 'GET',
        headers: {
          'User-Agent': '3D-Print-TFM-Password-Checker',
        },
      },
    );

    if (!response.ok) {
      return {
        isBreached: false,
        breachCount: 0,
        error: PASSWORD_SECURITY_ERRORS.PWNED_API_ERROR,
      };
    }

    const data_text = await response.text();
    const lines = data_text.split('\n');

    // Check if suffix exists in response
    for (const line of lines) {
      const [hashSuffix, count] = line.split(':');
      if (hashSuffix === suffix) {
        return {
          isBreached: true,
          breachCount: Number.parseInt(count, 10) || 0,
        };
      }
    }

    return { isBreached: false, breachCount: 0 };
  } catch (error) {
    console.error('Error checking HIBP:', error);
    return {
      isBreached: false,
      breachCount: 0,
      error: PASSWORD_SECURITY_ERRORS.PWNED_API_ERROR,
    };
  }
}

// ============================================
// VALIDATION RESULT TYPE
// ============================================

export interface PasswordValidationResult {
  isValid: boolean;
  error?: string;
  isCommon: boolean;
  isBreached: boolean;
  breachCount?: number;
}

// ============================================
// COMPREHENSIVE VALIDATION
// ============================================

/**
 * Comprehensive password security validation
 * Checks both common passwords and HIBP database
 * @param password - The password to validate
 * @param checkPwned - Whether to check HIBP API (default: false to avoid network calls)
 * @returns Validation result with status and details
 */
export async function validatePasswordSecurity(
  password: string,
  checkPwned: boolean = false,
): Promise<PasswordValidationResult> {
  // Check common passwords first (fast, local check)
  if (isCommonPassword(password)) {
    return {
      isValid: false,
      error: PASSWORD_SECURITY_ERRORS.COMMON_PASSWORD,
      isCommon: true,
      isBreached: false,
    };
  }

  // Check HIBP if requested
  if (checkPwned) {
    const pwnedResult = await checkPwnedPassword(password);

    if (pwnedResult.error) {
      return {
        isValid: false,
        error: pwnedResult.error,
        isCommon: false,
        isBreached: false,
      };
    }

    if (pwnedResult.isBreached) {
      return {
        isValid: false,
        error: PASSWORD_SECURITY_ERRORS.PWNED_PASSWORD,
        isCommon: false,
        isBreached: true,
        breachCount: pwnedResult.breachCount,
      };
    }
  }

  return {
    isValid: true,
    isCommon: false,
    isBreached: false,
  };
}

/**
 * Synchronous password validation (common passwords only)
 * Use this when you don't need HIBP checking
 * @param password - The password to validate
 * @returns Validation result
 */
export function validatePasswordSecuritySync(
  password: string,
): PasswordValidationResult {
  if (isCommonPassword(password)) {
    return {
      isValid: false,
      error: PASSWORD_SECURITY_ERRORS.COMMON_PASSWORD,
      isCommon: true,
      isBreached: false,
    };
  }

  return {
    isValid: true,
    isCommon: false,
    isBreached: false,
  };
}

// ============================================
// ZOD INTEGRATION HELPER
// ============================================

/**
 * Creates a Zod refinement function for password security validation
 * Use with Zod schema refinement
 * @param enablePwnedCheck - Whether to enable HIBP checking
 * @returns Refinement function for Zod
 */
export function createPasswordSecurityRefinement(
  enablePwnedCheck: boolean = false,
) {
  return async(password: string): Promise<boolean> => {
    const result = await validatePasswordSecurity(password, enablePwnedCheck);
    return result.isValid;
  };
}

/**
 * Creates a Zod refinement function for synchronous password validation
 * @returns Refinement function for Zod
 */
export function createPasswordSecurityRefinementSync() {
  return (password: string): boolean => {
    const result = validatePasswordSecuritySync(password);
    return result.isValid;
  };
}
