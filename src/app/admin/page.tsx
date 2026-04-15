import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  // Si no hay sesión, redirigir a login
  if (!session?.user) {
    redirect('/auth?callbackUrl=/admin/dashboard');
    return;
  }

  // Si hay sesión pero no es admin, redirigir a home
  if (session.user.role !== 'ADMIN') {
    redirect('/');
    return;
  }

  // Si es admin, redirigir al dashboard
  redirect('/admin/dashboard');
}
