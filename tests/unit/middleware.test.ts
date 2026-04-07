/**
 * Unit tests for middleware redirect logic
 */
import { describe, test, expect, vi, beforeEach } from 'vitest';

// Mock NextResponse
const mockRedirect = vi.fn();
const mockNext = vi.fn();

vi.mock('next/server', () => ({
  NextResponse: {
    redirect: (...args: unknown[]) => mockRedirect(...args),
    next: (...args: unknown[]) => mockNext(...args),
  },
}));

vi.mock('next-auth/jwt', () => ({
  getToken: vi.fn().mockResolvedValue(null),
}));

describe('Middleware Redirects', () => {
  beforeEach(() => {
    mockRedirect.mockClear();
    mockNext.mockClear();
  });

  test('should redirect /login to /auth', async () => {
    const { middleware } = await import('@/middleware');

    const request = {
      nextUrl: {
        pathname: '/login',
        search: '',
        searchParams: new URLSearchParams(),
      },
      url: 'http://localhost:3000/login',
    } as unknown as import('next/server').NextRequest;

    await middleware(request);

    expect(mockRedirect).toHaveBeenCalled();
    const callArg = mockRedirect.mock.calls[0][0];
    expect(callArg.toString()).toBe('http://localhost:3000/auth');
  });

  test('should redirect /register to /auth?tab=register', async () => {
    const { middleware } = await import('@/middleware');

    const request = {
      nextUrl: {
        pathname: '/register',
        search: '',
        searchParams: new URLSearchParams(),
      },
      url: 'http://localhost:3000/register',
    } as unknown as import('next/server').NextRequest;

    await middleware(request);

    expect(mockRedirect).toHaveBeenCalled();
    const callArg = mockRedirect.mock.calls[0][0];
    expect(callArg.toString()).toBe('http://localhost:3000/auth?tab=register');
  });

  test('should preserve query params when redirecting /login', async () => {
    const { middleware } = await import('@/middleware');

    const request = {
      nextUrl: {
        pathname: '/login',
        search: '?callbackUrl=/checkout',
        searchParams: new URLSearchParams('callbackUrl=/checkout'),
      },
      url: 'http://localhost:3000/login?callbackUrl=/checkout',
    } as unknown as import('next/server').NextRequest;

    await middleware(request);

    expect(mockRedirect).toHaveBeenCalled();
    const callArg = mockRedirect.mock.calls[0][0];
    expect(callArg.toString()).toBe('http://localhost:3000/auth?callbackUrl=/checkout');
  });

  test('should preserve query params when redirecting /register', async () => {
    const { middleware } = await import('@/middleware');

    const request = {
      nextUrl: {
        pathname: '/register',
        search: '?callbackUrl=/checkout',
        searchParams: new URLSearchParams('callbackUrl=/checkout'),
      },
      url: 'http://localhost:3000/register?callbackUrl=/checkout',
    } as unknown as import('next/server').NextRequest;

    await middleware(request);

    expect(mockRedirect).toHaveBeenCalled();
    const callArg = mockRedirect.mock.calls[0][0];
    expect(callArg.toString()).toContain('tab=register');
    expect(callArg.toString()).toContain('callbackUrl=%2Fcheckout');
  });
});
