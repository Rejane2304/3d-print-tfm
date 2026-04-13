/**
 * Rate Limiting Module
 * Provides in-memory rate limiting for authentication endpoints
 * All messages in Spanish as per project conventions
 */

import { NextRequest, NextResponse } from 'next/server';

// Rate limit types with their configurations
export type RateLimitType = 'login' | 'register' | 'passwordChange';

interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number; // Time window in milliseconds
}

interface RateLimitEntry {
  attempts: number;
  resetTime: number; // Timestamp when the window resets
}

// Configuration for each rate limit type
const RATE_LIMITS: Record<RateLimitType, RateLimitConfig> = {
  login: {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },
  register: {
    maxAttempts: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
  passwordChange: {
    maxAttempts: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
};

// In-memory store for rate limiting
// Structure: { [ip]: { [type]: RateLimitEntry } }
const rateLimitStore: Record<
  string,
  Record<RateLimitType, RateLimitEntry>
> = {};

/**
 * Get client IP address from request
 * Handles various proxy configurations
 */
function getClientIp(request: NextRequest): string {
  // Check for forwarded headers (common in production with proxies)
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // Get the first IP in the chain (original client)
    const ips = forwardedFor.split(',').map((ip) => ip.trim());
    return ips[0] || 'unknown';
  }

  // Check for other common headers
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Fallback to socket remote address
  // Note: In Next.js edge runtime, this might not be available
  return 'unknown';
}

/**
 * Clean up expired entries from the rate limit store
 * Called periodically to prevent memory leaks
 */
export function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const ip in rateLimitStore) {
    for (const type in rateLimitStore[ip]) {
      if (rateLimitStore[ip][type as RateLimitType].resetTime <= now) {
        delete rateLimitStore[ip][type as RateLimitType];
      }
    }
    // Remove IP entry if no types remain
    if (Object.keys(rateLimitStore[ip]).length === 0) {
      delete rateLimitStore[ip];
    }
  }
}

/**
 * Check if the request is rate limited
 * Returns true if the request should be blocked
 */
export function isRateLimited(
  ip: string,
  type: RateLimitType,
): { limited: boolean; remaining: number; resetTime: number } {
  const config = RATE_LIMITS[type];
  const now = Date.now();

  // Initialize store for this IP if not exists
  if (!rateLimitStore[ip]) {
    rateLimitStore[ip] = {} as Record<RateLimitType, RateLimitEntry>;
  }

  const entry = rateLimitStore[ip][type];

  // If no entry or entry has expired, create new entry
  if (!entry || entry.resetTime <= now) {
    rateLimitStore[ip][type] = {
      attempts: 1,
      resetTime: now + config.windowMs,
    };
    return {
      limited: false,
      remaining: config.maxAttempts - 1,
      resetTime: now + config.windowMs,
    };
  }

  // Check if limit exceeded
  if (entry.attempts >= config.maxAttempts) {
    return {
      limited: true,
      remaining: 0,
      resetTime: entry.resetTime,
    };
  }

  // Increment attempts
  entry.attempts++;

  return {
    limited: false,
    remaining: config.maxAttempts - entry.attempts,
    resetTime: entry.resetTime,
  };
}

/**
 * Get formatted time remaining until rate limit resets
 */
function getTimeRemaining(resetTime: number): string {
  const remainingMs = resetTime - Date.now();
  const minutes = Math.ceil(remainingMs / (60 * 1000));
  const hours = Math.ceil(remainingMs / (60 * 60 * 1000));

  if (hours > 1) {
    return `${hours} hours`;
  }
  return `${minutes} minutes`;
}

/**
 * Middleware to check rate limiting for API routes
 * Returns a Response if rate limited, null if allowed
 * Disabled in test environment to allow automated testing
 */
export function checkRateLimit(
  request: NextRequest,
  type: RateLimitType,
): NextResponse | null {
  // Skip rate limiting in test environment
  if (
    process.env.NODE_ENV === 'test' ||
    process.env.VITEST_ENV === 'integration'
  ) {
    return null;
  }

  const ip = getClientIp(request);
  const result = isRateLimited(ip, type);

  if (result.limited) {
    const timeRemaining = getTimeRemaining(result.resetTime);
    const messages: Record<RateLimitType, string> = {
      login: `Too many login attempts. Please try again in ${timeRemaining}.`,
      register: `Too many registration attempts. Please try again in ${timeRemaining}.`,
      passwordChange: `Too many password change attempts. Please try again in ${timeRemaining}.`,
    };

    return NextResponse.json(
      {
        success: false,
        error: messages[type],
        retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': String(RATE_LIMITS[type].maxAttempts),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.ceil(result.resetTime / 1000)),
          'Retry-After': String(
            Math.ceil((result.resetTime - Date.now()) / 1000),
          ),
        },
      },
    );
  }

  return null;
}

/**
 * Reset rate limit for a specific IP and type
 * Useful for successful operations
 */
export function resetRateLimit(ip: string, type: RateLimitType): void {
  if (rateLimitStore[ip]?.[type]) {
    delete rateLimitStore[ip][type];
    if (Object.keys(rateLimitStore[ip]).length === 0) {
      delete rateLimitStore[ip];
    }
  }
}

/**
 * Get current rate limit status for an IP
 * Useful for displaying remaining attempts to the user
 */
export function getRateLimitStatus(
  ip: string,
  type: RateLimitType,
): { remaining: number; resetTime: number | null } {
  const config = RATE_LIMITS[type];
  const entry = rateLimitStore[ip]?.[type];

  if (!entry || entry.resetTime <= Date.now()) {
    return {
      remaining: config.maxAttempts,
      resetTime: null,
    };
  }

  return {
    remaining: Math.max(0, config.maxAttempts - entry.attempts),
    resetTime: entry.resetTime,
  };
}

// Schedule cleanup every 5 minutes to prevent memory leaks
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupExpiredEntries, 5 * 60 * 1000);
}
