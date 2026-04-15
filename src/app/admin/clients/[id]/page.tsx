/**
 * Admin Client Detail Page
 * Show detailed information about a specific client
 */
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  Loader2,
  Mail,
  MapPin,
  Package,
  Phone,
  ShoppingBag,
  User,
} from 'lucide-react';
import { translateAddressName } from '@/lib/i18n';

interface ClientDetail {
  id: string;
  nombre: string;
  email: string;
  telefono: string | null;
  activo: boolean;
  creadoEn: string;
  ultimoAcceso: string | null;
  addresses: Address[];
  orders: Order[];
  estadisticas: {
    totalPedidos: number;
    totalGastado: string;
    pedidosCompletados: number;
    pedidosPendientes: number;
    valorPromedio: string;
  };
}

interface Address {
  id: string;
  name: string;
  recipient: string;
  phone: string;
  address: string;
  postalCode: string;
  city: string;
  province: string;
  isDefault: boolean;
}

interface Order {
  id: string;
  numeroPedido: string;
  estado: string;
  total: number;
  createdAt: string;
  itemCount: number;
  pagoEstado: string;
  pagoMetodo: string;
}

export default function AdminClientDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const [client, setClient] = useState<ClientDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth?callbackUrl=/admin/clients');
      return;
    }

    const user = session?.user as { role?: string } | undefined;
    if (status === 'authenticated' && user?.role !== 'ADMIN') {
      router.push('/');
      return;
    }

    if (status === 'authenticated' && params.id) {
      fetchClientDetail();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session, router, params.id]);

  const fetchClientDetail = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/clients/${params.id}`);
      const data = await response.json();

      if (data.success) {
        setClient(data.client);
      } else {
        router.push('/admin/clients');
      }
    } catch (error) {
      console.error('Error fetching client:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) {
      return 'N/A';
    }
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number | string) => {
    return `${Number.parseFloat(amount.toString()).toFixed(2)} €`;
  };

  const getStatusBadge = (estado: string) => {
    const statusMap: Record<string, string> = {
      Pendiente: 'bg-yellow-100 text-yellow-800',
      Confirmado: 'bg-blue-100 text-blue-800',
      'En preparación': 'bg-purple-100 text-purple-800',
      Enviado: 'bg-indigo-100 text-indigo-800',
      Entregado: 'bg-green-100 text-green-800',
      Cancelado: 'bg-red-100 text-red-800',
    };
    return statusMap[estado] || 'bg-gray-100 text-gray-800';
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando información del cliente...</p>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Cliente no encontrado</p>
          <Link href="/admin/clients" className="text-indigo-600 hover:text-indigo-900 mt-4 inline-block">
            Volver al listado
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-[1920px] 3xl:max-w-[2200px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/admin/clients" className="text-gray-500 hover:text-gray-700">
                <ArrowLeft className="h-6 w-6" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{client.nombre}</h1>
                <p className="text-sm text-gray-500">Detalle del cliente</p>
              </div>
            </div>
            <Link href="/admin/dashboard" className="text-indigo-600 hover:text-indigo-800 font-medium">
              ← Volver al Panel
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-[1920px] 3xl:max-w-[2200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Client Info Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-6">
              <div className="h-16 w-16 rounded-full bg-indigo-100 flex items-center justify-center">
                <User className="h-8 w-8 text-indigo-600" />
              </div>
              <div className="ml-4">
                <h2 className="text-xl font-semibold text-gray-900">{client.nombre}</h2>
                <span
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    client.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}
                >
                  {client.activo ? 'Activo' : 'Inactivo'}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center text-gray-600">
                <Mail className="h-5 w-5 mr-3 text-gray-400" />
                <span>{client.email}</span>
              </div>
              <div className="flex items-center text-gray-600">
                <Phone className="h-5 w-5 mr-3 text-gray-400" />
                <span>{client.telefono || 'N/A'}</span>
              </div>
              <div className="flex items-center text-gray-600">
                <Calendar className="h-5 w-5 mr-3 text-gray-400" />
                <span>Registrado: {formatDate(client.creadoEn)}</span>
              </div>
              <div className="flex items-center text-gray-600">
                <Calendar className="h-5 w-5 mr-3 text-gray-400" />
                <span>Último acceso: {formatDate(client.ultimoAcceso)}</span>
              </div>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="lg:col-span-2 grid grid-cols-2 gap-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <ShoppingBag className="h-8 w-8 text-indigo-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Pedidos</p>
                  <p className="text-2xl font-bold text-gray-900">{client.estadisticas?.totalPedidos ?? 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-green-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Gastado</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(client.estadisticas?.totalGastado ?? 0)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <Package className="h-8 w-8 text-blue-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Completados</p>
                  <p className="text-2xl font-bold text-gray-900">{client.estadisticas?.pedidosCompletados ?? 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-purple-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Ticket Medio</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(client.estadisticas?.valorPromedio ?? 0)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Addresses Section */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <MapPin className="h-5 w-5 mr-2 text-indigo-500" />
            Direcciones ({client.addresses.length})
          </h3>

          {client.addresses.length === 0 ? (
            <p className="text-gray-500">No hay direcciones registradas</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {client.addresses.map(address => (
                <div key={address.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-medium text-gray-900">{translateAddressName(address.name)}</span>
                    {address.isDefault && (
                      <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-full">Principal</span>
                    )}
                  </div>
                  <p className="text-gray-600">{address.recipient}</p>
                  <p className="text-gray-600">{address.address}</p>
                  <p className="text-gray-600">
                    {address.postalCode} {address.city}, {address.province}
                  </p>
                  <p className="text-gray-600">Teléfono: {address.phone}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Orders Section */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <h3 className="text-lg font-semibold text-gray-900 p-6 pb-4 flex items-center">
            <ShoppingBag className="h-5 w-5 mr-2 text-indigo-500" />
            Últimos Pedidos ({client.orders.length})
          </h3>

          {client.orders.length === 0 ? (
            <div className="p-6 text-center text-gray-500">No hay pedidos registrados</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pedido
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {client.orders.map(order => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{order.numeroPedido}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(order.createdAt)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.itemCount} items</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(order.total)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={
                          'inline-flex px-2 py-1 text-xs font-semibold rounded-full ' + getStatusBadge(order.estado)
                        }
                      >
                        {order.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link href={`/admin/orders/${order.id}`} className="text-indigo-600 hover:text-indigo-900">
                        Ver pedido
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
