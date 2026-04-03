/**
 * Configuración de NextAuth
 * Archivo separado para evitar problemas de importación en Route Handlers
 */
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcrypt';
import { prisma } from '@/lib/db/prisma';

import type { AuthOptions } from 'next-auth';

export const authOptions: AuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: '/auth',
    error: '/auth',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Contraseña', type: 'password' },
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

          const isValid = await bcrypt.compare(credentials.password, user.password);
          if (!isValid) {
            return null;
          }

          await prisma.user.update({
            where: { id: user.id },
            data: { lastAccess: new Date() },
          });

          // Devolvemos un objeto que coincide con el tipo User esperado
          // El campo 'role' se maneja a través del token JWT
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: null,
          };
        } catch (error) {
          console.error('Error en authorize:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }: { token: any; user: any }) {
      if (user) {
        token.id = user.id;
        // Obtener el rol desde la base de datos
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { role: true },
        });
        if (dbUser) {
          token.role = dbUser.role;
        }
      }
      return token;
    },
    async session({ session, token }: { session: any; token: any }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        if (token.role) {
          session.user.role = token.role;
        }
      }
      return session;
    },
  },
};
