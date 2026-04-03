import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { Rol } from '@prisma/client';

export async function requireAuth() {
  const session = await getServerSession();
  
  if (!session) {
    redirect('/login');
  }
  
  return session;
}

export async function requireAdmin() {
  const session = await getServerSession();
  
  if (!session) {
    redirect('/login');
  }
  
  if ((session.user as { rol?: string }).role !== Rol.ADMIN) {
    redirect('/');
  }
  
  return session;
}

export async function requireClient() {
  const session = await getServerSession();
  
  if (!session) {
    redirect('/login');
  }
  
  if ((session.user as { rol?: string }).role === Rol.ADMIN) {
    redirect('/admin/dashboard');
  }
  
  return session;
}

export async function getSessionUser() {
  const session = await getServerSession();
  return session?.user;
}
