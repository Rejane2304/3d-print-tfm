/**
 * Dashboard de Administración
 * Solo accesible para usuarios ADMIN
 * Layout responsive
 */
'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

export default function AdminDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;

    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/admin/dashboard');
      return;
    }

    // Verificar si es admin
    const user = session?.user as { rol?: string } | undefined;
    if (user?.rol !== 'ADMIN') {
      router.push('/');
      return;
    }

    setIsAuthorized(true);
  }, [status, session, router]);

  if (status === 'loading' || !isAuthorized) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Verificando acceso...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header Admin */}
      <header className="bg-gray-900 text-white shadow">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Panel de Administración</h1>
            
            <div className="flex items-center space-x-4">
              <span className="text-gray-300">{session?.user?.name}</span>
              <Link
                href="/"
                className="text-sm text-gray-300 hover:text-white transition-colors"
              >
                Ver tienda
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Tarjetas de resumen */}
          <Link href="/admin/productos"
            className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Productos</h3>
                <p className="text-sm text-gray-500">Gestionar catálogo</p>
              </div>
            </div>
          </Link>

          <Link href="/admin/pedidos"
            className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Pedidos</h3>
                <p className="text-sm text-gray-500">Gestionar pedidos</p>
              </div>
            </div>
          </Link>

          <Link href="/admin/clientes"
            className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Clientes</h3>
                <p className="text-sm text-gray-500">Gestionar usuarios</p>
              </div>
            </div>
          </Link>

          <Link href="/admin/inventario"
            className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Inventario</h3>
                <p className="text-sm text-gray-500">Control de stock</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Sección de bienvenida */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Bienvenido al Panel de Administración</h2>
          
          <p className="text-gray-600 mb-4">
            Desde aquí puedes gestionar todos los aspectos de tu tienda de impresión 3D:
          </p>
          
          <ul className="list-disc list-inside text-gray-600 space-y-2">
            <li>Gestionar el catálogo de productos</li>
            <li>Ver y actualizar el estado de los pedidos</li>
            <li>Controlar el inventario y stock</li>
            <li>Gestionar clientes y usuarios</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
