import type { DefaultSession } from 'next-auth';
import type { DefaultJWT } from 'next-auth/jwt';
import type { Role } from '@prisma/client';

declare module 'next-auth' {
  /**
   * Extension of User type to include custom properties
   * The role is optional at authorization time but is added in the JWT callback
   */
  interface User {
    id: string;
    role?: Role;
  }

  interface Session extends DefaultSession {
    user: {
      id: string;
      role: Role;
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id?: string;
    role?: Role;
  }
}
