/**
 * Página de Mi Perfil - Redirección
 * Redirige a /account/profile
 */
import { redirect } from 'next/navigation';

export default function PerfilPage() {
  redirect('/account/profile');
}
