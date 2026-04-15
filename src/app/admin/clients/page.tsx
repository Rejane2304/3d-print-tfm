/**
 * Admin Clients Page
 * List all customers with DataTable component
 */
'use client';

import { showConfirm } from '@/lib/dialogs';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { DollarSign, Eye, Loader2, ShoppingBag, Trash2, Upload, User } from 'lucide-react';
import type { BulkAction, Column } from '@/components/ui/DataTable';
import { DataTable } from '@/components/ui/DataTable';
import { CSVUpload } from '@/components/admin/CSVUpload';
import { useAdminRealTime, useNotificationToast } from '@/hooks/useRealTime';
import { Toaster } from '@/components/ui/Toaster';

interface Client {
  id: string;
  nombre: string;
  email: string;
  telefono: string | null;
  activo: boolean;
  creadoEn: string;
  ultimoAcceso: string | null;
  totalPedidos: number;
  totalGastado: string;
  fechaUltimoPedido: string | null;
}

// Sample CSV for clients
const clientsSampleCSV = `email,name,role,phone
"cliente1@email.com","Juan García","CUSTOMER","+34 123 456 789"
"cliente2@email.com","María López","CUSTOMER","+34 987 654 321"
"admin@email.com","Administrador","ADMIN","+34 111 222 333"`;

export default function AdminClientsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [showImport, setShowImport] = useState(false);

  // Real-time setup
  const { pendingEvents, acknowledgeEvents, isConnected } = useAdminRealTime();
  const { notifications, showNotification, removeNotification } = useNotificationToast();

  // Listen for real-time events
  useEffect(() => {
    if (pendingEvents.length > 0) {
      pendingEvents.forEach(event => {
        // Show notification for new users/clients
        if (event.type === 'client:created' || event.type === 'user:new') {
          showNotification(event);
          // Refresh clients data
          fetchClients();
        }
      });
      // Acknowledge events
      acknowledgeEvents(pendingEvents.map(e => e.timestamp));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingEvents]);

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

    if (status === 'authenticated') {
      fetchClients();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session, router, statusFilter]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        status: statusFilter,
      });

      const response = await fetch(`/api/admin/clients?${params}`);
      const data = await response.json();

      if (data.success) {
        setClients(data.clients);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClients = async (selectedIds: string[]) => {
    if (!showConfirm(`¿Estás seguro de que deseas eliminar ${selectedIds.length} cliente(s)?`)) {
      return;
    }

    try {
      await Promise.all(selectedIds.map(id => fetch(`/api/admin/clients/${id}`, { method: 'DELETE' })));
      await fetchClients();
    } catch (error) {
      console.error('Error al eliminar clientes:', error);
    }
  };

  const handleImportSuccess = () => {
    fetchClients();
    setShowImport(false);
  };

  const formatDate = (date: string | null) => {
    if (!date) {
      return 'N/A';
    }
    return new Date(date).toLocaleDateString('es-ES');
  };

  const formatCurrency = (amount: string) => {
    return `$${Number.parseFloat(amount).toFixed(2)}`;
  };

  const columns: Column<Client>[] = [
    {
      key: 'nombre',
      header: 'Nombre',
      sortable: true,
      className: '',
      render: (_, row) => (
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
            <User className="h-5 w-5 text-indigo-600" />
          </div>
          <div className="ml-4 min-w-0">
            <div className="text-sm font-medium text-gray-900 truncate">{row.nombre}</div>
            <div className="text-sm text-gray-500 hidden sm:block">{row.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      sortable: true,
      className: 'hidden sm:table-cell',
      render: value => <span className="text-sm text-gray-600 truncate">{value as string}</span>,
    },
    {
      key: 'totalPedidos',
      header: 'Pedidos',
      sortable: true,
      className: 'hidden md:table-cell',
      render: (value: unknown) => (
        <div className="flex items-center text-sm text-gray-900">
          <ShoppingBag className="h-4 w-4 mr-1 text-indigo-500" />
          {value as number}
        </div>
      ),
    },
    {
      key: 'totalGastado',
      header: 'Total',
      sortable: true,
      className: 'hidden lg:table-cell',
      render: value => (
        <div className="flex items-center text-sm font-medium text-gray-900">
          <DollarSign className="h-4 w-4 mr-1 text-green-500" />
          {formatCurrency(value as string)}
        </div>
      ),
    },
    {
      key: 'fechaUltimoPedido',
      header: 'Último',
      sortable: true,
      className: 'hidden xl:table-cell',
      render: value => <span className="text-sm text-gray-500">{formatDate(value as string)}</span>,
    },
    {
      key: 'actions',
      header: 'Acciones',
      className: '',
      render: (_, row) => (
        <div className="flex items-center gap-1">
          <Link
            href={`/admin/clients/${row.id}`}
            className="text-indigo-600 hover:text-indigo-900 p-1.5 rounded hover:bg-indigo-50 transition-colors"
            title="Ver detalles"
          >
            <Eye className="h-4 w-4" />
          </Link>
        </div>
      ),
    },
  ];

  const bulkActions: BulkAction[] = [
    {
      key: 'delete',
      label: 'Eliminar seleccionados',
      icon: <Trash2 className="h-4 w-4" />,
      variant: 'danger',
      onClick: handleDeleteClients,
    },
  ];

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando clientes...</p>
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
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Gestión de Clientes</h1>
              <p className="text-gray-600 mt-1 text-sm">Gestionar clientes registrados de la tienda</p>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/admin/dashboard" className="text-indigo-600 hover:text-indigo-800 font-medium">
                &larr; Volver al Panel
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-[1920px] 3xl:max-w-[2200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* CSV Import Section */}
        {showImport ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Importar Clientes desde CSV</h2>
              <button onClick={() => setShowImport(false)} className="text-gray-500 hover:text-gray-700 text-sm">
                Cerrar
              </button>
            </div>
            <CSVUpload
              title="Importar Clientes"
              description="Sube un archivo CSV con los datos de los clientes. Se generarán contraseñas temporales automáticamente."
              requiredColumns={['email', 'name']}
              optionalColumns={['role', 'phone']}
              apiEndpoint="/api/admin/clients/import"
              sampleCSV={clientsSampleCSV}
              onSuccess={handleImportSuccess}
              options={{ skipDuplicates: true }}
            />
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">Todos los estados</option>
                <option value="active">Activo</option>
                <option value="inactive">Inactivo</option>
              </select>
              <button
                onClick={() => setShowImport(true)}
                className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
              >
                <Upload className="h-4 w-4" />
                Importar CSV
              </button>
            </div>
          </div>
        )}

        {/* Clients DataTable */}
        <DataTable<Client>
          data={clients}
          columns={columns}
          rowKey="id"
          searchable
          searchKeys={['nombre', 'email', 'telefono']}
          searchPlaceholder="Buscar por nombre o email..."
          pagination
          selectable
          bulkActions={bulkActions}
          exportable
          exportFilename="clients.csv"
          emptyMessage="No se encontraron clientes"
          noResultsMessage="Ningún cliente coincide con tu búsqueda"
        />
      </div>
      {/* Real-time Notifications */}
      <Toaster notifications={notifications} onDismiss={removeNotification} />
      {isConnected && (
        <div className="fixed bottom-4 left-4 z-50">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-800 text-xs rounded-full">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            Tiempo real conectado
          </div>
        </div>
      )}
    </div>
  );
}
