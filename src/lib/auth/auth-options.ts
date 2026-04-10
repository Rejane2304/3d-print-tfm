/**
 * NextAuth Configuration
 * Separate file to avoid import issues in Route Handlers
 */
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/db/prisma";

import type { AuthOptions } from "next-auth";

// Account lockout configuration
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 30;

/**
 * Check if account is locked and return remaining minutes
 * Returns 0 if not locked
 */
function getRemainingLockoutMinutes(lockedUntil: Date | null): number {
  if (!lockedUntil) return 0;
  const now = new Date();
  if (lockedUntil <= now) return 0;
  return Math.ceil((lockedUntil.getTime() - now.getTime()) / (1000 * 60));
}

/**
 * Generate Spanish lockout error message
 */
function getLockoutErrorMessage(remainingMinutes: number): string {
  return `Cuenta bloqueada temporalmente. Intenta de nuevo en ${remainingMinutes} minutos.`;
}

export const authOptions: AuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: "/auth",
    error: "/auth",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email.toLowerCase() },
          });

          if (!user || !user.isActive) {
            return null;
          }

          // Check if account is locked
          const remainingMinutes = getRemainingLockoutMinutes(user.lockedUntil);
          if (remainingMinutes > 0) {
            throw new Error(getLockoutErrorMessage(remainingMinutes));
          }

          // If lockedUntil is in the past, reset it
          if (user.lockedUntil) {
            await prisma.user.update({
              where: { id: user.id },
              data: {
                failedAttempts: 0,
                lockedUntil: null,
              },
            });
          }

          const isValid = await bcrypt.compare(
            credentials.password,
            user.password,
          );
          if (!isValid) {
            // Increment failed attempts
            const newFailedAttempts = user.failedAttempts + 1;
            const remainingAttempts = MAX_FAILED_ATTEMPTS - newFailedAttempts;

            // Prepare update data
            const updateData: {
              failedAttempts: number;
              lockedUntil?: Date | null;
            } = {
              failedAttempts: newFailedAttempts,
            };

            // Lock account if max attempts reached
            if (newFailedAttempts >= MAX_FAILED_ATTEMPTS) {
              const lockedUntil = new Date();
              lockedUntil.setMinutes(
                lockedUntil.getMinutes() + LOCKOUT_DURATION_MINUTES,
              );
              updateData.lockedUntil = lockedUntil;
            }

            await prisma.user.update({
              where: { id: user.id },
              data: updateData,
            });

            // Return error message based on remaining attempts
            if (remainingAttempts <= 0) {
              throw new Error(getLockoutErrorMessage(LOCKOUT_DURATION_MINUTES));
            }

            // Return generic error for invalid credentials
            return null;
          }

          // Successful login - reset failed attempts and lockedUntil
          await prisma.user.update({
            where: { id: user.id },
            data: {
              failedAttempts: 0,
              lockedUntil: null,
              lastAccess: new Date(),
            },
          });

          // Return an object that matches the expected User type
          // The 'role' field is handled through the JWT token
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: null,
          };
        } catch (error) {
          console.error("Error in authorize:", error);
          // Re-throw lockout errors to be handled by NextAuth
          if (
            error instanceof Error &&
            error.message.includes("Cuenta bloqueada")
          ) {
            throw error;
          }
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        // Get role from database
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { role: true },
        });
        if (dbUser) {
          token.rol = dbUser.role;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        if (token.rol) {
          session.user.rol = token.rol;
        }
      }
      return session;
    },
  },
};
