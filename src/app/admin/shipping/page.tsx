/**
 * Admin Shipping Page
 * Zone management with DataTable
 */
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, Clock, Edit, Euro, Globe, Loader2, MapPin, Package, Plus, Trash2, Truck } from 'lucide-react';
import type { BulkAction, Column } from '@/components/ui/DataTable';
import { DataTable } from '@/components/ui/DataTable';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { BulkDeleteModal } from '@/components/ui/BulkDeleteModal';

interface ShippingZone extends Record<string, unknown> {
  id: string;
  nombre: string;
  pais: string;
  regiones: string[];
  regionesTexto: string;
  prefijosCP: string[];
  prefijosCPTexto: string;
  costoBase: number;
  costoBaseTexto: string;
  envioGratisDesde: number | null;
  envioGratisDesdeTexto: string | null;
  diasEstimadosMin: number;
  diasEstimadosMax: number;
  diasEstimadosTexto: string;
  activo: boolean;
  estado: string;
  orden: number;
  creadoEn: string;
  actualizadoEn: string;
}

export default function AdminShippingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [zones, setZones] = useState<ShippingZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [zoneToDelete, setZoneToDelete] = useState<ShippingZone | null>(null);
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);
  const [bulkDeleteIds, setBulkDeleteIds] = useState<string[]>([]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/admin/shipping');
      return;
    }

    if (status === 'authenticated') {
      const user = session?.user as { role?: string } | undefined;
      if (user?.role !== 'ADMIN') {
        router.push('/');
        return;
      }
      loadZones();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session, router]);

  const loadZones = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/shipping');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error cargando zonas de envío');
      }

      setZones(data.zones || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (zone: ShippingZone) => {
    setZoneToDelete(zone);
    setModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!zoneToDelete) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/shipping/${zoneToDelete.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        setZones(zones.filter(z => z.id !== zoneToDelete.id));
      } else {
        throw new Error(data.error || 'Error eliminando zona de envío');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error eliminando zona de envío');
    } finally {
      setModalOpen(false);
      setZoneToDelete(null);
    }
  };

  const handleBulkDelete = (selectedIds: string[]) => {
    setBulkDeleteIds(selectedIds);
    setBulkDeleteModalOpen(true);
  };

  const confirmBulkDelete = async () => {
    try {
      let hasError = false;

      await Promise.all(
        bulkDeleteIds.map(async id => {
          const response = await fetch(`/api/admin/shipping/${id}`, {
            method: 'DELETE',
          });
          if (!response.ok) {
            hasError = true;
          }
        }),
      );

      if (hasError) {
        setError('Algunas zonas de envío no pudieron ser eliminadas');
      }

      setZones(zones.filter(z => !bulkDeleteIds.includes(z.id)));
    } catch {
      setError('Error eliminando zonas de envío');
    } finally {
      setBulkDeleteModalOpen(false);
      setBulkDeleteIds([]);
    }
  };

  // Estadísticas
  const activeZones = zones.filter(z => z.activo).length;
  const averageCost = zones.length > 0 ? zones.reduce((sum, z) => sum + z.costoBase, 0) / zones.length : 0;
  const zonesWithFreeShipping = zones.filter(z => z.envioGratisDesde !== null).length;

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'Activo':
        return 'bg-green-100 text-green-800';
      case 'Inactivo':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const columns: Column<ShippingZone>[] = [
    {
      key: 'nombre',
      header: 'Zona',
      sortable: true,
      className: '',
      render: value => (
        <div className="flex items-center gap-2 min-w-0">
          <MapPin className="h-4 w-4 text-indigo-600 flex-shrink-0" />
          <span className="font-medium text-gray-900 truncate">{value as string}</span>
        </div>
      ),
    },
    {
      key: 'pais',
      header: 'País',
      sortable: true,
      className: 'hidden sm:table-cell',
      render: value => (
        <div className="flex items-center gap-1">
          <Globe className="h-3 w-3 text-gray-400 flex-shrink-0" />
          <span className="text-sm text-gray-600">{value as string}</span>
        </div>
      ),
    },
    {
      key: 'regionesTexto',
      header: 'Regiones',
      sortable: true,
      className: 'hidden md:table-cell',
      render: value => <span className="text-sm text-gray-600 truncate max-w-[150px] block">{value as string}</span>,
    },
    {
      key: 'costoBase',
      header: 'Costo',
      sortable: true,
      className: 'hidden lg:table-cell',
      render: (_, zone) => (
        <div className="flex items-center gap-1">
          <Euro className="h-3 w-3 text-gray-400 flex-shrink-0" />
          <span className="font-medium text-gray-900">{zone.costoBaseTexto}</span>
        </div>
      ),
    },
    {
      key: 'envioGratisDesde',
      header: 'Envío Gratis',
      sortable: true,
      className: 'hidden xl:table-cell',
      render: value =>
        value ? (
          <span className="text-sm text-green-600 font-medium">{value as string}€</span>
        ) : (
          <span className="text-sm text-gray-400">-</span>
        ),
    },
    {
      key: 'diasEstimadosTexto',
      header: 'Entrega',
      sortable: true,
      className: 'hidden lg:table-cell',
      render: value => (
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3 text-gray-400 flex-shrink-0" />
          <span className="text-sm text-gray-600">{value as string}</span>
        </div>
      ),
    },
    {
      key: 'estado',
      header: 'Estado',
      sortable: true,
      className: 'hidden md:table-cell',
      render: value => (
        <span
          className={`px-2 py-0.5 inline-flex text-[10px] leading-4 font-semibold rounded-full ${getStatusColor(value as string)}`}
        >
          {value as string}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Acciones',
      className: '',
      render: (_, zone) => (
        <div className="flex items-center gap-1">
          <Link
            href={`/admin/shipping/${zone.id}`}
            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            title="Editar"
          >
            <Edit className="h-4 w-4" />
          </Link>
          <button
            onClick={e => {
              e.stopPropagation();
              handleDelete(zone);
            }}
            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Eliminar"
          >
            <Trash2 className="h-4 w-4" />
          </button>
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
      onClick: handleBulkDelete,
    },
  ];

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando zonas de envío...</p>
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
              <Truck className="h-8 w-8 text-indigo-600" />
              <h1 className="text-2xl font-bold text-gray-900">Configuración de Envío</h1>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/admin/dashboard" className="text-indigo-600 hover:text-indigo-800 font-medium">
                ← Volver al Panel
              </Link>
              <Link
                href="/admin/shipping/new"
                className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
              >
                <Plus className="h-5 w-5" />
                Nueva Zona
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-[1920px] 3xl:max-w-[2200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumbs */}
        <nav className="flex mb-6" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2">
            <li>
              <Link href="/admin/dashboard" className="text-gray-500 hover:text-gray-700">
                Panel
              </Link>
            </li>
            <li className="text-gray-400">/</li>
            <li>
              <span className="text-gray-900 font-medium">Envío</span>
            </li>
          </ol>
        </nav>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Truck className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Zonas</p>
                <p className="text-2xl font-bold text-gray-900">{zones.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Package className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Activas</p>
                <p className="text-2xl font-bold text-green-600">{activeZones}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Euro className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Costo Promedio</p>
                <p className="text-2xl font-bold text-blue-600">{averageCost.toFixed(2)}€</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <MapPin className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Con Envío Gratis</p>
                <p className="text-2xl font-bold text-purple-600">{zonesWithFreeShipping}</p>
              </div>
            </div>
          </div>
        </div>

        {/* DataTable */}
        <DataTable
          data={zones}
          columns={columns}
          rowKey="id"
          searchable={true}
          searchKeys={['nombre', 'pais', 'regionesTexto']}
          searchPlaceholder="Buscar zonas..."
          pagination={true}
          pageSizeOptions={[10, 25, 50, 100]}
          defaultPageSize={25}
          selectable={true}
          bulkActions={bulkActions}
          exportable={true}
          exportFilename="zonas-envio.csv"
          loading={loading}
          emptyMessage="No se encontraron zonas de envío"
          noResultsMessage="Ninguna zona coincide con tu búsqueda"
          onRowClick={zone => router.push(`/admin/shipping/${zone.id}`)}
        />
      </div>

      <ConfirmModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setZoneToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="¿Eliminar Zona de Envío?"
        description="Esta acción no se puede deshacer. La zona de envío será eliminada permanentemente."
        confirmText="Eliminar"
        type="danger"
      />

      <BulkDeleteModal
        isOpen={bulkDeleteModalOpen}
        onClose={() => {
          setBulkDeleteModalOpen(false);
          setBulkDeleteIds([]);
        }}
        onConfirm={confirmBulkDelete}
        itemType="shipping"
        itemName="zona de envío"
        itemNamePlural="zonas de envío"
        selectedCount={bulkDeleteIds.length}
        hasAssociatedItems={false}
      />
    </div>
  );
}
