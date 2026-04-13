/**
 * SessionProvider for NextAuth
 */
'use client';

import { SessionProvider as Provider } from 'next-auth/react';
import type { ReactNode } from 'react';

export function SessionProvider({ children }: Readonly<{ children: ReactNode }>) {
  return <Provider>{children}</Provider>;
}
