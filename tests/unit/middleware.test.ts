/**
 * Unit tests for middleware redirect logic
 */
import { describe, test, expect, vi, beforeEach } from 'vitest';
import type { NextRequest } from 'next/server';

// Mock NextResponse
const mockRedirect = vi.fn();
const mockNext = vi.fn();

vi.mock('next/server', () => ({
  NextResponse: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    redirect: (...args: any[]) => mockRedirect(...args),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    next: (...args: any[]) => mockNext(...args),
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
    } as unknown as NextRequest;

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
    } as unknown as NextRequest;

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
    } as unknown as NextRequest;

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
    } as unknown as NextRequest;

    await middleware(request);

    expect(mockRedirect).toHaveBeenCalled();
    const callArg = mockRedirect.mock.calls[0][0];
    expect(callArg.toString()).toContain('tab=register');
    expect(callArg.toString()).toContain('callbackUrl=%2Fcheckout');
  });
});
