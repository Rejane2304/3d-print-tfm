/**
 * Página de Mis Direcciones - Redirección
 * Redirige a /account/addresses
 */
import { redirect } from 'next/navigation';

export default function DireccionesPage() {
  redirect('/account/addresses');
}
